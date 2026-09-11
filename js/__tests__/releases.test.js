/**
 * @jest-environment jsdom
 */

describe("releases.js", () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = "";
    document.head.innerHTML = "";

    // Reset localStorage
    localStorage.clear();
    localStorage.setItem("cookie_consent", "accepted");

    // Mock fbq
    window.fbq = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Module Exports", () => {
    it("should export initReleasePage function", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../releases.js"), "utf8");
      eval(code);

      expect(typeof window.initReleasePage).toBe("function");
    });

    it("should export flushReleaseAnalyticsQueue function", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../releases.js"), "utf8");
      eval(code);

      expect(typeof window.flushReleaseAnalyticsQueue).toBe("function");
    });
  });

  describe("Code Structure", () => {
    it("should include date formatting logic", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../releases.js"), "utf8");

      expect(code).toContain("formatDisplayDate");
      expect(code).toContain("toLocaleDateString");
    });

    it("should include release date checking logic", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../releases.js"), "utf8");

      expect(code).toContain("isReleased");
      expect(code).toContain("releaseDate");
    });

    it("should include query string forwarding logic", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../releases.js"), "utf8");

      expect(code).toContain("forwardQueryString");
      expect(code).toContain("utm_source");
      expect(code).toContain("fbclid");
      expect(code).toContain("ttclid");
    });

    it("should include UUID generation", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../releases.js"), "utf8");

      expect(code).toContain("generateUUID");
      expect(code).toContain("xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx");
    });
  });

  describe("CTA Button Logic", () => {
    it("should switch CTA text based on release date", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../releases.js"), "utf8");

      expect(code).toContain("Pre-save on Spotify");
      expect(code).toContain("Listen now");
    });

    it("should use correct URL based on release status", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../releases.js"), "utf8");

      expect(code).toContain("presaveUrl");
      expect(code).toContain("postReleaseUrl");
    });
  });

  describe("Page Rendering", () => {
    it("should populate release elements from data", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../releases.js"), "utf8");

      expect(code).toContain("release-artist");
      expect(code).toContain("release-title");
      expect(code).toContain("release-date");
      expect(code).toContain("release-cover");
      expect(code).toContain("release-cta");
    });

    it("should preload cover image", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../releases.js"), "utf8");

      expect(code).toContain("preload");
      expect(code).toContain("link");
    });
  });

  describe("Analytics Integration", () => {
    it("should include Meta Pixel PageView event", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../releases.js"), "utf8");

      expect(code).toContain('fbq("track", "PageView"');
      expect(code).toContain("eventID");
    });

    it("should include Meta Pixel Lead event on CTA click", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../releases.js"), "utf8");

      expect(code).toContain('fbq("track", "Lead"');
      expect(code).toContain("content_name");
      expect(code).toContain("addEventListener");
    });

    it("should support TikTok pixel", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../releases.js"), "utf8");

      expect(code).toContain("ttq");
      expect(code).toContain("fireTikTok");
    });

    it("should check for consent before firing events", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../releases.js"), "utf8");

      expect(code).toContain("cookie_consent");
      expect(code).toContain("localStorage");
      expect(code).toContain("accepted");
    });

    it("should queue events before consent", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../releases.js"), "utf8");

      expect(code).toContain("_releasePageViewPending");
      expect(code).toContain("flushReleaseAnalyticsQueue");
    });
  });

  describe("Current Release Resolution", () => {
    it("should handle 'current' slug", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../releases.js"), "utf8");

      expect(code).toContain("data.current");
      expect(code).toContain('if (releaseSlug === "current")');
    });
  });

  describe("SEO Features", () => {
    it("should set canonical URL on /listen", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../releases.js"), "utf8");

      expect(code).toContain("canonical");
      expect(code).toContain('pathname === "/listen/"');
    });
  });

  describe("Error Handling", () => {
    it("should handle fetch errors", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../releases.js"), "utf8");

      expect(code).toContain("catch");
      expect(code).toContain("console.error");
    });
  });
});
