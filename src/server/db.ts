import {
  Order,
  Product,
  Category,
  CarouselSlide,
  StoreSettings,
  Coupon,
  ProductReview,
  UserAccount,
} from '../types';
import {
  D1Database,
  OrderRow,
  ProductRow,
  CategoryRow,
  SliderRow,
  StoreSettingsRow,
  CouponRow,
  ReviewRow,
  UserRow,
} from './types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_SLIDES,
  INITIAL_SETTINGS,
  INITIAL_COUPONS,
  INITIAL_REVIEWS,
  INITIAL_USERS,
} from '../data/seedData';
import { hashPassword } from './auth';

/**
 * Initializes all required D1 database tables and seeds initial store data if empty.
 */
export async function initAllTables(db: D1Database): Promise<void> {
  const schema = `
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      original_price REAL DEFAULT 0,
      category_id TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      images_json TEXT NOT NULL DEFAULT '[]',
      stock INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      rating REAL DEFAULT 5.0,
      reviews_count INTEGER DEFAULT 0,
      specs_json TEXT DEFAULT '[]',
      sizes_json TEXT DEFAULT '[]',
      colors_json TEXT DEFAULT '[]',
      sku TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      icon_name TEXT,
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sliders (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      headline TEXT NOT NULL,
      subtext TEXT DEFAULT '',
      tag TEXT DEFAULT '',
      discount_badge TEXT DEFAULT '',
      category_id TEXT DEFAULT '',
      image_url TEXT NOT NULL,
      accent_gradient TEXT DEFAULT '',
      button_text TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      settings_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      min_spend REAL DEFAULT 0,
      description TEXT DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      comment TEXT NOT NULL,
      verified_purchase INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT,
      role TEXT NOT NULL DEFAULT 'customer',
      permissions_json TEXT,
      phone TEXT,
      address TEXT,
      district TEXT,
      delivery_zone TEXT DEFAULT 'inside_dhaka',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      user_id TEXT,
      user_email TEXT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      customer_district TEXT,
      customer_zone TEXT DEFAULT 'inside_dhaka',
      customer_notes TEXT,
      items_json TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      delivery_fee REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      coupon_code TEXT,
      discount_amount REAL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'COD',
      payment_status TEXT NOT NULL DEFAULT 'Pending',
      transaction_id TEXT,
      shipping_status TEXT NOT NULL DEFAULT 'Pending',
      courier_name TEXT,
      courier_waybill TEXT,
      consignment_id TEXT,
      courier_status TEXT,
      courier_booking_json TEXT,
      dbbl_details_json TEXT,
      card_details_json TEXT,
      last_courier_sync TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await db.exec(schema);
  } catch (err) {
    console.error('Error ensuring D1 tables exist:', err);
  }

  // Seed default data if tables are empty
  try {
    // 1. Categories - ensure required categories exist without duplicates
    for (const cat of INITIAL_CATEGORIES) {
      const existingCat = await db.prepare('SELECT id FROM categories WHERE id = ? OR slug = ? LIMIT 1').bind(cat.id, cat.slug).first();
      if (!existingCat) {
        await insertCategory(db, cat);
      }
    }

    // 2. Products - ensure sample products exist without duplicates
    for (const prod of INITIAL_PRODUCTS) {
      const existingProd = await db.prepare('SELECT id FROM products WHERE id = ? OR title = ? LIMIT 1').bind(prod.id, prod.title).first();
      if (!existingProd) {
        await insertProduct(db, prod);
      }
    }

    // 3. Sliders
    const slideCheck = await db.prepare('SELECT count(*) as count FROM sliders').first<{ count: number }>();
    if (!slideCheck || slideCheck.count === 0) {
      for (const slide of INITIAL_SLIDES) {
        await insertSlider(db, slide);
      }
    }

    // 4. Store Settings
    const setCheck = await db.prepare('SELECT count(*) as count FROM store_settings').first<{ count: number }>();
    if (!setCheck || setCheck.count === 0) {
      await db
        .prepare('INSERT INTO store_settings (id, settings_json, updated_at) VALUES ("default", ?, CURRENT_TIMESTAMP)')
        .bind(JSON.stringify(INITIAL_SETTINGS))
        .run();
    }

    // 5. Coupons
    const couponCheck = await db.prepare('SELECT count(*) as count FROM coupons').first<{ count: number }>();
    if (!couponCheck || couponCheck.count === 0) {
      for (const c of INITIAL_COUPONS) {
        await insertCoupon(db, c);
      }
    }

    // 6. Reviews
    const revCheck = await db.prepare('SELECT count(*) as count FROM reviews').first<{ count: number }>();
    if (!revCheck || revCheck.count === 0) {
      for (const r of INITIAL_REVIEWS) {
        await insertReview(db, r);
      }
    }

    // 7. Users (seed with secure PBKDF2 hashed passwords)
    const userCheck = await db.prepare('SELECT count(*) as count FROM users').first<{ count: number }>();
    if (!userCheck || userCheck.count === 0) {
      for (const u of INITIAL_USERS) {
        const hashedPassword = u.password ? await hashPassword(u.password) : null;
        await db
          .prepare(`
            INSERT INTO users (
              id, name, email, password, role, permissions_json, phone, address, district, delivery_zone, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `)
          .bind(
            u.id,
            u.name,
            u.email.toLowerCase().trim(),
            hashedPassword,
            u.role,
            u.permissions ? JSON.stringify(u.permissions) : null,
            u.phone || null,
            u.address || null,
            u.district || null,
            u.deliveryZone || 'inside_dhaka',
            u.createdAt || new Date().toISOString()
          )
          .run();
      }
    }
  } catch (seedErr) {
    console.warn('Initial data seeding notice:', seedErr);
  }
}

// ==============================================================
// 1. PRODUCTS DATABASE OPERATIONS
// ==============================================================

export function rowToProduct(row: ProductRow): Product {
  let images: string[] = [];
  try {
    images = JSON.parse(row.images_json || '[]');
  } catch {
    images = row.image_url ? [row.image_url] : [];
  }

  let specs: any[] = [];
  try {
    specs = JSON.parse(row.specs_json || '[]');
  } catch {}

  let sizes: string[] = [];
  try {
    sizes = JSON.parse(row.sizes_json || '[]');
  } catch {}

  let colors: string[] = [];
  try {
    colors = JSON.parse(row.colors_json || '[]');
  } catch {}

  return {
    id: row.id,
    title: row.title,
    price: Number(row.price) || 0,
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    categoryId: row.category_id,
    description: row.description || '',
    imageUrl: row.image_url,
    images: images.length > 0 ? images : [row.image_url],
    stock: Number(row.stock) || 0,
    featured: Boolean(row.featured),
    rating: Number(row.rating) || 5.0,
    reviewsCount: Number(row.reviews_count) || 0,
    specs,
    sizes,
    colors,
    sku: row.sku || undefined,
    status: (row.status as any) || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllProducts(
  db: D1Database,
  filter?: { category?: string; search?: string; featured?: boolean }
): Promise<Product[]> {
  let query = 'SELECT * FROM products WHERE 1=1';
  const bindings: any[] = [];

  if (filter?.category && filter.category !== 'all') {
    query += ' AND category_id = ?';
    bindings.push(filter.category);
  }

  if (filter?.featured !== undefined) {
    query += ' AND featured = ?';
    bindings.push(filter.featured ? 1 : 0);
  }

  if (filter?.search) {
    query += ' AND (title LIKE ? OR description LIKE ? OR sku LIKE ?)';
    const s = `%${filter.search}%`;
    bindings.push(s, s, s);
  }

  query += ' ORDER BY created_at DESC';

  const stmt = db.prepare(query);
  const bound = bindings.length > 0 ? stmt.bind(...bindings) : stmt;
  const result = await bound.all<ProductRow>();

  if (!result.results) return [];
  return result.results.map(rowToProduct);
}

export async function getProductById(db: D1Database, id: string): Promise<Product | null> {
  const row = await db.prepare('SELECT * FROM products WHERE id = ? LIMIT 1').bind(id).first<ProductRow>();
  return row ? rowToProduct(row) : null;
}

export async function insertProduct(db: D1Database, input: any): Promise<Product> {
  const id = input.id || `prod-${Date.now()}`;

  // Check if product already exists to preserve stable records
  const existing = await db.prepare('SELECT id FROM products WHERE id = ?').bind(id).first();
  if (existing) {
    return updateProductInD1(db, id, input);
  }

  const title = (input.title || input.name || 'Untitled Product').trim();
  const price = Number(input.price) || 0;
  const originalPrice = input.originalPrice ?? input.oldPrice ?? null;
  const categoryId = input.categoryId || input.category || 'cat-mens-accessories';
  const description = input.description || '';
  const imageUrl = input.imageUrl || (Array.isArray(input.images) && input.images[0]) || '';
  const images = Array.isArray(input.images) && input.images.length > 0 ? input.images : (imageUrl ? [imageUrl] : []);
  const stock = Number(input.stock) || 0;
  const featured = input.featured ? 1 : 0;
  const rating = Number(input.rating) || 5.0;
  const reviewsCount = Number(input.reviewsCount) || 0;
  const specs = Array.isArray(input.specs) ? input.specs : [];
  const sizes = Array.isArray(input.sizes) ? input.sizes : [];
  const colors = Array.isArray(input.colors) ? input.colors : [];
  const sku = input.sku || null;
  const status = input.status || 'active';
  const createdAt = input.createdAt || new Date().toISOString();

  await db
    .prepare(`
      INSERT INTO products (
        id, title, price, original_price, category_id, description,
        image_url, images_json, stock, featured, rating, reviews_count,
        specs_json, sizes_json, colors_json, sku, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    .bind(
      id,
      title,
      price,
      originalPrice,
      categoryId,
      description,
      imageUrl,
      JSON.stringify(images),
      stock,
      featured,
      rating,
      reviewsCount,
      JSON.stringify(specs),
      JSON.stringify(sizes),
      JSON.stringify(colors),
      sku,
      status,
      createdAt
    )
    .run();

  const created = await getProductById(db, id);
  if (!created) throw new Error('Failed to retrieve newly created product from D1');
  return created;
}

export async function updateProductInD1(
  db: D1Database,
  id: string,
  updates: Partial<Product>
): Promise<Product> {
  const existing = await getProductById(db, id);
  if (!existing) {
    throw new Error(`Product with ID "${id}" does not exist in D1 database.`);
  }

  const title = updates.title !== undefined ? updates.title.trim() : existing.title;
  const price = updates.price !== undefined ? Number(updates.price) : existing.price;
  const originalPrice = updates.originalPrice !== undefined ? updates.originalPrice : (existing.originalPrice ?? null);
  const categoryId = updates.categoryId !== undefined ? updates.categoryId : existing.categoryId;
  const description = updates.description !== undefined ? updates.description : existing.description;
  const imageUrl = updates.imageUrl !== undefined ? updates.imageUrl : existing.imageUrl;
  const images = updates.images !== undefined ? updates.images : existing.images;
  const stock = updates.stock !== undefined ? Number(updates.stock) : existing.stock;
  const featured = updates.featured !== undefined ? (updates.featured ? 1 : 0) : (existing.featured ? 1 : 0);
  const rating = updates.rating !== undefined ? Number(updates.rating) : existing.rating;
  const reviewsCount = updates.reviewsCount !== undefined ? Number(updates.reviewsCount) : existing.reviewsCount;
  const specs = updates.specs !== undefined ? updates.specs : existing.specs;
  const sizes = updates.sizes !== undefined ? updates.sizes : existing.sizes;
  const colors = updates.colors !== undefined ? updates.colors : existing.colors;
  const sku = updates.sku !== undefined ? updates.sku : (existing.sku || null);
  const status = updates.status !== undefined ? updates.status : (existing.status || 'active');

  await db
    .prepare(`
      UPDATE products SET
        title = ?,
        price = ?,
        original_price = ?,
        category_id = ?,
        description = ?,
        image_url = ?,
        images_json = ?,
        stock = ?,
        featured = ?,
        rating = ?,
        reviews_count = ?,
        specs_json = ?,
        sizes_json = ?,
        colors_json = ?,
        sku = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(
      title,
      price,
      originalPrice,
      categoryId,
      description,
      imageUrl,
      JSON.stringify(images),
      stock,
      featured,
      rating,
      reviewsCount,
      JSON.stringify(specs),
      JSON.stringify(sizes),
      JSON.stringify(colors),
      sku,
      status,
      id
    )
    .run();

  const updated = await getProductById(db, id);
  if (!updated) throw new Error('Failed to retrieve updated product');
  return updated;
}

export async function deleteProductFromD1(db: D1Database, id: string): Promise<boolean> {
  const res = await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
  return res.success;
}

// ==============================================================
// 2. CATEGORIES DATABASE OPERATIONS
// ==============================================================

export function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    iconName: row.icon_name || undefined,
    description: row.description || '',
  };
}

export async function getAllCategories(db: D1Database): Promise<Category[]> {
  const result = await db.prepare('SELECT * FROM categories ORDER BY name ASC').all<CategoryRow>();
  return (result.results || []).map(rowToCategory);
}

export async function getCategoryById(db: D1Database, idOrSlug: string): Promise<Category | null> {
  const query = 'SELECT * FROM categories WHERE id = ? OR slug = ? LIMIT 1';
  const row = await db.prepare(query).bind(idOrSlug, idOrSlug).first<CategoryRow>();
  return row ? rowToCategory(row) : null;
}

export async function insertCategory(db: D1Database, input: any): Promise<Category> {
  const id = input.id || `cat-${Date.now()}`;

  const existing = await db.prepare('SELECT id FROM categories WHERE id = ?').bind(id).first();
  if (existing) {
    return updateCategoryInD1(db, id, input);
  }

  const name = (input.name || 'Untitled Category').trim();
  const slug = (input.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).trim();
  const iconName = input.iconName || null;
  const description = input.description || '';
  const createdAt = input.createdAt || new Date().toISOString();

  await db
    .prepare(`
      INSERT INTO categories (id, name, slug, icon_name, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    .bind(id, name, slug, iconName, description, createdAt)
    .run();

  const created = await getCategoryById(db, id);
  if (!created) throw new Error('Failed to retrieve inserted category');
  return created;
}

export async function updateCategoryInD1(db: D1Database, id: string, updates: Partial<Category>): Promise<Category> {
  const existing = await getCategoryById(db, id);
  if (!existing) throw new Error(`Category with ID "${id}" not found`);

  const name = updates.name !== undefined ? updates.name.trim() : existing.name;
  const slug = updates.slug !== undefined ? updates.slug.trim() : existing.slug;
  const iconName = updates.iconName !== undefined ? updates.iconName : existing.iconName;
  const description = updates.description !== undefined ? updates.description : existing.description;

  await db
    .prepare(`
      UPDATE categories SET
        name = ?,
        slug = ?,
        icon_name = ?,
        description = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(name, slug, iconName || null, description || null, id)
    .run();

  const updated = await getCategoryById(db, id);
  if (!updated) throw new Error('Failed to retrieve updated category');
  return updated;
}

export async function deleteCategoryFromD1(db: D1Database, id: string): Promise<boolean> {
  const res = await db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
  return res.success;
}

// ==============================================================
// 3. SLIDERS / HERO BANNERS DATABASE OPERATIONS
// ==============================================================

export function rowToSlider(row: SliderRow): CarouselSlide {
  return {
    id: row.id,
    title: row.title,
    headline: row.headline,
    subtext: row.subtext || '',
    tag: row.tag || '',
    discountBadge: row.discount_badge || '',
    categoryId: row.category_id || '',
    imageUrl: row.image_url,
    accentGradient: row.accent_gradient || undefined,
    buttonText: row.button_text || undefined,
  };
}

export async function getAllSliders(db: D1Database): Promise<CarouselSlide[]> {
  const result = await db.prepare('SELECT * FROM sliders ORDER BY sort_order ASC, created_at ASC').all<SliderRow>();
  return (result.results || []).map(rowToSlider);
}

export async function insertSlider(db: D1Database, input: any): Promise<CarouselSlide> {
  const id = input.id || `slide-${Date.now()}`;

  const existing = await db.prepare('SELECT id FROM sliders WHERE id = ?').bind(id).first();
  if (existing) {
    return updateSliderInD1(db, id, input);
  }

  const title = (input.title || '').trim();
  const headline = (input.headline || '').trim();
  const subtext = input.subtext || '';
  const tag = input.tag || '';
  const discountBadge = input.discountBadge || '';
  const categoryId = input.categoryId || '';
  const imageUrl = input.imageUrl || '';
  const accentGradient = input.accentGradient || '';
  const buttonText = input.buttonText || 'Shop Now';
  const sortOrder = Number(input.sortOrder) || 0;

  await db
    .prepare(`
      INSERT INTO sliders (
        id, title, headline, subtext, tag, discount_badge, category_id,
        image_url, accent_gradient, button_text, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `)
    .bind(
      id,
      title,
      headline,
      subtext,
      tag,
      discountBadge,
      categoryId,
      imageUrl,
      accentGradient,
      buttonText,
      sortOrder
    )
    .run();

  const row = await db.prepare('SELECT * FROM sliders WHERE id = ?').bind(id).first<SliderRow>();
  if (!row) throw new Error('Failed to retrieve inserted slider');
  return rowToSlider(row);
}

export async function updateSliderInD1(db: D1Database, id: string, updates: Partial<CarouselSlide>): Promise<CarouselSlide> {
  const existing = await db.prepare('SELECT * FROM sliders WHERE id = ?').bind(id).first<SliderRow>();
  if (!existing) throw new Error(`Slider with ID "${id}" not found`);

  const current = rowToSlider(existing);
  const title = updates.title ?? current.title;
  const headline = updates.headline ?? current.headline;
  const subtext = updates.subtext ?? current.subtext;
  const tag = updates.tag ?? current.tag;
  const discountBadge = updates.discountBadge ?? current.discountBadge;
  const categoryId = updates.categoryId ?? current.categoryId;
  const imageUrl = updates.imageUrl ?? current.imageUrl;
  const accentGradient = updates.accentGradient ?? current.accentGradient;
  const buttonText = updates.buttonText ?? current.buttonText;

  await db
    .prepare(`
      UPDATE sliders SET
        title = ?,
        headline = ?,
        subtext = ?,
        tag = ?,
        discount_badge = ?,
        category_id = ?,
        image_url = ?,
        accent_gradient = ?,
        button_text = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(
      title,
      headline,
      subtext,
      tag,
      discountBadge,
      categoryId,
      imageUrl,
      accentGradient || null,
      buttonText || null,
      id
    )
    .run();

  const row = await db.prepare('SELECT * FROM sliders WHERE id = ?').bind(id).first<SliderRow>();
  if (!row) throw new Error('Failed to retrieve updated slider');
  return rowToSlider(row);
}

export async function deleteSliderFromD1(db: D1Database, id: string): Promise<boolean> {
  const res = await db.prepare('DELETE FROM sliders WHERE id = ?').bind(id).run();
  return res.success;
}

// ==============================================================
// 4. STORE SETTINGS DATABASE OPERATIONS (SAFE PARTIAL UPDATES)
// ==============================================================

export async function getStoreSettings(db: D1Database): Promise<StoreSettings> {
  const row = await db.prepare('SELECT settings_json FROM store_settings WHERE id = "default" LIMIT 1').first<StoreSettingsRow>();
  if (!row || !row.settings_json) {
    return INITIAL_SETTINGS;
  }
  try {
    const parsed = JSON.parse(row.settings_json);
    return {
      ...INITIAL_SETTINGS,
      ...parsed,
      dbblBank: { ...INITIAL_SETTINGS.dbblBank, ...(parsed.dbblBank || {}) },
      footer: { ...INITIAL_SETTINGS.footer, ...(parsed.footer || {}) },
    };
  } catch {
    return INITIAL_SETTINGS;
  }
}

export async function updateStoreSettingsInD1(db: D1Database, updates: Partial<StoreSettings>): Promise<StoreSettings> {
  const current = await getStoreSettings(db);
  const merged: StoreSettings = {
    ...current,
    ...updates,
    dbblBank: updates.dbblBank ? { ...current.dbblBank, ...updates.dbblBank } : current.dbblBank,
    footer: updates.footer ? { ...current.footer, ...updates.footer } : current.footer,
    blockedPhoneNumbers: updates.blockedPhoneNumbers !== undefined ? updates.blockedPhoneNumbers : current.blockedPhoneNumbers,
  };

  const existing = await db.prepare('SELECT id FROM store_settings WHERE id = "default"').first();
  if (existing) {
    await db
      .prepare('UPDATE store_settings SET settings_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = "default"')
      .bind(JSON.stringify(merged))
      .run();
  } else {
    await db
      .prepare('INSERT INTO store_settings (id, settings_json, updated_at) VALUES ("default", ?, CURRENT_TIMESTAMP)')
      .bind(JSON.stringify(merged))
      .run();
  }

  return merged;
}

// ==============================================================
// 5. COUPONS / VOUCHERS DATABASE OPERATIONS
// ==============================================================

export function rowToCoupon(row: CouponRow): Coupon {
  return {
    code: row.code,
    discountType: row.discount_type as any,
    discountValue: Number(row.discount_value) || 0,
    minSpend: row.min_spend != null ? Number(row.min_spend) : undefined,
    description: row.description || '',
    isActive: Boolean(row.is_active),
  };
}

export async function getAllCoupons(db: D1Database): Promise<Coupon[]> {
  const result = await db.prepare('SELECT * FROM coupons ORDER BY code ASC').all<CouponRow>();
  return (result.results || []).map(rowToCoupon);
}

export async function insertCoupon(db: D1Database, coupon: Coupon): Promise<Coupon> {
  const code = coupon.code.toUpperCase().trim();

  const existing = await db.prepare('SELECT code FROM coupons WHERE code = ?').bind(code).first();
  if (existing) {
    return updateCouponInD1(db, code, coupon);
  }

  await db
    .prepare(`
      INSERT INTO coupons (code, discount_type, discount_value, min_spend, description, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    .bind(
      code,
      coupon.discountType,
      Number(coupon.discountValue) || 0,
      coupon.minSpend != null ? Number(coupon.minSpend) : null,
      coupon.description || '',
      coupon.isActive ? 1 : 0
    )
    .run();

  const row = await db.prepare('SELECT * FROM coupons WHERE code = ?').bind(code).first<CouponRow>();
  if (!row) throw new Error('Failed to retrieve inserted coupon');
  return rowToCoupon(row);
}

export async function updateCouponInD1(db: D1Database, code: string, updates: Partial<Coupon>): Promise<Coupon> {
  const existing = await db.prepare('SELECT * FROM coupons WHERE code = ?').bind(code).first<CouponRow>();
  if (!existing) throw new Error(`Coupon with code "${code}" not found`);

  const current = rowToCoupon(existing);
  const discountType = updates.discountType ?? current.discountType;
  const discountValue = updates.discountValue != null ? Number(updates.discountValue) : current.discountValue;
  const minSpend = updates.minSpend !== undefined ? (updates.minSpend != null ? Number(updates.minSpend) : null) : (current.minSpend ?? null);
  const description = updates.description ?? current.description;
  const isActive = updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : (current.isActive ? 1 : 0);

  await db
    .prepare(`
      UPDATE coupons SET
        discount_type = ?,
        discount_value = ?,
        min_spend = ?,
        description = ?,
        is_active = ?
      WHERE code = ?
    `)
    .bind(discountType, discountValue, minSpend, description, isActive, code)
    .run();

  const row = await db.prepare('SELECT * FROM coupons WHERE code = ?').bind(code).first<CouponRow>();
  if (!row) throw new Error('Failed to retrieve updated coupon');
  return rowToCoupon(row);
}

export async function deleteCouponFromD1(db: D1Database, code: string): Promise<boolean> {
  const res = await db.prepare('DELETE FROM coupons WHERE code = ?').bind(code).run();
  return res.success;
}

// ==============================================================
// 6. PRODUCT REVIEWS DATABASE OPERATIONS
// ==============================================================

export function rowToReview(row: ReviewRow): ProductReview {
  return {
    id: row.id,
    productId: row.product_id,
    authorName: row.author_name,
    rating: Number(row.rating) || 5,
    comment: row.comment,
    verifiedPurchase: Boolean(row.verified_purchase),
    createdAt: row.created_at,
  };
}

export async function getAllReviews(db: D1Database, productId?: string): Promise<ProductReview[]> {
  let query = 'SELECT * FROM reviews';
  const bindings: any[] = [];

  if (productId) {
    query += ' WHERE product_id = ?';
    bindings.push(productId);
  }
  query += ' ORDER BY created_at DESC';

  const stmt = db.prepare(query);
  const bound = bindings.length > 0 ? stmt.bind(...bindings) : stmt;
  const result = await bound.all<ReviewRow>();

  return (result.results || []).map(rowToReview);
}

export async function insertReview(db: D1Database, input: any): Promise<ProductReview> {
  const id = input.id || `rev-${Date.now()}`;
  const productId = input.productId;
  const authorName = (input.authorName || input.author || 'Customer').trim();
  const rating = Math.min(5, Math.max(1, Number(input.rating) || 5));
  const comment = input.comment || '';
  const verifiedPurchase = input.verifiedPurchase !== false ? 1 : 0;
  const createdAt = input.createdAt || new Date().toISOString();

  await db
    .prepare(`
      INSERT INTO reviews (id, product_id, author_name, rating, comment, verified_purchase, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(id, productId, authorName, rating, comment, verifiedPurchase, createdAt)
    .run();

  const row = await db.prepare('SELECT * FROM reviews WHERE id = ?').bind(id).first<ReviewRow>();
  if (!row) throw new Error('Failed to retrieve inserted review');
  return rowToReview(row);
}

export async function deleteReviewFromD1(db: D1Database, id: string): Promise<boolean> {
  const res = await db.prepare('DELETE FROM reviews WHERE id = ?').bind(id).run();
  return res.success;
}

// ==============================================================
// 7. USERS DATABASE OPERATIONS (SECURE HASHING & SANITIZATION)
// ==============================================================

export function rowToUser(row: UserRow): UserAccount {
  let permissions = undefined;
  if (row.permissions_json) {
    try {
      permissions = JSON.parse(row.permissions_json);
    } catch {}
  }

  // Never leak password or password hash to frontend
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: (row.role as any) || 'customer',
    permissions,
    phone: row.phone || undefined,
    address: row.address || undefined,
    district: row.district || undefined,
    deliveryZone: (row.delivery_zone as any) || undefined,
    createdAt: row.created_at,
  };
}

export async function getAllUsers(db: D1Database): Promise<UserAccount[]> {
  const result = await db.prepare('SELECT * FROM users ORDER BY created_at ASC').all<UserRow>();
  return (result.results || []).map(rowToUser);
}

export async function getUserByEmailOrUsername(db: D1Database, identifier: string): Promise<UserRow | null> {
  const clean = identifier.toLowerCase().trim();
  const query = 'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(name) = ? OR id = ? LIMIT 1';
  return db.prepare(query).bind(clean, clean, identifier).first<UserRow>();
}

export async function insertUser(db: D1Database, input: any): Promise<UserAccount> {
  const id = input.id || `user-${Date.now()}`;

  const existing = await db.prepare('SELECT id FROM users WHERE id = ?').bind(id).first();
  if (existing) {
    return updateUserInD1(db, id, input);
  }

  const name = (input.name || 'User').trim();
  const email = (input.email || '').toLowerCase().trim();
  // Hash password if supplied
  const password = input.password ? await hashPassword(input.password) : null;
  const role = input.role || 'customer';
  const permissions = input.permissions ? JSON.stringify(input.permissions) : null;
  const phone = input.phone || null;
  const address = input.address || null;
  const district = input.district || null;
  const deliveryZone = input.deliveryZone || 'inside_dhaka';
  const createdAt = input.createdAt || new Date().toISOString();

  await db
    .prepare(`
      INSERT INTO users (
        id, name, email, password, role, permissions_json, phone, address, district, delivery_zone, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
    .bind(id, name, email, password, role, permissions, phone, address, district, deliveryZone, createdAt)
    .run();

  const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
  if (!row) throw new Error('Failed to retrieve inserted user');
  return rowToUser(row);
}

export async function updateUserInD1(db: D1Database, id: string, updates: Partial<UserAccount> & { password?: string }): Promise<UserAccount> {
  const existing = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
  if (!existing) throw new Error(`User with ID "${id}" not found`);

  const current = rowToUser(existing);
  const name = updates.name !== undefined ? updates.name.trim() : current.name;
  const email = updates.email !== undefined ? updates.email.toLowerCase().trim() : current.email;
  // Hash new password if updated
  const password = updates.password ? await hashPassword(updates.password) : (existing.password || null);
  const role = updates.role ?? current.role;
  const permissions = updates.permissions !== undefined ? JSON.stringify(updates.permissions) : existing.permissions_json;
  const phone = updates.phone !== undefined ? updates.phone : (current.phone || null);
  const address = updates.address !== undefined ? updates.address : (current.address || null);
  const district = updates.district !== undefined ? updates.district : (current.district || null);
  const deliveryZone = updates.deliveryZone !== undefined ? updates.deliveryZone : (current.deliveryZone || 'inside_dhaka');

  await db
    .prepare(`
      UPDATE users SET
        name = ?,
        email = ?,
        password = ?,
        role = ?,
        permissions_json = ?,
        phone = ?,
        address = ?,
        district = ?,
        delivery_zone = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(name, email, password, role, permissions, phone, address, district, deliveryZone, id)
    .run();

  const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
  if (!row) throw new Error('Failed to retrieve updated user');
  return rowToUser(row);
}

export async function updateUserPasswordInD1(db: D1Database, id: string, newPasswordPlain: string): Promise<boolean> {
  const hashedPassword = await hashPassword(newPasswordPlain);
  const res = await db
    .prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(hashedPassword, id)
    .run();
  return res.success;
}

export async function deleteUserFromD1(db: D1Database, id: string): Promise<boolean> {
  const res = await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
  return res.success;
}

// ==============================================================
// 8. ORDERS DATABASE OPERATIONS (ATOMIC TRANSACTIONS & STOCK INTEGRITY)
// ==============================================================

export function rowToOrder(row: OrderRow): Order {
  let items = [];
  try {
    items = JSON.parse(row.items_json || '[]');
  } catch (e) {
    items = [];
  }

  let courierBooking = undefined;
  if (row.courier_booking_json) {
    try {
      courierBooking = JSON.parse(row.courier_booking_json);
    } catch {}
  }

  let dbblDetails = undefined;
  if (row.dbbl_details_json) {
    try {
      dbblDetails = JSON.parse(row.dbbl_details_json);
    } catch {}
  }

  let cardDetails = undefined;
  if (row.card_details_json) {
    try {
      cardDetails = JSON.parse(row.card_details_json);
    } catch {}
  }

  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id || undefined,
    userEmail: row.user_email || undefined,
    customer: {
      fullName: row.customer_name,
      phone: row.customer_phone,
      fullAddress: row.customer_address,
      district: row.customer_district || '',
      deliveryZone: (row.customer_zone as any) || 'inside_dhaka',
      notes: row.customer_notes || undefined,
    },
    items,
    subtotal: Number(row.subtotal) || 0,
    deliveryFee: Number(row.delivery_fee) || 0,
    totalAmount: Number(row.total_amount) || 0,
    couponCode: row.coupon_code || undefined,
    discountAmount: Number(row.discount_amount) || 0,
    paymentMethod: (row.payment_method as any) || 'COD',
    paymentStatus: (row.payment_status as any) || 'Pending',
    transactionId: row.transaction_id || undefined,
    shippingStatus: (row.shipping_status as any) || 'Pending',
    courierName: row.courier_name || undefined,
    courierWaybill: row.courier_waybill || undefined,
    consignmentId: row.consignment_id || undefined,
    courierStatus: row.courier_status || undefined,
    courierBooking,
    dbblDetails,
    cardDetails,
    lastCourierSync: row.last_courier_sync || undefined,
    createdAt: row.created_at,
  };
}

export async function getAllOrders(
  db: D1Database,
  options?: { limit?: number; search?: string }
): Promise<Order[]> {
  let query = 'SELECT * FROM orders ORDER BY created_at DESC';
  const bindings: any[] = [];

  if (options?.search) {
    const s = `%${options.search}%`;
    query = `
      SELECT * FROM orders 
      WHERE order_number LIKE ? 
         OR customer_phone LIKE ? 
         OR customer_name LIKE ?
         OR transaction_id LIKE ?
         OR courier_waybill LIKE ?
         OR consignment_id LIKE ?
      ORDER BY created_at DESC
    `;
    bindings.push(s, s, s, s, s, s);
  }

  if (options?.limit && options.limit > 0) {
    query += ' LIMIT ?';
    bindings.push(options.limit);
  }

  const stmt = db.prepare(query);
  const bound = bindings.length > 0 ? stmt.bind(...bindings) : stmt;
  const result = await bound.all<OrderRow>();

  if (!result.results) return [];
  return result.results.map(rowToOrder);
}

export async function getOrderById(db: D1Database, idOrNumber: string): Promise<Order | null> {
  const query = 'SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1';
  const row = await db.prepare(query).bind(idOrNumber, idOrNumber).first<OrderRow>();
  return row ? rowToOrder(row) : null;
}

export async function insertOrder(db: D1Database, order: Order): Promise<Order> {
  // Check if order already exists to avoid duplicate stock reduction or overwrite
  const existing = await getOrderById(db, order.id);
  if (existing) {
    return updateOrderInD1(db, order.id, order);
  }

  const insertSql = `
    INSERT INTO orders (
      id, order_number, user_id, user_email,
      customer_name, customer_phone, customer_address, customer_district, customer_zone, customer_notes,
      items_json, subtotal, delivery_fee, total_amount, coupon_code, discount_amount,
      payment_method, payment_status, transaction_id,
      shipping_status, courier_name, courier_waybill, consignment_id, courier_status,
      courier_booking_json, dbbl_details_json, card_details_json, last_courier_sync,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, CURRENT_TIMESTAMP
    );
  `;

  await db
    .prepare(insertSql)
    .bind(
      order.id,
      order.orderNumber,
      order.userId || null,
      order.userEmail || null,
      order.customer.fullName,
      order.customer.phone,
      order.customer.fullAddress,
      order.customer.district || null,
      order.customer.deliveryZone || 'inside_dhaka',
      order.customer.notes || null,
      JSON.stringify(order.items || []),
      order.subtotal || 0,
      order.deliveryFee || 0,
      order.totalAmount || 0,
      order.couponCode || null,
      order.discountAmount || 0,
      order.paymentMethod || 'COD',
      order.paymentStatus || 'Pending',
      order.transactionId || null,
      order.shippingStatus || 'Pending',
      order.courierName || null,
      order.courierWaybill || null,
      order.consignmentId || null,
      order.courierStatus || null,
      order.courierBooking ? JSON.stringify(order.courierBooking) : null,
      order.dbblDetails ? JSON.stringify(order.dbblDetails) : null,
      order.cardDetails ? JSON.stringify(order.cardDetails) : null,
      order.lastCourierSync || null,
      order.createdAt || new Date().toISOString()
    )
    .run();

  const saved = await getOrderById(db, order.id);
  if (!saved) throw new Error('Failed to retrieve newly created order from D1');

  // Atomically decrease product stock in D1 for ordered items
  if (Array.isArray(order.items)) {
    for (const it of order.items) {
      if (it?.product?.id && it.quantity > 0) {
        try {
          await db
            .prepare('UPDATE products SET stock = MAX(0, stock - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .bind(it.quantity, it.product.id)
            .run();
        } catch (stockErr) {
          console.warn('Failed to deduct stock in D1 for product:', it.product.id, stockErr);
        }
      }
    }
  }

  return saved;
}

export async function updateOrderInD1(
  db: D1Database,
  id: string,
  updates: Partial<Order>
): Promise<Order> {
  const existing = await getOrderById(db, id);
  if (!existing) {
    throw new Error(`Order with ID "${id}" does not exist in D1 database.`);
  }

  const merged: Order = {
    ...existing,
    ...updates,
    customer: updates.customer ? { ...existing.customer, ...updates.customer } : existing.customer,
    dbblDetails: updates.dbblDetails !== undefined ? updates.dbblDetails : existing.dbblDetails,
    courierBooking: updates.courierBooking !== undefined ? updates.courierBooking : existing.courierBooking,
  };

  const updateSql = `
    UPDATE orders SET
      customer_name = ?,
      customer_phone = ?,
      customer_address = ?,
      customer_district = ?,
      customer_zone = ?,
      customer_notes = ?,
      subtotal = ?,
      delivery_fee = ?,
      total_amount = ?,
      coupon_code = ?,
      discount_amount = ?,
      payment_method = ?,
      payment_status = ?,
      transaction_id = ?,
      shipping_status = ?,
      courier_name = ?,
      courier_waybill = ?,
      consignment_id = ?,
      courier_status = ?,
      courier_booking_json = ?,
      dbbl_details_json = ?,
      card_details_json = ?,
      last_courier_sync = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?;
  `;

  await db
    .prepare(updateSql)
    .bind(
      merged.customer.fullName,
      merged.customer.phone,
      merged.customer.fullAddress,
      merged.customer.district || null,
      merged.customer.deliveryZone || 'inside_dhaka',
      merged.customer.notes || null,
      merged.subtotal,
      merged.deliveryFee,
      merged.totalAmount,
      merged.couponCode || null,
      merged.discountAmount || 0,
      merged.paymentMethod,
      merged.paymentStatus,
      merged.transactionId || null,
      merged.shippingStatus,
      merged.courierName || null,
      merged.courierWaybill || null,
      merged.consignmentId || null,
      merged.courierStatus || null,
      merged.courierBooking ? JSON.stringify(merged.courierBooking) : null,
      merged.dbblDetails ? JSON.stringify(merged.dbblDetails) : null,
      merged.cardDetails ? JSON.stringify(merged.cardDetails) : null,
      merged.lastCourierSync || null,
      id
    )
    .run();

  // If order was cancelled, restore product stock in D1
  if (updates.shippingStatus === 'Cancelled' && existing.shippingStatus !== 'Cancelled') {
    if (Array.isArray(existing.items)) {
      for (const it of existing.items) {
        if (it?.product?.id && it.quantity > 0) {
          try {
            await db
              .prepare('UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
              .bind(it.quantity, it.product.id)
              .run();
          } catch (restoreErr) {
            console.warn('Failed to restore stock in D1 on order cancellation:', it.product.id, restoreErr);
          }
        }
      }
    }
  }

  // If order was uncancelled (moved back from Cancelled to active), re-deduct stock
  if (existing.shippingStatus === 'Cancelled' && updates.shippingStatus && updates.shippingStatus !== 'Cancelled') {
    if (Array.isArray(existing.items)) {
      for (const it of existing.items) {
        if (it?.product?.id && it.quantity > 0) {
          try {
            await db
              .prepare('UPDATE products SET stock = MAX(0, stock - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
              .bind(it.quantity, it.product.id)
              .run();
          } catch {}
        }
      }
    }
  }

  const updated = await getOrderById(db, id);
  if (!updated) throw new Error('Failed to retrieve updated order');
  return updated;
}

export async function deleteOrderFromD1(db: D1Database, id: string): Promise<boolean> {
  const existing = await getOrderById(db, id);
  if (existing && existing.shippingStatus !== 'Cancelled' && existing.shippingStatus !== 'Delivered') {
    if (Array.isArray(existing.items)) {
      for (const it of existing.items) {
        if (it?.product?.id && it.quantity > 0) {
          try {
            await db
              .prepare('UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
              .bind(it.quantity, it.product.id)
              .run();
          } catch {}
        }
      }
    }
  }
  const res = await db.prepare('DELETE FROM orders WHERE id = ? OR order_number = ?').bind(id, id).run();
  return res.success;
}
