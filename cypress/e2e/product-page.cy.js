/* eslint-disable no-undef */

// Product detail page (store/product.html?key=... + product.js): variants, pricing,
// images/carousel, URL pre-selection and add to cart.

const TEE = "product_421296994"; // Unisex Tee w/ Text: Black / Dark Grey Heather, XS–2XL, $25
const VINTAGE_TEE = "product_424725213"; // Oxblood Black (S–2XL) / Natural (XS–2XL)
const MULTI_MOCKUP = "product_425122887"; // Long Sleeve w/ Sleeve print: Front + Sleeve mockups per colour
const HAT = "product_424963286"; // Snapback Hat: One Size
const STICKER = "product_421115395"; // Die-cut Sticker: 2x2 $4.50, 3x3 $5.50

const sizeOptions = () => cy.get("[data-testid='size-select'] option").then($opts => [...$opts].map(o => o.value));

function visitProduct(query) {
  cy.visitWith(`/store/product.html?key=${query}`);
  cy.get("[data-testid='product-title']").should("be.visible");
}

describe("Product page", () => {
  describe("Product details", () => {
    it("renders the product with colours, sizes, price and garment details", () => {
      visitProduct(TEE);

      cy.get("[data-testid='product-title']").should("have.text", "Unisex Tee w/ Text");
      cy.get("[data-testid='product-price']").should("have.text", "$25.00");
      cy.get("[data-testid='color-select'] option")
        .then($opts => [...$opts].map(o => o.value))
        .should("deep.equal", ["Black", "Dark Grey Heather"]);
      sizeOptions().should("deep.equal", ["", "XS", "S", "M", "L", "XL", "2XL"]);
      cy.get("#quantity").should("have.value", "1");
      cy.contains("h4", "Garment Details").should("be.visible");
      cy.contains("100% combed and ring-spun cotton");
      cy.get("#loading").should("not.be.visible");
      cy.contains("a", "Back to Merch").should("have.attr", "href", "/store/index.html");
      cy.contains("a", "Go to Cart").should("have.attr", "href", "/store/cart.html");
    });

    it("updates the document title and adds Product schema markup", () => {
      visitProduct(TEE);

      cy.title().should("eq", "Unisex Tee w/ Text | Kicked Out of the Sky Store");
      cy.get("script[type='application/ld+json']")
        .then($scripts => [...$scripts].map(s => JSON.parse(s.textContent)).find(d => d["@type"] === "Product"))
        .should(schema => {
          expect(schema.name).to.eq("Unisex Tee w/ Text");
          expect(schema.offers.priceCurrency).to.eq("USD");
          expect(schema.offers.lowPrice).to.eq("25.00");
        });
    });

    it("shows an error for an unknown or missing product key", () => {
      cy.visitWith("/store/product.html?key=product_does_not_exist");
      cy.get("#error").should("be.visible").and("contain", "Product not found. Please return to the store.");
      cy.get("#product-detail").should("not.be.visible");

      cy.visitWith("/store/product.html");
      cy.get("#error").should("be.visible").and("contain", "Product not found");
    });
  });

  describe("Variant selection", () => {
    it("keeps Add to Cart disabled until a size is chosen", () => {
      visitProduct(TEE);
      cy.get("#add-to-cart-btn").should("be.disabled");
      cy.get("[data-testid='size-select']").select("M");
      cy.get("#add-to-cart-btn").should("not.be.disabled");
      cy.get("[data-testid='size-select']").select("");
      cy.get("#add-to-cart-btn").should("be.disabled");
    });

    it("lists the sizes available for the selected colour and resets the size on colour change", () => {
      visitProduct(VINTAGE_TEE);

      cy.get("[data-testid='color-select']").should("have.value", "Oxblood Black");
      sizeOptions().should("deep.equal", ["", "S", "M", "L", "XL", "2XL"]);
      cy.get("[data-testid='size-select']").select("M");

      cy.get("[data-testid='color-select']").select("Natural");
      sizeOptions().should("deep.equal", ["", "XS", "S", "M", "L", "XL", "2XL"]);
      cy.get("[data-testid='size-select']").should("have.value", "");
      cy.get("#add-to-cart-btn").should("be.disabled");
    });

    it("auto-selects the only size for one-size products", () => {
      visitProduct(HAT);
      cy.get("[data-testid='size-select']").should("have.value", "One Size");
      cy.get("#add-to-cart-btn").should("not.be.disabled");
    });

    it("shows a price range and the exact price once a size is selected", () => {
      visitProduct(STICKER);
      cy.get("[data-testid='product-price']").should("have.text", "$4.50 – $5.50");

      cy.get("[data-testid='size-select']").select("3x3");
      cy.get("[data-testid='product-price']").should("have.text", "$5.50");
      cy.get("[data-testid='size-select']").select("2x2");
      cy.get("[data-testid='product-price']").should("have.text", "$4.50");
      cy.get("[data-testid='size-select']").select("");
      cy.get("[data-testid='product-price']").should("have.text", "$4.50 – $5.50");
    });
  });

  describe("Images and carousel", () => {
    it("shows the local mockup for the selected colour", () => {
      visitProduct(VINTAGE_TEE);
      cy.get("#product-image").should("have.attr", "src").and("include", "assets/images/").and("include", "Oxblood");

      cy.get("[data-testid='color-select']").select("Natural");
      cy.get("#product-image").should("have.attr", "src").and("include", "Natural");
    });

    it("hides the carousel arrows when a colour has a single mockup", () => {
      visitProduct(TEE);
      cy.get("#carousel-prev").should("not.be.visible");
      cy.get("#carousel-next").should("not.be.visible");
    });

    it("steps through front and sleeve mockups and resets to the front on colour change", () => {
      visitProduct(MULTI_MOCKUP);
      cy.get("#product-image").should("have.attr", "src").and("include", "Front");
      cy.get("#carousel-prev").should("not.be.visible");

      cy.get("#carousel-next").should("be.visible").click();
      cy.get("#product-image").should("have.attr", "src").and("include", "Sleeve");
      cy.get("#carousel-next").should("not.be.visible");

      cy.get("#carousel-prev").should("be.visible").click();
      cy.get("#product-image").should("have.attr", "src").and("include", "Front");

      cy.get("#carousel-next").click();
      cy.get("[data-testid='color-select']").select("Dark Grey Heather");
      cy.get("#product-image").should("have.attr", "src").and("include", "Front").and("include", "Dark%20Grey");
      cy.get("#carousel-next").should("be.visible");
    });

    it("shows stickers enlarged without zoom controls", () => {
      visitProduct(STICKER);
      cy.get("#product-image").should("have.attr", "style").and("include", "scale(1.75)");
      cy.get("#zoom-controls").should("not.be.visible");
    });

    it("zooms in 20% steps up to 300%, pans while zoomed, and zooms out or resets to 100%", () => {
      visitProduct(TEE);
      cy.get("#zoom-level").should("not.be.visible");
      cy.get("#pan-controls").should("not.be.visible");

      cy.get("[aria-label='Zoom in to see product details']").click();
      cy.get("#zoom-level").should("be.visible").and("have.text", "120%");
      cy.get("#product-image").should("have.attr", "style").and("include", "scale(1.2)");
      cy.get("#pan-controls").should("be.visible");

      cy.get("[aria-label='Pan product image left']").click();
      cy.get("#product-image").should("have.attr", "style").and("include", "translate(20px, 0px)");

      for (let i = 0; i < 12; i++) cy.get("[aria-label='Zoom in to see product details']").click();
      cy.get("#zoom-level").should("have.text", "300%");

      for (let i = 0; i < 12; i++) cy.get("[aria-label='Zoom out to see full product']").click();
      cy.get("#product-image").should("have.attr", "style").and("include", "scale(1) translate(0px, 0px)");
      cy.get("#zoom-level").should("not.be.visible");
      cy.get("#pan-controls").should("not.be.visible");

      cy.get("[aria-label='Zoom in to see product details']").click().click();
      cy.get("#zoom-level").should("have.text", "140%");
      cy.get("[aria-label='Reset product image zoom to original size']").click();
      cy.get("#product-image").should("have.attr", "style").and("include", "scale(1) translate(0px, 0px)");
      cy.get("#zoom-level").should("not.be.visible");
    });
  });

  describe("URL pre-selection", () => {
    it("pre-selects colour, size and quantity from the URL", () => {
      visitProduct(`${VINTAGE_TEE}&color=Natural&size=XS&quantity=3`);

      cy.get("[data-testid='color-select']").should("have.value", "Natural");
      cy.get("[data-testid='size-select']").should("have.value", "XS");
      cy.get("#quantity").should("have.value", "3");
      cy.get("#product-image").should("have.attr", "src").and("include", "Natural");
      cy.get("#add-to-cart-btn").should("not.be.disabled");
    });

    it("ignores an invalid colour or size from the URL", () => {
      visitProduct(`${VINTAGE_TEE}&color=Purple&size=XS`);

      cy.get("[data-testid='color-select']").should("have.value", "Oxblood Black");
      cy.get("[data-testid='size-select']").should("have.value", "");
      cy.get("#add-to-cart-btn").should("be.disabled");
    });
  });

  describe("Add to cart", () => {
    it("adds the selected variant and quantity, then opens the cart", () => {
      visitProduct(TEE);
      cy.chooseVariant({ color: "Dark Grey Heather", size: "L", quantity: 2 });
      cy.get("#add-to-cart-btn").click();

      cy.location("pathname").should("eq", "/store/cart.html");
      cy.window()
        .its("localStorage")
        .invoke("getItem", "kots_cart")
        .then(raw =>
          expect(JSON.parse(raw)).to.deep.equal([
            { productKey: TEE, color: "Dark Grey Heather", size: "L", quantity: 2 },
          ])
        );
      cy.get("[data-testid='cart-count']").should("have.text", "2");
      cy.get("[data-testid='cart-item']").should("have.length", 1).and("contain", "Size: L");
    });

    it("merges the same variant into one line and keeps different variants separate", () => {
      cy.visitWith(`/store/product.html?key=${TEE}`, {
        cart: [{ productKey: TEE, color: "Black", size: "M", quantity: 1 }],
      });
      cy.chooseVariant({ color: "Black", size: "M" });
      cy.get("#add-to-cart-btn").click();
      cy.location("pathname").should("eq", "/store/cart.html");
      cy.get("[data-testid='cart-item']").should("have.length", 1);
      cy.get("[data-testid='quantity-input']").should("have.value", "2");

      cy.visitWith(`/store/product.html?key=${TEE}`, { cart: null });
      cy.chooseVariant({ color: "Black", size: "S" });
      cy.get("#add-to-cart-btn").click();
      cy.location("pathname").should("eq", "/store/cart.html");
      cy.get("[data-testid='cart-item']").should("have.length", 2);
      cy.get("[data-testid='cart-count']").should("have.text", "3");
    });
  });
});
