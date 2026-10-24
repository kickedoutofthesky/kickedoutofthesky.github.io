/* eslint-disable no-undef */

// Order status lookup (store/order-status.html + order-status.js):
// GET /api/order-status?email=...&printful_order_id=...

const EMAIL = "fan@example.com";
const ORDER_ID = "PF123456789";

const SHIPPED_ORDER = {
  printful_order_id: ORDER_ID,
  status: "shipped",
  created_at: "1767225600000",
  recipient: {
    name: "Sam Fan",
    email: EMAIL,
    address: {
      line1: "1 Main St",
      city: "Austin",
      state: "TX",
      zip: "78701",
      country: "United States",
      country_code: "US",
    },
  },
  items: [{ variant_id: 5211354650, quantity: 2, price_cents: 2500 }],
  costs: { subtotal_cents: 5000, shipping_cents: 999, tax_cents: 0, total_cents: 5999 },
  shipments: [
    {
      id: "shp-778899",
      carrier: "USPS",
      tracking_number: "9400111899223",
      tracking_url: "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223",
      shipped_date: "1767484800000",
    },
  ],
};

function fillForm(orderId = ORDER_ID, email = EMAIL) {
  if (orderId) cy.get("#printful-order-id").clear().type(orderId);
  if (email) cy.get("#email").clear().type(email);
}

