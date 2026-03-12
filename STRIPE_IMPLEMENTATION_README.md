# Stripe Hosted Checkout Implementation - Documentation Index

Everything you need to implement Stripe's hosted checkout with automatic tax and shipping. Start here.

## TL;DR - Quickest Start

1. **Read**: [STRIPE_IMPLEMENTATION_OVERVIEW.md](STRIPE_IMPLEMENTATION_OVERVIEW.md) (10 min)
2. **Implement**: [BACKEND_IMPLEMENTATION_CHECKLIST.md](BACKEND_IMPLEMENTATION_CHECKLIST.md) (follow step-by-step, ~3-4 hours)
3. **Reference**: [STRIPE_HOSTED_CHECKOUT_IMPLEMENTATION.md](STRIPE_HOSTED_CHECKOUT_IMPLEMENTATION.md) (for detailed code/troubleshooting)

## What Happened Here

### Frontend Changes (Already Done ✅)

- `store/cart.html` - Updated messaging about checkout experience
- `store/success.html` - Now displays shipping address and method
- **Your checkout button works exactly the same** - no behavior changes needed

### What You Need to Do

Implement 3 endpoints on your Vercel backend:

1. Update: `POST /api/create-checkout-session` (add tax/shipping config)
2. Update: `POST /api/webhooks/stripe` (extract shipping, create Printful order)
3. Create: `GET /api/session-details` (show shipping on success page)

## Documentation Files

### 1. [STRIPE_IMPLEMENTATION_OVERVIEW.md](STRIPE_IMPLEMENTATION_OVERVIEW.md) ← START HERE

**Length**: ~15-20 min read  
**Best for**: Understanding the big picture  
**Contains**:

- Complete customer journey flow diagram
- Before/after comparisons of code changes
- File-by-file breakdown of what needs updating
- Implementation timeline and effort estimates
- FAQ and decision trees
- Common gotchas and fixes

**Read if**: You want to understand what's happening before coding

---

### 2. [STRIPE_IMPLEMENTATION_QUICKSTART.md](STRIPE_IMPLEMENTATION_QUICKSTART.md)

**Length**: Quick reference (2-3 min scan)  
**Best for**: Fast lookup while coding  
**Contains**:

- Static shipping options template you can copy/paste
- API response format examples
- Pricing strategy guidance
- Printful rate lookup instructions
- Environment variable checklist
- Key configuration lines for each section

**Read if**: You want quick templates and examples while implementing

---

### 3. [BACKEND_IMPLEMENTATION_CHECKLIST.md](BACKEND_IMPLEMENTATION_CHECKLIST.md) ← FOLLOW STEP-BY-STEP

**Length**: ~2-3 hours implementation following it  
**Best for**: Step-by-step implementation  
**Contains**:

- Part 1: Configuration setup
- Part 2: Update existing endpoint
- Part 3: Create new endpoint
- Part 4: Update webhook handler
- Part 5: Test in Stripe test mode (detailed test scenarios)
- Part 6: Edge case testing
- Part 7: Stripe Dashboard configuration
- Part 8: Go-live preparation
- Debugging commands
- Rollback procedures
- Notes section for tracking decisions

**Read if**: You're ready to implement (open this and work through it)

---

### 4. [STRIPE_HOSTED_CHECKOUT_IMPLEMENTATION.md](STRIPE_HOSTED_CHECKOUT_IMPLEMENTATION.md) ← DEEP REFERENCE

**Length**: Comprehensive (reference doc, ~30-40 min to read fully)  
**Best for**: Detailed code reference and troubleshooting  
**Contains**:

- Overview of the approach and why
- Static shipping configuration code
- Complete backend endpoint code samples
- Stripe webhook handler code
- Session details endpoint code
- Environment variable requirements
- Stripe Dashboard setup instructions
- Testing checklist (20+ test scenarios)
- Troubleshooting table
- Common issues & solutions

**Read if**: You need detailed code examples or are debugging issues

---

## Recommended Reading Order

### If You're New to This:

1. **STRIPE_IMPLEMENTATION_OVERVIEW.md** → understand the concept
2. **STRIPE_IMPLEMENTATION_QUICKSTART.md** → see what's needed super quickly
3. **BACKEND_IMPLEMENTATION_CHECKLIST.md** → implement following steps
4. **STRIPE_HOSTED_CHECKOUT_IMPLEMENTATION.md** → reference during implementation

### If You Just Want to Code:

1. **BACKEND_IMPLEMENTATION_CHECKLIST.md** → follow the steps
2. **STRIPE_HOSTED_CHECKOUT_IMPLEMENTATION.md** → copy/paste code as needed
3. Return to **STRIPE_IMPLEMENTATION_QUICKSTART.md** if you need a config template

### If You're Debugging:

