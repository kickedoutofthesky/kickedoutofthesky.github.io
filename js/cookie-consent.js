/* Cookie Consent Banner
 * Lightweight, self-contained cookie consent for kickedoutofthesky.com
 * Blocks analytics cookies until user grants consent.
 * Consent stored in localStorage as "cookie_consent" = "accepted" | "declined"
 */
(function () {
  "use strict";

  var CONSENT_KEY = "cookie_consent";

  var banner = null;
  var stylesAdded = false;

  function loadTrackers() {
    if (typeof loadGA === "function") loadGA(); // eslint-disable-line no-undef
    if (typeof window._loadMetaPixel === "function") window._loadMetaPixel();
    if (typeof window._loadTikTokPixel === "function") window._loadTikTokPixel();
    if (typeof window.flushReleaseAnalyticsQueue === "function") window.flushReleaseAnalyticsQueue();
  }

  function addStyles() {
    if (stylesAdded) return;
    stylesAdded = true;
    var style = document.createElement("style");
    style.textContent =
      "#cookie-consent-banner {" +
      "  position: fixed; bottom: 0; left: 0; right: 0; z-index: 10000;" +
      "  background: #111; border-top: 1px solid #333;" +
      "  padding: 16px 20px; font-family: 'Roboto', 'Helvetica Neue', Arial, sans-serif;" +
      "  font-size: 14px; color: #ccc; line-height: 1.5;" +
      "}" +
      "#cookie-consent-banner:focus { outline: none; }" +
      ".cookie-consent-inner {" +
      "  max-width: 960px; margin: 0 auto;" +
      "  display: flex; align-items: center; justify-content: space-between;" +
      "  gap: 20px; flex-wrap: wrap;" +
      "}" +
      ".cookie-consent-inner p { margin: 0; flex: 1; min-width: 200px; }" +
      ".cookie-consent-inner a { color: var(--accent); text-decoration: none; }" +
      ".cookie-consent-inner a:hover { color: var(--accent-2); }" +
      ".cookie-consent-buttons { display: flex; gap: 10px; flex-shrink: 0; }" +
      ".cookie-btn {" +
      "  border: none; border-radius: 4px; padding: 8px 20px; cursor: pointer;" +
      "  font-size: 14px; font-weight: 600;" +
      "}" +
      ".cookie-btn-accept { background: var(--accent); color: #fff; }" +
      ".cookie-btn-accept:hover { background: var(--accent-hover); }" +
      ".cookie-btn-decline { background: #333; color: #ccc; }" +
      ".cookie-btn-decline:hover { background: #444; color: #fff; }" +
      "@media (max-width: 480px) {" +
      "  .cookie-consent-inner { flex-direction: column; text-align: center; }" +
      "  .cookie-consent-buttons { width: 100%; justify-content: center; }" +
      "}";
    document.head.appendChild(style);
  }

  function addLinkStyles() {
    var style = document.createElement("style");
    style.textContent =
      ".cookie-settings-link { background: none; border: 0; padding: 0; margin: 0 8px; font: inherit;" +
      " color: var(--accent); cursor: pointer; text-decoration: none; }" +
      ".cookie-settings-link:hover { color: var(--accent-2); }" +
      ".cookie-settings-link:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }";
    document.head.appendChild(style);
  }

  function showBanner() {
    if (banner) banner.remove();
    addStyles();
    banner = document.createElement("div");
    banner.id = "cookie-consent-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie consent");
    banner.setAttribute("tabindex", "-1");
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
    document.body.appendChild(banner);
    banner.querySelector("#cookie-accept").addEventListener("click", accept);
    banner.querySelector("#cookie-decline").addEventListener("click", decline);
    banner.focus();
  }

  function closeBanner() {
    if (banner) banner.remove();
    banner = null;
  }

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    closeBanner();
    loadTrackers();
  }

  function decline() {
    var wasAccepted = localStorage.getItem(CONSENT_KEY) === "accepted";
    localStorage.setItem(CONSENT_KEY, "declined");
    closeBanner();
    if (wasAccepted) withdrawConsent();
  }

  // Cookies set by GA, Meta and TikTok that we can remove (first-party only)
  function isTrackingCookie(name) {
    return /^(_fbp|_fbc|_ttp|_ga|_gid|_ga_.*|_gat.*)$/.test(name);
  }

  // localStorage/sessionStorage keys written by the TikTok and Meta pixels
  function isTrackingStorageKey(key) {
    return /^(tt_|_tt|__tt|ttclid|_fbp|_fbc|fbevents|fbssls|_fbq)/i.test(key);
  }

  function deleteCookie(name) {
    var expired = "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    var host = window.location.hostname;
    document.cookie = name + expired;
    if (host) document.cookie = name + expired + "; domain=" + host;
    document.cookie = name + expired + "; domain=.kickedoutofthesky.com";
  }

  function clearStorage(storage) {
    try {
      var keys = [];
      for (var i = 0; i < storage.length; i++) keys.push(storage.key(i));
      keys.filter(isTrackingStorageKey).forEach(function (key) {
        storage.removeItem(key);
      });
    } catch (e) {
      /* storage unavailable */
    }
  }

  function withdrawConsent() {
    if (typeof window.fbq === "function") window.fbq("consent", "revoke");
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }
    document.cookie.split(";").forEach(function (pair) {
      var name = pair.split("=")[0].trim();
      if (isTrackingCookie(name)) deleteCookie(name);
    });
    clearStorage(window.localStorage);
    clearStorage(window.sessionStorage);
    // Reload so no tracker code stays in memory
    if (typeof window.location.reload === "function") window.location.reload();
  }

  window.openCookieSettings = function () {
    if (document.body) showBanner();
  };

  document.addEventListener("click", function (e) {
    var trigger = e.target && e.target.closest && e.target.closest("[data-cookie-settings]");
    if (trigger) {
      e.preventDefault();
      window.openCookieSettings();
    }
  });

  addLinkStyles();
  var existing = localStorage.getItem(CONSENT_KEY);
  if (existing === "accepted") {
    loadTrackers();
  } else if (existing !== "declined") {
    if (document.body) {
      showBanner();
    } else {
      document.addEventListener("DOMContentLoaded", showBanner);
    }
  }

  function getCookiePolicyPath() {
    var path = window.location.pathname;
    if (path.indexOf("/store/") !== -1) return "../legal/cookie-policy.html";
    if (path.indexOf("/legal/") !== -1) return "cookie-policy.html";
    return "legal/cookie-policy.html";
  }
})();
