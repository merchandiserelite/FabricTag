import os
import sys
import time
import socket
import webbrowser
import threading
import subprocess
import uvicorn
import json

import multiprocessing
multiprocessing.freeze_support()

# Safe redirection when running without a black console window
if sys.stdout is None:
    sys.stdout = open(os.devnull, 'w')
if sys.stderr is None:
    sys.stderr = open(os.devnull, 'w')

if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
    BUNDLE_DIR = getattr(sys, '_MEIPASS', BASE_DIR)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    BUNDLE_DIR = BASE_DIR

os.makedirs(os.path.join(BASE_DIR, "backups"), exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "uploads"), exist_ok=True)

SETTINGS_PATH = os.path.join(BASE_DIR, "settings.json")
if not os.path.exists(SETTINGS_PATH):
    default_settings = {
        "api_key": "",
        "default_template": "option-b",
        "printer_type": "a4",
        "label_width": 63.5,
        "label_height": 46.6,
        "col_gap": 0.1,
        "row_gap": 0.1,
        "margin_top": 8.0,
        "margin_left": 6.0,
        "logo_visible": True,
        "logo_height": 8.0,
        "logo_align": "left",
        "active_logo_url": "/logo.png",
        "font_family": "'Outfit', sans-serif",
        "use_fiber_abbreviations": True,
        "font_size_header": 9.5,
        "font_size_company": 8.5,
        "font_size_quality_name": 9.5,
        "font_size_composition": 8.5,
        "font_size_weight": 9.0,
        "font_size_body": 7.5,
        "header_black_bar": True,
        "barcode_height": 9.5,
        "barcode_visible": True,
        "show_company": True,
        "show_quality_name": True,
        "show_quality_code": True,
        "show_composition": True,
        "show_weight": True,
        "align_company": "right",
        "align_quality_name": "center",
        "align_quality_code": "center",
        "align_composition": "center",
        "align_weight": "center",
        "auto_backup_enabled": True,
        "auto_backup_frequency": "daily",
        "auto_backup_time": "18:00",
        "code_prefix_type": "letters",
        "code_prefix_text": "FT",
        "code_separator": "",
        "code_digits": 7,
        "code_start_number": 1,
        "config_version": "4.0.0",
        "label_bg_color": "#ffffff",
        "label_border_style": "none",
        "label_border_color": "#000000",
        "bar_style": "filled",
        "bar_bg_color": "#000000",
        "bar_text_color": "#ffffff",
        "bar_border_radius": "1.0",
        "element_order": [
            "logo_row",
            "quality_name",
            "code_bar",
            "composition",
            "weight",
            "barcode"
        ]
    }
    with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
        json.dump(default_settings, f, ensure_ascii=False, indent=4)

def open_browser_delayed():
    time.sleep(1.5)
    webbrowser.open("http://127.0.0.1:8000")

def main():
    print("=" * 60)
    print("       FabricTag - Akilli Kumas Kartela & Etiket Sistemi")
    print("       FabricTag - Smart Fabric Swatch & Hanger AI")
    print("=" * 60)
    print("\n[1/2] Sistem baslatiliyor (Starting FabricTag engine)...")
    
    t = threading.Thread(target=open_browser_delayed, daemon=True)
    t.start()
    
    print("[2/2] Tarayici aciliyor (Opening browser at http://127.0.0.1:8000)...")
    print("-" * 60)
    print(" FabricTag Hazir! Bu pencereyi simge durumuna kucultebilirsiniz.")
    print(" FabricTag is Ready! You can minimize this window.")
    print("-" * 60 + "\n")
    
    from app import app
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="warning")

if __name__ == "__main__":
    main()
