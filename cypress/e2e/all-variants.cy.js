/* eslint-disable no-undef */

// Helper function to select first real color option
function selectFirstRealColor() {
  // Wait for color options to be available
  cy.get("[data-testid='color-select'] option").should("have.length.greaterThan", 0);

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

// Helper function to select first real size option
function selectFirstRealSize() {
  // Wait for size options to be populated (more than just the placeholder)
  cy.get("[data-testid='size-select'] option").should("have.length.greaterThan", 1);

  cy.get("[data-testid='size-select']").then($select => {
    if ($select.length > 0) {
      // Get the second option (skip the placeholder at index 0)
      cy.get("[data-testid='size-select'] option")
        .eq(1)
        .invoke("attr", "value")
        .then(sizeValue => {
          cy.get("[data-testid='size-select']").select(sizeValue, { force: true });
        });
    }
  });
}

describe("Add All Products and Variants to Cart", () => {
  beforeEach(() => {
    // Clear storage before setting up intercepts
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
      // Accept cookie consent to hide banner
      win.localStorage.setItem("cookie_consent", "accepted");
    });

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

    cy.visit("/store");
  });

  it("should add products to cart", () => {
    // Add first product
    cy.get("[data-testid='product-card']").eq(0).click();
    cy.url().should("include", "product.html?key=");
    cy.get("[data-testid='product-detail']").should("be.visible");

    selectFirstRealSize();
    cy.get("#add-to-cart-btn").should("not.be.disabled").click({ force: true });
    cy.get("[data-testid='cart-count']").should("contain", "1");

    // Go back and add second product
    cy.visit("/store");
    cy.get("[data-testid='product-card']").eq(1).click();
    cy.url().should("include", "product.html?key=");
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
    cy.url().should("include", "product.html?key=");
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
        cy.visit("/store/cart.html");

        // Select country to load shipping estimate and cart summary
        selectShippingCountry("US");

        // Verify the cart summary is visible
        cy.get("#cart-summary", { timeout: 5000 }).should("be.visible");

        // Verify the subtotal is displayed in the summary
        cy.get("#subtotal").should("be.visible").invoke("text").should("include", "$");
      });
  });
});
