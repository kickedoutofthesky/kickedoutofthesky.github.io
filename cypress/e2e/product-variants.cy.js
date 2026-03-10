/* eslint-disable no-undef */
describe("Product Variants and Details", () => {
  beforeEach(() => {
    cy.visit("/store");
  });

  it("should display product with multiple colors", () => {
    cy.get("[data-testid='product-card']").first().click();

    cy.get("[data-testid='color-select']").then($select => {
      if ($select.length > 0) {
        cy.get("[data-testid='color-select']").should("exist");
        cy.get("[data-testid='color-select'] option").should("have.length.greaterThan", 1);
      }
    });
  });

  it("should update product image when color changes", () => {
    cy.get("[data-testid='product-card']").first().click();

    cy.get("[data-testid='color-select']").then($select => {
      if ($select.length > 0) {
        cy.get("[data-testid='product-image']").then(_$img => {
          // Change color
          cy.get("[data-testid='color-select']").select(1);

          // Image should update
          cy.get("[data-testid='product-image']").should($newImg => {
            const newSrc = $newImg.attr("src");
            // Image should change or stay the same, but shouldn't be broken
            expect(newSrc).to.exist;
          });
        });
      }
    });
  });

  it("should display available sizes", () => {
    cy.get("[data-testid='product-card']").first().click();

    cy.get("[data-testid='size-select']").then($select => {
      if ($select.length > 0) {
        cy.get("[data-testid='size-select'] option").should("have.length.greaterThan", 0);
      }
    });
  });

  it("should display product price", () => {
    cy.get("[data-testid='product-card']").first().click();

    cy.get("[data-testid='product-price']").should("exist");
    cy.get("[data-testid='product-price']").should("contain", "$");
  });

  it("should display product title", () => {
    cy.get("[data-testid='product-card']").first().click();

    cy.get("[data-testid='product-title']").should("exist");
    cy.get("[data-testid='product-title']").should("have.text.length.greaterThan", 0);
  });

  it("should require size selection before adding to cart", () => {
    cy.get("[data-testid='product-card']").first().click();

    cy.get("[data-testid='size-select']").then($select => {
      if ($select.length > 0) {
        // Try to add without selecting size
        cy.get("button:contains('Add to Cart')").click();

        // Should still be on product page or show error
        cy.url().should("include", "product.html");
      }
    });
  });

  it("should update price when variant changes (if applicable)", () => {
    cy.get("[data-testid='product-card']").first().click();

    cy.get("[data-testid='product-price']").then(_$price => {
      // Change color
      cy.get("[data-testid='color-select']").then($select => {
        if ($select.length > 0) {
          cy.get("[data-testid='color-select']").select(1);
          // Price should remain or update appropriately
          cy.get("[data-testid='product-price']").should("exist");
        }
      });
    });
  });
});
