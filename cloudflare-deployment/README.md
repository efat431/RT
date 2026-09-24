# Cloudflare Deployment Guide — Rongdhonu Trade

All necessary production files for your website have been prepared, tested, and organized into a single ready-to-upload folder:

📂 **`cloudflare-deployment/`**

You also have a ready-to-download ZIP archive:
📦 **`cloudflare-deployment.zip`** (located at the root and in `public/cloudflare-deployment.zip`)

---

## 🚀 How to Upload to Cloudflare Pages (Step-by-Step)

### 1. Log in to Cloudflare
Visit [dash.cloudflare.com](https://dash.cloudflare.com) and sign in to your Cloudflare account.

### 2. Create a Pages Project
1. In the sidebar on the left, navigate to **Workers & Pages**.
2. Click the **Create application** button.
3. Select the **Pages** tab (at the top), then click **Upload assets**.

### 3. Upload the Deployment Folder
1. Enter your desired **Project Name** (e.g. `rongdhonu-trade`).
2. Simply **drag and drop the `cloudflare-deployment` folder** (or upload `cloudflare-deployment.zip`) directly into the upload dropzone.
3. Click **Deploy site**.

### 4. Your Site is Live!
Cloudflare will immediately provide you with a live URL (e.g. `https://rongdhonu-trade.pages.dev`).
- **Free SSL Certificate** is enabled automatically.
- **Global CDN Edge Caching** ensures sub-100ms loading speeds.
- **Custom Domains** can be added anytime under `Project Settings > Custom Domains`.

---

## ⚡ What Makes This Fully Functional & Dynamic on Cloudflare?

1. **SPA Routing Configured (`_redirects`)**:
   Deep linking and refreshing pages (e.g., admin portal, order tracking queries, product filters) work seamlessly with zero 404 errors via Cloudflare's native `_redirects` SPA rewrite (`/* /index.html 200`).

2. **Persistent Dynamic State**:
   All dynamic actions (placing orders, adding items to cart or wishlist, updating admin inventory, modifying store settings, tracking orders, applying voucher discounts) persist in the browser's `localStorage` and initialize cleanly with realistic Bangladeshi e-commerce seed data.

3. **High-Performance Caching (`_headers`)**:
   Static JavaScript and CSS chunks under `/assets/` are configured with `Cache-Control: public, max-age=31536000, immutable` for maximum speed.

4. **Security Headers**:
   Includes `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and modern referrer policies.
