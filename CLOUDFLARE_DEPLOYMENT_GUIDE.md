# Cloudflare & D1 Deployment Guide — Rongdhonu Trade

All necessary production files for your website and Cloudflare D1 integration have been prepared and tested.

## 🗄️ Cloudflare D1 Database Configuration
- **Database Name**: `rongdhonu-db`
- **Database ID**: `3276795d-5593-42c0-8e14-947f3ab1172b`
- **Worker / Pages Binding**: `DB` (accessed via `env.DB`)

All shared e-commerce data (Products, Categories, Orders, Stock, Sliders, and Store Settings) is managed directly through Cloudflare D1 as the single source of truth across all devices and browsers.

---

## 🚀 How to Deploy to Cloudflare

### Method 1: Deploy with Wrangler CLI (Recommended)
```bash
# 1. Build the production assets
npm run build

# 2. Deploy directly using the pre-configured wrangler.json
npx wrangler deploy
```

### Method 2: Deploy via Cloudflare Pages & Git
1. Push this repository to your connected GitHub repository.
2. In the Cloudflare Dashboard under **Workers & Pages > Settings > Functions > D1 Database Bindings**:
   - Variable name: `DB`
   - D1 Database: select your database (`rongdhonu-db` / `3276795d-5593-42c0-8e14-947f3ab1172b`).
3. Deploy the application.

---

## ⚡ Multi-Browser Synchronization
- **Single Source of Truth**: Order mutations (`createOrder`, `updateOrderStatus`, `cancelCustomerOrder`, `deleteOrder`) execute database-first against D1.
- **Real-Time Polling & Focus Sync**: Every tab automatically re-synchronizes when focused or periodically in the background.
- **Stock Integrity**: Stock is automatically decremented upon order placement and restored upon order cancellation or deletion.
