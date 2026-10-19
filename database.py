import sqlite3
import csv
import os
import re
import shutil
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

import sys

if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DB_FILE = os.path.join(BASE_DIR, "database.db")
BACKUPS_DIR = os.path.join(BASE_DIR, "backups")

# Detect OneDrive for automatic real-time cloud syncing
USER_HOME = os.path.expanduser("~")
ONEDRIVE_DIR = os.path.join(USER_HOME, "OneDrive")
ONEDRIVE_SOUL_WAYS = os.path.join(ONEDRIVE_DIR, "OneDrive - Soul ways")

if os.path.exists(ONEDRIVE_SOUL_WAYS):
    ONEDRIVE_BACKUP_DIR = os.path.join(ONEDRIVE_SOUL_WAYS, "FabricTag_Cloud_Backups")
elif os.path.exists(ONEDRIVE_DIR):
    ONEDRIVE_BACKUP_DIR = os.path.join(ONEDRIVE_DIR, "FabricTag_Cloud_Backups")
else:
    ONEDRIVE_BACKUP_DIR = None

os.makedirs(BACKUPS_DIR, exist_ok=True)
if ONEDRIVE_BACKUP_DIR:
    try:
        os.makedirs(ONEDRIVE_BACKUP_DIR, exist_ok=True)
    except Exception:
        pass

def normalize_fabric_text(val):
    if val is None:
        return ""
    s = str(val).strip()
    s = s.replace('i', 'I').replace('ı', 'I').replace('İ', 'I')
    return s.upper()

def get_db_connection():
    conn = sqlite3.connect(DB_FILE, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=30000")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA cache_size=-64000")
    conn.create_function("NORM_TXT", 1, normalize_fabric_text)
    return conn

