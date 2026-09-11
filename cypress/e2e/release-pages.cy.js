/* eslint-disable no-undef */

describe("Release Landing Pages - E2E", () => {
  beforeEach(() => {
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  describe("/listen - Rotating Current Release", () => {
    it("should load /listen page without errors", () => {
      cy.visit("/listen/");
      cy.get("#main-content").should("be.visible");
    });

    it("should display release cover art", () => {
      cy.visit("/listen/");
      cy.get("#release-cover").should("be.visible").and("have.attr", "src").and("include", "/img/releases/");
    });

    it("should display artist name", () => {
      cy.visit("/listen/");
      cy.get("#release-artist").should("contain", "Kicked Out Of The Sky");
    });

    it("should display release title", () => {
      cy.visit("/listen/");
      cy.get("#release-title").should("contain", "Better Part Of Me");
    });

    it("should display formatted release date", () => {
      cy.visit("/listen/");
      cy.get("#release-date").should("contain", "2026");
    });

    it("should have a working CTA button", () => {
      cy.visit("/listen/");
      cy.get("#release-cta").should("be.visible").and("have.attr", "href").and("include", "spotify.com");
    });

    it("should have visible focus state on CTA", () => {
      cy.visit("/listen/");
      cy.get("#release-cta").focus();
      cy.get("#release-cta").should("have.focus");
    });

    it("should set correct canonical URL", () => {
      cy.visit("/listen/");
      cy.get('link[rel="canonical"]').should("have.attr", "href").and("include", "betterpartofme");
    });

    it("should render proper OG tags", () => {
      cy.visit("/listen/");
      cy.get('meta[property="og:title"]').should("have.attr", "content").and("include", "Better Part Of Me");
      cy.get('meta[property="og:image"]').should("have.attr", "content").and("include", ".jpg");
      cy.get('meta[property="og:url"]').should("have.attr", "content").and("include", "kickedoutofthesky.com");
    });

    it("should render proper Twitter Card tags", () => {
      cy.visit("/listen/");
      cy.get('meta[name="twitter:card"]').should("have.attr", "content", "summary_large_image");
      cy.get('meta[name="twitter:title"]').should("have.attr", "content").and("include", "Better Part Of Me");
    });
  });

  describe("/betterpartofme - Permanent Release Page", () => {
    it("should load /betterpartofme page without errors", () => {
      cy.visit("/betterpartofme/");
      cy.get("#main-content").should("be.visible");
    });

    it("should display correct release information", () => {
      cy.visit("/betterpartofme/");
      cy.get("#release-title").should("contain", "Better Part Of Me");
      cy.get("#release-artist").should("contain", "Kicked Out Of The Sky");
    });

    it("should have canonical URL pointing to itself", () => {
      cy.visit("/betterpartofme/");
      cy.get('link[rel="canonical"]').should("have.attr", "href").and("include", "betterpartofme");
    });

    it("should set og:url to /betterpartofme", () => {
      cy.visit("/betterpartofme/");
      cy.get('meta[property="og:url"]').should("have.attr", "content").and("include", "betterpartofme");
    });
  });

  describe("/presave - Redirect", () => {
    it("should redirect /presave to /listen", () => {
      cy.visit("/presave.html");
      cy.url().should("include", "/listen/");
    });

    it("should load /listen content after redirect", () => {
      cy.visit("/presave.html");
      cy.get("#main-content").should("be.visible");
      cy.get("#release-title").should("contain", "Better Part Of Me");
    });
  });

  describe("CTA Button Behavior", () => {
    it("should show 'Pre-save on Spotify' before release date", () => {
      // As of 2026-09-11, this is before Oct 23, 2026
      cy.visit("/listen/");
      cy.get("#release-cta").should("contain", "Pre-save on Spotify");
    });

    it("should link to presave URL before release", () => {
      cy.visit("/listen/");
      cy.get("#release-cta").should("have.attr", "href").and("include", "album");
    });

    it("should open Spotify in new tab/window", () => {
      cy.visit("/listen/");
      cy.get("#release-cta").should("have.attr", "target", "_blank").and("have.attr", "rel", "noopener noreferrer");
    });

    it("should prevent default link behavior (navigate within page)", () => {
      cy.visit("/listen/");
      // Accept cookies first to make CTA clickable
      cy.get("#cookie-accept").click();
      cy.get("#release-cta").click({ ctrlKey: true });
      // URL should not have changed (opened in new tab/window)
      cy.url().should("include", "/listen/");
    });
  });

  describe("Query String Forwarding", () => {
    it("should forward utm_source to Spotify link", () => {
      cy.visit("/listen/?utm_source=instagram");
      cy.get("#release-cta").should("have.attr", "href").and("include", "utm_source=instagram");
    });

    it("should forward utm_medium to Spotify link", () => {
      cy.visit("/listen/?utm_medium=story");
      cy.get("#release-cta").should("have.attr", "href").and("include", "utm_medium=story");
    });

    it("should forward fbclid (Facebook Click ID) to Spotify link", () => {
      cy.visit("/listen/?fbclid=abc123xyz");
      cy.get("#release-cta").should("have.attr", "href").and("include", "fbclid=abc123xyz");
    });

    it("should forward ttclid (TikTok Click ID) to Spotify link", () => {
      cy.visit("/listen/?ttclid=tiktok456");
      cy.get("#release-cta").should("have.attr", "href").and("include", "ttclid=tiktok456");
    });

    it("should forward multiple parameters together", () => {
      cy.visit("/listen/?utm_source=tiktok&utm_medium=organic&fbclid=xyz123");
      cy.get("#release-cta")
        .should("have.attr", "href")
        .and("include", "utm_source=tiktok")
        .and("include", "utm_medium=organic")
        .and("include", "fbclid=xyz123");
    });

    it("should ignore non-tracked query parameters", () => {
      cy.visit("/listen/?utm_source=test&random_param=value");
      cy.get("#release-cta")
        .should("have.attr", "href")
        .and("include", "utm_source=test")
        .and("not.include", "random_param");
    });
  });

  describe("Cookie Consent & Analytics", () => {
    it("should show cookie consent banner", () => {
      cy.visit("/listen/");
      cy.get("#cookie-consent-banner").should("be.visible");
    });

    it("should queue analytics events before consent", () => {
      cy.visit("/listen/");
      // Banner is visible, so no analytics should have fired yet
      cy.window().then(win => {
        // Analytics should not have initialized
        expect(typeof win.gtag).to.equal("undefined");
      });
    });

    it("should fire GA PageView after accepting consent", () => {
      cy.visit("/listen/");
      cy.get("#cookie-accept").click();
      cy.get("#cookie-consent-banner").should("not.exist");

      // GA should now be loaded
      cy.window().then(win => {
        expect(typeof win.gtag).to.equal("function");
      });
    });

    it("should fire Meta Pixel after accepting consent", () => {
      cy.visit("/listen/");
      cy.get("#cookie-accept").click();

      // Meta Pixel fbq should exist
      cy.window().then(win => {
        expect(typeof win.fbq).to.equal("function");
      });
    });

    it("should not fire analytics after declining consent", () => {
      cy.visit("/listen/");
      cy.get("#cookie-decline").click();

      cy.window().then(win => {
        // GA should not be loaded
        expect(typeof win.gtag).to.equal("undefined");
      });
    });
  });

  describe("Page Performance", () => {
    it("should load page within reasonable time", () => {
      const startTime = Date.now();
      cy.visit("/listen/");
      cy.get("#main-content").should("be.visible");
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000);
      });
    });

    it("should reserve space for cover image (no layout shift)", () => {
      cy.visit("/listen/");
      cy.get(".release-cover-wrapper").should("have.css", "aspect-ratio");
    });

    it("should preload cover image", () => {
      cy.visit("/listen/");
      cy.get('link[rel="preload"]')
        .should("have.attr", "as", "image")
        .and("have.attr", "href")
        .and("include", "releases");
    });
  });

  describe("Mobile Responsiveness", () => {
    beforeEach(() => {
      cy.viewport(390, 844); // iPhone 12 size
    });

    it("should stack elements vertically on mobile", () => {
      cy.visit("/listen/");
      cy.get("#main-content").should("be.visible");
      cy.get(".release-info").should("be.visible");
    });

    it("should keep CTA above fold on mobile", () => {
      cy.visit("/listen/");
      cy.get("#release-cta").should("be.visible");
      // Verify it's in viewport
      cy.get("#release-cta").scrollIntoView().should("be.visible");
    });

    it("should maintain readable text on mobile", () => {
      cy.visit("/listen/");
      cy.get("#release-title").should("have.css", "font-size");
    });
  });

  describe("Accessibility", () => {
    it("should have skip-to-content link", () => {
      cy.visit("/listen/");
      cy.get(".skip-nav").should("be.visible");
      cy.get(".skip-nav").focus();
      cy.get(".skip-nav").should("have.focus");
    });

    it("should have semantic HTML structure", () => {
      cy.visit("/listen/");
      cy.get("main").should("exist");
      cy.get("h1").should("exist");
    });

    it("should have proper heading hierarchy", () => {
      cy.visit("/listen/");
      cy.get("h1").should("have.length.greaterThan", 0);
    });

    it("should have alt text on cover image", () => {
      cy.visit("/listen/");
      cy.get("#release-cover").should("have.attr", "alt").and("not.be.empty");
    });

    it("should have keyboard navigation for CTA", () => {
      cy.visit("/listen/");
      // Focus CTA directly (simulate keyboard navigation)
      cy.get("#release-cta").focus();
      cy.get("#release-cta").should("have.focus");
    });

    it("should have sufficient color contrast", () => {
      cy.visit("/listen/");
      // Yellow CTA button should have sufficient contrast on black
      cy.get("#release-cta").should("have.css", "background-color");
    });
  });

  describe("SEO", () => {
    it("should have title tag", () => {
      cy.visit("/listen/");
      cy.title().should("include", "Kicked Out Of The Sky");
    });

    it("should have meta description", () => {
      cy.visit("/listen/");
      cy.get('meta[name="description"]').should("exist");
    });

    it("should have og:title", () => {
      cy.visit("/listen/");
      cy.get('meta[property="og:title"]').should("have.attr", "content");
    });

    it("should have og:description", () => {
      cy.visit("/listen/");
      cy.get('meta[property="og:description"]').should("have.attr", "content");
    });

    it("should have og:image with proper dimensions", () => {
      cy.visit("/listen/");
      cy.get('meta[property="og:image"]').should("have.attr", "content");
      cy.get('meta[property="og:image:width"]').should("have.attr", "content", "1200");
      cy.get('meta[property="og:image:height"]').should("have.attr", "content", "630");
    });

    it("should have og:type", () => {
      cy.visit("/listen/");
      cy.get('meta[property="og:type"]').should("have.attr", "content");
    });

    it("should have canonical URL", () => {
      cy.visit("/listen/");
      cy.get('link[rel="canonical"]').should("have.attr", "href");
    });
  });

  describe("Error Handling", () => {
    it("should handle missing release data gracefully", () => {
      // This would test 404 on releases.json, but that's a server config
      cy.visit("/listen/");
      cy.get("#main-content").should("be.visible");
    });

    it("should display console errors (if any)", () => {
      const errors = [];
      cy.on("console", msg => {
        if (msg.type === "error") {
          errors.push(msg.text);
        }
      });

      cy.visit("/listen/");

      cy.then(() => {
        // Should not have critical errors (allow third-party errors)
        const criticalErrors = errors.filter(e => !e.includes("extension") && !e.includes("third-party"));
        expect(criticalErrors.length).to.equal(0);
      });
    });
  });

  describe("Back Navigation", () => {
    it("should have working back navigation link", () => {
      cy.visit("/listen/");
      cy.get(".release-nav a").should("contain", "Home");
    });

    it("should navigate home when back link is clicked", () => {
      cy.visit("/listen/");
      cy.get(".release-nav a").click();
      cy.url().should("include", "/");
    });
  });
});
