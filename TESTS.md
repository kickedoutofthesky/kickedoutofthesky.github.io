# Unit Tests

This project includes a comprehensive unit test suite covering the core business logic of the e-commerce store.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Generate coverage report
npm test:coverage
```

## Test Structure

Tests are located in `store/js/__tests__/` and organized by module:

### 1. **cart.test.js** - Shopping Cart Tests

Tests the `ShoppingCart` class functionality:

- Adding items to cart
- Removing items from cart
- Updating item quantities
- Getting cart totals and subtotals
- Retrieving item prices for specific variants
- Persisting cart to localStorage
- Clearing cart
- Updating cart badge
- Validating items for checkout

**Key test cases:**

- ✅ Add new items and increment existing items
- ✅ Handle different sizes and colors as separate items
- ✅ Calculate correct totals across multiple items
- ✅ Retrieve variant-specific pricing
- ✅ Persist cart state to localStorage
- ✅ Clear cart and persist empty state
- ✅ Show/hide cart badge based on item count
- ✅ Handle missing badge element gracefully
- ✅ Validate items for checkout (product, color, size, variant_id)
- ✅ Collect multiple validation errors
- ✅ Handle null/undefined price_cents with display_price fallback
- ✅ Skip non-matching products in subtotal calculation

### 2. **product-display.test.js** - Product Display Tests

Tests product rendering and pricing logic:

- Price display formatting (single vs. range)
- Color-specific image selection
- Color and size dropdown population
- Product data validation

**Key test cases:**

- ✅ Show single price for uniform pricing
- ✅ Show price range for varying prices
- ✅ Display correct color variant images
- ✅ Fallback to main image when color unavailable
- ✅ Validate available sizes per color
- ✅ Verify required product fields
- ✅ Fallback to display_price when no variants/sizes/price_cents
- ✅ Return empty sizes for non-existent color
- ✅ Auto-select size when only one available
- ✅ Check form completeness (color + size)
- ✅ Return specific variant price or null
- ✅ Format price cents to dollars correctly

### 3. **checkout.test.js** - Checkout & API Tests

Tests checkout validation, country selection, and API communication:

- Shipping country validation and selection
- Country code format validation
- Cart item validation
- Color and size availability checks
- Variant ID existence validation
- Cart transformation for API
- Checkout payload with country code
- API response handling
- Order confirmation data storage

**Key test cases:**

- ✅ Load shipping countries from JSON file
- ✅ Validate country code format (2-letter uppercase codes)
- ✅ Reject lowercase, too-long, too-short country codes
- ✅ Require country selection before checkout
- ✅ Populate select element with countries
- ✅ Enable checkout button when country selected
- ✅ Validate all items exist in product catalog
- ✅ Validate colors are available for selected items
- ✅ Validate sizes exist for colors
- ✅ Include shippingCountry in checkout payload
- ✅ Transform cart to API format with country
- ✅ Filter null items after transformation
- ✅ Handle API success and error responses
- ✅ Handle missing checkout URL in response
- ✅ Store order data for success page
- ✅ Reject checkout if country code missing
- ✅ Disable button during processing
- ✅ Restore button state on error
- ✅ Handle empty cart checkout attempt
- ✅ Handle missing country selection error

### 4. **fetch.test.js** - Product Fetch Tests

Tests Printful product data fetching and transformation:

- Image index selection by product type
- Variant name parsing (stickers, hoodies, tees)
- Product data structure formatting
- Variant information storage
- Product sorting by category

**Key test cases:**

- ✅ Select correct image index for each product type
- ✅ Parse sticker, hoodie, and apparel variants correctly
- ✅ Create correct product data structure
- ✅ Store variant_id and price_cents
- ✅ Select images by index with fallback
- ✅ Sort products by category

### 5. **success-page.test.js** - Order Confirmation Tests

Tests success page functionality for order confirmation display:

- Item name parsing (extract product title, color, size)
- Product image retrieval from product data
- Country code to country name mapping
- Loading indicator visibility
- Order items display and formatting
- Shipping address formatting
- Currency display and calculations

**Key test cases:**

- ✅ Parse item names with product title, color, and size
- ✅ Handle item names with multi-word colors
- ✅ Handle item names without sizes (stickers, etc.)
- ✅ Fallback to original name if parsing fails
- ✅ Return color-specific product images
- ✅ Fallback to main product image when color unavailable
- ✅ Return null for missing products or images
- ✅ Map country codes to country names
- ✅ Fallback to code when country not in map
- ✅ Show/hide loading indicator
- ✅ Handle missing indicator element gracefully
- ✅ Format currency values correctly
- ✅ Calculate line totals and verify structure
- ✅ Format shipping addresses with all fields
- ✅ Handle partial addresses (missing fields)

## Test Configuration

### jest.config.js

- **testEnvironment**: jsdom (simulates browser environment)
- **setupFilesAfterEnv**: jest.setup.js (global mocks)
- **collectCoverageFrom**: store/js/\*\*/\*.js, scripts/\*\*/\*.js

### jest.setup.js

Provides mocks for:

- **localStorage** - Browser storage API
- **Web Audio API** - For cart notification sounds
- **fetch** - For API calls
- **console** - To reduce test output noise

## Writing New Tests

To add tests for a new module:

1. Create a file in `store/js/__tests__/` following the pattern: `{module-name}.test.js`
2. Import or replicate the functions to test
3. Create `describe` blocks for logical groupings
4. Write `test` cases for specific behaviors
5. Run `npm test` to verify

Example:

```javascript
describe("MyModule", () => {
  describe("myFunction", () => {
    test("should do something", () => {
      const result = myFunction(input);
      expect(result).toBe(expected);
    });
  });
});
```

## Test Pattern

Tests follow the Arrange-Act-Assert pattern:

```javascript
test("description of what is tested", () => {
  // Arrange: Set up test data and initial state
  const testData = {
    /* ... */
  };

  // Act: Execute the function being tested
  const result = myFunction(testData);

  // Assert: Verify the result matches expectations
  expect(result).toBe(expected);
});
```

## Current Test Coverage

- **Cart Management**: 100% of core functions (clear, badge, validateItemsForCheckout, edge cases)
- **Product Display**: 100% of pricing, image, and form logic
- **Checkout Validation**: 100% of validation, country, button state, and error handling
- **Product Fetch**: 100% of transformation logic
- **Success Page**: 100% of parsing, image retrieval, country mapping, and display logic

**Total**: 102+ tests passing ✅

## End-to-End Tests (Cypress)

Comprehensive e2e test coverage for user workflows:

### success-page.cy.js - Order Confirmation Tests

Tests complete order confirmation page experience:

- ✅ Display success message and loading indicator
- ✅ Load and display order items with product images
- ✅ Parse item names and extract product information
- ✅ Display customer information (name, email, phone)
- ✅ Display shipping address with country name translation
- ✅ Display order summary with totals
- ✅ Hide order confirmation number from display
- ✅ Hide "Return to Store" button
- ✅ Load and display product images for order items
- ✅ Hide loading indicator after data loads

### Responsive Design Tests

- ✅ Two-column layout on desktop (1000px+)
- ✅ Single column layout on tablet (768px-999px)
- ✅ Single column layout on mobile (≤767px)
- ✅ Stack order items vertically on small screens (≤576px)
- ✅ Display product images with proper dimensions on mobile
- ✅ Full-width layout on mobile
- ✅ Maintain readability on all screen sizes

### Order Items Display

- ✅ Display all items without internal scrollbar
- ✅ No max-height restriction on order items container
- ✅ Product images display inline with details
- ✅ Flexbox layout for responsive wrapping

### Loading States

- ✅ Show loading indicator while fetching order details
- ✅ Hide loading indicator after data loads
- ✅ Hide loading indicator on API errors

## Continuous Testing

You can run tests in watch mode during development:

```bash
npm test:watch
```

This will re-run tests whenever you modify test files, providing immediate feedback on code changes.
