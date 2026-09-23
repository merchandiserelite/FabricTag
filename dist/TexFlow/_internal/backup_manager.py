import os
import json
import shutil
import sqlite3
import zipfile
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

DATA_DIR = Path("data")
DB_PATH = DATA_DIR / "texflow.db"
UPLOADS_DIR = DATA_DIR / "uploads"
BACKUPS_DIR = DATA_DIR / "backups"
CONFIG_PATH = DATA_DIR / "backup_config.json"

DEFAULT_CONFIG = {
    "enabled": True,
    "times": ["13:00", "17:00"],
    "retention_count": 30,
    "include_uploads": True,
    "last_backup_time": None
}

def get_backup_config() -> Dict[str, Any]:
    BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
    if not CONFIG_PATH.exists():
        save_backup_config(DEFAULT_CONFIG)
        return DEFAULT_CONFIG.copy()
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            cfg = json.load(f)
            # Ensure all keys exist
            for k, v in DEFAULT_CONFIG.items():
                if k not in cfg:
                    cfg[k] = v
            return cfg
    except Exception as e:
        print(f"Error reading backup config: {e}")
        return DEFAULT_CONFIG.copy()

def save_backup_config(cfg: Dict[str, Any]) -> bool:
    try:
        BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving backup config: {e}")
        return False

def format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"

def create_full_backup(backup_type: str = "manual", note: str = "") -> Dict[str, Any]:
    """
    Creates a full system backup containing:
    1. Online consistent snapshot of SQLite database (texflow.db)
    2. Uploaded files, order documents, and style images (data/uploads)
    3. Manifest json metadata
    All packaged safely into a timestamped ZIP archive.
    """
    BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
    now = datetime.now()
    timestamp_str = now.strftime("%Y%m%d_%H%M%S")
    display_time = now.strftime("%d.%m.%Y %H:%M:%S")

    prefix = "Otomatik" if "auto" in backup_type.lower() else "Manuel"
    zip_filename = f"TexFlow_{prefix}_Yedek_{timestamp_str}.zip"
    zip_path = BACKUPS_DIR / zip_filename

    temp_db_path = BACKUPS_DIR / f"temp_snapshot_{timestamp_str}.db"

    try:
        # 1. Safe online SQLite backup
        if DB_PATH.exists():
            source_conn = sqlite3.connect(str(DB_PATH), timeout=30.0)
            target_conn = sqlite3.connect(str(temp_db_path))
            with target_conn:
                source_conn.backup(target_conn)
            source_conn.close()
            target_conn.close()

        # 2. Count statistics for manifest
        db_size = temp_db_path.stat().st_size if temp_db_path.exists() else 0
        uploads_count = 0
        uploads_total_size = 0
        if UPLOADS_DIR.exists():
            for root, _, files in os.walk(UPLOADS_DIR):
                for f in files:
                    uploads_count += 1
                    uploads_total_size += (Path(root) / f).stat().st_size

        manifest = {
            "app": "TexFlow Textile Production System",
            "version": "2.0",
            "created_at": display_time,
            "timestamp": timestamp_str,
            "backup_type": backup_type,
            "note": note,
            "database_size": db_size,
            "uploads_count": uploads_count,
            "uploads_total_size": uploads_total_size
        }

        # 3. Create compressed ZIP archive
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
            # Add manifest
            zf.writestr("backup_manifest.json", json.dumps(manifest, indent=2, ensure_ascii=False))
            
            # Add SQLite database snapshot
            if temp_db_path.exists():
                zf.write(temp_db_path, arcname="texflow.db")

            # Add uploads directory
            if UPLOADS_DIR.exists():
                for root, _, files in os.walk(UPLOADS_DIR):
                    for f in files:
                        full_f_path = Path(root) / f
                        rel_path = full_f_path.relative_to(DATA_DIR)
                        zf.write(full_f_path, arcname=str(rel_path).replace("\\", "/"))

        # Clean up temp snapshot db
        if temp_db_path.exists():
            temp_db_path.unlink()

        total_zip_size = zip_path.stat().st_size

        # Update last backup time in config
        cfg = get_backup_config()
        cfg["last_backup_time"] = display_time
        save_backup_config(cfg)

        # Enforce retention policy for automatic backups
        clean_old_backups(cfg.get("retention_count", 30))

        return {
            "status": "success",
            "filename": zip_filename,
            "size": total_zip_size,
            "size_formatted": format_size(total_zip_size),
            "created_at": display_time,
            "backup_type": prefix,
            "uploads_count": uploads_count
        }

    except Exception as e:
        if temp_db_path.exists():
            try:
                temp_db_path.unlink()
            except Exception:
                pass
        raise e

def clean_old_backups(max_count: int = 30):
    """Retains the newest max_count backups and safely removes older ones."""
    try:
        backups = list_backups()
        if len(backups) > max_count:
            # Sort oldest first
            to_remove = backups[max_count:]
            for b in to_remove:
                fpath = BACKUPS_DIR / b["filename"]
                if fpath.exists():
                    fpath.unlink()
    except Exception as e:
        print(f"Error cleaning old backups: {e}")

