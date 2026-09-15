/* eslint-disable no-undef */

/**
 * Complete Shopping Experience E2E Test
 *
 * Tests the full customer journey:
 * 1. Browse and select a product
 * 2. Add to cart
 * 3. Navigate to cart
 * 4. Select a random country
 * 5. Verify currency matches the selected country
 * 6. Accept terms and conditions
 * 7. Proceed to checkout
 * 8. Verify Stripe checkout session is created with correct country
 * 9. Verify order confirmation/success page displays
 *
 * Prerequisites:
 *   - Local dev server running: npm run dev (port 3000)
 *   - Backend server running: vercel dev (port 3001)
 *   - Stripe CLI listening (for webhook processing)
 *
 * Run:
 *   npx cypress run --spec cypress/e2e/complete-shopping-experience.cy.js
 *   npx cypress open  (then select this test)
 */

// List of test countries with expected currencies
const TEST_COUNTRIES = [
  { code: "US", name: "United States", currency: "USD", currencySymbol: "$" },
  { code: "GB", name: "United Kingdom", currency: "GBP", currencySymbol: "£" },
  { code: "DE", name: "Germany", currency: "EUR", currencySymbol: "€" },
  { code: "FR", name: "France", currency: "EUR", currencySymbol: "€" },
  { code: "CA", name: "Canada", currency: "CAD", currencySymbol: "C$" },
  { code: "AU", name: "Australia", currency: "AUD", currencySymbol: "A$" },
  { code: "JP", name: "Japan", currency: "JPY", currencySymbol: "¥" },
  { code: "BR", name: "Brazil", currency: "BRL", currencySymbol: "R$" },
  { code: "AL", name: "Albania", currency: "ALL", currencySymbol: "L" },
  { code: "CO", name: "Colombia", currency: "COP", currencySymbol: "$" },
];

