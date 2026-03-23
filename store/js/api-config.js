/**
 * API Configuration
 * Detects environment from hostname and sets backend URL accordingly
 * No build step needed - this runs directly in the browser
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
