/**
 * @jest-environment jsdom
 */

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function load(search) {
  window.history.replaceState({}, "", "/" + (search || ""));
  let api;
  jest.isolateModules(() => {
    api = require("../click-ids.js");
  });
  return api;
}

describe("click-ids.js", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useRealTimers();
  });

  it("stores nothing without consent", () => {
    load("?fbclid=abc&ttclid=def");
    expect(localStorage.getItem("kots_click_ids")).toBeNull();

    localStorage.setItem("cookie_consent", "declined");
    load("?fbclid=abc");
    expect(localStorage.getItem("kots_click_ids")).toBeNull();
  });

  it("stores fbclid and ttclid with a timestamp when consent is accepted", () => {
    localStorage.setItem("cookie_consent", "accepted");
    const before = Date.now();
    const api = load("?fbclid=abc&ttclid=def&utm_source=x");
    const ids = api.get();
    expect(ids.fbclid.value).toBe("abc");
    expect(ids.ttclid.value).toBe("def");
    expect(ids.fbclid.ts).toBeGreaterThanOrEqual(before);
    expect(Object.keys(ids)).toEqual(["fbclid", "ttclid"]);
  });

  it("capture() on the Accept path stores IDs still in the URL", () => {
    const api = load("?ttclid=late");
    expect(api.get()).toEqual({});
    localStorage.setItem("cookie_consent", "accepted");
    expect(api.capture()).toBe(true);
    expect(api.get().ttclid.value).toBe("late");
  });

  it("keeps the original timestamp when the same ID is seen again", () => {
    localStorage.setItem("cookie_consent", "accepted");
    const ts = Date.now() - 60 * 1000;
    localStorage.setItem("kots_click_ids", JSON.stringify({ fbclid: { value: "abc", ts } }));
    const api = load("?fbclid=abc");
    expect(api.get().fbclid.ts).toBe(ts);
  });

  it("drops IDs older than 7 days", () => {
    localStorage.setItem("cookie_consent", "accepted");
    localStorage.setItem(
      "kots_click_ids",
      JSON.stringify({
        fbclid: { value: "old", ts: Date.now() - SEVEN_DAYS - 1000 },
        ttclid: { value: "fresh", ts: Date.now() - 1000 },
      })
    );
    const ids = load("").get();
    expect(ids.fbclid).toBeUndefined();
    expect(ids.ttclid.value).toBe("fresh");
    expect(JSON.parse(localStorage.getItem("kots_click_ids"))).not.toHaveProperty("fbclid");
  });

  it("returns nothing once consent is no longer accepted", () => {
    localStorage.setItem("cookie_consent", "accepted");
    const api = load("?fbclid=abc");
    localStorage.setItem("cookie_consent", "declined");
    expect(api.get()).toEqual({});
  });
});
