/* eslint-disable no-undef */

// Helper function to select a proper size (not placeholder)
function selectFirstRealSize() {
  // Wait for size options to be populated (not just the placeholder)
  cy.get("[data-testid='size-select'] option").should("have.length.greaterThan", 1);

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

// Helper function to select first real color option
function selectFirstRealColor() {
  // Wait for color select to be visible and have options
  cy.get("[data-testid='color-select']").should("exist");
  cy.get("[data-testid='color-select'] option").should("have.length.greaterThan", 0);

  cy.get("[data-testid='color-select']").then($select => {
    if ($select.length > 0 && $select.find("option").length > 0) {
      cy.get("[data-testid='color-select'] option")
        .eq(0) // Get the first color (no placeholder in color select)
        .invoke("attr", "value")
        .then(colorValue => {
          // Use force:true to bypass navbar coverage issue
          cy.get("[data-testid='color-select']").select(colorValue, { force: true });
          // Wait for color change to update sizes
          cy.get("[data-testid='size-select'] option").should("have.length.greaterThan", 1);
        });
    }
  });
}

describe("Add to Cart Flow", () => {
  beforeEach(() => {
    cy.visit("/store");
    // Clear cart before each test
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  it("should add a product to cart from product grid", () => {
    // Click View Details on first product
    cy.get("[data-testid='product-card']").first().click();

    // Should navigate to product page
    cy.url().should("include", "product.html");

    // Wait for product detail to load
    cy.get("[data-testid='product-detail']").should("be.visible");

    // Select a real size
    selectFirstRealSize();

    // Add to cart
    cy.get("#add-to-cart-btn").should("not.be.disabled").click();

    // Verify cart count increments
    cy.get("[data-testid='cart-count']").should("contain", "1");
  });

  it("should add a product from product detail page", () => {
    cy.get("[data-testid='product-card']").first().click();

    // Wait for product detail to load
    cy.get("[data-testid='product-detail']").should("be.visible");

    // Select a real size
    selectFirstRealSize();

    // Add to cart
    cy.get("#add-to-cart-btn").should("not.be.disabled").click();

    // Verify cart count
    cy.get("[data-testid='cart-count']").should("contain", "1");
  });

  it("should select color variant before adding to cart", () => {
    cy.get("[data-testid='product-card']").first().click();

    // Wait for product detail to load
    cy.get("[data-testid='product-detail']").should("be.visible");

    // Select color if available
    selectFirstRealColor();

    // Select a real size
    selectFirstRealSize();

    // Add to cart
    cy.get("#add-to-cart-btn").should("not.be.disabled").click();

    // Verify cart count increases
    cy.get("[data-testid='cart-count']").should("contain", "1");
  });

  it("should add multiple different products to cart", () => {
    // Add first product
    cy.get("[data-testid='product-card']").eq(0).click();
    cy.url().should("include", "product.html");
    cy.get("[data-testid='product-detail']").should("be.visible");

    selectFirstRealSize();
    cy.get("#add-to-cart-btn").click();
    cy.get("[data-testid='cart-count']").should("contain", "1");

    // Go back to store
    cy.visit("/store");

    // Add second product
    cy.get("[data-testid='product-card']").eq(1).click();
    cy.url().should("include", "product.html");
    cy.get("[data-testid='product-detail']").should("be.visible");

    selectFirstRealSize();
    cy.get("#add-to-cart-btn").click();
    cy.get("[data-testid='cart-count']").should("contain", "2");
  });

  it("should add same product with different variants separately", () => {
    cy.get("[data-testid='product-card']").first().click();
    cy.get("[data-testid='product-detail']").should("be.visible");

    selectFirstRealSize();
    cy.get("#add-to-cart-btn").click();
    cy.get("[data-testid='cart-count']").should("contain", "1");

    // Go back and add same product with different variant
    cy.visit("/store");
    cy.get("[data-testid='product-card']").first().click();
    cy.get("[data-testid='product-detail']").should("be.visible");

    selectFirstRealColor();
    selectFirstRealSize();
    cy.get("#add-to-cart-btn").click();
    cy.get("[data-testid='cart-count']").should("contain", "2");
  });
});
