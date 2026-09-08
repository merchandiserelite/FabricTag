import os
import shutil
import socket
import logging
import uuid
import threading
import time
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pyngrok import ngrok, conf

import database
import analyzer
import licensing

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Point pyngrok to existing ngrok binary if available
existing_ngrok_path = r"C:\Users\ASLI CELIK\AppData\Local\Microsoft\WindowsApps\ngrok.exe"
if os.path.exists(existing_ngrok_path):
    try:
        conf.get_default().ngrok_path = existing_ngrok_path
    except Exception as e:
        logger.warning(f"Could not set custom ngrok path: {e}")

# Initialize DB on start
database.init_db()

app = FastAPI(title="FabricTag API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import sys

if getattr(sys, 'frozen', False):
    APP_DIR = getattr(sys, '_MEIPASS', os.path.dirname(sys.executable))
    DATA_DIR = os.path.dirname(sys.executable)
else:
    APP_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = APP_DIR

STATIC_DIR = os.path.join(APP_DIR, "static")
if not os.path.exists(STATIC_DIR):
    STATIC_DIR = os.path.join(DATA_DIR, "static")

UPLOAD_DIR = os.path.join(DATA_DIR, "uploads")
LOGOS_DIR = os.path.join(STATIC_DIR, "logos")
BACKUPS_DIR = os.path.join(DATA_DIR, "backups")
SETTINGS_FILE = os.path.join(DATA_DIR, "settings.json")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(LOGOS_DIR, exist_ok=True)
os.makedirs(BACKUPS_DIR, exist_ok=True)

ngrok_tunnel_url = None

def get_ngrok_url():
    global ngrok_tunnel_url
    if ngrok_tunnel_url:
        return ngrok_tunnel_url
    
    # 1. Try reading from already running local ngrok instance on 4040
    try:
        import urllib.request
        import json
        with urllib.request.urlopen("http://127.0.0.1:4040/api/tunnels", timeout=2) as resp:
            data = json.loads(resp.read().decode())
            tunnels = data.get("tunnels", [])
            for t in tunnels:
                if t.get("public_url", "").startswith("https"):
                    ngrok_tunnel_url = t.get("public_url")
                    logger.info(f"Connected to running Ngrok tunnel: {ngrok_tunnel_url}")
                    return ngrok_tunnel_url
    except Exception:
        pass

    # 2. Try pyngrok connect
    try:
        tunnels = ngrok.get_tunnels()
        if tunnels:
            ngrok_tunnel_url = tunnels[0].public_url
            return ngrok_tunnel_url
        tunnel = ngrok.connect(8000, bind_tls=True)
        ngrok_tunnel_url = tunnel.public_url
        logger.info(f"Ngrok Tunnel Started: {ngrok_tunnel_url}")
        return ngrok_tunnel_url
    except Exception as e:
        logger.info(f"Ngrok info: {e}")
        return None

class SettingsRequest(BaseModel):
    api_key: Optional[str] = None
    default_template: Optional[str] = None
    printer_type: Optional[str] = None
    label_width: Optional[float] = None
    label_height: Optional[float] = None
    col_gap: Optional[float] = None
    row_gap: Optional[float] = None
    margin_top: Optional[float] = None
    margin_left: Optional[float] = None
    # Visual Studio Design Attributes
    logo_visible: Optional[bool] = None
    logo_height: Optional[float] = None
    logo_align: Optional[str] = None
    active_logo_url: Optional[str] = None
    font_family: Optional[str] = None
    use_fiber_abbreviations: Optional[bool] = None
    font_size_header: Optional[float] = None
    font_size_company: Optional[float] = None
    font_size_quality_name: Optional[float] = None
    font_size_composition: Optional[float] = None
    font_size_weight: Optional[float] = None
    font_size_body: Optional[float] = None
    header_black_bar: Optional[bool] = None
    bar_target: Optional[str] = "code_bar"
    show_field_prefixes: Optional[bool] = True
    font_size_quality_code_elem: Optional[float] = None
    font_size_color: Optional[float] = None
    prefix_quality_code_elem: Optional[str] = None
    prefix_color: Optional[str] = None
    barcode_height: Optional[float] = None
    barcode_visible: Optional[bool] = None
    show_company: Optional[bool] = None
    show_quality_name: Optional[bool] = None
    show_quality_code: Optional[bool] = None
    show_composition: Optional[bool] = None
    show_weight: Optional[bool] = None
    align_company: Optional[str] = None
    align_quality_name: Optional[str] = None
    align_quality_code: Optional[str] = None
    align_composition: Optional[str] = None
    align_weight: Optional[str] = None
    # Auto Backup Attributes
    auto_backup_enabled: Optional[bool] = None
    auto_backup_frequency: Optional[str] = None
    auto_backup_time: Optional[str] = None
    custom_backup_dir: Optional[str] = None
    # Internal Code Format Attributes
    code_prefix_type: Optional[str] = None
    code_prefix_text: Optional[str] = None
    code_separator: Optional[str] = None
    code_digits: Optional[int] = None
    code_start_number: Optional[int] = None

class FabricSaveRequest(BaseModel):
    internal_code: Optional[str] = None
    company_name: str
    quality_code: str
    quality_name: Optional[str] = ""
    design_code: Optional[str] = ""
    color: Optional[str] = ""
    width: Optional[str] = ""
    weight: Optional[str] = ""
    composition: Optional[str] = ""
    barcode_or_qr: Optional[str] = ""

class Base64ScanRequest(BaseModel):
    image: str
    captureId: Optional[int] = None

class BackupCreateRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    label_prefix: Optional[str] = "MANUEL"

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def load_settings():
    default_config = {
        "api_key": "",
        "default_template": "option-a",
        "printer_type": "a4",
        "label_width": 63.5,
        "label_height": 46.6,
        "col_gap": 2.5,
        "row_gap": 2.0,
        "margin_top": 8.0,
        "margin_left": 6.0,
        "logo_visible": True,
        "logo_height": 6.0,
        "logo_align": "left",
        "active_logo_url": "/logo.png",
        "font_family": "'Outfit', sans-serif",
        "use_fiber_abbreviations": False,
        "font_size_header": 9.0,
        "font_size_company": 9.0,
        "font_size_quality_name": 9.0,
        "font_size_quality_code_elem": 9.0,
        "font_size_color": 9.0,
        "font_size_composition": 9.0,
        "font_size_weight": 9.0,
        "font_size_body": 9.0,
        "show_field_prefixes": True,
        "bar_target": "code_bar",
        "header_black_bar": True,
        "barcode_height": 8.0,
        "barcode_visible": True,
        "show_company": True,
        "show_quality_name": True,
        "show_quality_code": True,
        "show_composition": True,
        "show_weight": True,
        "align_company": "right",
        "align_quality_name": "center",
        "align_quality_code": "center",
        "align_composition": "left",
        "align_weight": "left",
        "auto_backup_enabled": True,
        "auto_backup_frequency": "daily",
        "auto_backup_time": "18:00",
        "code_prefix_type": "letters",
        "code_prefix_text": "ELT",
        "code_separator": "",
        "code_digits": 7,
        "code_start_number": 1
    }
    if os.path.exists(SETTINGS_FILE):
        try:
            import json
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                default_config.update(data)
        except Exception:
            pass
    return default_config

def save_settings(settings_dict):
    import json
    existing = load_settings()
    existing.update(settings_dict)
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=4)

