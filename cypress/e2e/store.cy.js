/* eslint-disable no-undef */

// Store front (store/index.html + store.js): product grid, navigation and
// shareable category filters (?type= URL param + localStorage).

const CATEGORIES = ["tees", "long-sleeve", "sweatshirts", "hoodies", "hats", "stickers"];

const visibleCards = () => cy.get("[data-testid='product-card']").filter(":visible");

function expectOnlyCategory(category) {
  cy.get(`.filter-btn[data-category='${category}']`).should("have.class", "active");
  cy.get(".filter-btn.active").should("have.length", 1);
  visibleCards()
    .should("have.length.greaterThan", 0)
    .each($card => expect($card).to.have.attr("data-category", category));
}

describe("Store", () => {
  describe("Product grid", () => {
    beforeEach(() => {
      cy.request("/store/data/products.json").its("body").as("products");
      cy.visitWith("/store/");
    });

    it("renders a card for every product with title, price and image", function () {
      cy.get("[data-testid='product-card']").should("have.length", this.products.length);

      const tee = this.products.find(p => p.product_key === "product_421296994");
      cy.get("[data-testid='product-card']")
        .filter(`:has(a[href='product.html?key=${tee.product_key}'])`)
        .within(() => {
          cy.get("[data-testid='product-title']").should("have.text", tee.title);
          cy.get("[data-testid='product-price']").should("have.text", "$25.00 USD");
          cy.get("img").should("have.attr", "alt", tee.title).and("have.attr", "src", tee.image);
        });

      cy.get("[data-testid='product-card']")
        .filter(":has(a[href='product.html?key=product_421115395'])")
        .find("[data-testid='product-price']")
        .should("have.text", "$4.50 USD – $5.50 USD");
    });

    it("serves every product image", function () {
      const images = [...new Set(this.products.map(p => p.image))];
      images.forEach(src => {
        cy.request(`/store/${encodeURI(src)}`)
          .its("status")
          .should("eq", 200);
      });
    });

    it("opens the product page when a card is clicked", () => {
      cy.get("[data-testid='product-card']").eq(1).find("[data-testid='product-title']").invoke("text").as("title");
      cy.get("[data-testid='product-card']").eq(1).find("[data-testid='product-image']").click();

      cy.location("pathname").should("eq", "/store/product.html");
      cy.location("search").should("match", /^\?key=product_\d+$/);
      cy.get("@title").then(title => cy.get("[data-testid='product-title']").should("have.text", title));
    });

    it("loads the shared navbar with store, cart and order status links", () => {
      cy.get("#navbarMain").should("be.visible");
      cy.get("#navbarMain a[href='/store/index.html']").should("exist");
      cy.get("#navbarMain a[href='/store/cart.html']").should("exist");
      cy.get("#navbarMain a[href='/store/order-status.html']").should("exist");
      cy.get("[data-testid='cart-count']").should("not.be.visible");
    });
  });

  it("shows the cart item count in the navbar badge", () => {
    cy.visitWith("/store/", {
      cart: [
        { productKey: "product_421296994", color: "Black", size: "M", quantity: 2 },
        { productKey: "product_421115395", color: "Satin", size: "2x2", quantity: 3 },
      ],
    });
    cy.get("[data-testid='cart-count']").should("be.visible").and("have.text", "5");
  });

  it("shows an error state when products cannot be loaded", () => {
    cy.intercept("GET", "**/store/data/products.json", { statusCode: 500, body: {} }).as("productsError");
    cy.visitWith("/store/");
    cy.wait("@productsError");

    cy.get("#error-state").should("be.visible").and("contain", "Failed to load products");
    cy.get("[data-testid='product-grid']").should("not.be.visible");
  });

  describe("Category filters", () => {
    beforeEach(() => {
      cy.visitWith("/store/");
      cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);
    });

    it("shows all products by default", () => {
      cy.get(".filter-btn[data-category='all']").should("have.class", "active");
      cy.get("[data-testid='product-card']").then($cards => visibleCards().should("have.length", $cards.length));
      cy.location("search").should("eq", "");
    });

    it("filters by category and records it in the URL and localStorage", () => {
      cy.get(".filter-btn[data-category='tees']").click();
      expectOnlyCategory("tees");
      cy.location("search").should("eq", "?type=tees");
      cy.window().its("localStorage").invoke("getItem", "kots_filter").should("eq", "tees");

      cy.get(".filter-btn[data-category='hoodies']").click();
      expectOnlyCategory("hoodies");
      cy.location("search").should("eq", "?type=hoodies");
      cy.window().its("localStorage").invoke("getItem", "kots_filter").should("eq", "hoodies");
    });

    it("returns to all products and clears the URL param and saved filter when 'All' is clicked", () => {
      cy.get(".filter-btn[data-category='hats']").click();
      expectOnlyCategory("hats");

      cy.get(".filter-btn[data-category='all']").click();
      cy.get(".filter-btn[data-category='all']").should("have.class", "active");
      cy.get("[data-testid='product-card']").then($cards => visibleCards().should("have.length", $cards.length));
      cy.location("search").should("eq", "");
      cy.window().its("localStorage").invoke("getItem", "kots_filter").should("be.null");
    });

    it("applies the filter from a shared ?type= URL for every category", () => {
      CATEGORIES.forEach(category => {
        cy.visitWith(`/store/index.html?type=${category}`);
        expectOnlyCategory(category);
      });
    });

    it("ignores an unknown ?type= value", () => {
      cy.visitWith("/store/index.html?type=invalid");
      cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);
      cy.get(".filter-btn[data-category='all']").should("have.class", "active");
      cy.get("[data-testid='product-card']").then($cards => visibleCards().should("have.length", $cards.length));
    });

    it("restores the saved filter on return, but a URL param takes priority", () => {
      cy.get(".filter-btn[data-category='stickers']").click();

      cy.visit("/store/");
      expectOnlyCategory("stickers");

      cy.visit("/store/index.html?type=long-sleeve");
      expectOnlyCategory("long-sleeve");
    });
  });
});