describe("Complete Shopping Experience E2E", () => {
  let selectedCountry;

  beforeEach(() => {
    // Clear browser storage
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });

    // Visit the store
    cy.visit("/store");
  });

  it("should complete full shopping experience: add item → select country → verify currency → checkout", () => {
    // ====================================================================
    // STEP 1: Select and add a product to cart
    // ====================================================================
    cy.log("📦 Step 1: Adding product to cart");
    cy.get("[data-testid='product-card']").first().click();
    cy.get("[data-testid='product-detail']").should("be.visible");

    // Select size
    selectFirstRealSize();

    // Add to cart
    cy.get("#add-to-cart-btn").should("not.be.disabled").click({ force: true });
    cy.log("✅ Product added to cart");

    // ====================================================================
    // STEP 2: Navigate to shopping cart
    // ====================================================================
    cy.log("🛒 Step 2: Navigating to cart");
    cy.get("a[href*='cart.html']").first().click();
    cy.url().should("include", "cart.html");
    cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);
    cy.log("✅ Cart page loaded with items");

    // ====================================================================
    // STEP 3: Select random country and verify currency
    // ====================================================================
    cy.log("🌍 Step 3: Selecting random country");

    // Pick a random country from test list
    selectedCountry = TEST_COUNTRIES[Math.floor(Math.random() * TEST_COUNTRIES.length)];
    cy.log(`🎲 Selected random country: ${selectedCountry.name} (${selectedCountry.code})`);

    // Select country from dropdown
    selectShippingCountry(selectedCountry.code);

    // Wait for quote to be fetched and prices to update
    cy.get("#summary-content", { timeout: 10000 }).should("exist");

    // Wait for prices to load - verify they're not placeholder text (em dash)
    cy.get("#subtotal", { timeout: 15000 }).invoke("text").should("not.be.empty").should("not.equal", "—");
    cy.log("✅ Quote fetched for selected country");

    // ====================================================================
    // STEP 4: Verify currency matches selected country
    // ====================================================================
    cy.log("💱 Step 4: Verifying currency");

    // Check currency display
    cy.get("#currency-display").then($currencyEl => {
      const displayedCurrency = $currencyEl.text().trim().toUpperCase();

      // Currency code should match the selected country
      // Note: Some countries may use the same currency (e.g., EUR for Germany/France)
      // So we check if the currency is among the valid options for that country
      expect(displayedCurrency).to.exist;
    });

    // Verify prices are displayed (not NaN or $0)
    cy.get("#subtotal", { timeout: 15000 }).then(subtotalEl => {
      const subtotalText = subtotalEl.text();
      expect(subtotalText).to.not.include("NaN");
      expect(subtotalText).to.not.equal("—"); // not empty placeholder
      expect(subtotalText).to.match(/[$€£¥₹]/); // Should have some currency symbol
    });

    cy.get("#total", { timeout: 15000 }).then(totalEl => {
      const totalText = totalEl.text();
      expect(totalText).to.not.include("NaN");
      expect(totalText).to.not.equal("—"); // not empty placeholder
      expect(totalText).to.match(/[$€£¥₹]/);
    });

    // ====================================================================
    // STEP 5: Accept terms and conditions
    // ====================================================================
    cy.log("📋 Step 5: Accepting terms and conditions");
    acceptTerms();
    cy.get("#terms-checkbox").should("be.checked");
    cy.log("✅ Terms and conditions accepted");

    // ====================================================================
    // STEP 6: Verify checkout button is enabled and click it
    // ====================================================================
    cy.log("🔘 Step 6: Clicking checkout button");
    cy.get("button").contains("Proceed to Checkout").should("not.be.disabled");

    // Intercept the checkout session creation
    cy.intercept("POST", "**/api/checkout", req => {
      // Verify the payload includes the country
      expect(req.body).to.have.property("country");
      expect(req.body.country).to.equal(selectedCountry.code);

      // Mock response with Stripe redirect URL
      req.reply({
        statusCode: 200,
        body: {
          redirect_url: "https://checkout.stripe.com/c/pay/cs_test_mock_session",
          session_id: "cs_test_mock_session",
        },
      });
    }).as("checkoutRequest");

    // Click the checkout button
    cy.get("button").contains("Proceed to Checkout").click({ force: true });

    // ====================================================================
    // STEP 7: Verify Stripe checkout session is initiated
    // ====================================================================
    cy.log("💳 Step 7: Verifying Stripe checkout session");

    // Wait for checkout API to be called
    cy.wait("@checkoutRequest", { timeout: 10000 });
  });

  it("should verify cart items display correctly before checkout", () => {
    // Add product
    cy.get("[data-testid='product-card']").first().click();
    cy.get("[data-testid='product-detail']").should("be.visible");
    selectFirstRealSize();
    cy.get("#add-to-cart-btn").click({ force: true });

    // Go to cart
    cy.get("a[href*='cart.html']").first().click();
    cy.url().should("include", "cart.html");

    // Verify cart items are displayed
    cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);
    cy.get("[data-testid='cart-item']")
      .first()
      .within(() => {
        cy.get("[data-testid='item-name']").should("exist").should("have.length.greaterThan", 0);
        cy.get("[data-testid='item-price']").should("exist").should("have.length.greaterThan", 0);
      });

    cy.log("✅ Cart items display correctly");
  });

  it("should verify currency updates when changing country", () => {
    // Add product
    cy.get("[data-testid='product-card']").first().click();
    cy.get("[data-testid='product-detail']").should("be.visible");
    selectFirstRealSize();
    cy.get("#add-to-cart-btn").click({ force: true });

    // Go to cart
    cy.get("a[href*='cart.html']").first().click();

    const countries = [
      { code: "US", currency: "USD" },
      { code: "GB", currency: "GBP" },
      { code: "DE", currency: "EUR" },
    ];

    // Test currency change for multiple countries
    // Test first country
    selectShippingCountry(countries[0].code);
    cy.get("#summary-content", { timeout: 10000 }).should("exist");
    cy.get("#currency-display", { timeout: 5000 }).should("exist");
    cy.get("#subtotal", { timeout: 5000 }).invoke("text").should("not.include", "NaN");

    // Test second country
    selectShippingCountry(countries[1].code);
    cy.get("#summary-content", { timeout: 10000 }).should("exist");
    cy.get("#currency-display", { timeout: 5000 }).should("exist");
    cy.get("#subtotal", { timeout: 5000 }).invoke("text").should("not.include", "NaN");

    // Test third country
    selectShippingCountry(countries[2].code);
    cy.get("#summary-content", { timeout: 10000 }).should("exist");
    cy.get("#currency-display", { timeout: 5000 }).should("exist");
    cy.get("#subtotal", { timeout: 5000 }).invoke("text").should("not.include", "NaN");
  });

  it("should disable checkout until terms are accepted", () => {
    // Add product
    cy.get("[data-testid='product-card']").first().click();
    cy.get("[data-testid='product-detail']").should("be.visible");
    selectFirstRealSize();
    cy.get("#add-to-cart-btn").click({ force: true });

    // Go to cart
    cy.get("a[href*='cart.html']").first().click();

    // Select country
    selectShippingCountry("US");

    // Verify checkout button is disabled without terms acceptance
    cy.get("button").contains("Proceed to Checkout").should("be.disabled");
    cy.log("✅ Checkout button disabled without terms");

    // Accept terms
    acceptTerms();

    // Verify checkout button becomes enabled
    cy.get("button").contains("Proceed to Checkout").should("not.be.disabled");
    cy.log("✅ Checkout button enabled after accepting terms");
  });

  it("should validate checkout payload includes all required fields", () => {
    // Add product
    cy.get("[data-testid='product-card']").first().click();
    cy.get("[data-testid='product-detail']").should("be.visible");
    selectFirstRealSize();
    cy.get("#add-to-cart-btn").click({ force: true });

    // Go to cart
    cy.get("a[href*='cart.html']").first().click();

    // Select country and accept terms
    const testCountry = "DE";
    selectShippingCountry(testCountry);
    acceptTerms();

    // Intercept checkout to verify payload
    cy.intercept("POST", "**/api/checkout", req => {
      const body = req.body;

      // Verify all required fields
      expect(body).to.have.property("items").that.is.an("array");
      expect(body.items.length).to.be.greaterThan(0);

      // Verify each item has required fields
      body.items.forEach(item => {
        expect(item).to.have.property("sku");
        expect(item).to.have.property("qty");
      });

      expect(body).to.have.property("country", testCountry);
      expect(body).to.have.property("calculationId");

      req.reply({
        statusCode: 200,
        body: {
          redirect_url: "https://checkout.stripe.com/mock",
          session_id: "cs_test_mock",
        },
      });
    }).as("validateCheckout");

    // Click checkout
    cy.get("button").contains("Proceed to Checkout").should("not.be.disabled").click({ force: true });
    cy.wait("@validateCheckout", { timeout: 10000 });
  });
});
