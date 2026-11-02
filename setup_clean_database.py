"""
TexFlow & FabricTag - Clean Slate Database Initialization Script
Removes all test orders, styles, samples, fabrics, and demo users.
Inserts standard factory users and initializes clean state.
"""
import sqlite3
import os
import hashlib
import json
from datetime import datetime

TEX_DB = r'C:\Users\Lenovo\Desktop\Tekstil_Sistemleri_Ev_Paketi (1)\Tekstil_Sistemleri_Ev_Paketi\textile-production-system\data\texflow.db'
FAB_DB = r'C:\Users\Lenovo\Desktop\Tekstil_Sistemleri_Ev_Paketi (1)\Tekstil_Sistemleri_Ev_Paketi\fabric-label-system\database.db'

from database import hash_password

def clean_texflow():
    print("--- 1. TEXFLOW VERİTABANI SIFIRLANIYOR ---")
    if not os.path.exists(TEX_DB):
        print(f"Hata: {TEX_DB} bulunamadı!")
        return

    conn = sqlite3.connect(TEX_DB)
    c = conn.cursor()

    # Operasyonel veri tablolarını sıfırla
    tables_to_empty = [
        "orders",
        "styles",
        "size_distributions",
        "production_status_logs",
        "fabric_links",
        "audit_logs",
        "user_sessions",
        "custom_columns",
        "free_cost_studies",
        "sample_items"
    ]

    for tbl in tables_to_empty:
        try:
            c.execute(f"DELETE FROM [{tbl}]")
            c.execute(f"DELETE FROM sqlite_sequence WHERE name='{tbl}'")
            print(f"  [+] {tbl} tablosu tamamen temizlendi.")
        except Exception as e:
            print(f"  [!] {tbl} temizlenirken uyarı: {e}")

    # Şirket kaydını temiz / nötr yap
    c.execute("DELETE FROM companies")
    c.execute("""
    INSERT INTO companies (id, name, code, license_key, license_expires_at, is_active, max_users, custom_settings_json)
    VALUES (1, 'Tekstil Üretim A.Ş.', 'TR-01', 'TRIAL-FREE-60D', '2030-12-31', 1, 50, '{}')
    """)
    print("  [+] Company kaydı 'Tekstil Üretim A.Ş.' olarak güncellendi.")

    # Carton Label şablonlarındaki demo firma isimlerini standartlaştır
    try:
        c.execute("UPDATE carton_label_templates SET customer_name = 'Standart / Genel' WHERE customer_name != 'Standart / Genel'")
        c.execute("UPDATE carton_label_templates SET template_name = 'Müşteri 1 A4 Yatay (x2 Çiftli)' WHERE id = 1")
        c.execute("UPDATE carton_label_templates SET template_name = 'Müşteri 2 A4 Koli Üstü Şablonu (Yatay)' WHERE id = 4")
        
        # Şablon JSON içerisindeki müşteri ve adres bilgilerini güncelle
        c.execute("SELECT id, layout_json FROM carton_label_templates WHERE id IN (1, 4)")
        for tid, ljson in c.fetchall():
            if ljson:
                try:
                    cfg = json.loads(ljson)
                    if tid == 1:
                        cfg['header_title'] = 'Müşteri 1'
                        cfg['address_line1'] = 'Sanayi Mah. 100. Yıl Cad.'
                        cfg['address_line2'] = 'No: 12/A Nilüfer'
                        cfg['address_line3'] = 'Bursa / Türkiye'
                        cfg['brand'] = 'MARKA: ÖRNEK 1'
                    elif tid == 4:
                        cfg['header_title'] = 'Müşteri 2'
                        cfg['address_line1'] = 'Organize Sanayi Bölgesi 2. Cad.'
                        cfg['address_line2'] = 'No: 4 Osmangazi'
                        cfg['address_line3'] = 'Bursa / Türkiye'
                    c.execute("UPDATE carton_label_templates SET layout_json = ? WHERE id = ?", (json.dumps(cfg, ensure_ascii=False), tid))
                except Exception:
                    pass
        print("  [+] Koli üstü şablonları genel formata uyarlandı.")
    except Exception as e:
        print(f"  [!] Koli şablonu temizleme uyarısı: {e}")

    # Kullanıcıları temizle
    c.execute("DELETE FROM users")
    c.execute("DELETE FROM sqlite_sequence WHERE name='users'")

    # 9 Standart Fabrika Kullanıcısı (Şifrelerin hepsi: 123456)
    standard_users = [
        # (username, email, full_name, role, permissions_json)
        ("firma_yoneticisi", "yonetici@tekstil.com", "Firma Yöneticisi", "admin", 
         json.dumps({"all": True, "can_manage_users": True, "can_manage_licenses": True, "can_edit_menus": True})),
        ("genel_mudur", "genelmudur@tekstil.com", "Genel Müdür", "admin", 
         json.dumps({"all": True, "can_manage_users": True, "can_manage_licenses": True, "can_edit_menus": True})),
        ("fabrika_muduru", "fabrika@tekstil.com", "Fabrika Müdürü", "admin", 
         json.dumps({"all": True, "can_manage_users": True, "can_manage_licenses": True, "can_edit_menus": True})),
        ("merchandiser", "merchandiser@tekstil.com", "Merchandiser", "merchandiser", 
         json.dumps({
             "can_view_all_data": True, "can_edit_all_data": True, "can_create_orders": True,
             "can_delete_orders": True, "can_view_financials": True, "can_view_costs": True,
             "can_edit_costs": True, "can_view_dashboard": True, "can_edit_menus": True,
             "can_view_orders": True, "can_view_fabrictag": True,
             "can_manage_users": False, "can_manage_licenses": False
         })),
        ("modelhane", "modelhane@tekstil.com", "Modelhane", "modelhane", 
         json.dumps({
             "can_view_all_data": True, "can_edit_all_data": True, "can_create_orders": False,
             "can_delete_orders": False, "can_view_financials": False, "can_view_costs": False,
             "can_edit_costs": False, "can_view_dashboard": True, "can_edit_menus": False,
             "can_view_orders": True, "can_view_fabrictag": True,
             "can_manage_users": False, "can_manage_licenses": False
         })),
        ("planlama", "planlama@tekstil.com", "Planlama", "planlama", 
         json.dumps({
             "can_view_all_data": True, "can_edit_all_data": True, "can_create_orders": True,
             "can_delete_orders": False, "can_view_financials": False, "can_view_costs": False,
             "can_edit_costs": False, "can_view_dashboard": True, "can_edit_menus": False,
             "can_view_orders": True, "can_view_fabrictag": True,
             "can_manage_users": False, "can_manage_licenses": False
         })),
        ("kesimhane", "kesimhane@tekstil.com", "Kesimhane", "cutting", 
         json.dumps({
             "can_view_all_data": False, "can_edit_all_data": False, "can_create_orders": False,
             "can_delete_orders": False, "can_view_financials": False, "can_view_costs": False,
             "can_edit_costs": False, "can_view_dashboard": False, "can_edit_menus": False,
             "can_view_orders": True, "can_view_fabrictag": True,
             "can_manage_users": False, "can_manage_licenses": False
         })),
        ("kumas_depo", "kumasdepo@tekstil.com", "Kumaş Depo", "fabric_warehouse", 
         json.dumps({
             "can_view_all_data": False, "can_edit_all_data": False, "can_create_orders": False,
             "can_delete_orders": False, "can_view_financials": False, "can_view_costs": False,
             "can_edit_costs": False, "can_view_dashboard": False, "can_edit_menus": False,
             "can_view_orders": True, "can_view_fabrictag": True,
             "can_manage_users": False, "can_manage_licenses": False
         })),
        ("aksesuar", "aksesuar@tekstil.com", "Aksesuar Depo", "aksesuar", 
         json.dumps({
             "can_view_all_data": False, "can_edit_all_data": False, "can_create_orders": False,
             "can_delete_orders": False, "can_view_financials": False, "can_view_costs": False,
             "can_edit_costs": False, "can_view_dashboard": False, "can_edit_menus": False,
             "can_view_orders": True, "can_view_fabrictag": True,
             "can_manage_users": False, "can_manage_licenses": False
         }))
    ]

    pwd_hash = hash_password("123456")
    for u, em, fn, r, p_json in standard_users:
        c.execute("""
        INSERT INTO users (company_id, username, email, password_hash, full_name, role, permissions_json, is_active)
        VALUES (1, ?, ?, ?, ?, ?, ?, 1)
        """, (u, em, pwd_hash, fn, r, p_json))
        print(f"  [+] Kullanıcı eklendi: {u} (Rol: {r}, Şifre: 123456)")

    # Dinamik menülerde Süper Admin & Lisanslama başlığını "Lisans" olarak güncelle
    c.execute("""
    UPDATE dynamic_menus 
    SET title_tr = 'Lisans',
        title_en = 'License',
        icon = 'shield-check',
        allowed_roles_json = '["admin","superadmin","masterdeveloper"]'
    WHERE menu_key = 'superadmin_panel'
    """)
    print("  [+] Menü güncellendi: 'Süper Admin & Lisanslama' -> 'Lisans'")

    conn.commit()
    conn.close()
    print("TexFlow veritabanı sıfırlama işlemi tamamlandı.")

def clean_fabrictag():
    print("\n--- 2. FABRICTAG VERİTABANI SIFIRLANIYOR ---")
    if not os.path.exists(FAB_DB):
        print(f"Hata: {FAB_DB} bulunamadı!")
        return

    conn = sqlite3.connect(FAB_DB)
    c = conn.cursor()
    try:
        c.execute("DELETE FROM fabrics")
        c.execute("DELETE FROM sqlite_sequence WHERE name='fabrics'")
        print("  [+] FabricTag kumaş listesi temizlendi.")
    except Exception as e:
        print(f"  [!] FabricTag kumaş temizleme: {e}")

    try:
        c.execute("DELETE FROM code_sequence")
        print("  [+] Kumaş kod sayacı sıfırlandı.")
    except Exception as e:
        print(f"  [!] Code sequence: {e}")

    conn.commit()
    conn.close()
    print("FabricTag veritabanı sıfırlama işlemi tamamlandı.")

if __name__ == "__main__":
    clean_texflow()
    clean_fabrictag()
