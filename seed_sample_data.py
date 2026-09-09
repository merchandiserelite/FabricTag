"""
TexFlow - Seed Sample Data from Desktop
Populates the database with real order files analyzed during setup.
"""

from database import init_db, get_db
from parser_engine import OrderParserEngine
from fabrictag_connector import FabricTagConnector
from pathlib import Path

def seed_data():
    init_db()
    conn = get_db()
    c = conn.cursor()

    carsaf_file = r"C:\Users\ASLI CELIK\Desktop\ROBERTO SARTO FALL26 çarşaf - Kopya.XLSX"
    tricot_file = r"C:\Users\ASLI CELIK\Desktop\Purchase order Tricot Company TCEL 004 style 26153  AOP floral blow up.xlsx"

    # 1. Load Roberto Sarto Çarşaf
    if Path(carsaf_file).exists():
        print("Seeding Roberto Sarto Çarşaf...")
        res = OrderParserEngine.parse_excel_carsaf(carsaf_file)
        # Group by PO
        po_groups = {}
        for r in res:
            po_groups.setdefault(r["po_number"], []).append(r)

        for po_num, items in po_groups.items():
            tot_qty = sum(it.get("total_quantity", 0) for it in items)
            tot_eur = sum(it.get("total_quantity", 0) * it.get("unit_price", 0.0) for it in items)
            
            c.execute("""
            INSERT INTO orders (company_id, po_number, customer_name, brand, total_quantity, total_amount, currency, status, raw_file_name)
            VALUES (1, ?, 'Roberto Sarto', 'Roberto Sarto Fall 26', ?, ?, 'EUR', 'İmalatta', 'ROBERTO SARTO FALL26 çarşaf.XLSX')
            """, (po_num, tot_qty, tot_eur))
            order_id = c.lastrowid

            for it in items:
                c.execute("""
                INSERT INTO styles (
                    order_id, company_id, style_no, description, fabric_composition, fabric_article,
                    fabric_type, color_name, unit_price, total_quantity, total_amount,
                    sms_unit_meters, pps_unit_meters, fabric_order_status, fabric_ordered,
                    pps_sent, shipping_sample_sent, fabric_received_meters, fabric_arrival_date,
                    accessory_1, accessory_2, accessory_3, accessory_4
                )
                VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    order_id, it.get("style_no"), it.get("description"), it.get("fabric_composition"),
                    it.get("fabric_article"), it.get("fabric_type"), it.get("color_name"), it.get("unit_price"),
                    it.get("total_quantity"), it.get("total_quantity", 0) * it.get("unit_price", 0.0),
                    it.get("sms_unit_meters"), it.get("pps_unit_meters"), it.get("fabric_order_status"),
                    it.get("fabric_ordered"), it.get("pps_sent"), it.get("shipping_sample_sent"),
                    it.get("fabric_received_meters"), it.get("fabric_arrival_date"),
                    it.get("accessory_1"), it.get("accessory_2"), it.get("accessory_3"), it.get("accessory_4")
                ))
                style_id = c.lastrowid

                for idx, (sz, qty) in enumerate((it.get("size_distribution") or {}).items()):
                    c.execute("""
                    INSERT INTO size_distributions (style_id, size_name, quantity, sort_order)
                    VALUES (?, ?, ?, ?)
                    """, (style_id, sz, int(qty or 0), idx + 1))

                for log in it.get("status_logs", []):
                    c.execute("""
                    INSERT INTO production_status_logs (style_id, user_name, category, title, message)
                    VALUES (?, 'Excel Çarşaf', 'Kritik / Not', ?, ?)
                    """, (style_id, log.get("title"), log.get("message")))

    # 2. Load Tricot Company PO
    if Path(tricot_file).exists():
        print("Seeding Tricot Company PO...")
        tricot_res = OrderParserEngine.parse_excel_tricot(tricot_file)
        for parent in tricot_res:
            c.execute("""
            INSERT INTO orders (company_id, po_number, customer_name, brand, season, order_date, delivery_date, delivery_terms, payment_terms, currency, status, raw_file_name)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Yeni', 'Purchase order Tricot Company TCEL 004.xlsx')
            """, (parent.get("po_number"), parent.get("customer_name"), parent.get("brand"), parent.get("season"), parent.get("order_date"), parent.get("delivery_date"), parent.get("delivery_terms"), parent.get("payment_terms"), parent.get("currency", "EUR")))
            order_id = c.lastrowid

            for st in parent.get("styles", []):
                c.execute("""
                INSERT INTO styles (order_id, company_id, style_no, color_code, color_name, unit_price, total_quantity, total_amount, currency, description, fabric_composition)
                VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, 'Blouse oversized boxy fit', '82% viscose 18% nylon')
                """, (order_id, st.get("style_no"), st.get("color_code"), st.get("color_name"), st.get("unit_price"), st.get("total_quantity"), st.get("total_amount"), parent.get("currency", "EUR")))
                style_id = c.lastrowid

                for idx, (sz_name, sz_qty) in enumerate((st.get("size_distribution") or {}).items()):
                    c.execute("""
                    INSERT INTO size_distributions (style_id, label_brand, size_name, quantity, sort_order)
                    VALUES (?, ?, ?, ?, ?)
                    """, (style_id, st.get("label_brand"), sz_name, int(sz_qty or 0), idx + 1))

    conn.commit()
    conn.close()
    print("✅ Seed completed successfully!")

if __name__ == "__main__":
    seed_data()
