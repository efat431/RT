import {
  Product,
  Category,
  CarouselSlide,
  StoreSettings,
  Coupon,
  ProductReview,
  UserAccount,
} from '../types';
import { getAuthToken } from './authApi';

const API_BASE = '/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiRequest<T>(url: string, options?: RequestInit): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const token = getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string> || {}),
    };

    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: json.error || `HTTP ${res.status}: ${res.statusText}`,
      };
    }
    return {
      success: true,
      data: json as T,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error communicating with Cloudflare D1',
    };
  }
}

// ==========================================
// 1. PRODUCTS API
// ==========================================
export const productsApi = {
  async getAll(params?: { category?: string; search?: string; featured?: boolean }): Promise<Product[]> {
    const url = new URL(`${API_BASE}/products`, window.location.origin);
    if (params?.category) url.searchParams.set('category', params.category);
    if (params?.search) url.searchParams.set('search', params.search);
    if (params?.featured !== undefined) url.searchParams.set('featured', String(params.featured));

    const res = await apiRequest<{ success: boolean; products: Product[] }>(url.toString());
    if (res.success && res.data && Array.isArray(res.data.products)) {
      return res.data.products;
    }
    throw new Error(res.error || 'Failed to fetch products from D1');
  },

  async getById(id: string): Promise<Product | null> {
    const res = await apiRequest<{ success: boolean; product: Product }>(
      `${API_BASE}/products/${encodeURIComponent(id)}`
    );
    return res.success && res.data && res.data.product ? res.data.product : null;
  },

  async create(product: Partial<Product>): Promise<Product> {
    const res = await apiRequest<{ success: boolean; product: Product }>(`${API_BASE}/products`, {
      method: 'POST',
      body: JSON.stringify(product),
    });
    if (!res.success || !res.data?.product) {
      throw new Error(res.error || 'Failed to create product in D1');
    }
    return res.data.product;
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const res = await apiRequest<{ success: boolean; product: Product }>(
      `${API_BASE}/products/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
    if (!res.success || !res.data?.product) {
      throw new Error(res.error || 'Failed to update product in D1');
    }
    return res.data.product;
  },

  async delete(id: string): Promise<boolean> {
    const res = await apiRequest<{ success: boolean }>(`${API_BASE}/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.success) {
      throw new Error(res.error || 'Failed to delete product from D1');
    }
    return true;
  },
};

// ==========================================
// 2. CATEGORIES API
// ==========================================
export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    const res = await apiRequest<{ success: boolean; categories: Category[] }>(`${API_BASE}/categories`);
    if (res.success && res.data && Array.isArray(res.data.categories)) {
      return res.data.categories;
    }
    throw new Error(res.error || 'Failed to fetch categories from D1');
  },

  async create(category: Partial<Category>): Promise<Category> {
    const res = await apiRequest<{ success: boolean; category: Category }>(`${API_BASE}/categories`, {
      method: 'POST',
      body: JSON.stringify(category),
    });
    if (!res.success || !res.data?.category) {
      throw new Error(res.error || 'Failed to create category in D1');
    }
    return res.data.category;
  },

  async update(id: string, updates: Partial<Category>): Promise<Category> {
    const res = await apiRequest<{ success: boolean; category: Category }>(
      `${API_BASE}/categories/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
    if (!res.success || !res.data?.category) {
      throw new Error(res.error || 'Failed to update category in D1');
    }
    return res.data.category;
  },

  async delete(id: string): Promise<boolean> {
    const res = await apiRequest<{ success: boolean }>(`${API_BASE}/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.success) {
      throw new Error(res.error || 'Failed to delete category from D1');
    }
    return true;
  },
};

// ==========================================
// 3. SLIDERS API
// ==========================================
export const slidersApi = {
  async getAll(): Promise<CarouselSlide[]> {
    const res = await apiRequest<{ success: boolean; sliders: CarouselSlide[] }>(`${API_BASE}/sliders`);
    if (res.success && res.data && Array.isArray(res.data.sliders)) {
      return res.data.sliders;
    }
    throw new Error(res.error || 'Failed to fetch sliders from D1');
  },

  async create(slider: Partial<CarouselSlide>): Promise<CarouselSlide> {
    const res = await apiRequest<{ success: boolean; slider: CarouselSlide }>(`${API_BASE}/sliders`, {
      method: 'POST',
      body: JSON.stringify(slider),
    });
    if (!res.success || !res.data?.slider) {
      throw new Error(res.error || 'Failed to create slider in D1');
    }
    return res.data.slider;
  },

  async update(id: string, updates: Partial<CarouselSlide>): Promise<CarouselSlide> {
    const res = await apiRequest<{ success: boolean; slider: CarouselSlide }>(
      `${API_BASE}/sliders/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
    if (!res.success || !res.data?.slider) {
      throw new Error(res.error || 'Failed to update slider in D1');
    }
    return res.data.slider;
  },

  async delete(id: string): Promise<boolean> {
    const res = await apiRequest<{ success: boolean }>(`${API_BASE}/sliders/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.success) {
      throw new Error(res.error || 'Failed to delete slider from D1');
    }
    return true;
  },
};

