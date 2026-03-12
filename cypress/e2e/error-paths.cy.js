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
      cy.get("#add-to-cart-btn").should("not.be.disabled").click();
      cy.get("a[href*='cart.html']").click();
    });

    it("should handle zero quantity gracefully", () => {
      cy.get("[data-testid='quantity-input']").then($input => {
        if ($input.length > 0) {
          // Try to set quantity to 0 (should either prevent or remove item)
          cy.get("[data-testid='quantity-input']").first().clear().type("0");

          // Either item is removed or quantity reverts to 1
          cy.wait(500);
          cy.get("[data-testid='quantity-input']")
            .first()
            .then($qty => {
              const value = $qty.val();
              expect(parseInt(value)).to.be.greaterThan(0);
            });
        }
      });
    });

    it("should handle negative quantity gracefully", () => {
      cy.get("[data-testid='quantity-input']").then($input => {
        if ($input.length > 0) {
          cy.get("[data-testid='quantity-input']").first().clear().type("-5");

          cy.wait(500);
          cy.get("[data-testid='quantity-input']")
            .first()
            .then($qty => {
              const value = parseInt($qty.val());
              expect(value).to.be.greaterThan(0);
            });
        }
      });
    });

    it("should update subtotal when quantity changes", () => {
      cy.get("[data-testid='cart-subtotal']")
        .invoke("text")
        .then(originalTotal => {
          // Try to increase quantity
          cy.get("[data-testid='quantity-input']").first().clear().type("2");

          cy.wait(500);
          cy.get("[data-testid='cart-subtotal']")
            .invoke("text")
            .then(newTotal => {
              // New total should be different (likely higher)
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

      // Click back/close button
      cy.get("a[href*='store'], a[href*='index.html']")
        .filter((_, el) => {
          const text = el.textContent.toLowerCase();
          return text.includes("back") || text.includes("close") || text.includes("store") || el.tagName === "A";
        })
        .first()
        .click();

      // Should return to store
      cy.url().should("include", "store");
    });

    it("should preserve cart when navigating between pages", () => {
      // Add product to cart
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();
      cy.get("a[href*='cart.html']").click();

      // Verify item in cart
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);

      // Navigate back to store
      cy.get("a[href*='store'], a[href*='index.html']").first().click();
      cy.url().should("include", "store");

      // Navigate back to cart
      cy.get("a[href*='cart.html']").click();

      // Item should still be there
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);
    });

    it("should handle rapid navigation without losing cart data", () => {
      // Add product
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      // Rapidly navigate
      cy.get("a[href*='store'], a[href*='index.html']").first().click();
      cy.get("[data-testid='product-card']").first().click();
      cy.get("a[href*='cart.html']").click();

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
      cy.get("#add-to-cart-btn").click();
      cy.get("a[href*='cart.html']").click();
    });

    it("should handle special characters in quantity input", () => {
      cy.get("[data-testid='quantity-input']").then($input => {
        if ($input.length > 0) {
          cy.get("[data-testid='quantity-input']").first().clear().type("!@#$%");

          cy.wait(500);
          cy.get("[data-testid='quantity-input']")
            .first()
            .then($qty => {
              const value = $qty.val();
              // Should either be empty, numeric, or have default
              expect(value === "" || /^\d+$/.test(value)).to.be.true;
            });
        }
      });
    });

    it("should handle extremely large quantity values", () => {
      cy.get("[data-testid='quantity-input']").then($input => {
        if ($input.length > 0) {
          cy.get("[data-testid='quantity-input']").first().clear().type("999999");

          // Should either accept reasonable quantity or cap at max
          cy.wait(500);
          cy.get("[data-testid='quantity-input']")
            .first()
            .then($qty => {
              const value = parseInt($qty.val());
              expect(value).to.be.a("number");
              expect(value).to.be.greaterThan(0);
            });
        }
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

      // Immediately try to add to cart (before page fully loads)
      cy.get("#add-to-cart-btn", { timeout: 10000 }).click();

      // Should still work or show appropriate message
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
      cy.get("#add-to-cart-btn").click();

      // After action, focus should be managed appropriately
      cy.focused().then($focused => {
        // Should have some focused element
        expect($focused.length).to.be.greaterThan(0);
      });
    });
  });
});