# Background Auto-Backup Scheduler Thread
_last_auto_backup_day = None

def auto_backup_worker():
    global _last_auto_backup_day
    while True:
        try:
            time.sleep(30)
            settings = load_settings()
            if not settings.get("auto_backup_enabled", False):
                continue
                
            backup_time_str = settings.get("auto_backup_time", "18:00")
            now = datetime.now()
            today_str = now.strftime("%Y-%m-%d")
            current_time_str = now.strftime("%H:%M")
            
            if current_time_str == backup_time_str and _last_auto_backup_day != today_str:
                logger.info(f"Triggering scheduled auto-backup at {current_time_str}...")
                database.create_timestamped_backup(label_prefix="OTO_GUNLUK_YEDEK")
                _last_auto_backup_day = today_str
                logger.info("Auto-backup completed successfully!")
        except Exception as e:
            logger.error(f"Auto-backup worker error: {e}")

# Startup Hook
@app.on_event("startup")
def startup_event():
    get_ngrok_url()
    t = threading.Thread(target=auto_backup_worker, daemon=True)
    t.start()
    try:
        import telemetry
        hw_id = licensing.get_hardware_id()
        lic_info = licensing.get_license_status()
        telemetry.notify_startup_async(hw_id, lic_info, "v4.3.0")
    except Exception as e:
        logger.debug(f"Telemetry startup skipped: {e}")

