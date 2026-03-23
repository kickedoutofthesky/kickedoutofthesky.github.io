/* eslint-disable no-undef */

describe("Checkout Flow", () => {
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
  });

  it("should have items in cart before checkout", () => {
    cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);
  });

  it("should display checkout button", () => {
    cy.get("button").contains("Proceed to Checkout").should("exist");
  });

  it("should have checkout button available", () => {
    // Button starts disabled until shipping country is selected
    cy.get("button").contains("Proceed to Checkout").should("exist").should("be.disabled");
    cy.get("#shipping-country").select("US");
    cy.get("button").contains("Proceed to Checkout").should("not.be.disabled");
  });

  it("should display cart subtotal before checkout", () => {
    cy.get("[data-testid='cart-subtotal']").should("exist");
    cy.get("[data-testid='cart-subtotal']").invoke("text").should("include", "$");
  });

  it("should navigate back to store from cart", () => {
    cy.get("a[href*='index.html']").should("exist");
    cy.get("a[href*='index.html']").first().click();
    cy.url().should("include", "index.html");
  });

  it("should have navigation back to store from cart", () => {
    // From cart page, should always be able to go back
    cy.get("a[href*='store'], a[href*='index.html']").should("exist");
  });
});
