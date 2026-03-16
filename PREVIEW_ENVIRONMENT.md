# Preview/Staging Environment Setup

This guide explains how to set up and test the Preview environment that deploys on every push to a non-main branch or PR.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PREVIEW ENVIRONMENT                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GitHub Branch: feature/* or staging/*                      │
│          ↓                                                   │
│  Vercel Auto-Deploy (Both Frontend & Backend)               │
│          ↓                                                   │
│  Frontend: your-branch.vercel.app                           │
│  Backend:  your-branch.vercel.app/api                       │
│          ↓                                                   │
│  Stripe Test Mode (Dashboard Webhook)                       │
│          ↓                                                   │
│  Printful Test Mode                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Triggering Preview Deployments

### 1. Push to Non-Main Branch

```bash
# Create a new feature branch
git checkout -b feature/your-feature-name

# Make your changes, then commit
git add .
git commit -m "Add your changes"

# Push to GitHub
git push origin feature/your-feature-name
```

**Vercel automatically:**

- Detects the push
- Deploys frontend to: `feature-your-feature-name.vercel.app`
- Deploys backend to: `feature-your-feature-name.vercel.app/api`
- Provides GitHub comment with preview URLs

### 2. Open a Pull Request

```bash
# After pushing, open a PR on GitHub
# Vercel will post preview URLs as a comment
```

## Environment Configuration in Vercel

### Frontend Repository Settings

1. **Go to Vercel Dashboard** → Your Project → Settings

2. **Environment Variables** → Add each variable with **Preview** checkbox enabled:

```
STRIPE_SECRET_KEY = sk_test_...
STRIPE_WEBHOOK_SECRET = whsec_test_... (from Stripe dashboard)
PRINTFUL_API_KEY = Your Printful API Key
ENVIRONMENT = preview
BACKEND_URL = https://your-branch.vercel.app/api
FRONTEND_URL = https://your-branch.vercel.app
```

3. **Check only these boxes** for each variable:
   - ☑️ Production
   - ☑️ Preview
   - ☑️ Development

### Backend Repository Settings

Same as frontend (both repos need the same Stripe test keys for webhooks to work).

## Stripe Webhook Configuration for Preview

### Create a Test Webhook in Stripe Dashboard

1. Go to **Stripe Dashboard** (Test Mode) → **Developers** → **Webhooks**

2. Click **Add endpoint**

3. Enter your preview URL:

   ```
   https://your-branch.vercel.app/api/webhook
   ```

   (Replace `your-branch` with your actual deployment URL)

4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `charge.refunded`

5. Click **Add endpoint**

6. Copy the **Signing secret** (starts with `whsec_...`)

7. **Important:** Update both frontend and backend Vercel Preview env vars:
   ```
   STRIPE_WEBHOOK_SECRET = whsec_test_... (from Step 6)
   ```

### Alternative: Use Stripe CLI for Local Testing

If testing locally against a preview backend:

```bash
stripe listen --forward-to localhost:3001/api/webhook
```

(This is same process as local development)

## Testing the Preview Environment

### Full End-to-End Flow

1. **Visit frontend preview URL:**

   ```
   https://your-branch.vercel.app
   ```

2. **Browse and add items to cart:**
   - Products load from static JSON
   - Cart stored in browser localStorage

3. **Click "Checkout":**
   - Frontend sends to: `https://your-branch.vercel.app/api/create-checkout-session`
   - Backend receives request and creates Stripe checkout session

4. **On Stripe Hosted Checkout:**
   - Test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., `12/25`)
   - Any 3-digit CVC (e.g., `123`)
   - Any US address for shipping

5. **After payment:**
   - Stripe sends webhook to preview backend
   - Backend processes webhook (creates Printful test order)
   - Customer redirected to: `https://your-branch.vercel.app/store/success.html`

6. **Success page:**
   - Displays session ID
   - Retrieves shipping details from backend
   - Shows confirmation with address + shipping method

### Test Different Scenarios

#### Test Tax Calculation

- Use different country addresses
- Stripe Tax should calculate based on shipping destination

#### Test Shipping Options

- Different shipping addresses should show different shipping methods
- Costs should vary (if configured in backend)

#### Test Printful Integration

- Check Printful dashboard (test mode) for test orders
- Verify order details match what was submitted
- **Important:** In Preview, backend sets `ENVIRONMENT=preview` which marks Printful orders as draft/test
- Draft orders won't be fulfilled or charged — they're safe for testing

## Printful Test vs. Production in Preview

When you deploy to preview:

1. **Backend checks `ENVIRONMENT=preview`**
2. **When creating Printful order**, backend sets `is_draft: true`
3. **Printful dashboard** shows order in "Test Orders" section, not "Live Orders"
4. **Order will NOT be fulfilled or charged**

This lets you test the full flow safely. To actually fulfill orders, merge to `main` (production).

**Note:** Printful uses the **same API key** in all environments. The difference between test and production is controlled by the `ENVIRONMENT` variable and the order draft flag in your backend code. See [PRINTFUL_TEST_VS_PRODUCTION.md](PRINTFUL_TEST_VS_PRODUCTION.md) for details.

## Environment Variables Reference

| Variable                | Purpose                       | Example                         |
| ----------------------- | ----------------------------- | ------------------------------- |
| `STRIPE_SECRET_KEY`     | Stripe API key (test)         | `sk_test_...`                   |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_test_...`                |
| `PRINTFUL_API_KEY`      | Printful API key              | Your Printful API key           |
| `ENVIRONMENT`           | Controls order behavior       | `preview`                       |
| `BACKEND_URL`           | Backend API endpoint          | `https://branch.vercel.app/api` |
| `FRONTEND_URL`          | Frontend URL (for redirects)  | `https://branch.vercel.app`     |

**Important:** All these should be set to test/preview values in Vercel Preview environment.

## Code: No Changes Between Environments

The actual code is identical between local, preview, and production. Only environment variables differ:

```javascript
// Same code everywhere:
const apiUrl = window.__API_URL__ || "https://kickedoutofthesky-store.vercel.app";
const response = await fetch(`${apiUrl}/api/create-checkout-session`, ...);
```

- **Local Dev:** `apiUrl = http://localhost:3001` (from .env.local)
- **Preview:** `apiUrl = https://your-branch.vercel.app/api` (from Vercel env vars)
- **Production:** `apiUrl = https://kickedoutofthesky-store.vercel.app` (from Vercel env vars)

## Workflow for Testing Changes

### 1. Make Changes Locally

```bash
# Create a feature branch
git checkout -b feature/add-new-product

# Test locally
npm run dev
# Visit http://localhost:3000

# Make changes, commit
git add .
git commit -m "Add new product variant"
```

### 2. Push to Preview

```bash
# Push to GitHub
git push origin feature/add-new-product

# Vercel auto-deploys to: feature-add-new-product.vercel.app
# Check GitHub Actions for deployment status
```

### 3. Test in Preview Environment

```bash
# Visit the preview URL Vercel provides
https://feature-add-new-product.vercel.app

# Run through full checkout flow
# - Browse products
# - Add to cart
# - Test checkout with 4242 card
# - Verify Stripe webhook processed
# - Check success page
```

### 4. Make Additional Changes

```bash
# Make more changes locally
git add .
git commit -m "Fix bug on product page"

# Push again
git push origin feature/add-new-product

# Vercel auto-redeployed (no manual action needed)
```

### 5. Create Pull Request

```bash
# When ready, open PR on GitHub
# Vercel will post preview URLs in PR comments
# Code review team can test in preview
```

### 6. Merge to Main

```bash
# After approval, merge PR via GitHub UI
# This triggers production deployment
```

## Troubleshooting Preview Deployments

### "Preview deployment failed"

- Check Vercel build logs in Dashboard
- Verify all environment variables set in Vercel
- Check that `.env.local` is NOT committed (only `.env`)

### "Checkout button doesn't work"

- Verify `BACKEND_URL` in Vercel Preview env vars
- Verify backend repo also deployed to same preview URL
- Check browser console for API call errors
- Verify Stripe keys are test mode (sk*test*)

### "Webhook not received"

- Verify webhook endpoint URL in Stripe Dashboard matches preview URL
- Check Stripe signing secret in Vercel matches Stripe Dashboard
- Look at Stripe Dashboard → Events for webhook delivery attempts
- Check backend logs for webhook processing errors

### "Products not loading"

- Verify `store/data/products.json` exists
- Verify frontend deployed correctly (check Vercel logs)
- Check browser Network tab for failed requests

### "Redirect loop after payment"

- Verify `FRONTEND_URL` in backend Vercel env vars
- Verify success page redirect URL in backend checkout handler
- Check that both frontend and backend preview URLs match

## Best Practices

✅ **DO:**

- Always test full checkout flow before merging to main
- Use feature branches for all new work
- Set up one webhook per branch/environment
- Test with different addresses (US, EU) for tax variations
- Check Stripi dashboard for webhook delivery status

❌ **DON'T:**

- Use production Stripe keys in preview environment
- Commit `.env.local` to any branch
- Push directly to main (always use PR)
- Forget to update webhook secret when creating new endpoint
- Test with real credit cards (test cards only)

## Quick Reference: URLs

```
Frontend Preview:  https://your-branch.vercel.app
Backend Preview:   https://your-branch.vercel.app/api
Store Page:        https://your-branch.vercel.app/store
Checkout Endpoint: https://your-branch.vercel.app/api/create-checkout-session
Webhook Endpoint:  https://your-branch.vercel.app/api/webhook
Success Page:      https://your-branch.vercel.app/store/success.html
Cancel Page:       https://your-branch.vercel.app/store/cancel.html
```

## Next Steps

1. ✅ Set environment variables in both frontend and backend Vercel projects
2. ✅ Create test webhook in Stripe Dashboard
3. ✅ Push changes to feature branch
4. ✅ Verify Vercel deploys both frontend and backend
5. ✅ Test end-to-end flow with test card
6. ✅ Check Stripe webhook delivery in Dashboard
7. ✅ Verify Printful test order created (if integrated)
8. ✅ Open PR for code review
9. ✅ Merge to main for production deployment
