import os
import sys
import json
import uuid
import hashlib
import hmac
import platform
import subprocess
from datetime import datetime, timezone
import database

MASTER_SECRET_SALT = b"FABRICTAG_AI_SWATCH_SYSTEM_PRO_2026_DEEPMIND_TURKEY_SECRET_KEY"
FREE_RECORDS_LIMIT = 20

if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

LICENSE_FILE = os.path.join(BASE_DIR, "license.dat")

def get_hardware_id() -> str:
    components = []
    try:
        if platform.system() == "Windows":
            cmd = "wmic csproduct get uuid"
            out = subprocess.check_output(cmd, shell=True, stderr=subprocess.DEVNULL).decode().strip()
            uuid_lines = [l.strip() for l in out.splitlines() if l.strip() and "UUID" not in l]
            if uuid_lines:
                components.append(uuid_lines[0])
    except Exception:
        pass

    try:
        if platform.system() == "Windows":
            cmd = "wmic bios get serialnumber"
            out = subprocess.check_output(cmd, shell=True, stderr=subprocess.DEVNULL).decode().strip()
            serial_lines = [l.strip() for l in out.splitlines() if l.strip() and "SerialNumber" not in l]
            if serial_lines:
                components.append(serial_lines[0])
    except Exception:
        pass

    try:
        node_id = str(uuid.getnode())
        components.append(node_id)
    except Exception:
        pass

    components.append(platform.node())
    components.append(platform.processor())

    raw_seed = "::".join(components)
    hw_hash = hashlib.sha256(raw_seed.encode("utf-8")).hexdigest().upper()
    formatted_hw_id = f"FT-{hw_hash[:4]}-{hw_hash[4:8]}-{hw_hash[8:12]}-{hw_hash[12:16]}"
    return formatted_hw_id

def generate_key_for_hardware(hw_id: str, company_name: str = "COMMERCIAL", expiry_days: int = 0) -> str:
    clean_hw = hw_id.strip().upper()
    clean_company = company_name.strip().upper()
    payload = f"{clean_hw}|{clean_company}|{expiry_days}"
    sig = hmac.new(MASTER_SECRET_SALT, payload.encode("utf-8"), hashlib.sha256).hexdigest().upper()
    key_body = f"{sig[:4]}-{sig[4:8]}-{sig[8:12]}-{sig[12:16]}-{sig[16:20]}"
    return f"FTLIC-{key_body}"

def verify_license(key: str, hw_id: str) -> dict:
    if not key or not key.startswith("FTLIC-"):
        return {"valid": False, "reason": "Gecersiz anahtar formati"}

    clean_key = key.strip().upper()
    clean_hw = hw_id.strip().upper()

    possible_companies = ["COMMERCIAL", "FABRICTAG_USER", "ENTERPRISE", "PRO", "STANDART"]
    
    if os.path.exists(LICENSE_FILE):
        try:
            with open(LICENSE_FILE, "r", encoding="utf-8") as f:
                saved_data = json.load(f)
                if "company" in saved_data:
                    possible_companies.insert(0, saved_data["company"].strip().upper())
        except Exception:
            pass

    for company in possible_companies:
        for expiry in [0, 365, 730, 1095]:
            expected_key = generate_key_for_hardware(clean_hw, company, expiry)
            if clean_key == expected_key:
                return {
                    "valid": True,
                    "company": company,
                    "expiry_days": expiry,
                    "type": "Omur Boyu (Lifetime)" if expiry == 0 else f"{expiry} Gunluk"
                }

    return {"valid": False, "reason": "Bu bilgisayar donanimi icin lisans anahtari gecersiz."}

def get_license_status() -> dict:
    hw_id = get_hardware_id()
    records_count = database.get_total_fabrics_count()
    
    is_licensed = False
    license_info = None

    if os.path.exists(LICENSE_FILE):
        try:
            with open(LICENSE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                saved_key = data.get("license_key", "")
                result = verify_license(saved_key, hw_id)
                if result.get("valid"):
                    is_licensed = True
                    license_info = {
                        "company": result.get("company", "LISANSLI MUSTERI"),
                        "type": result.get("type", "Omur Boyu Sinirsiz"),
                        "activated_at": data.get("activated_at", "")
                    }
        except Exception:
            pass

    remaining_free = max(0, FREE_RECORDS_LIMIT - records_count)
    can_create_new = is_licensed or (records_count < FREE_RECORDS_LIMIT)

    return {
        "is_licensed": is_licensed,
        "hardware_id": hw_id,
        "records_count": records_count,
        "records_limit": FREE_RECORDS_LIMIT,
        "remaining_free_records": remaining_free,
        "can_create_new": can_create_new,
        "license_info": license_info
    }

def activate_license(key: str, company: str = "COMMERCIAL") -> dict:
    hw_id = get_hardware_id()
    result = verify_license(key, hw_id)
    
    if not result.get("valid"):
        return {"success": False, "message": result.get("reason", "Lisans dogrulanamadi.")}

    save_payload = {
        "license_key": key.strip().upper(),
        "hardware_id": hw_id,
        "company": company.strip().upper(),
        "activated_at": datetime.now(timezone.utc).isoformat()
    }

    try:
        with open(LICENSE_FILE, "w", encoding="utf-8") as f:
            json.dump(save_payload, f, indent=4)
        return {
            "success": True,
            "message": "Lisans basariyla aktive edildi! Sinirsiz kullanim acildi.",
            "license_info": result
        }
    except Exception as e:
        return {"success": False, "message": f"Lisans dosyasi kaydedilemedi: {e}"}
