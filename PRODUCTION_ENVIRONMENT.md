# Production Environment Setup

⚠️ **WARNING: PRODUCTION ENVIRONMENT WITH LIVE KEYS** ⚠️

This guide covers the production deployment triggered by merging to the `main` branch. Once deployed, this environment processes real customer payments and creates real Printful orders.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  PRODUCTION ENVIRONMENT                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GitHub Branch: main                                        │
│          ↓                                                   │
│  Manual Merge to Main (After PR Approval & Testing)         │
│          ↓                                                   │
│  GitHub Pages Frontend Deployment                           │
│  Vercel Production Backend Deployment                       │
│          ↓                                                   │
│  Frontend: https://kickedoutofthesky.com                    │
│  Backend: https://kickedoutofthesky-store.vercel.app/api    │
│          ↓                                                   │
│  Stripe LIVE Mode (Real Payments)                           │
│          ↓                                                   │
│  Printful LIVE (Real Orders)                                │
│          ↓                                                   │
│  Real Customers → Real Money                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Environment Variables (LIVE/PRODUCTION)

⚠️ **CRITICAL: Triple-check all values before deploying**

### Set in Vercel Dashboard

Go to **Settings → Environment Variables** → Add each variable with **ONLY "Production" box checked**:

| Variable                | Value                           | Source                  |
| ----------------------- | ------------------------------- | ----------------------- |
| `STRIPE_SECRET_KEY`     | `sk_live_...`                   | Stripe Live API Keys    |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...`                     | Stripe Live Webhooks    |
| `PRINTFUL_API_KEY`      | `prod_api_key...`               | Printful Production API |
| `FRONTEND_URL`          | `https://kickedoutofthesky.com` | Your custom domain      |

⚠️ **DO NOT:**

- Set these to preview/development values
- Copy test keys into production
- Check "Preview" or "Development" boxes
- Commit these values anywhere (only in Vercel UI)

### Verifying Environment Variables

Before deploying:

```bash
# In Vercel Dashboard, go to:
# Settings → Environment Variables

# Verify each variable shows:
# ✅ Production (checked)
# ❌ Preview (unchecked)
# ❌ Development (unchecked)

# Verify values start with correct prefixes:
# - STRIPE_SECRET_KEY: sk_live_
# - STRIPE_WEBHOOK_SECRET: whsec_ (from live endpoint)
# - PRINTFUL_API_KEY: Production key (not "test_")
```

## Deployment Process

### 1. Code Review & Testing (Preview Environment)

```bash
# 1. Create feature branch with changes
git checkout -b feature/your-feature

# 2. Push to trigger preview deployment
git push origin feature/your-feature

# 3. Vercel automatically deploys to preview URL

# 4. Test thoroughly in preview environment:
# - Full checkout flow with test card
# - Verify order appears in Printful Test dashboard
# - Check success page displays correctly
# - Test different shipping addresses
# - Test error scenarios
```

### 2. Open Pull Request

```bash
# On GitHub, create PR to main
# Provide:
# - Description of changes
# - Testing performed in preview environment
# - Any breaking changes or migrations needed
```

### 3. Code Review

- Team reviews code changes
- Verifies preview deployment successful
- Tests feature in preview environment
- Approves PR

### 4. Merge to Main (DEPLOYMENT TRIGGER)

```bash
# After approval, merge PR to main (via GitHub UI)
# This IMMEDIATELY TRIGGERS:
# ✅ GitHub Pages frontend deployment
# ✅ Vercel backend production deployment
# ⚠️ LIVE STRIPE KEYS BECOME ACTIVE
# ⚠️ REAL CUSTOMER PAYMENTS WILL BE PROCESSED
```

### 5. Verify Production Deployment

```bash
# Check frontend deployed
curl https://kickedoutofthesky.com
# Should return 200 OK

# Check backend deployed
curl https://kickedoutofthesky-store.vercel.app/api/health
# Should return 200 OK

# Visit in browser
https://kickedoutofthesky.com/store
# Should load without errors
```

## Stripe Live Mode Configuration

### 1. Create Live Webhook Endpoint

⚠️ **Do this BEFORE deploying to production**

1. Go to **Stripe Dashboard** → switch to **LIVE mode** (top toggle)
2. Go to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. **Endpoint URL:** Enter your production backend URL
   ```
   https://kickedoutofthesky-store.vercel.app/api/webhook
   ```
5. **Events to send:** Select these exactly:
   - ✅ `checkout.session.completed`
   - ✅ `charge.refunded`
   - ✅ `payment_intent.succeeded` (optional, for monitoring)
