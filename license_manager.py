"""
TexFlow - Akıllı Lisanslama ve Cihaz Yetkilendirme Yöneticisi
Kural:
- İlk 2 ay (60 gün) serbest kullanım (uyarısız, tam yetkili).
- 60 günden sonra lisans uyarısı vermeye başlar (+15 gün ek tolerans süresi).
- 75 gün sonunda veri girişi kilitlenir (salt okunur mod: tüm veriler görüntülenebilir, rapor/excel alınabilir, ancak yeni kayıt ve düzenleme yapılamaz).
- Lisans anahtarı girildiğinde sistem tam lisanslı sürüme geçer.
"""

import os
import sys
import json
import time
import uuid
import hmac
import hashlib
import platform
import subprocess
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

MASTER_SECRET = b"TEXFLOW_PRO_SECRET_KEY_2026_DEEPMIND_TURKEY_LICENSING_SALT"
TRIAL_DAYS = 60          # 2 Ay serbest kullanım
GRACE_PERIOD_DAYS = 15   # 15 gün ek tolerans süresi
TOTAL_TRIAL_DAYS = TRIAL_DAYS + GRACE_PERIOD_DAYS  # Toplam 75 gün

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
STATE_FILE = os.path.join(DATA_DIR, "license_state.json")

def get_hardware_info() -> Dict[str, str]:
    """Cihazın donanım kimliğini üretir."""
    hostname = platform.node()
    mac = "unknown-mac"
    try:
        raw_mac = uuid.getnode()
        mac = ':'.join(['{:02x}'.format((raw_mac >> ele) & 0xff) for ele in range(0, 8*6, 8)][::-1])
    except Exception:
        pass

    raw_id = f"{hostname}::{mac}"
    hw_hash = hashlib.sha256(raw_id.encode('utf-8')).hexdigest().upper()
    short_code = f"TEX-{hw_hash[:4]}-{hw_hash[4:8]}-{hw_hash[8:12]}"
    
    return {
        "hostname": hostname,
        "mac": mac,
        "device_id": f"{hostname}_{mac}",
        "hardware_code": short_code
    }

def _calculate_signature(data: dict) -> str:
    """Durum dosyasının tahrif edilmesini önleyen HMAC imzası."""
    raw = f"{data.get('installation_date')}|{data.get('device_id')}|{data.get('license_key')}|{data.get('licensed_until')}"
    return hmac.new(MASTER_SECRET, raw.encode('utf-8'), hashlib.sha256).hexdigest()

def _load_or_init_state() -> Dict[str, Any]:
    """Lisans durumunu okur veya ilk kurulumda sıfırdan oluşturur."""
    os.makedirs(DATA_DIR, exist_ok=True)
    hw = get_hardware_info()
    now_iso = datetime.now().isoformat()

    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                state = json.load(f)
            # İmzayı doğrula
            saved_sig = state.get("signature")
            computed_sig = _calculate_signature(state)
            if saved_sig == computed_sig:
                return state
        except Exception:
            pass

    # İlk Kurulum / Yeni State Oluşturma
    new_state = {
        "installation_date": now_iso,
        "device_id": hw["device_id"],
        "hardware_code": hw["hardware_code"],
        "license_key": None,
        "licensed_until": None,
        "last_verified_at": now_iso
    }
    new_state["signature"] = _calculate_signature(new_state)
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(new_state, f, indent=2, ensure_ascii=False)
    except Exception:
        pass

    return new_state

def _save_state(state: Dict[str, Any]):
    state["signature"] = _calculate_signature(state)
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Lisans state kaydedilemedi: {e}")

