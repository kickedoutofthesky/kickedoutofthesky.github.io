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
    cy.url().should("include", "product.html");
    cy.get("[data-testid='product-detail']").should("be.visible");

    // Select size
    selectFirstRealSize();

    // Add to cart
    cy.get("#add-to-cart-btn").should("not.be.disabled").click();

    // Navigate to cart
    cy.get("a[href*='cart.html']").first().click();
  });

  it("should display proceed to checkout button", () => {
    cy.get("button").contains("Proceed to Checkout").should("exist");
  });

  it("should display cart subtotal before checkout", () => {
    cy.get("[data-testid='cart-subtotal']").should("exist");
    cy.get("[data-testid='cart-subtotal']").invoke("text").should("include", "$");
  });

  it("should display cart items before checkout", () => {
    cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);
  });

  it("should have checkout button ready for payment processing", () => {
    // Get current URL (cart.html)
    cy.url().should("include", "cart.html");

    // Checkout button starts disabled until country is selected
    cy.get("button").contains("Proceed to Checkout").should("exist").should("be.disabled");

    // Select a country to enable checkout
    cy.get("#shipping-country").select("US");
    cy.get("button").contains("Proceed to Checkout").should("not.be.disabled");
  });

  it("should require items in cart for checkout", () => {
    // Verify we have items
    cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);

    // Button should be clickable with items after selecting country
    cy.get("#shipping-country").select("US");
    cy.get("button").contains("Proceed to Checkout").should("not.be.disabled");
  });

  it("should have cancel/back link available", () => {
    // Cart should always have way back to store
    cy.get("a[href*='index.html']").should("exist");
  });

  it("should preserve cart data for checkout", () => {
    // Verify item details are visible
    cy.get("[data-testid='cart-item']")
      .first()
      .within(() => {
        cy.get("[data-testid='item-name']").should("exist");
        cy.get("[data-testid='item-price']").should("exist");
      });
  });
});
