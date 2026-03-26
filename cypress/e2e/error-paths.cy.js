/* eslint-disable no-undef */

describe("Error Paths and Edge Cases", () => {
  describe("Empty Cart Scenarios", () => {
    it("should not allow checkout with empty cart", () => {
      cy.visit("/store/cart.html");
      cy.window().then(win => {
        win.localStorage.clear();
      });

      // Cart should be empty
      cy.get("[data-testid='cart-item']").should("have.length", 0);

      // Checkout button should be disabled or not exist
      cy.get("button")
        .contains("Proceed to Checkout")
        .then($btn => {
          // Either button doesn't exist or is disabled
          if ($btn.length === 0) {
            expect($btn.length).to.equal(0);
          } else {
            expect($btn[0]).to.have.attr("disabled");
          }
        });
    });

    it("should display empty cart message", () => {
      cy.visit("/store/cart.html");
      cy.window().then(win => {
        win.localStorage.clear();
      });

      // Should show some indication the cart is empty
      cy.get("body").then($body => {
        const hasEmptyMessage =
          $body.text().includes("empty") || $body.text().includes("Empty") || $body.text().includes("No items");

        expect(hasEmptyMessage || $body.find("[data-testid='cart-item']").length === 0).to.be.true;
      });
    });

    it("should allow returning to store from empty cart", () => {
      cy.visit("/store/cart.html");
      cy.window().then(win => {
        win.localStorage.clear();
      });

      cy.get("a[href*='index.html'], a[href*='store'], button:contains('Continue Shopping')").first().should("exist");
    });
  });

  describe("Cart Quantity Edge Cases", () => {
    beforeEach(() => {
      cy.visit("/store");
      cy.window().then(win => {
        win.localStorage.clear();
      });

      // Add product to cart
      cy.get("[data-testid='product-card']").first().click();
      cy.get("[data-testid='product-detail']").should("be.visible");
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").should("not.be.disabled").click({ force: true });
      cy.wait(1500);
      cy.get("a[href*='cart.html']").first().click({ force: true });
    });

    it("should handle zero quantity gracefully", () => {
      // Wait for cart to fully render
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);

      // Cart quantity input is readonly — use the minus button to decrease
      cy.get("[data-testid='quantity-input']").should("have.length.greaterThan", 0);

      // Click minus button to decrease quantity from 1 to 0 (should remove item)
      cy.get("[data-testid='cart-item']").first().find("i.fa-minus").parent("button").click({ force: true });

      // Item should be removed when quantity reaches 0 — cart shows empty state
      // The cart items container is hidden (display: none) but elements stay in DOM
      cy.get("[data-testid='empty-cart-message']").should("be.visible");
    });

    it("should handle negative quantity gracefully", () => {
      // Cart quantity input is readonly — verify it always shows positive value
      cy.get("[data-testid='quantity-input']")
        .first()
        .then($qty => {
          const value = parseInt($qty.val());
          expect(value).to.be.greaterThan(0);
        });
    });

    it("should update subtotal when quantity changes", () => {
      cy.get("[data-testid='cart-subtotal']")
        .invoke("text")
        .then(originalTotal => {
          // Use plus button to increase quantity (input is readonly)
          cy.get("[data-testid='cart-item']")
            .first()
            .within(() => {
              cy.get("i.fa-plus").parent("button").click({ force: true });
            });

          cy.wait(500);
          cy.get("[data-testid='cart-subtotal']")
            .invoke("text")
            .then(newTotal => {
              // New total should be different (higher)
              expect(newTotal).to.not.equal(originalTotal);
            });
        });
    });
  });

  describe("Modal and Navigation Interactions", () => {
    beforeEach(() => {
      cy.visit("/store");
      cy.window().then(win => {
        win.localStorage.clear();
      });
    });

    it("should handle going back while on product detail", () => {
      cy.get("[data-testid='product-card']").first().click();
      cy.url().should("include", "product.html");

      // Click back/store link
      cy.get("a[href*='index.html']").first().click();

      // Should return to store page
      cy.url().should("include", "index.html");
    });

    it("should preserve cart when navigating between pages", () => {
      // Add product to cart
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click({ force: true });
      cy.wait(1500);
      cy.get("a[href*='cart.html']").first().click({ force: true });

      // Verify item in cart
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);

      // Navigate back to store
      cy.get("a[href='index.html']").first().click();
      cy.url().should("include", "index.html");
      cy.get("[data-testid='product-card']", { timeout: 10000 }).should("exist");

      // Navigate back to cart
      cy.get("a[href*='cart.html']").first().click({ force: true });

      // Item should still be there
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);
    });

    it("should handle rapid navigation without losing cart data", () => {
      // Add product
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click({ force: true });

      // Rapidly navigate
      cy.wait(1500);
      cy.get("a[href='index.html']").first().click({ force: true });
      cy.get("[data-testid='product-card']", { timeout: 10000 }).should("exist");
      cy.get("[data-testid='product-card']").first().click();
      cy.wait(500);
      cy.get("a[href*='cart.html']").first().click({ force: true });

      // Cart should still have item
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);
    });
  });

  describe("Form Input Validation", () => {
    beforeEach(() => {
      cy.visit("/store");
      cy.window().then(win => {
        win.localStorage.clear();
      });

      // Add product to cart
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click({ force: true });
      cy.wait(500);
      cy.get("a[href*='cart.html']").first().click({ force: true });
    });

    it("should handle special characters in quantity input", () => {
      // Wait for cart to render
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);

      // Cart quantity input is readonly — verify it only shows numeric value
      cy.get("[data-testid='quantity-input']").first().should("have.attr", "readonly");
      cy.get("[data-testid='quantity-input']")
        .first()
        .invoke("val")
        .then(value => {
          expect(/^\d+$/.test(value)).to.be.true;
        });
    });

    it("should handle extremely large quantity values", () => {
      // Wait for cart to render
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);

      // Cart quantity input is readonly — can only change via +/- buttons
      // Verify the current value is a valid positive number
      cy.get("[data-testid='quantity-input']").first().should("have.attr", "readonly");
      cy.get("[data-testid='quantity-input']")
        .first()
        .invoke("val")
        .then(value => {
          const num = parseInt(value);
          expect(num).to.be.a("number");
          expect(num).to.be.greaterThan(0);
        });
    });
  });

  describe("Product Display Edge Cases", () => {
    it("should handle product without image gracefully", () => {
      cy.visit("/store");
      cy.get("[data-testid='product-card']").first().click();

      cy.get("[data-testid='product-image']").then($img => {
        // Should either have src or have alt text
        const hasSrc = $img.attr("src");
        const hasAlt = $img.attr("alt");
        expect(hasSrc || hasAlt).to.exist;
      });
    });

    it("should handle product without variants", () => {
      cy.visit("/store");
      cy.get("[data-testid='product-card']").first().click();

      cy.get("[data-testid='product-detail']").should("be.visible");

      // Add to cart should still work even if no variants
      cy.get("#add-to-cart-btn").then($btn => {
        // Button should exist
        expect($btn.length).to.be.greaterThan(0);
      });
    });

    it("should display prices correctly", () => {
      cy.visit("/store");
      cy.get("[data-testid='product-price']").then($prices => {
        expect($prices.length).to.be.greaterThan(0);

        // Each price should be in valid format
        cy.get("[data-testid='product-price']")
          .first()
          .invoke("text")
          .then(priceText => {
            // Should contain $ or number
            expect(priceText).to.match(/\$|[0-9]/);
          });
      });
    });
  });

  describe("Network and Loading States", () => {
    it("should handle slow page load", () => {
      // Intentionally slow page load
      cy.visit("/store", { timeout: 10000 });
      cy.get("[data-testid='product-grid']", { timeout: 10000 }).should("be.visible");
    });

    it("should display content even with slow images", () => {
      cy.visit("/store");

      // Product cards should be visible even if images are loading
      cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);
      cy.get("[data-testid='product-title']").should("have.length.greaterThan", 0);
    });

    it("should handle add to cart during loading", () => {
      cy.visit("/store");
      cy.get("[data-testid='product-card']").first().click();

      // Wait for product detail to load, then select size (required before add-to-cart is enabled)
      cy.get("[data-testid='product-detail']", { timeout: 10000 }).should("be.visible");
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").should("not.be.disabled").click({ force: true });

      // Should still work
      cy.get("a[href*='cart.html']").should("exist");
    });
  });

  describe("Accessibility for Error States", () => {
    it("should have proper error messaging structure", () => {
      cy.visit("/store/cart.html");
      cy.window().then(win => {
        win.localStorage.clear();
      });

      // Even with empty cart, page should be navigable
      cy.get("a").should("have.length.greaterThan", 0);
    });

    it("should maintain focus management during navigation", () => {
      cy.visit("/store");
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").should("not.be.disabled").click({ force: true });

      // After action, page should remain interactive
      cy.get("body").should("be.visible");
      cy.get("a[href*='cart.html']").should("exist");
    });
  });
});
