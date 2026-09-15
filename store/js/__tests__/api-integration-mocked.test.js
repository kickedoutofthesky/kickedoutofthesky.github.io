/**
 * API Integration Tests with Mock Fetch
 * Demonstrates proper API mocking patterns
 */

import {
  createMockFetch,
  createMockQuoteFetch,
  createMockCheckoutFetch,
  createMockErrorFetch,
  createMockFetchWithDelay,
  createValidatingMockFetch,
  createMockSessionStorage,
  createMockLocalStorage,
} from "../utils/fixtures/mock-api";

import {
  buildQuoteRequestPayload,
  buildCheckoutPayload,
  extractQuoteData,
  isValidQuote,
} from "../utils/fixtures/cart-utilities";

import { mockCart, mockQuoteResponse, mockCheckoutSessionResponse } from "../utils/fixtures/test-data";

describe("API Integration Tests - Mock Fetch", () => {
  beforeEach(() => {
    // Reset global fetch before each test
    delete global.fetch;
    delete global.sessionStorage;
    delete global.localStorage;
  });

  describe("Quote API with Mock Fetch", () => {
    it("should fetch quote with valid payload", async () => {
      const mockFetch = createMockQuoteFetch(mockQuoteResponse);
      global.fetch = mockFetch;

      const payload = buildQuoteRequestPayload(mockCart.items, "US");
      const response = await global.fetch("/api/quote", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.prices.total).toBe(mockQuoteResponse.prices.total);
    });

    it("should extract quote data from response", async () => {
      const mockFetch = createMockQuoteFetch(mockQuoteResponse);
      global.fetch = mockFetch;

      const response = await global.fetch("/api/quote");
      const data = await response.json();
      const quote = extractQuoteData(data);

      expect(isValidQuote(quote)).toBe(true);
      expect(quote.currency).toBe("USD");
    });

    it("should handle different countries", async () => {
      const quoteDE = { ...mockQuoteResponse, currency: "EUR" };
      const mockFetch = createMockQuoteFetch(quoteDE);
      global.fetch = mockFetch;

      const payload = buildQuoteRequestPayload(mockCart.items, "DE");
      const response = await global.fetch("/api/quote", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      expect(data.currency).toBe("EUR");
    });
  });

  describe("Checkout API with Mock Fetch", () => {
    it("should fetch checkout session", async () => {
      const mockFetch = createMockCheckoutFetch(mockCheckoutSessionResponse);
      global.fetch = mockFetch;

      const payload = buildCheckoutPayload(mockCart.items, "US", "test@example.com");
      const response = await global.fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.session_id).toBeDefined();
      expect(data.redirect_url).toBeDefined();
    });

    it("should validate response has redirect URL", async () => {
      const mockFetch = createMockCheckoutFetch(mockCheckoutSessionResponse);
      global.fetch = mockFetch;

      const response = await global.fetch("/api/checkout");
      const data = await response.json();

      expect(data.redirect_url).toContain("stripe.com");
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors", async () => {
      const mockFetch = createMockErrorFetch("Server error");
      global.fetch = mockFetch;

      const response = await global.fetch("/api/quote");
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    it("should handle JSON parsing errors", async () => {
      const mockFetch = async () => ({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      global.fetch = mockFetch;

      try {
        const response = await global.fetch("/api/quote");
        await response.json();
        expect(true).toBe(false); // Should throw
      } catch (error) {
        expect(error.message).toContain("Invalid");
      }
    });
  });

  describe("Mock Fetch with Delay", () => {
    it("should delay response", async () => {
      const mockFetch = createMockFetchWithDelay({ "POST /api/quote": { ok: true, data: mockQuoteResponse } }, 50);
      global.fetch = mockFetch;

      const start = Date.now();
      const response = await global.fetch("/api/quote", { method: "POST" });
      const elapsed = Date.now() - start;

      expect(response.ok).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(40); // Allow some margin
    });
  });

  describe("Validating Mock Fetch", () => {
    it("should validate request before responding", async () => {
      const validator = (url, method, body) => {
        return body && body.items && body.country;
      };

      const mockFetch = createValidatingMockFetch(validator, mockQuoteResponse);
      global.fetch = mockFetch;

      // Valid request
      const validResponse = await global.fetch("/api/quote", {
        method: "POST",
        body: JSON.stringify({
          items: mockCart.items,
          country: "US",
        }),
      });

      expect(validResponse.ok).toBe(true);

      // Invalid request
      const invalidResponse = await global.fetch("/api/quote", {
        method: "POST",
        body: JSON.stringify({ items: [] }),
      });

      expect(invalidResponse.ok).toBe(false);
    });

    it("should catch validation errors", async () => {
      const validator = () => {
        throw new Error("Validation error");
      };

      const mockFetch = createValidatingMockFetch(validator, mockQuoteResponse);
      global.fetch = mockFetch;

      const response = await global.fetch("/api/quote", {
        method: "POST",
        body: JSON.stringify({}),
      });

      expect(response.ok).toBe(false);
    });
  });

  describe("Mock Session Storage", () => {
    it("should store and retrieve values", () => {
      const storage = createMockSessionStorage();

      storage.setItem("csrf_token", "abc123");
      expect(storage.getItem("csrf_token")).toBe("abc123");
    });

    it("should remove values", () => {
      const storage = createMockSessionStorage();

      storage.setItem("key", "value");
      storage.removeItem("key");
      expect(storage.getItem("key")).toBeNull();
    });

    it("should clear all values", () => {
      const storage = createMockSessionStorage();

      storage.setItem("key1", "value1");
      storage.setItem("key2", "value2");
      storage.clear();

      expect(storage.length).toBe(0);
    });

    it("should track length", () => {
      const storage = createMockSessionStorage();

      expect(storage.length).toBe(0);

      storage.setItem("key1", "value1");
      expect(storage.length).toBe(1);

      storage.setItem("key2", "value2");
      expect(storage.length).toBe(2);
    });
  });

  describe("Mock Local Storage", () => {
    it("should persist data", () => {
      const storage = createMockLocalStorage();

      storage.setItem("user_preference", "dark_mode");
      expect(storage.getItem("user_preference")).toBe("dark_mode");
    });

    it("should handle multiple storage instances separately", () => {
      const storage1 = createMockLocalStorage();
      const storage2 = createMockLocalStorage();

      storage1.setItem("key", "value1");
      storage2.setItem("key", "value2");

      expect(storage1.getItem("key")).toBe("value1");
      expect(storage2.getItem("key")).toBe("value2");
    });
  });

  describe("Multi-URL Mock Fetch", () => {
    it("should handle multiple API endpoints", async () => {
      const mockFetch = createMockFetch({
        "GET /api/products": {
          ok: true,
          data: { products: [] },
        },
        "POST /api/quote": {
          ok: true,
          data: mockQuoteResponse,
        },
        "POST /api/checkout": {
          ok: true,
          data: mockCheckoutSessionResponse,
        },
      });

      global.fetch = mockFetch;

      const productsRes = await global.fetch("/api/products");
      const quoteRes = await global.fetch("/api/quote", { method: "POST" });
      const checkoutRes = await global.fetch("/api/checkout", { method: "POST" });

      expect(productsRes.ok).toBe(true);
      expect(quoteRes.ok).toBe(true);
      expect(checkoutRes.ok).toBe(true);
    });
  });

  describe("Request Payload Validation", () => {
    it("should validate quote request has required fields", () => {
      const payload = buildQuoteRequestPayload(mockCart.items, "US");

      expect(payload).not.toBeNull();
      expect(payload.items).toBeDefined();
      expect(payload.country).toBe("US");
      expect(Array.isArray(payload.items)).toBe(true);
    });

    it("should validate checkout request has required fields", () => {
      const payload = buildCheckoutPayload(mockCart.items, "US", "test@example.com");

      expect(payload).not.toBeNull();
      expect(payload.items).toBeDefined();
      expect(payload.country).toBe("US");
      expect(payload.email).toBe("test@example.com");
    });

    it("should reject invalid payloads", () => {
      const quotePayload = buildQuoteRequestPayload([], "US");
      expect(quotePayload).toBeNull();

      const checkoutPayload = buildCheckoutPayload([], "US", "test@example.com");
      expect(checkoutPayload).toBeNull();
    });
  });

  describe("Response Parsing", () => {
    it("should parse quote response correctly", async () => {
      const mockFetch = createMockQuoteFetch(mockQuoteResponse);
      global.fetch = mockFetch;

      const response = await global.fetch("/api/quote");
      const data = await response.json();

      expect(data.prices.subtotal).toBe(7000);
      expect(data.prices.total).toBe(8640);
    });

    it("should handle different quote formats", async () => {
      const altFormat = {
        subtotal: 7000,
        shipping: 1000,
        tax: 640,
        total: 8640,
      };

      const mockFetch = createMockQuoteFetch(altFormat);
      global.fetch = mockFetch;

      const response = await global.fetch("/api/quote");
      const data = await response.json();
      const quote = extractQuoteData(data);

      expect(quote.total).toBe(8640);
    });
  });
});
