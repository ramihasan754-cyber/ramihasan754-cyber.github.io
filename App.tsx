import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { AmmanDistrictMap } from './components/AmmanDistrictMap';
import { VenueCard } from './components/VenueCard';
import { VenueModal } from './components/VenueModal';
import { BudgetCalculator } from './components/BudgetCalculator';
import { AITripPlanner } from './components/AITripPlanner';
import { PartnersHub } from './components/PartnersHub';
import { SuperAdminPortal } from './components/SuperAdminPortal';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { NotificationCenter } from './components/NotificationCenter';
import { AdminFontManager } from './components/AdminFontManager';
import { FilterDrawer } from './components/FilterDrawer';

import { Restaurant, VenueCategory } from './types';
import { INITIAL_RESTAURANTS } from './data/ammanData';
import { subscribeToRestaurants } from './firebase/config';
import { normalizeArabic } from './utils/arabic';
import { Search, MapPin, Gift, X, SlidersHorizontal } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('explore');
  const [restaurants, setRestaurants] = useState<Restaurant[]>(INITIAL_RESTAURANTS);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filtering State
  const [selectedDistrict, setSelectedDistrict] = useState<string>('الكل');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(50);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [showOnlyOffers, setShowOnlyOffers] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [showInteractiveMap, setShowInteractiveMap] = useState<boolean>(false);
  
  // Unified Filter Sheet / Popover State
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [onlyWithMenu, setOnlyWithMenu] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'rating-desc'>('recommended');

  // Favorites state stored in LocalStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tashah_favs');
      return saved ? JSON.parse(saved) : ['r1', 'r3'];
    } catch {
      return ['r1', 'r3'];
    }
  });

  // Modal State
  const [selectedVenue, setSelectedVenue] = useState<Restaurant | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isFontManagerOpen, setIsFontManagerOpen] = useState<boolean>(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleNavigateFromNotification = (tab: string, category?: VenueCategory, venueId?: string) => {
    setActiveTab(tab);
    if (category) {
      setSelectedCategory(category);
    }
    if (venueId) {
      const match = restaurants.find((r) => r.id === venueId);
      if (match) {
        setSelectedVenue(match);
      }
    }
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      const exists = list.includes(id);
      const next = exists ? list.filter((item) => item !== id) : [...list, id];
      try {
        localStorage.setItem('tashah_favs', JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      showToast(exists ? 'تمت الإزالة من القائمة المفضلة' : 'تمت الإضافة إلى المفضلة');
      return next;
    });
  };

  // Real-time Firebase Subscription with fallback
  useEffect(() => {
    const unsubscribe = subscribeToRestaurants((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setRestaurants(data);
      } else {
        setRestaurants(INITIAL_RESTAURANTS);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update restaurant list locally
  const handleUpdateRestaurants = (updated: Restaurant[]) => {
    if (Array.isArray(updated)) {
      setRestaurants(updated);
    }
  };

  // Category chips definition in exact requested order
  const CATEGORY_CHIPS = useMemo(() => [
    { id: 'offers', label: 'عروض حصرية', icon: '🎁', isOffer: true },
    { id: 'all', label: 'الكل', icon: '✨' },
    { id: 'coffee', label: 'كافيهات ومقاهي', icon: '☕' },
    { id: 'burgers', label: 'وجبات سريعة وبرجر', icon: '🍔' },
    { id: 'traditional', label: 'شرقي ومناسف', icon: '🍲' },
    { id: 'pizza-italian', label: 'بيتزا وإيطالي', icon: '🍕' },
    { id: 'sweets', label: 'حلويات وبوظة', icon: '🍰' },
    { id: 'hookah-cafes', label: 'قهاوي وأراجيل', icon: '💨' },
    { id: 'kids', label: 'ترفيه وأطفال', icon: '🎈' },
    { id: 'tourism', label: 'أماكن سياحية ومعالم', icon: '🏛️' },
  ], []);

  // Check if a venue matches a category chip
  const isMatchCategory = (r: Restaurant, catId: string) => {
    if (catId === 'all') return true;
    if (catId === 'offers') return !!r.specialOffer;
    const cat = r.category || '';
    const name = r.name || '';
    const desc = r.description || '';

    if (catId === 'coffee') return cat === 'coffee' || cat === 'cafes' || name.includes('كافيه') || name.includes('قهوة');
    if (catId === 'burgers') return cat === 'burgers' || name.includes('برجر') || desc.includes('برجر');
    if (catId === 'traditional') return cat === 'traditional' || name.includes('منسف') || desc.includes('شعبي') || name.includes('شاورما');
    if (catId === 'pizza-italian') return cat === 'pizza-italian' || name.includes('بيتزا') || desc.includes('إيطالي');
    if (catId === 'sweets') return cat === 'sweets' || (cat as string) === 'dessert' || name.includes('حلويات') || name.includes('كنافة');
    if (catId === 'hookah-cafes') return cat === 'hookah-cafes' || desc.includes('أرجيلة') || desc.includes('أراجيل') || desc.includes('شيشة') || name.includes('أراجيل');
    if (catId === 'kids') return cat === 'kids' || cat === 'family-kids' || name.includes('أطفال') || desc.includes('ألعاب');
    if (catId === 'tourism') return cat === 'tourism' || cat === 'historical' || cat === 'adventures' || cat === 'trips' || desc.includes('سياحي') || desc.includes('تراث');
    return cat === catId;
  };

  // Automatic available counts for each category chip
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORY_CHIPS.forEach((chip) => {
      counts[chip.id] = (restaurants || []).filter((r) => isMatchCategory(r, chip.id)).length;
    });
    return counts;
  }, [restaurants, CATEGORY_CHIPS]);

  // Count how many filters are currently active for the "تصفية" badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedDistrict !== 'الكل') count++;
    if (maxPriceFilter < 50) count++;
    if (minRatingFilter > 0) count++;
    if (onlyWithMenu) count++;
    if (showOnlyFavorites) count++;
    if (showOnlyOffers) count++;
    if (sortBy !== 'recommended') count++;
    if (showInteractiveMap) count++;
    return count;
  }, [selectedDistrict, maxPriceFilter, minRatingFilter, onlyWithMenu, showOnlyFavorites, showOnlyOffers, sortBy, showInteractiveMap]);

  // Reset all filters function
  const handleResetAllFilters = () => {
    setSelectedDistrict('الكل');
    setSelectedCategory('all');
    setSearchQuery('');
    setMaxPriceFilter(50);
    setShowOnlyFavorites(false);
    setShowOnlyOffers(false);
    setMinRatingFilter(0);
    setOnlyWithMenu(false);
    setSortBy('recommended');
    setShowInteractiveMap(false);
  };

  // Filtered Restaurant Collection
  const filteredRestaurants = useMemo(() => {
    const list = Array.isArray(restaurants) ? restaurants : INITIAL_RESTAURANTS;
    const favList = Array.isArray(favorites) ? favorites : [];

    const filtered = list.filter((r) => {
      if (!r) return false;

      // District Filter (flexible normalized matching for 80 Jordan areas)
      if (selectedDistrict !== 'الكل') {
        const cleanSelected = normalizeArabic(selectedDistrict.replace(/[()]/g, '').trim());
        const cleanDistrict = normalizeArabic((r.district || '').replace(/[()]/g, '').trim());
        const matches = cleanDistrict === cleanSelected || 
          cleanDistrict.includes(cleanSelected) || 
          cleanSelected.includes(cleanDistrict);
        if (!matches) {
          return false;
        }
      }

      // Category Filter (supporting the 10 specific categories)
      if (selectedCategory !== 'all' && !isMatchCategory(r, selectedCategory)) {
        return false;
      }

      // Price Filter
      if ((r.avgPricePerPerson || 0) > maxPriceFilter) {
        return false;
      }

      // Min Rating Filter
      if (minRatingFilter > 0 && (r.rating || 0) < minRatingFilter) {
        return false;
      }

      // Only with Menu Filter
      if (onlyWithMenu && !r.uploadedMenuUrl && (!r.menuItems || r.menuItems.length === 0)) {
        return false;
      }

      // Favorites Only
      if (showOnlyFavorites && !favList.includes(r.id)) {
        return false;
      }

      // Special Offers Only
      if (showOnlyOffers && !r.specialOffer) {
        return false;
      }

      // Normalized Arabic Text Search
      if (searchQuery.trim().length > 0) {
        const normQuery = normalizeArabic(searchQuery);
        const normName = normalizeArabic(r.name || '');
        const normDesc = normalizeArabic(r.description || '');
        const normDistrict = normalizeArabic(r.district || '');
        const normHandle = (r.instagramHandle || '').toLowerCase();
        const normOfferTitle = normalizeArabic(r.specialOffer?.title || '');
        const normPromo = (r.specialOffer?.promoCode || '').toLowerCase();

        return (
          normName.includes(normQuery) ||
          normDesc.includes(normQuery) ||
          normDistrict.includes(normQuery) ||
          normHandle.includes(searchQuery.toLowerCase()) ||
          normOfferTitle.includes(normQuery) ||
          normPromo.includes(searchQuery.toLowerCase())
        );
      }

      return true;
    });

    // Apply Sorting
    if (sortBy === 'rating-desc') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'price-asc') {
      filtered.sort((a, b) => (a.avgPricePerPerson || 0) - (b.avgPricePerPerson || 0));
    }

    return filtered;
  }, [
    restaurants, 
    selectedDistrict, 
    selectedCategory, 
    searchQuery, 
    maxPriceFilter, 
    minRatingFilter, 
    onlyWithMenu, 
    showOnlyFavorites, 
    showOnlyOffers, 
    favorites, 
    sortBy
  ]);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 dir-rtl flex flex-col selection:bg-orange-500 selection:text-white pb-20 md:pb-8">
      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Primary Header */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        favoritesCount={favorites.length}
        compactView={viewMode === 'compact'}
        setCompactView={(compact) => setViewMode(compact ? 'compact' : 'grid')}
        onOpenFavsModal={() => {
          setShowOnlyFavorites((prev) => !prev);
          setActiveTab('explore');
          showToast(!showOnlyFavorites ? 'تم تصفية الأماكن لإظهار المفضلة فقط' : 'تم إظهار جميع الأماكن');
        }}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenFontManager={() => setIsFontManagerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* TAB 1: EXPLORATION (دليل الأماكن) */}
        {activeTab === 'explore' && (
          <div className="space-y-5">
            
            {/* High-Contrast Announcement Banner (Darkened orange background + larger white text for >= 4.5:1 WCAG AA contrast) */}
            <div className="bg-orange-700 rounded-2xl p-4 text-white text-sm sm:text-base font-bold shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-xl bg-white/15">
                  <Gift className="w-5 h-5 text-white shrink-0" />
                </span>
                <span className="leading-relaxed">
                  مرحباً بكم في طشة! تصفح عروض الإنستغرام الحصرية، المواقع المعتمدة، وروابط Google Maps المباشرة.
                </span>
              </div>
              <button
                onClick={() => {
                  setShowOnlyOffers(true);
                  showToast('تم تفعيل جانب العروض الحصرية');
                }}
                className="bg-white text-orange-800 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs sm:text-sm font-black shadow-xs shrink-0 transition-all cursor-pointer"
              >
                عروض حصرية 🎁
              </button>
            </div>

            {/* Unified Search + Single "تصفية" Button (Deference: Only Search + Filter Button & Category Chips remain visible) */}
            <div className="flex items-center gap-2.5">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم، الأكلة (كنافة، شاورما، كافيه)، أو المنطقة، أو يوزر الإنستغرام..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-2xl pr-11 pl-14 py-3 focus:border-orange-600 outline-none transition-all placeholder:text-slate-500 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    إلغاء
                  </button>
                )}
              </div>

              {/* Single Unified "تصفية" Button with Active Count Badge */}
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(true)}
                className={`px-4 py-3 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer shadow-2xs ${
                  activeFiltersCount > 0
                    ? 'bg-orange-600 border-orange-600 text-white'
                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                }`}
                title="تصفية وتخصيص العرض"
              >
                <SlidersHorizontal className={`w-4 h-4 ${activeFiltersCount > 0 ? 'text-white' : 'text-slate-600'}`} />
                <span>تصفية</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-white text-orange-700 text-xs font-black min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Sticky Filter Chips Header with Smooth Touch-Swipe & Automatic Counters */}
            <div className="sticky top-[58px] sm:top-[66px] z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2.5 bg-[#faf8f5]/95 backdrop-blur-md border-b border-slate-200/80">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap flex-nowrap touch-pan-x select-none scroll-smooth">
                {CATEGORY_CHIPS.map((chip) => {
                  const isOffers = chip.id === 'offers';
                  const isActive = isOffers
                    ? showOnlyOffers
                    : chip.id === 'all'
                    ? selectedCategory === 'all' && !showOnlyOffers
                    : selectedCategory === chip.id && !showOnlyOffers;

                  const count = categoryCounts[chip.id] ?? 0;

                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => {
                        if (isOffers) {
                          setShowOnlyOffers(!showOnlyOffers);
                          if (!showOnlyOffers) {
                            setSelectedCategory('all');
                            showToast('تم تفعيل جانب العروض الحصرية 🎁');
                          } else {
                            showToast('تم إظهار جميع الأماكن');
                          }
                        } else {
                          setShowOnlyOffers(false);
                          setSelectedCategory(chip.id);
                          showToast(`تم اختيار تصنيف: ${chip.label}`);
                        }
                      }}
                      className={`px-3.5 py-2 rounded-2xl text-xs transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95 group ${
                        isActive
                          ? 'bg-orange-600 text-white shadow-xs font-black border border-orange-600'
                          : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 font-bold shadow-2xs'
                      }`}
                    >
                      <span className="text-sm leading-none">{chip.icon}</span>
                      <span>{chip.label}</span>
                      <span
                        className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-full transition-colors ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Jordan Map (Rendered when toggled from inside the Filter panel) */}
            {showInteractiveMap && (
              <AmmanDistrictMap
                selectedDistrict={selectedDistrict}
                onSelectDistrict={(dist) => {
                  setSelectedDistrict(dist);
                  showToast(dist === 'الكل' ? 'تم إظهار جميع مناطق ومحافظات الأردن' : `تم تصفية الأماكن حسب: ${dist}`);
                }}
                restaurants={restaurants}
                showToast={showToast}
              />
            )}

            {/* Quiet Active Filter Summary if any filter is applied */}
            {(selectedDistrict !== 'الكل' || activeFiltersCount > 0) && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 px-1">
                <div className="flex items-center gap-2">
                  <span>النتائج المعروضة: <strong className="text-slate-900 font-bold">{filteredRestaurants.length} مكان</strong></span>
                  {selectedDistrict !== 'الكل' && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 text-slate-800 font-bold">
                        <MapPin className="w-3.5 h-3.5 text-orange-600" />
                        {selectedDistrict}
                      </span>
                    </>
                  )}
                </div>
                <button
                  onClick={handleResetAllFilters}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>مسح الفلاتر</span>
                </button>
              </div>
            )}

            {/* Venues Display List / Grid */}
            {filteredRestaurants.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">لم يتم العثور على نتائج تطابق هذا البحث</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  جرب تغيير خيارات التصفية بالمنطقة أو إزالة كلمة البحث لإظهار جميع المطاعم والكافيهات المتاحة.
                </p>
                <button
                  onClick={handleResetAllFilters}
                  className="py-2.5 px-5 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-all shadow-xs cursor-pointer"
                >
                  إعادة ضبط جميع الفلاتر
                </button>
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'grid grid-cols-1 md:grid-cols-2 gap-4'
                }
              >
                {(Array.isArray(filteredRestaurants) ? filteredRestaurants : []).map((res) => (
                  <VenueCard
                    key={res.id}
                    restaurant={res}
                    isFavorite={Array.isArray(favorites) && favorites.includes(res.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenDetails={(venue) => setSelectedVenue(venue)}
                    compactView={viewMode === 'compact'}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: PARTNERS & RESTAURANT OWNERS HUB (بوابة الشركاء والمطاعم) */}
        {(activeTab === 'partners' || activeTab === 'admin-dashboard') && (
          <PartnersHub
            restaurants={restaurants}
            onUpdateRestaurants={handleUpdateRestaurants}
            showToast={showToast}
            onViewVenue={(venue) => setSelectedVenue(venue)}
          />
        )}

        {/* TAB 3: SUPER ADMIN ROOM (لوحة الإدارة العامة المركزية) */}
        {activeTab === 'super-admin' && (
          <SuperAdminPortal
            restaurants={restaurants}
            onUpdateRestaurants={handleUpdateRestaurants}
            showToast={showToast}
            onOpenFontManager={() => setIsFontManagerOpen(true)}
            onViewVenue={(venue) => setSelectedVenue(venue)}
            onNavigateToPartners={() => setActiveTab('partners')}
          />
        )}

        {/* TAB 4: BUDGET CALCULATOR & TRIP TOOLS (حاسبة الميزانية والرحلات) */}
        {(activeTab === 'calculator' || activeTab === 'ai-planner') && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl w-fit mx-auto shadow-xs">
              <button
                onClick={() => setActiveTab('calculator')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'calculator'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                حاسبة الميزانية للمجموعات
              </button>
              <button
                onClick={() => setActiveTab('ai-planner')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ai-planner'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                مخطط الرحلات الذكي
              </button>
            </div>

            {activeTab === 'calculator' ? (
              <BudgetCalculator
                restaurants={restaurants}
                onOpenDetails={(venue) => setSelectedVenue(venue)}
              />
            ) : (
              <AITripPlanner />
            )}
          </div>
        )}

      </main>

      {/* Unified Filter Bottom Sheet (Mobile) / Dropdown Popover (Desktop) */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        restaurants={restaurants}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={setSelectedDistrict}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        maxBudget={maxPriceFilter}
        onSelectMaxBudget={setMaxPriceFilter}
        minRating={minRatingFilter}
        onSelectMinRating={setMinRatingFilter}
        onlyWithMenu={onlyWithMenu}
        onToggleOnlyWithMenu={() => setOnlyWithMenu(!onlyWithMenu)}
        onlyWithOffers={showOnlyOffers}
        onToggleOnlyWithOffers={() => setShowOnlyOffers(!showOnlyOffers)}
        onlyFavorites={showOnlyFavorites}
        onToggleOnlyFavorites={() => setShowOnlyFavorites(!showOnlyFavorites)}
        favoritesCount={favorites.length}
        sortBy={sortBy}
        onSelectSortBy={setSortBy}
        viewMode={viewMode}
        onSelectViewMode={setViewMode}
        showInteractiveMap={showInteractiveMap}
        onToggleInteractiveMap={() => setShowInteractiveMap(!showInteractiveMap)}
        totalResultsCount={filteredRestaurants.length}
        onResetAll={handleResetAllFilters}
        showToast={showToast}
      />

      {/* Venue Detailed View Modal Overlay */}
      <VenueModal
        restaurant={selectedVenue}
        onClose={() => setSelectedVenue(null)}
        isFavorite={selectedVenue ? favorites.includes(selectedVenue.id) : false}
        onToggleFavorite={handleToggleFavorite}
        showToast={showToast}
      />

      {/* Notification Center Modal / Slide-over */}
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={handleNavigateFromNotification}
        showToast={showToast}
      />

      {/* Admin Typography & Fonts Manager Modal */}
      <AdminFontManager
        isOpen={isFontManagerOpen}
        onClose={() => setIsFontManagerOpen(false)}
        showToast={showToast}
      />

      {/* Sticky Bottom Navigation for Mobile */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
