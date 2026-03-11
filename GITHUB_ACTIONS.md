# GitHub Actions Configuration Guide

This document explains how to configure GitHub Actions for the Kicked Out of the Sky store.

## Workflows Overview

The project includes two GitHub Actions workflows:

### 1. **ci.yml** - General CI Pipeline

Runs on every push and PR. Includes:

- Format checking (Prettier)
- Linting (ESLint)
- Unit tests (Jest)
- E2E tests (Cypress) - with continue-on-error
- Coverage upload

### 2. **cypress.yml** - Dedicated E2E Testing

Specialized Cypress testing workflow. Includes:

- Local server startup
- Cypress test execution
- Artifact upload on failure
- PR comments with test results
- Backend URL environment variable support

## Setting Up GitHub Actions Secrets

GitHub Actions secrets are used to store sensitive configuration. To add secrets:

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add the following secrets:

### Required Secrets

**`CYPRESS_BACKEND_URL`** (Optional - for Vercel staging)

```
https://your-staging-backend.vercel.app
```

This allows Cypress tests to hit your Vercel backend in CI instead of localhost.

If not set, Cypress will use the local frontend server.

## Environment Variables in Workflows

### Available Variables

**Frontend Server**

- `CYPRESS_BASE_URL`: http://localhost:5500 (default)
- `NODE_ENV`: test

**Backend Configuration**

- `CYPRESS_BACKEND_URL`: Your Vercel staging URL (from secrets)

### Using Environment Variables in Tests

In your Cypress tests, access environment variables:

```javascript
// Get backend URL
const backendUrl = Cypress.env("BACKEND_URL") || "http://localhost:3000";

// Make API calls to backend
cy.visit(backendUrl + "/api/checkout");
```

Or use in fixture files:

```javascript
// cypress/support/e2e.js
const backendUrl = Cypress.env("BACKEND_URL") || "http://localhost:3000";
Cypress.config("baseUrl", backendUrl);
```

## Workflow Triggers

### Push Triggers

Workflows run on:

- Push to `main` branch (production)
- Push to `gh-pages` branch (GitHub Pages deployment)
- Push to `develop` branch (staging)

### Pull Request Triggers

Workflows run on:

- PRs to `main`, `gh-pages`, or `develop` branches

### Manual Triggers (Optional)

You can add manual trigger support by adding to workflow:

```yaml
on:
  workflow_dispatch:
    inputs:
      browsers:
        description: "Browser to test"
        required: true
        default: "chrome"
```

## Test Artifacts

### On Failure

Cypress automatically uploads artifacts when tests fail:

- **Screenshots**: `cypress/screenshots/`
- **Videos**: `cypress/videos/`
- Retention: 7 days

Access artifacts:

1. Go to failed workflow run
2. Scroll to "Artifacts" section
3. Download for debugging

### On Success

Artifacts are not uploaded (to save space).

## Node.js Version

Workflows use Node.js **14.x** (matches your dev environment).

To upgrade:

1. Update `.github/workflows/ci.yml`
2. Update `.github/workflows/cypress.yml`
3. Change `node-version: [14.x]` to desired version

```yaml
strategy:
  matrix:
    node-version: [18.x] # or 16.x, 20.x, etc.
```

## Server Startup

The Cypress workflow uses `npx serve` to start a static server:

1. Installs npm dependencies (`npm ci`)
2. Starts server: `npx serve -s . -p 5500`
3. Waits for server ready (using `wait-on`)
4. Runs Cypress tests
5. Kills server on completion (success or failure)

**Why `serve`?**

- Lightweight static file server
- No build step needed for static HTML
- Works with GitHub Pages structure

## Debugging Workflow Issues

### Viewing Workflow Logs

1. Go to GitHub repository
2. Click "Actions" tab
3. Click workflow run
4. Click job to expand logs
5. Search for errors

### Common Issues

**Server failed to start**

- Check port 5500 is not in use
- Verify `npm ci` succeeded
- Check file permissions

**Cypress timeouts**

- Increase timeout in workflow (currently 30 minutes)
- Check `wait-on` configuration
- Verify server is actually running

**Tests pass locally but fail in CI**

- Check file paths (use `/` not `\`)
- Verify environment variables set correctly
- Check for timezone-dependent tests

### Re-running Workflows

1. Go to failed workflow run
2. Click "Re-run failed jobs" button
3. Workflows re-execute

## GitHub Actions Billing

Free tier includes:

- **2,000 minutes/month** of Actions usage
- Linux runners: 2x free (count as 2 minutes/minute of use)
- 500MB of artifact storage

Your workflows:

- `ci.yml`: ~2-3 minutes per run
- `cypress.yml`: ~5-10 minutes per run (includes server startup)

**Estimate**: ~10-15 workflow runs/day = ~1.5-2.5 hours/day usage

**Status**: Well under free tier limit ✅

If you exceed limit, GitHub automatically pauses workflows (doesn't charge for public repos on free account).

## Customization

### Changing Test Specifications

Edit `cypress.yml` to run specific test files:

```yaml
- name: Run Cypress tests
  run: npx cypress run --spec 'cypress/e2e/checkout.cy.js'
```

### Adding Environment-Specific Frontend URLs

```yaml
env:
  FRONTEND_URL_PROD: https://kickedoutofthesky.com
  FRONTEND_URL_STAGING: https://staging.kickedoutofthesky.com
  FRONTEND_URL_DEV: http://localhost:5500
```

### Conditional Steps

Run steps only on certain branches:

```yaml
- name: Deploy to production
  if: github.ref == 'refs/heads/main'
  run: npm run deploy
```

## Security Best Practices

### Secrets Management

✅ **DO**:

- Use GitHub secrets for sensitive values
- Rotate secrets regularly
- Use masked secrets (automatically masked in logs)
- Store API keys and passwords in secrets

❌ **DON'T**:

- Commit `.env` files with real values
- Log secrets in workflow steps
- Hardcode credentials in workflows
- Share secrets in public repositories

### Limiting Workflow Permissions

You can restrict what workflows can do:

```yaml
permissions:
  contents: read
  pull-requests: read
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions Secrets Management](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Cypress GitHub Actions Integration](https://docs.cypress.io/guides/continuous-integration/github-actions)

## Next Steps

1. Push code to GitHub
2. Go to Actions tab to see workflows run
3. Configure `CYPRESS_BACKEND_URL` secret if using Vercel backend
4. Monitor first few runs for any issues
5. Use PR comments to review test results

---

**Questions?** Check GitHub Issues or Actions logs for detailed error messages.
