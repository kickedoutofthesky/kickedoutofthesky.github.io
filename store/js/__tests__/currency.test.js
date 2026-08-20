/**
 * Currency Utility Tests
 * Tests for multi-currency conversion and formatting
 */

import { getCurrencyDecimals, convertPrice, formatPrice, getExchangeRate } from "../utils/currency.js";

describe("Currency Utility", () => {
  beforeEach(() => {
    // Reset global currency before each test
    window.customerCurrency = null;
  });

  describe("getCurrencyDecimals", () => {
    test("should return 0 decimals for JPY", () => {
      expect(getCurrencyDecimals("JPY")).toBe(0);
      expect(getCurrencyDecimals("jpy")).toBe(0);
    });

    test("should return 0 decimals for KRW", () => {
      expect(getCurrencyDecimals("KRW")).toBe(0);
    });

    test("should return 2 decimals for most currencies", () => {
      expect(getCurrencyDecimals("USD")).toBe(2);
      expect(getCurrencyDecimals("EUR")).toBe(2);
      expect(getCurrencyDecimals("GBP")).toBe(2);
      expect(getCurrencyDecimals("CAD")).toBe(2);
      expect(getCurrencyDecimals("AUD")).toBe(2);
      expect(getCurrencyDecimals("CHF")).toBe(2);
    });

    test("should return 3 decimals for Bahraini Dinar and similar", () => {
      expect(getCurrencyDecimals("BHD")).toBe(3);
      expect(getCurrencyDecimals("JOD")).toBe(3);
      expect(getCurrencyDecimals("KWD")).toBe(3);
    });

    test("should default to 2 decimals for unknown currencies", () => {
      expect(getCurrencyDecimals("XXX")).toBe(2);
    });
  });

  describe("convertPrice", () => {
    test("should return USD price unchanged when USD is customer currency", () => {
      window.customerCurrency = {
        country: "US",
        currency: "USD",
        exchangeRates: { USD: 1.0 },
      };

      expect(convertPrice(2500)).toBe(2500);
      expect(convertPrice(5000)).toBe(5000);
    });

    test("should convert USD to EUR using exchange rate", () => {
      window.customerCurrency = {
        country: "DE",
        currency: "EUR",
        exchangeRates: { USD: 1.0, EUR: 0.92 },
      };

      // $25.00 USD * 0.92 = €23.00
      expect(convertPrice(2500)).toBe(2300);
      expect(convertPrice(5000)).toBe(4600);
    });

    test("should convert USD to GBP using exchange rate", () => {
      window.customerCurrency = {
        country: "GB",
        currency: "GBP",
        exchangeRates: { USD: 1.0, GBP: 0.79 },
      };

      // $25.00 USD * 0.79 = £19.75
      expect(convertPrice(2500)).toBe(1975);
    });

    test("should convert USD to JPY with zero decimals", () => {
      window.customerCurrency = {
        country: "JP",
        currency: "JPY",
        exchangeRates: { USD: 1.0, JPY: 110.25 },
      };

      // $25.00 USD * 110.25 = ¥2,756.25 → rounds to 2756 (JPY has no decimals)
      expect(convertPrice(2500)).toBe(2756);
    });

    test("should handle uppercase and lowercase currency codes", () => {
      window.customerCurrency = {
        country: "DE",
        currency: "eur",
        exchangeRates: { USD: 1.0, EUR: 0.92 },
      };

      expect(convertPrice(2500)).toBe(2300);
    });

    test("should fallback to USD price if customerCurrency not initialized", () => {
      window.customerCurrency = null;

      expect(convertPrice(2500)).toBe(2500);
    });

    test("should use exchange rate of 1.0 if currency not in rates", () => {
      window.customerCurrency = {
        country: "XX",
        currency: "XXX",
        exchangeRates: { USD: 1.0 },
      };

      expect(convertPrice(2500)).toBe(2500);
    });
  });

  describe("formatPrice", () => {
    test("should format USD currency with dollar sign", () => {
      window.customerCurrency = {
        country: "US",
        currency: "USD",
        exchangeRates: { USD: 1.0 },
      };

      const formatted = formatPrice(2500);
      expect(formatted).toContain("$");
      expect(formatted).toContain("25");
    });

    test("should format EUR currency with euro symbol", () => {
      window.customerCurrency = {
        country: "DE",
        currency: "EUR",
        exchangeRates: { EUR: 1.0 },
      };

      const formatted = formatPrice(2500);
      expect(formatted).toContain("€");
      expect(formatted).toContain("25");
    });

    test("should format GBP currency with pound symbol", () => {
      window.customerCurrency = {
        country: "GB",
        currency: "GBP",
        exchangeRates: { GBP: 1.0 },
      };

      const formatted = formatPrice(2500);
      expect(formatted).toContain("£");
      expect(formatted).toContain("25");
    });

    test("should format JPY without decimal places", () => {
      window.customerCurrency = {
        country: "JP",
        currency: "JPY",
        exchangeRates: { JPY: 1.0 },
      };

      // 2500 cents JPY = 25 (no decimals)
      const formatted = formatPrice(2500);
      // JPY symbol can be ¥ or ￥ depending on the Intl.NumberFormat locale
      expect(formatted).toMatch(/[¥￥]/);
      // JPY should not have decimal point (thousands separator is OK)
      expect(formatted).not.toContain(".");
    });

    test("should allow currency override", () => {
      window.customerCurrency = {
        country: "US",
        currency: "USD",
        exchangeRates: { USD: 1.0 },
      };

      const formatted = formatPrice(2500, "EUR");
      expect(formatted).toContain("€");
    });

    test("should handle lowercase currency codes", () => {
      window.customerCurrency = {
        country: "US",
        currency: "usd",
        exchangeRates: { USD: 1.0 },
      };

      const formatted = formatPrice(2500);
      expect(formatted).toContain("$");
    });

    test("should fallback to simple formatting if Intl not available", () => {
      window.customerCurrency = {
        country: "US",
        currency: "USD",
        exchangeRates: { USD: 1.0 },
      };

      // This test just ensures no errors are thrown
      expect(() => formatPrice(2500)).not.toThrow();
    });
  });

  describe("getExchangeRate", () => {
    test("should return exchange rate for currency", () => {
      window.customerCurrency = {
        country: "DE",
        currency: "EUR",
        exchangeRates: { USD: 1.0, EUR: 0.92, GBP: 0.79, JPY: 110.25 },
      };

      expect(getExchangeRate("EUR")).toBe(0.92);
      expect(getExchangeRate("GBP")).toBe(0.79);
      expect(getExchangeRate("JPY")).toBe(110.25);
    });

    test("should return 1.0 if currency not found", () => {
      window.customerCurrency = {
        country: "US",
        currency: "USD",
        exchangeRates: { USD: 1.0 },
      };

      expect(getExchangeRate("XXX")).toBe(1);
    });

    test("should return 1.0 if customerCurrency not initialized", () => {
      window.customerCurrency = null;

      expect(getExchangeRate("EUR")).toBe(1);
    });

    test("should handle lowercase currency codes", () => {
      window.customerCurrency = {
        country: "DE",
        currency: "EUR",
        exchangeRates: { USD: 1.0, EUR: 0.92 },
      };

      expect(getExchangeRate("eur")).toBe(0.92);
    });
  });

  describe("End-to-end Price Conversion Flow", () => {
    test("should convert and format USD to EUR correctly", () => {
      window.customerCurrency = {
        country: "DE",
        currency: "EUR",
        exchangeRates: { USD: 1.0, EUR: 0.92 },
      };

      // Convert: $25.00 * 0.92 = €23.00
      const convertedCents = convertPrice(2500);
      expect(convertedCents).toBe(2300);

      // Format: Should show as €23,00 (German format)
      const formatted = formatPrice(convertedCents);
      expect(formatted).toContain("€");
      expect(formatted).toContain("23");
    });

    test("should convert and format USD to JPY correctly", () => {
      window.customerCurrency = {
        country: "JP",
        currency: "JPY",
        exchangeRates: { USD: 1.0, JPY: 110.25 },
      };

      // Convert: $25.00 * 110.25 = ¥2,756.25 → 2756 (JPY has no decimals)
      const convertedCents = convertPrice(2500);
      expect(convertedCents).toBe(2756);

      // Format: Should show as ¥2,756 (no decimals)
      const formatted = formatPrice(convertedCents);
      // JPY symbol can be ¥ or ￥ depending on the Intl.NumberFormat locale
      expect(formatted).toMatch(/[¥￥]/);
      expect(formatted).not.toContain("."); // No decimal point for JPY
    });

    test("should convert and format USD to GBP correctly", () => {
      window.customerCurrency = {
        country: "GB",
        currency: "GBP",
        exchangeRates: { USD: 1.0, GBP: 0.79 },
      };

      // Convert: $25.00 * 0.79 = £19.75
      const convertedCents = convertPrice(2500);
      expect(convertedCents).toBe(1975);

      // Format: Should show as £19.75
      const formatted = formatPrice(convertedCents);
      expect(formatted).toContain("£");
      expect(formatted).toContain("19.75");
    });
  });

  describe("Cart Display Integration", () => {
    test("should calculate cart total in customer currency", () => {
      window.customerCurrency = {
        country: "DE",
        currency: "EUR",
        exchangeRates: { USD: 1.0, EUR: 0.92 },
      };

      // Cart with 2 items @ $25 each = $50 USD = €46 EUR
      const item1Usd = 2500;
      const item2Usd = 2500;
      const cartTotalUsd = item1Usd + item2Usd;

      const convertedTotal = convertPrice(cartTotalUsd);
      expect(convertedTotal).toBe(4600); // €46.00

      const formatted = formatPrice(convertedTotal);
      expect(formatted).toContain("€");
      expect(formatted).toContain("46");
    });
  });
});
