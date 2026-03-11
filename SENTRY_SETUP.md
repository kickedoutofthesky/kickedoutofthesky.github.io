# Sentry Error Monitoring Setup Guide

This guide explains how to set up error monitoring in production using [Sentry](https://sentry.io/), a real-time error tracking platform.

## Why Sentry?

When your store goes live, errors will happen. Sentry:

- **Detects errors automatically** - catches JavaScript errors, network issues, performance problems
- **Alerts you immediately** - know about problems before customers report them
- **Provides context** - see user sessions, device info, breadcrumbs of actions before error
- **Groups similar errors** - identify patterns and high-impact issues
- **Has a free tier** - 5,000 events/month free (plenty for a small shop)

## Step 1: Create Sentry Account

1. Go to [https://sentry.io](https://sentry.io/)
2. Sign up (free account available)
3. Create a new organization
4. Create a new project:
   - Platform: **JavaScript**
   - Framework: **Vue** (or browser if Vue not available)
   - Name: `kickedoutofthesky-store`

## Step 2: Get Your DSN

After project creation, Sentry shows your **DSN** (Data Source Name):

```
https://examplePublicKey@o0.ingest.sentry.io/0000000
```

Save this - you'll need it for configuration.

## Step 3: Configure Environment Settings

Create a `.env.sentry` file in the root (this is for LOCAL setup only):

```bash
# Copy this to .env.sentry for local testing
# For production, set these in your hosting provider's environment variables

# Sentry DSN (get from https://sentry.io/settings/projects/[project]/keys/)
SENTRY_DSN=https://your-public-key@o0.ingest.sentry.io/0000000

# Release version (ideally your git commit SHA or version number)
SENTRY_RELEASE=0.1.0
```

**Important:** Never commit `.env.sentry` to git if it contains real DSN!

## Step 4: Add Sentry to Your HTML Pages

Add the CDN script to the `<head>` of each page **BEFORE** your custom scripts:

### For All Store Pages

Add to `store/index.html`, `store/product.html`, `store/cart.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- ... other head content ... -->

    <!-- Sentry Error Tracking -->
    <script
      src="https://browser.sentry-cdn.com/10.43.0/bundle.min.js"
      integrity="sha384-n6e40fSb0oBcdXfAy8cGkL1sFR5yfCBGO3r3Tf+lhTMvSLcpPXagzZMQU8kqBqfJ"
      crossorigin="anonymous"
    ></script>

    <!-- Your Sentry DSN (set before initializing) -->
    <meta name="sentry-dsn" content="YOUR_DSN_HERE" />
  </head>
  <body>
    <!-- Your page content -->

    <!-- Initialize Sentry before other scripts -->
    <script type="module">
      import { initSentry } from "./js/sentry-init.js";
      initSentry();
    </script>

    <!-- Other scripts -->
    <script src="./js/cart.js"></script>
    <script src="./js/product.js"></script>
  </body>
</html>
```

## Step 5: Production Configuration (GitHub Pages)

Since your front-end is hosted on GitHub Pages, you have two options:

### Option A: CDN Meta Tag (Recommended for GitHub Pages)

Keep DSN as a meta tag in HTML. This works with static hosting.

1. In your HTML, replace `YOUR_DSN_HERE` with your actual Sentry DSN
2. Commit and push to GitHub Pages
3. Sentry automatically starts tracking errors

**Risks:** DSN is visible in page source (but this is intended - it's the public key)

### Option B: Environment Variable Build Step

If you use a build process:

1. Keep `.env` file in repo (with placeholder)
2. During deploy, replace DSN with real value
3. Builds and pushes to `gh-pages`

This requires a CI/CD workflow. Option A is simpler for GitHub Pages.

## Step 6: Test Sentry Locally

1. Start dev server: `npm run dev`
2. Open http://localhost:5500/store
3. Open browser console and trigger a test error:

```javascript
// In browser console
import { captureException } from "./store/js/sentry-init.js";
captureException(new Error("Test error from console"));

// Or manually throw
throw new Error("Testing Sentry");
```

4. Check Sentry dashboard - should see error appear within ~10 seconds

## Step 7: Add Error Tracking to Your Store Code

Use the provided helper functions in your checkout and cart code:

### Example: Track Cart Actions

In `store/js/cart-display.js`:

```javascript
import { captureMessage, withScope, setErrorTag } from "./sentry-init.js";

function proceedToCheckout() {
  withScope(() => {
    setErrorTag("feature", "checkout");
    captureMessage("Checkout initiated", "info");

    // Rest of checkout code
    fetch("/api/create-checkout-session", {
      method: "POST",
      // ...
    }).catch(error => {
      captureException(error, {
        phase: "checkout_payment",
        timestamp: new Date().toISOString(),
      });
    });
  });
}
```

### Example: Track Errors Automatically

```javascript
import { captureException } from "./sentry-init.js";

try {
  // Your code
  cart.addItem(product);
} catch (error) {
  captureException(error, {
    product_id: product.id,
    cart_size: cart.items.length,
  });
}
```

## Available Sentry Functions

The `sentry-init.js` module exports these functions:

### `initSentry()`

Initialize Sentry. Call once on page load.

```javascript
import { initSentry } from "./js/sentry-init.js";
initSentry();
```

### `captureException(error, context)`

Manually report an error.

```javascript
try {
  riskyOperation();
} catch (error) {
  captureException(error, { operation: "risky" });
}
```

### `captureMessage(message, level)`

Log a message. Levels: "fatal", "error", "warning", "info", "debug"

```javascript
captureMessage("Payment processing started", "info");
```

### `setUserContext(userData)`

Track which user had an error (for PII, use only non-sensitive data).

```javascript
setUserContext({
  email: "user@example.com",
  order_id: "12345",
});
```

### `setErrorTag(key, value)`

Add tags for filtering errors in Sentry dashboard.

```javascript
setErrorTag("payment_provider", "stripe");
setErrorTag("country", "US");
```

### `withScope(callback)`

Create a scope for setting context on multiple errors.

```javascript
withScope(() => {
  setErrorTag("feature", "checkout");
  riskyCheckoutOperation(); // If error, will have checkout tag
});
```

## Sentry Dashboard Usage

### Viewing Errors

1. Log into https://sentry.io
2. Go to your project
3. See all errors with:
   - Error count and frequency
   - Affected users
   - Browser/device info
   - Console messages before error (breadcrumbs)

### Setting Up Alerts

1. Go to Alerts → Create Alert Rule
2. Set rule like: "Error event where browser is Safari"
3. Get email/Slack notifications when triggered

### Finding Specific Errors

1. Use search: `browser:Safari error:TypeError`
2. Set date range
3. Group by URL, error type, user

### Investigating an Error

1. Click error in list
2. See:
   - **Breadcrumbs** - Actions leading to error
   - **Context** - Device, browser, OS
   - **Tags** - Custom tags you set
   - **Stack Trace** - Exact line causing error
   - **Session Replay** - Video of user session (if enabled)

## Configuration Options

The `sentry-init.js` file includes several configuration options you can customize:

```javascript
Sentry.init({
  // Error sampling rate (0.1 = sample 10% of events)
  sampleRate: 0.1,

  // Transaction/performance sampling
  tracesSampleRate: 0.1,

  // Session replay sampling (record 10% of sessions)
  replaysSessionSampleRate: 0.1,

  // If user had error, record 100% of their session
  replaysOnErrorSampleRate: 1.0,

  // Environment (usually "production", "staging", "development")
  environment: "production",
});
```

For high-traffic sites, reduce sampling rates to save costs:

- `sampleRate: 0.01` (1% of errors)
- `tracesSampleRate: 0.05` (5% of transactions)
- `replaysSessionSampleRate: 0.01` (1% of sessions)

## Handling Sensitive Data

**DO NOT send:**

- Credit card numbers
- Password data
- Cookie values
- Personal identifying info

**FINE to send:**

- Order IDs (anonymized)
- Product names and prices
- Feature names
- Feature flags
- Error types

The default configuration filters common sensitive patterns, but review before sending PII.

## Performance Impact

Sentry adds minimal overhead:

- Bundle size: ~50KB (compressed)
- Runtime overhead: <5ms for error detection
- Network requests: Only when errors occur

No performance impact if no errors!

## Troubleshooting

### Errors Not Appearing in Sentry

1. Check DSN is correct: `https://[key]@o0.ingest.sentry.io/[projectid]`
2. Verify Sentry script loaded: Check DevTools → Network tab
3. Check console for Sentry initialization logs
4. Errors on localhost are ignored by default (see `sentry-init.js`)

### Too Many Errors/Alerts

1. Reduce sample rate in `sentry-init.js`
2. Set up alert rules to filter noise
3. Ignore known, non-actionable errors

### Sentry Not Loading

If Sentry CDN is down:

1. Your site continues working normally
2. Errors just aren't tracked
3. Site performance unaffected

This is by design - Sentry fails silently.

## Free Tier Limits

Sentry free tier includes:

- 5,000 error events/month
- 1 team member
- 30-day retention
- Basic spike alerts

Paid tiers: $20-500/month depending on volume.

## Next Steps

1. ✅ Create Sentry account and project
2. ✅ Add Sentry to all HTML pages
3. ✅ Test with manual error
4. ✅ Deploy to production
5. Monitor dashboard for issues
6. Add alert rules for critical errors
7. Integrate with Slack/email for notifications

## Resources

- **Sentry Docs:** https://docs.sentry.io/
- **JavaScript Integration:** https://docs.sentry.io/platforms/javascript/
- **Pricing & Limits:** https://sentry.io/pricing/
- **Session Replay (Advanced):** https://docs.sentry.io/product/session-replay/

## Example: Complete Checkout Integration

See this example of how to integrate Sentry into your checkout flow:

```javascript
// store/js/checkout-with-sentry.js
import {
  captureException,
  captureMessage,
  setUserContext,
  withScope,
  setErrorTag,
} from "./sentry-init.js";

export async function initiateCheckout(cartItems, userEmail) {
  try {
    withScope(() => {
      setErrorTag("feature", "checkout");
      setErrorTag("cart_size", cartItems.length);
      setUserContext({ email: userEmail });

      captureMessage("Checkout started", "info");

      // Create Stripe session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({
          items: cartItems,
          email: userEmail,
        }),
      });

      if (!response.ok) {
        throw new Error(`Checkout failed: ${response.status}`);
      }

      const session = await response.json();
      captureMessage("Stripe session created", "info");

      // Redirect to Stripe
      window.location.href = session.url;
    });
  } catch (error) {
    captureException(error, {
      step: "checkout_initiation",
      items: cartItems.length,
      user_email: userEmail,
    });

    // Show user-friendly error
    alert("Checkout failed. Our team has been notified.");
  }
}
```

---

**Questions?** See Sentry documentation or GitHub Issues in this repo.
