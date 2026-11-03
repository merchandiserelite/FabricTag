import os
import sys
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

import json
import subprocess
import shutil
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

import backup_manager

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
CONFIG_FILE = DATA_DIR / "system_config.json"

DEFAULT_SYSTEM_CONFIG = {
    "version": "v2.9.3",
    "channel": "dev",                 # "stable" (main branch for clients) or "dev" (texflow branch for developer)
    "remote_repo": "https://github.com/merchandiserelite/FabricTag.git",
    "auto_check_on_startup": True,
    "last_check_time": None,
    "last_update_time": None,
    "restart_required": False
}

_update_lock = threading.Lock()
_is_updating = False

def get_system_config() -> Dict[str, Any]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not CONFIG_FILE.exists():
        save_system_config(DEFAULT_SYSTEM_CONFIG)
        return DEFAULT_SYSTEM_CONFIG.copy()
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            cfg = json.load(f)
            for k, v in DEFAULT_SYSTEM_CONFIG.items():
                if k not in cfg:
                    cfg[k] = v
            return cfg
    except Exception as e:
        print(f"Error reading system config: {e}")
        return DEFAULT_SYSTEM_CONFIG.copy()

def save_system_config(cfg: Dict[str, Any]) -> bool:
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving system config: {e}")
        return False

def get_git_info() -> Dict[str, Any]:
    info = {
        "is_git_repo": False,
        "current_branch": "unknown",
        "current_commit": "unknown",
        "current_commit_full": "",
        "commit_date": "",
        "commit_message": ""
    }
    try:
        # Check git
        branch = subprocess.check_output(["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=str(BASE_DIR), text=True, stderr=subprocess.DEVNULL).strip()
        short_sha = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=str(BASE_DIR), text=True, stderr=subprocess.DEVNULL).strip()
        full_sha = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=str(BASE_DIR), text=True, stderr=subprocess.DEVNULL).strip()
        msg = subprocess.check_output(["git", "log", "-1", "--format=%s", "HEAD"], cwd=str(BASE_DIR), text=True, stderr=subprocess.DEVNULL).strip()
        cdate = subprocess.check_output(["git", "log", "-1", "--format=%cd", "--date=format:%Y-%m-%d %H:%M", "HEAD"], cwd=str(BASE_DIR), text=True, stderr=subprocess.DEVNULL).strip()

        info.update({
            "is_git_repo": True,
            "current_branch": branch,
            "current_commit": short_sha,
            "current_commit_full": full_sha,
            "commit_date": cdate,
            "commit_message": msg
        })
    except Exception as e:
        pass
    return info

def get_target_branch(cfg: Optional[Dict[str, Any]] = None) -> str:
    if cfg is None:
        cfg = get_system_config()
    channel = cfg.get("channel", "stable")
    if channel == "dev":
        return "texflow"
    return "main"

def check_for_updates() -> Dict[str, Any]:
    cfg = get_system_config()
    git_info = get_git_info()
    target_branch = get_target_branch(cfg)

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    result = {
        "status": "success",
        "update_available": False,
        "commits_behind": 0,
        "channel": cfg.get("channel", "stable"),
        "target_branch": target_branch,
        "current_version": cfg.get("version", "v2.9.2"),
        "current_commit": git_info.get("current_commit", ""),
        "current_commit_message": git_info.get("commit_message", ""),
        "remote_commit": "",
        "remote_commit_message": "",
        "remote_commit_date": "",
        "last_checked": now_str,
        "restart_required": cfg.get("restart_required", False),
        "message": "Sisteminiz güncel."
    }

    if not git_info.get("is_git_repo"):
        result["status"] = "error"
        result["message"] = "Git deposu bulunamadı."
        return result

    try:
        # Fetch remote target branch
        subprocess.run(["git", "fetch", "origin", target_branch, "--quiet"], cwd=str(BASE_DIR), check=True, timeout=15)
        
        # Check commits behind
        behind = subprocess.check_output(
            ["git", "rev-list", "--count", f"HEAD..origin/{target_branch}"],
            cwd=str(BASE_DIR),
            text=True,
            stderr=subprocess.DEVNULL
        ).strip()
        count = int(behind) if behind.isdigit() else 0

        remote_short = subprocess.check_output(
            ["git", "rev-parse", "--short", f"origin/{target_branch}"],
            cwd=str(BASE_DIR),
            text=True,
            stderr=subprocess.DEVNULL
        ).strip()

        remote_msg = subprocess.check_output(
            ["git", "log", "-1", "--format=%s", f"origin/{target_branch}"],
            cwd=str(BASE_DIR),
            text=True,
            stderr=subprocess.DEVNULL
        ).strip()

        remote_date = subprocess.check_output(
            ["git", "log", "-1", "--format=%cd", "--date=format:%Y-%m-%d %H:%M", f"origin/{target_branch}"],
            cwd=str(BASE_DIR),
            text=True,
            stderr=subprocess.DEVNULL
        ).strip()

        result["remote_commit"] = remote_short
        result["remote_commit_message"] = remote_msg
        result["remote_commit_date"] = remote_date
        result["commits_behind"] = count

        if count > 0:
            result["update_available"] = True
            result["message"] = f"Yeni güncelleme mevcut ({count} yeni geliştirme). En son: {remote_msg}"
        else:
            result["update_available"] = False
            result["message"] = "Sisteminiz en son sürümde, güncel."

        # Save last check time
        cfg["last_check_time"] = now_str
        save_system_config(cfg)

    except subprocess.TimeoutExpired:
        result["status"] = "warning"
        result["message"] = "Güncelleme sunucusuna erişim zaman aşımına uğradı."
    except Exception as e:
        result["status"] = "error"
        result["message"] = f"Güncelleme denetleme hatası: {str(e)}"

    return result

