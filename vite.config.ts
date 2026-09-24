import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_SLIDES,
  INITIAL_SETTINGS,
  INITIAL_COUPONS,
  INITIAL_REVIEWS,
  INITIAL_USERS,
  INITIAL_ORDERS,
} from './src/data/seedData';

function localApiDevPlugin(): Plugin {
  // In-memory dev collections initialized from seed data
  let devOrders: any[] = [...INITIAL_ORDERS];
  let devProducts: any[] = [...INITIAL_PRODUCTS];
  let devCategories: any[] = [...INITIAL_CATEGORIES];
  let devSliders: any[] = [...INITIAL_SLIDES];
  let devSettings: any = { ...INITIAL_SETTINGS };
  let devCoupons: any[] = [...INITIAL_COUPONS];
  let devReviews: any[] = [...INITIAL_REVIEWS];
  let devUsers: any[] = [...INITIAL_USERS];

  return {
    name: 'local-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost');
        const method = req.method?.toUpperCase();

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

        if (method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        // Helper to read JSON request body
        const readBody = (callback: (body: any) => void) => {
          let raw = '';
          req.on('data', (chunk) => { raw += chunk; });
          req.on('end', () => {
            try {
              callback(JSON.parse(raw || '{}'));
            } catch {
              callback({});
            }
          });
        };

        // GET /api/health
        if (url.pathname === '/api/health') {
          res.statusCode = 200;
          return res.end(JSON.stringify({ status: 'ok', environment: 'dev', ordersCount: devOrders.length }));
        }

        // 1. PRODUCTS
        if (url.pathname === '/api/products') {
          if (method === 'GET') {
            const cat = url.searchParams.get('category');
            let list = devProducts;
            if (cat && cat !== 'all') list = list.filter((p) => p.categoryId === cat);
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, count: list.length, products: list }));
          }
          if (method === 'POST') {
            return readBody((body) => {
              const product = body.product || body;
              const newProd = {
                id: product.id || `prod-${Date.now()}`,
                title: product.title || product.name || 'Product',
                price: Number(product.price) || 0,
                originalPrice: product.originalPrice ?? product.oldPrice,
                categoryId: product.categoryId || product.category || 'cat-mens-accessories',
                description: product.description || '',
                imageUrl: product.imageUrl || (Array.isArray(product.images) ? product.images[0] : '') || '',
                images: Array.isArray(product.images) ? product.images : [product.imageUrl].filter(Boolean),
                stock: Number(product.stock) || 0,
                featured: Boolean(product.featured),
                rating: Number(product.rating) || 5.0,
                reviewsCount: Number(product.reviewsCount) || 0,
                specs: product.specs || [],
                sizes: product.sizes || [],
                colors: product.colors || [],
                createdAt: product.createdAt || new Date().toISOString(),
              };
              devProducts.unshift(newProd);
              res.statusCode = 201;
              return res.end(JSON.stringify({ success: true, product: newProd }));
            });
          }
        }

        const prodMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/);
        if (prodMatch) {
          const id = decodeURIComponent(prodMatch[1]);
          if (method === 'GET') {
            const found = devProducts.find((p) => p.id === id);
            res.statusCode = found ? 200 : 404;
            return res.end(JSON.stringify(found ? { success: true, product: found } : { success: false, error: 'Not found' }));
          }
          if (method === 'PUT' || method === 'PATCH') {
            return readBody((body) => {
              const updates = body.updates || body.product || body;
              const idx = devProducts.findIndex((p) => p.id === id);
              if (idx >= 0) {
                devProducts[idx] = { ...devProducts[idx], ...updates };
                res.statusCode = 200;
                return res.end(JSON.stringify({ success: true, product: devProducts[idx] }));
              }
              res.statusCode = 404;
              return res.end(JSON.stringify({ success: false, error: 'Not found' }));
            });
          }
          if (method === 'DELETE') {
            devProducts = devProducts.filter((p) => p.id !== id);
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, message: 'Deleted' }));
          }
        }

        // 2. CATEGORIES
        if (url.pathname === '/api/categories') {
          if (method === 'GET') {
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, count: devCategories.length, categories: devCategories }));
          }
          if (method === 'POST') {
            return readBody((body) => {
              const cat = body.category || body;
              const newCat = {
                id: cat.id || `cat-${Date.now()}`,
                name: cat.name || 'New Category',
                slug: cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `cat-${Date.now()}`,
                iconName: cat.iconName || 'Tag',
                description: cat.description || '',
              };
              devCategories.push(newCat);
              res.statusCode = 201;
              return res.end(JSON.stringify({ success: true, category: newCat }));
            });
          }
        }

        const catMatch = url.pathname.match(/^\/api\/categories\/([^/]+)$/);
        if (catMatch) {
          const id = decodeURIComponent(catMatch[1]);
          if (method === 'PUT' || method === 'PATCH') {
            return readBody((body) => {
              const updates = body.updates || body.category || body;
              const idx = devCategories.findIndex((c) => c.id === id || c.slug === id);
              if (idx >= 0) {
                devCategories[idx] = { ...devCategories[idx], ...updates };
                res.statusCode = 200;
                return res.end(JSON.stringify({ success: true, category: devCategories[idx] }));
              }
              res.statusCode = 404;
              return res.end(JSON.stringify({ success: false, error: 'Not found' }));
            });
          }
          if (method === 'DELETE') {
            devCategories = devCategories.filter((c) => c.id !== id && c.slug !== id);
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, message: 'Deleted' }));
          }
        }

        // 3. SLIDERS
        if (url.pathname === '/api/sliders') {
          if (method === 'GET') {
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, count: devSliders.length, sliders: devSliders }));
          }
          if (method === 'POST') {
            return readBody((body) => {
              const sl = body.slide || body;
              const newSl = { id: sl.id || `slide-${Date.now()}`, ...sl };
              devSliders.push(newSl);
              res.statusCode = 201;
              return res.end(JSON.stringify({ success: true, slider: newSl }));
            });
          }
        }

        const slMatch = url.pathname.match(/^\/api\/sliders\/([^/]+)$/);
        if (slMatch) {
          const id = decodeURIComponent(slMatch[1]);
          if (method === 'PUT' || method === 'PATCH') {
            return readBody((body) => {
              const updates = body.updates || body.slide || body;
              const idx = devSliders.findIndex((s) => s.id === id);
              if (idx >= 0) {
                devSliders[idx] = { ...devSliders[idx], ...updates };
                res.statusCode = 200;
                return res.end(JSON.stringify({ success: true, slider: devSliders[idx] }));
              }
              res.statusCode = 404;
              return res.end(JSON.stringify({ success: false, error: 'Not found' }));
            });
          }
          if (method === 'DELETE') {
            devSliders = devSliders.filter((s) => s.id !== id);
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, message: 'Deleted' }));
          }
        }

        // 4. SETTINGS
        if (url.pathname === '/api/settings') {
          if (method === 'GET') {
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, settings: devSettings }));
          }
          if (method === 'PUT' || method === 'PATCH' || method === 'POST') {
            return readBody((body) => {
              const updates = body.settings || body;
              devSettings = { ...devSettings, ...updates };
              res.statusCode = 200;
              return res.end(JSON.stringify({ success: true, settings: devSettings }));
            });
          }
        }

        // 5. COUPONS
        if (url.pathname === '/api/coupons') {
          if (method === 'GET') {
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, coupons: devCoupons }));
          }
          if (method === 'POST') {
            return readBody((body) => {
              const c = body.coupon || body;
              const idx = devCoupons.findIndex((item) => item.code.toUpperCase() === c.code.toUpperCase());
              if (idx >= 0) devCoupons[idx] = c;
              else devCoupons.push(c);
              res.statusCode = 201;
              return res.end(JSON.stringify({ success: true, coupon: c }));
            });
          }
        }

        // 6. REVIEWS
        if (url.pathname === '/api/reviews') {
          if (method === 'GET') {
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, reviews: devReviews }));
          }
          if (method === 'POST') {
            return readBody((body) => {
              const r = body.review || body;
              const newR = { id: r.id || `rev-${Date.now()}`, ...r, createdAt: r.createdAt || new Date().toISOString() };
              devReviews.unshift(newR);
              res.statusCode = 201;
              return res.end(JSON.stringify({ success: true, review: newR }));
            });
          }
        }

        // 7. USERS
        if (url.pathname === '/api/users') {
          if (method === 'GET') {
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, users: devUsers }));
          }
          if (method === 'POST') {
            return readBody((body) => {
              const u = body.user || body;
              const newU = { id: u.id || `user-${Date.now()}`, ...u, createdAt: new Date().toISOString() };
              devUsers.push(newU);
              res.statusCode = 201;
              return res.end(JSON.stringify({ success: true, user: newU }));
            });
          }
        }

        // 8. ORDERS
        if (url.pathname === '/api/orders' && method === 'GET') {
          res.statusCode = 200;
          return res.end(JSON.stringify({ success: true, count: devOrders.length, orders: devOrders }));
        }

        if (url.pathname === '/api/orders' && method === 'POST') {
          return readBody((body) => {
            const rawOrder = body.order || body;
            const order = {
              id: rawOrder.id || `ord-${Date.now()}`,
              orderNumber: rawOrder.orderNumber || String(Math.floor(1000 + Math.random() * 9000)),
              ...rawOrder,
              createdAt: rawOrder.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            const idx = devOrders.findIndex((o) => o.id === order.id);
            if (idx >= 0) devOrders[idx] = order;
            else devOrders.unshift(order);

            // Deduct stock in devProducts
            if (Array.isArray(order.items)) {
              for (const it of order.items) {
                if (it?.product?.id) {
                  const prod = devProducts.find((p) => p.id === it.product.id);
                  if (prod) prod.stock = Math.max(0, prod.stock - it.quantity);
                }
              }
            }
            res.statusCode = 201;
            return res.end(JSON.stringify({ success: true, order, message: 'Order saved in dev memory store' }));
          });
        }

        const match = url.pathname.match(/^\/api\/orders\/([^/]+)$/);
        if (match) {
          const id = decodeURIComponent(match[1]);

          if (method === 'GET') {
            const found = devOrders.find((o) => o.id === id || o.orderNumber === id);
            res.statusCode = found ? 200 : 404;
            return res.end(JSON.stringify(found ? { success: true, order: found } : { success: false, error: 'Not found' }));
          }

          if (method === 'PATCH' || method === 'PUT') {
            return readBody((body) => {
              const updates = body.updates || body;
              const idx = devOrders.findIndex((o) => o.id === id || o.orderNumber === id);
              if (idx >= 0) {
                const old = devOrders[idx];
                devOrders[idx] = { ...devOrders[idx], ...updates };

                // Handle stock restoration on cancellation
                if (updates.shippingStatus === 'Cancelled' && old.shippingStatus !== 'Cancelled') {
                  if (Array.isArray(old.items)) {
                    for (const it of old.items) {
                      if (it?.product?.id) {
                        const prod = devProducts.find((p) => p.id === it.product.id);
                        if (prod) prod.stock = prod.stock + it.quantity;
                      }
                    }
                  }
                }

                res.statusCode = 200;
                return res.end(JSON.stringify({ success: true, order: devOrders[idx] }));
              }
              res.statusCode = 404;
              return res.end(JSON.stringify({ success: false, error: 'Order not found' }));
            });
          }

          if (method === 'DELETE') {
            const target = devOrders.find((o) => o.id === id || o.orderNumber === id);
            if (target && target.shippingStatus !== 'Cancelled' && target.shippingStatus !== 'Delivered') {
              if (Array.isArray(target.items)) {
                for (const it of target.items) {
                  if (it?.product?.id) {
                    const prod = devProducts.find((p) => p.id === it.product.id);
                    if (prod) prod.stock = prod.stock + it.quantity;
                  }
                }
              }
            }
            devOrders = devOrders.filter((o) => o.id !== id && o.orderNumber !== id);
            res.statusCode = 200;
            return res.end(JSON.stringify({ success: true, message: 'Order deleted' }));
          }
        }

        // Courier endpoints in dev
        if (url.pathname === '/api/courier/dispatch' && method === 'POST') {
          const simTracking = `STF-${Math.floor(1000000 + Math.random() * 9000000)}`;
          const simCsg = `CSG-${Math.floor(100000 + Math.random() * 900000)}`;
          res.statusCode = 200;
          return res.end(JSON.stringify({
            success: true,
            isSimulated: true,
            trackingCode: simTracking,
            consignmentId: simCsg,
            message: `Dev simulated dispatch: ${simCsg}`,
          }));
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), localApiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
