const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(_on, _config) {
      // implement node event listeners here
    },
    specPattern: "cypress/e2e/**/*.cy.js",
    // Required for cy.origin() to interact with Stripe checkout page
    experimentalSessionAndOrigin: true,
    // Allow cross-origin navigation to checkout.stripe.com
    chromeWebSecurity: false,
  },
});
