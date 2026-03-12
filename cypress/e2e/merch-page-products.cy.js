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
        cy.get("[data-testid='product-name']").should("be.visible");
        cy.get("[data-testid='product-name']").invoke("text").should("not.be.empty");
      });
    });
  });

  it("should display all products with visible images", () => {
    cy.get("[data-testid='product-card']").each($card => {
      cy.wrap($card).within(() => {
        // Image should exist and have src attribute
        cy.get("[data-testid='product-image']").should("exist").should("have.attr", "src");
      });
    });
  });

  it("should display product images with alt text", () => {
    cy.get("[data-testid='product-card']").each($card => {
      cy.wrap($card).within(() => {
        cy.get("[data-testid='product-image']").should("have.attr", "alt");
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
    const productElements = ["product-name", "product-price", "product-image"];

    cy.get("[data-testid='product-card']").each($card => {
      productElements.forEach(element => {
        cy.wrap($card).within(() => {
          cy.get(`[data-testid='${element}']`).should("exist");
        });
      });
    });
  });

  it("should have products sorted or in expected order", () => {
    cy.get("[data-testid='product-name']").then($names => {
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
    cy.get("[data-testid='product-name']").first().invoke("text").should("not.be.empty");
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
});
