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
        tr: {
            lang_label: "Dil / Language:",
            nav_scan: "Kartela Tara",
            nav_database: "Veritabanı / Geçmiş",
            nav_settings: "Ayarlar & Tasarım",
            mobile_qr_title: "Mobil & QR Bağlantı",
            api_active: "Gemini API Aktif",
            api_offline: "Gemini API Bağlı Değil",
            scan_header_title: "Kartela Tarama Ekranı",
            scan_header_desc: "Kumaş kartelası fotoğraflarını çekin veya yükleyin.",
            drag_drop_title: "Kartela Resimlerini Yükleyin / Çekin",
            drag_drop_subtitle: "Tıklayarak veya sürükleyerek",
            drag_drop_limits: "JPEG, JPG, PNG (Çoklu Fotoğraf Seçebilirsiniz)",
            btn_normal_camera: "Kamera ile Çek",
            btn_choose_files: "Galeriden / Dosyadan Seç",
            btn_live_camera: "Canlı Kamera (Seri Çekim)",
            btn_capture_now: "Kartela Fotoğrafı Çek & Oku",
            btn_close_camera: "Kamerayı Kapat",
            queue_title: "Fotoğraf Kuyruğu",
            btn_clear_queue: "Kuyruğu Temizle",
            btn_process_queue: "Kuyruktaki Tüm Kartelaları Oku & Kaydet",
            loader_title: "Yapay Zeka Kartelayı Çözümlüyor...",
            loader_subtitle: "Yazılar okunuyor, resim sıkıştırılıyor ve veriler gruplanıyor.",
            form_title: "Okunan Kartela Bilgileri",
            lbl_internal_code: "Atanan İç Kod (Internal Code)",
            lbl_company: "Kumaşçı / Üretici Firma",
            lbl_quality_code: "Kalite Kodu (Article)",
            lbl_quality_name: "Kalite Adı (Name)",
            lbl_design_code: "Desen / Varyant Kodu (Design)",
            lbl_width: "En (Width)",
            lbl_weight: "Gramaj (Weight)",
            lbl_composition: "Karışım / Yapı (Composition - Sembolsüz)",
            lbl_barcode: "Barkod / QR Değeri",
            template_select_title: "Yazıcı Şablonu Seçin:",
            opt_a_name: "Seçenek A",
            opt_a_desc: "Gizli / Sır Etiket",
            opt_b_name: "Seçenek B",
            opt_b_desc: "Açık Detaylı Etiket",
            btn_save_only: "Yalnızca Kaydet",
            btn_save_print: "Kaydet & Yazdır",
            btn_print_only: "Yalnızca Yazdır",
            db_header_title: "Kumaş Veritabanı ve Geçmişi",
            db_header_desc: "Şu ana kadar taranan ve kaydedilen tüm etiketler burada tutulur.",
            btn_excel_backup_modal: "Excel (.xlsx) & Yedekleme",
            btn_batch_print: "Seçilenleri Toplu Yazdır (A4)",
            th_code: "Ic Kod",
            th_company: "Firma",
            th_quality_code: "Kalite Kodu",
            th_quality_name: "Kalite Adi",
            th_design_code: "Desen Kodu",
            th_composition: "Karisim",
            th_width: "En",
            th_weight: "Gramaj",
            th_actions: "Islemler",
            db_loading: "Veritabani yukleniyor...",
            settings_header_title: "Sistem Ayarlari & Gorsel Etiket Tasarimcisi",
            settings_header_desc: "Etiket tasarimi, logo secimi, yazi tipi (font), ozel boyutlar ve alan hizalamalari.",
            studio_title: "Canli Gorsel Etiket Tasarim Studyosu",
            studio_desc: "Etiket uzerindeki verilerin konumunu, boyutunu, hizalamasini ve logoyu canli taslak uzerinden duzenleyin. Mavi kesikli cizgiler etiket sinirini temsil eder.",
            btn_reset_default: "Varsayılana Sıfırla",
            btn_save_design: "Tasarim Ayarlarini Kaydet",
            preview_title: "Canli Taslak Onizleme",
            dashed_help_strong: "Kesikli Cizgiler:",
            dashed_help_text: "Etiketinizin fiziksel kesim siniridir. Logo veya yazilarin bu sinirin disina tasmadigindan emin olun.",
            ctrl_template_type: "Sablon Turu",
            opt_a_full: "Secenek A (Gizli Kodlu)",
            opt_b_full: "Secenek B (Detayli Acik)",
            opt_a_desc_full: "Secenek A (Gizli / Sir Etiket)",
            opt_b_desc_full: "Secenek B (Acik Detayli Etiket)",
            ctrl_logo_title: "Sirket Logosu",
            lbl_active_logo: "Aktif Logo Secimi:",
            opt_default_logo: "Varsayilan FabricTag Logo",
            btn_upload_logo: "Logo Yukle",
            lbl_logo_height: "Logo Yuksekligi:",
            lbl_logo_align: "Logo Hizalama:",
            opt_align_left: "Sol",
            opt_align_center: "Orta",
            opt_align_right: "Sag",
            ctrl_font_sizes: "Yazi Fontu & Alan Boyutlari",
            lbl_font_family: "Yazi Font Ailesi (Yazi Tipi):",
            opt_font_outfit: "Outfit (Modern & Temiz - Varsayilan)",
            opt_font_arial: "Arial / Helvetica (Klasik & Keskin)",
            opt_font_inter: "Inter (Kurumsal & Duzgun)",
            opt_font_roboto: "Roboto (Dengeli & Okunakli)",
            opt_font_montserrat: "Montserrat (Sik & Geometrik)",
            opt_font_courier: "Courier / Monospace (Teknik / Daktilo)",
            ctrl_fiber_abbr_title: "Uluslararasi Elyaf Kisaltmasi (ISO/BISFA)",
            ctrl_fiber_abbr_desc: "Orn: Pamuk ➔ CO, Polyester ➔ PES, Elastan ➔ EA, Viskon ➔ CV",
            lbl_field_company: "Firma Adi",
            lbl_field_quality_name: "Kalite Adi",
            lbl_field_variant_code: "Varyant ve Renk Kodu",
            lbl_field_composition: "Karisim",
            lbl_field_weight: "Gramaj",
            lbl_align: "Hizalama:",
            lbl_black_bar: "Siyah Zemin / Beyaz Yazi (Secenek B):",
            ctrl_barcode_title: "Barkod Cizgisi",
            lbl_barcode_height: "Barkod Yuksekligi:",
            page_dimensions_title: "Sayfa ve Kagit Olculeri (A4 / Argox Rulo)",
            page_dimensions_desc: "Etiketinizin fiziksel milimetre olculerini ve bosluklarini belirleyin.",
            lbl_default_template: "Varsayilan Yazdirma Sablonu",
            lbl_printer_type: "Yazici Turu",
            opt_printer_a4: "A4 Lazer Yazici (3x6 Izgara Sayfa)",
            opt_printer_argox: "Argox / Rulo Termal Yazici (Tekli Surekli)",
            lbl_label_width: "Etiket Genisligi (mm)",
            lbl_label_height: "Etiket Yuksekligi (mm)",
            lbl_col_gap: "Sutun Arasi Bosluk (mm)",
            lbl_row_gap: "Satir Arasi Bosluk (mm)",
            lbl_margin_top: "Sayfa Ust Kenar Boslugu (mm)",
            lbl_margin_left: "Sayfa Sol Kenar Boslugu (mm)",
            btn_save_paper: "Kagit Olculerini Kaydet",
            api_config_title: "Gemini API Yapilandirmasi",
            api_config_desc: "Karteladaki metinleri yuksek dogrulukla okuyabilmek icin Google Gemini yapay zekasina ihtiyac duyulmaktadir.",
            lbl_api_key: "Gemini API Key (Anahtari)",
            btn_save: "Kaydet",
            modal_backup_title: "Excel (.xlsx) Disa Aktarma & Yedekleme Merkezi",
            modal_card1_title: "1. Hizli Excel Calisma Kitabi (*.xlsx) Indir",
            modal_card1_desc: "Veritabaninizdaki tum kumas kayitlarini bicimlendirilmis, renkli ve otomatik sutun genislikli Microsoft Excel (*.xlsx) tablosu olarak hemen bilgisayariniza indirin.",
            btn_quick_export: "Tum Veritabanini Excel (.xlsx) Olarak Indir",
            modal_card2_title: "2. Gun & Saat Secimli Ozel Excel / Yedek Alma",
            modal_card2_desc: "Belirli bir tarih ve saat araliginda eklenen/taranan kumaslari filtreleyerek Excel olarak indirin veya sunucuda yedekleyin.",
            preset_today: "Bugun",
            preset_yesterday: "Dun",
            preset_7days: "Son 7 Gun",
            preset_30days: "Son 30 Gun",
            preset_all: "Tum Zamanlar",
            lbl_start_dt: "Baslangic Tarihi & Saati:",
            lbl_end_dt: "Bitis Tarihi & Saati:",
            btn_range_export: "Secilen Tarihleri Excel (.xlsx) Indir",
            btn_range_backup: "Sunucuya Manuel Yedek Al",
            modal_card3_title: "3. Otomatik Gunluk Yedekleme Ayari",
            lbl_auto_backup_time: "Her Gun Otomatik Yedek Alma Saati:",
            btn_save_timing: "Zamanlamayi Kaydet",
            modal_card4_title: "4. Sunucudaki Yedek Dosyalari",
            btn_refresh: "Yenile",
            th_bk_file: "Dosya Adi",
            th_bk_date: "Yedek Tarihi",
            th_bk_size: "Boyut",
            th_bk_action: "Islem",
            search_placeholder: "Ic kod, firma, kalite veya desen ara...",
            code_settings_title: "Ic Kod Bicimlendirme & Otomatik Sayac",
            code_settings_desc: "Taranan her yeni kumasa otomatik atanacak ic kodun harf on ekini, basamak sayisini ve baslangic numarasini belirleyin.",
            lbl_code_preview: "Olusturulacak Ornek Kod:",
            lbl_code_type: "Kod Yapisi Turu",
            opt_code_letters: "Harf On Ekli (Orn: ELT, FT)",
            opt_code_numbers: "Sadece Sayi (Harfsiz Direkt Numara)",
            lbl_code_prefix: "On Ek Metni (Harfler)",
            lbl_code_separator: "Ayrac / Cizgi",
            opt_sep_none: "Yok (Bitisik: ELT0000001)",
            opt_sep_dash: "Tire ( - : ELT-0000001)",
            opt_sep_underscore: "Alt Cizgi ( _ : ELT_0000001)",
            opt_sep_dot: "Nokta ( . : ELT.0000001)",
            lbl_code_digits: "Hane / Basamak Sayisi",
            opt_digits_7: "7 Hane (0000001 - Standart)",
            opt_digits_6: "6 Hane (000001)",
            opt_digits_5: "5 Hane (00001)",
            opt_digits_4: "4 Hane (0001)",
            opt_digits_dynamic: "Dinamik (Sifirsiz: 1, 2, 3...)",
            lbl_code_start: "Baslangic Numarasi",
            btn_save_code_settings: "Ic Kod Ayarlarini Kaydet",
            btn_install_pwa: "Telefona Uygulama Olarak Yukle",
            view_cards: "Kartlar",
            view_table: "Tablo",
            btn_download_template: "Sablon Indir (.xlsx)",
            btn_import_excel: "Excel'den Ice Aktar",
            modal_import_title: "Excel'den Kumas Ice Aktarma",
            import_step1_desc: "Firmanizin mevcut Excel tablosunu (*.xlsx veya *.csv) yukleyin. Sistem sutunlari otomatik eslestirecektir.",
            import_drop_title: "Excel Dosyanizi Buraya Surukleyin veya Secin",
            import_choose_file: "Dosya Secin",
            import_need_template_title: "Formatınız Yok mu?",
            import_need_template_desc: "Hazir standart bos kumas aktarim sablonunu indirin.",
            lbl_rows_detected: "Kumas Kaydi Algilandi",
            btn_rechoose: "Farkli Dosya Sec",
            matcher_instruction: "Excel sutunlariniz ile sistem alanlari asagida otomatik eslestirildi. Ihtiyac halinde degistirebilirsiniz:",
            th_excel_header: "Excel Sutun Basligi",
            th_sample_data: "Ornek Veri",
            th_system_field: "Eslesecek Sistem Alani",
            lbl_code_behavior_title: "Ic Kod Mantigi:",
            lbl_code_behavior_desc: "Excel dosyanizda ic kod varsa korunur ve sayaciniz kaldigi yerden devam eder. Ic kod sutunu bos veya eslestirilmemisse, sistem otomatik siradaki sayac kodunu atar.",
            btn_cancel: "Iptal",
            btn_confirm_import: "Kumaslari Ice Aktar"
        },
        en: {
            lang_label: "Language / Dil:",
            nav_scan: "Scan Swatch",
            nav_database: "Database / History",
            nav_settings: "Settings & Designer",
            mobile_qr_title: "Mobile & QR Access",
            api_active: "Gemini AI Active",
            api_offline: "Gemini API Offline",
            scan_header_title: "Fabric Swatch Scanning",
            scan_header_desc: "Capture or upload fabric swatch cards and hangers.",
            drag_drop_title: "Upload / Capture Swatch Images",
            drag_drop_subtitle: "Click or drag & drop to",
            drag_drop_limits: "JPEG, JPG, PNG (Multiple files supported)",
            btn_normal_camera: "Take Photo",
            btn_choose_files: "Choose from Files",
            btn_live_camera: "Live Rapid Camera",
            btn_capture_now: "Snap & Analyze Swatch",
            btn_close_camera: "Close Camera",
            queue_title: "Photo Queue",
            btn_clear_queue: "Clear Queue",
            btn_process_queue: "Process All Swatches & Save",
            loader_title: "AI Analyzing Fabric Swatch...",
            loader_subtitle: "Recognizing texts, compressing image and grouping data.",
            form_title: "Extracted Swatch Information",
            lbl_internal_code: "Assigned Internal Code",
            lbl_company: "Fabric Mill / Supplier",
            lbl_quality_code: "Quality Code (Article)",
            lbl_quality_name: "Quality Name",
            lbl_design_code: "Design / Color Code",
            lbl_width: "Width",
            lbl_weight: "Weight",
            lbl_composition: "Composition (Clean Text)",
            lbl_barcode: "Barcode / QR Code Value",
            template_select_title: "Select Print Template:",
            opt_a_name: "Option A",
            opt_a_desc: "Secret / Confidential Label",
            opt_b_name: "Option B",
            opt_b_desc: "Detailed Public Label",
            btn_save_only: "Save Only",
            btn_save_print: "Save & Print",
            btn_print_only: "Print Only",
            db_header_title: "Fabric Database & Archive",
            db_header_desc: "All scanned and archived fabric labels are stored here.",
            btn_excel_backup_modal: "Excel (.xlsx) & Backup",
            btn_batch_print: "Batch Print Selected (A4)",
            th_code: "Internal Code",
            th_company: "Supplier",
            th_quality_code: "Article",
            th_quality_name: "Quality Name",
            th_design_code: "Design Code",
            th_composition: "Composition",
            th_width: "Width",
            th_weight: "Weight",
            th_actions: "Actions",
            db_loading: "Loading database...",
            settings_header_title: "System Settings & Label Designer",
            settings_header_desc: "Label layout, logo selection, font family, custom dimensions and alignments.",
            studio_title: "Live Visual Label Designer Studio",
            studio_desc: "Customize layout, font sizes, alignments and logo in real-time. Dashed blue line represents label boundaries.",
            btn_reset_default: "Reset to Default",
            btn_save_design: "Save Design Settings",
            preview_title: "Live Draft Preview",
            dashed_help_strong: "Dashed Borders:",
            dashed_help_text: "Represents physical label boundary. Keep logos and texts within this box.",
            ctrl_template_type: "Template Type",
            opt_a_full: "Option A (Secret Code)",
            opt_b_full: "Option B (Detailed Public)",
            opt_a_desc_full: "Option A (Secret / Confidential)",
            opt_b_desc_full: "Option B (Detailed Public)",
            ctrl_logo_title: "Company Logo",
            lbl_active_logo: "Active Logo Selection:",
            opt_default_logo: "Default FabricTag Logo",
            btn_upload_logo: "Upload Logo",
            lbl_logo_height: "Logo Height:",
            lbl_logo_align: "Logo Alignment:",
            opt_align_left: "Left",
            opt_align_center: "Center",
            opt_align_right: "Right",
            ctrl_font_sizes: "Typography & Field Sizes",
            lbl_font_family: "Font Family (Typeface):",
            opt_font_outfit: "Outfit (Modern & Clean - Default)",
            opt_font_arial: "Arial / Helvetica (Classic & Sharp)",
            opt_font_inter: "Inter (Corporate & Neat)",
            opt_font_roboto: "Roboto (Balanced & Readable)",
            opt_font_montserrat: "Montserrat (Geometric)",
            opt_font_courier: "Courier / Monospace (Technical)",
            ctrl_fiber_abbr_title: "ISO / BISFA Fiber Abbreviations",
            ctrl_fiber_abbr_desc: "E.g. Cotton ➔ CO, Polyester ➔ PES, Elastane ➔ EA, Viscose ➔ CV",
            lbl_field_company: "Company Name",
            lbl_field_quality_name: "Quality Name",
            lbl_field_variant_code: "Color & Design Code",
            lbl_field_composition: "Composition",
            lbl_field_weight: "Weight",
            lbl_align: "Alignment:",
            lbl_black_bar: "Black Top Bar / White Text (Option B):",
            ctrl_barcode_title: "Barcode Line",
            lbl_barcode_height: "Barcode Height:",
            page_dimensions_title: "Page & Paper Dimensions (A4 / Argox Roll)",
            page_dimensions_desc: "Set physical millimeter dimensions and margins.",
            lbl_default_template: "Default Print Template",
            lbl_printer_type: "Printer Type",
            opt_printer_a4: "A4 Laser Printer (3x6 Grid Sheet)",
            opt_printer_argox: "Argox / Roll Thermal Printer (Continuous)",
            lbl_label_width: "Label Width (mm)",
            lbl_label_height: "Label Height (mm)",
            lbl_col_gap: "Column Gap (mm)",
            lbl_row_gap: "Row Gap (mm)",
            lbl_margin_top: "Top Margin (mm)",
            lbl_margin_left: "Left Margin (mm)",
            btn_save_paper: "Save Paper Dimensions",
            api_config_title: "Google Gemini AI Configuration",
            api_config_desc: "Required for high-accuracy optical intelligence on fabric swatches.",
            lbl_api_key: "Gemini API Key",
            btn_save: "Save",
            modal_backup_title: "Excel (.xlsx) Export & Backup Center",
            modal_card1_title: "1. Quick Full Excel (*.xlsx) Export",
            modal_card1_desc: "Download all fabric records as a beautifully styled Microsoft Excel workbook.",
            btn_quick_export: "Download All Database (.xlsx)",
            modal_card2_title: "2. Custom Date & Time Filtered Export",
            modal_card2_desc: "Filter and download fabrics scanned within a specific date range.",
            preset_today: "Today",
            preset_yesterday: "Yesterday",
            preset_7days: "Last 7 Days",
            preset_30days: "Last 30 Days",
            preset_all: "All Time",
            lbl_start_dt: "Start Date & Time:",
            lbl_end_dt: "End Date & Time:",
            btn_range_export: "Export Date Range (.xlsx)",
            btn_range_backup: "Backup to Server Storage",
            modal_card3_title: "3. Scheduled Auto-Backup",
            lbl_auto_backup_time: "Daily Auto-Backup Time:",
            btn_save_timing: "Save Schedule",
            modal_card4_title: "4. Server Backup Archives",
            btn_refresh: "Refresh",
            th_bk_file: "File Name",
            th_bk_date: "Backup Date",
            th_bk_size: "Size",
            th_bk_action: "Action",
            search_placeholder: "Search internal code, supplier, article or design...",
            code_settings_title: "Internal Code Format & Auto Counter",
            code_settings_desc: "Configure the prefix letters, digit length, separator, and starting number for automatically generated internal codes.",
            lbl_code_preview: "Sample Generated Code:",
            lbl_code_type: "Code Structure Type",
            opt_code_letters: "With Letter Prefix (e.g. ELT, FT)",
            opt_code_numbers: "Numbers Only (No Letters)",
            lbl_code_prefix: "Prefix Text (Letters)",
            lbl_code_separator: "Separator / Delimiter",
            opt_sep_none: "None (Together: ELT0000001)",
            opt_sep_dash: "Dash ( - : ELT-0000001)",
            opt_sep_underscore: "Underscore ( _ : ELT_0000001)",
            opt_sep_dot: "Dot ( . : ELT.0000001)",
            lbl_code_digits: "Digit Length / Padding",
            opt_digits_7: "7 Digits (0000001 - Standard)",
            opt_digits_6: "6 Digits (000001)",
            opt_digits_5: "5 Digits (00001)",
            opt_digits_4: "4 Digits (0001)",
            opt_digits_dynamic: "Dynamic (No Leading Zeros: 1, 2...)",
            lbl_code_start: "Starting Number",
            btn_save_code_settings: "Save Internal Code Format",
            btn_install_pwa: "Install as Mobile App",
            view_cards: "Cards",
            view_table: "Table",
            btn_download_template: "Download Template (.xlsx)",
            btn_import_excel: "Import from Excel",
            modal_import_title: "Bulk Fabric Import from Excel",
            import_step1_desc: "Upload your company's Excel spreadsheet (*.xlsx or *.csv). Columns will be smartly auto-matched.",
            import_drop_title: "Drag & Drop Excel File Here",
            import_choose_file: "Browse Files",
            import_need_template_title: "Don't have a template?",
            import_need_template_desc: "Download our ready-made blank fabric template.",
            lbl_rows_detected: "Fabric Records Detected",
            btn_rechoose: "Select Another File",
            matcher_instruction: "Your Excel columns have been matched to system fields. You can adjust dropdowns if needed:",
            th_excel_header: "Excel Column Header",
            th_sample_data: "Sample Preview",
            th_system_field: "Target System Field",
            lbl_code_behavior_title: "Internal Code Logic:",
            lbl_code_behavior_desc: "If your Excel contains internal codes, they are preserved and the counter resumes from the highest number. Empty codes receive auto-generated codes.",
            btn_cancel: "Cancel",
            btn_confirm_import: "Confirm & Import Fabrics"
        },
        de: {
            lang_label: "Sprache / Language:",
            nav_scan: "Muster Scannen",
            nav_database: "Datenbank / Archiv",
            nav_settings: "Einstellungen & Layout",
            mobile_qr_title: "Mobil & QR Verbindung",
            api_active: "Gemini KI Aktiv",
            api_offline: "Gemini KI Offline",
            scan_header_title: "Stoffmuster-Scanner",
            scan_header_desc: "Stoffmusterkarten und Hanger fotografieren oder hochladen.",
            drag_drop_title: "Musterbilder Hochladen / Aufnehmen",
            drag_drop_subtitle: "Klicken oder ziehen zum",
            drag_drop_limits: "JPEG, JPG, PNG (Mehrfachauswahl möglich)",
            btn_normal_camera: "Foto Aufnehmen",
            btn_choose_files: "Aus Dateien Wählen",
            btn_live_camera: "Live-Kamera (Serienaufnahme)",
            btn_capture_now: "Foto Aufnehmen & Scannen",
            btn_close_camera: "Kamera Schließen",
            queue_title: "Fotowarteschlange",
            btn_clear_queue: "Warteschlange Leeren",
            btn_process_queue: "Alle Muster Analysieren & Speichern",
            loader_title: "KI Analysiert Stoffmuster...",
            loader_subtitle: "Texte werden optisch erkannt und Daten strukturiert.",
            form_title: "Erkannte Musterdaten",
            lbl_internal_code: "Interne Artikelnummer",
            lbl_company: "Hersteller / Lieferant",
            lbl_quality_code: "Qualitätscode (Artikel)",
            lbl_quality_name: "Qualitätsname",
            lbl_design_code: "Dessin / Farbcode",
            lbl_width: "Breite (cm)",
            lbl_weight: "Gewicht (g/m²)",
            lbl_composition: "Materialzusammensetzung",
            lbl_barcode: "Barcode / QR-Code",
            template_select_title: "Druckvorlage Wählen:",
            opt_a_name: "Option A",
            opt_a_desc: "Verdecktes Etikett",
            opt_b_name: "Option B",
            opt_b_desc: "Detailliertes Etikett",
            btn_save_only: "Nur Speichern",
            btn_save_print: "Speichern & Drucken",
            btn_print_only: "Nur Drucken",
            db_header_title: "Stoffdatenbank & Verlauf",
            db_header_desc: "Alle bisher gescannten und gespeicherten Stoffetiketten.",
            btn_excel_backup_modal: "Excel (.xlsx) & Backup",
            btn_batch_print: "Ausgewählte Drucken (A4)",
            th_code: "Code",
            th_company: "Firma",
            th_quality_code: "Artikel",
            th_quality_name: "Name",
            th_design_code: "Dessin",
            th_composition: "Zusammensetzung",
            th_width: "Breite",
            th_weight: "Gewicht",
            th_actions: "Aktionen",
            db_loading: "Datenbank wird geladen...",
            settings_header_title: "Systemeinstellungen & Etikettendesigner",
            settings_header_desc: "Etikettenlayout, Logo, Schriftarten, Formate und Ausrichtungen.",
            studio_title: "Live Etiketten-Designer Studio",
            studio_desc: "Layout, Abmessungen und Logo in Echtzeit anpassen.",
            btn_save_design: "Layout Speichern",
            preview_title: "Live-Vorschau",
            dashed_help_strong: "Gestrichelte Linie:",
            dashed_help_text: "Repräsentiert die physische Schnittkante des Etiketts.",
            ctrl_template_type: "Vorlagentyp",
            opt_a_full: "Option A (Verdeckter Code)",
            opt_b_full: "Option B (Detaillierte Infos)",
            opt_a_desc_full: "Option A (Verdecktes Etikett)",
            opt_b_desc_full: "Option B (Detailliertes Etikett)",
            ctrl_logo_title: "Firmenlogo",
            lbl_active_logo: "Aktives Logo:",
            opt_default_logo: "Standard FabricTag Logo",
            btn_upload_logo: "Logo Hochladen",
            lbl_logo_height: "Logohöhe:",
            lbl_logo_align: "Logo-Ausrichtung:",
            opt_align_left: "Links",
            opt_align_center: "Zentriert",
            opt_align_right: "Rechts",
            ctrl_font_sizes: "Schriftart & Feldgrößen",
            lbl_font_family: "Schriftfamilie:",
            opt_font_outfit: "Outfit (Modern & Sauber - Standard)",
            opt_font_arial: "Arial / Helvetica (Klassisch)",
            opt_font_inter: "Inter (Sachlich & Klar)",
            opt_font_roboto: "Roboto (Ausgewogen)",
            opt_font_montserrat: "Montserrat (Geometrisch)",
            opt_font_courier: "Courier / Monospace (Technisch)",
            ctrl_fiber_abbr_title: "ISO / BISFA Faserkürzel",
            ctrl_fiber_abbr_desc: "Z.B. Baumwolle ➔ CO, Polyester ➔ PES, Elasthan ➔ EA, Viskose ➔ CV",
            lbl_field_company: "Firmenname",
            lbl_field_quality_name: "Qualitätsname",
            lbl_field_variant_code: "Farb- & Dessincode",
            lbl_field_composition: "Zusammensetzung",
            lbl_field_weight: "Gewicht",
            lbl_align: "Ausrichtung:",
            lbl_black_bar: "Schwarzer Titelbalken / Weiße Schrift (Option B):",
            ctrl_barcode_title: "Barcode-Linie",
            lbl_barcode_height: "Barcodehöhe:",
            page_dimensions_title: "Papier- und Etikettenformate (A4 / Rolle)",
            page_dimensions_desc: "Millimetermaße und Seitenränder festlegen.",
            lbl_default_template: "Standard-Druckvorlage",
            lbl_printer_type: "Druckertyp",
            opt_printer_a4: "A4 Laserdrucker (3x6 Bogen)",
            opt_printer_argox: "Argox / Rollen-Thermodrucker (Endlos)",
            lbl_label_width: "Etikettenbreite (mm)",
            lbl_label_height: "Etikettenhöhe (mm)",
            lbl_col_gap: "Spaltenabstand (mm)",
            lbl_row_gap: "Zeilenabstand (mm)",
            lbl_margin_top: "Oberer Rand (mm)",
            lbl_margin_left: "Linker Rand (mm)",
            btn_save_paper: "Papiermaße Speichern",
            api_config_title: "Google Gemini KI Konfiguration",
            api_config_desc: "Erforderlich für präzise optische Erkennung der Stoffmuster.",
            lbl_api_key: "Gemini API-Schlüssel",
            btn_save: "Speichern",
            modal_backup_title: "Excel (.xlsx) Export & Backup-Zentrum",
            modal_card1_title: "1. Schneller Excel-Export (*.xlsx)",
            modal_card1_desc: "Gesamte Datenbank formatiert als Microsoft Excel Tabelle herunterladen.",
            btn_quick_export: "Gesamte Datenbank Herunterladen (.xlsx)",
            modal_card2_title: "2. Benutzerdefinierter Export nach Datum & Uhrzeit",
            modal_card2_desc: "Stoffe in einem bestimmten Zeitraum filtern und sichern.",
            preset_today: "Heute",
            preset_yesterday: "Gestern",
            preset_7days: "Letzte 7 Tage",
            preset_30days: "Letzte 30 Tage",
            preset_all: "Gesamter Zeitraum",
            lbl_start_dt: "Startdatum & Uhrzeit:",
            lbl_end_dt: "Enddatum & Uhrzeit:",
            btn_range_export: "Datumsbereich Exportieren (.xlsx)",
            btn_range_backup: "Auf Server Sichern",
            modal_card3_title: "3. Automatische Tägliche Sicherung",
            lbl_auto_backup_time: "Tägliche Sicherungszeit:",
            btn_save_timing: "Zeitplan Speichern",
            modal_card4_title: "4. Sicherungsdateien auf dem Server",
            btn_refresh: "Aktualisieren",
            th_bk_file: "Dateiname",
            th_bk_date: "Sicherungsdatum",
            th_bk_size: "Größe",
            th_bk_action: "Aktion",
            search_placeholder: "Code, Lieferant, Artikel oder Dessin suchen...",
            code_settings_title: "Format der Internen Artikelnummer & Zähler",
            code_settings_desc: "Legen Sie Buchstaben-Präfix, Ziffernlänge, Trennzeichen und Startnummer für neue Stoffe fest.",
            lbl_code_preview: "Muster-Artikelnummer:",
            lbl_code_type: "Codestruktur",
            opt_code_letters: "Mit Buchstaben-Präfix (z.B. ELT, FT)",
            opt_code_numbers: "Nur Ziffern (Ohne Buchstaben)",
            lbl_code_prefix: "Präfix-Text (Buchstaben)",
            lbl_code_separator: "Trennzeichen",
            opt_sep_none: "Keines (Zusammen: ELT0000001)",
            opt_sep_dash: "Bindestrich ( - : ELT-0000001)",
            opt_sep_underscore: "Unterstrich ( _ : ELT_0000001)",
            opt_sep_dot: "Punkt ( . : ELT.0000001)",
            lbl_code_digits: "Stellenzahl / Füllung",
            opt_digits_7: "7 Stellen (0000001 - Standard)",
            opt_digits_6: "6 Stellen (000001)",
            opt_digits_5: "5 Stellen (00001)",
            opt_digits_4: "4 Stellen (0001)",
            opt_digits_dynamic: "Dynamisch (Ohne Nullen: 1, 2...)",
            lbl_code_start: "Startnummer",
            btn_save_code_settings: "Code-Format Speichern",
            btn_install_pwa: "Als App Installieren",
            view_cards: "Karten",
            view_table: "Tabelle",
            btn_download_template: "Vorlage Herunterladen (.xlsx)",
            btn_import_excel: "Aus Excel Importieren",
            modal_import_title: "Massenimport aus Excel",
            import_step1_desc: "Laden Sie Ihre Excel-Tabelle (*.xlsx oder *.csv) hoch. Spalten werden automatisch zugeordnet.",
            import_drop_title: "Excel-Datei Hierher Ziehen",
            import_choose_file: "Datei Auswählen",
            import_need_template_title: "Keine Vorlage?",
            import_need_template_desc: "Laden Sie unsere leere Stoffvorlage herunter.",
            lbl_rows_detected: "Stoffdatensätze Erkannt",
            btn_rechoose: "Andere Datei Wählen",
            matcher_instruction: "Ihre Excel-Spalten wurden automatisch zugeordnet. Passen Sie die Auswahl bei Bedarf an:",
            th_excel_header: "Excel-Spaltenüberschrift",
            th_sample_data: "Musterdaten",
            th_system_field: "Systemfeld",
            lbl_code_behavior_title: "Nummernlogik:",
            lbl_code_behavior_desc: "Bestehende interne Codes bleiben erhalten. Leere Felder erhalten automatisch eine fortlaufende Nummer.",
            btn_cancel: "Abbrechen",
            btn_confirm_import: "Stoffe Importieren"
        },
        it: {
            lang_label: "Lingua / Language:",
            nav_scan: "Scansiona Campione",
            nav_database: "Database / Archivio",
            nav_settings: "Impostazioni & Layout",
            mobile_qr_title: "Accesso Mobile & QR",
            api_active: "Gemini AI Attivo",
            api_offline: "Gemini API Non Connesso",
            scan_header_title: "Scansione Campioni Tessuto",
            scan_header_desc: "Fotografa o carica campionari e cartelle tessuto.",
            drag_drop_title: "Carica / Scatta Immagini Campionario",
            drag_drop_subtitle: "Clicca o trascina per",
            drag_drop_limits: "JPEG, JPG, PNG (Selezione multipla consentita)",
            btn_normal_camera: "Scatta Foto",
            btn_choose_files: "Scegli da File",
            btn_live_camera: "Fotocamera Live (Scatto Rapido)",
            btn_capture_now: "Scatta & Analizza Campione",
            btn_close_camera: "Chiudi Fotocamera",
            queue_title: "Coda Foto",
            btn_clear_queue: "Svuota Coda",
            btn_process_queue: "Analizza & Salva Tutti i Campioni",
            loader_title: "L'IA sta Analizzando il Campione...",
            loader_subtitle: "Riconoscimento ottico dei testi e formattazione dei dati.",
            form_title: "Dati Campione Estratti",
            lbl_internal_code: "Codice Interno Assegnato",
            lbl_company: "Produttore / Fornitore",
            lbl_quality_code: "Codice Articolo (Qualità)",
            lbl_quality_name: "Nome della Qualità",
            lbl_design_code: "Codice Disegno / Variante",
            lbl_width: "Altezza / Cimosa (cm)",
            lbl_weight: "Peso (g/m²)",
            lbl_composition: "Composizione Tessile",
            lbl_barcode: "Valore Codice a Barre / QR",
            template_select_title: "Seleziona Modello di Stampa:",
            opt_a_name: "Opzione A",
            opt_a_desc: "Etichetta Riservata (Codice)",
            opt_b_name: "Opzione B",
            opt_b_desc: "Etichetta Dettagliata Aperta",
            btn_save_only: "Solo Salva",
            btn_save_print: "Salva & Stampa",
            btn_print_only: "Solo Stampa",
            db_header_title: "Database Tessuti & Archivio",
            db_header_desc: "Tutte le etichette scansionate e archiviate nel sistema.",
            btn_excel_backup_modal: "Excel (.xlsx) & Backup",
            btn_batch_print: "Stampa Selezionati (A4)",
            th_code: "Codice",
            th_company: "Fornitore",
            th_quality_code: "Articolo",
            th_quality_name: "Nome Qualità",
            th_design_code: "Disegno",
            th_composition: "Composizione",
            th_width: "Altezza",
            th_weight: "Peso",
            th_actions: "Azioni",
            db_loading: "Caricamento database...",
            settings_header_title: "Impostazioni di Sistema & Designer Etichette",
            settings_header_desc: "Layout etichette, selezione logo, font, dimensioni personalizzate e allineamenti.",
            studio_title: "Studio Designer Etichette in Tempo Reale",
            studio_desc: "Personalizza layout, dimensioni dei caratteri e logo in tempo reale.",
            btn_save_design: "Salva Impostazioni Design",
            preview_title: "Anteprima Bozza in Tempo Reale",
            dashed_help_strong: "Bordi Tratteggiati:",
            dashed_help_text: "Rappresentano il limite fisico di taglio dell'etichetta.",
            ctrl_template_type: "Tipo di Modello",
            opt_a_full: "Opzione A (Codice Riservato)",
            opt_b_full: "Opzione B (Dettaglio Completo)",
            opt_a_desc_full: "Opzione A (Etichetta Riservata)",
            opt_b_desc_full: "Opzione B (Etichetta Dettagliata)",
            ctrl_logo_title: "Logo Aziendale",
            lbl_active_logo: "Logo Attivo:",
            opt_default_logo: "Logo FabricTag Predefinito",
            btn_upload_logo: "Carica Logo",
            lbl_logo_height: "Altezza Logo:",
            lbl_logo_align: "Allineamento Logo:",
            opt_align_left: "Sinistra",
            opt_align_center: "Centro",
            opt_align_right: "Destra",
            ctrl_font_sizes: "Tipografia & Dimensioni Campi",
            lbl_font_family: "Famiglia di Caratteri:",
            opt_font_outfit: "Outfit (Moderno & Pulito - Predefinito)",
            opt_font_arial: "Arial / Helvetica (Classico)",
            opt_font_inter: "Inter (Aziendale & Ordinato)",
            opt_font_roboto: "Roboto (Bilanciato)",
            opt_font_montserrat: "Montserrat (Geometrico)",
            opt_font_courier: "Courier / Monospace (Tecnico)",
            ctrl_fiber_abbr_title: "Abbreviazioni Fibre ISO / BISFA",
            ctrl_fiber_abbr_desc: "Es: Cotone ➔ CO, Poliestere ➔ PES, Elastan ➔ EA, Viscosa ➔ CV",
            lbl_field_company: "Nome Azienda",
            lbl_field_quality_name: "Nome Qualità",
            lbl_field_variant_code: "Codice Variante & Colore",
            lbl_field_composition: "Composizione",
            lbl_field_weight: "Peso",
            lbl_align: "Allineamento:",
            lbl_black_bar: "Barra Superiore Nera / Testo Bianco (Opzione B):",
            ctrl_barcode_title: "Linea Codice a Barre",
            lbl_barcode_height: "Altezza Codice a Barre:",
            page_dimensions_title: "Dimensioni Pagina ed Etichette (A4 / Rotolo)",
            page_dimensions_desc: "Imposta dimensioni millimetriche e margini del foglio.",
            lbl_default_template: "Modello di Stampa Predefinito",
            lbl_printer_type: "Tipo di Stampante",
            opt_printer_a4: "Stampante Laser A4 (Griglia 3x6)",
            opt_printer_argox: "Stampante Termica a Rotolo Argox (Continuo)",
            lbl_label_width: "Larghezza Etichetta (mm)",
            lbl_label_height: "Altezza Etichetta (mm)",
            lbl_col_gap: "Spazio tra Colonne (mm)",
            lbl_row_gap: "Spazio tra Righe (mm)",
            lbl_margin_top: "Margine Superiore (mm)",
            lbl_margin_left: "Margine Sinistro (mm)",
            btn_save_paper: "Salva Dimensioni",
            api_config_title: "Configurazione Google Gemini AI",
            api_config_desc: "Necessario per il riconoscimento ottico di precisione.",
            lbl_api_key: "Chiave API Gemini",
            btn_save: "Salva",
            modal_backup_title: "Centro Esportazione Excel (.xlsx) & Backup",
            modal_card1_title: "1. Esportazione Rapida Excel (*.xlsx)",
            modal_card1_desc: "Scarica l'intero database formattato come foglio di lavoro Microsoft Excel.",
            btn_quick_export: "Scarica Tutto il Database (.xlsx)",
            modal_card2_title: "2. Esportazione Filtrata per Data e Ora",
            modal_card2_desc: "Filtra e scarica i tessuti inseriti in un determinato intervallo temporale.",
            preset_today: "Oggi",
            preset_yesterday: "Ieri",
            preset_7days: "Ultimi 7 Giorni",
            preset_30days: "Ultimi 30 Giorni",
            preset_all: "Tutto il Periodo",
            lbl_start_dt: "Data e Ora Inizio:",
            lbl_end_dt: "Data e Ora Fine:",
            btn_range_export: "Esporta Intervallo (.xlsx)",
            btn_range_backup: "Esegui Backup su Server",
            modal_card3_title: "3. Backup Automatico Giornaliero",
            lbl_auto_backup_time: "Ora Backup Giornaliero:",
            btn_save_timing: "Salva Programmazione",
            modal_card4_title: "4. File di Backup sul Server",
            btn_refresh: "Aggiorna",
            th_bk_file: "Nome File",
            th_bk_date: "Data Backup",
            th_bk_size: "Dimensione",
            th_bk_action: "Azione",
            search_placeholder: "Cerca codice, fornitore, articolo o disegno...",
            code_settings_title: "Formato Codice Interno & Contatore",
            code_settings_desc: "Configura prefisso, lunghezza cifre, separatore e numero iniziale per i nuovi tessuti.",
            lbl_code_preview: "Esempio Codice Generato:",
            lbl_code_type: "Tipo Struttura Codice",
            opt_code_letters: "Con Prefisso Lettere (es. ELT, FT)",
            opt_code_numbers: "Solo Numeri (Senza Lettere)",
            lbl_code_prefix: "Testo Prefisso (Lettere)",
            lbl_code_separator: "Separatore",
            opt_sep_none: "Nessuno (Unito: ELT0000001)",
            opt_sep_dash: "Trattino ( - : ELT-0000001)",
            opt_sep_underscore: "Underscore ( _ : ELT_0000001)",
            opt_sep_dot: "Punto ( . : ELT.0000001)",
            lbl_code_digits: "Lunghezza Cifre / Padding",
            opt_digits_7: "7 Cifre (0000001 - Standard)",
            opt_digits_6: "6 Cifre (000001)",
            opt_digits_5: "5 Cifre (00001)",
            opt_digits_4: "4 Cifre (0001)",
            opt_digits_dynamic: "Dinamico (Senza Zeri: 1, 2...)",
            lbl_code_start: "Numero Iniziale",
            btn_save_code_settings: "Salva Formato Codice",
            btn_install_pwa: "Installa come App",
            view_cards: "Schede",
            view_table: "Tabella",
            btn_download_template: "Scarica Modello (.xlsx)",
            btn_import_excel: "Importa da Excel",
            modal_import_title: "Importazione Massiva da Excel",
            import_step1_desc: "Carica il file Excel (*.xlsx o *.csv). Le colonne verranno abbinate automaticamente.",
            import_drop_title: "Trascina qui il file Excel",
            import_choose_file: "Scegli File",
            import_need_template_title: "Non hai un modello?",
            import_need_template_desc: "Scarica il nostro modello vuoto già formattato.",
            lbl_rows_detected: "Tessuti Rilevati",
            btn_rechoose: "Scegli Altro File",
            matcher_instruction: "Le colonne sono state mappate ai campi di sistema. Puoi modificarle se necessario:",
            th_excel_header: "Intestazione Colonna",
            th_sample_data: "Dati di Esempio",
            th_system_field: "Campo di Sistema",
            lbl_code_behavior_title: "Logica Codice Interno:",
            lbl_code_behavior_desc: "I codici esistenti vengono mantenuti. Quelli mancanti vengono generati in sequenza.",
            btn_cancel: "Annulla",
            btn_confirm_import: "Importa Tessuti"
        },
        es: {
            lang_label: "Idioma / Language:",
            nav_scan: "Escanear Muestra",
            nav_database: "Base de Datos",
            nav_settings: "Ajustes & Diseño",
            mobile_qr_title: "Acceso Móvil & QR",
            api_active: "Gemini IA Activo",
            api_offline: "Gemini API Desconectado",
            scan_header_title: "Escaneo de Muestrarios Textiles",
            scan_header_desc: "Fotografíe o suba tarjetas y perchas de telas.",
            drag_drop_title: "Subir / Capturar Imágenes de Muestrario",
            drag_drop_subtitle: "Haga clic o arrastre para",
            drag_drop_limits: "JPEG, JPG, PNG (Múltiples archivos permitidos)",
            btn_normal_camera: "Tomar Foto",
            btn_choose_files: "Seleccionar de Archivos",
            btn_live_camera: "Cámara en Vivo (Captura Rápida)",
            btn_capture_now: "Capturar & Analizar Muestra",
            btn_close_camera: "Cerrar Cámara",
            queue_title: "Cola de Fotos",
            btn_clear_queue: "Limpiar Cola",
            btn_process_queue: "Procesar Todas las Muestras",
            loader_title: "La IA está Analizando la Muestra...",
            loader_subtitle: "Extracción óptica de textos y organización de campos.",
            form_title: "Datos de la Muestra Extraídos",
            lbl_internal_code: "Código Interno Asignado",
            lbl_company: "Fabricante / Proveedor",
            lbl_quality_code: "Código de Calidad (Artículo)",
            lbl_quality_name: "Nombre de Calidad",
            lbl_design_code: "Código de Diseño / Variante",
            lbl_width: "Ancho (cm)",
            lbl_weight: "Gramaje (g/m²)",
            lbl_composition: "Composición Textil",
            lbl_barcode: "Código de Barras / QR",
            template_select_title: "Seleccionar Plantilla de Impresión:",
            opt_a_name: "Opción A",
            opt_a_desc: "Etiqueta Confidencial",
            opt_b_name: "Opción B",
            opt_b_desc: "Etiqueta Detallada",
            btn_save_only: "Solo Guardar",
            btn_save_print: "Guardar & Imprimir",
            btn_print_only: "Solo Imprimir",
            db_header_title: "Base de Datos de Telas & Historial",
            db_header_desc: "Todas las etiquetas escaneadas y guardadas hasta ahora.",
            btn_excel_backup_modal: "Excel (.xlsx) & Copias",
            btn_batch_print: "Imprimir Seleccionados (A4)",
            th_code: "Código",
            th_company: "Proveedor",
            th_quality_code: "Artículo",
            th_quality_name: "Nombre",
            th_design_code: "Diseño",
            th_composition: "Composición",
            th_width: "Ancho",
            th_weight: "Gramaje",
            th_actions: "Acciones",
            db_loading: "Cargando base de datos...",
            settings_header_title: "Ajustes del Sistema & Diseñador de Etiquetas",
            settings_header_desc: "Diseño de etiqueta, logo, tipografía, dimensiones y alineaciones.",
            studio_title: "Estudio de Diseño de Etiquetas en Vivo",
            studio_desc: "Ajuste el diseño, medidas y logo en tiempo real.",
            btn_save_design: "Guardar Diseño",
            preview_title: "Vista Previa en Vivo",
            dashed_help_strong: "Borde Discontinuo:",
            dashed_help_text: "Representa el límite físico de corte de la etiqueta.",
            ctrl_template_type: "Tipo de Plantilla",
            opt_a_full: "Opción A (Código Confidencial)",
            opt_b_full: "Opción B (Información Completa)",
            opt_a_desc_full: "Opción A (Etiqueta Confidencial)",
            opt_b_desc_full: "Opción B (Etiqueta Detallada)",
            ctrl_logo_title: "Logo de Empresa",
            lbl_active_logo: "Logo Activo:",
            opt_default_logo: "Logo FabricTag Predeterminado",
            btn_upload_logo: "Subir Logo",
            lbl_logo_height: "Altura del Logo:",
            lbl_logo_align: "Alineación del Logo:",
            opt_align_left: "Izquierda",
            opt_align_center: "Centro",
            opt_align_right: "Derecha",
            ctrl_font_sizes: "Fuente y Tamaños de Texto",
            lbl_font_family: "Familia Tipográfica:",
            opt_font_outfit: "Outfit (Moderno & Limpio - Predeterminado)",
            opt_font_arial: "Arial / Helvetica (Clásico)",
            opt_font_inter: "Inter (Corporativo)",
            opt_font_roboto: "Roboto (Equilibrado)",
            opt_font_montserrat: "Montserrat (Geométrico)",
            opt_font_courier: "Courier / Monospace (Técnico)",
            ctrl_fiber_abbr_title: "Abreviaturas de Fibras ISO / BISFA",
            ctrl_fiber_abbr_desc: "Ej: Algodón ➔ CO, Poliéster ➔ PES, Elastano ➔ EA, Viscosa ➔ CV",
            lbl_field_company: "Nombre de la Empresa",
            lbl_field_quality_name: "Nombre de la Calidad",
            lbl_field_variant_code: "Código de Variante & Color",
            lbl_field_composition: "Composición",
            lbl_field_weight: "Gramaje",
            lbl_align: "Alineación:",
            lbl_black_bar: "Barra Superior Negra / Texto Blanco (Opción B):",
            ctrl_barcode_title: "Línea de Código de Barras",
            lbl_barcode_height: "Altura del Código de Barras:",
            page_dimensions_title: "Dimensiones de Página y Etiquetas (A4 / Rollo)",
            page_dimensions_desc: "Configure las medidas en milímetros y los márgenes.",
            lbl_default_template: "Plantilla de Impresión Predeterminada",
            lbl_printer_type: "Tipo de Impresora",
            opt_printer_a4: "Impresora Láser A4 (Hoja 3x6)",
            opt_printer_argox: "Impresora Térmica en Rollo Argox (Continua)",
            lbl_label_width: "Ancho de Etiqueta (mm)",
            lbl_label_height: "Alto de Etiqueta (mm)",
            lbl_col_gap: "Espacio entre Columnas (mm)",
            lbl_row_gap: "Espacio entre Filas (mm)",
            lbl_margin_top: "Margen Superior (mm)",
            lbl_margin_left: "Margen Izquierdo (mm)",
            btn_save_paper: "Guardar Medidas de Papel",
            api_config_title: "Configuración de Google Gemini IA",
            api_config_desc: "Necesario para el reconocimiento óptico de alta precisión en las muestras.",
            lbl_api_key: "Clave de API Gemini",
            btn_save: "Guardar",
            modal_backup_title: "Centro de Exportación Excel (.xlsx) & Copias de Seguridad",
            modal_card1_title: "1. Exportación Rápida a Excel (*.xlsx)",
            modal_card1_desc: "Descargue toda la base de datos como libro de Microsoft Excel con estilo.",
            btn_quick_export: "Descargar Base de Datos Completa (.xlsx)",
            modal_card2_title: "2. Exportación Filtrada por Fecha y Hora",
            modal_card2_desc: "Filtre las telas agregadas en un rango de fechas específico.",
            preset_today: "Hoy",
            preset_yesterday: "Ayer",
            preset_7days: "Últimos 7 Días",
            preset_30days: "Últimos 30 Días",
            preset_all: "Todo el Periodo",
            lbl_start_dt: "Fecha y Hora de Inicio:",
            lbl_end_dt: "Fecha y Hora de Fin:",
            btn_range_export: "Exportar Rango de Fechas (.xlsx)",
            btn_range_backup: "Guardar Copia en el Servidor",
            modal_card3_title: "3. Copia de Seguridad Diaria Automática",
            lbl_auto_backup_time: "Hora de Copia Automática:",
            btn_save_timing: "Guardar Programación",
            modal_card4_title: "4. Archivos de Copias en el Servidor",
            btn_refresh: "Actualizar",
            th_bk_file: "Nombre del Archivo",
            th_bk_date: "Fecha de Copia",
            th_bk_size: "Tamaño",
            th_bk_action: "Acción",
            search_placeholder: "Buscar código, proveedor, artículo o diseño...",
            code_settings_title: "Formato de Código Interno & Contador",
            code_settings_desc: "Configure el prefijo, longitud de dígitos, separador y número inicial para nuevas telas.",
            lbl_code_preview: "Código de Muestra:",
            lbl_code_type: "Tipo de Estructura de Código",
            opt_code_letters: "Con Prefijo de Letras (ej. ELT, FT)",
            opt_code_numbers: "Solo Números (Sin Letras)",
            lbl_code_prefix: "Texto del Prefijo (Letras)",
            lbl_code_separator: "Separador",
            opt_sep_none: "Ninguno (Unido: ELT0000001)",
            opt_sep_dash: "Guion ( - : ELT-0000001)",
            opt_sep_underscore: "Guion Bajo ( _ : ELT_0000001)",
            opt_sep_dot: "Punto ( . : ELT.0000001)",
            lbl_code_digits: "Longitud de Dígitos / Relleno",
            opt_digits_7: "7 Dígitos (0000001 - Estándar)",
            opt_digits_6: "6 Dígitos (000001)",
            opt_digits_5: "5 Dígitos (00001)",
            opt_digits_4: "4 Dígitos (0001)",
            opt_digits_dynamic: "Dinámico (Sin Ceros: 1, 2...)",
            lbl_code_start: "Número Inicial",
            btn_save_code_settings: "Guardar Formato de Código",
            btn_install_pwa: "Instalar como App",
            view_cards: "Tarjetas",
            view_table: "Tabla",
            btn_download_template: "Descargar Plantilla (.xlsx)",
            btn_import_excel: "Importar desde Excel",
            modal_import_title: "Importación Masiva desde Excel",
            import_step1_desc: "Suba su archivo Excel (*.xlsx o *.csv). Las columnas se emparejarán automáticamente.",
            import_drop_title: "Arrastre su archivo Excel aquí",
            import_choose_file: "Seleccionar Archivo",
            import_need_template_title: "¿No tiene plantilla?",
            import_need_template_desc: "Descargue nuestra plantilla en blanco prediseñada.",
            lbl_rows_detected: "Telas Detectadas",
            btn_rechoose: "Elegir Otro Archivo",
            matcher_instruction: "Las columnas se han mapeado a los campos del sistema. Puede ajustarlas según sea necesario:",
            th_excel_header: "Encabezado Excel",
            th_sample_data: "Datos de Muestra",
            th_system_field: "Campo del Sistema",
            lbl_code_behavior_title: "Lógica de Código:",
            lbl_code_behavior_desc: "Los códigos existentes se conservan. Los vacíos reciben números automáticos.",
            btn_cancel: "Cancelar",
            btn_confirm_import: "Importar Telas"
        },
        fr: {
            lang_label: "Langue / Language:",
            nav_scan: "Scanner Échantillon",
            nav_database: "Base de Données",
            nav_settings: "Paramètres & Design",
            mobile_qr_title: "Accès Mobile & QR",
            api_active: "IA Gemini Active",
            api_offline: "API Gemini Déconnectée",
            scan_header_title: "Numérisation d'Échantillons Textiles",
            scan_header_desc: "Photographiez ou téléchargez des cartes et cintres de tissu.",
            drag_drop_title: "Télécharger / Prendre des Photos",
            drag_drop_subtitle: "Cliquez ou glissez pour",
            drag_drop_limits: "JPEG, JPG, PNG (Fichiers multiples acceptés)",
            btn_normal_camera: "Prendre une Photo",
            btn_choose_files: "Choisir des Fichiers",
            btn_live_camera: "Caméra en Direct (Prise Rapide)",
            btn_capture_now: "Capturer & Analyser Échantillon",
            btn_close_camera: "Fermer la Caméra",
            queue_title: "File d'Attente Photos",
            btn_clear_queue: "Vider la File",
            btn_process_queue: "Traiter Tous les Échantillons",
            loader_title: "L'IA Analyse l'Échantillon...",
            loader_subtitle: "Reconnaissance optique des textes et structuration des données.",
            form_title: "Données de l'Échantillon Extraites",
            lbl_internal_code: "Code Interne Attribué",
            lbl_company: "Fabricant / Fournisseur",
            lbl_quality_code: "Code Qualité (Article)",
            lbl_quality_name: "Nom de la Qualité",
            lbl_design_code: "Code Dessin / Variante",
            lbl_width: "Laize / Largeur (cm)",
            lbl_weight: "Poids / Grammage (g/m²)",
            lbl_composition: "Composition Textile",
            lbl_barcode: "Valeur Code-Barres / QR",
            template_select_title: "Choisir le Modèle d'Impression:",
            opt_a_name: "Option A",
            opt_a_desc: "Étiquette Confidentielle",
            opt_b_name: "Option B",
            opt_b_desc: "Étiquette Détaillée",
            btn_save_only: "Enregistrer Seul",
            btn_save_print: "Enregistrer & Imprimer",
            btn_print_only: "Imprimer Seul",
            db_header_title: "Base de Données Tissus & Historique",
            db_header_desc: "Toutes les étiquettes scannées et enregistrées jusqu'à présent.",
            btn_excel_backup_modal: "Excel (.xlsx) & Sauvegarde",
            btn_batch_print: "Imprimer la Sélection (A4)",
            th_code: "Code",
            th_company: "Fournisseur",
            th_quality_code: "Article",
            th_quality_name: "Nom",
            th_design_code: "Dessin",
            th_composition: "Composition",
            th_width: "Laize",
            th_weight: "Poids",
            th_actions: "Actions",
            db_loading: "Chargement de la base de données...",
            settings_header_title: "Paramètres Système & Créateur d'Étiquettes",
            settings_header_desc: "Mise en page, logo, typographie, dimensions et alignements.",
            studio_title: "Studio de Création d'Étiquettes en Direct",
            studio_desc: "Ajustez la mise en page, les dimensions et le logo en direct.",
            btn_save_design: "Enregistrer le Design",
            preview_title: "Aperçu en Temps Réel",
            dashed_help_strong: "Bordure Pointillée:",
            dashed_help_text: "Représente la limite physique de découpe de l'étiquette.",
            ctrl_template_type: "Type de Modèle",
            opt_a_full: "Option A (Code Confidentiel)",
            opt_b_full: "Option B (Informations Complètes)",
            opt_a_desc_full: "Option A (Étiquette Confidentielle)",
            opt_b_desc_full: "Option B (Étiquette Détaillée)",
            ctrl_logo_title: "Logo d'Entreprise",
            lbl_active_logo: "Logo Actif:",
            opt_default_logo: "Logo FabricTag Par Défaut",
            btn_upload_logo: "Télécharger un Logo",
            lbl_logo_height: "Hauteur du Logo:",
            lbl_logo_align: "Alignement du Logo:",
            opt_align_left: "Gauche",
            opt_align_center: "Centré",
            opt_align_right: "Droite",
            ctrl_font_sizes: "Police & Tailles des Champs",
            lbl_font_family: "Famille de Police:",
            opt_font_outfit: "Outfit (Moderne & Épuré - Défaut)",
            opt_font_arial: "Arial / Helvetica (Classique)",
            opt_font_inter: "Inter (Professionnel & Net)",
            opt_font_roboto: "Roboto (Équilibré)",
            opt_font_montserrat: "Montserrat (Géométrique)",
            opt_font_courier: "Courier / Monospace (Technique)",
            ctrl_fiber_abbr_title: "Abréviations des Fibres ISO / BISFA",
            ctrl_fiber_abbr_desc: "Ex: Coton ➔ CO, Polyester ➔ PES, Élasthanne ➔ EA, Viscose ➔ CV",
            lbl_field_company: "Nom de l'Entreprise",
            lbl_field_quality_name: "Nom de la Qualité",
            lbl_field_variant_code: "Code Variante & Couleur",
            lbl_field_composition: "Composition",
            lbl_field_weight: "Poids",
            lbl_align: "Alignement:",
            lbl_black_bar: "Bandeau Supérieur Noir / Texte Blanc (Option B):",
            ctrl_barcode_title: "Ligne de Code-Barres",
            lbl_barcode_height: "Hauteur du Code-Barres:",
            page_dimensions_title: "Dimensions de Page et d'Étiquettes (A4 / Rouleau)",
            page_dimensions_desc: "Définissez les mesures millimétriques et les marges.",
            lbl_default_template: "Modèle d'Impression par Défaut",
            lbl_printer_type: "Type d'Imprimante",
            opt_printer_a4: "Imprimante Laser A4 (Grille 3x6)",
            opt_printer_argox: "Imprimante Thermique Rouleau Argox (Continu)",
            lbl_label_width: "Largeur Étiquette (mm)",
            lbl_label_height: "Hauteur Étiquette (mm)",
            lbl_col_gap: "Espace entre Colonnes (mm)",
            lbl_row_gap: "Espace entre Lignes (mm)",
            lbl_margin_top: "Marge Supérieure (mm)",
            lbl_margin_left: "Marge Gauche (mm)",
            btn_save_paper: "Enregistrer Dimensions",
            api_config_title: "Configuration Google Gemini IA",
            api_config_desc: "Requis pour une reconnaissance optique de haute précision.",
            lbl_api_key: "Clé API Gemini",
            btn_save: "Enregistrer",
            modal_backup_title: "Centre d'Exportation Excel (.xlsx) & Sauvegarde",
            modal_card1_title: "1. Exportation Rapide Excel (*.xlsx)",
            modal_card1_desc: "Téléchargez l'intégralité de la base de données sous forme de classeur Excel.",
            btn_quick_export: "Télécharger Toute la Base (.xlsx)",
            modal_card2_title: "2. Exportation Filtrée par Date et Heure",
            modal_card2_desc: "Filtrez les tissus enregistrés sur une période spécifique.",
            preset_today: "Aujourd'hui",
            preset_yesterday: "Hier",
            preset_7days: "7 Derniers Jours",
            preset_30days: "30 Derniers Jours",
            preset_all: "Toute la Période",
            lbl_start_dt: "Date & Heure de Début:",
            lbl_end_dt: "Date & Heure de Fin:",
            btn_range_export: "Exporter la Période (.xlsx)",
            btn_range_backup: "Créer Sauvegarde Serveur",
            modal_card3_title: "3. Sauvegarde Quotidienne Automatique",
            lbl_auto_backup_time: "Heure de Sauvegarde:",
            btn_save_timing: "Enregistrer l'Horaire",
            modal_card4_title: "4. Fichiers de Sauvegarde sur le Serveur",
            btn_refresh: "Actualiser",
            th_bk_file: "Nom du Fichier",
            th_bk_date: "Date de Sauvegarde",
            th_bk_size: "Taille",
            th_bk_action: "Action",
            search_placeholder: "Rechercher code, fournisseur, article ou dessin...",
            code_settings_title: "Format du Code Interne & Compteur",
            code_settings_desc: "Configurez le préfixe, le nombre de chiffres, le séparateur et le numéro de départ pour les nouveaux tissus.",
            lbl_code_preview: "Exemple de Code Généré:",
            lbl_code_type: "Type de Structure de Code",
            opt_code_letters: "Avec Préfixe de Lettres (ex. ELT, FT)",
            opt_code_numbers: "Numéros Seuls (Sans Lettres)",
            lbl_code_prefix: "Texte du Préfixe (Lettres)",
            lbl_code_separator: "Séparateur",
            opt_sep_none: "Aucun (Attaché: ELT0000001)",
            opt_sep_dash: "Tiret ( - : ELT-0000001)",
            opt_sep_underscore: "Tiret Bas ( _ : ELT_0000001)",
            opt_sep_dot: "Point ( . : ELT.0000001)",
            lbl_code_digits: "Nombre de Chiffres / Remplissage",
            opt_digits_7: "7 Chiffres (0000001 - Standard)",
            opt_digits_6: "6 Chiffres (000001)",
            opt_digits_5: "5 Chiffres (00001)",
            opt_digits_4: "4 Chiffres (0001)",
            opt_digits_dynamic: "Dynamique (Sans Zéros: 1, 2...)",
            lbl_code_start: "Numéro de Départ",
            btn_save_code_settings: "Enregistrer Format du Code",
            btn_install_pwa: "Installer comme App",
            view_cards: "Cartes",
            view_table: "Tableau",
            btn_download_template: "Télécharger Modèle (.xlsx)",
            btn_import_excel: "Importer depuis Excel",
            modal_import_title: "Importation Massive depuis Excel",
            import_step1_desc: "Téléchargez votre fichier Excel (*.xlsx ou *.csv). Les colonnes seront mappées automatiquement.",
            import_drop_title: "Glissez votre fichier Excel ici",
            import_choose_file: "Choisir un Fichier",
            import_need_template_title: "Pas de modèle ?",
            import_need_template_desc: "Téléchargez notre modèle vierge prêt à l'emploi.",
            lbl_rows_detected: "Tissus Détectés",
            btn_rechoose: "Changer de Fichier",
            matcher_instruction: "Les colonnes ont été associées aux champs du système. Ajustez-les si besoin :",
            th_excel_header: "En-tête de Colonne",
            th_sample_data: "Exemple de Donnée",
            th_system_field: "Champ Système",
            lbl_code_behavior_title: "Logique Code Interne :",
            lbl_code_behavior_desc: "Les codes existants sont conservés. Les vides reçoivent des numéros automatiques.",
            btn_cancel: "Annuler",
            btn_confirm_import: "Importer les Tissus"
        }
    };

    let currentLang = localStorage.getItem("fabrictag_lang") || "tr";

    // Clean uppercase normalization converting Turkish dotted İ/ı to standard English I when in non-Turkish mode
    function toAppUpper(str) {
        if (!str) return "";
        let s = str.toString().trim();
        if (currentLang === "tr") {
            return s.toLocaleUpperCase("tr-TR");
        } else {
            return s.replace(/İ/g, "I").replace(/ı/g, "i").toLocaleUpperCase("en-US").replace(/İ/g, "I");
        }
    }

    function applyLanguage(lang) {
        currentLang = lang;
        try { localStorage.setItem("fabrictag_lang", lang); } catch (e) {}

        // Crucial: Set document language so the browser's CSS text-transform uses English rules (no dotted I)
        document.documentElement.lang = lang;

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

        // Update active class on lang buttons
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
    
    btnSaveSettings.addEventListener("click", () => {
        const key = settingsApiKey.value.trim();
        if (!key) {
            alert("Lütfen geçerli bir API anahtarı girin!");
            return;
        }
        
        fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: key })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast("API anahtarı kaydedildi!", 1000);
                settingsApiKey.value = "";
                loadSettings();
            }
        });
    });

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
    applyLanguage(currentLang);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}

