/* eslint-disable no-undef */

// Checkout from the cart page: POST /api/create-checkout-session, redirect to the
// returned Stripe URL, and the error/double-submit handling around it.

const TEE = { productKey: "product_421296994", color: "Black", size: "M" }; // variant 5211354650
const STICKER = { productKey: "product_421115395", color: "Satin", size: "3x3" }; // variant 5209549630

// Same-origin stand-in for the Stripe Checkout URL so the redirect can be observed
const STRIPE_URL = "/store/success.html?session_id=cs_test_checkout";

const ORDER_DETAILS = {
  customer: { name: "Jane Fan", email: "jane@example.com" },
  shippingAddress: { line1: "1 Main St", city: "Austin", state: "TX", postal_code: "78701", country: "US" },
  lineItems: [{ name: "Unisex Tee w/ Text - Black / M", quantity: 1, unitPrice: 2500, amount: 2500 }],
  orderSummary: { subtotal: 2500, shipping: 999, tax: 0, total: 3499 },
  currency: "USD",
};

function readyCartForCheckout(cart, country = "US") {
  cy.visitWith("/store/cart.html", { cart });
  cy.get("[data-testid='cart-item']").should("have.length", cart.length);
  cy.selectShippingCountry(country);
  cy.acceptTerms();
  cy.get("#checkout-btn").should("not.be.disabled");
}

