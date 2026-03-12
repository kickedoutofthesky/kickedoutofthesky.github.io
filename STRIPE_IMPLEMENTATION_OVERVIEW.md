# Stripe Hosted Checkout Implementation Summary

## What You're Implementing

A modern payment flow where:

1. **Customer adds items** to cart on your site
2. **Clicks checkout** → redirected to Stripe's hosted page
3. **Stripe's page handles**:
   - Collecting shipping address
   - Calculating tax automatically
   - Presenting shipping options
   - Processing payment securely
4. **After payment**, webhook triggers your backend to:
   - Extract shipping address
   - Create order in Printful with that address
   - Inform customer via success page

## Why This Approach?

✅ **Simpler**: No shipping form code to maintain  
✅ **Better UX**: Stripe's page is polished and trusted  
✅ **Accurate tax**: Automatic calculation for every country/state  
✅ **Lower PCI burden**: Stripe handles all payment data  
✅ **Proven**: Thousands of merch stores use this pattern

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CUSTOMER JOURNEY                         │
└─────────────────────────────────────────────────────────────────┘

1. CART PAGE (Your Site)
   ├─ Customer adds items
   └─ Clicks "Proceed to Checkout" button
                    ↓
2. CHECKOUT INITIATION (Frontend JS)
   ├─ cart-display.js calls backend
   ├─ POST /api/create-checkout-session
   └─ Passes: cart items with Printful variant IDs and prices
                    ↓
3. SESSION CREATION (Your Backend)
   ├─ Validates items
   ├─ Creates Stripe checkout session with:
   │  ├─ automatic_tax: { enabled: true }
   │  ├─ shipping_address_collection: { allowed_countries: [...] }
   │  ├─ shipping_options: [standard $6.99, express $14.99, intl $24.99]
   │  └─ tax_code: "txcd_10000000" on each line item
   └─ Returns: session.url (Stripe hosted page URL)
                    ↓
4. REDIRECT TO STRIPE (Frontend)
   ├─ Frontend receives session.url
   ├─ Stores session ID in sessionStorage
   ├─ Clears cart
   └─ Redirects: window.location.href = session.url
                    ↓
