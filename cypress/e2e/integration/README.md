# Integration Tests (Real API)

These tests validate the staging/production API without mocks. They test real API responses and behavior.

## Running Integration Tests

**Against staging API:**

```bash
CYPRESS_API_TARGET=staging npx cypress run --spec "cypress/e2e/integration/*.cy.js" --browser chrome
```

**Against production API:**

```bash
CYPRESS_API_TARGET=prod npx cypress run --spec "cypress/e2e/integration/*.cy.js" --browser chrome
```

**Against local API:**

```bash
CYPRESS_API_TARGET=local npx cypress run --spec "cypress/e2e/integration/*.cy.js" --browser chrome
```

## Differences from Unit Tests

- **No mocks** - all requests go to real API
- **Slower** - includes network latency
- **More fragile** - depends on API and data availability
- **Real validation** - catches actual API issues
- **Separate folder** - doesn't interfere with unit tests

## Tests Included

- `staging-happy-path.cy.js` - Core user flow: add to cart → select country → checkout
