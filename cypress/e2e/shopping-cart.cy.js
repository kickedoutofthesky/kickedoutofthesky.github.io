/* eslint-disable no-undef */
describe("Shopping Cart", () => {
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
  });

  it("should navigate to cart page", () => {
    cy.get("a[href*='cart.html']").click();
    cy.url().should("include", "cart.html");
    cy.get("[data-testid='cart-page']").should("exist");
  });

  it("should display cart items", () => {
    cy.get("a[href*='cart.html']").click();
    cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);
  });

  it("should display product info in cart", () => {
    cy.get("a[href*='cart.html']").click();
    cy.get("[data-testid='cart-item']")
      .first()
      .within(() => {
        cy.get("[data-testid='item-name']").should("exist");
        cy.get("[data-testid='item-price']").should("exist");
        cy.get("[data-testid='item-quantity']").should("exist");
      });
  });

  it("should show cart subtotal", () => {
    cy.get("a[href*='cart.html']").click();
    cy.get("[data-testid='cart-subtotal']").should("exist");
    cy.get("[data-testid='cart-subtotal']").should("contain", "$");
  });

  it("should have checkout button", () => {
    cy.get("a[href*='cart.html']").click();
    cy.get("button:contains('Proceed to Checkout')").should("exist");
  });

  it("should remove item from cart", () => {
    cy.get("a[href*='cart.html']").click();
    cy.get("[data-testid='remove-item']").first().click();
    cy.get("[data-testid='cart-item']").should("have.length", 0);
  });

  it("should update item quantity", () => {
    cy.get("a[href*='cart.html']").click();
    cy.get("[data-testid='quantity-input']").first().clear().type("2");
    cy.get("[data-testid='cart-subtotal']").should("exist");
  });

  it("should show empty cart message when no items", () => {
    // Navigate to empty cart
    cy.visit("/store/cart.html");
    cy.get("[data-testid='empty-cart-message']").should("be.visible");
  });

  it("should show continue shopping link on empty cart", () => {
    cy.visit("/store/cart.html");
    cy.get("a[href*='index.html']").should("exist");
  });
});
