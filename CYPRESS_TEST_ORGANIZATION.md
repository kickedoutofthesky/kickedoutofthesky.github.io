# E2E vs Integration Test Organization

## Test Categories

### E2E Tests (`cypress/e2e/`)

**Purpose:** Test user workflows with local development

- ✅ Mock all external APIs
- ✅ Run in local dev environment
- ✅ Fast and reliable
- ✅ Don't require backend/external services
- Examples: `full-order-e2e.cy.js`, `checkout-tax-display.cy.js`

**Run locally:**

```bash
npx cypress run --spec "cypress/e2e/**/*.cy.js"
# or
npm test:e2e
```

---

### Integration Tests (`cypress/integration/`)

**Purpose:** Test actual backend API interactions in staging/CI

- ⚠️ Require actual backend API running
- ⚠️ NOT mocked (call real endpoints)
- ⚠️ Slower (real network calls)
- ⚠️ Only run in CI/staging environments
- Examples: `geo-location-backend.cy.js`

**Run in staging ONLY:**

```bash
# Against staging backend
npx cypress run --spec "cypress/integration/**/*.cy.js" --config baseUrl=https://staging.example.com

# Or via npm script
npm run test:integration:staging
```

---

## Example: Geo-Location Tests

The geo-location tests were split:

### ❌ Old: `cypress/e2e/geo-location-checkout.cy.js`

- Mocked `/api/geo` endpoint
- Tests passed but didn't validate real backend
- Not useful locally (backend not running)

### ✅ New: `cypress/integration/geo-location-backend.cy.js`

- Does NOT mock `/api/geo` endpoint
- Calls real backend (validates actual implementation)
- Only run in staging/CI environments
- Real integration testing

---

## Setting Up npm Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "npx cypress run --spec 'cypress/e2e/**/*.cy.js'",
    "test:e2e:watch": "npx cypress open --spec 'cypress/e2e/**/*.cy.js'",
    "test:integration:staging": "npx cypress run --spec 'cypress/integration/**/*.cy.js' --config baseUrl=https://staging.example.com",
    "test:integration:prod": "npx cypress run --spec 'cypress/integration/**/*.cy.js' --config baseUrl=https://api.kickedoutofthesky.com"
  }
}
```

---

## CI/CD Pipeline

### Local Development (Pre-commit)

```bash
npm test:e2e  # Only E2E tests with mocks
npm run format
npm run lint
```

### Staging Deployment (CI)

```bash
npm test:e2e                    # Fast validation
npm run test:integration:staging # Validate real backend
```

### Production (Manual/After Deploy)

```bash
npm run test:integration:prod  # Optional: verify in production
```

---

## Why This Matters

| Scenario                | E2E Mocked                 | Integration Real                  |
| ----------------------- | -------------------------- | --------------------------------- |
| Developer works locally | ✅ Yes (fast)              | ❌ No (no backend)                |
| PR validation           | ✅ Yes (reliable)          | ❌ No (no backend)                |
| Staging deployment      | ✅ Yes (fast sanity check) | ✅ Yes (validates backend)        |
| Production              | ✅ Optional                | ✅ Optional (manual verification) |

**Key:** Use mocked E2E tests for development, integration tests for validating real backend changes.
