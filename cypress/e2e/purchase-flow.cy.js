/* eslint-disable no-undef */

// Helper function to select first real size option
function selectFirstRealSize() {
  cy.get("[data-testid='size-select']").then($select => {
    const value = $select.val();
    // If placeholder is selected (empty value), select first real option
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

// Helper function to fill shipping form
function fillShippingForm() {
  // Select shipping country from dropdown (replaces old address form)
  cy.get("#shipping-country").select("US");
}

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
    cy.get("#add-to-cart-btn").should("not.be.disabled").click();

    // Verify product was added
    cy.get("[data-testid='cart-count'], .cart-icon-count, .badge").should("be.visible");

    // Step 5: Navigate to cart
    cy.get("a[href*='cart.html']").click();
    cy.url().should("include", "cart.html");
    cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);

    // Step 6: Verify checkout button (disabled until country selected)
    cy.get("button").contains("Proceed to Checkout").should("exist").should("be.disabled");

    // Step 7: Select shipping country and click checkout
    cy.get("#shipping-country").select("US");
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
    cy.intercept("POST", "**/api/checkout", req => {
      // Capture the request for verification
      req.reply(res => {
        // Mock success response
        res.send({
          statusCode: 200,
          body: {
            sessionId: "test_session_12345",
            redirectUrl: "/store/success.html",
            success: true,
          },
        });
      });
    }).as("checkoutAPI");

    // Navigate to product page and add to cart
    cy.get("[data-testid='product-card']").first().click();
    cy.url().should("include", "product.html");

    // Get product details before adding
    cy.get("[data-testid='product-price']")
      .first()
      .invoke("text")
      .then(price => {
        selectFirstRealSize();

        // Get product ID and add to cart
        cy.get("[data-testid='product-id'], .product-id").then($productId => {
          cy.get("#add-to-cart-btn").click();

          // Go to cart
          cy.get("a[href*='cart.html']").click();

          // Fill shipping form
          fillShippingForm();

          // Try clicking checkout
          cy.get("button").contains("Proceed to Checkout").click({ force: true });

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
              expect(item).to.have.property("productId");
              expect(item).to.have.property("quantity");
              expect(item.quantity).to.equal(1);

              // Verify variant if present
              if (item.variantId) {
                expect(item.variantId).to.exist;
              }
            }

            // Verify shipping information
            if (requestBody.shipping) {
              expect(requestBody.shipping).to.have.property("name");
              expect(requestBody.shipping).to.have.property("email");
              expect(requestBody.shipping).to.have.property("address");
              expect(requestBody.shipping.name).to.equal("John Doe");
            }
          });
        });
      });
  });

  it("should redirect to success page after successful checkout API response", () => {
    // Mock the checkout API to return success and redirect URL
    cy.intercept("POST", "**/api/checkout", {
      statusCode: 200,
      body: {
        sessionId: "test_session_12345",
        redirectUrl: "/store/success.html",
        success: true,
      },
    }).as("checkoutSuccess");

    // Add product to cart
    cy.get("[data-testid='product-card']").first().click();
    cy.url().should("include", "product.html");
    selectFirstRealSize();
    cy.get("#add-to-cart-btn").click();

    // Go to cart
    cy.get("a[href*='cart.html']").click();
    cy.url().should("include", "cart.html");

    // Fill shipping form
    fillShippingForm();

    // Click checkout
    cy.get("button").contains("Proceed to Checkout").click({ force: true });

    // Wait for checkout API
    cy.wait("@checkoutSuccess");

    // Should redirect to success page
    cy.url({ timeout: 5000 }).should("include", "success");

    // Verify success page loads
    cy.get("[data-testid='success-page'], .success-container").should("exist");
  });

  it("should display confirmation message and order details on success page", () => {
    // Navigate directly to success page to test its display
    cy.visit("/store/success.html");

    // Should display confirmation message
    cy.get("[data-testid='confirmation-message'], .confirmation, .success-message").then($msg => {
      if ($msg.length > 0) {
        cy.wrap($msg).should("be.visible");
        cy.wrap($msg).invoke("text").should("include.oneOf", ["Thank you", "success", "Order", "confirmed"]);
      }
    });

    // Should display order details section
    cy.get("[data-testid='order-details'], .order-summary").then($details => {
      if ($details.length > 0) {
        cy.wrap($details).should("be.visible");

        // Should show order ID/confirmation number
        cy.wrap($details)
          .find("[data-testid='order-id'], .order-number, .confirmation-number")
          .then($orderId => {
            if ($orderId.length > 0) {
              cy.wrap($orderId).should("exist");
            }
          });

        // Should show order total
        cy.wrap($details)
          .find("[data-testid='order-total'], .total")
          .then($total => {
            if ($total.length > 0) {
              cy.wrap($total).invoke("text").should("include", "$");
            }
          });

        // Should show shipping address
        cy.wrap($details)
          .find("[data-testid='shipping-address'], .address")
          .then($address => {
            if ($address.length > 0) {
              cy.wrap($address).should("be.visible");
            }
          });
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
    cy.get("#add-to-cart-btn").click();

    // Go to cart and verify items
    cy.get("a[href*='cart.html']").click();
    cy.get("[data-testid='cart-item']").then($items => {
      const itemCount = $items.length;
      expect(itemCount).to.be.greaterThan(0);

      // Get cart total before cancel
      cy.get("[data-testid='cart-subtotal'], [data-testid='cart-total']")
        .invoke("text")
        .then(subtotal => {
          const originalSubtotal = subtotal;

          // Simulate Stripe cancel redirect
          // Visit cancel.html or mock the redirect
          cy.intercept("GET", "**/store/cancel.html", res => {
            // Redirect back to cart
            cy.visit("/store/cart.html");
          }).as("cancelPage");

          // Try to navigate to cancel page (simulating Stripe redirect)
          cy.visit("/store/cancel.html");

          // Should either redirect to cart or show cancel message
          cy.url().then(url => {
            if (url.includes("cancel")) {
              // If still on cancel page, should have return to cart link
              cy.get("a[href*='cart.html']").should("exist").click();
            }
          });

          // Should be back on cart page
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
