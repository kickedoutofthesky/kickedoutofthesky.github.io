# Contributing to Kicked Out of the Sky Store

## Development Setup

### Prerequisites

- Node.js 20.x or higher
- npm 6.x or higher

### Local Development

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Run unit tests
npm test

# Run unit tests in watch mode
npm test:watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Run e2e tests (requires dev server running)
npm run e2e

# Open Cypress test runner (interactive mode)
npm run e2e:open
```

## Testing

### Unit Tests

We use Jest for unit tests. Tests are in `store/js/__tests__/` and should cover:

- Cart functionality
- Product display and pricing
- Checkout calculations
- API integrations

```bash
npm test                 # Run all tests
npm run test:coverage    # Generate coverage report
npm test:watch          # Watch mode for development
```

### E2E Tests

We use Cypress for end-to-end testing. Tests are in `cypress/e2e/` and cover:

- Store navigation
- Product browsing and variant selection
- Add to cart flow
- Shopping cart management
- Checkout process
- Stripe integration readiness

**Requirements:** Development server must be running on port 3000 (or port 5500 if using `npx serve` in CI)

```bash
npm run dev             # Terminal 1
npm run e2e            # Terminal 2 - runs headless
npm run e2e:open       # Terminal 2 - opens Cypress UI
```

## CI/CD Pipeline (GitHub Actions)

The project includes automated testing via GitHub Actions. On every push and pull request:

1. **Format Check** - Ensures code matches Prettier formatting
2. **Linting** - ESLint validates code quality
3. **Unit Tests** - Jest runs all unit tests with coverage
4. **E2E Tests** - Cypress runs end-to-end test suite
5. **Coverage Report** - Uploaded to Codecov

### Workflow Status

- Checks run automatically on push to `main`, `gh-pages`, or `develop` branches
- All checks must pass before merging (if branch protection is enabled)
- E2E test failures won't block merge (marked as `continue-on-error`)

## Pre-commit Hooks

The project uses Husky + lint-staged to automatically:

- Run ESLint on staged `.js` files
- Format with Prettier
- Run Jest tests

This happens automatically when you run `git commit`. If checks fail, fix the issues and commit again.

## Code Quality Standards

### ESLint Rules

- No unused variables (unless prefixed with `_`)
- Consistent quote style
- Proper error handling
- No console.log in production code

### Testing Requirements

- Unit tests for business logic (cart, pricing, checkout)
- E2E tests for critical user flows
- Coverage target: 80%+ for core functionality

### Naming Conventions

- Use semantic HTML5 elements
- Data attributes for test selectors: `data-testid="..."`
- Descriptive variable names
- Clear function names that indicate purpose

## Stripe Integration Testing

### Test Credentials

- **Test Card (Success):** 4242 4242 4242 4242
- **Test Card (Decline):** 4000 0000 0000 0002
- **Expiry:** Any future date
- **CVC:** Any 3 digits

### Webhook Testing

Use the Stripe CLI to test webhooks locally:

```bash
# Install Stripe CLI (if not already installed)
brew install stripe/stripe-cli/stripe

# Listen for events and forward to local server
stripe listen --forward-to localhost:3000/webhooks/stripe

# In another terminal, trigger test events
stripe trigger checkout.session.completed
```

See `STRIPE_WEBHOOK_GUIDE.md` for complete webhook implementation details.

## Printful Integration Testing

When implemented, test in Printful's sandbox environment:

- Use test API credentials (separate from production)
- Test product sync, order creation, and shipping calculations
- Verify webhook handling for order status updates

## Common Tasks

### Adding a New Test

```bash
# Unit test
touch store/js/__tests__/my-feature.test.js

# E2E test
touch cypress/e2e/my-feature.cy.js
```

### Debugging Tests

```bash
# Run single test file
npm test store/js/__tests__/cart.test.js

# Run Cypress in debug mode
npx cypress run --debug

# Watch test output in real-time
npm run test:watch
```

### Fixing Linting Issues Automatically

```bash
npm run lint:fix
npm run format
```

## Deployment

The site is deployed on GitHub Pages. The `gh-pages` branch is deployed automatically.

```bash
# Build/prepare for deployment (if needed)
npm run build

# Push to gh-pages branch
git push origin gh-pages
```

## Troubleshooting

### Tests Failing Locally but Not in CI

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node version: `node --version`
- Clear npm cache: `npm cache clean --force`

### Dev Server Not Starting

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Try again
npm run dev
```

### E2E Tests Timing Out

- Ensure dev server is running on port 3000 (or port 5500 if using `npx serve`)
- Check if the port is in use: `lsof -i :3000`
- Increase test timeout if needed in `cypress.config.js`

## Project Architecture

### Development Server (`server.js`)

A custom Node.js static file server (no dependencies beyond `http`, `fs`, `path`, and `dotenv`). Serves the site on port 3000 (`npm run dev`). Handles MIME types, directory traversal prevention, and auto-serves `index.html` for directory paths.

### Product Data Pipeline

- **`scripts/fetch-printful-products.js`** — Fetches product catalog from the Printful API and writes to `store/data/products.json`. Run with `npm run fetch-products`. Requires `PRINTFUL_API_KEY` in `.env`.
- **`store/data/products.json`** — Generated product catalog used by the store frontend. Do not edit manually; regenerate with the fetch script.
- **`store/data/printful-shipping-countries.json`** — List of 249 countries supported by Printful for shipping. Used to populate the shipping country dropdown on the cart page.

### Cart Notifications (`store/js/cart-notification.js`)

Provides visual/audio feedback when items are added to cart:

- `playDingSound()` — Plays a short beep via Web Audio API
- `createCartBurst()` — Animates a burst effect from the quantity input to the cart badge
- `showCartBadgeBurst()` — Shows a pulsing animation on the cart badge

### Store Pages

- **`store/cancel.html`** — Stripe checkout cancellation redirect page. Shown when a customer clicks "Back" on the Stripe checkout form.
- **`store/success.html`** — Stripe checkout success page. Displays order details, shipping info, and confirmation.

### Backend (Separate Repository)

The backend API lives in a separate Vercel repository (`kickedoutofthesky-store`). The following docs in this repo describe the backend specs:

- `BACKEND_IMPLEMENTATION_CHECKLIST.md`
- `STRIPE_HOSTED_CHECKOUT_IMPLEMENTATION.md`
- `BACKEND_ORDER_DETAILS_ENDPOINT.md`
- `STRIPE_WEBHOOK_GUIDE.md`
- `STRIPE_IMPLEMENTATION_QUICKSTART.md`

## Questions?

Refer to documentation:

- Cypress: https://docs.cypress.io
- Jest: https://jestjs.io
- ESLint: https://eslint.org
- Prettier: https://prettier.io
- Stripe: https://stripe.com/docs/testing
