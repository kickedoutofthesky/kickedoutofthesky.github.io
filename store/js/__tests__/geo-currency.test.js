/**
 * Geo-Location and Currency Initialization Tests
 * Tests for multi-step country detection: IP → timezone → backend → default
 */

import { initializeCurrency, _resetDetection } from "../utils/currency.js";

describe("Geo-Location & Currency Initialization", () => {
  beforeEach(() => {
    // Clear localStorage and global state before each test
    localStorage.clear();
    window.customerCurrency = null;
    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    _resetDetection();
  });

  describe("initializeCurrency() - Successful IP Geo Detection", () => {
    test("should detect country via IP API and fetch currency data", async () => {
      // Mock IP geolocation response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "DE" }),
      });

      // Mock backend currency data
      const mockGeoData = {
        country: "DE",
        currency: "EUR",
        exchangeRates: { USD: 1.0, EUR: 0.92 },
        vatRate: 19,
        isEU: true,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoData,
      });

      const result = await initializeCurrency();

      expect(result).toEqual({
        country: "DE",
        currency: "EUR",
        exchangeRates: { USD: 1.0, EUR: 0.92 },
        vatRate: 19,
        isEU: true,
      });
      expect(window.customerCurrency).toEqual(result);
      expect(localStorage.getItem("selectedShippingCountry")).toBe("DE");
      expect(localStorage.getItem("countryManuallySet")).toBe("false");
    });

    test("should store geo-detected country in localStorage on first visit", async () => {
      // Mock IP detection
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "GB" }),
      });

      // Mock backend
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          country: "GB",
          currency: "GBP",
          exchangeRates: { USD: 1.0, GBP: 0.79 },
          vatRate: 20,
          isEU: false,
        }),
      });

      await initializeCurrency();

      expect(localStorage.getItem("selectedShippingCountry")).toBe("GB");
      expect(localStorage.getItem("countryManuallySet")).toBe("false");
    });

    test("should NOT overwrite existing localStorage country", async () => {
      // Simulate customer previously selected DE
      localStorage.setItem("selectedShippingCountry", "DE");
      localStorage.setItem("countryManuallySet", "true");

      // Mock IP detection (returns US)
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "US" }),
      });

      // Mock backend (returns US data)
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          country: "US",
          currency: "USD",
          exchangeRates: { USD: 1.0 },
          vatRate: 0,
          isEU: false,
        }),
      });

      await initializeCurrency();

      // localStorage should still have DE (customer's manual choice)
      expect(localStorage.getItem("selectedShippingCountry")).toBe("DE");
      expect(localStorage.getItem("countryManuallySet")).toBe("true");
    });

    test("should handle different countries from geo API", async () => {
      const testCountries = [
        { code: "FR", country: "FR", currency: "EUR", isEU: true },
        { code: "JP", country: "JP", currency: "JPY", isEU: false },
        { code: "CA", country: "CA", currency: "CAD", isEU: false },
      ];

      for (const testData of testCountries) {
        localStorage.clear();
        window.customerCurrency = null;
        _resetDetection();

        // Mock IP detection
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ country_code: testData.code }),
        });

        // Mock backend
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            country: testData.country,
            currency: testData.currency,
            exchangeRates: { USD: 1.0 },
            vatRate: 0,
            isEU: testData.isEU,
          }),
        });

        await initializeCurrency();

        expect(localStorage.getItem("selectedShippingCountry")).toBe(testData.country);
        expect(window.customerCurrency.country).toBe(testData.country);
        expect(window.customerCurrency.currency).toBe(testData.currency);
      }
    });
  });

  describe("initializeCurrency() - Fallback to Timezone Detection", () => {
    test("should fall back to timezone when IP detection fails", async () => {
      // Mock IP detection failure
      global.fetch.mockRejectedValueOnce(new Error("IP API blocked"));

      // Mock backend (timezone gives us US)
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          country: "US",
          currency: "USD",
          exchangeRates: { USD: 1.0 },
          vatRate: 0,
          isEU: false,
        }),
      });

      const result = await initializeCurrency();

      expect(result.country).toBe("US");
      expect(result.currency).toBe("USD");
      expect(localStorage.getItem("selectedShippingCountry")).toBe("US");
    });

    test("should default to US when all detection fails", async () => {
      // Mock IP detection failure
      global.fetch.mockRejectedValueOnce(new Error("Network error"));

      // Mock backend failure
      global.fetch.mockRejectedValueOnce(new Error("Backend error"));

      const result = await initializeCurrency();

      expect(result.country).toBe("US");
      expect(result.currency).toBe("USD");
      expect(result.exchangeRates).toEqual({ USD: 1.0 });
      expect(localStorage.getItem("selectedShippingCountry")).toBe("US");
    });
  });

  describe("initializeCurrency() - API Configuration", () => {
    test("should call backend /api/geo endpoint with detected country", async () => {
      // Mock IP detection
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "DE" }),
      });

      // Mock backend
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          country: "DE",
          currency: "EUR",
          exchangeRates: { USD: 1.0 },
          vatRate: 19,
          isEU: true,
        }),
      });

      await initializeCurrency();

      expect(global.fetch).toHaveBeenCalledWith("https://ipapi.co/json/", expect.any(Object));
      expect(global.fetch).toHaveBeenCalledWith("https://api.kickedoutofthesky.com/api/geo?country=DE");
    });

    test("should use custom API URL when window.__API_URL__ is set", async () => {
      window.__API_URL__ = "https://staging.example.com";

      // Mock IP detection
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "US" }),
      });

      // Mock backend
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          country: "US",
          currency: "USD",
          exchangeRates: { USD: 1.0 },
          vatRate: 0,
          isEU: false,
        }),
      });

      await initializeCurrency();

      expect(global.fetch).toHaveBeenCalledWith("https://staging.example.com/api/geo?country=US");

      delete window.__API_URL__;
    });
  });

  describe("Country Selection Flow", () => {
    test("complete flow: IP detection -> localStorage -> cart uses saved", async () => {
      // Step 1: Product page loads
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "DE" }),
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          country: "DE",
          currency: "EUR",
          exchangeRates: { USD: 1.0, EUR: 0.92 },
          vatRate: 19,
          isEU: true,
        }),
      });

      const result = await initializeCurrency();

      // Step 2: Verify country stored in localStorage
      expect(localStorage.getItem("selectedShippingCountry")).toBe("DE");
      expect(result.country).toBe("DE");

      // Step 3: Simulate cart page loading
      const savedCountry = localStorage.getItem("selectedShippingCountry");
      expect(savedCountry).toBe("DE");
    });

    test("customer manually selects country: sets countryManuallySet flag", () => {
      // Initial state from geo-detection
      localStorage.setItem("selectedShippingCountry", "DE");
      localStorage.setItem("countryManuallySet", "false");

      // Simulate customer manually changing country in dropdown
      localStorage.setItem("selectedShippingCountry", "FR");
      localStorage.setItem("countryManuallySet", "true");

      // Verify flags
      expect(localStorage.getItem("selectedShippingCountry")).toBe("FR");
      expect(localStorage.getItem("countryManuallySet")).toBe("true");
    });

    test("customer's manual choice prevents geo override on next visit", async () => {
      // Visit 1: Customer manually selected FR
      localStorage.setItem("selectedShippingCountry", "FR");
      localStorage.setItem("countryManuallySet", "true");

      // Visit 2: Page reloads, IP detection returns DE
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "DE" }),
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          country: "DE",
          currency: "EUR",
          exchangeRates: { USD: 1.0 },
          vatRate: 19,
          isEU: true,
        }),
      });

      await initializeCurrency();

      // Should still be FR (manual choice preserved)
      expect(localStorage.getItem("selectedShippingCountry")).toBe("FR");
      expect(localStorage.getItem("countryManuallySet")).toBe("true");
    });

    test("geolocation overrides default US when countryManuallySet is false", async () => {
      // Initialize with default US (simulating cart-display.js initialization)
      localStorage.setItem("selectedShippingCountry", "US");
      localStorage.setItem("countryManuallySet", "false");

      // IP detection finds a different country
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "DE" }),
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          country: "DE",
          currency: "EUR",
          exchangeRates: { USD: 1.0 },
          vatRate: 19,
          isEU: true,
        }),
      });

      const result = await initializeCurrency();

      // Should override the default US with detected DE
      expect(result.country).toBe("DE");
      expect(result.currency).toBe("EUR");
      expect(localStorage.getItem("selectedShippingCountry")).toBe("DE");
      expect(localStorage.getItem("countryManuallySet")).toBe("false");
    });
  });

  describe("Multi-Currency Support with Geo", () => {
    test("should initialize correct currency for each country", async () => {
      const countryCurrencyMap = [
        { code: "US", country: "US", currency: "USD" },
        { code: "DE", country: "DE", currency: "EUR" },
        { code: "GB", country: "GB", currency: "GBP" },
      ];

      for (const mapping of countryCurrencyMap) {
        localStorage.clear();
        window.customerCurrency = null;
        _resetDetection();

        // Mock IP detection
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ country_code: mapping.code }),
        });

        // Mock backend
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            country: mapping.country,
            currency: mapping.currency,
            exchangeRates: { USD: 1.0 },
            vatRate: 0,
            isEU: false,
          }),
        });

        const result = await initializeCurrency();

        expect(result.currency).toBe(mapping.currency);
        expect(localStorage.getItem("selectedShippingCountry")).toBe(mapping.country);
      }
    });

    test("should handle JPY and AUD currencies", async () => {
      const currencies = [
        { code: "JP", country: "JP", currency: "JPY" },
        { code: "AU", country: "AU", currency: "AUD" },
      ];

      for (const mapping of currencies) {
        localStorage.clear();
        window.customerCurrency = null;
        _resetDetection();

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ country_code: mapping.code }),
        });

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            country: mapping.country,
            currency: mapping.currency,
            exchangeRates: { USD: 1.0 },
            vatRate: 0,
            isEU: false,
          }),
        });

        const result = await initializeCurrency();

        expect(result.currency).toBe(mapping.currency);
        expect(localStorage.getItem("selectedShippingCountry")).toBe(mapping.country);
      }
    });
  });

  describe("Edge Cases", () => {
    test("should handle null/undefined exchange rates gracefully", async () => {
      // Mock IP detection
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "US" }),
      });

      // Mock backend with missing exchange rates
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          country: "US",
          currency: "USD",
          exchangeRates: null,
          vatRate: 0,
          isEU: false,
        }),
      });

      const result = await initializeCurrency();

      expect(result).toBeDefined();
      expect(result.country).toBe("US");
      expect(localStorage.getItem("selectedShippingCountry")).toBe("US");
    });

    test("should handle missing VAT rate", async () => {
      // Mock IP detection
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "US" }),
      });

      // Mock backend without VAT
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          country: "US",
          currency: "USD",
          exchangeRates: { USD: 1.0 },
          isEU: false,
        }),
      });

      const result = await initializeCurrency();

      expect(result.country).toBe("US");
      expect(localStorage.getItem("selectedShippingCountry")).toBe("US");
    });

    test("should return cached value on subsequent calls", async () => {
      // First call: mock the detection
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_code: "DE" }),
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          country: "DE",
          currency: "EUR",
          exchangeRates: { USD: 1.0, EUR: 0.92 },
          vatRate: 19,
          isEU: true,
        }),
      });

      const result1 = await initializeCurrency();

      // Second call: should use cached value without additional fetch
      const result2 = await initializeCurrency();

      expect(result1.country).toBe("DE");
      expect(result2.country).toBe("DE");
      // Should only have called fetch twice (IP + backend from first call)
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
