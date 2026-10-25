/* eslint-disable no-undef */

// Order confirmation page (store/success.html): GET /api/order-details?session_id=cs_...

const SESSION_ID = "cs_test_success_123";
const CART = [{ productKey: "product_421296994", color: "Black", size: "S", quantity: 1 }];

const ORDER_DETAILS = {
  orderId: "ord_123456",
  customer: { name: "John Doe", email: "john@example.com", phone: "+1234567890" },
  shippingAddress: {
    name: "John Doe",
    line1: "123 Main St",
    line2: "Apt 4",
    city: "New York",
    state: "NY",
    postal_code: "10001",
    country: "US",
  },
  shippingMethod: "Standard Shipping",
  lineItems: [
    { name: "Unisex Tee w/ Text - Black / S", quantity: 2, unitPrice: 2500, amount: 5000 },
    { name: "Unisex Hoodie w/ Text - Black / M", quantity: 1, unitPrice: 4500, amount: 4500 },
  ],
  orderSummary: { subtotal: 9500, shipping: 999, tax: 480, total: 10979 },
  currency: "USD",
};

function visitSuccess(query = `?session_id=${SESSION_ID}`) {
  cy.visitWith(`/store/success.html${query}`, {
    cart: CART,
    onBeforeLoad: win => win.localStorage.setItem("selectedShippingCountry", "US"),
  });
}