# Endpoints
@app.get("/api/server-info")
def server_info():
    local_ip = get_local_ip()
    tunnel_url = get_ngrok_url()
    return {
        "local_ip": local_ip,
        "port": 8000,
        "access_url": f"http://{local_ip}:8000",
        "ngrok_url": tunnel_url,
        "https_access_url": tunnel_url or f"https://{local_ip}:8000"
    }

class LicenseActivateRequest(BaseModel):
    license_key: str
    company: Optional[str] = "COMMERCIAL"

@app.get("/api/license/status")
def get_license_status():
    return licensing.get_license_status()

@app.post("/api/license/activate")
def activate_license_endpoint(req: LicenseActivateRequest):
    res = licensing.activate_license(req.license_key, req.company or "COMMERCIAL")
    try:
        import telemetry
        hw_id = licensing.get_hardware_id()
        telemetry.notify_activation_async(hw_id, req.license_key, res)
    except Exception as e:
        logger.debug(f"Telemetry activation skipped: {e}")
    return res

@app.get("/api/settings")
def get_settings():
    settings = load_settings()
    api_key = settings.get("api_key", "")
    masked_key = api_key
    if len(api_key) > 8:
        masked_key = api_key[:4] + "..." + api_key[-4:]
    
    settings_response = dict(settings)
    settings_response["has_key"] = bool(api_key)
    settings_response["masked_key"] = masked_key
    return settings_response

@app.post("/api/settings")
def update_settings(req: SettingsRequest):
    new_settings = {}
    if req.api_key is not None:
        new_settings["api_key"] = req.api_key.strip()
    if req.default_template:
        new_settings["default_template"] = req.default_template
    if req.printer_type:
        new_settings["printer_type"] = req.printer_type
    if req.label_width is not None:
        new_settings["label_width"] = req.label_width
    if req.label_height is not None:
        new_settings["label_height"] = req.label_height
    if req.col_gap is not None:
        new_settings["col_gap"] = req.col_gap
    if req.row_gap is not None:
        new_settings["row_gap"] = req.row_gap
    if req.margin_top is not None:
        new_settings["margin_top"] = req.margin_top
    if req.margin_left is not None:
        new_settings["margin_left"] = req.margin_left
        
    # Visual Studio Design Attributes
    if req.logo_visible is not None:
        new_settings["logo_visible"] = req.logo_visible
    if req.logo_height is not None:
        new_settings["logo_height"] = req.logo_height
    if req.logo_align is not None:
        new_settings["logo_align"] = req.logo_align
    if req.active_logo_url is not None:
        new_settings["active_logo_url"] = req.active_logo_url
    if req.font_family is not None:
        new_settings["font_family"] = req.font_family
    if req.use_fiber_abbreviations is not None:
        new_settings["use_fiber_abbreviations"] = req.use_fiber_abbreviations
    if req.font_size_header is not None:
        new_settings["font_size_header"] = req.font_size_header
    if req.font_size_company is not None:
        new_settings["font_size_company"] = req.font_size_company
    if req.font_size_quality_name is not None:
        new_settings["font_size_quality_name"] = req.font_size_quality_name
    if req.font_size_composition is not None:
        new_settings["font_size_composition"] = req.font_size_composition
    if req.font_size_weight is not None:
        new_settings["font_size_weight"] = req.font_size_weight
    if req.font_size_body is not None:
        new_settings["font_size_body"] = req.font_size_body
    if req.header_black_bar is not None:
        new_settings["header_black_bar"] = req.header_black_bar
    if req.barcode_height is not None:
        new_settings["barcode_height"] = req.barcode_height
    if req.barcode_visible is not None:
        new_settings["barcode_visible"] = req.barcode_visible
    if req.show_company is not None:
        new_settings["show_company"] = req.show_company
    if req.show_quality_name is not None:
        new_settings["show_quality_name"] = req.show_quality_name
    if req.show_quality_code is not None:
        new_settings["show_quality_code"] = req.show_quality_code
    if req.show_composition is not None:
        new_settings["show_composition"] = req.show_composition
    if req.show_weight is not None:
        new_settings["show_weight"] = req.show_weight
    if req.align_company is not None:
        new_settings["align_company"] = req.align_company
    if req.align_quality_name is not None:
        new_settings["align_quality_name"] = req.align_quality_name
    if req.align_quality_code is not None:
        new_settings["align_quality_code"] = req.align_quality_code
    if req.align_composition is not None:
        new_settings["align_composition"] = req.align_composition
    if req.align_weight is not None:
        new_settings["align_weight"] = req.align_weight
        
    # Auto Backup
    if req.auto_backup_enabled is not None:
        new_settings["auto_backup_enabled"] = req.auto_backup_enabled
    if req.auto_backup_frequency is not None:
        new_settings["auto_backup_frequency"] = req.auto_backup_frequency
    if req.auto_backup_time is not None:
        new_settings["auto_backup_time"] = req.auto_backup_time
    if req.custom_backup_dir is not None:
        new_settings["custom_backup_dir"] = req.custom_backup_dir.strip()
        
    # Internal Code Format
    if req.code_prefix_type is not None:
        new_settings["code_prefix_type"] = req.code_prefix_type
    if req.code_prefix_text is not None:
        new_settings["code_prefix_text"] = req.code_prefix_text.strip().upper()
    if req.code_separator is not None:
        new_settings["code_separator"] = req.code_separator
    if req.code_digits is not None:
        new_settings["code_digits"] = req.code_digits
    if req.code_start_number is not None:
        new_settings["code_start_number"] = req.code_start_number

    # Also save any extra visual studio keys
    for k in ["bar_target", "show_field_prefixes", "font_size_quality_code_elem", "font_size_color", "prefix_quality_code_elem", "prefix_color", "element_offsets", "element_order", "label_bg_color", "label_border_style", "label_border_color", "bar_style", "bar_bg_color", "bar_text_color", "bar_border_radius"]:
        if hasattr(req, k) and getattr(req, k) is not None:
            new_settings[k] = getattr(req, k)
    save_settings(new_settings)
    return {"success": True}