def init_db():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS fabrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                internal_code TEXT UNIQUE NOT NULL,
                company_name TEXT,
                quality_code TEXT,
                quality_name TEXT,
                design_code TEXT,
                width TEXT,
                weight TEXT,
                composition TEXT,
                barcode_or_qr TEXT,
                color TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        try:
            cursor.execute("ALTER TABLE fabrics ADD COLUMN color TEXT")
        except Exception:
            pass
            
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS code_sequence (
                prefix TEXT PRIMARY KEY,
                last_number INTEGER NOT NULL DEFAULT 0
            )
        """)
        
        # Initialize code_sequence with current max number across existing fabrics
        cursor.execute("SELECT internal_code FROM fabrics")
        max_num = 0
        for r in cursor.fetchall():
            m = re.search(r'(\d+)$', str(r["internal_code"]).strip())
            if m:
                val = int(m.group(1))
                if val > max_num:
                    max_num = val
        cursor.execute("""
            INSERT INTO code_sequence (prefix, last_number) VALUES ('GLOBAL', ?)
            ON CONFLICT(prefix) DO UPDATE SET last_number = MAX(code_sequence.last_number, excluded.last_number)
        """, (max_num,))
        
        conn.commit()
    finally:
        conn.close()

def get_total_fabrics_count() -> int:
    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM fabrics")
            row = cursor.fetchone()
            return row[0] if row else 0
        finally:
            conn.close()
    except Exception:
        return 0

def load_code_settings():
    try:
        import json
        settings_path = os.path.join(BASE_DIR, "settings.json")
        if os.path.exists(settings_path):
            with open(settings_path, "r", encoding="utf-8") as f:
                s = json.load(f)
                return {
                    "prefix_type": s.get("code_prefix_type", "letters"),
                    "prefix_text": s.get("code_prefix_text", "ELT"),
                    "separator": s.get("code_separator", ""),
                    "digits": int(s.get("code_digits", 7)),
                    "start_num": int(s.get("code_start_number", 1))
                }
    except Exception:
        pass
    return {
        "prefix_type": "letters",
        "prefix_text": "ELT",
        "separator": "",
        "digits": 7,
        "start_num": 1
    }

def get_next_internal_code(conn, code_settings=None):
    if code_settings is None:
        code_settings = load_code_settings()
        
    prefix_type = code_settings.get("prefix_type", "letters")
    prefix_text = str(code_settings.get("prefix_text", "ELT")).strip().upper()
    separator = str(code_settings.get("separator", ""))
    digits = int(code_settings.get("digits", 7))
    start_num = int(code_settings.get("start_num", 1))
    
    clean_prefix = prefix_text if prefix_type == "letters" else ""
    full_prefix = f"{clean_prefix}{separator}" if clean_prefix else ""
    
    cursor = conn.cursor()
    
    # 1. Fetch current max from code_sequence tracker
    cursor.execute("SELECT last_number FROM code_sequence WHERE prefix = 'GLOBAL'")
    seq_row = cursor.fetchone()
    seq_max = seq_row[0] if seq_row else 0
    
    # 2. Also check fabrics in case any higher number exists
    cursor.execute("SELECT internal_code FROM fabrics")
    rows = cursor.fetchall()
    
    fabrics_max = 0
    for row in rows:
        code = str(row["internal_code"]).strip().upper()
        if full_prefix and code.startswith(full_prefix):
            rest = code[len(full_prefix):]
            if rest.isdigit():
                num = int(rest)
                if num > fabrics_max:
                    fabrics_max = num
        elif not full_prefix and code.isdigit():
            num = int(code)
            if num > fabrics_max:
                fabrics_max = num
        else:
            m = re.search(r'(\d+)$', code)
            if m:
                num = int(m.group(1))
                if num > fabrics_max:
                    fabrics_max = num
                    
    baseline_max = max(seq_max, fabrics_max)
    if baseline_max == 0:
        next_num = start_num
    else:
        next_num = max(baseline_max + 1, start_num)
        
    # Update tracker immediately so that consecutive calls or deleted records never reuse next_num
    cursor.execute("""
        INSERT INTO code_sequence (prefix, last_number) VALUES ('GLOBAL', ?)
        ON CONFLICT(prefix) DO UPDATE SET last_number = MAX(code_sequence.last_number, excluded.last_number)
    """, (next_num,))
        
    if digits > 0:
        formatted_num = f"{next_num:0{digits}d}"
    else:
        formatted_num = str(next_num)
        
    return f"{full_prefix}{formatted_num}"

def find_fabric_by_identity(company_name, quality_name, quality_code, color):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        norm_company = normalize_fabric_text(company_name) or "GENEL"
        norm_qname = normalize_fabric_text(quality_name)
        norm_qcode = normalize_fabric_text(quality_code)
        if norm_qcode == "KODSUZ":
            norm_qcode = ""
        norm_color = normalize_fabric_text(color)
        
        if not (norm_qname or norm_qcode):
            return None
            
        cursor.execute("""
            SELECT * FROM fabrics 
            WHERE NORM_TXT(COALESCE(company_name, 'GENEL')) = ?
              AND NORM_TXT(COALESCE(quality_name, '')) = ?
              AND NORM_TXT(COALESCE(quality_code, '')) = ?
              AND NORM_TXT(COALESCE(color, '')) = ?
        """, (norm_company, norm_qname, norm_qcode, norm_color))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def add_fabric(company_name, quality_code, quality_name, design_code, width, weight, composition, barcode_or_qr, internal_code=None, color=None):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # 1. Metin Temizliği ve Normalizasyon
        company_name = company_name.strip().upper() if company_name else "GENEL"
        quality_code = quality_code.strip().upper() if quality_code else ""
        if quality_code == "KODSUZ":
            quality_code = ""
        quality_name = quality_name.strip().upper() if quality_name else ""
        design_code = design_code.strip().upper() if design_code else ""
        color = color.strip().upper() if color else ""
        width = width.strip().upper() if width else ""
        weight = weight.strip().upper() if weight else ""
        barcode_or_qr = barcode_or_qr.strip().upper() if barcode_or_qr else ""
        
        if composition:
            comp_clean = re.sub(r'[/,;+]+', ' ', composition)
            composition = re.sub(r'\s+', ' ', comp_clean).strip().upper()
        else:
            composition = ""

        norm_company = normalize_fabric_text(company_name) or "GENEL"
        norm_qname = normalize_fabric_text(quality_name)
        norm_qcode = normalize_fabric_text(quality_code)
        norm_color = normalize_fabric_text(color)

        # 2. 4 Temel Alana Göre Eşleşen Kayıt Arama:
        # (kumaşçı, kalite adı, kalite kodu, renk)
        existing_record = None
        if norm_qname or norm_qcode:
            cursor.execute("""
                SELECT * FROM fabrics 
                WHERE NORM_TXT(COALESCE(company_name, 'GENEL')) = ?
                  AND NORM_TXT(COALESCE(quality_name, '')) = ?
                  AND NORM_TXT(COALESCE(quality_code, '')) = ?
                  AND NORM_TXT(COALESCE(color, '')) = ?
            """, (norm_company, norm_qname, norm_qcode, norm_color))
            existing_record = cursor.fetchone()

        # Eğer 4 alanla bulunamadıysa ve barkod verilmişse barkod eşleşmesi kontrolü
        if not existing_record and barcode_or_qr and barcode_or_qr.strip():
            cursor.execute(
                "SELECT * FROM fabrics WHERE barcode_or_qr = ? AND barcode_or_qr != ''",
                (barcode_or_qr.strip().upper(),)
            )
            existing_bc = cursor.fetchone()
            if existing_bc:
                bc_color = normalize_fabric_text(existing_bc["color"])
                if not norm_color or bc_color == norm_color:
                    existing_record = existing_bc

        # Eğer internal_code verilmişse (Arayüzde daha önce seçilen/yüklenen iç kod)
        if not existing_record and internal_code:
            cursor.execute("SELECT * FROM fabrics WHERE internal_code = ?", (internal_code.strip().upper(),))
            existing_by_code = cursor.fetchone()
            if existing_by_code:
                c_comp = normalize_fabric_text(existing_by_code["company_name"] or "GENEL")
                c_qn = normalize_fabric_text(existing_by_code["quality_name"])
                c_qc = normalize_fabric_text(existing_by_code["quality_code"])
                c_col = normalize_fabric_text(existing_by_code["color"])
                # Yalnızca 4 alan da aynıysa bu kaydı güncelle
                if (c_comp == norm_company and c_qn == norm_qname and c_qc == norm_qcode and c_col == norm_color):
                    existing_record = existing_by_code
                # NOT: Eğer renk veya kalite kodu/adı farklı ise existing_record None kalır;
                # böylece aynı kalitenin yeni rengi için ayrı bir satır ve yeni bir içkod oluşturulur!

        # 3. KARAR: MEVCUT KAYDI GÜNCELLEME VEYA YENİ İÇKOD OLUŞTURMA
        if existing_record:
            # Kumaşçı, kalite adı, kalite kodu ve rengi aynı -> Veritabanında güncelle
            rec_id = existing_record["id"]
            final_design = design_code if design_code else (existing_record["design_code"] or "")
            final_width = width if width else (existing_record["width"] or "")
            final_weight = weight if weight else (existing_record["weight"] or "")
            final_comp = composition if composition else (existing_record["composition"] or "")
            final_barcode = barcode_or_qr if barcode_or_qr else (existing_record["barcode_or_qr"] or "")

            cursor.execute("""
                UPDATE fabrics SET
                    company_name = ?,
                    quality_code = ?,
                    quality_name = ?,
                    design_code = ?,
                    width = ?,
                    weight = ?,
                    composition = ?,
                    barcode_or_qr = ?,
                    color = ?
                WHERE id = ?
            """, (company_name, quality_code, quality_name, final_design,
                  final_width, final_weight, final_comp, final_barcode, color, rec_id))
            conn.commit()

            cursor.execute("SELECT * FROM fabrics WHERE id = ?", (rec_id,))
            updated_row = dict(cursor.fetchone())
            updated_row["is_duplicate"] = False
            updated_row["is_updated"] = True
            return updated_row
        else:
            # Kumaşçı, kalite adı, kalite kodu veya rengi farklı -> Yeni içkod oluştur ve ekle
            new_code = get_next_internal_code(conn)
            cursor.execute("""
                INSERT INTO fabrics (
                    internal_code, company_name, quality_code, quality_name, 
                    design_code, width, weight, composition, barcode_or_qr, color
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (new_code, company_name, quality_code, quality_name, 
                  design_code, width, weight, composition, barcode_or_qr, color))
            
            conn.commit()
            cursor.execute("SELECT * FROM fabrics WHERE id = ?", (cursor.lastrowid,))
            new_row = dict(cursor.fetchone())
            new_row["is_duplicate"] = False
            new_row["is_updated"] = False
            return new_row
    finally:
        conn.close()

