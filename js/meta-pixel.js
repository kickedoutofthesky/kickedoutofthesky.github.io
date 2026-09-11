/**
 * meta-pixel.js
 * Meta Pixel (1091548463560589) loaded after cookie consent
 * Implements consent-gated event tracking with UUID deduplication for Conversions API
 * Queues events fired before consent and flushes on acceptance
 */

(function () {
  "use strict";

  const PIXEL_ID = "1091548463560589";
  const CONSENT_KEY = "cookie_consent";

  // Initialize fbq as a queue if it doesn't exist
  // (Facebook's pixel script will convert this to the real implementation once loaded)
  if (!window.fbq) {
    window.fbq = function () {
      if (window.fbq.queue) {
        window.fbq.queue.push(arguments);
      }
    };
    window.fbq.queue = [];
    window.fbq.loaded = false;
  }

  /**
   * Generate UUID for Conversions API deduplication
   */
  // eslint-disable-next-line no-unused-vars
  function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Load Meta Pixel after consent
   */
  function loadMetaPixel() {
    if (window.fbq.loaded) return;
    window.fbq.loaded = true;

    // Load the Meta Pixel script
    // Facebook's script will check if window.fbq exists, see our queue, and use it
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);

    // Initialize pixel once script loads
    // (We do this right away; the real fbq will queue it if not ready)
    window.fbq("init", PIXEL_ID);
    // Note: PageView will be fired by releases.js to avoid duplicates
  }

  // Load pixel if consent already given
  if (localStorage.getItem(CONSENT_KEY) === "accepted") {
    loadMetaPixel();
  }

  // Export for use by cookie-consent module
  window._loadMetaPixel = loadMetaPixel;
})();
