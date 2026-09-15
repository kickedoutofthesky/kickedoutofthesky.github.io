/**
 * Comprehensive Mock API Tests
 * Covers all functions and edge cases in mock-api.js
 */

import {
  createMockFetch,
  createMockQuoteFetch,
  createMockCheckoutFetch,
  createMockOrderDetailsFetch,
  createMockErrorFetch,
  createMockFetchWithDelay,
  createValidatingMockFetch,
  createMockSessionStorage,
  createMockLocalStorage,
  createMockAudioContext,
  mockGeolocation,
  setupFetchMock,
  resetFetchMock,
} from "../utils/fixtures/mock-api";

import { mockQuoteResponse, mockCheckoutSessionResponse, mockOrder } from "../utils/fixtures/test-data";

describe("Mock Fetch - Basic Functionality", () => {
  beforeEach(() => {
    delete global.fetch;
  });

  it("should return default response when no mock defined", async () => {
    const mockFetch = createMockFetch();
    const response = await mockFetch("/api/unknown");

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({});
  });

  it("should support GET requests", async () => {
    const mockFetch = createMockFetch({
      "GET /api/data": { ok: true, data: { result: "success" } },
    });

    const response = await mockFetch("/api/data");
    const data = await response.json();

    expect(data.result).toBe("success");
  });

  it("should support POST requests", async () => {
    const mockFetch = createMockFetch({
      "POST /api/submit": { ok: true, data: { id: 123 } },
    });

    const response = await mockFetch("/api/submit", { method: "POST" });
    const data = await response.json();

    expect(data.id).toBe(123);
  });

  it("should return error response when ok is false", async () => {
    const mockFetch = createMockFetch({
      "POST /api/fail": { ok: false, status: 400, data: { error: "Bad request" } },
    });

    const response = await mockFetch("/api/fail", { method: "POST" });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Bad request");
  });

  it("should support custom status codes", async () => {
    const mockFetch = createMockFetch({
      "GET /api/unauthorized": { ok: false, status: 401, data: { error: "Unauthorized" } },
      "GET /api/forbidden": { ok: false, status: 403, data: { error: "Forbidden" } },
      "GET /api/notfound": { ok: false, status: 404, data: { error: "Not found" } },
    });

    const res401 = await mockFetch("/api/unauthorized");
    const res403 = await mockFetch("/api/forbidden");
    const res404 = await mockFetch("/api/notfound");

    expect(res401.status).toBe(401);
    expect(res403.status).toBe(403);
    expect(res404.status).toBe(404);
  });

  it("should support text() method", async () => {
    const mockFetch = createMockFetch({
      "GET /api/text": { ok: true, data: { message: "hello" } },
    });

    const response = await mockFetch("/api/text");
    const text = await response.text();

    expect(typeof text).toBe("string");
    expect(text).toContain("message");
  });

  it("should differentiate between GET and POST on same URL", async () => {
    const mockFetch = createMockFetch({
      "GET /api/item": { ok: true, data: { action: "read" } },
      "POST /api/item": { ok: true, data: { action: "create" } },
    });

    const getRes = await mockFetch("/api/item", { method: "GET" });
    const postRes = await mockFetch("/api/item", { method: "POST" });

    const getData = await getRes.json();
    const postData = await postRes.json();

    expect(getData.action).toBe("read");
    expect(postData.action).toBe("create");
  });

  it("should default to GET method", async () => {
    const mockFetch = createMockFetch({
      "GET /api/default": { ok: true, data: { method: "detected" } },
    });

    const response = await mockFetch("/api/default"); // No method specified
    const data = await response.json();

    expect(data.method).toBe("detected");
  });
});

describe("Mock Quote Fetch", () => {
  it("should handle GET /api/quote", async () => {
    const mockFetch = createMockQuoteFetch(mockQuoteResponse);
    const response = await mockFetch("/api/quote");

    const data = await response.json();
    expect(data.prices.total).toBe(mockQuoteResponse.prices.total);
  });

  it("should handle POST /api/quote", async () => {
    const mockFetch = createMockQuoteFetch(mockQuoteResponse);
    const response = await mockFetch("/api/quote", { method: "POST" });

    const data = await response.json();
    expect(data.currency).toBe("USD");
  });

  it("should support custom quote response", async () => {
    const customQuote = {
      prices: { total: 15000, subtotal: 13000, shipping: 1000, tax: 1000 },
      currency: "EUR",
    };

    const mockFetch = createMockQuoteFetch(customQuote);
    const response = await mockFetch("/api/quote");

    const data = await response.json();
    expect(data.currency).toBe("EUR");
    expect(data.prices.total).toBe(15000);
  });
});

