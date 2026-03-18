# End-to-End Testing with Cypress

This project includes comprehensive end-to-end tests using Cypress to ensure the store functionality works correctly.

## Getting Started

### Prerequisites

- Node.js 20+ (currently using Node 20.20.1)
- npm 6+

### Installation

Cypress is already installed as a dev dependency. To verify:

```bash
npm list cypress
```

## Running Tests

### Open Cypress Test Runner (Interactive Mode)

```bash
npm run e2e:open
```

This opens the Cypress UI where you can:

- View and run individual tests
- See real-time feedback
- Debug test failures with developer tools

- Re-run tests instantly after code changes

### Run Tests Headlessly (CI Mode)

```bash
npm run e2e
```

This runs all tests headlessly and outputs results to the terminal.

## Test Files

### 1. **store.navigation.cy.js**

Tests for store homepage and navigation

- Displays store homepage correctly

- Shows product cards
- Navigates to product detail pages
- Cart and store links are available

### 2. **add-to-cart.cy.js**

Tests for adding products to cart

- Add products from grid
- Add products from detail page
- Select color variants
- Add multiple products
- Different variants of same product

### 3. **product-variants.cy.js**

Tests for product variants and details

- Display multiple colors
- Image updates on color change
- Size selection
- Price display
- Persist and update correctly

### 4. **shopping-cart.cy.js**

Tests for shopping cart functionality

- Navigate to cart
- Display cart items correctly
- Show cart subtotal
- Remove items from cart
- Update quantities

- Empty cart handling

### 5. **checkout.cy.js**

Tests for checkout flow

- Navigate to checkout
- Display checkout form
- Handle empty cart
- Show order summary

- Display cancel button
- Verify item counts and totals

### 6. **all-variants.cy.js**

Comprehensive test adding all products and all variants to cart

- Adds every product with every color variant

- Verifies correct product counts
- Calculates and verifies cart totals

### 7. **checkout-api-payload.cy.js**

Tests the checkout API payload and Stripe redirect flow

- Verifies correct payload sent during purchase
- Tests Stripe redirect behavior

### 8. **checkout-error-handling.cy.js**

Tests error handling in checkout flow

- API 500 error handling
- Friendly error message display

### 9. **checkout-simple.cy.js**

Tests basic checkout flow

- Adding items to cart
- Checkout button display and state

### 10. **error-paths.cy.js**

Tests error paths and edge cases

- Empty cart scenarios
- Disabled checkout button behavior

### 11. **merch-page-products.cy.js**

Tests product visibility on the merch page

- Product grid display
- Product names and details

### 12. **purchase-flow.cy.js**

Tests the complete customer purchase flow

- Browse merch to cart to payment redirect
- Shipping country selection
- End-to-end purchase journey

### 13. **responsive-devices.cy.js**

Tests responsive design at specific device viewports

- Mobile (375x667)
- Tablet viewports

### 14. **responsive.cy.js**

Tests responsive layout across all breakpoints

- Mobile (375x667)
- Tablet (768x1024)
- Desktop (1280x800)

### 15. **site-experience.cy.js**

Tests overall site functionality

- Home page loading
- Console error detection

### 16. **stripe-integration.cy.js**

Tests Stripe integration readiness

- Checkout button availability
- Test mode verification

### 17. **success-page.cy.js**

Tests order confirmation page functionality:

**Order Display Tests:**

- Display success message and loading indicator
- Load and display order items with product images
- Parse item names and extract product information
- Display customer information (name, email, phone)
- Display shipping address with country name translation
- Display order summary with totals
- Hide order confirmation number from display
- Hide "Return to Store" button
- Load and display product images for order items
- Hide loading indicator after data loads

**Responsive Design Tests:**

- Two-column layout on desktop (1000px+)
- Single column layout on tablet (768px-999px)
- Single column layout on mobile (≤767px)
- Stack order items vertically on small screens (≤576px)
- Display product images with proper dimensions on mobile
- Full-width layout on mobile
- Maintain readability on all screen sizes

**Order Items Display:**

- Display all items without internal scrollbar
- No max-height restriction on order items container
- Product images display inline with details
- Flexbox layout for responsive wrapping

**Loading States:**

- Show loading indicator while fetching order details
- Hide loading indicator after data loads
- Hide loading indicator on API errors

**Product Image Display:**

- Display product images for each order item
- Display images inline with product details
- Images have valid src attributes

## Test Data Attributes

