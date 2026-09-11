/* Cookie Consent Banner
 * Lightweight, self-contained cookie consent for kickedoutofthesky.com
 * Blocks analytics cookies until user grants consent.
 * Consent stored in localStorage as "cookie_consent" = "accepted" | "declined"
 */
(function () {
  "use strict";

  var CONSENT_KEY = "cookie_consent";

  // If user already made a choice, load analytics if accepted
  var existing = localStorage.getItem(CONSENT_KEY);
  if (existing === "accepted") {
    if (typeof loadGA === "function") loadGA(); // eslint-disable-line no-undef
    if (typeof window._loadMetaPixel === "function") window._loadMetaPixel(); // eslint-disable-line no-undef
    if (typeof window.flushReleaseAnalyticsQueue === "function") window.flushReleaseAnalyticsQueue(); // eslint-disable-line no-undef
    return;
  }
  if (existing === "declined") {
    return;
  }

  // Build and show the banner
  var banner = document.createElement("div");
  banner.id = "cookie-consent-banner";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-label", "Cookie consent");
  banner.innerHTML =
    '<div class="cookie-consent-inner">' +
    "<p>We use cookies for site analytics and essential functionality. " +
    'See our <a href="' +
    getCookiePolicyPath() +
    '">Cookie Policy</a> for details.</p>' +
    '<div class="cookie-consent-buttons">' +
    '<button id="cookie-accept" class="cookie-btn cookie-btn-accept">Accept</button>' +
    '<button id="cookie-decline" class="cookie-btn cookie-btn-decline">Decline</button>' +
    "</div>" +
    "</div>";

  // Inject styles
  var style = document.createElement("style");
  style.textContent =
    "#cookie-consent-banner {" +
    "  position: fixed; bottom: 0; left: 0; right: 0; z-index: 10000;" +
    "  background: #111; border-top: 1px solid #333;" +
    "  padding: 16px 20px; font-family: 'Roboto', 'Helvetica Neue', Arial, sans-serif;" +
    "  font-size: 14px; color: #ccc; line-height: 1.5;" +
    "}" +
    ".cookie-consent-inner {" +
    "  max-width: 960px; margin: 0 auto;" +
    "  display: flex; align-items: center; justify-content: space-between;" +
    "  gap: 20px; flex-wrap: wrap;" +
    "}" +
    ".cookie-consent-inner p { margin: 0; flex: 1; min-width: 200px; }" +
    ".cookie-consent-inner a { color: #f0c040; text-decoration: none; }" +
    ".cookie-consent-inner a:hover { color: #fff; }" +
    ".cookie-consent-buttons { display: flex; gap: 10px; flex-shrink: 0; }" +
    ".cookie-btn {" +
    "  border: none; border-radius: 4px; padding: 8px 20px; cursor: pointer;" +
    "  font-size: 14px; font-weight: 600;" +
    "}" +
    ".cookie-btn-accept { background: #f0c040; color: #000; }" +
    ".cookie-btn-accept:hover { background: #ffd54f; }" +
    ".cookie-btn-decline { background: #333; color: #ccc; }" +
    ".cookie-btn-decline:hover { background: #444; color: #fff; }" +
    "@media (max-width: 480px) {" +
    "  .cookie-consent-inner { flex-direction: column; text-align: center; }" +
    "  .cookie-consent-buttons { width: 100%; justify-content: center; }" +
    "}";

  document.head.appendChild(style);

  // Wait for DOM ready to insert
  if (document.body) {
    document.body.appendChild(banner);
    attachListeners();
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      document.body.appendChild(banner);
      attachListeners();
    });
  }

  function attachListeners() {
    document.getElementById("cookie-accept").addEventListener("click", function () {
      localStorage.setItem(CONSENT_KEY, "accepted");
      banner.remove();
      if (typeof loadGA === "function") loadGA(); // eslint-disable-line no-undef
      if (typeof window._loadMetaPixel === "function") window._loadMetaPixel(); // eslint-disable-line no-undef
      if (typeof window.flushReleaseAnalyticsQueue === "function") window.flushReleaseAnalyticsQueue(); // eslint-disable-line no-undef
    });
    document.getElementById("cookie-decline").addEventListener("click", function () {
      localStorage.setItem(CONSENT_KEY, "declined");
      banner.remove();
    });
  }

  function getCookiePolicyPath() {
    var path = window.location.pathname;
    if (path.indexOf("/store/") !== -1) return "../legal/cookie-policy.html";
    if (path.indexOf("/legal/") !== -1) return "cookie-policy.html";
    return "legal/cookie-policy.html";
  }
})();
