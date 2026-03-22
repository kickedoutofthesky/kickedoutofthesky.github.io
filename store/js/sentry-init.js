/**
 * Sentry Error Monitoring Setup
 *
 * Enables real-time error tracking for the store frontend.
 * All unhandled exceptions and errors are automatically reported to Sentry.
 *
 * Configuration:
 * - Environment: Read from window.location.hostname
 * - Release: Version from package.json (set during build)
 * - Traces Integration: Performance monitoring enabled
 * - Replay Integration: Session replay for debugging (10% sampling in prod)
 */

export function initSentry() {
  // Only initialize in production/staging (not localhost)
  const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  // Get Sentry DSN from environment or meta tag
  const sentryDsn = window.SENTRY_DSN || document.querySelector('meta[name="sentry-dsn"]')?.getAttribute("content");

  if (!sentryDsn && !isDev) {
    console.warn("Sentry DSN not configured. Error tracking disabled.");
    return null;
  }

  if (isDev) {
    return null;
  }

  try {
    // Import Sentry at runtime to avoid issues if not installed
    const Sentry = window.Sentry;

    if (!Sentry) {
      console.warn("Sentry not loaded. Make sure Sentry script is imported before this code.");
      return null;
    }

    Sentry.init({
      // Your Sentry DSN (create at https://sentry.io/)
      dsn: sentryDsn,

      // Environment
      environment: window.location.hostname === "github.com" ? "production" : "staging",

      // Release version (can be set during build)
      release: window.SENTRY_RELEASE || "unknown",

      // Sample 10% of transactions in production, 100% in staging/dev
      tracesSampleRate: window.location.hostname.includes("github.io") ? 0.1 : 1.0,

      // Sample 10% of replays overall
      // If you're not already sampling the entire session, change the sample rates to 100% then to a lower sample rate
      replaysSessionSampleRate: 0.1,

      // If the user had an error, sample them at 100%
      replaysOnErrorSampleRate: 1.0,

      // Ignore certain errors
      ignoreErrors: [
        // Browser extensions
        /top\.location/,
        /top\.ga/,

        // Random spam
        /bmi_.*\.php/,
        /EBCallBackAPIScript/,

        // CORS errors are usually not actionable
        /Script error\.?/,
        /^\s*Script error\.?$/,

        // Ignore errors from CDN/external scripts
        /crossorigin/i,
      ],

      // Before sending to Sentry, filter sensitive data
      beforeSend(event, hint) {
        // Filter out errors from browser extensions
        if (hint.originalException && hint.originalException.message) {
          const msg = hint.originalException.message.toLowerCase();
          if (msg.includes("extension") || msg.includes("chrome-extension")) {
            return null;
          }
        }

        // If it's an error or warning, include the full context
        return event;
      },

      // Integrations
      integrations: [
        new Sentry.Replay({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],

      // Attach stack traces to all messages
      attachStacktrace: true,

      // List of ULRs that are allowed to have their errors sent to Sentry
      allowUrls: [/https?:\/\/(localhost|127\.0\.0\.1|github\.com|.*\.github\.io)/i],
    });

    // Set Sentry instance globally for use in other scripts
    window.Sentry = Sentry;

    return Sentry;
  } catch (error) {
    console.error("Failed to initialize Sentry:", error);
    return null;
  }
}

/**
 * Function to manually capture exceptions
 * Usage: captureException(new Error("Something went wrong"))
 */
export function captureException(error, context = {}) {
  if (window.Sentry) {
    window.Sentry.captureException(error, { contexts: { custom: context } });
  }
}

/**
 * Function to manually capture messages
 * Usage: captureMessage("Payment processing started", "info")
 */
export function captureMessage(message, level = "info") {
  if (window.Sentry) {
    window.Sentry.captureMessage(message, level);
  }
}

/**
 * Function to set user context for error tracking
 * Usage: setUserContext({ email: "user@example.com", order_id: "123" })
 */
export function setUserContext(userData = {}) {
  if (window.Sentry) {
    window.Sentry.setUser(userData);
  }
}

/**
 * Function to set custom tags for filtering errors
 * Usage: setErrorTag("feature", "checkout")
 */
export function setErrorTag(key, value) {
  if (window.Sentry) {
    window.Sentry.setTag(key, value);
  }
}

/**
 * Create a scope for a specific operation
 * Usage: withScope(() => { setErrorTag("operation", "add-to-cart"); })
 */
export function withScope(callback) {
  if (window.Sentry) {
    return window.Sentry.withScope(callback);
  }
  return callback();
}

export default initSentry;