APP_VERSION = "4.3.3"
GITHUB_REPO = "merchandiserelite/FabricTag"
VERSION_URL = f"https://raw.githubusercontent.com/{GITHUB_REPO}/main/version.json"

@app.get("/api/check-update")
def check_update_endpoint():
    latest_version = APP_VERSION
    has_update = False
    release_date = "2026-09-08"
    changelog = [
        "Ayrı Kalite Kodu ve Renk / Varyant alanı eklendi",
        "Tüm yazılar standart 9.0pt puntoya eşitlendi",
        "Alan Başlıklarını Göster / Gizle onay kutusu eklendi",
        "Vurgu çubuğunu istenen alana (Kalite Adı, Kod, Renk vb.) uygulama seçeneği eklendi",
        "Canlı önizlemede yön tuşlarıyla (↑ / ↓) 0.5mm milimetrik kaydırma eklendi"
    ]
    download_url = f"https://github.com/{GITHUB_REPO}/releases/latest"

    # Attempt to query GitHub for newer version
    try:
        import urllib.request
        import json as json_lib
        req = urllib.request.Request(
            VERSION_URL,
            headers={"User-Agent": f"FabricTag-Updater/{APP_VERSION}"}
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            if resp.status == 200:
                remote_data = json_lib.loads(resp.read().decode("utf-8"))
                remote_ver = str(remote_data.get("version", APP_VERSION)).strip()

                def parse_v(v_str):
                    return [int(x) for x in re.sub(r'[^0-9.]', '', v_str).split('.') if x]

                if parse_v(remote_ver) > parse_v(APP_VERSION):
                    has_update = True
                    latest_version = remote_ver
                    release_date = remote_data.get("release_date", release_date)
                    changelog = remote_data.get("changelog", changelog)
                    download_url = remote_data.get("download_url", download_url)
    except Exception:
        pass

    return {
        "current_version": APP_VERSION,
        "latest_version": latest_version,
        "has_update": has_update,
        "release_date": release_date,
        "changelog": changelog,
        "download_url": download_url
    }

class OpenFolderRequest(BaseModel):
    folder_path: Optional[str] = None

@app.post("/api/open-folder")
def open_folder_endpoint(req: OpenFolderRequest):
    import subprocess
    target_path = req.folder_path.strip() if req.folder_path else ""
    if not target_path or not os.path.exists(target_path):
        target_path = BACKUPS_DIR
    
    try:
        if os.name == 'nt':
            subprocess.Popen(['explorer.exe', os.path.normpath(target_path)])
            return {"success": True, "message": f"Folder opened: {target_path}"}
        else:
            return {"success": False, "message": "Only supported on Windows"}
    except Exception as e:
        return {"success": False, "message": str(e)}

class TestKeyRequest(BaseModel):
    api_key: Optional[str] = None

@app.post("/api/test-key")
def test_gemini_key(req: TestKeyRequest):
    key = req.api_key.strip() if (req.api_key and req.api_key.strip()) else load_settings().get("api_key", "").strip()
    if not key:
        return {"valid": False, "message": "API anahtarı bulunamadı. Lütfen anahtarınızı girin."}
    
    try:
        from google import genai
        client = genai.Client(api_key=key)
        response = client.models.generate_content(
            model='gemini-3.5-flash-lite',
            contents='Hi',
        )
        return {"valid": True, "message": "Google Gemini API bağlantısı başarılı ve aktif!"}
    except Exception as e:
        err_msg = str(e)
        logger.error(f"Gemini API key test failed: {err_msg}")
        return {"valid": False, "message": f"Bağlantı hatası: {err_msg}"}

# Logo Management Endpoints
@app.get("/api/logos")
def list_logos():
    logos = [
        {"name": "Varsayılan ELITE Logo", "url": "/logo.png"}
    ]
    if os.path.exists(LOGOS_DIR):
        for f in os.listdir(LOGOS_DIR):
            if f.lower().endswith(('.png', '.jpg', '.jpeg', '.svg', '.webp')):
                clean_name = os.path.splitext(f)[0].replace("_", " ").upper()
                logos.append({
                    "name": clean_name,
                    "url": f"/logos/{f}"
                })
    return logos

@app.post("/api/upload-logo")
async def upload_logo(file: UploadFile = File(...)):
    try:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ['.png', '.jpg', '.jpeg', '.svg', '.webp']:
            raise HTTPException(status_code=400, detail="Yalnızca PNG, JPG, SVG veya WEBP formatında logo yükleyebilirsiniz.")
        
        orig_base = os.path.splitext(file.filename)[0]
        safe_base = "".join(c for c in orig_base if c.isalnum() or c in (' ', '-', '_')).strip().replace(" ", "_")
        if not safe_base:
            safe_base = "logo"
            
        unique_name = f"{safe_base}_{uuid.uuid4().hex[:6]}{ext}"
        dest_path = os.path.join(LOGOS_DIR, unique_name)
        
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        new_logo_url = f"/logos/{unique_name}"
        save_settings({"active_logo_url": new_logo_url})
        
        return {
            "success": True,
            "url": new_logo_url,
            "name": safe_base.replace("_", " ").upper()
        }
    except Exception as e:
        logger.error(f"Logo upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Logo yüklenirken hata: {str(e)}")

@app.post("/api/scan")
async def scan_swatch(file: UploadFile = File(...)):
    lic_stat = licensing.get_license_status()
    if not lic_stat.get("can_create_new", False):
        raise HTTPException(
            status_code=403,
            detail="Ücretsiz 20 kumaş kaydetme limitine ulaştınız. Lütfen sınırsız kullanım için lisansınızı aktive edin."
        )

    settings = load_settings()
    api_key = settings.get("api_key", "")
    if not api_key:
        raise HTTPException(
            status_code=400, 
            detail="Gemini API Key bulunamadı. Lütfen Ayarlar sekmesinden API anahtarınızı kaydedin."
        )

    temp_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        with open(temp_path, "rb") as f:
            image_bytes = f.read()

        mime_type = file.content_type or "image/jpeg"
        extracted_data = analyzer.analyze_swatch_card(image_bytes, mime_type, api_key)
        
        return extracted_data

    except Exception as e:
        logger.error(f"Scan failed: {str(e)}")
        err_msg = str(e)
        if "401" in err_msg or "UNAUTHENTICATED" in err_msg or "ACCESS_TOKEN_TYPE_UNSUPPORTED" in err_msg:
            err_msg = "Geçersiz API Anahtarı! Girdiğiniz anahtar geçersiz. Google Gemini API anahtarları 'AIzaSy...' ile başlamalıdır. Lütfen https://aistudio.google.com/app/apikey adresinden ücretsiz yeni bir anahtar alıp '⚙️ Ayarlar & Tasarım' bölümüne kaydedin."
        raise HTTPException(status_code=500, detail=f"Kartela okuma başarısız: {err_msg}")
    
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

@app.post("/api/kartela-oku")
async def scan_kartela_base64(req: Base64ScanRequest):
    lic_stat = licensing.get_license_status()
    if not lic_stat.get("can_create_new", False):
        raise HTTPException(
            status_code=403,
            detail="Ücretsiz 20 kumaş kaydetme limitine ulaştınız. Lütfen sınırsız kullanım için lisansınızı aktive edin."
        )

    settings = load_settings()
    api_key = settings.get("api_key", "")
    if not api_key:
        raise HTTPException(
            status_code=400, 
            detail="Gemini API Key bulunamadı. Lütfen Ayarlar sekmesinden API anahtarınızı kaydedin."
        )

    try:
        import base64
        image_data = req.image
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]
            
        image_bytes = base64.b64decode(image_data)
        extracted_data = analyzer.analyze_swatch_card(image_bytes, "image/jpeg", api_key)
        
        saved_row = database.add_fabric(
            company_name=extracted_data.get("company_name", ""),
            quality_code=extracted_data.get("quality_code", ""),
            quality_name=extracted_data.get("quality_name", ""),
            design_code=extracted_data.get("design_code", ""),
            color=extracted_data.get("color", ""),
            width=extracted_data.get("width", ""),
            weight=extracted_data.get("weight", ""),
            composition=extracted_data.get("composition", ""),
            barcode_or_qr=extracted_data.get("barcode_or_qr", "")
        )
        
        return {
            "success": True,
            "captureId": req.captureId,
            "data": saved_row
        }

    except Exception as e:
        logger.error(f"Base64 scan failed: {str(e)}")
        err_msg = str(e)
        if "401" in err_msg or "UNAUTHENTICATED" in err_msg or "ACCESS_TOKEN_TYPE_UNSUPPORTED" in err_msg:
            err_msg = "Geçersiz API Anahtarı! Girdiğiniz anahtar geçersiz. Google Gemini API anahtarları 'AIzaSy...' ile başlamalıdır. Lütfen https://aistudio.google.com/app/apikey adresinden ücretsiz yeni bir anahtar alıp '⚙️ Ayarlar & Tasarım' bölümüne kaydedin."
        raise HTTPException(status_code=500, detail=f"Kartela okuma başarısız: {err_msg}")

