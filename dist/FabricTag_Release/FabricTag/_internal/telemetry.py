"""
telemetry.py - Silent Heartbeat & Telegram Notification System for FabricTag
Notifies developer via Telegram Bot when app is launched or activated.
Runs completely non-blocking in background threads with silent error recovery.
"""

import os
import json
import socket
import logging
import threading
import urllib.request
import urllib.parse
from datetime import datetime

logger = logging.getLogger("telemetry")

# ==============================================================================
# TELEGRAM BOT CONFIGURATION
# ==============================================================================
# Developer can put their own Bot Token and Chat ID here:
TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"
TELEGRAM_CHAT_ID = "YOUR_CHAT_ID_HERE"

TELEMETRY_CACHE_FILE = os.path.join(
    os.getenv("APPDATA", os.path.expanduser("~")),
    "FabricTag",
    "telemetry.json"
)

def get_public_ip_and_location():
    """Gets approximate public IP and country/city for telemetry."""
    try:
        req = urllib.request.Request(
            "https://ipapi.co/json/",
            headers={"User-Agent": "FabricTag-Telemetry/1.0"}
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode())
            ip = data.get("ip", "Bilinmiyor")
            city = data.get("city", "")
            country = data.get("country_name", "")
            loc = f"{city}, {country}".strip(", ")
            return ip, loc or "Türkiye"
    except Exception:
        try:
            req = urllib.request.Request("https://api.ipify.org?format=json")
            with urllib.request.urlopen(req, timeout=2) as resp:
                data = json.loads(resp.read().decode())
                return data.get("ip", "Bilinmiyor"), "Bilinmiyor"
        except Exception:
            return "Bilinmiyor", "Bilinmiyor"

def send_telegram_message(text: str):
    """Sends a formatted message to the developer's Telegram bot."""
    if not TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN == "YOUR_BOT_TOKEN_HERE":
        logger.debug("Telegram Bot Token not configured yet. Skipping telemetry.")
        return False
    if not TELEGRAM_CHAT_ID or TELEGRAM_CHAT_ID == "YOUR_CHAT_ID_HERE":
        logger.debug("Telegram Chat ID not configured yet. Skipping telemetry.")
        return False

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "HTML"
    }

    try:
        data = urllib.parse.urlencode(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, method="POST")
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status == 200
    except Exception as e:
        logger.debug(f"Telegram telemetry send failed: {e}")
        return False

def _load_telemetry_cache():
    try:
        if os.path.exists(TELEMETRY_CACHE_FILE):
            with open(TELEMETRY_CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return {}

def _save_telemetry_cache(cache):
    try:
        os.makedirs(os.path.dirname(TELEMETRY_CACHE_FILE), exist_ok=True)
        with open(TELEMETRY_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f)
    except Exception:
        pass

def notify_startup_async(hw_id: str, lic_info: dict, app_version: str = "v4.3.0"):
    """Runs telemetry in background thread."""
    def _worker():
        try:
            cache = _load_telemetry_cache()
            is_first_run = not cache.get("first_run_logged", False)
            last_ping = cache.get("last_ping_timestamp", 0)
            now_ts = datetime.now().timestamp()

            # Only notify on:
            # 1. Very first run of application
            # 2. Or once every 24 hours per computer to prevent spam
            if not is_first_run and (now_ts - last_ping < 86400):
                return

            ip, location = get_public_ip_and_location()
            now_str = datetime.now().strftime("%d.%m.%Y %H:%M:%S")

            is_active = lic_info.get("is_active", False)
            plan = lic_info.get("plan", "FREE_TRIAL")
            saved_count = lic_info.get("saved_count", 0)

            if is_active:
                lic_badge = f"🟢 <b>LİSANSLI TİCARİ ({plan})</b>"
            else:
                lic_badge = f"🟡 <b>Ücretsiz Deneme ({saved_count}/20 Kayıt)</b>"

            title = "🎉 <b>YENİ KULLANICI İLK KURULUM!</b>" if is_first_run else "🚀 <b>FabricTag Program Açılışı</b>"

            msg = (
                f"{title}\n"
                f"━━━━━━━━━━━━━━━━━━━\n"
                f"💻 <b>Donanım ID:</b> <code>{hw_id}</code>\n"
                f"🛡️ <b>Lisans Durumu:</b> {lic_badge}\n"
                f"📍 <b>Konum / IP:</b> {location} (<code>{ip}</code>)\n"
                f"🏷️ <b>Sürüm:</b> {app_version}\n"
                f"⏱️ <b>Zaman:</b> {now_str}\n"
                f"━━━━━━━━━━━━━━━━━━━"
            )

            success = send_telegram_message(msg)
            if success:
                cache["first_run_logged"] = True
                cache["last_ping_timestamp"] = now_ts
                _save_telemetry_cache(cache)

        except Exception as err:
            logger.debug(f"Telemetry worker error: {err}")

    t = threading.Thread(target=_worker, daemon=True)
    t.start()

def notify_activation_async(hw_id: str, license_key: str, activation_result: dict):
    """Notifies developer when a user enters a license key."""
    def _worker():
        try:
            ip, location = get_public_ip_and_location()
            now_str = datetime.now().strftime("%d.%m.%Y %H:%M:%S")

            is_valid = activation_result.get("success", False)
            plan = activation_result.get("plan", "365 Günlük")

            if is_valid:
                icon = "🔑 <b>LİSANS BAŞARIYLA AKTİVE EDİLDİ!</b>"
            else:
                icon = "⚠️ <b>Geçersiz Lisans Denemesi</b>"

            msg = (
                f"{icon}\n"
                f"━━━━━━━━━━━━━━━━━━━\n"
                f"💻 <b>Donanım ID:</b> <code>{hw_id}</code>\n"
                f"🏷️ <b>Girilen Anahtar:</b> <code>{license_key}</code>\n"
                f"📅 <b>Plan / Durum:</b> {plan}\n"
                f"📍 <b>Konum / IP:</b> {location} (<code>{ip}</code>)\n"
                f"⏱️ <b>Zaman:</b> {now_str}\n"
                f"━━━━━━━━━━━━━━━━━━━"
            )

            send_telegram_message(msg)
        except Exception as err:
            logger.debug(f"Activation telemetry error: {err}")

    t = threading.Thread(target=_worker, daemon=True)
    t.start()
