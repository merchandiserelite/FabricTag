const { createApp, ref, computed, onMounted, nextTick } = Vue;

createApp({
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

        // Zoom / Scale State (%100 Default)
        const zoomLevel = ref(parseInt(localStorage.getItem('texflow_zoom_level') || '100'));
        const changeZoom = (delta) => {
            const next = Math.min(150, Math.max(70, zoomLevel.value + delta));
            zoomLevel.value = next;
            localStorage.setItem('texflow_zoom_level', next);
        };
        const resetZoom = () => {
            zoomLevel.value = 100;
            localStorage.setItem('texflow_zoom_level', 100);
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
                const shippedItemQty = parseInt(item.shipped_total_quantity || 0);
                
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
            const secondQualityPieces = Math.max(0, totalCutQty - totalShippedQty);
            const secondQualityPercent = totalCutQty > 0 
                ? Math.round(((secondQualityPieces) / totalCutQty) * 1000) / 10 
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
                totalCutQty,
                totalShippedQty,
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

        const printHaftalikProgram = () => {
            let printStyle = document.getElementById('haftalik-program-dynamic-print-style');
            if (!printStyle) {
                printStyle = document.createElement('style');
                printStyle.id = 'haftalik-program-dynamic-print-style';
                document.head.appendChild(printStyle);
            }
            printStyle.innerHTML = `@media print { @page { size: A4 landscape !important; margin: 6mm !important; } }`;
            setTimeout(() => {
                window.print();
            }, 60);
        };

        const downloadHaftalikProgramExcel = () => {
            haftalikProgramIsExporting.value = true;
            const start = haftalikProgramStartKey.value ? encodeURIComponent(haftalikProgramStartKey.value) : '';
            const end = haftalikProgramEndKey.value ? encodeURIComponent(haftalikProgramEndKey.value) : '';
            const onlyOrders = haftalikProgramOnlyWithOrders.value ? 'true' : 'false';
            const url = `/api/reports/haftalik-program-excel?start_key=${start}&end_key=${end}&only_with_orders=${onlyOrders}`;

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
            return [...new Set(list)].sort((a, b) => {
                const sA = String(a).trim().toUpperCase();
                const sB = String(b).trim().toUpperCase();

                const isNumA = /^\d+(\.\d+)?$/.test(sA);
                const isNumB = /^\d+(\.\d+)?$/.test(sB);

                // Both numeric: ascending (e.g. 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52...)
                if (isNumA && isNumB) {
                    return parseFloat(sA) - parseFloat(sB);
                }

                // Both alpha: standard scale (e.g. XXS, XS, S, M, L, XL, XXL, 3XL...)
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
            'description',
            'color_name',
            'fabric_article'
        ]);

        const getStickyColumnStyle = (col, isHeader = false, item = null) => {
            if (!isSmartScrollEnabled.value || !col) return {};

            if (!frozenColumnKeys.has(col.key)) {
                return {};
            }

            const fabricIdx = displayedColumns.value.findIndex(c => c.key === 'fabric_article');
            const custIdx = displayedColumns.value.findIndex(c => c.key === 'customer_name');
            const colIdx = displayedColumns.value.findIndex(c => c.key === col.key);

            if (colIdx === -1 || (custIdx !== -1 && colIdx < custIdx) || (fabricIdx !== -1 && colIdx > fabricIdx)) {
                return {};
            }

            let leftOffset = 0;
            const startIdx = custIdx !== -1 ? custIdx : 0;
            for (let i = startIdx; i < colIdx; i++) {
                const prevCol = displayedColumns.value[i];
                if (frozenColumnKeys.has(prevCol.key)) {
                    leftOffset += (prevCol.width || 100);
                }
            }

            const isLastFrozen = (col.key === 'fabric_article' || colIdx === fabricIdx);

            return {
                position: 'sticky',
                left: `${leftOffset}px`,
                zIndex: isHeader ? 32 : 12,
                boxShadow: isLastFrozen ? '4px 0 10px -2px rgba(0, 0, 0, 0.15)' : 'none'
            };
        };

        const getStickyImageStyle = (isHeader = false, item = null) => {
            return {};
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
            if (uGrams > 0) {
                const widthRaw = slot === 2 ? (item.fabrictag_width_2 || item.fabric_width_2) : (item.fabrictag_width || item.fabric_width);
                const weightRaw = slot === 2 ? (item.fabrictag_weight_2 || item.fabric_weight_2) : (item.fabrictag_weight || item.fabric_weight);

                const ftWeight = parseFloat(extractCleanDimension(weightRaw)) || 0;
                const ftWidth = parseFloat(extractCleanDimension(widthRaw)) || 0;

                let totalKg = 0;
                if (ftWeight > 0 && ftWidth > 0) {
                    totalKg = (totalQty * uGrams * wasteMultiplier * ftWeight * ftWidth) / 10000000000;
                } else {
                    totalKg = (totalQty * uGrams * wasteMultiplier) / 1000;
                }
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
            if (['KODSUZ', 'YOK', 'NONE', 'NULL', '-', 'İSİMSİZ', 'ISIMSIZ', 'TANIMSIZ'].includes(u)) return '';
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

            return { supplier, code, name, variant, color };
        };

        const kumasSiparisList = computed(() => {
            const allStyles = styles.value || [];
            const filterMode = kumasSiparisStatusFilter.value;
            const search = (kumasSiparisSearch.value || '').toLowerCase().trim();

            const filteredStyles = allStyles.filter(s => {
                if (isItemCancelled(s)) return false;
                if (filterMode === 'planning_and_ordered') {
                    return isPlanningOrOrderedStatus(s.status);
                }
                return true;
            });

            const groupsMap = {};

            filteredStyles.forEach(s => {
                const modelName = (s.style_no || s.model_name || 'Bilinmeyen').trim();
                const colorName = (s.color_name || s.color_code || '').trim();

                // Slot 1
                const f1 = extractFabricDetails(s, 1);
                const calc1 = calculateFabricOrder(s, 1);
                const meters1 = parseFloat(calc1.value) || 0;
                const unit1 = calc1.unit || 'M';

                const hasF1 = !!(f1.supplier || f1.code || f1.name || f1.variant || f1.color || s.fabric_article || meters1 > 0);
                if (hasF1) {
                    const key1 = `${f1.supplier.toLowerCase()}___${f1.code.toLowerCase()}___${f1.name.toLowerCase()}___${f1.variant.toLowerCase()}___${f1.color.toLowerCase()}`;
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
                    const unit2 = calc2.unit || 'M';

                    const hasF2 = !!(f2.supplier || f2.code || f2.name || f2.variant || f2.color || rawArt2 || meters2 > 0);
                    if (hasF2) {
                        const key2 = `${f2.supplier.toLowerCase()}___${f2.code.toLowerCase()}___${f2.name.toLowerCase()}___${f2.variant.toLowerCase()}___${f2.color.toLowerCase()}`;
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
            const totalMeters = list.reduce((acc, r) => acc + (r.totalMeters || 0), 0);
            const totalModels = list.reduce((acc, r) => acc + (r.modelCount || 0), 0);
            return {
                count: list.length,
                totalModels,
                totalMeters: Math.round(totalMeters * 10) / 10,
                formattedMeters: (Math.round(totalMeters * 10) / 10).toLocaleString('tr-TR') + ' M'
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
                text = "Kumaşçı\tKalite Kodu\tKalite Adı\tKumaş Varyant\tKumaş Renk\tModel Adları ve Renkleri\tKumaş Sipariş Metrajı\n";
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
                    text += `   Sipariş Metrajı: ${r.formattedTotalMeters}\n\n`;
                });
                text += "----------------------------------------\n";
                text += `TOPLAM: ${kumasSiparisTotals.value.formattedMeters} (${list.length} Kalite, ${kumasSiparisTotals.value.totalModels} Model)`;
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
            printStyle.innerHTML = `@media print { @page { size: A4 portrait !important; margin: 8mm !important; } }`;
            setTimeout(() => {
                window.print();
            }, 60);
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

        // MANUEL SİPARİŞ / MODEL SATIRI EKLEME
        const isAddingManualRow = ref(false);
        const newManualRow = ref({
            customer_name: '',
            brand: '',
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

        const getVisibleDistinctValuesForColumn = (colKey) => {
            const all = getAllDistinctValuesForColumn(colKey);
            const q = (columnFilterSearch.value[colKey] || '').toLowerCase().trim();
            if (!q) return all;
            return all.filter(v => v.toLowerCase().includes(q));
        };

        const getDistinctValuesForColumn = (colKey) => {
            return getVisibleDistinctValuesForColumn(colKey);
        };

        const toggleColumnFilterDropdown = (colKey, e) => {
            if (e) e.stopPropagation();
            if (activeFilterDropdown.value === colKey) {
                cancelColumnFilter(colKey);
            } else {
                activeFilterDropdown.value = colKey;
                columnFilterSearch.value[colKey] = '';
                const allVals = getAllDistinctValuesForColumn(colKey);
                if (columnFilters.value[colKey] !== undefined && columnFilters.value[colKey] !== null) {
                    tempColumnFilters.value[colKey] = [...columnFilters.value[colKey]];
                } else {
                    tempColumnFilters.value[colKey] = [...allVals];
                }
            }
            refreshIcons();
        };

        const onColumnSearchInput = (colKey) => {
            const q = (columnFilterSearch.value[colKey] || '').toLowerCase().trim();
            const visible = getVisibleDistinctValuesForColumn(colKey);
            if (!q) {
                const allVals = getAllDistinctValuesForColumn(colKey);
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
                tempColumnFilters.value[colKey] = [...getAllDistinctValuesForColumn(colKey)];
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
            const allVals = getAllDistinctValuesForColumn(colKey);
            const selected = tempColumnFilters.value[colKey] || [];
            
            if (allVals.length > 0 && allVals.every(v => selected.includes(v))) {
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
            if (arr === undefined || arr === null) return false;
            const allVals = getAllDistinctValuesForColumn(colKey);
            if (allVals.length > 0 && allVals.every(v => arr.includes(v))) {
                return false;
            }
            return true;
        };

        const clearAllColumnFilters = () => {
            columnFilters.value = {};
            tempColumnFilters.value = {};
            activeFilterDropdown.value = null;
            refreshIcons();
        };

        const hasActiveColumnFilters = () => {
            return Object.keys(columnFilters.value).some(k => isColumnFiltered(k));
        };

        // FILTERED & SORTED STYLES ENGINE
        const filteredStyles = computed(() => {
            if (!styles.value || styles.value.length === 0) return [];
            
            // 1. Filter Pass
            let result = styles.value.filter(s => {
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
        const openImageModal = (style) => {
            selectedStyle.value = style;
            imageModalOpen.value = true;
            refreshIcons();
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

        const filteredOrdersList = computed(() => {
            const q = (orderSearchQuery.value || '').toLowerCase().trim();
            if (!q) return allOrdersList.value;
            return allOrdersList.value.filter(o => {
                return (o.po_number && o.po_number.toLowerCase().includes(q)) ||
                       (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
                       (o.brand && o.brand.toLowerCase().includes(q));
            });
        });

        const toggleSelectAllOrders = () => {
            if (selectedOrderIds.value.length === filteredOrdersList.value.length) {
                selectedOrderIds.value = [];
            } else {
                selectedOrderIds.value = filteredOrdersList.value.map(o => o.id);
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
                        priceStr = p.toFixed(2).replace('.', ',') + ' ' + cur;
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
                    color_name: s.color_name || '',
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

        const refreshIcons = () => {
            nextTick(() => {
                if (window.lucide) {
                    lucide.createIcons();
                }
            });
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

        // Navigation
        const setActiveMenu = (menuKey) => {
            activeMenu.value = menuKey;
            sidebarOpen.value = false;
            if (menuKey === 'carsaf_liste' || menuKey === 'kesimhane' || menuKey === 'yukleme_adetleri') loadStyles();
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
        const costModalOpen = ref(false);
        const costStyle = ref(null);
        const costSaving = ref(false);
        const costModalWidth = ref(typeof window !== 'undefined' ? Math.min(window.innerWidth - 32, 1480) : 1480);
        const costModalHeight = ref(typeof window !== 'undefined' ? Math.min(window.innerHeight - 32, 900) : 900);
        const costModalMaximized = ref(false);

        const toggleCostModalMaximize = () => {
            costModalMaximized.value = !costModalMaximized.value;
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
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
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

        const evalCostFormula = (expr) => {

            if (expr === null || expr === undefined) return 0;
            const s = String(expr).trim().replace(',', '.');
            if (!s) return 0;
            if (/^[0-9+\-*/. ()]+$/.test(s)) {
                try {
                    const fn = new Function(`return (${s})`);
                    const res = fn();
                    return typeof res === 'number' && !isNaN(res) && isFinite(res) ? res : 0;
                } catch {
                    return parseFloat(s) || 0;
                }
            }
            return parseFloat(s) || 0;
        };

        const calculateCostObject = (f) => {
            if (!f) return f;
            const curRates = f.exchangeRates || { EUR: 56, USD: 48.5, GBP: 65.5, TL: 1 };

            // 1. Calculate Fabrics
            let kumasToplamTL = 0;
            if (f.fabrics && f.fabrics.length > 0) {
                f.fabrics.forEach(fb => {
                    const currKey = normalizeCurrencyCode(fb.currency, 'EUR');
                    const unitRate = curRates[currKey] !== undefined ? curRates[currKey] : (currKey === 'TL' ? 1.0 : (curRates['EUR'] || 56.0));
                    const price = parseFloat(fb.price || 0) || 0;
                    let amount = 0;
                    if (fb.unit_type === 'KG') {
                        const grams = parseFloat(fb.grams || 0) || 0;
                        amount = (grams / 1000.0) * price * unitRate;
                    } else {
                        const meters = parseFloat(fb.meters || 0) || 0;
                        amount = meters * price * unitRate;
                    }
                    const extraWastage = parseFloat(fb.wastage_percent || 0) || 0;
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
                    const unitRate = curRates[currKey] !== undefined ? curRates[currKey] : (currKey === 'TL' ? 1.0 : (curRates['EUR'] || 56.0));
                    const calculatedVal = evalCostFormula(it.formula !== undefined && it.formula !== '' ? it.formula : it.price);
                    it.evaluated_price = calculatedVal;
                    const qty = parseFloat(it.qty !== undefined && it.qty !== '' ? it.qty : 1) || 1;
                    const rowTL = qty * calculatedVal * unitRate;
                    it.total_tl = Math.round(rowTL * 100) / 100;
                    imalatHamTL += it.total_tl;
                });
            }

            const imalatFireYuzde = parseFloat(f.rates?.imalat_fire || 0) || 0;
            const imalatToplamTL = Math.round(imalatHamTL * (1 + (imalatFireYuzde / 100.0)) * 100) / 100;

            // 3. Main Cost Matrix (Excel HS27 Master Formülleri ile 1-e-1 Birebir)
            const maliyet2TL = Math.round((kumasToplamTL + imalatToplamTL) * 100) / 100;
            const kdvYuzde = parseFloat(f.rates?.kdv || 10) || 10;
            const maliyet1TL = Math.round((maliyet2TL * (1 + (kdvYuzde / 100.0))) * 100) / 100;
            const tkdvTL = Math.round((maliyet1TL - maliyet2TL) * 100) / 100;
            const ggYuzde = parseFloat(f.rates?.gg || 0) || 0;
            const ggTL = Math.round((maliyet1TL * (ggYuzde / 100.0)) * 100) / 100;
            const mupYuzde = parseFloat(f.rates?.mup || 0) || 0;
            const mupTL = Math.round(((maliyet1TL + ggTL) * (mupYuzde / 100.0)) * 100) / 100;
            const komisYuzde = parseFloat(f.rates?.komis || 0) || 0;
            const komisTL = Math.round(((maliyet1TL + ggTL + mupTL) * (komisYuzde / 100.0)) * 100) / 100;
            const toplamSatisTL = Math.round((maliyet1TL + ggTL + mupTL + komisTL) * 100) / 100;

            // Target Currency Conversion
            const targetCurr = f.targetCurrency || 'EUR';
            const targetRate = curRates[targetCurr] || (targetCurr === 'TL' ? 1.0 : 56.0);

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
            if (!targetTr) return;

            const targetTd = targetTr.children[cellIndex];
            if (!targetTd) return;

            const targetInput = targetTd.querySelector('input:not([disabled]), select:not([disabled])');
            if (targetInput) {
                event.preventDefault();
                target.blur();
                targetInput.focus();
                if (typeof targetInput.select === 'function') targetInput.select();
            }
        };

        const onFabricCodeChange = (fb) => {
            if (!fb || !fb.code) return;
            const cleanQuery = String(fb.code).trim().toUpperCase();
            if (cleanQuery.length < 3) return;

            // Loaded styles içinden girilen iç koda göre kumaş bilgilerini bul ve alttaki alanları güncelle
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
                    if (defD.supplier) fb.supplier = defD.supplier.slice(0, 12);
                    fb.quality = defD.quality || '';
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

            if (style.cost_data && typeof style.cost_data === 'object' && style.cost_data.fabrics && style.cost_data.fabrics.length > 0) {
                costForm.value = JSON.parse(JSON.stringify(style.cost_data));
                costForm.value.targetCurrency = targetCurr;
                if (!costForm.value.exchangeRates) {
                    costForm.value.exchangeRates = ratesObj;
                }
                if (!costForm.value.rates_snapshot_date) {
                    costForm.value.rates_snapshot_date = 'Kayıtlı Kur';
                }
                // Sync & normalize fabric currencies and backfill missing detail fields
                costForm.value.fabrics.forEach((fb, idx) => {
                    const defD = parseFabricDetails(style, idx === 1);
                    if (!fb.supplier) fb.supplier = defD.supplier;
                    if (fb.supplier && fb.supplier.length > 12) fb.supplier = fb.supplier.slice(0, 12).trim();

                    // Aradaki kumaşçı ismini koddan çıkar
                    if (fb.code) {
                        fb.code = stripSupplierFromCode(fb.code, fb.supplier || defD.supplier);
                    } else {
                        fb.code = defD.code;
                    }

                    // Kalite adı/kodunda iç kod (ELT) varsa temizle
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



                    // Kumaşın kayıtlı döviz cinsini ve fiyatını koru, yoksa modelden doldur
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
            } else {
                const initFabrics = [];
                // Fabric 1
                const d1 = parseFabricDetails(style, false);
                if (style.fabric_article || style.unit_meters || style.unit_grams || style.fabric_price_1) {
                    initFabrics.push({
                        title: 'Kumaş 1 (Ana Kumaş)',
                        code: d1.code,
                        supplier: d1.supplier,
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
                    initFabrics.push({
                        title: 'Kumaş 2 (İkinci Kumaş)',
                        code: d2.code,
                        supplier: d2.supplier,
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

                costForm.value = {
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
            }

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

        const saveCostCalculation = async (applyToUnitPrice = false) => {
            if (!costStyle.value) return;
            recalculateCost();
            costSaving.value = true;
            try {
                const payload = {
                    cost_data: costForm.value,
                    apply_to_unit_price: applyToUnitPrice,
                    calculated_price: costForm.value.totals.toplam_satis_doviz,
                    currency: costForm.value.targetCurrency
                };
                const res = await apiFetch(`/api/styles/${costStyle.value.id}/cost`, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                costStyle.value.cost_data = JSON.parse(JSON.stringify(costForm.value));
                if (applyToUnitPrice) {
                    costStyle.value.unit_price = costForm.value.totals.toplam_satis_doviz;
                    costStyle.value.currency = costForm.value.targetCurrency;
                }
                alert('💾 ' + res.message + (applyToUnitPrice ? `\nModel birim fiyatı ${costForm.value.totals.toplam_satis_doviz} ${costForm.value.targetCurrency} olarak güncellendi.` : ''));
                await loadStyles();
                costModalOpen.value = false;
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
            checkAuth();
            loadCurrencyRates();
            setInterval(loadCurrencyRates, 15 * 60 * 1000);
            window.addEventListener('resize', () => {
                isMobile.value = window.innerWidth < 768;
            });
            setTimeout(() => scrollToCurrentWeek(false), 300);
            refreshIcons();
        });


        return {
            currentUser,
            token,
            loading,
            sidebarOpen,
            isMobile,
            zoomLevel,
            changeZoom,
            resetZoom,
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
            deleteStyleImageSlot,
            swapStyleImagesSlot,
            loadStyles,



            updateSingleSizeInline,
            updateCellWithLog,
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
            distinctPos,
            distinctStyles,
            distinctDescriptions,
            distinctColors,




            assignFabricToStyle,
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
            costStyle,
            costSaving,
            costModalWidth,
            costModalHeight,
            costModalMaximized,
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
            handleActualCostKeynav,
            fabricViewMode,

            setFabricViewMode,
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
            isExportingExcel,
            exportOrdersToExcel,
            authChecking,

            // Haftalık Program (Patron Takip Çıktısı)
            haftalikProgramModalOpen,
            haftalikProgramStartKey,
            haftalikProgramEndKey,
            haftalikProgramOnlyWithOrders,
            haftalikProgramShowImages,
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

            // Yükleme Adetleri
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
            saveShippingRow
        };














    }
}).mount('#app');





