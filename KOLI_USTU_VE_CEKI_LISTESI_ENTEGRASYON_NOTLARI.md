# TexFlow - Çeki Listesi & Koli Üstü Etiketi Entegrasyon Planı (Ev Çalışma Notları)

**Tarih:** 06.10.2026  
**İncelenen Dosya:** `Anna Van Toor koli üstü x2.xlsm` (Masaüstü & Proje Örneği)  
**Hedef:** Çeki listelerinin sisteme yüklenmesi, model yükleme adetlerinin otomatik işlenmesi ve dinamik koli üstü etiketinin (A4 yatayda 2 adet - x2) üretilmesi.

---

## 1. Çeki Listesi Yapısı ve Çözümlenen Formüller (`Çeki listesi`)

- **Beden Dağılımı ve Toplam Adet (M Sütunu):**
  - Formül: `=SUM(E2:K2)` (XS, S, M, L, XL, XXL)
  - Texflow'da beden bazlı gerçekleşen sevkiyat adetlerini besleyecek ana veri.
- **Kanal / Grup Takibi (P Sütunu):**
  - Formül: `=IF(D3=D2, P2, (P2)+1)`
  - Mağaza/Kanal (D sütunu: WEBSHOP, AVT SHOPS, WHOLESALE vb.) değiştiğinde grup no artar.
- **Grubun Toplam Koli Sayısı (Q Sütunu):**
  - Formül: `=LOOKUP(P2, V:V, W:W)`
  - Etiketteki `CARTON NO: 1 OF 5` formatının paydasını ("OF 5") belirler.
- **Net & Brüt Ağırlık (S ve T Sütunları):**
  - Net: `=(R2*M2)` (Birim ürün gramajı x Adet)
  - Brüt: `=S2+0.9` (Net + 0.9 kg boş koli darası)

---

## 2. Koli Üstü Etiket Şablonu Mantığı (`Koli Üstü`)

- **Kumanda Hücresi (P2):**
  - `P2` hücresine çeki listesindeki `no` (satır sıra no) girildiğinde tüm etiket otomatik güncellenir.
- **1. Ürün Satırı (9. Satır):**
  - Model (A9): `=XLOOKUP(P2, 'Çeki listesi'!A:A, 'Çeki listesi'!N:N)`
  - Renk (B9): `=XLOOKUP(P2, 'Çeki listesi'!A:A, 'Çeki listesi'!C:C)`
  - Bedenler (F9:K9): `=XLOOKUP($P$2, 'Çeki listesi'!$A:$A, 'Çeki listesi'!F:F)`
  - Toplam (M9): `=XLOOKUP(P2, 'Çeki listesi'!A:A, 'Çeki listesi'!M:M)`
- **2. Ürün Satırı ("x2" Çift Ürün Mantığı - 10. Satır):**
  - Formül: `=IF(AND($P$10=$P$9, $O$10=$O$9), XLOOKUP($P$2+1, ...), 0)`
  - **Mantık:** Bir sonraki satır (`P2+1`) aynı koli numarasına (`O10=O9`) ve aynı kanala (`P10=P9`) aitse, kolide ikinci bir ürün/varyant olduğu anlaşılır ve 10. satıra o ürünün bilgileri gelir.
- **Önemli Ayrıntı - J19 Yuvarlak Renkli Maske (Koşullu Biçimlendirme):**
  - Müşteri yuvarlak renkli etiket talep ettiği için Excel'de J19:L19 hücreleri koşullu biçimlendirmeyle renklendirilmiş, üzerine delikli beyaz maske bindirilerek yuvarlak çıkartma görüntüsü verilmiştir.
  - **Renk Kodları (Kanal Bazlı Poka-Yoke):**
    - `STOCK AVT` ➔ Mor (`#6b248a`)
    - `MOSCOW STOCK` ➔ Mavi
    - `WHOLESALE` ➔ Yeşil
    - `WEBSHOP` ➔ Kırmızı
    - `AVT SHOPS` ➔ Sarı
  - **TexFlow Çözümü:** Excel'deki maske hilesine gerek kalmadan doğrudan CSS `border-radius: 50%` ile kusursuz vektörel yuvarlak renkli etiket üretilecek.
- **Koli Üstü Baskı Formatı:**
  - Yatayda tek bir A4 kağıda 2 adet etiket (x2) basılacak formatta düzenlenmiştir.

---

## 3. TexFlow Entegrasyon Mimarisi

1. **Çeki Listesi Yükleme & Veri Ayrıştırma (`parser_engine.py`):**
   - Excel yüklendiğinde model, renk, beden adetleri ayrıştırılır.
   - `styles` tablosunda ilgili modele ait **"Yüklenen Adetler (Shipped Qty)"** otomatik güncellenir.
   - Kanal bazlı (Webshop, AVT Shops vb.) kırılımlar işlenir.
2. **Koli Üstü Etiket Üretimi (`static/koli_etiket.html` veya PDF Motoru):**
   - Web arayüzünde tek tıkla koli listesinden seçilen koli veya tüm koliler için A4 yatayda 2'şerli (x2) yazdırma formatı.
   - Renk dairesi CSS ile dinamik renklendirilir.
3. **Sıfır Geliştirici Müdahalesi (Zero-Code Auto Mapping):**
   - Yeni müşteri formatı geldiğinde sistem kolonları tahmin eder (Style -> Model, Colour -> Renk).
   - Kullanıcı ilk seferde eşlemeyi teyit edip *"Şablonu Kaydet"* der; sonraki tüm yüklemeler geliştiriciye ihtiyaç duymadan otomatikleşir.

---

## 4. Evde Çalışmaya Başlarken Hatırlatma

Evdeki yapay zeka asistanına veya TexFlow projesine devam ederken şu komutla başlanabilir:
> *"C:\Users\ASLI CELIK\.gemini\antigravity\scratch\textile-production-system\KOLI_USTU_VE_CEKI_LISTESI_ENTEGRASYON_NOTLARI.md dosyasındaki analize göre Texflow içine Çeki Listesi yükleme ve Anna Van Toor koli üstü etiket basma modülünü entegre etmeye başlayalım."*
