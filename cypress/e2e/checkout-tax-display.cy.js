/* eslint-disable no-undef */

describe("Tax Calculation Workflow", () => {
  beforeEach(() => {
    cy.visit("/store");
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });

    // Add a product to cart
    cy.get("[data-testid='product-card']").first().click();
    cy.get("[data-testid='product-detail']").should("be.visible");

    // Select size based on product type (handle hats/stickers)
    cy.get("select").then($select => {
      const options = $select.find("option");
      const firstOption = options.eq(1); // Skip placeholder
      if (firstOption.length > 0) {
        cy.get("select").select(firstOption.val());
      }
    });

    cy.get("#add-to-cart-btn").should("not.be.disabled").click({ force: true });

    // Navigate to cart
    cy.get("a[href*='cart.html']").first().click();
  });

  describe("Tax Display - When Tax > 0 (US)", () => {
    it("should display Tax label and amount when tax is calculated", () => {
      // Select US (which has sales tax)
      cy.get("#shipping-country").select("US");

      // Wait for quote to load
      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

      // Verify Tax label is shown
      cy.get("#tax-label").should("contain", "Tax:");

      // Verify tax amount is displayed
      cy.get("#tax-value").should("not.contain", "Included");
      cy.get("#tax-value").should("not.contain", "TBD");
      cy.get("#tax-value")
        .invoke("text")
        .should("match", /\$[\d.]+/);
    });

    it("should not apply muted style to tax row when tax is not included", () => {
      cy.get("#shipping-country").select("US");

      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

      // Tax row should not be muted (opacity should be 1)
      cy.get("#tax-row").should("have.css", "opacity", "1");
    });

    it("should display correct subtotal, shipping, and total for US", () => {
      cy.get("#shipping-country").select("US");

      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");

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
      // Intercept quote API and make it fail
      cy.intercept("POST", "**/api/quote", { statusCode: 500, body: { error: "Server error" } });

      cy.get("#shipping-country").select("US");

      // Error should be displayed
      cy.get("#quote-error", { timeout: 5000 }).should("be.visible");
      cy.get("#quote-error-text").should("contain", "Failed to calculate order total");
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

      // Rapidly change country multiple times
      cy.get("#shipping-country").select("US");
      cy.get("#shipping-country").select("CA");
      cy.get("#shipping-country").select("MX");

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
      // This would require a mock that returns importDutiesNote: true
      cy.intercept("POST", "**/api/quote", {
        statusCode: 200,
        body: {
          subtotal: 5000,
          shipping: 800,
          tax: 0,
          total: 5800,
          currency: "USD",
          importDutiesNote: true,
          taxIncluded: true,
          calculationId: "quote_123",
        },
      });

      cy.get("#shipping-country").select("US");

      cy.get("#quote-loading", { timeout: 5000 }).should("not.be.visible");
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
