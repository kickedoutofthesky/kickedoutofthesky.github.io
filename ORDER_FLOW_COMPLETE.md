# Complete Order Flow: Frontend → Stripe → Success

This document describes the exact flow when a customer checks out and completes their order.

## Step 1: Customer Proceeds to Checkout

**Frontend:** Customer clicks "Proceed to Checkout" button on cart page

**Frontend Code:** [store/js/cart-display.js](store/js/cart-display.js#L156-L230)

**Action:**

- Cart items are transformed into minimal order data (product ID, variant ID, quantity only)
- Frontend sends POST to backend `/api/create-checkout-session` with:
  ```json
  {
    "items": [
      {
        "variant_id": "123456",
        "quantity": 2,
        "price_cents": 2999,
        "color": "black",
        "size": "M"
      }
    ],
    "successUrl": "https://kickedoutofthesky.com/store/success.html?session_id={CHECKOUT_SESSION_ID}",
    "cancelUrl": "https://kickedoutofthesky.com/store/cart.html"
  }
  ```

**Key Point:** `{CHECKOUT_SESSION_ID}` is a Stripe placeholder that backend includes when creating the session. Stripe will replace it with the actual session ID.

## Step 2: Backend Creates Stripe Session

**Backend:** `/api/create-checkout-session` endpoint receives the order

**Backend Actions:**

1. Validate cart items
2. Call Stripe API: `stripe.checkout.sessions.create({...})`
3. Configuration includes:
   - `payment_method_types: ["card"]`
   - `mode: "payment"`
   - `line_items: [{ price_data: {...}, quantity: 2 }]`
   - `automatic_tax_calculation: { enabled: true }`
   - `shipping_address_collection: { allowed_countries: ["US", "CA", ...] }`
   - `shipping_options: [{ shipping_rate_data: {...} }, ...]`
   - `success_url: "...?session_id={CHECKOUT_SESSION_ID}"`
   - `cancel_url: "..."`

**Backend Response:** Returns to frontend:

```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_abc123...",
  "sessionId": "cs_test_abc123..."
}
```

## Step 3: Frontend Redirects to Stripe

**Frontend Code:** [store/js/cart-display.js](store/js/cart-display.js#L216-L220)

**Action:**

```javascript
window.location.href = data.url; // Redirect to Stripe
```

**Result:** Customer leaves your site and is now on Stripe's hosted checkout page

## Step 4: Customer Completes Payment on Stripe

**Location:** `checkout.stripe.com` (NOT your site)

**Customer enters:**

- Email address
- Shipping address (name, street, city, state, postal code, country)
- Shipping method selection (you defined these options when creating the session)
- Card details

**Stripe calculates:**

- Tax based on shipping address and product tax codes
- Shipping cost based on selected method
- Displays breakdown: Subtotal + Shipping + Tax = Total

**Customer clicks:** "Pay" button

**Result:** Payment is processed. If successful, Stripe:

1. Sends webhook to your backend with full order details
2. Redirects customer to success URL with session ID appended

## Step 5: Stripe Redirects Customer Back

**Redirect URL:**

```
https://kickedoutofthesky.com/store/success.html?session_id=cs_test_abc123xyz789
```

**Result:** Customer's browser loads your success page

## Step 6: Frontend Retrieves Order Details

**Frontend Code:** [store/success.html](store/success.html#L154-L209)

**Actions:**

1. JavaScript runs when page loads
2. Extracts `session_id` from URL query parameters:

   ```javascript
   const params = new URLSearchParams(window.location.search);
   const sessionId = params.get("session_id"); // "cs_test_abc123xyz789"
   ```

3. Displays order reference number with session ID

4. Makes API call to backend:
   ```javascript
   fetch(`${backendUrl}/api/order-details?session_id=${sessionId}`);
   ```

## Step 7: Backend Retrieves Order Details from Stripe

**Backend:** `/api/order-details` endpoint receives request

**Backend Actions:**

1. Validate `session_id` format
2. Call Stripe API: `stripe.checkout.sessions.retrieve(session_id)`
3. **Critical:** Verify `session.payment_status === "paid"`
4. Extract safe data (no payment method details):
   - Customer email
   - Shipping address (name, street, city, state, postal code, country)
   - Selected shipping method
   - Line items (product names, quantities)
   - Order totals (subtotal, shipping, tax, total)

5. Return to frontend:

```json
{
  "shippingDetails": {
    "name": "John Doe",
    "address": {
      "line1": "123 Main St",
      "line2": "Apt 4",
      "city": "New York",
      "state": "NY",
      "postal_code": "10001",
      "country": "US"
    }
  },
  "shippingOption": "Express Shipping",
  "customerEmail": "john@example.com",
  "orderSummary": {
    "subtotal": 5999,
    "shipping": 1000,
    "tax": 600,
    "total": 7599
  },
  "lineItems": [...]
}
```

## Step 8: Front End Displays Success Page

**Frontend Code:** [store/success.html](store/success.html)

**Displays:**

- ✅ Confirmation message
- ✅ Order reference number (session ID)
- ✅ Shipping address (from backend response)
- ✅ Shipping method selected (from backend response)
- ✅ Order summary / line items (optional, from backend response)
- ✅ "Return to Store" button link

## Simultaneously: Webhook Handling (Backend)

While the customer is being redirected back to your success page, Stripe's webhook server is also sending an event to your backend.

**Stripe Webhook:** `POST /api/webhook` with event type `checkout.session.completed`

**Webhook Payload includes:**

- Full session details
- Customer's shipping address
- Selected shipping method
- Tax information
- Payment confirmation

**Backend Webhook Handler Actions:**

1. Verify webhook signature (ensure it's really from Stripe, not an attacker)
2. Check payment status is "paid"
3. Extract shipping address
4. **Create Printful order** using:
   - Customer's shipping address
   - Line items (products, quantities)
   - Any other required Printful data

5. Store order record in your database (optional but recommended)

## Error Handling

### Frontend Error Cases

**No session_id in URL:**

- User bookmarked success page directly
- Session expired
- Frontend shows: Generic thank you message

**Invalid or expired session:**

- User's session expired or doesn't exist
- Backend returns 404
- Frontend shows: "Order not found or payment incomplete. Check your email for details."

**Backend API call fails:**

- Network error, Stripe API down, etc.
- Payment already succeeded (Stripe will send webhook)
- Frontend shows: "Your order was placed successfully! Check your email for confirmation and shipping details."

### Backend Error Cases

**session_id not found:**

- Return 404
- Frontend will show friendly error

**payment_status not "paid":**

- Return 404 (don't expose that session exists but is unpaid)
- Frontend will show friendly error

**Session not from your store:**

- Return 401 (unauthorized)
- Frontend will show thank you (don't expose auth details)

**Stripe API fails:**

- Return 500
- Frontend will show thank you (payment already processed)

## Data Security

### What the frontend sees:

- Order reference (session ID)
- Shipping address (safe to display)
- Shipping method
- Email address
- Item names, quantities, prices
- Tax, shipping costs, totals

### What the frontend NEVER sees:

- Payment method details (card number, expiry, CVC)
- Raw Stripe session object
- Customer ID
- Stripe secret key

### What stays on Stripe:

- Full payment details
- Card data (PCI compliance)
- Complete transaction record

### What your backend has:

- Stripe secret key (environment variable, never exposed)
- Webhook signing secret (environment variable)
- Full Stripe session data (processed and sanitized before sending to frontend)

## Summary: Frontend Responsibilities

✅ Display products and cart
✅ Send cart items to backend (product ID, variant ID, quantity only)
✅ Redirect to Stripe checkout URL
✅ Receive redirect from Stripe with session_id in URL
✅ Extract session_id from URL
✅ Request order details from backend
✅ Display success page with order confirmation

❌ Never collect shipping address
❌ Never collect payment details
❌ Never calculate tax
❌ Never select shipping methods
❌ Never validate card numbers
❌ Never handle Stripe keys

All of the above ❌ items are Stripe's responsibility.
