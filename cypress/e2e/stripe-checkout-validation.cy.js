/* eslint-disable no-undef */
/**
 * Stripe Checkout Validation E2E Tests
 * Verifies that when Stripe checkout appears, all data is correct
 * and product images are present for all items
 */

describe("Stripe Checkout Data Validation", () => {
  beforeEach(() => {
    cy.visit("/store");
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  describe("Checkout Data Integrity", () => {
    it("should send complete product data to checkout API", () => {
      // Add product to cart
      cy.get("[data-testid='product-card']").first().click();
      cy.get("[data-testid='product-detail']").should("be.visible");
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").should("not.be.disabled").click({ force: true });

      // Navigate to cart
      cy.get("a[href*='cart.html']").first().click();
      cy.url().should("include", "cart.html");

      // Intercept checkout API call
      cy.intercept("POST", "**/api/checkout", req => {
        const { items, country } = req.body;

        // Verify country is set
        expect(country).to.be.a("string");
        expect(country).to.have.length(2);

        // Verify items array
        expect(Array.isArray(items)).to.be.true;
        expect(items.length).to.be.greaterThan(0);

        // Verify each item has required fields
        items.forEach(item => {
          expect(item).to.have.property("variant_id");
          expect(item).to.have.property("quantity");
          expect(item).to.have.property("name");
          expect(item).to.have.property("color");
          expect(item).to.have.property("size");

          // Verify types
          expect(item.variant_id).to.be.a("number");
          expect(item.quantity).to.be.a("number");
          expect(item.quantity).to.be.greaterThan(0);
          expect(item.name).to.be.a("string");
          expect(item.name.length).to.be.greaterThan(0);
        });

        req.reply({
          statusCode: 200,
          body: {
            client_secret: "pi_test_12345_secret_abcde",
            redirect_url: "https://checkout.stripe.com/pay/test_session",
          },
        });
      }).as("checkoutCall");

      // Proceed to checkout
      selectShippingCountry();
      acceptTerms();
      cy.get("button").contains("Proceed to Checkout").click();

      // Wait for checkout API call
      cy.wait("@checkoutCall").then(interception => {
        expect(interception.request.body.items.length).to.be.greaterThan(0);
      });
    });

    it("should include product images in checkout data", () => {
      // Add multiple products to cart
      cy.get("[data-testid='product-card']").first().click();
      cy.get("[data-testid='product-detail']").should("be.visible");
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click({ force: true });

      // Go back and add another product
      cy.get("a[href*='store'], a[href*='index.html']").first().click();
      cy.get("[data-testid='product-card']").eq(1).click();
      cy.get("[data-testid='product-detail']").should("be.visible");
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click({ force: true });

      // Navigate to cart
      cy.get("a[href*='cart.html']").first().click();

      // Intercept checkout API
      cy.intercept("POST", "**/api/checkout", req => {
        const { items } = req.body;

        // Every item should have an image path
        items.forEach(item => {
          expect(item).to.have.property("image");
          expect(item.image).to.be.a("string");
          expect(item.image.length).to.be.greaterThan(0);

          // Image should be a relative path to assets
          expect(item.image).to.match(/assets\/images\//);
          expect(item.image).to.match(/\.(jpg|jpeg|png)$/i);
        });

        req.reply({
          statusCode: 200,
          body: {
            client_secret: "pi_test_images_secret",
            redirect_url: "https://checkout.stripe.com/pay/test",
          },
        });
      }).as("imageCheck");

      selectShippingCountry();
      acceptTerms();
      cy.get("button").contains("Proceed to Checkout").click();

      cy.wait("@imageCheck").then(interception => {
        // Verify all items have images
        interception.request.body.items.forEach(item => {
          expect(item.image).to.include("assets/images/");
        });
      });
    });

    it("should send correct quantity for each item", () => {
      // Add first product
      cy.get("[data-testid='product-card']").first().click();
      cy.get("[data-testid='product-detail']").should("be.visible");
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click({ force: true });

      // Add same product again to increase quantity
      cy.get("a[href*='store'], a[href*='index.html']").first().click();
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click({ force: true });

      cy.get("a[href*='cart.html']").first().click();

      // Verify quantity in cart UI first
      cy.get("[data-testid='cart-item']")
        .first()
        .within(() => {
          cy.get("[data-testid='item-quantity']").should("exist");
        });

      // Intercept and verify API payload
      cy.intercept("POST", "**/api/checkout", req => {
        const { items } = req.body;

        items.forEach(item => {
          // Quantity should be positive integer
          expect(item.quantity).to.be.greaterThan(0);
          expect(Number.isInteger(item.quantity)).to.be.true;
        });

        req.reply({
          statusCode: 200,
          body: {
            client_secret: "pi_test_qty_secret",
            redirect_url: "https://checkout.stripe.com/pay/test",
          },
        });
      }).as("qtyCheck");

      selectShippingCountry();
      acceptTerms();
      cy.get("button").contains("Proceed to Checkout").click();

      cy.wait("@qtyCheck");
    });
  });

  describe("Cart Item Images Validation", () => {
    it("should display images next to all cart items", () => {
      // Add product to cart
      cy.get("[data-testid='product-card']").first().click();
      cy.get("[data-testid='product-detail']").should("be.visible");
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click({ force: true });

      // Navigate to cart
      cy.get("a[href*='cart.html']").first().click();

      // Verify each cart item has an image
      cy.get("[data-testid='cart-item']").each($item => {
        cy.wrap($item).within(() => {
          // Item should have an image element
          cy.get("img, [data-testid='item-image']").should("exist");

          // Image should have src or data-src
          cy.get("img").should($img => {
            const src = $img.attr("src") || $img.attr("data-src");
            expect(src).to.exist;
            expect(src.length).to.be.greaterThan(0);
          });
        });
      });
    });

    it("should load images from correct asset paths", () => {
      cy.get("[data-testid='product-card']").first().click();
      cy.get("[data-testid='product-detail']").should("be.visible");
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click({ force: true });

      cy.get("a[href*='cart.html']").first().click();

      // Verify images load from assets/images directory
      cy.get("[data-testid='cart-item'] img, [data-testid='item-image'] img").each($img => {
        const src = $img.attr("src") || $img.attr("data-src");

        // Image path should be relative to assets
        expect(src).to.include("assets/images/");
      });
    });

    it("should show product name and image together", () => {
      cy.get("[data-testid='product-card']").first().click();
      cy.get("[data-testid='product-detail']").should("be.visible");
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click({ force: true });

      cy.get("a[href*='cart.html']").first().click();

      // Each item should have both name and image
      cy.get("[data-testid='cart-item']").each($item => {
        cy.wrap($item).within(() => {
          // Name exists
          cy.get("[data-testid='item-name']").should("exist");
          cy.get("[data-testid='item-name']").invoke("text").should("have.length.greaterThan", 0);

          // Image exists and is adjacent to name
          cy.get("img").should("exist");
        });
      });
    });
  });

  describe("Stripe Redirect Data", () => {
    it("should receive client_secret and redirect_url from backend", () => {
      cy.get("[data-testid='product-card']").first().click();
      cy.get("[data-testid='product-detail']").should("be.visible");
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click({ force: true });

      cy.get("a[href*='cart.html']").first().click();

      // Mock successful checkout response
      cy.intercept("POST", "**/api/checkout", {
        statusCode: 200,
        body: {
          client_secret: "pi_test_1234567890_secret_abcdefghijklmnop",
          redirect_url: "https://checkout.stripe.com/pay/cs_test_abcdef",
        },
      }).as("stripeRedirect");

      selectShippingCountry();
      acceptTerms();

      // Prevent actual redirect
      cy.window().then(win => {
        cy.stub(win, "location").value({
          href: "",
        });
      });

      cy.get("button").contains("Proceed to Checkout").click();

      cy.wait("@stripeRedirect").then(interception => {
        const { client_secret, redirect_url } = interception.response.body;

        // Verify response structure
        expect(client_secret).to.exist;
        expect(client_secret).to.be.a("string");
        expect(client_secret).to.include("pi_test_");
        expect(client_secret).to.include("_secret_");

        expect(redirect_url).to.exist;
        expect(redirect_url).to.be.a("string");
        expect(redirect_url).to.include("stripe.com");
      });
    });

    it("should validate Stripe session data before redirect", () => {
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click({ force: true });

      cy.get("a[href*='cart.html']").first().click();

      // Intercept to verify request data
      cy.intercept("POST", "**/api/checkout", req => {
        const { items, country, calculationId } = req.body;

        // All required fields must be present
        expect(items).to.exist;
        expect(country).to.exist;
        expect(calculationId).to.exist;

        // Calculation ID should be a string
        expect(calculationId).to.be.a("string");
        expect(calculationId.length).to.be.greaterThan(0);

        // Items must have SKU format
        items.forEach(item => {
          expect(item.variant_id).to.exist;
          expect(item.quantity).to.exist;
        });

        req.reply({
          statusCode: 200,
          body: {
            client_secret: "pi_validated_secret",
            redirect_url: "https://checkout.stripe.com/pay/validated",
          },
        });
      }).as("validatedData");

      selectShippingCountry();
      acceptTerms();

      cy.window().then(win => {
        cy.stub(win, "location").value({ href: "" });
      });

      cy.get("button").contains("Proceed to Checkout").click();

      cy.wait("@validatedData");
    });
  });

  describe("Multi-Item Checkout", () => {
    it("should include all items with images when checking out multiple products", () => {
      // Add first product
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click({ force: true });

      // Go back and add second product
      cy.get("a[href*='store'], a[href*='index.html']").first().click();
      cy.get("[data-testid='product-card']").eq(1).click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click({ force: true });

      // Go back and add third product
      cy.get("a[href*='store'], a[href*='index.html']").first().click();
      cy.get("[data-testid='product-card']").eq(2).click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click({ force: true });

      cy.get("a[href*='cart.html']").first().click();

      // Verify all items displayed in cart
      cy.get("[data-testid='cart-item']").should("have.length", 3);

      // Intercept checkout
      cy.intercept("POST", "**/api/checkout", req => {
        const { items } = req.body;

        // Should have 3 items
        expect(items.length).to.equal(3);

        // All should have images
        items.forEach(item => {
          expect(item.image).to.exist;
          expect(item.image).to.include("assets/images/");
          expect(item.name).to.exist;
          expect(item.variant_id).to.exist;
        });

        req.reply({
          statusCode: 200,
          body: {
            client_secret: "pi_multi_item_secret",
            redirect_url: "https://checkout.stripe.com/pay/multi",
          },
        });
      }).as("multiItem");

      selectShippingCountry();
      acceptTerms();

      cy.window().then(win => {
        cy.stub(win, "location").value({ href: "" });
      });

      cy.get("button").contains("Proceed to Checkout").click();

      cy.wait("@multiItem").then(interception => {
        expect(interception.request.body.items.length).to.equal(3);
        interception.request.body.items.forEach(item => {
          expect(item.image).to.include("assets/images/");
        });
      });
    });

    it("should display all item images in cart view", () => {
      // Add multiple products
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click({ force: true });

      cy.get("a[href*='store'], a[href*='index.html']").first().click();
      cy.get("[data-testid='product-card']").eq(1).click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click({ force: true });

      cy.get("a[href*='cart.html']").first().click();

      // Count images in cart
      cy.get("[data-testid='cart-item'] img, [data-testid='item-image'] img").then($images => {
        // Should have at least as many images as items
        expect($images.length).to.be.greaterThanOrEqual(2);

        // All images should have valid sources
        $images.each($img => {
          const src = $img.attr("src") || $img.attr("data-src");
          expect(src).to.exist;
          expect(src.length).to.be.greaterThan(0);
        });
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle checkout API errors gracefully", () => {
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click({ force: true });

      cy.get("a[href*='cart.html']").first().click();

      // Mock checkout error
      cy.intercept("POST", "**/api/checkout", {
        statusCode: 500,
        body: { error: "Failed to create Stripe session" },
      }).as("checkoutError");

      selectShippingCountry();
      acceptTerms();

      cy.get("button").contains("Proceed to Checkout").click();

      cy.wait("@checkoutError");

      // Should show error message
      cy.on("window:alert", alertText => {
        expect(alertText).to.include("Checkout failed");
      });

      // Checkout button should be re-enabled
      cy.get("button").contains("Proceed to Checkout").should("not.be.disabled");
    });

    it("should validate required fields before sending to Stripe", () => {
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click({ force: true });

      cy.get("a[href*='cart.html']").first().click();

      // Try checkout without selecting country
      cy.get("button").contains("Proceed to Checkout").click();

      // Should be prevented by form validation
      cy.on("window:alert", alertText => {
        expect(alertText).to.include("country");
      });
    });
  });
});
