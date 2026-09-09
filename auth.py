"""
TexFlow - Authentication & RBAC Layer
Persistent session token management (in SQLite), password verification, role permissions
"""

import json
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from database import get_db, hash_password

ROLE_PERMISSIONS = {
    "masterdeveloper": {
        "description": "Master Developer (Süper Yönetici)",
        "can_manage_licenses": True,
        "can_manage_companies": True,
        "can_view_all_data": True,
        "can_edit_all_data": True,
        "can_create_orders": True,
        "can_delete_orders": True,
        "can_view_financials": True,
        "can_view_costs": True,
        "can_edit_costs": True,
        "can_view_dashboard": True,
        "can_edit_menus": True,
        "can_manage_users": True,
        "can_view_orders": True,
        "can_view_fabrictag": True,
    },
    "superadmin": {
        "description": "Master Developer (Süper Yönetici)",
        "can_manage_licenses": True,
        "can_manage_companies": True,
        "can_view_all_data": True,
        "can_edit_all_data": True,
        "can_create_orders": True,
        "can_delete_orders": True,
        "can_view_financials": True,
        "can_view_costs": True,
        "can_edit_costs": True,
        "can_view_dashboard": True,
        "can_edit_menus": True,
        "can_manage_users": True,
        "can_view_orders": True,
        "can_view_fabrictag": True,
    },
    "admin": {
        "description": "Firma Sahibi / Yöneticisi",
        "can_manage_licenses": False,
        "can_manage_companies": False,
        "can_view_all_data": True,
        "can_edit_all_data": True,
        "can_create_orders": True,
        "can_delete_orders": True,
        "can_view_financials": True,
        "can_view_costs": True,
        "can_edit_costs": True,
        "can_view_dashboard": True,
        "can_edit_menus": True,
        "can_manage_users": True,
        "can_view_orders": True,
        "can_view_fabrictag": True,
    },
    "merchandiser": {
        "description": "Müşteri Temsilcisi (Merchandiser)",
        "can_manage_licenses": False,
        "can_manage_companies": False,
        "can_view_all_data": True,
        "can_edit_all_data": True,
        "can_create_orders": True,
        "can_delete_orders": False,
        "can_view_financials": False,
        "can_view_costs": False,
        "can_edit_costs": False,
        "can_view_dashboard": True,
        "can_edit_menus": True,
        "can_manage_users": False,
        "can_view_orders": True,
        "can_view_fabrictag": True,
    },
    "cutting": {
        "description": "Kesimhane Sorumlusu",
        "can_manage_licenses": False,
        "can_manage_companies": False,
        "can_view_all_data": False,
        "can_edit_all_data": False,
        "can_create_orders": False,
        "can_delete_orders": False,
        "can_view_financials": False,
        "can_view_costs": False,
        "can_edit_costs": False,
        "can_view_dashboard": False,
        "can_edit_menus": True,
        "can_manage_users": False,
        "can_view_orders": True,
        "can_view_fabrictag": True,
    },
    "fabric_warehouse": {
        "description": "Kumaş & Aksesuar Depo Sorumlusu",
        "can_manage_licenses": False,
        "can_manage_companies": False,
        "can_view_all_data": False,
        "can_edit_all_data": False,
        "can_create_orders": False,
        "can_delete_orders": False,
        "can_view_financials": False,
        "can_view_costs": False,
        "can_edit_costs": False,
        "can_view_dashboard": False,
        "can_edit_menus": True,
        "can_manage_users": False,
        "can_view_orders": True,
        "can_view_fabrictag": True,
    },
    "user": {
        "description": "Standart Yetkilendirilmiş Kullanıcı",
        "can_manage_licenses": False,
        "can_manage_companies": False,
        "can_view_all_data": False,
        "can_edit_all_data": False,
        "can_create_orders": False,
        "can_delete_orders": False,
        "can_view_financials": False,
        "can_view_costs": False,
        "can_edit_costs": False,
        "can_view_dashboard": False,
        "can_edit_menus": True,
        "can_manage_users": False,
        "can_view_orders": True,
        "can_view_fabrictag": True,
    }
}