describe("Checkout", () => {
  it("completes the purchase flow from the store to the Stripe redirect", () => {
    cy.intercept("POST", "**/api/create-checkout-session", { statusCode: 200, body: { url: STRIPE_URL } }).as(
      "createSession"
    );
    cy.intercept("GET", "**/api/order-details?session_id=cs_test_checkout", {
      statusCode: 200,
      body: ORDER_DETAILS,
    }).as("orderDetails");

    cy.visitWith("/store/");
    cy.get(`a[href='product.html?key=${TEE.productKey}']`).click();
    cy.get("[data-testid='product-title']").should("have.text", "Unisex Tee w/ Text");
    cy.chooseVariant({ color: TEE.color, size: TEE.size });
    cy.get("#add-to-cart-btn").click();

    cy.location("pathname").should("eq", "/store/cart.html");
    cy.get("[data-testid='cart-count']").should("have.text", "1");
    cy.get("[data-testid='cart-item']").should("have.length", 1);

    cy.selectShippingCountry("US");
    cy.acceptTerms();
    cy.get("#checkout-btn").click();

    cy.wait("@createSession")
      .its("request.body")
      .should("deep.equal", { items: [{ variantId: "5211354650", quantity: 1 }], country: "US", termsAccepted: true });

    cy.location("pathname").should("eq", "/store/success.html");
    cy.wait("@orderDetails");
    cy.contains("Order Successful");
    cy.window().its("localStorage").invoke("getItem", "kots_cart").should("eq", "[]");
  });

  it("sends every cart line with its variant ID and the selected country", () => {
    cy.intercept("POST", "**/api/create-checkout-session", { statusCode: 200, body: { url: STRIPE_URL } }).as(
      "createSession"
    );
    cy.intercept("GET", "**/api/order-details*", { statusCode: 200, body: ORDER_DETAILS });

    readyCartForCheckout(
      [
        { ...TEE, quantity: 2 },
        { ...STICKER, quantity: 1 },
      ],
      "CA"
    );
    cy.get("#checkout-btn").click();

    cy.wait("@createSession")
      .its("request.body")
      .should("deep.equal", {
        items: [
          { variantId: "5211354650", quantity: 2 },
          { variantId: "5209549630", quantity: 1 },
        ],
        country: "CA",
        termsAccepted: true,
      });
    cy.location("pathname").should("eq", "/store/success.html");
  });

  it("shows a processing state, locks the form and ignores repeat clicks while the session is created", () => {
    cy.intercept("POST", "**/api/create-checkout-session", {
      statusCode: 200,
      body: { url: STRIPE_URL },
      delay: 1500,
    }).as("createSession");
    cy.intercept("GET", "**/api/order-details*", { statusCode: 200, body: ORDER_DETAILS });

    readyCartForCheckout([{ ...TEE, quantity: 1 }]);
    cy.get("#checkout-btn").click();

    cy.get("#checkout-btn").should("be.disabled").and("have.text", "Processing...");
    cy.get("#shipping-country").should("be.disabled");
    cy.get("#checkout-btn").click({ force: true });

    cy.wait("@createSession");
    cy.location("pathname").should("eq", "/store/success.html");
    cy.get("@createSession.all").should("have.length", 1);
  });

  it("shows the API error, restores the form, and allows a retry", () => {
    let attempts = 0;
    cy.intercept("POST", "**/api/create-checkout-session", req => {
      attempts += 1;
      if (attempts === 1) {
        req.reply({ statusCode: 500, body: { error: "Payment provider unavailable" } });
      } else {
        req.reply({ statusCode: 200, body: { url: STRIPE_URL } });
      }
    }).as("createSession");
    cy.intercept("GET", "**/api/order-details*", { statusCode: 200, body: ORDER_DETAILS });

    readyCartForCheckout([{ ...TEE, quantity: 1 }]);
    cy.get("#checkout-btn").click();
    cy.wait("@createSession");

    cy.get("#checkout-error").should("be.visible");
    cy.get("#checkout-error-text").should("have.text", "Payment provider unavailable");
    cy.location("pathname").should("eq", "/store/cart.html");
    cy.get("#checkout-btn").should("not.be.disabled").and("contain", "Proceed to Checkout");
    cy.get("#shipping-country").should("not.be.disabled");

    cy.get("#checkout-btn").click();
    cy.wait("@createSession");
    cy.location("pathname").should("eq", "/store/success.html");
  });

  it("explains when the destination is not supported (422 unsupported_destination)", () => {
    cy.intercept("POST", "**/api/create-checkout-session", {
      statusCode: 422,
      body: { code: "unsupported_destination", error: "Unsupported destination" },
    }).as("createSession");

    readyCartForCheckout([{ ...TEE, quantity: 1 }], "CA");
    cy.get("#checkout-btn").click();
    cy.wait("@createSession");

    cy.get("#checkout-error-text").should(
      "have.text",
      "We're not able to ship to Canada right now. Try another destination, or email us and we'll see what we can do."
    );
  });

  it("falls back to a generic message when the error response has no message", () => {
    cy.intercept("POST", "**/api/create-checkout-session", { statusCode: 400, body: {} }).as("createSession");

    readyCartForCheckout([{ ...TEE, quantity: 1 }]);
    cy.get("#checkout-btn").click();
    cy.wait("@createSession");

    cy.get("#checkout-error-text").should("have.text", "Checkout failed. Please try again.");
  });

  it("shows an error and stays on the cart when the request fails or returns no URL", () => {
    cy.intercept("POST", "**/api/create-checkout-session", { forceNetworkError: true }).as("networkError");

    readyCartForCheckout([{ ...TEE, quantity: 1 }]);
    cy.get("#checkout-btn").click();
    cy.wait("@networkError");
    cy.get("#checkout-error").should("be.visible");
    cy.get("#checkout-error-text").should("not.be.empty");
    cy.get("#checkout-btn").should("not.be.disabled").and("have.text", "Proceed to Checkout");

    cy.intercept("POST", "**/api/create-checkout-session", { statusCode: 200, body: {} }).as("noUrl");
    cy.get("#checkout-btn").click();
    cy.wait("@noUrl");
    cy.get("#checkout-error-text").should("have.text", "No redirect_url provided by server");
    cy.location("pathname").should("eq", "/store/cart.html");
  });

  it("blocks checkout without calling the API when a cart item no longer exists", () => {
    cy.intercept("POST", "**/api/create-checkout-session", { statusCode: 200, body: { url: STRIPE_URL } }).as(
      "createSession"
    );

    // Oxblood Black of the vintage tee is not offered in XS
    readyCartForCheckout([
      { ...TEE, quantity: 1 },
      { productKey: "product_424725213", color: "Oxblood Black", size: "XS", quantity: 1 },
    ]);
    cy.get("#checkout-btn").click();

    cy.get("#checkout-error-text")
      .should("contain", "Cannot proceed to checkout")
      .and("contain", 'Size "XS" not available');
    cy.wait(300);
    cy.get("@createSession.all").should("have.length", 0);
  });
});
