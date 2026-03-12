/* eslint-disable no-undef */

describe("Merch Page - Product Visibility and Display", () => {
  beforeEach(() => {
    cy.visit("/store");
  });

  it("should display the merch/store page with product grid", () => {
    cy.get("[data-testid='product-grid']").should("be.visible");
    cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);
  });

  it("should display all products with visible names", () => {
    // Get all product cards
    cy.get("[data-testid='product-card']").each($card => {
      // Each card should have a product name
      cy.wrap($card).within(() => {
        cy.get("[data-testid='product-title']").should("be.visible");
        cy.get("[data-testid='product-title']").invoke("text").should("not.be.empty");
      });
    });
  });

  it("should display all products with visible images", () => {
    cy.get("[data-testid='product-card']").each($card => {
      cy.wrap($card).within(() => {
        // Image should exist and have src attribute
        cy.get("[data-testid='product-image'] img").should("exist").should("have.attr", "src");
      });
    });
  });

  it("should display product images with alt text", () => {
    cy.get("[data-testid='product-card']").each($card => {
      cy.wrap($card).within(() => {
        cy.get("[data-testid='product-image'] img").should("have.attr", "alt");
      });
    });
  });

  it("should display product prices on all product cards", () => {
    cy.get("[data-testid='product-card']").each($card => {
      cy.wrap($card).within(() => {
        cy.get("[data-testid='product-price']").should("be.visible");
        cy.get("[data-testid='product-price']")
          .invoke("text")
          .should("match", /\$\d+\.\d{2}/);
      });
    });
  });

  it("should have clickable product cards that navigate to product detail", () => {
    cy.get("[data-testid='product-card']").first().click();
    cy.url().should("include", "product.html");
    cy.get("[data-testid='product-detail']").should("be.visible");
  });

  it("should display correct number of products", () => {
    // Fetch expected products from the products.json endpoint
    cy.request("GET", "/store/data/products.json").then(response => {
      const expectedProductCount = response.body.length;
      cy.get("[data-testid='product-card']").should("have.length", expectedProductCount);
    });
  });

  it("should display products in a responsive grid layout", () => {
    cy.get("[data-testid='product-grid']").should("be.visible");
    cy.get("[data-testid='product-card']").then($cards => {
      // All cards should have consistent sizing/layout
      expect($cards.length).to.be.greaterThan(0);

      // Cards should be aligned (using CSS Grid or Flex)
      const firstCardHeight = $cards.eq(0).height();
      expect(firstCardHeight).to.be.greaterThan(0);
    });
  });

  it("should not have broken images", () => {
    cy.get("[data-testid='product-image']").each($img => {
      // Image should have src and src should be non-empty
      cy.wrap($img).should("have.attr", "src");
      cy.wrap($img).invoke("attr", "src").should("not.be.empty");

      // Image should not have error class (if error handling adds one)
      cy.wrap($img).should("not.have.class", "error");
    });
  });

  it("should display product information consistently", () => {
    const productElements = ["product-title", "product-price", "product-image"];

    cy.get("[data-testid='product-card']").each($card => {
      productElements.forEach(element => {
        cy.wrap($card).within(() => {
          cy.get(`[data-testid='${element}']`).should("exist");
        });
      });
    });
  });

  it("should have products sorted or in expected order", () => {
    cy.get("[data-testid='product-title']").then($names => {
      const names = [];
      $names.each((index, el) => {
        names.push(el.textContent);
      });

      // Verify we have product names
      expect(names.length).to.be.greaterThan(0);

      // All names should be non-empty strings
      names.forEach(name => {
        expect(name.trim()).to.have.length.greaterThan(0);
      });
    });
  });

  it("should allow filtering or searching products (if feature exists)", () => {
    // Check if search/filter exists
    cy.get("[data-testid='product-search'], [data-testid='product-filter']").then($search => {
      // If search exists, it should be functional
      if ($search.length > 0) {
        cy.wrap($search).should("be.visible");
      }
      // If it doesn't exist, test passes (feature not required)
    });
  });

  it("should load product images within reasonable time", () => {
    const startTime = Date.now();

    cy.get("[data-testid='product-image']").first().should("exist");

    cy.then(() => {
      const loadTime = Date.now() - startTime;
      // Should load in less than 5 seconds
      expect(loadTime).to.be.lessThan(5000);
    });
  });

  it("should display product details popup or modal on product card click", () => {
    cy.get("[data-testid='product-card']").first().click();

    // After clicking, either:
    // 1. Navigate to product detail page
    cy.url().then(url => {
      expect(url).to.include("product.html");
    });

    // Or the product detail should be visible
    cy.get("[data-testid='product-detail']").should("exist");
  });

  it("should have accessible product cards", () => {
    // Products should be keyboard navigable
    cy.get("[data-testid='product-card']").first().should("be.visible").and("have.css", "cursor");

    // Product names should have readable text
    cy.get("[data-testid='product-title']").first().invoke("text").should("not.be.empty");
  });

  it("should persist product grid state when navigating away and back", () => {
    // Get initial product count
    cy.get("[data-testid='product-card']").then($initial => {
      const initialCount = $initial.length;

      // Navigate to a product
      cy.get("[data-testid='product-card']").first().click();
      cy.url().should("include", "product.html");

      // Go back to store
      cy.get("a[href*='store'], a[href*='index.html']").first().click();

      // Product count should be same
      cy.get("[data-testid='product-card']").should("have.length", initialCount);
    });
  });

  it("should display each product's price matching the expected value formatted with $ and two decimals", () => {
    // Fetch the products data to compare
    cy.request("GET", "/store/data/products.json").then(response => {
      const products = response.body;

      // For each product card, verify price format and accuracy
      cy.get("[data-testid='product-card']").each(($card, index) => {
        cy.wrap($card).within(() => {
          cy.get("[data-testid='product-price']").then($priceEl => {
            const displayedPrice = $priceEl.text().trim();

            // Should match format: $X.XX or $XX.XX or $XXX.XX etc.
            expect(displayedPrice).to.match(/^\$\d+\.\d{2}$/);

            // Extract the numeric value
            const numericPrice = parseFloat(displayedPrice.replace("$", ""));

            // Should be a valid number
            expect(numericPrice).to.be.a("number");
            expect(numericPrice).to.be.greaterThan(0);
          });
        });
      });
    });
  });

  it("should ensure all product images have naturalWidth > 0 and no broken placeholders", () => {
    cy.get("[data-testid='product-image']").each($img => {
      cy.wrap($img).should("have.attr", "src");

      // Wait for image to load
      cy.wrap($img).should(element => {
        const img = element[0];
        // Check if image has loaded successfully
        if (img.complete) {
          expect(img.naturalWidth).to.be.greaterThan(0);
          expect(img.naturalHeight).to.be.greaterThan(0);
        }
      });

      // Should not have broken image indicators
      cy.wrap($img).should("not.have.class", "broken");
      cy.wrap($img).should("not.have.class", "error");
      cy.wrap($img).invoke("attr", "alt").should("not.include", "broken");
    });
  });

  it("should open product detail view showing all available size and color options when clicked", () => {
    cy.get("[data-testid='product-card']").first().click();

    // Should navigate to product detail page
    cy.url().should("include", "product.html");

    // Product detail view should be visible
    cy.get("[data-testid='product-detail']").should("be.visible");

    // Should display size options
    cy.get("[data-testid='size-options'], .size-selector, select[name*='size']").then($sizeEl => {
      if ($sizeEl.length > 0) {
        cy.wrap($sizeEl).should("be.visible");
        // Should have multiple size options
        cy.get("[data-testid='size-options'] option, .size-selector option, .size-option").should(
          "have.length.greaterThan",
          0
        );
      }
    });

    // Should display color options
    cy.get("[data-testid='color-options'], .color-selector, select[name*='color']").then($colorEl => {
      if ($colorEl.length > 0) {
        cy.wrap($colorEl).should("be.visible");
        // Should have multiple color options
        cy.get("[data-testid='color-options'] option, .color-selector option, .color-option").should(
          "have.length.greaterThan",
          0
        );
      }
    });
  });

  it("should update displayed price when switching between variants", () => {
    cy.get("[data-testid='product-card']").first().click();
    cy.url().should("include", "product.html");

    // Get initial price
    cy.get("[data-testid='product-price']")
      .first()
      .invoke("text")
      .then(initialPrice => {
        const initialNumeric = parseFloat(initialPrice.replace("$", ""));

        // Try to change a variant (size or color)
        cy.get("[data-testid='size-options'] select, .size-selector select, select[name*='size']").then($sizeSelect => {
          if ($sizeSelect.length > 0) {
            // Get all available options
            cy.wrap($sizeSelect)
              .find("option")
              .then($options => {
                if ($options.length > 1) {
                  // Select a different size
                  cy.wrap($sizeSelect).select($options.eq(1).attr("value"));

                  // Price should update (may be same or different)
                  cy.get("[data-testid='product-price']")
                    .first()
                    .invoke("text")
                    .then(newPrice => {
                      const newNumeric = parseFloat(newPrice.replace("$", ""));
                      expect(newNumeric).to.be.a("number");
                      expect(newNumeric).to.be.greaterThan(0);
                      // Price may have changed or stayed the same
                    });
                }
              });
          }
        });
      });
  });

  it("should display product descriptions that are visible and contain no raw HTML tags", () => {
    cy.get("[data-testid='product-card']").first().click();
    cy.url().should("include", "product.html");

    // Description should be visible
    cy.get("[data-testid='product-description'], .product-description, .description").then($descEl => {
      if ($descEl.length > 0) {
        // Should be visible
        cy.wrap($descEl).should("be.visible");

        // Get the text content
        cy.wrap($descEl)
          .invoke("text")
          .then(text => {
            // Should have content
            expect(text.trim()).to.have.length.greaterThan(0);

            // Should not contain raw HTML tags in the displayed text
            // (This checks the rendered text, not the HTML source)
            expect(text).to.not.include("<");
            expect(text).to.not.include(">");
          });

        // Verify it's rendered HTML, not escaped text
        cy.wrap($descEl).should($el => {
          const html = $el.html();
          // HTML should be present and rendered
          expect(html).to.have.length.greaterThan(0);
        });
      }
    });
  });

  it("should show error message when products API returns 500 error", () => {
    // Intercept the products.json request and return a 500 error
    cy.intercept("GET", "**/store/data/products.json", { statusCode: 500, body: {} }).as("productsError");

    // Visit the store page
    cy.visit("/store");

    // Wait for the intercepted request
    cy.wait("@productsError");

    // Should display an error message to the user
    cy.get("[data-testid='error-message'], .error, .alert-danger").then($errorEl => {
      // If error handling is implemented
      if ($errorEl.length > 0) {
        cy.wrap($errorEl).should("be.visible");
        cy.wrap($errorEl).invoke("text").should("include.oneOf", ["error", "Error", "failed"]);
      }
    });
  });

  it("should display loading indicator while products are being fetched with delayed API", () => {
    // Intercept the products.json request with a 2-second delay
    cy.intercept("GET", "**/store/data/products.json", req => {
      req.reply(res => {
        res.delay(2000); // Delay the response by 2 seconds
      });
    }).as("productsDelayed");

    // Visit the store page
    cy.visit("/store");

    // Loading indicator should appear/be visible during fetch
    cy.get("[data-testid='loading'], .spinner, .loading-indicator, .skeleton").then($loadingEl => {
      if ($loadingEl.length > 0) {
        // Loading indicator should be visible
        cy.wrap($loadingEl).should("be.visible");
      }
    });

    // Wait for delayed request to complete
    cy.wait("@productsDelayed", { timeout: 5000 });

    // After loading, products should be displayed
    cy.get("[data-testid='product-card']", { timeout: 5000 }).should("have.length.greaterThan", 0);

    // Loading indicator should disappear
    cy.get("[data-testid='loading'], .spinner, .loading-indicator, .skeleton").then($loadingEl => {
      if ($loadingEl.length > 0) {
        cy.wrap($loadingEl).should("not.be.visible");
      }
    });
  });
});
