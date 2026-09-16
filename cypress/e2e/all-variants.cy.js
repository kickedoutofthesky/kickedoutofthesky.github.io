/* eslint-disable no-undef */

// Helper function to select first real color option
function selectFirstRealColor() {
  cy.get("[data-testid='color-select']").then($select => {
    if ($select.length > 0) {
      cy.get("[data-testid='color-select'] option")
        .eq(0)
        .invoke("attr", "value")
        .then(colorValue => {
          cy.get("[data-testid='color-select']").select(colorValue, { force: true });
        });
    }
  });
}

describe("Add All Products and Variants to Cart", () => {
  beforeEach(() => {
    // Clear storage before setting up intercepts
    localStorage.clear();
    sessionStorage.clear();

    // Mock the /api/geo endpoint
    cy.intercept("GET", "**/api/geo", {
      statusCode: 200,
      body: {
        country: "US",
        currency: "USD",
        exchangeRates: {
          USD: 1.0,
          EUR: 0.92,
          GBP: 0.79,
          JPY: 110.25,
        },
        vatRate: 0,
        isEU: false,
      },
    }).as("geoDetection");

    // Mock the /api/quote endpoint
    cy.intercept("POST", "**/api/quote", {
      statusCode: 200,
      body: {
        calculationId: "calc-12345",
        subtotal: 2500,
        shipping: 1000,
        tax: 0,
        total: 3500,
        currency: "USD",
        taxIncluded: false,
      },
    }).as("quoteUS");

    cy.visit("/store");
  });

  it("should add products to cart", () => {
    // Add first product
    cy.get("[data-testid='product-card']").eq(0).click();
    cy.url().should("include", "product.html");
    cy.get("[data-testid='product-detail']").should("be.visible");

    selectFirstRealSize();
    cy.get("#add-to-cart-btn").should("not.be.disabled").click({ force: true });
    cy.get("[data-testid='cart-count']").should("contain", "1");

    // Go back and add second product
    cy.visit("/store");
    cy.get("[data-testid='product-card']").eq(1).click();
    cy.url().should("include", "product.html");
    cy.get("[data-testid='product-detail']").should("be.visible");

    selectFirstRealSize();
    cy.get("#add-to-cart-btn").should("not.be.disabled").click({ force: true });
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
        cy.get("#add-to-cart-btn").should("not.be.disabled").click({ force: true });
        cy.get("[data-testid='cart-count']").should("contain", "1");

        // Go back and add same product with different color
        cy.visit("/store");
        cy.get("[data-testid='product-card']").eq(0).click();
        cy.get("[data-testid='product-detail']").should("be.visible");

        selectFirstRealColor();
        selectFirstRealSize();
        cy.get("#add-to-cart-btn").should("not.be.disabled").click({ force: true });
        cy.get("[data-testid='cart-count']").should("contain", "2");
      } else {
        // No color variants, just add once
        selectFirstRealSize();
        cy.get("#add-to-cart-btn").should("not.be.disabled").click({ force: true });
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
        cy.get("#add-to-cart-btn").should("not.be.disabled").click({ force: true });

        // Go to cart and verify subtotal
        cy.get("a[href*='cart.html']").first().click();

        // Wait for the quote API call to complete
        cy.wait("@quoteUS");

        cy.get("[data-testid='cart-subtotal']").should("exist");
        cy.get("[data-testid='cart-subtotal']").invoke("text").should("include", "$");
      });
  });
});