describe("Mock Checkout Fetch", () => {
  it("should handle GET /api/checkout", async () => {
    const mockFetch = createMockCheckoutFetch(mockCheckoutSessionResponse);
    const response = await mockFetch("/api/checkout");

    const data = await response.json();
    expect(data.session_id).toBeDefined();
  });

  it("should handle POST /api/checkout", async () => {
    const mockFetch = createMockCheckoutFetch(mockCheckoutSessionResponse);
    const response = await mockFetch("/api/checkout", { method: "POST" });

    const data = await response.json();
    expect(data.redirect_url).toBeDefined();
  });
});

describe("Mock Order Details Fetch", () => {
  it("should fetch order details", async () => {
    const mockFetch = createMockOrderDetailsFetch(mockOrder);
    const response = await mockFetch("/api/order-details");

    const data = await response.json();
    expect(data.printful_order_id).toBe(mockOrder.printful_order_id);
  });

  it("should return correct order structure", async () => {
    const mockFetch = createMockOrderDetailsFetch(mockOrder);
    const response = await mockFetch("/api/order-details");

    const data = await response.json();
    expect(data).toHaveProperty("printful_order_id");
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("items");
    expect(data).toHaveProperty("costs");
  });
});

describe("Mock Error Fetch", () => {
  it("should always return error", async () => {
    const mockFetch = createMockErrorFetch("Test error");
    const response = await mockFetch("/api/anything");

    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });

  it("should include error message in JSON", async () => {
    const mockFetch = createMockErrorFetch("Custom error message");
    const response = await mockFetch("/api/test");

    const data = await response.json();
    expect(data.error).toBe("Custom error message");
  });

  it("should include error message in text", async () => {
    const mockFetch = createMockErrorFetch("Error occurred");
    const response = await mockFetch("/api/test");

    const text = await response.text();
    expect(text).toContain("Error occurred");
  });

  it("should default to API Error message", async () => {
    const mockFetch = createMockErrorFetch();
    const response = await mockFetch("/api/test");

    const data = await response.json();
    expect(data.error).toBe("API Error");
  });
});

describe("Mock Fetch with Delay", () => {
  it("should delay response by specified duration", async () => {
    const delay = 100;
    const mockFetch = createMockFetchWithDelay({ "GET /api/slow": { ok: true, data: {} } }, delay);

    const start = Date.now();
    await mockFetch("/api/slow");
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(delay - 20); // Allow 20ms margin
  });

  it("should return correct data after delay", async () => {
    const mockFetch = createMockFetchWithDelay({ "POST /api/delayed": { ok: true, data: { delayed: true } } }, 50);

    const response = await mockFetch("/api/delayed", { method: "POST" });
    const data = await response.json();

    expect(data.delayed).toBe(true);
  });

  it("should return default response if no mock defined", async () => {
    const mockFetch = createMockFetchWithDelay({}, 50);

    const response = await mockFetch("/api/unknown");
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data).toEqual({});
  });

  it("should handle multiple requests with delays", async () => {
    const mockFetch = createMockFetchWithDelay(
      {
        "GET /api/one": { ok: true, data: { id: 1 } },
        "GET /api/two": { ok: true, data: { id: 2 } },
      },
      30
    );

    const res1 = await mockFetch("/api/one");
    const res2 = await mockFetch("/api/two");

    const data1 = await res1.json();
    const data2 = await res2.json();

    expect(data1.id).toBe(1);
    expect(data2.id).toBe(2);
  });
});

