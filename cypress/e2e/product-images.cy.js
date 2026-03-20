/* eslint-disable no-undef */

describe("Product Images and Carousel", () => {
  // Star + Typewriter Text Sleeve has 2 mockups per color (front + sleeve)
  const multiMockupProductKey = "product_421297848";
  // A single-mockup product (Unisex Tee w/ Kicked Out Of The Sky Vintage)
  const singleMockupProductKey = "product_424725213";
  // Snapback Hat — no mockups, uses Printful CDN images
  const noMockupProductKey = "product_421115406";

  describe("Local Mockup Images", () => {
    it("should display local images for products with mockups", () => {
      cy.visit(`/store/product.html?key=${singleMockupProductKey}`);
      cy.get("[data-testid='product-detail']").should("be.visible");

      cy.get("#product-image").should("have.attr", "src").and("include", "assets/images/");
    });

    it("should display Printful CDN images for products without mockups", () => {
      cy.visit(`/store/product.html?key=${noMockupProductKey}`);
      cy.get("[data-testid='product-detail']").should("be.visible");

      cy.get("#product-image").should("have.attr", "src").and("include", "files.cdn.printful.com");
    });

    it("should update to local image when color changes", () => {
      cy.visit(`/store/product.html?key=${singleMockupProductKey}`);
      cy.get("[data-testid='product-detail']").should("be.visible");

      // Change color
      cy.get("[data-testid='color-select'] option")
        .eq(1)
        .invoke("attr", "value")
        .then(color => {
          cy.get("[data-testid='color-select']").select(color, { force: true });
          cy.get("#product-image").should("have.attr", "src").and("include", "assets/images/");
        });
    });
  });

  describe("Carousel Navigation", () => {
    it("should show carousel arrows for products with multiple mockups", () => {
      cy.visit(`/store/product.html?key=${multiMockupProductKey}`);
      cy.get("[data-testid='product-detail']").should("be.visible");

      // Should initially show next arrow (at first image, there's a sleeve image)
      cy.get("#carousel-next").should("be.visible");
      // Prev arrow should be hidden at first image
      cy.get("#carousel-prev").should("not.be.visible");
    });

    it("should hide carousel arrows for products with single mockup", () => {
      cy.visit(`/store/product.html?key=${singleMockupProductKey}`);
      cy.get("[data-testid='product-detail']").should("be.visible");

      cy.get("#carousel-prev").should("not.be.visible");
      cy.get("#carousel-next").should("not.be.visible");
    });

    it("should hide carousel arrows for products with no mockups", () => {
      cy.visit(`/store/product.html?key=${noMockupProductKey}`);
      cy.get("[data-testid='product-detail']").should("be.visible");

      cy.get("#carousel-prev").should("not.be.visible");
      cy.get("#carousel-next").should("not.be.visible");
    });

    it("should navigate to sleeve image when clicking next arrow", () => {
      cy.visit(`/store/product.html?key=${multiMockupProductKey}`);
      cy.get("[data-testid='product-detail']").should("be.visible");

      // Capture the initial image src
      cy.get("#product-image")
        .invoke("attr", "src")
        .then(initialSrc => {
          // Click next to go to sleeve
          cy.get("#carousel-next").click();

          // Image should change to sleeve mockup
          cy.get("#product-image").should("have.attr", "src").and("include", "Sleeve");
          cy.get("#product-image").invoke("attr", "src").should("not.eq", initialSrc);
        });
    });

    it("should navigate back to front image when clicking prev arrow", () => {
      cy.visit(`/store/product.html?key=${multiMockupProductKey}`);
      cy.get("[data-testid='product-detail']").should("be.visible");

      // Go to sleeve first
      cy.get("#carousel-next").click();
      cy.get("#product-image").should("have.attr", "src").and("include", "Sleeve");

      // Now prev should be visible, go back
      cy.get("#carousel-prev").should("be.visible");
      cy.get("#carousel-prev").click();
      cy.get("#product-image").should("have.attr", "src").and("include", "Front");
    });

    it("should reset carousel to first image when color changes", () => {
      cy.visit(`/store/product.html?key=${multiMockupProductKey}`);
      cy.get("[data-testid='product-detail']").should("be.visible");

      // Navigate to sleeve image
      cy.get("#carousel-next").click();
      cy.get("#product-image").should("have.attr", "src").and("include", "Sleeve");

      // Change color — should reset to front image
      cy.get("[data-testid='color-select'] option")
        .eq(1)
        .invoke("attr", "value")
        .then(color => {
          cy.get("[data-testid='color-select']").select(color, { force: true });
          cy.get("#product-image").should("have.attr", "src").and("include", "Front");
        });
    });

    it("should hide next arrow on last image and show prev arrow", () => {
      cy.visit(`/store/product.html?key=${multiMockupProductKey}`);
      cy.get("[data-testid='product-detail']").should("be.visible");

      // Navigate to last image (sleeve)
      cy.get("#carousel-next").click();

      // At last image: prev should be visible, next should be hidden
      cy.get("#carousel-prev").should("be.visible");
      cy.get("#carousel-next").should("not.be.visible");
    });
  });

  describe("Color-Driven Size Dropdown", () => {
    it("should display sizes for the selected color", () => {
      cy.visit(`/store/product.html?key=${singleMockupProductKey}`);
      cy.get("[data-testid='product-detail']").should("be.visible");

      // Should have size options
      cy.get("[data-testid='size-select'] option").should("have.length.greaterThan", 1);
    });

    it("should update sizes when color changes", () => {
      cy.visit(`/store/product.html?key=${singleMockupProductKey}`);
      cy.get("[data-testid='product-detail']").should("be.visible");

      // Get sizes for first color
      cy.get("[data-testid='size-select'] option").then(_$options => {
        // Change to second color (no placeholder, index 1 = second color)
        cy.get("[data-testid='color-select'] option")
          .eq(1)
          .invoke("attr", "value")
          .then(color => {
            cy.get("[data-testid='color-select']").select(color, { force: true });

            // Size dropdown should still have options (may differ per color)
            cy.get("[data-testid='size-select'] option").should("have.length.greaterThan", 0);

            // First option should be the placeholder
            cy.get("[data-testid='size-select'] option").eq(0).should("contain", "Choose a size");
          });
      });
    });

    it("should reset size selection when color changes", () => {
      cy.visit(`/store/product.html?key=${singleMockupProductKey}`);
      cy.get("[data-testid='product-detail']").should("be.visible");

      // Select a size
      cy.get("[data-testid='size-select'] option")
        .eq(1)
        .invoke("attr", "value")
        .then(size => {
          cy.get("[data-testid='size-select']").select(size);
        });

      // Change color (no placeholder, index 1 = second color)
      cy.get("[data-testid='color-select'] option")
        .eq(1)
        .invoke("attr", "value")
        .then(color => {
          cy.get("[data-testid='color-select']").select(color, { force: true });

          // Size should be reset to placeholder
          cy.get("[data-testid='size-select']").should("have.value", "");
        });
    });

    it("should show only One Size for hat products", () => {
      cy.visit(`/store/product.html?key=${noMockupProductKey}`);
      cy.get("[data-testid='product-detail']").should("be.visible");

      // Hats have "One Size" — should auto-select it
      cy.get("[data-testid='size-select']").should("have.value", "One Size");
    });
  });
});
