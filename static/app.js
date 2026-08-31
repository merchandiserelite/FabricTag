// Global Foolproof Tab Switcher
window.switchAppTab = function(targetTab, btnEl) {
    try {
        const navButtons = document.querySelectorAll(".nav-btn");
        const tabContents = document.querySelectorAll(".tab-content");
        
        navButtons.forEach(btn => btn.classList.remove("active"));
        tabContents.forEach(tab => tab.classList.remove("active"));
        
        if (btnEl) {
            btnEl.classList.add("active");
        } else {
            const matchedBtn = document.querySelector(`.nav-btn[data-tab="${targetTab}"]`);
            if (matchedBtn) matchedBtn.classList.add("active");
        }
        
        const targetContent = document.getElementById(targetTab);
        if (targetContent) targetContent.classList.add("active");
        
        const sidebar = document.getElementById("app-sidebar");
        const sidebarOverlay = document.getElementById("sidebar-overlay");
        if (sidebar) sidebar.classList.remove("mobile-open");
        if (sidebarOverlay) sidebarOverlay.classList.remove("active");
        
        if (targetTab === "database-tab" && typeof window.loadDatabase === "function") {
            window.loadDatabase();
        } else if (targetTab === "settings-tab" && typeof window.loadSettings === "function") {
            window.loadSettings();
        }
    } catch (e) {
        console.error("switchAppTab error:", e);
    }
};

