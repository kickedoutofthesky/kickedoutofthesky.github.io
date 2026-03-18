# Stripe Hosted Checkout - Quick Reference

> **Note:** Backend sections of this document refer to the separate [`kickedoutofthesky-store`](https://kickedoutofthesky-store.vercel.app) Vercel repository.

## What Changed

### Frontend (This Repo)

✅ **Already Updated:**

- `store/cart.html` - Better messaging about checkout experience
- `store/success.html` - Displays shipping address & method from Stripe
- Both files ready to use immediately

📝 **No other frontend changes needed** - your existing checkout button flow remains the same

### Backend (Your Vercel App)

🔨 **You need to update these endpoints:**

1. **`POST /api/create-checkout-session`**
   - Add `automatic_tax: { enabled: true }`
   - Add `shipping_address_collection` with country list
   - Add `shipping_options` array with your rates
   - Return same `sessionId` and `url`

2. **`POST /api/webhooks/stripe`** (webhook handler)
   - Extract `shipping_details` and `shipping_option` from session
   - Pass shipping address to Printful when creating order
   - Map shipping option ID to Printful shipping method

3. **`GET /api/session-details`** (NEW endpoint)
   - Accept `session_id` query param
   - Return shipping details for success page display
   - Return format shown below

### Stripe Configuration

⚙️ **Dashboard setup required:**

- Enable Stripe Tax (Settings → Tax)
- Add product tax codes (Clothing: `txcd_10000000`)
- Configure webhook endpoint for `checkout.session.completed`

---

## Implementation Order

### Phase 1: Local Setup (30 mins)

1. Copy `STRIPE_HOSTED_CHECKOUT_IMPLEMENTATION.md` to your backend repo
2. Set up environment vars for Stripe webhook secret
3. No database changes needed (tax/shipping are computed, not stored)

### Phase 2: Backend Endpoints (2-3 hours)

1. Update `create-checkout-session` endpoint
2. Update webhook handler
3. Create `session-details` endpoint
4. Test in Stripe's test mode

### Phase 3: Stripe Dashboard (30 mins)

1. Enable Stripe Tax
2. Add product tax codes
3. Configure webhook
4. Add test webhook signing secret to env vars

### Phase 4: End-to-End Testing (1-2 hours)

1. Test checkout flow with test card
2. Verify tax calculates correctly
3. Verify shipping options appear
4. Verify Printful orders created with correct addresses
5. Verify success page shows shipping details

---

## Static Shipping Options Template

Copy this to your backend as a starting point:

```javascript
const SHIPPING_OPTIONS = {
  US: [
    {
      id: "standard_us",
      displayName: "Standard Shipping (5-7 days)",
      amount: 699, // in cents
    },
    {
      id: "express_us",
      displayName: "Express Shipping (2-3 days)",
      amount: 1499,
    },
  ],
  INTL: [
    {
      id: "standard_intl",
      displayName: "International Standard (14-21 days)",
      amount: 2499,
    },
  ],
};
```

**Pricing Strategy:**

- Look up Printful's rates for your specific products
- Add 30-50% buffer (e.g., Printful charges $5 → you price at $7-8)
- This covers variation in destination zones and gives you margin

---

## Success Page API Response Format

The new `GET /api/session-details` should return:

```json
{
  "sessionId": "cs_test_123",
  "paymentStatus": "paid",
  "shippingDetails": {
    "name": "Jane Doe",
    "address": {
      "line1": "123 Main St",
      "line2": null,
      "city": "San Francisco",
      "state": "CA",
      "postal_code": "94105",
      "country": "US"
    }
  },
  "shippingOption": "Standard Shipping (5-7 days)",
  "amountTotal": 4999,
  "subtotal": 3000,
  "tax": 270,
  "shipping": 699
}
```

---

## Key Config Lines for Each Endpoint

### Create Session - Critical Setting

```javascript
automatic_tax: {
  enabled: true,  // MUST have this
},
```

### Webhook Handler - Critical Extract

```javascript
const shippingDetails = session.shipping_details; // Customer's address
const shippingOption = session.shipping_options?.[0]; // Selected option
```

### Printful Order - Critical Mapping

```javascript
// When creating Printful order, use:
recipient: {
  name: shippingDetails.name,
  address1: shippingDetails.address.line1,
  city: shippingDetails.address.city,
  country_code: shippingDetails.address.country,
  // ... rest of address fields
}
```

---

## Printful Rate Lookup

**Before setting shipping prices**, check Printful's rates for your products:

1. Go to printful.com
2. Pick your product tier (example: t-shirt)
3. See "Shipping profiles" for rates by zone
4. US Standard: typically $3.50-5.00
5. International Standard: typically $15-25 depending on region

Set your Stripe prices 30-50% higher to build in margin.

---

## Testing Checklist

- [ ] Backend: `create-checkout-session` includes `automatic_tax: true`
- [ ] Backend: `shipping_options` array has 2+ options
- [ ] Stripe: Tax enabled in Dashboard
- [ ] Stripe: Webhook endpoint registered
- [ ] Stripe Test Card: `4242 4242 4242 4242` works in test mode
- [ ] Test Checkout: See Stripe page with shipping address field
- [ ] Test Checkout: See multiple shipping options with prices
- [ ] Test Checkout: See tax calculated before payment
- [ ] Test Webhook: `checkout.session.completed` fires
- [ ] Test Webhook: Printful order created with address
- [ ] Test Frontend: Success page shows shipping address
- [ ] Test Frontend: Success page shows shipping method

---

## Rollout Guide

**Option A: Test Mode First (Recommended)**

1. Implement all backend changes in test mode
2. Run through full checkout 10-20 times with test card
3. Verify all webhook processing, Printful order creation
4. Once confident, flip env vars to live keys
5. Do another 5-10 test purchases in live mode before announcing

**Option B: Gradual Rollout**

1. Deploy backend changes but keep old checkout flow
2. Point 10% of customers to new flow via feature flag
3. Monitor for 48 hours for errors
4. Expand to 100% if no issues

---

## Costs

**Tax Processing:**

- Stripe Tax: ~$0.006 per transaction or 0.6% (whichever is higher)
- Example: $50 order → $0.30 tax processing fee

**Shipping:**

- Covered by your margin (you set prices higher than actual cost)
- Example: Printful charges $5.99 → you charge $7.99 → $2 margin

**Payment Processing:**

- Unchanged: 2.9% + $0.30 per transaction

---

## Support Links

- Stripe Checkout docs: https://stripe.com/docs/payments/checkout
- Stripe Tax setup: https://stripe.com/docs/tax
- Tax codes reference: https://stripe.com/docs/tax/tax-codes
- Webhook events: https://stripe.com/docs/api/events/types
- Printful shipping zones: https://printful.com/help/article/211

---

## Questions?

Refer to the full `STRIPE_HOSTED_CHECKOUT_IMPLEMENTATION.md` for:

- Complete code samples for all endpoints
- Detailed webhook handler logic
- Error handling patterns
- Common gotchas and solutions