def apply_update() -> Dict[str, Any]:
    global _is_updating
    if not _update_lock.acquire(blocking=False):
        return {"status": "error", "message": "Şu anda başka bir güncelleme işlemi devam ediyor."}

    _is_updating = True
    try:
        cfg = get_system_config()
        target_branch = get_target_branch(cfg)

        # 1. STEP: Pre-update Safety Database Backup
        backup_res = None
        try:
            backup_res = backup_manager.create_full_backup(
                backup_type="pre_update",
                note=f"Otomatik sürüm güncellemesi öncesi tam güvenlik yedeği ({target_branch})"
            )
        except Exception as be:
            print(f"Warning: Safety backup failed: {be}")

        # Also direct copy of texflow.db
        db_file = DATA_DIR / "texflow.db"
        if db_file.exists():
            backups_dir = DATA_DIR / "backups"
            backups_dir.mkdir(parents=True, exist_ok=True)
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            shutil.copy2(db_file, backups_dir / f"texflow_auto_preupdate_{ts}.db")

        # 2. STEP: Git Fetch and Pull / Reset
        # Ensure working tree preserves local untracked data/uploads
        subprocess.run(["git", "fetch", "origin", target_branch, "--quiet"], cwd=str(BASE_DIR), check=True, timeout=25)
        
        # Merge or pull
        pull_res = subprocess.run(["git", "pull", "origin", target_branch], cwd=str(BASE_DIR), capture_output=True, text=True, timeout=30)
        if pull_res.returncode != 0:
            # Fallback if unstaged changes in tracked files
            subprocess.run(["git", "checkout", "origin/" + target_branch, "--", "static", "app.py", "database.py", "backup_manager.py", "update_manager.py"], cwd=str(BASE_DIR))

        # 3. STEP: Python Requirements Check
        req_file = BASE_DIR / "requirements.txt"
        if req_file.exists():
            try:
                subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt", "--quiet"], cwd=str(BASE_DIR), timeout=45)
            except Exception as pe:
                print(f"Pip install warning: {pe}")

        # 4. STEP: Update Config
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cfg["last_update_time"] = now_str
        cfg["restart_required"] = True
        save_system_config(cfg)

        new_git = get_git_info()
        return {
            "status": "success",
            "message": f"Güncelleme başarıyla indirildi ve yüklendi! (Commit: {new_git.get('current_commit')})",
            "restart_required": True,
            "backup_created": bool(backup_res and backup_res.get("status") == "success"),
            "new_commit": new_git.get("current_commit"),
            "new_commit_message": new_git.get("commit_message")
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Güncelleme uygulanırken hata oluştu: {str(e)}"
        }
    finally:
        _is_updating = False
        _update_lock.release()

def trigger_server_restart():
    """Restarts the server process cleanly on Windows by spawning a detached helper."""
    def _do_restart():
        time.sleep(1.2)
        cfg = get_system_config()
        cfg["restart_required"] = False
        save_system_config(cfg)
        
        start_script = BASE_DIR / "start_server.py"
        # Spawn detached process
        if sys.platform == "win32":
            subprocess.Popen([sys.executable, str(start_script)], cwd=str(BASE_DIR), creationflags=subprocess.CREATE_NEW_CONSOLE | subprocess.DETACHED_PROCESS)
        else:
            subprocess.Popen([sys.executable, str(start_script)], cwd=str(BASE_DIR), start_new_session=True)
        # Exit current process
        os._exit(0)

    t = threading.Thread(target=_do_restart, daemon=True)
    t.start()
    return {"status": "success", "message": "Sunucu yeniden başlatılıyor. Lütfen 3-5 saniye sonra sayfayı yenileyin."}
