/* eslint-disable no-undef */

// Main site: home page, legal pages (shared navbar from navbar.html) and 404.

const LEGAL_PAGES = [
  { path: "/legal/terms-and-conditions.html", heading: "Terms" },
  { path: "/legal/privacy-policy.html", heading: "Privacy Policy" },
  { path: "/legal/cookie-policy.html", heading: "Cookie Policy" },
  { path: "/legal/shipping-policy.html", heading: "Shipping" },
  { path: "/legal/disclaimer.html", heading: "Disclaimer" },
  { path: "/legal/contact.html", heading: "Contact" },
  { path: "/legal/copyright-notice.html", heading: "Copyright" },
  { path: "/legal/accessibility-statement.html", heading: "Accessibility" },
];

describe("Main site", () => {
  describe("Home page", () => {
    it("loads without console errors", () => {
      cy.visitWith("/", {
        onBeforeLoad: win => cy.spy(win.console, "error").as("consoleError"),
      });
      cy.get("#navbarMain").should("be.visible");
      cy.get("@consoleError").should("not.have.been.called");
    });

    it("has the title, description, canonical, favicon and social sharing tags", () => {
      cy.visitWith("/");
      cy.title().should("eq", "Kicked Out of the Sky | Indie / Alternative Rock Band | Official Website");
      cy.get("meta[name='description']").should("have.attr", "content").and("have.length.greaterThan", 20);
      cy.get("meta[name='viewport']").should("have.attr", "content").and("include", "width=device-width");
      cy.get("link[rel='canonical']").should("have.attr", "href", "https://www.kickedoutofthesky.com");
      cy.get("link[rel='icon']").should("have.attr", "href", "/img/star-64.ico");
      cy.get("meta[property='og:title']").should("have.attr", "content").and("include", "Kicked Out of the Sky");
      cy.get("meta[property='og:description']").should("have.attr", "content").and("not.be.empty");
      cy.get("meta[property='og:image']")
        .should("have.attr", "content")
        .and("match", /^https:\/\//);
      cy.get("meta[property='og:url']").should("have.attr", "content", "https://www.kickedoutofthesky.com");
      cy.get("meta[property='og:type']").should("have.attr", "content", "website");
    });

    it("shows the main sections with in-page navigation", () => {
      cy.visitWith("/");
      ["VIDEOS", "TOUR", "CONTACT"].forEach(section => cy.contains("h2", section).should("exist"));
      ["#music", "#videos", "#tour", "#contact"].forEach(anchor => {
        cy.get(`#navbarMain a[href='${anchor}']`).should("exist");
        cy.get(anchor).should("exist");
      });
    });

    it("opens the merch store in a separate tab", () => {
      cy.visitWith("/", { onBeforeLoad: win => cy.stub(win, "open").as("windowOpen") });
      cy.get("#navbarMain a").contains("Merch").click();
      cy.get("@windowOpen").should("have.been.calledWith", "/store/index.html", "storeTab");
      cy.location("pathname").should("eq", "/");
    });

    it("opens social and streaming links in a new tab safely", () => {
      cy.visitWith("/");
      ["instagram.com", "facebook.com", "tiktok.com", "youtube.com", "open.spotify.com", "music.apple.com"].forEach(
        host => {
          cy.get(`#navbarMain a[href*='${host}']`)
            .should("have.attr", "target", "_blank")
            .and("have.attr", "rel")
            .and("include", "noopener");
        }
      );
    });

    it("gives every image alt text and every link an accessible name", () => {
      cy.visitWith("/");
      cy.get("img").each($img => expect($img).to.have.attr("alt"));
      cy.get("a").each($link => {
        const hasName = $link.text().trim() || $link.attr("aria-label") || $link.find("img[alt], svg, i").length;
        expect(Boolean(hasName), $link.attr("href")).to.be.true;
      });
    });
  });

  describe("Legal pages", () => {
    it("load their content with the shared navbar and no draft banner", () => {
      LEGAL_PAGES.forEach(({ path, heading }) => {
        cy.visitWith(path);
        cy.get(".legal-container h1").should("contain", heading);
        cy.get("#navbarMain").should("be.visible");
        cy.get("#navbarMain a[href='/store/cart.html']").should("exist");
        cy.contains("DRAFT").should("not.exist");
      });
    });

    it("show the cart count in the shared navbar", () => {
      cy.visitWith("/legal/contact.html", {
        cart: [{ productKey: "product_421296994", color: "Black", size: "M", quantity: 2 }],
      });
      cy.get("[data-testid='cart-count']").should("be.visible").and("have.text", "2");
    });
  });

  describe("404 page", () => {
    it("offers links back to the home page and the store", () => {
      cy.visitWith("/404.html");
      cy.title().should("include", "404 - Page Not Found");
      cy.contains("h1", "Page Not Found").should("be.visible");
      cy.contains("a", "Return to Home").should("have.attr", "href", "/");
      cy.contains("a", "Browse Store").should("have.attr", "href", "/store");
    });

    it("responds with 404 for unknown URLs", () => {
      cy.request({ url: "/this-page-does-not-exist", failOnStatusCode: false }).its("status").should("eq", 404);
    });
  });
});
