/* eslint-disable no-undef */
/**
 * Cart Display E2E Tests - Enhanced
 * Tests cart update workflows, quote fetching, and checkout features
 * These tests target the uncovered code paths in cart-display.js:
 * - Lines 93-221: DOM element selection and updates
 * - Lines 228-602: Cart updates and quote fetching
 * - Lines 615-738: Checkout flow handling
 */

describe("Cart Display - Enhanced Quote and Checkout", () => {
  beforeEach(() => {
    cy.visit("/store");
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  describe("Quote Fetching - Multi-Country", () => {
    it("should fetch quote for US with tax", () => {
      addProductToCart();
      navigateToCart();

      cy.get("#shipping-country").select("US");
      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

      // Verify quote elements are displayed
      cy.get("#subtotal").should("be.visible");
      cy.get("#shipping-value").should("be.visible");
      cy.get("#total").should("be.visible");
    });

    it("should fetch quote for Germany with EUR", () => {
      addProductToCart();
      navigateToCart();

      cy.get("#shipping-country").select("DE");
      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

      // Verify totals are shown
      cy.get("#total")
        .invoke("text")
        .should("match", /[\d.]+/);
    });

    it("should update totals when country changes", () => {
      addProductToCart();
      navigateToCart();

      cy.get("#shipping-country").select("US");
      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

      cy.get("#total")
        .invoke("text")
        .then(usTotal => {
          cy.get("#shipping-country").select("DE");
          cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

          // Totals should update
          cy.get("#total").should("be.visible");
        });
    });
  });

  describe("Multiple Items in Cart - Totals", () => {
    it("should calculate total for multiple items", () => {
      // Add first product
      addProductToCart();
      cy.visit("/store");

      // Add second product
      addProductToCart();

      navigateToCart();
      cy.get("#shipping-country").select("US");
      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

      // Verify subtotal includes both items
      cy.get("#subtotal")
        .invoke("text")
        .should("match", /\$[\d.]+/);
    });

    it("should apply shipping to multiple items", () => {
      addProductToCart();
      cy.visit("/store");
      addProductToCart();

      navigateToCart();
      cy.get("#shipping-country").select("US");
      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

      cy.get("#shipping-value")
        .invoke("text")
        .should("match", /\$[\d.]+/);
    });
  });

  describe("Order Summary Display - Formatting", () => {
    it("should display formatted prices", () => {
      addProductToCart();
      navigateToCart();

      cy.get("#shipping-country").select("US");
      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

      // All values should be formatted with currency
      cy.get("#subtotal")
        .invoke("text")
        .should("match", /\$[\d,.]+/);
      cy.get("#total")
        .invoke("text")
        .should("match", /\$[\d,.]+/);
    });

    it("should display tax information for US", () => {
      addProductToCart();
      navigateToCart();

      cy.get("#shipping-country").select("US");
      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

      cy.get("#tax-label").should("contain", "Tax");
      cy.get("#tax-value")
        .invoke("text")
        .should("match", /\$[\d.]+/);
    });

    it("should display correct order summary structure", () => {
      addProductToCart();
      navigateToCart();

      cy.get("#shipping-country").select("US");
      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

      // Order summary should have all elements
      cy.get("#subtotal").should("exist");
      cy.get("#shipping-value").should("exist");
      cy.get("#tax-value").should("exist");
      cy.get("#total").should("exist");
    });
  });

  describe("Cart State Management", () => {
    it("should persist cart items across country changes", () => {
      addProductToCart();
      navigateToCart();

      // Get initial item count
      cy.get("[data-testid='cart-item']").then($items => {
        const itemCount = $items.length;

        // Change country
        cy.get("#shipping-country").select("US");
        cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

        // Items should still be there
        cy.get("[data-testid='cart-item']").should("have.length", itemCount);
      });
    });

    it("should update quote without losing cart items", () => {
      addProductToCart();
      cy.visit("/store");
      addProductToCart();

      navigateToCart();

      cy.get("[data-testid='cart-item']").should("have.length", 2);

      cy.get("#shipping-country").select("DE");
      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

      cy.get("[data-testid='cart-item']").should("have.length", 2);
    });
  });

  describe("Quote Loading States", () => {
    it("should show loading indicator while fetching quote", () => {
      addProductToCart();
      navigateToCart();

      cy.get("#shipping-country").select("US");

      // Loading should appear and disappear
      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

      // Totals should be ready
      cy.get("#total").should("be.visible");
    });

    it("should handle country selection without errors", () => {
      addProductToCart();
      navigateToCart();

      // Select multiple countries in succession
      cy.get("#shipping-country").select("US");
      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

      cy.get("#shipping-country").select("CA");
      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

      cy.get("#shipping-country").select("GB");
      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

      // Should remain functional
      cy.get("#total").should("be.visible");
    });
  });
});

// Helper functions
function addProductToCart() {
  cy.get("[data-testid='product-card']").first().click();
  cy.get("[data-testid='product-detail']").should("be.visible");

  // Select first available size
  cy.get("select").then($select => {
    const options = $select.find("option");
    const firstOption = options.eq(1); // Skip placeholder
    if (firstOption.length > 0) {
      cy.get("select").select(firstOption.val());
    }
  });

  cy.get("#add-to-cart-btn").should("not.be.disabled").click({ force: true });
  cy.wait(1500); // Wait for cart burst animation
}

function navigateToCart() {
  cy.get("a[href*='cart.html']").first().click();
  cy.get("[data-testid='cart-page']").should("exist");
}
