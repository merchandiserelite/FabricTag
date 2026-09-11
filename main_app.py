# -*- coding: utf-8 -*-
"""
TexFlow - Standalone Application Launcher
Auto-browser, Multi-processing support, Port fallback, and Windows UI.
"""
import os
import sys
import time
import socket
import webbrowser
import threading
import multiprocessing

multiprocessing.freeze_support()

# Safe redirection when running without black console or with console
try:
    if sys.stdout is not None:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if sys.stderr is not None:
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

if sys.stdout is None:
    sys.stdout = open(os.devnull, 'w', encoding='utf-8', errors='replace')
if sys.stderr is None:
    sys.stderr = open(os.devnull, 'w', encoding='utf-8', errors='replace')

if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
    BUNDLE_DIR = getattr(sys, '_MEIPASS', BASE_DIR)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    BUNDLE_DIR = BASE_DIR

# Ensure data and uploads dirs exist
os.makedirs(os.path.join(BASE_DIR, "data", "uploads", "styles"), exist_ok=True)

import uvicorn
from app import app

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def is_port_available(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) != 0

def find_available_port(start_port=8050, max_attempts=10):
    for p in range(start_port, start_port + max_attempts):
        if is_port_available(p):
            return p
    return start_port

def open_browser(port):
    time.sleep(1.2)
    url = f"http://localhost:{port}"
    print(f"\n🌐 Tarayıcı açılıyor: {url}")
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"Tarayıcı açma uyarısı: {e}")

if __name__ == "__main__":
    port = 8050
    if not is_port_available(port):
        # If port 8050 is in use (e.g. dev server running), pick next available or keep 8050
        alt_port = find_available_port(8051)
        print(f"Bilgi: Port 8050 meşgul, {alt_port} portu kullanılacak.")
        port = alt_port

    local_ip = get_local_ip()

    print("=" * 65)
    print("      TEXFLOW - AKILLI TEKSTİL ÜRETİM & ÇARŞAF SİSTEMİ")
    print("=" * 65)
    print(f"  * Bilgisayarınızdan erişim : http://localhost:{port}")
    print(f"  * Ağdaki cihazlardan erişim: http://{local_ip}:{port}")
    print("=" * 65)
    print("  Durdurmak veya kapatmak için bu pencereyi kapatabilirsiniz.")
    print("=" * 65)

    threading.Thread(target=open_browser, args=(port,), daemon=True).start()

    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
