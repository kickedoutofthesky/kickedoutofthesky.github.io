/* eslint-disable no-undef */
describe("Add to Cart Flow", () => {
  beforeEach(() => {
    cy.visit("/store");
    // Clear cart before each test
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  it("should add a product to cart from product grid", () => {
    cy.get("[data-testid='product-card']")
      .first()
      .within(() => {
        cy.get("button:contains('Add to Cart')").click();
      });

    // Check cart notification appears
    cy.get("[data-testid='cart-notification']").should("be.visible");

    // Verify cart count increments
    cy.get("[data-testid='cart-count']").should("contain", "1");
  });

  it("should add a product from product detail page", () => {
    cy.get("[data-testid='product-card']").first().click();

    // Select size if available
    cy.get("[data-testid='size-select']").then($select => {
      if ($select.length > 0) {
        cy.get("[data-testid='size-select']").select(0);
      }
    });

    // Add to cart
    cy.get("button:contains('Add to Cart')").click();

    // Check notification
    cy.get("[data-testid='cart-notification']").should("be.visible");

    // Verify cart count
    cy.get("[data-testid='cart-count']").should("contain", "1");
  });

  it("should select color variant before adding to cart", () => {
    cy.get("[data-testid='product-card']").first().click();

    // Select color if available
    cy.get("[data-testid='color-select']").then($select => {
      if ($select.length > 0) {
        cy.get("[data-testid='color-select']").select(1);
        cy.get("[data-testid='color-select']").should("have.value");
      }
    });

    cy.get("button:contains('Add to Cart')").click();

    cy.get("[data-testid='cart-notification']").should("be.visible");
  });

  it("should add multiple different products to cart", () => {
    // Add first product
    cy.get("[data-testid='product-card']")
      .eq(0)
      .within(() => {
        cy.get("button:contains('Add to Cart')").click();
      });

    cy.get("[data-testid='cart-count']").should("contain", "1");

    // Add second product
    cy.get("[data-testid='product-card']")
      .eq(1)
      .within(() => {
        cy.get("button:contains('Add to Cart')").click();
      });

    cy.get("[data-testid='cart-count']").should("contain", "2");
  });

  it("should add same product with different variants separately", () => {
    cy.get("[data-testid='product-card']").first().click();

    // Select first variant
    cy.get("[data-testid='color-select']").then($select => {
      if ($select.length > 0) {
        cy.get("[data-testid='color-select']").select(0);
      }
    });

    cy.get("button:contains('Add to Cart')").click();
    cy.get("[data-testid='cart-count']").should("contain", "1");

    // Go back and add same product with different variant
    cy.visit("/store");
    cy.get("[data-testid='product-card']").first().click();

    cy.get("[data-testid='color-select']").then($select => {
      if ($select.length > 0) {
        cy.get("[data-testid='color-select']").select(1);
      }
    });

    cy.get("button:contains('Add to Cart')").click();
    cy.get("[data-testid='cart-count']").should("contain", "2");
  });
});