1. **BACKEND_IMPLEMENTATION_CHECKLIST.md** → see debugging commands section
2. **STRIPE_HOSTED_CHECKOUT_IMPLEMENTATION.md** → see troubleshooting table
3. **STRIPE_IMPLEMENTATION_OVERVIEW.md** → review decision tree for your issue

---

## At a Glance: What's Changing

### Frontend (Your Site)

❌ **NOT CHANGING**: Your checkout button, cart page, item selection  
✅ **UPDATED**: Cart text about checkout experience  
✅ **UPDATED**: Success page to show shipping address & method  
✅ **UNCHANGED**: How checkout button works - still just calls backend API

### Backend (Your Vercel App)

📝 **You're adding to `/api/create-checkout-session`**:

- Add `automatic_tax: { enabled: true }`
- Add `shipping_address_collection: { allowed_countries: [...] }`
- Add `shipping_options: [...]` array
- Add tax codes to line items

📝 **You're updating webhook handler `/api/webhooks/stripe`**:

- Extract `session.shipping_details` (customer's address)
- Extract shipping option selected
- Pass address to Printful when creating order
- Map Stripe shipping option → Printful method

🆕 **You're creating new endpoint `/api/session-details`**:

- Accept `session_id` query parameter
- Return shipping address & method for success page display

### Stripe Configuration

- Enable Stripe Tax feature
- Set business address
- Configure webhook endpoint
- Use tax code `txcd_10000000` for merchandise

---

## Key Concepts

**Static vs Dynamic Shipping**

- **Static** (this approach): Set prices once ($6.99 standard, $14.99 express)
- **Dynamic** (future, if needed): Query Printful's rates per address
- Static is simpler for launch, accurate enough with proper pricing

**Tax Behavior**

- `exclusive` (standard US): Tax adds on top of displayed prices
- `inclusive` (standard EU): Tax included in price
- Stripe Tax handles this automatically

**Webhook Signing**

- Stripe sends events to your `/api/webhooks/stripe` endpoint
- Includes `X-Stripe-Signature` header
- Verify using webhook secret from Stripe Dashboard
- Prevents fake webhook injection

---

## Quick Validation

After implementation, you should see:

✅ **In Stripe Test Dashboard**:

- Sessions include `automatic_tax: { status: "complete" }`
- Sessions include `shipping_details` with customer address
- Sessions include `shipping_options` with selected option

✅ **In Success Page**:

- Order Reference shows session ID
- Shipping Address shows full address from Stripe
- Shipping Method shows what customer selected

✅ **In Printful**:

- Order created with customer's actual shipping address
- Order shows shipping method (Standard, Express, etc.)
- Order has all line items with correct quantities

---

## Support Resources

**External Links**:

- Stripe Checkout docs: https://stripe.com/docs/payments/checkout
- Stripe Tax setup: https://stripe.com/docs/tax
- Stripe Tax codes: https://stripe.com/docs/tax/tax-codes
- Printful API docs: https://printful.com/api/v2

**In This Repo**:

- All code examples in: `STRIPE_HOSTED_CHECKOUT_IMPLEMENTATION.md`
- Step-by-step walkthrough: `BACKEND_IMPLEMENTATION_CHECKLIST.md`
- Quick templates: `STRIPE_IMPLEMENTATION_QUICKSTART.md`
- Flow diagrams: `STRIPE_IMPLEMENTATION_OVERVIEW.md`

---

## Estimated Timeline

| Phase              | What                                       | Time          |
| ------------------ | ------------------------------------------ | ------------- |
| **Preparation**    | Read docs, understand flow                 | 20 min        |
| **Configuration**  | Create `shipping-options.js`, set env vars | 15 min        |
| **Backend Dev**    | Update 3 endpoints                         | 2 hours       |
| **Testing**        | Test in Stripe test mode                   | 1 hour        |
| **Deployment**     | Deploy to Vercel, configure webhook        | 15 min        |
| **Verification**   | Run 5-10 live test transactions            | 30 min        |
| **Total Estimate** |                                            | **4-5 hours** |

---

## Files Updated in This Repo (Frontend)

✅ **store/cart.html**

- Clearer message about Stripe handling shipping/tax

✅ **store/success.html**

- Now displays shipping address and method
- Fetches details from new backend endpoint

✅ **store/js/cart-display.js**

- No changes needed (already works!)
- Continues calling `/api/create-checkout-session`

---

## Next Steps

1. **Pick a time**: Set aside 4-5 hours
2. **Read STRIPE_IMPLEMENTATION_OVERVIEW.md**: Understand the flow (15 min)
3. **Open BACKEND_IMPLEMENTATION_CHECKLIST.md**: Follow it step-by-step
4. **Reference STRIPE_HOSTED_CHECKOUT_IMPLEMENTATION.md**: As needed for code
5. **Deploy to Vercel**: Push your changes
6. **Test thoroughly**: Use the testing checklist
7. **Go live**: Switch to live Stripe keys

---

**You've got everything you need. Let's go! 🚀**
