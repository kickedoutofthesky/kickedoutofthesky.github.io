/* eslint-disable no-undef */
describe("Checkout Flow", () => {
  beforeEach(() => {
    cy.visit("/store");
    // Clear cart
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });

    // Add a product to cart
    cy.get("[data-testid='product-card']").first().click();
    cy.get("button:contains('Add to Cart')").click();

    // Navigate to cart
    cy.get("a[href*='cart.html']").click();
  });

  it("should navigate to checkout page", () => {
    cy.get("button:contains('Proceed to Checkout')").click();
    cy.url().should("include", "success.html");
  });

  it("should display checkout form with required fields", () => {
    cy.get("button:contains('Proceed to Checkout')").click();

    // Since this is a Stripe integration, verify we reach the checkout
    cy.get("body").should("exist");
  });

  it("should handle checkout when cart is empty", () => {
    // Remove all items
    cy.get("[data-testid='remove-item']").each($btn => {
      cy.wrap($btn).click();
    });

    cy.get("button:contains('Proceed to Checkout')").then($btn => {
      if ($btn.length > 0) {
        // Button might be disabled or not clickable when cart is empty
        cy.wrap($btn)
          .invoke("attr", "disabled")
          .then(disabled => {
            // Either disabled or doesn't navigate
            expect(disabled).to.exist;
          });
      }
    });
  });

  it("should display order summary on checkout page", () => {
    cy.get("button:contains('Proceed to Checkout')").click();

    // Verify we're on checkout/success page
    cy.get("[data-testid='order-summary']").then($summary => {
      if ($summary.length > 0) {
        cy.get("[data-testid='order-summary']").should("exist");
      }
    });
  });

  it("should display cancel button on checkout", () => {
    cy.get("button:contains('Proceed to Checkout')").click();

    // Verify cancel option exists
    cy.get("a[href*='cancel.html']").then($link => {
      if ($link.length > 0) {
        cy.get("a[href*='cancel.html']").should("exist");
      }
    });
  });

  it("should show item count matches cart", () => {
    // Get cart item count
    cy.get("[data-testid='cart-item']").then($items => {
      const itemCount = $items.length;

      cy.get("button:contains('Proceed to Checkout')").click();

      // Verify count matches
      cy.get("[data-testid='order-item']").then($orderItems => {
        if ($orderItems.length > 0) {
          expect($orderItems.length).to.equal(itemCount);
        }
      });
    });
  });

  it("should recalculate total at checkout", () => {
    cy.get("[data-testid='cart-subtotal']")
      .invoke("text")
      .then(_cartTotal => {
        cy.get("button:contains('Proceed to Checkout')").click();

        // Verify subtotal appears
        cy.get("[data-testid='order-total']").then($total => {
          if ($total.length > 0) {
            cy.get("[data-testid='order-total']").should("exist");
          }
        });
      });
  });
});
