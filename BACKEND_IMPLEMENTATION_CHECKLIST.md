# Backend Implementation Checklist

> **Note:** This document describes the backend implementation in the separate [`kickedoutofthesky-store`](https://kickedoutofthesky-store.vercel.app) Vercel repository, not this frontend repo.

Use this checklist to track your backend implementation. Check off items as you complete them.

## Pre-Work

- [ ] Clone your Vercel backend repository locally
- [ ] Read `STRIPE_HOSTED_CHECKOUT_IMPLEMENTATION.md` (reference doc)
- [ ] Read `STRIPE_IMPLEMENTATION_QUICKSTART.md` (this folder, main reference)
- [ ] Have Stripe Dashboard open in another tab
- [ ] Have Printful API docs open

## Part 1: Configuration Setup

**File: `config/shipping-options.js`**

- [ ] Create new file with `SHIPPING_OPTIONS` object
- [ ] Define US standard and express shipping options (use template from quickstart)
- [ ] Define international shipping with realistic prices from Printful
- [ ] Create `STRIPE_TO_PRINTFUL_SHIPPING` mapping
- [ ] Export both objects

**File: `.env`**

- [ ] Add `STRIPE_WEBHOOK_SECRET` (copy from Stripe Dashboard after creating webhook)
- [ ] Verify `STRIPE_SECRET_KEY` exists (live or test mode consistent)
- [ ] Verify `STRIPE_PUBLISHABLE_KEY` exists (matches secret key mode)

## Part 2: Update Existing Endpoint

**File: `api/create-checkout-session.js`**

- [ ] Import `SHIPPING_OPTIONS` from config
- [ ] Add `automatic_tax: { enabled: true }` to session creation
- [ ] Add `shipping_address_collection` with countries array
- [ ] Add `shipping_options` array built from `SHIPPING_OPTIONS`
- [ ] Set `tax_behavior: "exclusive"` on each line item
- [ ] Set `tax_code: "txcd_10000000"` on each line item
- [ ] Return both `sessionId` and `url` in response (keep existing)
- [ ] Test: Create a session, verify response includes proper fields

## Part 3: Create New Endpoint

**File: `api/session-details.js`** (NEW file)

- [ ] Create new file
- [ ] Export function that accepts `session_id` query param
- [ ] Fetch session from Stripe with `expand: ["line_items"]`
- [ ] Extract `shipping_details`, `shipping_options`, totals
- [ ] Return JSON matching format in quickstart
- [ ] Add error handling for invalid session IDs
- [ ] Test: Call with valid session ID, verify response

**File: `api/index.js`** (or main routes file)

- [ ] Register new endpoint: `GET /api/session-details`
- [ ] Wire it to the handler from `session-details.js`

## Part 4: Update Webhook Handler

**File: `api/webhooks/stripe.js`**

- [ ] Locate `handleCheckoutSessionCompleted` function
- [ ] Extract `shippingDetails` from session object
- [ ] Extract `shippingOption` from session object
- [ ] Build recipient object using `shippingDetails.address` fields
- [ ] Map shipping option to Printful method using `STRIPE_TO_PRINTFUL_SHIPPING`
- [ ] Pass recipient address to Printful order creation
- [ ] Pass mapped shipping method to Printful
- [ ] Store Stripe session ID with Printful order for reference
- [ ] Log success: "Created Printful order {id} for Stripe session {id}"

**Critical: Webhook Registration**

- [ ] In Stripe Dashboard, go to Developers → Webhooks
- [ ] Add new endpoint
- [ ] URL: `https://YOUR_VERCEL_APP.vercel.app/api/webhooks/stripe`
- [ ] Select event: `checkout.session.completed`
- [ ] Copy signing secret
- [ ] Add to `.env` as `STRIPE_WEBHOOK_SECRET`
- [ ] Restart local server to pick up env var

## Part 5: Test in Stripe Test Mode

**Initial Setup**

- [ ] Switch Stripe Dashboard to **Test Mode** (toggle top-right)
- [ ] Verify you're using `sk_test_*` and `pk_test_*` keys
- [ ] Deploy changes to Vercel or test locally

**Test Checkout Session Creation**

- [ ] Call `POST /api/create-checkout-session` with valid items
- [ ] Verify response includes `url` pointing to `checkout.stripe.com`
- [ ] Open the URL in browser
- [ ] Verify you see Stripe checkout page
- [ ] Verify you see "Enter shipping address" section
- [ ] Verify you see multiple shipping options with prices
- [ ] Do NOT complete payment yet

**Test Shipping & Tax Calculation**

- [ ] On Stripe page, enter US address (e.g., San Francisco, CA)
- [ ] Watch tax calculate (should calculate immediately)
- [ ] Select different shipping options (prices should update)
- [ ] Select international address (e.g., London, UK)
- [ ] Verify tax recalculates (likely higher for EU)
- [ ] Note the calculated total

**Test Complete Payment**

- [ ] Fill in shipping address (use test address like 123 Main St, San Francisco, CA 94105)
- [ ] Select a shipping option (Standard)
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Use any future month/year and any 3-digit CVC
- [ ] Complete payment
- [ ] Browser redirects to your success page (`/store/success.html`)

**Test Webhook Processing**

- [ ] In Stripe Dashboard, go to Developers → Webhooks → Your endpoint
- [ ] Find the `checkout.session.completed` event from your test
- [ ] Click it, verify Response was `200`
- [ ] Check backend logs for: "Processing checkout.session.completed"
- [ ] Check Printful: verify order was created with shipping address
- [ ] Verify Printful order shows correct shipping method selected

**Test Success Page Display**

- [ ] Look at `/store/success.html` in browser after redirect
- [ ] Verify "Order Reference" section shows session ID
- [ ] Verify "Shipping Address" section displays:
  - [ ] Customer name
  - [ ] Full address with city, state, zip
  - [ ] Country code
- [ ] Verify "Shipping Method" shows the option selected (e.g., "Standard Shipping (5-7 days)")

## Part 6: Verify Edge Cases

- [ ] Test with multiple items in cart (verify tax on total)
- [ ] Test with different quantities (verify per-line calculation)
- [ ] Test with cancel button on Stripe page (verify you can retry)
- [ ] Test clearing cart before redirect (verify cart is empty on re-entry)
- [ ] Test webhook duplicate processing (verify orders aren't created twice)

## Part 7: Stripe Dashboard Configuration

**Enable Tax Processing**

- [ ] Go to Settings → Tax
- [ ] Click "Enable Stripe Tax"
- [ ] Set Business address (Lisbon or your location)
- [ ] Review per-transaction fee (~0.6%)

**Add Product Tax Codes**

- [ ] Go to Products
- [ ] For each product, set tax code:
  - [ ] Merchandise/clothing: `txcd_10000000`
  - [ ] Or manage via line items in checkout (done in code ✓)

**Verify Webhook**

- [ ] Developers → Webhooks → Your endpoint
- [ ] Verify status is "Active" (not "Inactive - no recent events")
- [ ] Review recent events, check Response status for errors

## Part 8: Go Live Preparation

**Pre-Flight Checks**

- [ ] Switch webhook secret to **Live** mode secret (test → live)
- [ ] Switch API keys to **Live** keys (test → live)
- [ ] Verify `.env` variables are set in Vercel deployment
- [ ] Run 5-10 test transactions in live mode with real credit card
- [ ] Review all orders in Stripe Dashboard
- [ ] Verify all orders in Printful
- [ ] Check success page displays on real payment

**Monitoring**

- [ ] Set up Sentry or error logging if not already done
- [ ] Monitor webhook logs for `checkout.session.completed` events
- [ ] Set up email alert for webhook failures
- [ ] Monitor Printful order creation rate

**Communication**

- [ ] Notify customers: checkout flow now uses Stripe's page
- [ ] Update help docs/FAQs if you have them
- [ ] Add note: orders ship from [your location] with [shipping providers]

## Rollback Plan

If issues occur:

- [ ] Switch webhook secret back to **Test** mode
- [ ] Switch API keys back to **Test** keys
- [ ] Deploy old `create-checkout-session` code (before your changes)
- [ ] Customer checkouts will fail gracefully
- [ ] Debug in test mode, retest, retry live

---

## Quick Debugging Commands

**Check if session was created:**

```bash
curl "https://api.stripe.com/v1/checkout/sessions/cs_test_123" \
  -H "Authorization: Bearer sk_test_..."
```

**View webhook logs:**

- Stripe Dashboard → Developers → Webhooks → Click your endpoint → scroll down

**List recent sessions:**

```bash
curl "https://api.stripe.com/v1/checkout/sessions" \
  -H "Authorization: Bearer sk_test_..." \
  --data-urlencode "limit=10"
```

**Verify tax is set:**
Look for this in sessions retrieved:

```json
{
  "automatic_tax": {
    "enabled": true,
    "status": "complete" // Should say "complete" after payment
  }
}
```

---

## Notes Section

Keep track of decisions made:

### Shipping Rates Selected

- Standard US: $\_\_\_
- Express US: $\_\_\_
- International: $\_\_\_

### Countries Shipping To

- [ ] US
- [ ] CA
- [ ] EU
- [ ] Others: **\*\***\_\_\_\_**\*\***

### Issue & Resolution Log

1. Issue: **\_** | Solution: **\_** | Date: **\_**
2. Issue: **\_** | Solution: **\_** | Date: **\_**

---

**You've got this!** 🚀 Check off items as you go, and refer to the full implementation guide if you get stuck on any section.