def update_fabric(fabric_id, company_name, quality_code, quality_name, design_code, width, weight, composition, barcode_or_qr, color):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM fabrics WHERE id = ?", (fabric_id,))
        existing = cursor.fetchone()
        if not existing:
            return None
            
        company_name = company_name.strip().upper() if company_name else "GENEL"
        quality_code = quality_code.strip().upper() if quality_code else ""
        if quality_code == "KODSUZ":
            quality_code = ""
        quality_name = quality_name.strip().upper() if quality_name else ""
        design_code = design_code.strip().upper() if design_code else ""
        color = color.strip().upper() if color else ""
        width = width.strip().upper() if width else ""
        weight = weight.strip().upper() if weight else ""
        barcode_or_qr = barcode_or_qr.strip().upper() if barcode_or_qr else ""
        
        if composition:
            comp_clean = re.sub(r'[/,;+]+', ' ', composition)
            composition = re.sub(r'\s+', ' ', comp_clean).strip().upper()
        else:
            composition = ""

        cursor.execute("""
            UPDATE fabrics SET
                company_name = ?,
                quality_code = ?,
                quality_name = ?,
                design_code = ?,
                width = ?,
                weight = ?,
                composition = ?,
                barcode_or_qr = ?,
                color = ?
            WHERE id = ?
        """, (company_name, quality_code, quality_name, design_code,
              width, weight, composition, barcode_or_qr, color, fabric_id))
        conn.commit()

        cursor.execute("SELECT * FROM fabrics WHERE id = ?", (fabric_id,))
        updated_row = dict(cursor.fetchone())
        updated_row["is_duplicate"] = False
        updated_row["is_updated"] = True
        return updated_row
    finally:
        conn.close()

