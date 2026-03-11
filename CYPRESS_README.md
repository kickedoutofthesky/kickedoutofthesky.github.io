# End-to-End Testing with Cypress

This project includes comprehensive end-to-end tests using Cypress to ensure the store functionality works correctly.

## Getting Started

### Prerequisites

- Node.js 14+ (currently using Node 14.19.0)
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

- **baseUrl**: `http://localhost:5500` - Update this to your local dev server
- **specPattern**: `cypress/e2e/**/*.cy.js` - Test file pattern

- **viewportWidth/Height**: 1280x720 (default Cypress viewport)

## Running Tests Locally

1. Start your local development server on port 5500
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
