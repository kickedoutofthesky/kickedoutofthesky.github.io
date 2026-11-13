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
      cy.title().should("eq", "Kicked Out Of The Sky | Pop Punk / Alt Rock | Official Website");
      cy.get("meta[name='description']").should("have.attr", "content").and("have.length.greaterThan", 20);
      cy.get("meta[name='viewport']").should("have.attr", "content").and("include", "width=device-width");
      cy.get("link[rel='canonical']").should("have.attr", "href", "https://www.kickedoutofthesky.com");
      cy.get("link[rel='icon']").should("have.attr", "href", "/img/star-64.ico");
      cy.get("meta[property='og:title']").should("have.attr", "content").and("eq", "Kicked Out Of The Sky");
      cy.get("meta[property='og:description']").should("have.attr", "content").and("not.be.empty");
      cy.get("meta[property='og:image']")
        .should("have.attr", "content")
        .and("match", /^https:\/\//);
      cy.get("meta[property='og:image']")
        .should("have.attr", "content")
        .and("match", /\/img\/og-image\.jpg$/);
      cy.get("meta[name='twitter:card']").should("have.attr", "content", "summary_large_image");
      cy.get("meta[name='twitter:image']")
        .should("have.attr", "content")
        .and("match", /^https:\/\//);
      cy.get("meta[property='og:url']").should("have.attr", "content", "https://www.kickedoutofthesky.com");
      cy.get("meta[property='og:type']").should("have.attr", "content", "website");
    });

    it("shows the main sections with in-page navigation", () => {
      cy.visitWith("/");
      ["Music", "Videos", "Merch", "Contact"].forEach(section => cy.contains("h2", section).should("exist"));
      ["#music", "#videos", "#contact"].forEach(anchor => {
        cy.get(`#siteNav a[href='${anchor}']`).should("exist");
        cy.get(anchor).should("exist");
      });
      cy.get("#tour").should("not.exist");
      cy.get("h1").should("contain.text", "Pop Punk / Alt Rock");
    });

    it("links Merch to the store", () => {
      cy.visitWith("/");
      cy.get("#siteNav a").contains("Merch").should("have.attr", "href", "/store/index.html");
      cy.get(".merch-tile").should("have.length", 3);
    });

    it("adds a More link to each Out now release card", () => {
      cy.visitWith("/");
      [
        ["Wasting My Life Away", "wastingmylifeaway"],
        ["Levity Of Lies", "levityoflies"],
        ["Kicked Out Of The Sky", "kickedoutofthesky"],
      ].forEach(([title, slug]) => {
        cy.contains(".release", title)
          .find("a.btn-small")
          .last()
          .should($a => expect($a.text().trim()).to.eq("More"))
          .and("have.attr", "href", `https://listen.kickedoutofthesky.com/${slug}`)
          .and("have.attr", "aria-label", `More platforms for ${title}`)
          .and("have.attr", "target", "_blank")
          .and("have.attr", "rel", "noopener");
      });
    });

    it("shows the out-now hero state and a listen button", () => {
      cy.visitWith("/");
      cy.get("#heroLabel").should("have.text", "OUT NOW");
      cy.get(".hero-date").should("not.exist");
      cy.get("#heroCta")
        .should("have.attr", "href", "https://listen.kickedoutofthesky.com/betterpartofme")
        .and("have.text", "Listen");
      cy.get("#countdown").should("not.exist");
    });

    it("loads YouTube only after the thumbnail is clicked", () => {
      cy.visitWith("/");
      cy.get("iframe").should("not.exist");
      cy.get(".yt-facade").first().click();
      cy.get("iframe.yt-frame").should("have.attr", "src").and("include", "youtube.com/embed/EmFTUu78lZg");
    });

    it("lists social and streaming links in the footer, opening in a new tab safely", () => {
      cy.visitWith("/");
      ["instagram.com", "facebook.com", "tiktok.com", "youtube.com", "open.spotify.com", "music.apple.com"].forEach(
        host => {
          cy.get(`footer a[href*='${host}']`)
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
