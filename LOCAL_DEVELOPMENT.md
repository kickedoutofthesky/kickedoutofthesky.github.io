# Local Development Architecture

This guide explains how to set up local development with the frontend (port 3000) and backend (port 3001) using Stripe test mode and Printful test mode.

## Quick Start

### 1. Frontend Setup (This Repo)

```bash
# Copy the environment template and fill in your test keys
cp .env.local.template .env.local
# Edit .env.local with your Stripe test keys

# Install dependencies
npm install

# Start frontend on http://localhost:3000
npm run dev
```

### 2. Backend Setup (Vercel Backend Repo)

In your backend repository:

```bash
# Copy environment template
cp .env.local.template .env.local
# Edit .env.local with the SAME Stripe secret key and webhook secret

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

Copy the `whsec_...` secret and add it to your `.env.local` files:

**Frontend (.env.local):**

```
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

**Backend (.env.local):**

```
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

## Architecture Overview

```
┌─────────────────────────────┐
│  Frontend                   │
│  Port 3000                  │
│  (Static + Config Injection)│
└──────────────┬──────────────┘
               │ API calls via BACKEND_URL
               │ =http://localhost:3001
               ▼
┌─────────────────────────────┐
│  Backend (Vercel Dev)       │
│  Port 3001                  │
│  (API Functions)            │
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

## How It Works

### Configuration Injection

The frontend server (running on port 3000) automatically injects environment variables into HTML files:

1. Server reads `BACKEND_URL` from `.env.local` (defaults to Vercel production URL)
2. For each HTML file served, it injects:
   ```javascript
   <script>window.__API_URL__ = "http://localhost:3001";</script>
   ```
3. JavaScript code accesses it via:
   ```javascript
   const apiUrl = window.__API_URL__ || "https://kickedoutofthesky-store.vercel.app";
   const response = await fetch(`${apiUrl}/api/create-checkout-session`, ...);
   ```

### API Flow

#### Checkout Flow

```
1. Customer clicks "Checkout" on frontend (localhost:3000)
2. Frontend sends cart to: http://localhost:3001/api/create-checkout-session
3. Backend creates Stripe checkout session with:
   - automatic_tax: { enabled: true }
   - shipping_address_collection
   - shipping options
4. Backend returns session URL
5. Frontend redirects to Stripe's hosted checkout
6. Customer enters shipping address, selects shipping method, pays
7. Stripe sends webhook to: http://localhost:3001/api/webhook (via Stripe CLI)
8. Backend processes webhook, creates Printful order
9. Customer redirected to success page (localhost:3000/store/success.html)
```

#### Session Details Flow

```
1. Success page loads (localhost:3000/store/success.html)
2. Retrieves sessionId from URL/sessionStorage
3. Requests session details: http://localhost:3001/api/session-details?session_id=...
4. Backend fetches from Stripe, returns shipping details
5. Frontend displays confirmation with shipping info
```

## Test Data

### Stripe Test Card

- **Card Number:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., `12/25`)
- **CVC:** Any 3 digits (e.g., `123`)

### Test Addresses

- **US:** Works with any US address
- **EU:** Use EU country code to test Stripe Tax rules
- **International:** Varies by Printful's shipping support

### Printful Test Mode

- Uses "Test" API Key (not "Live" API Key)
- All orders are marked as test orders in Printful dashboard
- No actual fulfillment happens
- No charges occur

## Environment Variables

### Frontend (.env.local)

| Variable                | Purpose                       | Example                 |
| ----------------------- | ----------------------------- | ----------------------- |
| `STRIPE_SECRET_KEY`     | Stripe API key (test mode)    | `sk_test_...`           |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_test_...`        |
| `PRINTFUL_API_KEY`      | Printful test API key         | `test_api_key...`       |
| `BACKEND_URL`           | Backend API endpoint          | `http://localhost:3001` |
| `FRONTEND_URL`          | Frontend URL (for redirects)  | `http://localhost:3000` |
| `PORT`                  | Frontend server port          | `3000`                  |

### Backend (.env.local)

Same as above (all secrets should match)

## Troubleshooting

### "Port 3000 is already in use"

```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or just use a different port:
PORT=3001 npm run dev
```

### "Cannot POST /api/create-checkout-session"

- Verify backend is running on port 3001: `vercel dev`
- Check `BACKEND_URL` is set to `http://localhost:3001` in frontend .env.local
- Check backend's `.env.local` has `STRIPE_SECRET_KEY`

### "Webhook not received"

- Verify Stripe CLI is running: `stripe listen --forward-to localhost:3001/api/webhook`
- Check webhook secret matches between Stripe CLI output and `.env.local`
- Verify backend webhook handler is at `/api/webhook`
- Check backend logs for errors

### "Stripe Tax not calculating"

- Enable Stripe Tax in Stripe dashboard: Settings > Tax
- Set business address in Stripe Tax settings
- Add tax codes to your products in Stripe dashboard
- Use auto_tax: { enabled: true } in session creation

### Frontend still hitting production backend

- Clear browser cache
- Verify `.env.local` exists and has `BACKEND_URL=http://localhost:3001`
- Restart frontend server: `npm run dev`
- Check browser console for `window.__API_URL__` value

## Code Changes Per Environment

**Important:** The code is identical between local and production. Only environment variables change:

```javascript
// This code works everywhere - envs determine behavior
const apiUrl = window.__API_URL__ || "https://kickedoutofthesky-store.vercel.app";
fetch(`${apiUrl}/api/create-checkout-session`, ...);
```

- **Local Dev:** `apiUrl = "http://localhost:3001"` → hits local backend
- **Production:** `apiUrl = "https://kickedoutofthesky-store.vercel.app"` → hits Vercel backend

## Next Steps

1. Set up backend repository with same architecture
2. Configure Stripe Tax in your dashboard
3. Add product tax codes to Stripe catalog
4. Add webhooks for `checkout.session.completed` to trigger Printful orders
5. Test full flow: Browse → Cart → Checkout → Stripe → Success
