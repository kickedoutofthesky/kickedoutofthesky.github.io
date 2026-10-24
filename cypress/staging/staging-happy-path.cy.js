/* global cy, Cypress */
/**
 * Integration Tests - Live staging API (no mocks)
 *
 * Calls https://api-staging.kickedoutofthesky.com for real. Lives outside
 * cypress/e2e so the default suite never hits the live API.
 *
 * Run: npm run dev:staging, then npm run test:e2e:staging
 *
 * The checkout test builds a multi-product cart, checks every line (incl. its image) on the Stripe page,
 * and completes a real Stripe test-mode payment (card 4242) on staging.
 *
 * Prices aren't hard-coded because Printful rates change; the UI is checked
 * against whatever the API returns.
 */

const STAGING_API = "https://api-staging.kickedoutofthesky.com";

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

describe("Integration Tests - Live staging API (no mocks)", () => {
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
    // Two products, one of them in two sizes, with quantities above 1
    const ORDER = [
      {
        productKey: "product_425342399",
        color: "Black",
        size: "XS",
        quantity: 2,
        variantId: 5246069560,
        unitCents: 2500,
        name: "Unisex Tee w/ Color Block Graphic - Black / XS",
        image: "Unisex Tee w Color Block Graphic - Front - Black.jpg",
      },
      {
        productKey: "product_425342399",
        color: "Black",
        size: "L",
        quantity: 1,
        variantId: 5246069569,
        unitCents: 2500,
        name: "Unisex Tee w/ Color Block Graphic - Black / L",
        image: "Unisex Tee w Color Block Graphic - Front - Black.jpg",
      },
      {
        productKey: "product_421115395",
        color: "Satin",
        size: "3x3",
        quantity: 3,
        variantId: 5209549630,
        unitCents: 550,
        name: "Die-cut Sticker w/ Text",
        image: "Die-cut Sticker w Text - Front - Satin.jpg",
      },
    ];
    const LINES = ORDER.map(line => ({ ...line, total: formatCents(line.unitCents * line.quantity) }));
    const TOTAL_QUANTITY = ORDER.reduce((sum, line) => sum + line.quantity, 0);
    const SUBTOTAL = formatCents(ORDER.reduce((sum, line) => sum + line.unitCents * line.quantity, 0));

    it("checks out a multi-product cart, shows every line on Stripe, pays with 4242 and shows the order", () => {
      // Desktop width so Stripe shows the order summary expanded
      cy.viewport(1280, 900);

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

      // Build the cart through the product pages
      cy.visit("/store/cart.html?api=staging", {
        onBeforeLoad(win) {
          win.localStorage.setItem("kots_cart", "[]");
          win.localStorage.removeItem("selectedShippingCountry");
        },
      });
      ORDER.forEach(({ productKey, color, size, quantity }) => {
        cy.visit(`/store/product.html?key=${productKey}`);
        cy.get("[data-testid='product-title']").should("be.visible");
        cy.chooseVariant({ color, size, quantity });
        cy.get("#add-to-cart-btn").click();
        cy.location("pathname").should("eq", "/store/cart.html");
      });

      cy.window().its("__API_URL__").should("eq", STAGING_API);
      cy.get("[data-testid='cart-item']").should("have.length", ORDER.length);
      cy.get("[data-testid='cart-count']").should("have.text", String(TOTAL_QUANTITY));
      cy.get("[data-testid='cart-subtotal']").should("have.text", `${SUBTOTAL} USD`);
      LINES.forEach(({ quantity, image }, i) => {
        cy.get("[data-testid='cart-item']")
          .eq(i)
          .find("[data-testid='quantity-input']")
          .should("have.value", String(quantity));
        cy.get("[data-testid='cart-item']").eq(i).find("img").shouldShowImage(image);
      });

      const expectedItems = ORDER.map(({ variantId, quantity }) => ({ variantId: String(variantId), quantity }));

      cy.get("#shipping-country").select("US");
      cy.wait("@shipping", { timeout: 30000 }).then(({ request, response }) => {
        expect(request.body.items).to.deep.equal(
          ORDER.map(({ variantId, quantity }) => ({ variant_id: variantId, quantity }))
        );
        expect(response.statusCode).to.eq(200);
      });
      cy.get("#shipping-estimate")
        .invoke("text")
        .should("match", /^\$\d+\.\d{2}/);

      cy.get("#terms-checkbox").check({ force: true });
      cy.get("#checkout-btn").click();

      cy.wait("@checkout", { timeout: 30000 }).then(({ request, response }) => {
        expect(request.body).to.deep.equal({ items: expectedItems, country: "US", termsAccepted: true });
        expect(response.statusCode).to.eq(200);
        expect(response.body.url).to.match(/^https:\/\/checkout\.stripe\.com\/c\/pay\/cs_test_/);
      });

      cy.origin(
        "https://checkout.stripe.com",
        { args: { lines: LINES, subtotal: SUBTOTAL } },
        ({ lines, subtotal }) => {
          // Stripe lists one line per cart line, with the cart quantities and totals
          cy.get(".LineItem", { timeout: 30000 }).should("have.length", lines.length);
          // Stripe proxies product images; the original URL is hex-encoded in a path segment after cloudfront.net
          const originalImageUrl = src => {
            const parts = decodeURIComponent(src).split("/");
            const hex = parts[parts.findIndex(part => part.endsWith("cloudfront.net")) + 2] || "";
            return decodeURI((hex.match(/../g) || []).map(h => String.fromCharCode(parseInt(h, 16))).join(""));
          };
          lines.forEach(({ name, quantity, total, image }, i) => {
            cy.get(".LineItem")
              .eq(i)
              .within(() => {
                cy.get("[data-testid='line-item-product-name']").should("contain", name);
                cy.get("[data-testid='line-item-quantity']").should("have.text", `Qty ${quantity}`);
                cy.get("[data-testid='line-item-total-amount']").should("have.text", total);
                cy.get("[data-testid='line-item-image'] img")
                  .scrollIntoView()
                  .should($img => {
                    const img = $img[0];
                    expect(originalImageUrl(img.currentSrc || img.src), "image sent to Stripe").to.eq(
                      `https://www.kickedoutofthesky.com/store/assets/images/${image}`
                    );
                    expect(img.complete, "image finished loading").to.eq(true);
                    expect(img.naturalWidth, "image width").to.be.greaterThan(0);
                  });
              });
          });
          cy.get("[data-testid='order-details-footer-subtotal-amount']").should("have.text", subtotal);

          cy.get("#email").type("staging-test@example.com");

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
        }
      );

      cy.location("pathname", { timeout: 60000 }).should("eq", "/store/success.html");
      cy.location("search").should("match", /session_id=cs_test_/);

      cy.wait("@orderDetails", { timeout: 30000 }).its("response.statusCode").should("eq", 200);
      cy.contains("h1", "Order Successful");
      cy.get("#order-items > div").should("have.length", LINES.length);
      LINES.forEach(({ name, quantity, image }, i) => {
        cy.get("#order-items > div").eq(i).should("contain", name).and("contain", `Qty: ${quantity}`);
        cy.get("#order-items > div").eq(i).find("img").shouldShowImage(image);
      });
      cy.get("#summary-subtotal").should("have.text", SUBTOTAL);
      cy.get("#customer-email").should("have.text", "staging-test@example.com");
      cy.get("#shipping-address").should("contain", "123 Main St").and("contain", "Dallas");
      cy.get("#summary-total")
        .invoke("text")
        .should("match", /^\$\d+\.\d{2}$/);
      cy.window().its("localStorage").invoke("getItem", "kots_cart").should("eq", "[]");
    });
  });
});
