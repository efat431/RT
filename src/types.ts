export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  description: string;
  imageUrl: string;
  images?: string[];
  stock: number;
  featured: boolean;
  rating: number;
  reviewsCount: number;
  specs?: string[];
  sizes?: string[];
  colors?: string[];
  sku?: string;
  status?: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName?: string;
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export type DeliveryZone = 'inside_dhaka' | 'outside_dhaka';

export interface CustomerInfo {
  fullName: string;
  phone: string;
  district: string;
  deliveryZone: DeliveryZone;
  fullAddress: string;
  notes?: string;
  email?: string;
  userId?: string;
}

export type PaymentMethod = 'dbbl' | 'cod' | 'card';

export type PaymentStatus = 'UNVERIFIED' | 'PAID' | 'DUE' | 'REFUNDED' | 'Paid' | 'Pending COD';

export type ShippingStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export type CourierProvider = string;

export interface CourierBooking {
  provider: string;
  waybillId: string;
  trackingUrl: string;
  consignmentId: string;
  bookedAt: string;
}

export interface CourierApiConfig {
  id: string;
  name: string;
  code: string;
  apiKey: string;
  secretKey?: string;
  baseUrl?: string;
  trackingUrlPattern: string;
  isActive: boolean;
  webhookSecret?: string;
  notes?: string;
}

export interface CarouselSlide {
  id: string;
  title: string;
  headline: string;
  subtext: string;
  tag: string;
  discountBadge: string;
  categoryId: string;
  imageUrl: string;
  accentGradient?: string;
  buttonText?: string;
}

export interface DbblPaymentDetails {
  senderBank: string;
  senderAccountOrPhone: string;
  transactionId: string;
  depositSlipUrl?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  authorName: string;
  author?: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  date?: string;
  verifiedPurchase?: boolean;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number;
  minSpend?: number;
  description: string;
  isActive: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  userEmail?: string;
  customer: CustomerInfo;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  couponCode?: string;
  discountAmount?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  dbblDetails?: DbblPaymentDetails;
  cardDetails?: {
    cardholderName: string;
    last4: string;
    cardBrand: string;
    savedForFuture?: boolean;
  };
  shippingStatus: ShippingStatus;
  courierBooking?: CourierBooking;
  // Direct Steadfast / Courier fields for 1-click live dispatch
  courierName?: string;
  courierWaybill?: string;
  consignmentId?: string;
  courierStatus?: string;
  lastCourierSync?: string;
  createdAt: string;
}

export interface DbblBankSettings {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  branchName: string;
  routingNumber: string;
  qrCodeUrl: string;
  instructions: string;
}

export interface FooterSettings {
  aboutText?: string;
  supportPhone?: string;
  supportEmail?: string;
  supportWhatsApp?: string;
  officeAddress?: string;
  supportHoursText?: string;
  categoriesTitle?: string;
  supportDeliveryTitle?: string;
  whatsAppButtonText?: string;
  deliveryInsideDhakaText?: string;
  deliveryOutsideDhakaText?: string;
  cashOnDeliveryText?: string;
  warrantyBadgeText?: string;
  acceptedPayments?: string[];
  courierPartners?: string[];
  showCourierPartners?: boolean;
  copyrightText?: string;
  privacyPolicyText?: string;
  termsOfServiceText?: string;
  returnRefundPolicyText?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
}

export interface StoreSettings {
  siteName: string;
  logoUrl: string;
  faviconUrl?: string;
  bannerUrl?: string;
  phone: string;
  address: string;
  insideDhakaFee: number;
  outsideDhakaFee: number;
  announcementText: string;
  bannerHeadline: string;
  bannerSubtext: string;
  currencySymbol: string;
  // Steadfast Courier API Direct Settings
  steadfastApiKey?: string;
  steadfastSecretKey?: string;
  // DBBL Bank Transfer & NexusPay Settings
  dbblBank?: DbblBankSettings;
  // Anti-Spam & Fraud Protection Settings
  antiSpamEnabled?: boolean;
  orderCooldownSeconds?: number;
  maxOrdersPerPhonePerDay?: number;
  blockedPhoneNumbers?: string[];
  // Dynamic Customizable Footer & Policies
  footer?: FooterSettings;
  // Marketing Pixels & Tracking Settings
  trackingEnabled?: boolean;
  fbPixelId?: string;
  fbTestEventCode?: string;
  tiktokPixelId?: string;
  tiktokTestEventCode?: string;
  gtmId?: string;
  advancedMatchingEnabled?: boolean;
  trackingDebugMode?: boolean;
  // Authoritative Hero Slider Aspect Ratio & Fit
  sliderAspectRatio?: string; // Master ratio across all devices, defaults to '1200 / 480' (5:2)
  bannerFitMode?: 'contain' | 'cover'; // Defaults to 'contain' to strictly preserve complete banner without cropping
}

export interface TrackingUserData {
  email?: string;
  phone?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  district?: string;
  deliveryZone?: string;
}

export interface PixelEventLog {
  id: string;
  timestamp: string;
  eventName: string;
  platforms: ('meta' | 'tiktok' | 'gtm')[];
  status: 'success' | 'queued' | 'skipped';
  hasUserData: boolean;
  userDataSummary?: string;
  value?: number;
  currency?: string;
  payload: Record<string, any>;
}

export type UserRole = 'super_admin' | 'admin' | 'sub_admin' | 'customer';

export interface AdminPermissions {
  canManageOrders: boolean;
  canManageProducts: boolean;
  canManageCategories: boolean;
  canManageAccounts: boolean;
  canManageSettings: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  permissions?: AdminPermissions;
  phone?: string;
  address?: string;
  district?: string;
  deliveryZone?: DeliveryZone;
  createdAt: string;
}

export interface ToastNotificationData {
  id: string;
  type: 'success' | 'info' | 'error' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

export const isMasterAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return clean === 'cmt413uec@gmail.com' || clean === 'efatmkt5@gmail.com' || clean === 'admin@rongdhonutrade.com';
};