// ==========================================
// 4. STORE SETTINGS API
// ==========================================
export const settingsApi = {
  async get(): Promise<StoreSettings> {
    const res = await apiRequest<{ success: boolean; settings: StoreSettings }>(`${API_BASE}/settings`);
    if (res.success && res.data?.settings) {
      return res.data.settings;
    }
    throw new Error(res.error || 'Failed to fetch settings from D1');
  },

  async update(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    const res = await apiRequest<{ success: boolean; settings: StoreSettings }>(`${API_BASE}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    if (!res.success || !res.data?.settings) {
      throw new Error(res.error || 'Failed to update settings in D1');
    }
    return res.data.settings;
  },
};

// ==========================================
// 5. COUPONS API
// ==========================================
export const couponsApi = {
  async getAll(): Promise<Coupon[]> {
    const res = await apiRequest<{ success: boolean; coupons: Coupon[] }>(`${API_BASE}/coupons`);
    if (res.success && res.data && Array.isArray(res.data.coupons)) {
      return res.data.coupons;
    }
    throw new Error(res.error || 'Failed to fetch coupons from D1');
  },

  async create(coupon: Coupon): Promise<Coupon> {
    const res = await apiRequest<{ success: boolean; coupon: Coupon }>(`${API_BASE}/coupons`, {
      method: 'POST',
      body: JSON.stringify(coupon),
    });
    if (!res.success || !res.data?.coupon) {
      throw new Error(res.error || 'Failed to create coupon in D1');
    }
    return res.data.coupon;
  },

  async update(code: string, updates: Partial<Coupon>): Promise<Coupon> {
    const res = await apiRequest<{ success: boolean; coupon: Coupon }>(
      `${API_BASE}/coupons/${encodeURIComponent(code)}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
    if (!res.success || !res.data?.coupon) {
      throw new Error(res.error || 'Failed to update coupon in D1');
    }
    return res.data.coupon;
  },

  async delete(code: string): Promise<boolean> {
    const res = await apiRequest<{ success: boolean }>(`${API_BASE}/coupons/${encodeURIComponent(code)}`, {
      method: 'DELETE',
    });
    if (!res.success) {
      throw new Error(res.error || 'Failed to delete coupon from D1');
    }
    return true;
  },
};

// ==========================================
// 6. REVIEWS API
// ==========================================
export const reviewsApi = {
  async getAll(productId?: string): Promise<ProductReview[]> {
    const url = new URL(`${API_BASE}/reviews`, window.location.origin);
    if (productId) url.searchParams.set('productId', productId);

    const res = await apiRequest<{ success: boolean; reviews: ProductReview[] }>(url.toString());
    if (res.success && res.data && Array.isArray(res.data.reviews)) {
      return res.data.reviews;
    }
    throw new Error(res.error || 'Failed to fetch reviews from D1');
  },

  async create(review: Partial<ProductReview>): Promise<ProductReview> {
    const res = await apiRequest<{ success: boolean; review: ProductReview }>(`${API_BASE}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
    });
    if (!res.success || !res.data?.review) {
      throw new Error(res.error || 'Failed to create review in D1');
    }
    return res.data.review;
  },

  async delete(id: string): Promise<boolean> {
    const res = await apiRequest<{ success: boolean }>(`${API_BASE}/reviews/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.success) {
      throw new Error(res.error || 'Failed to delete review from D1');
    }
    return true;
  },
};

// ==========================================
// 7. USERS API
// ==========================================
export const usersApi = {
  async getAll(): Promise<UserAccount[]> {
    const res = await apiRequest<{ success: boolean; users: UserAccount[] }>(`${API_BASE}/users`);
    if (res.success && res.data && Array.isArray(res.data.users)) {
      return res.data.users;
    }
    throw new Error(res.error || 'Failed to fetch users from D1');
  },

  async create(user: Partial<UserAccount>): Promise<UserAccount> {
    const res = await apiRequest<{ success: boolean; user: UserAccount }>(`${API_BASE}/users`, {
      method: 'POST',
      body: JSON.stringify(user),
    });
    if (!res.success || !res.data?.user) {
      throw new Error(res.error || 'Failed to create user in D1');
    }
    return res.data.user;
  },

  async update(id: string, updates: Partial<UserAccount>): Promise<UserAccount> {
    const res = await apiRequest<{ success: boolean; user: UserAccount }>(
      `${API_BASE}/users/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
    if (!res.success || !res.data?.user) {
      throw new Error(res.error || 'Failed to update user in D1');
    }
    return res.data.user;
  },

  async delete(id: string): Promise<boolean> {
    const res = await apiRequest<{ success: boolean }>(`${API_BASE}/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.success) {
      throw new Error(res.error || 'Failed to delete user from D1');
    }
    return true;
  },
};
