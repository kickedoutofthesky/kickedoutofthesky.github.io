/* eslint-disable no-undef */

// Cookie consent banner (js/cookie-consent.js) gating Google Analytics (js/analytics.js).

const gaScript = "script[src*='googletagmanager.com/gtag/js']";

describe("Cookie consent", () => {
  describe("Banner", () => {
    [
      { path: "/", policyHref: "legal/cookie-policy.html" },
      { path: "/store/", policyHref: "../legal/cookie-policy.html" },
      { path: "/legal/privacy-policy.html", policyHref: "cookie-policy.html" },
    ].forEach(({ path, policyHref }) => {
      it(`is shown on first visit to ${path} with a working Cookie Policy link`, () => {
        cy.visitWith(path, { consent: null });

        cy.get("#cookie-consent-banner")
          .should("be.visible")
          .and("have.attr", "role", "dialog")
          .and("have.attr", "aria-label", "Cookie consent");
        cy.get("#cookie-accept").should("be.visible").and("have.text", "Accept");
        cy.get("#cookie-decline").should("be.visible").and("have.text", "Decline");
        cy.get("#cookie-consent-banner a").should("have.attr", "href", policyHref).click();
        cy.location("pathname").should("eq", "/legal/cookie-policy.html");
      });
    });

    it("does not load Google Analytics before a choice is made", () => {
      cy.visitWith("/", { consent: null });
      cy.get("#cookie-consent-banner").should("be.visible");
      cy.get(gaScript).should("not.exist");
      cy.window().its("_gaLoaded").should("be.undefined");
    });
  });

  describe("Accept", () => {
    it("hides the banner, remembers the choice and loads Google Analytics", () => {
      cy.visitWith("/", { consent: null });
      cy.get("#cookie-accept").click();

      cy.get("#cookie-consent-banner").should("not.exist");
      cy.window().its("localStorage").invoke("getItem", "cookie_consent").should("eq", "accepted");
      cy.get(gaScript).should("exist");
      cy.window().its("_gaLoaded").should("eq", true);
    });

    it("loads Google Analytics without the banner on later visits", () => {
      cy.visitWith("/store/", { consent: "accepted" });
      cy.get("[data-testid='product-card']").should("have.length.greaterThan", 0);
      cy.get("#cookie-consent-banner").should("not.exist");
      cy.get(gaScript).should("exist");
    });
  });

  describe("Decline", () => {
    it("hides the banner, remembers the choice and keeps Google Analytics off", () => {
      cy.visitWith("/", { consent: null });
      cy.get("#cookie-decline").click();

      cy.get("#cookie-consent-banner").should("not.exist");
      cy.window().its("localStorage").invoke("getItem", "cookie_consent").should("eq", "declined");
      cy.get(gaScript).should("not.exist");

      cy.reload();
      cy.get("#navbarMain").should("be.visible");
      cy.get("#cookie-consent-banner").should("not.exist");
      cy.get(gaScript).should("not.exist");
    });
  });
});
