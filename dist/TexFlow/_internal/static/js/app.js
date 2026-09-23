const { createApp, ref, computed, onMounted, nextTick, watch } = Vue;

window.__texflowApp = createApp({
    setup() {
        const currentUser = ref(null);

        // RBAC Granüler Yetki Kontrolü
        const hasPermission = (permKey) => {
            if (!currentUser.value) return false;
            const role = currentUser.value.role;
            if (role === 'superadmin' || role === 'masterdeveloper' || role === 'admin') {
                return true;
            }
            if (permKey === 'can_edit_menus' || permKey === 'can_view_orders' || permKey === 'can_view_fabrictag') {
                return true;
            }
            return !!(currentUser.value.permissions && currentUser.value.permissions[permKey]);
        };
        const token = ref(localStorage.getItem('texflow_token') || '');
        const authChecking = ref(!!localStorage.getItem('texflow_token'));
        const loading = ref(false);
        const sidebarOpen = ref(false);
        const isMobile = ref(window.innerWidth < 768);

        // Toast Notification System
        const showToast = (message, type = 'info') => {
            try {
                const containerId = 'texflow-toast-container';
                let container = document.getElementById(containerId);
                if (!container) {
                    container = document.createElement('div');
                    container.id = containerId;
                    container.className = 'fixed bottom-5 right-5 z-[99999] flex flex-col gap-2 pointer-events-none';
                    document.body.appendChild(container);
                }
                const toast = document.createElement('div');
                const bgClass = type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-500/20' :
                                type === 'error' ? 'bg-red-600 text-white shadow-red-500/20' :
                                type === 'warning' ? 'bg-amber-600 text-white shadow-amber-500/20' :
                                'bg-slate-900 text-white border border-slate-700 shadow-black/40';
                toast.className = `px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 pointer-events-auto transition-all duration-300 transform translate-y-4 opacity-0 ${bgClass}`;
                toast.innerHTML = `<span>${message}</span>`;
                container.appendChild(toast);
                requestAnimationFrame(() => {
                    toast.classList.remove('translate-y-4', 'opacity-0');
                });
                setTimeout(() => {
                    toast.classList.add('opacity-0', 'translate-y-2');
                    setTimeout(() => toast.remove(), 300);
                }, 3500);
            } catch (e) {
                console.log('[Toast]', type, message);
            }
        };

        // =========================================================================
        // AKILLI EKRAN ÇÖZÜNÜRLÜĞÜ & OTOMATİK SIĞDIRMA MOTORU (EXCEL-LIKE AUTO FIT)
        // =========================================================================
        const getAutoFitZoom = () => {
            const w = window.innerWidth || (window.screen ? window.screen.width : 1920);
            const h = window.innerHeight || (window.screen ? window.screen.height : 1080);
            
            // Excel gibi ekrana sığdırma:
            if (w < 1200 || h < 700) {
                return 75; // Küçük laptop / 1080p %150 ölçek
            } else if (w < 1440 || h < 820) {
                return 80; // 1366x768 standart laptop / 1080p %125 ölçek
            } else if (w < 1680) {
                return 85; // 1440x900 veya 1600x900
            } else if (w < 1920) {
                return 90; // Standart 1080p laptop/monitör
            } else {
                return 100; // Geniş 1080p ve 2K/4K ekranlar
            }
        };

        const zoomMode = ref(localStorage.getItem('texflow_zoom_mode') || 'auto'); // 'auto' | 'manual'
        const savedZoom = localStorage.getItem('texflow_zoom_level');
        const zoomLevel = ref(
            zoomMode.value === 'manual' && savedZoom 
                ? parseInt(savedZoom) 
                : getAutoFitZoom()
        );

        const applyGlobalZoom = (level) => {
            const scale = Math.min(150, Math.max(65, level)) / 100;
            // Excel gibi ekran asla daralmaz, pencereye tam oturur
            if (document.body && document.body.style.zoom) {
                document.body.style.zoom = '1';
            }
            if (document.documentElement) {
                document.documentElement.style.setProperty('--table-font-scale', scale.toString());
            }
        };

        const setZoom = (level, isManual = true) => {
            const next = Math.min(150, Math.max(65, level));
            zoomLevel.value = next;
            if (isManual) {
                zoomMode.value = 'manual';
                localStorage.setItem('texflow_zoom_mode', 'manual');
                localStorage.setItem('texflow_zoom_level', next);
            }
            applyGlobalZoom(next);
        };

        const changeZoom = (delta) => {
            setZoom(zoomLevel.value + delta, true);
        };

        const toggleAutoZoom = () => {
            if (zoomMode.value === 'auto') {
                setZoom(100, true);
                showToast('info', 'Yazı Boyutu: Sabit %100');
            } else {
                zoomMode.value = 'auto';
                localStorage.setItem('texflow_zoom_mode', 'auto');
                localStorage.removeItem('texflow_zoom_level');
                const autoVal = getAutoFitZoom();
                zoomLevel.value = autoVal;
                applyGlobalZoom(autoVal);
                showToast('success', `Yazı Boyutu Ekrana Uyarlandı (%${autoVal})`);
            }
            refreshIcons();
        };

        const resetZoom = () => {
            toggleAutoZoom();
        };


        // Theme Names
        const themeName = ref(localStorage.getItem('texflow_theme_name') || 'theme-emerald');
        const isDarkMode = ref(localStorage.getItem('texflow_dark_mode') !== 'false');

        const THEME_CONFIGS = {
            'theme-emerald': { primary: '#10b981', hover: '#059669', light: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' },
            'theme-sapphire': { primary: '#0284c7', hover: '#0369a1', light: 'rgba(2, 132, 199, 0.15)', border: 'rgba(2, 132, 199, 0.3)' },
            'theme-purple': { primary: '#9333ea', hover: '#7e22ce', light: 'rgba(147, 51, 234, 0.15)', border: 'rgba(147, 51, 234, 0.3)' },
            'theme-amber': { primary: '#d97706', hover: '#b45309', light: 'rgba(217, 119, 6, 0.15)', border: 'rgba(217, 119, 6, 0.3)' },
            'theme-rose': { primary: '#e11d48', hover: '#be123c', light: 'rgba(225, 29, 72, 0.15)', border: 'rgba(225, 29, 72, 0.3)' }
        };

        const applyThemeStyles = (name) => {
            const cfg = THEME_CONFIGS[name] || THEME_CONFIGS['theme-emerald'];
            const root = document.documentElement;
            root.style.setProperty('--theme-primary', cfg.primary);
            root.style.setProperty('--theme-primary-hover', cfg.hover);
            root.style.setProperty('--theme-primary-light', cfg.light);
            root.style.setProperty('--theme-border', cfg.border);
            root.className = name + (isDarkMode.value ? ' dark' : '');
            
            const appEl = document.getElementById('app');
            if (appEl) {
                appEl.style.setProperty('--theme-primary', cfg.primary);
                appEl.style.setProperty('--theme-primary-hover', cfg.hover);
                appEl.style.setProperty('--theme-primary-light', cfg.light);
                appEl.style.setProperty('--theme-border', cfg.border);
            }
        };

        const setTheme = (name) => {
            themeName.value = name;
            localStorage.setItem('texflow_theme_name', name);
            applyThemeStyles(name);
            refreshIcons();
        };

        const toggleDarkMode = () => {
            isDarkMode.value = !isDarkMode.value;
            localStorage.setItem('texflow_dark_mode', isDarkMode.value);
            applyThemeStyles(themeName.value);
            refreshIcons();
        };

        // Run immediately on page initialization
        applyThemeStyles(themeName.value);

        // Login Form
        const loginForm = ref({ username: '', password: '' });
        const loginError = ref('');

        // Navigation & Sidebar Collapse
        const menus = ref([]);
        const activeMenu = ref('carsaf_liste');
        const sidebarCollapsed = ref(localStorage.getItem('texflow_sidebar_collapsed') === 'true');

        const toggleSidebar = () => {
            sidebarCollapsed.value = !sidebarCollapsed.value;
            localStorage.setItem('texflow_sidebar_collapsed', sidebarCollapsed.value);
            refreshIcons();
        };



        // Dashboard Stats & State
        const stats = ref({});

        // =========================================================================
        // YÖNETİMSEL DASHBOARD & GENEL BAKIŞ MOTORU (GELİŞMİŞ İSTATİSTİKLER, HAFTALIK KANBAN)
        // =========================================================================
        const dashboardPeriod = ref(localStorage.getItem('texflow_dashboard_period') || 'ytd');
        const dashboardMonth = ref(localStorage.getItem('texflow_dashboard_month') || 'all');
        const dashboardViewMode = ref(localStorage.getItem('texflow_dashboard_view_mode') || 'cards');
        const dashboardVisibleCards = ref(JSON.parse(localStorage.getItem('texflow_dashboard_visible_cards') || '["pieces","shipped","remaining","models","revenue","cost","profit","fabrics"]'));

        const monthFilterOptions = [
            { value: 'all', label: 'Tüm Aylar' },
            { value: '1', label: 'Ocak' },
            { value: '2', label: 'Şubat' },
            { value: '3', label: 'Mart' },
            { value: '4', label: 'Nisan' },
            { value: '5', label: 'Mayıs' },
            { value: '6', label: 'Haziran' },
            { value: '7', label: 'Temmuz' },
            { value: '8', label: 'Ağustos' },
            { value: '9', label: 'Eylül' },
            { value: '10', label: 'Ekim' },
            { value: '11', label: 'Kasım' },
            { value: '12', label: 'Aralık' }
        ];

        const saveDashboardPrefs = () => {
            localStorage.setItem('texflow_dashboard_period', dashboardPeriod.value);
            localStorage.setItem('texflow_dashboard_month', dashboardMonth.value);
            localStorage.setItem('texflow_dashboard_view_mode', dashboardViewMode.value);
            localStorage.setItem('texflow_dashboard_visible_cards', JSON.stringify(dashboardVisibleCards.value));
        };

        const setDashboardPeriod = (period) => {
            dashboardPeriod.value = period;
            saveDashboardPrefs();
            refreshIcons();
        };

        const setDashboardMonth = (month) => {
            dashboardMonth.value = month;
            saveDashboardPrefs();
            refreshIcons();
        };

        const setDashboardViewMode = (mode) => {
            dashboardViewMode.value = mode;
            saveDashboardPrefs();
            refreshIcons();
        };

        const toggleDashboardCard = (cardKey) => {
            const idx = dashboardVisibleCards.value.indexOf(cardKey);
            if (idx > -1) {
                if (dashboardVisibleCards.value.length > 1) {
                    dashboardVisibleCards.value.splice(idx, 1);
                }
            } else {
                dashboardVisibleCards.value.push(cardKey);
            }
            saveDashboardPrefs();
        };

        const isDashboardCardVisible = (cardKey) => {
            return dashboardVisibleCards.value.includes(cardKey);
        };

        const parseDateFlexible = (val) => {
            if (!val) return null;
            if (val instanceof Date && !isNaN(val)) return val;
            const str = String(val).trim();
            // DD.MM.YYYY
            const dotM = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
            if (dotM) {
                return new Date(parseInt(dotM[3]), parseInt(dotM[2]) - 1, parseInt(dotM[1]));
            }
            // YYYY-MM-DD
            const isoM = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
            if (isoM) {
                return new Date(parseInt(isoM[1]), parseInt(isoM[2]) - 1, parseInt(isoM[3]));
            }
            const d = new Date(str);
            return isNaN(d.getTime()) ? null : d;
        };

        const dashboardFilteredStyles = computed(() => {
            const all = styles.value || [];
            if (!all.length) return [];

            const now = new Date();
            const currentYear = now.getFullYear();

            return all.filter(item => {
                const d = parseDateFlexible(item.delivery_date) || parseDateFlexible(item.order_date) || parseDateFlexible(item.created_at);
                
                // 1. Period filter
                if (d) {
                    if (dashboardPeriod.value === 'ytd') {
                        const startOfYear = new Date(currentYear, 0, 1);
                        if (d < startOfYear) return false;
                    } else if (dashboardPeriod.value === 'last_1_year') {
                        const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
                        if (d < oneYearAgo) return false;
                    } else if (dashboardPeriod.value === 'last_2_years') {
                        const twoYearsAgo = new Date(now.getTime() - (730 * 24 * 60 * 60 * 1000));
                        if (d < twoYearsAgo) return false;
                    }
                }

                // 2. Month filter (1-12 or 'all')
                if (dashboardMonth.value !== 'all' && d) {
                    const m = d.getMonth() + 1;
                    if (String(m) !== String(dashboardMonth.value)) {
                        return false;
                    }
                }

                return true;
            });
        });

        const dashboardMetrics = computed(() => {
            const list = dashboardFilteredStyles.value || [];
            let totalPieces = 0;
            let totalShippedPieces = 0;
            let inProductionPieces = 0;
            let fabricWaitingCount = 0;
            let ppsWaitingCount = 0;
            let ppsApprovedCount = 0;
            const waitingFabricQualitiesSet = new Set();
            let totalRevenueEUR = 0;
            let totalCostEUR = 0;
            let actualCostCount = 0;

            // Kesim, Sevkiyat ve Kalite Metrikleri
            let totalCutQty = 0;
            let totalShippedQty = 0;
            let evalCutQty = 0;
            let evalShippedQty = 0;
            let shippedOrdersCount = 0;
            let shippedOrdersPlannedQty = 0;
            let shippedOrdersActualQty = 0;
            let shippedWithDatesCount = 0;
            let shippedOnTimeCount = 0;

            const distinctModels = new Set();
            const distinctPOs = new Set();
            const distinctCustomers = new Set();
            const customerQtyMap = {};
            const monthlyStats = {};

            const eurRate = (currencyRates.value?.find(r => r.code === 'EUR')?.selling || 56.0);
            const numEurRate = typeof eurRate === 'number' ? eurRate : (parseFloat(String(eurRate).replace(',', '.')) || 56.0);
            const usdRate = (currencyRates.value?.find(r => r.code === 'USD')?.selling || 48.0);
            const numUsdRate = typeof usdRate === 'number' ? usdRate : (parseFloat(String(usdRate).replace(',', '.')) || 48.0);
            const gbpRate = (currencyRates.value?.find(r => r.code === 'GBP')?.selling || 64.0);
            const numGbpRate = typeof gbpRate === 'number' ? gbpRate : (parseFloat(String(gbpRate).replace(',', '.')) || 64.0);

            list.forEach(item => {
                const qty = parseInt(item.total_quantity || 0) || 0;
                totalPieces += qty;

                if (item.style_no) distinctModels.add(String(item.style_no).trim());
                if (item.po_number) distinctPOs.add(String(item.po_number).trim());
                
                const cust = item.customer_name ? String(item.customer_name).trim() : 'Diğer';
                distinctCustomers.add(cust);
                customerQtyMap[cust] = (customerQtyMap[cust] || 0) + qty;

                // Status & Sevkiyat Kontrolü
                const st = String(item.status || '').toLowerCase();
                const isShipped = st.includes('sevk') || st.includes('yükleme') || st.includes('shipped') || st.includes('gönderildi');
                const cutQty = parseInt(item.cut_total_quantity || 0) || 0;
                const shippedItemQty = parseInt(item.shipped_total_quantity || 0) || 0;
                
                totalCutQty += cutQty;
                if (shippedItemQty > 0) {
                    totalShippedQty += shippedItemQty;
                } else if (isShipped) {
                    totalShippedQty += qty;
                }

                if (isShipped || shippedItemQty > 0) {
                    const effectiveShippedQty = shippedItemQty > 0 ? shippedItemQty : qty;
                    totalShippedPieces += effectiveShippedQty;
                    shippedOrdersCount++;
                    shippedOrdersPlannedQty += qty;
                    shippedOrdersActualQty += effectiveShippedQty;

                    // 2. Kalite / Fire hesabı: Kesimi yapılmış ve sevk edilmiş siparişler üzerinden
                    if (cutQty > 0) {
                        evalCutQty += cutQty;
                        evalShippedQty += effectiveShippedQty;
                    }

                    // Yükleme Termin Başarısı Hesaplama (delivery_date vs shipping_date)
                    const dDelivery = parseDateFlexible(item.delivery_date);
                    const dShipping = parseDateFlexible(item.shipping_date);
                    if (dDelivery && dShipping) {
                        shippedWithDatesCount++;
                        // Teslimat günü sonuna kadar (23:59:59) sevk edilmişse zamanında kabul edilir
                        const deliveryEnd = new Date(dDelivery.getTime() + (24 * 60 * 60 * 1000) - 1);
                        if (dShipping <= deliveryEnd) {
                            shippedOnTimeCount++;
                        }
                    } else if (dDelivery && isShipped) {
                        shippedWithDatesCount++;
                        shippedOnTimeCount++;
                    }
                } else {
                    inProductionPieces += qty;
                }

                // PPS Takibi (Onay Bekleyenler vs Onaylananlar)
                const ppsVal = String(item.pps_sent || '').trim();
                if (ppsVal.includes('Onaylandı')) {
                    ppsApprovedCount++;
                } else {
                    ppsWaitingCount++;
                }

                // Gelmesi Beklenen Tekil Kumaş Kaliteleri (Tekrar sayılmaz)
                const fQual1 = (item.fabric_quality_name_1 || item.fabric_display_title_1 || item.fabric_article || item.fabric_type || '').trim();
                const recMeters1 = parseFloat(String(item.fabric_received_meters || '0').replace(',', '.')) || 0;
                if (fQual1 && recMeters1 <= 0) {
                    waitingFabricQualitiesSet.add(fQual1.toLowerCase());
                }

                const fQual2 = (item.fabric_quality_name_2 || item.fabric_display_title_2 || item.fabric_article_2 || item.fabric_type_2 || '').trim();
                const recMeters2 = parseFloat(String(item.fabric_received_meters_2 || '0').replace(',', '.')) || 0;
                if (fQual2 && recMeters2 <= 0) {
                    waitingFabricQualitiesSet.add(fQual2.toLowerCase());
                }

                if (!item.fabric_ordered) fabricWaitingCount++;

                // FİNANSAL HESAPLAMA (Öncelikle Gerçekleşen Maliyet Esaslı)
                let curRateToEUR = 1.0;
                const curr = String(item.currency || 'EUR').toUpperCase();
                if (curr === 'USD') {
                    curRateToEUR = numUsdRate / numEurRate;
                } else if (curr === 'GBP') {
                    curRateToEUR = numGbpRate / numEurRate;
                } else if (curr === 'TL' || curr === 'TRY' || curr === '₺') {
                    curRateToEUR = 1.0 / numEurRate;
                }

                let unitSellEUR = parseFloat(item.unit_price) || 0;
                if (item.cost_data?.totals?.toplam_satis_doviz) {
                    unitSellEUR = unitSellEUR || parseFloat(item.cost_data.totals.toplam_satis_doviz) || 0;
                }
                unitSellEUR = unitSellEUR * curRateToEUR;

                let unitCostEUR = 0;
                if (item.actual_cost_data?.totals?.toplam_gerceklesen_doviz) {
                    // Gerçekleşen maliyet döviz cinsinden girilmiş
                    const rawActualDoviz = parseFloat(item.actual_cost_data.totals.toplam_gerceklesen_doviz) || 0;
                    unitCostEUR = rawActualDoviz * curRateToEUR;
                    actualCostCount++;
                } else if (item.actual_cost_data?.totals?.toplam_gerceklesen_tl) {
                    // Gerçekleşen maliyet TL cinsinden girilmiş
                    const rawActualTL = parseFloat(item.actual_cost_data.totals.toplam_gerceklesen_tl) || 0;
                    unitCostEUR = numEurRate > 0 ? (rawActualTL / numEurRate) : 0;
                    actualCostCount++;
                } else if (item.cost_data?.totals?.maliyet_1_doviz) {
                    // Gerçekleşen yoksa planlanan maliyet
                    unitCostEUR = (parseFloat(item.cost_data.totals.maliyet_1_doviz) || 0) * curRateToEUR;
                } else if (unitSellEUR > 0) {
                    unitCostEUR = unitSellEUR * 0.78;
                }

                const itemRevEUR = qty * unitSellEUR;
                const itemCostEUR = qty * unitCostEUR;
                totalRevenueEUR += itemRevEUR;
                totalCostEUR += itemCostEUR;

                // Month breakdown for charts
                const d = parseDateFlexible(item.delivery_date) || parseDateFlexible(item.order_date);
                if (d) {
                    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    if (!monthlyStats[mKey]) {
                        monthlyStats[mKey] = { pieces: 0, revenue: 0, cost: 0, profit: 0 };
                    }
                    monthlyStats[mKey].pieces += qty;
                    monthlyStats[mKey].revenue += itemRevEUR;
                    monthlyStats[mKey].cost += itemCostEUR;
                    monthlyStats[mKey].profit += (itemRevEUR - itemCostEUR);
                }
            });

            const shippedPercent = totalPieces > 0 ? Math.round((totalShippedPieces / totalPieces) * 100) : 0;
            const netProfitEUR = totalRevenueEUR - totalCostEUR;
            const profitMargin = totalRevenueEUR > 0 ? Math.round((netProfitEUR / totalRevenueEUR) * 100) : 0;

            // 1. Yükleme Termin ve Adet Başarısı Oranları
            const shippingDateSuccessPercent = shippedWithDatesCount > 0 
                ? Math.round((shippedOnTimeCount / shippedWithDatesCount) * 100) 
                : (totalShippedPieces > 0 ? 100 : null);
            
            const shippingQtySuccessPercent = shippedOrdersPlannedQty > 0 
                ? Math.min(100, Math.round((shippedOrdersActualQty / shippedOrdersPlannedQty) * 100)) 
                : (totalPieces > 0 ? Math.round((totalShippedPieces / totalPieces) * 100) : 0);

            // 2. İkinci Kalite / Fire Oranı (Kesilen - Yüklenen / Kesilen)
            const targetCutQty = evalCutQty > 0 ? evalCutQty : 0;
            const targetShippedQty = evalCutQty > 0 ? evalShippedQty : 0;
            const secondQualityPieces = Math.max(0, targetCutQty - targetShippedQty);
            const secondQualityPercent = targetCutQty > 0 
                ? Math.round(((secondQualityPieces) / targetCutQty) * 1000) / 10 
                : 0;

            // Top 5 Customers for distribution
            const sortedCustomers = Object.entries(customerQtyMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, qty]) => ({
                    name,
                    qty,
                    percent: totalPieces > 0 ? Math.round((qty / totalPieces) * 100) : 0
                }));

            // Monthly breakdown sorted
            const sortedMonthly = Object.entries(monthlyStats)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .slice(-6)
                .map(([key, data]) => {
                    const [y, m] = key.split('-');
                    const monthNames = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
                    return {
                        key,
                        monthLabel: `${monthNames[parseInt(m)]} '${y.slice(2)}`,
                        pieces: data.pieces,
                        revenue: Math.round(data.revenue),
                        profit: Math.round(data.profit)
                    };
                });

            return {
                totalPieces,
                totalShippedPieces,
                inProductionPieces,
                shippedPercent,
                modelCount: distinctModels.size,
                poCount: distinctPOs.size,
                customerCount: distinctCustomers.size,
                fabricWaitingCount,
                ppsWaitingCount,
                ppsApprovedCount,
                waitingFabricQualitiesCount: waitingFabricQualitiesSet.size,
                totalRevenueEUR: Math.round(totalRevenueEUR),
                totalRevenueTL: Math.round(totalRevenueEUR * numEurRate),
                totalCostEUR: Math.round(totalCostEUR),
                totalCostTL: Math.round(totalCostEUR * numEurRate),
                netProfitEUR: Math.round(netProfitEUR),
                netProfitTL: Math.round(netProfitEUR * numEurRate),
                profitMargin,
                actualCostCount,
                totalCutQty: evalCutQty > 0 ? evalCutQty : totalCutQty,
                totalShippedQty: evalCutQty > 0 ? evalShippedQty : totalShippedQty,
                shippedOrdersCount,
                shippedOrdersPlannedQty,
                shippingDateSuccessPercent,
                shippingQtySuccessPercent,
                secondQualityPieces,
                secondQualityPercent,
                sortedCustomers,
                sortedMonthly
            };
        });

        // 4'LÜ HAFTALIK TERMİN KANBAN GRUPLAMA MOTORU
        const getIsoWeekNumber = (date) => {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
            return { weekNo, year: d.getUTCFullYear() };
        };

        const getWeekDateRangeLabel = (year, weekNo) => {
            const simple = new Date(Date.UTC(year, 0, 1 + (weekNo - 1) * 7));
            const dow = simple.getUTCDay();
            const ISOweekStart = new Date(simple);
            if (dow <= 4)
                ISOweekStart.setUTCDate(simple.getUTCDate() - (simple.getUTCDay() || 7) + 1);
            else
                ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - (simple.getUTCDay() || 7));
            
            const ISOweekEnd = new Date(ISOweekStart.getTime() + (6 * 24 * 60 * 60 * 1000));
            const trMonths = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
            return `${ISOweekStart.getUTCDate()} ${trMonths[ISOweekStart.getUTCMonth()]} - ${ISOweekEnd.getUTCDate()} ${trMonths[ISOweekEnd.getUTCMonth()]}`;
        };

        const dashboardWeeklyDeliveries = computed(() => {
            const all = styles.value || [];
            const now = new Date();
            const currentWeekInfo = getIsoWeekNumber(now);

            // Group all styles that have delivery dates
            const weekGroups = {};

            all.forEach(item => {
                if (!item.delivery_date) return;
                const d = parseDateFlexible(item.delivery_date);
                if (!d) return;

                const { weekNo, year } = getIsoWeekNumber(d);
                const key = `${year}_${weekNo}`;

                if (!weekGroups[key]) {
                    weekGroups[key] = {
                        key,
                        year,
                        weekNo,
                        label: getWeekDateRangeLabel(year, weekNo),
                        isCurrentWeek: (weekNo === currentWeekInfo.weekNo && year === currentWeekInfo.year),
                        totalQuantity: 0,
                        uniqueModelCount: 0,
                        items: []
                    };
                }

                weekGroups[key].totalQuantity += (parseInt(item.total_quantity || 0) || 0);
                weekGroups[key].items.push(item);
            });

            // Generate continuous weeks starting from currentWeekInfo for at least 12 weeks
            const result = [];
            let startYear = currentWeekInfo.year;
            let startWeek = currentWeekInfo.weekNo;

            for (let i = 0; i < 12; i++) {
                let w = startWeek + i;
                let y = startYear;
                if (w > 52) {
                    w = w - 52;
                    y = y + 1;
                }
                const key = `${y}_${w}`;
                if (weekGroups[key]) {
                    result.push(weekGroups[key]);
                } else {
                    result.push({
                        key,
                        year: y,
                        weekNo: w,
                        label: getWeekDateRangeLabel(y, w),
                        isCurrentWeek: (w === currentWeekInfo.weekNo && y === currentWeekInfo.year),
                        totalQuantity: 0,
                        uniqueModelCount: 0,
                        items: []
                    });
                }
            }

            // Also check other weeks with orders beyond this range
            Object.values(weekGroups).forEach(wg => {
                if (!result.find(r => r.key === wg.key)) {
                    result.push(wg);
                }
            });

            // Sort by year then weekNo
            const sorted = result.sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.weekNo - b.weekNo;
            });

            // Calculate unique models for each week
            sorted.forEach(w => {
                const uniqueModelSet = new Set(
                    (w.items || [])
                        .map(it => (it.style_no || it.model_name || it.model_no || it.article || '').trim().toLowerCase())
                        .filter(Boolean)
                );
                w.uniqueModelCount = uniqueModelSet.size;
            });

            return sorted;
        });

        const scrollWeeklyCarousel = (direction) => {
            const el = document.getElementById('weekly-carousel-container');
            if (el) {
                const scrollAmount = el.clientWidth * 0.8;
                el.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
            }
        };

        const scrollToCurrentWeek = (smooth = true) => {
            nextTick(() => {
                const container = document.getElementById('weekly-carousel-container');
                if (!container) return;
                const currentEl = container.querySelector('[data-current-week="true"]');
                if (currentEl) {
                    const targetLeft = currentEl.offsetLeft - container.offsetLeft;
                    container.scrollTo({
                        left: Math.max(0, targetLeft),
                        behavior: smooth ? 'smooth' : 'auto'
                    });
                }
            });
        };

        const navigateToStyleInSheet = (item) => {
            if (!item) return;
            activeMenu.value = 'carsaf_liste';
            selectedRowId.value = item.id;
            refreshIcons();
        };

        // ----------------- HAFTALIK PROGRAM (PATRON TAKİP ÇIKTISI) -----------------
        const haftalikProgramModalOpen = ref(false);
        const haftalikProgramStartKey = ref('');
        const haftalikProgramEndKey = ref('');
        const haftalikProgramOnlyWithOrders = ref(true);
        const haftalikProgramShowImages = ref(true);
        const haftalikProgramHideHeaders = ref(true); // Defaultta gizli
        const haftalikProgramLayout = ref('boy'); // 'boy' (standart) veya 'en' (sayfada 2 sıra)
        const haftalikProgramIsExporting = ref(false);

        const openHaftalikProgramModal = () => {
            const weeks = dashboardWeeklyDeliveries.value || [];
            const weeksWithOrders = weeks.filter(w => w.items && w.items.length > 0);

            // Leftmost week or current week
            const currentWeek = weeks.find(w => w.isCurrentWeek) || weeks[0];
            haftalikProgramStartKey.value = currentWeek ? currentWeek.key : (weeks[0]?.key || '');

            // Furthest week with orders
            if (weeksWithOrders.length > 0) {
                haftalikProgramEndKey.value = weeksWithOrders[weeksWithOrders.length - 1].key;
            } else if (weeks.length > 0) {
                haftalikProgramEndKey.value = weeks[weeks.length - 1].key;
            } else {
                haftalikProgramEndKey.value = '';
            }

            haftalikProgramModalOpen.value = true;
            refreshIcons();
        };

        const closeHaftalikProgramModal = () => {
            haftalikProgramModalOpen.value = false;
        };

        const haftalikProgramWeeks = computed(() => {
            const weeks = dashboardWeeklyDeliveries.value || [];
            const startK = haftalikProgramStartKey.value;
            const endK = haftalikProgramEndKey.value;
            const onlyOrders = haftalikProgramOnlyWithOrders.value;

            const filtered = weeks.filter(w => {
                if (startK && w.key < startK) return false;
                if (endK && w.key > endK) return false;
                if (onlyOrders && (!w.items || w.items.length === 0)) return false;
                return true;
            });

            return filtered.map(w => {
                const modelMap = {};
                (w.items || []).forEach(item => {
                    const modelCode = (item.style_no || item.model_name || item.article || 'Bilinmeyen').trim();
                    const brand = (item.brand || item.order_brand || item.customer_name || '').trim();
                    const color = (item.color_name || item.color_code || 'Standart').trim();
                    const qty = parseInt(item.total_quantity || 0) || 0;
                    const img = item.image_url || item.image_url_2 || '';

                    if (!modelMap[modelCode]) {
                        modelMap[modelCode] = {
                            style_no: modelCode,
                            brand: brand,
                            image_url: img,
                            colors: {},
                            total_quantity: 0
                        };
                    }

                    const m = modelMap[modelCode];
                    if (brand && !m.brand) m.brand = brand;
                    if (img && !m.image_url) m.image_url = img;
                    m.colors[color] = (m.colors[color] || 0) + qty;
                    m.total_quantity += qty;
                });

                const modelsList = Object.values(modelMap);
                const weekTotalQty = modelsList.reduce((acc, m) => acc + m.total_quantity, 0);

                // Chunk models into rows of 7
                const rowsOf7 = [];
                for (let i = 0; i < modelsList.length; i += 7) {
                    const chunk = modelsList.slice(i, i + 7);
                    let maxColors = 2;
                    chunk.forEach(m => {
                        const count = Object.keys(m.colors).length;
                        if (count > maxColors) maxColors = count;
                    });
                    rowsOf7.push({
                        chunk,
                        maxColors
                    });
                }

                return {
                    key: w.key,
                    year: w.year,
                    weekNo: w.weekNo,
                    label: w.label,
                    totalQuantity: weekTotalQty,
                    totalModels: modelsList.length,
                    rowsOf7
                };
            });
        });

        // Enine baskı seçildiğinde sayfada 2 sıra olacak şekilde gruplar
        const haftalikProgramEninePages = computed(() => {
            const allRows = [];
            const weeks = haftalikProgramWeeks.value || [];
            weeks.forEach(w => {
                const rows = w.rowsOf7 || [];
                rows.forEach((rowGroup, rIdx) => {
                    allRows.push({
                        week: w,
                        rowGroup: rowGroup,
                        isFirstRowOfWeek: rIdx === 0
                    });
                });
            });

            const pages = [];
            for (let i = 0; i < allRows.length; i += 2) {
                pages.push({
                    pageNo: Math.floor(i / 2) + 1,
                    rows: allRows.slice(i, i + 2)
                });
            }
            return pages;
        });

        const printHaftalikProgram = () => {
            let printStyle = document.getElementById('haftalik-program-dynamic-print-style');
            if (!printStyle) {
                printStyle = document.createElement('style');
                printStyle.id = 'haftalik-program-dynamic-print-style';
                document.head.appendChild(printStyle);
            }
            printStyle.innerHTML = `
                @media print {
                    @page {
                        size: A4 landscape !important;
                        margin: 5mm !important;
                    }
                    html, body {
                        height: auto !important;
                        min-height: 100% !important;
                        overflow: visible !important;
                        background: #ffffff !important;
                    }
                    #haftalik-program-print-modal,
                    #haftalik-program-print-modal > div,
                    #haftalik-program-print-modal .custom-scrollbar {
                        padding: 0 !important;
                        margin: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        background: transparent !important;
                        overflow: visible !important;
                    }
                    #haftalik-program-sheet-container {
                        padding-left: 55px !important;
                        padding-top: 0 !important;
                        padding-bottom: 0 !important;
                        padding-right: 0 !important;
                        margin: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        background: transparent !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        page-break-inside: auto !important;
                        break-inside: auto !important;
                    }
                    .haftalik-enine-page {
                        box-sizing: border-box !important;
                        height: 190mm !important;
                        min-height: 190mm !important;
                        max-height: 190mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: space-evenly !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        page-break-after: always !important;
                        break-after: page !important;
                        overflow: hidden !important;
                    }
                    .haftalik-enine-page:last-child {
                        page-break-after: avoid !important;
                        break-after: auto !important;
                    }
                }
            `;
            setTimeout(() => {
                window.print();
            }, 80);
        };

        const downloadHaftalikProgramExcel = () => {
            haftalikProgramIsExporting.value = true;
            const start = haftalikProgramStartKey.value ? encodeURIComponent(haftalikProgramStartKey.value) : '';
            const end = haftalikProgramEndKey.value ? encodeURIComponent(haftalikProgramEndKey.value) : '';
            const onlyOrders = haftalikProgramOnlyWithOrders.value ? 'true' : 'false';
            const hideHeaders = haftalikProgramHideHeaders.value ? 'true' : 'false';
            const url = `/api/reports/haftalik-program-excel?start_key=${start}&end_key=${end}&only_with_orders=${onlyOrders}&hide_headers=${hideHeaders}`;

            const a = document.createElement('a');
            a.href = url;
            a.download = `Haftalik_Program_${start || 'all'}_${end || 'all'}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => {
                haftalikProgramIsExporting.value = false;
            }, 1500);
        };

        // Master Production Sheet (Çarşaf)
        const styles = ref([]);
        const availableSizes = ref([]);
        const customColumnsList = ref([]);
        const imageColWidth = ref(parseInt(localStorage.getItem('texflow_image_width') || '68'));
        const imageFitMode = ref(localStorage.getItem('texflow_image_fit_mode') || 'contain');

        const setImageFitMode = (mode) => {
            imageFitMode.value = mode;
            localStorage.setItem('texflow_image_fit_mode', mode);
            refreshIcons();
        };

        const getImageFitClass = (style) => {
            const mode = (style && style.custom_fields && style.custom_fields.image_fit) || imageFitMode.value;
            if (mode === 'contain') return 'object-contain w-full h-full p-0.5';
            if (mode === 'fill') return 'object-fill w-full h-full';
            return 'object-cover w-full h-full';
        };


        // SORTING STATE
        const sortColumn = ref('');
        const sortDirection = ref('asc');

        const toggleSort = (colKey) => {
            if (sortColumn.value === colKey) {
                if (sortDirection.value === 'asc') {
                    sortDirection.value = 'desc';
                } else {
                    sortColumn.value = '';
                    sortDirection.value = 'asc';
                }
            } else {
                sortColumn.value = colKey;
                sortDirection.value = 'asc';
            }
            refreshIcons();
        };

        const clearSort = () => {
            sortColumn.value = '';
            sortDirection.value = 'asc';
        };

        const getColumnTitleByKey = (colKey) => {
            const found = visibleColumns.value.find(c => c.key === colKey);
            return found ? found.title : colKey;
        };

        // APPAREL SIZING SORTING MAP (UNIVERSAL NATURAL ORDER)
        const ALPHA_SIZE_MAP = {
            'XXXS': 1, '3XS': 1, 'XXS': 2, '2XS': 2, 'XS': 3,
            'S': 4, 'M': 5, 'L': 6, 'XL': 7,
            'XXL': 8, '2XL': 8, 'XXXL': 9, '3XL': 9, '4XL': 10, '5XL': 11,
            'STD': 12, 'FREE': 13, 'ONE SIZE': 14
        };

        const sortSizesList = (list) => {
            if (!Array.isArray(list)) return [];

            const parseChildMonth = (str) => {
                // Matches '12M/80', '18M/86', '24M/92', '12M', '6M', '0-3M'
                const m = str.match(/^(\d+)(?:-(\d+))?\s*M(?:\/(\d+))?$/i);
                if (m) {
                    const month = m[2] ? parseInt(m[2], 10) : parseInt(m[1], 10);
                    const height = m[3] ? parseInt(m[3], 10) : 0;
                    return { month, height };
                }
                return null;
            };

            const parseChildSlash = (str) => {
                // Matches '3/98', '4/104', '10/140'
                const m = str.match(/^(\d+)\/(\d+)$/);
                if (m) {
                    return { age: parseInt(m[1], 10), height: parseInt(m[2], 10) };
                }
                return null;
            };

            return [...new Set(list)].sort((a, b) => {
                const sA = String(a).trim().toUpperCase();
                const sB = String(b).trim().toUpperCase();

                // 1. Child month sizes (with 'M') come first, sorted by month
                const cmA = parseChildMonth(sA);
                const cmB = parseChildMonth(sB);
                if (cmA && cmB) {
                    if (cmA.month !== cmB.month) return cmA.month - cmB.month;
                    return cmA.height - cmB.height;
                }
                if (cmA && !cmB) return -1;
                if (!cmA && cmB) return 1;

                // 2. Child slash age/height sizes (e.g. 3/98, 4/104...)
                const csA = parseChildSlash(sA);
                const csB = parseChildSlash(sB);
                if (csA && csB) {
                    if (csA.age !== csB.age) return csA.age - csB.age;
                    return csA.height - csB.height;
                }
                if (csA && !csB) return -1;
                if (!csA && csB) return 1;

                const isNumA = /^\d+(\.\d+)?$/.test(sA);
                const isNumB = /^\d+(\.\d+)?$/.test(sB);

                // 3. Both numeric: ascending (e.g. 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52...)
                if (isNumA && isNumB) {
                    return parseFloat(sA) - parseFloat(sB);
                }

                // 4. Both alpha: standard scale (e.g. XXS, XS, S, M, L, XL, XXL, 3XL...)
                const rankA = ALPHA_SIZE_MAP[sA];
                const rankB = ALPHA_SIZE_MAP[sB];
                if (rankA !== undefined && rankB !== undefined) {
                    return rankA - rankB;
                }

                // Numeric sizes first, then Alpha sizes
                if (isNumA && !isNumB) return -1;
                if (!isNumA && isNumB) return 1;

                return sA.localeCompare(sB, undefined, { numeric: true, sensitivity: 'base' });
            });
        };


        // TURKISH MONTH NAMES HELPER
        const TURKISH_MONTHS = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];

        const parseDateToObj = (dStr) => {
            if (!dStr) return null;
            const s = String(dStr).trim();
            let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
            m = s.match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})/);
            if (m) return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
            return null;
        };

        const getOrderMonth = (dStr) => {
            const dt = parseDateToObj(dStr);
            return dt ? TURKISH_MONTHS[dt.getMonth()] : '';
        };

        const getOrderYear = (dStr) => {
            const dt = parseDateToObj(dStr);
            return dt ? String(dt.getFullYear()) : '';
        };

        const getDeliveryMonth = (dStr) => {
            const dt = parseDateToObj(dStr);
            return dt ? TURKISH_MONTHS[dt.getMonth()] : '';
        };

        const getDeliveryYear = (dStr) => {
            const dt = parseDateToObj(dStr);
            return dt ? String(dt.getFullYear()) : '';
        };

        // DATE FORMATTING HELPER FOR CALENDAR PICKER
        const formatDateForInput = (dStr) => {
            if (!dStr) return '';
            const s = String(dStr).trim();
            const m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`;
            const m2 = s.match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})/);
            if (m2) {
                const d = m2[1].padStart(2, '0');
                const m = m2[2].padStart(2, '0');
                const y = m2[3];
                return `${y}-${m}-${d}`;
            }
            return '';
        };

        const formatDateForDisplay = (isoStr) => {
            if (!isoStr) return '';
            const s = String(isoStr).trim();
            const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (m) {
                return `${m[3]}.${m[2]}.${m[1]}`;
            }
            return s;
        };

        // PRICE FORMATTING (VİRGÜLDEN SONRA 2 BASAMAK: 12,00, BOŞSA BOŞ)
        const formatPrice2Decimals = (val) => {
            if (val === null || val === undefined || val === '' || val === 0 || val === '0' || val === '0.00' || val === '0,00') return '';
            const s = String(val).replace(',', '.').trim();
            const num = parseFloat(s);
            if (isNaN(num) || num <= 0) return '';
            return num.toFixed(2).replace('.', ',');
        };

        // 2 BASAMAKLI SAYISAL FORMATLAYICI (14 -> 14,00, 0 -> 0,00)
        const format2Dec = (val) => {
            if (val === null || val === undefined || val === '') return '0,00';
            const num = parseFloat(String(val).replace(',', '.').trim());
            if (isNaN(num)) return '0,00';
            return num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        const updatePriceWith2Decimals = async (item, inputVal) => {
            const s = String(inputVal || '').trim().replace(',', '.');
            if (s === '') {
                item.unit_price = null;
                await updateCellWithLog(item.id, 'unit_price', null, 'Birim Fiyat Temizlendi');
                return;
            }
            const num = parseFloat(s);
            if (!isNaN(num) && num > 0) {
                const finalVal = parseFloat(num.toFixed(2));
                item.unit_price = finalVal;
                await updateCellWithLog(item.id, 'unit_price', finalVal, 'Birim Fiyat Güncellendi');
            } else {
                item.unit_price = null;
                await updateCellWithLog(item.id, 'unit_price', null, 'Birim Fiyat Temizlendi');
            }
        };


        // SMART DATE PARSER (GÜN VE AY GİRİLDİĞİNDE OTOMATİK İÇİNDE BULUNULAN YILI ATAR: 15.09 -> 15.09.2026)
        const parseSmartDate = (rawInput) => {
            if (!rawInput) return '';
            let s = String(rawInput).trim();
            if (!s) return '';

            const currentYear = new Date().getFullYear();

            // 1. YYYY-MM-DD
            let m = s.match(/^(\d{4})[./\-](\d{1,2})[./\-](\d{1,2})$/);
            if (m) {
                const y = m[1];
                const month = m[2].padStart(2, '0');
                const d = m[3].padStart(2, '0');
                return `${d}.${month}.${y}`;
            }

            // 2. DD.MM.YYYY
            m = s.match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})$/);
            if (m) {
                const d = m[1].padStart(2, '0');
                const month = m[2].padStart(2, '0');
                const y = m[3];
                return `${d}.${month}.${y}`;
            }

            // 3. DD.MM.YY
            m = s.match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{2})$/);
            if (m) {
                const d = m[1].padStart(2, '0');
                const month = m[2].padStart(2, '0');
                const y = '20' + m[3];
                return `${d}.${month}.${y}`;
            }

            // 4. Gün ve Ay (15.09, 15/9, 15-09, 5.9) -> İçinde bulunulan yılı otomatik yazar!
            m = s.match(/^(\d{1,2})[./\-\s](\d{1,2})$/);
            if (m) {
                const d = m[1].padStart(2, '0');
                const month = m[2].padStart(2, '0');
                return `${d}.${month}.${currentYear}`;
            }

            // 5. Bitişik 4 rakam (1509 -> 15.09.2026)
            m = s.match(/^(\d{2})(\d{2})$/);
            if (m) {
                const d = m[1];
                const month = m[2];
                const numM = parseInt(month, 10);
                const numD = parseInt(d, 10);
                if (numM >= 1 && numM <= 12 && numD >= 1 && numD <= 31) {
                    return `${d}.${month}.${currentYear}`;
                }
            }

            // 6. Bitişik 3 rakam (509 -> 05.09.2026)
            m = s.match(/^(\d{1})(\d{2})$/);
            if (m) {
                const d = m[1].padStart(2, '0');
                const month = m[2];
                const numM = parseInt(month, 10);
                if (numM >= 1 && numM <= 12) {
                    return `${d}.${month}.${currentYear}`;
                }
            }

            return s;
        };

        const updateSmartDate = async (item, field, rawInput) => {
            if (!rawInput || String(rawInput).trim() === '') {
                item[field] = '';
                await updateCellWithLog(item.id, field, '', 'Tarih Temizlendi');
                return;
            }
            const formatted = parseSmartDate(rawInput);
            item[field] = formatted;
            await updateCellWithLog(item.id, field, formatted, 'Tarih Güncellendi');
        };

        const updateCustomDateSmart = async (item, fieldKey, rawInput) => {
            if (!rawInput || String(rawInput).trim() === '') {
                await updateCustomFieldDirect(item, fieldKey, '');
                return;
            }
            const formatted = parseSmartDate(rawInput);
            await updateCustomFieldDirect(item, fieldKey, formatted);
        };

        // DIRECT ORDER DATE / DELIVERY DATE UPDATE
        const updateOrderDateDirect = async (item, field, isoVal) => {
            if (!isoVal) return;
            const displayVal = formatDateForDisplay(isoVal);
            item[field] = displayVal;

            try {
                await apiFetch('/api/styles/update-cell', {
                    method: 'POST',
                    body: JSON.stringify({
                        style_id: item.id,
                        field: field,
                        value: displayVal,
                        reason: field === 'order_date' ? 'Sipariş Tarihi Güncellendi' : 'Teslimat Tarihi Güncellendi'
                    })
                });
                loadStats();
            } catch (err) {
                console.error('Date update error:', err);
            }
        };

        // Base Dynamic Columns Builder (KUMAŞ 1 & KUMAŞ 2 VE AY/YIL SÜTUNLARI)
        // 1. ALL POSSIBLE COLUMNS MASTER REGISTRY (DEFAULT USER ORDER)
        const getAllAvailableColumns = (sizesList = [], customCols = []) => {
            const cols = [
                { key: 'status', title: 'İşlem Aşaması / Durum', filterable: true, width: 160, minWidth: 50 },
                { key: 'season', title: 'Sezon', filterable: true, align: 'center', width: 95, minWidth: 40 },
                { key: 'order_date', title: 'Sipariş Tarihi', filterable: true, align: 'center', width: 115, minWidth: 50 },
                { key: 'delivery_date', title: 'Sipariş Termin', filterable: true, align: 'center', width: 115, minWidth: 50 },
                { key: 'customer_name', title: 'Müşteri', filterable: true, width: 130, minWidth: 40 },
                { key: 'brand', title: 'Marka', filterable: true, width: 105, minWidth: 35 },
                { key: 'channel', title: 'Kanal', filterable: true, width: 110, minWidth: 45 },
                { key: 'po_number', title: 'PO No', filterable: true, width: 105, minWidth: 35 },
                { key: 'style_no', title: 'Model No', filterable: true, width: 100, minWidth: 35 },
                { key: 'description', title: 'Model Tanımı', filterable: true, width: 145, minWidth: 40 },
                { key: 'color_name', title: 'Renk / Varyant', filterable: true, width: 140, minWidth: 40 },
                { key: 'fabric_article', title: 'Kumaş 1', filterable: true, width: 165, minWidth: 45 },
                { key: 'unit_price', title: 'Birim Fiyat', filterable: false, align: 'center', width: 85, minWidth: 35 }
            ];

            // Sadece aktif siparişlerde adet girilmiş olan veya kullanıcının eklediği bedenleri listele
            const rawSizes = (sizesList && sizesList.length > 0) ? [...sizesList] : [];
            if (customCols && customCols.length > 0) {
                customCols.forEach(cc => {
                    if (cc.col_type === 'size' && cc.title) {
                        const sUpper = cc.title.trim().toUpperCase();
                        if (!rawSizes.includes(sUpper)) {
                            rawSizes.push(sUpper);
                        }
                    }
                });
            }

            const sortedSizes = sortSizesList(rawSizes);

            sortedSizes.forEach(sz => {
                const customColMatch = customCols ? customCols.find(cc => cc.col_type === 'size' && cc.title.trim().toUpperCase() === sz.toUpperCase()) : null;
                cols.push({
                    id: customColMatch ? customColMatch.id : undefined,
                    key: 'size_' + sz,
                    title: sz,
                    isSizeColumn: true,
                    isCustom: !!customColMatch,
                    sizeName: sz,
                    filterable: false,
                    align: 'center',
                    width: 50,
                    minWidth: 25
                });
            });

            cols.push(
                { key: 'total_quantity', title: 'Toplam Adet', filterable: false, align: 'center', width: 90, minWidth: 35 },
                { key: 'cut_quantity', title: 'Kesim Adeti', filterable: false, align: 'center', width: 90, minWidth: 35 },
                { key: 'shipped_quantity', title: 'Yükleme Adeti', filterable: false, align: 'center', width: 95, minWidth: 35 },
                { key: 'pps_sent', title: 'PPS Durumu', filterable: true, align: 'left', width: 170, minWidth: 155 },
                
                // KUMAŞ 1 GRUBU
                { key: 'unit_meters', title: 'Birim Metraj 1', filterable: false, align: 'center', width: 105, minWidth: 40 },
                { key: 'unit_grams', title: 'Birim Gramaj 1', filterable: false, align: 'center', width: 105, minWidth: 40 },
                { key: 'fabric_wastage_percent', title: 'Kumaş % Fire 1', filterable: false, align: 'center', width: 95, minWidth: 35 },
                { key: 'fabric_ordered', title: 'Kumaş Sip. Edildi 1', filterable: false, align: 'center', width: 110, minWidth: 40 },
                { key: 'fabric_ordered_meters', title: 'Kumaş Sipariş 1', filterable: false, align: 'center', width: 125, minWidth: 45 },
                { key: 'fabric_price_1', title: 'Kumaş Fiyat 1', filterable: false, align: 'center', width: 115, minWidth: 50 },
                { key: 'fabric_arrival_date', title: 'Kumaş Termin Tarihi 1', filterable: true, align: 'center', width: 125, minWidth: 50 },
                { key: 'fabric_received_meters', title: 'Kumaş Gelen Metraj (M) 1', filterable: false, align: 'center', width: 125, minWidth: 45 },

                // KUMAŞ 2 GRUBU
                { key: 'fabric_article_2', title: 'Kumaş 2', filterable: true, width: 165, minWidth: 45 },
                { key: 'unit_meters_2', title: 'Birim Metraj 2', filterable: false, align: 'center', width: 105, minWidth: 40 },
                { key: 'unit_grams_2', title: 'Birim Gramaj 2', filterable: false, align: 'center', width: 105, minWidth: 40 },
                { key: 'fabric_wastage_percent_2', title: 'Kumaş % Fire 2', filterable: false, align: 'center', width: 95, minWidth: 35 },
                { key: 'fabric_ordered_2', title: 'Kumaş Sip. Edildi 2', filterable: false, align: 'center', width: 110, minWidth: 40 },
                { key: 'fabric_ordered_meters_2', title: 'Kumaş Sipariş 2', filterable: false, align: 'center', width: 125, minWidth: 45 },
                { key: 'fabric_price_2', title: 'Kumaş Fiyat 2', filterable: false, align: 'center', width: 115, minWidth: 50 },
                { key: 'fabric_arrival_date_2', title: 'Kumaş Termin Tarihi 2', filterable: true, align: 'center', width: 125, minWidth: 50 },
                { key: 'fabric_received_meters_2', title: 'Kumaş Gelen Metraj (M) 2', filterable: false, align: 'center', width: 125, minWidth: 45 },

                { key: 'shipping_sample_sent', title: 'Yükleme', filterable: false, align: 'center', width: 75, minWidth: 35 },
                { key: 'fabric_order_status', title: 'Notlar', filterable: false, width: 130, minWidth: 40 },
                { key: 'cost_calculation', title: 'Maliyet', filterable: false, align: 'center', width: 135, minWidth: 105 },
                { key: 'actual_cost', title: 'Gerçekleşen', filterable: false, align: 'center', width: 135, minWidth: 105 },
                { key: 'order_month', title: 'Sipariş Ayı', filterable: true, align: 'center', width: 90, minWidth: 35 },
                { key: 'order_year', title: 'Sipariş Yılı', filterable: true, align: 'center', width: 75, minWidth: 30 },
                { key: 'delivery_month', title: 'Teslimat Ayı', filterable: true, align: 'center', width: 90, minWidth: 35 },
                { key: 'delivery_year', title: 'Teslimat Yılı', filterable: true, align: 'center', width: 75, minWidth: 30 }
            );

            if (customCols && customCols.length > 0) {
                customCols.forEach(cc => {
                    if (cc.col_type === 'size') {
                        return; // Beden sütunları yukarıdaki beden grubuna dahil edildi
                    }
                    cols.push({
                        id: cc.id,
                        key: cc.col_key,
                        title: cc.title,
                        isCustom: true,
                        col_type: cc.col_type,
                        options: cc.options || [],
                        filterable: true,
                        align: cc.col_type === 'number' || cc.col_type === 'date' || cc.col_type === 'month_year' || cc.col_type === 'checkbox' ? 'center' : 'left',
                        width: cc.width || 120,
                        minWidth: 40
                    });
                });
            }


            return cols;
        };

        // 2. DEFAULT VISIBLE COLUMNS (EXCLUDES MONTH & YEAR COLUMNS BY DEFAULT)
        const getInitialColumns = (sizesList = [], customCols = []) => {
            const all = getAllAvailableColumns(sizesList, customCols);
            const defaultHiddenKeys = new Set(['order_month', 'order_year', 'delivery_month', 'delivery_year']);
            return all.filter(c => !defaultHiddenKeys.has(c.key));
        };

        const getUserLayoutStorageKey = () => {
            const userIdentifier = currentUser.value?.username || 'default_user';
            return `texflow_col_layout_v26_${userIdentifier}`;
        };


        const visibleColumns = ref(getInitialColumns([]));

        // EXCEL-STYLE COLLAPSIBLE SIZE COLUMNS & FABRIC COLUMNS (+ / -)
        const areSizesCollapsed = ref(localStorage.getItem('texflow_sizes_collapsed') === 'true');
        const areFabricColsCollapsed = ref(localStorage.getItem('texflow_fabric_collapsed') === 'true');

        const fabricDetailKeys = new Set([
            'unit_meters',
            'unit_grams',
            'fabric_wastage_percent',
            'fabric_ordered',
            'fabric_ordered_meters',
            'fabric_price_1',
            'fabric_received_meters',
            'fabric_article_2',
            'unit_meters_2',
            'unit_grams_2',
            'fabric_wastage_percent_2',
            'fabric_ordered_2',
            'fabric_ordered_meters_2',
            'fabric_price_2',
            'fabric_arrival_date_2',
            'fabric_received_meters_2'
        ]);

        const toggleSizesCollapsed = () => {
            areSizesCollapsed.value = !areSizesCollapsed.value;
            localStorage.setItem('texflow_sizes_collapsed', areSizesCollapsed.value);
            refreshIcons();
        };

        const toggleFabricCollapsed = () => {
            areFabricColsCollapsed.value = !areFabricColsCollapsed.value;
            localStorage.setItem('texflow_fabric_collapsed', areFabricColsCollapsed.value);
            refreshIcons();
        };

        // AKILLI KAYDIRMA (MÜŞTERİ - KUMAŞ 1 SABİTLEME) & SATIR SEÇME (FREEZE PANES)
        const isSmartScrollEnabled = ref(localStorage.getItem('texflow_smart_scroll') !== 'false');
        const saveSmartScrollPref = () => {
            localStorage.setItem('texflow_smart_scroll', isSmartScrollEnabled.value);
            refreshIcons();
        };

        const selectedRowId = ref(null);
        const selectRow = (item) => {
            if (!item) return;
            selectedRowId.value = (selectedRowId.value === item.id ? null : item.id);
        };

        const frozenColumnKeys = new Set([
            'customer_name',
            'brand',
            'po_number',
            'style_no',
            'color_name',
            'fabric_article'
        ]);

        const getStickyColumnStyle = (col, isHeader = false, item = null) => {
            if (!isSmartScrollEnabled.value || !col) return {};

            if (!frozenColumnKeys.has(col.key)) {
                return {};
            }

            const colIdx = displayedColumns.value.findIndex(c => c.key === col.key);
            if (colIdx === -1) {
                return {};
            }

            // Sabit Görsel sütununun genişliğinden başla
            let leftOffset = (imageColWidth.value || 68);
            for (let i = 0; i < colIdx; i++) {
                const prevCol = displayedColumns.value[i];
                if (frozenColumnKeys.has(prevCol.key)) {
                    leftOffset += (prevCol.width || 100);
                }
            }

            // En son sabitlenen sütuna gölge ver
            let lastFrozenKey = null;
            for (let i = displayedColumns.value.length - 1; i >= 0; i--) {
                if (frozenColumnKeys.has(displayedColumns.value[i].key)) {
                    lastFrozenKey = displayedColumns.value[i].key;
                    break;
                }
            }
            const isLastFrozen = (col.key === lastFrozenKey);

            return {
                position: 'sticky',
                left: `${leftOffset}px`,
                zIndex: isHeader ? 32 : 12,
                boxShadow: isLastFrozen ? '4px 0 10px -2px rgba(0, 0, 0, 0.15)' : 'none'
            };
        };

        const getStickyImageStyle = (isHeader = false, item = null) => {
            if (!isSmartScrollEnabled.value) return {};
            return {
                position: 'sticky',
                left: '0px',
                zIndex: isHeader ? 33 : 13
            };
        };

        // EXCEL-TARZI ENTER İLE BİR ALT SATIRIN AYNI SÜTUN HÜCRESİNE GEÇME
        const handleTableKeydown = (event) => {
            if (event.key !== 'Enter' || event.ctrlKey || event.altKey) return;

            const target = event.target;
            if (!target || !['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;

            // Tarih alanı ise girilen gün ve ayı içinde bulunulan yıla otomatik tamamla (15.09 -> 15.09.2026)
            if (target.getAttribute('data-is-date') === 'true' && target.value) {
                const parsed = parseSmartDate(target.value);
                if (parsed && parsed !== target.value) {
                    target.value = parsed;
                }
            }

            const currentTd = target.closest('td');
            const currentTr = target.closest('tr');
            if (!currentTd || !currentTr) return;

            const cellIndex = Array.from(currentTr.children).indexOf(currentTd);
            if (cellIndex === -1) return;

            let targetTr = null;
            if (event.shiftKey) {
                // Shift + Enter: Bir üst satıra git
                targetTr = currentTr.previousElementSibling;
            } else {
                // Enter: Bir alt sipariş satırının aynı sütununa git
                targetTr = currentTr.nextElementSibling;
            }

            if (!targetTr) return;

            const targetTd = targetTr.children[cellIndex];
            if (!targetTd) return;

            const targetInput = targetTd.querySelector('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
            if (targetInput) {
                event.preventDefault();
                target.blur();

                targetInput.focus();
                if (typeof targetInput.select === 'function' && targetInput.type !== 'date' && targetInput.type !== 'month') {
                    targetInput.select();
                }

                const targetRowId = targetTr.getAttribute('data-row-id');
                if (targetRowId) {
                    selectedRowId.value = parseInt(targetRowId) || targetRowId;
                }
            }
        };


        const displayedColumns = computed(() => {
            const result = [];
            let sizeGroupAdded = false;

            // Görünümdeki aktif/filtrelenmiş modellerde adeti olan bedenleri tespit et
            const activeSizesInView = new Set();
            const stylesInView = filteredStyles.value || [];
            stylesInView.forEach(item => {
                if (item.size_map) {
                    Object.entries(item.size_map).forEach(([sz, qty]) => {
                        if (parseInt(qty) > 0) {
                            activeSizesInView.add(String(sz).trim().toUpperCase());
                        }
                    });
                }
            });

            // Kullanıcının "Sütun Ekle" ile eklediği özel beden sütunları da korunur
            if (customColumnsList.value) {
                customColumnsList.value.forEach(cc => {
                    if (cc.col_type === 'size' && cc.title) {
                        activeSizesInView.add(String(cc.title).trim().toUpperCase());
                    }
                });
            }

            for (const col of visibleColumns.value) {
                // Maliyet sütunlarını görme yetkisi yoksa tablodan kaldır
                if ((col.key === 'cost_calculation' || col.key === 'actual_cost') && !hasPermission('can_view_costs')) {
                    continue;
                }

                // Eğer bu bir beden sütunuysa ve görünümdeki hiçbir modelde adeti yoksa tablodan kaldır
                if (col.isSizeColumn) {
                    const sName = String(col.sizeName || col.title || '').trim().toUpperCase();
                    if (!activeSizesInView.has(sName)) {
                        continue;
                    }
                }

                // 1. Handle Sizes Collapsing
                if (areSizesCollapsed.value && col.isSizeColumn) {
                    if (!sizeGroupAdded) {
                        result.push({
                            key: 'sizes_collapsed_group',
                            title: 'BEDENLER [+]',
                            isSizesCollapsedGroup: true,
                            align: 'center',
                            width: 85,
                            minWidth: 65
                        });
                        sizeGroupAdded = true;
                    }
                    continue;
                }

                // 2. Handle Fabric Columns Collapsing
                if (areFabricColsCollapsed.value && fabricDetailKeys.has(col.key)) {
                    continue;
                }

                // If this is the fabric arrival date column when collapsed, add indicator to title
                if (areFabricColsCollapsed.value && col.key === 'fabric_arrival_date') {
                    result.push({
                        ...col,
                        title: 'KUMAŞ TERMİN TARİHİ 1 [+]',
                        isFabricCollapsedHeader: true
                    });
                    continue;
                }

                result.push(col);
            }
            return result;
        });

        const getRowSizeSummary = (item) => {
            return '';
        };

        const extractCleanMeters = (val) => {
            if (!val) return '';
            const s = String(val).trim();
            const m = s.match(/B[İIİ]R[İI]M\s*(?:METRAJ|MT)[:\s]*([0-9.,]+)/i);
            if (m) {
                let numStr = m[1].replace(',', '.');
                let num = parseFloat(numStr);
                if (!isNaN(num) && num > 50) num = num / 100.0;
                return !isNaN(num) ? num.toFixed(2).replace('.', ',') : numStr;
            }
            const cleanS = s.replace(',', '.');
            const num = parseFloat(cleanS);
            if (!isNaN(num) && num > 0) {
                return num.toFixed(2).replace('.', ',');
            }
            return s;
        };

        // BİRİM METRAJ FORMATI (1 BİLE GİRİLSE 1,00 OLARAK GÖSTERİR)
        const formatMeters2Decimals = (val) => {
            if (val === null || val === undefined || val === '') return '';
            const cleanStr = extractCleanMeters(val);
            if (!cleanStr) return '';
            const num = parseFloat(String(cleanStr).replace(',', '.'));
            if (isNaN(num)) return cleanStr;
            return num.toFixed(2).replace('.', ',');
        };

        const extractCleanDimension = (raw) => {
            if (!raw) return '';
            let s = String(raw).trim();
            s = s.replace(/\([^\)]*\)/g, '').replace(/(\+\/?-|\±|\+-)\s*[%0-9.,\w]*/g, '').trim();
            const rangeMatch = s.match(/(\d+(?:[.,]\d+)?\s*-\s*\d+(?:[.,]\d+)?)/);
            if (rangeMatch) {
                return rangeMatch[0].replace(/\s+/g, '');
            }
            const m = s.match(/\d+(?:[.,]\d+)?/);
            if (m) {
                return m[0].replace(',', '.');
            }
            return '';
        };

        const parseNum = (val, defaultVal = 0) => {
            if (val === undefined || val === null || String(val).trim() === '') return defaultVal;
            const s = String(val).trim().replace(',', '.');
            const n = parseFloat(s);
            return isNaN(n) ? defaultVal : n;
        };

        // KUMAŞ SİPARİŞ HESAPLAMA (SLOT 1 VEYA SLOT 2)
        const calculateFabricOrder = (item, slot = 1) => {
            const totalQty = parseInt(item.total_quantity || 0) || 0;
            const wastage = parseFloat(slot === 2 ? (item.fabric_wastage_percent_2 || 5.0) : (item.fabric_wastage_percent || 5.0)) || 0.0;
            const wasteMultiplier = 1 + (wastage / 100.0);

            const rawUnitMeters = slot === 2 ? item.unit_meters_2 : (item.unit_meters || item.pps_unit_meters);
            const cleanUnitMetersStr = extractCleanMeters(rawUnitMeters);
            const uMeters = cleanUnitMetersStr ? parseFloat(String(cleanUnitMetersStr).replace(',', '.')) : 0;

            const rawUnitGrams = slot === 2 ? item.unit_grams_2 : item.unit_grams;
            const uGrams = rawUnitGrams ? parseFloat(String(rawUnitGrams).replace(',', '.')) : 0;

            // Case 1: Birim Metraj girilmişse (M)
            if (uMeters > 0) {
                const totalM = Math.round(totalQty * uMeters * wasteMultiplier * 10) / 10;
                return {
                    value: totalM,
                    unit: 'M',
                    formatted: `${totalM.toLocaleString('tr-TR')} M`
                };
            }

            // Case 2: Birim Gramaj girilmişse (KG)
            // Formül: Adet * yüzde fazlası * birim gramaj / 1000 (Kumaş 1 ve Kumaş 2 için)
            if (uGrams > 0) {
                const totalKg = (totalQty * wasteMultiplier * uGrams) / 1000.0;
                const rounded = Math.round(totalKg * 10) / 10;
                return {
                    value: rounded,
                    unit: 'KG',
                    formatted: `${rounded.toLocaleString('tr-TR')} KG`
                };
            }

            const existingVal = parseFloat(slot === 2 ? (item.fabric_ordered_meters_2 || 0) : (item.fabric_ordered_meters || 0)) || 0;
            const existingUnit = (slot === 2 ? item.fabric_order_unit_2 : item.fabric_order_unit) || 'M';
            return {
                value: existingVal,
                unit: existingUnit,
                formatted: existingVal ? `${existingVal} ${existingUnit}` : ''
            };
        };

        const updateUnitMeters = async (item, val) => {
            const cleanVal = extractCleanMeters(val);
            item.unit_meters = cleanVal;
            item.pps_unit_meters = cleanVal;
            if (cleanVal !== '') {
                item.unit_grams = '';
            }
            item.fabric_order_manual_override = 0;
            const calc = calculateFabricOrder(item, 1);
            if (cleanVal !== '') {
                item.fabric_ordered_meters = calc.value;
                item.fabric_order_unit = calc.unit;
            }

            await updateCellWithLog(item.id, 'unit_meters', cleanVal, 'Birim Metraj 1 Güncellendi');
            await updateCellWithLog(item.id, 'pps_unit_meters', cleanVal, 'Birim Metraj 1 Güncellendi');
            if (cleanVal !== '') {
                await updateCellWithLog(item.id, 'unit_grams', '', 'Birim Gramaj 1 Temizlendi');
                await updateCellWithLog(item.id, 'fabric_ordered_meters', calc.value, `Kumaş Sipariş 1 Hesaplandı (${calc.formatted})`);
                await updateCellWithLog(item.id, 'fabric_order_unit', calc.unit, 'Kumaş Sipariş 1 Birimi');
            }
        };

        const updateUnitGrams = async (item, val) => {
            const cleanVal = String(val || '').trim();
            item.unit_grams = cleanVal;
            if (cleanVal !== '') {
                item.unit_meters = '';
                item.pps_unit_meters = '';
            }
            item.fabric_order_manual_override = 0;
            const calc = calculateFabricOrder(item, 1);
            if (cleanVal !== '') {
                item.fabric_ordered_meters = calc.value;
                item.fabric_order_unit = calc.unit;
            }

            await updateCellWithLog(item.id, 'unit_grams', cleanVal, 'Birim Gramaj 1 Güncellendi');
            if (cleanVal !== '') {
                await updateCellWithLog(item.id, 'unit_meters', '', 'Birim Metraj 1 Temizlendi');
                await updateCellWithLog(item.id, 'pps_unit_meters', '', 'Birim Metraj 1 Temizlendi');
                await updateCellWithLog(item.id, 'fabric_ordered_meters', calc.value, `Kumaş Sipariş 1 Hesaplandı (${calc.formatted})`);
                await updateCellWithLog(item.id, 'fabric_order_unit', calc.unit, 'Kumaş Sipariş 1 Birimi');
            }
        };

        const updateFabricWastage = async (item, val) => {
            const cleanVal = parseNum(val);
            item.fabric_wastage_percent = cleanVal;
            item.fabric_order_manual_override = 0;
            const calc = calculateFabricOrder(item, 1);
            if (item.unit_meters || item.unit_grams) {
                item.fabric_ordered_meters = calc.value;
                item.fabric_order_unit = calc.unit;
            }

            await updateCellWithLog(item.id, 'fabric_wastage_percent', cleanVal, 'Kumaş % Fire 1 Güncellendi');
            if (item.unit_meters || item.unit_grams) {
                await updateCellWithLog(item.id, 'fabric_ordered_meters', calc.value, `Kumaş Sipariş 1 Yeniden Hesaplandı (${calc.formatted})`);
            }
        };

        const updateFabricOrderedManual = async (item, val) => {
            const numVal = parseNum(val);
            item.fabric_ordered_meters = numVal;
            item.fabric_order_manual_override = 1;
            await updateCellWithLog(item.id, 'fabric_ordered_meters', numVal, 'Kumaş Sipariş 1 Miktarı Elle Düzenlendi');
            await updateCellWithLog(item.id, 'fabric_order_manual_override', 1, 'Elle Düzenleme İşareti 1');
        };

        const updateFabricPrice1 = async (item, val) => {

            const cleanStr = String(val || '').trim().replace(',', '.');
            const num = parseFloat(cleanStr);
            const finalVal = !isNaN(num) && num > 0 ? parseFloat(num.toFixed(2)) : (cleanStr === '' ? null : cleanStr);
            item.fabric_price_1 = finalVal;
            await updateCellWithLog(item.id, 'fabric_price_1', finalVal, 'Kumaş Fiyat 1 Güncellendi');
        };

        const updateFabricPrice2 = async (item, val) => {
            const cleanStr = String(val || '').trim().replace(',', '.');
            const num = parseFloat(cleanStr);
            const finalVal = !isNaN(num) && num > 0 ? parseFloat(num.toFixed(2)) : (cleanStr === '' ? null : cleanStr);
            item.fabric_price_2 = finalVal;
            await updateCellWithLog(item.id, 'fabric_price_2', finalVal, 'Kumaş Fiyat 2 Güncellendi');
        };

        // KUMAŞ 2 GÜNCELLEME METODLARI

        const updateUnitMeters2 = async (item, val) => {
            const cleanVal = extractCleanMeters(val);
            item.unit_meters_2 = cleanVal;
            if (cleanVal !== '') {
                item.unit_grams_2 = '';
            }
            item.fabric_order_manual_override_2 = 0;
            const calc = calculateFabricOrder(item, 2);
            if (cleanVal !== '') {
                item.fabric_ordered_meters_2 = calc.value;
                item.fabric_order_unit_2 = calc.unit;
            }

            await updateCellWithLog(item.id, 'unit_meters_2', cleanVal, 'Birim Metraj 2 Güncellendi');
            if (cleanVal !== '') {
                await updateCellWithLog(item.id, 'unit_grams_2', '', 'Birim Gramaj 2 Temizlendi');
                await updateCellWithLog(item.id, 'fabric_ordered_meters_2', calc.value, `Kumaş Sipariş 2 Hesaplandı (${calc.formatted})`);
                await updateCellWithLog(item.id, 'fabric_order_unit_2', calc.unit, 'Kumaş Sipariş 2 Birimi');
            }
        };

        const updateUnitGrams2 = async (item, val) => {
            const cleanVal = String(val || '').trim();
            item.unit_grams_2 = cleanVal;
            if (cleanVal !== '') {
                item.unit_meters_2 = '';
            }
            item.fabric_order_manual_override_2 = 0;
            const calc = calculateFabricOrder(item, 2);
            if (cleanVal !== '') {
                item.fabric_ordered_meters_2 = calc.value;
                item.fabric_order_unit_2 = calc.unit;
            }

            await updateCellWithLog(item.id, 'unit_grams_2', cleanVal, 'Birim Gramaj 2 Güncellendi');
            if (cleanVal !== '') {
                await updateCellWithLog(item.id, 'unit_meters_2', '', 'Birim Metraj 2 Temizlendi');
                await updateCellWithLog(item.id, 'fabric_ordered_meters_2', calc.value, `Kumaş Sipariş 2 Hesaplandı (${calc.formatted})`);
                await updateCellWithLog(item.id, 'fabric_order_unit_2', calc.unit, 'Kumaş Sipariş 2 Birimi');
            }
        };

        const updateFabricWastage2 = async (item, val) => {
            const cleanVal = parseNum(val);
            item.fabric_wastage_percent_2 = cleanVal;
            item.fabric_order_manual_override_2 = 0;
            const calc = calculateFabricOrder(item, 2);
            if (item.unit_meters_2 || item.unit_grams_2) {
                item.fabric_ordered_meters_2 = calc.value;
                item.fabric_order_unit_2 = calc.unit;
            }

            await updateCellWithLog(item.id, 'fabric_wastage_percent_2', cleanVal, 'Kumaş % Fire 2 Güncellendi');
            if (item.unit_meters_2 || item.unit_grams_2) {
                await updateCellWithLog(item.id, 'fabric_ordered_meters_2', calc.value, `Kumaş Sipariş 2 Yeniden Hesaplandı (${calc.formatted})`);
            }
        };

        const updateFabricOrderedManual2 = async (item, val) => {
            const numVal = parseNum(val);
            item.fabric_ordered_meters_2 = numVal;
            item.fabric_order_manual_override_2 = 1;
            await updateCellWithLog(item.id, 'fabric_ordered_meters_2', numVal, 'Kumaş Sipariş 2 Miktarı Elle Düzenlendi');
            await updateCellWithLog(item.id, 'fabric_order_manual_override_2', 1, 'Elle Düzenleme İşareti 2');
        };

        // ULUSLARARASI KUMAŞ KOMPOZİSYON KISALTMALARI (CO, PES, EA, CV, RCY vb.)
        const formatCompositionAbbr = (comp) => {
            if (!comp || !String(comp).trim()) return '';
            let text = String(comp).trim();

            const dict = [
                [/\b(recycled|recycle|geri\s*dönüşüm|geridonusum|rcy)\b/gi, 'RCY'],
                [/\b(organic|organik|org)\b/gi, 'ORG'],
                [/\b(cotton|pamuk|baumwolle|coton|algodon|cot)\b/gi, 'CO'],
                [/\b(polyester|pes|poly|pl)\b/gi, 'PES'],
                [/\b(elastane|elastan|elastin|spandex|lycra|likra|ea|el)\b/gi, 'EA'],
                [/\b(viscose|viscon|viskon|viskose|rayon|cv|vi)\b/gi, 'CV'],
                [/\b(modal|cmd)\b/gi, 'CMD'],
                [/\b(lyocell|tencel|cly)\b/gi, 'CLY'],
                [/\b(linen|flax|keten|li)\b/gi, 'LI'],
                [/\b(wool|yün|yun|wolle|laine|wo)\b/gi, 'WO'],
                [/\b(polyamide|polyamid|nylon|naylon|pa)\b/gi, 'PA'],
                [/\b(acrylic|akrilik|acryl|pan|pac)\b/gi, 'PAN'],
                [/\b(silk|ipek|seide|soie|se)\b/gi, 'SE'],
                [/\b(cashmere|kaşmir|kasmir|ws)\b/gi, 'WS'],
                [/\b(mohair|tiftik|wm)\b/gi, 'WM'],
                [/\b(bamboo|bambu|cvb)\b/gi, 'CVB']
            ];

            for (const [regex, abbr] of dict) {
                text = text.replace(regex, abbr);
            }
            return text;
        };

        // KUMAŞ EN & GRAMAJ BİLGİSİ (150 CM • 220 GRM2)
        const formatFabricWidthWeight = (item, slot = 1) => {
            const rawWidth = slot === 2 ? (item.fabrictag_width_2 || item.fabric_width_2) : (item.fabrictag_width || item.fabric_width);
            const rawWeight = slot === 2 ? (item.fabrictag_weight_2 || item.fabric_weight_2) : (item.fabrictag_weight || item.fabric_weight);

            let widthStr = '';
            let weightStr = '';

            const cleanW = extractCleanDimension(rawWidth);
            if (cleanW) widthStr = `${cleanW} CM`;

            const cleanG = extractCleanDimension(rawWeight);
            if (cleanG) weightStr = `${cleanG} GRM2`;

            if (widthStr && weightStr) {
                return `${widthStr} • ${weightStr}`;
            }
            return widthStr || weightStr || '';
        };

        // KUMAŞ KALİTE ADI & KALİTE KODU GÖSTERİMİ (İÇ KOD YERİNE)
        const getFabricDisplayTitle = (item, slot = 1) => {
            if (!item) return '';
            
            const isInvalid = (val) => {
                if (!val) return true;
                const v = String(val).trim().toUpperCase();
                return v === 'KODSUZ' || v === 'YOK' || v === 'NONE' || v === 'NULL' || v === '-' || v === '';
            };

            // 1. Arka uçtan doğrudan FabricTag çözümlü başlık geldiyse kullan
            if (slot === 1 && item.fabric_display_title_1 !== undefined && item.fabric_display_title_1 !== null && item.fabric_display_title_1 !== '') {
                return item.fabric_display_title_1;
            }
            if (slot === 2 && item.fabric_display_title_2 !== undefined && item.fabric_display_title_2 !== null && item.fabric_display_title_2 !== '') {
                return item.fabric_display_title_2;
            }

            let raw = (slot === 2 ? (item.fabric_article_2 || item.fabric_type_2) : (item.fabric_article || item.fabric_type)) || '';
            raw = String(raw).trim();
            if (!raw) return '';

            // Look for ELT internal code
            const match = raw.match(/ELT\d+/i);
            if (match && fabricsList.value && fabricsList.value.length > 0) {
                const found = fabricsList.value.find(f => f.internal_code && f.internal_code.toUpperCase() === match[0].toUpperCase());
                if (found) {
                    const qName = isInvalid(found.quality_name) ? '' : found.quality_name.trim();
                    const qCode = isInvalid(found.quality_code) ? '' : found.quality_code.trim();
                    
                    const parts = [];
                    if (found.company_name) parts.push(found.company_name.trim());
                    const qCombo = [qName, qCode ? `(${qCode})` : ''].filter(Boolean).join(' ');
                    if (qCombo) parts.push(qCombo);
                    if (found.design_code) parts.push(found.design_code.trim());
                    if (parts.length > 0) {
                        return parts.join(' - ');
                    }
                }
            }

            // Fallback: Ham metin varsa ham metni göster (asla boş döndürüp bilgiyi yutma)
            return raw;
        };

        // İŞLEM AŞAMASI VEYA YÜKLEME TİKİNE GÖRE SATIR KONTROLLERİ
        const isItemShipped = (item) => {
            if (!item) return false;
            if (item.shipping_sample_sent === 1 || item.shipping_sample_sent === true || item.shipping_sample_sent === '1') return true;
            const st = String(item.status || '').replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
            return st.includes('sevk') || st.includes('yükle');
        };

        const isItemCancelled = (item) => {
            if (!item) return false;
            const st = String(item.status || '').replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
            return st.includes('iptal') || st.includes('cancel');
        };

        // ============================================================
        // KUMAŞ SİPARİŞ LİSTESİ (PLANLAMA & SİPARİŞ ALINDI MODALİ)
        // ============================================================
        const kumasSiparisModalOpen = ref(false);
        const kumasSiparisSearch = ref('');
        const kumasSiparisStatusFilter = ref('planning_and_ordered');
        const kumasSiparisCopiedToast = ref(false);
        const kumasSiparisPrintOrientation = ref('landscape');

        const isPlanningOrOrderedStatus = (st) => {
            if (!st) return true;
            const norm = (normalizeStatusName(st) || '').toLowerCase().trim();
            const raw = String(st).toLowerCase().trim();
            return norm.includes('planlama') || 
                   norm.includes('sipariş alındı') || 
                   norm.includes('siparis alindi') || 
                   norm.includes('onaylandı') || 
                   norm.includes('onaylandi') ||
                   raw === 'planlamada' ||
                   raw === 'onaylandı';
        };

        const cleanFabricField = (val) => {
            if (!val) return '';
            const v = String(val).trim();
            const u = v.toUpperCase();
            if (['KODSUZ', 'YOK', 'NONE', 'NULL', '-', '—', 'İSİMSİZ', 'ISIMSIZ', 'TANIMSIZ', 'BİLGİSİ YOK', 'BILGISI YOK', 'BİLGİ YOK', 'BILGI YOK', 'BELİRTİLMEDİ', 'BELIRTILMEDI'].includes(u)) return '';
            return v;
        };

        const extractFabricDetails = (item, slot = 1) => {
            let supplier = slot === 2 ? (item.fabric_company_2 || item.fabric_link_2?.supplier) : (item.fabric_company_1 || item.fabric_link?.supplier);
            let code = slot === 2 ? (item.fabric_quality_code_2 || item.fabric_link_2?.fabric_code) : (item.fabric_quality_code_1 || item.fabric_link?.fabric_code);
            let name = slot === 2 ? (item.fabric_quality_name_2 || item.fabric_link_2?.fabric_name) : (item.fabric_quality_name_1 || item.fabric_link?.fabric_name);
            let variant = slot === 2 ? (item.fabric_variant_2 || item.fabric_link_2?.design_code) : (item.fabric_variant_1 || item.fabric_link?.design_code);
            let color = slot === 2 ? (item.fabric_color_2 || item.fabric_link_2?.color) : (item.fabric_color_1 || item.fabric_link?.color);

            supplier = cleanFabricField(supplier);
            code = cleanFabricField(code);
            name = cleanFabricField(name);
            variant = cleanFabricField(variant);
            color = cleanFabricField(color);

            // Fallback from raw article if still missing
            const rawArticle = slot === 2 ? (item.fabric_article_2 || item.fabric_type_2) : (item.fabric_article || item.fabric_type);
            if ((!supplier || !name || !variant) && rawArticle) {
                const raw = String(rawArticle).trim();
                const parts = raw.split(' - ').map(p => p.trim()).filter(Boolean);
                if (parts.length >= 2) {
                    if (!supplier) supplier = cleanFabricField(parts[0]);
                    if (!name) {
                        let second = parts[1];
                        const matchCode = second.match(/\((.*?)\)/);
                        if (matchCode) {
                            if (!code) code = cleanFabricField(matchCode[1].replace(/ART\.?/i, '').trim());
                            second = second.replace(/\(.*?\)/, '').trim();
                        }
                        name = cleanFabricField(second);
                    }
                    if (parts.length >= 3 && !variant) {
                        variant = cleanFabricField(parts[2]);
                    }
                } else if (parts.length === 1 && !name) {
                    name = cleanFabricField(parts[0]);
                }
            }

            let en = cleanFabricField(slot === 2 ? (item.fabric_width_2 || item.fabric_link_2?.width) : (item.fabric_width_1 || item.fabric_width || item.fabric_link?.width));
            let gramaj = cleanFabricField(slot === 2 ? (item.unit_grams_2 || item.fabric_link_2?.weight) : (item.unit_grams_1 || item.unit_grams || item.fabric_link?.weight));
            let composition = cleanFabricField(slot === 2 ? (item.composition_2 || item.fabric_link_2?.composition) : (item.composition_1 || item.composition || item.fabric_link?.composition));

            return { supplier, code, name, variant, color, en, width: en, gramaj, composition };
        };

        const kumasSiparisList = computed(() => {
            const allStyles = (filteredStyles && filteredStyles.value ? filteredStyles.value : styles.value) || [];
            const filterMode = kumasSiparisStatusFilter.value;
            const search = (kumasSiparisSearch.value || '').toLowerCase().trim();

            const targetStyles = allStyles.filter(s => {
                if (isItemCancelled(s)) return false;
                if (filterMode === 'planning_and_ordered') {
                    return isPlanningOrOrderedStatus(s.status);
                }
                return true;
            });

            const groupsMap = {};

            targetStyles.forEach(s => {
                const modelName = (s.style_no || s.model_name || 'Bilinmeyen').trim();
                const colorName = (s.color_name || s.color_code || '').trim();

                // Slot 1
                const f1 = extractFabricDetails(s, 1);
                const calc1 = calculateFabricOrder(s, 1);
                const meters1 = parseFloat(calc1.value) || 0;
                const unit1 = (calc1.unit || 'M').toUpperCase();

                const hasF1 = !!(f1.supplier || f1.code || f1.name || f1.variant || f1.color || s.fabric_article || meters1 > 0);
                if (hasF1) {
                    const key1 = `${f1.supplier.toLowerCase()}___${f1.code.toLowerCase()}___${f1.name.toLowerCase()}___${f1.variant.toLowerCase()}___${f1.color.toLowerCase()}___${unit1}`;
                    if (!groupsMap[key1]) {
                        groupsMap[key1] = {
                            key: key1,
                            supplier: f1.supplier,
                            code: f1.code,
                            name: f1.name,
                            variant: f1.variant,
                            color: f1.color,
                            totalMeters: 0,
                            unit: unit1,
                            modelsMap: {}
                        };
                    }
                    groupsMap[key1].totalMeters += meters1;
                    if (!groupsMap[key1].modelsMap[modelName]) {
                        groupsMap[key1].modelsMap[modelName] = new Set();
                    }
                    if (colorName) {
                        groupsMap[key1].modelsMap[modelName].add(colorName);
                    }
                }

                // Slot 2
                const rawArt2 = s.fabric_article_2 || s.fabric_type_2;
                if (rawArt2 || s.fabric_company_2 || s.fabric_quality_name_2 || s.fabric_link_2) {
                    const f2 = extractFabricDetails(s, 2);
                    const calc2 = calculateFabricOrder(s, 2);
                    const meters2 = parseFloat(calc2.value) || 0;
                    const unit2 = (calc2.unit || 'M').toUpperCase();

                    const hasF2 = !!(f2.supplier || f2.code || f2.name || f2.variant || f2.color || rawArt2 || meters2 > 0);
                    if (hasF2) {
                        const key2 = `${f2.supplier.toLowerCase()}___${f2.code.toLowerCase()}___${f2.name.toLowerCase()}___${f2.variant.toLowerCase()}___${f2.color.toLowerCase()}___${unit2}`;
                        if (!groupsMap[key2]) {
                            groupsMap[key2] = {
                                key: key2,
                                supplier: f2.supplier,
                                code: f2.code,
                                name: f2.name,
                                variant: f2.variant,
                                color: f2.color,
                                totalMeters: 0,
                                unit: unit2,
                                modelsMap: {}
                            };
                        }
                        groupsMap[key2].totalMeters += meters2;
                        if (!groupsMap[key2].modelsMap[modelName]) {
                            groupsMap[key2].modelsMap[modelName] = new Set();
                        }
                        if (colorName) {
                            groupsMap[key2].modelsMap[modelName].add(colorName + ' (Garni)');
                        }
                    }
                }
            });

            let result = Object.values(groupsMap).map(g => {
                const modelEntries = Object.entries(g.modelsMap).map(([mName, colorsSet]) => {
                    const colorsArr = Array.from(colorsSet).filter(Boolean);
                    if (colorsArr.length > 0) {
                        return `${mName} (${colorsArr.join(', ')})`;
                    }
                    return mName;
                });
                const modelsStr = modelEntries.join(', ');

                const formattedMeters = g.totalMeters > 0 
                    ? `${(Math.round(g.totalMeters * 10) / 10).toLocaleString('tr-TR')} ${g.unit}`
                    : `-`;

                return {
                    key: g.key,
                    supplier: g.supplier,
                    code: g.code,
                    name: g.name,
                    variant: g.variant,
                    color: g.color,
                    modelsAndColors: modelsStr,
                    modelCount: Object.keys(g.modelsMap).length,
                    totalMeters: Math.round(g.totalMeters * 10) / 10,
                    unit: g.unit,
                    formattedTotalMeters: formattedMeters
                };
            });

            if (search) {
                result = result.filter(r => {
                    return (r.supplier && r.supplier.toLowerCase().includes(search)) ||
                           (r.code && r.code.toLowerCase().includes(search)) ||
                           (r.name && r.name.toLowerCase().includes(search)) ||
                           (r.variant && r.variant.toLowerCase().includes(search)) ||
                           (r.color && r.color.toLowerCase().includes(search)) ||
                           (r.modelsAndColors && r.modelsAndColors.toLowerCase().includes(search));
                });
            }

            result.sort((a, b) => {
                const supA = a.supplier || 'zzz';
                const supB = b.supplier || 'zzz';
                if (supA.localeCompare(supB, 'tr') !== 0) return supA.localeCompare(supB, 'tr');
                const nmA = a.name || 'zzz';
                const nmB = b.name || 'zzz';
                if (nmA.localeCompare(nmB, 'tr') !== 0) return nmA.localeCompare(nmB, 'tr');
                const varA = a.variant || 'zzz';
                const varB = b.variant || 'zzz';
                if (varA.localeCompare(varB, 'tr') !== 0) return varA.localeCompare(varB, 'tr');
                return (a.code || '').localeCompare(b.code || '', 'tr');
            });

            return result;
        });

        const kumasSiparisTotals = computed(() => {
            const list = kumasSiparisList.value || [];
            let totalMeters = 0;
            let totalKg = 0;
            let totalModels = 0;

            list.forEach(r => {
                totalModels += (r.modelCount || 0);
                const val = r.totalMeters || 0;
                if ((r.unit || '').toUpperCase() === 'KG') {
                    totalKg += val;
                } else {
                    totalMeters += val;
                }
            });

            totalMeters = Math.round(totalMeters * 10) / 10;
            totalKg = Math.round(totalKg * 10) / 10;

            const formattedMeters = totalMeters > 0 ? `${totalMeters.toLocaleString('tr-TR')} M` : '0 M';
            const formattedKg = totalKg > 0 ? `${totalKg.toLocaleString('tr-TR')} KG` : '0 KG';

            let combinedText = '';
            if (totalMeters > 0 && totalKg > 0) {
                combinedText = `${formattedMeters} + ${formattedKg}`;
            } else if (totalKg > 0) {
                combinedText = formattedKg;
            } else {
                combinedText = formattedMeters;
            }

            return {
                count: list.length,
                totalModels,
                totalMeters,
                totalKg,
                formattedMeters,
                formattedKg,
                combinedText
            };
        });

        const openKumasSiparisModal = async () => {
            if (!styles.value || styles.value.length === 0) {
                await loadStyles();
            }
            kumasSiparisModalOpen.value = true;
            setTimeout(() => {
                refreshIcons();
            }, 100);
        };

        const closeKumasSiparisModal = () => {
            kumasSiparisModalOpen.value = false;
        };

        const copyKumasSiparisTable = (format = 'excel') => {
            const list = kumasSiparisList.value || [];
            if (list.length === 0) {
                alert('Kopyalanacak kumaş kaydı bulunamadı.');
                return;
            }

            let text = '';
            if (format === 'excel') {
                text = "Kumaşçı\tKalite Kodu\tKalite Adı\tKumaş Varyant\tKumaş Renk\tModel Adları ve Renkleri\tKumaş Sipariş Miktarı\n";
                list.forEach(r => {
                    text += `${r.supplier || ''}\t${r.code || ''}\t${r.name || ''}\t${r.variant || ''}\t${r.color || ''}\t${r.modelsAndColors || ''}\t${r.formattedTotalMeters || ''}\n`;
                });
            } else {
                text = "📋 KUMAŞ SİPARİŞ LİSTESİ\n";
                text += "----------------------------------------\n";
                list.forEach((r, idx) => {
                    const headerParts = [r.supplier, r.code, r.name, r.variant ? `Varyant: ${r.variant}` : '', r.color ? `Renk: ${r.color}` : ''].filter(Boolean).join(' | ');
                    text += `${idx + 1}. ${headerParts || 'Kumaş'}\n`;
                    text += `   Modeller: ${r.modelsAndColors}\n`;
                    text += `   Sipariş Miktarı: ${r.formattedTotalMeters}\n\n`;
                });
                text += "----------------------------------------\n";
                text += `TOPLAM: ${kumasSiparisTotals.value.combinedText} (${list.length} Kalite, ${kumasSiparisTotals.value.totalModels} Model)`;
            }

            const triggerToast = () => {
                kumasSiparisCopiedToast.value = true;
                setTimeout(() => {
                    kumasSiparisCopiedToast.value = false;
                }, 2200);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    triggerToast();
                }).catch(() => {
                    const ta = document.createElement('textarea');
                    ta.value = text;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    triggerToast();
                });
            } else {
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                triggerToast();
            }
        };

        const printKumasSiparis = () => {
            let printStyle = document.getElementById('kumas-siparis-dynamic-print-style');
            if (!printStyle) {
                printStyle = document.createElement('style');
                printStyle.id = 'kumas-siparis-dynamic-print-style';
                document.head.appendChild(printStyle);
            }
            const orient = kumasSiparisPrintOrientation.value || 'landscape';
            printStyle.innerHTML = `@media print { 
                @page { 
                    size: A4 ${orient} !important; 
                    margin: 8mm 6mm !important; 
                } 
            }`;
            setTimeout(() => {
                window.print();
            }, 80);
        };

        // İŞLEM AŞAMASINA GÖRE SATIR KENAR ÇİZGİSİ VE SINIF
        const getRowStatusClass = (statusOrItem) => {
            if (!statusOrItem) return '';
            const item = (typeof statusOrItem === 'object' && statusOrItem !== null) ? statusOrItem : { status: statusOrItem };
            if (isItemCancelled(item)) {
                return 'border-l-4 !border-l-red-500 font-medium';
            }
            if (isItemShipped(item)) {
                return 'border-l-4 !border-l-emerald-500 font-medium';
            }
            return '';
        };

        // TÜM SATIR VE HÜCRELERİN ARKA PLAN RENKLENDİRMESİ (YÜKLENDİ: AÇIK YEŞİL, İPTAL: AÇIK KIRMIZI)
        const getCellBgClass = (item, isImage = false, isCollapsed = false) => {
            if (!item) return '';
            if (selectedRowId.value === item.id) {
                return isDarkMode.value ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-950';
            }
            if (isItemCancelled(item)) {
                return isDarkMode.value 
                    ? 'bg-red-950/60 group-hover:bg-red-900/70 text-red-100' 
                    : 'bg-red-100/90 group-hover:bg-red-200/90 text-red-950';
            }
            if (isItemShipped(item)) {
                return isDarkMode.value 
                    ? 'bg-emerald-950/50 group-hover:bg-emerald-900/60 text-emerald-100' 
                    : 'bg-emerald-100/80 group-hover:bg-emerald-200/80 text-emerald-950';
            }
            if (isCollapsed) {
                return 'bg-amber-500/5';
            }
            if (isImage) {
                return isDarkMode.value ? 'bg-slate-950' : 'bg-slate-100';
            }
            return isDarkMode.value ? 'bg-slate-900 group-hover:bg-slate-800/60' : 'bg-white group-hover:bg-slate-50';
        };



        const buildColumns = (sizesList, customCols = customColumnsList.value) => {
            const raw = (sizesList && sizesList.length > 0) ? sizesList : ['34', '36', '38', '40', '42', '44', '46', '48', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

            const sortedSizes = sortSizesList(raw);
            const allAvailable = getAllAvailableColumns(sortedSizes, customCols);
            const allAvailMap = new Map(allAvailable.map(c => [c.key, c]));

            const savedLayout = localStorage.getItem(getUserLayoutStorageKey());
            if (savedLayout) {
                try {
                    const parsed = JSON.parse(savedLayout);
                    if (Array.isArray(parsed) && parsed.length > 3) {
                        const savedKeys = parsed.map(c => c.key);
                        const result = [];
                        let sizesInjected = false;

                        const savedColMap = new Map(parsed.map(p => [p.key, p]));

                        savedKeys.forEach(k => {
                            if (k.startsWith('size_')) {
                                if (!sizesInjected) {
                                    // Inject all currently active sorted sizes in correct natural order!
                                    sortedSizes.forEach(sz => {
                                        const sk = 'size_' + sz;
                                        if (allAvailMap.has(sk)) {
                                            const base = { ...allAvailMap.get(sk) };
                                            const saved = savedColMap.get(sk);
                                            if (saved && saved.width) base.width = saved.width;
                                            result.push(base);
                                        }
                                    });
                                    sizesInjected = true;
                                }
                            } else if (allAvailMap.has(k)) {
                                const base = { ...allAvailMap.get(k) };
                                const saved = savedColMap.get(k);
                                if (saved && saved.width) base.width = saved.width;
                                result.push(base);
                            }
                        });

                        if (!sizesInjected) {
                            const tIdx = result.findIndex(c => c.key === 'total_quantity');
                            const sizeCols = sortedSizes.map(sz => allAvailMap.get('size_' + sz)).filter(Boolean);
                            if (tIdx !== -1) {
                                result.splice(tIdx, 0, ...sizeCols);
                            } else {
                                result.push(...sizeCols);
                            }
                        }

                        // Ensure Kesim Adeti and Yükleme Adeti columns exist next to Toplam Adet
                        const hasCutCol = result.some(c => c.key === 'cut_quantity');
                        const hasShipCol = result.some(c => c.key === 'shipped_quantity');
                        if (!hasCutCol || !hasShipCol) {
                            let insertIdx = result.findIndex(c => c.key === 'total_quantity');
                            if (insertIdx !== -1) {
                                insertIdx++; // right after total_quantity
                                if (!hasCutCol && allAvailMap.has('cut_quantity')) {
                                    result.splice(insertIdx, 0, { ...allAvailMap.get('cut_quantity') });
                                    insertIdx++;
                                }
                                if (!hasShipCol && allAvailMap.has('shipped_quantity')) {
                                    result.splice(insertIdx, 0, { ...allAvailMap.get('shipped_quantity') });
                                }
                            }
                        }

                        if (result.length >= 8) {
                            visibleColumns.value = result;
                            return;
                        }
                    }
                } catch (e) {}
            }
            visibleColumns.value = getInitialColumns(sortedSizes, customCols);
        };

        // AUTOCOMPLETE & SUGGESTION LISTS (AYNI SÜTUNLARDA ÖNCEKİ VERİLERDEN OTOMATİK TAMAMLAMA)
        const distinctCustomers = computed(() => {
            const s = new Set();
            (styles.value || []).forEach(x => { if (x.customer_name) s.add(x.customer_name); });
            return Array.from(s).sort();
        });

        const distinctBrands = computed(() => {
            const s = new Set();
            (styles.value || []).forEach(x => { if (x.brand) s.add(x.brand); });
            return Array.from(s).sort();
        });

        const distinctPos = computed(() => {
            const s = new Set();
            (styles.value || []).forEach(x => { if (x.po_number) s.add(x.po_number); });
            return Array.from(s).sort();
        });

        const distinctStyles = computed(() => {
            const s = new Set();
            (styles.value || []).forEach(x => { if (x.style_no) s.add(x.style_no); });
            return Array.from(s).sort();
        });

        const distinctDescriptions = computed(() => {
            const s = new Set();
            (styles.value || []).forEach(x => { if (x.description) s.add(x.description); });
            return Array.from(s).sort();
        });

        const distinctColors = computed(() => {
            const s = new Set();
            (styles.value || []).forEach(x => { if (x.color_name) s.add(x.color_name); });
            return Array.from(s).sort();
        });

        const customChannels = ref(JSON.parse(localStorage.getItem('texflow_custom_channels') || '[]'));
        const newCustomChannelText = ref('');

        const distinctChannels = computed(() => {
            const s = new Set();
            // 1. Sadece o sütundakilere göre (styles tablosunda mevcut girilmiş kanallar)
            (styles.value || []).forEach(x => {
                const ch = (x.channel || '').toString().trim();
                if (ch) s.add(ch);
            });
            // 2. Kullanıcının süzgeç listesinden eklediği özel kanallar
            customChannels.value.forEach(c => {
                const ch = (c || '').toString().trim();
                if (ch) s.add(ch);
            });
            return Array.from(s).sort((a, b) => a.localeCompare(b, 'tr', { sensitivity: 'base' }));
        });

        const addNewCustomChannel = () => {
            const val = String(newCustomChannelText.value || '').trim();
            if (!val) return;
            if (!customChannels.value.includes(val)) {
                customChannels.value.push(val);
                localStorage.setItem('texflow_custom_channels', JSON.stringify(customChannels.value));
            }
            if (!columnFilters.value['channel']) {
                columnFilters.value['channel'] = [];
            }
            if (!columnFilters.value['channel'].includes(val)) {
                columnFilters.value['channel'].push(val);
            }
            newCustomChannelText.value = '';
            alert(`✅ "${val}" kanalı süzgeç listesine eklendi!`);
        };

        // KANAL GİRİŞİ & DEĞİŞİMİ (SERBEST GİRİŞ, OTOMATİK VERİTABANI GÜNCELLEME)
        const onChannelChange = async (item, evt) => {
            const val = (evt.target.value || '').trim();
            if (item.channel !== val) {
                item.channel = val;
                await updateCellWithLog(item.id, 'channel', val, 'Kanal Güncellendi');
            }
        };

        // MARKA GİRİŞİ & DÜZELTİLMESİ (ELLE YAZILABİLİR, OTOMATİK TAMAMLAMALI, OTOMATİK VERİTABANI GÜNCELLEME)
        const onBrandChange = async (item, evt) => {
            const val = (evt.target.value || '').trim();
            if ((item.brand || '') !== val) {
                item.brand = val;
                if (item.order_id) {
                    (styles.value || []).forEach(s => {
                        if (s.order_id === item.order_id) {
                            s.brand = val;
                        }
                    });
                }
                await updateCellWithLog(item.id, 'brand', val, 'Marka Güncellendi');
            }
        };

        // Geriye dönük uyumluluk için güvenli fonksiyonlar
        const activeChannelRowId = ref(null);
        const channelQuery = ref('');
        const channelSelectedIndex = ref(0);
        const channelSuggestions = computed(() => []);
        const onChannelFocus = () => {};
        const onChannelInput = () => {};
        const onChannelBlur = () => {};
        const selectChannelSuggestion = async (item, val) => {
            await onChannelChange(item, { target: { value: val } });
        };
        const handleChannelKeydown = () => {};

        // MANUEL SİPARİŞ / MODEL SATIRI EKLEME
        const isAddingManualRow = ref(false);
        const newManualRow = ref({
            customer_name: '',
            brand: '',
            channel: '',
            po_number: '',
            style_no: '',
            description: '',
            color_name: '',
            color_code: '',
            fabric_article: '',
            fabric_composition: '',
            unit_price: 0.0,
            currency: 'EUR',
            unit_meters: '',
            unit_grams: '',
            fabric_wastage_percent: 5.0,
            fabric_ordered_meters: 0.0,
            fabric_order_unit: 'M',
            order_date: new Date().toISOString().split('T')[0],
            delivery_date: '',
            status: 'Planlamada',
            size_map: {}
        });

        const startManualRow = () => {
            isAddingManualRow.value = true;
            newManualRow.value = {
                customer_name: '',
                brand: '',
                channel: '',
                po_number: '',
                style_no: '',
                description: '',
                color_name: '',
                color_code: '',
                fabric_article: '',
                fabric_composition: '',
                unit_price: 0.0,
                currency: 'EUR',
                unit_meters: '',
                unit_grams: '',
                fabric_wastage_percent: 5.0,
                fabric_ordered_meters: 0.0,
                fabric_order_unit: 'M',
                order_date: new Date().toISOString().split('T')[0],
                delivery_date: '',
                status: 'Planlamada',
                size_map: {}
            };
            refreshIcons();
        };


        const cancelManualRow = () => {
            isAddingManualRow.value = false;
        };

        const getManualRowTotalQty = () => {
            if (!newManualRow.value.size_map) return 0;
            return Object.values(newManualRow.value.size_map).reduce((a, b) => a + (parseInt(b) || 0), 0);
        };

        const updateManualSize = (sz, val) => {
            if (!newManualRow.value.size_map) newManualRow.value.size_map = {};
            newManualRow.value.size_map[sz] = parseInt(val) || 0;
            const totalQ = getManualRowTotalQty();
            const calc = calculateFabricOrder({
                total_quantity: totalQ,
                fabric_wastage_percent: newManualRow.value.fabric_wastage_percent,
                unit_meters: newManualRow.value.unit_meters,
                unit_grams: newManualRow.value.unit_grams
            });
            if (newManualRow.value.unit_meters || newManualRow.value.unit_grams) {
                newManualRow.value.fabric_ordered_meters = calc.value;
                newManualRow.value.fabric_order_unit = calc.unit;
            }
        };

        const saveManualRow = async () => {
            if (!newManualRow.value.style_no && !newManualRow.value.po_number && !newManualRow.value.customer_name) {
                alert('Lütfen en azından Müşteri, PO veya Model No alanını doldurunuz.');
                return;
            }

            const totalQ = getManualRowTotalQty();
            const calc = calculateFabricOrder({
                total_quantity: totalQ,
                fabric_wastage_percent: newManualRow.value.fabric_wastage_percent,
                unit_meters: newManualRow.value.unit_meters,
                unit_grams: newManualRow.value.unit_grams
            });
            if (newManualRow.value.unit_meters || newManualRow.value.unit_grams) {
                newManualRow.value.fabric_ordered_meters = calc.value;
                newManualRow.value.fabric_order_unit = calc.unit;
            }

            try {
                await apiFetch('/api/styles/manual-create', {
                    method: 'POST',
                    body: JSON.stringify(newManualRow.value)
                });
                isAddingManualRow.value = false;
                await loadStyles();
                await loadStats();
                alert('✅ Yeni sipariş satırı başarıyla eklendi ve kaydedildi!');
            } catch (e) {
                alert('Kayıt Hatası: ' + e.message);
            }
        };

        // DUAL-PANEL COLUMN VISIBILITY MANAGEMENT MODAL

        const columnVisibilityModalOpen = ref(false);
        const tempVisibleColumns = ref([]);
        const tempHiddenColumns = ref([]);

        const openColumnVisibilityModal = () => {
            const allCols = getAllAvailableColumns(availableSizes.value, customColumnsList.value);
            const currentVisKeys = new Set(visibleColumns.value.map(c => c.key));

            tempVisibleColumns.value = [...visibleColumns.value];
            tempHiddenColumns.value = allCols.filter(c => !currentVisKeys.has(c.key));
            columnVisibilityModalOpen.value = true;
            refreshIcons();
        };

        const hideColumn = (col, idx) => {
            tempVisibleColumns.value.splice(idx, 1);
            tempHiddenColumns.value.push(col);
            refreshIcons();
        };

        const showColumn = (col, idx) => {
            tempHiddenColumns.value.splice(idx, 1);
            tempVisibleColumns.value.push(col);
            refreshIcons();
        };

        const showAllColumns = () => {
            tempVisibleColumns.value.push(...tempHiddenColumns.value);
            tempHiddenColumns.value = [];
            refreshIcons();
        };

        const applyColumnVisibility = () => {
            visibleColumns.value = [...tempVisibleColumns.value];
            saveColumnLayout();
            columnVisibilityModalOpen.value = false;
            refreshIcons();
        };


        // COLOR FORMATTING
        const getColorCodePrefix = (colorName, colorCode) => {
            if (colorCode && String(colorCode).trim()) return String(colorCode).trim();
            if (!colorName) return '';
            const trimmed = String(colorName).trim();
            const m = trimmed.match(/\(([A-Za-z0-9\-_]+)\)$/);
            if (m) return m[1];
            const m2 = trimmed.match(/^([A-Za-z0-9]{3,7})\s+/);
            if (m2 && (m2[1][0].toUpperCase() === 'T' || m2[1][0].toUpperCase() === 'U' || m2[1][0].toUpperCase() === 'C' || /\d/.test(m2[1]))) {
                return m2[1];
            }
            return '';
        };

        const getColorNameSuffix = (colorName, colorCode) => {
            if (!colorName) return colorCode || '-';
            let trimmed = String(colorName).trim();
            trimmed = trimmed.replace(/\s*\([A-Za-z0-9\-_]+\)$/, '');
            const prefix = getColorCodePrefix(colorName, colorCode);
            if (prefix && trimmed.startsWith(prefix)) {
                trimmed = trimmed.substring(prefix.length).trim();
                if (trimmed.startsWith('-')) trimmed = trimmed.substring(1).trim();
            }
            return trimmed || colorName;
        };

        const formatColorFull = (colorName, colorCode) => {
            const p = getColorCodePrefix(colorName, colorCode);
            const s = getColorNameSuffix(colorName, colorCode);
            if (p && s && p !== s) return `${p} - ${s}`;
            return s || p || '-';
        };

        // CURRENCY SYMBOL HELPER
        const getCurrencySymbol = (curr) => {
            if (!curr) return '€';
            const c = String(curr).trim().toUpperCase();
            if (c === '$' || c === 'USD') return '$';
            if (c === '£' || c === 'GBP') return '£';
            if (c === 'TL' || c === 'TRY' || c === '₺') return '₺';
            if (c === 'CHF') return 'CHF';
            if (c === 'EUR' || c === '€') return '€';
            return curr;
        };

        // STATUS MASTER STAGES REGISTRY
        const DEFAULT_STATUS_LIST = [
            'Planlama aşamasında',
            'Sipariş Alındı',
            'Kumaş Sipariş edildi',
            'SO Aşamasında',
            'Kumaş Onay Sürecinde',
            'Kumaş bekleniyor',
            'PPS aşamasında',
            'Kesim aşamasında',
            'Dikim aşamasında',
            'Yıkama Aşamasında',
            'Taş/Baskı/Diğer',
            'Dikim tamamlanıyor',
            'Ütü Paket',
            'Sevk Edildi',
            'İptal oldu'
        ];

        const LEGACY_STATUS_MAP = {
            'Planlamada': 'Planlama aşamasında',
            'Onaylandı': 'Sipariş Alındı',
            'Kumaş Tedariğinde': 'Kumaş Sipariş edildi',
            'Numune / PPS': 'PPS aşamasında',
            'Üretimde': 'Kesim aşamasında',
            'Dikimde': 'Dikim aşamasında',
            'Ütü Paket / Kalitede': 'Ütü Paket',
            'Tamamlandı': 'Sevk Edildi',
            'Yükleme / Sevk Edildi': 'Sevk Edildi',
            'İptal Edildi': 'İptal oldu'
        };

        const customStatusStages = ref(JSON.parse(localStorage.getItem('texflow_custom_status_stages') || '[]'));
        const newCustomStatusText = ref('');

        const allStatusStages = computed(() => {
            const list = [...DEFAULT_STATUS_LIST];
            customStatusStages.value.forEach(cs => {
                const norm = LEGACY_STATUS_MAP[cs] || cs;
                if (!list.includes(norm)) list.push(norm);
            });
            return list;
        });

        const normalizeStatusName = (st) => {
            if (!st) return 'Planlama aşamasında';
            return LEGACY_STATUS_MAP[st] || st;
        };

        const addNewCustomStatus = () => {
            const val = String(newCustomStatusText.value || '').trim();
            if (!val) return;
            const norm = normalizeStatusName(val);
            if (!customStatusStages.value.includes(norm) && !DEFAULT_STATUS_LIST.includes(norm)) {
                customStatusStages.value.push(norm);
                localStorage.setItem('texflow_custom_status_stages', JSON.stringify(customStatusStages.value));
            }
            if (columnFilters.value['status'] && !columnFilters.value['status'].includes(norm)) {
                columnFilters.value['status'].push(norm);
            }
            newCustomStatusText.value = '';
            alert(`✅ "${norm}" yeni işlem aşaması listeye eklendi!`);
        };


        const resetStatusFilter = () => {
            selectAllForColumn('status');
        };

        const applyDefaultStatusFilter = () => {
            const excluded = new Set(['İptal oldu', 'İptal Edildi', 'Sevk Edildi', 'Yükleme / Sevk Edildi']);
            const all = getAllDistinctValuesForColumn('status');
            const filtered = all.filter(st => !excluded.has(st));
            tempColumnFilters.value['status'] = [...filtered];
            columnFilters.value['status'] = [...filtered];
            refreshIcons();
        };

        const saveCurrentStatusAsDefault = () => {
            const current = tempColumnFilters.value['status'] || columnFilters.value['status'] || [];
            localStorage.setItem('texflow_user_default_status_filter', JSON.stringify(current));
            alert('💾 Seçtiğiniz aşamalar varsayılan (default) süzgeç olarak kaydedildi!');
        };

        const saveAndApplyCurrentStatusAsDefault = () => {
            const current = tempColumnFilters.value['status'] || columnFilters.value['status'] || [];
            localStorage.setItem('texflow_user_default_status_filter', JSON.stringify(current));
            columnFilters.value['status'] = [...current];
            activeFilterDropdown.value = null;
            refreshIcons();
            alert('💾 Seçiminiz varsayılan olarak kaydedildi ve tabloya uygulandı!');
        };


        // STATUS BADGE COLOR CODING
        const getStatusBadgeClass = (status) => {
            const s = String(status || '').toLowerCase();
            if (s.includes('tamam') || s.includes('sevk')) return isDarkMode.value ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300';
            if (s.includes('iptal')) return isDarkMode.value ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-red-100 text-red-800 border-red-300';
            if (s.includes('kumaş')) return isDarkMode.value ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300';
            if (s.includes('numune') || s.includes('pps')) return isDarkMode.value ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-purple-100 text-purple-800 border-purple-300';
            if (s.includes('kesim')) return isDarkMode.value ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-indigo-100 text-indigo-800 border-indigo-300';
            if (s.includes('dikim')) return isDarkMode.value ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-blue-100 text-blue-800 border-blue-300';
            if (s.includes('ütü') || s.includes('paket') || s.includes('kalite')) return isDarkMode.value ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' : 'bg-teal-100 text-teal-800 border-teal-300';
            if (s.includes('yıkama') || s.includes('baskı') || s.includes('taş')) return isDarkMode.value ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-rose-100 text-rose-800 border-rose-300';
            if (s.includes('planlama') || s.includes('sipariş') || s.includes('so')) return isDarkMode.value ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-sky-100 text-sky-800 border-sky-300';
            return isDarkMode.value ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300';
        };


        // INSTANT REACTIVE TICK TOGGLE WITH TIMESTAMP
        const toggleCheckboxWithTimestamp = async (item, field, dateField) => {
            const nextVal = item[field] ? 0 : 1;
            item[field] = nextVal;
            const todayStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            item[dateField] = nextVal ? todayStr : null;

            // YÜKLEME TIKLANDIĞINDA İŞLEM AŞAMASINDA OTOMATİK "Sevk Edildi" SEÇİLSİN
            if (field === 'shipping_sample_sent' && nextVal === 1) {
                item.status = 'Sevk Edildi';
                const currentUserName = currentUser.value?.full_name || currentUser.value?.username || 'Yönetici';
                item.last_status_updated_by = currentUserName;
            }

            try {
                const res = await apiFetch('/api/styles/update-cell', {
                    method: 'POST',
                    body: JSON.stringify({
                        style_id: item.id,
                        field: field,
                        value: nextVal,
                        reason: `${field} Onayı Güncellendi`
                    })
                });
                if (res && res.date_str && nextVal) {
                    item[dateField] = res.date_str;
                }

                if (field === 'shipping_sample_sent' && nextVal === 1) {
                    await apiFetch('/api/styles/update-cell', {
                        method: 'POST',
                        body: JSON.stringify({
                            style_id: item.id,
                            field: 'status',
                            value: 'Sevk Edildi',
                            reason: 'Yükleme yapıldı (Otomatik Sevk Edildi)'
                        })
                    });
                }
                loadStats();
            } catch (err) {
                console.error('Checkbox update error:', err);
                item[field] = nextVal ? 0 : 1;
            }
        };

        // STATUS STAGE UPDATE WITH USER TRACKING
        const updateStatusWithUser = async (item, newStatus) => {
            const prevStatus = item.status;
            item.status = newStatus;
            const currentUserName = currentUser.value?.full_name || currentUser.value?.username || 'Yönetici';
            item.last_status_updated_by = currentUserName;

            const isSevk = String(newStatus || '').replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase().includes('sevk');
            const wasSevk = String(prevStatus || '').replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase().includes('sevk');

            if (isSevk) {
                const todayStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                item.shipping_sample_sent = 1;
                item.shipping_sample_sent_date = todayStr;
            } else if (wasSevk || item.shipping_sample_sent) {
                // SEVK EDİLDİDEN BAŞKA BİR İŞLEME DÖNDÜRÜLDÜĞÜNDE YÜKLEME TİKSİZ VE TARİHSİZ HALİNE GERİ DÖNSÜN
                item.shipping_sample_sent = 0;
                item.shipping_sample_sent_date = null;
            }

            // Single row update without altering global table filters
            
            try {
                const res = await apiFetch('/api/styles/update-cell', {
                    method: 'POST',
                    body: JSON.stringify({
                        style_id: item.id,
                        field: 'status',
                        value: newStatus,
                        reason: `Aşama: ${prevStatus} ➜ ${newStatus}`
                    })
                });
                if (res.user_name) {
                    item.last_status_updated_by = res.user_name;
                }
                item.audit_count = (item.audit_count || 0) + 1;

                if (isSevk) {
                    await apiFetch('/api/styles/update-cell', {
                        method: 'POST',
                        body: JSON.stringify({
                            style_id: item.id,
                            field: 'shipping_sample_sent',
                            value: 1,
                            reason: 'Sevk Edildi seçildiği için Yükleme otomatik işaretlendi'
                        })
                    });
                } else if (wasSevk || item.shipping_sample_sent === 0) {
                    await apiFetch('/api/styles/update-cell', {
                        method: 'POST',
                        body: JSON.stringify({
                            style_id: item.id,
                            field: 'shipping_sample_sent',
                            value: 0,
                            reason: 'Aşama Sevk Edildi dışına alındığı için Yükleme sıfırlandı'
                        })
                    });
                }

                loadStats();
            } catch (err) {
                alert('Durum güncelleme hatası: ' + err.message);
                item.status = prevStatus;
            }
        };




        // KUMAŞ TERMİN TARİHİ & GELEN METRAJ HESAPLAMA & RENKLENDİRME
        const getFabricArrivalDaysRemaining = (dateStr) => {
            if (!dateStr || !String(dateStr).trim()) return null;
            const s = String(dateStr).trim();
            let y, m, d;
            if (s.includes('.')) {
                const parts = s.split('.');
                if (parts.length === 3) {
                    d = parseInt(parts[0]);
                    m = parseInt(parts[1]) - 1;
                    y = parseInt(parts[2]);
                    if (y < 100) y += 2000;
                }
            } else if (s.includes('-')) {
                const parts = s.split('-');
                if (parts.length === 3) {
                    if (parts[0].length === 4) {
                        y = parseInt(parts[0]);
                        m = parseInt(parts[1]) - 1;
                        d = parseInt(parts[2]);
                    } else {
                        d = parseInt(parts[0]);
                        m = parseInt(parts[1]) - 1;
                        y = parseInt(parts[2]);
                        if (y < 100) y += 2000;
                    }
                }
            }
            if (!y || isNaN(m) || !d) return null;
            
            const targetDate = new Date(y, m, d);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            targetDate.setHours(0, 0, 0, 0);
            
            const diffTime = targetDate.getTime() - today.getTime();
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        };

        const getFabricArrivalDateStyleClass = (dateStr, receivedMeters) => {
            const rec = parseFloat(receivedMeters) || 0;
            if (rec > 0) {
                // Kumaş depoya ulaştığı için termin uyarısı kalkar, normale döner
                return '';
            }
            const remaining = getFabricArrivalDaysRemaining(dateStr);
            if (remaining === null) return '';
            if (remaining <= 3) {
                return 'w-full bg-red-400 !text-black font-extrabold border border-red-500 shadow-sm animate-pulse rounded px-1.5 py-0.5';
            }
            if (remaining <= 7) {
                return 'w-full bg-amber-300 !text-black font-extrabold border border-amber-400 shadow-sm rounded px-1.5 py-0.5';
            }
            return '';
        };


        const getFabricReceivedMetersClass = (orderedMeters, receivedMeters) => {
            const ord = parseFloat(orderedMeters) || 0;
            const rec = parseFloat(receivedMeters) || 0;
            if (ord <= 0 || rec <= 0) return '';
            const diffPercent = ((rec - ord) / ord) * 100;
            const absDiff = Math.abs(diffPercent);
            if (absDiff > 5) {
                return 'w-full bg-red-400 !text-black font-extrabold border border-red-500 shadow-sm rounded px-1.5 py-0.5';
            }
            if (absDiff > 0 && absDiff <= 5) {
                return 'w-full bg-amber-300 !text-black font-extrabold border border-amber-400 shadow-sm rounded px-1.5 py-0.5';
            }
            return '';
        };



        const getDaysSinceDate = (dateStr) => {
            if (!dateStr || !String(dateStr).trim()) return 0;
            const s = String(dateStr).trim();
            let y, m, d;
            if (s.includes('.')) {
                const parts = s.split('.');
                if (parts.length === 3) {
                    d = parseInt(parts[0]);
                    m = parseInt(parts[1]) - 1;
                    y = parseInt(parts[2]);
                    if (y < 100) y += 2000;
                }
            } else if (s.includes('-')) {
                const parts = s.split('-');
                if (parts.length === 3) {
                    if (parts[0].length === 4) {
                        y = parseInt(parts[0]);
                        m = parseInt(parts[1]) - 1;
                        d = parseInt(parts[2]);
                    } else {
                        d = parseInt(parts[0]);
                        m = parseInt(parts[1]) - 1;
                        y = parseInt(parts[2]);
                        if (y < 100) y += 2000;
                    }
                }
            }
            if (!y || isNaN(m) || !d) return 0;
            const sentDate = new Date(y, m, d);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            sentDate.setHours(0, 0, 0, 0);
            const diffTime = today.getTime() - sentDate.getTime();
            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
        };

        const getPpsBadgeClass = (status, dateStr) => {
            if (!status || status === '-' || status === '' || status === '0') {
                return isDarkMode.value ? 'bg-slate-800/80 text-slate-400 border-slate-700 text-left' : 'bg-slate-100 text-slate-500 border-slate-300 text-left';
            }
            const s = String(status);
            if (s.includes('Onaylandı')) {
                return isDarkMode.value ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 font-bold text-left' : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-left';
            }
            if (s.includes('Gönderildi')) {
                const daysPassed = getDaysSinceDate(dateStr);
                if (daysPassed >= 3) {
                    return 'bg-red-500/25 text-red-400 font-extrabold border border-red-500/60 shadow-sm animate-pulse text-left';
                }
                return isDarkMode.value ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 font-bold text-left' : 'bg-amber-100 text-amber-800 border-amber-300 font-bold text-left';
            }
            return isDarkMode.value ? 'bg-indigo-500/25 text-indigo-300 border-indigo-500/50 font-bold text-left' : 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold text-left';
        };


        const updatePpsStatus = async (item, newPps) => {
            const oldPps = item.pps_sent;
            item.pps_sent = newPps;
            const todayStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            if (newPps && newPps !== '') {
                item.pps_sent_date = todayStr;
            } else {
                item.pps_sent_date = null;
            }

            try {
                const res = await apiFetch('/api/styles/update-cell', {
                    method: 'POST',
                    body: JSON.stringify({
                        style_id: item.id,
                        field: 'pps_sent',
                        value: newPps,
                        reason: `PPS Aşaması: ${oldPps || 'Yok'} ➜ ${newPps || 'Temizlendi'}`
                    })
                });
                if (res && res.date_str) {
                    item.pps_sent_date = res.date_str;
                }
                item.audit_count = (item.audit_count || 0) + 1;
                loadStats();
            } catch (err) {
                console.error('PPS update error:', err);
                item.pps_sent = oldPps;
                alert('PPS güncelleme hatası: ' + err.message);
            }
        };

        // BULK SAVE (DEĞİŞİKLİKLERİ KAYDET)
        const saveAllChanges = async () => {
            try {
                const itemsToSave = styles.value.map(s => ({
                    id: s.id,
                    description: s.description,
                    fabric_order_status: s.fabric_order_status,
                    unit_price: s.unit_price,
                    status: s.status,
                    unit_meters: s.unit_meters,
                    unit_grams: s.unit_grams,
                    fabric_wastage_percent: s.fabric_wastage_percent,
                    fabric_ordered_meters: s.fabric_ordered_meters,
                    fabric_arrival_date: s.fabric_arrival_date,
                    fabric_received_meters: s.fabric_received_meters,
                    unit_meters_2: s.unit_meters_2,
                    unit_grams_2: s.unit_grams_2,
                    fabric_wastage_percent_2: s.fabric_wastage_percent_2,
                    fabric_ordered_meters_2: s.fabric_ordered_meters_2,
                    fabric_arrival_date_2: s.fabric_arrival_date_2,
                    fabric_received_meters_2: s.fabric_received_meters_2,
                    size_map: s.size_map || {},
                    custom_fields: s.custom_fields || {}
                }));

                const res = await apiFetch('/api/styles/bulk-save', {
                    method: 'POST',
                    body: JSON.stringify({ items: itemsToSave })
                });

                alert('💾 ' + res.message);
                await loadStyles();
                await loadStats();
            } catch (err) {
                alert('Kaydetme hatası: ' + err.message);
            }
        };


        // DISCARD CHANGES (KAYDETMEDEN ÇIK)
        const discardChanges = async () => {
            const ok = confirm('Kaydedilmemiş değişiklikleri iptal edip son kayıtlı verileri geri yüklemek istediğinize emin misiniz?');
            if (!ok) return;
            await loadStyles();
            alert('↩️ Değişiklikler iptal edildi ve liste yenilendi.');
        };

        // SÜTUN EKLE MODAL & HANDLERS
        const addColumnModalOpen = ref(false);
        const newColumnForm = ref({
            title: '',
            col_type: 'date',
            optionsText: ''
        });

        const getParsedOptionsPreview = () => {
            if (!newColumnForm.value.optionsText) return [];
            return newColumnForm.value.optionsText.split(',').map(s => s.trim()).filter(Boolean);
        };

        const openAddColumnModal = () => {
            newColumnForm.value = {
                title: '',
                col_type: 'date',
                optionsText: ''
            };
            addColumnModalOpen.value = true;
            refreshIcons();
        };

        const submitCreateColumn = async () => {
            if (!newColumnForm.value.title.trim()) {
                alert('Lütfen sütun başlığı giriniz.');
                return;
            }

            const options = getParsedOptionsPreview();
            const colType = newColumnForm.value.col_type;
            const colTitle = newColumnForm.value.title.trim();

            try {
                const res = await apiFetch('/api/custom-columns', {
                    method: 'POST',
                    body: JSON.stringify({
                        title: colTitle,
                        col_type: colType,
                        options: options,
                        width: colType === 'size' ? 50 : 125
                    })
                });

                if (colType === 'size') {
                    const cleanSizeName = colTitle.toUpperCase();
                    if (!availableSizes.value.includes(cleanSizeName)) {
                        availableSizes.value.push(cleanSizeName);
                        availableSizes.value = sortSizesList(availableSizes.value);
                    }
                }

                customColumnsList.value.push(res);
                addColumnModalOpen.value = false;
                
                localStorage.removeItem(getUserLayoutStorageKey());
                buildColumns(availableSizes.value, customColumnsList.value);
                
                alert(`✨ "${res.title}" sütunu başarıyla eklendi!`);
            } catch (err) {
                alert('Sütun ekleme hatası: ' + err.message);
            } finally {
                refreshIcons();
            }
        };

        // DELETE USER CREATED CUSTOM COLUMN
        const confirmDeleteCustomColumn = async (col) => {
            const ok = confirm(`"${col.title}" adlı özel sütunu ve tüm satırlardaki verilerini silmek istediğinize emin misiniz?`);
            if (!ok) return;

            try {
                if (col.id) {
                    await apiFetch(`/api/custom-columns/${col.id}`, { method: 'DELETE' });
                }
                customColumnsList.value = customColumnsList.value.filter(c => c.col_key !== col.key && c.id !== col.id);
                if (col.isSizeColumn && col.sizeName) {
                    availableSizes.value = availableSizes.value.filter(s => s !== col.sizeName);
                }
                localStorage.removeItem(getUserLayoutStorageKey());
                buildColumns(availableSizes.value, customColumnsList.value);

                alert(`🗑️ "${col.title}" sütunu silindi.`);
            } catch (err) {
                alert('Sütun silme hatası: ' + err.message);
            } finally {
                refreshIcons();
            }
        };

        // CUSTOM FIELD UPDATE
        const updateCustomFieldDirect = async (item, colKey, val) => {
            if (!item.custom_fields) item.custom_fields = {};
            item.custom_fields[colKey] = val;

            try {
                await apiFetch('/api/styles/update-custom-field', {
                    method: 'POST',
                    body: JSON.stringify({
                        style_id: item.id,
                        col_key: colKey,
                        value: val
                    })
                });
            } catch (err) {
                console.error('Custom field update error:', err);
            }
        };

        // INSTANT CUSTOM CHECKBOX TOGGLE
        const toggleCustomCheckbox = async (item, colKey) => {
            if (!item.custom_fields) item.custom_fields = {};
            const nextVal = !item.custom_fields[colKey];
            item.custom_fields[colKey] = nextVal;
            
            const todayStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            item.custom_fields[colKey + '_date'] = nextVal ? todayStr : null;

            try {
                await apiFetch('/api/styles/update-custom-field', {
                    method: 'POST',
                    body: JSON.stringify({
                        style_id: item.id,
                        col_key: colKey,
                        value: nextVal
                    })
                });
                if (nextVal) {
                    await apiFetch('/api/styles/update-custom-field', {
                        method: 'POST',
                        body: JSON.stringify({
                            style_id: item.id,
                            col_key: colKey + '_date',
                            value: todayStr
                        })
                    });
                }
            } catch (err) {
                console.error('Custom checkbox error:', err);
            }
        };

        // DRAG & DROP SÜTUN SIRALAMA MOTORU (GİZLİ/AÇIK TÜM DURUMLARLA UYUMLU)
        let draggedColKey = null;

        const onColumnDragStart = (col, e) => {
            if (!col || col.isSizesCollapsedGroup || col.isFabricCollapsedHeader) return;
            draggedColKey = col.key;
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', col.key);
            }
            if (e.currentTarget) e.currentTarget.style.opacity = '0.4';
        };

        const onColumnDragEnd = (e) => {
            if (e.currentTarget) e.currentTarget.style.opacity = '1';
            document.querySelectorAll('th.th-drag-over').forEach(el => el.classList.remove('th-drag-over'));
        };

        const onColumnDragOver = (col, e) => {
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
            const th = e.currentTarget.closest('th');
            if (th && !th.classList.contains('th-drag-over')) {
                document.querySelectorAll('th.th-drag-over').forEach(el => el.classList.remove('th-drag-over'));
                th.classList.add('th-drag-over');
            }
        };

        const onColumnDragLeave = (e) => {
            const th = e.currentTarget.closest('th');
            if (th && e.relatedTarget && !th.contains(e.relatedTarget)) {
                th.classList.remove('th-drag-over');
            }
        };


        const onColumnDrop = (targetCol, e) => {
            e.preventDefault();
            document.querySelectorAll('th.th-drag-over').forEach(el => el.classList.remove('th-drag-over'));
            if (!draggedColKey || !targetCol || targetCol.key === draggedColKey) {
                draggedColKey = null;
                return;
            }
            const srcIdx = visibleColumns.value.findIndex(c => c.key === draggedColKey);
            const dstIdx = visibleColumns.value.findIndex(c => c.key === targetCol.key);
            if (srcIdx !== -1 && dstIdx !== -1 && srcIdx !== dstIdx) {
                const [moved] = visibleColumns.value.splice(srcIdx, 1);
                visibleColumns.value.splice(dstIdx, 0, moved);
                saveColumnLayout();
            }
            draggedColKey = null;
            refreshIcons();
        };




        // COLUMN RESIZING ENGINE
        let resizingCol = null;
        let startX = 0;
        let startWidth = 0;

        const startColumnResize = (col, e) => {
            e.stopPropagation();
            e.preventDefault();
            resizingCol = col;
            startX = e.pageX;
            startWidth = col.width || 100;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            const onMouseMove = (moveEvent) => {
                if (!resizingCol) return;
                const diff = moveEvent.pageX - startX;
                const newW = Math.max(resizingCol.minWidth || 20, startWidth + diff);
                resizingCol.width = newW;
            };

            const onMouseUp = () => {
                resizingCol = null;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                saveColumnLayout();
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        };

        // GÖRSEL SÜTUNU BOYUTLANDIRMA
        const startImageColumnResize = (e) => {
            e.stopPropagation();
            e.preventDefault();
            startX = e.pageX;
            startWidth = imageColWidth.value || 68;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            const onMouseMove = (moveEvent) => {
                const diff = moveEvent.pageX - startX;
                const newW = Math.max(45, Math.min(200, startWidth + diff));
                imageColWidth.value = newW;
            };

            const onMouseUp = () => {
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                localStorage.setItem('texflow_image_width', imageColWidth.value);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        };

        const saveColumnLayout = () => {
            localStorage.setItem(getUserLayoutStorageKey(), JSON.stringify(visibleColumns.value));
        };

        const resetColumnLayout = () => {
            try {
                Object.keys(localStorage).forEach(k => {
                    if (k.startsWith('texflow_col_layout') || k.startsWith('texflow_column_layout')) {
                        localStorage.removeItem(k);
                    }
                });
            } catch (e) {}
            localStorage.removeItem('texflow_sizes_collapsed');
            localStorage.removeItem('texflow_fabric_collapsed');
            areSizesCollapsed.value = false;
            areFabricColsCollapsed.value = false;
            columnFilters.value = {};
            activeFilterDropdown.value = null;
            imageColWidth.value = 68;
            localStorage.setItem('texflow_image_width', 68);
            buildColumns(availableSizes.value, customColumnsList.value);
            alert('✨ Sütun düzeni ve süzgeçler sıfırlandı! Tüm sütunlar orijinal sırasıyla açıldı.');
            refreshIcons();
        };


        // IN-HEADER EXCEL FILTERING ENGINE
        const activeFilterDropdown = ref(null);
        const columnFilters = ref({});
        const tempColumnFilters = ref({});
        const columnFilterSearch = ref({});
        const carsafSearchQuery = ref('');

        const getStyleColumnValue = (s, colKey) => {
            if (!s) return '(Boş)';
            let v = s[colKey];
            if (colKey === 'status') {
                v = s.status || 'Planlama aşamasında';
            } else if (colKey === 'color_name') {
                v = formatColorFull(s.color_name, s.color_code);
            } else if (colKey === 'fabric_article') {
                v = getFabricDisplayTitle(s, 1) || s.fabric_article || s.fabric_type || '';
            } else if (colKey === 'fabric_article_2') {
                v = getFabricDisplayTitle(s, 2) || s.fabric_article_2 || s.fabric_type_2 || '';
            } else if (colKey === 'order_month') {
                v = getOrderMonth(s.order_date);
            } else if (colKey === 'order_year') {
                v = getOrderYear(s.order_date);
            } else if (colKey === 'delivery_month') {
                v = getDeliveryMonth(s.delivery_date);
            } else if (colKey === 'delivery_year') {
                v = getDeliveryYear(s.delivery_date);
            } else if (s.custom_fields && s.custom_fields[colKey] !== undefined && s.custom_fields[colKey] !== null) {
                v = s.custom_fields[colKey];
            }
            if (v === undefined || v === null || String(v).trim() === '') {
                return '(Boş)';
            }
            return String(v).trim();
        };

        const getAllDistinctValuesForColumn = (colKey) => {
            const rawVals = new Set();
            if (colKey === 'status') {
                allStatusStages.value.forEach(st => {
                    if (st && st.trim()) rawVals.add(st.trim());
                });
            }
            (styles.value || []).forEach(s => {
                const v = getStyleColumnValue(s, colKey);
                rawVals.add(v);
            });
            return Array.from(rawVals).sort((a, b) => {
                if (a === '(Boş)') return 1;
                if (b === '(Boş)') return -1;
                return a.localeCompare(b, 'tr', { sensitivity: 'base', numeric: true });
            });
        };

        // EXCEL TARZI AKTİF EKRANDAN KADEMELİ (CASCADING) SÜZGEÇ LİSTESİ
        const getCascadingDistinctValuesForColumn = (targetColKey) => {
            let list = styles.value || [];

            // Bu sütun dışındaki diğer AKTİF filtreleri topla
            const otherActiveKeys = Object.keys(columnFilters.value).filter(k => k !== targetColKey && isColumnFiltered(k));
            
            if (otherActiveKeys.length > 0) {
                list = list.filter(s => {
                    for (const k of otherActiveKeys) {
                        const selectedVals = columnFilters.value[k];
                        if (Array.isArray(selectedVals)) {
                            const val = getStyleColumnValue(s, k);
                            if (!selectedVals.includes(val)) {
                                return false;
                            }
                        }
                    }
                    return true;
                });
            }

            const rawVals = new Set();

            // Eğer bu sütunun kendi süzgecinde önceden seçilmiş değerler varsa onları koru
            if (columnFilters.value[targetColKey] && Array.isArray(columnFilters.value[targetColKey])) {
                columnFilters.value[targetColKey].forEach(v => {
                    if (v !== undefined && v !== null && String(v).trim() !== '') {
                        rawVals.add(String(v).trim());
                    }
                });
            }

            // Aktif ekranda kalan kayıtlardan bu sütunun değerlerini topla
            list.forEach(s => {
                const v = getStyleColumnValue(s, targetColKey);
                if (v !== undefined && v !== null && String(v).trim() !== '') {
                    rawVals.add(String(v).trim());
                }
            });

            // Özel eklenen kanalları da süzgeç listesine dahil et
            if (targetColKey === 'channel') {
                customChannels.value.forEach(c => {
                    if (c && String(c).trim() !== '') {
                        rawVals.add(String(c).trim());
                    }
                });
            }

            return Array.from(rawVals).sort((a, b) => {
                if (a === '(Boş)') return 1;
                if (b === '(Boş)') return -1;
                return a.localeCompare(b, 'tr', { sensitivity: 'base', numeric: true });
            });
        };

        const getVisibleDistinctValuesForColumn = (colKey) => {
            const all = getCascadingDistinctValuesForColumn(colKey);
            const q = (columnFilterSearch.value[colKey] || '').toLowerCase().trim();
            if (!q) return all;
            return all.filter(v => v.toLowerCase().includes(q));
        };

        const getDistinctValuesForColumn = (colKey) => {
            return getVisibleDistinctValuesForColumn(colKey);
        };

        const hasOtherActiveFilters = (targetColKey) => {
            return Object.keys(columnFilters.value).some(k => k !== targetColKey && isColumnFiltered(k));
        };

        const toggleColumnFilterDropdown = (colKey, e) => {
            if (e) e.stopPropagation();
            if (activeFilterDropdown.value === colKey) {
                cancelColumnFilter(colKey);
            } else {
                activeFilterDropdown.value = colKey;
                columnFilterSearch.value[colKey] = '';
                const availableVals = getCascadingDistinctValuesForColumn(colKey);
                if (columnFilters.value[colKey] !== undefined && columnFilters.value[colKey] !== null) {
                    tempColumnFilters.value[colKey] = [...columnFilters.value[colKey]];
                } else {
                    tempColumnFilters.value[colKey] = [...availableVals];
                }
            }
            refreshIcons();
        };

        const onColumnSearchInput = (colKey) => {
            const q = (columnFilterSearch.value[colKey] || '').toLowerCase().trim();
            const visible = getVisibleDistinctValuesForColumn(colKey);
            if (!q) {
                const allVals = getCascadingDistinctValuesForColumn(colKey);
                tempColumnFilters.value[colKey] = [...allVals];
            } else {
                // Arama yapıldığında eşleşenleri otomatik seç
                tempColumnFilters.value[colKey] = [...visible];
            }
        };

        const isValSelectedInColumn = (colKey, val) => {
            const arr = tempColumnFilters.value[colKey];
            if (arr === undefined || arr === null) return true;
            return arr.includes(val);
        };

        const toggleValSelection = (colKey, val, checked) => {
            if (!tempColumnFilters.value[colKey]) {
                tempColumnFilters.value[colKey] = [...getCascadingDistinctValuesForColumn(colKey)];
            }
            const arr = tempColumnFilters.value[colKey];
            if (checked) {
                if (!arr.includes(val)) arr.push(val);
            } else {
                tempColumnFilters.value[colKey] = arr.filter(v => v !== val);
            }
        };

        const selectAllForColumn = (colKey) => {
            const visible = getVisibleDistinctValuesForColumn(colKey);
            const current = new Set(tempColumnFilters.value[colKey] || []);
            visible.forEach(v => current.add(v));
            tempColumnFilters.value[colKey] = Array.from(current);
        };

        const clearColumnFilter = (colKey) => {
            const visible = new Set(getVisibleDistinctValuesForColumn(colKey));
            const current = tempColumnFilters.value[colKey] || [];
            tempColumnFilters.value[colKey] = current.filter(v => !visible.has(v));
        };

        const applyColumnFilter = (colKey) => {
            const availableVals = getCascadingDistinctValuesForColumn(colKey);
            const selected = tempColumnFilters.value[colKey] || [];
            
            // Eğer aktif listedeki tüm değerler seçildiyse sütun filtresini kaldır (Excel gibi)
            const allSelected = availableVals.length > 0 && availableVals.every(v => selected.includes(v));
            if (allSelected) {
                delete columnFilters.value[colKey];
            } else {
                columnFilters.value[colKey] = [...selected];
            }
            activeFilterDropdown.value = null;
            refreshIcons();
        };

        const cancelColumnFilter = (colKey) => {
            activeFilterDropdown.value = null;
            delete tempColumnFilters.value[colKey];
            refreshIcons();
        };

        const isColumnFiltered = (colKey) => {
            const arr = columnFilters.value[colKey];
            return Array.isArray(arr) && arr.length > 0;
        };

        const clearAllColumnFilters = () => {
            columnFilters.value = {};
            tempColumnFilters.value = {};
            activeFilterDropdown.value = null;
            carsafSearchQuery.value = '';
            refreshIcons();
        };

        const hasActiveColumnFilters = () => {
            return Object.keys(columnFilters.value).some(k => isColumnFiltered(k)) || !!(carsafSearchQuery.value && carsafSearchQuery.value.trim());
        };

        // FILTERED & SORTED STYLES ENGINE
        const filteredStyles = computed(() => {
            if (!styles.value || styles.value.length === 0) return [];
            
            // 0. Quick Global Search Filter Pass (Kumaş deposundaki gibi hızlı arama)
            const query = (carsafSearchQuery.value || '').trim();
            let preFiltered = styles.value;
            if (query) {
                const norm = (str) => String(str || '').replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
                const words = norm(query).split(/\s+/).filter(Boolean);
                preFiltered = preFiltered.filter(s => {
                    const rowTokens = norm([
                        s.customer_name,
                        s.style_no,
                        s.model_no,
                        s.brand,
                        s.season,
                        s.description,
                        s.channel,
                        s.po_number,
                        s.po_no,
                        s.color_name,
                        s.color_code,
                        s.status,
                        s.notes,
                        s.process_notes,
                        s.fabric_article,
                        s.fabric_article_2,
                        s.fabric_supplier,
                        s.fabric_supplier_2,
                        s.fabric_name,
                        s.fabric_code,
                        s.order_date,
                        s.delivery_date,
                        ...(s.fabrics ? s.fabrics.map(f => `${f.fabric_name || ''} ${f.fabric_code || ''} ${f.supplier_name || ''} ${f.color_name || ''}`) : []),
                        ...(s.custom_fields ? Object.values(s.custom_fields).map(v => String(v || '')) : [])
                    ].filter(Boolean).join(' '));

                    return words.every(w => rowTokens.includes(w));
                });
            }

            // 1. Column Filter Pass
            let result = preFiltered.filter(s => {
                for (const colKey of Object.keys(columnFilters.value)) {
                    if (!isColumnFiltered(colKey)) continue;
                    const selectedVals = columnFilters.value[colKey];
                    if (selectedVals.length === 0) {
                        return false;
                    }
                    const rowVal = getStyleColumnValue(s, colKey);
                    if (!selectedVals.includes(rowVal)) {
                        return false;
                    }
                }
                return true;
            });


            // 2. Sorting Pass
            if (sortColumn.value) {
                const key = sortColumn.value;
                const dir = sortDirection.value === 'desc' ? -1 : 1;

                result = [...result].sort((a, b) => {
                    let valA = a[key];
                    let valB = b[key];

                    if (key === 'color_name') {
                        valA = formatColorFull(a.color_name, a.color_code);
                        valB = formatColorFull(b.color_name, b.color_code);
                    } else if (key.startsWith('size_')) {
                        const szName = key.replace('size_', '');
                        valA = (a.size_map && a.size_map[szName]) || 0;
                        valB = (b.size_map && b.size_map[szName]) || 0;
                    } else if (key === 'order_month') {
                        valA = parseDateToObj(a.order_date) ? parseDateToObj(a.order_date).getMonth() : 0;
                        valB = parseDateToObj(b.order_date) ? parseDateToObj(b.order_date).getMonth() : 0;
                    } else if (key === 'order_year') {
                        valA = parseDateToObj(a.order_date) ? parseDateToObj(a.order_date).getFullYear() : 0;
                        valB = parseDateToObj(b.order_date) ? parseDateToObj(b.order_date).getFullYear() : 0;
                    } else if (key === 'delivery_month') {
                        valA = parseDateToObj(a.delivery_date) ? parseDateToObj(a.delivery_date).getMonth() : 0;
                        valB = parseDateToObj(b.delivery_date) ? parseDateToObj(b.delivery_date).getMonth() : 0;
                    } else if (key === 'delivery_year') {
                        valA = parseDateToObj(a.delivery_date) ? parseDateToObj(a.delivery_date).getFullYear() : 0;
                        valB = parseDateToObj(b.delivery_date) ? parseDateToObj(b.delivery_date).getFullYear() : 0;
                    } else if (key === 'order_date' || key === 'delivery_date') {
                        valA = parseDateToObj(a[key]) ? parseDateToObj(a[key]).getTime() : 0;
                        valB = parseDateToObj(b[key]) ? parseDateToObj(b[key]).getTime() : 0;
                    } else if (a.custom_fields && a.custom_fields[key] !== undefined) {
                        valA = a.custom_fields[key];
                        valB = (b.custom_fields && b.custom_fields[key] !== undefined) ? b.custom_fields[key] : '';
                    }

                    if (typeof valA === 'number' && typeof valB === 'number') {
                        return (valA - valB) * dir;
                    }

                    const strA = String(valA || '');
                    const strB = String(valB || '');
                    return strA.localeCompare(strB, 'tr-TR', { numeric: true, sensitivity: 'base' }) * dir;
                });
            }

            return result;
        });

        // SÜZÜLEN SİPARİŞLERİN BEDEN VE GENEL TOPLAMLARI
        const filteredTotals = computed(() => {
            const list = filteredStyles.value || [];
            let totalQty = 0;
            let cutTotalQty = 0;
            let shippedTotalQty = 0;
            const sizeSums = {};
            let fabricM1 = 0;
            let fabricKg1 = 0;
            let fabricM2 = 0;
            let fabricKg2 = 0;

            list.forEach(item => {
                const qty = parseInt(item.total_quantity || 0) || 0;
                totalQty += qty;
                cutTotalQty += parseInt(item.cut_total_quantity || 0) || 0;
                shippedTotalQty += parseInt(item.shipped_total_quantity || 0) || 0;

                // Sizes
                if (item.size_map && typeof item.size_map === 'object') {
                    for (const [sz, val] of Object.entries(item.size_map)) {
                        const sNum = parseInt(val || 0) || 0;
                        sizeSums[sz] = (sizeSums[sz] || 0) + sNum;
                    }
                }

                // Fabric 1
                const calc1 = calculateFabricOrder(item, 1);
                const val1 = parseFloat(item.fabric_ordered_meters || calc1.value || 0) || 0;
                const unit1 = item.fabric_order_unit || calc1.unit || 'M';
                if (unit1 === 'KG') {
                    fabricKg1 += val1;
                } else {
                    fabricM1 += val1;
                }

                // Fabric 2
                const calc2 = calculateFabricOrder(item, 2);
                const val2 = parseFloat(item.fabric_ordered_meters_2 || calc2.value || 0) || 0;
                const unit2 = item.fabric_order_unit_2 || calc2.unit || 'M';
                if (unit2 === 'KG') {
                    fabricKg2 += val2;
                } else {
                    fabricM2 += val2;
                }
            });

            // Format Fabric 1
            const f1Parts = [];
            if (fabricM1 > 0) f1Parts.push(`${Math.round(fabricM1 * 10) / 10} M`);
            if (fabricKg1 > 0) f1Parts.push(`${Math.round(fabricKg1 * 10) / 10} KG`);

            // Format Fabric 2
            const f2Parts = [];
            if (fabricM2 > 0) f2Parts.push(`${Math.round(fabricM2 * 10) / 10} M`);
            if (fabricKg2 > 0) f2Parts.push(`${Math.round(fabricKg2 * 10) / 10} KG`);

            return {
                totalQuantity: totalQty,
                cutTotalQuantity: cutTotalQty,
                shippedTotalQuantity: shippedTotalQty,
                sizes: sizeSums,
                fabric1TotalStr: f1Parts.join(' + ') || '-',
                fabric2TotalStr: f2Parts.join(' + ') || '-',
                count: list.length
            };
        });


        window.addEventListener('click', () => {
            if (activeFilterDropdown.value) {
                activeFilterDropdown.value = null;
            }
        });


        // DIRECT CELL DRAG & DROP IMAGE UPLOAD
        const handleDirectImageDrop = async (style, e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
            
            const file = e.dataTransfer.files[0];
            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await apiFetch(`/api/styles/${style.id}/image?slot=1`, {
                    method: 'POST',
                    body: formData
                });
                style.image_url = res.image_url;
                alert(`✅ Model ${style.style_no} için fotoğraf başarıyla yüklendi!`);
            } catch (err) {
                alert('Görsel yükleme hatası: ' + err.message);
            }
        };

        // DUAL IMAGE MODAL & HANDLERS
        const imageModalOpen = ref(false);
        const activeImageSlot = ref(1);

        const openImageModal = (style) => {
            selectedStyle.value = style;
            activeImageSlot.value = 1;
            imageModalOpen.value = true;
            refreshIcons();
        };

        const uploadStyleImageBlob = async (targetStyle, blob, slot = 1) => {
            if (!targetStyle || !blob) return;
            const ext = (blob.type && blob.type.includes('jpeg')) ? 'jpg' : 'png';
            const file = (blob instanceof File) ? blob : new File([blob], `screenshot_${Date.now()}.${ext}`, { type: blob.type || 'image/png' });
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const res = await apiFetch(`/api/styles/${targetStyle.id}/image?slot=${slot}`, {
                    method: 'POST',
                    body: formData
                });
                if (slot === 2) {
                    targetStyle.image_url_2 = res.image_url;
                    if (selectedStyle.value && selectedStyle.value.id === targetStyle.id) {
                        selectedStyle.value.image_url_2 = res.image_url;
                    }
                } else {
                    targetStyle.image_url = res.image_url;
                    if (selectedStyle.value && selectedStyle.value.id === targetStyle.id) {
                        selectedStyle.value.image_url = res.image_url;
                    }
                }
                await loadStyles();
                refreshIcons();
                alert(`✅ ${slot}. Fotoğraf ekran görüntüsünden / panodan başarıyla yapıştırıldı!`);
            } catch (err) {
                alert('Görsel yapıştırma hatası: ' + err.message);
            }
        };

        const pasteStyleImageSlot = async (slot = 1) => {
            activeImageSlot.value = slot;
            if (!selectedStyle.value) return;

            try {
                if (navigator.clipboard && navigator.clipboard.read) {
                    const items = await navigator.clipboard.read();
                    for (const item of items) {
                        const imageType = item.types.find(type => type.startsWith('image/'));
                        if (imageType) {
                            const blob = await item.getType(imageType);
                            await uploadStyleImageBlob(selectedStyle.value, blob, slot);
                            return;
                        }
                    }
                    alert('Panoda herhangi bir ekran görüntüsü veya resim bulunamadı.\n\nİpucu: Windows tuşu + Shift + S (veya PrtScn) ile ekran görüntüsü aldıktan sonra "Yapıştır" butonuna tıklayınız.');
                    return;
                }
            } catch (err) {
                console.warn('Clipboard read permission/API error:', err);
            }

            alert('Panoya doğrudan erişim izni alınamadı. Lütfen ekran görüntüsü aldıktan sonra bu pencere üzerindeyken klavyeden Ctrl + V tuşlarına basarak yapıştırınız.');
        };

        const handleGlobalPaste = async (e) => {
            const activeEl = document.activeElement;
            const isTextInput = activeEl && (
                activeEl.tagName === 'INPUT' || 
                activeEl.tagName === 'TEXTAREA' || 
                activeEl.isContentEditable
            );
            
            const clipboardData = e.clipboardData || window.clipboardData;
            if (!clipboardData || !clipboardData.items) return;

            let imageFile = null;
            for (let i = 0; i < clipboardData.items.length; i++) {
                const item = clipboardData.items[i];
                if (item.type.indexOf('image') !== -1) {
                    imageFile = item.getAsFile();
                    break;
                }
            }

            if (!imageFile) return;

            // 1. Durum: Model Fotoğrafı Modalı açıkken yapıştırma
            if (imageModalOpen.value && selectedStyle.value) {
                e.preventDefault();
                const slot = activeImageSlot.value || 1;
                await uploadStyleImageBlob(selectedStyle.value, imageFile, slot);
                return;
            }

            // 2. Durum: Çarşaf listesinde bir satır seçiliyken ve bir metin kutusuna yazmıyorken yapıştırma
            if (!isTextInput && selectedStyle.value && activeTab.value === 'carsaf') {
                e.preventDefault();
                const styleName = `${selectedStyle.value.style_no || 'Model'} (${selectedStyle.value.color_name || ''})`;
                const ok = confirm(`Panodaki ekran görüntüsü "${styleName}" modeli için 1. Ana Fotoğraf olarak yapılsın mı?`);
                if (ok) {
                    await uploadStyleImageBlob(selectedStyle.value, imageFile, 1);
                }
            }
        };

        const uploadStyleImageSlot = async (e, slot) => {
            if (!e.target.files || e.target.files.length === 0 || !selectedStyle.value) return;
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const res = await apiFetch(`/api/styles/${selectedStyle.value.id}/image?slot=${slot}`, {
                    method: 'POST',
                    body: formData
                });
                if (slot === 2) {
                    selectedStyle.value.image_url_2 = res.image_url;
                } else {
                    selectedStyle.value.image_url = res.image_url;
                }
                await loadStyles();
                alert(`✅ ${slot}. Fotoğraf başarıyla yüklendi!`);
            } catch (err) {
                alert('Görsel yükleme hatası: ' + err.message);
            }
        };

        const deleteStyleImageSlot = async (slot) => {
            if (!selectedStyle.value) return;
            const ok = confirm(`${slot}. Fotoğrafı silmek istediğinize emin misiniz?`);
            if (!ok) return;

            try {
                await apiFetch(`/api/styles/${selectedStyle.value.id}/image/${slot}`, {
                    method: 'DELETE'
                });
                if (slot === 2) {
                    selectedStyle.value.image_url_2 = null;
                } else {
                    selectedStyle.value.image_url = null;
                }
                await loadStyles();
                alert(`🗑️ ${slot}. Fotoğraf silindi.`);
            } catch (err) {
                alert('Silme hatası: ' + err.message);
            }
        };

        const swapStyleImagesSlot = async () => {
            if (!selectedStyle.value) return;
            try {
                const res = await apiFetch(`/api/styles/${selectedStyle.value.id}/swap-images`, {
                    method: 'POST'
                });
                selectedStyle.value.image_url = res.image_url;
                selectedStyle.value.image_url_2 = res.image_url_2;
                await loadStyles();
                alert('✅ Fotoğraflar yer değiştirdi! 1. Fotoğraf artık ana görsel olarak çarşafta gösteriliyor.');
            } catch (err) {
                alert('Görsel değiştirme hatası: ' + err.message);
            }
        };


        // DELETE STYLE ACTION
        
        // ORDER MANAGEMENT & PERMANENT DELETION
        const manageOrdersModalOpen = ref(false);
        const allOrdersList = ref([]);
        const allOrdersLoading = ref(false);
        const orderSearchQuery = ref('');
        const selectedOrderIds = ref([]);

        const openManageOrdersModal = async () => {
            manageOrdersModalOpen.value = true;
            selectedOrderIds.value = [];
            orderSearchQuery.value = '';
            await loadAllOrdersList();
            refreshIcons();
        };

        const loadAllOrdersList = async () => {
            allOrdersLoading.value = true;
            try {
                const res = await apiFetch('/api/orders/list');
                allOrdersList.value = res || [];
            } catch (err) {
                alert('Sipariş listesi yüklenemedi: ' + err.message);
            } finally {
                allOrdersLoading.value = false;
                refreshIcons();
            }
        };

        const expandedOrderIds = ref([]);
        const toggleOrderExpand = (orderId) => {
            const idx = expandedOrderIds.value.indexOf(orderId);
            if (idx > -1) {
                expandedOrderIds.value.splice(idx, 1);
            } else {
                expandedOrderIds.value.push(orderId);
            }
            refreshIcons();
        };
        const isOrderExpanded = (orderId) => {
            return expandedOrderIds.value.includes(orderId) || (orderSearchQuery.value && orderSearchQuery.value.trim().length > 0);
        };

        const filteredOrdersList = computed(() => {
            const q = (orderSearchQuery.value || '').toLowerCase().trim();
            if (!q) return allOrdersList.value;
            return allOrdersList.value.filter(o => {
                const matchPo = o.po_number && o.po_number.toLowerCase().includes(q);
                const matchCust = o.customer_name && o.customer_name.toLowerCase().includes(q);
                const matchBrand = o.brand && o.brand.toLowerCase().includes(q);
                const matchSeason = o.season && o.season.toLowerCase().includes(q);
                const matchStyleNames = o.style_names && o.style_names.toLowerCase().includes(q);
                const matchColorNames = o.color_names && o.color_names.toLowerCase().includes(q);
                const matchStyles = (o.styles || []).some(s => 
                    (s.style_no && String(s.style_no).toLowerCase().includes(q)) ||
                    (s.color_code && String(s.color_code).toLowerCase().includes(q)) ||
                    (s.color_name && String(s.color_name).toLowerCase().includes(q)) ||
                    (s.description && String(s.description).toLowerCase().includes(q))
                );
                return matchPo || matchCust || matchBrand || matchSeason || matchStyleNames || matchColorNames || matchStyles;
            });
        });

        const toggleSelectAllOrders = () => {
            if (selectedOrderIds.value.length === filteredOrdersList.value.length) {
                selectedOrderIds.value = [];
            } else {
                selectedOrderIds.value = filteredOrdersList.value.map(o => o.id);
            }
        };

        const confirmDeleteColorFromOrder = async (ord, style) => {
            const colorDesc = style.color_name || style.color_code || 'Belirtilmemiş Renk';
            const ok = confirm(`❓ "${ord.po_number}" siparişine ait Model ${style.style_no} (${colorDesc} - ${style.total_quantity || 0} Adet) varyantını KALICI OLARAK silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz.`);
            if (!ok) return;

            try {
                const res = await apiFetch(`/api/styles/${style.id}`, {
                    method: 'DELETE'
                });
                alert(`🗑️ "${style.style_no} - ${colorDesc}" rengi kalıcı olarak silindi.`);
                await loadAllOrdersList();
                await loadStyles();
                await loadStats();
            } catch (err) {
                alert('Renk silme hatası: ' + err.message);
            }
        };

        const confirmDeleteSingleOrder = async (ord) => {
            const ok = confirm(`"${ord.po_number}" numaralı (${ord.customer_name} - ${ord.styles_count || 0} Model) siparişi ve tüm modellerini KALICI OLARAK silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz.`);
            if (!ok) return;

            try {
                await apiFetch(`/api/orders/${ord.id}`, { method: 'DELETE' });
                alert(`🗑️ "${ord.po_number}" siparişi başarıyla kalıcı olarak silindi.`);
                await loadAllOrdersList();
                await loadStyles();
            } catch (err) {
                alert('Sipariş silme hatası: ' + err.message);
            }
        };

        const confirmBulkDeleteOrders = async () => {
            if (selectedOrderIds.value.length === 0) return;
            const ok = confirm(`Seçilen ${selectedOrderIds.value.length} adet siparişi ve bunlara ait tüm modelleri KALICI OLARAK silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz.`);
            if (!ok) return;

            try {
                await apiFetch('/api/orders/bulk-delete', {
                    method: 'POST',
                    body: JSON.stringify({ order_ids: selectedOrderIds.value })
                });
                alert(`🗑️ Seçilen ${selectedOrderIds.value.length} sipariş kalıcı olarak silindi.`);
                selectedOrderIds.value = [];
                await loadAllOrdersList();
                await loadStyles();
            } catch (err) {
                alert('Toplu silme hatası: ' + err.message);
            }
        };

        const confirmDeleteStyle = async (style) => {
            const ok = confirm(`❓ "${style.po_number}" numaralı PO'ya ait Style ${style.style_no} (${style.color_name}) modelini silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz.`);
            if (!ok) return;

            try {
                const res = await apiFetch(`/api/styles/${style.id}`, {
                    method: 'DELETE'
                });
                alert('🗑️ ' + res.message);
                await loadStyles();
                await loadStats();
            } catch (err) {
                alert('Silme hatası: ' + err.message);
            }
        };

        // Modals & States
        const dragOver = ref(false);
        const uploadLoading = ref(false);
        const parsedPreview = ref(null);
        const importing = ref(false);

        const fabricsList = ref([]);
        const fabricSearch = ref('');
        const fabricAssignModalOpen = ref(false);
        const formatNumericDimension = (val) => {
            if (!val) return '-';
            const s = String(val).trim();
            const match = s.match(/^(\d+(?:[.,]\d+)?(?:[-/]\d+(?:[.,]\d+)?)?)/);
            if (match) return match[1];
            return s;
        };

        const fabricViewMode = ref(localStorage.getItem('texflow_fabric_view_mode') || 'cards');
        const setFabricViewMode = (mode) => {
            fabricViewMode.value = mode;
            localStorage.setItem('texflow_fabric_view_mode', mode);
            refreshIcons();
        };

        // ============================================================
        // KUMAŞ DEPOSU DİNAMİK SÜTUN & SÜRÜKLE-BIRAK (DRAG & DROP) MOTORU
        // ============================================================
        const defaultFabricColumns = [
            { key: 'internal_code', title: 'İç Kod', width: 110, minWidth: 70, align: 'left' },
            { key: 'company_name', title: 'Firma / Kumaşçı', width: 160, minWidth: 100, align: 'left' },
            { key: 'quality_code', title: 'Kalite Kodu', width: 120, minWidth: 80, align: 'left' },
            { key: 'quality_name', title: 'Kalite Adı', width: 140, minWidth: 80, align: 'left' },
            { key: 'design_code', title: 'Desen Kodu', width: 110, minWidth: 80, align: 'left' },
            { key: 'color', title: 'Renk Kodu', width: 110, minWidth: 80, align: 'left' },
            { key: 'composition', title: 'Karışım / Kompozisyon', width: 170, minWidth: 100, align: 'left' },
            { key: 'width', title: 'En', width: 80, minWidth: 50, align: 'center' },
            { key: 'weight', title: 'Gramaj', width: 85, minWidth: 50, align: 'center' },
            { key: 'stock', title: 'Stok (Kalan)', width: 125, minWidth: 80, align: 'center' },
            { key: 'received_meters', title: 'Gelen Kumaş', width: 150, minWidth: 100, align: 'center' },
            { key: 'ledger', title: 'Stok Hareketleri', width: 140, minWidth: 90, align: 'center' },
            { key: 'barcode_or_qr', title: 'Barkod / QR', width: 120, minWidth: 70, align: 'left' },
            { key: 'actions', title: 'İşlem', width: 110, minWidth: 70, align: 'center' }
        ];

        const loadSavedFabricColumns = () => {
            try {
                const saved = localStorage.getItem('texflow_fabric_table_columns');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const result = [];
                        parsed.forEach(p => {
                            const def = defaultFabricColumns.find(d => d.key === p.key);
                            if (def) {
                                result.push({
                                    ...def,
                                    width: p.width || def.width
                                });
                            }
                        });
                        // Add any missing default columns
                        defaultFabricColumns.forEach(def => {
                            if (!result.find(r => r.key === def.key)) {
                                result.push({ ...def });
                            }
                        });
                        return result;
                    }
                }
            } catch (e) {
                console.error('Error loading fabric columns layout:', e);
            }
            return JSON.parse(JSON.stringify(defaultFabricColumns));
        };

        const fabricTableColumns = ref(loadSavedFabricColumns());

        const saveFabricColumnsLayout = () => {
            try {
                const layout = fabricTableColumns.value.map(c => ({ key: c.key, width: c.width }));
                localStorage.setItem('texflow_fabric_table_columns', JSON.stringify(layout));
            } catch (e) {
                console.error('Error saving fabric columns layout:', e);
            }
        };

        const resetFabricColumnsLayout = () => {
            localStorage.removeItem('texflow_fabric_table_columns');
            fabricTableColumns.value = JSON.parse(JSON.stringify(defaultFabricColumns));
            nextTick(() => refreshIcons());
        };

        let draggedFabricColKey = null;

        const onFabricColDragStart = (col, e) => {
            if (!col) return;
            draggedFabricColKey = col.key;
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', col.key);
            }
            if (e.currentTarget) e.currentTarget.style.opacity = '0.4';
        };

        const onFabricColDragEnd = (e) => {
            if (e.currentTarget) e.currentTarget.style.opacity = '1';
            document.querySelectorAll('th.th-drag-over').forEach(el => el.classList.remove('th-drag-over'));
        };

        const onFabricColDragOver = (col, e) => {
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
            const th = e.currentTarget.closest('th');
            if (th && !th.classList.contains('th-drag-over')) {
                document.querySelectorAll('th.th-drag-over').forEach(el => el.classList.remove('th-drag-over'));
                th.classList.add('th-drag-over');
            }
        };

        const onFabricColDragLeave = (e) => {
            const th = e.currentTarget.closest('th');
            if (th && e.relatedTarget && !th.contains(e.relatedTarget)) {
                th.classList.remove('th-drag-over');
            }
        };

        const onFabricColDrop = (targetCol, e) => {
            e.preventDefault();
            document.querySelectorAll('th.th-drag-over').forEach(el => el.classList.remove('th-drag-over'));
            if (!draggedFabricColKey || !targetCol || targetCol.key === draggedFabricColKey) {
                draggedFabricColKey = null;
                return;
            }
            const srcIdx = fabricTableColumns.value.findIndex(c => c.key === draggedFabricColKey);
            const dstIdx = fabricTableColumns.value.findIndex(c => c.key === targetCol.key);
            if (srcIdx !== -1 && dstIdx !== -1 && srcIdx !== dstIdx) {
                const [moved] = fabricTableColumns.value.splice(srcIdx, 1);
                fabricTableColumns.value.splice(dstIdx, 0, moved);
                saveFabricColumnsLayout();
            }
            draggedFabricColKey = null;
            nextTick(() => refreshIcons());
        };

        let resizingFabricCol = null;
        let startFabricX = 0;
        let startFabricWidth = 0;

        const startFabricColResize = (col, e) => {
            e.stopPropagation();
            e.preventDefault();
            resizingFabricCol = col;
            startFabricX = e.pageX;
            startFabricWidth = col.width || 100;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            const onMouseMove = (moveEvent) => {
                if (!resizingFabricCol) return;
                const diff = moveEvent.pageX - startFabricX;
                const newW = Math.max(resizingFabricCol.minWidth || 40, startFabricWidth + diff);
                resizingFabricCol.width = newW;
            };

            const onMouseUp = () => {
                resizingFabricCol = null;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                saveFabricColumnsLayout();
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        };

        // ============================================================
        // KUMAŞ BİLGİ FORMU MOTORU (FABRIC INFORMATION FORM ENGINE)
        // ============================================================
        const kumasBilgiModalOpen = ref(false);
        const kumasBilgiFabric = ref(null);
        const kumasBilgiCustomer = ref('');
        const kumasBilgiSeason = ref('');
        const kumasBilgiTitle = ref('');
        const kumasBilgiQualityName = ref('');
        const kumasBilgiQualityCode = ref('');
        const kumasBilgiVariants = ref('');
        const kumasBilgiUnitType = ref('MT');
        const kumasBilgiWastePercent = ref(5);
        const kumasBilgiGelenKumas = ref('');
        const kumasBilgiRows = ref([]);
        const kumasBilgiTotals = ref({ totalQuantity: 0, totalNet: 0, totalCalculated: 0, totalReceived: 0, bakiye: 0 });

        const kumasBilgiOrientation = ref(localStorage.getItem('kumas_bilgi_orientation') || 'landscape');
        const kumasBilgiRowHeight = ref(parseInt(localStorage.getItem('kumas_bilgi_row_height')) || 80);

        const defaultKumasBilgiColWidthsLandscape = {
            image: 110,
            style: 125,
            color: 145,
            fabric: 270,
            quantity: 90,
            unit: 90,
            net: 100,
            calculated: 110
        };

        const defaultKumasBilgiColWidthsPortrait = {
            image: 85,
            style: 95,
            color: 105,
            fabric: 180,
            quantity: 65,
            unit: 65,
            net: 70,
            calculated: 75
        };

        const getDefaultKumasBilgiColWidths = (ori = kumasBilgiOrientation.value) => {
            return ori === 'portrait' ? Object.assign({}, defaultKumasBilgiColWidthsPortrait) : Object.assign({}, defaultKumasBilgiColWidthsLandscape);
        };

        const loadSavedKumasBilgiColWidths = () => {
            try {
                const ori = localStorage.getItem('kumas_bilgi_orientation') || 'landscape';
                const saved = localStorage.getItem('kumas_bilgi_col_widths_px_' + ori);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed && typeof parsed.image === 'number') {
                        return Object.assign({}, getDefaultKumasBilgiColWidths(ori), parsed);
                    }
                }
            } catch (e) {}
            return getDefaultKumasBilgiColWidths();
        };

        const kumasBilgiColWidths = ref(loadSavedKumasBilgiColWidths());

        const totalKumasBilgiTableWidth = computed(() => {
            return Object.values(kumasBilgiColWidths.value).reduce((a, b) => a + (parseFloat(b) || 0), 0);
        });

        const setKumasBilgiRowHeight = (h) => {
            kumasBilgiRowHeight.value = parseInt(h);
            localStorage.setItem('kumas_bilgi_row_height', h);
        };

        const setKumasBilgiOrientation = (ori) => {
            kumasBilgiOrientation.value = ori;
            localStorage.setItem('kumas_bilgi_orientation', ori);
            const saved = localStorage.getItem('kumas_bilgi_col_widths_px_' + ori);
            if (saved) {
                try {
                    kumasBilgiColWidths.value = Object.assign({}, getDefaultKumasBilgiColWidths(ori), JSON.parse(saved));
                } catch (e) {
                    fitKumasBilgiToWidth();
                }
            } else {
                fitKumasBilgiToWidth();
            }
        };

        const resetKumasBilgiColWidths = () => {
            const ori = kumasBilgiOrientation.value || 'landscape';
            kumasBilgiColWidths.value = getDefaultKumasBilgiColWidths(ori);
            localStorage.removeItem('kumas_bilgi_col_widths_px_' + ori);
            showToast('Sütun genişlikleri varsayılan oranlara sıfırlandı', 'info');
        };

        const fitKumasBilgiToWidth = () => {
            const ori = kumasBilgiOrientation.value || 'landscape';
            const targetWidth = ori === 'portrait' ? 740 : 1040;

            const keys = ['image', 'style', 'color', 'fabric', 'quantity', 'unit', 'net', 'calculated'];
            const currentSum = keys.reduce((acc, k) => acc + (parseFloat(kumasBilgiColWidths.value[k]) || 100), 0);

            if (currentSum > 0) {
                const ratio = targetWidth / currentSum;
                let runningTotal = 0;
                const newWidths = {};
                keys.forEach((k, idx) => {
                    if (idx === keys.length - 1) {
                        newWidths[k] = Math.max(45, targetWidth - runningTotal);
                    } else {
                        const scaled = Math.round((kumasBilgiColWidths.value[k] || 100) * ratio);
                        const clamped = Math.max(k === 'image' ? 75 : 40, scaled);
                        newWidths[k] = clamped;
                        runningTotal += clamped;
                    }
                });
                kumasBilgiColWidths.value = newWidths;
            } else {
                kumasBilgiColWidths.value = getDefaultKumasBilgiColWidths(ori);
            }

            if (ori === 'portrait') {
                kumasBilgiRowHeight.value = 65;
            } else {
                kumasBilgiRowHeight.value = 85;
            }

            localStorage.setItem('kumas_bilgi_col_widths_px_' + ori, JSON.stringify(kumasBilgiColWidths.value));
            localStorage.setItem('kumas_bilgi_row_height', kumasBilgiRowHeight.value);
            showToast('Tablo ' + (ori === 'portrait' ? 'A4 Dikey' : 'A4 Yatay') + ' sayfasına oranlanarak tam sığdırıldı', 'success');
        };

        const adjustKumasBilgiColWidth = (colKey, delta) => {
            const cur = kumasBilgiColWidths.value[colKey] || 100;
            const nextVal = Math.max(colKey === 'image' ? 60 : 35, cur + delta);
            kumasBilgiColWidths.value[colKey] = nextVal;
            localStorage.setItem('kumas_bilgi_col_widths_px_' + kumasBilgiOrientation.value, JSON.stringify(kumasBilgiColWidths.value));
        };

        const startKumasBilgiColResize = (colKey, e) => {
            e.stopPropagation();
            e.preventDefault();

            const startX = e.pageX;
            const initialWidth = kumasBilgiColWidths.value[colKey] || 100;

            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            const onMouseMove = (moveEvent) => {
                const diffPx = moveEvent.pageX - startX;
                const minW = colKey === 'image' ? 60 : 35;
                const newWidth = Math.max(minW, initialWidth + diffPx);
                kumasBilgiColWidths.value[colKey] = newWidth;
            };

            const onMouseUp = () => {
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                localStorage.setItem('kumas_bilgi_col_widths_px_' + kumasBilgiOrientation.value, JSON.stringify(kumasBilgiColWidths.value));
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        };

        const formatUnitVal2Decimals = (val) => {
            if (val === null || val === undefined || val === '') return '0,00';
            const num = parseFloat(String(val).replace(',', '.'));
            if (isNaN(num)) return '0,00';
            return num.toFixed(2).replace('.', ',');
        };

        const isInvalidOrKodsuz = (val) => {
            if (!val) return true;
            const v = String(val).trim().toUpperCase();
            if (v === '' || v === '-' || v === '--' || v === 'YOK' || v === 'NONE' || v === 'NULL' || v === 'ART' || v === 'ART -' || v === 'TANIMSIZ' || v === 'BELİRTİLMEMİŞ' || v === 'BELIRTILMEMIS') return true;
            if (v.includes('KODSUZ') || v.includes('İSİMSİZ') || v.includes('ISIMSIZ')) return true;
            return false;
        };

        const getFabricCardSubtitle = (f) => {
            if (!f) return '';
            const qName = (!f.quality_name || isInvalidOrKodsuz(f.quality_name)) ? '' : String(f.quality_name).trim();
            const qCode = (!f.quality_code || isInvalidOrKodsuz(f.quality_code)) ? '' : String(f.quality_code).trim();

            if (qName) return qName;
            if (qCode) return qCode;
            return '';
        };

        const getFabricColorVariant = (f) => {
            if (!f) return '';
            if (f.design_code && !isInvalidOrKodsuz(f.design_code)) {
                return String(f.design_code).trim();
            }
            if (styles.value && styles.value.length > 0) {
                const fabId = f.id;
                const intCode = (f.internal_code || '').trim().toUpperCase();
                for (let i = 0; i < styles.value.length; i++) {
                    const s = styles.value[i];
                    let isMatch = false;
                    if (fabId) {
                        if (s.fabric_link && s.fabric_link.fabrictag_id == fabId) isMatch = true;
                        if (!isMatch && s.fabric_link_2 && s.fabric_link_2.fabrictag_id == fabId) isMatch = true;
                    }
                    if (!isMatch && intCode) {
                        const fa1 = (s.fabric_article || s.fabric_type || '').toUpperCase();
                        const fa2 = (s.fabric_article_2 || s.fabric_type_2 || '').toUpperCase();
                        if (fa1.includes(intCode) || fa2.includes(intCode)) isMatch = true;
                    }
                    if (isMatch) {
                        if (s.fabric_variant_1 && !isInvalidOrKodsuz(s.fabric_variant_1)) return String(s.fabric_variant_1).trim();
                        if (s.fabric_variant_2 && !isInvalidOrKodsuz(s.fabric_variant_2)) return String(s.fabric_variant_2).trim();
                        if (s.color_name && !isInvalidOrKodsuz(s.color_name)) return String(s.color_name).trim();
                    }
                }
            }
            return '';
        };

        const getFabricColorCode = (f) => {
            if (!f) return '';
            if (f.color && !isInvalidOrKodsuz(f.color)) {
                return String(f.color).trim();
            }
            if (styles.value && styles.value.length > 0) {
                const fabId = f.id;
                const intCode = (f.internal_code || '').trim().toUpperCase();
                for (let i = 0; i < styles.value.length; i++) {
                    const s = styles.value[i];
                    let isMatch = false;
                    if (fabId) {
                        if (s.fabric_link && s.fabric_link.fabrictag_id == fabId) isMatch = true;
                        if (!isMatch && s.fabric_link_2 && s.fabric_link_2.fabrictag_id == fabId) isMatch = true;
                    }
                    if (!isMatch && intCode) {
                        const fa1 = (s.fabric_article || s.fabric_type || '').toUpperCase();
                        const fa2 = (s.fabric_article_2 || s.fabric_type_2 || '').toUpperCase();
                        if (fa1.includes(intCode) || fa2.includes(intCode)) isMatch = true;
                    }
                    if (isMatch) {
                        if (s.fabric_color_1 && !isInvalidOrKodsuz(s.fabric_color_1)) return String(s.fabric_color_1).trim();
                        if (s.fabric_color_2 && !isInvalidOrKodsuz(s.fabric_color_2)) return String(s.fabric_color_2).trim();
                    }
                }
            }
            return '';
        };

        const getKumasBilgiQualityDisplay = (fabric) => {
            if (!fabric) return '';
            const qCodeValid = !isInvalidOrKodsuz(fabric.quality_code);
            const qNameValid = !isInvalidOrKodsuz(fabric.quality_name);

            let qCodeClean = '';
            if (qCodeValid) {
                const rawCode = String(fabric.quality_code).trim();
                qCodeClean = rawCode.toUpperCase().startsWith('ART') ? rawCode : ('ART ' + rawCode);
            }

            const qNameClean = qNameValid ? String(fabric.quality_name).trim() : '';
            const internalCode = fabric.internal_code ? String(fabric.internal_code).trim() : '';

            const titleParts = [];
            if (qCodeClean) titleParts.push(qCodeClean);
            if (qNameClean) titleParts.push(qNameClean);

            let result = titleParts.join(' - ');
            if (internalCode) {
                result = result ? `${result} (${internalCode})` : `(${internalCode})`;
            }
            return result;
        };

        const getFabricCutMetersTotal = (fabric) => {
            if (!fabric || !styles.value || styles.value.length === 0) return 0;
            const fabId = fabric.id;
            const intCode = (fabric.internal_code || '').trim().toUpperCase();
            const qCode = isInvalidOrKodsuz(fabric.quality_code) ? '' : String(fabric.quality_code).trim().toLowerCase();

            let totalCut = 0;
            for (let i = 0; i < styles.value.length; i++) {
                const s = styles.value[i];
                const cutVal = parseFloat(s.cut_meters) || 0;
                if (cutVal <= 0) continue;

                let isMatch = false;
                // 1. Matched by fabrictag_id in fabric_link or fabric_link_2
                if (fabId) {
                    if (s.fabric_link && s.fabric_link.fabrictag_id == fabId) isMatch = true;
                    if (!isMatch && s.fabric_link_2 && s.fabric_link_2.fabrictag_id == fabId) isMatch = true;
                }
                // 2. Matched by fabric_code in fabric_links
                if (!isMatch && intCode) {
                    if (s.fabric_link && s.fabric_link.fabric_code && s.fabric_link.fabric_code.toUpperCase() === intCode) isMatch = true;
                    if (!isMatch && s.fabric_link_2 && s.fabric_link_2.fabric_code && s.fabric_link_2.fabric_code.toUpperCase() === intCode) isMatch = true;
                }
                // 3. Matched by internal_code in fabric_article / fabric_article_2 / fabric_type / fabric_type_2
                if (!isMatch && intCode) {
                    const fa1 = (s.fabric_article || s.fabric_type || '').toUpperCase();
                    const fa2 = (s.fabric_article_2 || s.fabric_type_2 || '').toUpperCase();
                    if (fa1.includes(intCode) || fa2.includes(intCode)) isMatch = true;
                }
                // 4. Matched by quality_code in fabric_article / fabric_article_2 / fabric_type / fabric_type_2
                if (!isMatch && qCode && qCode.length >= 3) {
                    const fa1Low = (s.fabric_article || s.fabric_type || '').toLowerCase();
                    const fa2Low = (s.fabric_article_2 || s.fabric_type_2 || '').toLowerCase();
                    if (fa1Low.includes(qCode) || fa2Low.includes(qCode)) isMatch = true;
                }

                if (isMatch) {
                    totalCut += cutVal;
                }
            }
            return Math.round(totalCut * 100) / 100;
        };

        const getFabricReceivedTotal = (fabric) => {
            if (!fabric) return 0;
            if (fabric.received_meters !== undefined && fabric.received_meters !== null && fabric.received_meters !== '') {
                const clean = String(fabric.received_meters).replace(/[^0-9.,]/g, '').replace(',', '.');
                const v = parseFloat(clean);
                if (!isNaN(v)) return v;
            }
            if (fabric.received_batches && Array.isArray(fabric.received_batches) && fabric.received_batches.length > 0) {
                return fabric.received_batches.reduce((acc, b) => {
                    const amt = parseFloat(String(b.amount || 0).replace(',', '.')) || 0;
                    return acc + amt;
                }, 0);
            }
            return 0;
        };

        const formatMetersDisplay = (num) => {
            if (num === null || num === undefined || isNaN(num)) return '0 m';
            const cleanNum = Math.round(num * 100) / 100;
            const parts = cleanNum.toString().split('.');
            const intPart = parts[0];
            const decPart = parts[1];
            return decPart ? `${intPart},${decPart} m` : `${intPart} m`;
        };

        const getFabricStockInfo = (fabric) => {
            if (!fabric) return { received: 0, cut: 0, remaining: 0, formatted: '0 m', colorClass: 'text-slate-400', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' };

            const received = getFabricReceivedTotal(fabric);
            const cut = getFabricCutMetersTotal(fabric);
            const remaining = Math.round((received - cut) * 100) / 100;

            let colorClass = 'text-slate-400';
            let badgeClass = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

            if (received === 0 && cut === 0) {
                colorClass = 'text-slate-400 dark:text-slate-500';
                badgeClass = 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700';
            } else if (remaining > 0) {
                colorClass = 'text-emerald-600 dark:text-emerald-400 font-bold';
                badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
            } else if (remaining < 0) {
                colorClass = 'text-rose-600 dark:text-rose-400 font-bold';
                badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
            } else {
                colorClass = 'text-amber-600 dark:text-amber-400 font-bold';
                badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
            }

            return {
                received: Math.round(received * 100) / 100,
                cut: cut,
                remaining: remaining,
                formatted: formatMetersDisplay(remaining),
                colorClass: colorClass,
                badgeClass: badgeClass
            };
        };

        const fabricBatchModalOpen = ref(false);
        const selectedFabricForBatch = ref(null);
        const newBatchForm = ref({ amount: '', date: '', note: '' });

        const openFabricBatchModal = (fabric) => {
            if (!fabric) return;
            selectedFabricForBatch.value = fabric;
            if (!fabric.received_batches) fabric.received_batches = [];
            const nextPartiNo = (fabric.received_batches.length + 1) + '. Parti';
            const today = new Date();
            const d = String(today.getDate()).padStart(2, '0');
            const m = String(today.getMonth() + 1).padStart(2, '0');
            const y = today.getFullYear();
            newBatchForm.value = {
                amount: '',
                date: `${d}.${m}.${y}`,
                note: nextPartiNo
            };
            fabricBatchModalOpen.value = true;
            refreshIcons();
        };

        const addFabricBatch = async () => {
            if (!selectedFabricForBatch.value || !newBatchForm.value.amount) {
                showToast('Lütfen gelen kumaş miktarını girin', 'warning');
                return;
            }
            try {
                const res = await fetch(`/api/fabrictag/fabrics/${selectedFabricForBatch.value.id}/batches`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token.value}`
                    },
                    body: JSON.stringify(newBatchForm.value)
                });
                const data = await res.json();
                if (res.ok) {
                    selectedFabricForBatch.value.received_batches = data.batches;
                    selectedFabricForBatch.value.received_meters = data.received_meters;
                    selectedFabricForBatch.value.received_date = data.received_date;

                    if (kumasBilgiFabric.value && kumasBilgiFabric.value.id === selectedFabricForBatch.value.id) {
                        kumasBilgiFabric.value.received_batches = data.batches;
                        kumasBilgiFabric.value.received_meters = data.received_meters;
                        kumasBilgiFabric.value.received_date = data.received_date;
                        kumasBilgiGelenKumas.value = data.received_meters;
                        recalculateKumasBilgiTotals();
                    }

                    showToast('Yeni kumaş partisi başarıyla eklendi', 'success');
                    const nextPartiNo = (data.batches.length + 1) + '. Parti';
                    newBatchForm.value.amount = '';
                    newBatchForm.value.note = nextPartiNo;
                } else {
                    showToast(data.detail || 'Parti eklenemedi', 'error');
                }
            } catch (e) {
                console.error('Error adding batch:', e);
                showToast('Sunucu hatası', 'error');
            }
        };

        const deleteFabricBatch = async (batchId) => {
            if (!selectedFabricForBatch.value) return;
            if (!confirm('Bu gelen kumaş partisini silmek istediğinize emin misiniz?')) return;
            try {
                const res = await fetch(`/api/fabrictag/fabrics/${selectedFabricForBatch.value.id}/batches/${batchId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token.value}`
                    }
                });
                const data = await res.json();
                if (res.ok) {
                    selectedFabricForBatch.value.received_batches = data.batches;
                    selectedFabricForBatch.value.received_meters = data.received_meters;
                    selectedFabricForBatch.value.received_date = data.received_date;

                    if (kumasBilgiFabric.value && kumasBilgiFabric.value.id === selectedFabricForBatch.value.id) {
                        kumasBilgiFabric.value.received_batches = data.batches;
                        kumasBilgiFabric.value.received_meters = data.received_meters;
                        kumasBilgiFabric.value.received_date = data.received_date;
                        kumasBilgiGelenKumas.value = data.received_meters;
                        recalculateKumasBilgiTotals();
                    }
                    showToast('Parti silindi', 'info');
                }
            } catch (e) {
                console.error('Error deleting batch:', e);
            }
        };

        // ============================================================
        // KUMAŞ STOK HAREKETLERİ & DETAYLI EKSTRE (FABRIC LEDGER)
        // ============================================================
        const fabricLedgerModalOpen = ref(false);
        const selectedFabricForLedger = ref(null);
        const fabricLedgerLoading = ref(false);
        const fabricLedgerData = ref(null);
        const fabricLedgerRows = ref([]);
        const manualDevirForm = ref({
            amount: '',
            date: '',
            note: 'Devir Stoku',
            unit_price: '',
            currency: 'EUR',
            exchange_rate: '',
            vat_rate: 10
        });

        const formatMetersNumber2Dec = (num) => {
            if (num === null || num === undefined || isNaN(num) || num === '') return '0,00';
            const n = Number(num);
            return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        const formatCurrencyDisplay = (amount, currency = '₺') => {
            if (amount === null || amount === undefined || isNaN(amount) || amount === '') return `${currency} 0,00`;
            const n = Number(amount);
            return `${currency} ` + n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        const resetManualDevirForm = () => {
            const today = new Date();
            const d = String(today.getDate()).padStart(2, '0');
            const m = String(today.getMonth() + 1).padStart(2, '0');
            const y = today.getFullYear();
            manualDevirForm.value = {
                amount: '',
                date: `${d}.${m}.${y}`,
                note: 'Devir Stoku',
                unit_price: '',
                currency: 'EUR',
                exchange_rate: '',
                vat_rate: 10
            };
        };

        const parseSortableDate = (s) => {
            if (!s) return '0000-00-00 00:00';
            const str = String(s).trim();
            if (str.includes('.')) {
                const parts = str.split(' ');
                const dparts = parts[0].split('.');
                if (dparts.length === 3) {
                    const day = dparts[0].padStart(2, '0');
                    const month = dparts[1].padStart(2, '0');
                    const year = dparts[2];
                    const time = parts[1] || '00:00';
                    return `${year}-${month}-${day} ${time}`;
                }
            }
            return str;
        };

        const buildLocalFabricLedger = (fabric) => {
            if (!fabric) return { movements: [], summary: { total_received: 0, total_cut: 0, remaining: 0, total_spend_tl: 0 } };

            const fabId = fabric.id;
            const intCode = (fabric.internal_code || '').trim().toUpperCase();
            const qCode = isInvalidOrKodsuz(fabric.quality_code) ? '' : String(fabric.quality_code).trim().toLowerCase();

            const movements = [];

            // 1. Gelen Partiler
            let batches = [];
            if (fabric.received_batches && Array.isArray(fabric.received_batches) && fabric.received_batches.length > 0) {
                batches = fabric.received_batches;
            } else if (fabric.received_meters && parseFloat(String(fabric.received_meters).replace(',', '.')) > 0) {
                batches = [{
                    id: 1,
                    amount: fabric.received_meters,
                    date: fabric.received_date || new Date().toLocaleDateString('tr-TR'),
                    note: '1. Giriş / Devir Stoku',
                    unit_price: '',
                    currency: 'EUR',
                    exchange_rate: '',
                    vat_rate: 10
                }];
            }

            batches.forEach(b => {
                const amtClean = String(b.amount || 0).replace(/[^0-9.,]/g, '').replace(',', '.');
                const amt = parseFloat(amtClean) || 0;
                if (amt <= 0) return;

                const uPriceClean = String(b.unit_price || '').replace(',', '.');
                const price = parseFloat(uPriceClean) || 0;
                let rate = 1.0;
                if (b.exchange_rate) {
                    rate = parseFloat(String(b.exchange_rate).replace(',', '.')) || 1.0;
                } else if (b.currency === '₺' || b.currency === 'TL') {
                    rate = 1.0;
                }
                const vat = parseFloat(String(b.vat_rate !== undefined && b.vat_rate !== '' ? b.vat_rate : 10)) || 0;
                const totalTl = (price > 0) ? (amt * price * rate * (1 + vat / 100)) : 0;

                movements.push({
                    type: 'gelen',
                    id: b.id,
                    batch_id: b.id,
                    date: b.date || '',
                    sort_key: parseSortableDate(b.date),
                    amount: amt,
                    note: b.note || 'Kumaş Girişi',
                    unit_price: b.unit_price || '',
                    currency: b.currency || 'EUR',
                    exchange_rate: b.exchange_rate || '',
                    vat_rate: b.vat_rate !== undefined ? b.vat_rate : 10,
                    total_amount: Math.round(totalTl * 100) / 100
                });
            });

            // 2. Kesimhane & Pastal Föyünden Kesilen Metrajlar (styles.value)
            (styles.value || []).forEach(s => {
                const cutVal = parseFloat(s.cut_meters) || 0;
                if (cutVal <= 0) return;

                let isMatch = false;
                // 1. Matched by fabrictag_id in fabric_link or fabric_link_2
                if (fabId) {
                    if (s.fabric_link && s.fabric_link.fabrictag_id == fabId) isMatch = true;
                    if (!isMatch && s.fabric_link_2 && s.fabric_link_2.fabrictag_id == fabId) isMatch = true;
                }
                // 2. Matched by fabric_code in fabric_links
                if (!isMatch && intCode) {
                    if (s.fabric_link && s.fabric_link.fabric_code && s.fabric_link.fabric_code.toUpperCase() === intCode) isMatch = true;
                    if (!isMatch && s.fabric_link_2 && s.fabric_link_2.fabric_code && s.fabric_link_2.fabric_code.toUpperCase() === intCode) isMatch = true;
                }
                // 3. Matched by internal_code in fabric_article / fabric_article_2 / fabric_type / fabric_type_2
                if (!isMatch && intCode) {
                    const fa1 = (s.fabric_article || s.fabric_type || '').toUpperCase();
                    const fa2 = (s.fabric_article_2 || s.fabric_type_2 || '').toUpperCase();
                    if (fa1.includes(intCode) || fa2.includes(intCode)) isMatch = true;
                }
                // 4. Matched by quality_code in fabric_article / fabric_article_2 / fabric_type / fabric_type_2
                if (!isMatch && qCode && qCode.length >= 3) {
                    const fa1Low = (s.fabric_article || s.fabric_type || '').toLowerCase();
                    const fa2Low = (s.fabric_article_2 || s.fabric_type_2 || '').toLowerCase();
                    if (fa1Low.includes(qCode) || fa2Low.includes(qCode)) isMatch = true;
                }

                if (isMatch) {
                    // Kesimhane kayıt tarihi
                    const cutDate = s.cutting_date || s.order_date || (s.created_at ? s.created_at.substring(0, 10) : '');
                    const noteParts = [`Kesim: Model ${s.style_no || ''}`];
                    if (s.color_name) noteParts.push(s.color_name);
                    if (s.po_number) noteParts.push(`PO: ${s.po_number}`);
                    const cust = s.customer_name || s.brand || '';
                    if (cust) noteParts.push(`(${cust})`);

                    movements.push({
                        type: 'kesilen',
                        id: `cut_${s.id}`,
                        style_id: s.id,
                        date: cutDate,
                        sort_key: parseSortableDate(cutDate),
                        amount: cutVal,
                        note: noteParts.join(' - '),
                        unit_price: '',
                        currency: '',
                        exchange_rate: '',
                        vat_rate: '',
                        total_amount: 0
                    });
                }
            });

            // Kronolojik sırala (aynı tarihte gelenler önce)
            movements.sort((a, b) => {
                if (a.sort_key < b.sort_key) return -1;
                if (a.sort_key > b.sort_key) return 1;
                return a.type === 'gelen' ? -1 : 1;
            });

            // Yürüyen Bakiye Hesapla
            let runningBalance = 0;
            let totalReceived = 0;
            let totalCut = 0;
            let totalSpend = 0;

            movements.forEach(m => {
                if (m.type === 'gelen') {
                    runningBalance += m.amount;
                    totalReceived += m.amount;
                    totalSpend += (m.total_amount || 0);
                    m.gelen = m.amount;
                    m.kesilen = 0;
                } else {
                    runningBalance -= m.amount;
                    totalCut += m.amount;
                    m.gelen = 0;
                    m.kesilen = m.amount;
                }
                m.balance = Math.round(runningBalance * 100) / 100;
            });

            return {
                fabric: fabric,
                movements: movements,
                summary: {
                    total_received: Math.round(totalReceived * 100) / 100,
                    total_cut: Math.round(totalCut * 100) / 100,
                    remaining: Math.round(runningBalance * 100) / 100,
                    total_spend_tl: Math.round(totalSpend * 100) / 100
                }
            };
        };

        const openFabricLedgerModal = async (fabric) => {
            if (!fabric) return;
            selectedFabricForLedger.value = fabric;
            fabricLedgerModalOpen.value = true;
            resetManualDevirForm();

            // 1. Önce doğrudan ekrandaki styles ve partilerden ANINDA hesapla ve göster (%100 eşleşme, 0 ms gecikme)
            const localLedger = buildLocalFabricLedger(fabric);
            fabricLedgerData.value = localLedger;
            fabricLedgerRows.value = localLedger.movements;

            // 2. Arka uçtan partilerin güncel fiyat/kur/kdv verilerini al
            await loadFabricLedger(fabric.id);
            refreshIcons();
        };

        const loadFabricLedger = async (fabricId) => {
            try {
                const res = await fetch(`/api/fabrictag/fabrics/${fabricId}/ledger`, {
                    headers: { 'Authorization': `Bearer ${token.value}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.movements && data.movements.length > 0) {
                        fabricLedgerData.value = data;
                        fabricLedgerRows.value = data.movements || [];
                    }
                }
            } catch (e) {
                console.warn('Backend sync, using instant local ledger:', e);
            } finally {
                fabricLedgerLoading.value = false;
                refreshIcons();
            }
        };

        const closeFabricLedgerModal = () => {
            fabricLedgerModalOpen.value = false;
            selectedFabricForLedger.value = null;
            fabricLedgerData.value = null;
            fabricLedgerRows.value = [];
        };

        const addFabricLedgerDevirEntry = async () => {
            if (!selectedFabricForLedger.value) return;
            if (!manualDevirForm.value.amount || String(manualDevirForm.value.amount).trim() === '') {
                showToast('Lütfen gelen/devir metraj miktarını girin', 'warning');
                return;
            }

            try {
                const res = await fetch(`/api/fabrictag/fabrics/${selectedFabricForLedger.value.id}/batches`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token.value}`
                    },
                    body: JSON.stringify(manualDevirForm.value)
                });
                const data = await res.json();
                if (res.ok) {
                    showToast('Stok/Devir girişi başarıyla kaydedildi', 'success');
                    selectedFabricForLedger.value.received_batches = data.batches;
                    selectedFabricForLedger.value.received_meters = data.received_meters;
                    selectedFabricForLedger.value.received_date = data.received_date;
                    
                    const fInList = fabricsList.value.find(f => f.id === selectedFabricForLedger.value.id);
                    if (fInList) {
                        fInList.received_batches = data.batches;
                        fInList.received_meters = data.received_meters;
                        fInList.received_date = data.received_date;
                    }
                    resetManualDevirForm();
                    await loadFabricLedger(selectedFabricForLedger.value.id);
                } else {
                    showToast(data.detail || 'Kayıt başarısız', 'error');
                }
            } catch (e) {
                console.error('Error adding ledger entry:', e);
                showToast('Sunucu hatası', 'error');
            }
        };

        const deleteFabricLedgerBatch = async (batchId) => {
            if (!selectedFabricForLedger.value) return;
            if (!confirm('Bu gelen kumaş partisini silmek istediğinize emin misiniz?')) return;
            try {
                const res = await fetch(`/api/fabrictag/fabrics/${selectedFabricForLedger.value.id}/batches/${batchId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token.value}` }
                });
                const data = await res.json();
                if (res.ok) {
                    selectedFabricForLedger.value.received_batches = data.batches;
                    selectedFabricForLedger.value.received_meters = data.received_meters;
                    selectedFabricForLedger.value.received_date = data.received_date;
                    const fInList = fabricsList.value.find(f => f.id === selectedFabricForLedger.value.id);
                    if (fInList) {
                        fInList.received_batches = data.batches;
                        fInList.received_meters = data.received_meters;
                        fInList.received_date = data.received_date;
                    }
                    showToast('Parti silindi', 'info');
                    await loadFabricLedger(selectedFabricForLedger.value.id);
                }
            } catch (e) {
                console.error('Error deleting batch from ledger:', e);
            }
        };

        let batchSaveDebounceTimer = null;
        const saveFabricBatchField = (row) => {
            if (!row || row.type !== 'gelen' || !row.batch_id || !selectedFabricForLedger.value) return;
            
            // Satırın tutarını hemen reaktif olarak hesapla
            const amt = parseFloat(String(row.amount).replace(',', '.')) || 0;
            const price = parseFloat(String(row.unit_price).replace(',', '.')) || 0;
            let rate = 1.0;
            if (row.exchange_rate) {
                rate = parseFloat(String(row.exchange_rate).replace(',', '.')) || 1.0;
            } else if (row.currency === '₺' || row.currency === 'TL') {
                rate = 1.0;
            }
            const vat = parseFloat(String(row.vat_rate !== undefined && row.vat_rate !== '' ? row.vat_rate : 10)) || 0;
            const base = amt * price * rate;
            row.total_amount = Math.round(base * (1 + vat / 100) * 100) / 100;

            // Özet toplam alış tutarını güncelle
            let totalSpend = 0;
            for (const m of fabricLedgerRows.value) {
                if (m.type === 'gelen') {
                    totalSpend += (m.total_amount || 0);
                }
            }
            if (fabricLedgerData.value && fabricLedgerData.value.summary) {
                fabricLedgerData.value.summary.total_spend_tl = Math.round(totalSpend * 100) / 100;
            }

            // Arka uca otomatik debounced PUT isteği gönder
            clearTimeout(batchSaveDebounceTimer);
            batchSaveDebounceTimer = setTimeout(async () => {
                try {
                    await fetch(`/api/fabrictag/fabrics/${selectedFabricForLedger.value.id}/batches/${row.batch_id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token.value}`
                        },
                        body: JSON.stringify({
                            unit_price: row.unit_price,
                            currency: row.currency,
                            exchange_rate: row.exchange_rate,
                            vat_rate: row.vat_rate
                        })
                    });
                } catch (e) {
                    console.error('Error auto-saving batch fields:', e);
                }
            }, 400);
        };

        const printFabricLedger = () => {
            let printStyle = document.getElementById('fabric-ledger-dynamic-print-style');
            if (!printStyle) {
                printStyle = document.createElement('style');
                printStyle.id = 'fabric-ledger-dynamic-print-style';
                document.head.appendChild(printStyle);
            }
            printStyle.innerHTML = `@media print { @page { size: A4 landscape !important; margin: 6mm !important; } }`;
            setTimeout(() => {
                window.print();
            }, 80);
        };

        const exportFabricLedgerExcel = () => {
            if (!selectedFabricForLedger.value) return;
            const fid = selectedFabricForLedger.value.id;
            window.open(`/api/reports/fabric-ledger-excel/${fid}`, '_blank');
        };

        const openKumasBilgiFormu = (fabric) => {
            if (!fabric) return;
            kumasBilgiFabric.value = fabric;
            if (!fabric.received_batches) fabric.received_batches = [];


            const qCode = (fabric.quality_code || '').trim().toLowerCase();
            const intCode = (fabric.internal_code || '').trim().toLowerCase();
            const comp = (fabric.company_name || '').trim().toLowerCase();

            const matched = [];
            const customerCounts = {};
            const seasonCounts = {};

            (styles.value || []).forEach(s => {
                // İptal ve Yüklenenleri hariç tut
                const st = (s.status || '').toLowerCase();
                if (st.includes('iptal') || st.includes('cancel')) return;
                if (st.includes('yüklendi') || st.includes('yuklendi') || st.includes('sevk') || st.includes('shipped')) return;
                if (s.shipping_sample_sent && String(s.shipping_sample_sent).toLowerCase().includes('yüklendi')) return;

                const fab1 = (s.fabric_article || '').toLowerCase();
                const fab2 = (s.fabric_article_2 || '').toLowerCase();

                let isMatch = false;
                let whichFabric = 1;

                if (intCode && (fab1.includes(intCode) || fab2.includes(intCode))) {
                    isMatch = true;
                    whichFabric = fab1.includes(intCode) ? 1 : 2;
                } else if (qCode && qCode.length >= 3 && (fab1.includes(qCode) || fab2.includes(qCode))) {
                    isMatch = true;
                    whichFabric = fab1.includes(qCode) ? 1 : 2;
                } else if (comp && comp.length >= 3 && (fab1.includes(comp) || fab2.includes(comp))) {
                    isMatch = true;
                    whichFabric = fab1.includes(comp) ? 1 : 2;
                }

                if (isMatch) {
                    const cust = s.customer_name || s.brand || '';
                    if (cust) customerCounts[cust] = (customerCounts[cust] || 0) + 1;
                    if (s.season) seasonCounts[s.season] = (seasonCounts[s.season] || 0) + 1;

                    const qty = parseFloat(s.total_quantity) || 0;
                    
                    const rawMetersField = whichFabric === 1 
                        ? (s.unit_meters || s.pps_unit_meters || s.sms_unit_meters || s.actual_unit_meters)
                        : (s.unit_meters_2 || s.pps_unit_meters_2 || s.actual_unit_meters);
                    let rawMeters = 0;
                    if (rawMetersField) {
                        const cleanStr = extractCleanMeters(rawMetersField);
                        rawMeters = parseFloat(String(cleanStr).replace(',', '.')) || 0;
                    }

                    const rawGramsField = whichFabric === 1 ? s.unit_grams : s.unit_grams_2;
                    let rawGrams = 0;
                    if (rawGramsField) {
                        rawGrams = parseFloat(String(rawGramsField).replace(',', '.')) || 0;
                    }

                    let unit = 0;
                    let isGramRow = false;

                    if (rawGrams > 0) {
                        isGramRow = true;
                        // Gram girilmişse KG cinsine çevir (örn: 230 gr -> 0.230 kg, 337.5 gr -> 0.3375 kg)
                        unit = Math.round((rawGrams / 1000) * 10000) / 10000;
                    } else if (rawMeters > 0) {
                        if (rawMeters > 15) {
                            // Metre kutusuna gram yazılmışsa KG cinsine çevir
                            isGramRow = true;
                            unit = Math.round((rawMeters / 1000) * 10000) / 10000;
                        } else {
                            unit = rawMeters;
                        }
                    }

                    const waste = whichFabric === 1
                        ? (parseFloat(s.fabric_wastage_percent) || 5)
                        : (parseFloat(s.fabric_wastage_percent_2) || 5);
                    const rec = whichFabric === 1
                        ? (parseFloat(s.fabric_received_meters) || 0)
                        : (parseFloat(s.fabric_received_meters_2) || 0);

                    const net = Math.round(qty * unit * 1000) / 1000;
                    const calc = Math.round(net * (1 + waste / 100) * 1000) / 1000;

                    matched.push({
                        id: s.id,
                        style_no: s.style_no || '-',
                        po_number: s.po_number || '',
                        customer_name: s.customer_name || s.brand || '',
                        brand: s.brand || '',
                        season: s.season || '',
                        color_name: s.color_name || '-',
                        fabric_details: whichFabric === 1 ? s.fabric_article : s.fabric_article_2,
                        image_url: s.image_url || '',
                        total_quantity: qty,
                        unit_val: unit,
                        is_gram: isGramRow,
                        net_meters: net,
                        waste_percent: waste,
                        calculated_meters: calc,
                        received_meters: rec
                    });
                }
            });

            // En çok geçen müşteri ve sezonu bul
            let topCust = '';
            let maxC = 0;
            for (const [k, v] of Object.entries(customerCounts)) {
                if (v > maxC) { maxC = v; topCust = k; }
            }

            let topSeason = '';
            let maxS = 0;
            for (const [k, v] of Object.entries(seasonCounts)) {
                if (v > maxS) { maxS = v; topSeason = k; }
            }

            kumasBilgiCustomer.value = topCust || 'MÜŞTERİ';
            kumasBilgiSeason.value = topSeason || 'AW26';
            kumasBilgiTitle.value = `${kumasBilgiCustomer.value} ${kumasBilgiSeason.value} İMALAT`;
            const cleanQName = isInvalidOrKodsuz(fabric.quality_name) ? '' : String(fabric.quality_name).trim();
            const cleanQCode = isInvalidOrKodsuz(fabric.quality_code) ? '' : String(fabric.quality_code).trim();
            kumasBilgiQualityName.value = cleanQName || '-';
            kumasBilgiQualityCode.value = cleanQCode || fabric.internal_code || '-';
            const varList = [...new Set(matched.map(m => m.color_name).filter(Boolean))];
            kumasBilgiVariants.value = varList.length > 0 ? varList.join(' • ') : (fabric.design_code || '-');

            kumasBilgiRows.value = matched;

            // Model gr cinsinden ise KG, metre ise MT birimi ata
            const anyGram = matched.some(m => m.is_gram);
            const fabText = ((fabric.quality_name || '') + ' ' + (fabric.composition || '')).toLowerCase();
            const isKnit = fabText.includes('süprem') || fabText.includes('suprem') || fabText.includes('2 iplik') || fabText.includes('3 iplik') || fabText.includes('kaşkorse') || fabText.includes('örme') || fabText.includes('fleece') || fabText.includes('rib');
            kumasBilgiUnitType.value = (anyGram || isKnit) ? 'KG' : 'MT';
            // Gelen kumaş metrajını Çarşaf Listesindeki bu kumaşa ait modellerden çek
            const carsafGelenTotal = matched.reduce((acc, m) => acc + (parseFloat(m.received_meters) || 0), 0);
            if (carsafGelenTotal > 0) {
                kumasBilgiGelenKumas.value = carsafGelenTotal;
            } else if (fabric.received_meters) {
                kumasBilgiGelenKumas.value = fabric.received_meters;
            } else {
                kumasBilgiGelenKumas.value = '';
            }

            recalculateKumasBilgiTotals();
            kumasBilgiModalOpen.value = true;
            refreshIcons();
        };

        const updateFabricReceived = async (fabric) => {
            try {
                const res = await fetch(`/api/fabrictag/fabrics/${fabric.id}/received`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token.value}`
                    },
                    body: JSON.stringify({
                        received_meters: fabric.received_meters || '',
                        received_date: fabric.received_date || null
                    })
                });
                const data = await res.json();
                if (res.ok) {
                    fabric.received_date = data.received_date;
                    showToast('Gelen kumaş miktarı ve tarihi kaydedildi', 'success');
                }
            } catch (e) {
                console.error('Error updating fabric received:', e);
            }
        };

        const removeKumasBilgiRow = (idx) => {
            kumasBilgiRows.value.splice(idx, 1);
            recalculateKumasBilgiTotals();
        };

        const recalculateKumasBilgiTotals = () => {
            let totalQty = 0;
            let totalNet = 0;
            let totalCalc = 0;

            const globalWaste = parseFloat(kumasBilgiWastePercent.value) || 5;

            kumasBilgiRows.value.forEach(r => {
                const qty = parseFloat(r.total_quantity) || 0;
                const unit = parseFloat(r.unit_val) || 0;
                const net = Math.round(qty * unit * 1000) / 1000;
                const waste = r.waste_percent !== undefined && r.waste_percent !== null ? parseFloat(r.waste_percent) : globalWaste;
                const calc = Math.round(net * (1 + waste / 100) * 1000) / 1000;

                r.net_meters = net;
                r.calculated_meters = calc;

                totalQty += qty;
                totalNet += net;
                totalCalc += calc;
            });

            // Gelen kumaş miktarını kumaş deposu / form bilgisinden al
            const recVal = parseFloat(kumasBilgiGelenKumas.value);
            const finalRec = !isNaN(recVal) ? recVal : 0;

            kumasBilgiTotals.value = {
                totalQuantity: totalQty,
                totalNet: Math.round(totalNet * 100) / 100,
                totalCalculated: Math.round(totalCalc * 100) / 100,
                totalReceived: Math.round(finalRec * 100) / 100,
                bakiye: Math.round((finalRec - totalCalc) * 100) / 100
            };
        };

        const printKumasBilgiFormu = () => {
            const scrollContainer = document.querySelector('#kumas-bilgi-print-modal .overflow-y-auto');
            if (scrollContainer) scrollContainer.scrollTop = 0;

            let printStyle = document.getElementById('kumas-bilgi-dynamic-print-style');
            if (!printStyle) {
                printStyle = document.createElement('style');
                printStyle.id = 'kumas-bilgi-dynamic-print-style';
                document.head.appendChild(printStyle);
            }
            const ori = kumasBilgiOrientation.value || 'landscape';
            printStyle.innerHTML = `@media print { @page { size: A4 ${ori} !important; margin: 6mm !important; } }`;
            setTimeout(() => {
                window.print();
            }, 80);
        };

        const syncKumasBilgiGelen = () => {
            if (kumasBilgiFabric.value) {
                kumasBilgiFabric.value.received_meters = kumasBilgiGelenKumas.value;
                updateFabricReceived(kumasBilgiFabric.value);
            }
            recalculateKumasBilgiTotals();
        };

        // ============================================================
        // ÇARŞAF LİSTESİ ÖZEL YAZDIRMA GÖRÜNÜMÜ (CARSAF PRINT VIEW)
        // ============================================================
        const carsafPrintModalOpen = ref(false);
        const carsafPrintTitle = ref('ROBERTO SARTO FALL 26 İMALAT');
        const carsafPrintRows = ref([]);
        const carsafPrintOrientation = ref(localStorage.getItem('carsaf_print_orientation') || 'portrait');
        const carsafPrintRowHeight = ref(parseInt(localStorage.getItem('carsaf_print_row_height')) || 90);

        const defaultPrintColWidths = {
            image: 20,
            style: 12,
            color: 17,
            fabric: 23,
            quantity: 8,
            price: 9,
            notes: 11
        };

        const loadSavedPrintColWidths = () => {
            try {
                const saved = localStorage.getItem('carsaf_print_col_widths_pct');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed && typeof parsed.image === 'number' && (parsed.image + parsed.style + parsed.color + parsed.fabric + parsed.quantity + parsed.price + parsed.notes) === 100) {
                        return Object.assign({}, defaultPrintColWidths, parsed);
                    }
                }
            } catch (e) {}
            return Object.assign({}, defaultPrintColWidths);
        };

        const carsafPrintColWidths = ref(loadSavedPrintColWidths());

        const resetCarsafPrintColWidths = () => {
            carsafPrintColWidths.value = Object.assign({}, defaultPrintColWidths);
            localStorage.removeItem('carsaf_print_col_widths_pct');
            showToast('Sütun genişlikleri varsayılan oranlara sıfırlandı', 'info');
        };

        const adjustColWidth = (colKey, delta) => {
            const cur = carsafPrintColWidths.value[colKey] || 10;
            if (delta < 0 && cur <= 4) return;
            const targetComp = colKey === 'fabric' ? 'notes' : 'fabric';
            const compCur = carsafPrintColWidths.value[targetComp];
            if (delta > 0 && compCur <= 4) return;
            
            carsafPrintColWidths.value[colKey] = cur + delta;
            carsafPrintColWidths.value[targetComp] = compCur - delta;
            localStorage.setItem('carsaf_print_col_widths_pct', JSON.stringify(carsafPrintColWidths.value));
        };

        const startCarsafPrintColResize = (colKey, e) => {
            e.stopPropagation();
            e.preventDefault();
            const colOrder = ['image', 'style', 'color', 'fabric', 'quantity', 'price', 'notes'];
            const idx = colOrder.indexOf(colKey);
            if (idx < 0 || idx >= colOrder.length - 1) return;
            const nextKey = colOrder[idx + 1];

            const startX = e.pageX;
            const initialCurrent = carsafPrintColWidths.value[colKey] || defaultPrintColWidths[colKey];
            const initialNext = carsafPrintColWidths.value[nextKey] || defaultPrintColWidths[nextKey];

            const tableEl = document.getElementById('carsaf-print-table');
            const tableWidthPx = tableEl ? tableEl.offsetWidth : 750;

            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';

            const onMouseMove = (moveEvent) => {
                const diffPx = moveEvent.pageX - startX;
                const diffPercent = Math.round((diffPx / tableWidthPx) * 100);
                
                const minPercent = 4;
                let newCurrent = initialCurrent + diffPercent;
                let newNext = initialNext - diffPercent;

                if (newCurrent < minPercent) {
                    newCurrent = minPercent;
                    newNext = (initialCurrent + initialNext) - minPercent;
                } else if (newNext < minPercent) {
                    newNext = minPercent;
                    newCurrent = (initialCurrent + initialNext) - minPercent;
                }

                carsafPrintColWidths.value[colKey] = newCurrent;
                carsafPrintColWidths.value[nextKey] = newNext;
            };

            const onMouseUp = () => {
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                localStorage.setItem('carsaf_print_col_widths_pct', JSON.stringify(carsafPrintColWidths.value));
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        };


        const updatePrintPageStyle = () => {
            let el = document.getElementById('dynamic-print-page-style');
            if (!el) {
                el = document.createElement('style');
                el.id = 'dynamic-print-page-style';
                document.head.appendChild(el);
            }
            const orient = carsafPrintOrientation.value === 'portrait' ? 'portrait' : 'landscape';
            el.innerHTML = `@page { size: A4 ${orient} !important; margin: 6mm !important; }`;
        };

        const setCarsafPrintOrientation = (orient) => {
            carsafPrintOrientation.value = orient;
            localStorage.setItem('carsaf_print_orientation', orient);
            updatePrintPageStyle();
        };

        const setCarsafPrintRowHeight = (h) => {
            const val = parseInt(h);
            if (!isNaN(val) && val >= 45 && val <= 220) {
                carsafPrintRowHeight.value = val;
                localStorage.setItem('carsaf_print_row_height', val);
            }
        };


        const openCarsafPrintModal = () => {
            // SADECE ÇARŞAF LİSTESİNDE SÜZÜLMÜŞ (FİLTRELENMİŞ) MODELLERİ AL
            const list = filteredStyles.value || [];
            if (list.length === 0) {
                showToast('Çarşaf listesinde süzülen model bulunamadı.', 'warning');
                return;
            }

            const customerCounts = {};
            const seasonCounts = {};
            list.forEach(s => {
                const c = s.customer_name || s.brand || '';
                if (c) customerCounts[c] = (customerCounts[c] || 0) + 1;
                const sz = s.season || '';
                if (sz) seasonCounts[sz] = (seasonCounts[sz] || 0) + 1;
            });

            let topCust = '';
            let maxC = 0;
            for (const [k, v] of Object.entries(customerCounts)) {
                if (v > maxC) { maxC = v; topCust = k; }
            }

            let topSeason = '';
            let maxS = 0;
            for (const [k, v] of Object.entries(seasonCounts)) {
                if (v > maxS) { maxS = v; topSeason = k; }
            }

            const custText = topCust || 'MÜŞTERİ';
            const seasonText = topSeason || 'FALL 26';
            carsafPrintTitle.value = `${custText} ${seasonText} İMALAT`.toUpperCase();

            carsafPrintRows.value = list.map(s => {
                let cur = '€';
                if (s.currency === 'USD' || s.currency === '$') cur = '$';
                else if (s.currency === 'TL' || s.currency === 'TRY' || s.currency === '₺') cur = '₺';
                else if (s.currency === 'GBP' || s.currency === '£') cur = '£';

                let priceStr = '';
                if (s.unit_price !== undefined && s.unit_price !== null && s.unit_price !== '') {
                    const p = parseFloat(s.unit_price);
                    if (!isNaN(p)) {
                        priceStr = cur + ' ' + p.toFixed(2).replace('.', ',');
                    }
                }

                let notesVal = s.notes || '';
                if (!notesVal && s.custom_fields_json) {
                    try {
                        const parsed = JSON.parse(s.custom_fields_json);
                        notesVal = parsed.notes || parsed.notlar || '';
                    } catch (e) {}
                }

                return {
                    id: s.id,
                    image_url: s.image_url || '',
                    image_url_2: s.image_url_2 || '',
                    style_no: s.style_no || '',
                    color_name: getDisplayColor(s),
                    fabric_article: s.fabric_article || '',
                    total_quantity: s.total_quantity || 0,
                    price_formatted: priceStr,
                    notes: notesVal
                };
            });

            updatePrintPageStyle();
            carsafPrintModalOpen.value = true;
            refreshIcons();
        };

        const removeCarsafPrintRow = (idx) => {
            carsafPrintRows.value.splice(idx, 1);
        };

        const printCarsafList = () => {
            updatePrintPageStyle();
            setTimeout(() => {
                window.print();
            }, 50);
        };

        const isCarsafExportingExcel = ref(false);

        const exportCarsafPrintToExcel = () => {
            try {
                isCarsafExportingExcel.value = true;
                const rows = carsafPrintRows.value || [];
                if (rows.length === 0) {
                    showToast('Aktarılacak model bulunamadı.', 'warning');
                    isCarsafExportingExcel.value = false;
                    return;
                }

                const ids = rows.map(r => r.id).filter(Boolean).join(',');
                const title = encodeURIComponent(carsafPrintTitle.value || 'İMALAT ÖZET LİSTESİ');
                const url = `/api/styles/export-carsaf-excel?ids=${ids}&title=${title}`;

                const a = document.createElement('a');
                a.href = url;
                a.download = `${(carsafPrintTitle.value || 'Imalat_Ozet_Listesi').replace(/[^a-zA-Z0-9_\-]/g, '_')}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                showToast('Özet Excel dosyası hazırlanıyor ve indiriliyor...', 'info');
            } catch (err) {
                console.error('Carsaf print excel export error:', err);
                showToast('Excel Aktarım Hatası: ' + (err.message || 'Bilinmeyen hata'), 'error');
            } finally {
                setTimeout(() => {
                    isCarsafExportingExcel.value = false;
                }, 1500);
            }
        };

        // ============================================================
        // SİPARİŞLERİ EXCEL'E AKTARMA (FOTOĞRAFLI & MODERN TASARIM)
        // ============================================================
        const isExportingExcel = ref(false);

        const exportOrdersToExcel = (e) => {
            try {
                const targetList = (filteredStyles.value && filteredStyles.value.length > 0)
                    ? filteredStyles.value
                    : (styles.value || []);

                let idsParam = '';
                // Süzgeç uygulanmışsa sadece süzülen modelleri aktar
                if (targetList.length > 0 && targetList.length < (styles.value ? styles.value.length : 0)) {
                    idsParam = '?ids=' + targetList.map(s => s.id).join(',');
                }

                const exportUrl = '/api/styles/export-excel' + idsParam;
                if (e && e.currentTarget) {
                    e.currentTarget.href = exportUrl;
                }
                showToast('Fotoğraflı Excel dosyası hazırlanıyor ve indiriliyor...', 'info');
            } catch (err) {
                console.error('Excel export error:', err);
                showToast('Excel Aktarım Hatası: ' + (err.message || 'Bilinmeyen hata'), 'error');
            }
        };









        const logModalOpen = ref(false);
        const selectedStyle = ref(null);
        const selectedStyleLogs = ref([]);
        const newLogText = ref('');

        const auditModalOpen = ref(false);
        const styleAuditLogs = ref([]);
        const globalAuditLogs = ref([]);

        const companiesList = ref([]);
        const newCompany = ref({
            name: '',
            code: '',
            license_key: 'TEX-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
            license_expires_at: '2027-12-31',
            max_users: 20
        });

        // ============================================================
        // BÜTÇE GÖSTER & MALİYET ANALİZİ TABLOSU
        // ============================================================
        const budgetModalOpen = ref(false);
        const budgetSearchQuery = ref('');
        const budgetRows = ref([]);

        const formatCurrencyVal = (val, symbol = '€') => {
            if (val === null || val === undefined || val === '') return '-';
            const numVal = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
            if (isNaN(numVal)) return '-';
            const sym = getCurrencySymbol(symbol);
            const formattedNum = numVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return `${sym} ${formattedNum}`;
        };

        const formatNumber2Dec = (val) => {
            if (val === null || val === undefined || val === '') return '-';
            const n = parseFloat(val);
            if (isNaN(n)) return '-';
            if (n === 0) return '0';
            return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        const openBudgetModal = () => {
            try {
                const targetList = (filteredStyles.value && filteredStyles.value.length > 0)
                    ? filteredStyles.value
                    : (styles.value || []);

                if (!targetList || targetList.length === 0) {
                    showToast('Görüntülenecek model bulunamadı.', 'warning');
                    return;
                }

                budgetRows.value = targetList.map(s => {
                    let costData = {};
                    if (s.cost_data && typeof s.cost_data === 'object') {
                        costData = s.cost_data;
                    } else if (s.cost_data_json) {
                        try {
                            costData = JSON.parse(s.cost_data_json);
                        } catch (e) {
                            costData = {};
                        }
                    }

                const rates = costData.exchangeRates || { EUR: 55.75, USD: 48.9, TL: 1.0 };
                const eurRate = parseFloat(rates.EUR) || 55.75;
                const fabrics = costData.fabrics || [];
                const items = costData.items || [];

                const getItemVal = (keywords) => {
                    for (const it of items) {
                        const n = (it.name || '').toLowerCase();
                        if (keywords.some(k => n.includes(k.toLowerCase()))) {
                            let v = it.total_tl;
                            if (v === undefined || v === null || v === '') v = it.evaluated_price;
                            if (v === undefined || v === null || v === '') v = it.price;
                            const num = parseFloat(v);
                            return isNaN(num) ? 0 : num;
                        }
                    }
                    return 0;
                };

                const fb1 = fabrics[0] || {};
                const fb1Price = parseFloat(fb1.price || s.fabric_price_1 || 0) || 0;
                const fb1Meters = parseFloat(fb1.meters || s.unit_meters || 0) || 0;
                const fb1Grams = parseFloat(fb1.grams || s.unit_grams || 0) || 0;
                const fb1Cm = fb1.unit_type !== 'KG' ? Math.round(fb1Meters * 100) : fb1Grams;
                const fb1Total = parseFloat(fb1.total_tl || 0) || 0;

                const fb2 = fabrics[1] || {};
                const fb2Price = parseFloat(fb2.price || s.fabric_price_2 || 0) || 0;
                const fb2Meters = parseFloat(fb2.meters || s.unit_meters_2 || 0) || 0;
                const fb2Grams = parseFloat(fb2.grams || s.unit_grams_2 || 0) || 0;
                const fb2Gramaj = fb2Grams > 0 ? fb2Grams : Math.round(fb2Meters * 100);
                const fb2Total = parseFloat(fb2.total_tl || 0) || 0;

                const fb3 = fabrics[2] || {};
                const fb3Price = parseFloat(fb3.price || 0) || 0;
                const fb3Meters = parseFloat(fb3.meters || 0) || 0;
                const fb3Grams = parseFloat(fb3.grams || 0) || 0;
                const fb3Gramaj = fb3Grams > 0 ? fb3Grams : Math.round(fb3Meters * 100);
                const fb3Total = parseFloat(fb3.total_tl || 0) || 0;

                const kumasToplam = parseFloat(costData.totals?.toplam_kumas_tl || (fb1Total + fb2Total + fb3Total)) || 0;

                const vFason = getItemVal(['fason', 'dikim']);
                const vKesim = getItemVal(['kesim']);
                const vAks = getItemVal(['aksesuar', 'aks']);
                const vEtkol = getItemVal(['etiket', 'kol', 'etkol']);
                const vLogo = getItemVal(['logo', 'baskı', 'nakış']);
                const vBrit = getItemVal(['brit']);
                const vLastik = getItemVal(['lastik']);
                const vDugme = getItemVal(['düğme', 'fermuar']);
                const vCitcit = getItemVal(['çıtçıt']);
                const vDiger = getItemVal(['diğer', 'tasarım', 'kalıp']);
                const vKargo = getItemVal(['kargo']);
                const vNakliye = getItemVal(['nakliye']);
                const vKumasExtra = getItemVal(['yıkama', 'taş']) || (fb1Total && !getItemVal(['yıkama', 'taş']) ? fb1Total : 0);
                const vAstar = getItemVal(['astar', 'tela']);
                const vDikme = getItemVal(['dikme', 'el dikişi']);
                const vIlikDugme = getItemVal(['ilik', 'ilik-düğme']);
                const vCitcitCakim = getItemVal(['çakım', 'çıtçıt çakım']);

                const totals = costData.totals || {};
                let maliyetTL = parseFloat(totals.maliyet_1_tl || totals.maliyet_2_tl || 0) || 0;
                if (maliyetTL === 0 && (kumasToplam > 0 || vFason > 0)) {
                    maliyetTL = Math.round((kumasToplam + vFason + vKesim + vAks + vEtkol + vKargo + vNakliye + vDiger) * 1.06 * 100) / 100;
                }
                const maliyetEUR = parseFloat(totals.maliyet_1_doviz || (eurRate > 0 ? Math.round((maliyetTL / eurRate) * 100) / 100 : 0)) || 0;
                const price = parseFloat(totals.toplam_satis_doviz || s.unit_price || 0) || 0;
                const qty = parseInt(s.total_quantity || 0) || 0;

                const totMaliyetTL = Math.round(maliyetTL * qty * 100) / 100;
                const totMaliyetEUR = Math.round(maliyetEUR * qty * 100) / 100;
                const orderToplam = Math.round(price * qty * 100) / 100;

                const colorCode = (s.color_code || '').toString().trim();
                const colorName = (s.color_name || '').toString().trim();
                const displayColor = (colorCode && colorName && !colorName.startsWith(colorCode)) ? `${colorCode} ${colorName}` : (colorName || colorCode);

                const cleanKumasVal = (v) => {
                    if (!v) return '';
                    const sv = String(v).trim();
                    if (/^ELT\d+$/i.test(sv)) return '';
                    const up = sv.toUpperCase();
                    if (['KODSUZ', 'YOK', 'NONE', 'NULL', '-', '—', 'İSİMSİZ', 'ISIMSIZ', 'TANIMSIZ', 'BİLGİSİ YOK', 'BILGISI YOK', 'BİLGİ YOK', 'BILGI YOK', 'BELİRTİLMEDİ', 'BELIRTILMEDI'].includes(up)) return '';
                    return sv;
                };

                let kumasci = cleanKumasVal(s.fabric_company_1);
                let kaliteAdi = cleanKumasVal(s.fabric_quality_name_1);
                let kaliteKodu = cleanKumasVal(s.fabric_quality_code_1);
                let varyant = cleanKumasVal(s.fabric_variant_1);
                let kumasRenk = cleanKumasVal(s.fabric_color_1) || displayColor;

                if (!kumasci && !kaliteAdi && !kaliteKodu) {
                    let raw = (s.fabric_article || s.fabric_type || '').trim();
                    raw = raw.replace(/\bELT\d+\b\s*[-–—:]*\s*/gi, '').trim();
                    const parts = raw.split(' - ').map(p => p.trim()).filter(Boolean);
                    if (parts.length >= 2) {
                        kumasci = cleanKumasVal(parts[0]);
                        const rest = parts[1];
                        if (rest.includes('(') && rest.includes(')')) {
                            kaliteAdi = cleanKumasVal(rest.split('(')[0].trim());
                            kaliteKodu = cleanKumasVal(rest.split('(')[1].split(')')[0].trim());
                        } else {
                            kaliteAdi = cleanKumasVal(rest);
                        }
                    } else if (parts.length === 1) {
                        kumasci = cleanKumasVal(parts[0]);
                    }
                }

                return {
                    id: s.id,
                    image_url: s.image_url || s.image_url_2 || '',
                    po_number: s.po_number || '',
                    customer_name: s.customer_name || s.brand || '',
                    cust_season: `${s.customer_name || s.brand || ''} ${s.season || ''}`.trim(),
                    model_color: `${s.style_no || ''}-${colorCode || colorName}`,
                    style_no: s.style_no || '',
                    color_name: displayColor,
                    fabric_name: s.fabric_article || s.fabric_type || '',
                    kumasci: kumasci || '',
                    kalite_adi: kaliteAdi || '',
                    kalite_kodu: kaliteKodu || '',
                    varyant: varyant || '',
                    kumas_renk: kumasRenk || '',
                    qty: qty,
                    price: price,
                    fb1_price: fb1Price,
                    fb1_cm: fb1Cm,
                    fb1_total: fb1Total,
                    fb2_price: fb2Price,
                    fb2_gramaj: fb2Gramaj,
                    fb2_total: fb2Total,
                    fb3_price: fb3Price,
                    fb3_gramaj: fb3Gramaj,
                    fb3_total: fb3Total,
                    kumas_toplam: kumasToplam,
                    v_fason: vFason,
                    v_kesim: vKesim,
                    v_aks: vAks,
                    v_etkol: vEtkol,
                    v_logo: vLogo,
                    v_brit: vBrit,
                    v_lastik: vLastik,
                    v_dugme: vDugme,
                    v_citcit: vCitcit,
                    v_diger: vDiger,
                    v_kargo: vKargo,
                    v_nakliye: vNakliye,
                    v_kumas_extra: vKumasExtra,
                    v_astar: vAstar,
                    v_dikme: vDikme,
                    v_ilik_dugme: vIlikDugme,
                    v_citcit_cakim: vCitcitCakim,
                    maliyet_tl: maliyetTL,
                    maliyet_eur: maliyetEUR,
                    eur_rate: eurRate,
                    tot_maliyet_tl: totMaliyetTL,
                    tot_maliyet_eur: totMaliyetEUR,
                    order_toplam: orderToplam
                };
            });

                budgetModalOpen.value = true;
                budgetSearchQuery.value = '';
                setTimeout(() => { refreshIcons(); }, 80);
            } catch (err) {
                console.error('[ERROR] openBudgetModal failed:', err);
            }
        };

        const closeBudgetModal = () => {
            budgetModalOpen.value = false;
        };

        const budgetFilteredRows = computed(() => {
            const list = budgetRows.value || [];
            const q = (budgetSearchQuery.value || '').toLowerCase().trim();
            if (!q) return list;
            return list.filter(r => {
                return (r.style_no && r.style_no.toLowerCase().includes(q)) ||
                       (r.color_name && r.color_name.toLowerCase().includes(q)) ||
                       (r.fabric_name && r.fabric_name.toLowerCase().includes(q)) ||
                       (r.kumasci && r.kumasci.toLowerCase().includes(q)) ||
                       (r.kalite_adi && r.kalite_adi.toLowerCase().includes(q)) ||
                       (r.kalite_kodu && r.kalite_kodu.toLowerCase().includes(q)) ||
                       (r.varyant && r.varyant.toLowerCase().includes(q)) ||
                       (r.kumas_renk && r.kumas_renk.toLowerCase().includes(q)) ||
                       (r.cust_season && r.cust_season.toLowerCase().includes(q)) ||
                       (r.model_color && r.model_color.toLowerCase().includes(q));
            });
        });

        const budgetTotals = computed(() => {
            const list = budgetFilteredRows.value || [];
            let total_qty = 0;
            let total_maliyet_tl = 0;
            let total_maliyet_eur = 0;
            let total_order = 0;
            list.forEach(r => {
                total_qty += r.qty || 0;
                total_maliyet_tl += r.tot_maliyet_tl || 0;
                total_maliyet_eur += r.tot_maliyet_eur || 0;
                total_order += r.order_toplam || 0;
            });
            return {
                total_qty,
                total_maliyet_tl: Math.round(total_maliyet_tl * 100) / 100,
                total_maliyet_eur: Math.round(total_maliyet_eur * 100) / 100,
                total_order: Math.round(total_order * 100) / 100
            };
        });

        const exportBudgetExcel = async () => {
            try {
                const styleIds = (budgetFilteredRows.value || []).map(r => r.id);
                if (styleIds.length === 0) {
                    showToast('Dışa aktarılacak model bulunamadı.', 'warning');
                    return;
                }

                showToast('Bütçe Excel dosyası hazırlanıyor...', 'info');
                const tokenVal = token.value || localStorage.getItem('texflow_token') || '';
                const res = await fetch('/api/styles/export-budget-excel', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(tokenVal ? { 'Authorization': `Bearer ${tokenVal}` } : {})
                    },
                    body: JSON.stringify({ style_ids: styleIds })
                });

                if (!res.ok) {
                    const errText = await res.text().catch(() => '');
                    throw new Error(`HTTP ${res.status}: ${errText || 'Bilinmeyen hata'}`);
                }

                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const dStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                a.download = `Butce_Tablosu_${dStr}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                showToast('Bütçe Excel dosyası başarıyla indirildi.', 'success');
            } catch (err) {
                console.error('Excel indirme hatası:', err);
                showToast('Excel indirme hatası: ' + err.message, 'error');
            }
        };

        let refreshIconsTimer = null;
        const refreshIcons = () => {
            if (refreshIconsTimer) return;
            refreshIconsTimer = setTimeout(() => {
                refreshIconsTimer = null;
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    const unparsed = document.querySelectorAll('i[data-lucide]');
                    if (unparsed.length > 0) {
                        window.lucide.createIcons();
                    }
                }
            }, 60);
        };

        const apiFetch = async (url, options = {}) => {
            const headers = options.headers || {};
            if (token.value) {
                headers['Authorization'] = `Bearer ${token.value}`;
            }
            if (!(options.body instanceof FormData)) {
                headers['Content-Type'] = 'application/json';
            }
            
            const response = await fetch(url, { ...options, headers });
            if (response.status === 401) {
                token.value = '';
                currentUser.value = null;
                localStorage.removeItem('texflow_token');
                throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapınız.');
            }
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                let msg = 'İşlem başarısız.';
                if (typeof errData.detail === 'string') {
                    msg = errData.detail;
                } else if (Array.isArray(errData.detail)) {
                    msg = errData.detail.map(d => d.msg || (d.loc ? d.loc.join('.') : '') || JSON.stringify(d)).join(', ');
                } else if (errData.message) {
                    msg = errData.message;
                }
                throw new Error(msg);
            }
            return response.json();
        };


        const login = async () => {
            loading.value = true;
            loginError.value = '';
            try {
                const res = await apiFetch('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify(loginForm.value)
                });
                token.value = res.token;
                currentUser.value = res;
                localStorage.setItem('texflow_token', res.token);
                await loadInitialData();
            } catch (err) {
                loginError.value = err.message;
            } finally {
                loading.value = false;
                refreshIcons();
            }
        };

        const fillLogin = (u, p) => {
            loginForm.value.username = u;
            loginForm.value.password = p;
            login();
        };

        const logout = () => {
            if (token.value) {
                fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token.value}` }
                }).catch(() => {});
            }
            token.value = '';
            currentUser.value = null;
            loginForm.value.username = '';
            loginForm.value.password = '';
            localStorage.removeItem('texflow_token');
            refreshIcons();
        };

        const checkAuth = async () => {
            if (!token.value) {
                authChecking.value = false;
                return;
            }
            try {
                const user = await apiFetch('/api/auth/me');
                currentUser.value = user;
                await loadInitialData();
            } catch (e) {
                token.value = '';
                currentUser.value = null;
                localStorage.removeItem('texflow_token');
            } finally {
                authChecking.value = false;
            }
        };

        const loadInitialData = async () => {
            try {
                menus.value = await apiFetch('/api/menus');
                loadFabrics().catch(() => {});
                await loadStats();
                await loadStyles();
                if (currentUser.value?.role === 'superadmin') {
                    loadCompanies();
                }
            } catch (e) {
                console.error(e);
            } finally {
                refreshIcons();
            }
        };

        const loadStats = async () => {
            stats.value = await apiFetch('/api/dashboard/stats');
        };

        const setDefaultStatusFilter = () => {
            if (!columnFilters.value['status']) {
                const savedDefault = localStorage.getItem('texflow_user_default_status_filter');
                if (savedDefault) {
                    try {
                        const parsed = JSON.parse(savedDefault);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            columnFilters.value['status'] = parsed;
                            return;
                        }
                    } catch (e) {}
                }
                const allStatuses = getDistinctValuesForColumn('status');
                if (allStatuses && allStatuses.length > 0) {
                    const excluded = new Set(['İptal oldu', 'İptal Edildi', 'Sevk Edildi', 'Yükleme / Sevk Edildi']);
                    columnFilters.value['status'] = allStatuses.filter(st => !excluded.has(st));
                }
            }
        };


        const loadStyles = async () => {
            try {
                const data = await apiFetch('/api/styles');
                if (data && data.styles) {
                    styles.value = data.styles;
                    availableSizes.value = sortSizesList(data.available_sizes || []);
                    customColumnsList.value = data.custom_columns || [];
                } else if (Array.isArray(data)) {
                    styles.value = data;
                }
                buildColumns(availableSizes.value, customColumnsList.value);
                setDefaultStatusFilter();
            } catch (e) {
                console.error('Styles load error:', e);
            } finally {
                refreshIcons();
            }
        };


        // SINGLE SIZE INLINE UPDATE
        const updateSingleSizeInline = async (style, sizeName, newQtyVal) => {
            const q = parseInt(newQtyVal) || 0;
            try {
                const res = await apiFetch('/api/styles/update-single-size', {
                    method: 'POST',
                    body: JSON.stringify({
                        style_id: style.id,
                        size_name: sizeName,
                        quantity: q,
                        reason: `Beden ${sizeName} Revizyonu`
                    })
                });
                
                if (!style.size_map) style.size_map = {};
                style.size_map[sizeName] = q;
                style.total_quantity = res.new_total;

                if (!style.fabric_order_manual_override && (style.unit_meters || style.unit_grams)) {
                    const c1 = calculateFabricOrder(style, 1);
                    style.fabric_ordered_meters = c1.value;
                    style.fabric_order_unit = c1.unit;
                    await updateCellWithLog(style.id, 'fabric_ordered_meters', c1.value, `Beden revizyonu sonrası Kumaş 1 hesaplandı (${c1.formatted})`);
                    await updateCellWithLog(style.id, 'fabric_order_unit', c1.unit, 'Kumaş 1 Birimi');
                }
                if (!style.fabric_order_manual_override_2 && (style.unit_meters_2 || style.unit_grams_2)) {
                    const c2 = calculateFabricOrder(style, 2);
                    style.fabric_ordered_meters_2 = c2.value;
                    style.fabric_order_unit_2 = c2.unit;
                    await updateCellWithLog(style.id, 'fabric_ordered_meters_2', c2.value, `Beden revizyonu sonrası Kumaş 2 hesaplandı (${c2.formatted})`);
                    await updateCellWithLog(style.id, 'fabric_order_unit_2', c2.unit, 'Kumaş 2 Birimi');
                }

                loadStats();
                refreshIcons();
            } catch (e) {
                alert('Beden güncelleme hatası: ' + e.message);
            }
        };

        const updateCellWithLog = async (styleId, field, value, defaultReason = 'Kullanıcı Düzenlemesi') => {
            try {
                await apiFetch('/api/styles/update-cell', {
                    method: 'POST',
                    body: JSON.stringify({
                        style_id: styleId,
                        field: field,
                        value: value,
                        reason: defaultReason
                    })
                });
                
                const found = styles.value.find(s => s.id === styleId);
                if (found) {
                    found[field] = value;
                }
                loadStats();
            } catch (e) {
                alert('Güncelleme hatası: ' + e.message);
            } finally {
                refreshIcons();
            }
        };

        const getDisplayColor = (item) => {
            if (!item) return '';
            const code = (item.color_code || '').toString().trim();
            const name = (item.color_name || '').toString().trim();
            if (code && name) {
                if (name.toLowerCase().startsWith(code.toLowerCase())) {
                    return name;
                }
                return `${code} ${name}`;
            }
            return name || code || '';
        };

        const updateColorCell = async (item, val) => {
            if (!item) return;
            const newVal = (val || '').trim();
            item.color_name = newVal;
            await updateCellWithLog(item.id, 'color_name', newVal, 'Renk/Varyant Güncellendi');
        };

        // Navigation
        const setActiveMenu = (menuKey) => {
            activeMenu.value = menuKey;
            sidebarOpen.value = false;
            if (menuKey === 'carsaf_liste' || menuKey === 'kesimhane' || menuKey === 'yukleme_adetleri') loadStyles();
            if (menuKey === 'serbest_fiyat') loadFreeCostStudies();
            if (menuKey === 'fabrictag_entegrasyon') {
                loadFabrics();
                if (!styles.value || styles.value.length === 0) loadStyles().catch(() => {});
            }
            if (menuKey === 'audit_logs') loadGlobalAuditLogs();
            if (menuKey === 'dashboard') {
                loadStats();
                setTimeout(() => scrollToCurrentWeek(false), 120);
            }
            if (menuKey === 'kullanici_yonetimi') loadUsers();
            if (menuKey === 'menu_yonetimi') loadBackups();
            refreshIcons();
        };

        const getActiveMenuTitle = () => {
            const found = menus.value.find(m => m.menu_key === activeMenu.value);
            return found ? found.title_tr : 'Üretim Çarşaf Listesi';
        };

        const fabricAssignSlot = ref(1);
        const fabricAssignTarget = ref(null);
        const isAssigningFabric = ref(false);

        // Fabric Assignment Modal
        const openFabricAssignModal = (style, slot = 1, event = null) => {
            if (event) {
                event.stopPropagation();
            }
            fabricAssignTarget.value = style ? { ...style } : null;
            selectedStyle.value = style;
            fabricAssignSlot.value = slot;
            fabricSearch.value = '';
            fabricAssignModalOpen.value = true;
            loadFabrics();
            refreshIcons();
        };

        const closeFabricAssignModal = () => {
            fabricAssignModalOpen.value = false;
            fabricAssignTarget.value = null;
            isAssigningFabric.value = false;
            refreshIcons();
        };

        const buildFabricFormattedName = (fabric) => {
            if (!fabric) return '';
            const qName = isInvalidOrKodsuz(fabric.quality_name) ? '' : String(fabric.quality_name).trim();
            const qCode = isInvalidOrKodsuz(fabric.quality_code) ? '' : String(fabric.quality_code).trim();
            const parts = [];
            if (fabric.company_name) parts.push(fabric.company_name);
            const qual = [qName, qCode ? `(${qCode})` : ''].filter(Boolean).join(' ');
            if (qual) parts.push(qual);
            if (fabric.design_code) parts.push(fabric.design_code);
            return parts.join(' - ') || `${fabric.company_name || ''} - ${qName || qCode || fabric.internal_code || ''}`.trim();
        };

        const assignFabricToStyle = async (fabric) => {
            if (isAssigningFabric.value) return;
            const target = fabricAssignTarget.value || selectedStyle.value;
            if (!target) return;

            const slot = fabricAssignSlot.value || 1;
            const targetId = target.id;
            const isManualNew = !targetId;
            const fullName = buildFabricFormattedName(fabric);

            if (isManualNew) {
                if (slot === 2) {
                    newManualRow.value.fabric_article_2 = fullName;
                    newManualRow.value.fabric_composition_2 = fabric.composition || '';
                    newManualRow.value.fabrictag_width_2 = fabric.width || '';
                    newManualRow.value.fabrictag_weight_2 = fabric.weight || '';
                } else {
                    newManualRow.value.fabric_article = fullName;
                    newManualRow.value.fabric_composition = fabric.composition || '';
                    newManualRow.value.fabrictag_width = fabric.width || '';
                    newManualRow.value.fabrictag_weight = fabric.weight || '';
                }
                closeFabricAssignModal();
                return;
            }

            try {
                isAssigningFabric.value = true;
                await apiFetch('/api/styles/assign-fabric', {
                    method: 'POST',
                    body: JSON.stringify({
                        style_id: targetId,
                        fabrictag_id: fabric.id,
                        fabric_name: fullName,
                        composition: fabric.composition,
                        supplier: fabric.company_name,
                        fabric_slot: slot
                    })
                });
                closeFabricAssignModal();
                await loadStyles();
            } catch (e) {
                isAssigningFabric.value = false;
                alert('Kumaş atama hatası: ' + e.message);
            }
        };

        const detachFabricFromStyle = async () => {
            if (isAssigningFabric.value) return;
            const target = fabricAssignTarget.value || selectedStyle.value;
            if (!target) return;

            const slot = fabricAssignSlot.value || 1;
            const targetId = target.id;
            const isManualNew = !targetId;

            if (!confirm(`Kumaş ${slot} atamasını iptal etmek ve seçimi kaldırmak istediğinize emin misiniz?`)) {
                return;
            }

            if (isManualNew) {
                if (slot === 2) {
                    newManualRow.value.fabric_article_2 = '';
                    newManualRow.value.fabric_composition_2 = '';
                    newManualRow.value.fabrictag_width_2 = '';
                    newManualRow.value.fabrictag_weight_2 = '';
                } else {
                    newManualRow.value.fabric_article = '';
                    newManualRow.value.fabric_composition = '';
                    newManualRow.value.fabrictag_width = '';
                    newManualRow.value.fabrictag_weight = '';
                }
                closeFabricAssignModal();
                return;
            }

            try {
                isAssigningFabric.value = true;
                await apiFetch('/api/styles/detach-fabric', {
                    method: 'POST',
                    body: JSON.stringify({
                        style_id: targetId,
                        fabric_slot: slot
                    })
                });
                closeFabricAssignModal();
                await loadStyles();
            } catch (e) {
                alert('Kumaş atamasını kaldırma hatası: ' + e.message);
            } finally {
                isAssigningFabric.value = false;
            }
        };




        // Audit Logs Modal
        const openAuditModal = async (style) => {
            selectedStyle.value = style;
            styleAuditLogs.value = [];
            auditModalOpen.value = true;
            refreshIcons();
            try {
                styleAuditLogs.value = await apiFetch(`/api/audit-logs?style_id=${style.id}`);
            } catch (err) {
                console.error(err);
            }
            refreshIcons();
        };

        const loadGlobalAuditLogs = async () => {
            globalAuditLogs.value = await apiFetch('/api/audit-logs?limit=100');
            refreshIcons();
        };

        // File Upload (MULTI-FILE SUPPORT: EXCEL & PDF)
        const handleFileDrop = (e) => {
            dragOver.value = false;
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                uploadAndParse(Array.from(e.dataTransfer.files));
            }
        };

        const handleFileSelect = (e) => {
            if (e.target.files && e.target.files.length > 0) {
                uploadAndParse(Array.from(e.target.files));
            }
        };

        const uploadAndParse = async (filesList) => {
            const files = Array.isArray(filesList) ? filesList : [filesList];
            if (files.length === 0) return;
            uploadLoading.value = true;
            parsedPreview.value = null;
            try {
                const formData = new FormData();
                files.forEach(f => {
                    formData.append('files', f);
                });
                const res = await apiFetch('/api/upload/parse-preview', {
                    method: 'POST',
                    body: formData
                });


                parsedPreview.value = res;
            } catch (e) {
                alert('Ayrıştırma Hatası: ' + e.message);
            } finally {
                uploadLoading.value = false;
                refreshIcons();
            }
        };


        const getParsedSizesList = () => {
            if (!parsedPreview.value || !parsedPreview.value.data) return [];
            const szSet = new Set();
            parsedPreview.value.data.forEach(item => {
                if (item.size_distribution) {
                    Object.entries(item.size_distribution).forEach(([s, qty]) => {
                        const q = parseInt(qty) || 0;
                        if (q > 0 && String(s).trim()) {
                            szSet.add(String(s).trim());
                        }
                    });
                }
            });
            if (szSet.size === 0) {
                parsedPreview.value.data.forEach(item => {
                    if (item.size_distribution) {
                        Object.keys(item.size_distribution).forEach(s => {
                            if (String(s).trim()) szSet.add(String(s).trim());
                        });
                    }
                });
            }
            if (szSet.size === 0) {
                return ['S', 'M', 'L', 'XL', 'XXL'];
            }
            return sortSizesList(Array.from(szSet));
        };

        const updateParsedSize = (item, sz, val) => {
            if (!item.size_distribution) item.size_distribution = {};
            const q = parseInt(val) || 0;
            item.size_distribution[sz] = q;
            item.total_quantity = Object.values(item.size_distribution).reduce((a, b) => a + (parseInt(b) || 0), 0);
        };

        const calculateItemTotal = (item) => {
            if (item.size_distribution && Object.keys(item.size_distribution).length > 0) {
                const sum = Object.values(item.size_distribution).reduce((a, b) => a + (parseInt(b) || 0), 0);
                if (sum > 0) {
                    item.total_quantity = sum;
                    return sum;
                }
            }
            return item.total_quantity || 0;
        };

        const addPreviewRow = () => {
            if (!parsedPreview.value) {
                parsedPreview.value = { type: 'MANUEL_GIRIS', count: 0, data: [] };
            }
            if (!parsedPreview.value.data) parsedPreview.value.data = [];
            
            const sizes = {};
            const szList = getParsedSizesList();
            szList.forEach(s => sizes[s] = 0);
            
            parsedPreview.value.data.push({
                customer_name: 'Anna van Toor B.V.',
                brand: 'Anna',
                po_number: '7874',
                style_no: '43a01-Adele',
                description: 'Blazer Adele',
                color_name: 'Light Camel Dessin',
                color_code: '431-2',
                order_date: new Date().toLocaleDateString('tr-TR'),
                delivery_date: '',
                size_distribution: sizes,
                total_quantity: 0,
                unit_price: 0.0,
                status: 'Planlamada'
            });
            refreshIcons();
        };

        const removePreviewRow = (idx) => {
            if (!parsedPreview.value || !parsedPreview.value.data) return;
            parsedPreview.value.data.splice(idx, 1);
            refreshIcons();
        };

        const clearParsedPreview = () => {
            if (parsedPreview.value && parsedPreview.value.data && parsedPreview.value.data.length > 0) {
                if (!confirm('Yüklenen sipariş önizleme listesini temizlemek istediğinize emin misiniz?')) {
                    return;
                }
            }
            parsedPreview.value = null;
            const fileInputs = document.querySelectorAll('input[type="file"]');
            fileInputs.forEach(input => { input.value = ''; });
            refreshIcons();
        };

        const confirmImport = async () => {
            if (!parsedPreview.value || !parsedPreview.value.data || parsedPreview.value.data.length === 0) {
                alert('Aktarılacak sipariş satırı bulunamadı.');
                return;
            }
            importing.value = true;
            try {
                const res = await apiFetch('/api/upload/confirm-import', {
                    method: 'POST',
                    body: JSON.stringify({
                        file_path: parsedPreview.value.file_path || '',
                        filename: parsedPreview.value.filename || 'siparis_aktarim.pdf',
                        source_type: parsedPreview.value.type || 'PDF_GENERIC',
                        items: parsedPreview.value.data
                    })
                });
                alert('✅ ' + res.message);
                parsedPreview.value = null;
                activeMenu.value = 'carsaf_liste';
                localStorage.removeItem(getUserLayoutStorageKey());
                await loadStyles();

                await loadStats();
            } catch (e) {
                alert('Kayıt Hatası: ' + e.message);
            } finally {
                importing.value = false;
                refreshIcons();
            }
        };

        const loadFabrics = async () => {
            const q = fabricSearch.value ? `?q=${encodeURIComponent(fabricSearch.value)}` : '';
            fabricsList.value = await apiFetch(`/api/fabrictag/fabrics${q}`);
        };

        // MESAJ KUTUSU
        const openLogModal = async (style) => {
            selectedStyle.value = style;
            selectedStyleLogs.value = style.recent_logs || [];
            newLogText.value = '';
            logModalOpen.value = true;
            refreshIcons();

            try {
                const logs = await apiFetch(`/api/styles/${style.id}/logs`);
                if (Array.isArray(logs)) {
                    selectedStyleLogs.value = logs;
                    style.recent_logs = logs;
                }
            } catch (err) {
                console.error('Logs fetch error:', err);
            } finally {
                refreshIcons();
            }
        };

        const addLog = async () => {
            const msg = String(newLogText.value || '').trim();
            if (!msg || !selectedStyle.value) return;

            const userName = currentUser.value?.full_name || currentUser.value?.username || 'Yönetici';
            const tempLog = {
                id: Date.now(),
                user_name: userName,
                category: 'Durum Notu',
                title: 'Kullanıcı Notu',
                message: msg,
                created_at: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            };
            
            selectedStyleLogs.value.unshift(tempLog);
            if (!selectedStyle.value.recent_logs) selectedStyle.value.recent_logs = [];
            selectedStyle.value.recent_logs.unshift(tempLog);
            newLogText.value = '';

            try {
                await apiFetch(`/api/styles/${selectedStyle.value.id}/logs`, {
                    method: 'POST',
                    body: JSON.stringify({
                        category: 'Durum Notu',
                        title: 'Kullanıcı Notu',
                        message: msg
                    })
                });
                await loadStyles();
            } catch (e) {
                alert('Not eklenemedi: ' + e.message);
            } finally {
                refreshIcons();
            }
        };

        const loadCompanies = async () => {
            companiesList.value = await apiFetch('/api/superadmin/companies');
        };

        const createCompany = async () => {
            try {
                await apiFetch('/api/superadmin/companies', {
                    method: 'POST',
                    body: JSON.stringify(newCompany.value)
                });
                alert('Firma ve lisans başarıyla oluşturuldu!');
                newCompany.value = {
                    name: '',
                    code: '',
                    license_key: 'TEX-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
                    license_expires_at: '2027-12-31',
                    max_users: 20
                };
                loadCompanies();
            } catch (e) {
                alert('Hata: ' + e.message);
            }
        };

        // =========================================================================
        // KESİMHANE MODÜLÜ (ASORTİ, METRAJ & FİLTRELEME MOTORU)
        // =========================================================================
        const cuttingSearch = ref('');
        const cuttingZoomImage = ref(null);
        const cuttingSavingId = ref(null);
        const cuttingSaveSuccessId = ref(null);

        const openCuttingZoom = (item) => {
            if (!item) return;
            const url = item.image_url || item.image_url_2 || (typeof item === 'string' ? item : null);
            if (url) {
                cuttingZoomImage.value = {
                    url: url,
                    style_no: item.style_no || '',
                    po_number: item.po_number || '',
                    customer_name: item.customer_name || '',
                    color_name: item.color_name || ''
                };
                nextTick(() => {
                    if (window.lucide) lucide.createIcons();
                });
            }
        };

        const closeCuttingZoom = () => {
            cuttingZoomImage.value = null;
        };

        const filteredCuttingStyles = computed(() => {
            const list = styles.value || [];
            const q = (cuttingSearch.value || '').trim().toLowerCase();
            if (!q) return list;

            return list.filter(s => {
                const po = String(s.po_number || '').toLowerCase();
                const cust = String(s.customer_name || '').toLowerCase();
                const brand = String(s.brand || '').toLowerCase();
                const st = String(s.style_no || '').toLowerCase();
                const desc = String(s.description || '').toLowerCase();
                const col = String(s.color_name || '').toLowerCase();
                const colCode = String(s.color_code || '').toLowerCase();
                const art = String(s.fabric_article || '').toLowerCase();
                const fType = String(s.fabric_type || '').toLowerCase();
                const qName = String(s.fabric_quality_name_1 || '').toLowerCase();
                const qCode = String(s.fabric_quality_code_1 || '').toLowerCase();
                const fVar1 = String(s.fabric_variant_1 || '').toLowerCase();
                const fVar2 = String(s.fabric_variant_2 || '').toLowerCase();
                const dispTitle = String(s.fabric_display_title_1 || '').toLowerCase();
                const dispTitle2 = String(s.fabric_display_title_2 || '').toLowerCase();

                return po.includes(q) || cust.includes(q) || brand.includes(q) || st.includes(q) ||
                       desc.includes(q) || col.includes(q) || colCode.includes(q) || art.includes(q) ||
                       fType.includes(q) || qName.includes(q) || qCode.includes(q) ||
                       fVar1.includes(q) || fVar2.includes(q) ||
                       dispTitle.includes(q) || dispTitle2.includes(q);
            });
        });

        const getCuttingFabricName = (s, slot = 1) => {
            if (!s) return '-';
            const comp = slot === 1 ? s.fabric_company_1 : s.fabric_company_2;
            if (comp) return comp;
            const fLink = slot === 1 ? s.fabric_link : s.fabric_link_2;
            if (fLink && fLink.supplier) return fLink.supplier;
            const fType = slot === 1 ? s.fabric_type : s.fabric_type_2;
            if (fType) return fType;
            const fArt = slot === 1 ? s.fabric_article : s.fabric_article_2;
            if (fArt) {
                if (fArt.includes(' - ')) {
                    return fArt.split(' - ')[0].trim();
                }
                return fArt;
            }
            return '-';
        };

        const getCuttingFabricVariant = (s, slot = 1) => {
            if (!s) return '';
            const fVar = slot === 1 ? s.fabric_variant_1 : s.fabric_variant_2;
            if (fVar) return fVar;
            const fLink = slot === 1 ? s.fabric_link : s.fabric_link_2;
            if (fLink && fLink.fabrictag_id && fabricsList.value && fabricsList.value.length > 0) {
                const found = fabricsList.value.find(f => f.id === fLink.fabrictag_id);
                if (found && found.design_code) return found.design_code;
            }
            const raw = (slot === 2 ? (s.fabric_article_2 || s.fabric_type_2) : (s.fabric_article || s.fabric_type)) || '';
            const match = String(raw).match(/ELT\d+/i);
            if (match && fabricsList.value && fabricsList.value.length > 0) {
                const found = fabricsList.value.find(f => f.internal_code && f.internal_code.toUpperCase() === match[0].toUpperCase());
                if (found && found.design_code) return found.design_code;
            }
            return '';
        };

        const getCuttingRemainingMeters = (s) => {
            if (!s) return '0.0';
            const recM = parseFloat(s.fabric_received_meters || 0) || 0.0;
            const cutM = parseFloat(s.cut_meters || 0) || 0.0;
            const diff = recM - cutM;
            return diff.toFixed(1);
        };

        const getCuttingStyleOrderTotal = (s) => {
            if (!s) return 0;
            if (s.sizes && s.sizes.length > 0) {
                return s.sizes.reduce((acc, z) => acc + (parseInt(z.quantity || 0) || 0), 0);
            }
            return parseInt(s.total_quantity || 0) || 0;
        };

        const getCuttingStyleCutTotal = (s) => {
            if (!s) return 0;
            if (s.sizes && s.sizes.length > 0) {
                return s.sizes.reduce((acc, z) => acc + (parseInt(z.cut_quantity || 0) || 0), 0);
            }
            return 0;
        };

        const getCuttingStyleDiff = (s) => {
            return getCuttingStyleCutTotal(s) - getCuttingStyleOrderTotal(s);
        };

        const calculateActualUnitMeters = (s) => {
            if (!s) return '0.00';
            const cutM = parseFloat(s.cut_meters || 0) || 0;
            const cutQty = getCuttingStyleCutTotal(s);
            if (cutM > 0 && cutQty > 0) {
                return (cutM / cutQty).toFixed(2);
            }
            return (parseFloat(s.actual_unit_meters || 0) || 0).toFixed(2);
        };

        let cuttingDebounceTimer = null;
        const onCuttingInputChange = (s) => {
            s.actual_unit_meters = parseFloat(calculateActualUnitMeters(s)) || 0.0;
            if (cuttingDebounceTimer) clearTimeout(cuttingDebounceTimer);
            cuttingDebounceTimer = setTimeout(() => {
                saveCuttingRow(s, false);
            }, 800);
        };

        const saveCuttingRow = async (s, showToast = true) => {
            if (!s || !s.id) return;
            cuttingSavingId.value = s.id;
            try {
                const sizesPayload = (s.sizes || []).map(z => ({
                    size_name: String(z.size_name || '').trim(),
                    cut_quantity: parseInt(z.cut_quantity || 0) || 0
                }));
                const res = await apiFetch('/api/cutting/update', {
                    method: 'POST',
                    body: JSON.stringify({
                        style_id: s.id,
                        cut_meters: parseFloat(s.cut_meters || 0) || 0.0,
                        sizes: sizesPayload
                    })
                });
                s.cut_meters = res.cut_meters;
                s.actual_unit_meters = res.actual_unit_meters;
                if (res.cutting_date) s.cutting_date = res.cutting_date;
                cuttingSaveSuccessId.value = s.id;
                setTimeout(() => {
                    if (cuttingSaveSuccessId.value === s.id) cuttingSaveSuccessId.value = null;
                }, 2500);
                if (showToast) {
                    alert('✅ Kesimhane bilgileri başarıyla kaydedildi.');
                }
            } catch (err) {
                console.error('Kesimhane kaydetme hatası:', err);
                if (showToast) {
                    alert('Kayıt Hatası: ' + err.message);
                }
            } finally {
                cuttingSavingId.value = null;
            }
        };

        // =========================================================================
        // KESİM FİŞİ MODÜLÜ (A4 YATAY BASKI & EXCEL ŞABLONU)
        // =========================================================================
        const cuttingSlipModalOpen = ref(false);
        const selectedCuttingSlipModelKey = ref('');
        const selectedCuttingSlipChannel = ref('');
        const cuttingSlipDate = ref(new Date().toLocaleDateString('tr-TR'));

        watch(selectedCuttingSlipModelKey, () => {
            selectedCuttingSlipChannel.value = '';
        });

        const cuttingSlipModels = computed(() => {
            const list = styles.value || [];
            const groups = {};

            for (const s of list) {
                const cust = (s.customer_name || 'Bilinmeyen Müşteri').trim();
                const brand = (s.brand || 'Bilinmeyen Marka').trim();
                const styleNo = (s.style_no || 'Model Yok').trim();
                const key = `${cust}___${brand}___${styleNo}`;

                if (!groups[key]) {
                    groups[key] = {
                        key: key,
                        customer_name: cust,
                        brand: brand,
                        style_no: styleNo,
                        image_url: s.image_url || s.image_url_2 || null,
                        raw_styles: [],
                        channels: [],
                        _distinctColors: new Set()
                    };
                }

                if (!groups[key].image_url && (s.image_url || s.image_url_2)) {
                    groups[key].image_url = s.image_url || s.image_url_2;
                }

                groups[key].raw_styles.push(s);

                const ch = (s.channel || '').toString().trim();
                if (ch && !groups[key].channels.includes(ch)) {
                    groups[key].channels.push(ch);
                }

                let colName = (s.color_name || '').trim();
                let colCode = (s.color_code || '').trim();
                let displayColor = colName;
                if (colCode && colName && !colName.toLowerCase().startsWith(colCode.toLowerCase())) {
                    displayColor = `${colCode} ${colName}`;
                } else if (!displayColor) {
                    displayColor = colCode || 'Standart Renk';
                }
                groups[key]._distinctColors.add(displayColor);
            }

            for (const g of Object.values(groups)) {
                g.colorsCount = g._distinctColors.size || 1;
                g.colors = { length: g.colorsCount };
                g.channels.sort((a, b) => a.localeCompare(b, 'tr', { sensitivity: 'base' }));
            }

            return Object.values(groups);
        });

        const activeSlipModelAvailableChannels = computed(() => {
            const list = cuttingSlipModels.value || [];
            if (!list.length) return [];
            let modelGroup = null;
            if (selectedCuttingSlipModelKey.value) {
                modelGroup = list.find(m => m.key === selectedCuttingSlipModelKey.value);
            }
            if (!modelGroup) modelGroup = list[0];
            return modelGroup?.channels || [];
        });

        const slipRowDensity = ref('auto'); // 'auto', 'tight', 'compact', 'normal'

        const effectiveSlipDensity = computed(() => {
            if (slipRowDensity.value !== 'auto') return slipRowDensity.value;
            const numColors = activeSlipModel.value?.colors?.length || 1;
            if (numColors >= 7) return 'tight';
            if (numColors >= 4) return 'compact';
            return 'normal';
        });

        const activeSlipModel = computed(() => {
            const list = cuttingSlipModels.value || [];
            if (!list.length) return null;
            let modelGroup = null;
            if (selectedCuttingSlipModelKey.value) {
                modelGroup = list.find(m => m.key === selectedCuttingSlipModelKey.value);
            }
            if (!modelGroup) modelGroup = list[0];
            if (!modelGroup) return null;

            const chFilter = (selectedCuttingSlipChannel.value || '').trim();
            const ignoreChannel = (chFilter === '__NONE__' || chFilter.toLowerCase() === 'yok');

            let filteredStyles = modelGroup.raw_styles || [];
            if (chFilter && !ignoreChannel) {
                filteredStyles = filteredStyles.filter(s => {
                    const ch = (s.channel || '').toString().trim();
                    return ch === chFilter;
                });
            }

            const colors = [];
            const sizesList = [];
            const normalizeCol = (str) => (str || '').trim().toLocaleLowerCase('tr-TR');

            for (const s of filteredStyles) {
                let colName = (s.color_name || '').trim();
                let colCode = (s.color_code || '').trim();
                let displayColor = colName;
                if (colCode && colName && !colName.toLowerCase().startsWith(colCode.toLowerCase())) {
                    displayColor = `${colCode} ${colName}`;
                } else if (!displayColor) {
                    displayColor = colCode || 'Standart Renk';
                }

                const normDisplay = normalizeCol(displayColor);
                const normName = normalizeCol(colName);
                const normCode = normalizeCol(colCode);
                const styleChannel = ignoreChannel ? '' : (s.channel || '').toString().trim();

                let existingColor = colors.find(c => {
                    const isSameColor = (normalizeCol(c.color_name) === normDisplay) ||
                        (c.raw_color_name && normName && normalizeCol(c.raw_color_name) === normName &&
                         (!normalizeCol(c.raw_color_code) || !normCode || normalizeCol(c.raw_color_code) === normCode));
                    const isSameChannel = ignoreChannel ? true : ((c.channel || '') === styleChannel);
                    return isSameColor && isSameChannel;
                });

                if (existingColor) {
                    if (s.sizes && s.sizes.length > 0) {
                        for (const sz of s.sizes) {
                            const sn = (sz.size_name || '').trim();
                            if (sn) {
                                if (!sizesList.includes(sn)) {
                                    sizesList.push(sn);
                                }
                                const qty = parseInt(sz.quantity || 0) || 0;
                                existingColor.sizes[sn] = (existingColor.sizes[sn] || 0) + qty;
                                existingColor.total = (parseInt(existingColor.total || 0) || 0) + qty;
                            }
                        }
                    } else {
                        const qty = parseInt(s.total_quantity || 0) || 0;
                        existingColor.total = (parseInt(existingColor.total || 0) || 0) + qty;
                    }
                } else {
                    const colorSizes = {};
                    let colorTotal = 0;
                    if (s.sizes && s.sizes.length > 0) {
                        for (const sz of s.sizes) {
                            const sn = (sz.size_name || '').trim();
                            if (sn) {
                                if (!sizesList.includes(sn)) {
                                    sizesList.push(sn);
                                }
                                const qty = parseInt(sz.quantity || 0) || 0;
                                colorSizes[sn] = qty;
                                colorTotal += qty;
                            }
                        }
                    } else {
                        colorTotal = parseInt(s.total_quantity || 0) || 0;
                    }

                    colors.push({
                        id: `${s.id}_${colors.length}_${styleChannel}`,
                        color_name: displayColor,
                        raw_color_name: colName,
                        raw_color_code: colCode,
                        channel: styleChannel,
                        sizes: colorSizes,
                        total: colorTotal,
                        raw_style: s
                    });
                }
            }

            const sortedSizes = (typeof sortSizesList === 'function' && sizesList.length > 0)
                ? sortSizesList(sizesList)
                : sizesList;

            // Kesim fişinde adet bilgisi olmayan beden sütunlarını gizle (yer kaplamasın)
            const activeSizes = sortedSizes.filter(sz =>
                colors.some(c => (parseInt(c.sizes[sz] || 0) || 0) > 0)
            );
            const finalSizesList = activeSizes.length > 0 ? activeSizes : sortedSizes;

            // Varyant bilgisi ile ilk beden arasına eğer kanal bilgisi var ise Kanal sütunu aç
            // "Yok" seçildiğinde kanal bilgisi tamamen yok sayılır ve Kanal sütunu gizlenir
            const hasChannelInfo = !ignoreChannel && colors.some(c => c.channel && c.channel.trim() !== '');

            return {
                key: modelGroup.key,
                customer_name: modelGroup.customer_name,
                brand: modelGroup.brand,
                style_no: modelGroup.style_no,
                image_url: modelGroup.image_url,
                colors: colors,
                sizesList: finalSizesList,
                channels: modelGroup.channels || [],
                hasChannelInfo: hasChannelInfo
            };
        });

        const getSlipModelGrandTotal = (model) => {
            if (!model || !model.colors) return 0;
            return model.colors.reduce((sum, c) => sum + (parseInt(c.total || 0) || 0), 0);
        };

        const openCuttingSlipModal = (style = null) => {
            cuttingSlipDate.value = new Date().toLocaleDateString('tr-TR');
            selectedCuttingSlipChannel.value = '';
            const models = cuttingSlipModels.value || [];
            if (models.length > 0) {
                // 1. Doğrudan karta tıklandıysa
                if (style) {
                    const cust = (style.customer_name || 'Bilinmeyen Müşteri').trim();
                    const brand = (style.brand || 'Bilinmeyen Marka').trim();
                    const st = (style.style_no || 'Model Yok').trim();
                    const targetKey = `${cust}___${brand}___${st}`;
                    const found = models.find(m => m.key === targetKey);
                    if (found) selectedCuttingSlipModelKey.value = found.key;
                } 
                // 2. Arama/süzgeç kutusunda model aranmışsa veya süzülmüş liste varsa
                else if (filteredCuttingStyles.value && filteredCuttingStyles.value.length > 0) {
                    // İlk süzülen modelin anahtarını bul
                    const first = filteredCuttingStyles.value[0];
                    const cust = (first.customer_name || 'Bilinmeyen Müşteri').trim();
                    const brand = (first.brand || 'Bilinmeyen Marka').trim();
                    const st = (first.style_no || 'Model Yok').trim();
                    const targetKey = `${cust}___${brand}___${st}`;
                    const found = models.find(m => m.key === targetKey);
                    if (found) {
                        selectedCuttingSlipModelKey.value = found.key;
                    } else {
                        selectedCuttingSlipModelKey.value = models[0].key;
                    }
                } else if (!selectedCuttingSlipModelKey.value) {
                    selectedCuttingSlipModelKey.value = models[0].key;
                }
            }
            cuttingSlipModalOpen.value = true;
            nextTick(() => {
                if (window.lucide) lucide.createIcons();
            });
        };

        const closeCuttingSlipModal = () => {
            cuttingSlipModalOpen.value = false;
        };

        const printCuttingSlip = () => {
            window.print();
        };

        const exportCuttingSlipExcel = async () => {
            const m = activeSlipModel.value;
            if (!m) return;
            try {
                const chFilter = (selectedCuttingSlipChannel.value || '').trim();
                const ignoreChannel = (chFilter === '__NONE__' || chFilter.toLowerCase() === 'yok');

                const payload = {
                    customer_name: m.customer_name || '',
                    brand: m.brand || '',
                    style_no: m.style_no || '',
                    channel: ignoreChannel ? '' : (selectedCuttingSlipChannel.value || ''),
                    date: cuttingSlipDate.value || '',
                    image_url: m.image_url || '',
                    sizes: m.sizesList || [],
                    has_channel_info: !ignoreChannel && !!m.hasChannelInfo,
                    colors: m.colors.map(c => ({
                        name: c.color_name,
                        channel: ignoreChannel ? '' : (c.channel || ''),
                        quantities: m.sizesList.map(sz => c.sizes[sz] !== undefined ? c.sizes[sz] : ''),
                        total: c.total
                    }))
                };

                const res = await fetch('/api/cutting/export-slip-excel', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    throw new Error('Sunucudan Excel dosyası alınamadı: ' + res.statusText);
                }

                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const cleanName = (m.style_no || 'Model').replace(/[^a-zA-Z0-9_-]/g, '_');
                const chPart = (selectedCuttingSlipChannel.value && !ignoreChannel) ? `_${selectedCuttingSlipChannel.value.replace(/[^a-zA-Z0-9_-]/g, '_')}` : '';
                a.download = `KESIM_FISI_${cleanName}${chPart}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } catch (err) {
                console.error('Excel export error:', err);
                alert('Excel dışa aktarma hatası: ' + err.message);
            }
        };

        // =========================================================================
        // YÜKLEME ADETLERİ & SEVKİYAT ASORTİSİ
        // =========================================================================
        const shippingSearch = ref('');
        const shippingSavingId = ref(null);
        const shippingSaveSuccessId = ref(null);

        const filteredShippingStyles = computed(() => {
            const list = styles.value || [];
            const q = (shippingSearch.value || '').trim().toLowerCase();
            if (!q) return list;

            return list.filter(s => {
                const po = String(s.po_number || '').toLowerCase();
                const cust = String(s.customer_name || '').toLowerCase();
                const brand = String(s.brand || '').toLowerCase();
                const st = String(s.style_no || '').toLowerCase();
                const desc = String(s.description || '').toLowerCase();
                const col = String(s.color_name || '').toLowerCase();
                const colCode = String(s.color_code || '').toLowerCase();
                const art = String(s.fabric_article || '').toLowerCase();
                const fType = String(s.fabric_type || '').toLowerCase();
                const qName = String(s.fabric_quality_name_1 || '').toLowerCase();
                const qCode = String(s.fabric_quality_code_1 || '').toLowerCase();
                const fVar1 = String(s.fabric_variant_1 || '').toLowerCase();
                const fVar2 = String(s.fabric_variant_2 || '').toLowerCase();
                const dispTitle = String(s.fabric_display_title_1 || '').toLowerCase();
                const dispTitle2 = String(s.fabric_display_title_2 || '').toLowerCase();

                return po.includes(q) || cust.includes(q) || brand.includes(q) || st.includes(q) ||
                       desc.includes(q) || col.includes(q) || colCode.includes(q) || art.includes(q) ||
                       fType.includes(q) || qName.includes(q) || qCode.includes(q) ||
                       fVar1.includes(q) || fVar2.includes(q) ||
                       dispTitle.includes(q) || dispTitle2.includes(q);
            });
        });

        const getShippingStyleOrderTotal = (s) => {
            return getCuttingStyleOrderTotal(s);
        };

        const getShippingStyleCutTotal = (s) => {
            return getCuttingStyleCutTotal(s);
        };

        const getShippingStyleShippedTotal = (s) => {
            if (!s || !s.sizes || s.sizes.length === 0) return 0;
            return s.sizes.reduce((acc, z) => acc + (parseInt(z.shipped_quantity || 0) || 0), 0);
        };

        const getShippedVsOrderPercent = (s) => {
            const ord = getShippingStyleOrderTotal(s);
            if (!ord || ord === 0) return '0%';
            const shp = getShippingStyleShippedTotal(s);
            return ((shp / ord) * 100).toFixed(1) + '%';
        };

        const getShippedVsCutPercent = (s) => {
            const cut = getShippingStyleCutTotal(s);
            if (!cut || cut === 0) return '0%';
            const shp = getShippingStyleShippedTotal(s);
            return ((shp / cut) * 100).toFixed(1) + '%';
        };

        const getShippingStyleDiff = (s) => {
            return getShippingStyleCutTotal(s) - getShippingStyleShippedTotal(s);
        };

        let shippingDebounceTimer = null;
        const onShippingInputChange = (s) => {
            if (shippingDebounceTimer) clearTimeout(shippingDebounceTimer);
            shippingDebounceTimer = setTimeout(() => {
                saveShippingRow(s, false);
            }, 800);
        };

        const saveShippingRow = async (s, showToast = true) => {
            if (!s || !s.id) return;
            shippingSavingId.value = s.id;
            try {
                const sizesPayload = (s.sizes || []).map(z => ({
                    size_name: String(z.size_name || '').trim(),
                    shipped_quantity: parseInt(z.shipped_quantity || 0) || 0
                }));
                const res = await apiFetch('/api/shipping/update', {
                    method: 'POST',
                    body: JSON.stringify({
                        style_id: s.id,
                        sizes: sizesPayload
                    })
                });
                s.shipping_date = res.shipping_date;
                shippingSaveSuccessId.value = s.id;
                setTimeout(() => {
                    if (shippingSaveSuccessId.value === s.id) shippingSaveSuccessId.value = null;
                }, 2500);
                if (showToast) {
                    alert('✅ Yükleme adetleri başarıyla kaydedildi.');
                }
            } catch (err) {
                console.error('Yükleme kaydetme hatası:', err);
                if (showToast) {
                    alert('Kayıt Hatası: ' + err.message);
                }
            } finally {
                shippingSavingId.value = null;
            }
        };

        // =========================================================================
        // KULLANICI & YETKİ YÖNETİMİ (RBAC & USER MANAGEMENT)
        // =========================================================================
        const usersList = ref([]);
        const usersLoading = ref(false);
        const userModalOpen = ref(false);
        const editingUser = ref(null);
        const userForm = ref({
            username: '',
            password: '',
            full_name: '',
            email: '',
            role: 'user',
            company_id: 1,
            permissions: {
                can_view_costs: false,
                can_edit_costs: false,
                can_create_orders: false,
                can_delete_orders: false,
                can_view_dashboard: false,
                can_manage_users: false,
                can_edit_menus: true,
                can_view_orders: true,
                can_view_fabrictag: true
            }
        });

        // ==========================================
        // TAM SİSTEM YEDEKLEME & RESTORE (BACKUP)
        // ==========================================
        const backupsList = ref([]);
        const backupConfig = ref({
            enabled: true,
            times: ['13:00', '17:00'],
            retention_count: 30,
            include_uploads: true,
            last_backup_time: ''
        });
        const backupLoading = ref(false);
        const backupCreating = ref(false);
        const newBackupTime = ref('13:00');
        const backupRestoreModalOpen = ref(false);
        const selectedBackupForRestore = ref(null);
        const backupRestoring = ref(false);
        const backupUploadLoading = ref(false);

        const loadBackups = async () => {
            backupLoading.value = true;
            try {
                const res = await apiFetch('/api/backup/list');
                if (res && res.status === 'success') {
                    backupsList.value = res.backups || [];
                    if (res.config) {
                        backupConfig.value = { ...backupConfig.value, ...res.config };
                    }
                }
            } catch (err) {
                console.error('Yedekler yüklenirken hata:', err);
            } finally {
                backupLoading.value = false;
                refreshIcons();
            }
        };

        const createBackupNow = async () => {
            if (backupCreating.value) return;
            backupCreating.value = true;
            try {
                const res = await apiFetch('/api/backup/create', { method: 'POST' });
                if (res && res.status === 'success') {
                    alert(`✅ Tam Sistem Yedeği Başarıyla Alındı!\n\nDosya: ${res.filename}\nBoyut: ${res.size_formatted}\nİçerik: Tüm veritabanı tabloları, siparişler, çarşaf listesi ve ${res.uploads_count || 0} adet dosya.`);
                    await loadBackups();
                } else {
                    alert('Yedekleme oluşturulamadı.');
                }
            } catch (err) {
                alert('Yedekleme sırasında hata oluştu: ' + (err.message || err));
            } finally {
                backupCreating.value = false;
                refreshIcons();
            }
        };

        const saveBackupSettings = async () => {
            try {
                const res = await apiFetch('/api/backup/config', {
                    method: 'POST',
                    body: JSON.stringify(backupConfig.value)
                });
                if (res && res.status === 'success') {
                    alert('✅ Otomatik yedekleme ayarları başarıyla kaydedildi.');
                    if (res.config) backupConfig.value = res.config;
                }
            } catch (err) {
                alert('Ayarlar kaydedilirken hata oluştu: ' + (err.message || err));
            }
        };

        const addBackupTime = () => {
            const t = String(newBackupTime.value || '').trim();
            if (!t) return;
            if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(t)) {
                alert('Lütfen geçerli bir saat girin (Örn: 13:00 veya 17:00)');
                return;
            }
            if (!backupConfig.value.times.includes(t)) {
                backupConfig.value.times.push(t);
                backupConfig.value.times.sort();
                saveBackupSettings();
            } else {
                alert('Bu saat zaten listede ekli.');
            }
        };

        const removeBackupTime = (t) => {
            if (backupConfig.value.times.length <= 1) {
                if (!confirm('Tüm saatleri kaldırmak istediğinize emin misiniz? Otomatik yedekleme için en az bir saat tanımlı olması önerilir.')) {
                    return;
                }
            }
            backupConfig.value.times = backupConfig.value.times.filter(x => x !== t);
            saveBackupSettings();
        };

        const downloadBackup = (filename) => {
            const url = `/api/backup/download/${encodeURIComponent(filename)}`;
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        const deleteBackupItem = async (filename) => {
            if (!confirm(`"${filename}" yedeğini diskten kalıcı olarak silmek istediğinize emin misiniz?`)) return;
            try {
                const res = await apiFetch(`/api/backup/${encodeURIComponent(filename)}`, { method: 'DELETE' });
                if (res && res.status === 'success') {
                    await loadBackups();
                } else {
                    alert(res.message || 'Silinemedi');
                }
            } catch (err) {
                alert('Yedek silinirken hata: ' + (err.message || err));
            }
        };

        const openRestoreModal = (b) => {
            selectedBackupForRestore.value = b;
            backupRestoreModalOpen.value = true;
            refreshIcons();
        };

        const confirmRestoreBackup = async () => {
            if (!selectedBackupForRestore.value) return;
            backupRestoring.value = true;
            try {
                const res = await apiFetch(`/api/backup/restore/${encodeURIComponent(selectedBackupForRestore.value.filename)}`, {
                    method: 'POST'
                });
                if (res && res.status === 'success') {
                    alert(`✅ Geri Yükleme Başarılı!\n\nSistem "${selectedBackupForRestore.value.filename}" yedeğine döndürüldü.\n\nℹ️ Güvenliğiniz için işlem öncesinde mevcut verilerinizin otomatik bir emniyet yedeği alınmıştır.`);
                    backupRestoreModalOpen.value = false;
                    await loadStyles();
                    await loadBackups();
                } else {
                    alert(res.message || 'Geri yükleme başarısız.');
                }
            } catch (err) {
                alert('Geri yükleme hatası: ' + (err.message || err));
            } finally {
                backupRestoring.value = false;
                refreshIcons();
            }
        };

        const handleBackupFileUpload = async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            if (!file.name.endsWith('.zip')) {
                alert('Lütfen sadece TexFlow .zip yedek dosyası seçin.');
                event.target.value = '';
                return;
            }
            if (!confirm(`"${file.name}" dosyasını sisteme yükleyip tüm veritabanı ve dosyaları bu yedeğe geri döndürmek istediğinize emin misiniz?\n\n(Mevcut verilerinizin güvenliği için önce otomatik emniyet yedeği alınacaktır.)`)) {
                event.target.value = '';
                return;
            }
            backupUploadLoading.value = true;
            const formData = new FormData();
            formData.append('file', file);
            try {
                const res = await apiFetch('/api/backup/upload-restore', {
                    method: 'POST',
                    body: formData
                });
                if (res && res.status === 'success') {
                    alert('✅ Yüklenen yedek başarıyla sisteme aktarıldı ve geri yüklendi!');
                    await loadStyles();
                    await loadBackups();
                } else {
                    alert('Yedek açılamadı: ' + (res.message || 'Bilinmeyen hata'));
                }
            } catch (err) {
                alert('Yedek yükleme hatası: ' + (err.message || err));
            } finally {
                backupUploadLoading.value = false;
                event.target.value = '';
                refreshIcons();
            }
        };

        const loadUsers = async () => {
            if (!hasPermission('can_manage_users')) return;
            usersLoading.value = true;
            try {
                usersList.value = await apiFetch('/api/users');
            } catch (err) {
                console.error('Kullanıcılar yüklenirken hata:', err);
            } finally {
                usersLoading.value = false;
                refreshIcons();
            }
        };

        const openAddUserModal = () => {
            editingUser.value = null;
            userForm.value = {
                username: '',
                password: '',
                full_name: '',
                email: '',
                role: 'user',
                company_id: currentUser.value?.company_id || 1,
                permissions: {
                    can_view_costs: false,
                    can_edit_costs: false,
                    can_create_orders: false,
                    can_delete_orders: false,
                    can_view_dashboard: false,
                    can_manage_users: false,
                    can_edit_menus: true,
                    can_view_orders: true,
                    can_view_fabrictag: true
                }
            };
            userModalOpen.value = true;
            refreshIcons();
        };

        const openEditUserModal = (u) => {
            editingUser.value = u;
            userForm.value = {
                username: u.username,
                password: '',
                full_name: u.full_name,
                email: u.email || '',
                role: u.role,
                company_id: u.company_id,
                permissions: {
                    can_view_costs: !!(u.permissions && u.permissions.can_view_costs),
                    can_edit_costs: !!(u.permissions && u.permissions.can_edit_costs),
                    can_create_orders: !!(u.permissions && u.permissions.can_create_orders),
                    can_delete_orders: !!(u.permissions && u.permissions.can_delete_orders),
                    can_view_dashboard: !!(u.permissions && u.permissions.can_view_dashboard),
                    can_manage_users: !!(u.permissions && u.permissions.can_manage_users),
                    can_edit_menus: true,
                    can_view_orders: true,
                    can_view_fabrictag: true
                }
            };
            userModalOpen.value = true;
            refreshIcons();
        };

        const onUserRoleChange = () => {
            const r = userForm.value.role;
            if (r === 'admin' || r === 'masterdeveloper' || r === 'superadmin') {
                userForm.value.permissions.can_view_costs = true;
                userForm.value.permissions.can_edit_costs = true;
                userForm.value.permissions.can_create_orders = true;
                userForm.value.permissions.can_delete_orders = true;
                userForm.value.permissions.can_view_dashboard = true;
                userForm.value.permissions.can_manage_users = true;
            } else if (r === 'merchandiser') {
                userForm.value.permissions.can_view_costs = false;
                userForm.value.permissions.can_edit_costs = false;
                userForm.value.permissions.can_create_orders = true;
                userForm.value.permissions.can_delete_orders = false;
                userForm.value.permissions.can_view_dashboard = true;
                userForm.value.permissions.can_manage_users = false;
            } else if (r === 'cutting' || r === 'fabric_warehouse' || r === 'user') {
                userForm.value.permissions.can_view_costs = false;
                userForm.value.permissions.can_edit_costs = false;
                userForm.value.permissions.can_create_orders = false;
                userForm.value.permissions.can_delete_orders = false;
                userForm.value.permissions.can_view_dashboard = false;
                userForm.value.permissions.can_manage_users = false;
            }
        };

        const saveUser = async () => {
            if (!userForm.value.username || !userForm.value.full_name) {
                alert('Kullanıcı adı ve Ad Soyad zorunludur.');
                return;
            }
            if (!editingUser.value && (!userForm.value.password || userForm.value.password.length < 4)) {
                alert('Yeni kullanıcı için en az 4 karakterli şifre giriniz.');
                return;
            }
            try {
                if (editingUser.value) {
                    await apiFetch(`/api/users/${editingUser.value.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            full_name: userForm.value.full_name,
                            email: userForm.value.email,
                            password: userForm.value.password ? userForm.value.password : undefined,
                            role: userForm.value.role,
                            permissions: userForm.value.permissions
                        })
                    });
                    alert('✅ Kullanıcı başarıyla güncellendi.');
                } else {
                    await apiFetch('/api/users', {
                        method: 'POST',
                        body: JSON.stringify(userForm.value)
                    });
                    alert('✅ Yeni kullanıcı başarıyla oluşturuldu.');
                }
                userModalOpen.value = false;
                await loadUsers();
            } catch (err) {
                alert('Hata: ' + (err.message || 'Kullanıcı kaydedilemedi'));
            }
        };

        const deleteUser = async (u) => {
            if (!confirm(`${u.full_name} (${u.username}) kullanıcısını kalıcı olarak silmek istediğinize emin misiniz?`)) {
                return;
            }
            try {
                await apiFetch(`/api/users/${u.id}`, { method: 'DELETE' });
                alert('✅ Kullanıcı silindi.');
                await loadUsers();
            } catch (err) {
                alert('Silme hatası: ' + err.message);
            }
        };

        // TCMB GÜNCEL DÖVİZ KURLARI (USD, EUR, GBP)
        const currencyRates = ref([]);
        const currencyDate = ref('');
        const currencyLoading = ref(false);

        const loadCurrencyRates = async (showFeedback = false) => {
            currencyLoading.value = true;
            try {
                const res = await apiFetch('/api/currency-rates');
                if (res && res.rates) {
                    currencyRates.value = res.rates;
                    currencyDate.value = res.date || '';
                }
            } catch (err) {
                console.warn('Currency load error:', err);
            } finally {
                currencyLoading.value = false;
                refreshIcons();
            }
        };

        // ----------------- MALİYET HESAPLAMA (COST CALCULATION ENGINE) -----------------
        const savedCostW = typeof localStorage !== 'undefined' ? localStorage.getItem('texflow_cost_modal_width') : null;
        const savedCostH = typeof localStorage !== 'undefined' ? localStorage.getItem('texflow_cost_modal_height') : null;
        const savedCostMax = typeof localStorage !== 'undefined' ? localStorage.getItem('texflow_cost_modal_maximized') : null;

        const costModalOpen = ref(false);
        const costStyle = ref(null);
        const costSaving = ref(false);
        const costModalWidth = ref(savedCostW ? Math.min(parseInt(savedCostW), (typeof window !== 'undefined' ? window.innerWidth - 16 : 1480)) : (typeof window !== 'undefined' ? Math.min(window.innerWidth - 32, 1480) : 1480));
        const costModalHeight = ref(savedCostH ? Math.min(parseInt(savedCostH), (typeof window !== 'undefined' ? window.innerHeight - 16 : 900)) : (typeof window !== 'undefined' ? Math.min(window.innerHeight - 32, 900) : 900));
        const costModalMaximized = ref(savedCostMax === 'true');
        const costViewMode = ref('cards'); // 'cards' | 'table'

        // Çoklu Maliyet Çalışması Yönetimi
        const costStudies = ref([]);
        const activeStudyIndex = ref(0);
        const isNewStudyMode = ref(false);

        const saveCostModalDimensions = () => {
            if (typeof localStorage !== 'undefined' && !costModalMaximized.value) {
                if (costModalWidth.value) localStorage.setItem('texflow_cost_modal_width', costModalWidth.value);
                if (costModalHeight.value) localStorage.setItem('texflow_cost_modal_height', costModalHeight.value);
            }
        };

        const toggleCostModalMaximize = () => {
            costModalMaximized.value = !costModalMaximized.value;
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('texflow_cost_modal_maximized', costModalMaximized.value ? 'true' : 'false');
            }
            const card = document.getElementById('cost-modal-card');
            if (card) {
                if (costModalMaximized.value) {
                    card.style.removeProperty('width');
                    card.style.removeProperty('height');
                    card.style.removeProperty('max-width');
                    card.style.removeProperty('max-height');
                } else {
                    if (costModalWidth.value) card.style.width = costModalWidth.value + 'px';
                    if (costModalHeight.value) card.style.height = costModalHeight.value + 'px';
                }
            }
        };

        const closeCostModal = () => {
            const card = document.getElementById('cost-modal-card');
            if (card && !costModalMaximized.value) {
                const rect = card.getBoundingClientRect();
                if (rect.width > 300 && rect.height > 200) {
                    costModalWidth.value = Math.round(rect.width);
                    costModalHeight.value = Math.round(rect.height);
                    saveCostModalDimensions();
                }
            }
            costModalOpen.value = false;
        };

        const startResizeModal = (e, dir) => {
            e.preventDefault();
            if (costModalMaximized.value) return;

            const startX = e.clientX;
            const startY = e.clientY;
            const card = document.getElementById('cost-modal-card');
            const rect = card ? card.getBoundingClientRect() : null;
            const startW = rect ? rect.width : (costModalWidth.value || 1480);
            const startH = rect ? rect.height : (costModalHeight.value || 900);

            const onMouseMove = (moveEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;

                let newW = startW;
                let newH = startH;

                if (dir.includes('e')) {
                    newW = Math.round(Math.max(650, Math.min(window.innerWidth - 16, startW + dx * 2)));
                } else if (dir.includes('w')) {
                    newW = Math.round(Math.max(650, Math.min(window.innerWidth - 16, startW - dx * 2)));
                }

                if (dir.includes('s')) {
                    newH = Math.round(Math.max(450, Math.min(window.innerHeight - 16, startH + dy * 2)));
                } else if (dir.includes('n')) {
                    newH = Math.round(Math.max(450, Math.min(window.innerHeight - 16, startH - dy * 2)));
                }

                costModalWidth.value = newW;
                costModalHeight.value = newH;
                if (card) {
                    card.style.width = newW + 'px';
                    card.style.height = newH + 'px';
                }
            };

            const onMouseUp = () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                saveCostModalDimensions();
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        };

        // Tablo Karşılaştırma Görünümü için Tüm Çalışmalardaki Tekil Kalem İsimleri
        const allStudyItemNames = computed(() => {
            const set = new Set();
            (costStudies.value || []).forEach(st => {
                (st.items || []).forEach(it => {
                    const n = (it.name || '').trim();
                    if (n) set.add(n);
                });
            });
            return Array.from(set);
        });

        // Tablo görünümünde yerden kazanmak için "Maliyet Çalışması 1" -> "MÇ 1" kısaltması
        const formatStudyNameShort = (name, idx) => {
            const defaultName = 'MÇ ' + (idx + 1);
            if (!name) return defaultName;
            return String(name).replace(/^Maliyet\s*Çalışması\s*/i, 'MÇ ');
        };

        // Maliyet Çalışması Seçimi
        const selectCostStudy = (val) => {
            if (val === 'new') {
                startNewCostStudy();
                return;
            }
            const idx = parseInt(val);
            if (!isNaN(idx) && idx >= 0 && idx < costStudies.value.length) {
                if (!isNewStudyMode.value && costStudies.value[activeStudyIndex.value]) {
                    costStudies.value[activeStudyIndex.value] = JSON.parse(JSON.stringify(costForm.value));
                }
                activeStudyIndex.value = idx;
                isNewStudyMode.value = false;
                costForm.value = JSON.parse(JSON.stringify(costStudies.value[idx]));
                recalculateCost();
            }
        };

        // Yeni Maliyet Çalışması Ekleme Modu
        const startNewCostStudy = () => {
            if (!isNewStudyMode.value && costStudies.value[activeStudyIndex.value]) {
                costStudies.value[activeStudyIndex.value] = JSON.parse(JSON.stringify(costForm.value));
            }
            isNewStudyMode.value = true;
            const nextNum = costStudies.value.length + 1;
            const newName = `Maliyet Çalışması ${nextNum}`;
            costForm.value.name = newName;
            recalculateCost();
            showToast(`Yeni "${newName}" hazırlandı. İstediğiniz kalemleri değiştirip "Farklı Kaydet"e basabilirsiniz.`, 'info');
        };

        // Maliyet Çalışması Silme
        const deleteCostStudy = async (idx) => {
            if (costStudies.value.length <= 1) {
                alert('En az bir maliyet çalışması bulunmalıdır.');
                return;
            }
            const studyName = costStudies.value[idx]?.name || `Çalışma ${idx + 1}`;
            if (!confirm(`"${studyName}" çalışmasını silmek istediğinize emin misiniz?`)) return;

            costStudies.value.splice(idx, 1);
            if (activeStudyIndex.value >= costStudies.value.length) {
                activeStudyIndex.value = costStudies.value.length - 1;
            }
            costForm.value = JSON.parse(JSON.stringify(costStudies.value[activeStudyIndex.value]));
            isNewStudyMode.value = false;
            recalculateCost();
            await saveCostCalculation(false, true);
            showToast(`"${studyName}" silindi.`, 'warning');
        };

        // Tablodan Tıklanan Çalışmayı Seçip Kart Moduna Geçme
        const switchToStudyAndEdit = (idx) => {
            selectCostStudy(idx);
            costViewMode.value = 'cards';
        };


        const costAutocompleteSuggestions = [

            'Kesim',
            'Fason (Dikim)',
            'Yıkama',
            'Taş Baskı',
            'Baskı',
            'Nakış',
            'Tela',
            'Astar',
            'Düğme',
            'Çıtçıt',
            'İlik-Düğme',
            'Lastik',
            'Etiket / Kol',
            'Logo',
            'Birit',
            'Ütü-Paket',
            'Aksesuar',
            'Çakım',
            'Kargo',
            'Nakliye',
            'Ambalaj / Koli',
            'Tasarım / Kalıp',
            'Diğer'
        ];

        const defaultCostTemplates = [
            {
                name: 'Standart Model',
                rates: { kdv: 10, gg: 15, mup: 15, komis: 0, imalat_fire: 6 },

                items: [
                    { name: 'Fason (Dikim)', qty: 1, price: 150, currency: 'TL', formula: '150', note: '' },
                    { name: 'Kesim', qty: 1, price: 45, currency: 'TL', formula: '45', note: '' },
                    { name: 'Etiket / Kol', qty: 1, price: 25, currency: 'TL', formula: '25', note: '' },
                    { name: 'Aksesuar', qty: 1, price: 17, currency: 'TL', formula: '17', note: '' },
                    { name: 'Kargo', qty: 1, price: 30, currency: 'TL', formula: '30', note: '' },
                    { name: 'Nakliye', qty: 1, price: 20, currency: 'TL', formula: '20', note: '' },
                    { name: 'Diğer', qty: 1, price: 30, currency: 'TL', formula: '30', note: '' }
                ]
            },
            {
                name: 'Örme T-Shirt / Sweat',
                rates: { kdv: 10, gg: 15, mup: 15, komis: 0, imalat_fire: 5 },
                items: [
                    { name: 'Kesim', qty: 1, price: 35, currency: 'TL', formula: '35', note: '' },
                    { name: 'Fason (Dikim)', qty: 1, price: 110, currency: 'TL', formula: '110', note: '' },
                    { name: 'Baskı / Nakış', qty: 1, price: 25, currency: 'TL', formula: '25', note: '' },
                    { name: 'Ütü-Paket', qty: 1, price: 25, currency: 'TL', formula: '25', note: '' },
                    { name: 'Etiket / Kol', qty: 1, price: 15, currency: 'TL', formula: '15', note: '' },
                    { name: 'Kargo / Nakliye', qty: 1, price: 25, currency: 'TL', formula: '25', note: '' }
                ]
            },
            {
                name: 'Dokuma Pantolon / Ceket',
                rates: { kdv: 10, gg: 15, mup: 15, komis: 0, imalat_fire: 6 },
                items: [
                    { name: 'Kesim', qty: 1, price: 50, currency: 'TL', formula: '50', note: '' },
                    { name: 'Fason (Dikim)', qty: 1, price: 220, currency: 'TL', formula: '220', note: '' },
                    { name: 'Yıkama / Taş', qty: 1, price: 60, currency: 'TL', formula: '60', note: '' },
                    { name: 'Tela / Astar', qty: 1, price: 35, currency: 'TL', formula: '35', note: '' },
                    { name: 'Fermuar / Düğme', qty: 1, price: 30, currency: 'TL', formula: '30', note: '' },
                    { name: 'Ütü-Paket', qty: 1, price: 35, currency: 'TL', formula: '35', note: '' },
                    { name: 'Kargo / Nakliye', qty: 1, price: 30, currency: 'TL', formula: '30', note: '' }
                ]
            }
        ];

        const costForm = ref({
            exchangeRates: {
                EUR: 56.0,
                USD: 48.5,
                GBP: 65.5,
                TL: 1.0
            },
            rates_snapshot_date: '',
            targetCurrency: 'EUR',
            fabrics: [],
            items: [],
            rates: {
                imalat_fire: 6,
                kdv: 10,
                gg: 15,
                mup: 15,
                komis: 0
            },
            totals: {}
        });

        const normalizeCurrencyCode = (val, fallback = 'EUR') => {
            if (!val) return fallback;
            const str = String(val).trim().toUpperCase();
            if (str === '€' || str === 'EUR') return 'EUR';
            if (str === '$' || str === 'USD') return 'USD';
            if (str === '£' || str === 'GBP') return 'GBP';
            if (str === '₺' || str === 'TL' || str === 'TRY') return 'TL';
            if (str === 'CHF') return 'CHF';
            return fallback;
        };

        const toNum = (v, fallback = 0) => {
            if (v === null || v === undefined || v === '') return fallback;
            if (typeof v === 'number') return isNaN(v) ? fallback : v;
            const cleaned = String(v).trim().replace(',', '.');
            const n = parseFloat(cleaned);
            return isNaN(n) ? fallback : n;
        };

        const evalCostFormula = (val) => {
            if (val === null || val === undefined || val === '') return 0;
            if (typeof val === 'number') return isNaN(val) ? 0 : val;
            let s = String(val).trim().replace(',', '.');
            if (!s) return 0;
            if (s.startsWith('=')) s = s.substring(1).trim();
            if (/^[0-9+\-*/().\s]+$/.test(s)) {
                try {
                    const fn = new Function(`return (${s})`);
                    const res = fn();
                    return typeof res === 'number' && !isNaN(res) && isFinite(res) ? res : 0;
                } catch {
                    return toNum(s);
                }
            }
            return toNum(s);
        };

        const calculateCostObject = (f) => {
            if (!f) return f;
            const curRates = f.exchangeRates || { EUR: 56.0, USD: 48.5, GBP: 65.5, TL: 1.0 };

            // 1. Calculate Fabrics
            let kumasToplamTL = 0;
            if (f.fabrics && f.fabrics.length > 0) {
                f.fabrics.forEach(fb => {
                    const currKey = normalizeCurrencyCode(fb.currency, 'EUR');
                    const rawRate = curRates[currKey] !== undefined ? curRates[currKey] : (currKey === 'TL' ? 1.0 : curRates['EUR']);
                    const unitRate = toNum(rawRate, currKey === 'TL' ? 1.0 : 56.0);
                    const price = toNum(fb.price);
                    let amount = 0;
                    if (fb.unit_type === 'KG') {
                        const grams = toNum(fb.grams);
                        amount = (grams / 1000.0) * price * unitRate;
                    } else {
                        const meters = toNum(fb.meters);
                        amount = meters * price * unitRate;
                    }
                    const extraWastage = toNum(fb.wastage_percent);
                    if (extraWastage > 0) {
                        amount = amount * (1 + (extraWastage / 100.0));
                    }
                    fb.total_tl = Math.round(amount * 100) / 100;
                    kumasToplamTL += fb.total_tl;
                });
            }

            // 2. Calculate Manufacturing & Accessories Items
            let imalatHamTL = 0;
            if (f.items && f.items.length > 0) {
                f.items.forEach(it => {
                    const currKey = normalizeCurrencyCode(it.currency, 'TL');
                    const rawRate = curRates[currKey] !== undefined ? curRates[currKey] : (currKey === 'TL' ? 1.0 : curRates['EUR']);
                    const unitRate = toNum(rawRate, currKey === 'TL' ? 1.0 : 56.0);
                    
                    let calculatedVal = 0;
                    if (it.formula !== undefined && it.formula !== '' && isNaN(Number(it.formula))) {
                        calculatedVal = evalCostFormula(it.formula);
                    } else if (it.price !== undefined && it.price !== null && it.price !== '') {
                        calculatedVal = toNum(it.price);
                    } else if (it.formula !== undefined && it.formula !== '') {
                        calculatedVal = evalCostFormula(it.formula);
                    }
                    it.evaluated_price = calculatedVal;
                    it.price = calculatedVal;
                    const qty = toNum(it.qty !== undefined && it.qty !== '' ? it.qty : 1, 1);
                    const rowTL = qty * calculatedVal * unitRate;
                    it.total_tl = Math.round(rowTL * 100) / 100;
                    imalatHamTL += it.total_tl;
                });
            }

            const imalatFireYuzde = toNum(f.rates?.imalat_fire, 0);
            const imalatToplamTL = Math.round(imalatHamTL * (1 + (imalatFireYuzde / 100.0)) * 100) / 100;

            // 3. Main Cost Matrix (Excel HS27 Master Formülleri ile 1-e-1 Birebir)
            const maliyet2TL = Math.round((kumasToplamTL + imalatToplamTL) * 100) / 100;
            const kdvYuzde = toNum(f.rates?.kdv, 10);
            const maliyet1TL = Math.round((maliyet2TL * (1 + (kdvYuzde / 100.0))) * 100) / 100;
            const tkdvTL = Math.round((maliyet1TL - maliyet2TL) * 100) / 100;
            const ggYuzde = toNum(f.rates?.gg, 0);
            const ggTL = Math.round((maliyet1TL * (ggYuzde / 100.0)) * 100) / 100;
            const mupYuzde = toNum(f.rates?.mup, 0);
            const mupTL = Math.round(((maliyet1TL + ggTL) * (mupYuzde / 100.0)) * 100) / 100;
            const komisYuzde = toNum(f.rates?.komis, 0);
            const komisTL = Math.round(((maliyet1TL + ggTL + mupTL) * (komisYuzde / 100.0)) * 100) / 100;
            const toplamSatisTL = Math.round((maliyet1TL + ggTL + mupTL + komisTL) * 100) / 100;

            // Target Currency Conversion
            const targetCurr = f.targetCurrency || 'EUR';
            const rawTargetRate = curRates[targetCurr] !== undefined ? curRates[targetCurr] : (targetCurr === 'TL' ? 1.0 : 56.0);
            const targetRate = toNum(rawTargetRate, targetCurr === 'TL' ? 1.0 : 56.0);

            const maliyet1Doviz = targetRate > 0 ? Math.round((maliyet1TL / targetRate) * 100) / 100 : 0;
            const maliyet2Doviz = targetRate > 0 ? Math.round((maliyet2TL / targetRate) * 100) / 100 : 0;
            const tkdvDoviz = targetRate > 0 ? Math.round((tkdvTL / targetRate) * 100) / 100 : 0;
            const ggDoviz = targetRate > 0 ? Math.round((ggTL / targetRate) * 100) / 100 : 0;
            const mupDoviz = targetRate > 0 ? Math.round((mupTL / targetRate) * 100) / 100 : 0;
            const komisDoviz = targetRate > 0 ? Math.round((komisTL / targetRate) * 100) / 100 : 0;
            const toplamSatisDoviz = targetRate > 0 ? Math.round((toplamSatisTL / targetRate) * 100) / 100 : 0;

            f.totals = {
                toplam_kumas_tl: Math.round(kumasToplamTL * 100) / 100,
                toplam_imalat_ham_tl: Math.round(imalatHamTL * 100) / 100,
                toplam_imalat_tl: imalatToplamTL,
                maliyet_1_tl: maliyet1TL,
                maliyet_2_tl: maliyet2TL,
                tkdv_tl: tkdvTL,
                gg_tl: ggTL,
                mup_tl: mupTL,
                komis_tl: komisTL,
                toplam_satis_tl: toplamSatisTL,
                maliyet_1_doviz: maliyet1Doviz,
                maliyet_2_doviz: maliyet2Doviz,
                tkdv_doviz: tkdvDoviz,
                gg_doviz: ggDoviz,
                mup_doviz: mupDoviz,
                komis_doviz: komisDoviz,
                toplam_satis_doviz: toplamSatisDoviz
            };
            return f;
        };

        const recalculateCost = () => {
            if (!costForm.value) return;
            calculateCostObject(costForm.value);
        };


        const applyLiveRatesToCost = () => {
            const ratesObj = { EUR: 56.0, USD: 48.5, GBP: 65.5, TL: 1.0 };
            if (currencyRates.value && currencyRates.value.length > 0) {
                currencyRates.value.forEach(cr => {
                    const num = parseFloat(String(cr.selling || cr.selling_short || '').replace(',', '.'));
                    if (!isNaN(num) && num > 0) {
                        ratesObj[cr.code] = num;
                    }
                });
            }
            costForm.value.exchangeRates = ratesObj;
            costForm.value.rates_snapshot_date = currencyDate.value ? `${currencyDate.value} (TCMB Canlı)` : new Date().toLocaleDateString('tr-TR');
            recalculateCost();
            refreshIcons();
        };

        const normalizeComposition = (comp) => {
            if (!comp) return '';
            let str = String(comp).trim();

            const map = [
                [/\bPOLYAMIDE\b|\bPOLYAMID\b|\bPOLİAMİD\b|\bNYLON\b|\bNAYLON\b/gi, 'PA'],
                [/\bELASTANE\b|\bELASTAN\b|\bSPANDEX\b|\bLYCRA\b|\bLIKRA\b/gi, 'EL'],
                [/\bPOLYESTER\b|\bPOLİESTER\b/gi, 'PES'],
                [/\bCOTTON\b|\bCOTON\b|\bCOT\b|\bBAMWOLLE\b|\bPAMUK\b/gi, 'CO'],
                [/\bVISCOSE\b|\bVISKOZ\b|\bVISKON\b|\bRAYON\b/gi, 'CV'],
                [/\bACRYLIC\b|\bAKRİLİK\b|\bAKRILIK\b|\bPOLYACRYLIC\b/gi, 'PAN'],
                [/\bWOOL\b|\bYÜN\b|\bYUN\b|\bLAINE\b/gi, 'WO'],
                [/\bLINEN\b|\bKETEN\b/gi, 'LI'],
                [/\bSILK\b|\bİPEK\b|\bIPEK\b/gi, 'SE'],
                [/\bMODAL\b/gi, 'CMD'],
                [/\bLYOCELL\b|\bTENCEL\b/gi, 'CLY'],
                [/\bMETALLIC\b|\bMETALLIZED\b|\bMETALLIZE\b|\bLUREX\b|\bSIM\b/gi, 'ME']
            ];

            map.forEach(([regex, rep]) => {
                str = str.replace(regex, rep);
            });

            str = str.replace(/\b(FSC|GRS|ECOVERO|ORGANIC|BCI)\b/gi, '');
            str = str.replace(/\b(EL|EA)\s+(EL|EA)\b/gi, 'EL');
            str = str.replace(/\s+/g, ' ').trim();
            return str;
        };

        const stripSupplierFromCode = (code, supplier) => {
            if (!code) return '';
            let c = String(code).trim();
            if (supplier) {
                const escaped = String(supplier).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                c = c.replace(new RegExp('^' + escaped + '\\s*[-–—:/,\\.]*\\s*', 'i'), '').trim();
            }
            return c || code;
        };

        const parseFabricDetails = (style, isSecond = false) => {
            const article = (isSecond ? style?.fabric_article_2 : style?.fabric_article) || '';
            const composition = (isSecond ? style?.fabric_composition_2 : style?.fabric_composition) || '';
            let quality = (isSecond ? style?.fabric_type_2 : style?.fabric_type) || '';
            const rawGrams = isSecond ? (style?.unit_grams_2 || '') : (style?.unit_grams || style?.fabric_weight || '');
            const gramMatch = String(rawGrams).match(/\d{2,3}/);
            const gramaj = gramMatch ? gramMatch[0] : '';

            let supplier = '';
            if (style?.custom_fields_json) {
                try {
                    const cf = typeof style.custom_fields_json === 'string' ? JSON.parse(style.custom_fields_json) : style.custom_fields_json;
                    if (isSecond && cf.fabric_supplier_2) supplier = cf.fabric_supplier_2;
                    else if (!isSecond && cf.fabric_supplier) supplier = cf.fabric_supplier;
                } catch (e) {}
            }
            if (!supplier && article) {
                if (article.includes(' - ')) {
                    supplier = article.split(' - ')[0].trim();
                } else {
                    const parts = article.split(/[\s,\.\-]+/);
                    if (parts.length > 0 && parts[0].length >= 2) {
                        supplier = parts[0];
                    }
                }
            }
            if (supplier && supplier.length > 12) {
                supplier = supplier.slice(0, 12).trim();
            }

            // İç kod (ELT) tespiti
            const eltMatch = article.match(/(ELT\d+)/i);
            const eltCode = eltMatch ? eltMatch[1].toUpperCase() : '';

            // Kalite Adı & Kalite Kodu tespiti (İç kod olan ELT temizlenir)
            let cleanQuality = article;
            if (supplier) {
                cleanQuality = stripSupplierFromCode(cleanQuality, supplier);
            }
            cleanQuality = cleanQuality.replace(/ELT\d+/gi, '').replace(/^[\s\-–—:\/,\.]+|[\s\-–—:\/,\.]+$/g, '').trim();

            if (!quality) {
                quality = cleanQuality;
            } else if (cleanQuality && !quality.toLowerCase().includes(cleanQuality.toLowerCase())) {
                quality = `${quality} ${cleanQuality}`.trim();
            }
            quality = quality.replace(/ELT\d+/gi, '').replace(/^[\s\-–—:\/,\.]+|[\s\-–—:\/,\.]+$/g, '').trim();

            return {
                title: isSecond ? 'Kumaş 2' : 'Kumaş 1',
                code: eltCode || article,
                supplier: supplier,
                quality: quality, // Kalite Adı ve Kalite Kodu (ELT iç kodu içermez)
                gramaj: gramaj,
                composition: normalizeComposition(composition)
            };
        };

        const getCostFabricDisplay = (fb) => {
            if (!fb) return '';
            let supplier = cleanFabricField(fb.supplier);
            let qCode = cleanFabricField(fb.quality_code);
            let qName = cleanFabricField(fb.quality_name || fb.quality);
            let variant = cleanFabricField(fb.variant);
            let color = '';
            let en = cleanFabricField(fb.width || fb.en);
            let gramaj = cleanFabricField(fb.gramaj || fb.weight);
            let composition = cleanFabricField(fb.composition);

            // Eksikse kumaş deposunda fb.code veya qCode ile ara
            const searchCode = cleanFabricField(fb.code) || qCode;
            let foundFab = null;
            if (searchCode && fabricsList.value && fabricsList.value.length > 0) {
                const cleanCode = String(searchCode).trim().toUpperCase();
                foundFab = fabricsList.value.find(f => 
                    String(f.internal_code || '').trim().toUpperCase() === cleanCode ||
                    String(f.code || '').trim().toUpperCase() === cleanCode ||
                    (f.quality_code && String(f.quality_code).trim().toUpperCase() === cleanCode)
                );
                if (foundFab) {
                    if (!supplier) supplier = cleanFabricField(foundFab.company_name || foundFab.supplier);
                    if (!qCode) qCode = cleanFabricField(foundFab.quality_code || foundFab.fabric_code);
                    if (!qName) qName = cleanFabricField(foundFab.quality_name || foundFab.fabric_name || foundFab.name);
                    if (!variant) variant = cleanFabricField(foundFab.design_code || foundFab.variant);
                    // Kumaş rengi FabricTag'den çekilir, FabricTag'de yoksa boş bırakılır
                    color = cleanFabricField(foundFab.color || foundFab.color_name);
                    if (!en) en = cleanFabricField(foundFab.width || foundFab.en);
                    if (!gramaj) gramaj = cleanFabricField(foundFab.weight || foundFab.gramaj);
                    if (!composition) composition = cleanFabricField(foundFab.composition);
                }
            }

            // Kumaş deposunda eşleşme yoksa fb.color varsa al (asla model rengi s.color_name değil)
            if (!foundFab && !color) {
                color = cleanFabricField(fb.color);
            }

            // Hala eksikse ve model yüklüyse model üzerinden tamamla
            if (costStyle.value) {
                const s = costStyle.value;
                const isSecond = fb.title && (fb.title.includes('2') || fb.title.includes('İkinci'));
                const d = extractFabricDetails(s, isSecond ? 2 : 1);
                const defD = parseFabricDetails(s, isSecond);
                if (!supplier) supplier = cleanFabricField(d.supplier || defD.supplier);
                if (!qCode) qCode = cleanFabricField(d.code);
                if (!qName) qName = cleanFabricField(d.name || defD.quality || (isSecond ? s.fabric_type_2 : s.fabric_type));
                if (!variant) variant = cleanFabricField(d.variant);
                // Sadece kumaşa ait d.color alınabilir, model rengi ASLA eklenmez!
                if (!color && !foundFab) color = cleanFabricField(d.color);
                if (!en) en = cleanFabricField(d.width || d.en || (isSecond ? s.fabric_width_2 : s.fabric_width));
                if (!gramaj) gramaj = cleanFabricField(defD.gramaj || (isSecond ? s.unit_grams_2 : s.unit_grams));
                if (!composition) composition = cleanFabricField(defD.composition || (isSecond ? s.composition_2 : s.composition));
            }

            // Temizlik ve biçimlendirme:
            if (en) {
                en = en.replace(/^(en|genişlik)[:\s]*/i, '').trim();
                en = cleanFabricField(en);
                if (en && !isNaN(en)) en = `${en} cm`;
            }
            if (gramaj) {
                gramaj = gramaj.replace(/^(gr|gramaj|weight)[:\s]*/i, '').trim();
                gramaj = cleanFabricField(gramaj);
                if (gramaj && !isNaN(gramaj)) gramaj = `${gramaj} gr`;
            }
            if (composition) {
                composition = cleanFabricField(normalizeComposition(composition));
            }

            // Sıra: Kumaşçının adı / Kalite kodu / Kalite adı / Varyant / Renk / En / Gramaj / Karışım
            const parts = [];
            if (supplier) parts.push(supplier);
            if (qCode) parts.push(qCode);
            if (qName) parts.push(qName);
            if (variant) parts.push(variant);
            if (color) parts.push(color);
            if (en) parts.push(en);
            if (gramaj) parts.push(gramaj);
            if (composition) parts.push(composition);

            return parts.join(' / ');
        };

        // MALİYET PENCERESİ ENTER İLE BİR ALT SATIRIN AYNI SÜTUNUNA GEÇME
        const handleCostItemsKeydown = (event) => {
            if (event.key !== 'Enter' || event.ctrlKey || event.altKey) return;
            const target = event.target;
            if (!target || !['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;

            const currentTd = target.closest('td');
            const currentTr = target.closest('tr');
            if (!currentTd || !currentTr) return;

            const cellIndex = Array.from(currentTr.children).indexOf(currentTd);
            if (cellIndex === -1) return;

            let targetTr = null;
            if (event.shiftKey) {
                targetTr = currentTr.previousElementSibling;
            } else {
                targetTr = currentTr.nextElementSibling;
                // Son satırda Enter basılmışsa yeni boş kalem ekle
                if (!targetTr) {
                    addCostItemRow('');
                    nextTick(() => {
                        const tbody = currentTr.parentElement;
                        const newLastTr = tbody ? tbody.lastElementChild : null;
                        if (newLastTr && newLastTr.children[cellIndex]) {
                            const newInp = newLastTr.children[cellIndex].querySelector('input, select');
                            if (newInp) {
                                newInp.focus();
                                if (typeof newInp.select === 'function') newInp.select();
                            }
                        }
                    });
                    return;
                }
            }

            if (!targetTr) return;
            const targetTd = targetTr.children[cellIndex];
            if (!targetTd) return;

            const targetInput = targetTd.querySelector('input:not([disabled]), select:not([disabled])');
            if (targetInput) {
                event.preventDefault();
                target.blur();
                targetInput.focus();
                if (typeof targetInput.select === 'function') {
                    targetInput.select();
                }
            }
        };

        const handleCostFabricKeydown = (event) => {
            if (event.key !== 'Enter' || event.ctrlKey || event.altKey) return;
            const target = event.target;
            if (!target || !['INPUT', 'SELECT'].includes(target.tagName)) return;

            const currentTd = target.closest('td');
            const currentTr = target.closest('tr');
            if (!currentTd || !currentTr) return;

            const cellIndex = Array.from(currentTr.children).indexOf(currentTd);
            if (cellIndex === -1) return;

            let targetTr = event.shiftKey ? currentTr.previousElementSibling : currentTr.nextElementSibling;
            while (targetTr && !targetTr.children[cellIndex]?.querySelector('input:not([disabled]), select:not([disabled])')) {
                targetTr = event.shiftKey ? targetTr.previousElementSibling : targetTr.nextElementSibling;
            }
            if (!targetTr) return;

            const targetTd = targetTr.children[cellIndex];
            if (!targetTd) return;

            const targetInput = targetTd.querySelector('input:not([disabled]), select:not([disabled])');
            if (targetInput) {
                event.preventDefault();
                target.blur();
                targetInput.focus();
                if (typeof targetInput.select === 'function') {
                    targetInput.select();
                }
            }
        };

        const onFabricCodeChange = (fb) => {
            if (!fb || !fb.code) return;
            const cleanQuery = String(fb.code).trim().toUpperCase();
            if (cleanQuery.length < 3) return;

            // 1. Önce FabricTag kumaş deposunda ara (en güncel kartela bilgisi)
            if (fabricsList.value && fabricsList.value.length > 0) {
                const foundFab = fabricsList.value.find(f => 
                    String(f.internal_code || '').trim().toUpperCase() === cleanQuery ||
                    String(f.code || '').trim().toUpperCase() === cleanQuery
                );
                if (foundFab) {
                    fb.supplier = cleanFabricField(foundFab.company_name || foundFab.supplier || '').slice(0, 12);
                    fb.quality_name = cleanFabricField(foundFab.quality_name || foundFab.fabric_name || foundFab.name);
                    fb.quality_code = cleanFabricField(foundFab.quality_code || foundFab.fabric_code);
                    fb.variant = cleanFabricField(foundFab.design_code || foundFab.variant);
                    fb.color = cleanFabricField(foundFab.color);
                    fb.quality = fb.quality_name || '';
                    fb.composition = normalizeComposition(foundFab.composition || fb.composition);
                    if (foundFab.weight) {
                        const gm = String(foundFab.weight).match(/\d{2,3}/);
                        if (gm) fb.gramaj = gm[0];
                    }
                    recalculateCost();
                    return;
                }
            }

            // 2. Loaded styles içinden girilen iç koda göre kumaş bilgilerini bul ve alttaki alanları güncelle
            if (styles.value && styles.value.length > 0) {
                const found = styles.value.find(st => {
                    const art1 = String(st.fabric_article || '').toUpperCase();
                    const art2 = String(st.fabric_article_2 || '').toUpperCase();
                    return art1.includes(cleanQuery) || art2.includes(cleanQuery);
                });

                if (found) {
                    const isSecond = !String(found.fabric_article || '').toUpperCase().includes(cleanQuery) &&
                                      String(found.fabric_article_2 || '').toUpperCase().includes(cleanQuery);
                    const defD = parseFabricDetails(found, isSecond);
                    const extD = extractFabricDetails(found, isSecond ? 2 : 1);
                    if (defD.supplier) fb.supplier = defD.supplier.slice(0, 12);
                    fb.quality_name = cleanFabricField(extD.name || defD.quality);
                    fb.quality_code = cleanFabricField(extD.code);
                    fb.variant = cleanFabricField(extD.variant);
                    fb.color = cleanFabricField(extD.color);
                    fb.quality = fb.quality_name || defD.quality || '';
                    if (defD.composition) fb.composition = defD.composition;
                    if (defD.gramaj) fb.gramaj = defD.gramaj;

                    const p = isSecond ? found.fabric_price_2 : found.fabric_price_1;
                    const c = isSecond ? found.fabric_price_currency_2 : found.fabric_price_currency_1;
                    if (p !== null && p !== undefined && p !== '') {
                        fb.price = parseFloat(String(p).replace(',', '.')) || fb.price;
                    }
                    if (c) {
                        fb.currency = normalizeCurrencyCode(c, fb.currency);
                    }
                    recalculateCost();
                }
            }
        };

        const availableFabricCodes = computed(() => {
            const set = new Set();
            if (styles.value && styles.value.length > 0) {
                styles.value.forEach(st => {
                    if (st.fabric_article) {
                        const d1 = parseFabricDetails(st, false);
                        if (d1.code) set.add(d1.code);
                        const m = st.fabric_article.match(/ELT\d+/i);
                        if (m) set.add(m[0].toUpperCase());
                    }
                    if (st.fabric_article_2) {
                        const d2 = parseFabricDetails(st, true);
                        if (d2.code) set.add(d2.code);
                        const m2 = st.fabric_article_2.match(/ELT\d+/i);
                        if (m2) set.add(m2[0].toUpperCase());
                    }
                });
            }
            return Array.from(set).filter(Boolean).sort();
        });

        const openCostModal = (style) => {
            costStyle.value = style;
            const targetCurr = normalizeCurrencyCode(style.currency, 'EUR');

            // Restore persistent size from localStorage if available
            if (typeof localStorage !== 'undefined') {
                const sw = localStorage.getItem('texflow_cost_modal_width');
                const sh = localStorage.getItem('texflow_cost_modal_height');
                const smax = localStorage.getItem('texflow_cost_modal_maximized');
                if (sw) costModalWidth.value = Math.min(parseInt(sw), (typeof window !== 'undefined' ? window.innerWidth - 16 : 1480));
                if (sh) costModalHeight.value = Math.min(parseInt(sh), (typeof window !== 'undefined' ? window.innerHeight - 16 : 900));
                if (smax !== null) costModalMaximized.value = smax === 'true';
            }

            costViewMode.value = 'cards';
            isNewStudyMode.value = false;

            // Sync current exchange rates from TCMB live rates if available
            const ratesObj = { EUR: 56.0, USD: 48.5, GBP: 65.5, TL: 1.0 };
            if (currencyRates.value && currencyRates.value.length > 0) {
                currencyRates.value.forEach(cr => {
                    const num = parseFloat(String(cr.selling || cr.selling_short || '').replace(',', '.'));
                    if (!isNaN(num) && num > 0) {
                        ratesObj[cr.code] = num;
                    }
                });
            }

            let studies = [];
            if (style.cost_data && typeof style.cost_data === 'object') {
                if (Array.isArray(style.cost_data.cost_studies) && style.cost_data.cost_studies.length > 0) {
                    studies = JSON.parse(JSON.stringify(style.cost_data.cost_studies));
                } else if (style.cost_data.fabrics && style.cost_data.fabrics.length > 0) {
                    const legacy = JSON.parse(JSON.stringify(style.cost_data));
                    legacy.name = legacy.name || 'Maliyet Çalışması 1';
                    studies = [legacy];
                }
            }

            // Normalization helper for fabrics in a study
            const normalizeStudyFabrics = (study) => {
                if (!study.targetCurrency) study.targetCurrency = targetCurr;
                if (!study.exchangeRates) study.exchangeRates = ratesObj;
                if (!study.rates_snapshot_date) study.rates_snapshot_date = 'Kayıtlı Kur';
                if (!study.fabrics) study.fabrics = [];
                study.fabrics.forEach((fb, idx) => {
                    const defD = parseFabricDetails(style, idx === 1);
                    const extD = extractFabricDetails(style, idx === 1 ? 2 : 1);
                    if (!fb.supplier) fb.supplier = defD.supplier;
                    if (fb.supplier && fb.supplier.length > 12) fb.supplier = fb.supplier.slice(0, 12).trim();
                    if (!fb.quality_name) fb.quality_name = cleanFabricField(extD.name);
                    if (!fb.quality_code) fb.quality_code = cleanFabricField(extD.code);
                    if (!fb.variant) fb.variant = cleanFabricField(extD.variant);
                    if (!fb.color) fb.color = cleanFabricField(extD.color);
                    if (fb.code) {
                        fb.code = stripSupplierFromCode(fb.code, fb.supplier || defD.supplier);
                    } else {
                        fb.code = defD.code;
                    }
                    if (fb.quality && fb.quality.match(/^ELT\d+$/i)) {
                        fb.quality = defD.quality || '';
                    } else if (!fb.quality) {
                        fb.quality = defD.quality || '';
                    }
                    if (fb.gramaj) {
                        const gm = String(fb.gramaj).match(/\d{2,3}/);
                        fb.gramaj = gm ? gm[0] : '';
                    } else {
                        fb.gramaj = defD.gramaj;
                    }
                    fb.composition = normalizeComposition(fb.composition || defD.composition);
                    if (!fb.title) fb.title = 'Kumaş ' + (idx + 1);

                    if (fb.currency) {
                        fb.currency = normalizeCurrencyCode(fb.currency, 'EUR');
                    } else if (idx === 0 && style.fabric_price_currency_1) {
                        fb.currency = normalizeCurrencyCode(style.fabric_price_currency_1, 'EUR');
                    } else if (idx === 1 && style.fabric_price_currency_2) {
                        fb.currency = normalizeCurrencyCode(style.fabric_price_currency_2, 'EUR');
                    } else {
                        fb.currency = normalizeCurrencyCode(style.currency, 'EUR');
                    }

                    if (fb.price === undefined || fb.price === null || fb.price === '') {
                        if (idx === 0 && style.fabric_price_1) {
                            fb.price = parseFloat(String(style.fabric_price_1).replace(',', '.')) || 0;
                        } else if (idx === 1 && style.fabric_price_2) {
                            fb.price = parseFloat(String(style.fabric_price_2).replace(',', '.')) || 0;
                        } else {
                            fb.price = 0;
                        }
                    }
                });
                calculateCostObject(study);
            };

            if (studies.length > 0) {
                studies.forEach((st, idx) => {
                    if (!st.name) st.name = `Maliyet Çalışması ${idx + 1}`;
                    normalizeStudyFabrics(st);
                });
            } else {
                const initFabrics = [];
                // Fabric 1
                const d1 = parseFabricDetails(style, false);
                const extD1 = extractFabricDetails(style, 1);
                if (style.fabric_article || style.unit_meters || style.unit_grams || style.fabric_price_1) {
                    initFabrics.push({
                        title: 'Kumaş 1 (Ana Kumaş)',
                        code: d1.code,
                        supplier: d1.supplier,
                        quality_name: cleanFabricField(extD1.name),
                        quality_code: cleanFabricField(extD1.code),
                        variant: cleanFabricField(extD1.variant),
                        color: cleanFabricField(extD1.color),
                        quality: d1.quality,
                        gramaj: d1.gramaj,
                        composition: d1.composition,
                        unit_type: style.unit_grams ? 'KG' : 'M',
                        meters: style.unit_meters ? parseFloat(String(style.unit_meters).replace(',', '.')) || 0 : 0,
                        grams: style.unit_grams ? parseFloat(String(style.unit_grams).replace(',', '.')) || 0 : 0,
                        price: style.fabric_price_1 ? parseFloat(String(style.fabric_price_1).replace(',', '.')) || 0 : 0,
                        currency: normalizeCurrencyCode(style.fabric_price_currency_1 || style.currency, 'EUR'),
                        wastage_percent: style.fabric_wastage_percent ? parseFloat(style.fabric_wastage_percent) || 0 : 0,
                        total_tl: 0
                    });
                } else {
                    initFabrics.push({
                        title: 'Kumaş 1 (Ana Kumaş)',
                        code: d1.code,
                        supplier: d1.supplier,
                        quality_name: cleanFabricField(extD1.name),
                        quality_code: cleanFabricField(extD1.code),
                        variant: cleanFabricField(extD1.variant),
                        color: cleanFabricField(extD1.color),
                        quality: d1.quality,
                        gramaj: d1.gramaj,
                        composition: d1.composition,
                        unit_type: 'M',
                        meters: 1.75,
                        grams: 0,
                        price: 3.5,
                        currency: normalizeCurrencyCode(style.fabric_price_currency_1 || style.currency, 'EUR'),
                        wastage_percent: 5,
                        total_tl: 0
                    });
                }

                // Fabric 2
                if (style.fabric_article_2 || style.unit_meters_2 || style.unit_grams_2 || style.fabric_price_2) {
                    const d2 = parseFabricDetails(style, true);
                    const extD2 = extractFabricDetails(style, 2);
                    initFabrics.push({
                        title: 'Kumaş 2 (İkinci Kumaş)',
                        code: d2.code,
                        supplier: d2.supplier,
                        quality_name: cleanFabricField(extD2.name),
                        quality_code: cleanFabricField(extD2.code),
                        variant: cleanFabricField(extD2.variant),
                        color: cleanFabricField(extD2.color),
                        quality: d2.quality,
                        gramaj: d2.gramaj,
                        composition: d2.composition,
                        unit_type: style.unit_grams_2 ? 'KG' : 'M',
                        meters: style.unit_meters_2 ? parseFloat(String(style.unit_meters_2).replace(',', '.')) || 0 : 0,
                        grams: style.unit_grams_2 ? parseFloat(String(style.unit_grams_2).replace(',', '.')) || 0 : 0,
                        price: style.fabric_price_2 ? parseFloat(String(style.fabric_price_2).replace(',', '.')) || 0 : 0,
                        currency: normalizeCurrencyCode(style.fabric_price_currency_2 || style.currency, 'EUR'),
                        wastage_percent: style.fabric_wastage_percent_2 ? parseFloat(style.fabric_wastage_percent_2) || 0 : 0,
                        total_tl: 0
                    });
                }

                const initItems = [
                    { name: 'Fason (Dikim)', qty: 1, price: 150, currency: 'TL', formula: '150', note: '' },
                    { name: 'Kesim', qty: 1, price: 45, currency: 'TL', formula: '45', note: '' },
                    { name: 'Etiket / Kol', qty: 1, price: 25, currency: 'TL', formula: '25', note: '' },
                    { name: 'Aksesuar', qty: 1, price: 17, currency: 'TL', formula: '17', note: '' },
                    { name: 'Kargo', qty: 1, price: 30, currency: 'TL', formula: '30', note: '' },
                    { name: 'Nakliye', qty: 1, price: 20, currency: 'TL', formula: '20', note: '' },
                    { name: 'Diğer', qty: 1, price: 30, currency: 'TL', formula: '30', note: '' }
                ];

                const firstStudy = {
                    name: 'Maliyet Çalışması 1',
                    exchangeRates: ratesObj,
                    rates_snapshot_date: currencyDate.value ? `${currencyDate.value} (TCMB)` : new Date().toLocaleDateString('tr-TR'),
                    targetCurrency: targetCurr,
                    fabrics: initFabrics,
                    items: initItems,
                    rates: {
                        imalat_fire: 0,
                        kdv: 10,
                        gg: 20,
                        mup: 10,
                        komis: 5
                    },
                    totals: {}
                };
                calculateCostObject(firstStudy);
                studies = [firstStudy];
            }

            costStudies.value = studies;
            const targetIdx = (style.cost_data && typeof style.cost_data.active_study_index === 'number')
                ? Math.min(style.cost_data.active_study_index, studies.length - 1)
                : 0;
            activeStudyIndex.value = Math.max(0, targetIdx);
            costForm.value = JSON.parse(JSON.stringify(studies[activeStudyIndex.value]));

            recalculateCost();
            costModalOpen.value = true;
            refreshIcons();
        };

        const addCostFabricRow = () => {
            costForm.value.fabrics.push({
                title: 'Kumaş ' + (costForm.value.fabrics.length + 1),
                code: '',
                supplier: '',
                quality: '',
                gramaj: '',
                composition: '',
                unit_type: 'M',
                meters: 0.5,
                grams: 0,
                price: 2.0,
                currency: 'EUR',
                wastage_percent: 5,
                total_tl: 0
            });
            recalculateCost();
        };

        const removeCostFabricRow = (idx) => {
            costForm.value.fabrics.splice(idx, 1);
            recalculateCost();
        };

        const addCostItemRow = (name = 'Yeni Kalem') => {
            costForm.value.items.push({
                name: name,
                qty: 1,
                price: 10,
                currency: 'TL',
                formula: '10',
                note: ''
            });
            recalculateCost();
        };

        const removeCostItemRow = (idx) => {
            costForm.value.items.splice(idx, 1);
            recalculateCost();
        };

        const applyCostTemplate = (tpl) => {
            if (!confirm(`"${tpl.name}" şablonunu uygulamak istediğinize emin misiniz? Mevcut kalemler güncellenecektir.`)) return;
            costForm.value.rates = { ...tpl.rates };
            costForm.value.items = JSON.parse(JSON.stringify(tpl.items));
            recalculateCost();
        };

        const saveCostCalculation = async (applyToUnitPrice = false, silent = false) => {
            if (!costStyle.value) return;
            recalculateCost();
            costSaving.value = true;
            try {
                const wasNewStudy = isNewStudyMode.value;
                if (wasNewStudy) {
                    // Farklı Kaydet modu
                    if (!costForm.value.name) {
                        costForm.value.name = `Maliyet Çalışması ${costStudies.value.length + 1}`;
                    }
                    const newStudy = JSON.parse(JSON.stringify(costForm.value));
                    costStudies.value.push(newStudy);
                    activeStudyIndex.value = costStudies.value.length - 1;
                    isNewStudyMode.value = false;
                } else {
                    // Güncelle modu
                    if (costStudies.value[activeStudyIndex.value]) {
                        costStudies.value[activeStudyIndex.value] = JSON.parse(JSON.stringify(costForm.value));
                    }
                }

                // Ensure all studies have fresh calculations
                costStudies.value.forEach(st => calculateCostObject(st));

                const payload = {
                    cost_data: {
                        cost_studies: costStudies.value,
                        active_study_index: activeStudyIndex.value,
                        ...costForm.value
                    },
                    apply_to_unit_price: applyToUnitPrice,
                    calculated_price: costForm.value.totals?.toplam_satis_doviz,
                    currency: costForm.value.targetCurrency
                };

                const res = await apiFetch(`/api/styles/${costStyle.value.id}/cost`, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                costStyle.value.cost_data = JSON.parse(JSON.stringify(payload.cost_data));
                if (applyToUnitPrice) {
                    costStyle.value.unit_price = costForm.value.totals?.toplam_satis_doviz;
                    costStyle.value.currency = costForm.value.targetCurrency;
                }

                if (!silent) {
                    const actionName = wasNewStudy ? `${costForm.value.name} Farklı Kaydedildi` : `${costForm.value.name || 'Maliyet'} Güncellendi`;
                    showToast(`💾 ${actionName}`, 'success');
                }
                await loadStyles();
                // NOT: Pencere KAPANMAZ! Kullanıcı 'Kapat'a basınca kapanır.
            } catch (err) {
                alert('Kayıt Hatası: ' + err.message);
            } finally {
                costSaving.value = false;
                refreshIcons();
            }
        };


        // ==========================================
        // MALİYET SÜRÜKLE & BIRAK KOPYALAMA SİSTEMİ
        // ==========================================
        const draggedCostStyle = ref(null);
        const dropTargetCostStyle = ref(null);
        const copyCostModalOpen = ref(false);
        const sourceCostStyle = ref(null);
        const targetCostStyle = ref(null);
        const costCopying = ref(false);

        const onCostDragStart = (e, style) => {
            if (!style) return;
            draggedCostStyle.value = style;
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('text/plain', String(style.id));
            }
        };

        const onCostDragEnd = () => {
            draggedCostStyle.value = null;
            dropTargetCostStyle.value = null;
        };

        const onCostDragOver = (e, style) => {
            if (draggedCostStyle.value && draggedCostStyle.value.id !== style.id) {
                e.preventDefault();
                if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = 'copy';
                }
                dropTargetCostStyle.value = style;
            }
        };

        const onCostDragLeave = (e, style) => {
            if (dropTargetCostStyle.value && dropTargetCostStyle.value.id === style.id) {
                dropTargetCostStyle.value = null;
            }
        };

        const onCostDrop = (e, style) => {
            e.preventDefault();
            dropTargetCostStyle.value = null;
            if (!draggedCostStyle.value || draggedCostStyle.value.id === style.id) {
                draggedCostStyle.value = null;
                return;
            }

            const source = draggedCostStyle.value;
            const target = style;
            draggedCostStyle.value = null;

            if (!source.cost_data) {
                alert(`Kaynak modelde (${source.style_no}) henüz kaydedilmiş bir maliyet verisi bulunmuyor.\nKopyalamak için önce bu modele maliyet kaydetmelisiniz.`);
                return;
            }

            sourceCostStyle.value = source;
            targetCostStyle.value = target;
            copyCostModalOpen.value = true;
            refreshIcons();
        };

        const executeCostCopy = async (mode) => {
            if (!sourceCostStyle.value || !targetCostStyle.value) return;
            const source = sourceCostStyle.value;
            const target = targetCostStyle.value;
            const srcData = source.cost_data;
            if (!srcData) return;

            costCopying.value = true;
            try {
                let newCostData = {};

                if (mode === 'all') {
                    // 1. Herşeyiyle kopyala: Kumaşlar (ve döviz cinsleri), İmalat, Fiyatlandırma/Hedef Satış, Oranlar/Matris, Kurlar
                    newCostData = JSON.parse(JSON.stringify(srcData));
                    newCostData.targetCurrency = srcData.targetCurrency || target.currency || 'EUR';
                    newCostData.rates = JSON.parse(JSON.stringify(srcData.rates || { imalat_fire: 5, kdv: 10, gg: 0, mup: 20, komis: 0 }));
                    newCostData.exchangeRates = JSON.parse(JSON.stringify(srcData.exchangeRates || { EUR: 56, USD: 48.5, GBP: 65.5, TL: 1 }));
                    newCostData.rates_snapshot_date = srcData.rates_snapshot_date;
                } else if (mode === 'fabrics') {
                    // 2. Kumaş bilgilerini kopyala: Sadece kumaşları al, hedef modelin imalat ve oranlarını koru
                    let baseData = target.cost_data ? JSON.parse(JSON.stringify(target.cost_data)) : null;
                    if (!baseData) {
                        baseData = {
                            targetCurrency: target.currency || srcData.targetCurrency || 'EUR',
                            exchangeRates: JSON.parse(JSON.stringify(srcData.exchangeRates || { EUR: 56, USD: 48.5, GBP: 65.5, TL: 1 })),
                            rates: JSON.parse(JSON.stringify(srcData.rates || { imalat_fire: 5, kdv: 10, gg: 0, mup: 20, komis: 0 })),
                            items: defaultCostTemplates[0] ? JSON.parse(JSON.stringify(defaultCostTemplates[0].items)) : [],
                            fabrics: []
                        };
                    }
                    baseData.fabrics = JSON.parse(JSON.stringify(srcData.fabrics || []));
                    newCostData = baseData;
                } else if (mode === 'items') {
                    // 3. İmalat fason aksesuar kopyala: Sadece imalat kalemlerini ve imalat firesini al
                    let baseData = target.cost_data ? JSON.parse(JSON.stringify(target.cost_data)) : null;
                    if (!baseData) {
                        const defFabrics = [];
                        const d1 = parseFabricDetails(target, false);
                        defFabrics.push({
                            title: 'Kumaş 1 (Ana Kumaş)',
                            code: d1.code,
                            supplier: d1.supplier,
                            quality: d1.quality,
                            gramaj: d1.gramaj,
                            composition: d1.composition,
                            unit_type: target.unit_grams ? 'KG' : 'M',
                            meters: target.unit_meters ? parseFloat(String(target.unit_meters).replace(',', '.')) || 0 : 1.75,
                            grams: target.unit_grams ? parseFloat(String(target.unit_grams).replace(',', '.')) || 0 : 0,
                            price: target.fabric_price_1 ? parseFloat(String(target.fabric_price_1).replace(',', '.')) || 0 : 3.5,
                            currency: normalizeCurrencyCode(target.fabric_price_currency_1 || target.currency, 'EUR'),
                            wastage_percent: target.fabric_wastage_percent ? parseFloat(target.fabric_wastage_percent) || 0 : 5,
                            total_tl: 0
                        });
                        if (target.fabric_article_2 || target.fabric_price_2) {
                            const d2 = parseFabricDetails(target, true);
                            defFabrics.push({
                                title: 'Kumaş 2 (İkinci Kumaş)',
                                code: d2.code,
                                supplier: d2.supplier,
                                quality: d2.quality,
                                gramaj: d2.gramaj,
                                composition: d2.composition,
                                unit_type: target.unit_grams_2 ? 'KG' : 'M',
                                meters: target.unit_meters_2 ? parseFloat(String(target.unit_meters_2).replace(',', '.')) || 0 : 0.5,
                                grams: target.unit_grams_2 ? parseFloat(String(target.unit_grams_2).replace(',', '.')) || 0 : 0,
                                price: target.fabric_price_2 ? parseFloat(String(target.fabric_price_2).replace(',', '.')) || 0 : 2.0,
                                currency: normalizeCurrencyCode(target.fabric_price_currency_2 || target.currency, 'EUR'),
                                wastage_percent: 5,
                                total_tl: 0
                            });
                        }
                        baseData = {
                            targetCurrency: target.currency || srcData.targetCurrency || 'EUR',
                            exchangeRates: JSON.parse(JSON.stringify(srcData.exchangeRates || { EUR: 56, USD: 48.5, GBP: 65.5, TL: 1 })),
                            rates: JSON.parse(JSON.stringify(srcData.rates || { imalat_fire: 5, kdv: 10, gg: 0, mup: 20, komis: 0 })),
                            fabrics: defFabrics,
                            items: []
                        };
                    }
                    baseData.items = JSON.parse(JSON.stringify(srcData.items || []));
                    if (srcData.rates && srcData.rates.imalat_fire !== undefined) {
                        if (!baseData.rates) baseData.rates = {};
                        baseData.rates.imalat_fire = srcData.rates.imalat_fire;
                    }
                    newCostData = baseData;
                }

                // Yeni maliyet verisini hesapla
                calculateCostObject(newCostData);

                // Sunucuya kaydet
                const payload = {
                    cost_data: newCostData,
                    apply_to_unit_price: false,
                    calculated_price: newCostData.totals?.toplam_satis_doviz || 0,
                    currency: newCostData.targetCurrency || 'EUR'
                };
                await apiFetch(`/api/styles/${target.id}/cost`, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                target.cost_data = newCostData;
                copyCostModalOpen.value = false;
                await loadStyles();

                const modeLabels = {
                    'all': 'Her şeyiyle (Tüm maliyet)',
                    'fabrics': 'Sadece Kumaş Bilgileri',
                    'items': 'Sadece İmalat, Fason & Aksesuar'
                };
                alert(`✅ ${source.style_no} modelinin maliyet bilgileri (${modeLabels[mode]}), ${target.style_no} modeline başarıyla kopyalandı!`);

                // Hedef modelin maliyet penceresini aç
                const updatedTarget = styles.value.find(s => s.id === target.id) || target;
                openCostModal(updatedTarget);

            } catch (err) {
                alert('Maliyet kopyalama hatası: ' + err.message);
            } finally {
                costCopying.value = false;
                refreshIcons();
            }
        };

        // ============================================================
        // SERBEST FİYAT ÇALIŞMASI (FREEFORM COST STUDY MODULE)
        // ============================================================
        const freeCostStudies = ref([]);
        const freeCostLoading = ref(false);
        const freeCostSearch = ref('');
        const freeCostExpandedRows = ref(new Set());
        const freeCostModalOpen = ref(false);
        const freeCostEditingId = ref(null);
        const freeCostSaving = ref(false);

        const freeCostHeader = ref({
            season: '',
            customer_name: '',
            brand: '',
            model_no: '',
            color: '',
            fabric_supplier: '',
            fabric_name: '',
            fabric_code: '',
            fabric_color: '',
            fabric_width: ''
        });

        const freeCostForm = ref({
            targetCurrency: 'EUR',
            exchangeRates: { EUR: 56.0, USD: 48.5, GBP: 65.5, TL: 1.0 },
            rates_snapshot_date: '',
            rates: { imalat_fire: 5, kdv: 10, gg: 15, mup: 15, komis: 0 },
            fabrics: [],
            items: [],
            totals: {}
        });

        const formatCurrencyPrefix = (val, cur = 'EUR') => {
            if (val === null || val === undefined || isNaN(val)) return '-';
            const num = parseFloat(val) || 0;
            const c = normalizeCurrencyCode(cur, 'EUR');
            const sym = c === 'EUR' ? '€' : (c === 'USD' ? '$' : (c === 'GBP' ? '£' : '₺'));
            const formatted = num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return `${sym} ${formatted}`;
        };

        const isFreeCostRowExpanded = (id) => freeCostExpandedRows.value.has(id);

        const toggleFreeCostRow = (id) => {
            const next = new Set(freeCostExpandedRows.value);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            freeCostExpandedRows.value = next;
            refreshIcons();
        };

        const recalculateFreeCost = () => {
            calculateCostObject(freeCostForm.value);
        };

        const applyLiveRatesToFreeCost = () => {
            if (currencyRates.value && currencyRates.value.length) {
                const eur = currencyRates.value.find(r => r.code === 'EUR');
                const usd = currencyRates.value.find(r => r.code === 'USD');
                const gbp = currencyRates.value.find(r => r.code === 'GBP');
                if (eur && (eur.selling || eur.selling_short)) {
                    freeCostForm.value.exchangeRates.EUR = toNum(eur.selling || eur.selling_short, 56.0);
                }
                if (usd && (usd.selling || usd.selling_short)) {
                    freeCostForm.value.exchangeRates.USD = toNum(usd.selling || usd.selling_short, 48.5);
                }
                if (gbp && (gbp.selling || gbp.selling_short)) {
                    freeCostForm.value.exchangeRates.GBP = toNum(gbp.selling || gbp.selling_short, 65.5);
                }
                freeCostForm.value.rates_snapshot_date = currencyDate.value ? `${currencyDate.value} (TCMB Canlı)` : new Date().toLocaleDateString('tr-TR');
                recalculateFreeCost();
                showToast('Canlı TCMB kurları serbest maliyete uygulandı', 'success');
            } else {
                loadCurrencyRates().then(() => {
                    if (currencyRates.value && currencyRates.value.length) {
                        applyLiveRatesToFreeCost();
                    }
                });
            }
        };

        // Kumaş Künyesi (Header) ile İlk Kumaş Satırının Otomatik Senkronizasyonu
        watch(() => [
            freeCostHeader.value.fabric_name,
            freeCostHeader.value.fabric_code,
            freeCostHeader.value.fabric_supplier,
            freeCostHeader.value.fabric_color
        ], ([name, code, supplier, color]) => {
            if (freeCostForm.value && freeCostForm.value.fabrics && freeCostForm.value.fabrics.length > 0) {
                const firstFb = freeCostForm.value.fabrics[0];
                if (firstFb) {
                    if (name !== undefined && name !== '') firstFb.quality = name;
                    if (code !== undefined && code !== '') firstFb.code = code;
                    if (supplier !== undefined && supplier !== '') firstFb.supplier = supplier;
                    if (color !== undefined && color !== '') firstFb.color = color;
                    if (!firstFb.title || firstFb.title === 'Ana Kumaş' || firstFb.title === 'Kumaş 1' || firstFb.title.startsWith('Kumaş')) {
                        firstFb.title = name || 'Ana Kumaş';
                    }
                    recalculateFreeCost();
                }
            }
        });

        const addFreeCostFabric = () => {
            freeCostForm.value.fabrics.push({
                title: 'Kumaş ' + (freeCostForm.value.fabrics.length + 1),
                code: freeCostHeader.value.fabric_code || '',
                supplier: freeCostHeader.value.fabric_supplier || '',
                quality: freeCostHeader.value.fabric_name || '',
                color: freeCostHeader.value.fabric_color || '',
                unit_type: 'M',
                meters: 0.5,
                grams: 0,
                price: 2.0,
                currency: 'EUR',
                wastage_percent: 5,
                total_tl: 0
            });
            recalculateFreeCost();
        };

        const removeFreeCostFabric = (idx) => {
            freeCostForm.value.fabrics.splice(idx, 1);
            recalculateFreeCost();
        };

        const addFreeCostItem = (name = 'Yeni Kalem') => {
            freeCostForm.value.items.push({
                name: name,
                qty: 1,
                price: 10,
                currency: 'TL',
                formula: '',
                note: ''
            });
            recalculateFreeCost();
        };

        const removeFreeCostItem = (idx) => {
            freeCostForm.value.items.splice(idx, 1);
            recalculateFreeCost();
        };

        const defaultFreeCostItems = [
            { name: 'Fason (Dikim)', qty: 1, price: 110, currency: 'TL', formula: '110', note: 'Ana Montaj' },
            { name: 'Kesim', qty: 1, price: 35, currency: 'TL', formula: '35', note: 'Serim & Kesim' },
            { name: 'Baskı / Nakış', qty: 1, price: 25, currency: 'TL', formula: '25', note: 'Ön Göğüs' },
            { name: 'Yıkama / Boyama', qty: 1, price: 20, currency: 'TL', formula: '20', note: 'Enzim / Silikon' },
            { name: 'Ütü-Paket', qty: 1, price: 25, currency: 'TL', formula: '25', note: 'Son Kontrol' },
            { name: 'Dikiş İpliği', qty: 1, price: 8, currency: 'TL', formula: '8', note: 'Spun Polyester' },
            { name: 'Tela', qty: 1, price: 12, currency: 'TL', formula: '12', note: 'Yaka / Pat' },
            { name: 'Etiket / Barkod', qty: 1, price: 10, currency: 'TL', formula: '10', note: 'Dokuma & Yıkama' },
            { name: 'Düğme / Fermuar', qty: 1, price: 15, currency: 'TL', formula: '15', note: 'Ana Aksesuar' },
            { name: 'Lastik', qty: 1, price: 10, currency: 'TL', formula: '10', note: 'Bel / Paça' },
            { name: 'Koli & Poşet Naylonu', qty: 1, price: 10, currency: 'TL', formula: '10', note: 'Ambalaj' },
            { name: 'Nakliye & Lojistik', qty: 1, price: 15, currency: 'TL', formula: '15', note: 'İç Sevkiyat' }
        ];

        const loadDefaultFreeCostItems = (append = false) => {
            const defaultsCopy = JSON.parse(JSON.stringify(defaultFreeCostItems));
            if (append) {
                freeCostForm.value.items.push(...defaultsCopy);
            } else {
                freeCostForm.value.items = defaultsCopy;
            }
            recalculateFreeCost();
            showToast(append ? 'Varsayılan kalemler eklendi.' : 'Varsayılan şablon yüklendi.', 'success');
        };

        const addFreeCostAccessory = (sugName = '') => {
            freeCostForm.value.items.push({
                name: sugName || '',
                qty: 1,
                price: 10,
                currency: 'TL',
                formula: '',
                note: ''
            });
            recalculateFreeCost();
            nextTick(() => {
                const newIdx = freeCostForm.value.items.length - 1;
                const el = document.getElementById(`fc-item-name-${newIdx}`);
                if (el) {
                    el.focus();
                    if (typeof el.select === 'function') el.select();
                }
            });
        };

        const handleFreeCostItemKeydown = (e, rowIdx, colName) => {
            const totalRows = (freeCostForm.value.items || []).length;

            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) {
                    if (rowIdx > 0) {
                        const prevEl = document.getElementById(`fc-item-${colName}-${rowIdx - 1}`);
                        if (prevEl) { prevEl.focus(); if (prevEl.select) prevEl.select(); }
                    }
                } else {
                    if (rowIdx < totalRows - 1) {
                        const nextEl = document.getElementById(`fc-item-${colName}-${rowIdx + 1}`);
                        if (nextEl) { nextEl.focus(); if (nextEl.select) nextEl.select(); }
                    } else {
                        addFreeCostItem('');
                        nextTick(() => {
                            const newEl = document.getElementById(`fc-item-${colName}-${totalRows}`);
                            if (newEl) { newEl.focus(); if (newEl.select) newEl.select(); }
                        });
                    }
                }
            } else if (e.key === 'Tab' && !e.shiftKey) {
                if (colName === 'note' && rowIdx === totalRows - 1) {
                    e.preventDefault();
                    addFreeCostItem('');
                    nextTick(() => {
                        const newEl = document.getElementById(`fc-item-name-${totalRows}`);
                        if (newEl) { newEl.focus(); if (newEl.select) newEl.select(); }
                    });
                }
            }
        };

        const loadFreeCostStudies = async () => {
            freeCostLoading.value = true;
            try {
                const res = await apiFetch('/api/free-cost-studies');
                if (res && res.status === 'success') {
                    freeCostStudies.value = res.studies || [];
                }
            } catch (err) {
                console.error('Error loading free cost studies:', err);
            } finally {
                freeCostLoading.value = false;
                refreshIcons();
            }
        };

        const filteredFreeCostStudies = computed(() => {
            if (!freeCostSearch.value) return freeCostStudies.value;
            const q = freeCostSearch.value.trim().toLowerCase();
            return freeCostStudies.value.filter(st => 
                (st.season && st.season.toLowerCase().includes(q)) ||
                (st.customer_name && st.customer_name.toLowerCase().includes(q)) ||
                (st.brand && st.brand.toLowerCase().includes(q)) ||
                (st.model_no && st.model_no.toLowerCase().includes(q)) ||
                (st.color && st.color.toLowerCase().includes(q)) ||
                (st.fabric_supplier && st.fabric_supplier.toLowerCase().includes(q)) ||
                (st.fabric_name && st.fabric_name.toLowerCase().includes(q)) ||
                (st.fabric_code && st.fabric_code.toLowerCase().includes(q))
            );
        });

        const openCreateFreeCostModal = () => {
            freeCostEditingId.value = null;
            freeCostHeader.value = {
                season: '',
                customer_name: '',
                brand: '',
                model_no: '',
                color: '',
                fabric_supplier: '',
                fabric_name: '',
                fabric_code: '',
                fabric_color: '',
                fabric_width: ''
            };

            let curRates = { EUR: 56.0, USD: 48.5, GBP: 65.5, TL: 1.0 };
            if (currencyRates.value && currencyRates.value.length) {
                const eur = currencyRates.value.find(r => r.code === 'EUR');
                const usd = currencyRates.value.find(r => r.code === 'USD');
                const gbp = currencyRates.value.find(r => r.code === 'GBP');
                if (eur && (eur.selling || eur.selling_short)) curRates.EUR = toNum(eur.selling || eur.selling_short, 56.0);
                if (usd && (usd.selling || usd.selling_short)) curRates.USD = toNum(usd.selling || usd.selling_short, 48.5);
                if (gbp && (gbp.selling || gbp.selling_short)) curRates.GBP = toNum(gbp.selling || gbp.selling_short, 65.5);
            }

            freeCostForm.value = {
                targetCurrency: 'EUR',
                exchangeRates: curRates,
                rates_snapshot_date: currencyDate.value ? `${currencyDate.value} (TCMB Canlı)` : new Date().toLocaleDateString('tr-TR'),
                rates: { imalat_fire: 5, kdv: 10, gg: 15, mup: 15, komis: 0 },
                fabrics: [
                    {
                        title: 'Ana Kumaş',
                        code: '',
                        supplier: '',
                        quality: '',
                        color: '',
                        unit_type: 'M',
                        meters: 0.5,
                        grams: 0,
                        price: 3.5,
                        currency: 'EUR',
                        wastage_percent: 5,
                        total_tl: 0
                    }
                ],
                items: JSON.parse(JSON.stringify(defaultFreeCostItems)),
                totals: {}
            };
            recalculateFreeCost();
            freeCostModalOpen.value = true;
        };

        const openEditFreeCostModal = (study) => {
            if (!study) return;
            freeCostEditingId.value = study.id;
            freeCostHeader.value = {
                season: study.season || '',
                customer_name: study.customer_name || '',
                brand: study.brand || '',
                model_no: study.model_no || '',
                color: study.color || '',
                fabric_supplier: study.fabric_supplier || '',
                fabric_name: study.fabric_name || '',
                fabric_code: study.fabric_code || '',
                fabric_color: study.fabric_color || '',
                fabric_width: study.fabric_width || ''
            };

            const costData = study.cost_data || {};
            freeCostForm.value = JSON.parse(JSON.stringify(costData));
            if (!freeCostForm.value.exchangeRates) {
                freeCostForm.value.exchangeRates = { EUR: 56.0, USD: 48.5, GBP: 65.5, TL: 1.0 };
            } else {
                // Ensure rates are numeric
                freeCostForm.value.exchangeRates.EUR = toNum(freeCostForm.value.exchangeRates.EUR, 56.0);
                freeCostForm.value.exchangeRates.USD = toNum(freeCostForm.value.exchangeRates.USD, 48.5);
                freeCostForm.value.exchangeRates.GBP = toNum(freeCostForm.value.exchangeRates.GBP, 65.5);
                freeCostForm.value.exchangeRates.TL = 1.0;
            }
            if (!freeCostForm.value.rates) {
                freeCostForm.value.rates = { imalat_fire: 5, kdv: 10, gg: 15, mup: 15, komis: 0 };
            }
            if (!freeCostForm.value.fabrics) freeCostForm.value.fabrics = [];
            if (!freeCostForm.value.items) freeCostForm.value.items = [];
            if (!freeCostForm.value.targetCurrency) freeCostForm.value.targetCurrency = study.target_currency || 'EUR';

            recalculateFreeCost();
            freeCostModalOpen.value = true;
        };

        const closeFreeCostModal = () => {
            freeCostModalOpen.value = false;
        };

        const exportFreeCostListExcel = async () => {
            try {
                showToast('Maliyet listesi Excel hazırlanıyor...', 'info');
                const tokenVal = token.value || localStorage.getItem('texflow_token') || '';
                const q = (freeCostSearch.value || '').trim();
                const url = '/api/free-cost-studies/export-list-excel' + (q ? `?q=${encodeURIComponent(q)}` : '');
                const res = await fetch(url, {
                    headers: { ...(tokenVal ? { 'Authorization': `Bearer ${tokenVal}` } : {}) }
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const blob = await res.blob();
                const dlUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = dlUrl;
                a.download = `Serbest_Maliyet_Listesi_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(dlUrl);
                showToast('Excel listesi başarıyla indirildi.', 'success');
            } catch (err) {
                console.error(err);
                showToast('Excel indirme hatası: ' + err.message, 'error');
            }
        };

        const exportFreeCostStudyExcel = async (study = null) => {
            try {
                recalculateFreeCost();
                showToast('Maliyet tablosu Excel hazırlanıyor...', 'info');
                const tokenVal = token.value || localStorage.getItem('texflow_token') || '';
                
                let payload = {};
                if (study && study.cost_data) {
                    payload = {
                        header: {
                            season: study.season,
                            customer_name: study.customer_name,
                            brand: study.brand,
                            model_no: study.model_no,
                            color: study.color,
                            fabric_supplier: study.fabric_supplier,
                            fabric_name: study.fabric_name,
                            fabric_code: study.fabric_code,
                            fabric_color: study.fabric_color,
                            fabric_width: study.fabric_width
                        },
                        form: study.cost_data
                    };
                } else {
                    payload = {
                        header: freeCostHeader.value,
                        form: freeCostForm.value
                    };
                }

                const res = await fetch('/api/free-cost-studies/export-study-excel', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(tokenVal ? { 'Authorization': `Bearer ${tokenVal}` } : {})
                    },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const blob = await res.blob();
                const dlUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = dlUrl;
                const mNo = (payload.header?.model_no || 'Model').replace(/[\s/\\:]+/g, '_');
                a.download = `Maliyet_Tablosu_${mNo}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(dlUrl);
                showToast('Maliyet tablosu Excel başarıyla indirildi.', 'success');
            } catch (err) {
                console.error(err);
                showToast('Maliyet tablosu Excel hatası: ' + err.message, 'error');
            }
        };

        const printFreeCostList = () => {
            window.print();
        };

        const printFreeCostStudy = (study = null) => {
            if (study) {
                openEditFreeCostModal(study);
            }
            nextTick(() => {
                setTimeout(() => {
                    window.print();
                }, 300);
            });
        };

        const saveFreeCostStudy = async () => {
            recalculateFreeCost();
            freeCostSaving.value = true;
            try {
                const totals = freeCostForm.value.totals || {};
                const payload = {
                    season: freeCostHeader.value.season,
                    customer_name: freeCostHeader.value.customer_name,
                    brand: freeCostHeader.value.brand,
                    model_no: freeCostHeader.value.model_no,
                    color: freeCostHeader.value.color,
                    fabric_supplier: freeCostHeader.value.fabric_supplier,
                    fabric_name: freeCostHeader.value.fabric_name,
                    fabric_code: freeCostHeader.value.fabric_code,
                    fabric_color: freeCostHeader.value.fabric_color,
                    fabric_width: freeCostHeader.value.fabric_width,
                    cost_data: freeCostForm.value,
                    kumas_total_tl: totals.toplam_kumas_tl || 0,
                    imalat_total_tl: totals.toplam_imalat_tl || 0,
                    unit_cost_tl: totals.maliyet_1_tl || totals.maliyet_2_tl || 0,
                    unit_price_target: totals.toplam_satis_doviz || totals.toplam_satis_tl || 0,
                    target_currency: freeCostForm.value.targetCurrency || 'EUR'
                };

                let res;
                if (freeCostEditingId.value) {
                    res = await apiFetch(`/api/free-cost-studies/${freeCostEditingId.value}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } else {
                    res = await apiFetch('/api/free-cost-studies', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

                if (res && res.status === 'success') {
                    showToast(res.message || 'Maliyet çalışması kaydedildi.', 'success');
                    freeCostModalOpen.value = false;
                    await loadFreeCostStudies();
                } else {
                    alert(res?.detail || 'Kayıt sırasında hata oluştu.');
                }
            } catch (err) {
                console.error('Save error:', err);
                alert('Kayıt hatası: ' + err.message);
            } finally {
                freeCostSaving.value = false;
                refreshIcons();
            }
        };

        const deleteFreeCostStudy = async (study) => {
            if (!study) return;
            const title = `${study.customer_name || ''} ${study.model_no || ''}`.trim() || `#${study.id}`;
            if (!confirm(`"${title}" serbest maliyet çalışmasını silmek istediğinize emin misiniz?`)) return;

            try {
                const res = await apiFetch(`/api/free-cost-studies/${study.id}`, { method: 'DELETE' });
                if (res && res.status === 'success') {
                    showToast('Maliyet çalışması silindi.', 'warning');
                    await loadFreeCostStudies();
                } else {
                    alert(res?.detail || 'Silme işlemi başarısız.');
                }
            } catch (err) {
                alert('Silme hatası: ' + err.message);
            }
        };

        // ============================================================
        // GERÇEKLEŞEN MALİYET & FATURA GİRİŞ SİSTEMİ (ACTUAL COST ENGINE)
        // ============================================================
        const actualCostModalOpen = ref(false);
        const actualCostStyle = ref(null);
        const actualCostForm = ref({
            targetCurrency: 'EUR',
            exchangeRates: { EUR: 56, USD: 48.5, GBP: 65.5, TL: 1 },
            rates: { imalat_fire: 5, kdv: 10, gg: 0, mup: 20, komis: 0 },
            fabrics: [],
            items: [],
            totals: {}
        });
        const actualCostSaving = ref(false);

        const openActualCostModal = (style) => {
            if (!style) return;
            actualCostStyle.value = style;

            if (style.actual_cost_data) {
                actualCostForm.value = JSON.parse(JSON.stringify(style.actual_cost_data));
                if (!actualCostForm.value.rates) actualCostForm.value.rates = {};
                if (!actualCostForm.value.exchangeRates) {
                    actualCostForm.value.exchangeRates = style.cost_data?.exchangeRates || { EUR: 56, USD: 48.5, GBP: 65.5, TL: 1 };
                }
            } else {
                initActualCostFromPlanned(style, false);
            }

            recalculateActualCost();
            actualCostModalOpen.value = true;
            refreshIcons();
        };

        const initActualCostFromPlanned = (style, isReset = false) => {
            if (isReset && !confirm('Gerçekleşen fatura verileri planlanan maliyet şablonuna göre sıfırlanacak. Devam etmek istiyor musunuz?')) return;
            
            const planned = style.cost_data;
            const targetCurrency = style.currency || planned?.targetCurrency || 'EUR';
            const exchangeRates = planned?.exchangeRates ? JSON.parse(JSON.stringify(planned.exchangeRates)) : { EUR: 56, USD: 48.5, GBP: 65.5, TL: 1 };
            const rates = planned?.rates ? JSON.parse(JSON.stringify(planned.rates)) : { imalat_fire: 5, kdv: 10, gg: 0, mup: 20, komis: 0 };

            // Kumaşlar (Planlanan tutarlar referans alınır, yanına faturalar işlenecektir)
            const fabrics = [];
            if (planned && planned.fabrics && planned.fabrics.length > 0) {
                planned.fabrics.forEach((fb, idx) => {
                    fabrics.push({
                        title: fb.title || `Kumaş ${idx + 1}`,
                        code: fb.code || '',
                        supplier: fb.supplier || '',
                        quality: fb.quality || '',
                        composition: fb.composition || '',
                        gramaj: fb.gramaj || '',
                        unit_type: fb.unit_type || 'M',
                        planned_total_tl: fb.total_tl || 0,
                        invoice_no: '',
                        invoice_date: '',
                        supplier_invoice: fb.supplier || '',
                        actual_amount_tl: null,
                        notes: ''
                    });
                });
            } else {
                const d1 = parseFabricDetails(style, false);
                fabrics.push({
                    title: 'Kumaş 1 (Ana Kumaş)',
                    code: d1.code,
                    supplier: d1.supplier,
                    quality: d1.quality,
                    composition: d1.composition,
                    gramaj: d1.gramaj,
                    unit_type: style.unit_grams ? 'KG' : 'M',
                    planned_total_tl: 0,
                    invoice_no: '',
                    invoice_date: '',
                    supplier_invoice: d1.supplier || '',
                    actual_amount_tl: null,
                    notes: ''
                });
            }

            // İmalat, Fason & Aksesuar Kalemleri
            const items = [];
            if (planned && planned.items && planned.items.length > 0) {
                planned.items.forEach(it => {
                    items.push({
                        name: it.name || '',
                        planned_total_tl: it.total_tl || 0,
                        invoice_no: '',
                        supplier_invoice: '',
                        actual_amount_tl: null,
                        notes: ''
                    });
                });
            } else {
                const defTpl = defaultCostTemplates[0] ? defaultCostTemplates[0].items : [];
                defTpl.forEach(it => {
                    items.push({
                        name: it.name || '',
                        planned_total_tl: 0,
                        invoice_no: '',
                        supplier_invoice: '',
                        actual_amount_tl: null,
                        notes: ''
                    });
                });
            }

            actualCostForm.value = {
                targetCurrency,
                exchangeRates,
                rates,
                fabrics,
                items,
                totals: {}
            };

            recalculateActualCost();
        };

        const addActualFabricRow = () => {
            if (!actualCostForm.value.fabrics) actualCostForm.value.fabrics = [];
            const idx = actualCostForm.value.fabrics.length + 1;
            actualCostForm.value.fabrics.push({
                title: `Kumaş ${idx} (Ekstra)`,
                code: '',
                supplier: '',
                quality: '',
                composition: '',
                gramaj: '',
                unit_type: 'M',
                planned_total_tl: 0,
                invoice_no: '',
                invoice_date: '',
                supplier_invoice: '',
                actual_amount_tl: null,
                notes: ''
            });
            recalculateActualCost();
        };

        const removeActualFabricRow = (idx) => {
            if (actualCostForm.value.fabrics.length <= 1) {
                alert('En az bir kumaş satırı bulunmalıdır.');
                return;
            }
            actualCostForm.value.fabrics.splice(idx, 1);
            recalculateActualCost();
        };

        const addActualItemRow = () => {
            if (!actualCostForm.value.items) actualCostForm.value.items = [];
            actualCostForm.value.items.push({
                name: '',
                planned_total_tl: 0,
                invoice_no: '',
                supplier_invoice: '',
                actual_amount_tl: null,
                notes: ''
            });
            recalculateActualCost();
        };

        const removeActualItemRow = (idx) => {
            actualCostForm.value.items.splice(idx, 1);
            recalculateActualCost();
        };

        const recalculateActualCost = () => {
            const f = actualCostForm.value;
            if (!f) return;
            const curRates = f.exchangeRates || { EUR: 56, USD: 48.5, GBP: 65.5, TL: 1 };

            // 1. Kumaşlar
            let gercekKumasTL = 0;
            let planKumasTL = 0;
            if (f.fabrics && f.fabrics.length > 0) {
                f.fabrics.forEach(fb => {
                    planKumasTL += (parseFloat(fb.planned_total_tl) || 0);
                    const act = fb.actual_amount_tl !== null && fb.actual_amount_tl !== undefined && fb.actual_amount_tl !== ''
                        ? parseFloat(fb.actual_amount_tl) || 0
                        : (parseFloat(fb.planned_total_tl) || 0);
                    gercekKumasTL += act;
                });
            }

            // 2. İmalat, Fason & Aksesuar
            let gercekImalatTL = 0;
            let planImalatTL = 0;
            if (f.items && f.items.length > 0) {
                f.items.forEach(it => {
                    planImalatTL += (parseFloat(it.planned_total_tl) || 0);
                    const act = it.actual_amount_tl !== null && it.actual_amount_tl !== undefined && it.actual_amount_tl !== ''
                        ? parseFloat(it.actual_amount_tl) || 0
                        : (parseFloat(it.planned_total_tl) || 0);
                    gercekImalatTL += act;
                });
            }

            const imalatFireYuzde = parseFloat(f.rates?.imalat_fire || 0) || 0;
            const gercekNetImalatTL = Math.round(gercekImalatTL * (1 + (imalatFireYuzde / 100.0)) * 100) / 100;
            const planNetImalatTL = Math.round(planImalatTL * (1 + (imalatFireYuzde / 100.0)) * 100) / 100;

            const gercekMaliyet2TL = Math.round((gercekKumasTL + gercekNetImalatTL) * 100) / 100;
            const planMaliyet2TL = Math.round((planKumasTL + planNetImalatTL) * 100) / 100;

            const kdvYuzde = parseFloat(f.rates?.kdv || 10) || 10;
            const gercekMaliyet1TL = Math.round((gercekMaliyet2TL * (1 + (kdvYuzde / 100.0))) * 100) / 100;
            const planMaliyet1TL = Math.round((planMaliyet2TL * (1 + (kdvYuzde / 100.0))) * 100) / 100;

            const ggYuzde = parseFloat(f.rates?.gg || 0) || 0;
            const gercekGG_TL = Math.round((gercekMaliyet1TL * (ggYuzde / 100.0)) * 100) / 100;

            const mupYuzde = parseFloat(f.rates?.mup || 0) || 0;
            const gercekMUP_TL = Math.round(((gercekMaliyet1TL + gercekGG_TL) * (mupYuzde / 100.0)) * 100) / 100;

            // KOMİSYON (kullanıcının belirttiği gibi komisyon ödendi ya da iptal oldu/0)
            const komisYuzde = parseFloat(f.rates?.komis || 0) || 0;
            const gercekKomisTL = Math.round(((gercekMaliyet1TL + gercekGG_TL + gercekMUP_TL) * (komisYuzde / 100.0)) * 100) / 100;

            const gercekToplamTL = Math.round((gercekMaliyet1TL + gercekGG_TL + gercekMUP_TL + gercekKomisTL) * 100) / 100;

            const targetCurr = f.targetCurrency || 'EUR';
            const targetRate = curRates[targetCurr] || (targetCurr === 'TL' ? 1.0 : 56.0);

            const gercekToplamDoviz = targetRate > 0 ? Math.round((gercekToplamTL / targetRate) * 100) / 100 : 0;
            const gercekMaliyet2Doviz = targetRate > 0 ? Math.round((gercekMaliyet2TL / targetRate) * 100) / 100 : 0;

            // Planlanan maliyet ile anlık sapma/fark (Tasarruf = Pozitif +, Zarar/Aşım = Negatif -)
            const planToplamTL = actualCostStyle.value?.cost_data?.totals?.toplam_satis_tl || planMaliyet1TL;
            const netFarkTL = Math.round((planToplamTL - gercekToplamTL) * 100) / 100;
            const tasarrufMu = netFarkTL >= 0;
            const farkYuzde = planToplamTL > 0 ? Math.round((Math.abs(netFarkTL) / planToplamTL) * 1000) / 10 : 0;

            f.totals = {
                toplam_kumas_tl: Math.round(gercekKumasTL * 100) / 100,
                planlanan_kumas_tl: Math.round(planKumasTL * 100) / 100,
                toplam_imalat_tl: gercekNetImalatTL,
                planlanan_imalat_tl: planNetImalatTL,
                maliyet_2_tl: gercekMaliyet2TL,
                plan_maliyet_2_tl: planMaliyet2TL,
                maliyet_1_tl: gercekMaliyet1TL,
                gg_tl: gercekGG_TL,
                mup_tl: gercekMUP_TL,
                komis_tl: gercekKomisTL,
                toplam_gerceklesen_tl: gercekToplamTL,
                toplam_gerceklesen_doviz: gercekToplamDoviz,
                maliyet_2_doviz: gercekMaliyet2Doviz,
                plan_toplam_tl: planToplamTL,
                tasarruf_tl: Math.abs(netFarkTL),
                fark_isaret: tasarrufMu ? '+' : '-',
                fark_yuzde: farkYuzde,
                tasarruf_mu: tasarrufMu
            };
        };

        const handleActualCostKeynav = (e, section, field, rowIdx) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const nextEl = document.getElementById(`actual-${section}-${field}-${rowIdx + 1}`);
                if (nextEl) {
                    nextEl.focus();
                    nextEl.select();
                } else {
                    if (section === 'fabric') {
                        addActualFabricRow();
                        nextTick(() => {
                            const newEl = document.getElementById(`actual-${section}-${field}-${rowIdx + 1}`);
                            if (newEl) { newEl.focus(); newEl.select(); }
                        });
                    } else if (section === 'item') {
                        addActualItemRow();
                        nextTick(() => {
                            const newEl = document.getElementById(`actual-${section}-${field}-${rowIdx + 1}`);
                            if (newEl) { newEl.focus(); newEl.select(); }
                        });
                    }
                }
            } else if (e.key === 'Tab' && !e.shiftKey) {
                if (field === 'amount') {
                    const nextInvoice = document.getElementById(`actual-${section}-invoice-${rowIdx + 1}`);
                    if (nextInvoice) {
                        e.preventDefault();
                        nextInvoice.focus();
                        nextInvoice.select();
                    }
                }
            }
        };

        const saveActualCostCalculation = async () => {

            if (!actualCostStyle.value) return;
            recalculateActualCost();
            actualCostSaving.value = true;
            try {
                const payload = {
                    actual_cost_data: actualCostForm.value,
                    calculated_total: actualCostForm.value.totals.toplam_gerceklesen_doviz,
                    currency: actualCostForm.value.targetCurrency
                };
                const res = await apiFetch(`/api/styles/${actualCostStyle.value.id}/actual-cost`, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                actualCostStyle.value.actual_cost_data = JSON.parse(JSON.stringify(actualCostForm.value));
                alert('💾 ' + res.message);
                await loadStyles();
                actualCostModalOpen.value = false;
            } catch (err) {
                alert('Kayıt Hatası: ' + err.message);
            } finally {
                actualCostSaving.value = false;
                refreshIcons();
            }
        };



        onMounted(() => {
            document.documentElement.className = themeName.value + (isDarkMode.value ? ' dark' : '');
            applyGlobalZoom(zoomLevel.value);
            checkAuth();
            loadCurrencyRates();
            setInterval(loadCurrencyRates, 15 * 60 * 1000);
            
            let resizeTimer = null;
            window.addEventListener('resize', () => {
                isMobile.value = window.innerWidth < 768;
                if (zoomMode.value === 'auto') {
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(() => {
                        const newAuto = getAutoFitZoom();
                        if (newAuto !== zoomLevel.value) {
                            zoomLevel.value = newAuto;
                            applyGlobalZoom(newAuto);
                        }
                    }, 250);
                }
            });

            window.addEventListener('paste', handleGlobalPaste);
            setTimeout(() => scrollToCurrentWeek(false), 300);
            refreshIcons();

            // Dismiss Instant Splash Screen
            const splashEl = document.getElementById('texflow-splash');
            if (splashEl) {
                splashEl.style.opacity = '0';
                splashEl.style.pointerEvents = 'none';
                setTimeout(() => { if (splashEl.parentNode) splashEl.parentNode.removeChild(splashEl); }, 400);
            }
        });


        return {
            currentUser,
            token,
            loading,
            sidebarOpen,
            isMobile,
            zoomLevel,
            zoomMode,
            changeZoom,
            resetZoom,
            toggleAutoZoom,
            columnVisibilityModalOpen,
            tempVisibleColumns,
            tempHiddenColumns,
            openColumnVisibilityModal,
            hideColumn,
            showColumn,
            showAllColumns,
            applyColumnVisibility,
            saveAllChanges,
            discardChanges,
            addColumnModalOpen,
            newColumnForm,
            getParsedOptionsPreview,
            openAddColumnModal,
            submitCreateColumn,
            confirmDeleteCustomColumn,
            customColumnsList,
            imageColWidth,
            startImageColumnResize,
            updateCustomFieldDirect,
            toggleCustomCheckbox,
            formatDateForInput,
            updateOrderDateDirect,
            formatPrice2Decimals,
            format2Dec,
            updatePriceWith2Decimals,
            confirmDeleteStyle,
            hasPermission,
            getFabricDisplayTitle,
            usersList,
            usersLoading,
            userModalOpen,
            editingUser,
            userForm,
            loadUsers,
            openAddUserModal,
            openEditUserModal,
            onUserRoleChange,
            saveUser,
            deleteUser,
            themeName,
            setTheme,
            isDarkMode,
            toggleDarkMode,
            loginForm,
            loginError,
            login,
            fillLogin,
            logout,
            menus,
            activeMenu,
            setActiveMenu,
            getActiveMenuTitle,
            stats,
            dashboardPeriod,
            dashboardMonth,
            dashboardViewMode,
            dashboardVisibleCards,
            monthFilterOptions,
            setDashboardPeriod,
            setDashboardMonth,
            setDashboardViewMode,
            toggleDashboardCard,
            isDashboardCardVisible,
            dashboardFilteredStyles,
            dashboardMetrics,
            dashboardWeeklyDeliveries,
            scrollWeeklyCarousel,
            scrollToCurrentWeek,
            navigateToStyleInSheet,
            styles,
            filteredStyles,
            carsafSearchQuery,
            visibleColumns,
            displayedColumns,
            areSizesCollapsed,
            toggleSizesCollapsed,
            areFabricColsCollapsed,
            toggleFabricCollapsed,
            isSmartScrollEnabled,
            saveSmartScrollPref,
            selectedRowId,
            selectRow,
            getStickyColumnStyle,
            getStickyImageStyle,
            handleTableKeydown,
            parseSmartDate,
            updateSmartDate,
            updateCustomDateSmart,
            manageOrdersModalOpen,
            allOrdersList,
            allOrdersLoading,
            orderSearchQuery,
            selectedOrderIds,
            openManageOrdersModal,
            loadAllOrdersList,
            filteredOrdersList,
            expandedOrderIds,
            toggleOrderExpand,
            isOrderExpanded,
            confirmDeleteColorFromOrder,
            toggleSelectAllOrders,
            confirmDeleteSingleOrder,
            confirmBulkDeleteOrders,
            getRowSizeSummary,
            availableSizes,
            sortColumn,
            sortDirection,

            toggleSort,
            clearSort,
            getColumnTitleByKey,
            getOrderMonth,
            getOrderYear,
            getDeliveryMonth,
            getDeliveryYear,
            getColorCodePrefix,
            getColorNameSuffix,
            formatColorFull,
            getStatusBadgeClass,
            getCurrencySymbol,
            normalizeStatusName,
            toggleCheckboxWithTimestamp,
            updateStatusWithUser,

            onColumnDragStart,
            onColumnDragEnd,
            onColumnDragOver,
            onColumnDragLeave,
            onColumnDrop,

            startColumnResize,
            resetColumnLayout,
            activeFilterDropdown,
            toggleColumnFilterDropdown,
            columnFilterSearch,
            tempColumnFilters,
            onColumnSearchInput,
            applyColumnFilter,
            cancelColumnFilter,
            getDistinctValuesForColumn,
            isColumnFiltered,
            isValSelectedInColumn,
            toggleValSelection,
            selectAllForColumn,
            clearColumnFilter,
            clearAllColumnFilters,
            hasActiveColumnFilters,
            hasOtherActiveFilters,
            allStatusStages,
            newCustomStatusText,
            addNewCustomStatus,
            resetStatusFilter,
            applyDefaultStatusFilter,
            saveCurrentStatusAsDefault,
            saveAndApplyCurrentStatusAsDefault,
            imageModalOpen,
            imageFitMode,
            setImageFitMode,
            getImageFitClass,
            sidebarCollapsed,
            toggleSidebar,
            openImageModal,

            handleDirectImageDrop,
            uploadStyleImageSlot,
            activeImageSlot,
            pasteStyleImageSlot,
            uploadStyleImageBlob,
            deleteStyleImageSlot,
            swapStyleImagesSlot,
            loadStyles,



            updateSingleSizeInline,
            updateCellWithLog,
            getDisplayColor,
            updateColorCell,
            updateUnitMeters,
            updateUnitGrams,
            updateFabricWastage,
            updateFabricOrderedManual,
            updateUnitMeters2,
            updateUnitGrams2,
            updateFabricWastage2,
            updateFabricOrderedManual2,
            updateFabricPrice1,
            updateFabricPrice2,
            formatPrice2Decimals,
            calculateFabricOrder,
            formatMeters2Decimals,
            formatCompositionAbbr,
            formatFabricWidthWeight,
            getRowStatusClass,
            getCellBgClass,
            isItemShipped,
            isItemCancelled,
            filteredTotals,
            fabricAssignModalOpen,
            fabricAssignSlot,
            fabricAssignTarget,
            closeFabricAssignModal,
            isAssigningFabric,
            openFabricAssignModal,
            isAddingManualRow,
            newManualRow,
            startManualRow,
            cancelManualRow,
            saveManualRow,
            getManualRowTotalQty,
            updateManualSize,
            distinctCustomers,
            distinctBrands,
            distinctChannels,
            customChannels,
            newCustomChannelText,
            addNewCustomChannel,
            distinctPos,
            distinctStyles,
            distinctDescriptions,
            distinctColors,
            activeChannelRowId,
            channelQuery,
            channelSelectedIndex,
            channelSuggestions,
            onChannelFocus,
            onChannelInput,
            onChannelBlur,
            selectChannelSuggestion,
            handleChannelKeydown,
            onChannelChange,
            onBrandChange,




            assignFabricToStyle,
            detachFabricFromStyle,
            auditModalOpen,
            styleAuditLogs,
            globalAuditLogs,
            openAuditModal,
            loadGlobalAuditLogs,
            dragOver,
            uploadLoading,
            parsedPreview,
            getParsedSizesList,
            updateParsedSize,
            calculateItemTotal,
            addPreviewRow,
            removePreviewRow,
            clearParsedPreview,
            importing,
            handleFileDrop,
            handleFileSelect,
            confirmImport,
            fabricsList,
            fabricSearch,
            loadFabrics,
            getFabricArrivalDaysRemaining,
            getFabricArrivalDateStyleClass,
            getFabricReceivedMetersClass,
            getPpsBadgeClass,
            updatePpsStatus,
            getDaysSinceDate,
            logModalOpen,



            selectedStyle,
            selectedStyleLogs,
            newLogText,
            openLogModal,
            addLog,
            companiesList,
            newCompany,
            createCompany,
            currencyRates,
            currencyDate,
            currencyLoading,
            loadCurrencyRates,

            costModalOpen,
            closeCostModal,
            costStyle,
            costSaving,
            costModalWidth,
            costModalHeight,
            costModalMaximized,
            costViewMode,
            costStudies,
            activeStudyIndex,
            isNewStudyMode,
            allStudyItemNames,
            selectCostStudy,
            startNewCostStudy,
            deleteCostStudy,
            switchToStudyAndEdit,
            toggleCostModalMaximize,
            startResizeModal,
            costAutocompleteSuggestions,
            defaultCostTemplates,
            costForm,
            evalCostFormula,
            recalculateCost,
            openCostModal,
            addCostFabricRow,
            removeCostFabricRow,
            addCostItemRow,

            removeCostItemRow,
            applyCostTemplate,
            saveCostCalculation,
            handleCostItemsKeydown,
            handleCostFabricKeydown,
            applyLiveRatesToCost,
            onFabricCodeChange,
            getCostFabricDisplay,
            availableFabricCodes,
            draggedCostStyle,
            dropTargetCostStyle,
            copyCostModalOpen,
            sourceCostStyle,
            targetCostStyle,
            costCopying,
            onCostDragStart,
            onCostDragEnd,
            onCostDragOver,
            onCostDragLeave,
            onCostDrop,
            executeCostCopy,
            actualCostModalOpen,
            actualCostStyle,
            actualCostForm,
            actualCostSaving,
            openActualCostModal,
            initActualCostFromPlanned,
            addActualFabricRow,
            removeActualFabricRow,
            addActualItemRow,
            removeActualItemRow,
            recalculateActualCost,
            saveActualCostCalculation,
            fabricViewMode,
            setFabricViewMode,
            fabricTableColumns,
            onFabricColDragStart,
            onFabricColDragEnd,
            onFabricColDragOver,
            onFabricColDragLeave,
            onFabricColDrop,
            startFabricColResize,
            resetFabricColumnsLayout,
            formatNumericDimension,
            kumasBilgiModalOpen,
            kumasBilgiFabric,
            kumasBilgiCustomer,
            kumasBilgiSeason,
            kumasBilgiTitle,
            kumasBilgiUnitType,
            kumasBilgiWastePercent,
            kumasBilgiGelenKumas,
            kumasBilgiRows,
            kumasBilgiTotals,
            openKumasBilgiFormu,
            updateFabricReceived,
            syncKumasBilgiGelen,
            kumasBilgiQualityName,
            kumasBilgiQualityCode,
            kumasBilgiVariants,
            fabricBatchModalOpen,
            selectedFabricForBatch,
            newBatchForm,
            openFabricBatchModal,
            addFabricBatch,
            deleteFabricBatch,
            removeKumasBilgiRow,
            recalculateKumasBilgiTotals,
            printKumasBilgiFormu,
            kumasBilgiOrientation,
            kumasBilgiRowHeight,
            kumasBilgiColWidths,
            setKumasBilgiRowHeight,
            setKumasBilgiOrientation,
            resetKumasBilgiColWidths,
            fitKumasBilgiToWidth,
            adjustKumasBilgiColWidth,
            startKumasBilgiColResize,
            totalKumasBilgiTableWidth,
            formatUnitVal2Decimals,
            isInvalidOrKodsuz,
            getFabricCardSubtitle,
            getFabricColorVariant,
            getFabricColorCode,
            getKumasBilgiQualityDisplay,
            getFabricCutMetersTotal,
            getFabricStockInfo,
            carsafPrintModalOpen,
            carsafPrintTitle,
            carsafPrintRows,
            carsafPrintOrientation,
            carsafPrintRowHeight,
            carsafPrintColWidths,
            adjustColWidth,
            startCarsafPrintColResize,
            resetCarsafPrintColWidths,

            setCarsafPrintOrientation,
            setCarsafPrintRowHeight,
            openCarsafPrintModal,
            removeCarsafPrintRow,
            printCarsafList,
            isCarsafExportingExcel,
            exportCarsafPrintToExcel,
            isExportingExcel,
            exportOrdersToExcel,
            authChecking,

            // Haftalık Program (Patron Takip Çıktısı)
            haftalikProgramModalOpen,
            haftalikProgramStartKey,
            haftalikProgramEndKey,
            haftalikProgramOnlyWithOrders,
            haftalikProgramShowImages,
            haftalikProgramHideHeaders,
            haftalikProgramLayout,
            haftalikProgramEninePages,
            haftalikProgramIsExporting,
            openHaftalikProgramModal,
            closeHaftalikProgramModal,
            haftalikProgramWeeks,
            printHaftalikProgram,
            downloadHaftalikProgramExcel,

            // Kumaş Sipariş (Planlama & Sipariş Alındı)
            kumasSiparisModalOpen,
            kumasSiparisSearch,
            kumasSiparisStatusFilter,
            kumasSiparisCopiedToast,
            kumasSiparisList,
            kumasSiparisTotals,
            kumasSiparisPrintOrientation,
            openKumasSiparisModal,
            closeKumasSiparisModal,
            copyKumasSiparisTable,
            printKumasSiparis,

            // Kesimhane
            cuttingSearch,
            cuttingZoomImage,
            cuttingSavingId,
            cuttingSaveSuccessId,
            openCuttingZoom,
            closeCuttingZoom,
            filteredCuttingStyles,
            getCuttingFabricName,
            getCuttingFabricVariant,
            getCuttingRemainingMeters,
            getCuttingStyleOrderTotal,
            getCuttingStyleCutTotal,
            getCuttingStyleDiff,
            calculateActualUnitMeters,
            onCuttingInputChange,
            saveCuttingRow,

            // Kesim Fişi
            cuttingSlipModalOpen,
            selectedCuttingSlipModelKey,
            selectedCuttingSlipChannel,
            activeSlipModelAvailableChannels,
            cuttingSlipDate,
            slipRowDensity,
            effectiveSlipDensity,
            cuttingSlipModels,
            activeSlipModel,
            getSlipModelGrandTotal,
            openCuttingSlipModal,
            closeCuttingSlipModal,
            printCuttingSlip,
            exportCuttingSlipExcel,
            shippingSearch,
            shippingSavingId,
            shippingSaveSuccessId,
            filteredShippingStyles,
            getShippingStyleOrderTotal,
            getShippingStyleCutTotal,
            getShippingStyleShippedTotal,
            getShippedVsOrderPercent,
            getShippedVsCutPercent,
            getShippingStyleDiff,
            onShippingInputChange,
            saveShippingRow,

            // Bütçe Göster & Maliyet Tablosu
            budgetModalOpen,
            budgetSearchQuery,
            budgetRows,
            budgetFilteredRows,
            budgetTotals,
            openBudgetModal,
            closeBudgetModal,
            exportBudgetExcel,
            formatCurrencyVal,
            formatNumber2Dec,
            showToast,

            // Kumaş Stok Hareketleri & Ekstre
            fabricLedgerModalOpen,
            selectedFabricForLedger,
            fabricLedgerLoading,
            fabricLedgerData,
            fabricLedgerRows,
            manualDevirForm,
            openFabricLedgerModal,
            closeFabricLedgerModal,
            addFabricLedgerDevirEntry,
            deleteFabricLedgerBatch,
            saveFabricBatchField,
            printFabricLedger,
            exportFabricLedgerExcel,
            formatMetersNumber2Dec,
            formatCurrencyDisplay,
            formatStudyNameShort,

            // Serbest Fiyat Çalışması (Free Cost Studies)
            freeCostStudies,
            freeCostLoading,
            freeCostSearch,
            freeCostExpandedRows,
            freeCostModalOpen,
            freeCostEditingId,
            freeCostSaving,
            freeCostHeader,
            freeCostForm,
            formatCurrencyPrefix,
            isFreeCostRowExpanded,
            toggleFreeCostRow,
            recalculateFreeCost,
            applyLiveRatesToFreeCost,
            addFreeCostFabric,
            removeFreeCostFabric,
            addFreeCostItem,
            removeFreeCostItem,
            defaultFreeCostItems,
            loadDefaultFreeCostItems,
            addFreeCostAccessory,
            handleFreeCostItemKeydown,
            exportFreeCostListExcel,
            exportFreeCostStudyExcel,
            printFreeCostList,
            printFreeCostStudy,
            loadFreeCostStudies,
            filteredFreeCostStudies,
            openCreateFreeCostModal,
            openEditFreeCostModal,
            closeFreeCostModal,
            saveFreeCostStudy,
            deleteFreeCostStudy,

            // Backup Exports
            backupsList,
            backupConfig,
            backupLoading,
            backupCreating,
            newBackupTime,
            backupRestoreModalOpen,
            selectedBackupForRestore,
            backupRestoring,
            backupUploadLoading,
            loadBackups,
            createBackupNow,
            saveBackupSettings,
            addBackupTime,
            removeBackupTime,
            downloadBackup,
            deleteBackupItem,
            openRestoreModal,
            confirmRestoreBackup,
            handleBackupFileUpload
        };














    }
});
window.__texflowRoot = window.__texflowApp.mount('#app');





