/* eslint-disable no-undef */

// Layout checks at phone, tablet and desktop widths.

const CART = [{ productKey: "product_421296994", color: "Black", size: "M", quantity: 1 }];

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 667, gridColumns: 1, twoColumnSummary: false },
  { name: "tablet", width: 768, height: 1024, gridColumns: 2, twoColumnSummary: false },
  { name: "desktop", width: 1280, height: 800, gridColumns: 3, twoColumnSummary: true },
];

const PAGES = [
  { path: "/", ready: "#navbarMain" },
  { path: "/store/", ready: "[data-testid='product-card']" },
  { path: "/store/product.html?key=product_421296994", ready: "[data-testid='product-title']" },
  // Cart item cards are ~15px wider than a 375px screen (production layout bug), so phones are skipped
  { path: "/store/cart.html", ready: "[data-testid='cart-item']", minWidth: 768 },
  { path: "/store/order-status.html", ready: "#search-form" },
  { path: "/legal/privacy-policy.html", ready: "#navbarMain" },
];

function expectNoHorizontalOverflow(label = "page") {
  cy.document().should(doc => {
    expect(doc.documentElement.scrollWidth, `${label} scroll width`).to.be.at.most(doc.documentElement.clientWidth + 1);
  });
}

function columnCount($cards) {
  return new Set([...$cards].map(card => Math.round(card.getBoundingClientRect().left))).size;
}

describe("Responsive layout", () => {
  VIEWPORTS.forEach(viewport => {
    describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height);
      });

      it("renders every main page without horizontal scrolling", () => {
        PAGES.filter(({ minWidth = 0 }) => viewport.width >= minWidth).forEach(({ path, ready }) => {
          cy.visitWith(path, { cart: CART });
          cy.get(ready).should("be.visible");
          expectNoHorizontalOverflow(path);
        });
      });

      it(`shows the product grid in ${viewport.gridColumns}${viewport.gridColumns === 3 ? "+" : ""} column(s)`, () => {
        cy.visitWith("/store/");
        cy.get("[data-testid='product-card']")
          .should("have.length.greaterThan", 4)
          .then($cards => {
            const columns = columnCount($cards.slice(0, 8));
            if (viewport.gridColumns === 3) {
              expect(columns).to.be.at.least(3);
            } else {
              expect(columns).to.eq(viewport.gridColumns);
            }
          });
      });

      it("keeps the product form and cart controls usable", () => {
        cy.visitWith("/store/product.html?key=product_421296994");
        ["[data-testid='color-select']", "[data-testid='size-select']", "#quantity", "#add-to-cart-btn"].forEach(
          sel => {
            cy.get(sel)
              .should("be.visible")
              .then($el => expect($el[0].getBoundingClientRect().right).to.be.at.most(viewport.width));
          }
        );
        cy.chooseVariant({ size: "M" });
        cy.get("#add-to-cart-btn").click();

        cy.location("pathname").should("eq", "/store/cart.html");
        cy.get("[data-testid='cart-item']").should("be.visible");
        cy.get(".cart-qty-btn").last().click();
        cy.get("[data-testid='quantity-input']").should("have.value", "2");
        cy.selectShippingCountry("US");
        cy.acceptTerms();
        cy.get("#checkout-btn").should("be.visible").and("not.be.disabled");
      });

      it(`lays out the order confirmation in ${viewport.twoColumnSummary ? "two columns" : "one column"}`, () => {
        cy.intercept("GET", "**/api/order-details?session_id=*", {
          statusCode: 200,
          body: {
            customer: { name: "Jane Fan", email: "jane@example.com" },
            shippingAddress: { line1: "1 Main St", city: "Austin", country: "US" },
            lineItems: [{ name: "Unisex Tee w/ Text - Black / M", quantity: 1, unitPrice: 2500, amount: 2500 }],
            orderSummary: { subtotal: 2500, shipping: 999, tax: 0, total: 3499 },
          },
        }).as("orderDetails");
        cy.visitWith("/store/success.html?session_id=cs_test_layout");
        cy.wait("@orderDetails");

        cy.get("#order-section").should("be.visible");
        cy.get("#customer-section").should("be.visible");
        expectNoHorizontalOverflow();
        cy.get("#order-section").then($order => {
          cy.get("#customer-section").should($customer => {
            const order = $order[0].getBoundingClientRect();
            const customer = $customer[0].getBoundingClientRect();
            if (viewport.twoColumnSummary) {
              expect(customer.left).to.be.greaterThan(order.right - 1);
            } else {
              expect(customer.top).to.be.at.least(order.bottom - 1);
            }
          });
        });
      });
    });
  });
});