The tests rely on the following `data-testid` attributes in your HTML:

### Store Page

- `data-testid="product-grid"` - Main product grid container
- `data-testid="product-card"` - Individual product card
- `data-testid="product-title"` - Product title
- `data-testid="product-price"` - Product price
- `data-testid="product-image"` - Product image
- `data-testid="cart-count"` - Cart item count display

### Product Detail Page

- `data-testid="product-detail"` - Main product detail container
- `data-testid="product-title"` - Product title

- `data-testid="product-price"` - Product price
- `data-testid="product-image"` - Product image
- `data-testid="color-select"` - Color variant selector
- `data-testid="size-select"` - Size selector
- `data-testid="cart-notification"` - Notification when added to cart

### Cart Page

- `data-testid="cart-page"` - Main cart container
- `data-testid="cart-item"` - Individual cart item
- `data-testid="item-name"` - Item name in cart
- `data-testid="item-price"` - Item price in cart
- `data-testid="item-quantity"` - Item quantity input
- `data-testid="quantity-input"` - Quantity input field
- `data-testid="cart-subtotal"` - Cart subtotal
- `data-testid="remove-item"` - Remove item button
- `data-testid="empty-cart-message"` - Empty cart message

### Checkout Page

- `data-testid="order-summary"` - Order summary container
- `data-testid="order-item"` - Order line item
- `data-testid="order-total"` - Order total

### Success Page

- `id="loading-indicator"` - Loading spinner during order details fetch
- `id="order-section"` - Order items container
- `id="customer-section"` - Customer information container
- `id="shipping-section"` - Shipping address container
- `id="order-items"` - Order items list
- `id="customer-name"` - Customer name display
- `id="customer-email"` - Customer email display
- `id="customer-phone"` - Customer phone display
- `id="shipping-address"` - Shipping address display
- `id="shipping-method"` - Shipping method display
- `id="summary-subtotal"` - Order subtotal
- `id="summary-shipping"` - Shipping cost
- `id="summary-tax"` - Tax amount
- `id="summary-total"` - Order total

## Adding Test Data Attributes

To ensure tests can find elements, add test IDs to your HTML:

```html
<div data-testid="product-card">
  <img data-testid="product-image" src="..." />
  <h3 data-testid="product-title">Product Name</h3>
  <span data-testid="product-price">$25.00</span>
</div>
```

## Configuration

Cypress configuration is in `cypress.config.js`:

- **baseUrl**: `http://localhost:5500` - Used by Cypress and CI (`npx serve -s . -p 5500`). Note: the dev server (`npm run dev`) runs on port 3000.
- **specPattern**: `cypress/e2e/**/*.cy.js` - Test file pattern

- **viewportWidth/Height**: 1280x720 (default Cypress viewport)

## Running Tests Locally

1. Start a local server on port 5500 (Cypress expects this port):
   ```bash
   npx serve -s . -p 5500
   ```
2. Open a new terminal and run:

   ```bash
   npm run e2e:open

   ```

3. Click a test file to run it
4. Results will show in real-time

## CI/CD Integration

To run tests in CI/CD pipeline:

```bash
npm run e2e

```

Example GitHub Actions workflow:

```yaml
- name: Run E2E Tests
  run: npm run e2e
```

## Debugging

### Using Cypress Chrome DevTools

- Click the browser devtools icon in test runner
- Inspect elements, check console, set breakpoints

### Adding Debug Output

```javascript
cy.debug(); // Pause execution
cy.log("Debug message");
```

### Screenshot/Video

Cypress automatically captures screenshots on failure and videos of test runs (enable in config).

## Best Practices

1. **Use data-testid attributes** - More reliable than class/ID selectors
2. **Clear cart between tests** - Use `beforeEach` hook
3. **Wait for elements** - Cypress auto-retries, but use explicit waits when needed
4. **Test user flows** - Not implementation details
5. **Keep tests isolated** - Each test should be independent

## Troubleshooting

### Tests fail with "element not found"

- Verify data-testid attributes exist in HTML
- Check baseUrl matches your dev server
- Ensure app is running before executing tests

### Tests time out

- Increase timeout in cypress.config.js
- Check for unresolved promises or API calls
- Use `cy.intercept()` to mock API responses if needed

### Images not loading

- Tests mock images by checking they exist
- Ensure image URLs are valid in products.json

## Resources

- [Cypress Documentation](https://docs.cypress.io)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [API Reference](https://docs.cypress.io/api/table-of-contents)