def delete_fabric(fabric_id):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM fabrics WHERE id = ?", (fabric_id,))
        row = cursor.fetchone()
        if not row:
            return None
        code = row["internal_code"]
        m = re.search(r'(\d+)$', str(code).strip())
        if m:
            num = int(m.group(1))
            cursor.execute("""
                INSERT INTO code_sequence (prefix, last_number) 
                VALUES ('GLOBAL', ?)
                ON CONFLICT(prefix) DO UPDATE SET last_number = MAX(code_sequence.last_number, excluded.last_number)
            """, (num,))
        cursor.execute("DELETE FROM fabrics WHERE id = ?", (fabric_id,))
        conn.commit()
        return dict(row)
    finally:
        conn.close()

def delete_fabrics_batch(fabric_ids):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        deleted_count = 0
        for fid in fabric_ids:
            cursor.execute("SELECT * FROM fabrics WHERE id = ?", (fid,))
            row = cursor.fetchone()
            if row:
                code = row["internal_code"]
                m = re.search(r'(\d+)$', str(code).strip())
                if m:
                    num = int(m.group(1))
                    cursor.execute("""
                        INSERT INTO code_sequence (prefix, last_number) 
                        VALUES ('GLOBAL', ?)
                        ON CONFLICT(prefix) DO UPDATE SET last_number = MAX(code_sequence.last_number, excluded.last_number)
                    """, (num,))
                cursor.execute("DELETE FROM fabrics WHERE id = ?", (fid,))
                deleted_count += 1
        conn.commit()
        return deleted_count
    finally:
        conn.close()

