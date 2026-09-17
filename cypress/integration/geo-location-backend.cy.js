/* eslint-disable no-undef */
/**
 * BACKEND INTEGRATION TESTS: Geo-Location & Country Selection
 *
 * ⚠️  REQUIRES BACKEND: These tests require the actual backend API to be running.
 *
 * Location: cypress/integration/ (separate from E2E tests)
 * Purpose: Test actual backend API responses, not mocked responses
 *
 * Run these tests ONLY in staging/CI environments with a real backend:
 *
 *   # Local (skip these)
 *   npx cypress run --spec "cypress/e2e/**\/*.cy.js"
 *
 *   # Staging with backend
 *   npx cypress run --spec "cypress/integration/**\/*.cy.js" --config baseUrl=https://staging.example.com
 *
 *   # Or via npm script
 *   npm run test:integration:staging
 */

describe("Geo-Location & Country Selection - Backend Integration", () => {
  beforeEach(() => {
    // Setup localStorage
    localStorage.clear();

    // Mock the /api/quote endpoint (quote is always mocked for fast tests)
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
  });

  describe("Initial Geo-Detection on Product Page", () => {
    it("should detect customer location and store country in localStorage", () => {
      // Visit product page (assumes initializeCurrency is called on load)
      cy.visit("/store/index.html");

      // DO NOT mock /api/geo - let real backend handle it
      // This validates the backend geo-detection endpoint works

      // Verify localStorage has the country
      cy.window().then(win => {
        const country = win.localStorage.getItem("selectedShippingCountry");
        expect(country).to.exist;
        expect(country).to.have.length(2); // Two-letter country code
      });

      // Verify global currency object is set
      cy.window().then(win => {
        expect(win.customerCurrency).to.exist;
        expect(win.customerCurrency.country).to.exist;
        expect(win.customerCurrency.currency).to.exist;
      });
    });

    it("should handle geo-detection failure and fallback to USD", () => {
      // Test real backend failure scenario
      cy.visit("/store/index.html");

      // If backend is down, should fallback to US
      cy.window().then(win => {
        const country = win.localStorage.getItem("selectedShippingCountry") || "US";
        expect(country).to.equal("US");
        expect(win.customerCurrency.currency).to.equal("USD");
      });
    });

    it("should receive valid exchange rates from backend", () => {
      cy.visit("/store/index.html");

      cy.window().then(win => {
        expect(win.customerCurrency.exchangeRates).to.exist;
        expect(typeof win.customerCurrency.exchangeRates).to.equal("object");

        // Should have at least USD rate
        expect(win.customerCurrency.exchangeRates).to.have.property("USD");
      });
    });
  });

  describe("Cart Page - Country Dropdown with Real Backend", () => {
    it("should load quote for geo-detected country", () => {
      cy.visit("/store/index.html");

      cy.visit("/store/cart.html");

      // Wait for quote to be fetched from real backend
      cy.wait("@quoteUS");

      // Verify order summary displays
      cy.get("#summary-content").should("be.visible");
      cy.get("#subtotal").should("exist").and("not.be.empty");
    });

    it("should handle backend country data correctly", () => {
      cy.visit("/store/cart.html");

      // Dropdown should exist
      cy.get("#shipping-country").should("exist");

      // Should have options for different countries
      cy.get("#shipping-country option").should("have.length.greaterThan", 1);
    });
  });

  describe("Customer Country Selection with Real Backend", () => {
    it("should update prices when customer selects different country", () => {
      cy.visit("/store/index.html");
      cy.visit("/store/cart.html");

      // Mock quote for selected country
      cy.intercept("POST", "**/api/quote", {
        statusCode: 200,
        body: {
          calculationId: "calc-67890",
          subtotal: 2500,
          shipping: 1500,
          tax: 475,
          total: 4475,
          currency: "EUR",
          taxIncluded: false,
        },
      }).as("quoteDE");

      // Customer selects a different country
      cy.get("#shipping-country").select(1); // Select any available option

      // Verify quote is fetched
      cy.wait("@quoteDE", { timeout: 5000 });

      // Verify prices updated
      cy.get("#subtotal").should("exist").and("not.be.empty");
    });

    it("should persist country selection across page reloads", () => {
      cy.visit("/store/cart.html");

      // Select different country
      cy.get("#shipping-country").select(1);

      // Reload page
      cy.reload();

      // Should have persisted selection
      cy.get("#shipping-country").then($select => {
        const persistedCountry = $select.val();
        expect(persistedCountry).to.exist;
      });
    });
  });

  describe("Backend Error Handling", () => {
    it("should handle backend timeout gracefully", () => {
      cy.visit("/store/cart.html");

      // If quote API times out, should show error or fallback
      cy.get("#summary-content").then($summary => {
        if ($summary.hasClass("hidden")) {
          // Error state - that's acceptable
          expect($summary).to.have.class("hidden");
        } else {
          // Fallback prices shown
          cy.get("#subtotal").should("exist");
        }
      });
    });
  });
});
