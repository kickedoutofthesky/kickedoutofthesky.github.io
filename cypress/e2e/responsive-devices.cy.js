/* eslint-disable no-undef */

// Helper function to select first real size option
function selectFirstRealSize() {
  cy.get("[data-testid='size-select']").then($select => {
    const value = $select.val();
    // If placeholder is selected (empty value), select first real option
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

describe("Responsive Design - Mobile and Tablet Viewports", () => {
  beforeEach(() => {
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  describe("Mobile Viewport (375x667) - iPhone SE", () => {
    beforeEach(() => {
      cy.viewport(375, 667);
    });

    it("should display merch page layout without broken layout at mobile viewport", () => {
      cy.visit("/store");

      // Product grid should be visible
      cy.get("[data-testid='product-grid']").should("be.visible");

      // Products should be visible
      cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);

      // All products should be in viewport without horizontal scroll
      cy.get("[data-testid='product-card']").each($card => {
        // Check that card is within viewport width
        cy.wrap($card).should("be.visible");

        cy.wrap($card).then($el => {
          const elementWidth = $el.width();
          const elementLeft = $el.position().left;
          const elementRight = elementLeft + elementWidth;

          // Element should be within 375px viewport
          expect(elementRight).to.be.lessThan(400); // Small buffer for rounding
        });
      });

      // Verify no horizontal scrollbar
      cy.get("body").should($body => {
        const bodyWidth = $body.width();
        const windowWidth = Cypress.$(cy.state("window")).width();
        expect(bodyWidth).to.be.lessThanOrEqual(windowWidth + 5); // Small buffer
      });

      // Product names should be readable
      cy.get("[data-testid='product-title']").each($name => {
        cy.wrap($name).invoke("text").should("not.be.empty");
      });

      // Product images should be visible
      cy.get("[data-testid='product-image']").each($img => {
        cy.wrap($img).should("be.visible");
      });

      // Product prices should be visible
      cy.get("[data-testid='product-price']").each($price => {
        cy.wrap($price).should("be.visible");
      });
    });

    it("should open, view, and manage cart at mobile viewport", () => {
      cy.visit("/store");

      // Add product to cart
      cy.get("[data-testid='product-card']").first().click();
      cy.url().should("include", "product.html");

      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      // Navigate to cart
      cy.get("a[href*='cart.html']").click();
      cy.url().should("include", "cart.html");

      // Cart should be visible
      cy.get("[data-testid='cart-page']").should("be.visible");

      // Cart items should be readable
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);

      cy.get("[data-testid='cart-item']")
        .first()
        .within(() => {
          cy.get("[data-testid='item-name']").should("be.visible");
          cy.get("[data-testid='item-price']").should("be.visible");
        });

      // Quantity input should be accessible
      cy.get("[data-testid='quantity-input'], input[name*='quantity']").then($input => {
        if ($input.length > 0 && !$input.prop("readonly")) {
          cy.wrap($input).should("be.visible");

          // Should be able to interact with it
          cy.wrap($input).first().clear().type("2");
        }
      });

      // Cart total should be visible
      cy.get("[data-testid='cart-subtotal'], [data-testid='cart-total']").should("be.visible");

      // Mobile navigation should have cart/back button
      cy.get("a[href*='store'], a[href*='index.html']").should("exist");
    });

    it("should display all shipping form fields and reachable submit button at mobile viewport", () => {
      cy.visit("/store/cart.html");

      // Add item to cart first
      cy.window().then(win => {
        // Assume cart already has items, or navigate to add one
        cy.get("[data-testid='proceed-to-checkout'], button")
          .contains("Checkout")
          .then($btn => {
            if ($btn.length > 0) {
              cy.wrap($btn).should("be.visible");
              cy.wrap($btn).should("be.scrollIntoView");

              // All form fields should be visible/scrollable
              cy.get("[data-testid='shipping-name'], input[name='name']").should("be.visible");
              cy.get("[data-testid='shipping-email'], input[name='email']").should("be.visible");
              cy.get("[data-testid='shipping-address'], input[name='address']").should("be.visible");
              cy.get("[data-testid='shipping-city'], input[name='city']").should("be.visible");
              cy.get("[data-testid='shipping-state'], input[name='state']").should("be.visible");
              cy.get("[data-testid='shipping-zip'], input[name='zip']").should("be.visible");

              // Submit button should be reachable/not cut off
              cy.wrap($btn).should("be.scrollIntoView");
            }
          });
      });
    });

    it("should open navigation menu and make links functional at mobile viewport", () => {
      cy.visit("/store");

      // Mobile menu/hamburger should exist
      cy.get("[data-testid='mobile-menu'], nav, .navbar").then($nav => {
        if ($nav.length > 0) {
          cy.wrap($nav).should("be.visible");

          // Navigation links should be accessible
          cy.get("a[href*='index.html']").should("exist");
          cy.get("a[href*='cart.html']").should("exist");

          // Links should work
          cy.get("a[href*='cart.html']").first().click();
          cy.url().should("include", "cart.html");

          // Can navigate back
          cy.get("a[href*='index.html'], a[href*='store']").first().click();
          cy.url().should("include", "index.html");
        }
      });
    });
  });

  describe("Tablet Viewport (768x1024) - iPad", () => {
    beforeEach(() => {
      cy.viewport(768, 1024);
    });

    it("should scale product images proportionally without distortion at tablet viewport", () => {
      cy.visit("/store");

      cy.get("[data-testid='product-card']").first().click();
      cy.url().should("include", "product.html");

      // Product image should be visible
      cy.get("[data-testid='product-detail-image'], [data-testid='product-image']").then($img => {
        if ($img.length > 0) {
          cy.wrap($img).should("be.visible");

          // Image should have proper dimensions
          cy.wrap($img).then($el => {
            const width = $el.width();
            const height = $el.height();

            // Should have meaningful width and height
            expect(width).to.be.greaterThan(0);
            expect(height).to.be.greaterThan(0);

            // Aspect ratio should be reasonable (not distorted)
            const aspectRatio = width / height;
            // Most product images are square or 4:3, so ratio should be between 0.5 and 2
            expect(aspectRatio).to.be.greaterThan(0.5);
            expect(aspectRatio).to.be.lessThan(2);
          });

          // Image should be loaded
          cy.wrap($img).should("have.attr", "src");
          cy.wrap($img).invoke("attr", "src").should("not.be.empty");
        }
      });
    });

    it("should display full product grid with proper layout at tablet viewport", () => {
      cy.visit("/store");

      // Product grid should be visible
      cy.get("[data-testid='product-grid']").should("be.visible");

      // Should display multiple products in a row (tablet layout)
      cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);

      // Products should be well-arranged
      cy.get("[data-testid='product-card']").each($card => {
        cy.wrap($card).should("be.visible");

        // Card should have readable content
        cy.wrap($card).within(() => {
          cy.get("[data-testid='product-title']").should("exist");
          cy.get("[data-testid='product-image']").should("exist");
          cy.get("[data-testid='product-price']").should("exist");
        });
      });

      // No horizontal scrolling
      cy.get("body").should($body => {
        const bodyWidth = $body.width();
        const windowWidth = Cypress.$(cy.state("window")).width();
        expect(bodyWidth).to.be.lessThanOrEqual(windowWidth + 5);
      });
    });

    it("should display cart and all controls at tablet viewport", () => {
      cy.visit("/store");

      // Add product to cart
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      // Navigate to cart
      cy.get("a[href*='cart.html']").click();

      // Cart page should be fully visible
      cy.get("[data-testid='cart-page']").should("be.visible");

      // Cart items should be well-laid out
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);

      // Quantity controls should be easily accessible
      cy.get("[data-testid='quantity-input']").should("be.visible");

      // Checkout button should be visible
      cy.get("button").contains("Proceed to Checkout").should("be.visible");

      // Typography should be readable
      cy.get("[data-testid='cart-subtotal']").should("be.visible");
    });
  });

  describe("Desktop Viewport (1280x800)", () => {
    beforeEach(() => {
      cy.viewport(1280, 800);
    });

    it("should display full layout with proper grid/columns at desktop viewport", () => {
      cy.visit("/store");

      // Product grid should be visible and organized
      cy.get("[data-testid='product-grid']").should("be.visible");

      // Should display multiple products in organized columns
      cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);

      // Get product cards and verify grid layout
      cy.get("[data-testid='product-card']").then($cards => {
        expect($cards.length).to.be.greaterThan(3); // Desktop should show multiple columns

        // Cards should be aligned in a grid
        const firstCardTop = $cards.eq(0).position().top;
        const firstCardLeft = $cards.eq(0).position().left;

        // Multiple cards should exist in the same row (similar top position)
        let sameRowCount = 0;
        $cards.each((index, card) => {
          const cardTop = Cypress.$(card).position().top;
          if (Math.abs(cardTop - firstCardTop) < 10) {
            // Same row (within 10px)
            sameRowCount++;
          }
        });

        // Should have at least 2-3 cards in same row on desktop
        expect(sameRowCount).to.be.greaterThan(1);
      });

      // Navigation should be visible and horizontal
      cy.get("nav, [data-testid='navigation']").then($nav => {
        if ($nav.length > 0) {
          cy.wrap($nav).should("be.visible");

          // Navigation links should be horizontally arranged
          cy.get("a[href*='index.html']").should("be.visible");
          cy.get("a[href*='cart.html']").should("be.visible");
        }
      });

      // Page should use available width effectively
      cy.get("[data-testid='product-grid']").then($grid => {
        const gridWidth = $grid.width();
        // Grid should be wider than 600px on desktop
        expect(gridWidth).to.be.greaterThan(600);
      });
    });

    it("should display full product details with sidebar layout at desktop viewport", () => {
      cy.visit("/store");

      // Click on a product
      cy.get("[data-testid='product-card']").first().click();
      cy.url().should("include", "product.html");

      // Product detail page should show full layout
      cy.get("[data-testid='product-detail']").should("be.visible");

      // Main image should be prominent
      cy.get("[data-testid='product-detail-image']").then($img => {
        if ($img.length > 0) {
          cy.wrap($img).should("be.visible");

          // Should have significant width on desktop
          cy.wrap($img).then($el => {
            const width = $el.width();
            expect(width).to.be.greaterThan(300); // Desktop should show large image
          });
        }
      });

      // Product info section should be visible alongside
      cy.get("[data-testid='product-info'], .product-info").should("be.visible");

      // All controls should be easily accessible
      cy.get("[data-testid='size-select'], select[name*='size']").should("be.visible");
      cy.get("#add-to-cart-btn").should("be.visible");
    });

    it("should display cart with expandable layout at desktop viewport", () => {
      cy.visit("/store");

      // Add multiple products
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      // Go to cart
      cy.get("a[href*='cart.html']").click();
      cy.url().should("include", "cart.html");

      // Cart should display as a comprehensive table or list
      cy.get("[data-testid='cart-items'], .cart-items").then($cartItems => {
        cy.wrap($cartItems).should("be.visible");

        // Should have columnar layout:
        // - Product info
        // - Unit price
        // - Quantity
        // - Line total
        // - Remove action

        cy.get("[data-testid='cart-item']")
          .first()
          .within(() => {
            cy.get("[data-testid='item-name']").should("be.visible");
            cy.get("[data-testid='item-price']").should("be.visible");
            cy.get("[data-testid='quantity-input']").should("be.visible");
            cy.get("[data-testid='remove-item']").should("be.visible");
          });
      });

      // Checkout section should be visible
      cy.get("[data-testid='checkout-section'], .checkout-section").then($checkout => {
        if ($checkout.length > 0) {
          cy.wrap($checkout).should("be.visible");

          // Order summary should show
          cy.get("[data-testid='cart-subtotal']").should("be.visible");
          cy.get("button").contains("Proceed to Checkout").should("be.visible");
        }
      });
    });
  });

  describe("Cross-Viewport Responsive Tests", () => {
    it("should maintain functionality across viewport changes", () => {
      // Start at mobile
      cy.viewport(375, 667);
      cy.visit("/store");
      cy.get("[data-testid='product-grid']").should("be.visible");

      // Resize to tablet
      cy.viewport(768, 1024);
      cy.get("[data-testid='product-grid']").should("be.visible");

      // Resize to desktop
      cy.viewport(1280, 800);
      cy.get("[data-testid='product-grid']").should("be.visible");

      // Product functionality should work at all sizes
      cy.get("[data-testid='product-card']").first().click();
      cy.url().should("include", "product.html");

      // Resize while on product page
      cy.viewport(375, 667);
      cy.get("[data-testid='product-detail']").should("be.visible");

      cy.viewport(768, 1024);
      cy.get("[data-testid='product-detail']").should("be.visible");

      cy.viewport(1280, 800);
      cy.get("[data-testid='product-detail']").should("be.visible");
    });

    it("should render text legibly at all viewport sizes", () => {
      const viewports = [
        { width: 375, height: 667, name: "mobile" },
        { width: 768, height: 1024, name: "tablet" },
        { width: 1280, height: 800, name: "desktop" },
      ];

      viewports.forEach(viewport => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit("/store");

        // All text should have reasonable font size
        cy.get("[data-testid='product-title']")
          .first()
          .then($text => {
            const fontSize = window.getComputedStyle($text[0]).fontSize;
            const fontSizeNumber = parseInt(fontSize);

            // Font should be at least 12px even on mobile
            expect(fontSizeNumber).to.be.greaterThanOrEqual(12);
          });

        // Links should be easily tappable on mobile/tablet (min 44x44 recommended)
        if (viewport.name === "mobile" || viewport.name === "tablet") {
          cy.get("a[href*='cart.html']").then($link => {
            const width = $link.width();
            const height = $link.height();

            // Should be reasonably sized for touch
            expect(width + height).to.be.greaterThan(50); // Combined size > 50
          });
        }
      });
    });
  });
});