def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    clean_u = (username or "").strip().lower()
    pwd_hash = hash_password(password)
    
    # Check regular user or Master Developer alias
    if clean_u in ["masterdeveloper", "superadmin"]:
        cursor.execute("""
        SELECT u.*, c.name as company_name, c.is_active as company_active, c.license_expires_at 
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        WHERE (LOWER(u.username) IN ('masterdeveloper', 'superadmin') OR u.role IN ('masterdeveloper', 'superadmin'))
          AND u.is_active = 1
        ORDER BY u.id ASC
        LIMIT 1
        """)
        row = cursor.fetchone()
        if row:
            u_dict = dict(row)
            # Accept stored password, 123456, or admin123!
            accepted_hashes = [u_dict.get("password_hash"), hash_password("123456"), hash_password("admin123!")]
            if pwd_hash not in accepted_hashes:
                conn.close()
                return None
        else:
            conn.close()
            return None
    else:
        cursor.execute("""
        SELECT u.*, c.name as company_name, c.is_active as company_active, c.license_expires_at 
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        WHERE (LOWER(u.username) = ? OR LOWER(u.email) = ?) AND u.password_hash = ? AND u.is_active = 1
        """, (clean_u, clean_u, pwd_hash))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return None
    
    user_dict = dict(row)
    del user_dict['password_hash']
    
    # Generate token and store persistently
    token = secrets.token_hex(32)
    
    # Build effective permissions
    role = user_dict.get("role", "user")
    perms = dict(ROLE_PERMISSIONS.get(role, {}))
    if user_dict.get("permissions_json"):
        try:
            custom_perms = json.loads(user_dict["permissions_json"])
            if isinstance(custom_perms, dict):
                perms.update(custom_perms)
        except:
            pass
            
    if role in ["superadmin", "masterdeveloper"]:
        for k in ROLE_PERMISSIONS["masterdeveloper"]:
            perms[k] = True

    perms["can_edit_menus"] = True
    perms["can_view_orders"] = True
    perms["can_view_fabrictag"] = True

    session_data = {
        "token": token,
        "user_id": user_dict["id"],
        "company_id": user_dict["company_id"],
        "username": user_dict["username"],
        "full_name": user_dict["full_name"],
        "role": user_dict["role"],
        "company_name": user_dict.get("company_name", "TexFlow"),
        "permissions": perms,
        "expires_at": (datetime.now() + timedelta(days=30)).isoformat()
    }
    
    # Create sessions table if not exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER,
        session_json TEXT,
        expires_at TIMESTAMP
    )
    """)
    cursor.execute("""
    INSERT OR REPLACE INTO user_sessions (token, user_id, session_json, expires_at)
    VALUES (?, ?, ?, ?)
    """, (token, user_dict["id"], json.dumps(session_data), session_data["expires_at"]))
    
    conn.commit()
    conn.close()
    return session_data

def get_current_user(token: Optional[str]) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER,
        session_json TEXT,
        expires_at TIMESTAMP
    )
    """)
    cursor.execute("SELECT session_json, expires_at FROM user_sessions WHERE token = ?", (token,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return None
    
    sess_json, exp_str = row[0], row[1]
    if datetime.fromisoformat(exp_str) < datetime.now():
        conn.close()
        return None
        
    sess = json.loads(sess_json)
    
    # Fetch real-time user record from DB for live permissions & state
    cursor.execute("""
    SELECT u.*, c.name as company_name 
    FROM users u 
    LEFT JOIN companies c ON u.company_id = c.id 
    WHERE u.id = ?
    """, (sess.get("user_id"),))
    u_row = cursor.fetchone()
    conn.close()
    
    if u_row:
        u_dict = dict(u_row)
        if not u_dict.get("is_active"):
            return None
        sess["username"] = u_dict["username"]
        sess["full_name"] = u_dict["full_name"]
        sess["role"] = u_dict["role"]
        sess["company_name"] = u_dict.get("company_name", "TexFlow")
        
        role = u_dict.get("role", "user")
        eff_perms = dict(ROLE_PERMISSIONS.get(role, {}))
        if u_dict.get("permissions_json"):
            try:
                custom_perms = json.loads(u_dict["permissions_json"])
                if isinstance(custom_perms, dict):
                    eff_perms.update(custom_perms)
            except:
                pass
                
        if role in ["superadmin", "masterdeveloper"]:
            for k in ROLE_PERMISSIONS["masterdeveloper"]:
                eff_perms[k] = True

        eff_perms["can_edit_menus"] = True
        eff_perms["can_view_orders"] = True
        eff_perms["can_view_fabrictag"] = True

        sess["permissions"] = eff_perms

    return sess

def logout_user(token: str):
    if not token:
        return
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM user_sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()
