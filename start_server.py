import os
import sys
import time
import socket
import webbrowser
import threading
import subprocess
import uvicorn

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
os.chdir(BASE_DIR)

def kill_port_8000():
    try:
        output = subprocess.check_output('netstat -ano | findstr :8000', shell=True).decode('utf-8', errors='ignore')
        current_pid = str(os.getpid())
        for line in output.strip().split('\n'):
            parts = line.strip().split()
            if len(parts) >= 5 and ':8000' in parts[1]:
                pid = parts[-1]
                if pid != current_pid:
                    subprocess.run(f'taskkill /F /PID {pid}', shell=True, capture_output=True)
    except Exception:
        pass

def open_browser():
    time.sleep(2)
    try:
        webbrowser.open("http://localhost:8000")
    except Exception:
        pass

if __name__ == "__main__":
    print("=" * 60)
    print("       FabricTag - Smart Fabric Hanger & Swatch Scanner")
    print("=" * 60)
    print("\n[1/2] Kilitli baglantilar temizleniyor (Clearing port locks)...")
    kill_port_8000()
    
    print("[2/2] Sunucu baslatiliyor ve tarayici aciliyor (Starting server)...")
    threading.Thread(target=open_browser, daemon=True).start()
    
    print("\n" + "-" * 60)
    print(" FabricTag Hazir! Bu pencereyi simge durumuna kucultebilirsiniz.")
    print(" FabricTag Ready! You can minimize this window.")
    print("-" * 60 + "\n")
    
    import app
    uvicorn.run(app.app, host="0.0.0.0", port=8000, log_level="info")
