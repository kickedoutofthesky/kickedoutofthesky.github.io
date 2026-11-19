/**
 * @jest-environment jsdom
 */

const PIXEL_ID = "DBVEBEJC77UCTIOTESD0";

function loadScripts() {
  jest.isolateModules(() => {
    require("../tiktok-pixel.js");
    require("../cookie-consent.js");
  });
}

function tiktokScripts() {
  return Array.from(document.querySelectorAll("script")).filter(s => (s.src || "").includes("analytics.tiktok.com"));
}

describe("tiktok-pixel.js", () => {
  beforeEach(() => {
    document.head.innerHTML = "<script></script>";
    document.body.innerHTML = "";
    localStorage.clear();
    delete window.ttq;
    delete window.TiktokAnalyticsObject;
    delete window._loadTikTokPixel;
    delete window._loadMetaPixel;
  });

  it("does not define ttq or load anything before consent", () => {
    loadScripts();

    expect(window.ttq).toBeUndefined();
    expect(tiktokScripts()).toHaveLength(0);
    expect(typeof window._loadTikTokPixel).toBe("function");
  });

  it("loads after the Accept button is clicked", () => {
    loadScripts();
    document.getElementById("cookie-accept").click();

    expect(window.ttq).toBeDefined();
    expect(tiktokScripts()).toHaveLength(1);
    expect(tiktokScripts()[0].src).toContain(`sdkid=${PIXEL_ID}`);
    expect(window.ttq._i[PIXEL_ID]).toBeDefined();
  });

  it("loads immediately on page load when consent was already accepted", () => {
    localStorage.setItem("cookie_consent", "accepted");
    loadScripts();

    expect(tiktokScripts()).toHaveLength(1);
  });

  it("never loads after the Decline button is clicked", () => {
    loadScripts();
    document.getElementById("cookie-decline").click();

    expect(window.ttq).toBeUndefined();
    expect(tiktokScripts()).toHaveLength(0);
  });

  it("never loads on page load when consent was declined", () => {
    localStorage.setItem("cookie_consent", "declined");
    loadScripts();

    expect(window.ttq).toBeUndefined();
    expect(tiktokScripts()).toHaveLength(0);
  });

  it("only loads once", () => {
    loadScripts();
    window._loadTikTokPixel();
    window._loadTikTokPixel();

    expect(tiktokScripts()).toHaveLength(1);
  });

  it("leaves ttq.track callable for releases.js once loaded", () => {
    loadScripts();
    window._loadTikTokPixel();

    expect(typeof window.ttq.track).toBe("function");
    expect(() => window.ttq.track("Lead", { content_name: "x" })).not.toThrow();
  });
});
