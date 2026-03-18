# Manual Testing Checklist

## Pre-Launch Testing Verification

This document outlines manual testing that should be completed before going live. While automated tests catch regressions, some scenarios are best verified by hand.

---

## 1. End-to-End Order Flow (Stripe Test Mode)

### Setup

- [ ] Ensure you have Stripe test credentials configured
- [ ] Note Stripe test API keys in your environment
- [ ] Verify dev server is running locally: `npm run dev`
- [ ] Use test card: **4242 4242 4242 4242** (always succeeds)
- [ ] Use test card: **4000 0000 0000 0002** (always declines)

### Happy Path (Success)

1. [ ] Open store at `http://localhost:3000/store`
2. [ ] Browse products - verify images load correctly
3. [ ] Click on a product - details page displays
4. [ ] Select a size from dropdown (if available)
5. [ ] Select a color from dropdown (if available)
6. [ ] Verify price is correct for variant
7. [ ] Click "Add to Cart"
8. [ ] Verify notification/confirmation appears
9. [ ] Click cart icon or "Go to Cart"
10. [ ] Verify cart displays correct item, quantity, price
11. [ ] Click "Proceed to Checkout"
12. [ ] Redirected to Stripe checkout page
13. [ ] Enter email address: `test@example.com`
14. [ ] Enter shipping info (use test address):
    - Name: Test User
    - Address: 123 Test St
    - City: Testville
    - State: CA
    - ZIP: 12345
15. [ ] Verify shipping rate displays
16. [ ] Click next to payment
17. [ ] Enter test card: **4242 4242 4242 4242**
18. [ ] Enter any future expiry date (e.g., 12/25)
19. [ ] Enter any CVC (e.g., 123)
20. [ ] Submit payment
21. [ ] Page redirects to success page
22. [ ] Success message displays order confirmation
23. [ ] Confirmation email received (check spam folder)

### Decline Card Test

1. [ ] Go back to cart (or add new product)
2. [ ] Proceed to checkout
3. [ ] Enter test card: **4000 0000 0000 0002**
4. [ ] Attempt payment
5. [ ] Verify error message displays
6. [ ] Can try alternative payment method

### Cart Management During Checkout

1. [ ] Go to cart
2. [ ] Add 2+ different products or variants
3. [ ] Verify cart totals calculate correctly
4. [ ] Change quantity of one item
5. [ ] Verify subtotal updates
6. [ ] Remove one item
7. [ ] Verify subtotal updates and removed item gone
8. [ ] Verify checkout button still works with remaining items

---

## 2. Device Testing

### Mobile Devices

Test on at least 2 real phones (iOS and Android if possible):

#### iPhone (iOS)

- [ ] iPhone SE (375px) - store page loads
- [ ] iPhone SE - product details accessible
- [ ] iPhone SE - can select size/color
- [ ] iPhone SE - add to cart works
- [ ] iPhone SE - cart page readable
- [ ] iPhone SE - checkout accessible

#### Android

- [ ] Android phone (similar width to iPhone) - store loads
- [ ] Android - navigation buttons accessible
- [ ] Android - forms fill easily
- [ ] Android - checkout works

### Tablets

- [ ] iPad or iPad-like device (768px+) - layout responsive
- [ ] Landscape orientation - layout adapts
- [ ] Portrait orientation - no horizontal scroll

### Desktop

- [ ] Desktop (1280px+) - full layout displays
- [ ] Desktop wide (1920px) - content doesn't stretch awkwardly
- [ ] Desktop - all images load
- [ ] Desktop - all buttons clickable and right size

### Cross-Browser Testing (Desktop)

- [ ] Chrome - full flow works
- [ ] Safari - full flow works
- [ ] Firefox - full flow works
- [ ] Edge - full flow works (if available)

---

## 3. Image & Media Loading

### Product Images

- [ ] All product images display correctly
- [ ] Images load quickly (< 2 seconds)
- [ ] Images display correct variant (e.g., color shows correct tee color)
- [ ] Broken images have alt text visible
- [ ] No image distortion (stretched/compressed)

### Responsive Images

- [ ] Mobile: product images sized for mobile
- [ ] Tablet: product images appropriately scaled
- [ ] Desktop: product images display at intended size
- [ ] No images causing horizontal scroll

---

## 4. Form Input Validation

### Size/Color Selection

- [ ] Can't add item without required fields selected
- [ ] Reset product shows default state
- [ ] Re-selecting doesn't double-add to cart

### Quantity Input

- [ ] Can increase quantity to reasonable number (1-100)
- [ ] Can't set quantity to 0
- [ ] Can't set quantity to negative number
- [ ] Extremely large numbers handled gracefully

### Checkout Form (Shipping & Payment)

- [ ] Required fields marked as required
- [ ] Validation shows on invalid input
- [ ] Can't submit with empty required fields
- [ ] Email format validated
- [ ] ZIP code accepts valid US ZIP

---

## 5. Performance & Speed

### Page Load Times

