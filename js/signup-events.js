/* Newsletter signup events
 * Fires Meta Lead, TikTok SubmitForm and GA generate_lead after a SUCCESSFUL MailerLite signup.
 * Does not load any pixel; fbq/ttq/gtag are only used if they exist, and nothing fires unless
 * localStorage cookie_consent === "accepted" (fbq is a queueing stub before consent, so this is checked here).
 *
 * Success signals (both are MailerLite's own):
 * - Embedded form (in the page): its thank-you block (.ml-form-successBody.row-success) becomes visible.
 * - Popup (MailerLite iframe): webforms.min.js posts "mlWebformSubmitSuccess-<formId>" to the parent window.
 */
(function () {
  "use strict";

  var CONSENT_KEY = "cookie_consent";
  var MAILERLITE_ORIGIN = /^https:\/\/([a-z0-9-]+\.)*mailerlite\.com$/;
  var SUCCESS_MESSAGE = /^mlWebformSubmitSuccess-(\d+)$/;
  var handled = {};

  function hasConsent() {
    try {
      return localStorage.getItem(CONSENT_KEY) === "accepted";
    } catch {
      return false;
    }
  }

  function newEventId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  // Once per form per page load. A signup made without consent is marked handled too,
  // so accepting cookies afterwards (or a re-render) never sends it late.
  function trackSignup(formKey) {
    if (handled[formKey]) return;
    handled[formKey] = true;
    if (!hasConsent()) return;

    var eventId = newEventId();
    if (typeof window.fbq === "function") {
      window.fbq("track", "Lead", { content_name: "newsletter" }, { eventID: eventId });
    }
    if (window.ttq && typeof window.ttq.track === "function") {
      window.ttq.track("SubmitForm", { content_name: "newsletter" }, { event_id: eventId });
    }
    if (typeof window.gtag === "function") {
      window.gtag("event", "generate_lead", { method: "newsletter" });
    }
  }

  function embeddedFormKey(successBody) {
    var holder = successBody.closest("[class*='ml-subscribe-form-']");
    var match = holder && /ml-subscribe-form-(\d+)/.exec(holder.className);
    return match ? match[1] : "embedded";
  }

  function checkEmbeddedForms() {
    var bodies = document.querySelectorAll(".ml-form-successBody.row-success");
    for (var i = 0; i < bodies.length; i++) {
      if (window.getComputedStyle(bodies[i]).display !== "none") trackSignup(embeddedFormKey(bodies[i]));
    }
  }

  if (typeof MutationObserver === "function") {
    // MailerLite injects the form after load and shows the thank-you block by changing its inline style
    new MutationObserver(checkEmbeddedForms).observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });
  }

  window.addEventListener("message", function (event) {
    if (typeof event.data !== "string" || !MAILERLITE_ORIGIN.test(event.origin)) return;
    var match = SUCCESS_MESSAGE.exec(event.data);
    if (match) trackSignup(match[1]);
  });
})();
