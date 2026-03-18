# Stripe Webhook Integration Guide

> **Note:** This document describes the backend webhook handler in the separate [`kickedoutofthesky-store`](https://kickedoutofthesky-store.vercel.app) Vercel repository.

This guide documents how to verify Stripe webhook signatures and handle payment events for the store.

## Webhook Signature Verification

Stripe sends events to your webhook endpoint. You must validate the signature using your webhook signing secret.

### Test Webhook Signing Secret

Use your test mode endpoint secret from Stripe Dashboard:

```
whsec_test_...  (for test mode)
whsec_live_...  (for production)
```

### Verification Process

1. **Get the Stripe Signature Header**
   - Stripe includes `stripe-signature` header in webhook POST requests
   - Format: `t=<timestamp>,v1=<signature>`

2. **Compute Expected Signature**

   ```
   signed_content = timestamp + "." + request_body
   signature = HMAC-SHA256(signed_content, webhook_secret)
   ```

3. **Compare Signatures**
   - Extract provided signature from header
   - Compute expected signature
   - Signatures must match (use timing-safe comparison)

4. **Verify Timestamp**
   - Prevent replay attacks
   - Reject if older than 5 minutes: `current_time - timestamp > 300`

## Key Events to Handle

### `checkout.session.completed`

- **When**: Customer successfully completes payment
- **Action**: Order fulfillment, send confirmation email
- **Data Available**:
  - `session.id` - Stripe Session ID
  - `session.payment_status` - "paid" (guaranteed for this event)
  - `session.customer_email` - Customer email
  - `session.metadata` - Your custom order data
  - `session.amount_total` - Total in cents

### `payment_intent.succeeded`

- **When**: Payment intent succeeds
- **Status**: Alternative to checkout.session.completed
- **Data Available**:
  - `payment_intent.id` - Payment Intent ID
  - `payment_intent.amount` - Amount in cents
  - `payment_intent.status` - "succeeded"

### `charge.dispute.created`

- **When**: Dispute/chargeback is filed
- **Action**: Log dispute, potentially freeze fulfillment
- **Note**: Not expected in standard test flow

## Test Card Numbers

### Successful Payment

```
Card: 4242 4242 4242 4242
Exp: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
Result: Payment succeeds
```

### Declined Payment

```
Card: 4000 0000 0000 0002
Exp: Any future date
CVC: Any 3 digits
Result: Payment declined with generic_decline error
```

## Testing Webhook Signature Verification

### Using Stripe CLI

1. **Install Stripe CLI**

   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login to Stripe Account**

   ```bash
   stripe login
   ```

3. **Forward Webhooks to Local Endpoint**

   ```bash
   stripe listen --forward-to localhost:3000/webhooks/stripe
   ```

4. **Get Webhook Secret**
   - CLI will display: `whsec_1234567890...`
   - Use this for local testing

5. **Trigger Test Events**
   ```bash
   stripe trigger checkout.session.completed
   ```

## Implementation Checklist

- [ ] Stripe test API key configured in environment variables
- [ ] Webhook endpoint created at `/webhooks/stripe`
- [ ] Webhook signing secret stored securely (environment variable)
- [ ] Signature verification implemented with timing-safe comparison
- [ ] Timestamp validation implemented (reject if > 5 minutes old)
- [ ] Event handlers implemented for `checkout.session.completed`
- [ ] Order creation on successful payment event
- [ ] Error logging for webhook processing failures
- [ ] Localhost testing with Stripe CLI
- [ ] Test cards validated in development

## Security Notes

⚠️ **Never:**

- Hardcode API keys or signing secrets
- Log sensitive payment data
- Send customer payment details via email

✅ **Always:**

- Use HTTPS for webhook endpoints (required by Stripe)
- Store secrets in environment variables
- Use timing-safe comparison for signature verification
- Log webhook events for debugging
- Validate signature before processing

## Environment Variables Required

```bash
STRIPE_TEST_PUBLIC_KEY=pk_test_...
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# For production
STRIPE_LIVE_PUBLIC_KEY=pk_live_...
STRIPE_LIVE_SECRET_KEY=sk_live_...
STRIPE_LIVE_WEBHOOK_SECRET=whsec_live_...
```

## References

- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Webhook Signature Verification](https://stripe.com/docs/webhooks/signatures)
