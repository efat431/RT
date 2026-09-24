import { Env } from './types';
import {
  initAllTables,
  // Products
  getAllProducts,
  getProductById,
  insertProduct,
  updateProductInD1,
  deleteProductFromD1,
  // Categories
  getAllCategories,
  getCategoryById,
  insertCategory,
  updateCategoryInD1,
  deleteCategoryFromD1,
  // Sliders
  getAllSliders,
  insertSlider,
  updateSliderInD1,
  deleteSliderFromD1,
  // Store Settings
  getStoreSettings,
  updateStoreSettingsInD1,
  // Coupons
  getAllCoupons,
  insertCoupon,
  updateCouponInD1,
  deleteCouponFromD1,
  // Reviews
  getAllReviews,
  insertReview,
  deleteReviewFromD1,
  // Users
  getAllUsers,
  getUserByEmailOrUsername,
  insertUser,
  updateUserInD1,
  updateUserPasswordInD1,
  deleteUserFromD1,
  rowToUser,
  // Orders
  getAllOrders,
  getOrderById,
  insertOrder,
  updateOrderInD1,
  deleteOrderFromD1,
} from './db';
import { Order, Product, Category, CarouselSlide, StoreSettings, Coupon, ProductReview, UserAccount, isMasterAdminEmail } from '../types';
import { verifyPassword, createAuthToken, verifyAuthToken, TokenPayload } from './auth';

/**
 * Standard JSON response helper with CORS and strong cache-busting headers
 */
function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Cache-Control',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

// In-memory initialization guard to avoid running schema creation on every request (PART 32)
let isInitialized = false;
let initPromise: Promise<void> | null = null;

async function ensureDatabaseInitialized(db: any): Promise<void> {
  if (isInitialized) return;
  if (!initPromise) {
    initPromise = initAllTables(db)
      .then(() => {
        isInitialized = true;
      })
      .catch((err) => {
        console.error('Failed to initialize D1 database schema:', err);
        initPromise = null; // Allow retry on failure
      });
  }
  return initPromise;
}

/**
 * Helper to extract and verify the authenticated user from the Authorization header
 */
async function getAuthenticatedUser(request: Request, env: Env): Promise<TokenPayload | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  const secret = env.ADMIN_SECRET || 'rongdhonu-secure-auth-secret-key-prod-d1-2026';
  return verifyAuthToken(token, secret);
}

/**
 * Handles all /api/* requests inside Cloudflare Worker or Cloudflare Pages Functions
 */
