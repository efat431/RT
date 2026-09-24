# Cloudflare & D1 Deployment Guide — Rongdhonu Trade

All necessary production files for your website and Cloudflare D1 integration have been prepared and tested.

## 🗄️ Cloudflare Configuration
- **Worker Name**: `rt` (matches Cloudflare Workers Builds CI)
- **Database Name**: `rongdhonu-db`
- **Database ID**: `3276795d-5593-42c0-8e14-947f3ab1172b`
- **Binding Name**: `DB` (accessed via `env.DB`)

All shared e-commerce data (Products, Categories, Orders, Stock, Sliders, and Store Settings) is managed directly through Cloudflare D1 as the single source of truth across all devices and browsers.

---

## 🚀 How to Deploy to Cloudflare

### Method 1: Deploy via Cloudflare Workers Builds (Automated Git CI)
1. Commit and push this repository to your connected GitHub/GitLab repository.
2. Cloudflare Workers Builds automatically builds (`npm run build`) and deploys the Worker named `rt`.
3. In Cloudflare Dashboard: **Workers & Pages > Overview > rt > Settings > Bindings**:
   - Ensure D1 Database binding is bound:
     - Variable name: `DB`
     - D1 Database: `rongdhonu-db` (`3276795d-5593-42c0-8e14-947f3ab1172b`)

### Method 2: Deploy with Wrangler CLI
```bash
# 1. Authenticate with your Cloudflare Account containing rongdhonu-db:
npx wrangler login

# 2. Verify you are authenticated to the correct Cloudflare account containing the D1 database:
npx wrangler whoami
npx wrangler d1 list

# 3. Build & Deploy:
npm run build
npx wrangler deploy
```

---

## 🔍 Troubleshooting: Error 10181 ("database not found")
If Cloudflare reports `D1 binding 'DB' references database '3276795d-5593-42c0-8e14-947f3ab1172b' which was not found [code: 10181]`:
1. **Account Isolation**: Cloudflare D1 databases are account-scoped. If you have more than one Cloudflare account (e.g. personal vs company, or multiple email logins), the D1 database `3276795d-5593-42c0-8e14-947f3ab1172b` was created in Account A, but the Worker `rt` / CI Token is deploying to Account B.
2. **Resolution**:
   - Run `npx wrangler d1 list` to verify which account ID owns `rongdhonu-db`.
   - Ensure the CI deployment API token (`CLOUDFLARE_API_TOKEN`) or Workers Builds project is created under that exact same Cloudflare account.
   - Alternatively, add `"account_id": "<YOUR_ACCOUNT_ID>"` in `wrangler.json` to lock the deployment to the correct account.
