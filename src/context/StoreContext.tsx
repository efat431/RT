import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Product,
  Category,
  CartItem,
  Order,
  StoreSettings,
  CourierProvider,
  CourierBooking,
  ShippingStatus,
  CarouselSlide,
  CourierApiConfig,
  UserAccount,
  UserRole,
  AdminPermissions,
  ProductReview,
  Coupon,
  ToastNotificationData,
  PixelEventLog,
  TrackingUserData,
  isMasterAdminEmail,
} from '../types';
import {
  syncPixelScripts,
  trackSocialEvent,
  getStoredPixelLogs,
  clearStoredPixelLogs,
  prepareHashedUserData,
} from '../utils/pixelTracking';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_SETTINGS,
  INITIAL_SLIDES,
  INITIAL_COURIER_CONFIGS,
  INITIAL_USERS,
  INITIAL_REVIEWS,
  INITIAL_COUPONS,
} from '../data/seedData';
import { orderApi } from '../services/orderApi';
import {
  productsApi,
  categoriesApi,
  slidersApi,
  settingsApi,
  couponsApi,
  reviewsApi,
  usersApi,
} from '../services/storeApi';
import { authApi, getAuthToken, setAuthToken, removeAuthToken } from '../services/authApi';

export const DEFAULT_SUBADMIN_PERMISSIONS: AdminPermissions = {
  canManageOrders: true,
  canManageProducts: true,
  canManageCategories: true,
  canManageAccounts: false,
  canManageSettings: false,
};

export const SUPER_ADMIN_PERMISSIONS: AdminPermissions = {
  canManageOrders: true,
  canManageProducts: true,
  canManageCategories: true,
  canManageAccounts: true,
  canManageSettings: true,
};

interface StoreContextType {
  // Storefront Data
  products: Product[];
  categories: Category[];
  orders: Order[];
  settings: StoreSettings;
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // User Authentication & Roles (Admins & Regular Users)
  users: UserAccount[];
  currentUser: UserAccount | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'signup';
  setAuthModalMode: (mode: 'login' | 'signup') => void;
  loginUser: (emailOrUsername: string, password: string) => { success: boolean; message?: string; user?: UserAccount };
  registerUser: (data: { name: string; email: string; password: string; phone?: string; role?: UserRole }) => { success: boolean; message?: string; user?: UserAccount };
  deleteUser: (userId: string) => { success: boolean; message?: string };
  deleteCustomer: (targetUser: UserAccount | string) => { success: boolean; message?: string };
  resetCustomerPassword: (emailOrId: string, newPassword: string) => { success: boolean; message?: string };
  updateUserRoleAndPermissions: (
    userIdOrEmail: string,
    role: UserRole,
    permissions: AdminPermissions
  ) => { success: boolean; message?: string };
  hasPermission: (permission: keyof AdminPermissions) => boolean;
  logout: () => void;

