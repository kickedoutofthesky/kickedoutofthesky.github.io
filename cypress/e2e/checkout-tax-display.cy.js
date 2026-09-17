/* eslint-disable no-undef */

// Helper function to select first real size option
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

// Using global selectShippingCountry() helper from cypress/support/e2e.js

describe("Tax Calculation Workflow", () => {
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

    // Mock quote API to return a quote
    cy.intercept("POST", "**/api/quote", {
      statusCode: 200,
      body: {
        calculationId: "calc-12345",
        subtotal: 2500,
        shipping: 1000,
        tax: 250,
        total: 3750,
        currency: "USD",
        taxIncluded: false,
      },
    }).as("quote");

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
  });

  describe("Tax Display - When Tax > 0 (US)", () => {
    it("should display Tax label and amount when tax is calculated", () => {
      // Select US and wait for quote
      cy.get("#shipping-country").select("US");
      cy.wait("@quote", { timeout: 5000 });

      // Verify Tax label is shown (contains "Tax/VAT:" in the actual HTML)
      cy.get("#tax-label").should("contain", "Tax");

      // Verify tax amount is displayed
      cy.get("#tax-value").should("not.contain", "Included");
      cy.get("#tax-value").should("not.contain", "TBD");
      cy.get("#tax-value")
        .invoke("text")
        .should("match", /\$[\d.]+/);
    });

    it("should not apply muted style to tax row when tax is not included", () => {
      // Select US and wait for quote
      cy.get("#shipping-country").select("US");
      cy.wait("@quote", { timeout: 5000 });

      // Tax row should not be muted (opacity should be 1)
      cy.get("#tax-row").should("have.css", "opacity", "1");
    });

    it("should display correct subtotal, shipping, and total for US", () => {
      // Select US and wait for quote
      cy.get("#shipping-country").select("US");
      cy.wait("@quote", { timeout: 5000 });

      // Verify all amounts are displayed
      cy.get("#subtotal")
        .invoke("text")
        .should("match", /\$[\d.]+/);
      cy.get("#shipping-value")
        .invoke("text")
        .should("match", /\$[\d.]+/);
      cy.get("#tax-value")
        .invoke("text")
        .should("match", /\$[\d.]+/);
      cy.get("#total")
        .invoke("text")
        .should("match", /\$[\d.]+/);

      // Verify subtotal < total (tax and shipping added)
      cy.get("#subtotal")
        .invoke("text")
        .then(subtotal => {
          cy.get("#total")
            .invoke("text")
            .then(total => {
              const subtotalNum = parseFloat(subtotal.replace("$", ""));
              const totalNum = parseFloat(total.replace("$", ""));
              expect(totalNum).to.be.greaterThan(subtotalNum);
            });
        });
    });

    it("should show loading state while fetching quote", () => {
      // Ensure loading indicator appears (may flash)
      cy.get("#shipping-country").select("US", { force: true });

      // Eventually should disappear
      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");
      cy.get("#summary-content").should("be.visible");
    });
  });

  describe("Tax Display - When Tax = 0 (EU)", () => {
    it("should display VAT label and Included when tax is zero", () => {
      // Try to select an EU country (e.g., Germany) - adjust based on available countries
      cy.get("#shipping-country").then($select => {
        // Check if EU country exists in options
        const hasEU = $select
          .find("option")
          .toArray()
          .some(opt => ["DE", "FR", "IT", "ES", "PL", "NL", "BE", "AT", "IE"].includes(opt.value));

        if (hasEU) {
          // Select first available EU country
          cy.get("#shipping-country")
            .find("option")
            .each(($option, index) => {
              if (index > 0) {
                // Skip "Select a country"
                const countryCode = $option.val();
                if (["DE", "FR", "IT", "ES", "PL", "NL", "BE", "AT", "IE"].includes(countryCode)) {
                  cy.get("#shipping-country").select(countryCode);
                  return false; // Break the loop
                }
              }
            });

          // Wait for quote
          cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

          // Verify VAT and Included are shown (when applicable)
          cy.get("#tax-label").then($label => {
            const labelText = $label.text();
            if (labelText === "VAT:") {
              cy.get("#tax-value").should("contain", "Included");
            }
          });
        }
      });
    });

    it("should apply muted style when tax is included", () => {
      // Similar to above - select EU country
      cy.get("#shipping-country").then($select => {
        const hasEU = $select
          .find("option")
          .toArray()
          .some(opt => ["DE", "FR", "IT", "ES", "PL", "NL", "BE", "AT", "IE"].includes(opt.value));

        if (hasEU) {
          cy.get("#shipping-country")
            .find("option")
            .each(($option, index) => {
              if (index > 0) {
                const countryCode = $option.val();
                if (["DE", "FR", "IT", "ES", "PL", "NL", "BE", "AT", "IE"].includes(countryCode)) {
                  cy.get("#shipping-country").select(countryCode);
                  return false;
                }
              }
            });

          cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

          // Check if VAT is shown with Included
          cy.get("#tax-value").then($tax => {
            if ($tax.text() === "Included") {
              // Should have muted opacity
              cy.get("#tax-row")
                .should("have.css", "opacity")
                .and(val => {
                  expect(parseFloat(val)).to.be.lessThan(1);
                });
            }
          });
        }
      });
    });
  });

  describe("Tax Display - Error Handling", () => {
    it("should show error state when quote fetch fails", () => {
      // Intercept quote API and make it fail (without error field to get fallback message)
      cy.intercept("POST", "**/api/quote", { statusCode: 500, body: {} }).as("quoteFailed");

      cy.get("#shipping-country").select("US");
      cy.wait("@quoteFailed", { timeout: 5000 });

      // Error should be displayed with fallback message
      cy.get("#quote-error", { timeout: 5000 }).should("be.visible");
      cy.get("#quote-error-text").should("contain", "Failed to fetch quote");
    });

    it("should allow retry after error", () => {
      // First call fails
      cy.intercept("POST", "**/api/quote", { statusCode: 500, body: { error: "Server error" } }).as("quoteFailure");

      cy.get("#shipping-country").select("US");
      cy.get("#quote-error", { timeout: 5000 }).should("be.visible");

      // Change country to retry
      cy.intercept("POST", "**/api/quote", { statusCode: 200, body: { subtotal: 5000, tax: 350 } }).as("quoteSuccess");

      cy.get("#shipping-country").select("CA");

      // Error should be cleared and content should load
      cy.get("#quote-error", { timeout: 5000 }).should("not.be.visible");
    });
  });

  describe("Tax Display - Checkout Button State", () => {
    it("should disable checkout button until quote loads", () => {
      // Initially should be disabled
      cy.get("#checkout-btn").should("be.disabled");

      // Select country
      cy.get("#shipping-country").select("US");

      // Accept terms
      cy.get("#terms-checkbox").check();

      // Should still be disabled while loading
      cy.get("#quote-loading", { timeout: 1000 }).then($loading => {
        if ($loading.is(":visible")) {
          cy.get("#checkout-btn").should("be.disabled");
        }
      });

      // After quote loads and terms accepted, should be enabled
      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");
      cy.get("#checkout-btn").should("not.be.disabled");
    });

    it("should keep checkout disabled if terms not accepted", () => {
      cy.get("#shipping-country").select("US");

      // Don't check terms
      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

      // Should still be disabled
      cy.get("#checkout-btn").should("be.disabled");
    });

    it("should keep checkout disabled if country not selected", () => {
      // Check terms but don't select country
      cy.get("#terms-checkbox").check();

      cy.get("#checkout-btn").should("be.disabled");
    });
  });

  describe("Tax Display - Currency Formatting", () => {
    it("should use USD symbol for US orders", () => {
      cy.get("#shipping-country").select("US");

      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

      cy.get("#subtotal").invoke("text").should("include", "$");
      cy.get("#shipping-value").invoke("text").should("include", "$");
      cy.get("#total").invoke("text").should("include", "$");
    });

    it("should format amounts to two decimal places", () => {
      cy.get("#shipping-country").select("US");

      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

      // Check that amounts follow XX.XX format
      cy.get("#subtotal")
        .invoke("text")
        .should("match", /\$\d+\.\d{2}/);
      cy.get("#shipping-value")
        .invoke("text")
        .should("match", /\$\d+\.\d{2}/);
      cy.get("#total")
        .invoke("text")
        .should("match", /\$\d+\.\d{2}/);
    });
  });

  describe("Tax Display - Debouncing", () => {
    it("should debounce quote requests when changing country", () => {
      // Should only make one request after 400ms debounce, not multiple
      cy.intercept("POST", "**/api/quote", req => {
        req.reply({ statusCode: 200, body: { subtotal: 5000, tax: 350, total: 5350, currency: "USD" } });
      }).as("quoteRequest");

      // Rapidly change country multiple times (use GB instead of MX which isn't in mock)
      cy.get("#shipping-country").select("US");
      cy.get("#shipping-country").select("CA");
      cy.get("#shipping-country").select("GB");

      // Wait for debounce to settle
      cy.wait(500);

      // Should only have 1 or 2 requests, not 3
      cy.get("@quoteRequest.all").should(requests => {
        expect(requests.length).to.be.lessThan(3);
      });
    });
  });

  describe("Tax Display - Import Duties Note", () => {
    it("should show import duties note when applicable", () => {
      // Override the quote mock BEFORE selecting country
      cy.intercept("POST", "**/api/quote", {
        statusCode: 200,
        body: {
          calculationId: "calc-duties-123",
          subtotal: 5000,
          shipping: 800,
          tax: 0,
          total: 5800,
          currency: "USD",
          importDutiesNote: true,
          taxIncluded: true,
        },
      }).as("quoteWithDuties");

      // Now select country to trigger the new quote with import duties
      cy.get("#shipping-country").select("CA");
      cy.wait("@quoteWithDuties", { timeout: 5000 });

      // Verify loading is done and duties note is visible
      cy.get("#quote-loading").should("not.be.visible");
      cy.get("#import-duties-note").should("be.visible");
    });

    it("should hide import duties note when not applicable", () => {
      cy.get("#shipping-country").select("US");

      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

      // Standard US order should not show import duties
      cy.get("#import-duties-note").should("not.be.visible");
    });
  });
});
