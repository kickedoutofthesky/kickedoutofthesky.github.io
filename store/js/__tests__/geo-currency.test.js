/**
 * Geo-Location and Currency Initialization Tests
 * Tests for initial geo-detection, country defaulting, and localStorage persistence
 */

import { initializeCurrency } from "../utils/currency.js";

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
  });

  describe("initializeCurrency() - Successful Geo Detection", () => {
    test("should fetch geo data and initialize currency", async () => {
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
    });

    test("should store geo-detected country in localStorage on first visit", async () => {
      const mockGeoData = {
        country: "GB",
        currency: "GBP",
        exchangeRates: { USD: 1.0, GBP: 0.79 },
        vatRate: 20,
        isEU: false,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoData,
      });

      await initializeCurrency();

      expect(localStorage.getItem("selectedShippingCountry")).toBe("GB");
    });

    test("should NOT overwrite existing localStorage country", async () => {
      // Simulate customer previously selected DE
      localStorage.setItem("selectedShippingCountry", "DE");

      const mockGeoData = {
        country: "US",
        currency: "USD",
        exchangeRates: { USD: 1.0 },
        vatRate: 0,
        isEU: false,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoData,
      });

      await initializeCurrency();

      // localStorage should still have DE (customer's choice)
      expect(localStorage.getItem("selectedShippingCountry")).toBe("DE");
    });

    test("should handle different countries from geo API", async () => {
      const testCountries = [
        { country: "FR", currency: "EUR", isEU: true },
        { country: "JP", currency: "JPY", isEU: false },
        { country: "CA", currency: "CAD", isEU: false },
      ];

      for (const geoData of testCountries) {
        localStorage.clear();
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...geoData,
            exchangeRates: { USD: 1.0 },
            vatRate: 0,
          }),
        });

        await initializeCurrency();

        expect(localStorage.getItem("selectedShippingCountry")).toBe(geoData.country);
        expect(window.customerCurrency.country).toBe(geoData.country);
        expect(window.customerCurrency.currency).toBe(geoData.currency);
      }
    });
  });

  describe("initializeCurrency() - Fallback Behavior", () => {
    test("should fall back to USD when geo API fails", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await initializeCurrency();

      expect(result.country).toBe("US");
      expect(result.currency).toBe("USD");
      expect(result.exchangeRates).toEqual({ USD: 1.0 });
      expect(window.customerCurrency).toEqual(result);
    });

    test("should store fallback US country in localStorage when API fails", async () => {
      global.fetch.mockRejectedValueOnce(new Error("Network error"));

      await initializeCurrency();

      expect(localStorage.getItem("selectedShippingCountry")).toBe("US");
    });

    test("should NOT overwrite existing localStorage on API failure", async () => {
      localStorage.setItem("selectedShippingCountry", "GB");
      global.fetch.mockRejectedValueOnce(new Error("Network error"));

      await initializeCurrency();

      // localStorage should still have GB (customer's choice preserved)
      expect(localStorage.getItem("selectedShippingCountry")).toBe("GB");
    });

    test("should fall back to USD when API returns invalid data", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // Empty response
      });

      const result = await initializeCurrency();

      // Should fall back to default US values
      expect(result.country).toBe("US");
      expect(result.currency).toBe("USD");
      expect(window.customerCurrency).toBeDefined();
    });
  });

  describe("initializeCurrency() - API Configuration", () => {
    test("should call /api/geo endpoint", async () => {
      const mockGeoData = {
        country: "US",
        currency: "USD",
        exchangeRates: { USD: 1.0 },
        vatRate: 0,
        isEU: false,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoData,
      });

      await initializeCurrency();

      expect(global.fetch).toHaveBeenCalledWith("https://api.kickedoutofthesky.com/api/geo");
    });

    test("should use custom API URL when window.__API_URL__ is set", async () => {
      window.__API_URL__ = "https://staging.example.com";

      const mockGeoData = {
        country: "US",
        currency: "USD",
        exchangeRates: { USD: 1.0 },
        vatRate: 0,
        isEU: false,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoData,
      });

      await initializeCurrency();

      expect(global.fetch).toHaveBeenCalledWith("https://staging.example.com/api/geo");

      delete window.__API_URL__;
    });
  });

  describe("Country Selection Flow", () => {
    test("complete flow: geo detection -> localStorage -> default on cart", async () => {
      // Step 1: Product page loads, initializeCurrency() called
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

      // Step 2: Verify country stored in localStorage
      expect(localStorage.getItem("selectedShippingCountry")).toBe("DE");
      expect(result.country).toBe("DE");

      // Step 3: Simulate cart page loading
      const savedCountry = localStorage.getItem("selectedShippingCountry");
      expect(savedCountry).toBe("DE");
    });

    test("customer changes country: localStorage updated", () => {
      // Initial state from geo-detection
      localStorage.setItem("selectedShippingCountry", "DE");

      // Simulate customer changing country in dropdown
      localStorage.setItem("selectedShippingCountry", "FR");

      // Verify update
      expect(localStorage.getItem("selectedShippingCountry")).toBe("FR");
    });

    test("customer's choice persists across visits", () => {
      // Visit 1: Geo-detection sets US
      localStorage.setItem("selectedShippingCountry", "US");
      expect(localStorage.getItem("selectedShippingCountry")).toBe("US");

      // Customer changes to GB
      localStorage.setItem("selectedShippingCountry", "GB");
      expect(localStorage.getItem("selectedShippingCountry")).toBe("GB");

      // Visit 2: Simulate page refresh/return
      const savedCountry = localStorage.getItem("selectedShippingCountry");
      expect(savedCountry).toBe("GB");
    });
  });

  describe("Multi-Currency Support with Geo", () => {
    test("should initialize correct currency for each country", async () => {
      const countryCurrencyMap = [
        { country: "US", currency: "USD" },
        { country: "DE", currency: "EUR" },
        { country: "GB", currency: "GBP" },
        { country: "JP", currency: "JPY" },
        { country: "AU", currency: "AUD" },
      ];

      for (const mapping of countryCurrencyMap) {
        localStorage.clear();
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
      const mockGeoData = {
        country: "US",
        currency: "USD",
        exchangeRates: null,
        vatRate: 0,
        isEU: false,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoData,
      });

      const result = await initializeCurrency();

      expect(result).toBeDefined();
      expect(result.country).toBe("US");
      expect(localStorage.getItem("selectedShippingCountry")).toBe("US");
    });

    test("should handle missing VAT rate", async () => {
      const mockGeoData = {
        country: "US",
        currency: "USD",
        exchangeRates: { USD: 1.0 },
        isEU: false,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoData,
      });

      const result = await initializeCurrency();

      expect(result.country).toBe("US");
      expect(localStorage.getItem("selectedShippingCountry")).toBe("US");
    });

    test("should handle concurrent initializeCurrency calls", async () => {
      const mockGeoData = {
        country: "DE",
        currency: "EUR",
        exchangeRates: { USD: 1.0, EUR: 0.92 },
        vatRate: 19,
        isEU: true,
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockGeoData,
      });

      // Simulate concurrent calls
      const [result1, result2] = await Promise.all([initializeCurrency(), initializeCurrency()]);

      expect(result1.country).toBe("DE");
      expect(result2.country).toBe("DE");
      // localStorage should have the country only once
      expect(localStorage.getItem("selectedShippingCountry")).toBe("DE");
    });
  });
});
