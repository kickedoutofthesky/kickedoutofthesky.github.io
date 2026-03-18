# Backend Order Details Endpoint

> **Note:** This document describes the backend endpoint in the separate [`kickedoutofthesky-store`](https://kickedoutofthesky-store.vercel.app) Vercel repository.

## Overview

The `/api/order-details` endpoint retrieves and returns order information from a completed Stripe checkout session. It's called by the success page after Stripe redirects the customer back to your site.

## When It's Called

After payment is completed, Stripe redirects the customer to your success URL with the session ID appended as a query parameter:

```
https://kickedoutofthesky.com/store/success.html?session_id=cs_test_abc123
```

The frontend JavaScript extracts that `session_id` from the URL and makes a request to your backend:

```javascript
fetch(`${backendUrl}/api/order-details?session_id=cs_test_abc123`);
```

## Endpoint Specification

**Route:** `GET /api/order-details`

**Query Parameters:**

- `session_id` (required): The Stripe checkout session ID (format: `cs_test_...` or `cs_live_...`)

## Implementation Requirements

### 1. Validate the Session ID

- Verify the session*id format is valid (starts with `cs*`)
- Call Stripe's API: `stripe.checkout.sessions.retrieve(session_id)`

### 2. Validate Payment Status

- **Critical security check:** Ensure `session.payment_status === "paid"`
- Reject any session that is `unpaid`, `no_payment_required`, etc.
- Return **401 Unauthorized** if payment status is not paid
- This prevents attackers from guessing session IDs and seeing other customers' order information

### 3. Validate Session Ownership (Optional but Recommended)

- If you store session metadata when creating the checkout, verify it belongs to your store
- Example: When creating the session, include `metadata: { store_id: "your_store_id" }`
- Verify this metadata matches your store when retrieving
- Return **401 Unauthorized** if session metadata doesn't match

### 4. Extract Safe Data from Stripe Session

Do **NOT** return the raw session object — it contains sensitive payment method details.

Return only these fields:

```json
{
  "shippingDetails": {
    "name": "Customer Name",
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
  "orderSummary": {
    "subtotal": 5999,
    "shipping": 1000,
    "tax": 600,
    "total": 7599
  },
  "customerEmail": "customer@example.com",
  "lineItems": [
    {
      "name": "Product Name",
      "quantity": 2,
      "price": 2999
    }
  ]
}
```

**Fields to extract:**

- `shippingDetails`: From `session.shipping_details` (name + address)
- `shippingOption`: From `session.shipping_options` (the selected shipping method label)
- `orderSummary`: Calculate from `session.amount_subtotal`, `session.shipping_cost`, `session.total_details.amount_tax`, `session.amount_total` (all in cents)
- `customerEmail`: From `session.customer_details.email`
- `lineItems`: List of items ordered

### 5. Error Handling

**Return 404 if:**

- Session ID not found in Stripe
- Session payment_status is not "paid"

**Return 401 if:**

- Session doesn't belong to your store (metadata validation fails)

**Return 500 if:**

- Stripe API call fails
- Other server error

## Security Checklist

- ✅ Verify `payment_status === "paid"`
- ✅ Validate session belongs to your store (metadata)
- ✅ Don't return raw Stripe session object
- ✅ Don't return payment method details
- ✅ Validate session_id format before calling Stripe
- ✅ Use your Stripe secret key (never expose public key to backend)
- ✅ Handle Stripe API errors gracefully

## Integration with Printful

After validating the session, you can also:

1. Extract the shipping address from the session
2. Create a Printful order with that shipping address
3. Store the order record in your database (optional but recommended)

This typically happens via the webhook handler, not this endpoint, but this endpoint can access all the data needed if you want to create the order here.

## Frontend Error Handling

The frontend will handle these responses:

- **200 OK + valid data** → Display order confirmation with shipping details
- **404 Not Found** → Show "Order not found or payment incomplete" error
- **401 Unauthorized** → Show generic "thanks" (don't expose auth details)
- **5xx Server Error** → Show "Order was placed, check your email" (reassuring, since payment already succeeded)
- **No session_id in URL** → Show generic "thanks" (customer may have bookmarked success page)

## Example Implementation (Node.js/Express)

```javascript
app.get("/api/order-details", async (req, res) => {
  const { session_id } = req.query;

  // Validate session_id format
  if (!session_id || !session_id.startsWith("cs_")) {
    return res.status(400).json({ error: "Invalid session_id" });
  }

  try {
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Validate payment status
    if (session.payment_status !== "paid") {
      return res.status(404).json({ error: "Order not found" });
    }

    // Validate session belongs to your store (if using metadata)
    if (session.metadata?.store_id !== process.env.STORE_ID) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Return sanitized order details
    const orderDetails = {
      shippingDetails: {
        name: session.shipping_details?.name,
        address: session.shipping_details?.address,
      },
      shippingOption: session.shipping_options?.[0]?.shipping_rate_data?.display_name,
      orderSummary: {
        subtotal: session.amount_subtotal,
        shipping: session.shipping_cost || 0,
        tax: session.total_details?.amount_tax || 0,
        total: session.amount_total,
      },
      customerEmail: session.customer_details?.email,
      lineItems: session.line_items,
    };

    res.status(200).json(orderDetails);
  } catch (error) {
    console.error("Error retrieving session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

## Testing

### Test Cases

1. **Valid paid session** → Returns 200 with order details
2. **Unpaid session** → Returns 404
3. **Non-existent session** → Returns 404
4. **Invalid session_id format** → Returns 400 or 404
5. **Session from different store** → Returns 401 (if using metadata)
6. **Stripe API down** → Returns 500

### Manual Testing

Use Stripe's test mode session ID (format: `cs_test_...`) to verify the flow.
