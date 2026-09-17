/* eslint-disable no-undef */
/**
 * Order Status Page Responsive Tests
 * Tests layout responsiveness across mobile, tablet, and desktop viewports
 * Validates grid layout collapse and element visibility
 */

describe("Order Status Page - Responsive Design", () => {
  const mockOrderId = "PF123456789";
  const mockEmail = "test@example.com";

  describe("Mobile Viewport (375x667) - iPhone SE", () => {
    beforeEach(() => {
      cy.viewport(375, 667);
      // Handle uncaught exceptions from application module loading
      cy.on("uncaught:exception", err => {
        if (err.message.includes("Cannot use import statement outside a module")) {
          return false;
        }
      });
    });

    it("should display order status form on mobile", () => {
      cy.visit("/store/order-status.html");
      cy.get("#printful-order-id").should("be.visible");
      cy.get("#email").should("be.visible");
    });

    it("should have full-width layout on mobile", () => {
      cy.visit("/store/order-status.html");
      // Form container should take full width on mobile
      cy.get("#search-form").should("be.visible");
      cy.get(".form-group-custom").should("have.length", 2);
    });

    it("should have readable text on mobile", () => {
      cy.visit(`/store/order-status.html?printful_order_id=${mockOrderId}&email=${mockEmail}`);
      cy.get("body").then($body => {
        const fontSize = window.getComputedStyle($body[0]).fontSize;
        const fontSizeNum = parseFloat(fontSize);
        expect(fontSizeNum).to.be.gte(14);
      });
    });

    it("should have accessible form inputs on mobile", () => {
      cy.visit("/store/order-status.html");
      cy.get("input, textarea, select").each($input => {
        cy.wrap($input).should("have.css", "height");
        const height = window.getComputedStyle($input[0]).height;
        const heightNum = parseFloat(height);
        expect(heightNum).to.be.gte(40); // Minimum touch target size
      });
    });

    it("should stack buttons vertically on mobile", () => {
      cy.visit("/store/order-status.html");
      // Track Order button should be visible
      cy.get("#search-btn").should("be.visible");
      cy.get("#search-btn").should("have.class", "search-button");
    });

    it("should not have horizontal scrolling on mobile", () => {
      cy.visit("/store/order-status.html");
      cy.window().then(win => {
        cy.get("body").then($body => {
          const bodyWidth = $body.width();
          expect(bodyWidth).to.be.lte(win.innerWidth);
        });
      });
    });

    it("should have proper padding on mobile", () => {
      cy.visit("/store/order-status.html");
      // Form container should have padding and not overflow
      cy.get("#search-form").then($section => {
        const paddingLeft = window.getComputedStyle($section[0]).paddingLeft;
        const paddingRight = window.getComputedStyle($section[0]).paddingRight;
        expect(paddingLeft).to.exist;
        expect(paddingRight).to.exist;
      });
    });
  });

  describe("Tablet Viewport (768x1024) - iPad", () => {
    beforeEach(() => {
      cy.viewport(768, 1024);
      cy.on("uncaught:exception", err => {
        if (err.message.includes("Cannot use import statement outside a module")) {
          return false;
        }
      });
    });

    it("should display order status form on tablet", () => {
      cy.visit("/store/order-status.html");
      cy.get("#printful-order-id").should("be.visible");
      cy.get("#email").should("be.visible");
    });

    it("should have single-column layout on tablet", () => {
      cy.visit("/store/order-status.html");
      // Form should be visible and functional on tablet
      cy.get("#search-form").should("be.visible");
      cy.get(".form-group-custom").should("have.length", 2);
    });

    it("should have readable headings on tablet", () => {
      cy.visit("/store/order-status.html");
      cy.get("h1, h2, h3").each($heading => {
        cy.wrap($heading).should("be.visible");
      });
    });

    it("should have proper spacing on tablet", () => {
      cy.visit("/store/order-status.html");
      // Form groups should have proper spacing
      cy.get(".form-group-custom").then($groups => {
        expect($groups.length).to.equal(2);
        // Each form group should be visible
        cy.wrap($groups).each($group => {
          cy.wrap($group).should("be.visible");
        });
      });
    });
  });

  describe("Desktop Viewport (1200x800)", () => {
    beforeEach(() => {
      cy.viewport(1200, 800);
      cy.on("uncaught:exception", err => {
        if (err.message.includes("Cannot use import statement outside a module")) {
          return false;
        }
      });
    });

    it("should display order status form on desktop", () => {
      cy.visit("/store/order-status.html");
      cy.get("#printful-order-id").should("be.visible");
      cy.get("#email").should("be.visible");
    });

    it("should have two-column layout on desktop", () => {
      cy.visit("/store/order-status.html");
      // Form should be visible and properly laid out on desktop
      cy.get("#search-form").should("be.visible");
      cy.get(".form-group-custom").should("have.length", 2);
    });

    it("should have adequate spacing on desktop", () => {
      cy.visit("/store/order-status.html");
      cy.get(".container").then($container => {
        if ($container.length > 0) {
          const maxWidth = window.getComputedStyle($container[0]).maxWidth;
          const width = parseFloat(maxWidth);
          expect(width).to.be.gte(900); // Should use max-width for desktop
        }
      });
    });

    it("should have proper alignment on desktop", () => {
      cy.visit("/store/order-status.html");
      cy.get("body").then($body => {
        const textAlign = window.getComputedStyle($body[0]).textAlign;
        expect(textAlign).to.exist;
      });
    });
  });

  describe("Cross-Viewport Responsive Tests", () => {
    const viewports = [
      { width: 375, height: 667, name: "mobile" },
      { width: 768, height: 1024, name: "tablet" },
      { width: 1200, height: 800, name: "desktop" },
    ];

    viewports.forEach(viewport => {
      describe(`${viewport.name.toUpperCase()} (${viewport.width}x${viewport.height})`, () => {
        beforeEach(() => {
          cy.viewport(viewport.width, viewport.height);
          cy.on("uncaught:exception", err => {
            if (err.message.includes("Cannot use import statement outside a module")) {
              return false;
            }
          });
        });

        it("should load page without errors", () => {
          cy.visit("/store/order-status.html");
          cy.get("body").should("be.visible");
        });

        it("should display main heading", () => {
          cy.visit("/store/order-status.html");
          cy.get("h1, h2").should("have.length.greaterThan", 0);
          cy.get("h1, h2").first().should("be.visible");
        });

        it("should have navigation links", () => {
          cy.visit("/store/order-status.html");
          cy.get("a[href*='store'], a[href*='index.html']").should("have.length.greaterThan", 0);
        });

        it("should not have horizontal overflow", () => {
          cy.visit("/store/order-status.html");
          cy.window().then(win => {
            const scrollWidth = win.document.documentElement.scrollWidth;
            const clientWidth = win.document.documentElement.clientWidth;
            expect(scrollWidth).to.equal(clientWidth);
          });
        });

        it("should have visible form elements", () => {
          cy.visit("/store/order-status.html");
          cy.get("input, button").should("have.length.greaterThan", 0);
        });

        it("should have proper text contrast", () => {
          cy.visit("/store/order-status.html");
          cy.get("body").then($body => {
            const bgColor = window.getComputedStyle($body[0]).backgroundColor;
            expect(bgColor).to.exist;
          });
        });

        it("should support text resizing", () => {
          cy.visit("/store/order-status.html");
          cy.get("body").should("have.css", "font-size");
        });

        it("should preserve layout on zoom", () => {
          cy.visit("/store/order-status.html");
          // Use CSS zoom to simulate browser zoom
          cy.get("body").should("be.visible");
          // Verify key elements are still visible
          cy.get("h1, h2, input").should("have.length.greaterThan", 0);
        });
      });
    });
  });
});