def get_all_fabrics(search_query=None, start_date=None, end_date=None):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        conditions = []
        params = []
        
        if search_query:
            query = f"%{normalize_fabric_text(search_query)}%"
            conditions.append("(NORM_TXT(internal_code) LIKE ? OR NORM_TXT(company_name) LIKE ? OR NORM_TXT(quality_code) LIKE ? OR NORM_TXT(quality_name) LIKE ? OR NORM_TXT(design_code) LIKE ? OR NORM_TXT(composition) LIKE ? OR NORM_TXT(color) LIKE ?)")
            params.extend([query, query, query, query, query, query, query])
            
        if start_date:
            conditions.append("created_at >= ?")
            params.append(start_date)
            
        if end_date:
            conditions.append("created_at <= ?")
            params.append(end_date)
            
        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        sql = f"SELECT * FROM fabrics {where_clause} ORDER BY created_at DESC"
        
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def export_to_xlsx(filepath, start_date=None, end_date=None):
    rows = get_all_fabrics(start_date=start_date, end_date=end_date)
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Kumaş Kartela Listesi"
    
    # Enable grid lines in Excel view
    ws.views.sheetView[0].showGridLines = True
    
    headers = [
        "Sıra No",
        "Ic Kod (Internal Code)",
        "Firma Adı (Company)",
        "Kalite Kodu (Article)",
        "Kalite Adı (Name)",
        "Renk / Varyant (Color)",
        "Desen Kodu (Design)",
        "Karışım / Yapı (Composition)",
        "En (Width)",
        "Gramaj (Weight)",
        "Barkod / QR",
        "Kayıt Tarihi & Saati"
    ]
    
    # Styling definitions
    header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
    
    zebra_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    white_fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
    
    thin_border = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )
    
    center_align = Alignment(horizontal='center', vertical='center')
    left_align = Alignment(horizontal='left', vertical='center')
    
    # Write headers
    ws.append(headers)
    ws.row_dimensions[1].height = 28
    
    for col_num in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_num)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = center_align
        cell.border = thin_border
        
    # Write data rows
    for idx, row in enumerate(rows, start=1):
        row_data = [
            idx,
            row["internal_code"],
            row["company_name"],
            row["quality_code"],
            row["quality_name"] or "-",
            (row["color"] if "color" in row.keys() else "") or "-",
            row["design_code"] or "-",
            row["composition"] or "-",
            row["width"] or "-",
            row["weight"] or "-",
            row["barcode_or_qr"] or "-",
            row["created_at"] or "-"
        ]
        ws.append(row_data)
        current_row = idx + 1
        ws.row_dimensions[current_row].height = 22
        
        row_fill = zebra_fill if idx % 2 == 0 else white_fill
        
        for col_num in range(1, len(headers) + 1):
            cell = ws.cell(row=current_row, column=col_num)
            cell.fill = row_fill
            cell.border = thin_border
            cell.font = Font(name="Segoe UI", size=10)
            
            # Alignments: codes and dates centered, names left-aligned
            if col_num in [1, 2, 4, 6, 8, 10, 11]:
                cell.alignment = center_align
            else:
                cell.alignment = left_align

    # Auto-fit column widths
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val_str = str(cell.value or '')
            if len(val_str) > max_len:
                max_len = len(val_str)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)
        
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    wb.save(filepath)
    return len(rows)

def export_to_csv(filepath):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM fabrics ORDER BY created_at DESC")
        rows = cursor.fetchall()
    finally:
        conn.close()
    
    headers = [
        "İç Kod (Internal Code)", 
        "Firma (Company)", 
        "Kalite Kodu (Article)", 
        "Kalite Adı (Name)", 
        "Desen Kodu (Design)", 
        "Renk / Varyant (Color)", 
        "En (Width)", 
        "Gramaj (Weight)", 
        "Karışım (Composition)", 
        "Barkod / QR",
        "Kayıt Tarihi (Created At)"
    ]
    
    with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(headers)
        for row in rows:
            writer.writerow([
                row["internal_code"],
                row["company_name"],
                row["quality_code"],
                row["quality_name"],
                row["design_code"],
                row["color"] if "color" in row.keys() else "",
                row["width"],
                row["weight"],
                row["composition"],
                row["barcode_or_qr"],
                row["created_at"]
            ])

