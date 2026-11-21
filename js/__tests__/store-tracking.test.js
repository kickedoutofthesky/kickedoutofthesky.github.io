/**
 * @jest-environment jsdom
 */

function load() {
  let api;
  jest.isolateModules(() => {
    api = require("../store-tracking.js");
  });
  return api;
}

function clearCookies() {
  document.cookie.split(";").forEach(c => {
    document.cookie = c.split("=")[0].trim() + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  });
}

describe("store-tracking.js", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCookies();
    delete window.fbq;
    delete window.ttq;
    delete window.kotsClickIds;
  });

  describe("pixel guards", () => {
    it("does nothing and does not throw when neither pixel exists", () => {
      const t = load();
      expect(t.trackViewContent({ id: "1", name: "Tee", priceCents: 3000, quantity: 1 })).toBe(false);
      expect(t.trackAddToCart({ id: "1", name: "Tee", priceCents: 3000, quantity: 1 })).toBe(false);
      expect(t.trackInitiateCheckout([{ id: "1", name: "Tee", priceCents: 3000, quantity: 1 }], "e1")).toBe(false);
      expect(window.fbq).toBeUndefined();
      expect(window.ttq).toBeUndefined();
    });

    it("ignores a ttq without a track function", () => {
      window.ttq = {};
      const t = load();
      expect(t.trackViewContent({ id: "1", name: "Tee", priceCents: 3000, quantity: 1 })).toBe(false);
    });
  });

  describe("event payloads", () => {
    let t;
    beforeEach(() => {
      window.fbq = jest.fn();
      window.ttq = { track: jest.fn() };
      t = load();
    });

    it("ViewContent: dollars as a number, product content_type", () => {
      t.trackViewContent({ id: "5634400075", name: "Unisex Tee", priceCents: 3050, quantity: 1 });
      expect(window.fbq).toHaveBeenCalledWith("track", "ViewContent", {
        content_ids: ["5634400075"],
        content_type: "product",
        content_name: "Unisex Tee",
        value: 30.5,
        currency: "USD",
      });
      expect(window.ttq.track).toHaveBeenCalledWith("ViewContent", {
        contents: [
          { content_id: "5634400075", content_type: "product", content_name: "Unisex Tee", price: 30.5, quantity: 1 },
        ],
        value: 30.5,
        currency: "USD",
      });
    });

    it("AddToCart: value is price times quantity, price stays per unit", () => {
      t.trackAddToCart({ id: "77", name: "Hoodie", priceCents: 5000, quantity: 3 });
      expect(window.fbq.mock.calls[0][2]).toMatchObject({ content_ids: ["77"], value: 150, currency: "USD" });
      expect(window.ttq.track.mock.calls[0][1].contents[0]).toMatchObject({ price: 50, quantity: 3 });
      expect(window.ttq.track.mock.calls[0][1].value).toBe(150);
    });

    it("InitiateCheckout: totals, num_items and the shared event id on both pixels", () => {
      t.trackInitiateCheckout(
        [
          { id: "1", name: "Tee", priceCents: 3000, quantity: 2 },
          { id: "2", name: "Hoodie", priceCents: 5000, quantity: 1 },
        ],
        "evt-1"
      );
      expect(window.fbq).toHaveBeenCalledWith(
        "track",
        "InitiateCheckout",
        { content_ids: ["1", "2"], num_items: 3, value: 110, currency: "USD" },
        { eventID: "evt-1" }
      );
      const [name, params, options] = window.ttq.track.mock.calls[0];
      expect(name).toBe("InitiateCheckout");
      expect(params.value).toBe(110);
      expect(params.contents.map(c => c.content_id)).toEqual(["1", "2"]);
      expect(options).toEqual({ event_id: "evt-1" });
    });

    it("uses a currency passed from the data instead of the default", () => {
      t.trackAddToCart({ id: "1", name: "Tee", priceCents: 3000, quantity: 1 }, "EUR");
      expect(window.fbq.mock.calls[0][2].currency).toBe("EUR");
    });
  });

  describe("trackPurchase", () => {
    const order = {
      sessionId: "cs_test_1",
      eventId: "evt-9",
      amountCents: 8999,
      currency: "USD",
      items: [{ id: "5634400075", name: "Tee", priceCents: 3000, quantity: 2 }],
    };

    it("sends Purchase and CompletePayment with the checkout event id", () => {
      window.fbq = jest.fn();
      window.ttq = { track: jest.fn() };
      const t = load();

      expect(t.trackPurchase(order)).toBe(true);
      expect(window.fbq).toHaveBeenCalledWith(
        "track",
        "Purchase",
        { value: 89.99, currency: "USD", content_ids: ["5634400075"], num_items: 2 },
        { eventID: "evt-9" }
      );
      expect(window.ttq.track).toHaveBeenCalledWith(
        "CompletePayment",
        {
          value: 89.99,
          currency: "USD",
          contents: [
            { content_id: "5634400075", content_type: "product", content_name: "Tee", price: 30, quantity: 2 },
          ],
        },
        { event_id: "evt-9" }
      );
    });

    it("fires only once per session id, even across page loads", () => {
      window.fbq = jest.fn();
      window.ttq = { track: jest.fn() };
      let t = load();
      expect(t.trackPurchase(order)).toBe(true);
      t = load();
      expect(t.trackPurchase(order)).toBe(false);
      expect(window.fbq).toHaveBeenCalledTimes(1);
      expect(window.ttq.track).toHaveBeenCalledTimes(1);

      expect(t.trackPurchase({ ...order, sessionId: "cs_test_2" })).toBe(true);
    });

    it("does not mark the session as tracked when no pixel exists (no consent)", () => {
      const t = load();
      expect(t.trackPurchase(order)).toBe(false);
      window.fbq = jest.fn();
      expect(t.trackPurchase(order)).toBe(true);
    });

    it("needs an event id and a numeric amount", () => {
      window.fbq = jest.fn();
      const t = load();
      expect(t.trackPurchase({ ...order, eventId: null })).toBe(false);
      expect(t.trackPurchase({ ...order, amountCents: undefined })).toBe(false);
      expect(window.fbq).not.toHaveBeenCalled();
    });
  });

  describe("buildCheckoutTracking", () => {
    it("without consent sends only event_id and consent:false", () => {
      document.cookie = "_fbp=fb.1.1.2; path=/";
      document.cookie = "_ttp=ttp-1; path=/";
      localStorage.setItem("cookie_consent", "declined");
      expect(load().buildCheckoutTracking("evt-1")).toEqual({ event_id: "evt-1", consent: false });
    });

    it("with no stored choice also sends only event_id and consent:false", () => {
      expect(load().buildCheckoutTracking("evt-1")).toEqual({ event_id: "evt-1", consent: false });
    });

    it("with consent sends cookies, click ids and the page URL", () => {
      localStorage.setItem("cookie_consent", "accepted");
      document.cookie = "_fbp=fb.1.100.200; path=/";
      document.cookie = "_fbc=fb.1.100.abc; path=/";
      document.cookie = "_ttp=ttp-1; path=/";
      window.kotsClickIds = { get: () => ({ ttclid: { value: "tt-click", ts: 1 } }) };

      expect(load().buildCheckoutTracking("evt-2")).toEqual({
        event_id: "evt-2",
        consent: true,
        fbp: "fb.1.100.200",
        fbc: "fb.1.100.abc",
        ttclid: "tt-click",
        ttp: "ttp-1",
        event_source_url: window.location.href,
      });
    });

    it("builds fbc from the stored fbclid when there is no _fbc cookie", () => {
      localStorage.setItem("cookie_consent", "accepted");
      window.kotsClickIds = { get: () => ({ fbclid: { value: "IwAR123", ts: 1700000000000 } }) };
      const tracking = load().buildCheckoutTracking("evt-3");
      expect(tracking.fbc).toBe("fb.1.1700000000000.IwAR123");
      expect(tracking).not.toHaveProperty("fbp");
      expect(tracking).not.toHaveProperty("ttclid");
    });
  });
});
