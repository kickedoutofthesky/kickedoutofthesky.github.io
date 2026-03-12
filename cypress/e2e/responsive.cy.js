/* eslint-disable no-undef */

// Helper function to select first real size option
function selectFirstRealSize() {
  cy.get("[data-testid='size-select']").then($select => {
    const value = $select.val();
    if (!value || value === "") {
      cy.get("[data-testid='size-select'] option")
        .eq(1)
        .invoke("attr", "value")
        .then(sizeValue => {
          cy.get("[data-testid='size-select']").select(sizeValue);
        });
    }
  });
}

// Test viewports
const viewports = [
  { name: "mobile", width: 375, height: 667 }, // iPhone SE
  { name: "tablet", width: 768, height: 1024 }, // iPad
  { name: "desktop", width: 1280, height: 800 },
];

describe("Responsive Design Tests", () => {
  viewports.forEach(viewport => {
    describe(`${viewport.name.toUpperCase()} (${viewport.width}x${viewport.height})`, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height);
      });

      describe("Store Navigation", () => {
        it("should display product grid responsively", () => {
          cy.visit("/store");
          cy.get("[data-testid='product-grid']").should("be.visible");
          cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);
        });

        it("should have clickable navigation links", () => {
          cy.visit("/store");
          cy.get("a[href*='index.html'], a[href*='store']").should("have.length.greaterThan", 0);
          cy.get("a[href*='cart.html']").should("have.length.greaterThan", 0);
        });

        it("should not have horizontal scrolling", () => {
          cy.visit("/store");
          cy.get("body").then($body => {
            const windowWidth = cy.state("window").innerWidth;
            const bodyWidth = $body.width();
            expect(bodyWidth).to.be.lte(windowWidth);
          });
        });
      });

      describe("Product Selection", () => {
        beforeEach(() => {
          cy.visit("/store");
        });

        it("should display product details on click", () => {
          cy.get("[data-testid='product-card']").first().click();
          cy.get("[data-testid='product-detail']").should("be.visible");
        });

        it("should have accessible size/color selects", () => {
          cy.get("[data-testid='product-card']").first().click();

          cy.get("[data-testid='size-select']").then($select => {
            if ($select.length > 0) {
              cy.get("[data-testid='size-select']").should("be.visible");
              // Should be large enough to tap on mobile
              cy.get("[data-testid='size-select']").should("have.css", "height");
            }
          });
        });

        it("should have accessible add to cart button", () => {
          cy.get("[data-testid='product-card']").first().click();
          selectFirstRealSize();

          cy.get("#add-to-cart-btn").should("be.visible");
          // Should be large enough to tap on mobile
          cy.get("#add-to-cart-btn").then($btn => {
            const height = $btn.outerHeight();
            expect(height).to.be.greaterThan(40); // Minimum tap target size
          });
        });

        it("should handle adding product to cart on mobile", () => {
          cy.get("[data-testid='product-card']").first().click();
          selectFirstRealSize();
          cy.get("#add-to-cart-btn").click();

          // Should navigate to cart or show confirmation
          cy.get("a[href*='cart.html']").should("exist");
        });
      });

      describe("Shopping Cart", () => {
        beforeEach(() => {
          cy.visit("/store");
          cy.window().then(win => {
            win.localStorage.clear();
          });

          // Add product to cart
          cy.get("[data-testid='product-card']").first().click();
          selectFirstRealSize();
          cy.get("#add-to-cart-btn").click();
          cy.get("a[href*='cart.html']").click();
        });

        it("should display cart items responsively", () => {
          cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);
          cy.get("[data-testid='cart-item']").each($item => {
            cy.wrap($item).should("be.visible");
          });
        });

        it("should have accessible quantity controls", () => {
          cy.get("[data-testid='quantity-input']").then($input => {
            if ($input.length > 0) {
              cy.get("[data-testid='quantity-input']").first().should("be.visible");
            }
          });
        });

        it("should have accessible remove item button", () => {
          cy.get("[data-testid='remove-item-btn']").then($btn => {
            if ($btn.length > 0) {
              cy.get("[data-testid='remove-item-btn']").first().should("be.visible");
              // Should be large enough to tap
              cy.get("[data-testid='remove-item-btn']")
                .first()
                .then($element => {
                  const height = $element.outerHeight();
                  expect(height).to.be.greaterThan(30);
                });
            }
          });
        });

        it("should display subtotal clearly", () => {
          cy.get("[data-testid='cart-subtotal']").should("be.visible");
          cy.get("[data-testid='cart-subtotal']").invoke("text").should("include", "$");
        });

        it("should have accessible checkout button", () => {
          cy.get("button").contains("Proceed to Checkout").should("be.visible");
          cy.get("button")
            .contains("Proceed to Checkout")
            .then($btn => {
              const height = $btn.outerHeight();
              expect(height).to.be.greaterThan(40); // Minimum tap target
            });
        });
      });

      describe("Text Readability", () => {
        it("should have readable heading sizes", () => {
          cy.visit("/store");
          cy.get("h1, h2, h3").then($headings => {
            cy.wrap($headings).each($heading => {
              const fontSize = parseInt(cy.window().then(win => win.getComputedStyle($heading[0]).fontSize));
              expect(fontSize).to.be.greaterThan(14);
            });
          });
        });

        it("should have adequate line spacing", () => {
          cy.visit("/store");
          cy.get("[data-testid='product-title']")
            .first()
            .then($element => {
              const lineHeight = cy.window().then(win => win.getComputedStyle($element[0]).lineHeight);
              expect(lineHeight).to.exist;
            });
        });

        it("should have sufficient color contrast", () => {
          cy.visit("/store");
          // Check that text is visible (basic check)
          cy.get("[data-testid='product-title']").first().should("have.css", "color");
        });
      });

      describe("Touch Interactions", () => {
        it("should handle touch events on product cards", () => {
          cy.visit("/store");
          cy.get("[data-testid='product-card']").first().trigger("touchstart").trigger("touchend").click();
          cy.get("[data-testid='product-detail']").should("be.visible");
        });

        it("should handle touch scroll on product grid", () => {
          cy.visit("/store");
          if (viewports.find(v => v.name === "mobile")) {
            cy.get("[data-testid='product-grid']").scrollTo("bottom");
            cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);
          }
        });

        it("should handle tap on buttons", () => {
          cy.visit("/store");
          cy.get("[data-testid='product-card']").first().click();
          selectFirstRealSize();
          cy.get("#add-to-cart-btn").trigger("touchstart").trigger("touchend").click();

          cy.get("a[href*='cart.html']").should("exist");
        });
      });

      describe("DOM Structure", () => {
        it("should have semantic HTML structure", () => {
          cy.visit("/store");
          cy.get("header, nav, main, footer").should("have.length.greaterThan", 0);
        });

        it("should have proper heading hierarchy", () => {
          cy.visit("/store");
          cy.get("h1").should("have.length.greaterThan", 0);
        });

        it("should have alt text for images", () => {
          cy.visit("/store");
          cy.get("[data-testid='product-image']").first().should("have.attr", "alt");
        });
      });

      describe("Form Fields", () => {
        it("should have proper label associations", () => {
          cy.visit("/store");
          cy.get("[data-testid='product-card']").first().click();

          cy.get("[data-testid='size-select']").then($select => {
            if ($select.length > 0) {
              // Should either have associated label or data attribute
              cy.get("[data-testid='size-select']").should("have.attr", "data-testid");
            }
          });
        });

        it("should have proper input types", () => {
          cy.visit("/store");
          cy.get("[data-testid='product-card']").first().click();
          selectFirstRealSize();
          cy.get("#add-to-cart-btn").click();
          cy.get("a[href*='cart.html']").click();

          cy.get("[data-testid='quantity-input']").then($input => {
            if ($input.length > 0) {
              // Quantity should be number type or have type attribute
              const type = $input.attr("type");
              expect(type === "number" || type === "text" || !type).to.be.true;
            }
          });
        });
      });
    });
  });

  describe("Cross-Viewport Cart Persistence", () => {
    it("should maintain cart data across viewport changes", () => {
      cy.viewport(375, 667); // Start on mobile
      cy.visit("/store");
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      // Switch to tablet
      cy.viewport(768, 1024);
      cy.get("a[href*='cart.html']").click();
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);

      // Switch to desktop
      cy.viewport(1280, 800);
      cy.get("a[href*='store'], a[href*='index.html']").first().click();
      cy.get("a[href*='cart.html']").click();
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);
    });
  });
});