function initApp() {
    // DOM Elements
    const navButtons = document.querySelectorAll(".nav-btn");
    const tabContents = document.querySelectorAll(".tab-content");
    
    const sidebar = document.getElementById("app-sidebar");
    const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
    const sidebarCloseBtn = document.getElementById("sidebar-close-btn");
    const sidebarOverlay = document.getElementById("sidebar-overlay");
    
    const dragDropZone = document.getElementById("drag-drop-zone");
    const fileInput = document.getElementById("file-input");
    const mobileGalleryInput = document.getElementById("mobile-gallery-input");
    const cameraFileInput = document.getElementById("camera-file-input");
    
    // Live Continuous Camera Elements
    const webcamBtn = document.getElementById("webcam-btn");
    const videoContainer = document.getElementById("video-container");
    const video = document.getElementById("cameraStream");
    const captureBtn = document.getElementById("captureBtn");
    const statusLog = document.getElementById("statusLog");
    const closeWebcamBtn = document.getElementById("close-webcam-btn");
    
    const queueBox = document.getElementById("queue-box");
    const queueGrid = document.getElementById("queue-grid");
    const queueCount = document.getElementById("queue-count");
    const btnClearQueue = document.getElementById("btn-clear-queue");
    const btnProcessQueue = document.getElementById("btn-process-queue");

    const previewBox = document.getElementById("preview-box");
    const imagePreview = document.getElementById("image-preview");
    const btnClearImage = document.getElementById("btn-clear-image");
    
    const analysisLoader = document.getElementById("analysis-loader");
    const loaderTitle = document.getElementById("loader-title");
    const progressBarBox = document.getElementById("progress-bar-box");
    const progressBarFill = document.getElementById("progress-bar-fill");
    const progressText = document.getElementById("progress-text");
    
    const resultCard = document.getElementById("result-card");
    const fabricForm = document.getElementById("fabric-form");
    const internalCodeGroup = document.getElementById("internal-code-group");
    const duplicateWarning = document.getElementById("duplicate-warning");
    
    // Form Inputs
    const inputInternalCode = document.getElementById("form-internal-code");
    const inputCompany = document.getElementById("form-company-name");
    const inputQualityCode = document.getElementById("form-quality-code");
    const inputQualityName = document.getElementById("form-quality-name");
    const inputDesign = document.getElementById("form-design-code");
    const inputWidth = document.getElementById("form-width");
    const inputWeight = document.getElementById("form-weight");
    const inputComposition = document.getElementById("form-composition");
    const inputBarcode = document.getElementById("form-barcode");
    
    const radioOptA = document.getElementById("radio-opt-a");
    const radioOptB = document.getElementById("radio-opt-b");

    const btnSaveOnly = document.getElementById("btn-save-only");
    const btnSavePrint = document.getElementById("btn-save-print");
    const btnPrintOnly = document.getElementById("btn-print-only");

    // Database Tab
    const dbSearch = document.getElementById("db-search");
    const dbTableBody = document.getElementById("db-table-body");
    const btnRefreshDb = document.getElementById("btn-refresh-db");
    const selectAllDb = document.getElementById("select-all-db");
    const btnBatchPrint = document.getElementById("btn-batch-print");
    const batchTemplateSelect = document.getElementById("batch-template-select");
    
    // Settings Tab & Preferences
    const settingsApiKey = document.getElementById("settings-api-key");
    const btnSaveSettings = document.getElementById("btn-save-settings");
    const apiKeySavedText = document.getElementById("api-key-saved-text");
    const networkAccessUrl = document.getElementById("network-access-url");
    
    const prefDefaultTemplate = document.getElementById("pref-default-template");
    const prefPrinterType = document.getElementById("pref-printer-type");
    const prefLabelWidth = document.getElementById("pref-label-width");
    const prefLabelHeight = document.getElementById("pref-label-height");
    const prefColGap = document.getElementById("pref-col-gap");
    const prefRowGap = document.getElementById("pref-row-gap");
    const prefMarginTop = document.getElementById("pref-margin-top");
    const prefMarginLeft = document.getElementById("pref-margin-left");
    const btnSavePrintPrefs = document.getElementById("btn-save-print-prefs");

    // Visual Designer Elements
    const desOptA = document.getElementById("des-opt-a");
    const desOptB = document.getElementById("des-opt-b");
    const desLogoVisible = document.getElementById("des-logo-visible");
    const desLogoSelect = document.getElementById("des-logo-select");
    const btnUploadLogo = document.getElementById("btn-upload-logo");
    const logoFileInput = document.getElementById("logo-file-input");
    const desLogoHeight = document.getElementById("des-logo-height");
    const valLogoHeight = document.getElementById("val-logo-height");
    const desLogoAlign = document.getElementById("des-logo-align");
    const logoControlsContent = document.getElementById("logo-controls-content");
    
    // Theme & Label Background / Border
    const desLabelBgColor = document.getElementById("des-label-bg-color");
    const desLabelBorderStyle = document.getElementById("des-label-border-style");
    const desLabelBorderColor = document.getElementById("des-label-border-color");
    const groupLabelBorderColor = document.getElementById("group-label-border-color");

    // Bar Styles & Colors
    const desBarStyle = document.getElementById("des-bar-style");
    const desBarBgColor = document.getElementById("des-bar-bg-color");
    const desBarTextColor = document.getElementById("des-bar-text-color");
    const desBarRadius = document.getElementById("des-bar-radius");
    const rowBarBgColor = document.getElementById("row-bar-bg-color");

    // Font Family & Fiber Abbreviations
    const desFontFamily = document.getElementById("des-font-family");
    const desUseFiberAbbr = document.getElementById("des-use-fiber-abbr");

    // Modular Container & Elements
    const modularElementsList = document.getElementById("modular-elements-list");

    // 1. Firma Adı (Company)
    const desShowCompany = document.getElementById("des-show-company");
    const desFontCompany = document.getElementById("des-font-company");
    const valFontCompany = document.getElementById("val-font-company");
    const desAlignCompany = document.getElementById("des-align-company");

    // 2. Kalite Adı (Quality Name)
    const desShowQualityName = document.getElementById("des-show-quality-name");
    const desFontQualityName = document.getElementById("des-font-quality-name");
    const valFontQualityName = document.getElementById("val-font-quality-name");
    const desAlignQualityName = document.getElementById("des-align-quality-name");
    const desPrefixQualityName = document.getElementById("des-prefix-quality-name");

    // 3. Varyant ve Renk Kodu Barı (Header / Quality Code Bar)
    const desShowQualityCode = document.getElementById("des-show-quality-code");
    const desFontHeader = document.getElementById("des-font-header");
    const valFontHeader = document.getElementById("val-font-header");
    const desAlignQualityCode = document.getElementById("des-align-quality-code");
    const desPrefixQualityCode = document.getElementById("des-prefix-quality-code");

    // 4. Karışım (Composition)
    const desShowComp = document.getElementById("des-show-comp");
    const desFontComp = document.getElementById("des-font-comp");
    const valFontComp = document.getElementById("val-font-comp");
    const desAlignComp = document.getElementById("des-align-comp");
    const desPrefixComposition = document.getElementById("des-prefix-composition");

    // 5. Gramaj (Weight)
    const desShowWeight = document.getElementById("des-show-weight");
    const desFontWeight = document.getElementById("des-font-weight");
    const valFontWeight = document.getElementById("val-font-weight");
    const desAlignWeight = document.getElementById("des-align-weight");
    const desPrefixWeight = document.getElementById("des-prefix-weight");
    
    // Barcode
    const desBarcodeVisible = document.getElementById("des-barcode-visible");
    const desBarcodeHeight = document.getElementById("des-barcode-height");
    const valBarcodeHeight = document.getElementById("val-barcode-height");
    const barcodeControlsContent = document.getElementById("barcode-controls-content");
    
    const dashedLabelBoundary = document.getElementById("dashed-label-boundary");
    const designerLiveLabel = document.getElementById("designer-live-label");
    const previewDimBadge = document.getElementById("preview-dim-badge");
    const btnSaveVisualDesign = document.getElementById("btn-save-visual-design");
    const btnResetDefaultDesign = document.getElementById("btn-reset-default-design");

    // Internal Code Format Elements
    const codeTypeLetters = document.getElementById("code-type-letters");
    const codeTypeNumbers = document.getElementById("code-type-numbers");
    const codePrefixText = document.getElementById("code-prefix-text");
    const codeSeparator = document.getElementById("code-separator");
    const codeDigits = document.getElementById("code-digits");
    const codeStartNumber = document.getElementById("code-start-number");
    const codePreviewBadge = document.getElementById("code-preview-badge");
    const btnSaveCodeSettings = document.getElementById("btn-save-code-settings");
    const groupCodePrefixText = document.getElementById("group-code-prefix-text");
    const groupCodeSeparator = document.getElementById("group-code-separator");

    // Sidebar API status
    const statusDot = document.getElementById("status-dot");
    const statusText = document.getElementById("status-text");

    // ==========================================
    // MULTILINGUAL (I18N) TRANSLATION SYSTEM (6 LANGUAGES)
    // ==========================================
    const i18n = {
        "tr": {
                "lang_label": "Dil / Language:",
                "nav_scan": "Kartela Tara",
                "nav_database": "Veritabanı / Geçmiş",
                "nav_settings": "Ayarlar & Tasarım",
                "nav_user_guide": "Kullanım Rehberi",
                "sidebar_subtitle": "Swatch & Hanger AI",
                "btn_install_pwa": "Telefona Uygulama Olarak Yükle",
                "mobile_qr_title": "Mobil & QR Bağlantı",
                "btn_license_activate": "Lisansla / Satın Al",
                "api_active": "Gemini API Aktif",
                "api_offline": "Gemini API Bağlı Değil",
                "scan_header_title": "Kartela Tarama Ekranı",
                "scan_header_desc": "Kumaş kartelası fotoğraflarını çekin veya yükleyin.",
                "drag_drop_title": "Kartela Resimlerini Yükleyin / Çekin",
                "drag_drop_subtitle": "Tıklayarak veya sürükleyerek",
                "drag_drop_limits": "JPEG, JPG, PNG (Çoklu Fotoğraf Seçebilirsiniz)",
                "btn_normal_camera": "Kamera ile Çek",
                "btn_choose_files": "Galeriden / Dosyadan Seç",
                "btn_live_camera": "Canlı Kamera (Seri Çekim)",
                "btn_capture_now": "Kartela Fotoğrafı Çek & Oku",
                "btn_close_camera": "Kamerayı Kapat",
                "queue_title": "Fotoğraf Kuyruğu",
                "btn_clear_queue": "Kuyruğu Temizle",
                "btn_process_queue": "Kuyruktaki Tüm Kartelaları Oku & Kaydet",
                "loader_title": "Yapay Zeka Kartelayı Çözümlüyor...",
                "loader_subtitle": "Yazılar okunuyor, resim sıkıştırılıyor ve veriler gruplanıyor.",
                "form_title": "Okunan Kartela Bilgileri",
                "lbl_internal_code": "Atanan İç Kod (Internal Code)",
                "lbl_company": "Kumaşçı / Üretici Firma",
                "lbl_quality_code": "Kalite Kodu (Article)",
                "lbl_quality_name": "Kalite Adı (Name)",
                "lbl_design_code": "Desen / Varyant Kodu (Design)",
                "lbl_width": "En (Width)",
                "lbl_weight": "Gramaj (Weight)",
                "lbl_composition": "Karışım / Yapı (Composition - Sembolsüz)",
                "lbl_barcode": "Barkod / QR Değeri",
                "template_select_title": "Yazıcı Şablonu Seçin:",
                "opt_a_name": "Seçenek A",
                "opt_a_desc": "Gizli / Sır Etiket",
                "opt_b_name": "Seçenek B",
                "opt_b_desc": "Açık Detaylı Etiket",
                "btn_save_only": "Yalnızca Kaydet",
                "btn_save_print": "Kaydet & Yazdır",
                "btn_print_only": "Yalnızca Yazdır",
                "db_header_title": "Kumaş Veritabanı ve Geçmişi",
                "db_header_desc": "Şu ana kadar taranan ve kaydedilen tüm etiketler burada tutulur.",
                "btn_excel_backup_modal": "Excel (.xlsx) & Yedekleme",
                "btn_batch_print": "Seçilenleri Toplu Yazdır (A4)",
                "th_code": "İç Kod",
                "th_company": "Firma",
                "th_quality_code": "Kalite Kodu",
                "th_quality_name": "Kalite Adı",
                "th_design_code": "Desen Kodu",
                "th_composition": "Karışım",
                "th_width": "En",
                "th_weight": "Gramaj",
                "th_actions": "İşlemler",
                "db_loading": "Veritabanı yükleniyor...",
                "settings_header_title": "Sistem Ayarları & Görsel Etiket Tasarımcısı",
                "settings_header_desc": "Etiket tasarımı, logo seçimi, yazı tipi (font), özel boyutlar ve alan hizalamaları.",
                "studio_title": "Canlı Görsel Etiket Tasarım Stüdyosu",
                "studio_desc": "Etiket üzerindeki verilerin konumunu, boyutunu, hizalamasını ve logoyu canlı taslak üzerinden düzenleyin.",
                "btn_reset_default": "Varsayılana Sıfırla",
                "btn_save_design": "Tasarım Ayarlarını Kaydet",
                "preview_title": "Canlı Taslak Önizleme",
                "dashed_help_strong": "Kesikli Çizgiler:",
                "dashed_help_text": "Etiketinizin fiziksel kesim sınırıdır. Logo veya yazıların bu sınırın dışına taşmadığından emin olun.",
                "ctrl_template_type": "Şablon Türü",
                "opt_a_full": "Seçenek A (Gizli Kodlu)",
                "opt_b_full": "Seçenek B (Detaylı Açık)",
                "opt_a_desc_full": "Seçenek A (Gizli / Sır Etiket)",
                "opt_b_desc_full": "Seçenek B (Açık Detaylı Etiket)",
                "ctrl_logo_title": "Şirket Logosu",
                "lbl_active_logo": "Aktif Logo Seçimi:",
                "opt_default_logo": "Varsayılan FabricTag Logo",
                "btn_upload_logo": "Logo Yükle",
                "lbl_logo_height": "Logo Yüksekliği:",
                "lbl_logo_align": "Logo Hizalama:",
                "opt_align_left": "Sol",
                "opt_align_center": "Orta",
                "opt_align_right": "Sağ",
                "ctrl_font_sizes": "Yazı Fontu & Alan Boyutları",
                "lbl_font_family": "Yazı Font Ailesi (Yazı Tipi):",
                "opt_font_outfit": "Outfit (Modern & Temiz - Varsayılan)",
                "opt_font_arial": "Arial / Helvetica (Klasik & Keskin)",
                "opt_font_inter": "Inter (Kurumsal & Düzgün)",
                "opt_font_roboto": "Roboto (Dengeli & Okunaklı)",
                "opt_font_montserrat": "Montserrat (Şık & Geometrik)",
                "opt_font_courier": "Courier / Monospace (Teknik / Daktilo)",
                "ctrl_fiber_abbr_title": "Uluslararası Elyaf Kısaltması (ISO/BISFA)",
                "ctrl_fiber_abbr_desc": "Örn: Pamuk ➔ CO, Polyester ➔ PES, Elastan ➔ EA, Viskon ➔ CV",
                "lbl_field_company": "Firma Adı",
                "lbl_field_quality_name": "Kalite Adı",
                "lbl_field_variant_code": "Varyant ve Renk Kodu",
                "lbl_field_composition": "Karışım",
                "lbl_field_weight": "Gramaj",
                "lbl_align": "Hizalama:",
                "lbl_black_bar": "Siyah Zemin / Beyaz Yazı (Seçenek B):",
                "ctrl_barcode_title": "Barkod Çizgisi",
                "lbl_barcode_height": "Barkod Yüksekliği:",
                "page_dimensions_title": "Sayfa ve Kağıt Ölçüleri (A4 / Argox Rulo)",
                "page_dimensions_desc": "Etiketinizin fiziksel milimetre ölçülerini ve boşluklarını belirleyin.",
                "lbl_default_template": "Varsayılan Yazdırma Şablonu",
                "lbl_printer_type": "Yazıcı Türü",
                "opt_printer_a4": "A4 Lazer Yazıcı (3x6 Izgara Sayfa)",
                "opt_printer_argox": "Argox / Rulo Termal Yazıcı (Tekli Sürekli)",
                "lbl_label_width": "Etiket Genişliği (mm)",
                "lbl_label_height": "Etiket Yüksekliği (mm)",
                "lbl_col_gap": "Sütun Arası Boşluk (mm)",
                "lbl_row_gap": "Satır Arası Boşluk (mm)",
                "lbl_margin_top": "Sayfa Üst Kenar Boşluğu (mm)",
                "lbl_margin_left": "Sayfa Sol Kenar Boşluğu (mm)",
                "btn_save_paper": "Kağıt Ölçülerini Kaydet",
                "api_config_title": "Gemini API Yapılandırması",
                "api_config_desc": "Karteladaki metinleri yüksek doğrulukla okuyabilmek için Google Gemini yapay zekasına ihtiyaç duyulmaktadır.",
                "lbl_api_key": "Gemini API Key (Anahtarı)",
                "btn_save": "Kaydet",
                "modal_backup_title": "Excel (.xlsx) Dışa Aktarma & Yedekleme Merkezi",
                "btn_quick_export": "Tüm Veritabanını Excel (.xlsx) Olarak İndir",
                "btn_download_template": "Şablon İndir (.xlsx)",
                "btn_confirm_import": "Kumaşları İçe Aktar",
                "btn_cancel": "İptal / Kapat",
                "guide_modal_title": "FabricTag Hızlı Başlangıç & Kullanım Rehberi",
                "guide_step1_title": "1. Gemini Yapay Zeka API Anahtarı Kurulumu",
                "guide_step1_desc": "FabricTag kartelaları okumak için Google Gemini AI modelini kullanır. Google AI Studio üzerinden ücretsiz API anahtarınızı alıp Ayarlar sekmesine girmeniz yeterlidir.",
                "guide_step1_btn": "Ücretsiz Google API Anahtarı Al",
                "guide_step2_title": "2. Kartela Tarama ve Otomatik Okuma",
                "guide_step2_desc": "Kartela fotoğrafını 3 şekilde yükleyebilirsiniz: Webcam/Kamera ile seri çekim, Telefondan QR ile Kablosuz tarama veya Fotoğraf Yükleyerek. Yapay zeka tüm kumaş bilgilerini saniyeler içinde ayrıştırır.",
                "guide_step3_title": "3. Görsel Etiket Tasarımı & Barkod Baskısı",
                "guide_step3_desc": "Ayarlar & Tasarım bölümünden logonuzu yükleyebilir, etiket satırlarını sürükle-bırak ile dilediğiniz gibi sıralayabilir ve font/renkleri canlı önizleyebilirsiniz. A4 tabaka veya Argox/Zebra rulo yazıcılara tam uyumludur.",
                "guide_step4_title": "4. Excel İçe/Dışa Aktarma ve Bulut Yedekleme",
                "guide_step4_desc": "Mevcut Excel arşivinizi tek tıkla sisteme aktarabilir veya kayıtlarınızı filtreleyip Excel olarak dışa aktarabilirsiniz. OneDrive bulut yedekleme sistemiyle verileriniz her gün otomatik korunur.",
                "btn_understood": "Anladım, Başla",
                "license_modal_title": "FabricTag Lisans Aktivasyonu",
                "license_trial_desc": "İlk 20 kumaş kaydını ücretsiz olarak deneyebilirsiniz. Sınırsız kullanım ve ticari lisans için lütfen aktivasyon anahtarınızı girin.",
                "lbl_hardware_id": "Bilgisayarınızın Donanım Kimliği (Hardware ID):",
                "hardware_id_help": "Lisans anahtarı satın alırken bu kodu bize iletmeniz yeterlidir.",
                "lbl_enter_license_key": "Aktivasyon / Lisans Anahtarı:",
                "btn_activate_now": "Lisansı Aktive Et",
                "backup_dir_title": "Özel Yedekleme Klasörü ve Otomatik Senkronizasyon",
                "backup_dir_desc": "FabricTag her yedek aldığında verilerinizi otomatik olarak bu klasöre de kopyalar (Örn: Harici Disk, D:\Sürücüsü, Google Drive veya Dropbox klasörü).",
                "lbl_backup_folder_path": "Yedekleme Klasör Yolu (Klasör Dizini):",
                "btn_open_folder": "Klasörü Aç",
                "update_center_title": "Sistem Sürümü & Güncelleme Merkezi",
                "update_center_desc": "FabricTag sisteminizin güncelliğini denetleyin ve en son kararlı yapay zeka modellerine erişin.",
                "lbl_current_version": "Kurulu Sistem Sürümü:",
                "status_latest_version": "Güncel Sürüm",
                "btn_check_update": "Güncellemeleri Denetle",
                "update_banner_title": "Yeni FabricTag Güncellemesi Mevcut!",
                "update_banner_desc": "Daha yüksek yapay zeka performansı ve yeni özellikler için güncelleyin.",
                "btn_download_update": "Güncellemeyi İndir"
        },
        "en": {
                "lang_label": "Language:",
                "nav_scan": "Scan Swatch",
                "nav_database": "Database / History",
                "nav_settings": "Settings & Design",
                "nav_user_guide": "User Guide",
                "sidebar_subtitle": "Swatch & Hanger AI",
                "btn_install_pwa": "Install as Phone App",
                "mobile_qr_title": "Mobile & QR Connect",
                "btn_license_activate": "License / Activate",
                "api_active": "Gemini API Active",
                "api_offline": "Gemini API Offline",
                "scan_header_title": "Fabric Swatch Scanner",
                "scan_header_desc": "Capture or upload fabric swatches for AI instant extraction.",
                "drag_drop_title": "Upload or Capture Swatch Photos",
                "drag_drop_subtitle": "Click or drag & drop images",
                "drag_drop_limits": "JPEG, JPG, PNG (Supports multiple file selection)",
                "btn_normal_camera": "Take Photo",
                "btn_choose_files": "Select from Files / Gallery",
                "btn_live_camera": "Live Camera (Continuous Mode)",
                "btn_capture_now": "Capture & Analyze Swatch",
                "btn_close_camera": "Close Camera",
                "queue_title": "Photo Queue",
                "btn_clear_queue": "Clear Queue",
                "btn_process_queue": "Process & Save All Swatches in Queue",
                "loader_title": "AI is Analyzing Swatch Card...",
                "loader_subtitle": "Reading text, enhancing image, structuring fabric attributes.",
                "form_title": "Extracted Swatch Information",
                "lbl_internal_code": "Assigned Internal Code",
                "lbl_company": "Manufacturer / Company Name",
                "lbl_quality_code": "Article / Quality Code",
                "lbl_quality_name": "Quality Name",
                "lbl_design_code": "Design / Variant Code",
                "lbl_width": "Width",
                "lbl_weight": "Weight (GSM)",
                "lbl_composition": "Composition (Punctuation Free)",
                "lbl_barcode": "Barcode / QR Value",
                "template_select_title": "Choose Print Label Template:",
                "opt_a_name": "Option A",
                "opt_a_desc": "Secret / Blind Label",
                "opt_b_name": "Option B",
                "opt_b_desc": "Detailed Open Label",
                "btn_save_only": "Save Only",
                "btn_save_print": "Save & Print",
                "btn_print_only": "Print Only",
                "db_header_title": "Fabric Database & Archive",
                "db_header_desc": "All scanned and saved fabric swatch records are safely stored here.",
                "btn_excel_backup_modal": "Excel (.xlsx) & Backup Center",
                "btn_batch_print": "Batch Print Selected (A4)",
                "th_code": "Internal Code",
                "th_company": "Company",
                "th_quality_code": "Quality Code",
                "th_quality_name": "Quality Name",
                "th_design_code": "Design Code",
                "th_composition": "Composition",
                "th_width": "Width",
                "th_weight": "Weight",
                "th_actions": "Actions",
                "db_loading": "Loading fabric database...",
                "settings_header_title": "System Settings & Visual Label Designer",
                "settings_header_desc": "Label layout, logo selection, typography, custom dimensions, and field alignments.",
                "studio_title": "Live Visual Label Design Studio",
                "studio_desc": "Customize element positions, sizes, alignments, and company logo in real-time.",
                "btn_reset_default": "Reset to Default",
                "btn_save_design": "Save Design Settings",
                "preview_title": "Live Label Preview",
                "dashed_help_strong": "Dashed Lines:",
                "dashed_help_text": "Represents the physical cutting border of your sticker label.",
                "ctrl_template_type": "Template Style",
                "opt_a_full": "Option A (Secret Code)",
                "opt_b_full": "Option B (Detailed Open)",
                "opt_a_desc_full": "Option A (Secret / Blind Label)",
                "opt_b_desc_full": "Option B (Detailed Open Label)",
                "ctrl_logo_title": "Company Logo",
                "lbl_active_logo": "Active Logo:",
                "opt_default_logo": "Default FabricTag Logo",
                "btn_upload_logo": "Upload Logo",
                "lbl_logo_height": "Logo Height:",
                "lbl_logo_align": "Logo Alignment:",
                "opt_align_left": "Left",
                "opt_align_center": "Center",
                "opt_align_right": "Right",
                "ctrl_font_sizes": "Typography & Field Sizing",
                "lbl_font_family": "Font Family (Typeface):",
                "opt_font_outfit": "Outfit (Modern & Clean - Default)",
                "opt_font_arial": "Arial / Helvetica (Classic & Sharp)",
                "opt_font_inter": "Inter (Corporate & Crisp)",
                "opt_font_roboto": "Roboto (Balanced & Legible)",
                "opt_font_montserrat": "Montserrat (Geometric & Sleek)",
                "opt_font_courier": "Courier / Monospace (Technical / Typewriter)",
                "ctrl_fiber_abbr_title": "International Fiber Abbreviations (ISO/BISFA)",
                "ctrl_fiber_abbr_desc": "E.g., Cotton ➔ CO, Polyester ➔ PES, Elastane ➔ EA, Viscose ➔ CV",
                "lbl_field_company": "Company Name",
                "lbl_field_quality_name": "Quality Name",
                "lbl_field_variant_code": "Variant & Color Code",
                "lbl_field_composition": "Composition",
                "lbl_field_weight": "Weight",
                "lbl_align": "Alignment:",
                "lbl_black_bar": "Black Background / White Text (Option B):",
                "ctrl_barcode_title": "Barcode Graphic",
                "lbl_barcode_height": "Barcode Height:",
                "page_dimensions_title": "Page & Sheet Dimensions (A4 / Argox Roll)",
                "page_dimensions_desc": "Specify physical millimeter dimensions and grid margins.",
                "lbl_default_template": "Default Print Template",
                "lbl_printer_type": "Printer Type",
                "opt_printer_a4": "A4 Laser Printer (3x6 Grid Sheet)",
                "opt_printer_argox": "Argox / Roll Thermal Printer (Continuous)",
                "lbl_label_width": "Label Width (mm)",
                "lbl_label_height": "Label Height (mm)",
                "lbl_col_gap": "Column Gap (mm)",
                "lbl_row_gap": "Row Gap (mm)",
                "lbl_margin_top": "Page Top Margin (mm)",
                "lbl_margin_left": "Page Left Margin (mm)",
                "btn_save_paper": "Save Page Dimensions",
                "api_config_title": "Gemini AI Configuration",
                "api_config_desc": "Google Gemini AI vision engine is used to read text from swatch cards with high precision.",
                "lbl_api_key": "Gemini API Key",
                "btn_save": "Save",
                "modal_backup_title": "Excel (.xlsx) Export & Backup Hub",
                "btn_quick_export": "Download Full Database as Excel (.xlsx)",
                "btn_download_template": "Download Template (.xlsx)",
                "btn_confirm_import": "Import Fabrics",
                "btn_cancel": "Cancel / Close",
                "guide_modal_title": "FabricTag Quick Start & User Guide",
                "guide_step1_title": "1. Gemini AI API Key Setup",
                "guide_step1_desc": "FabricTag uses Google Gemini AI to analyze swatch cards. Get your free API key from Google AI Studio and enter it into the Settings tab.",
                "guide_step1_btn": "Get Free Google API Key",
                "guide_step2_title": "2. Swatch Scanning & Automatic Extraction",
                "guide_step2_desc": "Capture swatches in 3 easy ways: Webcam continuous capture, Wireless Mobile QR Scan, or File Upload. AI extracts all fabric attributes in seconds.",
                "guide_step3_title": "3. Visual Label Designer & Barcode Printing",
                "guide_step3_desc": "Upload your company logo, drag-and-drop label fields, and preview typography in real time. Fully compatible with A4 sheets and Zebra/Argox roll printers.",
                "guide_step4_title": "4. Excel Import/Export & Cloud Backup",
                "guide_step4_desc": "Import existing Excel archives with 1-click column matching, or export filtered data. Automated daily backups protect your archive in OneDrive cloud.",
                "btn_understood": "Understood, Start",
                "license_modal_title": "FabricTag License Activation",
                "license_trial_desc": "Enjoy your first 20 fabric records for free. Enter your commercial activation key for unlimited usage.",
                "lbl_hardware_id": "Your Machine Hardware ID:",
                "hardware_id_help": "Simply send this code when purchasing a commercial license key.",
                "lbl_enter_license_key": "Activation / License Key:",
                "btn_activate_now": "Activate License",
                "backup_dir_title": "Custom Backup Directory & Auto-Sync",
                "backup_dir_desc": "FabricTag automatically mirrors your database and Excel archives to this directory on every backup (e.g. USB Drive, D:\Drive, Google Drive or Dropbox folder).",
                "lbl_backup_folder_path": "Backup Folder Path (Directory):",
                "btn_open_folder": "Open Folder",
                "update_center_title": "System Version & Update Center",
                "update_center_desc": "Check system update status and access latest stable AI vision models.",
                "lbl_current_version": "Installed System Version:",
                "status_latest_version": "Latest Version",
                "btn_check_update": "Check for Updates",
                "update_banner_title": "New FabricTag Update Available!",
                "update_banner_desc": "Update now for enhanced AI accuracy and latest performance improvements.",
                "btn_download_update": "Download Update"
        },
        "de": {
                "lang_label": "Sprache:",
                "nav_scan": "Muster Scannen",
                "nav_database": "Datenbank / Historie",
                "nav_settings": "Einstellungen & Design",
                "nav_user_guide": "Benutzerhandbuch",
                "sidebar_subtitle": "Swatch & Hanger AI",
                "btn_install_pwa": "Als Handy-App installieren",
                "mobile_qr_title": "Mobil & QR-Verbindung",
                "btn_license_activate": "Lizenzieren / Kaufen",
                "api_active": "Gemini API Aktiv",
                "api_offline": "Gemini API Nicht Verbunden",
                "scan_header_title": "Stoffmuster-Scanner",
                "scan_header_desc": "Fotografieren oder laden Sie Stoffmusterkarten für die KI-Erkennung hoch.",
                "btn_save_only": "Nur Speichern",
                "btn_save_print": "Speichern & Drucken",
                "btn_print_only": "Nur Drucken",
                "btn_reset_default": "Auf Standard zurücksetzen",
                "btn_save_design": "Design Speichern",
                "btn_download_template": "Vorlage Herunterladen (.xlsx)",
                "btn_understood": "Verstanden, Loslegen",
                "btn_activate_now": "Lizenz Aktivieren",
                "license_modal_title": "FabricTag Lizenzaktivierung",
                "guide_modal_title": "FabricTag Schnellstart & Benutzerhandbuch",
                "guide_step1_title": "1. Gemini KI API-Schlüssel Einrichtung",
                "guide_step1_desc": "FabricTag verwendet Google Gemini AI zur Musterkartenerkennung. Erstellen Sie Ihren kostenlosen API-Schlüssel in Google AI Studio und tragen Sie ihn in den Einstellungen ein.",
                "guide_step1_btn": "Kostenlosen Google API-Schlüssel holen",
                "guide_step2_title": "2. Muster Scannen & Automatische Erkennung",
                "guide_step2_desc": "Laden Sie Musterfotos auf 3 Arten hoch: Kamera/Webcam-Serienaufnahme, Drahtlos über Handy-QR-Code oder Datei-Upload. Die KI strukturiert alle Stoffdaten in Sekunden.",
                "guide_step3_title": "3. Visuelles Etikettendesign & Barcode-Druck",
                "guide_step3_desc": "Laden Sie Ihr Logo hoch, ordnen Sie Etikettenzeilen per Drag-and-Drop an und passen Sie Schriftarten/Farben in der Live-Vorschau an. Kompatibel mit A4-Bögen und Zebra/Argox-Rollendruckern.",
                "guide_step4_title": "4. Excel-Import/Export & Cloud-Backup",
                "guide_step4_desc": "Importieren Sie vorhandene Excel-Listen mit einem Klick oder exportieren Sie gefilterte Daten. Automatische tägliche Sicherung mit OneDrive Cloud-Schutz.",
                "backup_dir_title": "Benutzerdefinierter Sicherungsordner & Auto-Sync",
                "backup_dir_desc": "FabricTag spiegelt Ihre Datenbank- und Excel-Archive bei jeder Sicherung automatisch in diesen Ordner (z. B. USB-Laufwerk, D:\, Google Drive).",
                "lbl_backup_folder_path": "Sicherungsordnerpfad:",
                "btn_open_folder": "Ordner Öffnen",
                "update_center_title": "Systemversion & Update-Zentrum",
                "update_center_desc": "Überprüfen Sie den Update-Status und nutzen Sie die neuesten KI-Modelle.",
                "lbl_current_version": "Installierte Version:",
                "status_latest_version": "Neueste Version",
                "btn_check_update": "Nach Updates Suchen",
                "update_banner_title": "Neues FabricTag-Update Verfügbar!",
                "update_banner_desc": "Aktualisieren Sie jetzt für verbesserte KI-Leistung und neue Funktionen.",
                "btn_download_update": "Update Herunterladen"
        },
        "it": {
                "lang_label": "Lingua:",
                "nav_scan": "Scansiona Cartella",
                "nav_database": "Database / Storico",
                "nav_settings": "Impostazioni & Design",
                "nav_user_guide": "Guida Utente",
                "sidebar_subtitle": "Swatch & Hanger AI",
                "btn_install_pwa": "Installa come App per Telefono",
                "mobile_qr_title": "Connessione Mobile & QR",
                "btn_license_activate": "Attiva Licenza",
                "api_active": "Gemini API Attiva",
                "api_offline": "Gemini API Non Connessa",
                "scan_header_title": "Scansione Cartelle Tessuti",
                "scan_header_desc": "Fotografa o carica i campioni di tessuto per il riconoscimento AI.",
                "btn_save_only": "Salva Soltanto",
                "btn_save_print": "Salva e Stampa",
                "btn_print_only": "Stampa Soltanto",
                "btn_reset_default": "Ripristina Predefinito",
                "btn_save_design": "Salva Impostazioni Design",
                "btn_download_template": "Scarica Modello (.xlsx)",
                "btn_understood": "Ho capito, Inizia",
                "btn_activate_now": "Attiva Licenza Ora",
                "license_modal_title": "Attivazione Licenza FabricTag",
                "guide_modal_title": "Guida Rapida & Istruzioni FabricTag",
                "guide_step1_title": "1. Configurazione Chiave API Gemini AI",
                "guide_step1_desc": "FabricTag utilizza l'intelligenza artificiale Google Gemini. Ottieni la tua chiave API gratuita su Google AI Studio e inseriscila nella scheda Impostazioni.",
                "guide_step1_btn": "Ottieni Chiave API Google Gratuita",
                "guide_step2_title": "2. Scansione Cartelle & Lettura Automatica",
                "guide_step2_desc": "Acquisisci foto in 3 modi: Webcam/Fotocamera, scansione wireless da smartphone via QR, o caricamento immagini. L'IA estrae tutti i dati del tessuto in pochi secondi.",
                "guide_step3_title": "3. Design Visivo Etichetta & Stampa Codici a Barre",
                "guide_step3_desc": "Carica il tuo logo, ordina gli elementi tramite drag & drop e visualizza l'anteprima in tempo reale. Compatibile con fogli A4 e stampanti a rotolo Zebra/Argox.",
                "guide_step4_title": "4. Import/Export Excel & Backup su Cloud",
                "guide_step4_desc": "Importa il tuo archivio Excel esistente con un clic o esporta i dati filtrati. Backup giornaliero automatico con protezione cloud OneDrive.",
                "backup_dir_title": "Cartella di Backup Personalizzata & Sincronizzazione",
                "backup_dir_desc": "FabricTag copia automaticamente i database e i file Excel in questa cartella (es. Unità USB, D:\, Google Drive o Dropbox).",
                "lbl_backup_folder_path": "Percorso Cartella di Backup:",
                "btn_open_folder": "Apri Cartella",
                "update_center_title": "Versione di Sistema & Centro Aggiornamenti",
                "update_center_desc": "Verifica la disponibilità di aggiornamenti e accedi ai modelli AI più recenti.",
                "lbl_current_version": "Versione Installata:",
                "status_latest_version": "Versione Più Recente",
                "btn_check_update": "Controlla Aggiornamenti",
                "update_banner_title": "Nuovo Aggiornamento FabricTag Disponibile!",
                "update_banner_desc": "Aggiorna ora per una maggiore precisione dell'IA e nuove funzionalità.",
                "btn_download_update": "Scarica Aggiornamento"
        },
        "es": {
                "lang_label": "Idioma:",
                "nav_scan": "Escanear Muestra",
                "nav_database": "Base de Datos / Historial",
                "nav_settings": "Ajustes y Diseño",
                "nav_user_guide": "Guía de Usuario",
                "sidebar_subtitle": "Swatch & Hanger AI",
                "btn_install_pwa": "Instalar como App Móvil",
                "mobile_qr_title": "Conexión Móvil y QR",
                "btn_license_activate": "Activar Licencia",
                "api_active": "Gemini API Activa",
                "api_offline": "Gemini API Desconectada",
                "scan_header_title": "Escáner de Muestras de Tela",
                "scan_header_desc": "Tome o suba fotos de muestras de tela para su lectura con IA.",
                "btn_save_only": "Solo Guardar",
                "btn_save_print": "Guardar e Imprimir",
                "btn_print_only": "Solo Imprimir",
                "btn_reset_default": "Restablecer por Defecto",
                "btn_save_design": "Guardar Diseño",
                "btn_download_template": "Descargar Plantilla (.xlsx)",
                "btn_understood": "Entendido, Comenzar",
                "btn_activate_now": "Activar Licencia Ahora",
                "license_modal_title": "Activación de Licencia FabricTag",
                "guide_modal_title": "Guía de Inicio Rápido y Uso de FabricTag",
                "guide_step1_title": "1. Configuración de Clave API de Gemini AI",
                "guide_step1_desc": "FabricTag utiliza Google Gemini AI para leer muestras. Obtenga su clave API gratuita en Google AI Studio e ingrésela en la pestaña Ajustes.",
                "guide_step1_btn": "Obtener Clave API de Google Gratis",
                "guide_step2_title": "2. Escaneo de Muestras y Lectura Automática",
                "guide_step2_desc": "Suba fotos de 3 formas: Cámara/Webcam continua, escaneo inalámbrico móvil vía QR o subiendo fotos. La IA extrae toda la información en segundos.",
                "guide_step3_title": "3. Diseño Visual de Etiquetas e Impresión de Códigos",
                "guide_step3_desc": "Suba su logotipo, ordene los campos arrastrando y soltando, y previsualice en tiempo real. Compatible con hojas A4 e impresoras térmicas Zebra/Argox.",
                "guide_step4_title": "4. Importar/Exportar Excel y Copia en la Nube",
                "guide_step4_desc": "Importe su archivo Excel existente con un clic o exporte datos filtrados. Copias de seguridad automáticas diarias con protección en la nube OneDrive.",
                "backup_dir_title": "Carpeta de Copia de Seguridad Personalizada y Sincronización",
                "backup_dir_desc": "FabricTag copia automáticamente la base de datos y archivos Excel en esta carpeta (ej. Disco USB, D:\, Google Drive o Dropbox).",
                "lbl_backup_folder_path": "Ruta de la Carpeta de Copia:",
                "btn_open_folder": "Abrir Carpeta",
                "update_center_title": "Versión del Sistema y Centro de Actualizaciones",
                "update_center_desc": "Compruebe las actualizaciones del sistema y acceda a los últimos modelos de IA.",
                "lbl_current_version": "Versión Instalada:",
                "status_latest_version": "Última Versión",
                "btn_check_update": "Buscar Actualizaciones",
                "update_banner_title": "¡Nueva Actualización de FabricTag Disponible!",
                "update_banner_desc": "Actualice ahora para mejorar el rendimiento de la IA y nuevas funciones.",
                "btn_download_update": "Descargar Actualización"
        },
        "fr": {
                "lang_label": "Langue:",
                "nav_scan": "Scanner Échantillon",
                "nav_database": "Base de Données / Historique",
                "nav_settings": "Paramètres & Design",
                "nav_user_guide": "Guide d'Utilisation",
                "sidebar_subtitle": "Swatch & Hanger AI",
                "btn_install_pwa": "Installer sur Téléphone",
                "mobile_qr_title": "Connexion Mobile & QR",
                "btn_license_activate": "Activer la Licence",
                "api_active": "Gemini API Connectée",
                "api_offline": "Gemini API Non Connectée",
                "scan_header_title": "Scanner d'Échantillons de Tissu",
                "scan_header_desc": "Prenez ou téléchargez des photos d'échantillons pour analyse IA.",
                "btn_save_only": "Enregistrer Seul",
                "btn_save_print": "Enregistrer & Imprimer",
                "btn_print_only": "Imprimer Seul",
                "btn_reset_default": "Rétablir par Défaut",
                "btn_save_design": "Enregistrer le Design",
                "btn_download_template": "Télécharger Modèle (.xlsx)",
                "btn_understood": "Compris, Démarrer",
                "btn_activate_now": "Activer la Licence Maintenant",
                "license_modal_title": "Activation de Licence FabricTag",
                "guide_modal_title": "Guide de Démarrage Rapide et Utilisation FabricTag",
                "guide_step1_title": "1. Configuration de la Clé API Gemini AI",
                "guide_step1_desc": "FabricTag utilise Google Gemini AI pour analyser les échantillons. Obtenez votre clé API gratuite sur Google AI Studio et entrez-la dans les Paramètres.",
                "guide_step1_btn": "Obtenir une Clé API Google Gratuite",
                "guide_step2_title": "2. Numérisation d'Échantillons et Lecture IA",
                "guide_step2_desc": "Téléchargez des photos de 3 manières : Webcam en continu, numérisation mobile sans fil via QR code ou téléchargement d'images. L'IA extrait toutes les données en quelques secondes.",
                "guide_step3_title": "3. Conception Visuelle d'Étiquettes & Code-Barres",
                "guide_step3_desc": "Ajoutez votre logo, organisez les lignes par glisser-déposer et prévisualisez en direct. Compatible planches A4 et imprimantes d'étiquettes Zebra/Argox.",
                "guide_step4_title": "4. Import/Export Excel & Sauvegarde Cloud",
                "guide_step4_desc": "Importez votre fichier Excel existant en un clic ou exportez vos fiches filtrées. Sauvegarde quotidienne automatique avec protection cloud OneDrive.",
                "backup_dir_title": "Dossier de Sauvegarde Personnalisé & Synchronisation",
                "backup_dir_desc": "FabricTag duplique automatiquement vos données et archives Excel dans ce dossier (ex. Clé USB, D:\, Google Drive ou Dropbox).",
                "lbl_backup_folder_path": "Chemin du Dossier de Sauvegarde :",
                "btn_open_folder": "Ouvrir le Dossier",
                "update_center_title": "Version Système & Centre de Mises à Jour",
                "update_center_desc": "Vérifiez les mises à jour et bénéficiez des derniers modèles d'IA.",
                "lbl_current_version": "Version Installée :",
                "status_latest_version": "Dernière Version",
                "btn_check_update": "Rechercher des Mises à Jour",
                "update_banner_title": "Nouvelle Mise à Jour FabricTag Disponible !",
                "update_banner_desc": "Mettez à jour maintenant pour des performances IA accrues.",
                "btn_download_update": "Télécharger la Mise à Jour"
        },
        "ar": {
                "lang_label": "اللغة:",
                "nav_scan": "مسح البطاقة",
                "nav_database": "قاعدة البيانات / السجل",
                "nav_settings": "الإعدادات والتصميم",
                "nav_user_guide": "دليل الاستخدام",
                "sidebar_subtitle": "Swatch & Hanger AI",
                "btn_install_pwa": "تثبيت كتطبيق على الهاتف",
                "mobile_qr_title": "اتصال الجوال و QR",
                "btn_license_activate": "تفعيل الترخيص",
                "api_active": "Gemini AI متصل",
                "api_offline": "Gemini API غير متصل",
                "scan_header_title": "شاشة مسح بطاقات الأقمشة",
                "scan_header_desc": "التقط أو حمّل صور بطاقات الأقمشة للتعرف الفوري بالذكاء الاصطناعي.",
                "drag_drop_title": "اسحب صورة البطاقة هنا أو اخترها",
                "drag_drop_subtitle": "بالنقر أو السحب والإفلات",
                "drag_drop_limits": "يدعم JPEG, JPG, PNG من الجوال والكاميرا",
                "btn_normal_camera": "التقاط بالكاميرا",
                "btn_choose_files": "اختيار من الملفات / المعرض",
                "btn_live_camera": "كاميرا مباشرة (مسح تسلسلي)",
                "btn_capture_now": "التقاط وقراءة البطاقة",
                "btn_close_camera": "إغلاق الكاميرا",
                "queue_title": "قائمة انتظار الصور",
                "btn_clear_queue": "مسح القائمة",
                "btn_process_queue": "معالجة وحفظ جميع البطاقات",
                "loader_title": "الذكاء الاصطناعي يحلل البطاقة...",
                "loader_subtitle": "جاري قراءة النصوص وضغط الصورة وتجميع البيانات.",
                "form_title": "بيانات البطاقة المستخرجة",
                "lbl_internal_code": "الرمز الداخلي المخصص",
                "lbl_company": "اسم الشركة المصنعة",
                "lbl_quality_code": "رمز الجودة (Article)",
                "lbl_quality_name": "اسم الجودة (Name)",
                "lbl_design_code": "رمز التصميم / اللون",
                "lbl_width": "العرض (Width)",
                "lbl_weight": "الوزن (Grammage)",
                "lbl_composition": "التركيبة والنسيج",
                "lbl_barcode": "قيمة الباركود / QR",
                "template_select_title": "اختر نموذج الملصق:",
                "opt_a_name": "الخيار أ",
                "opt_a_desc": "ملصق رمزي وسري",
                "opt_b_name": "الخيار ب",
                "opt_b_desc": "ملصق مفصل ومفتوح",
                "btn_save_only": "حفظ فقط",
                "btn_save_print": "حفظ وطباعة",
                "btn_print_only": "طباعة فقط",
                "db_header_title": "قاعدة بيانات الأقمشة والسجل",
                "db_header_desc": "يتم حفظ جميع ملصقات الأقمشة الممسوحة هنا بأمان.",
                "btn_excel_backup_modal": "مركز إكسل (.xlsx) والنسخ الاحتياطي",
                "btn_batch_print": "طباعة جماعية للمحدد (A4)",
                "th_code": "الرمز الداخلي",
                "th_company": "الشركة",
                "th_quality_code": "رمز الجودة",
                "th_quality_name": "اسم الجودة",
                "th_design_code": "رمز التصميم",
                "th_composition": "التركيبة",
                "th_width": "العرض",
                "th_weight": "الوزن",
                "th_actions": "إجراءات",
                "db_loading": "جاري تحميل قاعدة البيانات...",
                "settings_header_title": "إعدادات النظام ومصمم الملصقات المرئي",
                "settings_header_desc": "تصميم الملصق، الشعار، الخطوط، الأبعاد ومحاذاة الحقول.",
                "studio_title": "استوديو تصميم الملصقات المرئي المباشر",
                "studio_desc": "عدل مواضع العناصر والأحجام والشعار مباشرة على الملصق الحي.",
                "btn_reset_default": "إعادة للوضع الافتراضي",
                "btn_save_design": "حفظ إعدادات التصميم",
                "preview_title": "معاينة الملصق المباشرة",
                "dashed_help_strong": "الخطوط المتقطعة:",
                "dashed_help_text": "تمثل حدود القص الفعلية للملصق.",
                "ctrl_template_type": "نوع النموذج",
                "opt_a_full": "الخيار أ (برمز سري)",
                "opt_b_full": "الخيار ب (مفصل ومفتوح)",
                "ctrl_logo_title": "شعار الشركة",
                "lbl_active_logo": "الشعار النشط:",
                "btn_upload_logo": "تحميل شعار",
                "lbl_logo_height": "ارتفاع الشعار:",
                "lbl_logo_align": "محاذاة الشعار:",
                "opt_align_left": "يسار",
                "opt_align_center": "وسط",
                "opt_align_right": "يمين",
                "ctrl_font_sizes": "الخطوط وأحجام الحقول",
                "lbl_font_family": "نوع الخط:",
                "btn_download_template": "تحميل القالب (.xlsx)",
                "btn_confirm_import": "استيراد الأقمشة",
                "btn_cancel": "إلغاء / إغلاق",
                "guide_modal_title": "دليل البدء السريع واستخدام FabricTag",
                "guide_step1_title": "1. إعداد مفتاح الذكاء الاصطناعي Gemini API",
                "guide_step1_desc": "يستخدم FabricTag نموذج Google Gemini AI لقراءة الكارتيلات. احصل على مفتاح API المجاني من Google AI Studio وأدخله في تبويب الإعدادات.",
                "guide_step1_btn": "الحصول على مفتاح Google API مجاني",
                "guide_step2_title": "2. مسح كارتيلات الأقمشة والقراءة التلقائية",
                "guide_step2_desc": "يمكنك التقاط الصور بثلاث طرق: كاميرا الويب السريعة، المسح اللاسلكي عبر الهاتف برمز QR، أو رفع الصور. يقوم الذكاء الاصطناعي باستخراج كافة تفاصيل القماش خلال ثوانٍ.",
                "guide_step3_title": "3. تصميم الملصقات وطباعة الباركود المرئي",
                "guide_step3_desc": "قم برفع شعار شركتك، ورتب عناصر الملصق بالسحب والإفلات وعاين النتائج مباشرة. متوافق مع ورق A4 وطابعات الرول الحرارية Zebra/Argox.",
                "guide_step4_title": "4. استيراد/تصدير Excel والنسخ الاحتياطي السحابي",
                "guide_step4_desc": "استورد ملفات Excel الحالية بنقرة واحدة أو قم بتصدير البيانات المفلترة. نسخ احتياطي يومي تلقائي محمي على سحابة OneDrive.",
                "btn_understood": "فهمت، ابدأ الآن",
                "license_modal_title": "تفعيل ترخيص FabricTag",
                "license_trial_desc": "يمكنك تجربة أول 20 سجلاً مجاناً. يرجى إدخال مفتاح الترخيص للاستخدام غير المحدود.",
                "lbl_hardware_id": "معرف أجهزة الكمبيوتر الخاص بك (Hardware ID):",
                "hardware_id_help": "أرسل هذا الرمز إلينا عند شراء مفتاح الترخيص.",
                "lbl_enter_license_key": "مفتاح التفعيل / الترخيص:",
                "btn_activate_now": "تفعيل الترخيص الآن",
                "backup_dir_title": "مجلد النسخ الاحتياطي المخصص والمزامنة التلقائية",
                "backup_dir_desc": "يقوم FabricTag بنسخ قاعدة البيانات وملفات Excel تلقائياً إلى هذا المجلد (مثل قرص USB، أو محرك D:\، أو Google Drive).",
                "lbl_backup_folder_path": "مسار مجلد النسخ الاحتياطي:",
                "btn_open_folder": "فتح المجلد",
                "update_center_title": "إصدار النظام ومركز التحديثات",
                "update_center_desc": "تحقق من حالة تحديث النظام واستفد من أحدث نماذج الذكاء الاصطناعي.",
                "lbl_current_version": "إصدار النظام المثبت:",
                "status_latest_version": "أحدث إصدار",
                "btn_check_update": "التحقق من وجود تحديثات",
                "update_banner_title": "يتوفر تحديث جديد لـ FabricTag!",
                "update_banner_desc": "قم بالتحديث الآن للحصول على أداء أعلى وميزات جديدة.",
                "btn_download_update": "تحميل التحديث"
        },
        "zh": {
                "lang_label": "语言:",
                "nav_scan": "扫描色卡",
                "nav_database": "数据库 / 历史",
                "nav_settings": "设置与设计",
                "nav_user_guide": "使用指南",
                "sidebar_subtitle": "Swatch & Hanger AI",
                "btn_install_pwa": "安装为手机应用",
                "mobile_qr_title": "手机无线扫码连接",
                "btn_license_activate": "激活 / 购买授权",
                "api_active": "Gemini AI 已连接",
                "api_offline": "Gemini API 未连接",
                "scan_header_title": "面料色卡扫描识别",
                "scan_header_desc": "拍摄或上传面料吊牌色卡，AI 自动解析成分、克重和规格。",
                "drag_drop_title": "上传或拍摄色卡图片",
                "drag_drop_subtitle": "点击或拖拽图片至此处",
                "drag_drop_limits": "支持 JPEG, JPG, PNG（支持多图批量选择）",
                "btn_normal_camera": "拍照识别",
                "btn_choose_files": "从相册/文件选择",
                "btn_live_camera": "实时相机（连续拍摄）",
                "btn_capture_now": "拍摄并读取色卡",
                "btn_close_camera": "关闭相机",
                "queue_title": "照片队列",
                "btn_clear_queue": "清空队列",
                "btn_process_queue": "批量解析并保存队列中的所有色卡",
                "loader_title": "AI 正在解析面料色卡...",
                "loader_subtitle": "正在进行高精度文本识别与数据结构化整理。",
                "form_title": "已解析色卡信息",
                "lbl_internal_code": "系统内部编号",
                "lbl_company": "面料商 / 生产厂家",
                "lbl_quality_code": "品号码 (Article)",
                "lbl_quality_name": "品质名称 (Name)",
                "lbl_design_code": "花型号 / 颜色编号",
                "lbl_width": "门幅 (Width)",
                "lbl_weight": "克重 (GSM)",
                "lbl_composition": "成分结构 (Composition)",
                "lbl_barcode": "条形码 / QR 码值",
                "template_select_title": "选择标签打印模板:",
                "opt_a_name": "方案 A",
                "opt_a_desc": "保密 / 隐藏款标签",
                "opt_b_name": "方案 B",
                "opt_b_desc": "公开详细款标签",
                "btn_save_only": "仅保存",
                "btn_save_print": "保存并打印",
                "btn_print_only": "仅打印",
                "db_header_title": "面料数据库与归档",
                "db_header_desc": "所有已扫描和录入的面料记录安全保存在此。",
                "btn_excel_backup_modal": "Excel (.xlsx) 导出与备份中心",
                "btn_batch_print": "批量打印所选 (A4)",
                "th_code": "内部编号",
                "th_company": "面料商",
                "th_quality_code": "品号码",
                "th_quality_name": "品质名称",
                "th_design_code": "花型号",
                "th_composition": "成分",
                "th_width": "门幅",
                "th_weight": "克重",
                "th_actions": "操作",
                "db_loading": "正在加载数据库...",
                "settings_header_title": "系统设置与可视化标签设计器",
                "settings_header_desc": "标签版式、Logo选择、字体排版、自定义尺寸与字段对齐。",
                "studio_title": "实时可视化标签设计工作室",
                "studio_desc": "实时拖拽调整标签元素位置、大小、字体和对齐方式。",
                "btn_reset_default": "恢复默认设计",
                "btn_save_design": "保存标签设计",
                "preview_title": "实时标签预览",
                "dashed_help_strong": "虚线边框:",
                "dashed_help_text": "代表标签的物理裁切边缘，请确保文字和Logo在边框内。",
                "ctrl_template_type": "模板样式",
                "opt_a_full": "方案 A (内部保密码)",
                "opt_b_full": "方案 B (公开详细版)",
                "ctrl_logo_title": "企业 Logo",
                "lbl_active_logo": "当前 Logo:",
                "btn_upload_logo": "上传 Logo",
                "lbl_logo_height": "Logo 高度:",
                "lbl_logo_align": "Logo 对齐:",
                "opt_align_left": "左对齐",
                "opt_align_center": "居中",
                "opt_align_right": "右对齐",
                "ctrl_font_sizes": "字体排版与字段大小",
                "lbl_font_family": "字体系列 (Typeface):",
                "btn_download_template": "下载 Excel 模板",
                "btn_confirm_import": "导入面料数据",
                "btn_cancel": "取消 / 关闭",
                "guide_modal_title": "FabricTag 快速入门与使用指南",
                "guide_step1_title": "1. Gemini AI API 密钥配置",
                "guide_step1_desc": "FabricTag 使用 Google Gemini AI 识别面料样卡。请在 Google AI Studio 获取免费 API 密钥并填入“设置”选项卡中。",
                "guide_step1_btn": "获取免费 Google API 密钥",
                "guide_step2_title": "2. 面料样卡扫描与自动识别",
                "guide_step2_desc": "支持 3 种采集方式：电脑摄像头连拍、手机扫 QR 码无线拍摄或直接上传图片。AI 将在几秒内自动提取所有面料参数。",
                "guide_step3_title": "3. 可视化标签设计与条码打印",
                "guide_step3_desc": "支持上传企业 Logo，拖拽自由排列标签字段，并实时预览字体与颜色。全面兼容 A4 标签纸和 Zebra/Argox 卷筒条码打印机。",
                "guide_step4_title": "4. Excel 数据导入/导出与云备份",
                "guide_step4_desc": "一键导入现有 Excel 面料档案，或将筛选的数据导出为 Excel。每日自动执行 OneDrive 云端备份，确保数据万无一失。",
                "btn_understood": "明白了，开始使用",
                "license_modal_title": "FabricTag 商业授权激活",
                "license_trial_desc": "您可以免费体验前 20 条面料记录。如需无限制使用与商业授权，请输入激活密钥。",
                "lbl_hardware_id": "当前电脑硬件识别码 (Hardware ID):",
                "hardware_id_help": "购买商业授权时，只需将此硬件码提供给我们即可。",
                "lbl_enter_license_key": "激活 / 授权密钥:",
                "btn_activate_now": "立即激活授权",
                "backup_dir_title": "自定义备份文件夹与自动同步",
                "backup_dir_desc": "FabricTag 每次备份时都会自动将数据库和 Excel 归档复制到此目录（如 USB 驱动器、D 盘、Google Drive 或 Dropbox）。",
                "lbl_backup_folder_path": "备份文件夹路径：",
                "btn_open_folder": "打开文件夹",
                "update_center_title": "系统版本与更新中心",
                "update_center_desc": "检查系统更新状态并获取最新的稳定 AI 视觉识别模型。",
                "lbl_current_version": "当前安装版本：",
                "status_latest_version": "最新版本",
                "btn_check_update": "检查更新",
                "update_banner_title": "发现 FabricTag 新版本！",
                "update_banner_desc": "立即更新以体验更强大的 AI 识别能力与新功能。",
                "btn_download_update": "下载更新"
        },
        "ja": {
                "lang_label": "言語:",
                "nav_scan": "スワッチスキャン",
                "nav_database": "データベース / 履歴",
                "nav_settings": "設定・デザイン",
                "nav_user_guide": "利用ガイド",
                "sidebar_subtitle": "Swatch & Hanger AI",
                "btn_install_pwa": "スマホアプリとしてインストール",
                "mobile_qr_title": "スマホ無線QR接続",
                "btn_license_activate": "ライセンス認証",
                "api_active": "Gemini AI 接続中",
                "api_offline": "Gemini API 未接続",
                "scan_header_title": "生地スワッチスキャン画面",
                "scan_header_desc": "生地スワッチカードを撮影またはアップロードしてAI自動解析。",
                "drag_drop_title": "スワッチ画像を撮影またはドラッグ＆ドロップ",
                "drag_drop_subtitle": "クリックまたはドラッグで追加",
                "drag_drop_limits": "JPEG, JPG, PNG 対応（複数選択可能）",
                "btn_normal_camera": "カメラで撮影",
                "btn_choose_files": "ファイル/ギャラリーから選択",
                "btn_live_camera": "リアルタイムカメラ（連続撮影）",
                "btn_capture_now": "撮影してスワッチを解析",
                "btn_close_camera": "カメラを閉じる",
                "queue_title": "撮影キュー",
                "btn_clear_queue": "キューをクリア",
                "btn_process_queue": "キュー内の全スワッチを一括解析・保存",
                "loader_title": "AIが生地スワッチを解析中...",
                "loader_subtitle": "テキスト認識、画像補正、混用率などのデータ構造化を実行中。",
                "form_title": "解析された生地情報",
                "lbl_internal_code": "割り当てられた内部コード",
                "lbl_company": "メーカー / 会社名",
                "lbl_quality_code": "品質コード (Article)",
                "lbl_quality_name": "品質名 (Name)",
                "lbl_design_code": "柄・カラー番号 (Design)",
                "lbl_width": "生地幅 (Width)",
                "lbl_weight": "目付・グラム数 (GSM)",
                "lbl_composition": "混用率 / 組成 (Composition)",
                "lbl_barcode": "バーコード / QR値",
                "template_select_title": "ラベル印刷テンプレートを選択:",
                "opt_a_name": "オプション A",
                "opt_a_desc": "ブラインド / 社内コードラベル",
                "opt_b_name": "オプション B",
                "opt_b_desc": "詳細オープンラベル",
                "btn_save_only": "保存のみ",
                "btn_save_print": "保存して印刷",
                "btn_print_only": "印刷のみ",
                "db_header_title": "生地データベースと履歴",
                "db_header_desc": "スキャンおよび保存されたすべての生地ラベルがここに安全に保存されます。",
                "btn_excel_backup_modal": "Excel (.xlsx) 出力とバックアップ",
                "btn_batch_print": "選択項目を一括印刷 (A4)",
                "th_code": "内部コード",
                "th_company": "会社名",
                "th_quality_code": "品質コード",
                "th_quality_name": "品質名",
                "th_design_code": "柄コード",
                "th_composition": "組成",
                "th_width": "生地幅",
                "th_weight": "目付",
                "th_actions": "操作",
                "db_loading": "データベースを読み込み中...",
                "settings_header_title": "システム設定＆ビジュアルラベルデザイナー",
                "settings_header_desc": "ラベルデザイン、ロゴ選択、フォント、寸法、配置のカスタマイズ。",
                "studio_title": "ライブビジュアルラベルデザインスタジオ",
                "studio_desc": "ラベル上の要素の配置、サイズ、ロゴをリアルタイムで編集できます。",
                "btn_reset_default": "初期設定に戻す",
                "btn_save_design": "デザイン設定を保存",
                "preview_title": "ラベルリアルタイムプレビュー",
                "dashed_help_strong": "破線フレーム:",
                "dashed_help_text": "シールの物理的な裁断境界線です。文字やロゴが収まるようにしてください。",
                "ctrl_template_type": "テンプレート種類",
                "opt_a_full": "オプション A (社内コード)",
                "opt_b_full": "オプション B (詳細公開)",
                "ctrl_logo_title": "企業ロゴ",
                "lbl_active_logo": "現在のロゴ:",
                "btn_upload_logo": "ロゴをアップロード",
                "lbl_logo_height": "ロゴの高さ:",
                "lbl_logo_align": "ロゴの配置:",
                "opt_align_left": "左揃え",
                "opt_align_center": "中央揃え",
                "opt_align_right": "右揃え",
                "ctrl_font_sizes": "フォントと項目サイズ",
                "lbl_font_family": "フォント種類:",
                "btn_download_template": "Excelテンプレートをダウンロード",
                "btn_confirm_import": "生地データをインポート",
                "btn_cancel": "キャンセル / 閉じる",
                "guide_modal_title": "FabricTag クイックスタート＆利用ガイド",
                "guide_step1_title": "1. Gemini AI APIキーの設定",
                "guide_step1_desc": "FabricTagはGoogle Gemini AIを使用して生地見本カードを解析します。Google AI Studioで無料のAPIキーを取得し、「設定」タブに入力してください。",
                "guide_step1_btn": "無料の Google API キーを取得",
                "guide_step2_title": "2. 見本カードのスキャンと自動読み取り",
                "guide_step2_desc": "3つの方法で撮影可能：Webカメラ連続撮影、スマホQRコード無線撮影、画像アップロード。AIが生地の全スペックを数秒で自動抽出します。",
                "guide_step3_title": "3. ビジュアルラベルデザイン＆バーコード印刷",
                "guide_step3_desc": "会社ロゴのアップロード、ドラッグ＆ドロップによる項目配置、リアルタイムプレビューに対応。A4用紙およびZebra/Argoxロールプリンターに完全対応。",
                "guide_step4_title": "4. Excelインポート/エクスポート＆クラウドバックアップ",
                "guide_step4_desc": "既存のExcel生地台帳をワンクリックで取り込み、検索結果をExcel出力可能。OneDriveクラウドバックアップでデータを毎日自動保護します。",
                "btn_understood": "理解しました、開始する",
                "license_modal_title": "FabricTag ライセンス認証",
                "license_trial_desc": "最初の20件の生地データを無料でお試しいただけます。無制限利用にはライセンスキーを入力してください。",
                "lbl_hardware_id": "マシンハードウェア識別ID (Hardware ID):",
                "hardware_id_help": "ライセンス購入時にこのコードをお知らせください。",
                "lbl_enter_license_key": "アクティベーション / ライセンスキー:",
                "btn_activate_now": "今すぐライセンス認証",
                "backup_dir_title": "カスタムバックアップフォルダ＆自動同期",
                "backup_dir_desc": "バックアップ実行時、データベースとExcel台帳をこのフォルダにも自動複製します（USBドライブ、Dドライブ、Google Driveなど）。",
                "lbl_backup_folder_path": "バックアップフォルダのパス:",
                "btn_open_folder": "フォルダを開く",
                "update_center_title": "システムバージョン＆アップデートセンター",
                "update_center_desc": "システムの更新状況を確認し、最新のAIモデルを利用できます。",
                "lbl_current_version": "インストール済みバージョン:",
                "status_latest_version": "最新バージョン",
                "btn_check_update": "更新を確認",
                "update_banner_title": "FabricTagの新しいアップデートがあります！",
                "update_banner_desc": "最新のAI精度向上と新機能をご利用いただくために更新してください。",
                "btn_download_update": "更新をダウンロード"
        }
};

    let currentLang = "tr";
    try {
        currentLang = localStorage.getItem("fabrictag_lang") || "tr";
    } catch(e) {}

    function applyLanguage(lang) {
        currentLang = lang;
        try { localStorage.setItem("fabrictag_lang", lang); } catch (e) {}

        // Crucial: Set document language so the browser's CSS text-transform uses English rules (no dotted I)
        document.documentElement.lang = lang;
        if (lang === "ar") { document.documentElement.dir = "rtl"; } else { document.documentElement.dir = "ltr"; }

        const langDropdown = document.getElementById("app-lang-select");
        if (langDropdown && langDropdown.value !== lang) {
            langDropdown.value = lang;
        }

        const dict = i18n[lang] || i18n.tr;
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (dict[key]) {
                if (el.tagName === "OPTION") {
                    el.textContent = dict[key];
                } else {
                    el.textContent = dict[key];
                }
            }
        });

        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            const key = el.getAttribute("data-i18n-placeholder");
            if (dict[key]) {
                el.placeholder = dict[key];
            }
        });

        if (dbSearch && dict.search_placeholder) {
            dbSearch.placeholder = dict.search_placeholder;
        }

        // Update active class on lang buttons if any exist
        document.querySelectorAll(".lang-btn").forEach(btn => {
            if (btn.dataset.lang === lang) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        if (statusText) {
            statusText.textContent = hasApiKeyConfigured ? dict.api_active : dict.api_offline;
        }
        if (statusDot) {
            statusDot.className = hasApiKeyConfigured ? "status-dot green" : "status-dot red";
        }

        loadLogosList();
        renderDesignerPreview();
    }

    document.querySelectorAll(".lang-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            applyLanguage(btn.dataset.lang);
        });
    });

    let stream = null;
    let count = 0;
    let capturedPhotoQueue = [];
    let editingInternalCode = null;
    let hasApiKeyConfigured = false;

    // Helper for safe uppercase conversion
    function toAppUpper(val) {
        if (val === null || val === undefined) return "";
        return String(val)
            .replace(/i/g, "I")
            .replace(/ı/g, "I")
            .replace(/İ/g, "I")
            .toUpperCase();
    }

    // Helper for safe number parsing (preserving 0)
    function parseNum(val, fallback) {
        if (val === null || val === undefined || val === "") return fallback;
        const n = parseFloat(val);
        return isNaN(n) ? fallback : n;
    }

    // Helper for converting text-align to flexbox justify-content
    function toFlexJustify(align) {
        if (align === "center") return "center";
        if (align === "right") return "flex-end";
        return "flex-start";
    }

    // ISO 2076 & BISFA Standard International Fiber Abbreviations
    function convertToFiberAbbreviations(compStr) {
        if (!compStr) return "";
        let str = toAppUpper(compStr);

        const fiberMap = [
            // Recycled & Special
            { pattern: /\b(RECYCLE(D)?\s+POLYESTER|GER[İI]\s+D[ÖO]N[ÜU][ŞS][ÜU]M\s+POLYESTER|RPET|RPES)\b/gi, code: "rPES" },
            { pattern: /\b(RECYCLE(D)?\s+PAMUK|RECYCLE(D)?\s+COTTON|RCO)\b/gi, code: "rCO" },
            { pattern: /\b(ORGAN[İI]C\s+COTTON|ORGAN[İI]K\s+PAMUK)\b/gi, code: "org.CO" },
            
            // Common Fibers
            { pattern: /\b(POLYESTER|POLYESTERE|PES|PL)\b/gi, code: "PES" },
            { pattern: /\b(PAMUK|COTTON|COTONE|BAUMWOLLE|COTON|CO)\b/gi, code: "CO" },
            { pattern: /\b(ELASTAN|ELASTANE|SPANDEX|LYCRA|L[İI]KRA|ELASTHANNE|EA|EL)\b/gi, code: "EA" },
            { pattern: /\b(V[İI]SKON|V[İI]SKOZ|V[İI]SKOSE|VISCOSE|RAYON|CV|VI)\b/gi, code: "CV" },
            { pattern: /\b(POL[İI]AM[İI]D|POLYAMIDE|NYLON|NAYLON|PA)\b/gi, code: "PA" },
            { pattern: /\b(Y[ÜU]N|WOOL|LAINE|WOLLE|LANA|WO|WV)\b/gi, code: "WO" },
            { pattern: /\b(KETEN|LINEN|FLAX|LEINEN|LINO|LIN|LI)\b/gi, code: "LI" },
            { pattern: /\b(MODAL|CMD)\b/gi, code: "CMD" },
            { pattern: /\b(L[İI]YOSEL|LYOCELL|TENCEL|CLY)\b/gi, code: "CLY" },
            { pattern: /\b([İI]PEK|SILK|SOIE|SEIDE|SETA|SE)\b/gi, code: "SE" },
            { pattern: /\b(AKR[İI]L[İI]K|ACRYLIC|ACRILICO|ACRYLIQUE|PAN|PC)\b/gi, code: "PAN" },
            { pattern: /\b(KA[ŞS]M[İI]R|CASHMERE|CACHE-MIRE|WS)\b/gi, code: "WS" },
            { pattern: /\b(ASETAT|ACETATE|CA)\b/gi, code: "CA" },
            { pattern: /\b(BAMBU|BAMBOO|BAMBOU|BAM)\b/gi, code: "BAM" },
            { pattern: /\b(ARAM[İI]D|ARAMID|AR)\b/gi, code: "AR" },
            { pattern: /\b(POL[İI]PROPO?LEN|POLYPROPYLENE|PP)\b/gi, code: "PP" },
            { pattern: /\b(MOHER|MOHAIR|WM)\b/gi, code: "WM" },
            { pattern: /\b(J[ÜU]T|JUTE|JU)\b/gi, code: "JU" },
            { pattern: /\b(METALL?IC|METALL?[İI]Z?E?|MET)\b/gi, code: "ME" }
        ];

        fiberMap.forEach(item => {
            str = str.replace(item.pattern, item.code);
        });

        str = str.replace(/\s+/g, " ").trim();
        return str;
    }

    // Current Active Design Config
    const DEFAULT_DESIGN_CONFIG = {
        config_version: "3.6.0",
        default_template: "option-b",
        printer_type: "a4",
        label_width: 63.5,
        label_height: 46.6,
        col_gap: 0.1,
        row_gap: 0.1,
        margin_top: 8.0,
        margin_left: 6.0,
        logo_visible: true,
        logo_height: 6.0,
        logo_align: "left",
        active_logo_url: "/logo.png",
        font_family: "'Outfit', sans-serif",
        use_fiber_abbreviations: false,

        // Modular Theme & Colors
        label_bg_color: "#ffffff",
        label_border_style: "none",
        label_border_color: "#000000",
        
        // Bar styles
        bar_style: "filled", // filled, outline, plain
        bar_bg_color: "#000000",
        bar_text_color: "#ffffff",
        bar_border_radius: "1.0",

        // Element Order
        element_order: ["logo_row", "quality_name", "code_bar", "composition", "weight", "barcode"],

        // Prefixes
        prefix_quality_name: "",
        prefix_quality_code: "",
        prefix_composition: "",
        prefix_weight: "",

        font_size_header: 8.5,
        font_size_company: 8.5,
        font_size_quality_name: 7.5,
        font_size_composition: 7.5,
        font_size_weight: 7.5,
        font_size_body: 7.5,
        header_black_bar: true,
        barcode_height: 8.0,
        barcode_visible: true,
        show_company: true,
        show_quality_name: true,
        show_quality_code: true,
        show_composition: true,
        show_weight: true,
        align_company: "right",
        align_quality_name: "center",
        align_quality_code: "center",
        align_composition: "left",
        align_weight: "left"
    };

    let currentDesignConfig = Object.assign({}, DEFAULT_DESIGN_CONFIG);

    // Load LocalStorage Cache immediately (with strict version check)
    try {
        const cached = localStorage.getItem("elite_sticker_settings");
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.config_version === "3.6.0") {
                Object.assign(currentDesignConfig, parsed);
            } else {
                localStorage.removeItem("elite_sticker_settings");
            }
        }
    } catch (e) {}

    const sampleLabelData = {
        internal_code: "ELT0000123",
        company_name: "BEZTAS TEKSTIL SAN.",
        quality_code: "K2072",
        quality_name: "SPINOZA RECYCLE",
        design_code: "66461-D",
        composition: "%31 POLYESTER RECYCLE %69 POLYESTER",
        weight: "83 GR/M² ±5"
    };

    // Toast Alert Banner
    function showToast(msg, duration = 1200) {
        const banner = document.getElementById("toast-banner");
        const msgSpan = document.getElementById("toast-message");
        if (!banner || !msgSpan) return;
        msgSpan.textContent = msg;
        banner.classList.add("show");
        setTimeout(() => {
            banner.classList.remove("show");
        }, duration);
    }

    function cleanCompositionPunctuation(compStr) {
        if (!compStr) return "";
        let upper = toAppUpper(compStr);
        let cleaned = upper.replace(/[/,;+]+/g, " ");
        return cleaned.replace(/\s+/g, " ").trim();
    }

    function formatCompositionDisplay(compStr, useAbbr = false) {
        let cleaned = cleanCompositionPunctuation(compStr);
        if (useAbbr) {
            return convertToFiberAbbreviations(cleaned);
        }
        return cleaned;
    }

    inputComposition.addEventListener("input", (e) => {
        const cleaned = cleanCompositionPunctuation(e.target.value);
        if (e.target.value !== cleaned) {
            e.target.value = cleaned;
        }
    });

    document.querySelectorAll(".uppercase-input").forEach(input => {
        input.addEventListener("input", (e) => {
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            e.target.value = toAppUpper(e.target.value);
            try { e.target.setSelectionRange(start, end); } catch (err) {}
        });
    });

    // Mobile Menu Toggle
    function openMobileSidebar() {
        sidebar.classList.add("mobile-open");
        sidebarOverlay.classList.add("active");
    }

    function closeMobileSidebar() {
        sidebar.classList.remove("mobile-open");
        sidebarOverlay.classList.remove("active");
    }

    if (mobileMenuToggle) mobileMenuToggle.addEventListener("click", openMobileSidebar);
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", closeMobileSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeMobileSidebar);

    // Sidebar Collapse / Expand Toggle
    const appContainer = document.querySelector(".app-container");
    const btnToggleSidebarCollapse = document.getElementById("btn-toggle-sidebar-collapse");
    const btnFloatingOpenSidebar = document.getElementById("btn-floating-open-sidebar");

    function setSidebarCollapsed(collapsed) {
        if (!appContainer) return;
        if (collapsed) {
            appContainer.classList.add("sidebar-collapsed");
            try { localStorage.setItem("fabrictag_sidebar_collapsed", "1"); } catch(e) {}
        } else {
            appContainer.classList.remove("sidebar-collapsed");
            try { localStorage.setItem("fabrictag_sidebar_collapsed", "0"); } catch(e) {}
        }
    }

    if (btnToggleSidebarCollapse) {
        btnToggleSidebarCollapse.addEventListener("click", () => {
            setSidebarCollapsed(true);
        });
    }

    if (btnFloatingOpenSidebar) {
        btnFloatingOpenSidebar.addEventListener("click", () => {
            setSidebarCollapsed(false);
        });
    }

    // Restore saved sidebar collapsed state
    try {
        if (localStorage.getItem("fabrictag_sidebar_collapsed") === "1") {
            setSidebarCollapsed(true);
        }
    } catch(e) {}

    // Tab Switching
    navButtons.forEach(button => {
        button.addEventListener("click", () => {
            const targetTab = button.dataset.tab;
            
            navButtons.forEach(btn => btn.classList.remove("active"));
            tabContents.forEach(tab => tab.classList.remove("active"));
            
            button.classList.add("active");
            document.getElementById(targetTab).classList.add("active");
            
            closeMobileSidebar();
            
            if (targetTab === "database-tab") {
                loadDatabase();
            } else if (targetTab === "settings-tab") {
                loadSettings();
            }
        });
    });

    // Sidebar Network Card Collapsible Toggle
    const sidebarNetworkToggle = document.getElementById("sidebar-network-toggle");
    const sidebarNetworkCard = document.querySelector(".sidebar-network-card");
    if (sidebarNetworkToggle && sidebarNetworkCard) {
        sidebarNetworkToggle.addEventListener("click", () => {
            sidebarNetworkCard.classList.toggle("collapsed");
        });
    }

    // Server Info & Printer Preferences Load
    function checkServerInfo() {
        fetch("/api/server-info")
            .then(res => res.json())
            .then(data => {
                if (networkAccessUrl) {
                    let html = "";
                    if (data.ngrok_url) {
                        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.ngrok_url)}`;
                        html = `
                            <img src="${qrUrl}" alt="QR Kod" class="sidebar-qr-img">
                            <a href="${data.ngrok_url}" target="_blank" class="sidebar-url-link" title="Yeni Sekmede Aç">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i> ${data.ngrok_url}
                            </a>
                            <div class="sidebar-ip-text"><i class="fa-solid fa-wifi"></i> Wi-Fi: ${data.access_url}</div>
                        `;
                    } else {
                        html = `
                            <a href="${data.access_url}" target="_blank" class="sidebar-url-link">${data.access_url}</a>
                            <div class="sidebar-ip-text"><i class="fa-solid fa-wifi"></i> Wi-Fi: ${data.access_url}</div>
                        `;
                    }
                    networkAccessUrl.innerHTML = html;
                }
            })
            .catch(err => console.error("Error loading server info:", err));
    }

    // Load Available Logos List
    function loadLogosList() {
        if (!desLogoSelect) return;
        const dict = i18n[currentLang] || i18n.tr;
        fetch("/api/logos")
            .then(res => res.json())
            .then(logos => {
                if (!Array.isArray(logos)) return;
                desLogoSelect.innerHTML = "";
                logos.forEach(logo => {
                    const opt = document.createElement("option");
                    opt.value = logo.url;
                    if (logo.url === "/logo.png" || logo.name.toLowerCase().includes("varsayılan") || logo.name.toLowerCase().includes("default")) {
                        opt.textContent = dict.opt_default_logo || "Default FabricTag Logo";
                    } else {
                        opt.textContent = logo.name;
                    }
                    if (logo.url === currentDesignConfig.active_logo_url) {
                        opt.selected = true;
                    }
                    desLogoSelect.appendChild(opt);
                });
            })
            .catch(err => console.error("Error loading logos:", err));
    }

    // Upload New Custom Logo
    if (btnUploadLogo && logoFileInput) {
        btnUploadLogo.addEventListener("click", () => logoFileInput.click());
        
        logoFileInput.addEventListener("change", (e) => {
            if (!e.target.files || e.target.files.length === 0) return;
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append("file", file);
            
            btnUploadLogo.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Yükleniyor...';
            btnUploadLogo.disabled = true;

            fetch("/api/upload-logo", {
                method: "POST",
                body: formData
            })
            .then(res => {
                if (!res.ok) throw new Error("Logo yükleme hatası");
                return res.json();
            })
            .then(data => {
                currentDesignConfig.active_logo_url = data.url;
                showToast("Yeni logo başarıyla yüklendi ve aktif edildi!", 1500);
                loadLogosList();
                renderDesignerPreview();
            })
            .catch(err => {
                alert("Hata: " + err.message);
            })
            .finally(() => {
                btnUploadLogo.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span data-i18n="btn_upload_logo">' + (i18n[currentLang]?.btn_upload_logo || "Logo Yükle") + '</span>';
                btnUploadLogo.disabled = false;
                logoFileInput.value = "";
            });
        });
    }

    if (desLogoSelect) {
        desLogoSelect.addEventListener("change", (e) => {
            currentDesignConfig.active_logo_url = e.target.value;
            renderDesignerPreview();
        });
    }

    function getModularElementsOrderFromDOM() {
        const order = [];
        if (modularElementsList) {
            const cards = modularElementsList.querySelectorAll(".modular-element-card");
            cards.forEach(card => {
                if (card.dataset.elementId) {
                    order.push(card.dataset.elementId);
                }
            });
        }
        return order.length > 0 ? order : ["logo_row", "quality_name", "code_bar", "composition", "weight", "barcode"];
    }

    function reorderModularCardsInDOM(orderList) {
        if (!modularElementsList || !orderList || !Array.isArray(orderList)) return;
        orderList.forEach(elemId => {
            const card = modularElementsList.querySelector(`.modular-element-card[data-element-id="${elemId}"]`);
            if (card) {
                modularElementsList.appendChild(card);
            }
        });
    }

    function syncElementOrderFromDOM() {
        currentDesignConfig.element_order = getModularElementsOrderFromDOM();
        renderDesignerPreview();
    }

    function updateCodePreview() {
        if (!codePreviewBadge) return;
        const isNumbersOnly = codeTypeNumbers && codeTypeNumbers.checked;
        if (groupCodePrefixText) groupCodePrefixText.style.display = isNumbersOnly ? "none" : "flex";
        if (groupCodeSeparator) groupCodeSeparator.style.display = isNumbersOnly ? "none" : "flex";

        const prefix = (!isNumbersOnly && codePrefixText) ? toAppUpper(codePrefixText.value.trim()) : "";
        const sep = (!isNumbersOnly && codeSeparator) ? codeSeparator.value : "";
        const digits = codeDigits ? parseInt(codeDigits.value, 10) : 7;
        const startNum = codeStartNumber ? parseInt(codeStartNumber.value, 10) || 1 : 1;

        let numStr = String(startNum);
        if (digits > 0) {
            numStr = numStr.padStart(digits, '0');
        }

        const sample = `${prefix}${sep}${numStr}`;
        codePreviewBadge.textContent = sample;
    }

    if (codeTypeLetters) codeTypeLetters.addEventListener("change", updateCodePreview);
    if (codeTypeNumbers) codeTypeNumbers.addEventListener("change", updateCodePreview);
    if (codePrefixText) codePrefixText.addEventListener("input", updateCodePreview);
    if (codeSeparator) codeSeparator.addEventListener("change", updateCodePreview);
    if (codeDigits) codeDigits.addEventListener("change", updateCodePreview);
    if (codeStartNumber) codeStartNumber.addEventListener("input", updateCodePreview);

    if (btnSaveCodeSettings) {
        btnSaveCodeSettings.addEventListener("click", () => {
            const prefixType = codeTypeNumbers?.checked ? "numbers_only" : "letters";
            const prefixText = codePrefixText ? toAppUpper(codePrefixText.value.trim()) : "ELT";
            const separator = codeSeparator ? codeSeparator.value : "";
            const digits = codeDigits ? parseInt(codeDigits.value, 10) : 7;
            const startNum = codeStartNumber ? parseInt(codeStartNumber.value, 10) || 1 : 1;

            btnSaveCodeSettings.disabled = true;
            btnSaveCodeSettings.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';

            fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code_prefix_type: prefixType,
                    code_prefix_text: prefixText,
                    code_separator: separator,
                    code_digits: digits,
                    code_start_number: startNum
                })
            })
            .then(res => res.json())
            .then(() => {
                currentDesignConfig.code_prefix_type = prefixType;
                currentDesignConfig.code_prefix_text = prefixText;
                currentDesignConfig.code_separator = separator;
                currentDesignConfig.code_digits = digits;
                currentDesignConfig.code_start_number = startNum;
                showToast("İç kod biçimlendirme ayarları kaydedildi!", 1500);
            })
            .catch(err => alert("Hata: " + err))
            .finally(() => {
                btnSaveCodeSettings.disabled = false;
                btnSaveCodeSettings.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> <span data-i18n="btn_save_code_settings">' + (i18n[currentLang]?.btn_save_code_settings || "İç Kod Ayarlarını Kaydet") + '</span>';
            });
        });
    }

    function loadSettings() {
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                hasApiKeyConfigured = data.has_key;
                const dict = i18n[currentLang] || i18n.tr;
                if (data.has_key) {
                    statusDot.className = "status-dot green";
                    statusText.textContent = dict.api_active;
                    settingsApiKey.placeholder = data.masked_key;
                    apiKeySavedText.textContent = "Anahtar başarıyla kaydedilmiş.";
                    apiKeySavedText.className = "help-text success";
                } else {
                    statusDot.className = "status-dot red";
                    statusText.textContent = dict.api_offline;
                    settingsApiKey.placeholder = "AIzaSy...";
                    apiKeySavedText.textContent = "Lütfen geçerli bir Gemini API anahtarı girin.";
                    apiKeySavedText.className = "help-text";
                }

                // Update currentDesignConfig with exact returned server data
                Object.keys(data).forEach(k => {
                    if (data[k] !== undefined && data[k] !== null) {
                        currentDesignConfig[k] = data[k];
                    }
                });

                try {
                    localStorage.setItem("elite_sticker_settings", JSON.stringify(currentDesignConfig));
                } catch(e) {}

                if (backupAutoToggle && data.auto_backup_enabled !== undefined) {
                    backupAutoToggle.checked = data.auto_backup_enabled;
                }
                if (backupAutoTime && data.auto_backup_time) {
                    backupAutoTime.value = data.auto_backup_time;
                }
                if (customBackupDirInput && data.custom_backup_dir !== undefined) {
                    customBackupDirInput.value = data.custom_backup_dir;
                    if (backupDirStatusText) {
                        backupDirStatusText.textContent = data.custom_backup_dir ? "Yedekler bu klasöre de otomatik kopyalanacaktır." : "";
                        backupDirStatusText.className = "help-text success";
                    }
                }

                applyConfigToUI(currentDesignConfig);
                loadLogosList();
                applyLanguage(currentLang);
            })
            .catch(err => console.error("Error loading settings:", err));
    }

    function applyConfigToUI(cfg) {

        if (prefPrinterType) prefPrinterType.value = cfg.printer_type || "a4";
        if (prefLabelWidth) prefLabelWidth.value = cfg.label_width || 63.5;
        if (prefLabelHeight) prefLabelHeight.value = cfg.label_height || 46.6;
        if (prefColGap) prefColGap.value = cfg.col_gap !== undefined ? cfg.col_gap : 0.1;
        if (prefRowGap) prefRowGap.value = cfg.row_gap !== undefined ? cfg.row_gap : 0.1;
        if (prefMarginTop) prefMarginTop.value = cfg.margin_top !== undefined ? cfg.margin_top : 8.0;
        if (prefMarginLeft) prefMarginLeft.value = cfg.margin_left !== undefined ? cfg.margin_left : 6.0;

        // Theme & Background / Border
        if (desLabelBgColor) desLabelBgColor.value = cfg.label_bg_color || "#ffffff";
        if (desLabelBorderStyle) {
            desLabelBorderStyle.value = cfg.label_border_style || "none";
            if (groupLabelBorderColor) {
                groupLabelBorderColor.style.display = (cfg.label_border_style && cfg.label_border_style !== "none") ? "flex" : "none";
            }
        }
        if (desLabelBorderColor) desLabelBorderColor.value = cfg.label_border_color || "#000000";

        // Global Bar settings (if used)
        if (desBarStyle) {
            desBarStyle.value = cfg.bar_style || cfg.design_style || "filled";
            if (rowBarBgColor) rowBarBgColor.style.display = (desBarStyle.value === "plain") ? "none" : "flex";
        }
        if (desBarBgColor) desBarBgColor.value = cfg.bar_bg_color || cfg.design_bg_color || "#000000";
        if (desBarTextColor) desBarTextColor.value = cfg.bar_text_color || cfg.design_text_color || "#ffffff";
        if (desBarRadius) desBarRadius.value = cfg.bar_border_radius !== undefined ? String(cfg.bar_border_radius) : "1.0";

        // Font Family & Fiber
        if (desFontFamily && cfg.font_family) desFontFamily.value = cfg.font_family;
        if (desUseFiberAbbr) desUseFiberAbbr.checked = !!cfg.use_fiber_abbreviations;

        // 1. Logo & Company
        if (desLogoVisible) desLogoVisible.checked = cfg.logo_visible !== false;
        if (desLogoHeight) {
            desLogoHeight.value = cfg.logo_height || 6.0;
            if (valLogoHeight) valLogoHeight.textContent = (cfg.logo_height || 6.0) + "mm";
        }
        if (desLogoAlign) desLogoAlign.value = cfg.logo_align || "left";
        if (desShowCompany) desShowCompany.checked = cfg.show_company !== false;
        if (desFontCompany) {
            const compSize = cfg.font_size_company !== undefined ? cfg.font_size_company : 8.5;
            desFontCompany.value = compSize;
            if (valFontCompany) valFontCompany.textContent = compSize + "pt";
        }
        if (desAlignCompany) desAlignCompany.value = cfg.align_company || "right";

        // 2. Kalite Adı (Quality Name)
        if (desShowQualityName) desShowQualityName.checked = cfg.show_quality_name !== false;
        if (desFontQualityName) {
            const qSize = cfg.font_size_quality_name !== undefined ? cfg.font_size_quality_name : 7.5;
            desFontQualityName.value = qSize;
            if (valFontQualityName) valFontQualityName.textContent = qSize + "pt";
        }
        if (desAlignQualityName) desAlignQualityName.value = cfg.align_quality_name || "center";
        if (desPrefixQualityName) desPrefixQualityName.value = cfg.prefix_quality_name || "";

        // 3. Kalite & Varyant Kodu Barı (Header / Code Bar)
        if (desShowQualityCode) desShowQualityCode.checked = cfg.show_quality_code !== false;
        if (desFontHeader) {
            const hSize = cfg.font_size_header !== undefined ? cfg.font_size_header : 8.5;
            desFontHeader.value = hSize;
            if (valFontHeader) valFontHeader.textContent = hSize + "pt";
        }
        if (desAlignQualityCode) desAlignQualityCode.value = cfg.align_quality_code || "center";
        if (desPrefixQualityCode) desPrefixQualityCode.value = cfg.prefix_quality_code || "";

        // 4. Karışım
        if (desShowComp) desShowComp.checked = cfg.show_composition !== false;
        if (desFontComp) {
            const compTxtSize = cfg.font_size_composition !== undefined ? cfg.font_size_composition : 7.5;
            desFontComp.value = compTxtSize;
            if (valFontComp) valFontComp.textContent = compTxtSize + "pt";
        }
        if (desAlignComp) desAlignComp.value = cfg.align_composition || "left";

        // 5. Gramaj
        if (desShowWeight) desShowWeight.checked = cfg.show_weight !== false;
        if (desFontWeight) {
            const weightSize = cfg.font_size_weight !== undefined ? cfg.font_size_weight : 7.5;
            desFontWeight.value = weightSize;
            if (valFontWeight) valFontWeight.textContent = weightSize + "pt";
        }
        if (desAlignWeight) desAlignWeight.value = cfg.align_weight || "left";

        // Barcode
        if (desBarcodeVisible) desBarcodeVisible.checked = cfg.barcode_visible !== false;
        if (desBarcodeHeight) {
            desBarcodeHeight.value = cfg.barcode_height || 8.0;
            if (valBarcodeHeight) valBarcodeHeight.textContent = (cfg.barcode_height || 8.0) + "mm";
        }

        // Reorder Modular DOM Cards
        let initialOrder = cfg.element_order;
        if (!initialOrder || !Array.isArray(initialOrder)) {
            initialOrder = ["logo_row", "quality_name", "code_bar", "composition", "weight", "barcode"];
        }
        initialOrder = initialOrder.map(id => id === "quality_row" ? "quality_name" : (id === "design_bar" ? "code_bar" : id));
        reorderModularCardsInDOM(initialOrder);

        // Internal Code Generator Settings
        if (codeTypeLetters && codeTypeNumbers) {
            if (cfg.code_prefix_type === "numbers_only") {
                codeTypeNumbers.checked = true;
            } else {
                codeTypeLetters.checked = true;
            }
        }
        if (codePrefixText) codePrefixText.value = cfg.code_prefix_text || "ELT";
        if (codeSeparator) codeSeparator.value = cfg.code_separator !== undefined ? cfg.code_separator : "";
        if (codeDigits) codeDigits.value = cfg.code_digits !== undefined ? String(cfg.code_digits) : "7";
        if (codeStartNumber) codeStartNumber.value = cfg.code_start_number !== undefined ? cfg.code_start_number : 1;
        updateCodePreview();

        renderDesignerPreview();
    }

    function getDesignerCurrentState() {
        const selectedLogoUrl = desLogoSelect ? desLogoSelect.value : currentDesignConfig.active_logo_url;
        const selectedFontFamily = desFontFamily ? desFontFamily.value : currentDesignConfig.font_family;
        const currentOrder = getModularElementsOrderFromDOM();

        return {
            default_template: currentDesignConfig.default_template || "option-b",
            printer_type: prefPrinterType ? prefPrinterType.value : currentDesignConfig.printer_type,
            label_width: parseNum(prefLabelWidth?.value, currentDesignConfig.label_width),
            label_height: parseNum(prefLabelHeight?.value, currentDesignConfig.label_height),
            col_gap: parseNum(prefColGap?.value, currentDesignConfig.col_gap),
            row_gap: parseNum(prefRowGap?.value, currentDesignConfig.row_gap),
            margin_top: parseNum(prefMarginTop?.value, currentDesignConfig.margin_top),
            margin_left: parseNum(prefMarginLeft?.value, currentDesignConfig.margin_left),
            
            // Theme Colors & Borders
            label_bg_color: desLabelBgColor ? desLabelBgColor.value : (currentDesignConfig.label_bg_color || "#ffffff"),
            label_border_style: desLabelBorderStyle ? desLabelBorderStyle.value : (currentDesignConfig.label_border_style || "none"),
            label_border_color: desLabelBorderColor ? desLabelBorderColor.value : (currentDesignConfig.label_border_color || "#000000"),
            
            // Bar style & Colors
            bar_style: desBarStyle ? desBarStyle.value : (currentDesignConfig.bar_style || "filled"),
            bar_bg_color: desBarBgColor ? desBarBgColor.value : (currentDesignConfig.bar_bg_color || "#000000"),
            bar_text_color: desBarTextColor ? desBarTextColor.value : (currentDesignConfig.bar_text_color || "#ffffff"),
            bar_border_radius: desBarRadius ? desBarRadius.value : (currentDesignConfig.bar_border_radius || "1.0"),

            // Modular Element Order
            element_order: currentOrder,

            // Kalite Adı
            show_quality_name: desShowQualityName ? desShowQualityName.checked : (currentDesignConfig.show_quality_name !== false),
            prefix_quality_name: desPrefixQualityName ? desPrefixQualityName.value.trim() : (currentDesignConfig.prefix_quality_name || ""),
            align_quality_name: desAlignQualityName ? desAlignQualityName.value : (currentDesignConfig.align_quality_name || "center"),
            font_size_quality_name: parseNum(desFontQualityName?.value, currentDesignConfig.font_size_quality_name || 7.5),

            // Kalite & Varyant Kodu Barı
            show_quality_code: desShowQualityCode ? desShowQualityCode.checked : (currentDesignConfig.show_quality_code !== false),
            prefix_quality_code: desPrefixQualityCode ? desPrefixQualityCode.value.trim() : (currentDesignConfig.prefix_quality_code || ""),
            align_quality_code: desAlignQualityCode ? desAlignQualityCode.value : (currentDesignConfig.align_quality_code || "center"),
            font_size_header: parseNum(desFontHeader?.value, currentDesignConfig.font_size_header || 8.5),
            header_black_bar: true,

            // Prefixes
            prefix_composition: desPrefixComposition ? desPrefixComposition.value.trim() : "",
            prefix_weight: desPrefixWeight ? desPrefixWeight.value.trim() : "",

            // Element settings
            logo_visible: desLogoVisible ? desLogoVisible.checked : currentDesignConfig.logo_visible,
            logo_height: parseNum(desLogoHeight?.value, currentDesignConfig.logo_height),
            logo_align: desLogoAlign ? desLogoAlign.value : currentDesignConfig.logo_align,
            active_logo_url: selectedLogoUrl || "/logo.png",
            font_family: selectedFontFamily || "'Outfit', sans-serif",
            use_fiber_abbreviations: desUseFiberAbbr ? desUseFiberAbbr.checked : currentDesignConfig.use_fiber_abbreviations,
            
            font_size_company: parseNum(desFontCompany?.value, currentDesignConfig.font_size_company),
            font_size_composition: parseNum(desFontComp?.value, currentDesignConfig.font_size_composition),
            font_size_weight: parseNum(desFontWeight?.value, currentDesignConfig.font_size_weight),
            
            show_company: desShowCompany ? desShowCompany.checked : currentDesignConfig.show_company,
            show_composition: desShowComp ? desShowComp.checked : currentDesignConfig.show_composition,
            show_weight: desShowWeight ? desShowWeight.checked : currentDesignConfig.show_weight,
            
            align_company: desAlignCompany ? desAlignCompany.value : currentDesignConfig.align_company,
            align_composition: desAlignComp ? desAlignComp.value : currentDesignConfig.align_composition,
            align_weight: desAlignWeight ? desAlignWeight.value : currentDesignConfig.align_weight,
            
            barcode_visible: desBarcodeVisible ? desBarcodeVisible.checked : currentDesignConfig.barcode_visible,
            barcode_height: parseNum(desBarcodeHeight?.value, currentDesignConfig.barcode_height)
        };
    }

    // Unified Modular Label Inner HTML Generator
    function generateModularLabelInnerHtml(data, cfg, barcodeId = "live") {
        let order = cfg.element_order || ["logo_row", "quality_name", "code_bar", "composition", "weight", "barcode"];
        order = order.map(id => id === "quality_row" ? "quality_name" : (id === "design_bar" ? "code_bar" : id));

        const compClean = formatCompositionDisplay(data.composition, cfg.use_fiber_abbreviations);
        const logoSrc = cfg.active_logo_url || "/logo.png";
        const fontFamily = cfg.font_family || "'Outfit', sans-serif";

        const fCompany = cfg.font_size_company !== undefined ? cfg.font_size_company : 8.5;
        const fQualityName = cfg.font_size_quality_name !== undefined ? cfg.font_size_quality_name : 7.5;
        const fHeader = cfg.font_size_header !== undefined ? cfg.font_size_header : 8.5;
        const fComp = cfg.font_size_composition !== undefined ? cfg.font_size_composition : 7.5;
        const fWeight = cfg.font_size_weight !== undefined ? cfg.font_size_weight : 7.5;

        // Theme Background & Border
        const labelBg = cfg.label_bg_color || "#ffffff";
        const borderStyle = cfg.label_border_style || "none";
        const borderColor = cfg.label_border_color || "#000000";
        let labelBorderCSS = "";
        if (borderStyle !== "none") {
            labelBorderCSS = `border: ${borderStyle === "double" ? "3px double" : "1px " + borderStyle} ${borderColor};`;
        }

        const blocks = {};

        // 1. Logo Row
        if (cfg.logo_visible) {
            let alignStyle = "justify-content: flex-start;";
            if (cfg.logo_align === "center") alignStyle = "justify-content: center;";
            if (cfg.logo_align === "right") alignStyle = "justify-content: flex-end;";

            blocks.logo_row = `
                <div class="print-logo-row" style="display: flex; align-items: center; ${alignStyle} margin-bottom: 1mm; width: 100%;">
                    <img src="${logoSrc}" class="print-logo" style="height: ${cfg.logo_height || 6}mm; width: auto; max-width: 32mm; object-fit: contain; display: block;" alt="LOGO">
                    ${cfg.show_company ? `<div class="print-company" style="font-size: ${fCompany}pt; font-weight: 700; text-align: ${cfg.align_company || 'right'}; flex-grow: 1; margin-left: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #000;">${toAppUpper(data.company_name) || "-"}</div>` : ''}
                </div>
            `;
        }

        // 2. Kalite Kodu & Kalite Adı Satırı (Düz / Açık Yazı)
        if (cfg.show_quality_name !== false) {
            let qText = "";
            const qCode = toAppUpper(data.quality_code);
            const qName = toAppUpper(data.quality_name);
            if (qCode && qName) {
                qText = `${qCode} ${qName}`;
            } else {
                qText = qCode || qName || "-";
            }
            const prefix = cfg.prefix_quality_name ? `<span style="font-weight: 700; margin-right: 3px;">${cfg.prefix_quality_name}</span>` : "";
            const qHtml = `
                <div class="print-name" style="font-size: ${fQualityName}pt; font-weight: 700; text-align: ${cfg.align_quality_name || 'center'}; width: 100%; color: #000; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0.5mm 0;">
                    ${prefix}${qText}
                </div>
            `;
            blocks.quality_name = qHtml;
            blocks.quality_row = qHtml;
        }

        // 3. Desen / Varyant Kodu Barı (Siyah Zeminli Bar)
        if (cfg.show_quality_code !== false) {
            let barContent = "";
            if (cfg.default_template === "option-a") {
                barContent = toAppUpper(data.internal_code || "ELT0000001");
            } else {
                barContent = toAppUpper(data.design_code) || "-";
            }
            const prefix = cfg.prefix_quality_code ? `<span style="font-weight: 700; margin-right: 3px;">${cfg.prefix_quality_code}</span>` : "";
            
            const barStyle = cfg.bar_style || "filled";
            const barBg = cfg.bar_bg_color || "#000000";
            const barText = cfg.bar_text_color || "#ffffff";
            const barRadius = (cfg.bar_border_radius !== undefined ? cfg.bar_border_radius : 1.0) + "mm";

            let codeBarCSS = "";
            if (barStyle === "filled") {
                codeBarCSS = `background-color: ${barBg} !important; color: ${barText} !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; padding: 1.5mm 3mm; border-radius: ${barRadius};`;
            } else if (barStyle === "outline") {
                codeBarCSS = `background-color: transparent !important; color: #000000 !important; border: 1.5px solid ${barBg}; padding: 1.2mm 3mm; border-radius: ${barRadius};`;
            } else {
                codeBarCSS = `background-color: transparent !important; color: #000000 !important; padding: 0.8mm 0;`;
            }

            const dHtml = `
                <div class="print-code-line" style="${codeBarCSS} text-align: ${cfg.align_quality_code || 'center'}; font-weight: 700; font-size: ${fHeader}pt; margin: 1mm 0; width: 100%; box-sizing: border-box; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${prefix}${barContent}
                </div>
            `;
            blocks.code_bar = dHtml;
            blocks.design_bar = dHtml;
        }

        // 4. Composition
        if (cfg.show_composition !== false) {
            const prefix = cfg.prefix_composition ? `<strong class="print-title" style="margin-right: 3px;">${cfg.prefix_composition}</strong>` : "";
            blocks.composition = `
                <div class="print-comp" style="font-size: ${fComp}pt; font-weight: 500; text-align: ${cfg.align_composition || 'left'}; width: 100%; color: #000; line-height: 1.2; word-break: break-word;">
                    ${prefix}<span class="print-value">${compClean || "-"}</span>
                </div>
            `;
        }

        // 5. Weight
        if (cfg.show_weight !== false) {
            const prefix = cfg.prefix_weight ? `<strong class="print-title" style="margin-right: 3px;">${cfg.prefix_weight}</strong>` : "";
            blocks.weight = `
                <div class="print-weight" style="font-size: ${fWeight}pt; font-weight: 700; text-align: ${cfg.align_weight || 'left'}; width: 100%; color: #000; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${prefix}<span class="print-value">${toAppUpper(data.weight) || "-"}</span>
                </div>
            `;
        }

        // 6. Barcode
        if (cfg.barcode_visible !== false) {
            blocks.barcode = `
                <div class="print-barcode-container" style="display: flex; justify-content: center; width: 100%; margin-top: auto; padding-top: 0.5mm;">
                    <svg class="print-barcode-svg" id="barcode-${barcodeId}" style="max-width: 90%; height: ${cfg.barcode_height || 8}mm;"></svg>
                </div>
            `;
        }

        // Assemble HTML based on element order
        let assembledHtml = "";
        order.forEach(elemId => {
            if (blocks[elemId]) {
                assembledHtml += blocks[elemId];
            }
        });

        if (!assembledHtml.trim()) {
            assembledHtml = (blocks.logo_row || "") + (blocks.quality_name || "") + (blocks.code_bar || "") + (blocks.composition || "") + (blocks.weight || "") + (blocks.barcode || "");
        }

        return `
            <div class="print-label" style="font-family: ${fontFamily}; width: 100%; height: 100%; padding: 2.5mm 3.5mm; background-color: ${labelBg} !important; ${labelBorderCSS} box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;">
                ${assembledHtml}
            </div>
        `;
    }

    function renderDesignerPreview() {
        if (!dashedLabelBoundary || !designerLiveLabel) return;

        const cfg = getDesignerCurrentState();
        currentDesignConfig = cfg;

        const w = cfg.label_width || 63.5;
        const h = cfg.label_height || 46.6;

        dashedLabelBoundary.style.width = w + "mm";
        dashedLabelBoundary.style.height = h + "mm";
        if (previewDimBadge) previewDimBadge.textContent = `${w}mm × ${h}mm`;

        const data = sampleLabelData;
        designerLiveLabel.innerHTML = generateModularLabelInnerHtml(data, cfg, "designer-live");

        // Render live barcode
        if (cfg.barcode_visible) {
            setTimeout(() => {
                const svgEl = document.getElementById("barcode-designer-live");
                if (svgEl && window.JsBarcode) {
                    try {
                        JsBarcode(svgEl, data.internal_code, {
                            format: "CODE128",
                            displayValue: false,
                            height: cfg.barcode_height * 3.77,
                            margin: 0,
                            lineColor: "#000000"
                        });
                    } catch (e) {}
                }
            }, 50);
        }
    }

    // Modular Move Up & Move Down Event Handlers
    if (modularElementsList) {
        modularElementsList.addEventListener("click", (e) => {
            const moveUpBtn = e.target.closest(".btn-move-up");
            const moveDownBtn = e.target.closest(".btn-move-down");
            if (moveUpBtn) {
                const card = moveUpBtn.closest(".modular-element-card");
                if (card && card.previousElementSibling) {
                    card.parentNode.insertBefore(card, card.previousElementSibling);
                    syncElementOrderFromDOM();
                }
            } else if (moveDownBtn) {
                const card = moveDownBtn.closest(".modular-element-card");
                if (card && card.nextElementSibling) {
                    card.parentNode.insertBefore(card.nextElementSibling, card);
                    syncElementOrderFromDOM();
                }
            }
        });
    }

    // Preset Chip Buttons Click Listener
    document.querySelectorAll(".preset-chip-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".preset-chip-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const presetKey = btn.dataset.preset;
            if (typeof PRESETS_CONFIG !== "undefined" && PRESETS_CONFIG[presetKey]) {
                const p = PRESETS_CONFIG[presetKey];
                Object.assign(currentDesignConfig, p);
                applyConfigToUI(currentDesignConfig);
                showToast("Şablon yüklendi: " + btn.textContent.trim(), 1000);
            }
        });
    });

    // Color Swatch Buttons Click Listener
    document.querySelectorAll(".color-swatch-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.target;
            const color = btn.dataset.color;
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.value = color;
                targetEl.dispatchEvent(new Event("input", { bubbles: true }));
                targetEl.dispatchEvent(new Event("change", { bubbles: true }));
            }
        });
    });

    // Label Theme & Global Bar Controls Listeners
    if (desLabelBgColor) desLabelBgColor.addEventListener("input", renderDesignerPreview);
    if (desLabelBorderStyle) {
        desLabelBorderStyle.addEventListener("change", (e) => {
            if (groupLabelBorderColor) groupLabelBorderColor.style.display = e.target.value !== "none" ? "flex" : "none";
            renderDesignerPreview();
        });
    }
    if (desLabelBorderColor) desLabelBorderColor.addEventListener("input", renderDesignerPreview);

    if (desBarStyle) {
        desBarStyle.addEventListener("change", (e) => {
            if (rowBarBgColor) rowBarBgColor.style.display = e.target.value === "plain" ? "none" : "flex";
            renderDesignerPreview();
        });
    }
    if (desBarBgColor) desBarBgColor.addEventListener("input", renderDesignerPreview);
    if (desBarTextColor) desBarTextColor.addEventListener("input", renderDesignerPreview);
    if (desBarRadius) desBarRadius.addEventListener("change", renderDesignerPreview);

    // 2. Kalite Adı Listeners
    if (desShowQualityName) desShowQualityName.addEventListener("change", renderDesignerPreview);
    if (desFontQualityName) {
        desFontQualityName.addEventListener("input", (e) => {
            if (valFontQualityName) valFontQualityName.textContent = e.target.value + "pt";
            renderDesignerPreview();
        });
    }
    if (desAlignQualityName) desAlignQualityName.addEventListener("change", renderDesignerPreview);
    if (desPrefixQualityName) desPrefixQualityName.addEventListener("input", renderDesignerPreview);

    // 3. Kalite & Varyant Kodu (Header Bar) Listeners
    if (desShowQualityCode) desShowQualityCode.addEventListener("change", renderDesignerPreview);
    if (desFontHeader) {
        desFontHeader.addEventListener("input", (e) => {
            if (valFontHeader) valFontHeader.textContent = e.target.value + "pt";
            renderDesignerPreview();
        });
    }
    if (desAlignQualityCode) desAlignQualityCode.addEventListener("change", renderDesignerPreview);
    if (desPrefixQualityCode) desPrefixQualityCode.addEventListener("input", renderDesignerPreview);

    // Reset Default Design Button
    if (btnResetDefaultDesign) {
        btnResetDefaultDesign.addEventListener("click", () => {
            const DEFAULT_CONFIG = {
                default_template: "option-b",
                printer_type: "a4",
                label_width: 63.5,
                label_height: 46.6,
                col_gap: 0.1,
                row_gap: 0.1,
                margin_top: 8.0,
                margin_left: 6.0,
                logo_visible: true,
                logo_height: 6.0,
                logo_align: "left",
                active_logo_url: "/logo.png",
                font_family: "'Outfit', sans-serif",
                use_fiber_abbreviations: false,
                label_bg_color: "#ffffff",
                label_border_style: "none",
                label_border_color: "#000000",
                bar_style: "filled",
                bar_bg_color: "#000000",
                bar_text_color: "#ffffff",
                bar_border_radius: "1.0",
                element_order: ["logo_row", "quality_name", "code_bar", "composition", "weight", "barcode"],
                prefix_quality_name: "",
                prefix_quality_code: "",
                prefix_composition: "",
                prefix_weight: "",
                font_size_header: 8.5,
                font_size_company: 8.5,
                font_size_quality_name: 7.5,
                font_size_composition: 7.5,
                font_size_weight: 7.5,
                font_size_body: 7.5,
                header_black_bar: true,
                barcode_height: 8.0,
                barcode_visible: true,
                show_company: true,
                show_quality_name: true,
                show_quality_code: true,
                show_composition: true,
                show_weight: true,
                align_company: "right",
                align_quality_name: "center",
                align_quality_code: "center",
                align_composition: "left",
                align_weight: "left"
            };
            currentDesignConfig = Object.assign({}, DEFAULT_CONFIG);
            try {
                localStorage.setItem("elite_sticker_settings", JSON.stringify(currentDesignConfig));
            } catch(e) {}
            applyConfigToUI(currentDesignConfig);
            saveVisualDesignToAPI();
            showToast("Orijinal varsayılan etiket tasarımı başarıyla geri yüklendi!", 1500);
        });
    }

    // Prefixes Listeners
    [desPrefixComposition, desPrefixWeight].forEach(input => {
        if (input) input.addEventListener("input", renderDesignerPreview);
    });

    // Logo & Element Controls Listeners
    if (desLogoVisible) {
        desLogoVisible.addEventListener("change", (e) => {
            if (logoControlsContent) logoControlsContent.style.opacity = e.target.checked ? "1" : "0.4";
            renderDesignerPreview();
        });
    }
    if (desLogoHeight) {
        desLogoHeight.addEventListener("input", (e) => {
            if (valLogoHeight) valLogoHeight.textContent = e.target.value + "mm";
            renderDesignerPreview();
        });
    }
    if (desLogoAlign) desLogoAlign.addEventListener("change", renderDesignerPreview);

    // Font Family & Fiber
    if (desFontFamily) desFontFamily.addEventListener("change", renderDesignerPreview);
    if (desUseFiberAbbr) desUseFiberAbbr.addEventListener("change", renderDesignerPreview);

    // 1. Company
    if (desShowCompany) desShowCompany.addEventListener("change", renderDesignerPreview);
    if (desFontCompany) {
        desFontCompany.addEventListener("input", (e) => {
            if (valFontCompany) valFontCompany.textContent = e.target.value + "pt";
            renderDesignerPreview();
        });
    }
    if (desAlignCompany) desAlignCompany.addEventListener("change", renderDesignerPreview);

    // 4. Composition
    if (desShowComp) desShowComp.addEventListener("change", renderDesignerPreview);
    if (desFontComp) {
        desFontComp.addEventListener("input", (e) => {
            if (valFontComp) valFontComp.textContent = e.target.value + "pt";
            renderDesignerPreview();
        });
    }
    if (desAlignComp) desAlignComp.addEventListener("change", renderDesignerPreview);

    // 5. Weight
    if (desShowWeight) desShowWeight.addEventListener("change", renderDesignerPreview);
    if (desFontWeight) {
        desFontWeight.addEventListener("input", (e) => {
            if (valFontWeight) valFontWeight.textContent = e.target.value + "pt";
            renderDesignerPreview();
        });
    }
    if (desAlignWeight) desAlignWeight.addEventListener("change", renderDesignerPreview);

    // 6. Barcode
    if (desBarcodeVisible) {
        desBarcodeVisible.addEventListener("change", (e) => {
            if (barcodeControlsContent) barcodeControlsContent.style.opacity = e.target.checked ? "1" : "0.4";
            renderDesignerPreview();
        });
    }
    if (desBarcodeHeight) {
        desBarcodeHeight.addEventListener("input", (e) => {
            if (valBarcodeHeight) valBarcodeHeight.textContent = e.target.value + "mm";
            renderDesignerPreview();
        });
    }

    // Dimensions
    [prefLabelWidth, prefLabelHeight, prefColGap, prefRowGap, prefMarginTop, prefMarginLeft].forEach(input => {
        if (input) {
            input.addEventListener("input", renderDesignerPreview);
        }
    });

    if (prefDefaultTemplate) {
        prefDefaultTemplate.addEventListener("change", (e) => {
            currentDesignConfig.default_template = e.target.value;
            renderDesignerPreview();
        });
    }

    // Reset Default Design Action
    if (btnResetDefaultDesign) {
        btnResetDefaultDesign.addEventListener("click", () => {
            const DEFAULT_CONFIG = {
                config_version: "3.7.5",
                default_template: "option-b",
                printer_type: "a4",
                label_width: 63.5,
                label_height: 46.6,
                col_gap: 0.1,
                row_gap: 0.1,
                margin_top: 8.0,
                margin_left: 6.0,
                logo_visible: true,
                logo_height: 6.0,
                logo_align: "left",
                active_logo_url: "/logo.png",
                font_family: "'Outfit', sans-serif",
                use_fiber_abbreviations: false,
                label_bg_color: "#ffffff",
                label_border_style: "none",
                label_border_color: "#000000",
                bar_style: "filled",
                bar_bg_color: "#000000",
                bar_text_color: "#ffffff",
                bar_border_radius: "1.0",
                element_order: ["logo_row", "quality_name", "code_bar", "composition", "weight", "barcode"],
                prefix_quality_name: "",
                prefix_quality_code: "",
                prefix_composition: "",
                prefix_weight: "",
                font_size_header: 8.5,
                font_size_company: 8.5,
                font_size_quality_name: 7.5,
                font_size_composition: 7.5,
                font_size_weight: 7.5,
                font_size_body: 7.5,
                header_black_bar: true,
                barcode_height: 8.0,
                barcode_visible: true,
                show_company: true,
                show_quality_name: true,
                show_quality_code: true,
                show_composition: true,
                show_weight: true,
                align_company: "right",
                align_quality_name: "center",
                align_quality_code: "center",
                align_composition: "left",
                align_weight: "left"
            };

            currentDesignConfig = Object.assign({}, DEFAULT_CONFIG);
            try {
                localStorage.setItem("elite_sticker_settings", JSON.stringify(DEFAULT_CONFIG));
            } catch(e) {}
            applyConfigToUI(DEFAULT_CONFIG);

            fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(DEFAULT_CONFIG)
            }).then(() => {
                showToast("Orijinal tasarım fabrika ayarlarına sıfırlandı!", 1500);
            });
        });
    }

    // Save Visual Design Action
    function saveVisualDesignToAPI() {
        const payload = getDesignerCurrentState();
        try {
            localStorage.setItem("elite_sticker_settings", JSON.stringify(payload));
        } catch(e) {}

        fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(() => {
            showToast("Tüm tasarım ayarları ve şablon başarıyla kaydedildi!", 1500);
            loadSettings();
        })
        .catch(err => {
            alert("Ayarlar kaydedilemedi: " + err);
        });
    }

    if (btnSaveVisualDesign) btnSaveVisualDesign.addEventListener("click", saveVisualDesignToAPI);

    if (btnSavePrintPrefs) {
        btnSavePrintPrefs.addEventListener("click", saveVisualDesignToAPI);
    }
    
    if (btnSaveSettings) {
        btnSaveSettings.addEventListener("click", async () => {
            const key = settingsApiKey ? settingsApiKey.value.trim() : "";
            if (!key) {
                alert("Lütfen geçerli bir API anahtarı girin!");
                return;
            }
            
            btnSaveSettings.disabled = true;
            btnSaveSettings.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Doğrulanıyor...';
            
            try {
                // 1. Google Gemini API testi
                const testRes = await fetch("/api/test-key", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ api_key: key })
                });
                const testResult = await testRes.json();
                
                if (!testResult.valid) {
                    if (apiKeySavedText) {
                        apiKeySavedText.textContent = "Bağlantı Hatası: " + testResult.message;
                        apiKeySavedText.className = "help-text error";
                    }
                    showToast("API Doğrulanamadı: " + testResult.message, 4000);
                    return;
                }

                // 2. Kalıcı kaydet
                const saveRes = await fetch("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ api_key: key })
                });
                const saveData = await saveRes.json();
                
                if (saveData.success) {
                    showToast("Google Gemini API Anahtarı Doğrulandı ve Kaydedildi! 🟢", 2500);
                    if (settingsApiKey) settingsApiKey.value = "";
                    if (apiKeySavedText) {
                        apiKeySavedText.textContent = "Google Gemini API bağlantısı aktif ve hazır.";
                        apiKeySavedText.className = "help-text success";
                    }
                    loadSettings();
                }
            } catch (err) {
                console.error("Save API error:", err);
                alert("İşlem sırasında bir hata oluştu: " + err);
            } finally {
                btnSaveSettings.disabled = false;
                btnSaveSettings.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> <span data-i18n="btn_save">' + (i18n[currentLang]?.btn_save || "Kaydet") + '</span>';
            }
        });
    }

    // Test API Key Button
    const btnTestApiKey = document.getElementById("btn-test-api-key");
    if (btnTestApiKey) {
        btnTestApiKey.addEventListener("click", async () => {
            const typedKey = settingsApiKey ? settingsApiKey.value.trim() : "";
            btnTestApiKey.disabled = true;
            btnTestApiKey.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Test Ediliyor...';

            try {
                const res = await fetch("/api/test-key", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ api_key: typedKey })
                });
                const data = await res.json();
                if (data.valid) {
                    if (apiKeySavedText) {
                        apiKeySavedText.textContent = data.message;
                        apiKeySavedText.className = "help-text success";
                    }
                    showToast("Google Gemini API Bağlantısı Başarılı! 🟢", 2000);
                    loadSettings();
                } else {
                    if (apiKeySavedText) {
                        apiKeySavedText.textContent = data.message;
                        apiKeySavedText.className = "help-text error";
                    }
                    showToast("Bağlantı Başarısız: " + data.message, 3500);
                }
            } catch (err) {
                if (apiKeySavedText) {
                    apiKeySavedText.textContent = "Test hatası: " + err;
                    apiKeySavedText.className = "help-text error";
                }
            } finally {
                btnTestApiKey.disabled = false;
                btnTestApiKey.innerHTML = '<i class="fa-solid fa-bolt"></i> Test Et';
            }
        });
    }

    // ==========================================
    // CUSTOM BACKUP DIRECTORY & UPDATE CENTER
    // ==========================================
    const customBackupDirInput = document.getElementById("custom-backup-dir-input");
    const btnSaveBackupDir = document.getElementById("btn-save-backup-dir");
    const btnOpenBackupDir = document.getElementById("btn-open-backup-dir");
    const backupDirStatusText = document.getElementById("backup-dir-status-text");

    if (btnSaveBackupDir) {
        btnSaveBackupDir.addEventListener("click", async () => {
            const dir = customBackupDirInput ? customBackupDirInput.value.trim() : "";
            btnSaveBackupDir.disabled = true;
            try {
                const res = await fetch("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ custom_backup_dir: dir })
                });
                const data = await res.json();
                if (data.success) {
                    showToast("Özel yedekleme klasörü başarıyla kaydedildi! 📁", 2000);
                    if (backupDirStatusText) {
                        backupDirStatusText.textContent = dir ? "Yedekler bu klasöre de otomatik kopyalanacaktır." : "Varsayılan yedekleme klasörü aktif.";
                        backupDirStatusText.className = "help-text success";
                    }
                    loadSettings();
                }
            } catch (err) {
                alert("Klasör kaydedilemedi: " + err);
            } finally {
                btnSaveBackupDir.disabled = false;
            }
        });
    }

    if (btnOpenBackupDir) {
        btnOpenBackupDir.addEventListener("click", async () => {
            const dir = customBackupDirInput ? customBackupDirInput.value.trim() : "";
            try {
                const res = await fetch("/api/open-folder", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ folder_path: dir })
                });
                const data = await res.json();
                if (data.success) {
                    showToast("Yedekleme klasörü açıldı! 📁", 1500);
                } else {
                    showToast(data.message || "Klasör açılamadı.", 2500);
                }
            } catch(e) {
                showToast("Klasör açma hatası: " + e, 2500);
            }
        });
    }

    // System Update Checker
    const btnCheckUpdates = document.getElementById("btn-check-updates");
    const updateCheckStatusText = document.getElementById("update-check-status-text");
    const updateNotificationBanner = document.getElementById("update-notification-banner");
    const updateBannerTitle = document.getElementById("update-banner-title");
    const updateBannerDesc = document.getElementById("update-banner-desc");
    const btnUpdateDownload = document.getElementById("btn-update-download");
    const versionCheckStatusBadge = document.getElementById("version-check-status-badge");

    async function checkSystemUpdates(isManual = false) {
        if (isManual && btnCheckUpdates) {
            btnCheckUpdates.disabled = true;
            btnCheckUpdates.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Denetleniyor...';
        }

        try {
            const res = await fetch("/api/check-update");
            const data = await res.json();
            
            if (data.has_update) {
                if (updateNotificationBanner) updateNotificationBanner.style.display = "flex";
                if (updateBannerTitle) updateBannerTitle.textContent = "Yeni FabricTag Güncellemesi Mevcut! (v" + data.latest_version + ")";
                if (updateBannerDesc && data.changelog) updateBannerDesc.textContent = data.changelog.join(" • ");
                if (btnUpdateDownload && data.download_url) btnUpdateDownload.href = data.download_url;

                if (versionCheckStatusBadge) {
                    versionCheckStatusBadge.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> <span style="color:#ef4444;">Yeni Sürüm (v' + data.latest_version + ') Mevcut!</span>';
                }
                if (updateCheckStatusText) {
                    updateCheckStatusText.textContent = "Yeni bir güncelleme bulundu (v" + data.latest_version + "). Lütfen güncellemeyi indirin.";
                    updateCheckStatusText.className = "help-text error";
                }
                if (isManual) showToast("Yeni sürüm bulundu! (v" + data.latest_version + ")", 3000);
            } else {
                if (versionCheckStatusBadge) {
                    versionCheckStatusBadge.innerHTML = '<i class="fa-solid fa-shield-check"></i> <span data-i18n="status_latest_version">' + (i18n[currentLang]?.status_latest_version || "Güncel Sürüm") + '</span>';
                }
                if (updateCheckStatusText) {
                    updateCheckStatusText.textContent = "Sisteminiz en son kararlı FabricTag sürümünü (v" + data.current_version + ") kullanmaktadır.";
                    updateCheckStatusText.className = "help-text success";
                }
                if (isManual) showToast("FabricTag güncel! (v" + data.current_version + ") 🟢", 2000);
            }
        } catch(e) {
            console.error("Update check error:", e);
            if (isManual && updateCheckStatusText) {
                updateCheckStatusText.textContent = "Güncelleme sunucusuna ulaşılamadı.";
                updateCheckStatusText.className = "help-text";
            }
        } finally {
            if (isManual && btnCheckUpdates) {
                btnCheckUpdates.disabled = false;
                btnCheckUpdates.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> <span data-i18n="btn_check_update">' + (i18n[currentLang]?.btn_check_update || "Güncellemeleri Denetle") + '</span>';
            }
        }
    }

    if (btnCheckUpdates) {
        btnCheckUpdates.addEventListener("click", () => checkSystemUpdates(true));
    }

    // ==========================================
    // CANLI KAMERA & SERİ ÇEKİM ENTEGRASYONU
    // ==========================================
    
    function startCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Bu tarayıcı veya bağlantı protokolünde canlı kamera desteklenmiyor. 'Normal Kamera' veya 'Galeriden Çoklu Seç' butonunu kullanabilirsiniz.");
            return;
        }

        videoContainer.style.display = "flex";
        dragDropZone.style.display = "none";
        statusLog.innerText = "Kamera başlatılıyor...";

        navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: "environment", 
                width: { ideal: 1280 }, 
                height: { ideal: 720 } 
            },
            audio: false
        }).then(s => {
            stream = s;
            video.srcObject = stream;
            video.play().catch(e => console.log("Play error:", e));
            statusLog.innerText = "Kamera hazır. Kartelayı tutup aşağıdaki butona basın.";
        }).catch(err => {
            console.error("Camera error:", err);
            navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                .then(s => {
                    stream = s;
                    video.srcObject = stream;
                    video.play().catch(e => console.log("Play error:", e));
                    statusLog.innerText = "Kamera hazır. Kartelayı tutup aşağıdaki butona basın.";
                })
                .catch(err2 => {
                    statusLog.innerText = "Kamera erişim hatası: " + err2.message;
                    alert("Kamera açılamadı: " + err2.message);
                    stopCamera();
                });
        });
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        if (video) video.srcObject = null;
        videoContainer.style.display = "none";
        dragDropZone.style.display = "flex";
    }

    webcamBtn.addEventListener("click", () => {
        if (videoContainer.style.display === "none" || !videoContainer.style.display) {
            startCamera();
        } else {
            stopCamera();
        }
    });

    if (closeWebcamBtn) {
        closeWebcamBtn.addEventListener("click", stopCamera);
    }

    captureBtn.addEventListener('click', () => {
        if (!video || !video.videoWidth || !video.videoHeight) {
            statusLog.innerText = "Kamera görüntüsü henüz hazır değil, lütfen bekleyin...";
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        const base64Image = canvas.toDataURL('image/jpeg', 0.80);
        count++;
        statusLog.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Fotoğraf #${count} alındı, yapay zeka okuyor ve kaydediyor...`;
        captureBtn.disabled = true;

        fetch('/api/kartela-oku', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image, captureId: count })
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(errData => { throw new Error(errData.detail || "Sunucu hatası"); });
            }
            return res.json();
        })
        .then(data => {
            const saved = data.data;
            statusLog.innerHTML = `✅ <strong>Fotoğraf #${count} başarıyla okundu & kaydedildi!</strong> (${saved.internal_code} - ${saved.company_name} / ${saved.quality_code})<br>👉 Yeni karta geçebilirsiniz.`;
            showToast(`Kayıt Eklendi: ${saved.internal_code}`, 1500);
            
            populateForm(saved);
            resultCard.style.opacity = "1";
            resultCard.style.pointerEvents = "auto";
        })
        .catch(err => {
            console.error("Capture error:", err);
            statusLog.innerHTML = `⚠️ <strong>Fotoğraf #${count} okunamadı:</strong> ${err.message}`;
            showToast("Hata: " + err.message, 2000);
        })
        .finally(() => {
            captureBtn.disabled = false;
        });
    });

    // ==========================================
    // DOSYA / GALERİ YÜKLEME VE KUYRUK YÖNETİMİ
    // ==========================================

    function compressImage(file, maxWidth = 1200, quality = 0.85) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }

                    const canvasEl = document.createElement("canvas");
                    canvasEl.width = width;
                    canvasEl.height = height;

                    const ctx = canvasEl.getContext("2d");
                    ctx.drawImage(img, 0, 0, width, height);

                    canvasEl.toBlob(
                        (blob) => {
                            if (blob) {
                                const compressedFile = new File([blob], file.name || "swatch.jpg", {
                                    type: "image/jpeg",
                                    lastModified: Date.now()
                                });
                                resolve(compressedFile);
                            } else {
                                resolve(file);
                            }
                        },
                        "image/jpeg",
                        quality
                    );
                };
                img.onerror = () => resolve(file);
            };
            reader.onerror = () => resolve(file);
        });
    }

    function addFilesToQueue(files) {
        files.forEach(f => {
            if (f && f.type && f.type.match("image.*")) {
                capturedPhotoQueue.push(f);
            }
        });
        renderQueue();
    }

    function renderQueue() {
        queueGrid.innerHTML = "";
        queueCount.textContent = capturedPhotoQueue.length;

        if (capturedPhotoQueue.length === 0) {
            queueBox.style.display = "none";
            return;
        }

        queueBox.style.display = "block";
        capturedPhotoQueue.forEach((file, index) => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "queue-item";
            
            const img = document.createElement("img");
            img.src = URL.createObjectURL(file);
            
            const removeBtn = document.createElement("button");
            removeBtn.className = "queue-item-remove";
            removeBtn.innerHTML = "&times;";
            removeBtn.title = "Kaldır";
            removeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                capturedPhotoQueue.splice(index, 1);
                renderQueue();
            });

            itemDiv.appendChild(img);
            itemDiv.appendChild(removeBtn);
            queueGrid.appendChild(itemDiv);
        });
    }

    btnClearQueue.addEventListener("click", () => {
        capturedPhotoQueue = [];
        renderQueue();
    });

    const btnNormalCamera = document.getElementById("btn-normal-camera");
    const btnChooseFiles = document.getElementById("btn-choose-files");
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (btnNormalCamera) {
        btnNormalCamera.addEventListener("click", () => {
            if (isMobileDevice) {
                cameraFileInput.click();
            } else {
                if (videoContainer.style.display === "none" || !videoContainer.style.display) {
                    startCamera();
                }
            }
        });
    }

    if (btnChooseFiles) {
        btnChooseFiles.addEventListener("click", () => {
            if (isMobileDevice) {
                mobileGalleryInput.click();
            } else {
                fileInput.click();
            }
        });
    }

    if (dragDropZone) {
        dragDropZone.addEventListener("click", () => fileInput.click());
    }

    if (fileInput) {
        fileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files.length > 0) {
                addFilesToQueue(Array.from(e.target.files));
                e.target.value = "";
            }
        });
    }

    if (mobileGalleryInput) {
        mobileGalleryInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files.length > 0) {
                addFilesToQueue(Array.from(e.target.files));
                e.target.value = "";
            }
        });
    }

    if (cameraFileInput) {
        cameraFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files.length > 0) {
                addFilesToQueue(Array.from(e.target.files));
                e.target.value = "";
            }
        });
    }

    // Process Queue Action
    btnProcessQueue.addEventListener("click", async () => {
        if (capturedPhotoQueue.length === 0) return;

        if (!hasApiKeyConfigured) {
            alert("⚠️ Yapay zeka ile kartelaları okuyabilmek için Gemini API Anahtarınızı kaydetmelisiniz.\n\nLütfen sol menüden 'Ayarlar' sekmesine girip Gemini API anahtarınızı kaydedin.");
            navButtons[2].click();
            return;
        }

        stopCamera();
        progressBarBox.style.display = "block";
        analysisLoader.style.display = "block";
        resultCard.style.opacity = "0.6";
        resultCard.style.pointerEvents = "none";

        let savedCount = 0;
        let lastParsed = null;
        let errorsList = [];
        const total = capturedPhotoQueue.length;

        for (let i = 0; i < total; i++) {
            const currentFile = capturedPhotoQueue[i];
            const pct = Math.round(((i + 1) / total) * 100);
            
            progressBarFill.style.width = pct + "%";
            progressText.textContent = `${i + 1} / ${total}`;
            loaderTitle.textContent = `Toplu Kartela Okunuyor: ${i + 1} / ${total}`;

            try {
                const compressed = await compressImage(currentFile);
                const parsed = await scanImagePromise(compressed);
                const savedRecord = await performSaveRecord(parsed);
                savedCount++;
                lastParsed = savedRecord;
            } catch (err) {
                console.error(`Queue item ${i + 1} failed:`, err);
                errorsList.push(`Kartela ${i + 1}: ${err.message || err}`);
            }
        }

        analysisLoader.style.display = "none";
        capturedPhotoQueue = [];
        renderQueue();

        if (lastParsed) {
            populateForm(lastParsed);
            resultCard.style.opacity = "1";
            resultCard.style.pointerEvents = "auto";
        }

        if (errorsList.length > 0 && savedCount === 0) {
            alert(`⚠️ Kartela Okuma Başarısız Oldu:\n\n${errorsList.join("\n")}\n\nLütfen Ayarlar sekmesinden Gemini API anahtarınızı kontrol edin.`);
        } else {
            alert(`✅ ${savedCount} adet kartela okundu ve veritabanına kaydedildi!`);
        }
    });

    function scanImagePromise(file) {
        const formData = new FormData();
        formData.append("file", file);
        
        return fetch("/api/scan", {
            method: "POST",
            body: formData
        }).then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Kartela okunamadı");
            return data;
        });
    }

    function populateForm(data) {
        editingInternalCode = data.internal_code || null;
        inputInternalCode.value = data.internal_code || ""; 
        if (data.internal_code) internalCodeGroup.style.display = "flex";

        inputCompany.value = toAppUpper(data.company_name);
        inputQualityCode.value = toAppUpper(data.quality_code);
        inputQualityName.value = toAppUpper(data.quality_name);
        inputDesign.value = toAppUpper(data.design_code);
        inputWidth.value = toAppUpper(data.width);
        inputWeight.value = toAppUpper(data.weight);
        inputComposition.value = cleanCompositionPunctuation(data.composition);
        inputBarcode.value = toAppUpper(data.barcode_or_qr);
    }

    // Dynamic Label Printing HTML Builder based on Saved Design Configuration
    function createSingleLabelHTML(data, option, barcodeId) {
        const cfg = Object.assign({}, currentDesignConfig);
        if (option) cfg.default_template = option;
        return generateModularLabelInnerHtml(data, cfg, barcodeId);
    }

    // Opens Printable Document with Custom User Preferences (Argox Roll vs A4 Grid)
    function triggerPrintWindow(labelsList, option) {
        const cfg = currentDesignConfig;
        const pType = cfg.printer_type || "a4";
        const w = cfg.label_width || 63.5;
        const h = cfg.label_height || 46.6;
        const cGap = cfg.col_gap !== undefined ? cfg.col_gap : 2.5;
        const rGap = cfg.row_gap !== undefined ? cfg.row_gap : 2.0;
        const mTop = cfg.margin_top !== undefined ? cfg.margin_top : 8.0;
        const mLeft = cfg.margin_left !== undefined ? cfg.margin_left : 6.0;
        const fontFamily = cfg.font_family || "'Outfit', sans-serif";

        const printWin = window.open("", "_blank");
        if (!printWin) {
            alert("Lütfen tarayıcınızın açılır pencere (popup) engelleyicisini kaldırın!");
            return;
        }

        let labelsHTML = "";
        labelsList.forEach((rec, idx) => {
            labelsHTML += createSingleLabelHTML(rec, option, idx);
        });

        let gridOrRollCSS = "";
        if (pType === "argox") {
            gridOrRollCSS = `
                @page { size: ${w}mm ${h}mm; margin: 0; }
                body { background: white; padding: 0; font-family: ${fontFamily}; }
                .a4-container { width: ${w}mm; min-height: ${h}mm; padding: 0; box-shadow: none; }
                .a4-label-grid { display: block; }
                .print-label { width: ${w}mm !important; height: ${h}mm !important; page-break-after: always; border: none; font-family: ${fontFamily}; }
            `;
        } else {
            gridOrRollCSS = `
                @page { size: A4 portrait; margin: ${mTop}mm ${mLeft}mm; }
                body { background: #f1f5f9; padding: 10px; font-family: ${fontFamily}; }
                .a4-container { background: white; margin: 0 auto; padding: ${mTop}mm ${mLeft}mm; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 210mm; min-height: 297mm; }
                .a4-label-grid { display: grid; grid-template-columns: repeat(3, ${w}mm); grid-auto-rows: ${h}mm; column-gap: ${cGap}mm; row-gap: ${rGap}mm; }
                .print-label { width: ${w}mm !important; height: ${h}mm !important; border: 1px dashed #cbd5e1; font-family: ${fontFamily}; }
                @media print {
                    body { background: white; padding: 0; }
                    .a4-container { box-shadow: none; padding: 0; margin: 0; width: 100%; }
                }
            `;
        }

        const pageHTML = `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>FabricTag Label Print</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Inter:wght@400;600;700&family=Montserrat:wght@400;600;700&family=Outfit:wght@300;400;500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
            <style>
                * { margin:0; padding:0; box-sizing:border-box; font-family:${fontFamily}; text-transform: uppercase; }
                body { text-align: center; }
                .print-btn-bar { margin-bottom: 15px; background: #ffffff; padding: 12px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); display: flex; justify-content: center; gap: 10px; }
                .btn { background: #4f46e5; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; }
                .btn-close { background: #64748b; }
                
                .print-label { padding: 2.5mm 3.5mm; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; box-sizing: border-box; background: white; page-break-inside: avoid; }
                .print-logo-row { display: flex; align-items: center; justify-content: flex-start; margin-bottom: 1.5mm; }
                .print-logo { width: auto; max-width: 28mm; object-fit: contain; display: block; }
                .print-option-a { gap: 1.2mm; }
                .print-option-a .print-row { display: flex; flex-direction: row; gap: 1.5mm; border: none; margin: 0; padding: 0; }
                .print-option-a .print-title { font-weight: 700; color: #000; white-space: nowrap; }
                .print-option-a .print-value { font-weight: 600; color: #000; word-break: break-word; }
                .print-barcode-container { display: flex; justify-content: center; margin-top: auto; padding-top: 0.5mm; }
                .print-barcode-svg { max-width: 90%; }
                .print-option-b .print-company { font-weight: 700; white-space: nowrap; overflow: hidden; }
                .print-option-b .print-name { font-weight: 600; }
                .print-option-b .print-code-line { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .print-option-b .print-comp { font-weight: 500; }
                .print-option-b .print-weight { font-weight: 700; }

                ${gridOrRollCSS}

                @media print {
                    .print-btn-bar { display: none !important; }
                }
            </style>
        </head>
        <body>
            <div class="print-btn-bar">
                <button class="btn" onclick="window.print();">🖨️ Print / Yazdır</button>
                <button class="btn btn-close" onclick="window.close();">Close / Kapat</button>
            </div>
            <div class="a4-container">
                <div class="a4-label-grid">${labelsHTML}</div>
            </div>
            <script>
                setTimeout(() => {
                    const items = ${JSON.stringify(labelsList)};
                    const bHeight = ${cfg.barcode_height || 8.0} * 3.77;
                    items.forEach((item, idx) => {
                        const code = (item.internal_code || "ELT0000001").toUpperCase();
                        const el = document.getElementById("barcode-" + idx);
                        if (el && window.JsBarcode) {
                            JsBarcode("#barcode-" + idx, code, { format: "CODE128", displayValue: false, height: bHeight, margin: 0 });
                        }
                    });
                    window.print();
                }, 250);
            <\/script>
        </body>
        </html>
        `;

        printWin.document.open();
        printWin.document.write(pageHTML);
        printWin.document.close();
    }

    function triggerSinglePrint(data) {
        const selectedOption = document.querySelector('input[name="print-option"]:checked').value;
        triggerPrintWindow([data], selectedOption);
    }
    
    function triggerBatchPrint(recordsList, selectedOption) {
        if (!recordsList || recordsList.length === 0) {
            alert("Lütfen toplu yazdırılacak kumaşların yanındaki kutucukları işaretleyin!");
            return;
        }
        triggerPrintWindow(recordsList, selectedOption);
    }

    // Perform Save / Update to API
    function performSaveRecord(overrideData = null) {
        const payload = overrideData ? {
            internal_code: overrideData.internal_code || editingInternalCode || null,
            company_name: toAppUpper(overrideData.company_name) || "GENEL",
            quality_code: toAppUpper(overrideData.quality_code) || "KODSUZ",
            quality_name: toAppUpper(overrideData.quality_name),
            design_code: toAppUpper(overrideData.design_code),
            width: toAppUpper(overrideData.width),
            weight: toAppUpper(overrideData.weight),
            composition: cleanCompositionPunctuation(overrideData.composition),
            barcode_or_qr: toAppUpper(overrideData.barcode_or_qr)
        } : {
            internal_code: editingInternalCode || null,
            company_name: toAppUpper(inputCompany.value) || "GENEL",
            quality_code: toAppUpper(inputQualityCode.value) || "KODSUZ",
            quality_name: toAppUpper(inputQualityName.value),
            design_code: toAppUpper(inputDesign.value),
            width: toAppUpper(inputWidth.value),
            weight: toAppUpper(inputWeight.value),
            composition: cleanCompositionPunctuation(inputComposition.value),
            barcode_or_qr: toAppUpper(inputBarcode.value)
        };
        
        return fetch("/api/fabrics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(res => {
            if (!res.ok) throw new Error("Veritabanına kaydedilirken sunucu hatası oluştu.");
            return res.json();
        })
        .then(savedRecord => {
            if (savedRecord.is_duplicate) {
                showToast("Bu kalite veritabanında zaten kayıtlı!", 1000);
            } else if (savedRecord.is_updated) {
                showToast("Mevcut kayıt başarıyla güncellendi!", 1000);
            } else {
                showToast("Yeni kumaş kaydedildi!", 1000);
            }

            editingInternalCode = savedRecord.internal_code;
            inputInternalCode.value = savedRecord.internal_code;
            internalCodeGroup.style.display = "flex";
            return savedRecord;
        });
    }
    
    btnSaveOnly.addEventListener("click", () => {
        btnSaveOnly.disabled = true;
        btnSaveOnly.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';
        
        performSaveRecord()
            .then(savedRecord => {
                // Toast shown
            })
            .catch(err => {
                alert("Hata: " + err);
            })
            .finally(() => {
                btnSaveOnly.disabled = false;
                btnSaveOnly.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> <span data-i18n="btn_save_only">' + (i18n[currentLang]?.btn_save_only || "Yalnızca Kaydet") + '</span>';
            });
    });

    btnSavePrint.addEventListener("click", () => {
        btnSavePrint.disabled = true;
        btnSavePrint.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';
        
        performSaveRecord()
            .then(savedRecord => {
                triggerSinglePrint(savedRecord);
            })
            .catch(err => {
                alert("Hata: " + err);
            })
            .finally(() => {
                btnSavePrint.disabled = false;
                btnSavePrint.innerHTML = '<i class="fa-solid fa-print"></i> <span data-i18n="btn_save_print">' + (i18n[currentLang]?.btn_save_print || "Kaydet & Yazdır") + '</span>';
            });
    });
    
    btnPrintOnly.addEventListener("click", () => {
        const payload = {
            internal_code: inputInternalCode.value || "ELT0000001",
            company_name: toAppUpper(inputCompany.value) || "GENEL",
            quality_code: toAppUpper(inputQualityCode.value) || "KODSUZ",
            quality_name: toAppUpper(inputQualityName.value),
            design_code: toAppUpper(inputDesign.value),
            width: toAppUpper(inputWidth.value),
            weight: toAppUpper(inputWeight.value),
            composition: cleanCompositionPunctuation(inputComposition.value),
            barcode_or_qr: toAppUpper(inputBarcode.value)
        };
        
        triggerSinglePrint(payload);
    });

    // Database Tab & Dual View (Cards vs Table)
    const btnViewCards = document.getElementById("btn-view-cards");
    const btnViewTable = document.getElementById("btn-view-table");
    const dbCardsContainer = document.getElementById("db-cards-container");
    const dbTableContainer = document.getElementById("db-table-container");

    let currentDbViewMode = localStorage.getItem("fabric_db_view_mode") || (window.innerWidth <= 768 ? "cards" : "cards");

    function setDbViewMode(mode) {
        currentDbViewMode = mode;
        try { localStorage.setItem("fabric_db_view_mode", mode); } catch(e) {}
        if (mode === "table") {
            if (btnViewTable) btnViewTable.classList.add("active");
            if (btnViewCards) btnViewCards.classList.remove("active");
            if (dbTableContainer) dbTableContainer.style.display = "block";
            if (dbCardsContainer) dbCardsContainer.style.display = "none";
        } else {
            if (btnViewCards) btnViewCards.classList.add("active");
            if (btnViewTable) btnViewTable.classList.remove("active");
            if (dbTableContainer) dbTableContainer.style.display = "none";
            if (dbCardsContainer) dbCardsContainer.style.display = "grid";
        }
    }

    if (btnViewCards) btnViewCards.addEventListener("click", () => setDbViewMode("cards"));
    if (btnViewTable) btnViewTable.addEventListener("click", () => setDbViewMode("table"));

    function updateBatchCountText() {
        const checkedCodes = new Set();
        document.querySelectorAll(".db-row-checkbox:checked").forEach(cb => {
            if (cb.dataset.code) checkedCodes.add(cb.dataset.code);
        });
        document.querySelectorAll(".db-card-checkbox:checked").forEach(cb => {
            if (cb.dataset.code) checkedCodes.add(cb.dataset.code);
        });

        const checkedCount = checkedCodes.size;
        if (checkedCount > 0) {
            btnBatchPrint.innerHTML = `<i class="fa-solid fa-print"></i> (${checkedCount})`;
            btnBatchPrint.classList.remove("btn-primary");
            btnBatchPrint.classList.add("btn-success");
        } else {
            btnBatchPrint.innerHTML = `<i class="fa-solid fa-print"></i> <span data-i18n="btn_batch_print">${i18n[currentLang]?.btn_batch_print || "Seçilenleri Toplu Yazdır (A4)"}</span>`;
            btnBatchPrint.classList.remove("btn-success");
            btnBatchPrint.classList.add("btn-primary");
        }
    }

    function syncCheckboxSelection(code, isChecked) {
        document.querySelectorAll(`.db-row-checkbox[data-code="${code}"]`).forEach(cb => cb.checked = isChecked);
        document.querySelectorAll(`.db-card-checkbox[data-code="${code}"]`).forEach(cb => {
            cb.checked = isChecked;
            const card = cb.closest(".fabric-card");
            if (card) {
                if (isChecked) card.classList.add("selected");
                else card.classList.remove("selected");
            }
        });
        updateBatchCountText();
    }

    function loadDatabase(search = "") {
        let url = "/api/fabrics";
        if (search) {
            url += "?search=" + encodeURIComponent(search);
        }
        
        // Ensure correct initial view mode
        setDbViewMode(currentDbViewMode);

        fetch(url)
            .then(res => res.json())
            .then(fabrics => {
                dbTableBody.innerHTML = "";
                if (dbCardsContainer) dbCardsContainer.innerHTML = "";
                if (selectAllDb) selectAllDb.checked = false;
                updateBatchCountText();
                
                if (fabrics.length === 0) {
                    const emptyMsg = search ? "Arama kriterlerinize uygun kumaş bulunamadı." : "Henüz hiçbir kumaş kartelası taranmamış.";
                    dbTableBody.innerHTML = `
                        <tr>
                            <td colspan="10" class="empty-state">
                                <i class="fa-solid fa-database"></i>
                                <p>${emptyMsg}</p>
                            </td>
                        </tr>
                    `;
                    if (dbCardsContainer) {
                        dbCardsContainer.innerHTML = `
                            <div class="empty-state" style="grid-column: 1 / -1; padding: 3rem; text-align: center; background: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1;">
                                <i class="fa-solid fa-database" style="font-size: 2.5rem; color: #94a3b8; margin-bottom: 0.75rem;"></i>
                                <p style="color: #64748b; font-weight: 600;">${emptyMsg}</p>
                            </div>
                        `;
                    }
                    return;
                }
                
                fabrics.forEach((f) => {
                    const code = f.internal_code || "KODSUZ";

                    // 1. Desktop Table Row
                    const tr = document.createElement("tr");
                    tr.dataset.fabricJson = JSON.stringify(f);
                    tr.dataset.code = code;
                    
                    tr.innerHTML = `
                        <td><input type="checkbox" class="db-row-checkbox" data-code="${code}"></td>
                        <td><span class="internal-code-badge">${code}</span></td>
                        <td><strong>${f.company_name}</strong></td>
                        <td>${f.quality_code}</td>
                        <td>${f.quality_name || "-"}</td>
                        <td>${f.design_code || "-"}</td>
                        <td title="${f.composition}">${f.composition ? (f.composition.length > 30 ? f.composition.substring(0, 30) + "..." : f.composition) : "-"}</td>
                        <td>${f.width || "-"}</td>
                        <td>${f.weight || "-"}</td>
                        <td>
                            <button class="btn-action btn-edit" title="Düzenle">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                        </td>
                    `;
                    
                    const rowCb = tr.querySelector(".db-row-checkbox");
                    rowCb.addEventListener("change", (e) => {
                        syncCheckboxSelection(code, e.target.checked);
                    });

                    tr.addEventListener("click", (e) => {
                        if (e.target.tagName !== "INPUT" && !e.target.closest(".btn-edit")) {
                            syncCheckboxSelection(code, !rowCb.checked);
                        }
                    });

                    tr.querySelector(".btn-edit").addEventListener("click", (e) => {
                        e.stopPropagation();
                        loadRecordIntoScanTab(f);
                    });
                    
                    dbTableBody.appendChild(tr);

                    // 2. Mobile & Rich Card Element
                    if (dbCardsContainer) {
                        const card = document.createElement("div");
                        card.className = "fabric-card";
                        card.dataset.fabricJson = JSON.stringify(f);
                        card.dataset.code = code;

                        card.innerHTML = `
                            <div class="fabric-card-header">
                                <div class="card-left-badge">
                                    <input type="checkbox" class="db-card-checkbox" data-code="${code}">
                                    <span class="internal-code-badge">${code}</span>
                                </div>
                                <div class="fabric-card-actions">
                                    <button type="button" class="btn-card-action btn-card-print" title="Yazdır"><i class="fa-solid fa-print"></i></button>
                                    <button type="button" class="btn-card-action btn-card-edit" title="Düzenle"><i class="fa-solid fa-pen-to-square"></i></button>
                                </div>
                            </div>
                            <div class="fabric-card-title">
                                <div class="fc-company"><i class="fa-solid fa-building"></i> ${f.company_name}</div>
                                <div class="fc-article"><i class="fa-solid fa-tag"></i> ${f.quality_code} ${f.quality_name ? '• ' + f.quality_name : ''}</div>
                            </div>
                            <div class="fabric-card-specs">
                                <div class="spec-item">
                                    <span class="spec-label"><i class="fa-solid fa-palette"></i> Desen</span>
                                    <span class="spec-value">${f.design_code || '-'}</span>
                                </div>
                                <div class="spec-item">
                                    <span class="spec-label"><i class="fa-solid fa-ruler-horizontal"></i> En</span>
                                    <span class="spec-value">${f.width ? f.width + ' cm' : '-'}</span>
                                </div>
                                <div class="spec-item">
                                    <span class="spec-label"><i class="fa-solid fa-weight-scale"></i> Gramaj</span>
                                    <span class="spec-value">${f.weight ? f.weight + ' g/m²' : '-'}</span>
                                </div>
                            </div>
                            ${f.composition ? `
                            <div class="fabric-card-comp">
                                <span class="comp-label"><i class="fa-solid fa-scroll"></i> Karışım:</span>
                                <span class="comp-value">${f.composition}</span>
                            </div>` : ''}
                        `;

                        const cardCb = card.querySelector(".db-card-checkbox");
                        cardCb.addEventListener("change", (e) => {
                            syncCheckboxSelection(code, e.target.checked);
                        });

                        card.addEventListener("click", (e) => {
                            if (e.target.tagName !== "INPUT" && !e.target.closest(".btn-card-action")) {
                                syncCheckboxSelection(code, !cardCb.checked);
                            }
                        });

                        card.querySelector(".btn-card-print").addEventListener("click", (e) => {
                            e.stopPropagation();
                            triggerSinglePrint(f);
                        });

                        card.querySelector(".btn-card-edit").addEventListener("click", (e) => {
                            e.stopPropagation();
                            loadRecordIntoScanTab(f);
                        });

                        dbCardsContainer.appendChild(card);
                    }
                });
            })
            .catch(err => {
                console.error("Error loading database:", err);
                dbTableBody.innerHTML = `
                    <tr>
                        <td colspan="10" class="empty-state text-error">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <p>Veritabanı listelenirken bir hata oluştu.</p>
                        </td>
                    </tr>
                `;
            });
    }
    
    if (selectAllDb) {
        selectAllDb.addEventListener("change", (e) => {
            const checked = e.target.checked;
            document.querySelectorAll(".db-row-checkbox").forEach(cb => cb.checked = checked);
            document.querySelectorAll(".db-card-checkbox").forEach(cb => {
                cb.checked = checked;
                const card = cb.closest(".fabric-card");
                if (card) {
                    if (checked) card.classList.add("selected");
                    else card.classList.remove("selected");
                }
            });
            updateBatchCountText();
        });
    }

    btnBatchPrint.addEventListener("click", () => {
        const selectedCodes = new Set();
        document.querySelectorAll(".db-row-checkbox:checked, .db-card-checkbox:checked").forEach(cb => {
            if (cb.dataset.code) selectedCodes.add(cb.dataset.code);
        });

        const selectedFabrics = [];
        document.querySelectorAll("#db-table-body tr").forEach(tr => {
            if (tr.dataset.code && selectedCodes.has(tr.dataset.code) && tr.dataset.fabricJson) {
                try {
                    selectedFabrics.push(JSON.parse(tr.dataset.fabricJson));
                } catch (err) {}
            }
        });

        if (selectedFabrics.length === 0) {
            alert("Lütfen toplu yazdırılacak en az bir kumaş kutucuğunu işaretleyin!");
            return;
        }

        const selectedTemplate = batchTemplateSelect.value;
        triggerBatchPrint(selectedFabrics, selectedTemplate);
    });

    function loadRecordIntoScanTab(record) {
        populateForm(record);
        duplicateWarning.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Düzenlenen Kayıt: ${record.internal_code}`;
        duplicateWarning.style.display = "inline-flex";
        
        imagePreview.src = "";
        previewBox.style.display = "none";
        
        resultCard.style.opacity = "1";
        resultCard.style.pointerEvents = "auto";
        
        navButtons[0].click();
        showToast(`Düzenleme modu: ${record.internal_code}`, 1000);
    }
    
    let searchTimeout = null;
    dbSearch.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadDatabase(e.target.value.trim());
        }, 300);
    });
    
    btnRefreshDb.addEventListener("click", () => {
        dbSearch.value = "";
        loadDatabase();
    });

    // ==========================================
    // EXCEL (.XLSX) & YEDEKLEME MERKEZİ MODAL
    // ==========================================
    const backupModal = document.getElementById("backup-modal");
    const btnOpenBackupModal = document.getElementById("btn-open-backup-modal");
    const btnCloseBackupModal = document.getElementById("btn-close-backup-modal");
    
    const btnQuickExportXlsx = document.getElementById("btn-quick-export-xlsx");
    const exportStartDate = document.getElementById("export-start-date");
    const exportEndDate = document.getElementById("export-end-date");
    const presetBtns = document.querySelectorAll(".preset-btn");
    const btnRangeExportXlsx = document.getElementById("btn-range-export-xlsx");
    const btnRangeCreateBackup = document.getElementById("btn-range-create-backup");
    
    const backupAutoToggle = document.getElementById("backup-auto-toggle");
    const backupAutoTime = document.getElementById("backup-auto-time");
    const btnSaveAutoBackup = document.getElementById("btn-save-auto-backup");
    
    const btnRefreshBackups = document.getElementById("btn-refresh-backups");
    const backupsListBody = document.getElementById("backups-list-body");

    function openBackupModal() {
        if (backupModal) {
            backupModal.classList.add("active");
            loadBackupsList();
        }
    }

    function closeBackupModal() {
        if (backupModal) {
            backupModal.classList.remove("active");
        }
    }

    if (btnOpenBackupModal) btnOpenBackupModal.addEventListener("click", openBackupModal);
    if (btnCloseBackupModal) btnCloseBackupModal.addEventListener("click", closeBackupModal);
    if (backupModal) {
        backupModal.addEventListener("click", (e) => {
            if (e.target === backupModal) closeBackupModal();
        });
    }

    // 1. Quick Export All to .xlsx
    if (btnQuickExportXlsx) {
        btnQuickExportXlsx.addEventListener("click", () => {
            window.open("/api/export-xlsx", "_blank");
            showToast("Excel (.xlsx) indiriliyor...", 1200);
        });
    }

    // 2. Preset Date Ranges
    function setDateTimeRange(preset) {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const formatDT = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        
        if (preset === "today") {
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            if (exportStartDate) exportStartDate.value = formatDT(start);
            if (exportEndDate) exportEndDate.value = formatDT(now);
        } else if (preset === "yesterday") {
            const yStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
            const yEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
            if (exportStartDate) exportStartDate.value = formatDT(yStart);
            if (exportEndDate) exportEndDate.value = formatDT(yEnd);
        } else if (preset === "this_week") {
            const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (exportStartDate) exportStartDate.value = formatDT(start);
            if (exportEndDate) exportEndDate.value = formatDT(now);
        } else if (preset === "this_month") {
            const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (exportStartDate) exportStartDate.value = formatDT(start);
            if (exportEndDate) exportEndDate.value = formatDT(now);
        } else if (preset === "all") {
            if (exportStartDate) exportStartDate.value = "";
            if (exportEndDate) exportEndDate.value = "";
        }
    }

    presetBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            presetBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            setDateTimeRange(btn.dataset.range);
        });
    });

    if (btnRangeExportXlsx) {
        btnRangeExportXlsx.addEventListener("click", () => {
            let url = "/api/export-xlsx";
            const params = [];
            if (exportStartDate && exportStartDate.value) params.push("start_date=" + encodeURIComponent(exportStartDate.value));
            if (exportEndDate && exportEndDate.value) params.push("end_date=" + encodeURIComponent(exportEndDate.value));
            if (params.length > 0) url += "?" + params.join("&");
            window.open(url, "_blank");
            showToast("Excel (.xlsx) indiriliyor...", 1500);
        });
    }

    if (btnRangeCreateBackup) {
        btnRangeCreateBackup.addEventListener("click", () => {
            btnRangeCreateBackup.disabled = true;
            btnRangeCreateBackup.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';
            
            fetch("/api/backups/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    start_date: exportStartDate ? exportStartDate.value : null,
                    end_date: exportEndDate ? exportEndDate.value : null,
                    label_prefix: "OZEL_YEDEK"
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast(`✅ ${data.backup.record_count} adet kayıt yedeklendi!`, 1500);
                    loadBackupsList();
                }
            })
            .catch(err => alert("Yedekleme hatası: " + err))
            .finally(() => {
                btnRangeCreateBackup.disabled = false;
                btnRangeCreateBackup.innerHTML = '<i class="fa-solid fa-shield-halved"></i> <span data-i18n="btn_range_backup">' + (i18n[currentLang]?.btn_range_backup || "Sunucuya Manuel Yedek Al") + '</span>';
            });
        });
    }

    // 3. Auto-Backup Settings Save
    if (btnSaveAutoBackup) {
        btnSaveAutoBackup.addEventListener("click", () => {
            const enabled = backupAutoToggle ? backupAutoToggle.checked : true;
            const bTime = backupAutoTime ? backupAutoTime.value : "18:00";
            
            fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    auto_backup_enabled: enabled,
                    auto_backup_time: bTime
                })
            })
            .then(res => res.json())
            .then(() => {
                showToast("Otomatik yedekleme ayarı kaydedildi!", 1200);
            })
            .catch(err => alert("Hata: " + err));
        });
    }

    // 4. Backups List Load
    function loadBackupsList() {
        if (!backupsListBody) return;
        fetch("/api/backups")
            .then(res => res.json())
            .then(files => {
                backupsListBody.innerHTML = "";
                if (files.length === 0) {
                    backupsListBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:1rem;">Henüz alınmış bir yedek dosyası yok.</td></tr>`;
                    return;
                }
                files.forEach(f => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td><strong><i class="fa-regular fa-file-excel" style="color:#10b981; margin-right:4px;"></i> ${f.filename}</strong></td>
                        <td>${f.created_at}</td>
                        <td>${f.size_kb} KB</td>
                        <td>
                            <a href="${f.download_url}" target="_blank" class="btn btn-secondary" style="padding:3px 8px; font-size:0.75rem; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
                                <i class="fa-solid fa-download"></i>
                            </a>
                        </td>
                    `;
                    backupsListBody.appendChild(tr);
                });
            })
            .catch(err => {
                console.error("Backups list error:", err);
            });
    }

    if (btnRefreshBackups) btnRefreshBackups.addEventListener("click", loadBackupsList);

    // ==========================================
    // EXCEL IMPORT & SMART COLUMN MATCHER
    // ==========================================
    const btnDownloadExcelTemplate = document.getElementById("btn-download-excel-template");
    const btnModalDownloadTemplate = document.getElementById("btn-modal-download-template");
    const btnOpenImportModal = document.getElementById("btn-open-import-modal");
    const btnCloseImportModal = document.getElementById("btn-close-import-modal");
    const excelImportModal = document.getElementById("excel-import-modal");
    const importStepUpload = document.getElementById("import-step-upload");
    const importStepMatcher = document.getElementById("import-step-matcher");
    const importDropArea = document.getElementById("import-drop-area");
    const excelFileInput = document.getElementById("excel-file-input");
    const importFileNameBadge = document.getElementById("import-file-name-badge");
    const importTotalRowsBadge = document.getElementById("import-total-rows-badge");
    const btnImportRechoose = document.getElementById("btn-import-rechoose");
    const importMatcherTableBody = document.getElementById("import-matcher-table-body");
    const btnCancelImport = document.getElementById("btn-cancel-import");
    const btnConfirmImport = document.getElementById("btn-confirm-import");

    let currentImportAnalysis = null;

    function downloadFabricTemplate() {
        window.open("/api/excel-template", "_blank");
        showToast("Örnek Excel Şablonu indiriliyor...", 1500);
    }

    if (btnDownloadExcelTemplate) btnDownloadExcelTemplate.addEventListener("click", downloadFabricTemplate);
    if (btnModalDownloadTemplate) btnModalDownloadTemplate.addEventListener("click", downloadFabricTemplate);

    function openExcelImportModal() {
        if (excelImportModal) {
            excelImportModal.classList.add("active");
            resetImportModalState();
        }
    }

    function closeExcelImportModal() {
        if (excelImportModal) excelImportModal.classList.remove("active");
        resetImportModalState();
    }

    function resetImportModalState() {
        if (importStepUpload) importStepUpload.style.display = "block";
        if (importStepMatcher) importStepMatcher.style.display = "none";
        if (excelFileInput) excelFileInput.value = "";
        currentImportAnalysis = null;
    }

    if (btnOpenImportModal) btnOpenImportModal.addEventListener("click", openExcelImportModal);
    if (btnCloseImportModal) btnCloseImportModal.addEventListener("click", closeExcelImportModal);
    if (btnCancelImport) btnCancelImport.addEventListener("click", closeExcelImportModal);
    if (btnImportRechoose) btnImportRechoose.addEventListener("click", resetImportModalState);

    // Dropzone logic
    if (importDropArea && excelFileInput) {
        importDropArea.addEventListener("click", () => excelFileInput.click());
        importDropArea.addEventListener("dragover", (e) => {
            e.preventDefault();
            importDropArea.classList.add("dragover");
        });
        importDropArea.addEventListener("dragleave", () => {
            importDropArea.classList.remove("dragover");
        });
        importDropArea.addEventListener("drop", (e) => {
            e.preventDefault();
            importDropArea.classList.remove("dragover");
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleExcelFileSelect(e.dataTransfer.files[0]);
            }
        });
        excelFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleExcelFileSelect(e.target.files[0]);
            }
        });
    }

    function handleExcelFileSelect(file) {
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);

        showToast("Excel analiz ediliyor...", 1500);

        fetch("/api/excel/analyze", {
            method: "POST",
            body: formData
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(d => { throw new Error(d.detail || "Dosya okunamadı."); });
            }
            return res.json();
        })
        .then(data => {
            currentImportAnalysis = data;
            renderColumnMatcherUI(data);
        })
        .catch(err => {
            alert("Excel Analiz Hatası: " + err.message);
        });
    }

    const SYSTEM_FIELDS = [
        { id: "", label: "-- Eşleme Yapma (Atla) --" },
        { id: "internal_code", label: "İç Kod (Internal Code)" },
        { id: "company_name", label: "Firma Adı (Supplier / Company)" },
        { id: "quality_code", label: "Kalite Kodu (Article)" },
        { id: "quality_name", label: "Kalite Adı (Quality Name)" },
        { id: "design_code", label: "Desen / Renk Kodu (Design)" },
        { id: "composition", label: "Karışım (Composition)" },
        { id: "width", label: "En (Width - cm)" },
        { id: "weight", label: "Gramaj (Weight - g/m²)" },
        { id: "barcode_or_qr", label: "Barkod / QR Değeri (Barcode)" }
    ];

    function renderColumnMatcherUI(data) {
        if (!importStepUpload || !importStepMatcher || !importMatcherTableBody) return;

        importStepUpload.style.display = "none";
        importStepMatcher.style.display = "block";

        if (importFileNameBadge) importFileNameBadge.innerText = data.filename || "Excel Dosyası";
        if (importTotalRowsBadge) importTotalRowsBadge.innerText = data.total_rows || 0;

        importMatcherTableBody.innerHTML = "";

        data.headers.forEach((headerName, colIdx) => {
            const tr = document.createElement("tr");

            // Sample values preview from first rows
            const samples = [];
            if (data.sample_rows) {
                data.sample_rows.forEach(r => {
                    if (r[colIdx] !== undefined && r[colIdx] !== "") {
                        samples.push(r[colIdx]);
                    }
                });
            }
            const sampleText = samples.slice(0, 2).join(", ") || "-";

            const suggestedField = data.suggested_mappings ? (data.suggested_mappings[headerName] || "") : "";

            let optionsHtml = "";
            SYSTEM_FIELDS.forEach(sf => {
                const isSelected = sf.id === suggestedField ? "selected" : "";
                optionsHtml += `<option value="${sf.id}" ${isSelected}>${sf.label}</option>`;
            });

            tr.innerHTML = `
                <td><strong>${headerName}</strong></td>
                <td><span style="display:inline-block; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; background:#f1f5f9; padding:2px 8px; border-radius:4px; font-size:0.8rem; color:#475569;" title="${sampleText}">${sampleText}</span></td>
                <td>
                    <select class="select-input matcher-select" data-header="${headerName}" style="padding:4px 8px; font-size:0.85rem; width:100%; font-weight:600; color: #1e1b4b;">
                        ${optionsHtml}
                    </select>
                </td>
            `;

            importMatcherTableBody.appendChild(tr);
        });
    }

    if (btnConfirmImport) {
        btnConfirmImport.addEventListener("click", () => {
            if (!currentImportAnalysis || !currentImportAnalysis.temp_file_id) {
                alert("Lütfen önce bir Excel dosyası yükleyin!");
                return;
            }

            const mappings = {};
            document.querySelectorAll(".matcher-select").forEach(sel => {
                const header = sel.dataset.header;
                const field = sel.value;
                mappings[header] = field;
            });

            btnConfirmImport.disabled = true;
            btnConfirmImport.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> İçe Aktarılıyor...';

            fetch("/api/excel/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    temp_file_id: currentImportAnalysis.temp_file_id,
                    mappings: mappings
                })
            })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(d => { throw new Error(d.detail || "İçe aktarma başarısız."); });
                }
                return res.json();
            })
            .then(res => {
                closeExcelImportModal();
                showToast(`🎉 ${res.imported_count} yeni kumaş eklendi, ${res.updated_count} kumaş güncellendi!`, 3000);
                loadDatabase();
            })
            .catch(err => {
                alert("İçe Aktarma Hatası: " + err.message);
            })
            .finally(() => {
                btnConfirmImport.disabled = false;
                btnConfirmImport.innerHTML = '<i class="fa-solid fa-check-double"></i> <span data-i18n="btn_confirm_import">' + (i18n[currentLang]?.btn_confirm_import || "Kumaşları İçe Aktar") + '</span>';
            });
        });
    }

    // ==========================================
    // PWA (PROGRESSIVE WEB APP) & MOBILE INSTALL
    // ==========================================
    let deferredPrompt = null;
    const btnInstallPwa = document.getElementById("btn-install-pwa");

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('FabricTag PWA Service Worker Registered:', reg.scope))
                .catch(err => console.log('Service Worker Registration error:', err));
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (btnInstallPwa) {
            btnInstallPwa.style.display = "flex";
        }
    });

    if (btnInstallPwa) {
        btnInstallPwa.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    showToast("FabricTag başarıyla kuruluyor...", 1500);
                }
                deferredPrompt = null;
            } else {
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                if (isIOS) {
                    alert("📱 iPhone / iPad Kurulumu:\n\nSafari tarayıcısının altındaki 'Paylaş (Share)' butonuna dokunun ve 'Ana Ekrana Ekle (Add to Home Screen)' seçeneğini seçin.");
                } else {
                    alert("📱 Telefona Uygulama Kurulumu:\n\nTarayıcınızın sağ üstündeki 3 noktaya (...) dokunup 'Uygulamayı Yükle' veya 'Ana Ekrana Ekle' seçeneğine basarak uygulamayı telefonunuza yükleyebilirsiniz.");
                }
            }
        });
    }

    // Expose Functions Globally for direct clicks
    window.loadDatabase = loadDatabase;
    window.loadSettings = loadSettings;

    // Initial Startup UI Rendering & Server Info
    applyConfigToUI(currentDesignConfig);
    checkServerInfo();
    loadSettings();
    loadLicenseStatus();
    checkSystemUpdates();
    // ==========================================
    // LİSANS YÖNETİMİ & 20 KAYIT FREE TIER
    // ==========================================
    const modalLicenseOverlay = document.getElementById("modal-license-overlay");
    const btnOpenLicenseModal = document.getElementById("btn-open-license-modal");
    const btnCloseLicenseModal = document.getElementById("btn-close-license-modal");
    const btnCancelLicense = document.getElementById("btn-cancel-license");
    const licenseHwInput = document.getElementById("license-hardware-id-input");
    const btnCopyHwAction = document.getElementById("btn-copy-hw-action");
    const btnCopyHardwareId = document.getElementById("btn-copy-hardware-id");
    const licenseKeyInput = document.getElementById("license-key-input");
    const btnSubmitLicenseActivate = document.getElementById("btn-submit-license-activate");
    const licenseActivationAlert = document.getElementById("license-activation-alert");
    const licenseBadgeStatus = document.getElementById("license-badge-status");
    const licenseBadgeText = document.getElementById("license-badge-text");
    const modalLicenseStatusBox = document.getElementById("modal-license-status-box");
    const modalLicenseStatusTitle = document.getElementById("modal-license-status-title");
    const modalLicenseStatusBadge = document.getElementById("modal-license-status-badge");

    let currentLicenseStatus = null;

    function openLicenseModal() {
        if (modalLicenseOverlay) modalLicenseOverlay.classList.add("active");
        if (licenseKeyInput) licenseKeyInput.value = "";
        if (licenseActivationAlert) licenseActivationAlert.style.display = "none";
        loadLicenseStatus();
    }

    function closeLicenseModal() {
        if (modalLicenseOverlay) modalLicenseOverlay.classList.remove("active");
    }

    if (btnOpenLicenseModal) btnOpenLicenseModal.addEventListener("click", openLicenseModal);
    if (btnCloseLicenseModal) btnCloseLicenseModal.addEventListener("click", closeLicenseModal);
    if (btnCancelLicense) btnCancelLicense.addEventListener("click", closeLicenseModal);

    function copyHardwareIdToClipboard() {
        if (licenseHwInput && licenseHwInput.value) {
            navigator.clipboard.writeText(licenseHwInput.value).then(() => {
                showToast("Donanim Kimligi kopyalandi!", 1200);
            }).catch(() => {
                licenseHwInput.select();
                document.execCommand("copy");
                showToast("Donanim Kimligi kopyalandi!", 1200);
            });
        }
    }

    if (btnCopyHwAction) btnCopyHwAction.addEventListener("click", copyHardwareIdToClipboard);
    if (btnCopyHardwareId) btnCopyHardwareId.addEventListener("click", copyHardwareIdToClipboard);

    function loadLicenseStatus() {
        fetch("/api/license/status")
            .then(res => res.json())
            .then(data => {
                currentLicenseStatus = data;
                if (licenseHwInput && data.hardware_id) {
                    licenseHwInput.value = data.hardware_id;
                }

                if (data.is_licensed) {
                    if (licenseBadgeStatus) {
                        licenseBadgeStatus.className = "sidebar-license-badge licensed";
                        licenseBadgeStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span id="license-badge-text">' + (data.license_info?.type || "Lisansli Surum") + '</span>';
                    }
                    if (modalLicenseStatusTitle) modalLicenseStatusTitle.textContent = "Durum: Lisansli Ticari Surum (" + (data.license_info?.company || "COMMERCIAL") + ")";
                    if (modalLicenseStatusBadge) {
                        modalLicenseStatusBadge.className = "badge badge-success";
                        modalLicenseStatusBadge.style.background = "#dcfce7";
                        modalLicenseStatusBadge.style.color = "#166534";
                        modalLicenseStatusBadge.textContent = "Sinirsiz Kullanim";
                    }
                } else {
                    const remaining = data.remaining_free_records !== undefined ? data.remaining_free_records : 20;
                    const used = data.records_count || 0;
                    if (licenseBadgeStatus) {
                        licenseBadgeStatus.className = "sidebar-license-badge free";
                        licenseBadgeStatus.innerHTML = '<i class="fa-solid fa-gift"></i> <span id="license-badge-text">Ucretsiz: ' + remaining + '/20 Kalan</span>';
                    }
                    if (modalLicenseStatusTitle) modalLicenseStatusTitle.textContent = "Durum: Ucretsiz Deneme (" + used + "/20 Kullanildi)";
                    if (modalLicenseStatusBadge) {
                        modalLicenseStatusBadge.className = "badge badge-warning";
                        modalLicenseStatusBadge.style.background = remaining === 0 ? "#fee2e2" : "#fef3c7";
                        modalLicenseStatusBadge.style.color = remaining === 0 ? "#991b1b" : "#92400e";
                        modalLicenseStatusBadge.textContent = remaining === 0 ? "Limit Doldu (Kilitli)" : remaining + " Hak Kaldi";
                    }
                }
            })
            .catch(err => console.error("Error loading license status:", err));
    }

    if (btnSubmitLicenseActivate) {
        btnSubmitLicenseActivate.addEventListener("click", () => {
            const key = licenseKeyInput ? licenseKeyInput.value.trim() : "";
            if (!key) {
                alert("Lutfen gecerli bir lisans anahtari girin!");
                return;
            }

            btnSubmitLicenseActivate.disabled = true;
            btnSubmitLicenseActivate.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Dogrulaniyor...';

            fetch("/api/license/activate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ license_key: key })
            })
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    if (licenseActivationAlert) {
                        licenseActivationAlert.style.display = "block";
                        licenseActivationAlert.style.background = "#dcfce7";
                        licenseActivationAlert.style.color = "#166534";
                        licenseActivationAlert.style.border = "1px solid #bbf7d0";
                        licenseActivationAlert.textContent = res.message;
                    }
                    showToast("Tebrikler! FabricTag sinirsiz lisansiniz aktive edildi.", 2000);
                    loadLicenseStatus();
                    setTimeout(() => {
                        closeLicenseModal();
                    }, 1500);
                } else {
                    if (licenseActivationAlert) {
                        licenseActivationAlert.style.display = "block";
                        licenseActivationAlert.style.background = "#fee2e2";
                        licenseActivationAlert.style.color = "#991b1b";
                        licenseActivationAlert.style.border = "1px solid #fecaca";
                        licenseActivationAlert.textContent = res.message;
                    }
                }
            })
            .catch(err => alert("Hata: " + err))
            .finally(() => {
                btnSubmitLicenseActivate.disabled = false;
                btnSubmitLicenseActivate.innerHTML = '<i class="fa-solid fa-shield-check"></i> <span data-i18n="btn_activate_now">' + (i18n[currentLang]?.btn_activate_now || "Lisansi Aktive Et") + '</span>';
            });
        });
    }

    // ==========================================
    // KULLANICI REHBERİ (USER GUIDE) & LİSANS MODALLARI
    // ==========================================
    window.openUserGuideModal = function() {
        const overlay = document.getElementById("modal-user-guide-overlay");
        if (overlay) overlay.classList.add("active");
    };

    window.closeUserGuideModal = function() {
        const overlay = document.getElementById("modal-user-guide-overlay");
        if (overlay) overlay.classList.remove("active");
    };

    window.openLicenseModal = function() {
        const overlay = document.getElementById("modal-license-overlay");
        if (overlay) overlay.classList.add("active");
        if (licenseKeyInput) licenseKeyInput.value = "";
        if (licenseActivationAlert) licenseActivationAlert.style.display = "none";
        loadLicenseStatus();
    };

    window.closeLicenseModal = function() {
        const overlay = document.getElementById("modal-license-overlay");
        if (overlay) overlay.classList.remove("active");
    };

    window.applyAppLanguage = function(lang) {
        applyLanguage(lang);
    };

    const btnOpenUserGuide = document.getElementById("btn-open-user-guide");
    const btnCloseUserGuide = document.getElementById("btn-close-user-guide");
    const btnCloseGuideFooter = document.getElementById("btn-close-guide-footer");

    if (btnOpenUserGuide) btnOpenUserGuide.addEventListener("click", window.openUserGuideModal);
    if (btnCloseUserGuide) btnCloseUserGuide.addEventListener("click", window.closeUserGuideModal);
    if (btnCloseGuideFooter) btnCloseGuideFooter.addEventListener("click", window.closeUserGuideModal);

    applyLanguage(currentLang);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}

