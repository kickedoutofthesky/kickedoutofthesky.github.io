# Live staging tests

These Cypress tests call the real staging API (`https://api-staging.kickedoutofthesky.com`) with no
mocks and complete a Stripe **test-mode** payment. They live outside `cypress/e2e`, so the normal
suite (`npm run e2e`) and CI never run them.

## Run

```bash
npm run dev:staging        # terminal 1: frontend on http://localhost:3002
npm run test:e2e:staging   # terminal 2
```

There is no production mode: it would create live Stripe sessions.

## What `staging-happy-path.cy.js` checks

- The shipping estimate sends the cart items and shows the API's cheapest option.
- Larger carts are priced higher than a single item.
- A disabled country (RU) shows "We can't ship to this country." without blocking checkout.
- Full checkout of a cart built through the product pages: 2× tee XS, 1× tee L, 3× sticker (two products, three lines).
  - The cart shows 3 lines, a badge of 6 and the right subtotal; the shipping and checkout requests carry every line and quantity.
  - The Stripe page lists the same 3 lines with matching names, quantities, line totals and subtotal.
  - Pays with test card `4242 4242 4242 4242` (Link opt-in unticked); the success page shows the same lines and the cart is cleared.

Prices aren't hard-coded because Printful rates change; the page is checked against the API's response.

## Notes

- Stripe's `success_url` points at the live site, so the test redirects it to the local success page.
- `experimentalModifyObstructiveThirdPartyCode` in `cypress.config.js` lets Stripe Checkout render inside Cypress.
- The staging backend must not place real Printful orders for test payments.
