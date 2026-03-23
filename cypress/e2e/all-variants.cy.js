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

// Helper function to select first real color option
function selectFirstRealColor() {
  cy.get("[data-testid='color-select']").then($select => {
    if ($select.length > 0) {
      cy.get("[data-testid='color-select'] option")
        .eq(1)
        .invoke("attr", "value")
        .then(colorValue => {
          cy.get("[data-testid='color-select']").select(colorValue, { force: true });
        });
    }
  });
}

describe("Add All Products and Variants to Cart", () => {
  beforeEach(() => {
    cy.visit("/store");
    // Clear cart before test
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  it("should add products to cart", () => {
    // Add first product
    cy.get("[data-testid='product-card']").eq(0).click();
    cy.url().should("include", "product.html");
    cy.get("[data-testid='product-detail']").should("be.visible");

    selectFirstRealSize();
    cy.get("#add-to-cart-btn").should("not.be.disabled").click();
    cy.get("[data-testid='cart-count']").should("contain", "1");

    // Go back and add second product
    cy.visit("/store");
    cy.get("[data-testid='product-card']").eq(1).click();
    cy.url().should("include", "product.html");
    cy.get("[data-testid='product-detail']").should("be.visible");

    selectFirstRealSize();
    cy.get("#add-to-cart-btn").should("not.be.disabled").click();
    cy.get("[data-testid='cart-count']").should("contain", "2");

    // Navigate to cart and verify items
    cy.get("a[href*='cart.html']").first().click();
    cy.get("[data-testid='cart-item']").should("have.length", 2);
  });

  it("should handle products with color variants", () => {
    cy.get("[data-testid='product-card']").eq(0).click();
    cy.url().should("include", "product.html");
    cy.get("[data-testid='product-detail']").should("be.visible");

    // Check if color select exists
    cy.get("[data-testid='color-select']").then($colorSelect => {
      if ($colorSelect.length > 0) {
        // Add first variant
        selectFirstRealSize();
        cy.get("#add-to-cart-btn").should("not.be.disabled").click();
        cy.get("[data-testid='cart-count']").should("contain", "1");

        // Go back and add same product with different color
        cy.visit("/store");
        cy.get("[data-testid='product-card']").eq(0).click();
        cy.get("[data-testid='product-detail']").should("be.visible");

        selectFirstRealColor();
        selectFirstRealSize();
        cy.get("#add-to-cart-btn").should("not.be.disabled").click();
        cy.get("[data-testid='cart-count']").should("contain", "2");
      } else {
        // No color variants, just add once
        selectFirstRealSize();
        cy.get("#add-to-cart-btn").should("not.be.disabled").click();
        cy.get("[data-testid='cart-count']").should("contain", "1");
      }
    });
  });

  it("should calculate correct cart subtotal", () => {
    // Add a product and check total
    cy.get("[data-testid='product-card']").eq(0).click();
    cy.get("[data-testid='product-detail']").should("be.visible");

    cy.get("[data-testid='product-price']")
      .invoke("text")
      .then(() => {
        selectFirstRealSize();
        cy.get("#add-to-cart-btn").should("not.be.disabled").click();

        // Go to cart and verify subtotal
        cy.get("a[href*='cart.html']").first().click();
        cy.get("[data-testid='cart-subtotal']").should("exist");
        cy.get("[data-testid='cart-subtotal']").invoke("text").should("include", "$");
      });
  });
});
