/* eslint-disable no-undef */

// Focused form fields share one style across the store (styles.css .store-field, matching the cart)

const FOCUS_PROPS = [
  "backgroundColor",
  "borderTopColor",
  "color",
  "outlineStyle",
  "outlineWidth",
  "outlineColor",
  "outlineOffset",
  "boxShadow",
];

const styleOf = el => {
  const style = getComputedStyle(el);
  return Object.fromEntries(FOCUS_PROPS.map(prop => [prop, style[prop]]));
};

// Bootstrap fields animate border/box-shadow on focus, so the comparison retries until it settles
const expectFocusedLike = (selector, expected) => {
  cy.get(selector).focus();
  cy.get(selector).should($el => {
    expect($el[0], `${selector} focused`).to.eq($el[0].ownerDocument.activeElement);
    expect(styleOf($el[0]), `${selector} focus style`).to.deep.equal(expected);
  });
};

describe("Form field focus style", () => {
  it("highlights product page and order status fields the same way as the cart's", () => {
    cy.visitWith("/store/cart.html", {
      cart: [{ productKey: "product_421296994", color: "Black", size: "M", quantity: 1 }],
    });
    // Fields can only take focus once the cart has rendered (the summary is hidden until then)
    cy.get("[data-testid='cart-item']").should("be.visible");
    cy.get("#shipping-country option").should("have.length.greaterThan", 1);
    cy.get("#shipping-country").focus().should("have.focus");
    // Let any focus transition finish before taking the cart's style as the reference
    cy.get("#shipping-country").should($el => expect(getComputedStyle($el[0]).boxShadow).to.include("255, 193, 7"));
    cy.get("#shipping-country").then($el => {
      const cartStyle = styleOf($el[0]);
      expect(cartStyle.outlineStyle, "cart outline").to.eq("solid");
      expect(cartStyle.outlineColor, "cart outline colour").to.eq("rgb(255, 193, 7)");

      cy.visitWith("/store/product.html?key=product_421296994");
      cy.get("[data-testid='product-title']").should("be.visible");
      ["#color", "#size", "#quantity"].forEach(selector => {
        expectFocusedLike(selector, cartStyle);
      });

      cy.visitWith("/store/order-status.html", { onBeforeLoad: win => win.sessionStorage.clear() });
      cy.get("#search-form").should("be.visible");
      ["#printful-order-id", "#email"].forEach(selector => {
        expectFocusedLike(selector, cartStyle);
      });
    });
  });
});