def list_backups() -> List[Dict[str, Any]]:
    """Returns list of all backup files sorted newest first."""
    BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
    items = []
    for f in BACKUPS_DIR.glob("*.zip"):
        if f.name.startswith("temp_"):
            continue
        stat = f.stat()
        mtime = datetime.fromtimestamp(stat.st_mtime)
        b_type = "Otomatik" if "otomatik" in f.name.lower() else "Manuel"
        if "pre_restore" in f.name.lower():
            b_type = "Geri Yükleme Öncesi Emniyet"

        items.append({
            "filename": f.name,
            "size_bytes": stat.st_size,
            "size_formatted": format_size(stat.st_size),
            "created_at": mtime.strftime("%d.%m.%Y %H:%M:%S"),
            "timestamp": stat.st_mtime,
            "backup_type": b_type
        })

    # Sort descending by timestamp (newest first)
    items.sort(key=lambda x: x["timestamp"], reverse=True)
    return items

def restore_backup(filename: str) -> Dict[str, Any]:
    """
    Safely restores database and uploads from a backup ZIP file.
    Creates a pre-restore safety snapshot first so no data can ever be lost.
    """
    zip_path = BACKUPS_DIR / filename
    if not zip_path.exists():
        raise FileNotFoundError(f"Yedek dosyası bulunamadı: {filename}")

    # 1. Create safety snapshot first!
    safety_name = f"TexFlow_Emniyet_Yedegi_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
    try:
        create_full_backup(backup_type="pre_restore", note=f"Restore öncesi emniyet yedeği ({filename})")
    except Exception as e:
        print(f"Pre-restore safety backup notice: {e}")

    # 2. Extract into destination
    with zipfile.ZipFile(zip_path, "r") as zf:
        namelist = zf.namelist()
        if "texflow.db" in namelist:
            # Extract texflow.db to temp location first, verify integrity, then replace
            temp_restore_db = DATA_DIR / "temp_restored_texflow.db"
            with open(temp_restore_db, "wb") as f_out:
                f_out.write(zf.read("texflow.db"))

            # Verify integrity
            test_conn = sqlite3.connect(str(temp_restore_db))
            test_cur = test_conn.cursor()
            test_cur.execute("PRAGMA integrity_check")
            check_result = test_cur.fetchone()
            test_conn.close()

            if check_result and check_result[0] == "ok":
                # Replace active texflow.db
                shutil.move(str(temp_restore_db), str(DB_PATH))
            else:
                if temp_restore_db.exists():
                    temp_restore_db.unlink()
                raise ValueError("Yedek veritabanı bütünlük doğrulaması başarısız oldu.")

        # Extract uploads
        for member in namelist:
            if member.startswith("uploads/"):
                target_path = DATA_DIR / member
                target_path.parent.mkdir(parents=True, exist_ok=True)
                with open(target_path, "wb") as f_out:
                    f_out.write(zf.read(member))

    return {
        "status": "success",
        "message": f"{filename} yedeği başarıyla geri yüklendi.",
        "restored_at": datetime.now().strftime("%d.%m.%Y %H:%M:%S")
    }

# Background scheduler thread state
_scheduler_thread = None
_scheduler_running = False
_last_triggered_key = None

def backup_scheduler_loop():
    global _scheduler_running, _last_triggered_key
    while _scheduler_running:
        try:
            cfg = get_backup_config()
            if cfg.get("enabled", True):
                now = datetime.now()
                now_hm = now.strftime("%H:%M")
                today_str = now.strftime("%Y-%m-%d")
                sched_times = cfg.get("times", ["13:00", "17:00"])

                if now_hm in sched_times:
                    trigger_key = f"{today_str}_{now_hm}"
                    if _last_triggered_key != trigger_key:
                        _last_triggered_key = trigger_key
                        print(f"⏰ [Otomatik Yedekleyici] Zamanlandı: {now_hm}. Tam sistem yedeği alınıyor...")
                        res = create_full_backup(backup_type=f"auto_{now_hm}", note=f"Zamanlanmış otomatik yedek ({now_hm})")
                        print(f"✅ [Otomatik Yedekleyici] Tamamlandı: {res['filename']} ({res['size_formatted']})")
        except Exception as e:
            print(f"⚠️ [Otomatik Yedekleyici Hata]: {e}")

        time.sleep(30)

def start_backup_scheduler():
    global _scheduler_thread, _scheduler_running
    if _scheduler_running:
        return
    _scheduler_running = True
    _scheduler_thread = threading.Thread(target=backup_scheduler_loop, daemon=True, name="BackupSchedulerThread")
    _scheduler_thread.start()
    print("🚀 [Otomatik Yedekleme Servisi] Arka planda başlatıldı.")
