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
import sys
from typing import List, Dict, Any, Optional

if getattr(sys, 'frozen', False):
    BASE_DIR = Path(sys.executable).resolve().parent
else:
    BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
UPLOADS_DIR = DATA_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
DB_PATH = DATA_DIR / "texflow.db"

# FabricTag Database Path (Portable: checks neighboring FabricTag package or dev folder)
_ft_neighbor_pkg = BASE_DIR.parent / "FabricTag" / "database.db"
_ft_neighbor_dev = BASE_DIR.parent / "fabric-label-system" / "database.db"
if _ft_neighbor_pkg.exists():
    FABRICTAG_DB_PATH = _ft_neighbor_pkg
elif _ft_neighbor_dev.exists():
    FABRICTAG_DB_PATH = _ft_neighbor_dev
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
        image_url TEXT,
        image_url_2 TEXT,
        channel TEXT DEFAULT '',
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

    # 10. Freeform Cost Studies (Serbest Fiyat Çalışmaları)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS free_cost_studies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER DEFAULT 1,
        season TEXT,
        customer_name TEXT,
        brand TEXT,
        model_no TEXT,
        color TEXT,
        fabric_supplier TEXT,
        fabric_name TEXT,
        fabric_code TEXT,
        fabric_color TEXT,
        fabric_width TEXT,
        cost_data_json TEXT DEFAULT '{}',
        kumas_total_tl REAL DEFAULT 0.0,
        imalat_total_tl REAL DEFAULT 0.0,
        unit_cost_tl REAL DEFAULT 0.0,
        unit_price_target REAL DEFAULT 0.0,
        target_currency TEXT DEFAULT 'EUR',
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 11. Carton Label Templates (Müşteriye Özel Koli Üstü Şablonları & Sayfa Yapılandırmaları)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS carton_label_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER DEFAULT 1,
        customer_name TEXT NOT NULL,
        template_name TEXT NOT NULL,
        paper_size TEXT DEFAULT 'A4',          -- 'A4', 'A5', 'Argox_100x150', 'Argox_100x100', 'Argox_80x50', 'custom'
        orientation TEXT DEFAULT 'landscape',   -- 'landscape', 'portrait'
        width_mm REAL DEFAULT 297,
        height_mm REAL DEFAULT 210,
        items_per_page INTEGER DEFAULT 2,      -- 1 or 2
        border_style TEXT DEFAULT 'solid',      -- 'solid', 'dashed', 'double', 'none'
        border_width INTEGER DEFAULT 1,         -- 1, 2, 3
        show_grid_lines INTEGER DEFAULT 1,      -- 1 or 0
        margin_mm INTEGER DEFAULT 6,
        font_scale REAL DEFAULT 1.0,           -- 0.85, 1.0, 1.15
        layout_json TEXT DEFAULT '{}',
        is_default INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Default Seed Data for Carton Templates if empty
    cursor.execute("SELECT COUNT(*) FROM carton_label_templates")
    if cursor.fetchone()[0] == 0:
        default_anna_layout = json.dumps({
            "header_title": "Anna Van Toor",
            "address_line1": "Energieweg 35",
            "address_line2": "4231 DJ Meerkerk",
            "address_line3": "The Netherlands",
            "brand": "BRAND: ANNA",
            "measurements": "60X40X30",
            "poka_badge_enabled": True,
            "dual_variant_enabled": True,
            "show_barcode": False,
            "fields": [
                {"id": "header", "label": "Müşteri & Adres Başlığı", "key": "header_block", "visible": True},
                {"id": "brand", "label": "Marka Bilgisi", "key": "brand", "visible": True},
                {"id": "size_table", "label": "Beden & Adet Tablosu (x2)", "key": "size_table", "visible": True},
                {"id": "channel", "label": "Kanal Bilgisi (CARTON NO Üstü)", "key": "channel", "visible": True},
                {"id": "carton_no", "label": "Koli Numarası (CARTON NO ... OF ...)", "key": "carton_no", "visible": True},
                {"id": "gross_weight", "label": "Brüt Ağırlık (GROSS WEIGHT)", "key": "gross_weight", "visible": True},
                {"id": "measurements", "label": "Koli Ebatları (MEASUREMENTS - GROSS WEIGHT Altı)", "key": "measurements", "visible": True},
                {"id": "poka_badge", "label": "Poka-Yoke Renk Rozeti (102mm Çap)", "key": "poka_badge", "visible": True}
            ]
        }, ensure_ascii=False)

        default_argox_layout = json.dumps({
            "header_title": "STANDART LOJİSTİK KOLİ ETİKETİ",
            "address_line1": "",
            "address_line2": "",
            "address_line3": "",
            "brand": "",
            "measurements": "60X40X30",
            "poka_badge_enabled": True,
            "dual_variant_enabled": False,
            "show_barcode": True,
            "fields": [
                {"id": "header", "label": "Müşteri & Başlık", "key": "header_block", "visible": True},
                {"id": "channel", "label": "Kanal / Sevkiyat Hedefi", "key": "channel_badge", "visible": True},
                {"id": "size_table", "label": "Beden & Adet Dağılımı", "key": "size_table", "visible": True},
                {"id": "carton_no", "label": "Koli No", "key": "carton_no", "visible": True},
                {"id": "gross_weight", "label": "Brüt Ağırlık", "key": "gross_weight", "visible": True},
                {"id": "barcode", "label": "Koli Barkodu", "key": "barcode", "visible": True}
            ]
        }, ensure_ascii=False)

        default_a5_layout = json.dumps({
            "header_title": "A5 LOJİSTİK KOLİ ETİKETİ",
            "address_line1": "",
            "address_line2": "",
            "address_line3": "",
            "brand": "",
            "measurements": "60X40X30",
            "poka_badge_enabled": True,
            "dual_variant_enabled": False,
            "show_barcode": True,
            "fields": [
                {"id": "header", "label": "Müşteri & Başlık", "key": "header_block", "visible": True},
                {"id": "channel", "label": "Sevkiyat Kanalı", "key": "channel_badge", "visible": True},
                {"id": "size_table", "label": "Beden Tablosu", "key": "size_table", "visible": True},
                {"id": "carton_no", "label": "Koli No", "key": "carton_no", "visible": True},
                {"id": "gross_weight", "label": "Ağırlık", "key": "gross_weight", "visible": True}
            ]
        }, ensure_ascii=False)

        cursor.execute("""
        INSERT INTO carton_label_templates 
        (company_id, customer_name, template_name, paper_size, orientation, width_mm, height_mm, items_per_page, border_style, border_width, show_grid_lines, margin_mm, font_scale, layout_json, is_default)
        VALUES (1, 'Anna van Toor B.V.', 'Anna Van Toor A4 Yatay (x2 Çiftli)', 'A4', 'landscape', 297, 210, 2, 'solid', 2, 1, 6, 1.0, ?, 1)
        """, (default_anna_layout,))

        cursor.execute("""
        INSERT INTO carton_label_templates 
        (company_id, customer_name, template_name, paper_size, orientation, width_mm, height_mm, items_per_page, border_style, border_width, show_grid_lines, margin_mm, font_scale, layout_json, is_default)
        VALUES (1, 'Standart / Genel', 'Argox / Termal Rulo 100x150 mm', 'Argox_100x150', 'portrait', 100, 150, 1, 'solid', 1, 1, 3, 0.95, ?, 1)
        """, (default_argox_layout,))

        cursor.execute("""
        INSERT INTO carton_label_templates 
        (company_id, customer_name, template_name, paper_size, orientation, width_mm, height_mm, items_per_page, border_style, border_width, show_grid_lines, margin_mm, font_scale, layout_json, is_default)
        VALUES (1, 'Standart / Genel', 'A5 Dikey Lojistik Koli Etiketi', 'A5', 'portrait', 148, 210, 1, 'solid', 1, 1, 5, 1.0, ?, 0)
        """, (default_a5_layout,))

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
    if "channel" not in style_cols:
        cursor.execute("ALTER TABLE styles ADD COLUMN channel TEXT DEFAULT ''")
    if "image_url" not in style_cols:
        cursor.execute("ALTER TABLE styles ADD COLUMN image_url TEXT")
    if "image_url_2" not in style_cols:
        cursor.execute("ALTER TABLE styles ADD COLUMN image_url_2 TEXT")

    cursor.execute("PRAGMA table_info(size_distributions)")
    size_cols = [r[1] for r in cursor.fetchall()]
    if "shipped_quantity" not in size_cols:
        cursor.execute("ALTER TABLE size_distributions ADD COLUMN shipped_quantity INTEGER DEFAULT 0")

    # Default Seed Data if empty (Seed company first to satisfy foreign keys)
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
        VALUES (?, 'depo', 'depo@elitetekstil.com', ?, 'Kumaş & Aksesuar Depo', 'warehouse')
        """, (company_id, hash_password('123456'),))

    cursor.execute("SELECT id FROM companies LIMIT 1")
    crow = cursor.fetchone()
    company_id = crow[0] if crow else 1

    # Ensure yonetici user exists
    cursor.execute("SELECT COUNT(*) FROM users WHERE username = 'yonetici'")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO users (company_id, username, email, password_hash, full_name, role)
        VALUES (?, 'yonetici', 'yonetici@elitetekstil.com', ?, 'Yıldıray (Firma Yöneticisi)', 'admin')
        """, (company_id, hash_password('123456'),))

    # Ensure ALL standard dynamic menus exist
    default_menus = [
        ("dashboard", "Genel Bakış / Dashboard", "Dashboard", "layout-dashboard", "/", 1, '["superadmin","admin","merchandiser","cutting","fabric_warehouse","sewing"]'),
        ("carsaf_liste", "Üretim Çarşaf Listesi", "Master Production Sheet", "table-properties", "/carsaf", 2, '["superadmin","admin","merchandiser","cutting","fabric_warehouse"]'),
        ("siparis_yukle", "Sipariş Yükle (PDF/Excel)", "Import Order (PDF/Excel)", "file-up", "/siparis-yukle", 3, '["superadmin","admin","merchandiser"]'),
        ("fabrictag_entegrasyon", "FabricTag Kumaş Deposu", "FabricTag Swatches", "layers", "/fabrictag", 4, '["superadmin","admin","merchandiser","fabric_warehouse"]'),
        ("kesimhane", "Kesimhane & Pastal Föyü", "Cutting Floor", "scissors", "/kesimhane", 5, '["superadmin","admin","cutting"]'),
        ("yukleme_adetleri", "Yükleme Adetleri", "Shipment Quantities", "truck", "/yukleme-adetleri", 6, '["superadmin","admin","merchandiser","cutting","shipping"]'),
        ("serbest_fiyat", "Serbest Fiyat Çalışması", "Freeform Costing", "calculator", "/serbest-fiyat", 7, '["superadmin","admin","merchandiser"]'),
        ("ceki_koli", "Çeki listesi ve koli üstü", "Packing List & Carton Labels", "package", "/ceki-koli", 8, '["superadmin","admin","merchandiser","cutting","shipping","warehouse"]'),
        ("numune_takip", "Numune & PPS Takibi", "Sample / PPS Tracking", "check-check", "/numuneler", 9, '["superadmin","admin","merchandiser"]'),
        ("audit_logs", "Değişiklik Tarihçesi (Audit Log)", "Audit Logs", "history", "/audit-logs", 10, '["superadmin","admin","merchandiser"]'),
        ("menu_yonetimi", "Menü & Alan Özelleştirme", "Custom Fields & Menu Config", "sliders-horizontal", "/ayarlar/menuler", 11, '["superadmin","admin"]'),
        ("kullanici_yonetimi", "Kullanıcı & Yetki Yönetimi", "User & Role Management", "users", "/ayarlar/kullanicilar", 12, '["superadmin","admin"]'),
        ("superadmin_panel", "Süper Admin & Lisanslama", "Super Admin & Licensing", "shield-alert", "/superadmin", 102, '["superadmin"]')
    ]
    for key, tr, en, icon, path, order, roles in default_menus:
        cursor.execute("SELECT COUNT(*) FROM dynamic_menus WHERE menu_key = ?", (key,))
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
            INSERT INTO dynamic_menus (company_id, menu_key, title_tr, title_en, icon, path, sort_order, is_visible, allowed_roles_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
            """, (company_id, key, tr, en, icon, path, order, roles))
        else:
            cursor.execute("UPDATE dynamic_menus SET is_visible = 1 WHERE menu_key = ? AND is_visible = 0", (key,))

    conn.commit()
    conn.close()


def get_carton_templates(company_id: int = 1, customer_name: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves all carton templates, optionally prioritizing or filtering by customer_name."""
    conn = get_db()
    cursor = conn.cursor()
    if customer_name and customer_name.strip():
        c_clean = customer_name.strip()
        cursor.execute("""
            SELECT id, company_id, customer_name, template_name, paper_size, orientation,
                   width_mm, height_mm, items_per_page, border_style, border_width,
                   show_grid_lines, margin_mm, font_scale, layout_json, is_default, created_at, updated_at
            FROM carton_label_templates
            WHERE company_id = ?
            ORDER BY 
                CASE 
                    WHEN LOWER(customer_name) = LOWER(?) THEN 0
                    WHEN LOWER(customer_name) LIKE LOWER(?) THEN 1
                    WHEN customer_name = 'Standart / Genel' THEN 2
                    ELSE 3
                END,
                is_default DESC, id ASC
        """, (company_id, c_clean, f"%{c_clean}%"))
    else:
        cursor.execute("""
            SELECT id, company_id, customer_name, template_name, paper_size, orientation,
                   width_mm, height_mm, items_per_page, border_style, border_width,
                   show_grid_lines, margin_mm, font_scale, layout_json, is_default, created_at, updated_at
            FROM carton_label_templates
            WHERE company_id = ?
            ORDER BY customer_name ASC, is_default DESC, id ASC
        """, (company_id,))
    
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        result.append({
            "id": r[0],
            "company_id": r[1],
            "customer_name": r[2],
            "template_name": r[3],
            "paper_size": r[4],
            "orientation": r[5],
            "width_mm": r[6],
            "height_mm": r[7],
            "items_per_page": r[8],
            "border_style": r[9],
            "border_width": r[10],
            "show_grid_lines": bool(r[11]),
            "margin_mm": r[12],
            "font_scale": r[13],
            "layout_json": json.loads(r[14]) if r[14] else {},
            "is_default": bool(r[15]),
            "created_at": r[16],
            "updated_at": r[17]
        })
    return result


def get_carton_template_by_id(template_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, company_id, customer_name, template_name, paper_size, orientation,
               width_mm, height_mm, items_per_page, border_style, border_width,
               show_grid_lines, margin_mm, font_scale, layout_json, is_default, created_at, updated_at
        FROM carton_label_templates
        WHERE id = ?
    """, (template_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        return None
    return {
        "id": r[0],
        "company_id": r[1],
        "customer_name": r[2],
        "template_name": r[3],
        "paper_size": r[4],
        "orientation": r[5],
        "width_mm": r[6],
        "height_mm": r[7],
        "items_per_page": r[8],
        "border_style": r[9],
        "border_width": r[10],
        "show_grid_lines": bool(r[11]),
        "margin_mm": r[12],
        "font_scale": r[13],
        "layout_json": json.loads(r[14]) if r[14] else {},
        "is_default": bool(r[15]),
        "created_at": r[16],
        "updated_at": r[17]
    }


def save_or_update_carton_template(data: Dict[str, Any]) -> int:
    conn = get_db()
    cursor = conn.cursor()
    t_id = data.get("id")
    layout_data = data.get("layout_json")
    if isinstance(layout_data, dict):
        layout_str = json.dumps(layout_data, ensure_ascii=False)
    elif isinstance(layout_data, str) and layout_data.strip():
        layout_str = layout_data.strip()
    else:
        layout_str = "{}"
    
    # Defaults
    customer_name = str(data.get("customer_name") or "Genel Müşteri").strip()
    template_name = str(data.get("template_name") or f"{customer_name} Şablonu").strip()
    paper_size = str(data.get("paper_size") or "A4").strip()
    orientation = str(data.get("orientation") or "landscape").strip()
    width_mm = float(data.get("width_mm", 297))
    height_mm = float(data.get("height_mm", 210))
    items_per_page = int(data.get("items_per_page", 2))
    border_style = str(data.get("border_style") or "solid").strip()
    border_width = int(data.get("border_width", 1))
    show_grid_lines = 1 if data.get("show_grid_lines", True) else 0
    margin_mm = int(data.get("margin_mm", 6))
    font_scale = float(data.get("font_scale", 1.0))
    is_default = 1 if data.get("is_default", False) else 0
    company_id = int(data.get("company_id", 1))

    if t_id:
        cursor.execute("""
            UPDATE carton_label_templates
            SET customer_name = ?, template_name = ?, paper_size = ?, orientation = ?,
                width_mm = ?, height_mm = ?, items_per_page = ?, border_style = ?,
                border_width = ?, show_grid_lines = ?, margin_mm = ?, font_scale = ?,
                layout_json = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (
            customer_name, template_name, paper_size, orientation,
            width_mm, height_mm, items_per_page, border_style,
            border_width, show_grid_lines, margin_mm, font_scale,
            layout_str, is_default, t_id
        ))
        row_id = t_id
    else:
        cursor.execute("""
            INSERT INTO carton_label_templates
            (company_id, customer_name, template_name, paper_size, orientation, width_mm, height_mm, items_per_page, border_style, border_width, show_grid_lines, margin_mm, font_scale, layout_json, is_default)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            company_id, customer_name, template_name, paper_size, orientation,
            width_mm, height_mm, items_per_page, border_style,
            border_width, show_grid_lines, margin_mm, font_scale,
            layout_str, is_default
        ))
        row_id = cursor.lastrowid

    conn.commit()
    conn.close()
    return row_id


def delete_carton_template(template_id: int) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM carton_label_templates WHERE id = ?", (template_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


if __name__ == "__main__":
    init_db()
    print("Database updated successfully.")

