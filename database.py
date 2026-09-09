"""
TexFlow - Database Layer
Comprehensive Multi-tenant, RBAC, Dynamic Menu, Audit Logs, and Master Production Sheet Database
"""

import sqlite3
import json
import os
import hashlib
from datetime import datetime, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
UPLOADS_DIR = DATA_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
DB_PATH = DATA_DIR / "texflow.db"

# FabricTag Database Path (Portable: checks neighboring fabric-label-system first)
_ft_local = BASE_DIR.parent / "fabric-label-system" / "database.db"
if _ft_local.exists():
    FABRICTAG_DB_PATH = _ft_local
else:
    FABRICTAG_DB_PATH = Path(os.environ.get("FABRICTAG_DB_PATH", r"C:\Users\ASLI CELIK\.gemini\antigravity\scratch\fabric-label-system\database.db"))

def get_db():
    conn = sqlite3.connect(str(DB_PATH), timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    conn.execute("PRAGMA busy_timeout = 30000")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Tenants / Companies
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        license_key TEXT,
        license_expires_at TEXT,
        is_active INTEGER DEFAULT 1,
        max_users INTEGER DEFAULT 10,
        custom_settings_json TEXT DEFAULT '{}',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 2. Users & Roles
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'merchandiser', 
        permissions_json TEXT DEFAULT '{}',
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
    )
    """)

    # 3. Dynamic Menus
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dynamic_menus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER,
        menu_key TEXT NOT NULL,
        title_tr TEXT NOT NULL,
        title_en TEXT,
        icon TEXT DEFAULT 'layout-dashboard',
        path TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        is_visible INTEGER DEFAULT 1,
        allowed_roles_json TEXT DEFAULT '["admin","superadmin","merchandiser"]',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
    )
    """)

    # 4. Orders (PO Master)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER DEFAULT 1,
        po_number TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        brand TEXT,
        season TEXT,
        order_date TEXT,
        delivery_date TEXT,
        delivery_terms TEXT,
        payment_terms TEXT,
        total_quantity INTEGER DEFAULT 0,
        total_amount REAL DEFAULT 0.0,
        currency TEXT DEFAULT 'EUR',
        status TEXT DEFAULT 'Yeni', 
        notes TEXT,
        raw_file_name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
    )
    """)

    # 5. Styles / Models (Her Renk/Varyant Ayrı Satır)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS styles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        company_id INTEGER DEFAULT 1,
        style_no TEXT NOT NULL,
        description TEXT,
        category_code TEXT,
        fabric_composition TEXT,
        fabric_article TEXT,
        fabric_type TEXT,
        color_code TEXT,
        color_name TEXT,
        unit_price REAL DEFAULT 0.0,
        total_quantity INTEGER DEFAULT 0,
        total_amount REAL DEFAULT 0.0,
        currency TEXT DEFAULT 'EUR',
        
        -- Kumaş & Pastal Planlama
        unit_meters TEXT,
        unit_grams TEXT,
        fabric_wastage_percent REAL DEFAULT 5.0,
        fabric_order_unit TEXT DEFAULT 'M',
        fabric_order_manual_override INTEGER DEFAULT 0,
        sms_unit_meters TEXT,
        pps_unit_meters TEXT,
        fabric_width TEXT,
        fabric_order_status TEXT,
        fabric_ordered INTEGER DEFAULT 0,
        fabric_ordered_meters REAL DEFAULT 0.0,
        fabric_arrival_date TEXT,
        fabric_received_meters REAL DEFAULT 0.0,


        
        -- Numune & Onay Checkbox'ları
        pps_sent INTEGER DEFAULT 0,
        shipping_sample_sent INTEGER DEFAULT 0,
        production_approved INTEGER DEFAULT 0,
        
        -- Aksesuarlar
        accessory_1 TEXT,
        accessory_2 TEXT,
        accessory_3 TEXT,
        accessory_4 TEXT,
        
        status TEXT DEFAULT 'Hazırlık',
        custom_fields_json TEXT DEFAULT '{}',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
    )
    """)

    # 6. Size Distributions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS size_distributions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        style_id INTEGER NOT NULL,
        label_brand TEXT,
        size_name TEXT NOT NULL,
        quantity INTEGER DEFAULT 0,
        ratio INTEGER DEFAULT 1,
        cut_quantity INTEGER DEFAULT 0,
        sewn_quantity INTEGER DEFAULT 0,
        packed_quantity INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY(style_id) REFERENCES styles(id) ON DELETE CASCADE
    )
    """)

    # 7. Audit Logs (Değişiklik Tarihçesi - Kim, Ne Zaman, Hangi Değeri Ne Yaptı?)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        style_id INTEGER NOT NULL,
        order_id INTEGER,
        user_id INTEGER,
        user_name TEXT NOT NULL,
        field_name TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(style_id) REFERENCES styles(id) ON DELETE CASCADE
    )
    """)

    # 8. Production Status Logs (WhatsApp Tarzı Süreç & Müşteri Notları)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS production_status_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        style_id INTEGER NOT NULL,
        user_id INTEGER,
        user_name TEXT,
        log_date TEXT DEFAULT CURRENT_TIMESTAMP,
        category TEXT DEFAULT 'Genel',
        title TEXT,
        message TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(style_id) REFERENCES styles(id) ON DELETE CASCADE
    )
    """)

    # 9. Fabric Links (FabricTag ile Eşleşen Kumaşlar)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fabric_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        style_id INTEGER NOT NULL,
        fabrictag_id INTEGER,
        fabric_code TEXT,
        fabric_name TEXT,
        composition TEXT,
        supplier TEXT,
        required_meters REAL DEFAULT 0.0,
        stock_meters REAL DEFAULT 0.0,
        status TEXT DEFAULT 'Eşlendi',
        matched_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(style_id) REFERENCES styles(id) ON DELETE CASCADE
    )
    """)

    # Safe migrations for cut and shipping tracking
    cursor.execute("PRAGMA table_info(styles)")
    style_cols = [r[1] for r in cursor.fetchall()]
    if "cut_meters" not in style_cols:
        cursor.execute("ALTER TABLE styles ADD COLUMN cut_meters REAL DEFAULT 0.0")
    if "actual_unit_meters" not in style_cols:
        cursor.execute("ALTER TABLE styles ADD COLUMN actual_unit_meters REAL DEFAULT 0.0")
    if "cutting_date" not in style_cols:
        cursor.execute("ALTER TABLE styles ADD COLUMN cutting_date TEXT")
    if "shipping_date" not in style_cols:
        cursor.execute("ALTER TABLE styles ADD COLUMN shipping_date TEXT")

    cursor.execute("PRAGMA table_info(size_distributions)")
    size_cols = [r[1] for r in cursor.fetchall()]
    if "shipped_quantity" not in size_cols:
        cursor.execute("ALTER TABLE size_distributions ADD COLUMN shipped_quantity INTEGER DEFAULT 0")

    # Safe menu insertion for yukleme_adetleri
    cursor.execute("SELECT COUNT(*) FROM dynamic_menus WHERE menu_key = 'yukleme_adetleri'")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO dynamic_menus (company_id, menu_key, title_tr, title_en, icon, path, sort_order, is_visible, allowed_roles_json)
        VALUES (1, 'yukleme_adetleri', 'Yükleme Adetleri', 'Shipment Quantities', 'truck', '/yukleme-adetleri', 6, 1, '["superadmin","admin","merchandiser","cutting","shipping"]')
        """)
        # Push subsequent menus down
        cursor.execute("UPDATE dynamic_menus SET sort_order = sort_order + 1 WHERE menu_key != 'yukleme_adetleri' AND sort_order >= 6")

    # Default Seed Data if empty
    cursor.execute("SELECT COUNT(*) FROM companies")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO companies (name, code, license_key, license_expires_at, is_active)
        VALUES ('Elite Tekstil İmalat Sanayi', 'ELITE-01', 'TEX-MASTER-PRO-2030', '2030-12-31', 1)
        """)
        company_id = cursor.lastrowid

        # Superadmin
        cursor.execute("""
        INSERT INTO users (company_id, username, email, password_hash, full_name, role)
        VALUES (NULL, 'superadmin', 'super@texflow.app', ?, 'Süper Yönetici (Master Developer)', 'superadmin')
        """, (hash_password('admin123!'),))

        # Admin
        cursor.execute("""
        INSERT INTO users (company_id, username, email, password_hash, full_name, role)
        VALUES (?, 'yonetici', 'yonetici@elitetekstil.com', ?, 'Aslı Çelik (Firma Yöneticisi)', 'admin')
        """, (company_id, hash_password('123456'),))

        # Merchandiser
        cursor.execute("""
        INSERT INTO users (company_id, username, email, password_hash, full_name, role)
        VALUES (?, 'merchandiser', 'mt@elitetekstil.com', ?, 'Müşteri Temsilcisi', 'merchandiser')
        """, (company_id, hash_password('123456'),))

        # Kesimhane
        cursor.execute("""
        INSERT INTO users (company_id, username, email, password_hash, full_name, role)
        VALUES (?, 'kesimhane', 'kesim@elitetekstil.com', ?, 'Kesim Şefi', 'cutting')
        """, (company_id, hash_password('123456'),))

        # Depo
        cursor.execute("""
        INSERT INTO users (company_id, username, email, password_hash, full_name, role)
        VALUES (?, 'depo', 'depo@elitetekstil.com', ?, 'Kumaş Depo Sorumlusu', 'fabric_warehouse')
        """, (company_id, hash_password('123456'),))

        # Default Menus
        default_menus = [
            ("dashboard", "Genel Bakış / Dashboard", "Dashboard", "layout-dashboard", "/", 1, '["superadmin","admin","merchandiser","cutting","fabric_warehouse","sewing"]'),
            ("carsaf_liste", "Üretim Çarşaf Listesi", "Master Production Sheet", "table-properties", "/carsaf", 2, '["superadmin","admin","merchandiser","cutting","fabric_warehouse"]'),
            ("siparis_yukle", "Sipariş Yükle (PDF/Excel)", "Import Order (PDF/Excel)", "file-up", "/siparis-yukle", 3, '["superadmin","admin","merchandiser"]'),
            ("fabrictag_entegrasyon", "FabricTag Kumaş Deposu", "FabricTag Swatches", "layers", "/fabrictag", 4, '["superadmin","admin","merchandiser","fabric_warehouse"]'),
            ("kesimhane", "Kesimhane & Pastal Föyü", "Cutting Floor", "scissors", "/kesimhane", 5, '["superadmin","admin","cutting"]'),
            ("audit_logs", "Değişiklik Tarihçesi (Audit Log)", "Audit Logs", "history", "/audit-logs", 6, '["superadmin","admin","merchandiser"]'),
            ("menu_yonetimi", "Menü & Alan Özelleştirme", "Custom Fields & Menu Config", "sliders-horizontal", "/ayarlar/menuler", 7, '["superadmin","admin"]'),
            ("superadmin_panel", "Süper Admin & Lisanslama", "Super Admin & Licensing", "shield-alert", "/superadmin", 99, '["superadmin"]')
        ]

        for key, tr, en, icon, path, order, roles in default_menus:
            cursor.execute("""
            INSERT INTO dynamic_menus (company_id, menu_key, title_tr, title_en, icon, path, sort_order, is_visible, allowed_roles_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
            """, (company_id, key, tr, en, icon, path, order, roles))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database updated successfully.")
