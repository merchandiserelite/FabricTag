import os
import database

def test_system():
    print("--- TESTING DATABASE LAYER ---")
    
    # 1. Initialize DB
    if os.path.exists("database.db"):
        os.remove("database.db")
        print("Removed existing test database.")
        
    database.init_db()
    print("Database initialized successfully.")
    
    # 2. Add first fabric (New quality)
    print("\nAdding first fabric...")
    row1 = database.add_fabric(
        company_name="Beztaş Tekstil",
        quality_code="K2072",
        quality_name="SPINOZA RECYCLE",
        design_code="66461-D",
        width="150 cm ±3",
        weight="83 gr/m² ±5",
        composition="%31 POLYESTER RECYCLE %69 POLYESTER",
        barcode_or_qr="02004197"
    )
    print(f"Added successfully. Internal Code: {row1['internal_code']}")
    assert row1['internal_code'] == "ELT0000001", f"Expected ELT0000001, got {row1['internal_code']}"
    
    # 3. Add second fabric (Different quality)
    print("\nAdding second fabric...")
    row2 = database.add_fabric(
        company_name="Özçimen Textile",
        quality_code="J-6039",
        quality_name="COTTON JERSEY",
        design_code="ZN-1583",
        width="157 cm (±3)",
        weight="225 GrM2 (±%5)",
        composition="42%VIS/30%CO/25%PL/3%MTL",
        barcode_or_qr="000000508522"
    )
    print(f"Added successfully. Internal Code: {row2['internal_code']}")
    assert row2['internal_code'] == "ELT0000002", f"Expected ELT0000002, got {row2['internal_code']}"
    
    # 4. Add duplicate fabric (Should return existing ELT0000001)
    print("\nAdding duplicate of first fabric...")
    row3 = database.add_fabric(
        company_name="Beztaş Tekstil",
        quality_code="K2072",
        quality_name="SPINOZA RECYCLE (Duplicate Test)",
        design_code="66461-D",
        width="150 cm ±3",
        weight="83 gr/m² ±5",
        composition="%31 POLYESTER RECYCLE %69 POLYESTER",
        barcode_or_qr="02004197"
    )
    print(f"Duplicate result. Internal Code: {row3['internal_code']}")
    assert row3['internal_code'] == "ELT0000001", f"Expected duplicate to reuse ELT0000001, got {row3['internal_code']}"
    
    # 5. List all fabrics
    print("\nListing all fabrics:")
    all_fabrics = database.get_all_fabrics()
    for f in all_fabrics:
        print(f" - [{f['internal_code']}] {f['company_name']} - {f['quality_code']} ({f['quality_name']})")
    assert len(all_fabrics) == 2, f"Expected 2 records, got {len(all_fabrics)}"
    
    # 6. Export to CSV
    csv_file = "test_export.csv"
    if os.path.exists(csv_file):
        os.remove(csv_file)
    database.export_to_csv(csv_file)
    print(f"\nExported to CSV successfully: {csv_file}")
    assert os.path.exists(csv_file), "CSV file was not created"
    
    # Clean up
    os.remove(csv_file)
    os.remove("database.db")
    print("\nCleaned up database and test files.")
    print("--- ALL TESTS PASSED SUCCESSFULLY! ---")

if __name__ == "__main__":
    test_system()
