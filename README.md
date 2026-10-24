# Kicked Out Of The Sky — website & merch store

Static site for the band Kicked Out Of The Sky, served by GitHub Pages at
**https://www.kickedoutofthesky.com** (the bare domain redirects to `www`).
The merch store talks to a separate backend API (Vercel, repo `kickedoutofthesky-store`) for
shipping, checkout (Stripe) and order lookups; Printful fulfils orders.

- [CONTRIBUTING.md](CONTRIBUTING.md) — setup, workflow, code standards, deployment
- [TESTING.md](TESTING.md) — Jest, Cypress, live staging tests, CI
- [RELEASE_PAGES_GUIDE.md](RELEASE_PAGES_GUIDE.md) — music release pages

## Pages

| Path                                    | What it does                                                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `/` ([index.html](index.html))          | Home: music, videos, tour, sign-up, contact form (Formspree)                                         |
| `/epk.html`                             | Electronic press kit                                                                                 |
| `/betterpartofme/`                      | Release page driven by [data/releases.json](data/releases.json) and [js/releases.js](js/releases.js) |
| `/listen/`                              | Redirects to the push.fm fan link (keeps UTM params, consent-gated Meta Pixel)                       |
| `/presave.html`                         | Redirects to `/listen/`                                                                              |
| `/legal/*.html`                         | Privacy, terms, shipping, cookies, copyright, accessibility, disclaimer, contact                     |
| `/404.html`                             | Not-found page                                                                                       |
| `/store/`                               | Product grid with filters; filter state is kept in the URL so it can be shared                       |
| `/store/product.html?key=<product_key>` | Product page: colour/size/quantity, image carousel and zoom, add to cart                             |
| `/store/cart.html`                      | Cart, shipping country, shipping estimate, terms, checkout (redirects to Stripe)                     |
| `/store/success.html?session_id=cs_…`   | Stripe return page: shows the order and clears the cart                                              |
| `/store/order-status.html`              | Order lookup by email + Printful order ID                                                            |
| `/store/p/<product_key>/`               | Share links with Open Graph tags; redirect to the product page                                       |

Shared scripts: [js/cookie-consent.js](js/cookie-consent.js) (consent banner; analytics only after
consent), [js/analytics.js](js/analytics.js) (Google Analytics), [js/meta-pixel.js](js/meta-pixel.js),
[js/navbar-loader.js](js/navbar-loader.js) (injects [navbar.html](navbar.html)).

## How the store works

```
store/data/products.json ──► store.js (grid) ──► product.js ──► cart.js (localStorage "kots_cart")
                                                                     │
                                                       cart-display.js (cart page)
                                                         │ POST /api/calculate-shipping
                                                         │ POST /api/create-checkout-session ──► Stripe Checkout
                                                                                                    │
                       order-status.js ◄── GET /api/order-status          success.html ◄── GET /api/order-details
```

- **Products** come from [store/data/products.json](store/data/products.json), generated from
  Printful (`npm run fetch-products`). Prices are in cents; [js/money.js](js/money.js) formats them.
- **Countries** in the cart dropdown come from [js/allowed-countries.js](js/allowed-countries.js)
  (no API call). The backend rejects destinations Printful can't ship to.
- **Shipping estimate** re-runs 300 ms after the country, a quantity or the cart contents change.
  Failures never block checkout; Stripe calculates final shipping.
- **Checkout** sends only variant IDs and quantities; the backend looks up prices, so browser
  values are never trusted.

### Backend API (separate repo)

The base URL is set by [store/js/api-config.js](store/js/api-config.js) as `window.__API_URL__`
(no trailing slash, no `/api` suffix). Only `Content-Type: application/json` is sent; no cookies.

| Call                                                | Request                                                                      | Response (200)                                                                                         |
| --------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `POST /api/calculate-shipping`                      | `{ country, items: [{ variant_id: number, quantity }] }`                     | `{ shipping_options: [{ shipping_rate_data: { fixed_amount: { amount } } }] }` (cents, cheapest first) |
| `POST /api/create-checkout-session`                 | `{ items: [{ variantId: string, quantity }], country, termsAccepted: true }` | `{ url }` — Stripe Checkout URL                                                                        |
| `GET /api/order-details?session_id=cs_…`            | —                                                                            | Order items, summary (subtotal/shipping/tax/total), customer, address                                  |
| `GET /api/order-status?email=…&printful_order_id=…` | —                                                                            | Order status and shipments                                                                             |

Errors are JSON `{ "error": "message" }`; the frontend logs them as
`API error (METHOD /api/endpoint): STATUS - message`.

### Which API each environment uses

| Frontend                                 | API base URL                                |
| ---------------------------------------- | ------------------------------------------- |
| `localhost:3000` (`npm run dev`)         | `http://localhost:3001` (local backend)     |
| `localhost:3002` (`npm run dev:staging`) | `https://api-staging.kickedoutofthesky.com` |
| `*.vercel.app` previews                  | `https://api-staging.kickedoutofthesky.com` |
| `kickedoutofthesky.com` / `www`          | `https://api.kickedoutofthesky.com`         |

Override for the current tab with `?api=local`, `?api=staging` or `?api=prod` (kept in
`sessionStorage`).

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000 → local API on :3001 (run the backend repo)
npm run dev:staging    # http://localhost:3002 → staging API
```

[server.js](server.js) is a small static server for local development only. It also injects
Open Graph tags for product share pages and release pages.

## npm scripts

| Script                                         | Purpose                                                     |
| ---------------------------------------------- | ----------------------------------------------------------- |
| `dev` / `dev:staging`                          | Local server on port 3000 / 3002                            |
| `test`, `test:watch`, `test:coverage`          | Jest unit tests                                             |
| `e2e`, `e2e:open`, `test:e2e`, `test:e2e:open` | Cypress e2e suite (`cypress/e2e`, API mocked)               |
| `test:e2e:staging`                             | Live staging tests (`cypress/staging`), needs `dev:staging` |
| `lint`, `lint:fix`, `format`, `format:check`   | ESLint / Prettier                                           |
| `fetch-products`                               | Regenerate `store/data/products.json` from Printful         |
| `generate:sitemap`                             | Regenerate `sitemap.xml`                                    |
| `lighthouse*`                                  | Lighthouse CI                                               |

Other tools in [scripts/](scripts): `generate-og-pages.js` (builds `store/p/*` share pages) and
`add-garment-info.js` (adds garment details to `products.json`), run with `node scripts/<file>`.

## Project layout

```
index.html, epk.html, 404.html, navbar.html   main site
betterpartofme/, listen/, presave.html        release pages
legal/                                        legal pages
js/                                           shared scripts (consent, analytics, releases, money, countries)
data/releases.json                            release data
store/                                        merch store pages
store/js/                                     store scripts (+ __tests__ for Jest)
store/data/                                   products.json, printful-shipping-countries.json
store/p/                                      generated product share pages
cypress/e2e/                                  Cypress suite (mocked API)
cypress/staging/                              live staging Cypress suite
scripts/                                      data/build tools
server.js                                     local dev server
```
