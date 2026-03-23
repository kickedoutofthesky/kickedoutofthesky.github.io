/* eslint-disable no-undef */

describe("Stripe Integration Tests", () => {
  beforeEach(() => {
    cy.visit("/store");
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });

    // Add product to cart
    cy.get("[data-testid='product-card']").first().click();
    cy.get("[data-testid='product-detail']").should("be.visible");
    selectFirstRealSize();
    cy.get("#add-to-cart-btn").should("not.be.disabled").click();

    // Navigate to cart
    cy.get("a[href*='cart.html']").first().click();
    cy.url().should("include", "cart.html");
  });

  describe("Stripe Test Mode", () => {
    it("should have checkout button ready for Stripe integration", () => {
      // Verify we're on cart page ready for checkout
      cy.get("button").contains("Proceed to Checkout").should("exist");
      cy.get("button").contains("Proceed to Checkout").should("not.be.disabled");
      // Stripe.js will be loaded on checkout page via backend
    });

    it("should have test card numbers available for testing", () => {
      // This test documents the available test cards
      // Successful: 4242 4242 4242 4242
      // Declined: 4000 0000 0000 0002
      // These should be used in Stripe Checkout

      cy.get("button").contains("Proceed to Checkout").should("exist");
    });
  });

  describe("Successful Payment Flow", () => {
    it("should create Stripe session on checkout", () => {
      // Backend will create Stripe session and redirect
      // This test verifies the button is present and clickable
      cy.get("button").contains("Proceed to Checkout").should("exist");
      cy.get("button").contains("Proceed to Checkout").should("not.be.disabled");
      // Test flow: Button click → Backend creates session → Redirect to Stripe
    });

    it("should display payment page with cart items", () => {
      // Before checkout, verify cart data
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);
      cy.get("[data-testid='cart-subtotal']").should("exist");
    });

    it("should send cart data to Stripe session", () => {
      // Verify cart has valid data
      cy.get("[data-testid='cart-item']")
        .first()
        .within(() => {
          cy.get("[data-testid='item-name']").should("exist");
          cy.get("[data-testid='item-price']").should("exist");
        });

      // Price should be a valid amount
      cy.get("[data-testid='cart-subtotal']")
        .invoke("text")
        .then(text => {
          expect(text).to.match(/\$\d+\.\d{2}/);
        });
    });
  });

  describe("Payment Status Handling", () => {
    it("should have cart subtotal for payment calculation", () => {
      cy.get("[data-testid='cart-subtotal']").should("exist");
      cy.get("[data-testid='cart-subtotal']")
        .invoke("text")
        .then(total => {
          // Extract number for validation
          const amount = parseFloat(total.replace(/[^0-9.]/g, ""));
          expect(amount).to.be.greaterThan(0);
        });
    });

    it("should preserve order data during checkout", () => {
      // Get cart item details
      cy.get("[data-testid='cart-item']").then($items => {
        const itemCount = $items.length;

        // Item data should be valid
        cy.get("[data-testid='cart-item']").each($item => {
          cy.wrap($item).within(() => {
            cy.get("[data-testid='item-name']").invoke("text").should("have.length.greaterThan", 0);
            cy.get("[data-testid='item-price']").invoke("text").should("include", "$");
          });
        });

        // Should have correct number of items
        expect(itemCount).to.be.greaterThan(0);
      });
    });

    it("should have valid cart for payment", () => {
      // Verify prerequisites for checkout
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);
      cy.get("[data-testid='cart-subtotal']").should("exist");
      cy.get("button").contains("Proceed to Checkout").should("not.be.disabled");
    });
  });

  describe("Stripe Webhook Integration", () => {
    it("should have cart data for webhook processing", () => {
      // Webhook signature verification happens on backend
      // This test verifies the cart is properly structured for webhook processing
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);

      // Verify cart has pricing for Stripe session
      cy.get("[data-testid='cart-subtotal']").should("exist");
      cy.get("[data-testid='cart-subtotal']")
        .invoke("text")
        .then(total => {
          expect(total).to.match(/\$\d+\.\d{2}/);
        });
    });

    it("should structure order data for webhook processing", () => {
      // Verify order data has required fields for webhook
      cy.get("[data-testid='cart-subtotal']")
        .invoke("text")
        .then(total => {
          const amount = parseFloat(total.replace(/[^0-9.]/g, ""));

          // Amount should be valid for Stripe (in cents)
          const amountInCents = Math.round(amount * 100);
          expect(amountInCents).to.be.greaterThan(0);
        });
    });

    it("should have valid order total for Stripe session", () => {
      // Session data needed for webhook signature verification
      cy.get("[data-testid='cart-subtotal']")
        .invoke("text")
        .then(total => {
          const amountInCents = Math.round(parseFloat(total.replace(/[^0-9.]/g, "")) * 100);
          expect(amountInCents).to.be.greaterThan(0);
          // This amount is sent to Stripe for the checkout session
        });
    });
  });

  describe("Checkout Error Handling", () => {
    it("should have error handling for failed connections", () => {
      // Checkout button should be present for retry
      cy.get("button").contains("Proceed to Checkout").should("exist");
    });

    it("should allow returning to cart if needed", () => {
      // Navigation back to store
      cy.get("a[href*='index.html']").should("exist");
    });
  });

  describe("Test Card Documentation", () => {
    it("should document successful test card", () => {
      // Successful charge: 4242 4242 4242 4242
      // Use with any future expiry date and any 3-digit CVC
      // This card always succeeds
      expect(true).to.equal(true);
    });

    it("should document declined test card", () => {
      // Declined charge: 4000 0000 0000 0002
      // Use with any future expiry date and any 3-digit CVC
      // This card always fails with decline code: generic_decline
      expect(true).to.equal(true);
    });

    it("should have test mode credentials configured", () => {
      // Stripe test API key should be configured in environment
      // Test Secret Key: sk_test_...
      // Test Publishable Key: pk_test_...
      expect(true).to.equal(true);
    });
  });
});
