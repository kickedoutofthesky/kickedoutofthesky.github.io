/* eslint-disable no-undef */

// Cart page (store/cart.html + cart-display.js): items, quantities, subtotal,
// country dropdown, shipping estimate and checkout button state.

const TEE = { productKey: "product_421296994", color: "Black", size: "M" }; // Unisex Tee w/ Text, $25.00, variant 5211354650
const STICKER = { productKey: "product_421115395", color: "Satin", size: "3x3" }; // Die-cut Sticker w/ Text, $5.50, variant 5209549630

const shippingReply = amount => ({
  statusCode: 200,
  body: { shipping_options: [{ shipping_rate_data: { fixed_amount: { amount, currency: "usd" } } }] },
});

describe("Cart page", () => {
  describe("Empty cart", () => {
    it("shows the empty state with a link back to the store and hides the order summary", () => {
      cy.visitWith("/store/cart.html");

      cy.get("[data-testid='empty-cart-message']").should("be.visible").and("contain", "Your cart is empty");
      cy.get("#empty-cart a").should("have.attr", "href", "index.html");
      cy.get("#cart-summary").should("not.be.visible");
      cy.get("[data-testid='cart-item']").should("not.exist");
    });

    it("drops malformed items stored in localStorage", () => {
      cy.visitWith("/store/cart.html", {
        cart: [{ ...TEE, quantity: 0 }, { productKey: TEE.productKey, color: "Black", quantity: 1 }, null],
      });

      cy.get("[data-testid='empty-cart-message']").should("be.visible");
      cy.window().its("localStorage").invoke("getItem", "kots_cart").should("eq", "[]");
    });
  });

  describe("Cart contents", () => {
    beforeEach(() => {
      cy.visitWith("/store/cart.html", {
        cart: [
          { ...TEE, quantity: 2 },
          { ...STICKER, quantity: 1 },
        ],
      });
      cy.get("[data-testid='cart-item']").should("have.length", 2);
    });

    it("renders each item with its variant, unit price and line total, plus the subtotal", () => {
      cy.get("[data-testid='cart-item']")
        .eq(0)
        .within(() => {
          cy.get("[data-testid='item-name']").should("have.text", "Unisex Tee w/ Text");
          cy.contains("Color: Black");
          cy.contains("Size: M");
          cy.get("[data-testid='item-price']").should("have.text", "$25.00 USD");
          cy.get("[data-testid='quantity-input']").should("have.value", "2");
          cy.contains("$50.00 USD");
          cy.get("img").shouldShowImage("Unisex Tee w Text - Front - Black.jpg");
        });

      cy.get("[data-testid='cart-item']")
        .eq(1)
        .within(() => {
          cy.get("[data-testid='item-name']").should("have.text", "Die-cut Sticker w/ Text");
          cy.get("[data-testid='item-price']").should("have.text", "$5.50 USD");
          cy.get("img").shouldShowImage("Die-cut Sticker w Text - Front - Satin.jpg");
        });

      cy.get("[data-testid='cart-subtotal']").should("have.text", "$55.50 USD");
      cy.get("[data-testid='cart-count']").should("have.text", "3");
    });

    it("increases and decreases quantity with the +/- buttons", () => {
      cy.get("[data-testid='cart-item']").eq(0).find(".cart-qty-btn").last().click();

      cy.get("[data-testid='quantity-input']").eq(0).should("have.value", "3");
      cy.get("[data-testid='cart-subtotal']").should("have.text", "$80.50 USD");
      cy.get("[data-testid='cart-count']").should("have.text", "4");
      cy.window()
        .its("localStorage")
        .invoke("getItem", "kots_cart")
        .then(raw => expect(JSON.parse(raw)[0].quantity).to.eq(3));

      cy.get("[data-testid='cart-item']").eq(0).find(".cart-qty-btn").first().click();
      cy.get("[data-testid='quantity-input']").eq(0).should("have.value", "2");
      cy.get("[data-testid='cart-subtotal']").should("have.text", "$55.50 USD");
    });

    it("removes an item when its quantity is decreased below 1", () => {
      cy.get("[data-testid='cart-item']").eq(1).find(".cart-qty-btn").first().click();

      cy.get("[data-testid='cart-item']").should("have.length", 1);
      cy.get("[data-testid='item-name']").should("have.text", "Unisex Tee w/ Text");
      cy.get("[data-testid='cart-subtotal']").should("have.text", "$50.00 USD");
    });

    it("removes items with the trash button and shows the empty state when none are left", () => {
      cy.get("[data-testid='remove-item']").first().click();
      cy.get("[data-testid='cart-item']").should("have.length", 1);
      cy.get("[data-testid='cart-subtotal']").should("have.text", "$5.50 USD");

      cy.get("[data-testid='remove-item']").click();
      cy.get("[data-testid='empty-cart-message']").should("be.visible");
      cy.get("#cart-summary").should("not.be.visible");
      cy.window().its("localStorage").invoke("getItem", "kots_cart").should("eq", "[]");
    });

    it("opens the product page with the item's variant pre-selected when an item is clicked", () => {
      cy.get("[data-testid='item-name']").first().click();

      cy.location("pathname").should("eq", "/store/product.html");
      cy.location("search").should("include", `key=${TEE.productKey}`);
      cy.get("[data-testid='color-select']").should("have.value", "Black");
      cy.get("[data-testid='size-select']").should("have.value", "M");
      cy.get("#quantity").should("have.value", "2");
    });
  });

  describe("Shipping country and estimate", () => {
    beforeEach(() => {
      cy.visitWith("/store/cart.html", { cart: [{ ...TEE, quantity: 2 }] });
      cy.get("[data-testid='cart-item']").should("have.length", 1);
    });

    it("populates the country dropdown locally with priority countries first", () => {
      cy.get("#shipping-country option").should("have.length.greaterThan", 100);
      cy.get("#shipping-country option")
        .then($options => [...$options].slice(0, 6).map(o => o.value))
        .should("deep.equal", ["", "US", "CA", "GB", "AU", "DE"]);
      cy.get("#shipping-country option[value='US']").should("have.text", "United States");
      cy.get("@calculateShipping.all").should("have.length", 0);
      cy.get("[data-testid='shipping-estimate']").should("have.text", "—");
    });

    it("requests a shipping estimate with the cart's variant IDs and shows the result", () => {
      cy.get("#shipping-country").select("US");

      cy.wait("@calculateShipping")
        .its("request.body")
        .should("deep.equal", {
          country: "US",
          items: [{ variant_id: 5211354650, quantity: 2 }],
        });
      cy.get("[data-testid='shipping-estimate']").should("have.text", "$9.99 USD");
      cy.get("#shipping-to-line").should("be.visible").and("contain", "Shipping to United States");
      cy.window().its("localStorage").invoke("getItem", "selectedShippingCountry").should("eq", "US");

      cy.get("#shipping-country").select("GB");
      cy.wait("@calculateShipping").its("request.body.country").should("eq", "GB");
      cy.get("[data-testid='shipping-estimate']").should("have.text", "$12.00 USD");
      cy.get("#shipping-to-line").should("contain", "United Kingdom");
    });

    it("restores the saved country and estimates shipping on load", () => {
      cy.visitWith("/store/cart.html", {
        cart: [{ ...TEE, quantity: 1 }],
        onBeforeLoad: win => win.localStorage.setItem("selectedShippingCountry", "CA"),
      });

      cy.get("#shipping-country").should("have.value", "CA");
      cy.wait("@calculateShipping").its("request.body.country").should("eq", "CA");
      cy.get("[data-testid='shipping-estimate']").should("have.text", "$15.00 USD");
    });

    it("re-estimates once (debounced) with the new quantity after rapid quantity changes", () => {
      cy.selectShippingCountry("US");

      cy.get(".cart-qty-btn").last().click();
      cy.get(".cart-qty-btn").last().click();
      cy.get(".cart-qty-btn").last().click();
      cy.get("[data-testid='quantity-input']").should("have.value", "5");

      cy.wait("@calculateShipping")
        .its("request.body.items")
        .should("deep.equal", [{ variant_id: 5211354650, quantity: 5 }]);
      cy.wait(500);
      cy.get("@calculateShipping.all").should("have.length", 2);
    });

    it("resets the estimate without calling the API when the last item is removed", () => {
      cy.selectShippingCountry("US");
      cy.get("[data-testid='shipping-estimate']").should("have.text", "$9.99 USD");

      cy.get("[data-testid='remove-item']").click();
      cy.get("[data-testid='empty-cart-message']").should("be.visible");
      cy.get("[data-testid='shipping-estimate']").should("have.text", "—");
      cy.wait(500);
      cy.get("@calculateShipping.all").should("have.length", 1);
    });

    ["Shipping to RU is not supported", "Shipping to this country has been disabled"].forEach(error => {
      it(`shows 'We can't ship to this country.' for "${error}"`, () => {
        cy.intercept("POST", "**/api/calculate-shipping", { statusCode: 400, body: { error } }).as("disabledCountry");

        cy.get("#shipping-country").select("RU");
        cy.wait("@disabledCountry");
        cy.get("[data-testid='shipping-estimate']").should("have.text", "We can't ship to this country.");
      });
    });

    it("falls back to 'calculated at checkout' when the estimate cannot be fetched", () => {
      cy.intercept("POST", "**/api/calculate-shipping", {
        statusCode: 500,
        body: { error: "Printful unavailable" },
      }).as("serverError");
      cy.get("#shipping-country").select("US");
      cy.wait("@serverError");
      cy.get("[data-testid='shipping-estimate']").should("have.text", "Shipping will be calculated at checkout.");

      cy.intercept("POST", "**/api/calculate-shipping", { forceNetworkError: true }).as("networkError");
      cy.get("#shipping-country").select("CA");
      cy.wait("@networkError");
      cy.get("[data-testid='shipping-estimate']").should("have.text", "Shipping will be calculated at checkout.");

      cy.intercept("POST", "**/api/calculate-shipping", { statusCode: 200, body: { shipping_options: [] } }).as(
        "noOptions"
      );
      cy.get("#shipping-country").select("GB");
      cy.wait("@noOptions");
      cy.get("[data-testid='shipping-estimate']").should("have.text", "Shipping will be calculated at checkout.");
    });

    it("shows a placeholder instead of an error when the API rejects the cart data", () => {
      cy.intercept("POST", "**/api/calculate-shipping", {
        statusCode: 400,
        body: { error: "Invalid quantity for variant 5211354650" },
      }).as("badCartData");

      cy.get("#shipping-country").select("US");
      cy.wait("@badCartData");
      cy.get("[data-testid='shipping-estimate']").should("have.text", "—");
    });

    it("uses the latest response when the country changes before an estimate returns", () => {
      cy.intercept("POST", "**/api/calculate-shipping", req => {
        const slow = req.body.country === "AU";
        req.reply({ ...shippingReply(slow ? 2500 : 1400), delay: slow ? 1500 : 0 });
      }).as("racingEstimates");

      cy.get("#shipping-country").select("AU");
      cy.get("[data-testid='shipping-estimate']").should("have.text", "Calculating...");
      cy.get("#shipping-country").select("DE");

      cy.wait(["@racingEstimates", "@racingEstimates"]);
      cy.get("[data-testid='shipping-estimate']").should("have.text", "$14.00 USD");
    });
  });

  describe("Checkout button state", () => {
    it("requires both a shipping country and accepted terms", () => {
      cy.visitWith("/store/cart.html", { cart: [{ ...TEE, quantity: 1 }] });
      cy.get("#checkout-btn").should("be.disabled").and("contain", "Proceed to Checkout");

      cy.acceptTerms();
      cy.get("#checkout-btn").should("be.disabled");

      cy.selectShippingCountry("US");
      cy.get("#checkout-btn").should("not.be.disabled");

      cy.get("#terms-checkbox").uncheck();
      cy.get("#checkout-btn").should("be.disabled");
    });

    it("links the terms checkbox to the Terms & Conditions and Privacy Policy", () => {
      cy.visitWith("/store/cart.html", { cart: [{ ...TEE, quantity: 1 }] });
      cy.get("label[for='terms-checkbox'] a[href='../legal/terms-and-conditions.html']").should(
        "have.attr",
        "target",
        "_blank"
      );
      cy.get("label[for='terms-checkbox'] a[href='../legal/privacy-policy.html']").should("exist");
    });
  });

  describe("API base URL (api-config.js)", () => {
    afterEach(() => {
      cy.window().then(win => win.sessionStorage.removeItem("apiTarget"));
    });

    it("picks the API from the frontend port (3002 → staging, otherwise local)", () => {
      const port = new URL(Cypress.config("baseUrl")).port;
      const expectedApi = port === "3002" ? "https://api-staging.kickedoutofthesky.com" : "http://localhost:3001";

      cy.visitWith("/store/cart.html", {
        cart: [{ ...TEE, quantity: 1 }],
        onBeforeLoad: win => win.sessionStorage.removeItem("apiTarget"),
      });
      cy.window().its("__API_URL__").should("eq", expectedApi);

      cy.get("#shipping-country").select("US");
      cy.wait("@calculateShipping").its("request.url").should("eq", `${expectedApi}/api/calculate-shipping`);
    });

    it("honours the ?api= override and remembers it for the session", () => {
      cy.visitWith("/store/cart.html?api=local", { cart: [{ ...TEE, quantity: 1 }] });
      cy.window().its("__API_URL__").should("eq", "http://localhost:3001");
      cy.window().its("sessionStorage").invoke("getItem", "apiTarget").should("eq", "local");

      cy.visitWith("/store/cart.html", { cart: [{ ...TEE, quantity: 1 }] });
      cy.window().its("__API_URL__").should("eq", "http://localhost:3001");

      cy.visitWith("/store/cart.html?api=prod", { cart: [{ ...TEE, quantity: 1 }] });
      cy.window().its("__API_URL__").should("eq", "https://api.kickedoutofthesky.com");
    });
  });
});
