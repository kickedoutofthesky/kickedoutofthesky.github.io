/* global cy, Cypress */
/**
 * Integration Tests - Live staging API (no mocks)
 *
 * Calls https://api-staging.kickedoutofthesky.com for real. Skipped unless
 * CYPRESS_API_TARGET=staging, so the default suite never hits the live API.
 *
 * Run: CYPRESS_API_TARGET=staging npx cypress run --spec "cypress/e2e/integration/*.cy.js" --browser chrome
 *
 * The checkout test completes a real Stripe test-mode payment (card 4242) on staging.
 *
 * Prices aren't hard-coded because Printful rates change; the UI is checked
 * against whatever the API returns.
 */

const STAGING_API = "https://api-staging.kickedoutofthesky.com";
const runLive = Cypress.env("API_TARGET") === "staging";

// Unisex Tee w/ Color Block Graphic - Black / XS
const TEE = { productKey: "product_425342399", color: "Black", size: "XS", variantId: 5246069560 };

const formatCents = cents => `$${(cents / 100).toFixed(2)}`;

const visitCartWith = quantity => {
  // ?api=staging forces the staging API regardless of which port serves the frontend
  cy.visit("/store/cart.html?api=staging", {
    onBeforeLoad(win) {
      win.localStorage.setItem(
        "kots_cart",
        JSON.stringify([{ productKey: TEE.productKey, color: TEE.color, size: TEE.size, quantity }])
      );
      win.localStorage.removeItem("selectedShippingCountry");
    },
  });
  cy.window().its("__API_URL__").should("eq", STAGING_API);
};

const estimateShipping = (country, quantity) => {
  visitCartWith(quantity);
  cy.get("#shipping-country").select(country);
  return cy.wait("@shipping", { timeout: 30000 });
};

(runLive ? describe : describe.skip)("Integration Tests - Live staging API (no mocks)", () => {
  beforeEach(() => {
    // Registered after the global mocks in cypress/support/e2e.js, so these take
    // precedence and let the requests through to the real API
    cy.intercept("POST", "**/api/calculate-shipping", req => req.continue()).as("shipping");
    cy.intercept("POST", "**/api/create-checkout-session", req => req.continue()).as("checkout");
  });

  describe("POST /api/calculate-shipping", () => {
    it("sends the cart items and shows the cheapest option returned", () => {
      estimateShipping("US", 2).then(({ request, response }) => {
        expect(request.body).to.deep.equal({
          country: "US",
          items: [{ variant_id: TEE.variantId, quantity: 2 }],
        });
        expect(response.statusCode).to.eq(200);

        const amount = response.body.shipping_options[0].shipping_rate_data.fixed_amount.amount;
        expect(amount).to.be.a("number").and.be.greaterThan(0);
        cy.get("#shipping-estimate").should("contain", formatCents(amount));
      });
    });

    it("prices the whole cart, not a single item", () => {
      estimateShipping("PT", 1).then(({ response: single }) => {
        const singleAmount = single.body.shipping_options[0].shipping_rate_data.fixed_amount.amount;

        estimateShipping("PT", 5).then(({ response: multiple }) => {
          const multipleAmount = multiple.body.shipping_options[0].shipping_rate_data.fixed_amount.amount;
          expect(multipleAmount).to.be.greaterThan(singleAmount);
          cy.get("#shipping-estimate").should("contain", formatCents(multipleAmount));
        });
      });
    });

    it("shows a can't-ship message for a disabled country without blocking checkout", () => {
      estimateShipping("RU", 1).its("response.statusCode").should("eq", 400);
      cy.get("#shipping-estimate").should("have.text", "We can't ship to this country.");

      cy.get("#terms-checkbox").check({ force: true });
      cy.get("#checkout-btn").should("not.be.disabled");
    });
  });

  describe("Checkout with Stripe test card", () => {
    it("pays with 4242 card and shows the order on the success page", () => {
      cy.intercept("GET", "**/api/order-details*", req => req.continue()).as("orderDetails");

      // Stripe's success_url points at the live site; serve the success page under test instead
      cy.intercept({ method: "GET", url: /^https:\/\/(www\.)?kickedoutofthesky\.com\/store\/success\.html/ }, req => {
        const query = req.url.slice(req.url.indexOf("?"));
        req.redirect(`${Cypress.config("baseUrl")}/store/success.html${query}`);
      }).as("successRedirect");

      // Stripe's wallet buttons (Apple/Google Pay) can't mount inside Cypress's frame; the card form still works
      cy.origin("https://checkout.stripe.com", () => {
        cy.on("uncaught:exception", err => !err.message.includes("expressCheckout Element"));
      });

      visitCartWith(1);
      cy.get("#shipping-country").select("US");
      cy.get("#terms-checkbox").check({ force: true });
      cy.get("#checkout-btn").click();

      cy.wait("@checkout", { timeout: 30000 }).then(({ request, response }) => {
        expect(request.body).to.deep.equal({
          items: [{ variantId: String(TEE.variantId), quantity: 1 }],
          country: "US",
          termsAccepted: true,
        });
        expect(response.statusCode).to.eq(200);
        expect(response.body.url).to.match(/^https:\/\/checkout\.stripe\.com\/c\/pay\/cs_test_/);
      });

      cy.origin("https://checkout.stripe.com", () => {
        cy.get("#email", { timeout: 30000 }).type("staging-test@example.com");

        cy.get("body").then($body => {
          const manualEntry = $body.find("button:contains('Enter address manually')");
          if (manualEntry.length) cy.wrap(manualEntry).click();
        });
        cy.get("#shippingName").type("Staging Test");
        cy.get("#shippingAddressLine1").type("123 Main St");
        cy.get("#shippingLocality").type("Dallas");
        cy.get("#shippingPostalCode").type("75201");
        cy.get("#shippingAdministrativeArea").select("TX");

        cy.get("#cardNumber").type("4242424242424242");
        cy.get("#cardExpiry").type("1234");
        cy.get("#cardCvc").type("123");

        // Don't save the test details with Stripe Link
        cy.get("body").then($body => {
          if ($body.find("#enableStripePass").length) {
            cy.get("#enableStripePass").uncheck({ force: true });
            cy.get("#enableStripePass").should("not.be.checked");
          }
        });

        cy.get("[data-testid=hosted-payment-submit-button]").click();
      });

      cy.location("pathname", { timeout: 60000 }).should("eq", "/store/success.html");
      cy.location("search").should("match", /session_id=cs_test_/);

      cy.wait("@orderDetails", { timeout: 30000 }).its("response.statusCode").should("eq", 200);
      cy.contains("h1", "Order Successful");
      cy.get("#order-items").should("contain", "Unisex Tee w/ Color Block Graphic");
      cy.get("#customer-email").should("have.text", "staging-test@example.com");
      cy.get("#shipping-address").should("contain", "123 Main St").and("contain", "Dallas");
      cy.get("#summary-total")
        .invoke("text")
        .should("match", /^\$\d+\.\d{2}$/);
    });
  });
});
