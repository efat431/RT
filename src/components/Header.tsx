import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  LayoutDashboard,
  Check,
  LayoutGrid,
  Tag,
  Package,
  ShoppingBag,
  User,
  Truck,
  ShieldCheck,
  Phone,
  ChevronDown,
  LogOut,
  ArrowRight,
  Heart,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { isMasterAdminEmail } from '../types';
import { BrandLogo } from './BrandLogo';
import { OrderTrackingModal } from './OrderTrackingModal';
import { formatWhatsAppLink } from '../utils/phone';

export const Header: React.FC = () => {
  const {
    settings,
    categories,
    products,
    cartCount,
    cartSubtotal,
    isCartOpen,
    setIsCartOpen,
    wishlist,
    setIsWishlistOpen,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    currentView,
    setCurrentView,
    isAdminLoggedIn,
    currentUser,
    logout,
    setIsAuthModalOpen,
    setAuthModalMode,
    isUserAccountModalOpen,
    setIsUserAccountModalOpen,
    setUserAccountModalTab,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const supportWhatsApp = settings.footer?.supportWhatsApp || settings.phone || '+8801518739561';

  const isPrivilegedAdmin =
    isAdminLoggedIn ||
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'sub_admin' ||
    isMasterAdminEmail(currentUser?.email);

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setMobileMenuOpen(false);
    setCurrentView('store');
    const el = document.getElementById('products-feed-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Main Header / Menu Bar */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 md:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Left Side: Brand Logo & Brand Name */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div
            onClick={() => {
              setCurrentView('store');
              setSelectedCategory(null);
              setSearchQuery('');
            }}
            className="cursor-pointer shrink-0 flex items-center"
            title="Rongdhonu Trade - Storefront"
          >
            {/* On mobile: compact BrandLogo with responsive text, on desktop: medium size */}
            <BrandLogo
              size="sm"
              className="md:hidden"
              textClassName="text-xs font-display font-extrabold tracking-tight text-slate-900 whitespace-nowrap"
            />
            <BrandLogo size="md" className="hidden md:flex" />
          </div>
        </div>

        {/* Search Bar - Next to Logo & Brand Name on Mobile, in center on Desktop */}
        <div className="flex-1 min-w-0 max-w-full md:max-w-md lg:max-w-xl mx-1 sm:mx-3 relative">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="header-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (currentView !== 'store') {
                  setCurrentView('store');
                }
              }}
              placeholder="Search products..."
              className="w-full pl-7 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200/90 focus:border-rose-500 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side Actions: Admin Dashboard button + User Account / Login + Cart Option + Mobile Menu Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Direct Admin Dashboard Shortcut Button on Desktop/Tab if user is admin */}
          {isPrivilegedAdmin && (
            <button
              id="header-admin-dashboard-btn"
              onClick={() => setCurrentView('admin')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 ${
                currentView === 'admin'
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/80'
              }`}
              title="Open Admin Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-purple-600" />
              <span>Admin Dashboard</span>
            </button>
          )}

          {/* Desktop User Account / Login & Sign-up button with Dropdown Menu */}
          <div className="hidden md:flex items-center relative" ref={profileDropdownRef}>
            {currentUser ? (
              <>
                <button
                  id="header-user-btn"
                  type="button"
                  onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                  aria-expanded={isProfileDropdownOpen}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 shadow-2xs cursor-pointer select-none"
                  title={`Logged in as ${currentUser.name} (${currentUser.role})`}
                >
                  <div className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[85px] truncate">{currentUser.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                      currentUser.role === 'super_admin' || currentUser.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : currentUser.role === 'sub_admin'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {currentUser.role === 'super_admin'
                      ? 'Super Admin'
                      : currentUser.role === 'admin'
                      ? 'Admin'
                      : currentUser.role === 'sub_admin'
                      ? 'Sub Admin'
                      : 'User'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                      isProfileDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Desktop Profile Dropdown Menu - Left Positioned */}
                {isProfileDropdownOpen && (
                  <div
                    id="header-profile-dropdown-menu"
                    className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 z-50 origin-top-left transition-all duration-200 ease-out transform animate-scaleUp overflow-hidden"
                  >
                    {/* User Info Header */}
                    <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                          {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {currentUser.name}
                            </h4>
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 ${
                                currentUser.role === 'super_admin'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : currentUser.role === 'admin'
                                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                  : currentUser.role === 'sub_admin'
                                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {currentUser.role === 'super_admin'
                                ? 'Super Admin'
                                : currentUser.role === 'admin'
                                ? 'Admin'
                                : currentUser.role === 'sub_admin'
                                ? 'Sub-Admin'
                                : 'Customer'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {currentUser.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Items */}
                    <div className="p-1.5 space-y-0.5">
                      {/* My Orders */}
                      <button
                        type="button"
                        id="profile-dropdown-orders-btn"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          setUserAccountModalTab('orders');
                          setIsUserAccountModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors text-left cursor-pointer group"
                      >
                        <ShoppingBag className="w-4 h-4 text-slate-500 group-hover:text-slate-900 transition-colors" />
                        <span className="flex-1">My Orders</span>
                      </button>

                      {/* Edit Profile Info */}
                      <button
                        type="button"
                        id="profile-dropdown-account-btn"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          setUserAccountModalTab('profile');
                          setIsUserAccountModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors text-left cursor-pointer group"
                      >
                        <User className="w-4 h-4 text-slate-500 group-hover:text-slate-900 transition-colors" />
                        <span className="flex-1">Edit Profile Info</span>
                      </button>

                      {/* Admin Panel (Conditional: Only for Super Admin, Admin, Sub-Admin) */}
                      {isPrivilegedAdmin && (
                        <button
                          type="button"
                          id="profile-dropdown-admin-dashboard-btn"
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            setCurrentView('admin');
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs transition-colors text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <LayoutDashboard className="w-4 h-4 text-purple-700 group-hover:scale-110 transition-transform" />
                            <span>Admin Panel</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-100 my-1" />

                    {/* Log Out */}
                    <div className="p-1.5">
                      <button
                        type="button"
                        id="profile-dropdown-logout-btn"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer group"
                      >
                        <LogOut className="w-4 h-4 text-rose-600 group-hover:translate-x-0.5 transition-transform" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button
                id="header-auth-trigger-btn"
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200/70"
                title="Login or Sign Up"
              >
                <User className="w-3.5 h-3.5 text-rose-600" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            id="header-wishlist-btn"
            onClick={() => setIsWishlistOpen(true)}
            className="relative p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5 border border-slate-200/80"
            aria-label="Wishlist"
            title="Saved Items"
          >
            <Heart className={`w-4 h-4 ${wishlist.length > 0 ? 'text-rose-500 fill-rose-500' : 'text-slate-600'}`} aria-hidden="true" />
            <span className="hidden sm:inline">Wishlist</span>
            {wishlist.length > 0 && (
              <span aria-hidden="true" className="min-w-4 h-4 sm:min-w-4.5 sm:h-4.5 px-1 rounded-full bg-rose-500 text-white font-mono text-[9px] font-extrabold flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Cart Option (Positioned on the right side on both Mobile & Desktop) */}
          <button
            id="header-cart-btn"
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md hover:shadow-lg active:scale-95 transition-all shrink-0"
            aria-label={`Cart ৳ ${cartSubtotal.toLocaleString()}`}
            title="Shopping Cart"
          >
            <ShoppingCart className="w-4 h-4 text-rose-400" aria-hidden="true" />
            <span className="hidden sm:inline">
              Cart ৳ {cartSubtotal.toLocaleString()}
            </span>
            {cartCount > 0 && (
              <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 min-w-4 h-4 sm:min-w-5 sm:h-5 px-1 rounded-full bg-rose-600 text-white font-mono text-[9px] sm:text-[10px] font-extrabold flex items-center justify-center shadow-md border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Dropdown Menu Toggle Button */}
          <button
            id="header-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0 flex items-center justify-center border border-slate-200/80"
            aria-label="Toggle Mobile Options Dropdown"
            title="Menu Options"
          >
            {mobileMenuOpen ? <X className="w-4 h-4 text-slate-900" /> : <Menu className="w-4 h-4 text-slate-800" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu - Houses the Other Options */}
      {mobileMenuOpen && (
        <div
          id="mobile-options-dropdown"
          className="md:hidden border-t border-slate-200 bg-white p-4 space-y-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* 1. User Authentication & Profile Section */}
          <div className="pb-3 border-b border-slate-100">
            {currentUser ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsUserAccountModalOpen(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-between border border-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="font-bold">{currentUser.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{currentUser.email}</div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">My Account</span>
                </button>

                {/* Direct link to Admin Panel if authorized */}
                {(currentUser.role === 'super_admin' ||
                  currentUser.role === 'admin' ||
                  currentUser.role === 'sub_admin' ||
                  isAdminLoggedIn) && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setCurrentView('admin');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center gap-2 border border-purple-200"
                  >
                    <LayoutDashboard className="w-4 h-4 text-purple-600" />
                    <span>Open Admin Panel</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 border border-rose-200 shadow-2xs"
              >
                <User className="w-4 h-4 text-rose-600" />
                <span>Sign In or Register</span>
              </button>
            )}
          </div>

          {/* 2. Product Categories Option */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                Product Categories
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {products.length} Items
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto pr-1">
              <button
                onClick={() => {
                  handleCategorySelect(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                  selectedCategory === null && currentView === 'store'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100 bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-rose-500" />
                  <span>All Products</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] opacity-75 font-mono">{products.length}</span>
                  {selectedCategory === null && currentView === 'store' && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>

              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;
                const isSelected = selectedCategory === cat.id && currentView === 'store';
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      handleCategorySelect(cat.id);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Tag className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-rose-400' : 'text-slate-400'}`} />
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[10px] opacity-75 font-mono">{count}</span>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Auxiliary Options: Wishlist, Order Tracking & WhatsApp Help */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsWishlistOpen(true);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-between transition-colors border border-rose-200/80"
            >
              <div className="flex items-center gap-2">
                <Heart className={`w-4 h-4 ${wishlist.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-rose-600'}`} />
                <span>Saved Wishlist</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 font-mono text-[10px]">
                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
              </span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsTrackingModalOpen(true);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200/80"
            >
              <Truck className="w-4 h-4 text-rose-600" />
              <span>Track Order & Edit Delivery Info</span>
            </button>

            <a
              href={formatWhatsAppLink(supportWhatsApp, 'Hello Rongdhonu Trade! I need assistance with an order or inquiry.')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <Phone className="w-4 h-4" />
              <span>WhatsApp Support: {supportWhatsApp}</span>
            </a>
          </div>
        </div>
      )}

      {/* Order Tracking & Post-Order Management Modal */}
      <OrderTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
      />
    </header>
  );
};
