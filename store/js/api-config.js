/**
 * API Configuration
 * Detects environment from hostname and sets backend URL accordingly
 * No build step needed - this runs directly in the browser
 */

(function () {
  const hostname = window.location.hostname;

  // Determine backend URL based on hostname
  let backendUrl;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    // Local development: point to local Vercel dev server
    backendUrl = "http://localhost:3001";
  } else if (hostname.includes("vercel.app")) {
    // Preview environment: same origin (branch deployment)
    backendUrl = window.location.origin;
  } else {
    // Production: point to production backend
    backendUrl = "https://kickedoutofthesky-store.vercel.app";
  }

  // Make globally available
  window.__API_URL__ = backendUrl;
})();
