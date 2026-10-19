/**
 * API Configuration
 * Detects environment from hostname and sets backend URL accordingly
 * No build step needed - this runs directly in the browser
 *
 * Environment detection:
 * - Port 3000 (localhost) → http://localhost:3001
 * - Port 3002 (staging) → https://kickedoutofthesky-store.vercel.app/api
 * - kickedoutofthesky.com (production) → https://kickedoutofthesky-store.vercel.app/api
 * - *.vercel.app (preview) → https://kickedoutofthesky-store.vercel.app/api
 */

(function () {
  // Enforce HTTPS in production
  if (
    window.location.protocol === "http:" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    window.location.protocol = "https:";
  }

  const hostname = window.location.hostname;
  const port = window.location.port;

  // Check for API override via URL parameter (?api=local|staging|prod)
  // or use previously saved sessionStorage value for persistent override
  const urlParams = new URLSearchParams(window.location.search);
  const apiParam = urlParams.get("api");
  let apiTarget;

  if (apiParam && ["local", "staging", "prod"].includes(apiParam)) {
    apiTarget = apiParam;
    sessionStorage.setItem("apiTarget", apiTarget);
  } else {
    apiTarget = sessionStorage.getItem("apiTarget");
  }

  // Determine backend URL: use override if set, otherwise detect from hostname
  let backendUrl;

  if (apiTarget === "local") {
    backendUrl = "http://localhost:3001";
  } else if (apiTarget === "staging" || apiTarget === "prod") {
    backendUrl = "https://kickedoutofthesky-store.vercel.app/api";
  } else {
    // No override: fall back to hostname detection
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      // Local development: detect backend by frontend port
      // :3000 = local API, :3002 = staging API (Vercel), :empty = local API
      if (port === "3002") {
        backendUrl = "https://kickedoutofthesky-store.vercel.app/api";
      } else {
        backendUrl = "http://localhost:3001";
      }
    } else if (hostname === "kickedoutofthesky.com" || hostname === "www.kickedoutofthesky.com") {
      // Production domain → use Vercel API
      backendUrl = "https://kickedoutofthesky-store.vercel.app/api";
    } else if (hostname.endsWith(".vercel.app")) {
      // Preview deployments → use Vercel API
      backendUrl = "https://kickedoutofthesky-store.vercel.app/api";
    } else {
      // Fallback to production API
      backendUrl = "https://kickedoutofthesky-store.vercel.app/api";
    }
  }

  // Make globally available, ensuring no trailing slash
  window.__API_URL__ = backendUrl.replace(/\/$/, "");

  // Add form validation handler for country select
  document.addEventListener(
    "DOMContentLoaded",
    function () {
      const countrySelect = document.querySelector("select[name='country']");
      if (countrySelect) {
        // Validate before form submission
        const form = countrySelect.closest("form");
        if (form) {
          let error;
          form.addEventListener("submit", function (e) {
            if (!countrySelect.value) {
              e.preventDefault();
              countrySelect.setAttribute("aria-invalid", "true");
              countrySelect.focus();
              // Show error feedback
              error = countrySelect.nextElementSibling;
              if (!error || !error.classList.contains("error-message")) {
                error = document.createElement("div");
                error.className = "error-message";
                error.setAttribute("role", "alert");
                error.textContent = "Please select a country";
                countrySelect.parentNode.insertBefore(error, countrySelect.nextSibling);
              }
            } else {
              countrySelect.removeAttribute("aria-invalid");
              error = countrySelect.nextElementSibling;
              if (error && error.classList.contains("error-message")) {
                error.remove();
              }
            }
          });

          // Clear error on selection
          countrySelect.addEventListener("change", function () {
            if (this.value) {
              this.removeAttribute("aria-invalid");
              const error = this.nextElementSibling;
              if (error && error.classList.contains("error-message")) {
                error.remove();
              }
            }
          });
        }
      }
    },
    { once: true }
  );
})();
