/* eslint-disable no-undef */
/**
 * E2E Tests: Geo-Location & Country Selection Workflow
 * Tests the complete user journey from geo-detection to country selection
 */

describe("Geo-Location & Country Selection E2E", () => {
  beforeEach(() => {
    // Setup localStorage
    localStorage.clear();

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
  });

  describe("Initial Geo-Detection on Product Page", () => {
    it("should detect customer location and store country in localStorage", () => {
      // Visit product page (assumes initializeCurrency is called on load)
      cy.visit("/store/index.html");

      // Wait for geo-detection API call
      cy.wait("@geoDetection");

      // Verify localStorage has the country
      cy.window().then(win => {
        expect(win.localStorage.getItem("selectedShippingCountry")).to.equal("US");
      });

      // Verify global currency object is set
      cy.window().then(win => {
        expect(win.customerCurrency).to.deep.include({
          country: "US",
          currency: "USD",
        });
      });
    });

    it("should handle geo-detection failure and fallback to USD", () => {
      cy.intercept("GET", "**/api/geo", {
        statusCode: 500,
        body: { error: "Server error" },
      }).as("geoError");

      cy.visit("/store/index.html");

      cy.wait("@geoError");

      // Should fallback to US
      cy.window().then(win => {
        expect(win.localStorage.getItem("selectedShippingCountry")).to.equal("US");
        expect(win.customerCurrency.currency).to.equal("USD");
      });
    });

    it("should detect different countries correctly", () => {
      const testCountries = [
        {
          geoCountry: "DE",
          geoCurrency: "EUR",
          expectedStorage: "DE",
        },
        {
          geoCountry: "GB",
          geoCurrency: "GBP",
          expectedStorage: "GB",
        },
        {
          geoCountry: "JP",
          geoCurrency: "JPY",
          expectedStorage: "JP",
        },
      ];

      testCountries.forEach(test => {
        cy.intercept("GET", "**/api/geo", {
          statusCode: 200,
          body: {
            country: test.geoCountry,
            currency: test.geoCurrency,
            exchangeRates: { USD: 1.0 },
            vatRate: 0,
            isEU: false,
          },
        }).as("geo");

        cy.visit("/store/index.html");
        cy.wait("@geo");

        cy.window().then(win => {
          expect(win.localStorage.getItem("selectedShippingCountry")).to.equal(test.expectedStorage);
          expect(win.customerCurrency.country).to.equal(test.geoCountry);
        });

        // Navigate away to clear state for next iteration
        cy.visit("about:blank");
      });
    });
  });

  describe("Cart Page - Country Dropdown Defaulting", () => {
    it("should default country dropdown to geo-detected country", () => {
      // First visit product page for geo-detection
      cy.visit("/store/index.html");
      cy.wait("@geoDetection");

      // Navigate to cart page
      cy.visit("/store/cart.html");

      // Country dropdown should default to US (geo-detected)
      cy.get("#shipping-country").should("have.value", "US");
    });

    it("should load quote for default country", () => {
      cy.visit("/store/index.html");
      cy.wait("@geoDetection");

      cy.visit("/store/cart.html");

      // Wait for quote to be fetched
      cy.wait("@quoteUS");

      // Verify order summary displays
      cy.get("#summary-content").should("be.visible");
      cy.get("#subtotal").should("contain", "$25");
    });

    it("should handle missing country in localStorage", () => {
      // Visit cart without prior geo-detection
      cy.visit("/store/cart.html");

      // Dropdown should be empty or default
      cy.get("#shipping-country").should("have.value", "");
    });

    it("should validate country exists in dropdown before setting", () => {
      // Manually set invalid country in localStorage
      cy.window().then(win => {
        win.localStorage.setItem("selectedShippingCountry", "INVALID");
      });

      cy.visit("/store/cart.html");

      // Dropdown should remain empty (invalid country not in options)
      cy.get("#shipping-country").should("have.value", "");
    });
  });

  describe("Customer Country Selection", () => {
    it("should update localStorage when customer selects a different country", () => {
      cy.visit("/store/index.html");
      cy.wait("@geoDetection");

      cy.visit("/store/cart.html");

      // Verify default is US
      cy.get("#shipping-country").should("have.value", "US");

      // Mock quote for Germany
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

      // Customer selects Germany
      cy.get("#shipping-country").select("DE");

      // Verify quote is fetched for new country
      cy.wait("@quoteDE");

      // Verify localStorage updated
      cy.window().then(win => {
        expect(win.localStorage.getItem("selectedShippingCountry")).to.equal("DE");
      });
    });

    it("should display correct prices for selected country", () => {
      cy.visit("/store/index.html");
      cy.wait("@geoDetection");

      cy.visit("/store/cart.html");

      // Mock quote for GB with GBP prices
      cy.intercept("POST", "**/api/quote", {
        statusCode: 200,
        body: {
          calculationId: "calc-99999",
          subtotal: 1975,
          shipping: 895,
          tax: 0,
          total: 2870,
          currency: "GBP",
          taxIncluded: true,
        },
      }).as("quoteGB");

      cy.get("#shipping-country").select("GB");
      cy.wait("@quoteGB");

      // Verify GBP prices displayed
      cy.get("#subtotal").should("contain", "£");
      cy.get("#total").should("contain", "£");
    });

    it("should handle rapid country changes", () => {
      cy.visit("/store/index.html");
      cy.wait("@geoDetection");

      cy.visit("/store/cart.html");

      // Rapidly change countries
      cy.get("#shipping-country").select("DE");
      cy.get("#shipping-country").select("GB");
      cy.get("#shipping-country").select("FR");

      // Should only have final selection
      cy.get("#shipping-country").should("have.value", "FR");

      cy.window().then(win => {
        expect(win.localStorage.getItem("selectedShippingCountry")).to.equal("FR");
      });
    });

    it("should handle clearing country selection", () => {
      cy.visit("/store/index.html");
      cy.wait("@geoDetection");

      cy.visit("/store/cart.html");

      cy.get("#shipping-country").select("");

      cy.window().then(win => {
        expect(win.localStorage.getItem("selectedShippingCountry")).to.equal("");
      });

      // Order summary should be cleared
      cy.get("#summary-content").should("not.be.visible");
    });
  });

  describe("Persistence Across Sessions", () => {
    it("should restore customer's country choice on return visit", () => {
      // Visit 1: Customer selects Germany
      cy.visit("/store/index.html");
      cy.wait("@geoDetection");

      cy.visit("/store/cart.html");

      cy.intercept("POST", "**/api/quote", {
        statusCode: 200,
        body: {
          calculationId: "calc-de",
          subtotal: 2500,
          shipping: 1500,
          tax: 475,
          total: 4475,
          currency: "EUR",
          taxIncluded: false,
        },
      }).as("quoteDE");

      cy.get("#shipping-country").select("DE");
      cy.wait("@quoteDE");

      cy.window().then(win => {
        expect(win.localStorage.getItem("selectedShippingCountry")).to.equal("DE");
      });

      // Visit 2: Return to cart (simulate new session)
      cy.visit("/store/cart.html");

      // Should restore Germany, not geo-detected country
      cy.get("#shipping-country").should("have.value", "DE");
    });

    it("customer choice overrides geo-location on return visit", () => {
      // Visit 1: Geo detects US, customer chooses DE
      cy.visit("/store/index.html");
      cy.wait("@geoDetection");

      cy.visit("/store/cart.html");

      cy.intercept("POST", "**/api/quote", {
        statusCode: 200,
        body: {
          calculationId: "calc-de",
          subtotal: 2500,
          shipping: 1500,
          tax: 475,
          total: 4475,
          currency: "EUR",
          taxIncluded: false,
        },
      }).as("quoteDE");

      cy.get("#shipping-country").select("DE");
      cy.wait("@quoteDE");

      // Visit 2: New session (geo detection would say US again)
      // But localStorage has DE
      cy.window().then(win => {
        // Simulate new page load
        win.localStorage.setItem("selectedShippingCountry", "DE");
      });

      cy.visit("/store/cart.html");

      // Should show DE (customer's choice), not US (geo)
      cy.get("#shipping-country").should("have.value", "DE");
    });

    it("should handle country changes across multiple visits", () => {
      const visits = [
        { country: "US", currency: "USD" },
        { country: "DE", currency: "EUR" },
        { country: "GB", currency: "GBP" },
        { country: "JP", currency: "JPY" },
      ];

      visits.forEach((visit, index) => {
        cy.visit("/store/cart.html");

        if (index > 0) {
          // On second+ visit, verify previous selection persisted
          const previousCountry = visits[index - 1].country;
          cy.get("#shipping-country").should("have.value", previousCountry);
        }

        // Select new country
        cy.intercept("POST", "**/api/quote", {
          statusCode: 200,
          body: {
            calculationId: `calc-${visit.country}`,
            subtotal: 2500,
            shipping: 1000,
            tax: 0,
            total: 3500,
            currency: visit.currency,
            taxIncluded: false,
          },
        }).as(`quote${visit.country}`);

        cy.get("#shipping-country").select(visit.country);
        cy.wait(`@quote${visit.country}`);

        // Verify stored
        cy.window().then(win => {
          expect(win.localStorage.getItem("selectedShippingCountry")).to.equal(visit.country);
        });
      });
    });
  });

  describe("Checkout Flow with Country Selection", () => {
    it("should use saved country during checkout", () => {
      cy.visit("/store/index.html");
      cy.wait("@geoDetection");

      cy.visit("/store/cart.html");

      cy.intercept("POST", "**/api/quote", {
        statusCode: 200,
        body: {
          calculationId: "calc-checkout",
          subtotal: 2500,
          shipping: 1000,
          tax: 0,
          total: 3500,
          currency: "EUR",
          taxIncluded: false,
        },
      }).as("quoteCheckout");

      // Select country
      cy.get("#shipping-country").select("DE");
      cy.wait("@quoteCheckout");

      // Accept terms
      cy.get("#terms-checkbox").check();

      // Mock checkout
      cy.intercept("POST", "**/api/checkout", {
        statusCode: 200,
        body: { sessionUrl: "https://checkout.stripe.com/session/test" },
      }).as("checkout");

      // Checkout should use DE (not geo-detected US)
      cy.get("#checkout-btn").click();

      cy.wait("@checkout").then(interception => {
        expect(interception.request.body.country).to.equal("DE");
      });
    });

    it("should lock country selector during checkout", () => {
      cy.visit("/store/index.html");
      cy.wait("@geoDetection");

      cy.visit("/store/cart.html");

      cy.intercept("POST", "**/api/quote", {
        statusCode: 200,
        body: {
          calculationId: "calc-lock",
          subtotal: 2500,
          shipping: 1000,
          tax: 0,
          total: 3500,
          currency: "USD",
          taxIncluded: false,
        },
      }).as("quoteLock");

      cy.get("#shipping-country").select("US");
      cy.wait("@quoteLock");

      cy.get("#terms-checkbox").check();

      // Mock checkout (delay to see lock state)
      cy.intercept("POST", "**/api/checkout", {
        statusCode: 200,
        delay: 500,
        body: { sessionUrl: "https://checkout.stripe.com/session/test" },
      }).as("checkoutDelay");

      cy.get("#checkout-btn").click();

      // Country selector should be disabled during checkout
      cy.get("#shipping-country").should("be.disabled");
    });
  });

  describe("Error Handling", () => {
    it("should handle quote fetch failure gracefully", () => {
      cy.visit("/store/index.html");
      cy.wait("@geoDetection");

      cy.visit("/store/cart.html");

      cy.intercept("POST", "**/api/quote", {
        statusCode: 500,
        body: { error: "Failed to calculate quote" },
      }).as("quoteError");

      cy.get("#shipping-country").select("DE");
      cy.wait("@quoteError");

      // Error message should display
      cy.get("#quote-error").should("be.visible");

      // Order summary should be hidden
      cy.get("#summary-content").should("not.be.visible");
    });

    it("should allow retry after quote failure", () => {
      cy.visit("/store/index.html");
      cy.wait("@geoDetection");

      cy.visit("/store/cart.html");

      // First attempt fails
      cy.intercept("POST", "**/api/quote", {
        statusCode: 500,
        body: { error: "Failed" },
      }).as("quoteError");

      cy.get("#shipping-country").select("DE");
      cy.wait("@quoteError");

      // Second attempt succeeds
      cy.intercept("POST", "**/api/quote", {
        statusCode: 200,
        body: {
          calculationId: "calc-retry",
          subtotal: 2500,
          shipping: 1500,
          tax: 475,
          total: 4475,
          currency: "EUR",
          taxIncluded: false,
        },
      }).as("quoteSuccess");

      cy.get("#shipping-country").select("GB");
      cy.wait("@quoteSuccess");

      // Should show summary
      cy.get("#summary-content").should("be.visible");
    });
  });
});
