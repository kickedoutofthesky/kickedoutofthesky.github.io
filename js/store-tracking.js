/* Store funnel events for Meta and TikTok
 * Events fire only if the pixel already exists (it is created after consent by meta-pixel.js /
 * tiktok-pixel.js). This file never loads a pixel.
 *
 * content_ids are Printful sync variant ids; the product key is used until a variant is chosen.
 */
(function (root) {
  "use strict";

  var CONSENT_KEY = "cookie_consent";
  var PURCHASE_KEY_PREFIX = "kots_purchase_tracked_";
  // The store sells in USD only; this is the single place the default currency is defined
  var STORE_CURRENCY = "USD";

  function hasConsent() {
    try {
      return root.localStorage.getItem(CONSENT_KEY) === "accepted";
    } catch (e) {
      return false;
    }
  }

  function metaTrack(event, params, eventId) {
    if (typeof root.fbq !== "function") return false;
    try {
      if (eventId) root.fbq("track", event, params, { eventID: eventId });
      else root.fbq("track", event, params);
    } catch (e) {
      return false;
    }
    return true;
  }

  function tiktokTrack(event, params, eventId) {
    if (!root.ttq || typeof root.ttq.track !== "function") return false;
    try {
      if (eventId) root.ttq.track(event, params, { event_id: eventId });
      else root.ttq.track(event, params);
    } catch (e) {
      return false;
    }
    return true;
  }

  // Price in dollars as a number (never cents)
  function toDollars(cents) {
    return Math.round(Number(cents) || 0) / 100;
  }

  function normalizeItems(items) {
    return (items || []).map(function (item) {
      return {
        id: String(item.id),
        name: item.name || "",
        price: toDollars(item.priceCents),
        quantity: item.quantity || 1,
      };
    });
  }

  function totals(items) {
    return {
      value:
        Math.round(
          items.reduce(function (sum, i) {
            return sum + i.price * i.quantity * 100;
          }, 0)
        ) / 100,
      numItems: items.reduce(function (sum, i) {
        return sum + i.quantity;
      }, 0),
    };
  }

  function tiktokContents(items) {
    return items.map(function (i) {
      return { content_id: i.id, content_type: "product", content_name: i.name, price: i.price, quantity: i.quantity };
    });
  }

  // Shape shared by ViewContent and AddToCart: one product (optionally several units)
  function productEvent(eventName, item, currency) {
    var items = normalizeItems([item]);
    var cur = currency || STORE_CURRENCY;
    var value = totals(items).value;
    var sent = metaTrack(eventName, {
      content_ids: [items[0].id],
      content_type: "product",
      content_name: items[0].name,
      value: value,
      currency: cur,
    });
    var sentTT = tiktokTrack(eventName, {
      contents: tiktokContents(items),
      value: value,
      currency: cur,
    });
    return sent || sentTT;
  }

  // item: { id, name, priceCents, quantity }
  function trackViewContent(item, currency) {
    return productEvent("ViewContent", item, currency);
  }

  function trackAddToCart(item, currency) {
    return productEvent("AddToCart", item, currency);
  }

  // items: [{ id, name, priceCents, quantity }]. Returns true if any pixel received the event.
  function trackInitiateCheckout(items, eventId, currency) {
    var list = normalizeItems(items);
    var t = totals(list);
    var cur = currency || STORE_CURRENCY;
    var sent = metaTrack(
      "InitiateCheckout",
      {
        content_ids: list.map(function (i) {
          return i.id;
        }),
        num_items: t.numItems,
        value: t.value,
        currency: cur,
      },
      eventId
    );
    var sentTT = tiktokTrack(
      "InitiateCheckout",
      { contents: tiktokContents(list), value: t.value, currency: cur },
      eventId
    );
    return sent || sentTT;
  }

  // order: { sessionId, eventId, amountCents, currency, items: [{ id, name, priceCents, quantity }] }
  // Fires at most once per Stripe session id. Returns true if a Purchase was sent.
  function trackPurchase(order) {
    if (!order || !order.sessionId || !order.eventId || typeof order.amountCents !== "number") return false;
    var key = PURCHASE_KEY_PREFIX + order.sessionId;
    try {
      if (root.localStorage.getItem(key)) return false;
    } catch (e) {
      return false;
    }

    var list = normalizeItems(order.items);
    var value = toDollars(order.amountCents);
    var cur = order.currency || STORE_CURRENCY;
    var numItems = totals(list).numItems;

    var sent = metaTrack(
      "Purchase",
      {
        value: value,
        currency: cur,
        content_ids: list.map(function (i) {
          return i.id;
        }),
        num_items: numItems,
      },
      order.eventId
    );
    var sentTT = tiktokTrack(
      "CompletePayment",
      { value: value, currency: cur, contents: tiktokContents(list) },
      order.eventId
    );
    if (!sent && !sentTT) return false;

    try {
      root.localStorage.setItem(key, "1");
    } catch (e) {
      /* storage unavailable */
    }
    return true;
  }

  function readCookie(name) {
    var pairs = (root.document && root.document.cookie ? root.document.cookie : "").split(";");
    for (var i = 0; i < pairs.length; i++) {
      var idx = pairs[i].indexOf("=");
      if (idx !== -1 && pairs[i].slice(0, idx).trim() === name)
        return decodeURIComponent(pairs[i].slice(idx + 1).trim());
    }
    return null;
  }

  // Hand-off data for the checkout session. Without consent only the event_id and consent:false are sent.
  function buildCheckoutTracking(eventId) {
    if (!hasConsent()) return { event_id: eventId, consent: false };

    var clickIds = root.kotsClickIds && typeof root.kotsClickIds.get === "function" ? root.kotsClickIds.get() : {};
    var fbc = readCookie("_fbc");
    if (!fbc && clickIds.fbclid) fbc = "fb.1." + clickIds.fbclid.ts + "." + clickIds.fbclid.value;

    var tracking = { event_id: eventId, consent: true };
    var optional = {
      fbp: readCookie("_fbp"),
      fbc: fbc,
      ttclid: clickIds.ttclid ? clickIds.ttclid.value : null,
      ttp: readCookie("_ttp"),
      event_source_url: root.location && root.location.href,
    };
    Object.keys(optional).forEach(function (key) {
      if (optional[key]) tracking[key] = optional[key];
    });
    return tracking;
  }

  var api = {
    STORE_CURRENCY: STORE_CURRENCY,
    PURCHASE_KEY_PREFIX: PURCHASE_KEY_PREFIX,
    trackViewContent: trackViewContent,
    trackAddToCart: trackAddToCart,
    trackInitiateCheckout: trackInitiateCheckout,
    trackPurchase: trackPurchase,
    buildCheckoutTracking: buildCheckoutTracking,
  };
  root.kotsStoreTracking = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : this);