6. Click **Add endpoint**
7. **Copy the signing secret** (starts with `whsec_...`)
8. Add to Vercel Production env vars as `STRIPE_WEBHOOK_SECRET`

### 2. Enable Live API Keys in Backend

Verify your backend code uses:

```javascript
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// This will automatically use live key in production (sk_live_...)
```

### 3. Update Stripe Product Tax Codes (if applicable)

If using Stripe Tax:

1. Go to **Products** in Stripe dashboard
2. For each product, verify tax code matches actual product type
3. Review tax behavior (exclusive vs inclusive based on region)

## Pre-Production Checklist

Before merging to main, verify:

### Code & Features

- [ ] All new features tested in preview environment
- [ ] No `console.log` or debug code in production files
- [ ] Prettier formatting applied (`npm run format`)
- [ ] ESLint passes (`npm run lint`)
- [ ] All unit tests pass (`npm run test`)
- [ ] E2E tests pass (`npm run e2e`)
- [ ] `.env.local` is NOT committed (in .gitignore)

### Configuration

- [ ] `STRIPE_SECRET_KEY` in Vercel = `sk_live_...` (not `sk_test_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` = live webhook secret (from Stripe)
- [ ] `PRINTFUL_API_KEY` = production key (not test key)
- [ ] `FRONTEND_URL` = `https://kickedoutofthesky.com`
- [ ] All env vars set to "Production" only (not Preview/Development)

### Stripe Configuration

- [ ] Live webhook endpoint created in Stripe dashboard
- [ ] Webhook secret copied to Vercel Production env vars
- [ ] Product tax codes set (if using Stripe Tax)
- [ ] Fulfillment settings configured
- [ ] Business address set in Stripe Tax settings

### Printful Configuration

- [ ] Production API key obtained from Printful
- [ ] Production Store ID configured
- [ ] Product catalog synced to live store
- [ ] Shipping rates reviewed and approved
- [ ] Tax settings configured in Printful

### Testing in Preview

- [ ] Checkout flow works end-to-end
- [ ] Test card processed successfully: `4242 4242 4242 4242`
- [ ] Webhook received and processed
- [ ] Printful test order created
- [ ] Success page displays shipping details
- [ ] Error scenarios handled gracefully

### Documentation & Communication

- [ ] Team aware of deployment time
- [ ] Rollback procedure documented
- [ ] Monitoring alerts configured
- [ ] Customer communication ready (if needed)

## Monitoring Production

### Daily Checks

After deployment, monitor:

1. **Stripe Dashboard** → **Recent customers**
   - Real orders appearing? ✅
   - Payment success rate normal? ✅
   - No failed webhooks? ✅

2. **Vercel Dashboard** → **Your project** → **Deployments**
   - Latest deployment shows "Deployed" ✅
   - No function errors ✅
   - Response times acceptable? ✅

3. **Printful Account** → **Orders**
   - Real orders appearing? ✅
   - Order details correct? ✅
   - No fulfillment errors? ✅

4. **Website** (manual test)
   - https://kickedoutofthesky.com loads? ✅
   - Store page loads? ✅
   - Checkout button visible? ✅

### Alert Setup

Configure alerts in Vercel for:

- [ ] Build failures
- [ ] Function errors (threshold > 5% error rate)
- [ ] Response time spike (> 5 seconds)
- [ ] Failed webhooks (if supported)

## Rollback Procedure

If critical issues discovered after production merge:

### Option 1: Immediate Rollback (Fastest)

```bash
# Revert the production commit
git revert HEAD

# Push to main
git push origin main

# Vercel automatically redeploys with previous version
# Stripe webhooks continue to webhook endpoint (still works)
```

**Time to rollback:** ~2-5 minutes

### Option 2: Manual Rollback via Vercel UI

1. Go to Vercel Dashboard
2. Deployments tab
3. Click on previous working deployment
4. Click "..." → "Redeploy"

**Time to rollback:** ~1-3 minutes

### Option 3: Disable Webhook Temporarily

If payment flow is broken but other features work:

1. Go to Stripe Dashboard → Webhooks
2. Find your webhook endpoint
3. Click "Disable" (temporarily)
4. Fix code issue
5. Deploy fix
6. Re-enable webhook

**Time to fix:** ~5-15 minutes (webhook events may be retried automatically)

## What NOT to Do in Production

❌ **NEVER:**

- Use test Stripe keys (`sk_test_...`)
- Commit `.env.local` or secrets
- Push directly to main without PR process
- Deploy without testing in preview first
- Skip the pre-production checklist
- Use old webhook secrets
- Change environment variables without backup plan
- Disable production monitoring

## Common Production Issues

### "Checkout button doesn't work"

- [ ] Verify `BACKEND_URL` in frontend code
- [ ] Check Vercel backend deployment status
- [ ] Verify Stripe keys are live mode (sk*live*)
- [ ] Check browser console for errors

### "Webhook not received"

- [ ] Verify webhook endpoint URL in Stripe matches backend
- [ ] Check webhook signing secret in Vercel matches Stripe
- [ ] Look at Stripe Dashboard → Events for attempts
- [ ] Check backend logs in Vercel

### "Orders not appearing in Printful"

- [ ] Verify Printful API key is production (not test)
- [ ] Check Printful dashboard for errors
- [ ] Verify order payload matches Printful API spec
- [ ] Check backend logs for API errors

### "Payment successful but no order"

- [ ] Check Stripe webhook delivery status
- [ ] Verify webhook handler processes correctly
- [ ] Check Printful for duplicate orders
- [ ] Look at backend error logs

## After Successful Production Deployment

1. **Monitor for 24 hours** for issues
2. **Test with real payment** (if possible, use your own card)
3. **Update status page** or customer communication
4. **Archive preview deployment** (optional, can keep for rollback reference)
5. **Document any issues discovered** for future reference
6. **Schedule post-launch review** with team

## Break Glass (Emergency) Procedures

If severe issues and need immediate action:

### Kill Switch Option 1: Disable Stripe Webhook

```
Stripe Dashboard → Webhooks → [Your Endpoint] → Disable
```

This stops new orders from attempting to process while you fix backend.

### Kill Switch Option 2: Redirect Customers

```
Update DNS or GitHub Pages config to redirect to maintenance page
```

Last resort - prevents any orders (also costs revenue).

### Kill Switch Option 3: Scale Backend to 0

```
Vercel Dashboard → Settings → Scale → Set to 0
```

Disables payment processing entirely (users see 500 errors).

## Staying Safe in Production

✅ **Best Practices:**

1. **Always test in preview first** - No exceptions
2. **Keep production and test keys separate** - Never mix them
3. **Verify webhook secrets** - Triple-check values
4. **Monitor order flow** - Daily for first week
5. **Have rollback procedure ready** - Before you need it
6. **Review change logs** - Know exactly what changed
7. **Keep backups** - Of config and secrets (in Vercel)
8. **Update documentation** - After changes
9. **Communicate with team** - Before deploying
10. **Automate tests** - Don't rely on manual testing

## The Golden Rule

```javascript
// SAME CODE EVERYWHERE
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const printful = new PrintfulAPI(process.env.PRINTFUL_API_KEY);

// Different behavior based on environment variables:
// Local Dev:  sk_test_, printful test key
// Preview:    sk_test_, printful test key
// Production: sk_live_, printful production key
```

**Your code never changes. The environment does.**

## Quick Reference: All Environments

| Aspect           | Local Dev               | Preview                         | Production                                       |
| ---------------- | ----------------------- | ------------------------------- | ------------------------------------------------ |
| **Trigger**      | `npm run dev`           | Push to feature branch          | Merge to main                                    |
| **Frontend URL** | `http://localhost:3000` | `https://branch.vercel.app`     | `https://kickedoutofthesky.com`                  |
| **Backend**      | `http://localhost:3001` | `https://branch.vercel.app/api` | `https://kickedoutofthesky-store.vercel.app/api` |
| **Stripe Keys**  | `sk_test_...`           | `sk_test_...`                   | `sk_live_...`                                    |
| **Stripe Mode**  | Test                    | Test                            | Live                                             |
| **Printful**     | Test API                | Test API                        | Production API                                   |
| **Real Money**   | No                      | No                              | Yes ✅                                           |
| **Real Orders**  | No                      | No                              | Yes ✅                                           |
| **Customers**    | You only                | Team + testers                  | Everyone                                         |

## Related Documentation

- **Local Development:** See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)
- **Preview Environment:** See [PREVIEW_ENVIRONMENT.md](PREVIEW_ENVIRONMENT.md)
- **Backend API:** See backend repository `/docs/`
- **Stripe Documentation:** https://stripe.com/docs/payments
- **Printful API:** https://printful.com/api

---

**Last Updated:** March 2026
**Environment:** Production
**Status:** Ready for deployment ✅
