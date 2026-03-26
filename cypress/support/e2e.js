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
  cy.get("#shipping-country").should("exist").select(countryCode);
}

function acceptTerms() {
  cy.get("#terms-checkbox").should("exist").check();
}

// Make helpers available globally
window.selectFirstRealSize = selectFirstRealSize;
window.selectFirstRealColor = selectFirstRealColor;
window.selectShippingCountry = selectShippingCountry;
window.acceptTerms = acceptTerms;

// Ignore cross-origin script errors from CDN resources (Bootstrap, Font Awesome)
// These are expected and don't affect test functionality
// eslint-disable-next-line no-undef
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
