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
          cy.get("[data-testid='size-select']").select(sizeValue, { force: true });
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

// Using global helpers from cypress/support/e2e.js:
// selectShippingCountry(countryCode)
// acceptTerms()

describe("Checkout Flow", () => {
  beforeEach(() => {
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });

    // Mock geo-location API to return US
    cy.intercept("GET", "**/api/geo", {
      statusCode: 200,
      body: {
        country_code: "US",
      },
    }).as("geoDetection");

    // Mock quote API to return a quote for US
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

    // Mock countries file
    cy.intercept("GET", "**/data/printful-shipping-countries.json", {
      statusCode: 200,
      body: [
        { name: "United States", code: "US" },
        { name: "Canada", code: "CA" },
        { name: "United Kingdom", code: "GB" },
        { name: "Australia", code: "AU" },
        { name: "Germany", code: "DE" },
      ],
    }).as("countriesLoaded");

    cy.visit("/store");

    // Add product to cart
    cy.get("[data-testid='product-card']").first().click();
    cy.get("[data-testid='product-detail']").should("be.visible");
    selectFirstRealColor();
    selectFirstRealSize();
    cy.get("#add-to-cart-btn").should("not.be.disabled").click({ force: true });

    // addToCart() redirects to cart.html automatically
    cy.url().should("include", "cart.html");

    // Wait for countries to load so dropdown is populated
    cy.wait("@countriesLoaded", { timeout: 5000 });

    // Wait for the auto-selected country to trigger quote fetch
    cy.wait("@quoteUS", { timeout: 5000 });
  });

  it("should have items in cart before checkout", () => {
    cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);
  });

  it("should display checkout button", () => {
    cy.get("button").contains("Proceed to Checkout").should("exist");
  });

  it("should have checkout button available", () => {
    // Button starts disabled until terms are accepted (country already selected in beforeEach)
    cy.get("button").contains("Proceed to Checkout").should("exist").should("be.disabled");

    acceptTerms();

    // After terms are accepted, button should be enabled (country and quote already set in beforeEach)
    cy.get("button").contains("Proceed to Checkout").should("not.be.disabled");
  });

  it("should display cart subtotal before checkout", () => {
    // Quote is already calculated in beforeEach (country auto-selected and quote fetched)
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