@app.post("/api/fabrics")
def save_fabric(req: FabricSaveRequest):
    lic_stat = licensing.get_license_status()
    if not lic_stat.get("can_create_new", False):
        raise HTTPException(
            status_code=403,
            detail="Ücretsiz 20 kumaş kaydetme limitine ulaştınız. Lütfen sınırsız kullanım için lisansınızı aktive edin."
        )
    try:
        saved_row = database.add_fabric(
            company_name=req.company_name,
            quality_code=req.quality_code,
            quality_name=req.quality_name,
            design_code=req.design_code,
            color=req.color,
            width=req.width,
            weight=req.weight,
            composition=req.composition,
            barcode_or_qr=req.barcode_or_qr,
            internal_code=req.internal_code
        )
        return saved_row
    except Exception as e:
        logger.error(f"Save failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Veritabanına kaydetme başarısız: {str(e)}")

@app.get("/api/fabrics")
def list_fabrics(
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    try:
        return database.get_all_fabrics(search_query=search, start_date=start_date, end_date=end_date)
    except Exception as e:
        logger.error(f"List failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Native Excel (.xlsx) Export Endpoint with Date/Time Range Support
@app.get("/api/export-xlsx")
def export_fabrics_xlsx(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    try:
        now_tag = datetime.now().strftime("%Y-%m-%d_%H%M")
        export_filename = f"Kumas_Veritabani_{now_tag}.xlsx"
        export_path = os.path.join(UPLOAD_DIR, export_filename)
        
        # Clean formatting of datetime params
        s_date = start_date.replace("T", " ") if start_date else None
        e_date = end_date.replace("T", " ") if end_date else None
        
        database.export_to_xlsx(export_path, start_date=s_date, end_date=e_date)
        
        return FileResponse(
            path=export_path,
            filename=export_filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        logger.error(f"Excel export failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Excel (.xlsx) oluşturulurken hata: {str(e)}")

# Legacy CSV Export Endpoint (still preserved)
@app.get("/api/export")
def export_fabrics_csv():
    export_path = os.path.join(BASE_DIR, "kumas_veritabani.csv")
    try:
        database.export_to_csv(export_path)
        return FileResponse(
            path=export_path, 
            filename="kumas_veritabani.csv", 
            media_type="text/csv"
        )
    except Exception as e:
        logger.error(f"Export failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"CSV'ye aktarma başarısız: {str(e)}")

# Backup Management Endpoints
@app.post("/api/backups/create")
def create_backup_endpoint(req: BackupCreateRequest):
    try:
        s_date = req.start_date.replace("T", " ") if req.start_date else None
        e_date = req.end_date.replace("T", " ") if req.end_date else None
        result = database.create_timestamped_backup(
            start_date=s_date,
            end_date=e_date,
            label_prefix=req.label_prefix or "MANUEL"
        )
        return {"success": True, "backup": result}
    except Exception as e:
        logger.error(f"Backup creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Yedek oluşturulamadı: {str(e)}")

@app.get("/api/backups")
def list_backups_endpoint():
    try:
        return database.list_backups()
    except Exception as e:
        logger.error(f"List backups failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/backups/download/{filename}")
def download_backup_endpoint(filename: str):
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(BACKUPS_DIR, safe_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Yedek dosyası bulunamadı.")
    
    media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if safe_filename.endswith(".xlsx") else "application/octet-stream"
    return FileResponse(path=file_path, filename=safe_filename, media_type=media_type)

@app.get("/api/excel-template")
def download_excel_template_endpoint():
    template_path = os.path.join(STATIC_DIR, "FabricTag_Kumas_Sablonu.xlsx")
    database.generate_empty_excel_template(template_path)
    return FileResponse(
        path=template_path,
        filename="FabricTag_Kumas_Sablonu.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

class ExcelImportRequest(BaseModel):
    temp_file_id: str
    mappings: dict

@app.post("/api/excel/analyze")
async def analyze_excel_endpoint(file: UploadFile = File(...)):
    try:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".xlsx", ".xls", ".xlsm", ".csv"]:
            raise HTTPException(status_code=400, detail="Lütfen geçerli bir .xlsx veya .csv Excel dosyası yükleyin.")
            
        import uuid
        temp_id = f"import_{uuid.uuid4().hex[:10]}{ext}"
        temp_path = os.path.join(UPLOAD_DIR, temp_id)
        
        contents = await file.read()
        with open(temp_path, "wb") as f:
            f.write(contents)
            
        analysis = database.analyze_excel_columns(temp_path)
        if "error" in analysis:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise HTTPException(status_code=400, detail=analysis["error"])
            
        analysis["temp_file_id"] = temp_id
        analysis["filename"] = file.filename
        return analysis
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Excel analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Dosya analiz edilemedi: {str(e)}")

@app.post("/api/excel/import")
def import_excel_endpoint(req: ExcelImportRequest):
    try:
        temp_path = os.path.join(UPLOAD_DIR, os.path.basename(req.temp_file_id))
        if not os.path.exists(temp_path):
            raise HTTPException(status_code=404, detail="Yüklenen geçici dosya bulunamadı veya süresi doldu.")
            
        result = database.import_excel_fabrics(temp_path, req.mappings)
        
        # Cleanup temp file
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception:
            pass
            
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Excel import failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"İçe aktarma hatası: {str(e)}")

# Mount static files
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