describe("Success page", () => {
  it("uses the same shared navbar as the other store pages", () => {
    const navSummary = () =>
      cy.get("#navbarMain").then($nav => ({
        links: [...$nav.find(".nav-link")].map(a => a.getAttribute("href")),
        homeLabel: $nav.find("a[aria-label]").attr("aria-label"),
        logoHeight: Math.round($nav.find("img.brand")[0].getBoundingClientRect().height),
      }));

    cy.visitWith("/store/cart.html", { cart: CART });
    cy.get("#navbarMain").should("have.length", 1);
    navSummary().then(cartNav => {
      cy.intercept("GET", "/navbar.html").as("sharedNavbar");
      cy.intercept("GET", "**/api/order-details?session_id=*", { statusCode: 200, body: ORDER_DETAILS });
      visitSuccess();
      cy.wait("@sharedNavbar");
      cy.get("#navbarMain").should("have.length", 1);
      navSummary().should("deep.equal", cartNav);
    });
  });

  it("hides the Tax line when no tax was charged", () => {
    cy.intercept("GET", "**/api/order-details?session_id=*", {
      statusCode: 200,
      body: { ...ORDER_DETAILS, orderSummary: { ...ORDER_DETAILS.orderSummary, tax: 0, total: 10499 } },
    }).as("orderDetails");
    visitSuccess();
    cy.wait("@orderDetails");

    cy.get("#summary-total").should("have.text", "$104.99");
    cy.get("#summary-tax-row").should("not.be.visible");
    cy.get("#summary-subtotal").should("be.visible");
    cy.get("#summary-shipping").should("be.visible");
  });

  describe("With order details", () => {
    beforeEach(() => {
      cy.intercept("GET", "**/api/order-details?session_id=*", { statusCode: 200, body: ORDER_DETAILS }).as(
        "orderDetails"
      );
      visitSuccess();
      cy.wait("@orderDetails").its("request.url").should("include", `session_id=${SESSION_ID}`);
    });

    it("shows the confirmation heading and hides the loading indicator", () => {
      cy.contains("h1", "Order Successful").should("be.visible");
      cy.contains("Thank you for your purchase!").should("be.visible");
      cy.get("#loading-indicator").should("not.be.visible");
      cy.get("#order-section").should("be.visible");
    });

    it("lists each item with quantity, unit price, line total and product image", () => {
      cy.get("#order-items > div").should("have.length", 2);
      cy.get("#order-items > div")
        .eq(0)
        .should("contain", "Unisex Tee w/ Text - Black / S")
        .and("contain", "Qty: 2 × $25.00 each")
        .and("contain", "$50.00")
        .find("img")
        .shouldShowImage("Unisex Tee w Text - Front - Black.jpg");
      cy.get("#order-items > div").eq(1).should("contain", "Qty: 1 × $45.00 each").find("img").shouldShowImage();
      // Line totals use the cart's yellow
      cy.get("#order-items > div")
        .eq(0)
        .contains("div", /^\$50\.00$/)
        .should("have.css", "color", "rgb(255, 193, 7)");
    });

    it("shows the order summary totals", () => {
      cy.get("#summary-subtotal").should("have.text", "$95.00");
      cy.get("#summary-shipping").should("have.text", "$9.99");
      cy.get("#summary-tax-row").should("be.visible");
      cy.get("#summary-tax").should("have.text", "$4.80");
      cy.get("#summary-total").should("have.text", "$109.79");
    });

    it("shows the customer, shipping address (with country name) and shipping method", () => {
      cy.get("#customer-section").should("be.visible");
      cy.get("#customer-name").should("have.text", "John Doe");
      cy.get("#customer-email").should("have.text", "john@example.com");
      cy.get("#customer-phone").should("have.text", "+1234567890");

      cy.get("#shipping-section").should("be.visible");
      cy.get("#shipping-address")
        .should("contain", "123 Main St")
        .and("contain", "Apt 4")
        .and("contain", "New York NY 10001")
        .and("contain", "United States");
      cy.get("#shipping-method").should("have.text", "Standard Shipping");
    });

    it("clears the cart and the saved shipping country", () => {
      cy.window().its("localStorage").invoke("getItem", "kots_cart").should("eq", "[]");
      cy.window().its("localStorage").invoke("getItem", "selectedShippingCountry").should("be.null");
      cy.get("[data-testid='cart-count']").should("not.be.visible");
    });
  });

  it("maps Stripe-style fields (description, amount_total, shippingDetails, customerDetails)", () => {
    cy.intercept("GET", "**/api/order-details?session_id=*", {
      statusCode: 200,
      body: {
        customerDetails: { name: "Ana Fan", email: "ana@example.com" },
        shippingDetails: {
          name: "Ana Fan",
          address: { line1: "10 Queen St", city: "Toronto", state: "ON", postal_code: "M5H", country: "CA" },
        },
        lineItems: [{ description: "Die-cut Sticker w/ Text - Satin / 3x3", quantity: 3, amount_total: 1650 }],
        orderSummary: { subtotal: 1650, shipping: 1500, tax: 0, total: 3150 },
      },
    }).as("orderDetails");

    visitSuccess();
    cy.wait("@orderDetails");

    cy.get("#order-items").should("contain", "Die-cut Sticker w/ Text - Satin / 3x3").and("contain", "$16.50");
    cy.get("#customer-name").should("have.text", "Ana Fan");
    cy.get("#shipping-address").should("contain", "10 Queen St").and("contain", "Canada");
    cy.get("#summary-total").should("have.text", "$31.50");
  });

  it("shows the loading indicator while order details are fetched", () => {
    cy.intercept("GET", "**/api/order-details?session_id=*", {
      statusCode: 200,
      body: ORDER_DETAILS,
      delay: 1000,
    }).as("slowOrderDetails");

    visitSuccess();
    cy.get("#loading-indicator").should("be.visible").and("contain", "Loading your order details...");
    cy.wait("@slowOrderDetails");
    cy.get("#loading-indicator").should("not.be.visible");
  });

  it("shows 'Order not found' for an unknown session and keeps the cart", () => {
    cy.intercept("GET", "**/api/order-details?session_id=*", { statusCode: 404, body: { error: "Not found" } }).as(
      "orderDetails"
    );

    visitSuccess("?session_id=cs_test_unknown");
    cy.wait("@orderDetails");

    cy.contains("Order not found or payment incomplete").should("be.visible");
    cy.get("#order-section").should("not.be.visible");
    cy.get("#loading-indicator").should("not.be.visible");
    cy.window()
      .its("localStorage")
      .invoke("getItem", "kots_cart")
      .then(raw => expect(JSON.parse(raw)).to.have.length(1));
  });

  it("reassures the customer when the order-details API fails", () => {
    cy.intercept("GET", "**/api/order-details?session_id=*", { statusCode: 500, body: { error: "Server error" } }).as(
      "serverError"
    );
    visitSuccess();
    cy.wait("@serverError");
    cy.contains("Your order was placed successfully! Check your email").should("be.visible");
    cy.get("#loading-indicator").should("not.be.visible");

    cy.intercept("GET", "**/api/order-details?session_id=*", { forceNetworkError: true }).as("networkError");
    visitSuccess();
    cy.wait("@networkError");
    cy.contains("Your order was placed successfully! Check your email").should("be.visible");
  });

  it("shows a generic thank-you without calling the API when there is no session_id", () => {
    cy.intercept("GET", "**/api/order-details*", { statusCode: 200, body: ORDER_DETAILS }).as("orderDetails");

    visitSuccess("");
    cy.contains("h1", "Order Successful").should("be.visible");
    cy.get("#order-section").should("not.be.visible");
    cy.wait(500);
    cy.get("@orderDetails.all").should("have.length", 0);
  });
});
