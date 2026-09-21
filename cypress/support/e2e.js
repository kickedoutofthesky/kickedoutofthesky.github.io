// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

/* global cy */
/* eslint-disable no-undef */

// Setup default API mocks before each test
beforeEach(() => {
  // Mock the allowed countries endpoint
  cy.intercept("GET", "**/api/allowed-countries", {
    statusCode: 200,
    body: {
      countries: ["US", "CA", "GB", "AU", "DE", "FR", "IT", "ES", "JP", "CN", "IN", "BR", "MX", "ZA"],
    },
  }).as("allowedCountries");

  // Mock the calculate-shipping endpoint
  cy.intercept("POST", "**/api/calculate-shipping", req => {
    const country = req.body.country || "US";
    const shippingCosts = {
      US: 999,
      CA: 1500,
      GB: 1200,
      AU: 2500,
      DE: 1400,
      FR: 1400,
      IT: 1400,
      ES: 1400,
      JP: 2000,
      CN: 2200,
      IN: 2500,
      BR: 3000,
      MX: 1800,
      ZA: 3500,
    };
    const shippingCost = shippingCosts[country] || 1500;

    req.reply({
      statusCode: 200,
      body: {
        shipping_options: [
          {
            id: `shipping_${country}`,
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: {
                amount: shippingCost,
                currency: "usd",
              },
              display_name: "Standard Shipping",
              delivery_estimate: {
                minimum: { unit: "business_day", value: 5 },
                maximum: { unit: "business_day", value: 10 },
              },
            },
          },
        ],
      },
    });
  }).as("calculateShipping");
});

// Shared test helpers for all Cypress tests

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

function selectShippingCountry(countryCode = "US") {
  // Wait for country select to be populated with options
  cy.get("#shipping-country", { timeout: 5000 }).should("exist");
  cy.get("#shipping-country option", { timeout: 5000 }).should("have.length.greaterThan", 1);

  // Select country
  cy.get("#shipping-country").select(countryCode, { force: true });

  // Wait for shipping estimate to be calculated (should not show "—" or "Calculating...")
  cy.get("#shipping-estimate", { timeout: 5000 }).should("not.have.text", "—");
  cy.get("#shipping-estimate", { timeout: 5000 }).should("not.have.text", "Calculating...");
}

function acceptTerms() {
  // Check terms with force:true since it may be in a fixed position
  cy.get("#terms-checkbox").check({ force: true });
}

// Make helpers available globally
window.selectFirstRealSize = selectFirstRealSize;
window.selectFirstRealColor = selectFirstRealColor;
window.selectShippingCountry = selectShippingCountry;
window.acceptTerms = acceptTerms;

// Ignore cross-origin script errors from CDN resources (Bootstrap, Font Awesome)
// These are expected and don't affect test functionality

Cypress.on("uncaught:exception", (err, _runnable) => {
  // Ignore Script errors (cross-origin resource errors from CDN)
  if (err.message === "Script error." || err.message.includes("Script error")) {
    // Log it for debugging but don't fail
    console.warn("Ignoring cross-origin script error:", err);
    return false; // Continue test execution
  }
  // Let other errors fail the tests
  return true;
});

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests in the Command Log
const app = window.top;

if (!app.document.head.querySelector("[data-hide-command-log-request]")) {
  const style = app.document.createElement("style");
  style.innerHTML = ".command-name-request, .command-name-xhr { display: none }";
  style.setAttribute("data-hide-command-log-request", "");

  app.document.head.appendChild(style);
}
