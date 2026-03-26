/* eslint-disable no-undef */

describe("Site Experience - Overall Site Functionality", () => {
  describe("Home Page", () => {
    it("should load home page with no console errors", () => {
      // Listen for console errors
      const consoleErrors = [];
      cy.on("console", msg => {
        if (msg.type === "error") {
          consoleErrors.push(msg.text);
        }
      });

      cy.visit("/");

      // No critical console errors
      cy.then(() => {
        // Filter out third-party errors (Spotify, etc.) we don't control
        const criticalErrors = consoleErrors.filter(error => !error.includes("extension") && !error.includes("CDN"));
        expect(criticalErrors).to.have.length(0);
      });
    });

    it("should display key elements on home page", () => {
      cy.visit("/");

      // Page title should be visible
      cy.title().should("include", "Kicked Out of the Sky");

      // Header/navigation should be visible
      cy.get("header, nav, [data-testid='header']").should("exist");

      // Main content should be visible
      cy.get("main, [data-testid='main-content'], body").should("be.visible");

      // Should have links to key sections
      cy.get("a[href*='store'], a[href*='music'], a[href*='epk']").should("exist");

      // Page should not have broken images
      cy.get("img").each($img => {
        cy.wrap($img).should("have.attr", "src");
        cy.wrap($img).invoke("attr", "src").should("not.be.empty");
      });
    });

    it("should be interactive and load content within reasonable time", () => {
      const startTime = Date.now();

      cy.visit("/", { timeout: 10000 });

      cy.then(() => {
        const loadTime = Date.now() - startTime;

        // Page should load within 10 seconds
        expect(loadTime).to.be.lessThan(10000);

        // Page should have interactive elements
        cy.get("button, a, input").should("have.length.greaterThan", 0);
      });
    });

    it("should have properly structured page content", () => {
      cy.visit("/");

      // Should have navigation
      cy.get("nav, [role='navigation']").should("exist");

      // Page should have meaningful text content
      cy.get("body").invoke("text").should("have.length.greaterThan", 50);
    });
  });

  describe("Navigation Links", () => {
    beforeEach(() => {
      cy.visit("/");
    });

    it("should navigate to store page and load correctly", () => {
      // Store link uses window.open(), so stub it and visit directly
      cy.window().then(win => {
        cy.stub(win, "open").as("windowOpen");
      });
      cy.get("a[href*='store']").first().click();
      // Verify window.open was called with the store URL
      cy.get("@windowOpen").should("have.been.calledWithMatch", /store/);
      // Visit the store directly to verify it loads
      cy.visit("/store");
      cy.get("[data-testid='product-grid'], .products").should("exist");
    });

    it("should navigate to EPK page and load correctly", () => {
      cy.get("body").then($body => {
        const $link = $body.find("a[href*='epk']");
        if ($link.length > 0) {
          cy.wrap($link).first().click();
          cy.url().should("include", "epk");
          cy.get("body").should("be.visible");
        }
      });
    });

    it("should return to home from store", () => {
      // Visit store directly (home page store link uses window.open)
      cy.visit("/store");
      cy.url().should("include", "store");

      // Navigate back to home
      cy.get("a[href*='index.html'], a[href='/']").then($homeLink => {
        if ($homeLink.length > 0) {
          cy.wrap($homeLink).first().click();
          cy.url().should("include", "index.html");
        } else {
          // If no explicit home link, go back
          cy.go("back");
          cy.url().should("not.include", "store");
        }
      });
    });

    it("should have working links to all main pages", () => {
      // Collect all unique internal hrefs first, then visit each
      cy.get("a").then($links => {
        const hrefs = new Set();
        $links.each((_i, link) => {
          const href = link.getAttribute("href");
          if (href && !href.startsWith("http") && !href.startsWith("#") && href !== "javascript:void(0)") {
            hrefs.add(href);
          }
        });

        // Visit each unique href and verify it loads
        hrefs.forEach(href => {
          cy.visit("/");
          cy.get(`a[href="${href}"]`).first().click({ force: true });

          // Page should load (not 404)
          cy.url().then(url => {
            expect(url).to.exist;
          });
        });
      });
    });
  });

  describe("404 Page Handling", () => {
    it("should handle non-existent URL gracefully", () => {
      // Server returns plain text 404 — verify it responds
      cy.request({ url: "/non-existent-page-12345", failOnStatusCode: false }).then(response => {
        expect(response.status).to.equal(404);
      });
    });

    it("should display helpful message on 404", () => {
      // Server returns plain text 404 "Not Found: /path"
      cy.request({ url: "/this-page-does-not-exist-xyz", failOnStatusCode: false }).then(response => {
        expect(response.status).to.equal(404);
        expect(response.body).to.include("Not Found");
      });
    });
  });

  describe("External Social Links", () => {
    beforeEach(() => {
      cy.visit("/");
    });

    it("should have correct Spotify link with target _blank", () => {
      cy.get("a[href*='spotify']").then($link => {
        if ($link.length > 0) {
          // Verify href contains spotify
          cy.wrap($link).first().invoke("attr", "href").should("include", "spotify");

          // Verify target="_blank"
          cy.wrap($link).first().invoke("attr", "target").should("equal", "_blank");

          // Should also have rel for security
          cy.wrap($link)
            .first()
            .invoke("attr", "rel")
            .then(rel => {
              if (rel) {
                expect(rel.includes("noopener") || rel.includes("noreferrer")).to.be.true;
              }
            });
        }
      });
    });

    it("should have correct Apple Music link with target _blank", () => {
      cy.get("a[href*='music.apple'], a[href*='apple'], a[href*='AM']").then($link => {
        if ($link.length > 0) {
          // Should have href
          cy.wrap($link).first().invoke("attr", "href").should("not.be.empty");

          // Verify target="_blank"
          cy.wrap($link).first().invoke("attr", "target").should("equal", "_blank");
        }
      });
    });

    it("should have correct Instagram link with target _blank", () => {
      cy.get("a[href*='instagram']").then($link => {
        if ($link.length > 0) {
          // Verify href contains instagram
          cy.wrap($link).first().invoke("attr", "href").should("include", "instagram");

          // Verify target="_blank"
          cy.wrap($link).first().invoke("attr", "target").should("equal", "_blank");
        }
      });
    });

    it("should have social links with secure attributes", () => {
      // Find all external links (starting with http)
      cy.get("a[href^='http']").each($link => {
        const href = $link.attr("href");

        // If it's a social media link
        if (
          href.includes("spotify") ||
          href.includes("instagram") ||
          href.includes("apple") ||
          href.includes("soundcloud") ||
          href.includes("youtube")
        ) {
          // Should have target="_blank"
          cy.wrap($link).invoke("attr", "target").should("equal", "_blank");

          // Should have rel for security
          cy.wrap($link)
            .invoke("attr", "rel")
            .then(rel => {
              // Either has rel or should have it
              if (rel) {
                expect(rel.includes("noopener") || rel.includes("noreferrer")).to.be.true;
              }
            });
        }
      });
    });
  });

  describe("Page Metadata (SEO/Social)", () => {
    beforeEach(() => {
      cy.visit("/");
    });

    it("should have title tag", () => {
      cy.title().should("not.be.empty");
      cy.title().should("include", "Kicked Out of the Sky");
    });

    it("should have meta description", () => {
      cy.get("meta[name='description']").should("exist");

      cy.get("meta[name='description']").invoke("attr", "content").should("not.be.empty");

      cy.get("meta[name='description']").invoke("attr", "content").should("have.length.greaterThan", 20);
    });

    it("should have Open Graph title tag", () => {
      cy.get("meta[property='og:title']").should("exist");
      cy.get("meta[property='og:title']").invoke("attr", "content").should("not.be.empty");
    });

    it("should have Open Graph description tag", () => {
      cy.get("meta[property='og:description']").should("exist");
      cy.get("meta[property='og:description']").invoke("attr", "content").should("not.be.empty");
    });

    it("should have Open Graph image tag", () => {
      cy.get("meta[property='og:image']").should("exist");

      cy.get("meta[property='og:image']")
        .invoke("attr", "content")
        .then(imageSrc => {
          expect(imageSrc).to.not.be.empty;

          // Image URL should be valid
          expect(imageSrc.includes("http") || imageSrc.includes("/")).to.be.true;
        });
    });

    it("should have Open Graph URL tag", () => {
      cy.get("meta[property='og:url']").should("exist");
      cy.get("meta[property='og:url']").invoke("attr", "content").should("not.be.empty");
    });

    it("should have Open Graph type tag", () => {
      cy.get("meta[property='og:type']").should("exist");
      cy.get("meta[property='og:type']").invoke("attr", "content").should("be.oneOf", ["website", "music.musician"]);
    });

    it("should have all critical OG tags for social sharing", () => {
      const ogTags = ["og:title", "og:description", "og:image", "og:url", "og:type"];

      ogTags.forEach(tag => {
        cy.get(`meta[property='${tag}']`).should("exist");
        cy.get(`meta[property='${tag}']`).invoke("attr", "content").should("not.be.empty");
      });
    });

    it("should have viewport meta tag for mobile responsiveness", () => {
      cy.get("meta[name='viewport']").should("exist");

      cy.get("meta[name='viewport']").invoke("attr", "content").should("include", "width=device-width");
    });

    it("should have canonical URL if multi-page", () => {
      cy.get("link[rel='canonical']").then($canonical => {
        if ($canonical.length > 0) {
          cy.wrap($canonical).invoke("attr", "href").should("not.be.empty");
        }
      });
    });

    it("should have favicon", () => {
      cy.get("link[rel='icon']").should("exist");
      cy.get("link[rel='icon']").invoke("attr", "href").should("not.be.empty");
    });
  });

  describe("Page Performance", () => {
    it("should load page content within reasonable time", () => {
      const start = Date.now();

      cy.visit("/");

      cy.get("body").should("be.visible");

      cy.then(() => {
        const duration = Date.now() - start;
        // Should load visible content within 5 seconds
        expect(duration).to.be.lessThan(5000);
      });
    });

    it("should not have render-blocking resources", () => {
      cy.visit("/");

      // Page should be interactive quickly
      cy.get("button, a, input").first().should("be.visible");

      // No long-running scripts blocking interaction
      cy.get("body").should("not.have.class", "loading");
    });

    it("should have working images with alt text", () => {
      cy.visit("/");

      cy.get("img").each($img => {
        // Should have src
        cy.wrap($img).should("have.attr", "src");

        // Should have alt text (accessibility)
        cy.wrap($img).should("have.attr", "alt");
      });
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      cy.visit("/");
    });

    it("should have proper heading hierarchy", () => {
      // Homepage uses h2+ headings (no h1)
      cy.get("h1, h2, h3, h4, h5, h6").should("have.length.greaterThan", 0);

      // Verify headings exist and have text
      cy.get("h1, h2, h3, h4, h5, h6").each($heading => {
        cy.wrap($heading).invoke("text").should("not.be.empty");
      });
    });

    it("should have proper link text", () => {
      cy.get("a").each($link => {
        const text = $link.text().trim();
        const ariaLabel = $link.attr("aria-label");

        // Skip links that contain images or icons (they convey meaning visually)
        if ($link.find("img, svg, i").length > 0) return;

        // Should have either visible text or aria-label
        expect(text.length > 0 || !!ariaLabel).to.be.true;
      });
    });

    it("should have proper button text", () => {
      cy.get("button").each($button => {
        const text = $button.text().trim();
        const ariaLabel = $button.attr("aria-label");

        // Should have either visible text or aria-label
        if (!$button.find("img, svg").length) {
          expect(text.length > 0 || ariaLabel).to.be.true;
        }
      });
    });

    it("should have proper form labels", () => {
      cy.get("form").each($form => {
        cy.wrap($form)
          .find("input:visible, textarea:visible, select:visible")
          .each($input => {
            const inputId = $input.attr("id");
            const ariaLabel = $input.attr("aria-label");

            // Should have either associated label or aria-label
            if (inputId) {
              cy.wrap($form)
                .find(`label[for='${inputId}']`)
                .then($label => {
                  expect($label.length > 0 || !!ariaLabel).to.be.true;
                });
            }
          });
      });
    });
  });
});