def get_custom_backup_dir():
    try:
        settings_file = os.path.join(BASE_DIR, "settings.json")
        if os.path.exists(settings_file):
            import json
            with open(settings_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                custom_dir = data.get("custom_backup_dir", "").strip()
                if custom_dir and os.path.exists(custom_dir):
                    return custom_dir
    except Exception:
        pass
    return None

def create_timestamped_backup(start_date=None, end_date=None, label_prefix="MANUEL_YEDEK"):
    now_str = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"FabricTag_{label_prefix}_{now_str}.xlsx"
    filepath = os.path.join(BACKUPS_DIR, filename)
    count = export_to_xlsx(filepath, start_date=start_date, end_date=end_date)
    
    # Auto-mirror to Custom Backup Directory if specified
    custom_dir = get_custom_backup_dir()
    if custom_dir and os.path.exists(filepath):
        try:
            shutil.copy2(filepath, os.path.join(custom_dir, filename))
            if os.path.exists(DB_FILE):
                shutil.copy2(DB_FILE, os.path.join(custom_dir, "FabricTag_database_backup.db"))
        except Exception:
            pass

    # Auto-mirror to OneDrive Cloud Backup if active
    if ONEDRIVE_BACKUP_DIR and os.path.exists(filepath):
        try:
            shutil.copy2(filepath, os.path.join(ONEDRIVE_BACKUP_DIR, filename))
            # Also backup database file
            if os.path.exists(DB_FILE):
                shutil.copy2(DB_FILE, os.path.join(ONEDRIVE_BACKUP_DIR, "FabricTag_database_backup.db"))
        except Exception:
            pass
            
    return {
        "filename": filename,
        "filepath": filepath,
        "record_count": count,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "size_kb": round(os.path.getsize(filepath) / 1024, 1)
    }

def list_backups():
    if not os.path.exists(BACKUPS_DIR):
        return []
    
    files = []
    for f in os.listdir(BACKUPS_DIR):
        if f.lower().endswith(('.xlsx', '.csv', '.db')):
            f_path = os.path.join(BACKUPS_DIR, f)
            stat = os.stat(f_path)
            files.append({
                "filename": f,
                "created_at": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
                "size_kb": round(stat.st_size / 1024, 1),
                "download_url": f"/api/backups/download/{f}"
            })
            
    files.sort(key=lambda x: x["created_at"], reverse=True)
    return files

def generate_empty_excel_template(filepath):
    """
    Generates a beautifully styled empty Excel template for fabric importing.
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Kumas_Sablonu"
    
    headers = [
        "Ic Kod (Internal Code)",
        "Firma (Supplier)",
        "Kalite Kodu (Article)",
        "Kalite Adi (Quality Name)",
        "Desen Kodu (Design/Color)",
        "Karisim (Composition)",
        "En (Width - cm)",
        "Gramaj (Weight - g/m2)",
        "Barkod (Barcode)"
    ]
    
    # Header styling
    header_fill = PatternFill(start_color="1E1B4B", end_color="1E1B4B", fill_type="solid") # Deep indigo
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    center_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )
    
    # Write Title Note
    ws.merge_cells("A1:I1")
    title_cell = ws["A1"]
    title_cell.value = "FabricTag - Kumas Veri Aktarim Sablonu (Ic kod alanini bos birakirsaniz sistem siradaki otomatik ic kodu atar)"
    title_cell.font = Font(name="Calibri", size=10, italic=True, color="4338CA", bold=True)
    title_cell.alignment = Alignment(horizontal="left", vertical="center")
    title_cell.fill = PatternFill(start_color="EEF2FF", end_color="EEF2FF", fill_type="solid")
    ws.row_dimensions[1].height = 25
    
    # Write Headers on row 2
    ws.row_dimensions[2].height = 28
    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=2, column=col_num, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = center_align
        cell.border = thin_border
        
    # Write 2 Sample Rows for Guidance
    sample_rows = [
        ["ELT0000001", "ELITE TEKSTIL", "ART-1024", "IPEK SATEN", "01 LACIVERT", "%95 PAMUK %5 ELASTAN", "145", "220", "ELT0000001"],
        ["", "DOKUMA TEKSTIL", "DK-550", "KETEN KETEN", "12 BEJ", "%100 KETEN", "150", "280", ""]
    ]
    
    sample_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    data_font = Font(name="Calibri", size=10)
    
    for row_idx, row_data in enumerate(sample_rows, 3):
        ws.row_dimensions[row_idx].height = 22
        for col_idx, val in enumerate(row_data, 1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.font = data_font
            cell.border = thin_border
            cell.alignment = Alignment(horizontal="center" if col_idx in [1, 7, 8, 9] else "left", vertical="center")
            if row_idx == 3:
                cell.fill = sample_fill

    # Set Column Widths
    col_widths = [24, 26, 22, 24, 22, 30, 16, 22, 22]
    for i, w in enumerate(col_widths, 1):
        col_letter = get_column_letter(i)
        ws.column_dimensions[col_letter].width = w
        
    wb.save(filepath)
    return filepath

def normalize_header_text(text):
    if not text:
        return ""
    t = str(text).strip().lower()
    t = t.replace("ı", "i").replace("ğ", "g").replace("ü", "u").replace("ş", "s").replace("ö", "o").replace("ç", "c")
    t = re.sub(r'[^a-z0-9]', '', t)
    return t

def detect_column_field(header_name):
    """
    Intelligently determines which standard fabric database field a column header belongs to.
    """
    norm = normalize_header_text(header_name)
    if not norm:
        return None
        
    if any(k in norm for k in ["ickod", "internalcode", "stokkodu", "stokno", "urunkodu", "itemcode"]):
        return "internal_code"
    if any(k in norm for k in ["firma", "tedarikci", "supplier", "company", "vendor", "uretimci", "musteri", "fabrika"]):
        return "company_name"
    if any(k in norm for k in ["kalitekodu", "kaliteno", "article", "artno", "kumascinsi", "kumaskodu", "qualitycode", "desenno"]):
        return "quality_code"
    if any(k in norm for k in ["kaliteadi", "kaliteismi", "qualityname", "kumasadi", "fabricname", "cins", "aciklama", "description"]):
        return "quality_name"
    if any(k in norm for k in ["renkkodu", "renkno", "renk", "varyant", "color", "colour", "variant"]):
        return "color"
    if any(k in norm for k in ["desenkodu", "desen", "design", "designcode"]):
        return "design_code"
    if any(k in norm for k in ["karisim", "kompozisyon", "composition", "icerik", "elyaf", "content", "fabriccontent", "material"]):
        return "composition"
    if any(k in norm for k in ["en", "genislik", "width", "laize", "ebat"]):
        return "width"
    if any(k in norm for k in ["gramaj", "agirlik", "weight", "gm2", "gsm", "grm2", "gr"]):
        return "weight"
    if any(k in norm for k in ["barkod", "barcode", "qr", "qrcode"]):
        return "barcode_or_qr"
        
    return None

def analyze_excel_columns(filepath):
    """
    Reads an uploaded Excel/CSV file, returns header names, sample rows, total rows, and suggested field mappings.
    """
    ext = os.path.splitext(filepath)[1].lower()
    headers = []
    sample_rows = []
    total_rows = 0
    
    if ext in [".xlsx", ".xlsm", ".xltx"]:
        wb = openpyxl.load_workbook(filepath, data_only=True, read_only=True)
        ws = wb.active
        
        row_iter = ws.iter_rows(values_only=True)
        header_row = None
        
        for row in row_iter:
            # Skip completely empty rows or title note rows
            if not row or all(v is None or str(v).strip() == "" for v in row):
                continue
            cleaned = [str(c).strip() if c is not None else "" for c in row]
            # Detect header row (at least 2 non-empty columns)
            if sum(1 for c in cleaned if c) >= 2 and header_row is None:
                header_row = cleaned
                break
                
        if not header_row:
            return {"error": "Excel dosyasında geçerli bir başlık satırı bulunamadı."}
            
        headers = header_row
        
        # Read sample data rows
        for row in row_iter:
            if not row or all(v is None or str(v).strip() == "" for v in row):
                continue
            total_rows += 1
            if len(sample_rows) < 4:
                sample_rows.append([str(c).strip() if c is not None else "" for c in row])
                
        wb.close()
    elif ext == ".csv":
        with open(filepath, "r", encoding="utf-8-sig", errors="replace") as f:
            reader = csv.reader(f)
            for row in reader:
                if not row or all(str(v).strip() == "" for v in row):
                    continue
                if not headers:
                    headers = [str(c).strip() for c in row]
                else:
                    total_rows += 1
                    if len(sample_rows) < 4:
                        sample_rows.append([str(c).strip() for c in row])
    else:
        return {"error": "Desteklenmeyen dosya formatı. Lütfen .xlsx veya .csv yükleyin."}

    # Generate suggested mappings
    mappings = {}
    used_fields = set()
    for col_name in headers:
        field = detect_column_field(col_name)
        if field and field not in used_fields:
            mappings[col_name] = field
            used_fields.add(field)
        else:
            mappings[col_name] = ""
            
    return {
        "headers": headers,
        "sample_rows": sample_rows,
        "total_rows": total_rows,
        "suggested_mappings": mappings
    }

def clean_excel_text(val):
    if val is None:
        return ""
    v = str(val).strip()
    return v.upper()

def import_excel_fabrics(filepath, column_mappings):
    """
    Imports fabrics from Excel/CSV using provided column_mappings dict (header -> field_name).
    Maintains existing internal codes, fills missing internal codes using the auto-counter,
    and updates database seamlessly.
    """
    ext = os.path.splitext(filepath)[1].lower()
    rows_to_process = []
    
    if ext in [".xlsx", ".xlsm", ".xltx"]:
        wb = openpyxl.load_workbook(filepath, data_only=True)
        ws = wb.active
        
        all_rows = list(ws.iter_rows(values_only=True))
        wb.close()
        
        header_idx = None
        for idx, row in enumerate(all_rows):
            if not row or all(v is None or str(v).strip() == "" for v in row):
                continue
            cleaned = [str(c).strip() if c is not None else "" for c in row]
            if sum(1 for c in cleaned if c) >= 2:
                header_idx = idx
                headers = cleaned
                break
                
        if header_idx is None:
            raise ValueError("Geçerli başlık satırı bulunamadı.")
            
        for row in all_rows[header_idx + 1:]:
            if not row or all(v is None or str(v).strip() == "" for v in row):
                continue
            row_dict = {}
            for col_idx, col_name in enumerate(headers):
                if col_idx < len(row):
                    row_dict[col_name] = row[col_idx]
            rows_to_process.append(row_dict)
            
    elif ext == ".csv":
        with open(filepath, "r", encoding="utf-8-sig", errors="replace") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if not any(row.values()):
                    continue
                rows_to_process.append(row)
    else:
        raise ValueError("Desteklenmeyen dosya formatı.")

    conn = get_db_connection()
    cursor = conn.cursor()
    code_settings = load_code_settings()
    
    imported_count = 0
    updated_count = 0
    errors = []
    
    # Process rows inside transaction
    try:
        for idx, row in enumerate(rows_to_process, 1):
            record = {
                "internal_code": "",
                "company_name": "",
                "quality_code": "",
                "quality_name": "",
                "design_code": "",
                "width": "",
                "weight": "",
                "composition": "",
                "barcode_or_qr": ""
            }
            
            for header, field_name in column_mappings.items():
                if field_name and field_name in record and header in row:
                    val = row[header]
                    if val is not None:
                        record[field_name] = str(val).strip()
            
            # Text cleaning
            company = clean_excel_text(record["company_name"]) or "GENEL"
            q_code = clean_excel_text(record["quality_code"]) or ""
            q_name = clean_excel_text(record["quality_name"])
            d_code = clean_excel_text(record["design_code"])
            color_val = clean_excel_text(record.get("color", ""))
            width = clean_excel_text(record["width"])
            weight = clean_excel_text(record["weight"])
            comp = clean_excel_text(record["composition"])
            barcode = clean_excel_text(record["barcode_or_qr"])
            
            # Internal code determination & 4-Field Identity Check
            int_code = str(record["internal_code"]).strip().upper() if record["internal_code"] else ""
            
            existing = None
            if int_code:
                cursor.execute("SELECT * FROM fabrics WHERE internal_code = ?", (int_code,))
                existing = cursor.fetchone()
                
            if not existing and (q_name or q_code):
                norm_co = normalize_fabric_text(company) or "GENEL"
                norm_qn = normalize_fabric_text(q_name)
                norm_qc = normalize_fabric_text(q_code)
                norm_cl = normalize_fabric_text(color_val)
                cursor.execute("""
                    SELECT * FROM fabrics 
                    WHERE NORM_TXT(COALESCE(company_name, 'GENEL')) = ?
                      AND NORM_TXT(COALESCE(quality_name, '')) = ?
                      AND NORM_TXT(COALESCE(quality_code, '')) = ?
                      AND NORM_TXT(COALESCE(color, '')) = ?
                """, (norm_co, norm_qn, norm_qc, norm_cl))
                existing = cursor.fetchone()
            
            if existing:
                target_code = existing["internal_code"]
                final_bc = barcode if barcode else (existing["barcode_or_qr"] or target_code)
                cursor.execute("""
                    UPDATE fabrics SET 
                        company_name = ?, quality_code = ?, quality_name = ?, 
                        design_code = ?, color = ?, width = ?, weight = ?, composition = ?, barcode_or_qr = ?
                    WHERE id = ?
                """, (company, q_code, q_name, d_code, color_val, width, weight, comp, final_bc, existing["id"]))
                updated_count += 1
            else:
                if not int_code:
                    int_code = get_next_internal_code(conn, code_settings)
                if not barcode:
                    barcode = int_code
                cursor.execute("""
                    INSERT INTO fabrics (
                        internal_code, company_name, quality_code, quality_name,
                        design_code, color, width, weight, composition, barcode_or_qr
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (int_code, company, q_code, q_name, d_code, color_val, width, weight, comp, barcode))
                imported_count += 1
                
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()
        
    return {
        "success": True,
        "imported_count": imported_count,
        "updated_count": updated_count,
        "total_processed": len(rows_to_process)
    }

