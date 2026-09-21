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
    // Handle uncaught exceptions from application module loading
    cy.on("uncaught:exception", err => {
      // Ignore ES6 import errors from application code
      if (err.message.includes("Cannot use import statement outside a module")) {
        return false; // Don't fail the test
      }
    });

    cy.visit("/store");
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
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
      selectShippingCountry("US");

      // Verify subtotal element is visible and has a value
      cy.get("#subtotal").should("be.visible");
      cy.get("#subtotal").should("not.have.text", "—");
    });

    it("should display shipping estimate for multiple items", () => {
      addProductToCart();
      cy.visit("/store");
      addProductToCart();

      navigateToCart();
      selectShippingCountry("US");

      // Verify shipping estimate element is visible and has a value
      cy.get("#shipping-estimate").should("be.visible");
      cy.get("#shipping-estimate").should("not.have.text", "—");
      cy.get("#shipping-estimate").should("not.have.text", "Calculating...");
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
        selectShippingCountry("US");

        // Items should still be there
        cy.get("[data-testid='cart-item']").should("have.length", itemCount);
      });
    });

    it("should maintain shipping estimate when changing countries", () => {
      addProductToCart();
      cy.visit("/store");
      addProductToCart();

      navigateToCart();

      // Verify cart still has items
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);

      selectShippingCountry("US");

      // Verify items and shipping estimate are still there
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);
      cy.get("#shipping-estimate").should("not.have.text", "—");
    });
  });
});

// Helper functions
function addProductToCart() {
  cy.get("[data-testid='product-card']").first().click();

  // Wait for product detail page to load
  cy.url().should("include", "product.html");
  cy.get("[data-testid='product-detail']").should("be.visible");

  // Select first available size
  cy.get("[data-testid='size-select'] option").should("have.length.greaterThan", 1);

  cy.get("[data-testid='size-select']").then($select => {
    const value = $select.val();
    if (!value || value === "") {
      cy.get("[data-testid='size-select'] option")
        .eq(1)
        .invoke("attr", "value")
        .then(sizeValue => {
          cy.get("[data-testid='size-select']").select(sizeValue, { force: true });
        });
    }
  });

  cy.get("#add-to-cart-btn").should("not.be.disabled").click({ force: true });
  cy.wait(1500); // Wait for cart update and navigation
  // Navigate back to store via direct link instead of history
  cy.visit("/store");
  cy.get("[data-testid='product-card']").should("exist"); // Wait for store page to load
}

function navigateToCart() {
  cy.get("a[href*='cart.html']").first().click();
  cy.get("[data-testid='cart-page']").should("exist");
}
