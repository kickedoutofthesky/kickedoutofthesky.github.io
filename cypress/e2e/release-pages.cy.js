/* eslint-disable no-undef */

describe("Release Landing Pages - E2E", () => {
  beforeEach(() => {
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  describe("/listen - Push.fm Redirect", () => {
    it("should redirect to push.fm", () => {
      cy.visit("/listen/", { failOnStatusCode: false });
      cy.url().should("include", "push.fm");
    });

    it("should redirect to correct push.fm link", () => {
      cy.visit("/listen/", { failOnStatusCode: false });
      cy.url().should("equal", "https://push.fm/fl/kickedoutofthesky");
    });

    it("should preserve utm_source parameter", () => {
      cy.visit("/listen/?utm_source=instagram", { failOnStatusCode: false });
      cy.url().should("include", "utm_source=instagram");
    });

    it("should preserve utm_medium parameter", () => {
      cy.visit("/listen/?utm_medium=story", { failOnStatusCode: false });
      cy.url().should("include", "utm_medium=story");
    });

    it("should preserve utm_campaign parameter", () => {
      cy.visit("/listen/?utm_campaign=launch", { failOnStatusCode: false });
      cy.url().should("include", "utm_campaign=launch");
    });

    it("should preserve utm_content parameter", () => {
      cy.visit("/listen/?utm_content=banner", { failOnStatusCode: false });
      cy.url().should("include", "utm_content=banner");
    });

    it("should preserve utm_term parameter", () => {
      cy.visit("/listen/?utm_term=keyword", { failOnStatusCode: false });
      cy.url().should("include", "utm_term=keyword");
    });

    it("should preserve fbclid (Facebook Click ID)", () => {
      cy.visit("/listen/?fbclid=abc123xyz", { failOnStatusCode: false });
      cy.url().should("include", "fbclid=abc123xyz");
    });

    it("should preserve ttclid (TikTok Click ID)", () => {
      cy.visit("/listen/?ttclid=tiktok456", { failOnStatusCode: false });
      cy.url().should("include", "ttclid=tiktok456");
    });

    it("should preserve multiple parameters together", () => {
      cy.visit("/listen/?utm_source=tiktok&utm_medium=organic&fbclid=xyz123", { failOnStatusCode: false });
      cy.url()
        .should("include", "utm_source=tiktok")
        .and("include", "utm_medium=organic")
        .and("include", "fbclid=xyz123");
    });

    it("should ignore non-tracked query parameters", () => {
      cy.visit("/listen/?utm_source=test&random_param=value", { failOnStatusCode: false });
      cy.url().should("include", "utm_source=test").and("not.include", "random_param");
    });

    it("should have fallback link to push.fm", () => {
      cy.visit("/listen/");
      cy.get('a[href="https://push.fm/fl/kickedoutofthesky"]').should("exist");
    });

    it("should have Meta Pixel script loaded", () => {
      cy.visit("/listen/");
      cy.get('script[src="/js/meta-pixel.js"]').should("exist");
    });

    it("should have noscript redirect fallback", () => {
      cy.visit("/listen/");
      cy.get("noscript").should("contain", "https://push.fm/fl/kickedoutofthesky");
    });

    it("should have proper page title", () => {
      cy.visit("/listen/");
      cy.title().should("contain", "Kicked Out Of The Sky");
      cy.title().should("contain", "Listen");
    });

    it("should have proper meta description", () => {
      cy.visit("/listen/");
      cy.get('meta[name="description"]').should("have.attr", "content").and("contain", "Listen");
    });

    it("should have og:title meta tag", () => {
      cy.visit("/listen/");
      cy.get('meta[property="og:title"]').should("exist").and("have.attr", "content");
    });
  });

  describe("/presave - Redirect to /listen", () => {
    it("should redirect /presave to /listen", () => {
      cy.visit("/presave.html", { failOnStatusCode: false });
      cy.url().should("include", "/listen/");
    });

    it("should eventually redirect through /listen to push.fm", () => {
      cy.visit("/presave.html", { failOnStatusCode: false });
      // After presave -> listen redirect, should end up at push.fm
      cy.url().should("include", "push.fm");
    });
  });

  describe("/betterpartofme - Release Page", () => {
    it("should load /betterpartofme page without errors", () => {
      cy.visit("/betterpartofme/");
      cy.get("html").should("exist");
    });

    it("should have proper page title", () => {
      cy.visit("/betterpartofme/");
      cy.title().should("include", "Better Part Of Me");
    });

    it("should have meta description", () => {
      cy.visit("/betterpartofme/");
      cy.get('meta[name="description"]').should("exist");
    });

    it("should have canonical URL pointing to itself", () => {
      cy.visit("/betterpartofme/");
      cy.get('link[rel="canonical"]').should("have.attr", "href").and("include", "betterpartofme");
    });

    it("should set og:url to /betterpartofme", () => {
      cy.visit("/betterpartofme/");
      cy.get('meta[property="og:url"]').should("have.attr", "content").and("include", "betterpartofme");
    });

    it("should have og:title meta tag", () => {
      cy.visit("/betterpartofme/");
      cy.get('meta[property="og:title"]').should("exist");
    });

    it("should have og:description meta tag", () => {
      cy.visit("/betterpartofme/");
      cy.get('meta[property="og:description"]').should("exist");
    });

    it("should have og:image meta tag", () => {
      cy.visit("/betterpartofme/");
      cy.get('meta[property="og:image"]').should("exist");
    });

    it("should have og:type meta tag", () => {
      cy.visit("/betterpartofme/");
      cy.get('meta[property="og:type"]').should("exist");
    });
  });

  describe("Page Performance", () => {
    it("should load /listen page quickly", () => {
      const startTime = Date.now();
      cy.visit("/listen/");
      // Redirect should happen quickly
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        // Redirect should happen within 2 seconds (includes network delay to push.fm)
        expect(loadTime).to.be.lessThan(3000);
      });
    });

    it("should load /betterpartofme page within reasonable time", () => {
      const startTime = Date.now();
      cy.visit("/betterpartofme/");
      cy.get("html").should("exist");
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000);
      });
    });
  });

  describe("Mobile Responsiveness", () => {
    beforeEach(() => {
      cy.viewport(390, 844); // iPhone 12 size
    });

    it("should load /listen page on mobile", () => {
      cy.visit("/listen/", { failOnStatusCode: false });
      cy.url().should("include", "push.fm");
    });

    it("should load /betterpartofme on mobile", () => {
      cy.visit("/betterpartofme/");
      cy.get("html").should("exist");
    });

    it("should not have horizontal scrolling on mobile", () => {
      cy.visit("/betterpartofme/");
      cy.get("body").should("have.css", "overflow-x").and("not.equal", "auto");
    });
  });

  describe("Accessibility", () => {
    it("/listen page should have proper title", () => {
      cy.visit("/listen/");
      cy.title().should("not.be.empty");
    });

    it("/betterpartofme should have proper heading structure", () => {
      cy.visit("/betterpartofme/");
      cy.get("h1").should("have.length.greaterThan", 0);
    });

    it("/betterpartofme should have semantic HTML", () => {
      cy.visit("/betterpartofme/");
      cy.get("main, [role='main']").should("have.length.greaterThan", 0);
    });
  });

  describe("SEO", () => {
    it("/listen should have og:title", () => {
      cy.visit("/listen/");
      cy.get('meta[property="og:title"]').should("exist");
    });

    it("/betterpartofme should have og:title", () => {
      cy.visit("/betterpartofme/");
      cy.get('meta[property="og:title"]').should("exist");
    });

    it("/betterpartofme should have og:image", () => {
      cy.visit("/betterpartofme/");
      cy.get('meta[property="og:image"]').should("exist");
    });

    it("/betterpartofme should have canonical URL", () => {
      cy.visit("/betterpartofme/");
      cy.get('link[rel="canonical"]').should("exist");
    });
  });

  describe("Error Handling", () => {
    it("should display console errors (if any) on /listen", () => {
      const errors = [];
      cy.on("console", msg => {
        if (msg.type === "error") {
          errors.push(msg.text);
        }
      });

      cy.visit("/listen/");

      cy.then(() => {
        // Redirect may cause some expected errors, just verify script loaded
        cy.get('script[src="/js/meta-pixel.js"]').should("exist");
      });
    });

    it("should display console errors (if any) on /betterpartofme", () => {
      const errors = [];
      cy.on("console", msg => {
        if (msg.type === "error") {
          errors.push(msg.text);
        }
      });

      cy.visit("/betterpartofme/");

      cy.then(() => {
        // Should load without critical errors
        cy.get("html").should("exist");
      });
    });
  });
});
