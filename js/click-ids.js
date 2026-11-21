/* Ad click IDs (fbclid, ttclid)
 * Stored in localStorage for 7 days so a later checkout can attribute the order to the ad click.
 * Nothing is stored unless cookie_consent === "accepted". Loaded on every page after cookie-consent.js,
 * which also calls capture() when the visitor clicks Accept so IDs still in the URL are kept.
 */
(function (root) {
  "use strict";

  var CONSENT_KEY = "cookie_consent";
  var STORAGE_KEY = "kots_click_ids";
  var TTL_MS = 7 * 24 * 60 * 60 * 1000;
  var PARAMS = ["fbclid", "ttclid"];

  function hasConsent() {
    try {
      return root.localStorage.getItem(CONSENT_KEY) === "accepted";
    } catch (e) {
      return false;
    }
  }

  function readStore() {
    try {
      var parsed = JSON.parse(root.localStorage.getItem(STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function writeStore(store) {
    try {
      if (Object.keys(store).length === 0) root.localStorage.removeItem(STORAGE_KEY);
      else root.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      /* storage unavailable */
    }
  }

  // Stores any click IDs found in the current URL. Returns true if something was stored.
  function capture() {
    if (!hasConsent()) return false;
    var search = root.location && root.location.search;
    if (!search) return false;
    var query = new URLSearchParams(search);
    var store = readStore();
    var changed = false;
    PARAMS.forEach(function (name) {
      var value = query.get(name);
      if (!value) return;
      var existing = store[name];
      // Keep the original timestamp when the same click ID is seen again
      store[name] = { value: value, ts: existing && existing.value === value ? existing.ts : Date.now() };
      changed = true;
    });
    if (changed) writeStore(store);
    return changed;
  }

  // Returns { fbclid: {value, ts}, ttclid: {value, ts} } for IDs younger than 7 days; drops expired ones.
  function get() {
    if (!hasConsent()) return {};
    var store = readStore();
    var now = Date.now();
    var result = {};
    var pruned = false;
    PARAMS.forEach(function (name) {
      var entry = store[name];
      if (!entry) return;
      if (typeof entry.value === "string" && typeof entry.ts === "number" && now - entry.ts < TTL_MS) {
        result[name] = entry;
      } else {
        delete store[name];
        pruned = true;
      }
    });
    if (pruned) writeStore(store);
    return result;
  }

  var api = { capture: capture, get: get, STORAGE_KEY: STORAGE_KEY, TTL_MS: TTL_MS };
  root.kotsClickIds = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  capture();
})(typeof window !== "undefined" ? window : this);
