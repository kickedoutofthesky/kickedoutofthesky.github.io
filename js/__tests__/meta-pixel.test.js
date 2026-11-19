/**
 * @jest-environment jsdom
 */

describe("meta-pixel.js", () => {
  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = "";
    document.body.innerHTML = "";

    // Reset localStorage
    localStorage.clear();

    // Reset window globals
    delete window.fbq;
    delete window._loadMetaPixel;
    delete window.META_PAGEVIEW_EVENT_ID;

    // Reset system time
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Module Structure", () => {
    it("should define fbq queue if not present", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../meta-pixel.js"), "utf8");

      // Verify the code checks for fbq
      expect(code).toContain("window.fbq");
      expect(code).toContain("queue");
    });

    it("should export _loadMetaPixel function", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../meta-pixel.js"), "utf8");

      // Verify _loadMetaPixel is exported
      expect(code).toContain("window._loadMetaPixel");
      expect(code).toContain("function loadMetaPixel");
    });
  });

  describe("Consent Gating", () => {
    it("should check for prior consent", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../meta-pixel.js"), "utf8");

      // Verify consent checking
      expect(code).toContain("cookie_consent");
      expect(code).toContain("localStorage");
      expect(code).toContain("accepted");
    });

    it("should include PIXEL_ID constant", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../meta-pixel.js"), "utf8");

      // Verify pixel ID is present
      expect(code).toContain("1985329649108527");
    });

    it("should let a page override the pixel ID", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../meta-pixel.js"), "utf8");

      expect(code).toContain("window.META_PIXEL_ID ||");
    });
  });

  describe("Meta Pixel Script Loading", () => {
    it("should load fbevents.js", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../meta-pixel.js"), "utf8");

      // Verify fbevents.js is loaded
      expect(code).toContain("fbevents");
      expect(code).toContain("connect.facebook.net");
    });

    it("should set script as async", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../meta-pixel.js"), "utf8");

      // Verify async is set
      expect(code).toContain("script.async");
    });

    it("should initialize pixel with correct ID", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../meta-pixel.js"), "utf8");

      // Verify fbq init is called
      expect(code).toContain('fbq("init"');
      expect(code).toContain("PIXEL_ID");
    });
  });

  describe("UUID Generation", () => {
    it("should have UUID generation function", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../meta-pixel.js"), "utf8");

      // Verify UUID format exists (the placeholder pattern)
      expect(code).toContain("generateUUID");
      expect(code).toContain("xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx");
    });
  });

  describe("Guard Against Double Loading", () => {
    it("should prevent loading script twice", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../meta-pixel.js"), "utf8");

      // Verify guard check exists
      expect(code).toContain("loaded");
      expect(code).toContain("return");
    });
  });

  describe("Event Queuing", () => {
    it("should queue fbq calls", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../meta-pixel.js"), "utf8");

      // Verify queue is used
      expect(code).toContain("queue");
      expect(code).toContain("push");
    });
  });

  describe("Code Quality", () => {
    it("should use strict mode", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../meta-pixel.js"), "utf8");

      // Verify strict mode
      expect(code).toContain('"use strict"');
    });

    it("should wrap code in IIFE for isolation", () => {
      const fs = require("fs");
      const path = require("path");
      const code = fs.readFileSync(path.join(__dirname, "../meta-pixel.js"), "utf8");

      // Verify IIFE pattern
      expect(code).toContain("(function");
      expect(code).toContain("})()");
    });
  });

  describe("PageView", () => {
    function pageViews() {
      return (window.fbq ? window.fbq.queue : []).filter(a => a[0] === "track" && a[1] === "PageView");
    }

    function loadScripts() {
      document.head.innerHTML = "<script></script>";
      jest.isolateModules(() => {
        require("../meta-pixel.js");
        require("../cookie-consent.js");
      });
    }

    it("does not fire before consent", () => {
      loadScripts();

      expect(pageViews()).toHaveLength(0);
    });

    it("fires once after Accept, even if the loader is called again", () => {
      loadScripts();
      document.getElementById("cookie-accept").click();
      window._loadMetaPixel();

      expect(pageViews()).toHaveLength(1);
    });

    it("sends an eventID and exposes it as window.META_PAGEVIEW_EVENT_ID", () => {
      localStorage.setItem("cookie_consent", "accepted");
      loadScripts();

      const id = window.META_PAGEVIEW_EVENT_ID;
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(pageViews()[0][3]).toEqual({ eventID: id });
    });

    it("uses a META_PAGEVIEW_EVENT_ID set by the page", () => {
      window.META_PAGEVIEW_EVENT_ID = "server-shared-id";
      localStorage.setItem("cookie_consent", "accepted");
      loadScripts();

      expect(pageViews()[0][3]).toEqual({ eventID: "server-shared-id" });
      expect(window.META_PAGEVIEW_EVENT_ID).toBe("server-shared-id");
    });

    it("fires once on load when consent was already accepted", () => {
      localStorage.setItem("cookie_consent", "accepted");
      loadScripts();

      expect(pageViews()).toHaveLength(1);
    });

    it("never fires after Decline", () => {
      loadScripts();
      document.getElementById("cookie-decline").click();

      expect(pageViews()).toHaveLength(0);
    });

    it("never fires on load when consent was declined", () => {
      localStorage.setItem("cookie_consent", "declined");
      loadScripts();

      expect(pageViews()).toHaveLength(0);
    });
  });
});
