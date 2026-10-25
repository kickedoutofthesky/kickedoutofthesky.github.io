# Testing

| Suite        | Location                               | Command                                                | Hits real API? |
| ------------ | -------------------------------------- | ------------------------------------------------------ | -------------- |
| Unit (Jest)  | `store/js/__tests__/`, `js/__tests__/` | `npm test` (`npm run test:coverage` for coverage)      | No             |
| End-to-end   | `cypress/e2e/`                         | dev server running, then `npm run e2e`                 | No (mocked)    |
| Live staging | `cypress/staging/`                     | `npm run dev:staging`, then `npm run test:e2e:staging` | Yes (staging)  |

Every suite tests only code the live site uses, and none have skipped tests. Run all three before merging store changes.

## Unit tests (Jest)

Jest 26 with jsdom ([jest.config.js](jest.config.js), [jest.setup.js](jest.setup.js)). Tests import the
real modules, or load the real script or HTML file. They don't test copies of the logic.

| File                                                | Covers                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| `store/js/__tests__/cart.test.js`                   | `cart.js`: add/merge/update/remove, localStorage persistence, validation |
| `store/js/__tests__/cart-display.test.js`           | `cart-display.js` `getProductImage` (colour image and fallbacks)         |
| `store/js/__tests__/cart-notification.test.js`      | `cart-notification.js`: ding sound, burst animation, badge               |
| `store/js/__tests__/store.test.js`                  | `store.js`: product grid, filters, URL params                            |
| `store/js/__tests__/product.test.js`                | `product.js`: `getPriceDisplay` / `getPriceRange`                        |
| `store/js/__tests__/product-utilities.test.js`      | Product helpers used by `product.js` / `cart-display.js`                 |
| `store/js/__tests__/product-images.test.js`         | `products.json` image paths exist on disk                                |
| `store/js/__tests__/order-status-utilities.test.js` | Validation and formatting helpers used by `order-status.js`              |
| `store/js/__tests__/fetch.test.js`                  | `scripts/fetch-printful-products.js` image indexing                      |
| `store/js/__tests__/server-og-tags.test.js`         | Starts the real `server.js` and checks Open Graph tag injection          |
| `js/__tests__/analytics.test.js`                    | `analytics.js` `loadGA()`: injects GA once and sets up `gtag`            |
| `js/__tests__/cookie-consent.test.js`               | Consent banner behaviour and storage                                     |
| `js/__tests__/meta-pixel.test.js`                   | Meta Pixel consent gating and queuing                                    |
| `js/__tests__/releases.test.js`                     | Release page rendering, CTA switch, query forwarding                     |

The [pre-commit hook](.husky/pre-commit) runs the whole Jest suite.

## End-to-end tests (Cypress)

Cypress 10 ([cypress.config.js](cypress.config.js), base URL `http://localhost:3000`). Start a dev
server first. To use another port, add `--config baseUrl=http://localhost:3002`.

```bash
npm run dev     # terminal 1
npm run e2e     # terminal 2 (headless); npm run e2e:open for the UI
npx cypress run --spec cypress/e2e/cart.cy.js   # one spec
```

| Spec                   | Covers                                                                                                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `site.cy.js`           | Home page, legal pages with the shared navbar, 404                                                                                                                                                                                                            |
| `cookie-consent.cy.js` | Banner accept/decline; analytics only after accept                                                                                                                                                                                                            |
| `release-pages.cy.js`  | `/betterpartofme/` rendering, pre-save → "Listen now" switch, `/listen/` and `/presave.html` redirects, UTM forwarding, pixel after consent                                                                                                                   |
| `store.cy.js`          | Product grid, images, navbar cart badge, error state, filters (URL param + saved choice)                                                                                                                                                                      |
| `product-page.cy.js`   | Colours/sizes/prices, carousel, URL pre-selection, add to cart and merging identical items                                                                                                                                                                    |
| `cart.cy.js`           | Cart items, +/−, remove, subtotal, local country list, shipping estimate (payload, debounce, errors, empty cart), unsupported countries block checkout and clear on change, terms, API URL selection                                                          |
| `checkout.cy.js`       | Store → cart → checkout request body → Stripe redirect; a multi-product, multi-quantity cart built in the store (merging, badge, subtotal, shipping and checkout payloads, success page lines); double-click guard; error, retry and network-failure handling |
| `success-page.cy.js`   | Order details from `/api/order-details`, cart cleared, error paths, no call without `session_id`                                                                                                                                                              |
| `order-status.cy.js`   | Validation, results, Enter key, reload restore, error messages                                                                                                                                                                                                |
| `responsive.cy.js`     | No horizontal overflow and correct grid columns at phone/tablet/desktop sizes                                                                                                                                                                                 |

[cypress/support/e2e.js](cypress/support/e2e.js) runs before every test. It:

- mocks `POST /api/calculate-shipping` (it checks the `{ country, items }` body; a bad body gets a 400),
- stubs Google Analytics,
- adds the commands `cy.visitWith` (pre-fills the cart and cookie choice), `cy.chooseVariant`,
  `cy.selectShippingCountry`, `cy.acceptTerms` and `shouldShowImage` (asserts an image actually loaded).

Each spec mocks the other API calls with `cy.intercept`, using the real request and response
shapes listed in [README.md](README.md#backend-api-separate-repo).

## Live staging tests

[cypress/staging/staging-happy-path.cy.js](cypress/staging/staging-happy-path.cy.js) calls the real
staging API and checks a multi-product, multi-quantity cart line by line (name, quantity, total and product image) on the Stripe page, and completes a test-mode payment with card `4242 4242 4242 4242`. See
[cypress/staging/README.md](cypress/staging/README.md). These tests are kept out of `npm run e2e`
and CI.

## CI (GitHub Actions)

Both workflows run on pushes and pull requests to `gh-pages` and `development`, using Node 20.

- [.github/workflows/ci.yml](.github/workflows/ci.yml): scans for leaked credentials, then runs
  `format:check`, `lint`, and Jest with coverage (uploaded to Codecov).
- [.github/workflows/cypress.yml](.github/workflows/cypress.yml): starts `server.js` on port 5500 and
  runs `npm run e2e`. Screenshots and videos are uploaded if it fails.

Run the same Cypress setup locally: `PORT=5500 node server.js`, then
`npx cypress run --config baseUrl=http://localhost:5500`.
