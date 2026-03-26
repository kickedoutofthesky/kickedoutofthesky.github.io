/**
 * @jest-environment jsdom
 */

describe("cookie-consent.js", () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = "";
    document.head.querySelectorAll("style").forEach(s => s.remove());

    // Reset localStorage
    localStorage.clear();

    // Reset loadGA mock
    delete window._gaLoaded;
    window.loadGA = jest.fn();

    // Set a default pathname
    Object.defineProperty(window, "location", {
      value: { pathname: "/index.html" },
      writable: true,
    });
  });

  function loadConsentScript() {
    const fs = require("fs");
    const path = require("path");
    const code = fs.readFileSync(path.join(__dirname, "../cookie-consent.js"), "utf8");
    // Make loadGA available as a global for the IIFE to find
    global.loadGA = window.loadGA;
    eval(code);
  }

  describe("when no prior consent", () => {
    it("should show cookie consent banner", () => {
      loadConsentScript();
      const banner = document.getElementById("cookie-consent-banner");
      expect(banner).toBeTruthy();
    });

    it("should have Accept and Decline buttons", () => {
      loadConsentScript();
      expect(document.getElementById("cookie-accept")).toBeTruthy();
      expect(document.getElementById("cookie-decline")).toBeTruthy();
    });

    it("should include link to cookie policy", () => {
      loadConsentScript();
      const banner = document.getElementById("cookie-consent-banner");
      const link = banner.querySelector("a");
      expect(link).toBeTruthy();
      expect(link.textContent).toBe("Cookie Policy");
      expect(link.href).toContain("cookie-policy.html");
    });

    it("should have proper accessibility attributes", () => {
      loadConsentScript();
      const banner = document.getElementById("cookie-consent-banner");
      expect(banner.getAttribute("role")).toBe("dialog");
      expect(banner.getAttribute("aria-label")).toBe("Cookie consent");
    });

    it("should inject banner styles", () => {
      loadConsentScript();
      const styles = document.head.querySelectorAll("style");
      const consentStyle = Array.from(styles).find(s => s.textContent.includes("cookie-consent-banner"));
      expect(consentStyle).toBeTruthy();
    });

    it("should not call loadGA before consent", () => {
      loadConsentScript();
      expect(window.loadGA).not.toHaveBeenCalled();
    });
  });

  describe("Accept button", () => {
    it("should set localStorage to accepted on click", () => {
      loadConsentScript();
      document.getElementById("cookie-accept").click();
      expect(localStorage.getItem("cookie_consent")).toBe("accepted");
    });

    it("should remove banner on click", () => {
      loadConsentScript();
      document.getElementById("cookie-accept").click();
      expect(document.getElementById("cookie-consent-banner")).toBeNull();
    });

    it("should call loadGA on accept", () => {
      loadConsentScript();
      document.getElementById("cookie-accept").click();
      expect(window.loadGA).toHaveBeenCalled();
    });
  });

  describe("Decline button", () => {
    it("should set localStorage to declined on click", () => {
      loadConsentScript();
      document.getElementById("cookie-decline").click();
      expect(localStorage.getItem("cookie_consent")).toBe("declined");
    });

    it("should remove banner on click", () => {
      loadConsentScript();
      document.getElementById("cookie-decline").click();
      expect(document.getElementById("cookie-consent-banner")).toBeNull();
    });

    it("should not call loadGA on decline", () => {
      loadConsentScript();
      document.getElementById("cookie-decline").click();
      expect(window.loadGA).not.toHaveBeenCalled();
    });
  });

  describe("when consent already accepted", () => {
    it("should not show banner", () => {
      localStorage.setItem("cookie_consent", "accepted");
      loadConsentScript();
      expect(document.getElementById("cookie-consent-banner")).toBeNull();
    });

    it("should call loadGA immediately", () => {
      localStorage.setItem("cookie_consent", "accepted");
      loadConsentScript();
      expect(window.loadGA).toHaveBeenCalled();
    });
  });

  describe("when consent already declined", () => {
    it("should not show banner", () => {
      localStorage.setItem("cookie_consent", "declined");
      loadConsentScript();
      expect(document.getElementById("cookie-consent-banner")).toBeNull();
    });

    it("should not call loadGA", () => {
      localStorage.setItem("cookie_consent", "declined");
      loadConsentScript();
      expect(window.loadGA).not.toHaveBeenCalled();
    });
  });

  describe("cookie policy link path", () => {
    it("should use relative path for store pages", () => {
      window.location = { pathname: "/store/cart.html" };
      loadConsentScript();
      const link = document.querySelector("#cookie-consent-banner a");
      expect(link.getAttribute("href")).toBe("../legal/cookie-policy.html");
    });

    it("should use sibling path for legal pages", () => {
      window.location = { pathname: "/legal/privacy-policy.html" };
      loadConsentScript();
      const link = document.querySelector("#cookie-consent-banner a");
      expect(link.getAttribute("href")).toBe("cookie-policy.html");
    });

    it("should use legal/ prefix for root pages", () => {
      window.location = { pathname: "/index.html" };
      loadConsentScript();
      const link = document.querySelector("#cookie-consent-banner a");
      expect(link.getAttribute("href")).toBe("legal/cookie-policy.html");
    });
  });
});
