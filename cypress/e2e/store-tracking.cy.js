/* eslint-disable no-undef */

// Store funnel events (js/store-tracking.js) and the checkout hand-off data sent to the API.
// fbq is replaced with a recorder; the Meta and TikTok scripts are stubbed so nothing leaves the machine.

const TEE = { productKey: "product_421296994", color: "Black", size: "M" }; // variant 5634425976
const STRIPE_URL = "/store/success.html?session_id=cs_test_tracking";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function recordPixel(calls) {
  return win => {
    win.fbq = (...args) => calls.push(args);
  };
}

const events = (calls, name) => calls.filter(args => args[0] === "track" && args[1] === name);

describe("Store funnel tracking", () => {
  beforeEach(() => {
    cy.intercept("https://connect.facebook.net/**", { statusCode: 200, body: "" });
    cy.intercept("https://analytics.tiktok.com/**", { statusCode: 200, body: "" });
  });

  describe("ViewContent", () => {
    it("fires once on the product page with consent, using the product key until a variant is chosen", () => {
      const calls = [];
      cy.visitWith(`/store/product.html?key=${TEE.productKey}`, {
        consent: "accepted",
        onBeforeLoad: recordPixel(calls),
      });
      cy.get("[data-testid='product-title']").should("be.visible");
      cy.chooseVariant({ color: TEE.color, size: TEE.size }).then(() => {
        const views = events(calls, "ViewContent");
        expect(views).to.have.length(1);
        expect(views[0][2]).to.include({ content_type: "product", currency: "USD" });
        expect(views[0][2].content_ids).to.deep.equal([TEE.productKey]);
        expect(views[0][2].value).to.be.a("number");
      });
    });

    it("sends nothing without consent", () => {
      cy.visitWith(`/store/product.html?key=${TEE.productKey}`, { consent: "declined" });
      cy.get("[data-testid='product-title']").should("be.visible");
      cy.window().should(win => expect(win.fbq).to.be.undefined);
    });
  });

  describe("InitiateCheckout and the tracking hand-off", () => {
    const checkout = (visitOptions, path = "/store/cart.html") => {
      cy.intercept("POST", "**/api/create-checkout-session", { statusCode: 200, body: { url: STRIPE_URL } }).as(
        "createSession"
      );
      cy.intercept("GET", "**/api/order-details?session_id=cs_test_tracking", { statusCode: 404, body: {} });
      cy.visitWith(path, { cart: [{ ...TEE, quantity: 2 }], ...visitOptions });
      cy.get("[data-testid='cart-item']").should("have.length", 1);
      cy.selectShippingCountry("US");
      cy.acceptTerms();
      cy.get("#checkout-btn").click();
    };

    it("with consent: fires InitiateCheckout with the same event id it posts, plus ad identifiers", () => {
      const calls = [];
      checkout({
        consent: "accepted",
        qs: { fbclid: "AbC123" },
        onBeforeLoad: recordPixel(calls),
      });

      cy.wait("@createSession")
        .its("request.body.tracking")
        .should(tracking => {
          expect(tracking.consent).to.eq(true);
          expect(tracking.event_id).to.match(UUID);
          expect(tracking.fbc).to.match(/^fb\.1\.\d+\.AbC123$/);
          expect(tracking.event_source_url).to.include("/store/cart.html");
        })
        .then(tracking => {
          const initiate = events(calls, "InitiateCheckout");
          expect(initiate).to.have.length(1);
          expect(initiate[0][2]).to.deep.equal({
            content_ids: ["5634425976"],
            num_items: 2,
            value: 60,
            currency: "USD",
          });
          expect(initiate[0][3]).to.deep.equal({ eventID: tracking.event_id });
        });
    });

    it("without consent: posts only event_id and consent:false and fires nothing", () => {
      checkout({ consent: "declined", qs: { fbclid: "AbC123" } });

      cy.wait("@createSession")
        .its("request.body.tracking")
        .should(tracking => {
          expect(Object.keys(tracking).sort()).to.deep.equal(["consent", "event_id"]);
          expect(tracking.consent).to.eq(false);
        });
      cy.window().then(win => expect(win.localStorage.getItem("kots_click_ids")).to.be.null);
    });
  });

  describe("Purchase on the success page", () => {
    const ORDER = {
      customer: { name: "Jane Fan", email: "jane@example.com" },
      shippingAddress: { line1: "1 Main St", city: "Austin", state: "TX", postal_code: "78701", country: "US" },
      lineItems: [{ name: "Unisex Tee w/ Text - Black / M", quantity: 2, unitPrice: 2500, amount: 5000 }],
      orderSummary: { subtotal: 5000, shipping: 999, tax: 0, total: 5999 },
      currency: "USD",
      amount_total: 5999,
      event_id: "11111111-2222-4333-8444-555555555555",
    };

    it("fires Purchase once per session id with the checkout event id", () => {
      cy.intercept("GET", "**/api/order-details?session_id=cs_test_tracking", { statusCode: 200, body: ORDER }).as(
        "orderDetails"
      );
      const first = [];
      cy.visitWith(STRIPE_URL, { consent: "accepted", onBeforeLoad: recordPixel(first) });
      cy.wait("@orderDetails");
      cy.contains("Order Successful");
      cy.then(() => {
        const purchases = events(first, "Purchase");
        expect(purchases).to.have.length(1);
        expect(purchases[0][2]).to.deep.equal({
          value: 59.99,
          currency: "USD",
          content_ids: ["5634425976"],
          num_items: 2,
        });
        expect(purchases[0][3]).to.deep.equal({ eventID: ORDER.event_id });
      });

      const second = [];
      cy.visitWith(STRIPE_URL, { consent: "accepted", onBeforeLoad: recordPixel(second) });
      cy.wait("@orderDetails");
      cy.contains("Order Successful");
      cy.then(() => expect(events(second, "Purchase")).to.have.length(0));
    });
  });
});
