/* eslint-disable no-undef */
describe("Add All Products and Variants to Cart", () => {
  beforeEach(() => {
    cy.visit("/store");
    // Clear cart before test
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  it("should add all products with all color variants to cart", () => {
    // Get the total number of products
    cy.get("[data-testid='product-card']").then($products => {
      const productCount = $products.length;
      let totalItemsAdded = 0;

      // Iterate through each product
      for (let i = 0; i < productCount; i++) {
        // Click on the product
        cy.get("[data-testid='product-card']").eq(i).click();

        // Get available colors
        cy.get("[data-testid='color-select']").then($colorSelect => {
          if ($colorSelect.length > 0) {
            // Get all color options
            cy.get("[data-testid='color-select'] option").then($options => {
              const colorCount = $options.length;

              // Add each color variant to cart
              for (let c = 0; c < colorCount; c++) {
                // Select color
                cy.get("[data-testid='color-select']").select(c);

                // Select size if available
                cy.get("[data-testid='size-select']").then($sizeSelect => {
                  if ($sizeSelect.length > 0) {
                    cy.get("[data-testid='size-select']").select(0);
                  }
                });

                // Add to cart
                cy.get("button:contains('Add to Cart')").click();

                totalItemsAdded++;

                // Verify cart count after each add
                cy.get("[data-testid='cart-count']").should("contain", totalItemsAdded);
              }
            });
          } else {
            // No color variants, just add the product as-is
            cy.get("[data-testid='size-select']").then($sizeSelect => {
              if ($sizeSelect.length > 0) {
                cy.get("[data-testid='size-select']").select(0);
              }
            });

            cy.get("button:contains('Add to Cart')").click();
            totalItemsAdded++;

            cy.get("[data-testid='cart-count']").should("contain", totalItemsAdded);
          }
        });

        // Go back to store to get next product
        if (i < productCount - 1) {
          cy.visit("/store");
        }
      }

      // Verify final cart count
      cy.get("[data-testid='cart-count']").should("contain", totalItemsAdded);

      // Navigate to cart and verify all items are there
      cy.get("a[href*='cart.html']").click();
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);
    });
  });

  it("should have correct product count for each product type", () => {
    let productVariantMap = {};

    cy.get("[data-testid='product-card']").each(($card, _index) => {
      cy.wrap($card).click();

      cy.get("[data-testid='product-title']")
        .invoke("text")
        .then(title => {
          cy.get("[data-testid='color-select']").then($colorSelect => {
            let variantCount = 1;

            if ($colorSelect.length > 0) {
              cy.get("[data-testid='color-select'] option").then($options => {
                variantCount = $options.length;
                productVariantMap[title] = variantCount;

                // Go back
                cy.visit("/store");
              });
            } else {
              productVariantMap[title] = variantCount;
              cy.visit("/store");
            }
          });
        });
    });

    // Verify we have product data
    cy.then(() => {
      expect(Object.keys(productVariantMap).length).to.equal(3);
    });
  });

  it("should calculate correct cart total with all variants", () => {
    let expectedTotal = 0;

    cy.get("[data-testid='product-card']").each(($card, _index) => {
      cy.wrap($card).click();

      cy.get("[data-testid='product-price']")
        .invoke("text")
        .then(priceText => {
          // Extract price (e.g., "$25.00" -> 25.00)
          const price = parseFloat(priceText.replace(/[^0-9.]/g, ""));

          cy.get("[data-testid='color-select']").then($colorSelect => {
            if ($colorSelect.length > 0) {
              cy.get("[data-testid='color-select'] option").then($options => {
                expectedTotal += price * $options.length;

                // Add all variants to cart
                for (let c = 0; c < $options.length; c++) {
                  cy.get("[data-testid='color-select']").select(c);

                  cy.get("[data-testid='size-select']").then($sizeSelect => {
                    if ($sizeSelect.length > 0) {
                      cy.get("[data-testid='size-select']").select(0);
                    }
                  });

                  cy.get("button:contains('Add to Cart')").click();
                }

                cy.visit("/store");
              });
            } else {
              expectedTotal += price;

              cy.get("[data-testid='size-select']").then($sizeSelect => {
                if ($sizeSelect.length > 0) {
                  cy.get("[data-testid='size-select']").select(0);
                }
              });

              cy.get("button:contains('Add to Cart')").click();
              cy.visit("/store");
            }
          });
        });
    });

    // Navigate to cart and verify total
    cy.get("a[href*='cart.html']").click();
    cy.get("[data-testid='cart-subtotal']")
      .invoke("text")
      .then(totalText => {
        const cartTotal = parseFloat(totalText.replace(/[^0-9.]/g, ""));
        expect(cartTotal).to.be.closeTo(expectedTotal, 0.01);
      });
  });
});
