/* eslint-disable no-undef */
// Shared test helpers for Cypress tests

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

// Helper function to select shipping country
function selectShippingCountry(countryCode = "US") {
  cy.get("#shipping-country").should("exist").select(countryCode);
}