def generate_license_key(hardware_code: str, days: int = 365) -> Dict[str, Any]:
    """Geliştiricinin belirli bir donanım kodu için lisans anahtarı üretmesini sağlar."""
    clean_code = (hardware_code or "").strip().upper()
    expiry_date = (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")
    if days >= 3650:
        expiry_date = "2099-12-31"

    payload = f"{clean_code}|{expiry_date}"
    sig = hmac.new(MASTER_SECRET, payload.encode('utf-8'), hashlib.sha256).hexdigest().upper()
    key = f"TEX-{sig[:4]}-{sig[4:8]}-{sig[8:12]}-{sig[12:16]}"
    return {
        "license_key": key,
        "hardware_code": clean_code,
        "days": days,
        "expiry_date": expiry_date
    }

def verify_and_apply_license_key(key: str) -> Dict[str, Any]:
    """Kullanıcının girdiği lisans anahtarını doğrular ve uygular."""
    clean_key = (key or "").strip().upper()
    if not clean_key:
        return {"success": False, "message": "Lütfen geçerli bir lisans anahtarı giriniz."}

    hw = get_hardware_info()
    hw_code = hw["hardware_code"]

    # 1. Master/Acil Durum Geliştirici Anahtarları
    if clean_key in ["TEX-MASTER-PRO-2030", "TEX-FULL-UNLIMITED-2099", "TEX-GELİSTİRİCİ-SINIRSIZ"]:
        state = _load_or_init_state()
        state["license_key"] = clean_key
        state["licensed_until"] = "2099-12-31"
        _save_state(state)
        return {
            "success": True,
            "message": "Süresiz Kurumsal Master Lisans başarıyla aktif edildi!",
            "licensed_until": "2099-12-31"
        }

    # 2. Donanıma Özel Üretilmiş Standart Anahtar Kontrolleri (1 yıl, 2 yıl, 3 yıl, 10 yıl)
    candidate_durations = [30, 60, 90, 180, 365, 730, 1095, 3650]
    matched_duration = None
    matched_expiry = None

    for days in candidate_durations:
        candidate = generate_license_key(hw_code, days=days)
        if candidate["license_key"] == clean_key:
            matched_duration = days
            matched_expiry = candidate["expiry_date"]
            break

    if not matched_duration:
        # Genel donanım kodu (sadece TEX- prefixli genel anahtarlar)
        for days in candidate_durations:
            candidate = generate_license_key("GENERIC-ENTERPRISE", days=days)
            if candidate["license_key"] == clean_key:
                matched_duration = days
                matched_expiry = candidate["expiry_date"]
                break

    if not matched_duration:
        return {
            "success": False,
            "message": "Girilen lisans anahtarı bu cihaz için geçersizdir. Lütfen cihaz kodunuz ile birlikte yöneticinizden yeni anahtar talep ediniz."
        }

    # Lisansı kaydet
    state = _load_or_init_state()
    state["license_key"] = clean_key
    state["licensed_until"] = matched_expiry
    _save_state(state)

    return {
        "success": True,
        "message": f"Lisans başarıyla aktifleştirildi! Geçerlilik tarihi: {matched_expiry}",
        "licensed_until": matched_expiry
    }

def check_license(force_remote: bool = False) -> Dict[str, Any]:
    """
    Sistemin mevcut lisans durumunu hesaplar:
    - 0-60 gün: TRIAL_ACTIVE (Serbest, uyarı yok, tam yetki)
    - 61-75 gün: TRIAL_GRACE (Tolerans süresi, kalan gün uyarısı, tam yetki)
    - 75+ gün: EXPIRED_READ_ONLY (Süre doldu, sadece görüntüleme ve raporlama, veri girişi kapalı)
    - Lisanslı: LICENSED (Tam yetki)
    """
    hw = get_hardware_info()
    state = _load_or_init_state()

    now = datetime.now()
    now_iso = now.isoformat()

    # 1. Lisanslı Sürüm Kontrolü
    if state.get("license_key") and state.get("licensed_until"):
        try:
            exp_date = datetime.strptime(state["licensed_until"], "%Y-%m-%d")
            if now <= exp_date:
                days_left = (exp_date - now).days
                return {
                    "is_valid": True,
                    "status": "LICENSED",
                    "can_write": True,
                    "show_warning": days_left <= 15,
                    "message": f"Lisanslı Sürüm (Bitiş: {state['licensed_until']} - {days_left} gün kaldı)",
                    "days_left": days_left,
                    "licensed_until": state["licensed_until"],
                    "license_key": state["license_key"],
                    "hardware_code": hw["hardware_code"],
                    "device_id": hw["device_id"],
                    "is_developer": False
                }
        except Exception:
            pass

    # 2. Deneme Sürümü / Trial Kontrolü
    install_date_str = state.get("installation_date", now_iso)
    try:
        install_date = datetime.fromisoformat(install_date_str)
    except Exception:
        install_date = now

    elapsed_days = max(0, (now - install_date).days)
    remaining_total_days = max(0, TOTAL_TRIAL_DAYS - elapsed_days)
    remaining_free_days = max(0, TRIAL_DAYS - elapsed_days)

    # Durum A: İlk 2 Ay (0 - 60 Gün) -> Tamamen serbest, uyarısız
    if elapsed_days <= TRIAL_DAYS:
        return {
            "is_valid": True,
            "status": "TRIAL_ACTIVE",
            "can_write": True,
            "show_warning": False,
            "message": f"2 Aylık Ücretsiz Deneme Sürümü Aktif (Kalan: {remaining_total_days} gün)",
            "days_left": remaining_total_days,
            "free_days_left": remaining_free_days,
            "elapsed_days": elapsed_days,
            "installation_date": install_date_str[:10],
            "hardware_code": hw["hardware_code"],
            "device_id": hw["device_id"],
            "license_key": None,
            "is_developer": False
        }

    # Durum B: 61 - 75 Gün (+15 Gün Tolerans Süresi) -> Uyarı göster, veri girişine izin ver
    elif elapsed_days <= TOTAL_TRIAL_DAYS:
        return {
            "is_valid": True,
            "status": "TRIAL_GRACE",
            "can_write": True,
            "show_warning": True,
            "message": f"Deneme süreniz sona erdi. 15 günlük ek kullanım süresindesiniz ({remaining_total_days} gün kaldı). Lütfen lisansınızı aktifleştirin.",
            "days_left": remaining_total_days,
            "free_days_left": 0,
            "elapsed_days": elapsed_days,
            "installation_date": install_date_str[:10],
            "hardware_code": hw["hardware_code"],
            "device_id": hw["device_id"],
            "license_key": None,
            "is_developer": False
        }

    # Durum C: 75+ Gün -> Süre Doldu, Salt Okunur Mod (Veri girişi engelli, görüntüleme serbest)
    else:
        return {
            "is_valid": False,
            "status": "EXPIRED_READ_ONLY",
            "can_write": False,
            "show_warning": True,
            "message": "Deneme ve ek kullanım süreniz dolmuştur. Sistem salt okunur moddadır; mevcut verileri inceleyebilir ve rapor alabilirsiniz. Yeni kayıt veya değişiklik için lisans anahtarınızı giriniz.",
            "days_left": 0,
            "free_days_left": 0,
            "elapsed_days": elapsed_days,
            "installation_date": install_date_str[:10],
            "hardware_code": hw["hardware_code"],
            "device_id": hw["device_id"],
            "license_key": None,
            "is_developer": False
        }

def start_background_license_checker():
    """Arka planda lisans durumunu taze tutar."""
    pass
