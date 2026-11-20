/**
 * meta-pixel.js
 * Meta Pixel / dataset (1091548463560589) loaded after cookie consent
 * window.fbq does not exist until loadMetaPixel() runs, so nothing Meta-related is defined before consent.
 * Pages must guard calls with typeof window.fbq === "function".
 */

(function () {
  "use strict";

  // A page can set window.META_PIXEL_ID before this script to use a different pixel.
  const PIXEL_ID = window.META_PIXEL_ID || "1091548463560589";
  const CONSENT_KEY = "cookie_consent";
  let pixelLoaded = false;

  // Meta's official base-code stub: queues calls until fbevents.js attaches callMethod, then forwards them
  function createFbqStub() {
    const n = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    window.fbq = n;
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    return n;
  }

  /**
   * Generate UUID for Conversions API deduplication
   */
  function generateUUID() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
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
    if (pixelLoaded) return;
    pixelLoaded = true;

    // Reuse an fbq a page already provides, as Meta's own snippet does
    if (typeof window.fbq !== "function") createFbqStub();

    // fbevents.js finds window.fbq, takes over its queue and attaches callMethod
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);

    // Stop Meta auto-tracking button clicks (e.g. the cookie banner's Decline); must precede init
    window.fbq("set", "autoConfig", false, PIXEL_ID);
    window.fbq("init", PIXEL_ID);
    // The single PageView for the page. A page can set window.META_PAGEVIEW_EVENT_ID first
    // (e.g. to share the ID with a server-side event); other code can read it afterwards.
    window.META_PAGEVIEW_EVENT_ID = window.META_PAGEVIEW_EVENT_ID || generateUUID();
    window.fbq("track", "PageView", {}, { eventID: window.META_PAGEVIEW_EVENT_ID });
  }

  // Load pixel if consent already given
  if (localStorage.getItem(CONSENT_KEY) === "accepted") {
    loadMetaPixel();
  }

  // Export for use by cookie-consent module
  window._loadMetaPixel = loadMetaPixel;
})();