5. STRIPE CHECKOUT PAGE (Stripe's Servers)
   ├─ Customer sees order summary
   ├─ Customer enters shipping address
   │  ├─ Stripe validates address
   │  └─ Tax calculates in real-time based on address
   ├─ Customer selects shipping option
   │  └─ Price updates if shipping affects subtotal
   ├─ Customer sees: Subtotal + Shipping + Tax = Total
   ├─ Customer enters payment info
   └─ Customer clicks "Pay"
                    ↓
6. PAYMENT PROCESSING (Stripe)
   ├─ Stripe charges card
   ├─ If successful → fires checkout.session.completed webhook
   ├─ Redirects customer to: your_site.com/store/success.html?session_id=cs_123
   └─ Redirects after ~1 second
                    ↓
7. SUCCESS PAGE LOAD (Your Site)
   ├─ Frontend reads session ID from URL
   ├─ Frontend fetches GET /api/session-details?session_id=cs_123
   └─ Frontend displays:
      ├─ Order Reference (session ID)
      ├─ Shipping Address (from session)
      └─ Shipping Method Selected (from session)
                    ↓
8. WEBHOOK PROCESSING (Your Backend - runs in parallel with step 7)
   ├─ Stripe sends POST to /api/webhooks/stripe
   ├─ Webhook includes: session ID, shipping_details, shipping_option_selected
   ├─ Your backend:
   │  ├─ Extracts shipping address
   │  ├─ Extracts selected shipping option
   │  ├─ Looks up Printful shipping method from mapping
   │  └─ Creates Printful order with shipping address + method
   ├─ Printful receives order and creates shipment request
   └─ Order flows to Printful's warehouse
                    ↓
9. PRINTFUL PROCESSING
   ├─ Order arrives in Printful dashboard
   ├─ Printful confirms address validity
   ├─ Printful applies shipping method to estimate delivery
   ├─ Printful warehouses and prints products
   ├─ Packages and ships to customer
   └─ Customer receives package
```

## Files & What They Do

### Frontend (This Repo) - Already Updated ✅

**store/cart.html**

- Displays cart items with pricing
- Shows lines for Tax, Shipping (marked as "TBD")
- Has message: "At checkout, you'll enter your shipping address..."
- **Unchanged behavior**: "Proceed to Checkout" button still sends to backend

**store/js/cart-display.js**

- `proceedToCheckout()` function sends cart to backend
- **No changes needed**: Already calls the right endpoint
- Expects response: `{ sessionId: "cs_...", url: "https://checkout.stripe.com/..." }`
- Already handles redirect correctly

**store/success.html** ✅ UPDATED

- Shows Order Reference (session ID)
- **NEW**: Fetches and displays shipping address from backend
- **NEW**: Fetches and displays shipping method selected
- Calls: `GET /api/session-details?session_id=cs_...`

---

### Backend (Your Vercel App) - You Need to Update

**api/create-checkout-session.js** - Update Required

_Current state:_

```javascript
// Creates session without tax/shipping
const session = await stripe.checkout.sessions.create({
  line_items: [...],
  success_url: successUrl,
  cancel_url: cancelUrl,
});
```

_What to change:_

```javascript
// Add these fields to session creation:
const session = await stripe.checkout.sessions.create({
  line_items: lineItems.map(item => ({
    price_data: {
      ...item,
      tax_behavior: "exclusive",  // <- ADD THIS
    },
    tax_code: "txcd_10000000",    // <- ADD THIS
  })),

  automatic_tax: {                // <- ADD THIS BLOCK
    enabled: true,
  },

  shipping_address_collection: {  // <- ADD THIS BLOCK
    allowed_countries: ["US", "CA", "GB", ...],
  },

  shipping_options: [             // <- ADD THIS BLOCK
    {
      shipping_rate_data: {
        type: "fixed_amount",
        fixed_amount: { amount: 699, currency: "usd" },
        display_name: "Standard Shipping (5-7 days)",
      },
    },
    // ... more options
  ],

  success_url: successUrl + "?session_id={CHECKOUT_SESSION_ID}",  // <- ADD ?session_id={...}
  cancel_url: cancelUrl,
});
```

See full code in `STRIPE_HOSTED_CHECKOUT_IMPLEMENTATION.md` Part 2.

---

**api/webhooks/stripe.js** - Update Required

_Current state:_

```javascript
const handleCheckoutSessionCompleted = session => {
  // Creates Printful order from session
  // But doesn't use shipping_details
};
```

_What to change:_

```javascript
const handleCheckoutSessionCompleted = async (session) => {
  // NEW: Extract shipping info from session
  const shippingDetails = session.shipping_details;
  const shippingOption = session.shipping_options?.[0];

  // Build recipient for Printful using shipping_details.address
  const recipient = {
    name: shippingDetails.name,
    address1: shippingDetails.address.line1,
    address2: shippingDetails.address.line2,
    city: shippingDetails.address.city,
    state_code: shippingDetails.address.state,
    country_code: shippingDetails.address.country,
    zip: shippingDetails.address.postal_code,
  };

  // Map Stripe shipping option to Printful method
  const printfulMethod = STRIPE_TO_PRINTFUL_SHIPPING[shippingOption.id];

  // Create Printful order with recipient address
  const order = await printful.createOrder({
    items: [...],
    recipient,                    // <- NOW INCLUDES ACTUAL ADDRESS
    shipping_method_id: printfulMethod,
  });
};
```

See full code in `STRIPE_HOSTED_CHECKOUT_IMPLEMENTATION.md` Part 3.

---

**api/session-details.js** - New Endpoint

_What it does:_

- Receives: `GET /api/session-details?session_id=cs_test_123`
- Fetches session from Stripe
- Returns shipping address and method
- Frontend uses this to display on success page

_Code:_

```javascript
const session = await stripe.checkout.sessions.retrieve(session_id, {
  expand: ["line_items"],
});

return {
  shippingDetails: {
    name: session.shipping_details.name,
    address: session.shipping_details.address,
  },
  shippingOption: session.shipping_options?.[0].shipping_display_name,
  // ... plus totals
};
```

See full code in `STRIPE_HOSTED_CHECKOUT_IMPLEMENTATION.md` Part 4.

---

## Configuration Files

You'll create one config file in your backend:

**config/shipping-options.js**

```javascript
const SHIPPING_OPTIONS = {
  US: [
    {
      id: "standard_us",
      displayName: "Standard US (5-7 days)",
      amount: 699, // cents
    },
    // ...
  ],
};

const STRIPE_TO_PRINTFUL_SHIPPING = {
  standard_us: "STANDARD",
  // ...
};

module.exports = { SHIPPING_OPTIONS, STRIPE_TO_PRINTFUL_SHIPPING };
```

---

## Stripe Dashboard Configuration

**One-time setup required:**

1. **Enable Tax** (Settings → Tax)
   - Choose your business location (affects tax rules)
   - Approve ~$0.6% per-transaction fee

2. **Configure Webhook** (Developers → Webhooks)
   - Endpoint: `https://your-backend.vercel.app/api/webhooks/stripe`
   - Event: `checkout.session.completed`
   - Get signing secret, add to `.env`

3. **Product Tax Codes** (Products)
   - Merchandise/clothing: `txcd_10000000`
   - (Or set in code per line item ✓ already done)

---

## Implementation Timeline

**Estimated effort by phase:**

| Phase     | Task                                         | Time          |
| --------- | -------------------------------------------- | ------------- |
| 1         | Backend: Create `shipping-options.js` config | 15 min        |
| 2         | Backend: Update `create-checkout-session`    | 45 min        |
| 3         | Backend: Update webhook handler              | 45 min        |
| 4         | Backend: Create `session-details` endpoint   | 30 min        |
| 5         | Backend: Test in Stripe test mode            | 60 min        |
| 6         | Stripe: Dashboard configuration              | 15 min        |
| 7         | Backend: Deploy to Vercel                    | 15 min        |
| 8         | Verification: 5-10 live test transactions    | 30 min        |
| **Total** |                                              | **3-4 hours** |

---

## Documentation Files in This Repo

You now have these guides:

1. **STRIPE_HOSTED_CHECKOUT_IMPLEMENTATION.md** (Main Reference)
   - Complete technical specification
   - Full code samples for all endpoints
   - Stripe Dashboard setup details
   - Testing checklist
   - Debugging guide

2. **STRIPE_IMPLEMENTATION_QUICKSTART.md** (Quick Reference)
   - High-level overview
   - Template configs
   - Implementation order
   - API response format examples

3. **BACKEND_IMPLEMENTATION_CHECKLIST.md** (Step-by-Step)
   - Checkbox-based implementation guide
   - Part-by-part walkthrough
   - Testing scenarios
   - Debugging commands
   - Rollback procedures

---

## Key Numbers to Know

**Shipping Prices** (Set statically, based on Printful rates + margin)

- US Standard: ~$6.99 (Printful: $4-5)
- US Express: ~$14.99 (Printful: $9-12)
- International: ~$24.99 (Printful: $15-25)

**Tax Processing Cost**

- Stripe Tax: $0.006 per transaction or 0.6%, whichever is higher
- Example: $50 order = $0.30 fee

**Stripe Processing**

- Unchanged: 2.9% + $0.30 per transaction
- Tax fee is on top of this

---

## Quick Decision Tree

**"Should I use static or dynamic shipping rates?"**

- **Static (What we're doing)**: Set prices once, works everywhere, simpler but may lose margin on some zones
- **Dynamic (Future)**: Call Printful for rates per address, more accurate but adds latency

→ Static is the right choice for launch. Upgrade later if needed.

---

**"Should I enable Stripe Tax?"**

- **Yes** (required for this flow). Stripe handles tax calculation correctly by country
- Cost: tiny per-transaction fee, worth it for compliance
- Alternative: manually calculating tax is error-prone and incomplete

---

**"What if a customer cancels on Stripe page?"**

- Their cart remains on your site (browser "back" button or we kept it)
- They can try again or continue shopping
- No order created (webhook never fires)
- No issues with cleanup

---

**"What happens if webhook fails to process?"**

- Stripe retries for 3 days
- You can manually check failed webhooks in Dashboard
- Only customer doesn't get Printful order (needs manual intervention)
- → Set up error alerts in Sentry/monitoring

---

## Support & Questions

### If something isn't working:

1. **Check webhook logs**: Stripe Dashboard → Developers → Webhooks → Your endpoint
2. **Verify test mode**: Make sure all keys are `sk_test_*` / `pk_test_*`
3. **Review full guide**: `STRIPE_HOSTED_CHECKOUT_IMPLEMENTATION.md` has troubleshooting
4. **Check Stripe docs**: https://stripe.com/docs/payments/checkout
5. **Contact us**: (when you have updated code deployed to Vercel, will have direct visibility)

### Most Common Issues:

| Issue                          | Fix                                        |
| ------------------------------ | ------------------------------------------ |
| Tax not calculating            | Enable Stripe Tax in Dashboard             |
| Shipping options not showing   | Verify `shipping_options` array populated  |
| Webhook not firing             | Check signing secret matches `.env`        |
| Printful order without address | Verify webhook extracts `shipping_details` |
| Success page shows no shipping | Verify `session-details` endpoint deployed |

---

## Next Steps

1. **Begin with backend**: Implement `shipping-options.js` config file
2. **Update endpoints**: Follow checklist in `BACKEND_IMPLEMENTATION_CHECKLIST.md`
3. **Test in test mode**: Run through 10-20 test checkouts
4. **Deploy to Vercel**: Push changes
5. **Enable webhook**: Register endpoint in Stripe Dashboard
6. **Go live**: Switch to live keys

You're ready! 🚀 Start with the checklist and refer to the detailed guide as needed.