export async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Cache-Control',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // ==========================================
  // 0. HEALTH CHECK (PART 5)
  // ==========================================
  if (path === '/api/health') {
    if (!env.DB) {
      return jsonResponse({
        status: 'error',
        databaseBinding: 'missing',
        message: 'Cloudflare D1 database binding "DB" is not bound.',
        timestamp: new Date().toISOString(),
      }, 503);
    }

    try {
      const ping = await env.DB.prepare('SELECT 1 as alive').first<{ alive: number }>();
      const tablesRes = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all<{ name: string }>();
      const tableNames = (tablesRes.results || []).map((t) => t.name).filter((n) => !n.startsWith('sqlite_') && !n.startsWith('_cf_'));

      return jsonResponse({
        status: 'ok',
        databaseBinding: 'present',
        databaseQuery: ping?.alive === 1 ? 'connected' : 'unresponsive',
        databaseTarget: '3276795d-5593-42c0-8e14-947f3ab1172b',
        tablesCount: tableNames.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return jsonResponse({
        status: 'error',
        databaseBinding: 'present',
        databaseQuery: 'failed',
        error: err?.message || 'Database query failed',
        timestamp: new Date().toISOString(),
      }, 500);
    }
  }

  // Check if D1 database binding exists
  if (!env.DB) {
    return jsonResponse(
      { success: false, error: 'Cloudflare D1 database binding "DB" is not bound in environment.' },
      503
    );
  }

  // Ensure database tables exist (runs at most once per worker instance)
  await ensureDatabaseInitialized(env.DB);

  // ==========================================
  // AUTHENTICATION ROUTES (PART 25, 26, 27)
  // ==========================================
  if (path === '/api/auth/login' && method === 'POST') {
    try {
      const body = (await request.json().catch(() => ({}))) as any;
      const identifier = (body.usernameOrEmail || body.email || body.username || '').trim();
      const password = (body.password || '').trim();

      if (!identifier || !password) {
        return jsonResponse({ success: false, error: 'Email/Username and password are required.' }, 400);
      }

      // Check D1 for matching user
      let userRow = await getUserByEmailOrUsername(env.DB, identifier);

      // Master admin emergency fallback & auto-migration
      const isMaster = isMasterAdminEmail(identifier) || identifier.toLowerCase() === 'efatadmin' || identifier.toLowerCase() === 'admin';
      if (!userRow && isMaster && (password === 'Efat@#413' || password === 'admin123')) {
        // Auto-seed root master admin to D1
        const adminAccount = await insertUser(env.DB, {
          id: 'user-admin-efat',
          name: 'Efat Admin',
          email: identifier.includes('@') ? identifier.toLowerCase() : 'cmt413uec@gmail.com',
          password: password,
          role: 'super_admin',
          phone: '+8801518739561',
        });
        userRow = await getUserByEmailOrUsername(env.DB, adminAccount.email);
      }

      if (!userRow) {
        return jsonResponse({ success: false, error: 'Account not found with this email or username.' }, 401);
      }

      // Verify password securely using PBKDF2 Web Crypto
      const isValid = await verifyPassword(password, userRow.password || '');
      if (!isValid) {
        return jsonResponse({ success: false, error: 'Incorrect password. Please verify and try again.' }, 401);
      }

      // If user had plaintext password, upgrade to PBKDF2 hash immediately
      if (userRow.password && !userRow.password.startsWith('pbkdf2:')) {
        await updateUserPasswordInD1(env.DB, userRow.id, password);
      }

      const secret = env.ADMIN_SECRET || 'rongdhonu-secure-auth-secret-key-prod-d1-2026';
      const token = await createAuthToken(
        {
          userId: userRow.id,
          email: userRow.email,
          role: userRow.role,
        },
        secret
      );

      const sanitizedUser = rowToUser(userRow);
      return jsonResponse({
        success: true,
        message: 'Authentication successful',
        token,
        user: sanitizedUser,
      });
    } catch (err: any) {
      return jsonResponse({ success: false, error: err?.message || 'Login failed' }, 500);
    }
  }

  if (path === '/api/auth/me' && method === 'GET') {
    const authUser = await getAuthenticatedUser(request, env);
    if (!authUser) {
      return jsonResponse({ success: false, error: 'Unauthorized or token expired' }, 401);
    }

    const userRow = await getUserByEmailOrUsername(env.DB, authUser.email);
    if (!userRow) {
      return jsonResponse({ success: false, error: 'User no longer exists in D1' }, 404);
    }

    return jsonResponse({ success: true, user: rowToUser(userRow) });
  }

  if (path === '/api/auth/change-password' && method === 'POST') {
    const authUser = await getAuthenticatedUser(request, env);
    if (!authUser) {
      return jsonResponse({ success: false, error: 'Unauthorized. Please login.' }, 401);
    }

    const body = (await request.json().catch(() => ({}))) as any;
    const newPassword = (body.newPassword || '').trim();
    if (!newPassword || newPassword.length < 6) {
      return jsonResponse({ success: false, error: 'New password must be at least 6 characters long.' }, 400);
    }

    await updateUserPasswordInD1(env.DB, authUser.userId, newPassword);
    return jsonResponse({ success: true, message: 'Password updated successfully in Cloudflare D1.' });
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    return jsonResponse({ success: true, message: 'Logged out successfully.' });
  }

  // ==========================================
  // 1. PRODUCTS CRUD ROUTES
  // ==========================================
  if (path === '/api/products') {
    if (method === 'GET') {
      try {
        const category = url.searchParams.get('category') || undefined;
        const search = url.searchParams.get('search') || undefined;
        const featuredParam = url.searchParams.get('featured');
        const featured = featuredParam !== null ? featuredParam === 'true' || featuredParam === '1' : undefined;

        const products = await getAllProducts(env.DB, { category, search, featured });
        return jsonResponse({ success: true, count: products.length, products });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message || 'Failed to fetch products' }, 500);
      }
    }

    if (method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const productData = body.product || body;
        const created = await insertProduct(env.DB, productData);
        return jsonResponse({ success: true, product: created }, 201);
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message || 'Failed to create product' }, 500);
      }
    }
  }

  const productIdMatch = path.match(/^\/api\/products\/([^/]+)$/);
  if (productIdMatch) {
    const prodId = decodeURIComponent(productIdMatch[1]);

    if (method === 'GET') {
      try {
        const product = await getProductById(env.DB, prodId);
        if (!product) return jsonResponse({ success: false, error: 'Product not found' }, 404);
        return jsonResponse({ success: true, product });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message }, 500);
      }
    }

    if (method === 'PUT' || method === 'PATCH') {
      try {
        const body = (await request.json()) as any;
        const updates = body.updates || body.product || body;
        const updated = await updateProductInD1(env.DB, prodId, updates);
        return jsonResponse({ success: true, product: updated });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message || 'Failed to update product' }, 500);
      }
    }

    if (method === 'DELETE') {
      try {
        await deleteProductFromD1(env.DB, prodId);
        return jsonResponse({ success: true, message: `Product "${prodId}" deleted from D1.` });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message || 'Failed to delete product' }, 500);
      }
    }
  }

  // ==========================================
  // 2. CATEGORIES CRUD ROUTES
  // ==========================================
  if (path === '/api/categories') {
    if (method === 'GET') {
      try {
        const categories = await getAllCategories(env.DB);
        return jsonResponse({ success: true, count: categories.length, categories });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message || 'Failed to fetch categories' }, 500);
      }
    }

    if (method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const catData = body.category || body;
        const created = await insertCategory(env.DB, catData);
        return jsonResponse({ success: true, category: created }, 201);
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message || 'Failed to create category' }, 500);
      }
    }
  }

  const categoryIdMatch = path.match(/^\/api\/categories\/([^/]+)$/);
  if (categoryIdMatch) {
    const catId = decodeURIComponent(categoryIdMatch[1]);

    if (method === 'GET') {
      try {
        const category = await getCategoryById(env.DB, catId);
        if (!category) return jsonResponse({ success: false, error: 'Category not found' }, 404);
        return jsonResponse({ success: true, category });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message }, 500);
      }
    }

    if (method === 'PUT' || method === 'PATCH') {
      try {
        const body = (await request.json()) as any;
        const updates = body.updates || body.category || body;
        const updated = await updateCategoryInD1(env.DB, catId, updates);
        return jsonResponse({ success: true, category: updated });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message || 'Failed to update category' }, 500);
      }
    }

    if (method === 'DELETE') {
      try {
        await deleteCategoryFromD1(env.DB, catId);
        return jsonResponse({ success: true, message: `Category "${catId}" deleted from Cloudflare D1.` });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message || 'Failed to delete category' }, 500);
      }
    }
  }

  // ==========================================
  // 3. SLIDERS CRUD ROUTES
  // ==========================================
  if (path === '/api/sliders') {
    if (method === 'GET') {
      try {
        const sliders = await getAllSliders(env.DB);
        return jsonResponse({ success: true, count: sliders.length, sliders });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message || 'Failed to fetch sliders' }, 500);
      }
    }

    if (method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const slideData = body.slide || body;
        const created = await insertSlider(env.DB, slideData);
        return jsonResponse({ success: true, slider: created }, 201);
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message || 'Failed to create slider' }, 500);
      }
    }
  }

  const sliderIdMatch = path.match(/^\/api\/sliders\/([^/]+)$/);
  if (sliderIdMatch) {
    const slideId = decodeURIComponent(sliderIdMatch[1]);

    if (method === 'PUT' || method === 'PATCH') {
      try {
        const body = (await request.json()) as any;
        const updates = body.updates || body.slide || body;
        const updated = await updateSliderInD1(env.DB, slideId, updates);
        return jsonResponse({ success: true, slider: updated });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message }, 500);
      }
    }

    if (method === 'DELETE') {
      try {
        await deleteSliderFromD1(env.DB, slideId);
        return jsonResponse({ success: true, message: `Slider deleted from D1.` });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message }, 500);
      }
    }
  }

  // ==========================================
  // 4. STORE SETTINGS ROUTES (PART 22 SAFE PARTIALS)
  // ==========================================
  if (path === '/api/settings') {
    if (method === 'GET') {
      try {
        const settings = await getStoreSettings(env.DB);
        return jsonResponse({ success: true, settings });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message || 'Failed to fetch settings' }, 500);
      }
    }

    if (method === 'PUT' || method === 'PATCH' || method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const updates = body.settings || body;
        const updated = await updateStoreSettingsInD1(env.DB, updates);
        return jsonResponse({
          success: true,
          message: 'Website settings saved to Cloudflare D1 central database!',
          settings: updated,
        });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message || 'Failed to update settings' }, 500);
      }
    }
  }

  // ==========================================
  // 5. COUPONS CRUD ROUTES
  // ==========================================
  if (path === '/api/coupons') {
    if (method === 'GET') {
      try {
        const coupons = await getAllCoupons(env.DB);
        return jsonResponse({ success: true, coupons });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message }, 500);
      }
    }

    if (method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const couponData = body.coupon || body;
        const created = await insertCoupon(env.DB, couponData);
        return jsonResponse({ success: true, coupon: created }, 201);
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message }, 500);
      }
    }
  }

  const couponCodeMatch = path.match(/^\/api\/coupons\/([^/]+)$/);
  if (couponCodeMatch) {
    const code = decodeURIComponent(couponCodeMatch[1]);

    if (method === 'PUT' || method === 'PATCH') {
      try {
        const body = (await request.json()) as any;
        const updates = body.updates || body.coupon || body;
        const updated = await updateCouponInD1(env.DB, code, updates);
        return jsonResponse({ success: true, coupon: updated });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message }, 500);
      }
    }

    if (method === 'DELETE') {
      try {
        await deleteCouponFromD1(env.DB, code);
        return jsonResponse({ success: true, message: `Coupon deleted from D1.` });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message }, 500);
      }
    }
  }

  // ==========================================
  // 6. REVIEWS CRUD ROUTES
  // ==========================================
  if (path === '/api/reviews') {
    if (method === 'GET') {
      try {
        const productId = url.searchParams.get('productId') || undefined;
        const reviews = await getAllReviews(env.DB, productId);
        return jsonResponse({ success: true, reviews });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message }, 500);
      }
    }

    if (method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const reviewData = body.review || body;
        const created = await insertReview(env.DB, reviewData);
        return jsonResponse({ success: true, review: created }, 201);
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message }, 500);
      }
    }
  }

  const reviewIdMatch = path.match(/^\/api\/reviews\/([^/]+)$/);
  if (reviewIdMatch && method === 'DELETE') {
    const revId = decodeURIComponent(reviewIdMatch[1]);
    try {
      await deleteReviewFromD1(env.DB, revId);
      return jsonResponse({ success: true, message: `Review deleted from D1.` });
    } catch (err: any) {
      return jsonResponse({ success: false, error: err?.message }, 500);
    }
  }

  // ==========================================
  // 7. USERS CRUD ROUTES
  // ==========================================
  if (path === '/api/users') {
    if (method === 'GET') {
      try {
        const users = await getAllUsers(env.DB);
        return jsonResponse({ success: true, users });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message }, 500);
      }
    }

    if (method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const userData = body.user || body;
        const created = await insertUser(env.DB, userData);
        return jsonResponse({ success: true, user: created }, 201);
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message }, 500);
      }
    }
  }

  const userIdMatch = path.match(/^\/api\/users\/([^/]+)$/);
  if (userIdMatch) {
    const usrId = decodeURIComponent(userIdMatch[1]);

    if (method === 'PUT' || method === 'PATCH') {
      try {
        const body = (await request.json()) as any;
        const updates = body.updates || body.user || body;
        const updated = await updateUserInD1(env.DB, usrId, updates);
        return jsonResponse({ success: true, user: updated });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message }, 500);
      }
    }

    if (method === 'DELETE') {
      try {
        await deleteUserFromD1(env.DB, usrId);
        return jsonResponse({ success: true, message: `User deleted from D1.` });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message }, 500);
      }
    }
  }

  // ==========================================
  // 8. ORDERS CRUD ROUTES (AUTHORITATIVE D1)
  // ==========================================
  if (path === '/api/orders' && method === 'GET') {
    try {
      const search = url.searchParams.get('search') || undefined;
      const limitParam = url.searchParams.get('limit');
      const limit = limitParam ? parseInt(limitParam, 10) : undefined;

      const orders = await getAllOrders(env.DB, { search, limit });
      return jsonResponse({
        success: true,
        count: orders.length,
        orders,
      });
    } catch (err: any) {
      console.error('Error fetching orders from D1:', err);
      return jsonResponse({ success: false, error: err?.message || 'Failed to fetch orders from D1' }, 500);
    }
  }

  if (path === '/api/orders' && method === 'POST') {
    try {
      const body = (await request.json()) as { order?: Order } & Order;
      const orderData: Order = body.order || body;

      if (!orderData || !orderData.id || !orderData.orderNumber) {
        return jsonResponse({ success: false, error: 'Invalid order payload. Missing order id or orderNumber.' }, 400);
      }

      if (!orderData.customer?.fullName || !orderData.customer?.phone || !orderData.customer?.fullAddress) {
        return jsonResponse({ success: false, error: 'Missing required customer delivery information.' }, 400);
      }

      const saved = await insertOrder(env.DB, orderData);
      return jsonResponse(
        {
          success: true,
          message: `Order #${saved.orderNumber} successfully saved to Cloudflare D1 central database!`,
          order: saved,
        },
        201
      );
    } catch (err: any) {
      console.error('Error saving order to D1:', err);
      return jsonResponse({ success: false, error: err?.message || 'Failed to persist order to Cloudflare D1' }, 500);
    }
  }

  const orderIdMatch = path.match(/^\/api\/orders\/([^/]+)$/);
  if (orderIdMatch) {
    const orderId = decodeURIComponent(orderIdMatch[1]);

    if (method === 'GET') {
      try {
        const order = await getOrderById(env.DB, orderId);
        if (!order) return jsonResponse({ success: false, error: 'Order not found' }, 404);
        return jsonResponse({ success: true, order });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message }, 500);
      }
    }

    if (method === 'PATCH' || method === 'PUT') {
      try {
        const body = (await request.json()) as { updates?: Partial<Order> } & Partial<Order>;
        const updates: Partial<Order> = body.updates || body;
        const updated = await updateOrderInD1(env.DB, orderId, updates);
        return jsonResponse({
          success: true,
          message: `Order #${updated.orderNumber} successfully updated in Cloudflare D1!`,
          order: updated,
        });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message || 'Failed to update order in D1' }, 500);
      }
    }

    if (method === 'DELETE') {
      try {
        await deleteOrderFromD1(env.DB, orderId);
        return jsonResponse({
          success: true,
          message: `Order #${orderId} permanently removed from Cloudflare D1.`,
        });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message || 'Failed to delete order from D1' }, 500);
      }
    }
  }

  // ==========================================
  // 9. COURIER PROXY ROUTES (NO FAKE BOOKINGS - PART 29 & 30)
  // ==========================================
  if (path === '/api/courier/dispatch' && method === 'POST') {
    try {
      const body = (await request.json()) as any;
      const order = body.order as Order;

      // Check server env secrets or settings
      const settings = await getStoreSettings(env.DB);
      const apiKey = env.STEADFAST_API_KEY || settings.steadfastApiKey || body.apiKey;
      const secretKey = env.STEADFAST_SECRET_KEY || settings.steadfastSecretKey || body.secretKey;

      if (!apiKey || !secretKey) {
        return jsonResponse({
          success: false,
          error: 'Steadfast Courier API credentials are not configured. Please set STEADFAST_API_KEY and STEADFAST_SECRET_KEY in Cloudflare settings.',
        }, 400);
      }

      const steadfastPayload = {
        invoice: order.orderNumber,
        recipient_name: order.customer.fullName,
        recipient_phone: order.customer.phone,
        recipient_address: `${order.customer.fullAddress}, ${order.customer.district || ''}`,
        cod_amount: order.paymentStatus === 'PAID' || order.paymentStatus === 'Paid' ? 0 : order.totalAmount,
        note: order.customer.notes || `Order ${order.orderNumber} - Rongdhonu Trade`,
      };

      const sfRes = await fetch('https://portal.steadfast.com.bd/api/v1/create_order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey,
          'Secret-Key': secretKey,
        },
        body: JSON.stringify(steadfastPayload),
      });

      const sfData = (await sfRes.json().catch(() => ({}))) as any;

      if (sfRes.ok && (sfData.status === 200 || sfData.consignment)) {
        const consignment = sfData.consignment || sfData;
        return jsonResponse({
          success: true,
          tracking_code: consignment.tracking_code,
          consignment_id: String(consignment.consignment_id || consignment.id),
          data: sfData,
        });
      }

      return jsonResponse({
        success: false,
        error: sfData.message || sfData.errors || 'Steadfast API rejected order creation',
        data: sfData,
      }, 400);
    } catch (err: any) {
      return jsonResponse({ success: false, error: err?.message || 'Courier proxy request failed' }, 500);
    }
  }

  const courierStatusMatch = path.match(/^\/api\/courier\/status\/([^/]+)$/);
  if (courierStatusMatch && method === 'GET') {
    const cid = decodeURIComponent(courierStatusMatch[1]);
    const settings = await getStoreSettings(env.DB);
    const apiKey = env.STEADFAST_API_KEY || settings.steadfastApiKey;
    const secretKey = env.STEADFAST_SECRET_KEY || settings.steadfastSecretKey;

    if (!apiKey || !secretKey) {
      return jsonResponse({
        success: false,
        error: 'Steadfast credentials not configured on server.',
      }, 400);
    }

    try {
      const sfRes = await fetch(`https://portal.steadfast.com.bd/api/v1/status_by_cid/${cid}`, {
        headers: {
          'Api-Key': apiKey,
          'Secret-Key': secretKey,
        },
      });
      const sfData = await sfRes.json();
      return jsonResponse({ success: true, data: sfData });
    } catch (err: any) {
      return jsonResponse({ success: false, error: err?.message }, 500);
    }
  }

  return jsonResponse({ error: 'Endpoint not found', path }, 404);
}
