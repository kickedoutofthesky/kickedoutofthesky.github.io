/* eslint-disable no-undef */

describe("Shareable Category Filters", () => {
  beforeEach(() => {
    cy.visit("/store");
    // Wait for products to load
    cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);
  });

  describe("Filter Button Behavior", () => {
    it("should show all products by default", () => {
      cy.get(".filter-btn[data-category='all']").should("have.class", "active");
      cy.get("[data-testid='product-card']").each($card => {
        cy.wrap($card).should("be.visible");
      });
    });

    it("should filter products when a category button is clicked", () => {
      cy.get(".filter-btn[data-category='tees']").click();
      cy.get("[data-testid='product-card']").filter(":visible").should("have.length.greaterThan", 0);
      cy.get("[data-testid='product-card']")
        .filter(":visible")
        .each($card => {
          cy.wrap($card).should("have.attr", "data-category", "tees");
        });
    });

    it("should set active class on clicked filter button", () => {
      cy.get(".filter-btn[data-category='hoodies']").click();
      cy.get(".filter-btn[data-category='hoodies']").should("have.class", "active");
      cy.get(".filter-btn[data-category='all']").should("not.have.class", "active");
    });

    it("should show all products when 'All' filter is clicked after filtering", () => {
      cy.get(".filter-btn[data-category='hats']").click();
      cy.get("[data-testid='product-card']").filter(":visible").should("have.length.greaterThan", 0);
      cy.get(".filter-btn[data-category='all']").click();
      cy.get(".filter-btn[data-category='all']").should("have.class", "active");
      // All cards should be visible again
      cy.get("[data-testid='product-card']").each($card => {
        cy.wrap($card).should("be.visible");
      });
    });
  });

  describe("URL Parameter Updates", () => {
    it("should add ?type= param to URL when a category is selected", () => {
      cy.get(".filter-btn[data-category='tees']").click();
      cy.url().should("include", "type=tees");
    });

    it("should remove ?type= param from URL when 'All' is selected", () => {
      cy.get(".filter-btn[data-category='tees']").click();
      cy.url().should("include", "type=tees");
      cy.get(".filter-btn[data-category='all']").click();
      cy.url().should("not.include", "type=");
    });

    it("should update ?type= param when switching categories", () => {
      cy.get(".filter-btn[data-category='tees']").click();
      cy.url().should("include", "type=tees");
      cy.get(".filter-btn[data-category='hoodies']").click();
      cy.url().should("include", "type=hoodies");
      cy.url().should("not.include", "type=tees");
    });
  });

  describe("Shareable URLs - Direct Navigation", () => {
    it("should apply tees filter when visiting with ?type=tees", () => {
      cy.visit("/store/index.html?type=tees");
      cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);
      cy.get(".filter-btn[data-category='tees']").should("have.class", "active");
      cy.get("[data-testid='product-card']")
        .filter(":visible")
        .each($card => {
          cy.wrap($card).should("have.attr", "data-category", "tees");
        });
    });

    it("should apply hoodies filter when visiting with ?type=hoodies", () => {
      cy.visit("/store/index.html?type=hoodies");
      cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);
      cy.get(".filter-btn[data-category='hoodies']").should("have.class", "active");
      cy.get("[data-testid='product-card']")
        .filter(":visible")
        .each($card => {
          cy.wrap($card).should("have.attr", "data-category", "hoodies");
        });
    });

    it("should apply hats filter when visiting with ?type=hats", () => {
      cy.visit("/store/index.html?type=hats");
      cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);
      cy.get(".filter-btn[data-category='hats']").should("have.class", "active");
      cy.get("[data-testid='product-card']")
        .filter(":visible")
        .each($card => {
          cy.wrap($card).should("have.attr", "data-category", "hats");
        });
    });

    it("should apply stickers filter when visiting with ?type=stickers", () => {
      cy.visit("/store/index.html?type=stickers");
      cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);
      cy.get(".filter-btn[data-category='stickers']").should("have.class", "active");
      cy.get("[data-testid='product-card']")
        .filter(":visible")
        .each($card => {
          cy.wrap($card).should("have.attr", "data-category", "stickers");
        });
    });

    it("should apply long-sleeve filter when visiting with ?type=long-sleeve", () => {
      cy.visit("/store/index.html?type=long-sleeve");
      cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);
      cy.get(".filter-btn[data-category='long-sleeve']").should("have.class", "active");
      cy.get("[data-testid='product-card']")
        .filter(":visible")
        .each($card => {
          cy.wrap($card).should("have.attr", "data-category", "long-sleeve");
        });
    });

    it("should apply sweatshirts filter when visiting with ?type=sweatshirts", () => {
      cy.visit("/store/index.html?type=sweatshirts");
      cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);
      cy.get(".filter-btn[data-category='sweatshirts']").should("have.class", "active");
      cy.get("[data-testid='product-card']")
        .filter(":visible")
        .each($card => {
          cy.wrap($card).should("have.attr", "data-category", "sweatshirts");
        });
    });

    it("should show all products for invalid ?type= param", () => {
      cy.visit("/store/index.html?type=invalid");
      cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);
      // All button should be active (invalid type is ignored)
      cy.get(".filter-btn[data-category='all']").should("have.class", "active");
      cy.get("[data-testid='product-card']").each($card => {
        cy.wrap($card).should("be.visible");
      });
    });
  });

  describe("localStorage Persistence", () => {
    it("should save filter to localStorage when category is selected", () => {
      cy.get(".filter-btn[data-category='tees']").click();
      cy.window().then(win => {
        expect(win.localStorage.getItem("kots_filter")).to.equal("tees");
      });
    });

    it("should remove filter from localStorage when 'All' is selected", () => {
      cy.get(".filter-btn[data-category='tees']").click();
      cy.window().then(win => {
        expect(win.localStorage.getItem("kots_filter")).to.equal("tees");
      });
      cy.get(".filter-btn[data-category='all']").click();
      cy.window().then(win => {
        expect(win.localStorage.getItem("kots_filter")).to.be.null;
      });
    });

    it("should restore filter from localStorage on page reload", () => {
      // Set a filter
      cy.get(".filter-btn[data-category='hoodies']").click();
      cy.window().then(win => {
        expect(win.localStorage.getItem("kots_filter")).to.equal("hoodies");
      });
      // Reload the page (without URL param - localStorage should kick in)
      cy.visit("/store");
      cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);
      cy.get(".filter-btn[data-category='hoodies']").should("have.class", "active");
      cy.get("[data-testid='product-card']")
        .filter(":visible")
        .each($card => {
          cy.wrap($card).should("have.attr", "data-category", "hoodies");
        });
    });

    it("should prioritize URL param over localStorage filter", () => {
      // Set localStorage to hoodies
      cy.get(".filter-btn[data-category='hoodies']").click();
      cy.window().then(win => {
        expect(win.localStorage.getItem("kots_filter")).to.equal("hoodies");
      });
      // Visit with a different URL param
      cy.visit("/store/index.html?type=tees");
      cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);
      // URL param (tees) should win over localStorage (hoodies)
      cy.get(".filter-btn[data-category='tees']").should("have.class", "active");
      cy.get("[data-testid='product-card']")
        .filter(":visible")
        .each($card => {
          cy.wrap($card).should("have.attr", "data-category", "tees");
        });
    });
  });

  describe("Dynamic OG Tags", () => {
    it("should have default OG tags on store page without type param", () => {
      cy.request("GET", "/store/index.html").then(response => {
        expect(response.body).to.contain('og:title" content="Merch - Kicked Out Of The Sky"');
      });
    });

    it("should inject tees OG title when ?type=tees", () => {
      cy.request("GET", "/store/index.html?type=tees").then(response => {
        expect(response.body).to.contain('og:title" content="Tees - Kicked Out Of The Sky Merch"');
        expect(response.body).to.contain("Shop Tees from Kicked Out Of The Sky.");
      });
    });

    it("should inject hoodies OG title when ?type=hoodies", () => {
      cy.request("GET", "/store/index.html?type=hoodies").then(response => {
        expect(response.body).to.contain('og:title" content="Hoodies - Kicked Out Of The Sky Merch"');
      });
    });

    it("should inject product image in OG image tag", () => {
      cy.request("GET", "/store/index.html?type=tees").then(response => {
        // Should NOT have the default band logo
        expect(response.body).to.not.contain(
          'og:image" content="https://www.kickedoutofthesky.com/img/Kicked-Out-Of-The-Sky'
        );
        // Should have an absolute image URL
        expect(response.body).to.match(/og:image" content="https:\/\//);
      });
    });

    it("should keep default OG tags for invalid type param", () => {
      cy.request("GET", "/store/index.html?type=invalid").then(response => {
        expect(response.body).to.contain('og:title" content="Merch - Kicked Out Of The Sky"');
      });
    });

    it("should update twitter tags alongside OG tags", () => {
      cy.request("GET", "/store/index.html?type=hats").then(response => {
        expect(response.body).to.contain('twitter:title" content="Hats - Kicked Out Of The Sky Merch"');
        expect(response.body).to.contain("Shop Hats from Kicked Out Of The Sky.");
      });
    });
  });
});
