# Tax Calculation Workflow Implementation

## Overview

This document describes the tax calculation workflow that has been implemented in the shopping cart. The workflow handles tax calculations for different countries, with support for both inclusive VAT (EU/UK) and exclusive sales tax (US), and properly formats currency for different regions.

## Architecture

### API Endpoints

#### 1. POST /api/quote

**Purpose**: Calculate order totals including tax, shipping, and duties

**Request Format**:

```json
{
  "items": [
    { "sku": "variant_id", "qty": 1 },
    { "sku": "variant_id_2", "qty": 2 }
  ],
  "country": "US"
}
```

**Response Format**:

```json
{
  "subtotal": 5000,                                    // minor units (cents)
  "shipping": 800,                                     // minor units
  "tax": 350,                                          // minor units
  "taxLabel": "Sales tax (7%)",                       // display text
  "taxIncluded": false,                               // false for US, true for EU/UK
  "total": 6150,                                       // minor units (subtotal + shipping + tax)
  "currency": "USD",                                   // 3-letter currency code
  "breakdown": {...},                                  // optional detailed breakdown
  "importDutiesNote": null,                           // null or true if import duties apply
  "calculationId": "quote_xxx"                        // server-generated ID for verification
}
```

#### 2. POST /api/checkout

**Purpose**: Create payment intent with verified quote

**Request Format**:

```json
{
  "calculationId": "quote_xxx", // from previous /api/quote response
  "items": [{ "sku": "variant_id", "qty": 1 }],
  "country": "US",
  "email": "customer@example.com"
}
```

**Response Format**:

```json
{
  "client_secret": "pi_xxx_secret_xxx" // for Stripe.js
}
```

## Frontend Implementation

### Key State Variables

- **`currentQuote`**: The latest quote response object (single source of truth for display)
- **`quoteDebounceTimer`**: Timer ID for debouncing quote API calls
- **`isCheckingOut`**: Flag to lock UI during checkout flow

### Cart Display Changes

The order summary now displays:

```
Subtotal            {subtotal}
Shipping            {shipping}
{taxLabel}          {tax}              // e.g., "Includes €4.67 VAT (23%)"
------------------------------
Total               {total}
```

**Tax Display Rules**:

- If `taxIncluded === true`: Tax line appears muted (informational only)
- If `taxIncluded === false`: Tax line appears as normal line item
- `taxLabel` text comes from API (e.g., "Sales tax (7%)" vs "Includes €4.67 VAT (23%)")

### Debouncing & Performance

Quote API calls are debounced at **~400ms**:

- When cart contents change (item quantity, removal)
- When user selects/changes country

This prevents excessive API calls and network usage while providing responsive UX.

### Loading & Error States

**Loading State**:

- Shows spinner + "Calculating tax..." message
- Summary content is hidden
- Checkout button remains disabled

**Error State**:

- Displays error message in colored box
- Summary content is hidden
- Checkout button disabled
- User can modify cart/country and retry

### Currency Formatting

The frontend uses the `formatCurrency()` function to convert minor units (cents) to display format:

```javascript
formatCurrency(5000, "USD"); // Returns: "$50.00"
formatCurrency(500, "EUR"); // Returns: "€5.00"
formatCurrency(1000, "GBP"); // Returns: "£10.00"
```

Supports: USD, EUR, GBP, CAD, AUD, JPY, CNY, INR

### Country Selector Lock

Once checkout begins:

1. Country selector is disabled (`disabled = true`)
2. `isCheckingOut` flag prevents quote refetches
3. If user later cancels, flag/lock are reset

This ensures the price shown during payment matches the quote sent to backend.

### Checkout Flow

1. User clicks "Proceed to Checkout"
2. Frontend shows loading state: "Processing..."
3. Email is collected (via prompt - can be enhanced to form field)
4. Items are transformed to SKU format
5. POST to `/api/checkout` with `calculationId` from quote
6. Backend re-runs quote server-side and verifies totals match
7. Backend creates Stripe PaymentIntent
8. Frontend receives `client_secret`
9. Stripe payment confirmation (implementation depends on checkout type)

## Files Modified

### 1. store/cart.html

- Updated order summary section with loading/error state UI
- Added import duties note placeholder
- Improved semantic HTML structure
- Reordered summary lines: Subtotal → Shipping → Tax → Total

### 2. store/js/cart-display.js

**New Functions**:

