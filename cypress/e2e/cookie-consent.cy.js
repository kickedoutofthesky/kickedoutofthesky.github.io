/* eslint-disable no-undef */

describe("Cookie Consent Banner", () => {
  beforeEach(() => {
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  describe("Banner Display", () => {
    it("should show cookie consent banner on first visit", () => {
      cy.visit("/");
      cy.get("#cookie-consent-banner").should("be.visible");
    });

    it("should show banner on store pages", () => {
      cy.visit("/store");
      cy.get("#cookie-consent-banner").should("be.visible");
    });

    it("should have Accept and Decline buttons", () => {
      cy.visit("/");
      cy.get("#cookie-accept").should("be.visible").and("contain", "Accept");
      cy.get("#cookie-decline").should("be.visible").and("contain", "Decline");
    });

    it("should link to cookie policy page", () => {
      cy.visit("/");
      cy.get("#cookie-consent-banner a")
        .should("contain", "Cookie Policy")
        .and("have.attr", "href")
        .and("include", "cookie-policy.html");
    });

    it("should have proper accessibility attributes", () => {
      cy.visit("/");
      cy.get("#cookie-consent-banner")
        .should("have.attr", "role", "dialog")
        .and("have.attr", "aria-label", "Cookie consent");
    });
  });

  describe("Accept Consent", () => {
    it("should remove banner when Accept is clicked", () => {
      cy.visit("/");
      cy.get("#cookie-consent-banner").should("be.visible");
      cy.get("#cookie-accept").click();
      cy.get("#cookie-consent-banner").should("not.exist");
    });

    it("should store acceptance in localStorage", () => {
      cy.visit("/");
      cy.get("#cookie-accept").click();
      cy.window().then(win => {
        expect(win.localStorage.getItem("cookie_consent")).to.equal("accepted");
      });
    });

    it("should not show banner on subsequent visits after acceptance", () => {
      cy.visit("/");
      cy.get("#cookie-accept").click();
      cy.visit("/");
      cy.get("#cookie-consent-banner").should("not.exist");
    });
  });

  describe("Decline Consent", () => {
    it("should remove banner when Decline is clicked", () => {
      cy.visit("/");
      cy.get("#cookie-consent-banner").should("be.visible");
      cy.get("#cookie-decline").click();
      cy.get("#cookie-consent-banner").should("not.exist");
    });

    it("should store decline in localStorage", () => {
      cy.visit("/");
      cy.get("#cookie-decline").click();
      cy.window().then(win => {
        expect(win.localStorage.getItem("cookie_consent")).to.equal("declined");
      });
    });

    it("should not show banner on subsequent visits after decline", () => {
      cy.visit("/");
      cy.get("#cookie-decline").click();
      cy.visit("/");
      cy.get("#cookie-consent-banner").should("not.exist");
    });
  });

  describe("Analytics Script Loading", () => {
    it("should include analytics.js on the page", () => {
      cy.visit("/");
      cy.get("script[src*='analytics.js']").should("exist");
    });

    it("should include analytics.js on store pages", () => {
      cy.visit("/store");
      cy.get("script[src*='analytics.js']").should("exist");
    });
  });
});

describe("Legal Pages — No Draft Banner", () => {
  const legalPages = [
    "/legal/terms-and-conditions.html",
    "/legal/privacy-policy.html",
    "/legal/cookie-policy.html",
    "/legal/shipping-policy.html",
    "/legal/disclaimer.html",
    "/legal/contact.html",
    "/legal/copyright-notice.html",
    "/legal/accessibility-statement.html",
  ];

  legalPages.forEach(page => {
    it(`should not show draft banner on ${page.split("/").pop()}`, () => {
      cy.visit(page);
      cy.get(".draft-banner").should("not.exist");
      cy.contains("DRAFT").should("not.exist");
    });
  });

  it("should show cookie consent banner on legal pages", () => {
    cy.visit("/legal/privacy-policy.html");
    cy.get("#cookie-consent-banner").should("be.visible");
  });

  it("should include analytics.js on legal pages", () => {
    cy.visit("/legal/privacy-policy.html");
    cy.get("script[src*='analytics.js']").should("exist");
  });
});
