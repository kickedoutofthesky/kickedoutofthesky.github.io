/* eslint-disable no-undef */
describe("Store Homepage and Navigation", () => {
  beforeEach(() => {
    cy.visit("/store");
  });

  it("should display the store homepage", () => {
    cy.get("h1").should("exist");
    cy.get("[data-testid='product-grid']").should("exist");
  });

  it("should display product cards", () => {
    cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);
  });

  it("should display product images and titles", () => {
    cy.get("[data-testid='product-card']")
      .first()
      .within(() => {
        cy.get("img").should("exist");
        cy.get("[data-testid='product-title']").should("exist");
        cy.get("[data-testid='product-price']").should("exist");
      });
  });

  it("should navigate to product detail page when clicking a product", () => {
    cy.get("[data-testid='product-card']").first().click();
    cy.url().should("include", "product.html");
    cy.get("[data-testid='product-detail']").should("exist");
  });

  it("should display cart link in navigation", () => {
    cy.get("a[href*='cart.html']").should("exist");
  });

  it("should display store link in navigation", () => {
    cy.get("a[href*='index.html']").should("exist");
  });
});
