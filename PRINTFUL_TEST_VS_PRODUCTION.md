# Printful Test vs. Production: Implementation Guide

## Key Difference from Stripe

Unlike Stripe which has **separate API keys** for test (`sk_test_...`) and production (`sk_live_...`), Printful has:

- **One API key** that works for both test and production orders
- A **flag in the order creation payload** to control whether an order is test or production
- Test orders won't be fulfilled or charged
- Production orders will be fulfilled and shipped

## Implementation

### 1. Single API Key for All Environments

Store this in your environment variables:

**Local `.env.local`:**

```
PRINTFUL_API_KEY=your_api_key_here
ENVIRONMENT=development
```

**Vercel Preview (Env Vars):**

```
PRINTFUL_API_KEY=your_api_key_here
ENVIRONMENT=preview
```

**Vercel Production (Env Vars):**

```
PRINTFUL_API_KEY=your_api_key_here
ENVIRONMENT=production
```

✅ **All three use the EXACT SAME `PRINTFUL_API_KEY`**

### 2. Set Order Flags Based on ENVIRONMENT

When creating a Printful order, check the `ENVIRONMENT` variable:

**Pseudocode:**

```javascript
async function createPrintfulOrder(shippingData, items) {
  const isTestOrder = process.env.ENVIRONMENT !== "production";

  const orderPayload = {
    recipient: {
      name: shippingData.name,
      address1: shippingData.address.line1,
      address2: shippingData.address.line2,
      city: shippingData.address.city,
      state: shippingData.address.state,
      postal_code: shippingData.address.postal_code,
      country_code: shippingData.address.country,
    },
    items: items,
    shipping: shippingData.shippingMethod, // "STANDARD", "EXPRESS", etc.
    production_partner_id: 1, // Printful's default
    ...(!isTestOrder && { production_partner_id: 1 }), // Live orders
    is_draft: isTestOrder, // OR is_test: isTestOrder, check Printful API docs
  };

  const response = await fetch("https://api.printful.com/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderPayload),
  });

  return response.json();
}
```

**Check Printful API Docs for Exact Flag Name:**
The test/draft flag might be:

- `is_draft: true`
- `is_test: true`
- `draft_order: true`
- Or another name

**Confirm with:** https://printful.readme.io/

### 3. Example Implementation Points

#### In Your Webhook Handler

```javascript
// Stripe webhook received, extract order info
async function handleCheckoutSessionCompleted(session) {
  const shippingInfo = session.shipping_details;
  const shippingMethod = session.shipping_options[0];
  const lineItems = session.line_items;

  // Create Printful order with automatic test/production flag
  const printfulOrder = await createPrintfulOrder(shippingInfo, lineItems);

  // In development/preview: printfulOrder is marked as draft
  // In production: printfulOrder is marked as live and will ship

  return { success: true, order_id: printfulOrder.id };
}
```

#### Environment-Specific Behavior

| Environment         | `ENVIRONMENT` | Order Flag        | Printful Dashboard   | Fulfilled? | Charged? |
| ------------------- | ------------- | ----------------- | -------------------- | ---------- | -------- |
| Local `npm run dev` | `development` | `is_draft: true`  | Shows in Test Orders | ❌ No      | ❌ No    |
| Preview Branch      | `preview`     | `is_draft: true`  | Shows in Test Orders | ❌ No      | ❌ No    |
| Production `main`   | `production`  | `is_draft: false` | Shows in Live Orders | ✅ Yes     | ✅ Yes   |

### 4. Verification

**Test locally:**

```bash
# In backend repo
cat > .env.local << EOF
PRINTFUL_API_KEY=your_key
ENVIRONMENT=development
EOF

npm run dev
# Create an order through checkout
# Verify in Printful dashboard that order appears in "Test Orders", not "Live Orders"
```

**Test in preview:**

```bash
# Set ENVIRONMENT=preview in Vercel dashboard (Preview only)
# Push to feature branch
# Complete checkout
# Verify in Printful dashboard → Test Orders
```

**Then production:**

```bash
# Set ENVIRONMENT=production in Vercel dashboard (Production only)
# Merge to main
# Complete checkout
# Verify in Printful dashboard → Live Orders (will be fulfilled)
```

### 5. Debugging Checklist

If orders aren't appearing in Printful:

- [ ] ✅ `PRINTFUL_API_KEY` is set (same in all envs)
- [ ] ✅ Webhook from Stripe is being received by backend
- [ ] ✅ Order payload includes shipping address
- [ ] ✅ `is_draft` (or equivalent flag) is set correctly
- [ ] ✅ API response doesn't have errors
- [ ] ✅ Check Printful dashboard in correct section:
  - Development/Preview → Look in "Test Orders" section
  - Production → Look in "Live Orders" section

### 6. Monitoring Production Orders

Once live:

1. **Printful Dashboard** → **Live Orders**
   - Should see orders appearing shortly after payment
   - Orders should automatically process

2. **Stripe Dashboard** → **Customers**
   - Verify payment succeeded
   - Verify webhook was sent

3. **Your app logs**
   - Verify webhook handler completed
   - Verify Printful API call succeeded

### Key Takeaway

```
┌─ SAME API Key for all environments
│
├─ The ENVIRONMENT variable (usually development/preview/production)
│  controls the behavior
│
└─ Backend code uses ENVIRONMENT to set the order flag
   (is_draft: true for test, is_draft: false for live)
```

No separate "test" and "production" API keys exist in Printful. Just one key + one flag.
