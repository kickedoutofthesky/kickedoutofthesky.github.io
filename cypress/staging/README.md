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
- A country we can't ship to (RU) shows "We can't ship to this country." and disables checkout; switching to a supported country clears it.
- Full checkout of a cart built through the product pages: 2× tee XS, 1× tee L, 3× sticker (two products, three lines).
  - The cart shows 3 lines (each with its product image loaded), a badge of 6 and the right subtotal; the shipping and checkout requests carry every line and quantity.
  - The Stripe page lists the same 3 lines with matching names, quantities, line totals and subtotal, and each line's product image is the expected file and loads.
  - After the address is entered, Stripe preselects and charges the same shipping rate (name and amount) the cart estimated; the success page shows that shipping amount.
  - Pays with test card `4242 4242 4242 4242` (Link opt-in unticked); the success page shows the same lines with their images and the cart is cleared.

Prices aren't hard-coded because Printful rates change; the page is checked against the API's response.

## Notes

- The backend builds Stripe's return URLs from the request's `Origin`, so Stripe returns to `http://localhost:3002`. Cypress runs
  with `chromeWebSecurity: false`, which drops that header, so the test adds it to the checkout request.
- `experimentalModifyObstructiveThirdPartyCode` in `cypress.config.js` lets Stripe Checkout render inside Cypress.
- The staging backend must not place real Printful orders for test payments.
