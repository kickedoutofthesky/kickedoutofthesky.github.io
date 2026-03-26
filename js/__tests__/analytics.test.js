/**
 * @jest-environment jsdom
 */

describe("analytics.js - loadGA()", () => {
  beforeEach(() => {
    // Reset state
    delete window._gaLoaded;
    delete window.gtag;
    delete window.loadGA;
    window.dataLayer = undefined;

    // Clear any previously appended script tags
    document.head.querySelectorAll("script").forEach(s => s.remove());

    // Load analytics.js — it defines a global function loadGA
    const fs = require("fs");
    const path = require("path");
    const code = fs.readFileSync(path.join(__dirname, "../analytics.js"), "utf8");
    // Wrap to assign to window so it's accessible in tests
    const wrapped = code.replace("function loadGA()", "window.loadGA = function()");
    eval(wrapped);
  });

  it("should define loadGA as a global function", () => {
    expect(typeof window.loadGA).toBe("function");
  });

  it("should inject Google Analytics script tag into head", () => {
    window.loadGA();
    const scripts = document.head.querySelectorAll("script");
    const gaScript = Array.from(scripts).find(s => s.src.includes("googletagmanager.com"));
    expect(gaScript).toBeTruthy();
    expect(gaScript.async).toBe(true);
    expect(gaScript.src).toContain("G-WG5KEEZX4H");
  });

  it("should set up dataLayer and gtag function", () => {
    window.loadGA();
    expect(window.dataLayer).toBeDefined();
    expect(Array.isArray(window.dataLayer)).toBe(true);
    expect(typeof window.gtag).toBe("function");
  });

  it("should push config events to dataLayer", () => {
    window.loadGA();
    // dataLayer should have at least 2 entries: gtag('js', ...) and gtag('config', ...)
    expect(window.dataLayer.length).toBeGreaterThanOrEqual(2);
  });

  it("should only load GA once (guard against double calls)", () => {
    window.loadGA();
    const firstCount = document.head.querySelectorAll("script").length;
    window.loadGA();
    const secondCount = document.head.querySelectorAll("script").length;
    expect(secondCount).toBe(firstCount);
  });

  it("should set _gaLoaded flag after first call", () => {
    expect(window._gaLoaded).toBeUndefined();
    window.loadGA();
    expect(window._gaLoaded).toBe(true);
  });
});
