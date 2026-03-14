# Local Development Architecture

This guide explains how to set up local development with the frontend (port 3000) and backend (port 3001) using Stripe test mode and Printful test mode.

## Quick Start

### 1. Frontend Setup (This Repo)

```bash
# Install dependencies
npm install

# Start frontend on http://localhost:3000
npm run dev
```

**That's it!** The frontend automatically detects it's on localhost and routes API calls to `http://localhost:3001`.

No environment files needed on the frontend—the detection is built into JavaScript.

### 2. Backend Setup (Vercel Backend Repo)

In your backend repository:

```bash
# Create environment file for local secrets
cat > .env.local << EOF
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
PRINTFUL_API_KEY=test_api_key...
EOF

# Start backend on http://localhost:3001
vercel dev
```

### 3. Stripe Webhook Forwarding

In a **separate terminal**:

```bash
# Install Stripe CLI if you haven't already
# https://stripe.com/docs/stripe-cli

# Forward webhooks to your local backend
stripe listen --forward-to localhost:3001/api/webhook

# Output will be something like:
# Ready! Your webhook signing secret is: whsec_test_...
```

Update your backend's `.env.local` with the signing secret:

```bash
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

## Architecture Overview

```
┌─────────────────────────────┐
│  Frontend                   │
│  Port 3000                  │
│  (Static HTML/JS)           │
│  Auto-detects: localhost    │
└──────────────┬──────────────┘
               │ API calls to http://localhost:3001
               ▼
┌─────────────────────────────┐
│  Backend (Vercel Dev)       │
│  Port 3001                  │
│  (API Functions)            │
│  Reads: .env.local         │
└──────────────┬──────────────┘
               │ Creates Stripe Session
               │ Forwards to Stripe
               ▼
┌─────────────────────────────┐
│  Stripe Test Mode           │
│  (Hosted Checkout,          │
│   Webhook Forwarding)       │
└─────────────────────────────┘
```

## How API Detection Works

The frontend includes `store/js/api-config.js` which runs on every page load:

```javascript
// Automatically detects environment and sets API URL
if (hostname === "localhost" || hostname === "127.0.0.1") {
  // Local: point to local backend
  backendUrl = "http://localhost:3001";
} else if (hostname.includes("vercel.app")) {
  // Preview: use same origin (auto-deploys get their own domain)
  backendUrl = window.location.origin;
} else {
  // Production: use production backend
  backendUrl = "https://kickedoutofthesky-store.vercel.app";
}

window.__API_URL__ = backendUrl;
```

This logic lives in JavaScript—no build step needed, no .env.local on frontend. Simple!

## Testing the Full Flow

1. **Start frontend:**

   ```bash
   npm run dev
   # Visit http://localhost:3000
   ```

2. **Start backend (separate terminal):**

   ```bash
   vercel dev
   # Runs on http://localhost:3001
   ```

3. **Enable webhooks (separate terminal):**

   ```bash
   stripe listen --forward-to localhost:3001/api/webhook
   ```

4. **Test checkout:**
   - Browse products
   - Add to cart
   - Click checkout (routes to http://localhost:3001/api/create-checkout-session)
   - Use test card: `4242 4242 4242 4242`
   - Complete payment
   - Stripe sends webhook
   - Backend receives webhook via Stripe CLI
   - Redirected to success page

## Backend Environment Variables

Store these in your **backend repository's** `.env.local`:

| Variable                | Format           | Source                                   |
| ----------------------- | ---------------- | ---------------------------------------- |
| `STRIPE_SECRET_KEY`     | `sk_test_...`    | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_test_...` | From `stripe listen` command output      |
| `PRINTFUL_API_KEY`      | `test_...`       | Printful Dashboard → Settings → API      |

## Important Rules

✅ **DO:**

- Keep `.env.local` only in backend repository
- Never commit any `.env.local` files
- Use test keys locally

❌ **DON'T:**

- Store secrets in frontend code/files
- Commit environment files
- Use production keys locally

## Troubleshooting

### "Cannot POST /api/create-checkout-session"

- Backend not running on port 3001
- Start with: `vercel dev`
- Check backend logs for errors

### "Webhook not received"

- Stripe CLI not running
- Wrong webhook secret
- Backend not listening on 3001

### Port already in use

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Frontend still hitting production

- Clear browser cache (Cmd+Shift+R)
- Check DevTools Network tab to confirm API URLs
- Verify localhost detection in console: `console.log(window.__API_URL__)`

## Next Steps

1. ✅ Set up backend repository with same architecture
2. ✅ Configure Stripe test keys
3. ✅ Set up Stripe webhook forwarding
4. ✅ Test full checkout flow end-to-end
5. ✅ Ready for preview environment setup