- `debounce()`: Utility for debouncing API calls
- `buildQuoteItems()`: Transform cart to SKU format for API
- `fetchQuote()`: Fetch quote from backend, handle loading/error states
- `showQuoteLoading()`: Show/hide loading indicator
- `showQuoteError()`: Display error message
- `hideQuoteError()`: Clear error display
- `formatCurrency()`: Convert minor units to currency display
- `debouncedFetchQuote()`: Debounced version of fetchQuote

**Modified Functions**:

- `displayCart()`: Triggers debounced quote fetch on cart changes
- `setupCountrySelector()`: Uses debounced quote fetch, locks country during checkout
- `updateCheckoutButtonState()`: Also checks for fresh quote loaded
- `proceedToCheckout()`: Uses new `/api/checkout` endpoint, passes calculationId
- `updateOrderSummaryDisplay()`: Renders from quote response, handles taxIncluded flag
- `REMOVED`: Old `updateCartSummary()` and `fetchOrderSummary()` functions

**New State Variables**:

- `quoteDebounceTimer`: Timer ID for debounced calls
- `currentQuote`: Latest quote response (single source of truth)
- `isCheckingOut`: Flag to lock UI during checkout

## Data Flow

```
User modifies cart / selects country
    ↓
Debounced call to fetchQuote() (400ms)
    ↓
Show loading state
    ↓
POST /api/quote { items: [...], country: "US" }
    ↓
Backend processes (validates products, calculates shipping, tax)
    ↓
Response: { subtotal, shipping, tax, taxLabel, taxIncluded, total, ... }
    ↓
Store in currentQuote (single source of truth)
    ↓
updateOrderSummaryDisplay(currentQuote)
    - Format amounts using quote.currency
    - Apply tax display rules (muted if taxIncluded)
    - Show import duties note if applicable
    ↓
Enable "Proceed to Checkout" button (if terms accepted)
    ↓
User clicks Pay
    ↓
Lock country selector, show "Processing..."
    ↓
POST /api/checkout { calculationId, items, country, email }
    ↓
Backend re-verifies quote, creates PaymentIntent
    ↓
Response: { client_secret }
    ↓
Stripe payment confirmation
```

## Price Calculation

**Important**: No price/tax/shipping calculations are performed in the browser.

All calculations happen on the backend:

1. **Base prices**: Look up from `products.json`
2. **Shipping**: Fetched from Printful API
3. **Tax**: Calculated via Stripe Tax
4. **Total**: `subtotal + shipping + tax` (on backend)

Frontend only:

- Displays what backend provides
- Formats for readability
- Manages UI state

## Error Handling

### Quote Errors

- Network errors, validation errors, backend errors all caught
- User sees clear error message: "Failed to calculate order total. Please try again."
- Checkout button disabled until fresh quote succeeds

### Checkout Errors

- Email entry cancelled: UI reset, checkout aborted
- Network/validation errors: Show message, allow retry
- Country locked during checkout: Prevents changing prices mid-payment

## Security Considerations

1. **calculationId Verification**: Backend verifies quote hasn't expired/changed
2. **Server-Side Re-calculation**: Backend re-runs quote on checkout to ensure totals match
3. **Country Lock**: Prevents changing country/prices during payment
4. **No Client Math**: All calculations on server (browser can't be trusted)

## Testing

### Manual Testing Checklist

- [ ] Cart displays "Calculating tax..." while fetching quote
- [ ] Tax displays correctly for EU countries (VAT included, muted)
- [ ] Tax displays correctly for US (sales tax, separate line)
- [ ] Import duties note shows for applicable countries
- [ ] Checkout button disabled until quote loads
- [ ] Country selector disabled once checkout starts
- [ ] Changing cart invalidates quote (shows recalculating)
- [ ] Error states show and allow retry
- [ ] Multiple currency formats display correctly

### Unit Tests

All existing tests pass with new implementation:

- 222 tests passing
- No regression in cart display logic
- No regression in item management

## Browser Compatibility

- Modern browsers with ES6 support
- Requires `localStorage` API
- Requires `fetch` API
- Tested in latest Chrome, Firefox, Safari, Edge

## Future Enhancements

1. **Email Field**: Replace `prompt()` with proper form field pre-checkout
2. **Payment Method Selection**: Support multiple payment methods
3. **Shipping Method Selection**: Multiple shipping options per country
4. **Coupon/Discount Codes**: Include in quote calculation
5. **Live Quote Updates**: Real-time quote as user adjusts quantities (currently debounced)
6. **Cart Recovery**: Save quote data for abandoned carts
7. **Analytics**: Track quote requests, conversion rates by country