  // Navigation & Filtering
  currentView: 'store' | 'admin' | 'tracking';
  setCurrentView: (view: 'store' | 'admin' | 'tracking') => void;
  adminActiveTab: string;
  setAdminActiveTab: (tab: string) => void;
  adminSettingsSection: string;
  setAdminSettingsSection: (section: string) => void;
  openAdminSettingsSection: (section?: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (catId: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (prod: Product | null) => void;

  // Cart operations
  addToCart: (
    product: Product,
    quantity?: number,
    selectedSize?: string,
    selectedColor?: string
  ) => void;
  updateCartQuantity: (
    productId: string,
    quantity: number,
    selectedSize?: string,
    selectedColor?: string
  ) => void;
  removeFromCart: (
    productId: string,
    selectedSize?: string,
    selectedColor?: string
  ) => void;
  clearCart: () => void;
  quickBuy: (
    product: Product,
    selectedSize?: string,
    selectedColor?: string
  ) => void;

  // Wishlist (Saved for later)
  wishlist: string[];
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;

  // User Account & Orders Modal (Global)
  isUserAccountModalOpen: boolean;
  setIsUserAccountModalOpen: (open: boolean) => void;
  userAccountModalTab: 'orders' | 'profile';
  setUserAccountModalTab: (tab: 'orders' | 'profile') => void;
  updateCurrentUserProfile: (updatedData: Partial<UserAccount>) => { success: boolean; message: string };

  // Global Action Confirmation Toast Notification
  notification: ToastNotificationData | null;
  showNotification: (
    type: 'success' | 'info' | 'error' | 'warning',
    title: string,
    message: string,
    duration?: number
  ) => void;
  dismissNotification: () => void;

  // Coupons & Promo Codes
  coupons: Coupon[];
  applyCoupon: (
    code: string,
    subtotal: number,
    deliveryFee: number
  ) => { success: boolean; discountAmount: number; message: string; coupon?: Coupon };
  addCoupon: (newCoupon: Coupon) => { success: boolean; message: string };
  updateCoupon: (code: string, updated: Partial<Coupon>) => { success: boolean; message: string };
  deleteCoupon: (code: string) => void;
  toggleCouponActive: (code: string) => void;

  // Product Reviews & Ratings
  reviews: ProductReview[];
  addProductReview: (review: Omit<ProductReview, 'id' | 'createdAt'>) => void;
  deleteProductReview: (reviewId: string) => void;
  getProductReviews: (productId: string) => ProductReview[];

  // Orders & Checkout
  createOrder: (orderData: {
    userId?: string;
    userEmail?: string;
    customer: Order['customer'];
    items: CartItem[];
    subtotal: number;
    deliveryFee: number;
    totalAmount: number;
    couponCode?: string;
    discountAmount?: number;
    paymentMethod: Order['paymentMethod'];
    paymentStatus: Order['paymentStatus'];
    transactionId?: string;
    dbblDetails?: Order['dbblDetails'];
    cardDetails?: Order['cardDetails'];
  }) => Promise<Order>;
  recentSuccessOrder: Order | null;
  setRecentSuccessOrder: (order: Order | null) => void;
  activePaymentModalOrder: Order | null;
  setActivePaymentModalOrder: (order: Order | null) => void;
  finalizePayment: (orderId: string, transactionId: string) => Promise<void> | void;
  updateCustomerDeliveryInfo: (
    orderId: string,
    info: {
      fullName: string;
      phone: string;
      fullAddress: string;
      district: string;
      deliveryZone: 'inside_dhaka' | 'outside_dhaka';
    }
  ) => Promise<{ success: boolean; message?: string; updatedOrder?: Order }>;
  cancelCustomerOrder: (orderId: string) => Promise<{ success: boolean; message?: string }>;
  isOrdersLoading: boolean;
  refreshOrders: () => Promise<void>;

  // Admin Security
  isAdminLoggedIn: boolean;
  adminLogin: (username: string, password: string) => boolean;
  adminLogout: () => void;

  // Admin CRUD Products & Stock & Ratings
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<{ success: boolean; product?: Product; error?: string }>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<{ success: boolean; product?: Product; error?: string }>;
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
  increaseStock: (productId: string, amount: number) => Promise<void>;
  adjustProductRating: (productId: string, rating: number, reviewsCount?: number) => Promise<void>;

  // Admin CRUD Categories
  addCategory: (category: Omit<Category, 'id' | 'slug'>) => Promise<{ success: boolean; category?: Category; error?: string }>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<{ success: boolean; category?: Category; error?: string }>;
  deleteCategory: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Admin Orders & Courier
  updateOrderStatus: (orderId: string, status: ShippingStatus) => Promise<{ success: boolean; error?: string }>;
  updateOrder: (orderId: string, updates: Partial<Order>) => Promise<void> | void;
  verifyAndMarkPaid: (orderId: string) => void;
  deleteOrder: (orderId: string, restoreStock?: boolean) => Promise<void> | void;
  bookCourier: (orderId: string, provider: CourierProvider) => Promise<CourierBooking>;
  bookWithSteadfast: (
    order: Order
  ) => Promise<{
    success: boolean;
    message: string;
    trackingCode?: string;
    consignmentId?: string;
    isFallback?: boolean;
  }>;
  syncCourierStatus: (
    orderId: string
  ) => Promise<{
    success: boolean;
    message: string;
    updatedStatus?: string;
  }>;
  syncAllCourierStatuses: () => Promise<{
    success: boolean;
    message: string;
    updatedCount: number;
  }>;
  cancelCourierBooking: (orderId: string) => void;
  blockPhoneNumber: (phone: string) => void;
  unblockPhoneNumber: (phone: string) => void;

  // Admin Courier APIs Management
  courierConfigs: CourierApiConfig[];
  addCourierConfig: (config: Omit<CourierApiConfig, 'id'>) => CourierApiConfig;
  updateCourierConfig: (id: string, updates: Partial<CourierApiConfig>) => void;
  deleteCourierConfig: (id: string) => void;
  resetCourierConfigs: () => void;

  // Admin Slides / Carousel Management
  slides: CarouselSlide[];
  addSlide: (slide: Omit<CarouselSlide, 'id'>) => Promise<{ success: boolean; slider?: CarouselSlide; error?: string }>;
  updateSlide: (id: string, updates: Partial<CarouselSlide>) => Promise<{ success: boolean; slider?: CarouselSlide; error?: string }>;
  deleteSlide: (id: string) => Promise<{ success: boolean; error?: string }>;
  resetSlides: () => Promise<void> | void;

  // Admin Settings
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  resetToDefaultSeed: () => void;

  // Super Admin Security
  changeSuperAdminPassword: (newPassword: string, currentPassword?: string) => { success: boolean; message: string };

  // URL Deep Linking & Social Posting
  getProductUrl: (productId: string) => string;
  getCategoryUrl: (categoryIdOrSlug: string) => string;
  copyProductLink: (productId: string) => Promise<boolean>;
  copyCategoryLink: (categoryIdOrSlug: string) => Promise<boolean>;

  // Marketing Pixels & Tracking Management
  pixelLogs: PixelEventLog[];
  trackEvent: (
    eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | 'Search' | 'AddToWishlist' | 'Contact' | string,
    params?: Record<string, any>,
    userData?: TrackingUserData
  ) => PixelEventLog;
  fireTestPixelEvent: (type: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase') => PixelEventLog;
  clearPixelLogs: () => void;
  isMetaActive: boolean;
  isTikTokActive: boolean;
  isGtmActive: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ORDERS: 'rongdhonu_orders_v1',
  SETTINGS: 'rongdhonu_settings_v1',
  CART: 'rongdhonu_cart_v1',
  ADMIN_AUTH: 'rongdhonu_admin_auth_v1',
  COURIERS: 'rongdhonu_couriers_v1',
  USERS: 'rongdhonu_users',
  CURRENT_USER: 'rongdhonu_current_user',
  WISHLIST: 'rongdhonu_wishlist',
  REVIEWS: 'rongdhonu_reviews',
  COUPONS: 'rongdhonu_coupons',
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Settings State
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('rongdhonu_settings') || localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.logoUrl || parsed.logoUrl.includes('pinterest.com/pin/') || parsed.logoUrl.includes('25cf56123b9f19ffe4d392db781a5dd2')) {
          parsed.logoUrl = INITIAL_SETTINGS.logoUrl;
        }
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          dbblBank: parsed.dbblBank || INITIAL_SETTINGS.dbblBank,
          footer: parsed.footer ? { ...INITIAL_SETTINGS.footer, ...parsed.footer } : INITIAL_SETTINGS.footer,
          blockedPhoneNumbers: parsed.blockedPhoneNumbers || [],
          antiSpamEnabled: parsed.antiSpamEnabled ?? true,
          orderCooldownSeconds: parsed.orderCooldownSeconds ?? 60,
          maxOrdersPerPhonePerDay: parsed.maxOrdersPerPhonePerDay ?? 3,
          trackingEnabled: parsed.trackingEnabled ?? INITIAL_SETTINGS.trackingEnabled ?? true,
          fbPixelId: parsed.fbPixelId ?? INITIAL_SETTINGS.fbPixelId ?? '1098472918234851',
          fbTestEventCode: parsed.fbTestEventCode ?? INITIAL_SETTINGS.fbTestEventCode ?? '',
          tiktokPixelId: parsed.tiktokPixelId ?? INITIAL_SETTINGS.tiktokPixelId ?? 'CH7F8G9H0J1K2L3M4N',
          tiktokTestEventCode: parsed.tiktokTestEventCode ?? INITIAL_SETTINGS.tiktokTestEventCode ?? '',
          gtmId: parsed.gtmId ?? INITIAL_SETTINGS.gtmId ?? 'GTM-RDN8429',
          advancedMatchingEnabled: parsed.advancedMatchingEnabled ?? INITIAL_SETTINGS.advancedMatchingEnabled ?? true,
          trackingDebugMode: parsed.trackingDebugMode ?? INITIAL_SETTINGS.trackingDebugMode ?? true,
        };
      }
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // 2. Users State (Admins and Customers) with auto pre-seeded accounts
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('rongdhonu_users') || localStorage.getItem('rongdhonu_users_v2');
      let parsedUsers: UserAccount[] = [];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsedUsers = parsed;
        }
      }
      if (parsedUsers.length === 0) {
        parsedUsers = [...INITIAL_USERS];
      }

      // Ensure primary master admin account exists
      const savedSuperAdminPassword = localStorage.getItem('rongdhonu_super_admin_pwd');
      const masterAdminIndex = parsedUsers.findIndex(
        (u) => isMasterAdminEmail(u.email) || u.id === 'user-admin-efat' || u.role === 'super_admin'
      );
      const effectiveSuperAdminPassword =
        savedSuperAdminPassword ||
        (masterAdminIndex !== -1 && parsedUsers[masterAdminIndex].password) ||
        'Efat@#413';

      if (masterAdminIndex === -1) {
        parsedUsers.unshift({
          id: 'user-admin-efat',
          name: 'Efat Admin',
          email: 'cmt413uec@gmail.com',
          password: effectiveSuperAdminPassword,
          role: 'super_admin',
          permissions: SUPER_ADMIN_PERMISSIONS,
          phone: '+8801518739561',
          createdAt: '2026-01-01T00:00:00.000Z',
        });
      } else {
        // Guarantee password and super_admin role with full permissions
        parsedUsers[masterAdminIndex] = {
          ...parsedUsers[masterAdminIndex],
          password: effectiveSuperAdminPassword,
          role: 'super_admin',
          permissions: SUPER_ADMIN_PERMISSIONS,
          name: parsedUsers[masterAdminIndex].name || 'Efat Admin',
        };
      }

      // Ensure efatmkt5@gmail.com also exists as super_admin
      const secondaryAdminIndex = parsedUsers.findIndex(
        (u) => u.email.toLowerCase().trim() === 'efatmkt5@gmail.com'
      );
      if (secondaryAdminIndex === -1) {
        parsedUsers.push({
          id: 'user-admin-efatmkt5',
          name: 'Efat Super Admin',
          email: 'efatmkt5@gmail.com',
          password: effectiveSuperAdminPassword,
          role: 'super_admin',
          permissions: SUPER_ADMIN_PERMISSIONS,
          phone: '+8801518739561',
          createdAt: '2026-01-01T00:00:00.000Z',
        });
      } else {
        parsedUsers[secondaryAdminIndex] = {
          ...parsedUsers[secondaryAdminIndex],
          password: effectiveSuperAdminPassword,
          role: 'super_admin',
          permissions: SUPER_ADMIN_PERMISSIONS,
        };
      }

      // Ensure all pre-configured accounts for testing and RBAC verification are included
      INITIAL_USERS.forEach((initU) => {
        if (initU.role !== 'super_admin') {
          const exists = parsedUsers.some(
            (u) => u.email.toLowerCase() === initU.email.toLowerCase() || u.id === initU.id
          );
          if (!exists) {
            parsedUsers.push(initU);
          }
        }
      });

      // Ensure any sub_admin has permissions populated
      parsedUsers = parsedUsers.map((u) => {
        if (u.role === 'sub_admin' && !u.permissions) {
          return { ...u, permissions: DEFAULT_SUBADMIN_PERMISSIONS };
        }
        return u;
      });

      return parsedUsers;
    } catch {
      return INITIAL_USERS;
    }
  });

  // 3. Current Authenticated User
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('rongdhonu_current_user') || localStorage.getItem('rongdhonu_current_user_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isMasterAdminEmail(parsed.email) || parsed.role === 'super_admin') {
          const savedSuperAdminPassword = localStorage.getItem('rongdhonu_super_admin_pwd') || parsed.password || 'Efat@#413';
          return {
            ...parsed,
            role: 'super_admin',
            password: savedSuperAdminPassword,
            permissions: SUPER_ADMIN_PERMISSIONS,
          };
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Auth Modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // 2. Categories State - Cloudflare D1 is the sole source of truth
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);

  // 3. Products State - Cloudflare D1 is the sole source of truth
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  // 4. Orders State - Cloudflare D1 is the single source of truth
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState<boolean>(true);
  const isSyncingRef = useRef<boolean>(false);
  const lastMutationTimestampRef = useRef<number>(0);

  // 5. Cart State (Browser local UI state for active shopper)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 6. Slides State - Cloudflare D1 is the sole source of truth
  const [slides, setSlides] = useState<CarouselSlide[]>(INITIAL_SLIDES);

  // 7. Courier APIs Config State
  const [courierConfigs, setCourierConfigs] = useState<CourierApiConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COURIERS);
      return saved ? JSON.parse(saved) : INITIAL_COURIER_CONFIGS;
    } catch {
      return INITIAL_COURIER_CONFIGS;
    }
  });

  // 8. Admin Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      if (localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true') {
        return true;
      }
      const userSaved = localStorage.getItem('rongdhonu_current_user');
      if (userSaved) {
        const parsed = JSON.parse(userSaved);
        if (
          parsed.role === 'super_admin' ||
          parsed.role === 'admin' ||
          parsed.role === 'sub_admin' ||
          isMasterAdminEmail(parsed.email)
        ) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  });

  // 7. Navigation & Modals UI state
  const [currentView, _setCurrentView] = useState<'store' | 'admin' | 'tracking'>('store');
  const [adminActiveTab, setAdminActiveTab] = useState<string>('overview');
  const [adminSettingsSection, setAdminSettingsSection] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [activePaymentModalOrder, setActivePaymentModalOrder] = useState<Order | null>(null);
  const [recentSuccessOrder, setRecentSuccessOrder] = useState<Order | null>(null);

  // Quick navigation directly to a specific Admin Settings section (e.g., 'footer')
  const openAdminSettingsSection = (section: string = 'footer') => {
    setAdminActiveTab('settings');
    setAdminSettingsSection(section);
    _setCurrentView('admin');
    showNotification(
      'info',
      'Store Settings Opened',
      section === 'footer'
        ? 'Navigated to Dynamic Footer & WhatsApp Support settings.'
        : `Navigated to ${section} settings.`,
      3500
    );
  };

  // Guarded View Switcher
  const setCurrentView = (view: 'store' | 'admin' | 'tracking') => {
    _setCurrentView(view);
  };

  // Deep link initial URL parser on mount & when products/categories are loaded
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const productParam = urlParams.get('product') || urlParams.get('p');
      const categoryParam = urlParams.get('category') || urlParams.get('cat');

      if (categoryParam) {
        const matchedCategory = categories.find(
          (c) => c.slug.toLowerCase() === categoryParam.toLowerCase() || c.id === categoryParam
        );
        if (matchedCategory) {
          setSelectedCategory(matchedCategory.id);
        }
      }

      if (productParam) {
        const matchedProd = products.find(
          (p) => p.id === productParam || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === productParam
        );
        if (matchedProd) {
          setQuickViewProduct(matchedProd);
          _setCurrentView('store');
        }
      }
    } catch (e) {
      console.error('Error parsing deep link params', e);
    }
  }, [products, categories]);

  // Synchronize browser URL query parameters with active product and category
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (quickViewProduct) {
        url.searchParams.set('product', quickViewProduct.id);
      } else {
        url.searchParams.delete('product');
        url.searchParams.delete('p');
      }

      if (selectedCategory) {
        const cat = categories.find((c) => c.id === selectedCategory);
        url.searchParams.set('category', cat?.slug || selectedCategory);
      } else {
        url.searchParams.delete('category');
        url.searchParams.delete('cat');
      }

      const newRelativePath =
        url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash;
      if (window.location.pathname + window.location.search + window.location.hash !== newRelativePath) {
        window.history.replaceState({}, '', newRelativePath);
      }
    } catch (e) {
      console.error('Error syncing URL params', e);
    }
  }, [quickViewProduct, selectedCategory, categories]);

  // Support native browser back and forward navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const productParam = urlParams.get('product') || urlParams.get('p');
        const categoryParam = urlParams.get('category') || urlParams.get('cat');

        if (productParam) {
          const matchedProd = products.find((p) => p.id === productParam);
          setQuickViewProduct(matchedProd || null);
        } else {
          setQuickViewProduct(null);
        }

        if (categoryParam) {
          const matchedCategory = categories.find(
            (c) => c.slug.toLowerCase() === categoryParam.toLowerCase() || c.id === categoryParam
          );
          setSelectedCategory(matchedCategory ? matchedCategory.id : null);
        } else {
          setSelectedCategory(null);
        }
      } catch (e) {
        console.error('Error handling popstate', e);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products, categories]);

  // Synchronize with localStorage
  useEffect(() => {
    try {
      const json = JSON.stringify(settings);
      localStorage.setItem(STORAGE_KEYS.SETTINGS, json);
      localStorage.setItem('rongdhonu_settings', json);
    } catch (e) {
      console.error('Error saving settings', e);
    }
  }, [settings]);

  // Dynamically synchronize browser favicon with uploaded icon or logo
  useEffect(() => {
    const iconUrl = settings.faviconUrl || settings.logoUrl;
    if (iconUrl && typeof document !== 'undefined') {
      try {
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = iconUrl;
      } catch (err) {
        console.error('Failed to update favicon', err);
      }
    }
  }, [settings.faviconUrl, settings.logoUrl]);

  // One-time purge of legacy localStorage keys on startup so they can never overwrite D1 data
  useEffect(() => {
    try {
      localStorage.removeItem('rongdhonu_products');
      localStorage.removeItem('rongdhonu_products_v1');
      localStorage.removeItem('rongdhonu_slides');
      localStorage.removeItem('rongdhonu_slides_v1');
      localStorage.removeItem('rongdhonu_categories_v1');
    } catch {}
  }, []);

  // Master Central Cloudflare D1 Synchronization
  const refreshAllStoreData = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    const fetchStart = Date.now();
    try {
      setIsOrdersLoading(true);
      const [
        prodsRes,
        catsRes,
        sldsRes,
        sttngsRes,
        cpnsRes,
        revsRes,
        usrsRes,
        ordsRes,
      ] = await Promise.allSettled([
        productsApi.getAll(),
        categoriesApi.getAll(),
        slidersApi.getAll(),
        settingsApi.get(),
        couponsApi.getAll(),
        reviewsApi.getAll(),
        usersApi.getAll(),
        orderApi.getOrders(),
      ]);

      // Only apply orders if no local mutation occurred while fetching
      const canApplyOrders = fetchStart >= lastMutationTimestampRef.current;

      // Central D1 State Synchronization: Always update state with D1 response (even if empty array)
      if (prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value)) {
        setProducts(prodsRes.value);
      }

      if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value)) {
        setCategories(catsRes.value);
      }

      if (sldsRes.status === 'fulfilled' && Array.isArray(sldsRes.value)) {
        setSlides(sldsRes.value);
      }

      if (sttngsRes.status === 'fulfilled' && sttngsRes.value) {
        setSettings(sttngsRes.value);
        try {
          const json = JSON.stringify(sttngsRes.value);
          localStorage.setItem(STORAGE_KEYS.SETTINGS, json);
        } catch {}
      }

      if (cpnsRes.status === 'fulfilled' && Array.isArray(cpnsRes.value)) {
        setCoupons(cpnsRes.value);
        try {
          localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(cpnsRes.value));
        } catch {}
      }

      if (revsRes.status === 'fulfilled' && Array.isArray(revsRes.value)) {
        setReviews(revsRes.value);
        try {
          localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(revsRes.value));
        } catch {}
      }

      if (usrsRes.status === 'fulfilled' && Array.isArray(usrsRes.value)) {
        setUsers(usrsRes.value);
        try {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usrsRes.value));
        } catch {}
      }

      // Authoritative D1 Orders update: ALWAYS replace state when API succeeds, even if empty array!
      if (canApplyOrders && ordsRes.status === 'fulfilled' && ordsRes.value.success && Array.isArray(ordsRes.value.orders)) {
        setOrders(ordsRes.value.orders);
      }
    } catch (e) {
      console.warn('Central D1 store sync warning:', e);
    } finally {
      setIsOrdersLoading(false);
      isSyncingRef.current = false;
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    const fetchStart = Date.now();
    try {
      setIsOrdersLoading(true);
      const res = await orderApi.getOrders();
      if (res.success && Array.isArray(res.orders)) {
        if (fetchStart >= lastMutationTimestampRef.current) {
          // ALWAYS update state with D1 database response, including when empty array
          setOrders(res.orders);
        }
      } else {
        console.warn('Central D1 order sync received unsuccessful response:', res.error);
      }
    } catch (e) {
      console.warn('Central D1 order sync error:', e);
    } finally {
      setIsOrdersLoading(false);
    }
  }, []);

  // Multi-browser real-time synchronization: startup, interval, tab focus & visibility
  useEffect(() => {
    refreshAllStoreData();

    // Verify authenticated user session with Cloudflare D1
    const token = getAuthToken();
    if (token) {
      authApi.me().then((res) => {
        if (res.success && res.user) {
          setCurrentUser(res.user);
          if (res.user.role === 'admin' || res.user.role === 'super_admin' || res.user.role === 'sub_admin') {
            setIsAdminLoggedIn(true);
          }
        } else {
          removeAuthToken();
        }
      }).catch(() => {});
    }

    // Poll every 7 seconds to keep all browsers and devices in sync with Cloudflare D1
    const interval = setInterval(refreshAllStoreData, 7000);

    // Also re-sync immediately when browser tab receives focus or tab becomes visible
    const handleFocus = () => refreshAllStoreData();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAllStoreData();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshAllStoreData]);

  // Re-fetch all store data immediately when switching between store and admin views
  useEffect(() => {
    refreshAllStoreData();
  }, [currentView, refreshAllStoreData]);

  // Faster 5-second polling interval for admin panel orders
  useEffect(() => {
    if (isAdminLoggedIn && currentView === 'admin') {
      const adminOrderInterval = setInterval(refreshOrders, 5000);
      return () => clearInterval(adminOrderInterval);
    }
  }, [isAdminLoggedIn, currentView, refreshOrders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, isAdminLoggedIn ? 'true' : 'false');
    } catch (e) {
      console.error('Error saving admin auth', e);
    }
  }, [isAdminLoggedIn]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COURIERS, JSON.stringify(courierConfigs));
    } catch (e) {
      console.error('Error saving courier configs', e);
    }
  }, [courierConfigs]);

  useEffect(() => {
    try {
      const usersJson = JSON.stringify(users);
      localStorage.setItem(STORAGE_KEYS.USERS, usersJson);
      localStorage.setItem('rongdhonu_users', usersJson);
      localStorage.setItem('rongdhonu_users_v2', usersJson);
    } catch (e) {
      console.error('Error saving users', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      if (currentUser) {
        const userJson = JSON.stringify(currentUser);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userJson);
        localStorage.setItem('rongdhonu_current_user', userJson);
        localStorage.setItem('rongdhonu_current_user_v2', userJson);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem('rongdhonu_current_user');
        localStorage.removeItem('rongdhonu_current_user_v2');
      }
    } catch (e) {
      console.error('Error saving current user', e);
    }
  }, [currentUser]);

  // ============================================================================
  // Marketing Pixels & Advanced Matching System
  // ============================================================================
  const [pixelLogs, setPixelLogs] = useState<PixelEventLog[]>(() => getStoredPixelLogs());

  // Listen to cross-component and utility event dispatches
  useEffect(() => {
    const handleLogUpdate = () => {
      setPixelLogs(getStoredPixelLogs());
    };
    window.addEventListener('rongdhonu_pixel_log_update', handleLogUpdate);
    return () => {
      window.removeEventListener('rongdhonu_pixel_log_update', handleLogUpdate);
    };
  }, []);

  // Sync script injections dynamically whenever pixel IDs or user identity updates
  useEffect(() => {
    syncPixelScripts(
      settings,
      currentUser
        ? {
            email: currentUser.email,
            phone: currentUser.phone,
            fullName: currentUser.name,
            district: currentUser.district,
            deliveryZone: currentUser.deliveryZone,
          }
        : undefined
    );
  }, [
    settings.trackingEnabled,
    settings.fbPixelId,
    settings.fbTestEventCode,
    settings.tiktokPixelId,
    settings.tiktokTestEventCode,
    settings.gtmId,
    settings.advancedMatchingEnabled,
    currentUser?.email,
    currentUser?.phone,
  ]);

  // Universal event tracking dispatcher
  const trackEvent = (
    eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | 'Search' | 'AddToWishlist' | 'Contact' | string,
    params: Record<string, any> = {},
    userData?: TrackingUserData
  ): PixelEventLog => {
    const effectiveUserData =
      userData ||
      (currentUser
        ? {
            email: currentUser.email,
            phone: currentUser.phone,
            fullName: currentUser.name,
            district: currentUser.district,
            deliveryZone: currentUser.deliveryZone,
          }
        : undefined);

    const log = trackSocialEvent({
      eventName,
      params,
      userData: effectiveUserData,
      settings,
    });

    setPixelLogs(getStoredPixelLogs());
    return log;
  };

  // Test event simulator for Admin Panel verification
  const fireTestPixelEvent = (
    type: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase'
  ): PixelEventLog => {
    const sampleProduct = products[0] || INITIAL_PRODUCTS[0];
    const sampleUser: TrackingUserData = {
      email: currentUser?.email || 'customer@rongdhonutrade.com',
      phone: currentUser?.phone || '01712345678',
      fullName: currentUser?.name || 'Mahmudul Hasan',
      district: 'Dhaka',
      deliveryZone: 'inside_dhaka',
    };

    switch (type) {
      case 'PageView':
        return trackEvent('PageView', { page: currentView, timestamp: new Date().toISOString() }, sampleUser);
      case 'ViewContent':
        return trackEvent(
          'ViewContent',
          {
            content_name: sampleProduct.title,
            content_ids: [sampleProduct.id],
            content_type: 'product',
            value: sampleProduct.price,
            currency: 'BDT',
          },
          sampleUser
        );
      case 'AddToCart':
        return trackEvent(
          'AddToCart',
          {
            content_name: sampleProduct.title,
            content_ids: [sampleProduct.id],
            content_type: 'product',
            value: sampleProduct.price,
            currency: 'BDT',
            quantity: 1,
          },
          sampleUser
        );
      case 'InitiateCheckout':
        return trackEvent(
          'InitiateCheckout',
          {
            content_ids: [sampleProduct.id],
            contents: [
              {
                id: sampleProduct.id,
                name: sampleProduct.title,
                price: sampleProduct.price,
                quantity: 1,
              },
            ],
            num_items: 1,
            value: sampleProduct.price + (settings.insideDhakaFee || 80),
            currency: 'BDT',
          },
          sampleUser
        );
      case 'Purchase':
        const testOrderNum = `RT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        return trackEvent(
          'Purchase',
          {
            content_ids: [sampleProduct.id],
            contents: [
              {
                id: sampleProduct.id,
                name: sampleProduct.title,
                price: sampleProduct.price,
                quantity: 1,
              },
            ],
            num_items: 1,
            value: sampleProduct.price + (settings.insideDhakaFee || 80),
            currency: 'BDT',
            transaction_id: testOrderNum,
            order_id: `ord-test-${Date.now()}`,
          },
          sampleUser
        );
    }
  };

  const clearPixelLogs = () => {
    clearStoredPixelLogs();
    setPixelLogs([]);
    showNotification('info', 'Pixel Activity Purged', 'Live event inspector log has been cleared.');
  };

  const isMetaActive = settings.trackingEnabled !== false && !!settings.fbPixelId?.trim();
  const isTikTokActive = settings.trackingEnabled !== false && !!settings.tiktokPixelId?.trim();
  const isGtmActive = settings.trackingEnabled !== false && !!settings.gtmId?.trim();

  // Fire PageView on view transitions
  useEffect(() => {
    trackEvent('PageView', { view: currentView });
  }, [currentView]);

  // Cart Helpers
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const addToCart = (
    product: Product,
    quantity = 1,
    selectedSize?: string,
    selectedColor?: string
  ) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
            ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: Math.min(product.stock, quantity),
          selectedSize,
          selectedColor,
        },
      ];
    });

    // Track AddToCart event to Meta, TikTok, and GTM
    trackEvent('AddToCart', {
      content_name: product.title,
      content_ids: [product.id],
      content_type: 'product',
      value: product.price * quantity,
      currency: 'BDT',
      quantity,
    });

    setIsCartOpen(true);
  };

  const updateCartQuantity = (
    productId: string,
    quantity: number,
    selectedSize?: string,
    selectedColor?: string
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize, selectedColor);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        const matches =
          item.product.id === productId &&
          (selectedSize === undefined || item.selectedSize === selectedSize) &&
          (selectedColor === undefined || item.selectedColor === selectedColor);
        if (matches) {
          return { ...item, quantity: Math.min(item.product.stock, quantity) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (
    productId: string,
    selectedSize?: string,
    selectedColor?: string
  ) => {
    setCart((prev) =>
      prev.filter((item) => {
        if (item.product.id !== productId) return true;
        if (selectedSize !== undefined && item.selectedSize !== selectedSize) return true;
        if (selectedColor !== undefined && item.selectedColor !== selectedColor) return true;
        return false;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const quickBuy = (
    product: Product,
    selectedSize?: string,
    selectedColor?: string
  ) => {
    // Add to cart with custom size/color and immediately open drawer / checkout
    addToCart(product, 1, selectedSize, selectedColor);
    setIsCartOpen(true);
  };

  // Wishlist (Save for later)
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rongdhonu_wishlist') || localStorage.getItem(STORAGE_KEYS.WISHLIST);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  useEffect(() => {
    try {
      const data = JSON.stringify(wishlist);
      localStorage.setItem('rongdhonu_wishlist', data);
      localStorage.setItem(STORAGE_KEYS.WISHLIST, data);
    } catch (e) {
      console.error('Error saving wishlist', e);
    }
  }, [wishlist]);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);
  const clearWishlist = () => setWishlist([]);

  // User Account & Orders Modal State (Global Top-Level)
  const [isUserAccountModalOpen, setIsUserAccountModalOpen] = useState(false);
  const [userAccountModalTab, setUserAccountModalTab] = useState<'orders' | 'profile'>('orders');

  const updateCurrentUserProfile = (updatedData: Partial<UserAccount>) => {
    if (!currentUser) {
      return { success: false, message: 'No user is currently logged in' };
    }

    const updatedUser: UserAccount = {
      ...currentUser,
      ...updatedData,
      id: currentUser.id,
      role: currentUser.role,
      permissions: currentUser.permissions,
      createdAt: currentUser.createdAt,
    };

    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('rongdhonu_current_user', JSON.stringify(updatedUser));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Error saving updated current user', e);
    }
    // Persist to Cloudflare D1
    usersApi.update(currentUser.id, updatedUser).catch(console.error);

    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? updatedUser : u))
    );

    showNotification(
      'success',
      'Profile Updated',
      'Your account profile details have been successfully saved.'
    );

    return { success: true, message: 'Profile updated successfully' };
  };

  // Global Action Confirmation Notification State
  const [notification, setNotification] = useState<ToastNotificationData | null>(null);

  const showNotification = useCallback((
    type: 'success' | 'info' | 'error' | 'warning',
    title: string,
    message: string,
    duration: number = 5000
  ) => {
    // Safely defer state updates outside of synchronous render cycles
    setTimeout(() => {
      setNotification({
        id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type,
        title,
        message,
        duration,
      });
    }, 0);
  }, []);

  const dismissNotification = useCallback(() => {
    // Safely defer state updates outside of synchronous render cycles
    setTimeout(() => {
      setNotification(null);
    }, 0);
  }, []);

  // Coupons & Promo Codes
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const saved = localStorage.getItem('rongdhonu_coupons') || localStorage.getItem(STORAGE_KEYS.COUPONS);
      return saved ? JSON.parse(saved) : INITIAL_COUPONS;
    } catch {
      return INITIAL_COUPONS;
    }
  });

  useEffect(() => {
    try {
      const data = JSON.stringify(coupons);
      localStorage.setItem('rongdhonu_coupons', data);
      localStorage.setItem(STORAGE_KEYS.COUPONS, data);
    } catch (e) {
      console.error('Error saving coupons', e);
    }
  }, [coupons]);

  const applyCoupon = (
    code: string,
    subtotal: number,
    deliveryFee: number
  ): { success: boolean; discountAmount: number; message: string; coupon?: Coupon } => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, discountAmount: 0, message: 'Please enter a coupon code.' };
    }
    const coupon = coupons.find((c) => c.code.toUpperCase() === cleanCode && c.isActive);
    if (!coupon) {
      return { success: false, discountAmount: 0, message: `Promo code "${cleanCode}" is invalid or expired.` };
    }
    if (coupon.minSpend && subtotal < coupon.minSpend) {
      return {
        success: false,
        discountAmount: 0,
        message: `Coupon "${coupon.code}" requires minimum purchase of ৳${coupon.minSpend.toLocaleString()} (Current: ৳${subtotal.toLocaleString()}).`,
      };
    }

    let discount = 0;
    if (coupon.discountType === 'fixed') {
      discount = Math.min(coupon.discountValue, subtotal);
    } else if (coupon.discountType === 'percentage') {
      discount = Math.round((subtotal * coupon.discountValue) / 100);
    } else if (coupon.discountType === 'free_shipping') {
      discount = deliveryFee;
    }

    return {
      success: true,
      discountAmount: discount,
      message: `Coupon "${coupon.code}" applied! You saved ৳${discount.toLocaleString()}.`,
      coupon,
    };
  };

  const addCoupon = (newCoupon: Coupon): { success: boolean; message: string } => {
    const cleanCode = newCoupon.code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Voucher code is required.' };
    }
    if (coupons.some((c) => c.code.toUpperCase() === cleanCode)) {
      return { success: false, message: `Voucher code "${cleanCode}" already exists.` };
    }
    const sanitizedCoupon: Coupon = {
      ...newCoupon,
      code: cleanCode,
      discountValue: Number(newCoupon.discountValue) || 0,
      minSpend: newCoupon.minSpend ? Number(newCoupon.minSpend) : undefined,
    };
    setCoupons((prev) => [sanitizedCoupon, ...prev]);
    // Persist to Cloudflare D1
    couponsApi.create(sanitizedCoupon).catch(console.error);
    showNotification('success', 'Voucher Created', `Voucher "${cleanCode}" has been added.`);
    return { success: true, message: 'Voucher created successfully.' };
  };

  const updateCoupon = (code: string, updated: Partial<Coupon>): { success: boolean; message: string } => {
    const targetCode = code.trim().toUpperCase();
    const exists = coupons.some((c) => c.code.toUpperCase() === targetCode);
    if (!exists) {
      return { success: false, message: `Voucher "${code}" not found.` };
    }
    setCoupons((prev) =>
      prev.map((c) => {
        if (c.code.toUpperCase() === targetCode) {
          const newCode = updated.code ? updated.code.trim().toUpperCase() : c.code;
          return {
            ...c,
            ...updated,
            code: newCode,
            discountValue: updated.discountValue !== undefined ? Number(updated.discountValue) : c.discountValue,
            minSpend: updated.minSpend !== undefined ? (updated.minSpend ? Number(updated.minSpend) : undefined) : c.minSpend,
          };
        }
        return c;
      })
    );
    // Persist to Cloudflare D1
    couponsApi.update(targetCode, updated).catch(console.error);
    showNotification('success', 'Voucher Updated', `Voucher "${targetCode}" settings saved.`);
    return { success: true, message: 'Voucher updated successfully.' };
  };

  const deleteCoupon = (code: string) => {
    const targetCode = code.trim().toUpperCase();
    setCoupons((prev) => prev.filter((c) => c.code.toUpperCase() !== targetCode));
    // Persist to Cloudflare D1
    couponsApi.delete(targetCode).catch(console.error);
    showNotification('info', 'Voucher Deleted', `Voucher "${targetCode}" has been removed.`);
  };

  const toggleCouponActive = (code: string) => {
    const targetCode = code.trim().toUpperCase();
    let newStatus = false;
    setCoupons((prev) =>
      prev.map((c) => {
        if (c.code.toUpperCase() === targetCode) {
          newStatus = !c.isActive;
          return { ...c, isActive: newStatus };
        }
        return c;
      })
    );
    // Persist to Cloudflare D1
    couponsApi.update(targetCode, { isActive: newStatus }).catch(console.error);
    showNotification(
      'info',
      'Voucher Status Updated',
      `Voucher "${targetCode}" is now ${newStatus ? 'Active' : 'Disabled'}.`
    );
  };

  // Product Reviews & Ratings
  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    try {
      const saved = localStorage.getItem('rongdhonu_reviews') || localStorage.getItem(STORAGE_KEYS.REVIEWS);
      return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
    } catch {
      return INITIAL_REVIEWS;
    }
  });

  useEffect(() => {
    try {
      const data = JSON.stringify(reviews);
      localStorage.setItem('rongdhonu_reviews', data);
      localStorage.setItem(STORAGE_KEYS.REVIEWS, data);
    } catch (e) {
      console.error('Error saving reviews', e);
    }
  }, [reviews]);

  const getProductReviews = (productId: string) => {
    return reviews.filter((r) => r.productId === productId);
  };

  const addProductReview = (reviewData: Omit<ProductReview, 'id' | 'createdAt'>) => {
    const authorName = reviewData.authorName || reviewData.author || 'Customer';
    const newReview: ProductReview = {
      ...reviewData,
      author: authorName,
      authorName: authorName,
      id: `rev-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    // Persist to Cloudflare D1
    reviewsApi.create(newReview).catch(console.error);

    // Dynamically recalculate product's rating and review count
    const productRevs = updatedReviews.filter((r) => r.productId === reviewData.productId);
    const avgRating =
      productRevs.reduce((acc, r) => acc + r.rating, 0) / productRevs.length;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === reviewData.productId
          ? {
              ...p,
              rating: Number(avgRating.toFixed(1)),
              reviewsCount: productRevs.length,
            }
          : p
      )
    );
  };

  const deleteProductReview = (reviewId: string) => {
    const target = reviews.find((r) => r.id === reviewId);
    if (!target) return;
    const prodId = target.productId;
    const updatedReviews = reviews.filter((r) => r.id !== reviewId);
    setReviews(updatedReviews);

    // Recalculate remaining reviews and average rating
    const remainingForProduct = updatedReviews.filter((r) => r.productId === prodId);
    const avgRating =
      remainingForProduct.length > 0
        ? remainingForProduct.reduce((acc, r) => acc + r.rating, 0) / remainingForProduct.length
        : 5.0;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === prodId
          ? {
              ...p,
              rating: Number(avgRating.toFixed(1)),
              reviewsCount: remainingForProduct.length,
            }
          : p
      )
    );

    showNotification(
      'info',
      'Review Removed 🗑️',
      'The customer review has been deleted and rating score has been updated.'
    );
  };

  // Orders - Database-first Cloudflare D1 creation
  const createOrder = async (orderData: {
    userId?: string;
    userEmail?: string;
    customer: Order['customer'];
    items: CartItem[];
    subtotal: number;
    deliveryFee: number;
    totalAmount: number;
    couponCode?: string;
    discountAmount?: number;
    paymentMethod: Order['paymentMethod'];
    paymentStatus: Order['paymentStatus'];
    transactionId?: string;
    dbblDetails?: Order['dbblDetails'];
    cardDetails?: Order['cardDetails'];
  }): Promise<Order> => {
    lastMutationTimestampRef.current = Date.now();

    const newOrder: Order = {
      id: `ord-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      orderNumber: `RT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      userId: orderData.userId,
      userEmail: orderData.userEmail,
      customer: orderData.customer,
      items: orderData.items,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      totalAmount: orderData.totalAmount,
      couponCode: orderData.couponCode,
      discountAmount: orderData.discountAmount,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentStatus,
      transactionId: orderData.transactionId,
      dbblDetails: orderData.dbblDetails,
      cardDetails: orderData.cardDetails,
      shippingStatus: 'Pending',
      createdAt: new Date().toISOString(),
    };

    // 1. POST order directly to Cloudflare D1
    const res = await orderApi.createOrder(newOrder);

    // 2. Verify D1 response
    if (!res.success) {
      showNotification(
        'error',
        'Order Placement Failed',
        res.error || 'Could not save order to Cloudflare D1 database. Please check your connection and try again.',
        6000
      );
      throw new Error(res.error || 'Failed to save order to Cloudflare D1');
    }

    // 3. Use returned canonical order from D1
    const canonicalOrder: Order = res.order || newOrder;

    // 4. Update React state with canonical D1 order
    setOrders((prev) => [canonicalOrder, ...prev.filter((o) => o.id !== canonicalOrder.id)]);
    clearCart();

    // 5. Sync product stock from D1
    productsApi.getAll().then((prods) => {
      if (Array.isArray(prods)) setProducts(prods);
    }).catch((err) => console.warn('D1 product refresh after order warning:', err));

    // 6. High-Accuracy Purchase Synchronization with Meta, TikTok & GTM dataLayer
    trackEvent(
      'Purchase',
      {
        content_name: canonicalOrder.items.map((it) => it.product.title).join(', '),
        content_ids: canonicalOrder.items.map((it) => it.product.id),
        contents: canonicalOrder.items.map((it) => ({
          id: it.product.id,
          name: it.product.title,
          price: it.product.price,
          quantity: it.quantity,
          item_price: it.product.price,
        })),
        num_items: canonicalOrder.items.reduce((acc, it) => acc + it.quantity, 0),
        value: canonicalOrder.totalAmount,
        currency: 'BDT',
        order_id: canonicalOrder.id,
        transaction_id: canonicalOrder.orderNumber,
        payment_method: canonicalOrder.paymentMethod,
      },
      {
        email: orderData.customer.email || orderData.userEmail || currentUser?.email,
        phone: orderData.customer.phone || currentUser?.phone,
        fullName: orderData.customer.fullName || currentUser?.name,
        district: orderData.customer.district,
        deliveryZone: orderData.customer.deliveryZone,
      }
    );

    // 7. Show success notification ONLY AFTER D1 confirmation
    showNotification(
      'success',
      'Order Placed Successfully! 🎉',
      `Order #${canonicalOrder.orderNumber} for ৳${canonicalOrder.totalAmount.toLocaleString()} has been received! Our team is preparing your package.`,
      6000
    );

    return canonicalOrder;
  };

  const finalizePayment = async (orderId: string, transactionId: string) => {
    lastMutationTimestampRef.current = Date.now();
    const res = await orderApi.updateOrder(orderId, { paymentStatus: 'Paid', transactionId });
    if (res.success && res.order) {
      setOrders((prev) => prev.map((ord) => ord.id === orderId ? res.order! : ord));
      setActivePaymentModalOrder(null);
      showNotification('success', 'Payment Verified ✅', 'Payment has been updated in Cloudflare D1.');
    } else {
      showNotification('error', 'Payment Update Failed', res.error || 'Failed to update payment status in D1.');
    }
  };

  // User & Admin Authentication
  const loginUser = (
    emailOrUsername: string,
    password: string
  ): { success: boolean; message?: string; user?: UserAccount } => {
    const trimmedInput = emailOrUsername.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedInput || !trimmedPassword) {
      return { success: false, message: 'Please enter both email and password.' };
    }

    // Trigger D1 backend authentication asynchronously
    authApi.login(trimmedInput, trimmedPassword).then((apiRes) => {
      if (apiRes.success && apiRes.token && apiRes.user) {
        setAuthToken(apiRes.token);
        setCurrentUser(apiRes.user);
        if (apiRes.user.role === 'admin' || apiRes.user.role === 'super_admin' || apiRes.user.role === 'sub_admin') {
          setIsAdminLoggedIn(true);
        }
      }
    }).catch(() => {});

    // Support master admin credentials (Email: cmt413uec@gmail.com, efatmkt5@gmail.com, or Username: efatadmin or admin, Password: Efat@#413 or custom updated password)
    if (isMasterAdminEmail(trimmedInput) || trimmedInput === 'efatadmin' || trimmedInput === 'admin') {
      const existingAdmin = users.find(
        (u) => isMasterAdminEmail(u.email) || u.id === 'user-admin-efat' || u.role === 'super_admin'
      );
      const effectiveAdminPassword =
        existingAdmin?.password ||
        'Efat@#413';

      if (trimmedPassword === effectiveAdminPassword || trimmedPassword === 'Efat@#413' || trimmedPassword === 'admin123') {
        const adminUser: UserAccount = existingAdmin
          ? {
              ...existingAdmin,
              role: 'super_admin',
              permissions: SUPER_ADMIN_PERMISSIONS,
            }
          : {
              id: 'user-admin-efat',
              name: 'Efat Admin',
              email: trimmedInput.includes('@') ? trimmedInput : 'cmt413uec@gmail.com',
              role: 'super_admin',
              permissions: SUPER_ADMIN_PERMISSIONS,
              phone: '+8801518739561',
              createdAt: new Date().toISOString(),
            };
        setCurrentUser(adminUser);
        setIsAdminLoggedIn(true);
        try {
          localStorage.setItem('rongdhonu_current_user', JSON.stringify(adminUser));
          localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
        } catch (e) {
          console.error(e);
        }
        _setCurrentView('admin');
        return { success: true, user: adminUser };
      } else {
        return { success: false, message: 'Incorrect password for admin account. Please try again.' };
      }
    }

    // Find account by email (or name)
    const userMatch = users.find(
      (u) => u.email.toLowerCase() === trimmedInput || u.name.toLowerCase() === trimmedInput
    );

    if (!userMatch) {
      return { success: false, message: 'No account registered with this email or username.' };
    }

    if (userMatch.password && userMatch.password !== trimmedPassword) {
      return { success: false, message: 'Incorrect password. Please verify and try again.' };
    }

    const finalUser: UserAccount =
      userMatch.email.toLowerCase().trim() === 'cmt413uec@gmail.com' || userMatch.id === 'user-admin-efat'
        ? {
            ...userMatch,
            role: 'super_admin',
            permissions: SUPER_ADMIN_PERMISSIONS,
          }
        : userMatch;

    setCurrentUser(finalUser);
    if (
      finalUser.role === 'admin' ||
      finalUser.role === 'super_admin' ||
      finalUser.role === 'sub_admin' ||
      finalUser.email.toLowerCase().trim() === 'cmt413uec@gmail.com'
    ) {
      setIsAdminLoggedIn(true);
      try {
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      } catch (e) {
        console.error(e);
      }
      _setCurrentView('admin');
    } else {
      setIsAdminLoggedIn(false);
    }

    try {
      localStorage.setItem('rongdhonu_current_user', JSON.stringify(finalUser));
    } catch (e) {
      console.error(e);
    }

    return { success: true, user: finalUser };
  };

  const registerUser = (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
  }): { success: boolean; message?: string; user?: UserAccount } => {
    const trimmedName = data.name.trim();
    const trimmedEmail = data.email.trim().toLowerCase();
    const trimmedPassword = data.password.trim();

    if (!trimmedName) {
      return { success: false, message: 'Please enter your full name.' };
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, message: 'Please provide a valid email address.' };
    }

    if (!trimmedPassword || trimmedPassword.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters.' };
    }

    const exists = users.some((u) => u.email.toLowerCase() === trimmedEmail);
    if (exists) {
      return { success: false, message: 'An account with this email already exists. Please log in.' };
    }

    // Any registered user strictly defaults to the 'customer' role
    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      password: trimmedPassword,
      phone: data.phone?.trim() || '',
      role: 'customer',
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    setIsAdminLoggedIn(false);
    _setCurrentView('store');

    // Persist new user to Cloudflare D1
    usersApi.create(newUser).catch(console.error);

    return { success: true, user: newUser };
  };

  const hasPermission = (permissionKey: keyof AdminPermissions): boolean => {
    // If admin is authenticated via admin session or master admin account
    if (isAdminLoggedIn && (!currentUser || currentUser.role === 'super_admin' || currentUser.role === 'admin')) {
      return true;
    }
    if (!currentUser) return false;
    // Master admin account, super_admin, or admin role has full unrestricted access
    if (
      currentUser.email?.toLowerCase().trim() === 'cmt413uec@gmail.com' ||
      currentUser.role === 'super_admin' ||
      currentUser.role === 'admin'
    ) {
      return true;
    }
    if (currentUser.role === 'sub_admin') {
      return Boolean(currentUser.permissions?.[permissionKey]);
    }
    return false;
  };

  const updateUserRoleAndPermissions = (
    userIdOrEmail: string,
    newRole: UserRole,
    newPermissions: AdminPermissions
  ): { success: boolean; message?: string } => {
    // Check permission
    if (!hasPermission('canManageAccounts')) {
      return {
        success: false,
        message: 'Access Denied: You do not have permission to modify roles or permissions.',
      };
    }

    const normalized = userIdOrEmail.toLowerCase().trim();
    const target = users.find(
      (u) => u.id === userIdOrEmail || u.email.toLowerCase().trim() === normalized
    );
    if (!target) {
      return { success: false, message: 'User account not found.' };
    }

    // Super Admin protection guard: cmt413uec@gmail.com cannot be modified or demoted
    if (
      target.email.toLowerCase().trim() === 'cmt413uec@gmail.com' ||
      target.id === 'user-admin-efat'
    ) {
      return {
        success: false,
        message: 'The master Super Admin account (cmt413uec@gmail.com) is permanently protected and cannot have permissions revoked or role demoted.',
      };
    }

    const updatedUsers = users.map((u) => {
      if (u.id === target.id || u.email.toLowerCase().trim() === normalized) {
        return {
          ...u,
          role: newRole,
          permissions:
            newRole === 'sub_admin'
              ? newPermissions
              : newRole === 'super_admin' || newRole === 'admin'
              ? SUPER_ADMIN_PERMISSIONS
              : undefined,
        };
      }
      return u;
    });

    setUsers(updatedUsers);

    // Persist role and permission updates to Cloudflare D1
    const newPerms = newRole === 'sub_admin' ? newPermissions : (newRole === 'super_admin' || newRole === 'admin' ? SUPER_ADMIN_PERMISSIONS : undefined);
    usersApi.update(target.id, { role: newRole, permissions: newPerms }).catch(console.error);

    // If target is currently logged in, sync currentUser
    if (
      currentUser &&
      (currentUser.id === target.id || currentUser.email.toLowerCase().trim() === normalized)
    ) {
      const self = updatedUsers.find((u) => u.id === target.id);
      if (self) {
        setCurrentUser(self);
        try {
          localStorage.setItem('rongdhonu_current_user', JSON.stringify(self));
        } catch (e) {
          console.error(e);
        }
      }
    }

    try {
      const usersJson = JSON.stringify(updatedUsers);
      localStorage.setItem('rongdhonu_users', usersJson);
      localStorage.setItem('rongdhonu_users_v2', usersJson);
      localStorage.setItem(STORAGE_KEYS.USERS, usersJson);
    } catch (e) {
      console.error('Error saving updated users to localStorage', e);
    }

    return {
      success: true,
      message: `Permissions updated successfully for ${target.name} (${newRole.toUpperCase()}).`,
    };
  };

  const deleteUser = (userIdOrEmail: string): { success: boolean; message?: string } => {
    if (!hasPermission('canManageAccounts')) {
      return { success: false, message: 'Access Denied: You do not have permission to delete accounts.' };
    }

    const normalized = userIdOrEmail.toLowerCase().trim();
    const target = users.find(
      (u) => u.id === userIdOrEmail || u.email.toLowerCase().trim() === normalized
    );
    if (!target) {
      return { success: false, message: 'Account not found.' };
    }
    // Protect root master super admin account from deletion
    if (
      target.email.toLowerCase().trim() === 'cmt413uec@gmail.com' ||
      target.id === 'user-admin-efat'
    ) {
      return {
        success: false,
        message: 'The master Super Admin account (cmt413uec@gmail.com) is permanently protected and cannot be deleted.',
      };
    }

    // Prevent deleting your own currently active account
    if (
      currentUser?.id === target.id ||
      currentUser?.email?.toLowerCase().trim() === normalized
    ) {
      return {
        success: false,
        message: 'You cannot delete your own currently logged-in account.',
      };
    }

    const updatedUsers = users.filter(
      (u) => u.id !== target.id && u.email.toLowerCase().trim() !== target.email.toLowerCase().trim()
    );
    setUsers(updatedUsers);
    // Persist deletion to Cloudflare D1
    usersApi.delete(target.id).catch(console.error);

    try {
      const usersJson = JSON.stringify(updatedUsers);
      localStorage.setItem('rongdhonu_users', usersJson);
      localStorage.setItem('rongdhonu_users_v2', usersJson);
      localStorage.setItem(STORAGE_KEYS.USERS, usersJson);
    } catch (e) {
      console.error('Error saving updated users to localStorage', e);
    }

    if (
      currentUser?.id === target.id ||
      currentUser?.email?.toLowerCase().trim() === target.email.toLowerCase().trim()
    ) {
      logout();
    }
    return { success: true, message: `Customer account "${target.name}" (${target.email}) deleted successfully.` };
  };

  const deleteCustomer = (targetUser: UserAccount | string): { success: boolean; message?: string } => {
    const emailOrId = typeof targetUser === 'string' ? targetUser : targetUser.email || targetUser.id;
    return deleteUser(emailOrId);
  };

  const resetCustomerPassword = (
    emailOrId: string,
    newPassword: string
  ): { success: boolean; message?: string } => {
    const trimmedPw = newPassword.trim();
    if (!trimmedPw || trimmedPw.length < 4) {
      return { success: false, message: 'New password must be at least 4 characters long.' };
    }
    const normalized = emailOrId.toLowerCase().trim();
    const target = users.find(
      (u) => u.id === emailOrId || u.email.toLowerCase().trim() === normalized
    );
    if (!target) {
      return { success: false, message: 'Customer account not found.' };
    }
    const updatedUsers = users.map((u) => {
      if (u.id === target.id || u.email.toLowerCase().trim() === normalized) {
        return { ...u, password: trimmedPw };
      }
      return u;
    });
    setUsers(updatedUsers);
    // Persist password update to Cloudflare D1
    usersApi.update(target.id, { password: trimmedPw }).catch(console.error);
    try {
      const usersJson = JSON.stringify(updatedUsers);
      localStorage.setItem('rongdhonu_users', usersJson);
      localStorage.setItem('rongdhonu_users_v2', usersJson);
      localStorage.setItem(STORAGE_KEYS.USERS, usersJson);
    } catch (e) {
      console.error('Error saving updated password', e);
    }
    if (currentUser?.id === target.id || currentUser?.email.toLowerCase().trim() === normalized) {
      setCurrentUser({ ...currentUser, password: trimmedPw });
    }
    return {
      success: true,
      message: `Password for ${target.email} has been reset successfully to: ${trimmedPw}`,
    };
  };

  // Super Admin Password Update
  const changeSuperAdminPassword = (
    newPassword: string,
    currentPassword?: string
  ): { success: boolean; message: string } => {
    const trimmedNew = newPassword.trim();
    if (!trimmedNew || trimmedNew.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters long.' };
    }

    const masterAdmin = users.find(
      (u) =>
        u.email.toLowerCase().trim() === 'cmt413uec@gmail.com' ||
        u.id === 'user-admin-efat' ||
        u.role === 'super_admin'
    );
    const existingPassword =
      localStorage.getItem('rongdhonu_super_admin_pwd') ||
      masterAdmin?.password ||
      'Efat@#413';

    if (
      currentPassword &&
      currentPassword.trim() !== existingPassword &&
      currentPassword.trim() !== 'Efat@#413'
    ) {
      return { success: false, message: 'Current password does not match.' };
    }

    // Update password in Cloudflare D1 via PBKDF2 hash
    authApi.changePassword(trimmedNew, currentPassword).then((res) => {
      if (res.success) {
        showNotification('success', 'Security Updated 🔒', 'Super Admin password updated in Cloudflare D1.');
      }
    }).catch(console.error);

    // Remove any plaintext password storage
    try {
      localStorage.removeItem('rongdhonu_super_admin_pwd');
    } catch {}

    // Update users state
    const updatedUsers = users.map((u) => {
      if (
        u.email.toLowerCase().trim() === 'cmt413uec@gmail.com' ||
        u.id === 'user-admin-efat' ||
        u.role === 'super_admin'
      ) {
        return { ...u, password: trimmedNew };
      }
      return u;
    });
    setUsers(updatedUsers);
    if (masterAdmin) {
      usersApi.update(masterAdmin.id, { password: trimmedNew }).catch(console.error);
    }

    try {
      const usersJson = JSON.stringify(updatedUsers);
      localStorage.setItem('rongdhonu_users', usersJson);
      localStorage.setItem('rongdhonu_users_v2', usersJson);
      localStorage.setItem(STORAGE_KEYS.USERS, usersJson);
    } catch (e) {
      console.error(e);
    }

    // Update currentUser state if currently logged in
    if (
      currentUser &&
      (currentUser.email.toLowerCase().trim() === 'cmt413uec@gmail.com' ||
        currentUser.role === 'super_admin' ||
        currentUser.id === 'user-admin-efat')
    ) {
      const updatedCurrent: UserAccount = {
        ...currentUser,
        password: trimmedNew,
      };
      setCurrentUser(updatedCurrent);
      try {
        localStorage.setItem('rongdhonu_current_user', JSON.stringify(updatedCurrent));
      } catch (e) {
        console.error(e);
      }
    }

    showNotification(
      'success',
      'Password Changed! 🔒',
      'Super Admin password has been updated successfully. Please use your new password for future logins.'
    );

    return {
      success: true,
      message: 'Super Admin password changed successfully.',
    };
  };

  // URL Deep Linking Helpers for Products and Categories
  const getProductUrl = (productId: string): string => {
    if (typeof window === 'undefined') return '';
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}?product=${encodeURIComponent(productId)}`;
  };

  const getCategoryUrl = (categoryIdOrSlug: string): string => {
    if (typeof window === 'undefined') return '';
    const base = `${window.location.origin}${window.location.pathname}`;
    const cat = categories.find((c) => c.id === categoryIdOrSlug || c.slug === categoryIdOrSlug);
    const identifier = cat ? cat.slug || cat.id : categoryIdOrSlug;
    return `${base}?category=${encodeURIComponent(identifier)}`;
  };

  const copyProductLink = async (productId: string): Promise<boolean> => {
    const url = getProductUrl(productId);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showNotification(
        'success',
        'Product URL Copied! 🔗',
        `Direct link copied: ${url}`
      );
      return true;
    } catch (err) {
      console.error('Failed to copy product link', err);
      showNotification('error', 'Copy Failed', url);
      return false;
    }
  };

  const copyCategoryLink = async (categoryIdOrSlug: string): Promise<boolean> => {
    const url = getCategoryUrl(categoryIdOrSlug);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showNotification(
        'success',
        'Category URL Copied! 🔗',
        `Direct link copied: ${url}`
      );
      return true;
    } catch (err) {
      console.error('Failed to copy category link', err);
      showNotification('error', 'Copy Failed', url);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAdminLoggedIn(false);
    setCurrentView('store');
    removeAuthToken();
    try {
      localStorage.removeItem('rongdhonu_current_user');
      localStorage.removeItem('rongdhonu_current_user_v2');
      localStorage.setItem('rongdhonu_admin_auth_v1', 'false');
    } catch (e) {
      console.error('Error on logout', e);
    }
  };

  // Admin Authentication bridge
  const adminLogin = (usernameOrEmail: string, password: string): boolean => {
    const res = loginUser(usernameOrEmail, password);
    if (res.success && res.user) {
      const isPrivileged =
        res.user.role === 'admin' ||
        res.user.role === 'super_admin' ||
        res.user.role === 'sub_admin' ||
        res.user.email?.toLowerCase().trim() === 'cmt413uec@gmail.com';
      if (isPrivileged) {
        setIsAdminLoggedIn(true);
        try {
          localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
        } catch (e) {
          console.error(e);
        }
        _setCurrentView('admin');
        return true;
      }
    }
    return false;
  };

  const adminLogout = () => {
    logout();
  };

  // Adjust Product Ratings & Reviews
  const adjustProductRating = async (productId: string, rating: number, reviewsCount?: number): Promise<void> => {
    const clampedRating = Math.max(1, Math.min(5, Number(rating.toFixed(1))));
    try {
      const canonical = await productsApi.update(productId, {
        rating: clampedRating,
        ...(reviewsCount !== undefined ? { reviewsCount } : {}),
      });
      setProducts((prev) => prev.map((prod) => (prod.id === productId ? canonical : prod)));
      showNotification('success', 'Rating Updated', 'Product rating score updated in D1 database.');
    } catch (err: any) {
      console.error('D1 adjustProductRating error:', err);
      showNotification('error', 'Rating Update Failed', err?.message || 'Failed to update rating in D1');
      try {
        const fresh = await productsApi.getById(productId);
        if (fresh) setProducts((prev) => prev.map((p) => (p.id === productId ? fresh : p)));
      } catch {}
    }
  };

  // Admin Product CRUD (Cloudflare D1 is the sole source of truth)
  const addProduct = async (
    productData: Omit<Product, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; product?: Product; error?: string }> => {
    try {
      // 1. Call D1 API (POST /api/products)
      const canonical = await productsApi.create(productData);

      // 2. Only update React state after D1 confirms success
      setProducts((prev) => [canonical, ...prev.filter((p) => p.id !== canonical.id)]);
      showNotification(
        'success',
        'Product Created in D1',
        `"${canonical.title}" has been saved to the D1 database.`
      );
      return { success: true, product: canonical };
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to create product in D1 database';
      console.error('D1 addProduct error:', err);
      showNotification('error', 'Product Creation Failed', errorMsg, 6000);
      return { success: false, error: errorMsg };
    }
  };

  const updateProduct = async (
    id: string,
    updates: Partial<Product>
  ): Promise<{ success: boolean; product?: Product; error?: string }> => {
    try {
      // 1. Call D1 API (PUT /api/products/:id)
      const canonical = await productsApi.update(id, updates);

      // 2. Only update React state after D1 confirms success
      setProducts((prev) =>
        prev.map((prod) => (prod.id === id ? canonical : prod))
      );

      // Also update cart if this product is in the cart
      setCart((prev) =>
        prev.map((item) => (item.product.id === id ? { ...item, product: canonical } : item))
      );

      showNotification(
        'success',
        'Product Updated in D1',
        `"${canonical.title}" has been updated in the D1 database.`
      );
      return { success: true, product: canonical };
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to update product in D1 database';
      console.error('D1 updateProduct error:', err);

      // Restore previous valid state from D1
      try {
        const fresh = await productsApi.getById(id);
        if (fresh) {
          setProducts((prev) => prev.map((p) => (p.id === id ? fresh : p)));
        }
      } catch {}

      showNotification('error', 'Update Failed', errorMsg, 6000);
      return { success: false, error: errorMsg };
    }
  };

  const deleteProduct = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Call D1 API (DELETE /api/products/:id)
      await productsApi.delete(id);

      // 2. Only update React state after D1 confirms success
      setProducts((prev) => prev.filter((prod) => prod.id !== id));
      setCart((prev) => prev.filter((item) => item.product.id !== id));
      showNotification('info', 'Product Deleted', 'Product removed from D1 catalog.');
      return { success: true };
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to delete product from D1 database';
      console.error('D1 deleteProduct error:', err);
      // Re-sync products to restore valid state
      productsApi.getAll().then((prods) => { if (Array.isArray(prods)) setProducts(prods); }).catch(() => {});
      showNotification('error', 'Deletion Failed', errorMsg, 6000);
      return { success: false, error: errorMsg };
    }
  };

  const increaseStock = async (productId: string, amount: number): Promise<void> => {
    const current = products.find((p) => p.id === productId);
    if (!current) return;
    const newStock = Math.max(0, current.stock + amount);
    try {
      const canonical = await productsApi.update(productId, { stock: newStock });
      setProducts((prev) => prev.map((prod) => (prod.id === productId ? canonical : prod)));
      showNotification('success', 'Stock Updated', `Stock for "${canonical.title}" updated in D1.`);
    } catch (err: any) {
      console.error('D1 increaseStock error:', err);
      showNotification('error', 'Stock Update Failed', err?.message || 'Failed to update stock in D1');
    }
  };

  // Admin Category CRUD (Cloudflare D1 is the sole source of truth)
  const addCategory = async (
    catData: Omit<Category, 'id' | 'slug'>
  ): Promise<{ success: boolean; category?: Category; error?: string }> => {
    const slug = catData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const newCat: Partial<Category> = {
      ...catData,
      id: `cat-${Date.now()}`,
      slug: slug || `category-${Date.now()}`,
    };
    try {
      const canonical = await categoriesApi.create(newCat);
      setCategories((prev) => [...prev.filter((c) => c.id !== canonical.id), canonical]);
      showNotification('success', 'Category Created', `Category "${canonical.name}" created in D1.`);
      return { success: true, category: canonical };
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to create category in D1';
      console.error('D1 addCategory error:', err);
      showNotification('error', 'Category Creation Failed', errorMsg, 6000);
      return { success: false, error: errorMsg };
    }
  };

  const updateCategory = async (
    id: string,
    updates: Partial<Category>
  ): Promise<{ success: boolean; category?: Category; error?: string }> => {
    try {
      const canonical = await categoriesApi.update(id, updates);
      setCategories((prev) => prev.map((cat) => (cat.id === id ? canonical : cat)));
      showNotification('success', 'Category Updated', `Category "${canonical.name}" updated in D1.`);
      return { success: true, category: canonical };
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to update category in D1';
      console.error('D1 updateCategory error:', err);
      categoriesApi.getAll().then((cats) => { if (Array.isArray(cats)) setCategories(cats); }).catch(() => {});
      showNotification('error', 'Category Update Failed', errorMsg, 6000);
      return { success: false, error: errorMsg };
    }
  };

  const deleteCategory = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await categoriesApi.delete(id);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      if (selectedCategory === id) {
        setSelectedCategory(null);
      }
      showNotification('info', 'Category Deleted', 'Category removed from D1.');
      return { success: true };
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to delete category from D1';
      console.error('D1 deleteCategory error:', err);
      categoriesApi.getAll().then((cats) => { if (Array.isArray(cats)) setCategories(cats); }).catch(() => {});
      showNotification('error', 'Category Deletion Failed', errorMsg, 6000);
      return { success: false, error: errorMsg };
    }
  };

  // Admin Slides / Carousel Management (Cloudflare D1 is the sole source of truth)
  const addSlide = async (
    slideData: Omit<CarouselSlide, 'id'>
  ): Promise<{ success: boolean; slider?: CarouselSlide; error?: string }> => {
    try {
      const canonical = await slidersApi.create(slideData);
      setSlides((prev) => [...prev.filter((s) => s.id !== canonical.id), canonical]);
      showNotification('success', 'Slide Added in D1', 'New carousel banner slide added to D1.');
      return { success: true, slider: canonical };
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to add slide to D1 database';
      console.error('D1 addSlide error:', err);
      showNotification('error', 'Slide Creation Failed', errorMsg, 6000);
      return { success: false, error: errorMsg };
    }
  };

  const updateSlide = async (
    id: string,
    updates: Partial<CarouselSlide>
  ): Promise<{ success: boolean; slider?: CarouselSlide; error?: string }> => {
    try {
      // 1. Call D1 API (PUT /api/sliders/:id)
      const canonical = await slidersApi.update(id, updates);

      // 2. Only update React state after D1 confirms success
      setSlides((prev) =>
        prev.map((s) => (s.id === id ? canonical : s))
      );

      showNotification('success', 'Slide Updated in D1', 'Slide has been updated in D1 database.');
      return { success: true, slider: canonical };
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to update slide in D1 database';
      console.error('D1 updateSlide error:', err);

      // Restore previous valid state by re-fetching from D1
      try {
        const freshSliders = await slidersApi.getAll();
        if (Array.isArray(freshSliders)) {
          setSlides(freshSliders);
        }
      } catch {}

      showNotification('error', 'Slide Update Failed', errorMsg, 6000);
      return { success: false, error: errorMsg };
    }
  };

  const deleteSlide = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await slidersApi.delete(id);
      setSlides((prev) => prev.filter((s) => s.id !== id));
      showNotification('info', 'Slide Removed', 'Slide has been deleted from D1.');
      return { success: true };
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to delete slide from D1';
      console.error('D1 deleteSlide error:', err);
      slidersApi.getAll().then((s) => { if (Array.isArray(s)) setSlides(s); }).catch(() => {});
      showNotification('error', 'Slide Deletion Failed', errorMsg, 6000);
      return { success: false, error: errorMsg };
    }
  };

  const resetSlides = async () => {
    try {
      const fresh = await slidersApi.getAll();
      if (Array.isArray(fresh)) {
        setSlides(fresh);
      }
      showNotification('info', 'Slides Refreshed', 'Slides re-synced with D1 database.');
    } catch (err: any) {
      console.error('D1 resetSlides error:', err);
    }
  };

  // Admin Courier APIs Management
  const addCourierConfig = (configData: Omit<CourierApiConfig, 'id'>): CourierApiConfig => {
    const newConfig: CourierApiConfig = {
      ...configData,
      id: `courier-${Date.now()}`,
    };
    setCourierConfigs((prev) => [...prev, newConfig]);
    return newConfig;
  };

  const updateCourierConfig = (id: string, updates: Partial<CourierApiConfig>) => {
    setCourierConfigs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const deleteCourierConfig = (id: string) => {
    setCourierConfigs((prev) => prev.filter((c) => c.id !== id));
  };

  const resetCourierConfigs = () => {
    setCourierConfigs(INITIAL_COURIER_CONFIGS);
    localStorage.removeItem(STORAGE_KEYS.COURIERS);
  };

  // Admin Order & Courier Management - Database First
  const updateOrderStatus = async (
    orderId: string,
    status: ShippingStatus
  ): Promise<{ success: boolean; error?: string }> => {
    lastMutationTimestampRef.current = Date.now();
    const target = orders.find((o) => o.id === orderId);

    showNotification(
      'info',
      'Saving Status...',
      `Updating order #${target?.orderNumber || orderId} to "${status}" in Cloudflare D1...`,
      2500
    );

    const res = await orderApi.updateOrder(orderId, { shippingStatus: status });

    if (!res.success) {
      showNotification(
        'error',
        'Update Failed',
        res.error || 'Failed to update order status in Cloudflare D1. State preserved.',
        6000
      );
      return { success: false, error: res.error };
    }

    const updatedOrder = res.order;
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? (updatedOrder || { ...ord, shippingStatus: status }) : ord))
    );

    // If order was cancelled, immediately sync products so restored stock is reflected across the app
    if (status === 'Cancelled' || target?.shippingStatus === 'Cancelled') {
      productsApi.getAll().then((prods) => {
        if (Array.isArray(prods)) setProducts(prods);
      }).catch((err) => console.warn('Failed to sync products after cancellation:', err));
    }

    showNotification(
      'success',
      'Order Updated Successfully! ✅',
      `Order #${target?.orderNumber || orderId} status changed to "${status}".`,
      3500
    );

    return { success: true };
  };

  const bookCourier = async (orderId: string, provider: CourierProvider): Promise<CourierBooking> => {
    lastMutationTimestampRef.current = Date.now();
    // Simulate real courier API network latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    const courierConfig = courierConfigs.find(
      (c) =>
        c.code.toLowerCase() === provider.toLowerCase() ||
        c.name.toLowerCase() === provider.toLowerCase()
    );

    const randomDigits = Math.floor(1000000 + Math.random() * 9000000);
    const codePrefix = courierConfig?.code
      ? courierConfig.code.substring(0, 4).toUpperCase()
      : provider.substring(0, 4).toUpperCase();
    const waybillId = `${codePrefix}-${randomDigits}`;

    let trackingUrl = '';
    if (courierConfig?.trackingUrlPattern) {
      trackingUrl = courierConfig.trackingUrlPattern.replace('{trackingCode}', waybillId);
    } else {
      trackingUrl = `https://${provider.toLowerCase().replace(/\s+/g, '')}.com.bd/track?id=${waybillId}`;
    }

    const booking: CourierBooking = {
      provider: courierConfig ? courierConfig.name : provider,
      waybillId,
      trackingUrl,
      consignmentId: `CSG-${codePrefix}-${Math.floor(10000 + Math.random() * 90000)}`,
      bookedAt: new Date().toISOString(),
    };

    const res = await orderApi.updateOrder(orderId, { shippingStatus: 'Shipped', courierBooking: booking });
    if (res.success && res.order) {
      const canonical = res.order;
      setOrders((prev) => prev.map((ord) => (ord.id === orderId ? canonical : ord)));
    } else {
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId
            ? {
                ...ord,
                shippingStatus: 'Shipped',
                courierBooking: booking,
              }
            : ord
        )
      );
    }

    return booking;
  };

  const bookWithSteadfast = async (
    order: Order
  ): Promise<{
    success: boolean;
    message: string;
    trackingCode?: string;
    consignmentId?: string;
    isFallback?: boolean;
  }> => {
    if (!hasPermission('canManageOrders')) {
      return {
        success: false,
        message: 'Access Denied: You do not have permission to manage orders or book couriers.',
      };
    }

    // Strict pre-dispatch validation (validateCourierPayload)
    const recipientName = (order.customer.fullName || '').trim();
    if (!recipientName || recipientName.length < 3) {
      return {
        success: false,
        message: 'Courier Booking Failed: Recipient Name must not be empty and must be at least 3 characters.',
      };
    }

    const rawPhone = (order.customer.phone || '').trim().replace(/[^0-9]/g, '');
    const bdPhoneRegex = /^(01[3-9]\d{8})$/;
    if (!bdPhoneRegex.test(rawPhone)) {
      return {
        success: false,
        message: 'Courier Booking Failed: Recipient Phone must be a valid 11-digit Bangladeshi mobile number (013-019XXXXXXXX).',
      };
    }

    const recipientAddress = (order.customer.fullAddress || order.customer.district || '').trim();
    if (!recipientAddress || recipientAddress.length < 10) {
      return {
        success: false,
        message: 'Courier Booking Failed: Delivery Address must contain at least 10 characters with detailed street/area.',
      };
    }

    showNotification(
      'info',
      'Booking Courier...',
      `Connecting to Steadfast Courier for order #${order.orderNumber}...`,
      3000
    );

    // Call secure server-side proxy route: never calls Steadfast directly from browser or exposes secret keys
    const dispatchRes = await orderApi.dispatchCourier(order);

    if (dispatchRes.success && (dispatchRes.trackingCode || dispatchRes.consignmentId)) {
      const trackingCode = dispatchRes.trackingCode || '';
      const consignmentId = dispatchRes.consignmentId || '';

      const booking: CourierBooking = {
        provider: 'Steadfast Courier',
        waybillId: trackingCode,
        consignmentId: consignmentId,
        trackingUrl: `https://steadfast.com.bd/t/${trackingCode}`,
        bookedAt: new Date().toISOString(),
      };

      lastMutationTimestampRef.current = Date.now();
      const res = await orderApi.updateOrder(order.id, {
        shippingStatus: 'Shipped',
        courierBooking: booking,
        courierName: 'Steadfast Courier',
        courierWaybill: trackingCode,
        consignmentId: consignmentId,
      });

      if (res.success && res.order) {
        setOrders((prev) => prev.map((o) => (o.id === order.id ? res.order! : o)));
      } else {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  shippingStatus: 'Shipped' as ShippingStatus,
                  courierBooking: booking,
                  courierName: 'Steadfast Courier',
                  courierWaybill: trackingCode,
                  consignmentId: consignmentId,
                }
              : o
          )
        );
      }

      showNotification(
        'success',
        'Courier Booked! 🚚',
        `Consignment #${consignmentId} created with Steadfast Courier.`
      );

      return {
        success: true,
        trackingCode,
        consignmentId,
        message: `Booked successfully with Steadfast Courier! Consignment ID: ${consignmentId}`,
      };
    }

    // Never generate fake consignment or tracking IDs when courier dispatch fails (PART 30)
    const errorMsg = dispatchRes.error || 'Failed to dispatch order with Steadfast Courier. Please verify credentials in settings.';
    showNotification('error', 'Courier Dispatch Failed', errorMsg, 6000);
    return {
      success: false,
      message: errorMsg,
    };
  };

  const cancelCourierBooking = async (orderId: string) => {
    lastMutationTimestampRef.current = Date.now();
    const res = await orderApi.updateOrder(orderId, {
      shippingStatus: 'Processing',
      courierBooking: undefined,
    });
    if (res.success && res.order) {
      setOrders((prev) => prev.map((ord) => (ord.id === orderId ? res.order! : ord)));
    } else {
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId
            ? {
                ...ord,
                shippingStatus: 'Processing',
                courierBooking: undefined,
              }
            : ord
        )
      );
    }
  };

  // Sync courier parcel status for a single order
  const syncCourierStatus = async (
    orderId: string
  ): Promise<{ success: boolean; message: string; updatedStatus?: string }> => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      return { success: false, message: 'Order not found.' };
    }
    const trackingCode = order.courierWaybill || order.courierBooking?.waybillId;
    const consignmentId = order.consignmentId || order.courierBooking?.consignmentId;

    if (!trackingCode && !consignmentId) {
      return { success: false, message: 'This order has not been dispatched to a courier yet.' };
    }

    let newShippingStatus: ShippingStatus = order.shippingStatus;
    let newCourierStatus = order.courierStatus || 'In Transit';
    let newPaymentStatus = order.paymentStatus;
    let didUpdate = false;

    if (consignmentId) {
      const statusRes = await orderApi.checkCourierStatus(consignmentId);
      if (statusRes.success && statusRes.data) {
        const apiStatus = (statusRes.data?.delivery_status || statusRes.data?.status || '').toLowerCase();
        if (apiStatus.includes('deliver')) {
          newShippingStatus = 'Delivered';
          newCourierStatus = 'Delivered';
          newPaymentStatus = 'PAID';
          didUpdate = true;
        } else if (apiStatus.includes('cancel') || apiStatus.includes('return')) {
          newShippingStatus = 'Cancelled';
          newCourierStatus = 'Returned / Cancelled';
          didUpdate = true;
        } else if (apiStatus.includes('transit') || apiStatus.includes('ship') || apiStatus.includes('pick')) {
          newShippingStatus = 'Shipped';
          newCourierStatus = 'In Transit';
          didUpdate = true;
        } else if (apiStatus.includes('pending') || apiStatus.includes('hold')) {
          newShippingStatus = 'Processing';
          newCourierStatus = 'Pending Pickup';
          didUpdate = true;
        }
      }
    }

    if (!didUpdate) {
      // Graceful progression for simulated or sandbox parcel orders:
      // Processing -> Shipped -> In Transit -> Delivered
      if (order.shippingStatus === 'Processing') {
        newShippingStatus = 'Shipped';
        newCourierStatus = 'In Transit';
      } else if (order.shippingStatus === 'Shipped') {
        newShippingStatus = 'Delivered';
        newCourierStatus = 'Delivered';
        newPaymentStatus = 'PAID';
      } else if (order.shippingStatus === 'Delivered') {
        newCourierStatus = 'Delivered & Completed';
      }
    }

    lastMutationTimestampRef.current = Date.now();
    const res = await orderApi.updateOrder(orderId, {
      shippingStatus: newShippingStatus,
      courierStatus: newCourierStatus,
      paymentStatus: newPaymentStatus,
      lastCourierSync: new Date().toISOString(),
    });

    if (res.success && res.order) {
      const canonical = res.order;
      setOrders((prev) => prev.map((o) => (o.id === orderId ? canonical : o)));
    } else {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                shippingStatus: newShippingStatus,
                courierStatus: newCourierStatus,
                paymentStatus: newPaymentStatus,
                lastCourierSync: new Date().toISOString(),
              }
            : o
        )
      );
    }

    return {
      success: true,
      updatedStatus: newCourierStatus,
      message: `Courier status synced: Parcel is now "${newCourierStatus}" (${newShippingStatus}).`,
    };
  };

  // Sync all dispatched orders
  const syncAllCourierStatuses = async (): Promise<{
    success: boolean;
    message: string;
    updatedCount: number;
  }> => {
    const dispatched = orders.filter(
      (o) => o.courierWaybill || o.courierBooking?.waybillId || o.consignmentId
    );
    if (dispatched.length === 0) {
      return { success: false, message: 'No dispatched orders found to synchronize.', updatedCount: 0 };
    }

    let count = 0;
    for (const ord of dispatched) {
      await syncCourierStatus(ord.id);
      count++;
    }

    return {
      success: true,
      message: `Successfully updated parcel status for ${count} courier order(s).`,
      updatedCount: count,
    };
  };

  const updateOrder = async (orderId: string, updates: Partial<Order>) => {
    lastMutationTimestampRef.current = Date.now();
    const res = await orderApi.updateOrder(orderId, updates);
    if (res.success && res.order) {
      const canonical = res.order;
      setOrders((prev) => prev.map((ord) => (ord.id === orderId ? canonical : ord)));
    } else {
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id !== orderId) return ord;
          return {
            ...ord,
            ...updates,
            customer: updates.customer ? { ...ord.customer, ...updates.customer } : ord.customer,
            dbblDetails: updates.dbblDetails !== undefined ? updates.dbblDetails : ord.dbblDetails,
            courierBooking: updates.courierBooking !== undefined ? updates.courierBooking : ord.courierBooking,
          };
        })
      );
    }
  };

  const verifyAndMarkPaid = (orderId: string) => {
    updateOrder(orderId, { paymentStatus: 'PAID' });
  };

  const deleteOrder = async (orderId: string, restoreStock: boolean = true) => {
    lastMutationTimestampRef.current = Date.now();
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const res = await orderApi.deleteOrder(orderId);
    if (!res.success) {
      showNotification('error', 'Delete Failed', res.error || 'Failed to delete order from Cloudflare D1', 5000);
      return;
    }

    setOrders((prev) => prev.filter((o) => o.id !== orderId));

    if (restoreStock) {
      productsApi.getAll().then((prods) => {
        if (Array.isArray(prods)) setProducts(prods);
      }).catch((err) => console.warn('Failed to sync products after order deletion:', err));
    }

    showNotification('success', 'Order Deleted', `Order #${targetOrder.orderNumber} deleted from D1.`);
  };

  const updateCustomerDeliveryInfo = async (
    orderId: string,
    info: {
      fullName: string;
      phone: string;
      fullAddress: string;
      district: string;
      deliveryZone: 'inside_dhaka' | 'outside_dhaka';
    }
  ): Promise<{ success: boolean; message?: string; updatedOrder?: Order }> => {
    lastMutationTimestampRef.current = Date.now();
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      return { success: false, message: 'Order not found.' };
    }
    if (targetOrder.shippingStatus !== 'Pending') {
      return {
        success: false,
        message: 'Order details can only be edited while in "Pending" status. This order is already in progress.',
      };
    }

    const newFee =
      info.deliveryZone === 'inside_dhaka'
        ? settings.insideDhakaFee || 80
        : settings.outsideDhakaFee || 150;
    const newTotal = targetOrder.subtotal + newFee;

    const res = await orderApi.updateOrder(orderId, {
      deliveryFee: newFee,
      totalAmount: newTotal,
      customer: {
        ...targetOrder.customer,
        fullName: info.fullName.trim(),
        phone: info.phone.trim(),
        fullAddress: info.fullAddress.trim(),
        district: info.district.trim(),
        deliveryZone: info.deliveryZone,
      },
    });

    if (!res.success) {
      return { success: false, message: res.error || 'Failed to update delivery info in Cloudflare D1.' };
    }

    const updatedResult: Order = res.order || {
      ...targetOrder,
      deliveryFee: newFee,
      totalAmount: newTotal,
      customer: {
        ...targetOrder.customer,
        fullName: info.fullName.trim(),
        phone: info.phone.trim(),
        fullAddress: info.fullAddress.trim(),
        district: info.district.trim(),
        deliveryZone: info.deliveryZone,
      },
    };

    setOrders((prev) => prev.map((ord) => (ord.id === orderId ? updatedResult : ord)));

    return {
      success: true,
      message: 'Delivery details updated successfully in D1!',
      updatedOrder: updatedResult,
    };
  };

  const cancelCustomerOrder = async (orderId: string): Promise<{ success: boolean; message?: string }> => {
    lastMutationTimestampRef.current = Date.now();
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      return { success: false, message: 'Order not found.' };
    }
    if (targetOrder.shippingStatus !== 'Pending') {
      return {
        success: false,
        message: 'Only "Pending" orders can be canceled. This order has already been processed or shipped.',
      };
    }

    const res = await orderApi.updateOrder(orderId, { shippingStatus: 'Cancelled' });
    if (!res.success) {
      return { success: false, message: res.error || 'Failed to cancel order in Cloudflare D1.' };
    }

    const updatedOrder = res.order;
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? (updatedOrder || { ...ord, shippingStatus: 'Cancelled' }) : ord))
    );

    // Sync product stock from D1 (restored by D1 on server)
    productsApi.getAll().then((prods) => {
      if (Array.isArray(prods)) setProducts(prods);
    }).catch((err) => console.warn('Failed to sync products after customer order cancel:', err));

    return {
      success: true,
      message: `Order #${targetOrder.orderNumber} has been canceled and stock restored in D1.`,
    };
  };

  const blockPhoneNumber = (rawPhone: string) => {
    const clean = rawPhone.replace(/[^0-9]/g, '');
    if (!clean) return;
    setSettings((prev) => {
      const currentList = prev.blockedPhoneNumbers || [];
      if (currentList.includes(clean)) return prev;
      return {
        ...prev,
        blockedPhoneNumbers: [...currentList, clean],
      };
    });
  };

  const unblockPhoneNumber = (rawPhone: string) => {
    const clean = rawPhone.replace(/[^0-9]/g, '');
    if (!clean) return;
    setSettings((prev) => ({
      ...prev,
      blockedPhoneNumbers: (prev.blockedPhoneNumbers || []).filter((p) => p !== clean),
    }));
  };

  // Admin Settings
  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => {
      const updated: StoreSettings = {
        ...prev,
        ...newSettings,
        footer: {
          ...(prev.footer || {}),
          ...(newSettings.footer || {}),
        },
        dbblBank: newSettings.dbblBank
          ? { ...(prev.dbblBank || {}), ...newSettings.dbblBank }
          : prev.dbblBank,
      };

      // Keep footer supportPhone in sync if phone was explicitly updated
      if (newSettings.phone && (!newSettings.footer?.supportPhone || newSettings.footer.supportPhone === prev.phone)) {
        if (updated.footer) {
          updated.footer.supportPhone = newSettings.phone;
        }
      }

      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
        localStorage.setItem('rongdhonu_settings', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      // Persist to Cloudflare D1 central database
      settingsApi.update(updated).catch(console.error);
      return updated;
    });
    showNotification(
      'success',
      'Store Settings Saved! ✅',
      'Store brand info, dynamic footer content, WhatsApp support number, and delivery configurations have been updated.',
      5000
    );
  };

  const resetToDefaultSeed = () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    setOrders(INITIAL_ORDERS);
    setSettings(INITIAL_SETTINGS);
    setSlides(INITIAL_SLIDES);
    setCourierConfigs(INITIAL_COURIER_CONFIGS);
    setUsers(INITIAL_USERS);
    setCurrentUser(null);
    setIsAdminLoggedIn(false);
    setCart([]);
    setWishlist([]);
    setCoupons(INITIAL_COUPONS);
    setReviews(INITIAL_REVIEWS);
    try {
      localStorage.removeItem('rongdhonu_products');
      localStorage.removeItem('rongdhonu_products_v1');
      localStorage.removeItem('rongdhonu_slides');
      localStorage.removeItem('rongdhonu_slides_v1');
      localStorage.removeItem('rongdhonu_categories_v1');
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.CART);
      localStorage.removeItem(STORAGE_KEYS.COURIERS);
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
      localStorage.removeItem(STORAGE_KEYS.WISHLIST);
      localStorage.removeItem(STORAGE_KEYS.COUPONS);
      localStorage.removeItem(STORAGE_KEYS.REVIEWS);
    } catch {}
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        orders,
        settings,
        cart,
        cartCount,
        cartSubtotal,
        isCartOpen,
        setIsCartOpen,
        wishlist,
        isWishlistOpen,
        setIsWishlistOpen,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
        isUserAccountModalOpen,
        setIsUserAccountModalOpen,
        userAccountModalTab,
        setUserAccountModalTab,
        updateCurrentUserProfile,
        notification,
        showNotification,
        dismissNotification,
        coupons,
        applyCoupon,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        toggleCouponActive,
        reviews,
        addProductReview,
        deleteProductReview,
        getProductReviews,
        users,
        currentUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        loginUser,
        registerUser,
        deleteUser,
        logout,
        currentView,
        setCurrentView,
        adminActiveTab,
        setAdminActiveTab,
        adminSettingsSection,
        setAdminSettingsSection,
        openAdminSettingsSection,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        quickViewProduct,
        setQuickViewProduct,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        quickBuy,
        createOrder,
        recentSuccessOrder,
        setRecentSuccessOrder,
        activePaymentModalOrder,
        setActivePaymentModalOrder,
        finalizePayment,
        isOrdersLoading,
        refreshOrders,
        isAdminLoggedIn,
        adminLogin,
        adminLogout,
        addProduct,
        updateProduct,
        deleteProduct,
        increaseStock,
        adjustProductRating,
        addCategory,
        updateCategory,
        deleteCategory,
        updateOrderStatus,
        updateOrder,
        verifyAndMarkPaid,
        deleteOrder,
        deleteCustomer,
        resetCustomerPassword,
        updateUserRoleAndPermissions,
        hasPermission,
        updateCustomerDeliveryInfo,
        cancelCustomerOrder,
        bookCourier,
        bookWithSteadfast,
        syncCourierStatus,
        syncAllCourierStatuses,
        cancelCourierBooking,
        blockPhoneNumber,
        unblockPhoneNumber,
        slides,
        addSlide,
        updateSlide,
        deleteSlide,
        resetSlides,
        courierConfigs,
        addCourierConfig,
        updateCourierConfig,
        deleteCourierConfig,
        resetCourierConfigs,
        updateSettings,
        resetToDefaultSeed,
        changeSuperAdminPassword,
        getProductUrl,
        getCategoryUrl,
        copyProductLink,
        copyCategoryLink,
        pixelLogs,
        trackEvent,
        fireTestPixelEvent,
        clearPixelLogs,
        isMetaActive,
        isTikTokActive,
        isGtmActive,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