- [ ] Store page loads in < 3 seconds (first load)
- [ ] Store page loads in < 1.5 seconds (cached)
- [ ] Product page loads in < 1 second
- [ ] Cart page loads in < 1 second
- [ ] Checkout page redirects smoothly

### Concurrent Actions

- [ ] Can add multiple products in sequence without lag
- [ ] Cart updates quickly when quantity changes
- [ ] Remove item is instant

### Network Throttling (Optional - advanced)

- [ ] Simulate Slow 3G in DevTools
- [ ] Add to cart still works
- [ ] Verify error handling on timeout

---

## 6. Data & Persistence

### Cart Persistence

- [ ] Add item to cart
- [ ] Close browser tab (or go to different site)
- [ ] Return to store
- [ ] Item still in cart ✓
- [ ] Quantity preserved ✓
- [ ] Price/variant preserved ✓

### Session Data

- [ ] Go to checkout
- [ ] Navigate back to store
- [ ] Cart items preserved
- [ ] Quantities preserved

### Local Storage

- [ ] Open DevTools → Application → LocalStorage
- [ ] Verify `cart` key exists with cart data
- [ ] Refresh page - data persists
- [ ] Clear localStorage - cart clears

---

## 7. Email Confirmations

### Confirmation Email

- [ ] Received after successful payment
- [ ] Arrives within 2 minutes
- [ ] Correct order number included
- [ ] Correct order total included
- [ ] Shipping address displays correctly
- [ ] Contains link to order tracking (if applicable)
- [ ] Formatting looks good on desktop & mobile

### Printful Email (Optional)

- [ ] Printful receives order
- [ ] Printful processes order (takes 30-60 min typically)
- [ ] Order status updates available

---

## 8. Navigation & UI

### Header/Footer Navigation

- [ ] Logo/home link takes to home page
- [ ] Store link takes to store page
- [ ] Cart icon accurate count
- [ ] All links work and don't 404

### Breadcrumbs/Back Buttons (if applicable)

- [ ] Back button works on product detail
- [ ] Can navigate back to store without losing cart
- [ ] Can navigate cart → store → cart without losing items

### Accessibility Basics

- [ ] Can tab through all interactive elements
- [ ] Focus visible (outline/highlight visible)
- [ ] Buttons and links have descriptive text
- [ ] Images have alt text
- [ ] Color not the only way to convey information

---

## 9. Error Scenarios

### Network Errors

- [ ] Disable internet briefly during checkout
- [ ] Verify error message displays (not blank page)
- [ ] Can retry payment

### Invalid Shipping Address

- [ ] Try to checkout with invalid ZIP code
- [ ] Error message displays
- [ ] Can fix and retry

### Payment Processing Errors

- [ ] Use declined test card
- [ ] Clear error message displays
- [ ] Shows which card was declined
- [ ] Can try different card

### Empty Cart Checkout

- [ ] Clear cart
- [ ] Try to access checkout
- [ ] Verify can't check out with no items
- [ ] Prompted to add items

---

## 10. Security Checks

### HTTPS (Production)

- [ ] ✓ GitHub Pages uses HTTPS by default
- [ ] Lock icon visible in address bar
- [ ] No mixed content warnings

### Payment Security

- [ ] Stripe checkout is on Stripe's domain (not your domain)
- [ ] No payment info stored on your server
- [ ] Webhook secrets configured (see STRIPE_WEBHOOK_GUIDE.md)

### Data Privacy

- [ ] No sensitive data in browser console
- [ ] Cart data only stored locally (not sent to third party)
- [ ] Customer email not logged inappropriately

---

## 11. Success Page Flow

### Page Load & Display

- [ ] Success page loads immediately after payment
- [ ] Loading indicator displays during initial page load
- [ ] Loading indicator hides once order details load
- [ ] Page displays "✓ Order Successful" message
- [ ] "Thank you for your purchase!" message visible

### Customer Information

- [ ] Customer name displayed
- [ ] Customer email displayed
- [ ] Customer phone number displayed (if provided)
- [ ] Customer information section is clearly labeled

### Order Items Display

- [ ] All order items are visible without scrolling
- [ ] No internal scrollbar in order items section
- [ ] Product images display for each item
- [ ] Product images are properly sized and positioned
- [ ] Item name/description displays (e.g., "Unisex Tee w/ Man Falling - Black / S")
- [ ] Quantity displays for each item
- [ ] Unit price displays per item
- [ ] Line total displays for each item
- [ ] Currency symbol ($) displays correctly

### Shipping Address

- [ ] Shipping address section clearly labeled
- [ ] Recipient name displays
- [ ] Street address displays
- [ ] City, state, postal code display in correct format
- [ ] Country displays as full name (e.g., "United States" not "US")
- [ ] Shipping method displays (if provided)

### Order Summary

- [ ] Subtotal displays correctly
- [ ] Shipping cost displays correctly
- [ ] Tax amount displays correctly
- [ ] Total amount displays prominently
- [ ] All monetary values formatted with currency symbol and 2 decimal places

