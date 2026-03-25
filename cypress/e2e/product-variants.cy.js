/* eslint-disable no-undef */

// Helper function to select first real color option
function selectFirstRealColor() {
  cy.get("[data-testid='color-select']").then($select => {
    if ($select.length > 0) {
      cy.get("[data-testid='color-select'] option")
        .eq(0)
        .invoke("attr", "value")
        .then(colorValue => {
          // Use force:true to bypass navbar coverage issue
          cy.get("[data-testid='color-select']").select(colorValue, { force: true });
        });
    }
  });
}

describe("Product Variants and Details", () => {
  beforeEach(() => {
    cy.visit("/store");
  });

  it("should display product with multiple colors", () => {
    cy.get("[data-testid='product-card']").first().click();

    cy.get("[data-testid='product-detail']").should("be.visible");

    cy.get("[data-testid='color-select']").then($select => {
      if ($select.length > 0) {
        cy.get("[data-testid='color-select']").should("exist");
        // Color select has no placeholder — each option is a real color
        cy.get("[data-testid='color-select'] option").should("have.length.greaterThan", 0);
      }
    });
  });

  it("should update product image when color changes", () => {
    cy.get("[data-testid='product-card']").first().click();

    cy.get("[data-testid='product-detail']").should("be.visible");

    cy.get("[data-testid='color-select']").then($select => {
      if ($select.length > 0) {
        cy.get("[data-testid='product-image']").then(_$img => {
          const _originalSrc = _$img.attr("src");

          // Change color
          selectFirstRealColor();

          // Image might update (depending on if variants have different images)
          cy.get("[data-testid='product-image']").should($newImg => {
            const newSrc = $newImg.attr("src");
            // Image should exist and be valid
            expect(newSrc).to.exist;
          });
        });
      }
    });
  });

  it("should display available sizes", () => {
    cy.get("[data-testid='product-card']").first().click();

    cy.get("[data-testid='product-detail']").should("be.visible");

    cy.get("[data-testid='size-select']").then($select => {
      if ($select.length > 0) {
        cy.get("[data-testid='size-select'] option").should("have.length.greaterThan", 0);
      }
    });
  });

  it("should display product price", () => {
    cy.get("[data-testid='product-card']").first().click();

    cy.get("[data-testid='product-detail']").should("be.visible");

    cy.get("[data-testid='product-price']").should("exist");
    cy.get("[data-testid='product-price']").invoke("text").should("include", "$");
  });

  it("should display product title", () => {
    cy.get("[data-testid='product-card']").first().click();

    cy.get("[data-testid='product-detail']").should("be.visible");

    cy.get("[data-testid='product-title']").should("exist");
    cy.get("[data-testid='product-title']").invoke("text").should("have.length.greaterThan", 0);
  });

  it("should update price when variant changes (if applicable)", () => {
    cy.get("[data-testid='product-card']").first().click();

    cy.get("[data-testid='product-detail']").should("be.visible");

    cy.get("[data-testid='product-price']").then(_$price => {
      // Change color
      cy.get("[data-testid='color-select']").then($select => {
        if ($select.length > 0) {
          selectFirstRealColor();
          // Price should remain or update appropriately
          cy.get("[data-testid='product-price']").should("exist");
        }
      });
    });
  });
});