describe("Order status page", () => {
  beforeEach(() => {
    cy.visitWith("/store/order-status.html", { onBeforeLoad: win => win.sessionStorage.clear() });
  });

  describe("Search form", () => {
    it("shows the labelled, required fields with the Track Order button disabled", () => {
      cy.get("[data-testid='order-status-page']").should("be.visible");
      cy.get("label[for='printful-order-id']").should("contain", "Printful Order ID").and("contain", "*");
      cy.get("label[for='email']").should("contain", "Email Address").and("contain", "*");
      cy.get("#printful-order-id").should("have.attr", "placeholder", "e.g., PF123456789");
      cy.get("#email").should("have.attr", "placeholder", "your@example.com");
      cy.get("#search-btn").should("be.disabled").and("contain", "Track Order").and("not.have.class", "active");
    });

    it("enables the button only when both a valid order ID and a valid email are entered", () => {
      fillForm(ORDER_ID, null);
      cy.get("#search-btn").should("be.disabled");

      cy.get("#email").type("not-an-email");
      cy.get("#search-btn").should("be.disabled");

      cy.get("#email").clear().type(EMAIL);
      cy.get("#search-btn").should("not.be.disabled").and("have.class", "active");

      ["first+last@example.org", "user.name@domain.co.uk"].forEach(email => {
        cy.get("#email").clear().type(email);
        cy.get("#search-btn").should("not.be.disabled");
      });

      cy.get("#printful-order-id").clear().type("PF12");
      cy.get("#search-btn").should("be.disabled");

      cy.get("#printful-order-id").clear();
      cy.get("#search-btn").should("be.disabled").and("not.have.class", "active");
    });
  });

  describe("Search results", () => {
    it("looks up the order and shows items, costs, address and tracking", () => {
      cy.intercept("GET", "**/api/order-status*", { statusCode: 200, body: SHIPPED_ORDER }).as("orderStatus");

      fillForm();
      cy.get("#search-btn").click();

      cy.wait("@orderStatus").then(({ request }) => {
        const url = new URL(request.url);
        expect(url.pathname).to.eq("/api/order-status");
        expect(url.searchParams.get("email")).to.eq(EMAIL);
        expect(url.searchParams.get("printful_order_id")).to.eq(ORDER_ID);
      });

      cy.get("#search-form").should("not.be.visible");
      cy.get("#order-display").should("be.visible");
      cy.get("#processing-section").within(() => {
        cy.contains("h3", `Order #${ORDER_ID}`);
        cy.get(".status-badge").should("have.text", "Shipped");
        cy.contains("Unisex Tee w/ Text - Black - M");
        cy.contains("Qty: 2 × $25.00 each");
        cy.get("img[alt='Unisex Tee w/ Text']").should("exist");
        cy.contains("Subtotal:").next().should("have.text", "$50.00");
        cy.contains("Shipping:").next().should("have.text", "$9.99");
        cy.contains("Total:").next().should("have.text", "$59.99");
        cy.contains("Sam Fan");
        cy.contains("1 Main St");
        cy.contains("Austin, TX 78701");
        cy.contains("USPS");
        cy.contains("9400111899223");
        cy.contains("Shipment ID:").next().should("contain", "#778899");
        cy.contains("a", "Track This Shipment")
          .should("have.attr", "href", SHIPPED_ORDER.shipments[0].tracking_url)
          .and("have.attr", "target", "_blank");
      });
    });

    it("searches when Enter is pressed in a field", () => {
      cy.intercept("GET", "**/api/order-status*", { statusCode: 200, body: SHIPPED_ORDER }).as("orderStatus");
      fillForm();
      cy.get("#email").type("{enter}");
      cy.wait("@orderStatus");
      cy.get("#order-display").should("be.visible");
    });

    it("shows the pending message for orders not yet in production", () => {
      cy.intercept("GET", "**/api/order-status*", {
        statusCode: 200,
        body: { status: "pending", message: "Your order is being prepared. We will ship it soon." },
      }).as("orderStatus");

      fillForm();
      cy.get("#search-btn").click();
      cy.wait("@orderStatus");

      cy.get("#pending-section").should("be.visible");
      cy.get("#pending-message").should("have.text", "Your order is being prepared. We will ship it soon.");
      cy.get("#processing-section").should("not.be.visible");
    });

    it("restores the last order after a reload and resets with 'Search Another Order'", () => {
      cy.intercept("GET", "**/api/order-status*", { statusCode: 200, body: SHIPPED_ORDER }).as("orderStatus");
      fillForm();
      cy.get("#search-btn").click();
      cy.wait("@orderStatus");

      cy.reload();
      cy.get("#processing-section").should("be.visible").and("contain", `Order #${ORDER_ID}`);

      cy.get("#search-another-btn").click();
      cy.get("#search-form").should("be.visible");
      cy.get("#order-display").should("not.be.visible");
      cy.get("#printful-order-id").should("have.value", "");
      cy.get("#email").should("have.value", "");
      cy.window().its("sessionStorage").invoke("getItem", "kots_order_data").should("be.null");
    });
  });

  describe("Errors", () => {
    const cases = [
      {
        statusCode: 404,
        body: { error: "Not found" },
        message: "Order not found. Please check your Order ID and email address.",
      },
      {
        statusCode: 403,
        body: { error: "Forbidden" },
        message: "The email address does not match this order. Please verify and try again.",
      },
      { statusCode: 500, body: { error: "Printful is unavailable" }, message: "Printful is unavailable" },
    ];

    cases.forEach(({ statusCode, body, message }) => {
      it(`shows a helpful message for a ${statusCode} response`, () => {
        cy.intercept("GET", "**/api/order-status*", { statusCode, body }).as("orderStatus");
        fillForm();
        cy.get("#search-btn").click();
        cy.wait("@orderStatus");

        cy.get("#error-container").should("be.visible");
        cy.get("#error-message").should("have.text", message);
        cy.get("#search-form").should("be.visible");
        cy.get("#search-btn").should("not.be.disabled");
      });
    });

    it("shows a connection error when the API is unreachable and resets with 'Search Again'", () => {
      cy.intercept("GET", "**/api/order-status*", { forceNetworkError: true }).as("orderStatus");
      fillForm();
      cy.get("#search-btn").click();
      cy.wait("@orderStatus");

      cy.get("#error-message").should("have.text", "Unable to connect to the server. Please try again later.");
      cy.contains("button", "Search Again").click();
      cy.get("#error-container").should("not.be.visible");
      cy.get("#printful-order-id").should("have.value", "").and("have.focus");
    });
  });

  describe("URL parameters", () => {
    it("auto-searches when both printful_order_id and email are in the URL", () => {
      cy.intercept("GET", "**/api/order-status*", { statusCode: 200, body: SHIPPED_ORDER }).as("orderStatus");
      cy.visitWith(`/store/order-status.html?printful_order_id=${ORDER_ID}&email=${EMAIL}`, {
        onBeforeLoad: win => win.sessionStorage.clear(),
      });

      cy.wait("@orderStatus").its("request.url").should("include", `printful_order_id=${ORDER_ID}`);
      cy.get("#printful-order-id").should("have.value", ORDER_ID);
      cy.get("#email").should("have.value", EMAIL);
      cy.get("#processing-section").should("be.visible");
    });

    it("only pre-fills the field when one parameter is given", () => {
      cy.intercept("GET", "**/api/order-status*", { statusCode: 200, body: SHIPPED_ORDER }).as("orderStatus");

      cy.visitWith(`/store/order-status.html?email=${EMAIL}`, { onBeforeLoad: win => win.sessionStorage.clear() });
      cy.get("#email").should("have.value", EMAIL);
      cy.get("#printful-order-id").should("have.value", "");
      cy.get("#search-btn").should("be.disabled");

      cy.visitWith(`/store/order-status.html?printful_order_id=${ORDER_ID}`, {
        onBeforeLoad: win => win.sessionStorage.clear(),
      });
      cy.get("#printful-order-id").should("have.value", ORDER_ID);
      cy.get("#search-btn").should("be.disabled");

      cy.wait(300);
      cy.get("@orderStatus.all").should("have.length", 0);
    });
  });
});
