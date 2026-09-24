import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { HeroCarousel } from './components/HeroCarousel';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { QuickViewModal } from './components/QuickViewModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { UserAccountModal } from './components/UserAccountModal';
import { ToastNotification } from './components/ToastNotification';
import { Footer } from './components/Footer';
import { formatWhatsAppLink } from './utils/phone';
import {
  Sparkles,
  SlidersHorizontal,
  Phone,
  MessageCircle,
  Package,
  Tag,
  ChevronDown,
  ShoppingCart,
  Share2,
} from 'lucide-react';

const StoreContent: React.FC = () => {
  const {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    currentView,
    quickViewProduct,
    setQuickViewProduct,
    recentSuccessOrder,
    setRecentSuccessOrder,
    settings,
    currentUser,
    isAdminLoggedIn,
    cartCount,
    cartSubtotal,
    setIsCartOpen,
    isUserAccountModalOpen,
    setIsUserAccountModalOpen,
    copyCategoryLink,
  } = useStore();

  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');

  if (currentView === 'admin') {
    return (
      <>
        <AdminPanel />
        <UserAccountModal
          isOpen={isUserAccountModalOpen}
          onClose={() => setIsUserAccountModalOpen(false)}
        />
        <AuthModal />
        <ToastNotification />
      </>
    );
  }

  // Filter products by selected category and search query
  let filteredProducts = products.filter((prod) => {
    const matchesCategory = selectedCategory ? prod.categoryId === selectedCategory : true;
    const matchesSearch = searchQuery.trim()
      ? prod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  // Sort products
  filteredProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);
  const supportWhatsAppNumber = settings.footer?.supportWhatsApp || settings.phone || '+8801518739561';
  const floatingWhatsAppHref = formatWhatsAppLink(
    supportWhatsAppNumber,
    'Hello Rongdhonu Trade! I have an inquiry regarding your products.'
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      <div>
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top Hero Banner Carousel (shown when no specific search is active) */}
          {!searchQuery && <HeroCarousel />}

          {/* Product Feed Section */}
          <section id="products-feed-section" className="pt-6 pb-12">
            {/* Toolbar: Category Title, Result Count, Category Dropdown, Sort Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 mb-6">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                    {searchQuery
                      ? `Search: "${searchQuery}"`
                      : activeCategoryObj
                      ? activeCategoryObj.name
                      : 'Featured Products'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700 font-mono">
                    {filteredProducts.length}
                  </span>
                  {activeCategoryObj && (
                    <button
                      type="button"
                      onClick={() => copyCategoryLink(activeCategoryObj.id)}
                      className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Copy direct category URL for social posting"
                    >
                      <Share2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Share Category URL</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Prices displayed in Bangladeshi Taka (৳ BDT) with cash on delivery available nationwide.
                </p>
              </div>

              {/* Filter Controls: Category Dropdown + Sort Selector */}
              <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
                {/* Category Dropdown */}
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                  <label htmlFor="feed-category-select" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                    Category:
                  </label>
                  <select
                    id="feed-category-select"
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value ? e.target.value : null)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs cursor-pointer hover:border-slate-400 transition-colors"
                  >
                    <option value="">All Products ({products.length})</option>
                    {categories.map((cat) => {
                      const count = products.filter((p) => p.categoryId === cat.id).length;
                      return (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Sort Selector */}
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
                  <label htmlFor="sort-select" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                    Sort By:
                  </label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs cursor-pointer"
                  >
                    <option value="featured">Featured First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Top Customer Rated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-slate-200">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">No Products Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  We couldn't find any products matching your query. Try searching with different keywords or reset category filters.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md hover:shadow-lg active:scale-95 transition-all"
                >
                  View All Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Floating Mobile Cart Option (accessible while browsing on mobile) */}
      {cartCount > 0 && (
        <button
          id="floating-mobile-cart-btn"
          onClick={() => setIsCartOpen(true)}
          className="sm:hidden fixed bottom-20 right-5 z-30 px-3.5 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white shadow-2xl active:scale-95 transition-all flex items-center gap-2 border border-slate-700/80 font-bold text-xs animate-in slide-in-from-bottom-3 duration-200"
          aria-label={`Cart ৳ ${cartSubtotal.toLocaleString()}`}
        >
          <div className="relative" aria-hidden="true">
            <ShoppingCart className="w-4 h-4 text-rose-400" />
            <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white font-mono text-[9px] font-extrabold flex items-center justify-center shadow-xs">
              {cartCount}
            </span>
          </div>
          <span className="font-mono">Cart ৳ {cartSubtotal.toLocaleString()}</span>
        </button>
      )}

      {/* Floating WhatsApp Action Button */}
      <a
        id="floating-whatsapp-btn"
        href={floatingWhatsAppHref}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-5 sm:right-6 z-30 p-3.5 rounded-full bg-emerald-500 text-white shadow-xl hover:bg-emerald-600 active:scale-95 transition-all duration-200 flex items-center justify-center group hover:pr-5 gap-2"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" aria-hidden="true" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold">
          Chat on WhatsApp
        </span>
      </a>

      {/* Footer */}
      <Footer />

      {/* Interactive Global Modals & Drawers */}
      <CartDrawer />
      <WishlistDrawer />
      <UserAccountModal
        isOpen={isUserAccountModalOpen}
        onClose={() => setIsUserAccountModalOpen(false)}
      />
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
      <OrderSuccessModal
        order={recentSuccessOrder}
        onClose={() => setRecentSuccessOrder(null)}
      />
      <AuthModal />
      <ToastNotification />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <StoreContent />
    </StoreProvider>
  );
}
