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

  describe("cookie settings", () => {
    let reload;
    beforeEach(() => {
      reload = jest.fn();
      window.location = { pathname: "/index.html", hostname: "localhost", reload };
      sessionStorage.clear();
      delete window.fbq;
      delete window.gtag;
      delete window._loadMetaPixel;
      delete window._loadTikTokPixel;
      document.cookie.split(";").forEach(c => {
        document.cookie = c.split("=")[0].trim() + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      });
    });

    it("openCookieSettings shows the banner when consent is already stored", () => {
      localStorage.setItem("cookie_consent", "accepted");
      loadConsentScript();
      expect(document.getElementById("cookie-consent-banner")).toBeNull();
      window.openCookieSettings();
      const banner = document.getElementById("cookie-consent-banner");
      expect(banner).toBeTruthy();
      expect(document.getElementById("cookie-accept")).toBeTruthy();
      expect(document.getElementById("cookie-decline")).toBeTruthy();
      expect(document.activeElement).toBe(banner);
    });

    it("opens the banner from a [data-cookie-settings] element", () => {
      localStorage.setItem("cookie_consent", "declined");
      document.body.innerHTML = "<button data-cookie-settings>Cookie settings</button>";
      loadConsentScript();
      document.querySelector("[data-cookie-settings]").click();
      expect(document.querySelectorAll("#cookie-consent-banner").length).toBe(1);
    });

    it("Accept after Decline stores accepted and loads the pixels", () => {
      localStorage.setItem("cookie_consent", "declined");
      window._loadMetaPixel = jest.fn();
      window._loadTikTokPixel = jest.fn();
      loadConsentScript();
      expect(window.loadGA).not.toHaveBeenCalled();
      window.openCookieSettings();
      document.getElementById("cookie-accept").click();
      expect(localStorage.getItem("cookie_consent")).toBe("accepted");
      expect(window.loadGA).toHaveBeenCalledTimes(1);
      expect(window._loadMetaPixel).toHaveBeenCalledTimes(1);
      expect(window._loadTikTokPixel).toHaveBeenCalledTimes(1);
      expect(reload).not.toHaveBeenCalled();
    });

    it("Decline after Accept withdraws consent, clears trackers and reloads", () => {
      localStorage.setItem("cookie_consent", "accepted");
      localStorage.setItem("tt_appInfo", "x");
      sessionStorage.setItem("tt_sessionId", "y");
      localStorage.setItem("unrelated", "keep");
      ["_fbp", "_fbc", "_ttp", "_ga", "_ga_ABC123", "keepme"].forEach(n => {
        document.cookie = n + "=1; path=/";
      });
      window.fbq = jest.fn();
      window.gtag = jest.fn();
      loadConsentScript();
      window.openCookieSettings();
      document.getElementById("cookie-decline").click();

      expect(localStorage.getItem("cookie_consent")).toBe("declined");
      expect(window.fbq).toHaveBeenCalledWith("consent", "revoke");
      expect(window.gtag).toHaveBeenCalledWith("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      expect(document.cookie).toBe("keepme=1");
      expect(localStorage.getItem("tt_appInfo")).toBeNull();
      expect(sessionStorage.getItem("tt_sessionId")).toBeNull();
      expect(localStorage.getItem("unrelated")).toBe("keep");
      expect(reload).toHaveBeenCalledTimes(1);
    });

    it("Decline without a prior Accept does not reload", () => {
      loadConsentScript();
      document.getElementById("cookie-decline").click();
      expect(localStorage.getItem("cookie_consent")).toBe("declined");
      expect(reload).not.toHaveBeenCalled();
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
