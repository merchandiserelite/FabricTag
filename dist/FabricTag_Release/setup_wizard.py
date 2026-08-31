import os
import sys
import json
import subprocess

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if getattr(sys, 'frozen', False):
    APP_DIR = os.path.dirname(sys.executable)
else:
    APP_DIR = BASE_DIR

LANG_CODES = {
    "1": ("en", "English", "FabricTag - Smart Fabric Swatch & Hanger AI"),
    "2": ("tr", "Türkçe", "FabricTag - Akıllı Kumaş Kartela ve Etiket Sistemi"),
    "3": ("de", "Deutsch", "FabricTag - Intelligenter Stoffmuster- & Etiketten-Scanner"),
    "4": ("it", "Italiano", "FabricTag - Scanner Intelligente per Cartelle e Campioni Tessuto"),
    "5": ("es", "Español", "FabricTag - Escáner Inteligente de Muestras de Tela y Etiquetas"),
    "6": ("fr", "Français", "FabricTag - Scanner Intelligent d'Échantillons de Tissu"),
    "7": ("ar", "العربية", "FabricTag - نظام مسح كارتيلات الأقمشة الذكي"),
    "8": ("zh", "中文", "FabricTag - 智能面料样卡与标签识别系统"),
    "9": ("ja", "日本語", "FabricTag - スマート生地見本＆ハンガーAIタグシステム")
}

def create_windows_shortcut(target_exe, icon_path, shortcut_path, description):
    try:
        ps_cmd = f"""
        $ws = New-Object -ComObject WScript.Shell;
        $s = $ws.CreateShortcut('{shortcut_path}');
        $s.TargetPath = '{target_exe}';
        $s.WorkingDirectory = '{os.path.dirname(target_exe)}';
        $s.IconLocation = '{icon_path}, 0';
        $s.Description = '{description}';
        $s.Save();
        """
        subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], check=True, stdout=subprocess.DEVNULL)
        return True
    except Exception as e:
        print("Shortcut error:", e)
        return False

def main():
    print("=" * 65)
    print("       FABRICTAG - GLOBAL SETUP WIZARD / KURULUM SİHİRBAZI")
    print("       Smart Fabric Swatch & Hanger AI Tag Management System")
    print("=" * 65)
    
    print("\n[Step 1/3] Please select your preferred language / Lütfen dilinizi seçin:")
    print("  1) 🇬🇧 English (EN) - Default")
    print("  2) 🇹🇷 Türkçe (TR)")
    print("  3) 🇩🇪 Deutsch (DE)")
    print("  4) 🇮🇹 Italiano (IT)")
    print("  5) 🇪🇸 Español (ES)")
    print("  6) 🇫🇷 Français (FR)")
    print("  7) 🇸🇦 العربية (AR)")
    print("  8) 🇨🇳 中文 (ZH)")
    print("  9) 🇯🇵 日本語 (JA)")
    
    lang_choice = input("\nSelect [1-9] (Default: 1): ").strip()
    if lang_choice not in LANG_CODES:
        lang_choice = "1"
        
    selected_lang, lang_name, shortcut_desc = LANG_CODES[lang_choice]
    print(f"--> Selected Language: {lang_name}")
    
    # Configure language in settings.json
    settings_file = os.path.join(APP_DIR, "settings.json")
    settings = {}
    if os.path.exists(settings_file):
        try:
            with open(settings_file, "r", encoding="utf-8") as f:
                settings = json.load(f)
        except Exception:
            pass
            
    settings["default_app_lang"] = selected_lang
    
    print("\n" + "-" * 65)
    print("[Step 2/3] Backup Folder Setup / Yedekleme Klasörü")
    print("Where would you like to save automatic database and Excel backups?")
    print("Otomatik veritabanı ve Excel yedekleriniz nereye kaydedilsin?")
    default_backup = os.path.join(os.path.expanduser("~"), "Documents", "FabricTag_Backups")
    print(f"Default (Varsayılan): {default_backup}")
    
    user_backup = input("Enter custom backup path or press Enter for default: ").strip()
    if not user_backup:
        user_backup = default_backup
        
    try:
        os.makedirs(user_backup, exist_ok=True)
        settings["custom_backup_dir"] = user_backup
        print(f"--> Backup Directory configured: {user_backup}")
    except Exception as e:
        print(f"Could not create folder: {e}. Using internal default.")
        
    # Save settings
    with open(settings_file, "w", encoding="utf-8") as f:
        json.dump(settings, f, ensure_ascii=False, indent=4)
        
    print("\n" + "-" * 65)
    print("[Step 3/3] Creating Desktop Shortcut / Masaüstü Kısayolu Oluşturuluyor...")
    
    desktop_dir = os.path.join(os.path.expanduser("~"), "Desktop")
    shortcut_file = os.path.join(desktop_dir, "FabricTag.lnk")
    
    exe_path = os.path.join(APP_DIR, "FabricTag.exe")
    if not os.path.exists(exe_path):
        exe_path = os.path.join(APP_DIR, "FabricTag", "FabricTag.exe")
        
    icon_path = os.path.join(APP_DIR, "icon.ico")
    if not os.path.exists(icon_path):
        icon_path = os.path.join(APP_DIR, "FabricTag", "icon.ico")
        
    if os.path.exists(exe_path):
        if create_windows_shortcut(exe_path, icon_path, shortcut_file, shortcut_desc):
            print("--> SUCCESS: Desktop shortcut 'FabricTag' created successfully!")
        else:
            print("--> Warning: Could not create desktop shortcut automatically.")
    else:
        print(f"--> Target executable found at: {APP_DIR}")
        
    print("\n" + "=" * 65)
    print("  SETUP COMPLETED SUCCESSFULLY! / KURULUM TAMAMLANDI!")
    print("  You can now start FabricTag from your Desktop shortcut.")
    print("=" * 65 + "\n")
    
    start_now = input("Start FabricTag now? / FabricTag şimdi başlatılsın mı? [Y/n]: ").strip().lower()
    if start_now in ["", "y", "yes", "e", "evet"]:
        if os.path.exists(exe_path):
            subprocess.Popen([exe_path], cwd=os.path.dirname(exe_path))
        else:
            print("Starting Python environment...")
            subprocess.Popen(["python", "main_app.py"], cwd=APP_DIR)
            
if __name__ == "__main__":
    main()
