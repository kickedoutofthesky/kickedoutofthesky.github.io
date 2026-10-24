# Integration Tests (Real API)

These tests validate the staging API without mocks. They test real API responses and behavior.

## Running Integration Tests

These tests call the live **staging** API (`https://api-staging.kickedoutofthesky.com`) and complete a
Stripe **test-mode** payment. They are skipped unless `CYPRESS_API_TARGET=staging` is set.

Start the frontend (`npm run dev:staging`), then:

```bash
CYPRESS_API_TARGET=staging npx cypress run --spec "cypress/e2e/integration/*.cy.js" --browser chrome --config baseUrl=http://localhost:3002
```

There is no production mode: it would create live Stripe sessions.

## Differences from Unit Tests

- **No mocks** - all requests go to real API
- **Slower** - includes network latency
- **More fragile** - depends on API and data availability
- **Real validation** - catches actual API issues
- **Separate folder** - doesn't interfere with unit tests

## Tests Included

- `staging-happy-path.cy.js`
  - Shipping estimate sends the cart items and shows the API's cheapest option
  - Larger carts are priced higher than a single item
  - A disabled country (RU) shows "We can't ship to this country." without blocking checkout
  - Full checkout: Stripe test card `4242 4242 4242 4242` (Link opt-in unticked) → success page shows the order

Notes:

- Stripe's `success_url` points at the live site, so the test redirects it to the local success page.
- `experimentalModifyObstructiveThirdPartyCode` in `cypress.config.js` lets Stripe Checkout render inside Cypress.
- The staging backend must not place real Printful orders for test payments.
