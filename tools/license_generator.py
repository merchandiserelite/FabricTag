import os
import sys
import hashlib
import hmac

MASTER_SECRET_SALT = b"FABRICTAG_AI_SWATCH_SYSTEM_PRO_2026_DEEPMIND_TURKEY_SECRET_KEY"

def generate_key(hw_id: str, company_name: str = "COMMERCIAL", expiry_days: int = 0) -> str:
    clean_hw = hw_id.strip().upper()
    clean_company = company_name.strip().upper()
    payload = f"{clean_hw}|{clean_company}|{expiry_days}"
    sig = hmac.new(MASTER_SECRET_SALT, payload.encode("utf-8"), hashlib.sha256).hexdigest().upper()
    key_body = f"{sig[:4]}-{sig[4:8]}-{sig[8:12]}-{sig[12:16]}-{sig[16:20]}"
    return f"FTLIC-{key_body}"

def main():
    print("=" * 60)
    print("       FABRICTAG - YÖNETİCİ LİSANS ANAHTARI ÜRETİCİSİ")
    print("=" * 60)
    
    hw_id = input("\nMüşterinin Donanım Kimliği (Örn: FT-1234-5678-ABCD-EF01): ").strip().upper()
    if not hw_id:
        print("Hata: Donanım kimliği boş bırakılamaz!")
        return
        
    company = input("Müşteri / Firma Adı (Varsayılan: COMMERCIAL): ").strip().upper()
    if not company:
        company = "COMMERCIAL"
        
    print("\nLisans Tipi:")
    print("1) Ömür Boyu Sınırsız (Lifetime)")
    print("2) 1 Yıllık (365 Gün)")
    print("3) 2 Yıllık (730 Gün)")
    choice = input("Seçiminiz [1]: ").strip()
    
    expiry_days = 0
    if choice == "2":
        expiry_days = 365
    elif choice == "3":
        expiry_days = 730
        
    license_key = generate_key(hw_id, company, expiry_days)
    
    print("\n" + "#" * 60)
    print("  ÜRETİLEN LİSANS ANAHTARI (MÜŞTERİYE GÖNDERİLECEK):")
    print("  " + license_key)
    print("#" * 60)
    print(f"\nDonanım ID: {hw_id}")
    print(f"Firma:      {company}")
    print(f"Geçerlilik: {'Ömür Boyu Sınırsız' if expiry_days == 0 else f'{expiry_days} Gün'}")
    print("\nİşlem tamamlandı.")

if __name__ == "__main__":
    main()
