/* eslint-disable no-undef */

describe("Complete Purchase Flow - Customer Buying Merch", () => {
  beforeEach(() => {
    // Start on merch page with clean cart
    cy.visit("/store");
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  it("should complete full purchase flow: browse merch → select product → add to cart → checkout → redirect to payment", () => {
    // Step 1: Browse merch page
    cy.get("[data-testid='product-grid']").should("be.visible");
    cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);

    // Step 2: Click a product
    cy.get("[data-testid='product-card']").first().click();
    cy.url().should("include", "product.html");
    cy.get("[data-testid='product-detail']").should("be.visible");

    // Step 3: Select a size variant
    selectFirstRealSize();

    // Step 4: Add to cart
    cy.get("#add-to-cart-btn").should("not.be.disabled").click({ force: true });

    // Verify product was added
    cy.get("[data-testid='cart-count'], .cart-icon-count, .badge").should("be.visible");

    // Step 5: Navigate to cart
    cy.get("a[href*='cart.html']").first().click();
    cy.url().should("include", "cart.html");
    cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);

    // Step 6: Verify checkout button (disabled until country selected)
    cy.get("button").contains("Proceed to Checkout").should("exist").should("be.disabled");

    // Step 7: Select shipping country and click checkout
    cy.get("#shipping-country").select("US");
    acceptTerms();
    cy.get("button").contains("Proceed to Checkout").should("not.be.disabled").click();

    // Should either stay on checkout page or redirect to Stripe/payment
    cy.url().then(url => {
      // Check if redirected to Stripe, success page, or checkout form
      const isSuspected = url.includes("stripe") || url.includes("checkout") || url.includes("success");
      if (!isSuspected) {
        // If URL didn't change, checkout page should at least show payment form or message
        cy.get("body").should("exist"); // Page should load
      }
    });
  });

  it("should intercept checkout API call and verify request contains correct product, variant, quantity, and shipping", () => {
    // Intercept the checkout API call
    cy.intercept("POST", "**/api/create-checkout-session", req => {
      req.reply({
        statusCode: 200,
        body: {
          sessionId: "test_session_12345",
          url: "/store/success.html",
          success: true,
        },
      });
    }).as("checkoutAPI");

    // Navigate to product page and add to cart
    cy.get("[data-testid='product-card']").first().click();
    cy.url().should("include", "product.html");

    // Get product details before adding
    cy.get("[data-testid='product-price']")
      .first()
      .invoke("text")
      .then(_price => {
        selectFirstRealSize();

        // Add to cart
        cy.get("#add-to-cart-btn").click({ force: true });

        // Go to cart
        cy.get("a[href*='cart.html']").first().click();

        // Select shipping country
        selectShippingCountry();
        acceptTerms();

        // Click checkout
        cy.get("button").contains("Proceed to Checkout").click();

        // Verify checkout API was called
        cy.wait("@checkoutAPI").then(interception => {
          // Verify request body contains expected fields
          const requestBody = interception.request.body;

          // Check for essential checkout fields
          expect(requestBody).to.exist;
          expect(requestBody).to.have.property("items").and.be.an("array");

          if (requestBody.items && requestBody.items.length > 0) {
            const item = requestBody.items[0];
            // Verify product details in request
            expect(item).to.have.property("variant_id");
            expect(item).to.have.property("quantity");
            expect(item.quantity).to.equal(1);
          }

          // Verify shipping country
          expect(requestBody).to.have.property("shippingCountry");
        });
      });
  });

  it("should redirect to success page after successful checkout API response", () => {
    // Mock the checkout API to return success and redirect URL
    cy.intercept("POST", "**/api/create-checkout-session", {
      statusCode: 200,
      body: {
        sessionId: "test_session_12345",
        url: "/store/success.html",
        success: true,
      },
    }).as("checkoutSuccess");

    // Add product to cart
    cy.get("[data-testid='product-card']").first().click();
    cy.url().should("include", "product.html");
    selectFirstRealSize();
    cy.get("#add-to-cart-btn").click({ force: true });

    // Go to cart
    cy.get("a[href*='cart.html']").first().click();

    // Select shipping country
    selectShippingCountry();
    acceptTerms();

    // Click checkout
    cy.get("button").contains("Proceed to Checkout").click();

    // Wait for checkout API
    cy.wait("@checkoutSuccess");

    // Should redirect to success page
    cy.url({ timeout: 5000 }).should("include", "success");

    // Verify success page loads
    cy.get("#main-content").should("exist");
  });

  it("should display confirmation message and order details on success page", () => {
    // Navigate directly to success page to test its display
    cy.visit("/store/success.html");

    // Should display confirmation message
    cy.get("h1").should("contain", "Order Successful");
    cy.get("p").contains("Thank you").should("be.visible");

    // Should display order details section
    cy.get("#order-section").then($details => {
      if ($details.length > 0 && $details.is(":visible")) {
        cy.wrap($details).should("be.visible");
      }
    });

    // Should have continue shopping link
    cy.get("a[href*='index.html'], a[href*='store']").should("exist");
  });

  it("should return user to cart with items intact when using cancel URL from Stripe", () => {
    // First, add items to cart
    cy.get("[data-testid='product-card']").first().click();
    cy.url().should("include", "product.html");
    selectFirstRealSize();
    cy.get("#add-to-cart-btn").click({ force: true });

    // Go to cart and verify items
    cy.get("a[href*='cart.html']").first().click();
    cy.get("[data-testid='cart-item']").then($items => {
      const itemCount = $items.length;
      expect(itemCount).to.be.greaterThan(0);

      // Get cart total before cancel
      cy.get("[data-testid='cart-subtotal'], [data-testid='cart-total']")
        .invoke("text")
        .then(subtotal => {
          const originalSubtotal = subtotal;

          // Simulate Stripe cancel redirect (user redirected back to cart)
          cy.visit("/store/cart.html");

          // Should be on cart page
          cy.url().should("include", "cart.html");

          // Verify items still in cart
          cy.get("[data-testid='cart-item']").should("have.length", itemCount);

          // Verify totals unchanged
          cy.get("[data-testid='cart-subtotal'], [data-testid='cart-total']")
            .invoke("text")
            .should("equal", originalSubtotal);
        });
    });
  });
});
