import sys
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

import socket
import webbrowser
import threading
import time
import uvicorn
from pathlib import Path


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def wait_for_server_and_open_browser(port, timeout=25):
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.4)
                if s.connect_ex(('127.0.0.1', port)) == 0:
                    time.sleep(0.2)
                    url = f"http://localhost:{port}"
                    print(f"\n🌐 Sunucu hazır, tarayıcı açılıyor: {url}")
                    webbrowser.open(url)
                    return
        except Exception:
            pass
        time.sleep(0.25)
    url = f"http://localhost:{port}"
    print(f"\n🌐 Tarayıcı açılıyor (zaman aşımı fallback): {url}")
    webbrowser.open(url)

if __name__ == "__main__":
    port = 8050
    local_ip = get_local_ip()

    print("=" * 65)
    print("🚀 TEXFLOW - AKILLI TEKSTİL ÜRETİM & ÇARŞAF SİSTEMİ BAŞLATILIYOR")
    print("=" * 65)
    print(f"💻 Bilgisayarınızdan erişim : http://localhost:{port}")
    print(f"📱 Cep Telefonundan erişim : http://{local_ip}:{port}")
    print("=" * 65)
    print("💡 FabricTag (Port 8000) ile çakışmaması için TexFlow Port 8050")
    print("   üzerinde çalışacak şekilde ayarlandı. Her iki sistem aynı anda çalışabilir.")
    print("=" * 65)

    threading.Thread(target=wait_for_server_and_open_browser, args=(port,), daemon=True).start()

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        reload_dirs=["."],
        reload_excludes=["dist/**", "build/**", "data/uploads/**", ".git/**", "scratch/**", "__pycache__/**"],
        log_level="info"
    )

