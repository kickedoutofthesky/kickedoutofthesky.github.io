# Contributing

See [README.md](README.md) for what the site does and how the store talks to the backend, and
[TESTING.md](TESTING.md) for the test suites.

## Setup

Requires **Node.js 20.19+** (ESLint 10) and npm.

```bash
npm install
npm run dev            # http://localhost:3000, API → http://localhost:3001 (backend repo running locally)
npm run dev:staging    # http://localhost:3002, API → https://api-staging.kickedoutofthesky.com
```

`npm install` sets up the Husky git hooks.

## Workflow

1. Branch from `gh-pages` (the deployed branch).
2. Make the change and add/update tests for it (Jest for logic, Cypress for user flows).
3. `npm test`, `npm run lint`, `npm run format:check`, and `npm run e2e` with a dev server running.
4. For store changes, also run the live staging suite: `npm run dev:staging` then `npm run test:e2e:staging`.
5. Open a pull request into `gh-pages`.

### Pre-commit hook

[.husky/pre-commit](.husky/pre-commit) runs lint-staged (ESLint `--fix` + Prettier on staged files)
and then the full Jest suite. Commits are blocked if either fails.

## Code standards

- ESLint ([eslint.config.js](eslint.config.js)) and Prettier must pass.
- Use `data-testid="…"` attributes for elements that tests select.
- Prices are integers in cents; format them with `formatUSD` from [js/money.js](js/money.js).
- API calls go through `window.__API_URL__` ([store/js/api-config.js](store/js/api-config.js)): send
  only `Content-Type: application/json`, no credentials, and log failures as
  `API error (METHOD /api/endpoint): STATUS - message`.
- Don't add third-party trackers that fire before cookie consent ([js/cookie-consent.js](js/cookie-consent.js)).
- Never commit secrets. CI scans for Stripe keys, webhook secrets and Vercel bypass tokens.

## Product data

- `npm run fetch-products` regenerates [store/data/products.json](store/data/products.json) from
  Printful (needs `PRINTFUL_API_KEY` and `PRINTFUL_STORE_ID` in `.env`). Don't edit it by hand.
- After products change, run `node scripts/generate-og-pages.js` (share pages in `store/p/`) and
  `npm run generate:sitemap`.

## Release pages

See [RELEASE_PAGES_GUIDE.md](RELEASE_PAGES_GUIDE.md).

## Deployment

GitHub Pages serves the `gh-pages` branch at `https://www.kickedoutofthesky.com` (custom domain in
[CNAME](CNAME), HTTPS enforced, certificate covers `www` and the bare domain). Merging to `gh-pages`
deploys; there is no build step.

The backend (Stripe, Printful, webhooks) lives in the separate `kickedoutofthesky-store` repository.

## Troubleshooting

- **Port in use:** `lsof -i :3000` (or `:3002`) and stop that process.
- **Cart page shows "Shipping will be calculated at checkout.":** the shipping API failed; check the
  console for the `API error (POST /api/calculate-shipping)` line and which API the page is using
  (`window.__API_URL__`).
- **Stale behaviour after switching APIs:** a `?api=` override is kept in `sessionStorage`; open a
  new tab or use `?api=` again.