describe("Validating Mock Fetch", () => {
  it("should accept valid requests", async () => {
    const validator = (url, method, body) => {
      return body && body.email && body.amount > 0;
    };

    const mockFetch = createValidatingMockFetch(validator, { success: true });
    const response = await mockFetch("/api/payment", {
      method: "POST",
      body: JSON.stringify({ email: "test@test.com", amount: 100 }),
    });

    expect(response.ok).toBe(true);
  });

  it("should reject invalid requests", async () => {
    const validator = (url, method, body) => {
      return body && body.email && body.amount > 0;
    };

    const mockFetch = createValidatingMockFetch(validator, { success: true });
    const response = await mockFetch("/api/payment", {
      method: "POST",
      body: JSON.stringify({ email: "test@test.com", amount: -10 }),
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
  });

  it("should handle requests with no body", async () => {
    const validator = (url, method, body) => {
      return body === null || body.optional === true;
    };

    const mockFetch = createValidatingMockFetch(validator, { success: true });
    const response = await mockFetch("/api/info"); // No body

    expect(response.ok).toBe(true);
  });

  it("should handle JSON parsing errors", async () => {
    const validator = (_url, _method, _body) => true;
    const mockFetch = createValidatingMockFetch(validator, { success: true });

    const response = await mockFetch("/api/test", {
      method: "POST",
      body: "invalid json",
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it("should handle validator errors", async () => {
    const validator = (_url, _method, _body) => {
      throw new Error("Validation failed");
    };

    const mockFetch = createValidatingMockFetch(validator, { success: true });
    const response = await mockFetch("/api/test", {
      method: "POST",
      body: JSON.stringify({ data: "test" }),
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
  });

  it("should pass correct parameters to validator", async () => {
    const validator = jest.fn(() => true);
    const mockFetch = createValidatingMockFetch(validator, { success: true });

    await mockFetch("/api/test", {
      method: "PUT",
      body: JSON.stringify({ key: "value" }),
    });

    expect(validator).toHaveBeenCalledWith("/api/test", "PUT", { key: "value" });
  });

  it("should return response data from validator", async () => {
    const validator = () => true;
    const responseData = { custom: "response", id: 999 };
    const mockFetch = createValidatingMockFetch(validator, responseData);

    const response = await mockFetch("/api/test", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const data = await response.json();
    expect(data).toEqual(responseData);
  });
});

describe("Mock Session Storage", () => {
  it("should store and retrieve string values", () => {
    const storage = createMockSessionStorage();

    storage.setItem("key", "value");
    expect(storage.getItem("key")).toBe("value");
  });

  it("should convert values to strings", () => {
    const storage = createMockSessionStorage();

    storage.setItem("number", 123);
    storage.setItem("boolean", true);
    storage.setItem("object", { data: "test" });

    expect(storage.getItem("number")).toBe("123");
    expect(storage.getItem("boolean")).toBe("true");
    expect(typeof storage.getItem("object")).toBe("string");
  });

  it("should return null for missing keys", () => {
    const storage = createMockSessionStorage();

    expect(storage.getItem("nonexistent")).toBeNull();
  });

  it("should remove items", () => {
    const storage = createMockSessionStorage();

    storage.setItem("key", "value");
    storage.removeItem("key");

    expect(storage.getItem("key")).toBeNull();
  });

  it("should clear all items", () => {
    const storage = createMockSessionStorage();

    storage.setItem("key1", "value1");
    storage.setItem("key2", "value2");
    storage.setItem("key3", "value3");

    storage.clear();

    expect(storage.length).toBe(0);
    expect(storage.getItem("key1")).toBeNull();
  });

  it("should track length", () => {
    const storage = createMockSessionStorage();

    expect(storage.length).toBe(0);

    storage.setItem("key1", "value1");
    expect(storage.length).toBe(1);

    storage.setItem("key2", "value2");
    expect(storage.length).toBe(2);

    storage.removeItem("key1");
    expect(storage.length).toBe(1);
  });

  it("should access keys by index", () => {
    const storage = createMockSessionStorage();

    storage.setItem("key1", "value1");
    storage.setItem("key2", "value2");

    expect(storage.key(0)).toBeDefined();
    expect(storage.key(1)).toBeDefined();
  });

  it("should return null for out-of-range key index", () => {
    const storage = createMockSessionStorage();

    storage.setItem("key", "value");

    expect(storage.key(10)).toBeNull();
  });

  it("should overwrite existing keys", () => {
    const storage = createMockSessionStorage();

    storage.setItem("key", "value1");
    storage.setItem("key", "value2");

    expect(storage.getItem("key")).toBe("value2");
    expect(storage.length).toBe(1);
  });
});

describe("Mock Local Storage", () => {
  it("should store and retrieve values", () => {
    const storage = createMockLocalStorage();

    storage.setItem("preference", "dark");
    expect(storage.getItem("preference")).toBe("dark");
  });

  it("should have separate instances", () => {
    const storage1 = createMockLocalStorage();
    const storage2 = createMockLocalStorage();

    storage1.setItem("key", "value1");
    storage2.setItem("key", "value2");

    expect(storage1.getItem("key")).toBe("value1");
    expect(storage2.getItem("key")).toBe("value2");
  });

  it("should support all storage methods", () => {
    const storage = createMockLocalStorage();

    expect(typeof storage.setItem).toBe("function");
    expect(typeof storage.getItem).toBe("function");
    expect(typeof storage.removeItem).toBe("function");
    expect(typeof storage.clear).toBe("function");
    expect(typeof storage.key).toBe("function");
    expect(typeof storage.length).toBe("number");
  });

  it("should persist through multiple operations", () => {
    const storage = createMockLocalStorage();

    storage.setItem("data1", "value1");
    storage.setItem("data2", "value2");

    expect(storage.length).toBe(2);
    expect(storage.getItem("data1")).toBe("value1");

    storage.removeItem("data1");

    expect(storage.length).toBe(1);
    expect(storage.getItem("data1")).toBeNull();
  });

  it("should clear all data", () => {
    const storage = createMockLocalStorage();

    storage.setItem("a", "1");
    storage.setItem("b", "2");
    storage.setItem("c", "3");

    storage.clear();

    expect(storage.length).toBe(0);
  });
});

describe("Mock Audio Context", () => {
  it("should create oscillator", () => {
    const audioContext = createMockAudioContext();

    expect(audioContext.createOscillator).toBeDefined();
    const osc = audioContext.createOscillator();

    expect(osc).toBeDefined();
    expect(osc.frequency).toBeDefined();
    expect(osc.type).toBe("sine");
  });

  it("should create gain node", () => {
    const audioContext = createMockAudioContext();

    expect(audioContext.createGain).toBeDefined();
    const gain = audioContext.createGain();

    expect(gain).toBeDefined();
    expect(gain.gain).toBeDefined();
  });

  it("should have destination", () => {
    const audioContext = createMockAudioContext();

    expect(audioContext.destination).toBeDefined();
  });

  it("should support oscillator methods", () => {
    const audioContext = createMockAudioContext();
    const osc = audioContext.createOscillator();

    expect(typeof osc.connect).toBe("function");
    expect(typeof osc.start).toBe("function");
    expect(typeof osc.stop).toBe("function");
  });

  it("should support gain methods", () => {
    const audioContext = createMockAudioContext();
    const gain = audioContext.createGain();

    expect(typeof gain.connect).toBe("function");
  });

  it("should support gain parameter methods", () => {
    const audioContext = createMockAudioContext();
    const gain = audioContext.createGain();

    expect(typeof gain.gain.setTargetAtTime).toBe("function");
    expect(typeof gain.gain.exponentialRampToValueAtTime).toBe("function");
  });

  it("should support audio filters", () => {
    const audioContext = createMockAudioContext();

    expect(audioContext.createBiquadFilter).toBeDefined();
    expect(audioContext.createAnalyser).toBeDefined();
  });

  it("should support close method", () => {
    const audioContext = createMockAudioContext();

    expect(typeof audioContext.close).toBe("function");
  });

  it("should track method calls", () => {
    const audioContext = createMockAudioContext();
    const osc = audioContext.createOscillator();

    osc.connect(audioContext.destination);
    osc.start(0);
    osc.stop(1);

    expect(osc.connect).toHaveBeenCalledWith(audioContext.destination);
    expect(osc.start).toHaveBeenCalledWith(0);
    expect(osc.stop).toHaveBeenCalledWith(1);
  });
});

describe("Mock Geolocation", () => {
  it("should have getCurrentPosition method", () => {
    const geo = mockGeolocation({ coords: { latitude: 40, longitude: -74 } });

    expect(typeof geo.getCurrentPosition).toBe("function");
  });

  it("should have watchPosition method", () => {
    const geo = mockGeolocation({ coords: { latitude: 40, longitude: -74 } });

    expect(typeof geo.watchPosition).toBe("function");
  });

  it("should call success callback with position", () => {
    const position = {
      coords: { latitude: 40.7128, longitude: -74.006 },
      timestamp: Date.now(),
    };
    const geo = mockGeolocation(position);
    const successCallback = jest.fn();

    geo.getCurrentPosition(successCallback);

    expect(successCallback).toHaveBeenCalledWith(position);
  });

  it("should pass position to success callback", () => {
    const position = {
      coords: { latitude: 51.5074, longitude: -0.1278 },
      timestamp: Date.now(),
    };
    const geo = mockGeolocation(position);
    const successCallback = jest.fn();

    geo.getCurrentPosition(successCallback);

    expect(successCallback).toHaveBeenCalled();
    const receivedPosition = successCallback.mock.calls[0][0];
    expect(receivedPosition.coords.latitude).toBe(51.5074);
    expect(receivedPosition.coords.longitude).toBe(-0.1278);
  });

  it("should track watchPosition calls", () => {
    const geo = mockGeolocation({ coords: { latitude: 40, longitude: -74 } });
    const callback = jest.fn();

    geo.watchPosition(callback);

    expect(geo.watchPosition).toHaveBeenCalledWith(callback);
  });

  it("should support different position values", () => {
    const position1 = { coords: { latitude: 0, longitude: 0 } };
    const geo1 = mockGeolocation(position1);
    const callback1 = jest.fn();

    geo1.getCurrentPosition(callback1);

    expect(callback1).toHaveBeenCalledWith(position1);

    const position2 = { coords: { latitude: 90, longitude: 180 } };
    const geo2 = mockGeolocation(position2);
    const callback2 = jest.fn();

    geo2.getCurrentPosition(callback2);

    expect(callback2).toHaveBeenCalledWith(position2);
  });
});

describe("Setup and Reset Fetch Mock", () => {
  beforeEach(() => {
    delete global.fetch;
  });

  afterEach(() => {
    delete global.fetch;
  });

  it("should setup fetch mock globally", () => {
    const mockFn = jest.fn().mockResolvedValue({ ok: true });

    setupFetchMock(mockFn);

    expect(global.fetch).toBeDefined();
    expect(global.fetch).toBe(mockFn);
  });

  it("should allow calling global fetch after setup", async () => {
    const mockFn = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: "test" }) });

    setupFetchMock(mockFn);
    const response = await global.fetch("/api/test");

    expect(mockFn).toHaveBeenCalledWith("/api/test");
    expect(response.ok).toBe(true);
  });

  it("should reset fetch mock", () => {
    const mockFn = jest.fn();
    setupFetchMock(mockFn);

    expect(global.fetch).toBeDefined();

    resetFetchMock();

    expect(global.fetch).toBeUndefined();
  });

  it("should allow setup and reset cycles", () => {
    const mockFn1 = jest.fn();
    const mockFn2 = jest.fn();

    setupFetchMock(mockFn1);
    expect(global.fetch).toBe(mockFn1);

    resetFetchMock();
    expect(global.fetch).toBeUndefined();

    setupFetchMock(mockFn2);
    expect(global.fetch).toBe(mockFn2);

    resetFetchMock();
    expect(global.fetch).toBeUndefined();
  });
});

describe("Edge Cases and Integration", () => {
  it("should handle complex nested responses", async () => {
    const complexData = {
      user: {
        id: 1,
        profile: {
          name: "Test",
          settings: { theme: "dark", notifications: true },
        },
      },
      meta: { version: "1.0" },
    };

    const mockFetch = createMockFetch({
      "GET /api/complex": { ok: true, data: complexData },
    });

    const response = await mockFetch("/api/complex");
    const data = await response.json();

    expect(data.user.profile.settings.theme).toBe("dark");
  });

  it("should handle empty responses", async () => {
    const mockFetch = createMockFetch({
      "GET /api/empty": { ok: true, data: {} },
    });

    const response = await mockFetch("/api/empty");
    const data = await response.json();

    expect(Object.keys(data).length).toBe(0);
  });

  it("should handle array responses", async () => {
    const mockFetch = createMockFetch({
      "GET /api/items": { ok: true, data: [{ id: 1 }, { id: 2 }, { id: 3 }] },
    });

    const response = await mockFetch("/api/items");
    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(3);
  });

  it("should mix different fetch types in tests", async () => {
    const mockFetch1 = createMockFetch({});
    const mockFetch2 = createMockQuoteFetch(mockQuoteResponse);
    const mockFetch3 = createMockErrorFetch();

    const res1 = await mockFetch1("/api/default");
    const res2 = await mockFetch2("/api/quote");
    const res3 = await mockFetch3("/api/error");

    expect(res1.ok).toBe(true);
    expect(res2.ok).toBe(true);
    expect(res3.ok).toBe(false);
  });
});
