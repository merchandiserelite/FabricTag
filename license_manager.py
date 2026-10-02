"""
TexFlow & FabricTag - Uzaktan Lisans ve Cihaz Yetkilendirme Yöneticisi
Geliştirici Kontrolü: Bu dosya GitHub üzerindeki lisans dosyasını sorgular.
İstenildiği an GitHub üzerinden cihaz veya tüm sistem yetkisi uzaktan kapatılabilir.
"""

import os
import json
import time
import uuid
import platform
import urllib.request
import urllib.error
import threading

REMOTE_LICENSE_URL = "https://raw.githubusercontent.com/merchandiserelite/FabricTag/main/license_control.json"
CACHE_FILE = os.path.join(os.path.dirname(__file__), "data", ".license_cache.json")
CHECK_INTERVAL_SECONDS = 300  # 5 dakikada bir arka planda kontrol et

_cached_status = {
    "is_valid": True,
    "is_developer": False,
    "status": "ACTIVE",
    "message": "Lisans Aktif",
    "last_checked": 0,
    "device_id": None
}
_lock = threading.Lock()


def get_device_info():
    """Mevcut cihazın benzersiz kimlik bilgilerini üretir."""
    hostname = platform.node()
    try:
        raw_mac = uuid.getnode()
        mac = ':'.join(['{:02x}'.format((raw_mac >> ele) & 0xff) for ele in range(0, 8*6, 8)][::-1])
    except Exception:
        mac = "unknown-mac"
    return {
        "hostname": hostname,
        "mac": mac,
        "device_id": f"{hostname}_{mac}"
    }


def _verify_license_payload(payload: dict, dev_info: dict) -> dict:
    """GitHub'dan gelen lisans verisine göre cihaz yetkisini hesaplar."""
    hostname = dev_info["hostname"]
    mac = dev_info["mac"]
    dev_id = dev_info["device_id"]
    
    developer_devices = payload.get("developer_devices", [])
    blocked_devices = payload.get("blocked_devices", [])
    allowed_devices = payload.get("allowed_devices", ["*"])
    system_status = payload.get("system_status", "ACTIVE")
    lock_message = payload.get("lock_message", "Sistem lisansı sona ermiştir. Lütfen sistem yöneticisiyle iletişime geçiniz.")
    
    # 1. Geliştirici Cihazı Kontrolü (Her zaman tam yetkili, asla kilitlenemez)
    for dev in developer_devices:
        if dev in (hostname, mac, dev_id) or (dev.lower() == "developer" and "dev" in hostname.lower()):
            return {
                "is_valid": True,
                "is_developer": True,
                "status": "ACTIVE",
                "message": "Geliştirici Cihazı - Sınırsız Erişim",
                "device_id": dev_id
            }
            
    # 2. Engellenen Cihazlar Kontrolü (Bu bilgisayar kara listeye alındı mı?)
    for blk in blocked_devices:
        if blk in (hostname, mac, dev_id):
            return {
                "is_valid": False,
                "is_developer": False,
                "status": "BLOCKED_DEVICE",
                "message": f"Bu cihazın erişim yetkisi iptal edilmiştir ({hostname}).",
                "device_id": dev_id
            }
            
    # 3. Genel Sistem Durumu Kontrolü (Sistem tamamen kilitlendi mi?)
    if system_status != "ACTIVE":
        return {
            "is_valid": False,
            "is_developer": False,
            "status": system_status,
            "message": lock_message,
            "device_id": dev_id
        }
        
    # 4. İzinli Cihazlar Listesi Kontrolü
    if "*" not in allowed_devices:
        match_found = False
        for allow in allowed_devices:
            if allow in (hostname, mac, dev_id):
                match_found = True
                break
        if not match_found:
            return {
                "is_valid": False,
                "is_developer": False,
                "status": "UNAUTHORIZED_DEVICE",
                "message": "Bu cihaz için tanımlı lisans bulunamadı.",
                "device_id": dev_id
            }
            
    return {
        "is_valid": True,
        "is_developer": False,
        "status": "ACTIVE",
        "message": "Lisans Aktif",
        "device_id": dev_id
    }


def check_license(force_remote: bool = False) -> dict:
    """Lisans durumunu kontrol eder (önce hafıza, sonra GitHub, son çare yerel önbellek)."""
    global _cached_status
    now = time.time()
    dev_info = get_device_info()
    
    with _lock:
        if not force_remote and (now - _cached_status.get("last_checked", 0) < CHECK_INTERVAL_SECONDS):
            return _cached_status

    # GitHub'dan uzaktan kontrol et
    try:
        req = urllib.request.Request(
            REMOTE_LICENSE_URL,
            headers={"User-Agent": "TexFlow-License-Client/1.0", "Cache-Control": "no-cache"}
        )
        with urllib.request.urlopen(req, timeout=4) as response:
            if response.status == 200:
                payload = json.loads(response.read().decode("utf-8"))
                result = _verify_license_payload(payload, dev_info)
                result["last_checked"] = now
                
                # Yerel önbelleğe kaydet
                try:
                    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
                    with open(CACHE_FILE, "w", encoding="utf-8") as f:
                        json.dump({"payload": payload, "cached_at": now}, f)
                except Exception:
                    pass
                    
                with _lock:
                    _cached_status = result
                return result
    except Exception as e:
        # İnternet yoksa veya GitHub'a ulaşılamazsa yerel önbelleğe bak
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    cache_data = json.load(f)
                    payload = cache_data.get("payload", {})
                    cached_at = cache_data.get("cached_at", 0)
                    
                    # 7 günlük çevrimdışı tolerans
                    if now - cached_at < 7 * 86400:
                        result = _verify_license_payload(payload, dev_info)
                        result["last_checked"] = now
                        with _lock:
                            _cached_status = result
                        return result
            except Exception:
                pass

    # Varsayılan: Eğer ilk açılışta internet yoksa ve önbellek yoksa güvenli modda çalışmaya devam et
    with _lock:
        _cached_status["last_checked"] = now
        _cached_status["device_id"] = dev_info["device_id"]
        return _cached_status


# Arka plan periyodik lisans kontrol thread'i
def start_background_license_checker():
    def _worker():
        while True:
            time.sleep(CHECK_INTERVAL_SECONDS)
            try:
                check_license(force_remote=True)
            except Exception:
                pass
    t = threading.Thread(target=_worker, daemon=True)
    t.start()
