# Stripe Hosted Checkout Implementation Guide

> **Note:** This document describes the backend implementation in the separate [`kickedoutofthesky-store`](https://kickedoutofthesky-store.vercel.app) Vercel repository.

This document outlines the complete backend implementation required to move from custom shipping/payment forms to Stripe's hosted checkout page with automatic tax calculation.

## Overview

**What's changing:**

- Customer checkout flow now happens on Stripe's hosted page (not your site)
- Stripe handles: shipping address collection, shipping method selection, tax calculation
- You provide: static shipping options, product tax codes, and webhook handling
- Backend's role: create sessions with proper config, handle completed webhooks, relay order to Printful

**Key benefits:**

- No custom form code to maintain
- Stripe handles complex tax rules by country/region
- Automatic shipping method presentation
- PCI compliance handled by Stripe

---

## Backend Architecture

### Required Endpoints

1. **`POST /api/create-checkout-session`** - Stripe session creation (already exists, needs updates)
2. **`POST /api/webhooks/stripe`** - Webhook receiver for `checkout.session.completed` (exists, needs updates)
3. **`GET /api/session-details`** - NEW - Return session shipping details to frontend

---

## Part 1: Static Shipping Options Configuration

Define your shipping tiers based on Printful's rates with a healthy buffer:

```javascript
// config/shipping-options.js

// Based on Printful rate tables for your specific products
// Standard US shipping: Printful charges ~$4-5 avg → Price at $6.99
// Express US shipping: Printful charges ~$9-12 avg → Price at $14.99
// International: Varies greatly → Price per region

const SHIPPING_OPTIONS = {
  US: [
    {
      id: "standard_us",
      displayName: "Standard Shipping (5-7 business days)",
      amount: 699, // $6.99 in cents
      deliveryEstimate: {
        minimum: { unit: "day", value: 5 },
        maximum: { unit: "day", value: 7 },
      },
    },
    {
      id: "express_us",
      displayName: "Express Shipping (2-3 business days)",
      amount: 1499, // $14.99 in cents
      deliveryEstimate: {
        minimum: { unit: "day", value: 2 },
        maximum: { unit: "day", value: 3 },
      },
    },
  ],
  INTL: [
    {
      id: "standard_intl",
      displayName: "International Standard (14-21 business days)",
      amount: 2499, // $24.99 in cents
      deliveryEstimate: {
        minimum: { unit: "day", value: 14 },
        maximum: { unit: "day", value: 21 },
      },
    },
  ],
};

// Map Stripe shipping option IDs to Printful shipping methods
const STRIPE_TO_PRINTFUL_SHIPPING = {
  standard_us: "STANDARD", // Printful method name
  express_us: "EXPRESS",
  standard_intl: "STANDARD_INTERNATIONAL",
};

module.exports = { SHIPPING_OPTIONS, STRIPE_TO_PRINTFUL_SHIPPING };
```

---

## Part 2: Updated `/api/create-checkout-session` Endpoint

This endpoint now configures automatic tax, shipping address collection, and shipping options.

```javascript
// api/create-checkout-session.js (updated)

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { SHIPPING_OPTIONS } = require("../config/shipping-options");

async function createCheckoutSession(req, res) {
  try {
    const { items, successUrl, cancelUrl } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    // Validate and transform items
    const lineItems = items.map(item => {
      if (!item.variant_id || !item.price_cents || !item.quantity) {
        throw new Error("Invalid item: missing variant_id, price_cents, or quantity");
      }

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.product_name,
            images: item.images || [], // URLs of product images if available
            metadata: {
              color: item.color,
              size: item.size,
              printful_variant_id: item.variant_id,
            },
          },
          unit_amount: item.price_cents,
          // Tax behavior: "exclusive" means tax is added on top (standard for US)
          // Use "inclusive" for EU customers
          tax_behavior: "exclusive",
        },
        quantity: item.quantity,
        // Tax code for apparel/merchandise
        // 'txcd_10000000' is the standard code for clothing/merchandise
        // Reference: https://stripe.com/docs/tax/tax-codes
        tax_code: "txcd_10000000",
      };
    });

    // Determine which shipping options based on checkout context
    // For MVP, offer all shipping options and let customer choose
    // Later, could filter based on destination if you have that info early
    const shippingOptions = [...SHIPPING_OPTIONS.US, ...SHIPPING_OPTIONS.INTL].map(option => ({
      shipping_rate_data: {
        type: "fixed_amount",
        fixed_amount: {
          amount: option.amount,
          currency: "usd",
        },
        display_name: option.displayName,
        delivery_estimate: option.deliveryEstimate,
        metadata: {
          shipping_option_id: option.id,
        },
      },
    }));

    // Create Stripe checkout session with all required configuration
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl + "?session_id={CHECKOUT_SESSION_ID}", // Pass session ID back to frontend
      cancel_url: cancelUrl,

      // CRITICAL: Enable automatic tax calculation
      automatic_tax: {
        enabled: true,
      },

      // Collect shipping address from customer
      shipping_address_collection: {
        // List of allowed country codes (ISO 3166-1 alpha-2)
        // "ZZ" means "rest of world"
        // For Printful, check which countries they ship to for your products
        allowed_countries: [
          "US", // United States
          "CA", // Canada
          "GB", // United Kingdom
          "BR", // Brazil
          "DE", // Germany
          "FR", // France
          "JP", // Japan
          "AU", // Australia
          // Add more as needed based on Printful's support
          // See: https://printful.com/help/article/211
        ],
      },

      // Offer shipping options to customer
      shipping_options: shippingOptions,

      // Customer info (optional, pre-fills checkout if you have it)
      customer_email: undefined, // Could populate if you have user data

      // Metadata to track order context
      metadata: {
        order_date: new Date().toISOString(),
        items_count: items.length,
      },

      // UI customization
      locale: "auto", // Auto-detect user's locale
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
      // Return other info frontend might need
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error) {
    console.error("Checkout session creation error:", error);
    return res.status(500).json({
      error: error.message || "Failed to create checkout session",
    });
  }
}

module.exports = { createCheckoutSession };
```

---

## Part 3: Updated Webhook Handler

Process `checkout.session.completed` events to extract shipping details and create Printful orders.

```javascript
// api/webhooks/stripe.js (updated webhook handler)

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const printful = require("../services/printful-client"); // Your Printful API client
const { STRIPE_TO_PRINTFUL_SHIPPING } = require("../config/shipping-options");

async function handleCheckoutSessionCompleted(session) {
  try {
    console.log("Processing checkout.session.completed:", session.id);

    // Extract shipping information
    const shippingDetails = session.shipping_details;
    const shippingCost = session.total_details?.breakdown?.shipping?.[0]?.amount_subtotal || 0;
    const taxCost = session.total_details?.breakdown?.tax?.[0]?.amount_subtotal || 0;

    // Determine which shipping option was selected
    const shippingOption = session.shipping_options?.[0];
    const selectedShippingRateId = shippingOption?.shipping_rate;

    // Fetch the shipping rate details to get our custom metadata
    let shippingMethodId = "STANDARD"; // Default fallback
    if (selectedShippingRateId) {
      try {
        // The shipping_rate might be a rate ID, try to look it up if needed
        // For now, we store the mapping in metadata on shipping_rate_data
        // This would need to be enhanced depending on how you structure rates
        console.log("Selected shipping rate:", selectedShippingRateId);
      } catch (err) {
        console.warn("Could not fetch shipping rate details:", err);
      }
    }

    // Get line items to build Printful order
    const lineItems = session.line_items;
    const items = await lineItems.data;

    // Build Printful order items
    const printfulItems = items.map(lineItem => {
      const metadata = lineItem.price?.product?.metadata || {};

      return {
        external_id: `${session.id}-${metadata.printful_variant_id}`,
        variant_id: parseInt(metadata.printful_variant_id),
        quantity: lineItem.quantity,
        name: lineItem.description,
        // Optional: you could store color/size in Printful's metadata
      };
    });

    // Build recipient/shipping address from Stripe data
    const address = shippingDetails.address || {};
    const recipient = {
      name: shippingDetails.name || "Customer",
      address1: address.line1 || "",
      address2: address.line2 || "",
      city: address.city || "",
      state_code: address.state || "",
      country_code: address.country || "",
      zip: address.postal_code || "",
    };

    // Create order in Printful
    const printfulOrder = await printful.createOrder({
      items: printfulItems,
      recipient,
      shipping_method_id: shippingMethodId,

      // Metadata/reference info
      external_order_id: session.id, // Reference back to Stripe session
      shipping_method: shippingOption?.shipping_display_name || "Standard",

      // Optional: you could track costs
      pricing: {
        subtotal: session.subtotal / 100, // Convert from cents
        shipping: shippingCost / 100,
        tax: taxCost / 100,
        total: session.amount_total / 100,
      },
    });

    console.log(`✓ Created Printful order ${printfulOrder.id} for Stripe session ${session.id}`);

    // Store order mapping for reference (in your DB)
    // await db.orders.create({
    //   stripe_session_id: session.id,
    //   printful_order_id: printfulOrder.id,
    //   customer_email: session.customer_email,
    //   shipping_address: shippingDetails,
    //   total_amount_cents: session.amount_total,
    //   status: "processing",
    //   created_at: new Date(),
    // });

    return {
      success: true,
      stripe_session_id: session.id,
      printful_order_id: printfulOrder.id,
    };
  } catch (error) {
    console.error("Error processing checkout.session.completed:", error);
    throw error;
  }
}

// Main webhook handler
async function handleStripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.sendStatus(400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        // Fetch full session details (line items aren't included by default)
        const session = await stripe.checkout.sessions.retrieve(event.data.object.id, {
          expand: ["line_items"],
        });

        const result = await handleCheckoutSessionCompleted(session);
        res.json({ received: true, result });
        break;
      }

      // Handle other relevant events
      case "charge.refunded": {
        // TODO: Handle refunds → potentially cancel Printful order
        console.log("Charge refunded:", event.data.object.id);
        res.json({ received: true });
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
        res.json({ received: true });
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Still respond 200 so Stripe doesn't retry, but log for debugging
    res.status(200).json({ error: error.message });
  }
}

module.exports = { handleStripeWebhook };
```

---

## Part 4: New `/api/session-details` Endpoint

Let the frontend retrieve session details to display shipping info on success page.

```javascript
// api/session-details.js (NEW endpoint)

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function getSessionDetails(req, res) {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: "session_id required" });
    }

    // Fetch session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items"],
    });

    // Extract info frontend needs
    const shippingDetails = session.shipping_details;
    const shippingOption = session.shipping_options?.[0];

    return res.status(200).json({
      sessionId: session.id,
      paymentStatus: session.payment_status,
      shippingDetails: {
        name: shippingDetails?.name,
        address: shippingDetails?.address,
      },
      shippingOption: shippingOption?.shipping_display_name,
      amountTotal: session.amount_total,
      subtotal: session.subtotal || 0,
      tax: session.total_details?.breakdown?.tax?.[0]?.amount_subtotal || 0,
      shipping: session.total_details?.breakdown?.shipping?.[0]?.amount_subtotal || 0,
    });
  } catch (error) {
    console.error("Error fetching session details:", error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { getSessionDetails };
```

---

## Part 5: Update Frontend Cart Redirect

Make sure `cart-display.js` passes the right data in the correct format:

```javascript
// store/js/cart-display.js - proceedToCheckout function (verify this matches)

async function proceedToCheckout() {
  if (cart.items.length === 0) {
    alert("Your cart is empty");
    return;
  }

  const validation = cart.validateItemsForCheckout(products);
  if (!validation.valid) {
    alert("Cannot proceed to checkout:\n\n" + validation.errors.join("\n"));
    return;
  }

  try {
    const items = cart.items
      .map(item => {
        const product = products.find(p => p.product_key === item.productKey);
        if (!product) return null;

        const variantId = product.variants[item.color]?.sizes?.[item.size]?.variant_id;
        const priceCents = cart.getPriceForVariant(product, item.color, item.size);

        return {
          variant_id: variantId,
          product_name: product.title,
          color: item.color,
          size: item.size,
          price_cents: priceCents,
          quantity: item.quantity,
          // Optional: add image URL if available
          // images: [product.image]
        };
      })
      .filter(item => item !== null);

    const response = await fetch("https://kickedoutofthesky-store.vercel.app/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        successUrl: window.location.origin + "/store/success.html",
        cancelUrl: window.location.href,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || data.message || "Checkout failed";
      console.error("Checkout error:", errorMessage);
      alert("Checkout failed: " + errorMessage);
      return;
    }

    // Store session ID for success page
    if (data.sessionId) {
      sessionStorage.setItem("checkoutSessionId", data.sessionId);
    }

    // Clear cart
    cart.clear();

    // Redirect to Stripe hosted checkout
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error("No checkout URL provided");
    }
  } catch (error) {
    console.error("Checkout error:", error);
    alert("Checkout failed: " + (error.message || "Please try again."));
  }
}
```

---

## Stripe Dashboard Setup Checklist

### 1. Enable Stripe Tax

- Go to **Settings → Tax** in Stripe Dashboard
- Click **Enable Stripe Tax**
- Set your **Business address** (affects tax rules)
  - Location: Lisbon (or wherever you're registered)
  - This determines which tax regulations apply
- Review tax rate: typically 0.6% per transaction on top of payment processing fees

### 2. Product Tax Codes

- Go to **Products** in Stripe Dashboard (or use API)
- For each product (or when creating line items), set tax code to:
  - **`txcd_10000000`** - Clothing/merchandise (general)
  - Other relevant codes if you sell different product types
  - Full list: https://stripe.com/docs/tax/tax-codes

### 3. Webhook Configuration

- Go to **Developers → Webhooks**
- Click **Add endpoint**
- Endpoint URL: `https://kickedoutofthesky-store.vercel.app/api/webhooks/stripe`
- Select events to listen for:
  - ✓ `checkout.session.completed` (required for order creation)
  - ✓ `charge.refunded` (optional, for refund handling)
- Copy the **Signing secret** → save as `STRIPE_WEBHOOK_SECRET` env var

### 4. Test Mode

- Work in **Test Mode** first
- Use test card: `4242 4242 4242 4242` with any future expiry and CVC
- Verify webhook processing in webhook logs

### 5. Test Tax Calculation

- Create a test session with a US address
- Verify tax is calculated correctly on checkout page
- Verify different tax rates for EU addresses (VAT)

---

## Environment Variables

Add these to your Vercel backend `.env`:

```bash
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_...

PRINTFUL_API_KEY=your_printful_api_key

# Also verify these exist:
VERCEL_URL=https://kickedoutofthesky-store.vercel.app
```

---

## Testing Checklist

**In Stripe Test Mode:**

- [ ] Create checkout session with test items
- [ ] Verify session includes `automatic_tax: true`
- [ ] Verify shipping options appear on Stripe checkout page
- [ ] Select US address → verify tax calculates
- [ ] Select EU address (if allowed) → verify different tax rate
- [ ] Select different shipping options → verify price updates
- [ ] Complete payment with test card
- [ ] Verify `checkout.session.completed` webhook fires
- [ ] Verify Printful order created with correct shipping address
- [ ] Verify frontend success page shows shipping details

**Edge Cases:**

- [ ] Test with multiple items (verify tax on total)
- [ ] Test with different quantities (verify line-by-line tax)
- [ ] Test cancel flow (verify cart remains)
- [ ] Test webhook retry (verify idempotent processing)

---

## Monitoring & Debugging

### Webhook Logs

- Stripe Dashboard → **Developers → Webhooks → Endpoint**
- View request/response details
- Watch for failed retries (red indicators)

### Printful Order Status

- After order created, Poll Printful status:
  ```javascript
  const order = await printful.getOrder(printfulOrderId);
  console.log(order.status); // "pending", "confirmed", "failed", etc.
  ```

### Tax Verification

- Session object includes: `session.total_details.breakdown.tax`
- Compare against Stripe's expected tax rate for address
- Verify `automatic_tax.status === "complete"` before payment

---

## Next Steps: Dynamic Shipping (Future Enhancement)

If you want more accurate shipping rates based on actual destination:

1. Before creating session, call Printful's shipping rates API with cart items
2. Query with sample address or country from geoip
3. Build shipping_options from Printful's response
4. Creates more dynamic pricing but adds latency

For now, static rates with buffer is the way to go. Launch with this, improve later if needed.

---

## Common Issues & Solutions

| Issue                                   | Solution                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| Tax not calculating                     | Verify `automatic_tax.enabled: true` in session. Verify tax codes on line items.      |
| Shipping options not appearing          | Verify `shipping_options` array has items and `shipping_address_collection` is set.   |
| Printful order fails                    | Verify all required address fields populated from Stripe. Check Printful API key.     |
| Webhook doesn't fire                    | Verify signing secret matches. Check endpoint URL is public and responds 200.         |
| Wrong shipping method on Printful order | Verify `STRIPE_TO_PRINTFUL_SHIPPING` mapping. May need to extract via session expand. |

---

**Questions?** See the Stripe Checkout docs: https://stripe.com/docs/payments/checkout