### Responsive Design Testing

**Desktop (1200px+):**

- [ ] Two-column layout: order items on left, customer/shipping info on right
- [ ] Sidebar is sticky and visible while scrolling
- [ ] Proper spacing between columns

**Tablet (768px-999px):**

- [ ] Single column layout
- [ ] Cards stack vertically
- [ ] Full width content
- [ ] Information is easy to read

**Mobile (≤767px):**

- [ ] Single column layout
- [ ] Order items and customer info stack vertically
- [ ] Content is readable without horizontal scrolling

**Small Mobile (≤576px):**

- [ ] Product images display above item details
- [ ] Item details wrap below images
- [ ] Text is readable and not cramped
- [ ] All fields visible without excessive scrolling

### UI Elements

- [ ] Order confirmation number NOT displayed on page
- [ ] "Return to Store" button does NOT exist
- [ ] No unnecessary buttons or links present
- [ ] Page layout is clean and minimal

### Multi-Item Orders

- [ ] If order contains 2+ items, all display correctly
- [ ] Images display for each item variant
- [ ] Pricing calculations are correct for each item
- [ ] Total reflects sum of all items plus shipping/tax

### Product Image Display

- [ ] Product images load without errors
- [ ] Images display for different product types (tees, hoodies, stickers, etc.)
- [ ] The correct variant image displays (e.g., "Black" color shows black image)
- [ ] No broken image placeholders

### Follow-up Actions

- [ ] Email confirmation received (check spam/promotions folder)
- [ ] Customer can reference order for future inquiries
- [ ] Cart is cleared (if user returns to store)

---

## 12. Cancel Page Flow

### If Customer Cancels Checkout

- [ ] Cancel page informational (not error-looking)
- [ ] Reason for cancellation clear
- [ ] "Return to Store" button works
- [ ] Cart preserved (items can complete purchase later)

---

## 13. Social & Sharing (Optional)

- [ ] OG tags configured for social preview
- [ ] Page title descriptive in browser tab
- [ ] Product titles show in search results (SEO)

---

## 14. Analytics & Logging

### Funnel Verification

- [ ] Store pageview tracks
- [ ] Product detail pageview tracks
- [ ] Checkout start tracks
- [ ] Order completion tracks
- [ ] Can see funnel in analytics (if configured)

### Error Logging

- [ ] No 404 errors in console
- [ ] No uncaught JavaScript errors
- [ ] Stripe errors logged appropriately
- [ ] Network failures logged

---

## 15. Documentation & Setup Verification

### Backend Configuration (separate repo)

- [ ] [ ] Verify Stripe webhook endpoint configured
- [ ] [ ] Webhook secret configured correctly
- [ ] [ ] Printful credentials configured (test mode)
- [ ] [ ] Environment variables set properly
- [ ] [ ] See STRIPE_WEBHOOK_GUIDE.md for webhook setup

### Frontend Configuration (this repo)

- [ ] Printful API key configured in `.env`
- [ ] Products fetched from Printful API
- [ ] Store loads with real product data
- [ ] Variants match Printful catalog

---

## Sign-Off Checklist

Use this before deploying to production:

### Pre-Launch Sign-Off

- [ ] All 15 sections above tested
- [ ] All tests pass locally (`npm test` and `npm run e2e`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] GitHub Actions CI passing on latest push
- [ ] Manual testing completed on 2+ devices
- [ ] Stripe test mode verified working
- [ ] Confirmation email received and looks good
- [ ] Team review completed
- [ ] Status page updated (if applicable)

### Post-Launch Monitoring (First 24 Hours)

- [ ] Monitor error tracking (Sentry/logs) for issues
- [ ] Check analytics for traffic patterns
- [ ] Manually place 1-2 real orders to verify end-to-end
- [ ] Monitor customer support channels for issues
- [ ] Have rollback plan ready (revert to previous deploy)

---

## Testing Notes

**Record here any issues found during manual testing:**

```
Issue #1:
- Device: ___________
- Browser: ___________
- Description: ___________
- Severity: [Critical / High / Medium / Low]
- Resolution: ___________
- Status: [Fixed / Documented / Known Issue]

Issue #2:
...
```

---

## Resources

- **Stripe Test Cards:** https://stripe.com/docs/testing
- **Responsive Testing:** Chrome DevTools → Device Preview
- **Performance Testing:** Chrome DevTools → Lighthouse
- **Console Logging:** Chrome DevTools → Console tab
- **Network Testing:** Chrome DevTools → Network tab (throttle speed)
- **Local Storage:** Chrome DevTools → Application → Local Storage
- **Security Headers:** https://securityheaders.com (for production)

---

## Final Notes

- Manual testing typically takes **1-2 hours** for comprehensive coverage
- Focus heavily on the order flow and payment - this is where users are most critical
- Test on at least one real mobile device (not just DevTools simulator)
- Save this checklist and reuse before each major update
- Update this checklist as you discover edge cases
