// ***********************************************************
// Global configuration and custom commands for the e2e suite.
// Loaded automatically before every spec in cypress/e2e.
// ***********************************************************

/* global cy */
/* eslint-disable no-undef */

// Shipping cost (cents) returned by the default calculate-shipping mock
const SHIPPING_COSTS = {
  US: 999,
  CA: 1500,
  GB: 1200,
  AU: 2500,
  DE: 1400,
};
const DEFAULT_SHIPPING_COST = 1500;

// Default API mocks so no spec ever reaches a live backend
beforeEach(() => {
  // POST /api/calculate-shipping  body: { country, items: [{ variant_id: number, quantity }] }
  cy.intercept("POST", "**/api/calculate-shipping", req => {
    const { country, items } = req.body || {};
    const validItems =
      Array.isArray(items) &&
      items.length > 0 &&
      items.every(item => Number.isInteger(item.variant_id) && Number.isInteger(item.quantity) && item.quantity > 0);

    if (!country || !validItems) {
      req.reply({ statusCode: 400, body: { error: "Each item must have a variant_id and quantity" } });
      return;
    }

    req.reply({
      statusCode: 200,
      body: {
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: SHIPPING_COSTS[country] || DEFAULT_SHIPPING_COST, currency: "usd" },
              display_name: "Standard Shipping",
            },
          },
        ],
      },
    });
  }).as("calculateShipping");

  // Keep Google Analytics (loaded after cookie consent) off the network
  cy.intercept("GET", "https://www.googletagmanager.com/**", { statusCode: 200, body: "" }).as("googleAnalytics");
});

/**
 * Visit a page with localStorage pre-seeded.
 * - consent: value for "cookie_consent" ("declined" by default so the banner never covers the page;
 *   pass null to leave it unset)
 * - cart: array of { productKey, color, size, quantity } stored as "kots_cart"
 */
Cypress.Commands.add("visitWith", (path, { consent = "declined", cart, ...options } = {}) => {
  cy.visit(path, {
    ...options,
    onBeforeLoad(win) {
      if (consent) win.localStorage.setItem("cookie_consent", consent);
      if (cart) win.localStorage.setItem("kots_cart", JSON.stringify(cart));
      if (options.onBeforeLoad) options.onBeforeLoad(win);
    },
  });
});

// Choose a colour/size/quantity on the product page (product must already be loaded)
Cypress.Commands.add("chooseVariant", ({ color, size, quantity } = {}) => {
  if (color) cy.get("[data-testid='color-select']").select(color);
  cy.get("[data-testid='size-select'] option").should("have.length.greaterThan", 1);
  if (size) {
    cy.get("[data-testid='size-select']").select(size);
  } else {
    cy.get("[data-testid='size-select'] option")
      .eq(1)
      .then($opt => cy.get("[data-testid='size-select']").select($opt.val()));
  }
  if (quantity) cy.get("#quantity").clear().type(String(quantity));
});

// Select a shipping country on the cart page and wait for the estimate to settle
Cypress.Commands.add("selectShippingCountry", (countryCode = "US") => {
  cy.get("#shipping-country option").should("have.length.greaterThan", 1);
  cy.get("#shipping-country").select(countryCode);
  cy.wait("@calculateShipping");
  cy.get("#shipping-estimate").should("not.have.text", "Calculating...");
});

// Assert an <img> actually loaded (not just that it has a src). Scrolls it into view so lazy
// images load. fileName (optional) is matched against the decoded src.
Cypress.Commands.add("shouldShowImage", { prevSubject: true }, ($img, fileName) => {
  cy.wrap($img)
    .scrollIntoView()
    .should($el => {
      const img = $el[0];
      if (fileName) expect(decodeURI(img.currentSrc || img.src), "image src").to.include(fileName);
      expect(img.complete, "image finished loading").to.eq(true);
      expect(img.naturalWidth, "image width").to.be.greaterThan(0);
    });
});

Cypress.Commands.add("acceptTerms", () => {
  cy.get("#terms-checkbox").check();
});

// Scroll targets to the centre so the sticky navbar never covers them
Cypress.config("scrollBehavior", "center");

// Ignore cross-origin "Script error." noise from CDN resources (Bootstrap, Font Awesome)
Cypress.on("uncaught:exception", err => {
  if (err.message.includes("Script error")) {
    return false;
  }
  return true;
});

// Hide fetch/XHR requests in the Command Log
const app = window.top;

if (!app.document.head.querySelector("[data-hide-command-log-request]")) {
  const style = app.document.createElement("style");
  style.innerHTML = ".command-name-request, .command-name-xhr { display: none }";
  style.setAttribute("data-hide-command-log-request", "");

  app.document.head.appendChild(style);
}
