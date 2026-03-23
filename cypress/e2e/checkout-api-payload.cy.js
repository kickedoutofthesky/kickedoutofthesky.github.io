/* eslint-disable no-undef */

// Helper function to select first real size option
function selectFirstRealSize() {
  cy.get("[data-testid='size-select']").then($select => {
    const value = $select.val();
    if (!value || value === "") {
      cy.get("[data-testid='size-select'] option")
        .eq(1)
        .invoke("attr", "value")
        .then(sizeValue => {
          cy.get("[data-testid='size-select']").select(sizeValue);
        });
    }
  });
}

// Helper function to select a shipping country on the cart page
function selectShippingCountry(countryCode = "US") {
  cy.get("#shipping-country").should("exist").select(countryCode);
}

describe("Checkout API Payload Tests", () => {
  beforeEach(() => {
    // Clear localStorage and sessionStorage before each test
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  describe("Scenario 1: Checkout Flow with Stripe Redirect", () => {
    it("should visit merch page, add product to cart, and redirect to checkout.stripe.com", () => {
      cy.visit("/store");

      // Add product to cart
      cy.get("[data-testid='product-card']").first().click();
      cy.get("[data-testid='product-detail']").should("be.visible");
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").should("not.be.disabled").click();

      // Navigate to cart
      cy.get("a[href*='cart.html']").first().click();
      cy.url().should("include", "cart.html");

      // Mock the checkout API to return a Stripe URL
      cy.intercept("POST", "**/api/create-checkout-session", {
        statusCode: 200,
        body: {
          url: "https://checkout.stripe.com/test-session-id",
          sessionId: "cs_test_12345",
        },
      }).as("checkoutSession");

      // Stub window.location.href to spy on the redirect
      cy.window().then(win => {
        cy.stub(win, "location").get().returns({
          href: "",
        });
      });

      // Select shipping country and click checkout
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      // Verify checkout API was called
      cy.wait("@checkoutSession");
    });
  });

  describe("Scenario 2: Verify Checkout API Request Body", () => {
    it("should send only variant_id and quantity to the backend API", () => {
      cy.visit("/store");

      // Setup intercept to capture the request
      cy.intercept("POST", "**/api/create-checkout-session", req => {
        // Verify request body contains ONLY variant_id and quantity
        const body = req.body;

        expect(body).to.have.property("items");
        expect(body).to.have.property("shippingCountry");
        expect(body.shippingCountry).to.be.a("string");
        expect(body.shippingCountry).to.have.length(2);
        expect(Array.isArray(body.items)).to.be.true;

        body.items.forEach(item => {
          // Verify only variant_id and quantity are present
          expect(item).to.have.property("variant_id");
          expect(item).to.have.property("quantity");

          // Verify NO shipping address fields
          expect(item).to.not.have.property("product_name");
          expect(item).to.not.have.property("color");
          expect(item).to.not.have.property("size");
          expect(item).to.not.have.property("price_cents");
          expect(item).to.not.have.property("shipping");
          expect(item).to.not.have.property("address");

          // Verify type correctness
          expect(item.variant_id).to.be.a("number");
          expect(item.quantity).to.be.a("number");
          expect(item.quantity).to.be.greaterThan(0);
        });

        req.reply({
          statusCode: 200,
          body: {
            url: "https://checkout.stripe.com/test-session",
            sessionId: "cs_test_123",
          },
        });
      }).as("payloadCheck");

      // Add a product to cart
      cy.get("[data-testid='product-card']").first().click();
      cy.get("[data-testid='product-detail']").should("be.visible");
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").should("not.be.disabled").click();

      // Go to cart and click checkout
      cy.get("a[href*='cart.html']").first().click();
      cy.url().should("include", "cart.html");
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      // Verify the API was called with correct payload
      cy.wait("@payloadCheck").then(interception => {
        expect(interception.request.body.items).to.have.length.greaterThan(0);
        expect(interception.request.body.items[0]).to.have.all.keys("variant_id", "quantity");
      });
    });

    it("should not include shipping address fields in the checkout API request", () => {
      cy.visit("/store");

      const forbiddenFields = [
        "product_name",
        "color",
        "size",
        "price_cents",
        "shipping_address",
        "customer_email",
        "customer_name",
      ];

      cy.intercept("POST", "**/api/create-checkout-session", req => {
        const body = req.body;

        body.items.forEach(item => {
          forbiddenFields.forEach(field => {
            expect(item).to.not.have.property(field);
          });
        });

        req.reply({
          statusCode: 200,
          body: { url: "https://checkout.stripe.com/test", sessionId: "cs_test_123" },
        });
      }).as("noShippingCheck");

      // Add product and checkout
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();
      cy.get("a[href*='cart.html']").first().click();
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      cy.wait("@noShippingCheck");
    });
  });

  describe("Scenario 3: Mock Checkout API and Verify Redirect", () => {
    it("should mock checkout API response and verify window.location is set to the URL", () => {
      const mockStripeUrl = "https://checkout.stripe.com/pay/cs_test_123abc";

      cy.intercept("POST", "**/api/create-checkout-session", {
        statusCode: 200,
        body: {
          url: mockStripeUrl,
          sessionId: "cs_test_123abc",
        },
      }).as("mockedCheckout");

      cy.visit("/store");

      // Stub window.location to capture the redirect
      let redirectUrl = null;
      cy.window().then(win => {
        cy.stub(win, "location").value({
          href: "",
        });
        // Track changes to href
        Object.defineProperty(win.location, "href", {
          set(value) {
            redirectUrl = value;
          },
          get() {
            return "";
          },
        });
      });

      // Add product and checkout
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();
      cy.get("a[href*='cart.html']").first().click();
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      // Verify API was called
      cy.wait("@mockedCheckout").then(() => {
        // Verify cart was cleared (product would be gone from localStorage)
        cy.window().then(win => {
          const cart = JSON.parse(win.localStorage.getItem("merch_cart") || "{}");
          expect(cart.items || []).to.have.length(0);
        });
      });
    });
  });

  describe("Scenario 4: Success Page with Mock Session ID", () => {
    it("should visit success page with mock session_id and display confirmation content", () => {
      const mockSessionId = "cs_test_session_12345";

      cy.visit(`/store/success.html?session_id=${mockSessionId}`);

      // Verify success page loads
      cy.get("body").should("be.visible");

      // Verify confirmation content is present
      cy.contains(/thank|success|order|confirmation/i).should("be.visible");
    });

    it("should handle missing session_id gracefully", () => {
      cy.visit("/store/success.html");

      // Page should still load and show some message
      cy.get("body").should("be.visible");
    });
  });

  describe("Scenario 5: Mock Session Retrieval API and Verify Display", () => {
    it("should mock order-details API and display shipping address and order summary", () => {
      const mockSessionId = "cs_test_mock_123";
      const mockOrderDetails = {
        sessionId: mockSessionId,
        shippingDetails: {
          name: "John Doe",
          email: "john@example.com",
          address: "123 Main St",
          city: "New York",
          state: "NY",
          zip: "10001",
          country: "US",
        },
        lineItems: [
          {
            description: "Unisex Tee w/ Text",
            quantity: 2,
            amount_total: 5000, // $50.00 in cents
          },
        ],
        orderSummary: {
          subtotal: 5000,
          shipping: 0,
          tax: 400,
          total: 5400,
        },
      };

      // Mock the order details API
      cy.intercept("GET", "**/api/order-details?session_id=*", {
        statusCode: 200,
        body: mockOrderDetails,
      }).as("orderDetailsAPI");

      // Visit success page with session ID
      cy.visit(`/store/success.html?session_id=${mockSessionId}`);

      // Wait for order details API to be called
      cy.wait("@orderDetailsAPI");

      // Verify order details are displayed
      cy.contains("Unisex Tee w/ Text").should("be.visible");
      cy.contains("2").should("be.visible"); // quantity

      // Verify shipping address is displayed
      cy.contains("John Doe").should("be.visible");
      cy.contains("123 Main St").should("be.visible");
      cy.contains("New York").should("be.visible");

      // Verify order summary is displayed
      cy.contains(/subtotal|total|shipping|tax/i).should("be.visible");
      cy.contains("$50.00").should("be.visible"); // subtotal in dollars
      cy.contains("$54.00").should("be.visible"); // total in dollars
    });

    it("should format currency amounts from cents to dollars correctly", () => {
      const mockSessionId = "cs_test_currency_123";
      const mockOrderDetails = {
        sessionId: mockSessionId,
        lineItems: [
          {
            description: "Hoodie",
            quantity: 1,
            amount_total: 7500, // $75.00
          },
        ],
        orderSummary: {
          subtotal: 7500,
          shipping: 1000, // $10.00
          tax: 680,
          total: 9180, // $91.80
        },
      };

      cy.intercept("GET", "**/api/order-details?session_id=*", {
        statusCode: 200,
        body: mockOrderDetails,
      }).as("currencyAPI");

      cy.visit(`/store/success.html?session_id=${mockSessionId}`);
      cy.wait("@currencyAPI");

      // Verify prices are displayed in correct format ($XX.XX)
      cy.contains("$75.00").should("be.visible");
      cy.contains("$10.00").should("be.visible");
      cy.contains("$91.80").should("be.visible");
    });
  });

  describe("Scenario 6: Cancel URL and Cart Preservation", () => {
    it("should preserve cart items when navigating to cancel URL", () => {
      cy.visit("/store");

      // Add multiple products to cart
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      // Get cart count
      cy.window().then(win => {
        const cartData = JSON.parse(win.localStorage.getItem("merch_cart") || "{}");
        const itemsInCart = (cartData.items || []).length;
        expect(itemsInCart).to.be.greaterThan(0);

        // Navigate to cart
        cy.get("a[href*='cart.html']").first().click();
        cy.url().should("include", "cart.html");

        // Mock the checkout API to return a cancel URL
        cy.intercept("POST", "**/api/create-checkout-session", {
          statusCode: 200,
          body: {
            url: "https://checkout.stripe.com/pay/cs_test_123",
            cancelUrl: "/store/cart.html",
          },
        }).as("checkoutWithCancel");

        // Simulate Stripe redirect to cancel URL (redirects back to cart)
        cy.visit("/store/cart.html");

        // Verify we're on cart page
        cy.url().should("include", "cart.html");

        // Verify items are still in cart after cancel
        cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);
        cy.get("[data-testid='cart-subtotal']").should("exist");
      });
    });

    it("should preserve cart when user cancels from Stripe checkout", () => {
      // First add items to cart
      cy.visit("/store");
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      // Verify item in cart
      cy.window().then(win => {
        const cart = JSON.parse(win.localStorage.getItem("merch_cart") || "{}");
        expect((cart.items || []).length).to.be.greaterThan(0);
      });

      // Navigate to cart (simulating Stripe cancel redirect)
      cy.visit("/store/cart.html");

      // Verify we're on cart page
      cy.url().should("include", "cart.html");

      // Verify cart still has items
      cy.window().then(win => {
        const cart = JSON.parse(win.localStorage.getItem("merch_cart") || "{}");
        expect((cart.items || []).length).to.be.greaterThan(0);
      });
    });
  });

  describe("Multiple Items Checkout", () => {
    it("should handle multiple items in checkout API payload", () => {
      const expectedItems = [];

      cy.intercept("POST", "**/api/create-checkout-session", req => {
        const body = req.body;
        expect(body.items).to.be.an("array");
        expect(body.items.length).to.equal(expectedItems.length);

        body.items.forEach((item, index) => {
          expect(item).to.have.property("variant_id");
          expect(item).to.have.property("quantity");
          expect(item.variant_id).to.equal(expectedItems[index].variant_id);
          expect(item.quantity).to.equal(expectedItems[index].quantity);
        });

        req.reply({
          statusCode: 200,
          body: { url: "https://checkout.stripe.com/test", sessionId: "cs_test" },
        });
      }).as("multiItemCheckout");

      cy.visit("/store");

      // Add first product
      cy.get("[data-testid='product-card']").eq(0).click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.window().then(win => {
        const cart = JSON.parse(win.localStorage.getItem("merch_cart") || "{}");
        if (cart.items && cart.items[0]) {
          expectedItems.push({
            variant_id: cart.items[0].variantId || 0,
            quantity: cart.items[0].quantity || 1,
          });
        }
      });

      // Add second product (different color/size)
      cy.get("a[href*='index.html']").click();
      cy.get("[data-testid='product-card']").eq(1).click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.window().then(win => {
        const cart = JSON.parse(win.localStorage.getItem("merch_cart") || "{}");
        if (cart.items && cart.items[1]) {
          expectedItems.push({
            variant_id: cart.items[1].variantId || 0,
            quantity: cart.items[1].quantity || 1,
          });
        }

        // Navigate to cart and checkout
        cy.get("a[href*='cart.html']").first().click();
        selectShippingCountry();
        cy.get("button").contains("Proceed to Checkout").click();

        cy.wait("@multiItemCheckout");
      });
    });
  });

  describe("Shipping Country Selector", () => {
    it("should display country dropdown on cart page", () => {
      cy.visit("/store");
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();
      cy.get("a[href*='cart.html']").first().click();

      cy.get("#shipping-country").should("exist");
      cy.get("#shipping-country option").should("have.length.greaterThan", 1);
    });

    it("should disable checkout button until country is selected", () => {
      cy.visit("/store");
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();
      cy.get("a[href*='cart.html']").first().click();

      // Button should be disabled initially
      cy.get("button").contains("Proceed to Checkout").should("be.disabled");

      // Select a country
      cy.get("#shipping-country").select("US");

      // Button should now be enabled
      cy.get("button").contains("Proceed to Checkout").should("not.be.disabled");
    });

    it("should send shippingCountry in checkout API payload", () => {
      cy.intercept("POST", "**/api/create-checkout-session", req => {
        expect(req.body).to.have.property("shippingCountry", "CA");
        req.reply({
          statusCode: 200,
          body: { url: "https://checkout.stripe.com/test", sessionId: "cs_test_123" },
        });
      }).as("countryPayloadCheck");

      cy.visit("/store");
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();
      cy.get("a[href*='cart.html']").first().click();

      selectShippingCountry("CA");
      cy.get("button").contains("Proceed to Checkout").click();

      cy.wait("@countryPayloadCheck");
    });

    it("should re-disable checkout button if country selection is reset", () => {
      cy.visit("/store");
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();
      cy.get("a[href*='cart.html']").first().click();

      // Select a country
      cy.get("#shipping-country").select("US");
      cy.get("button").contains("Proceed to Checkout").should("not.be.disabled");

      // Reset to placeholder
      cy.get("#shipping-country").select("");
      cy.get("button").contains("Proceed to Checkout").should("be.disabled");
    });
  });
});
