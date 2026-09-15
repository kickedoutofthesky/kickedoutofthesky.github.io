/**
 * Cart Display Refactored Tests
 * Using pure utility functions and proper mocking
 */

import {
  extractPricesFromProduct,
  calculatePriceRange,
  formatPriceForDisplay,
  buildCartItem,
  validateCartItem,
  getProductImageForVariant,
  buildQuoteRequestPayload,
  extractQuoteData,
  isValidQuote,
  formatCurrency,
  calculateOrderTotal,
  buildCheckoutPayload,
} from "../utils/fixtures/cart-utilities";

import {
  mockProducts,
  mockCart,
  mockQuoteResponse,
  mockQuoteResponseDE,
  mockCountries,
  mockCheckoutSessionResponse,
} from "../utils/fixtures/test-data";

describe("Cart Display Utilities - Refactored", () => {
  describe("extractPricesFromProduct", () => {
    it("should extract all prices from product variants", () => {
      const prices = extractPricesFromProduct(mockProducts[0]);

      expect(Array.isArray(prices)).toBe(true);
      expect(prices.length).toBeGreaterThan(0);
      expect(prices.every(p => typeof p === "number")).toBe(true);
    });

    it("should handle product with no variants", () => {
      const prices = extractPricesFromProduct({ variants: {} });
      expect(prices).toEqual([]);
    });

    it("should handle null product", () => {
      expect(extractPricesFromProduct(null)).toEqual([]);
      expect(extractPricesFromProduct(undefined)).toEqual([]);
    });

    it("should handle invalid variants structure", () => {
      expect(extractPricesFromProduct({ variants: "invalid" })).toEqual([]);
    });

    it("should extract prices from multiple colors and sizes", () => {
      const prices = extractPricesFromProduct(mockProducts[1]); // Hoodie with multiple colors

      expect(prices.length).toBeGreaterThan(4);
    });
  });

  describe("calculatePriceRange", () => {
    it("should calculate min and max price", () => {
      const prices = [2500, 3000, 4500];
      const range = calculatePriceRange(prices);

      expect(range.min).toBe(25);
      expect(range.max).toBe(45);
    });

    it("should handle single price", () => {
      const range = calculatePriceRange([2500]);

      expect(range.min).toBe(25);
      expect(range.max).toBe(25);
    });

    it("should handle empty array", () => {
      const range = calculatePriceRange([]);

      expect(range.min).toBe(0);
      expect(range.max).toBe(0);
    });

    it("should handle unsorted prices", () => {
      const prices = [4500, 2000, 3000, 2500];
      const range = calculatePriceRange(prices);

      expect(range.min).toBe(20);
      expect(range.max).toBe(45);
    });
  });

  describe("formatPriceForDisplay", () => {
    it("should format single price", () => {
      const display = formatPriceForDisplay(2500, 2500);

      expect(display).toBe("$25.00");
    });

    it("should format price range", () => {
      const display = formatPriceForDisplay(2000, 4500);

      expect(display).toContain("$20.00");
      expect(display).toContain("$45.00");
      expect(display).toContain("-");
    });

    it("should handle zero prices", () => {
      const display = formatPriceForDisplay(0, 0);

      expect(display).toBe("$0.00");
    });
  });

  describe("buildCartItem", () => {
    it("should build valid cart item", () => {
      const product = mockProducts[0];
      const formData = {
        color: "Black",
        size: "M",
        variant_id: 1002,
        quantity: 1,
        price_cents: 2500,
      };

      const item = buildCartItem(product, formData);

      expect(item.product_key).toBe("tee_001");
      expect(item.color).toBe("Black");
      expect(item.size).toBe("M");
      expect(item.quantity).toBe(1);
    });

    it("should handle null product", () => {
      const formData = { color: "Black", size: "M" };
      const item = buildCartItem(null, formData);

      expect(item).toBeNull();
    });

    it("should handle null form data", () => {
      const item = buildCartItem(mockProducts[0], null);
      expect(item).toBeNull();
    });
  });

  describe("validateCartItem", () => {
    it("should validate good cart item", () => {
      const item = {
        product_key: "tee_001",
        variant_id: 1002,
        quantity: 1,
      };

      expect(validateCartItem(item)).toBe(true);
    });

    it("should reject item with invalid quantity", () => {
      const item = {
        product_key: "tee_001",
        variant_id: 1002,
        quantity: 0,
      };

      expect(validateCartItem(item)).toBe(false);
    });

    it("should reject item with excessive quantity", () => {
      const item = {
        product_key: "tee_001",
        variant_id: 1002,
        quantity: 1000,
      };

      expect(validateCartItem(item)).toBe(false);
    });

    it("should reject null item", () => {
      expect(validateCartItem(null)).toBe(false);
    });

    it("should reject item missing product_key", () => {
      const item = {
        variant_id: 1002,
        quantity: 1,
      };

      expect(validateCartItem(item)).toBe(false);
    });
  });

  describe("getProductImageForVariant", () => {
    it("should return color-specific image", () => {
      const product = mockProducts[0];
      const image = getProductImageForVariant(product, "Black");

      expect(image).toBe("tee-black.jpg");
    });

    it("should return default image when color not found", () => {
      const product = mockProducts[0];
      const image = getProductImageForVariant(product, "Purple");

      expect(image).toBe("tee-main.jpg");
    });

    it("should return default image when no color specified", () => {
      const product = mockProducts[0];
      const image = getProductImageForVariant(product, null);

      expect(image).toBe("tee-main.jpg");
    });

    it("should handle null product", () => {
      expect(getProductImageForVariant(null, "Black")).toBeNull();
    });
  });

  describe("buildQuoteRequestPayload", () => {
    it("should build valid quote payload", () => {
      const payload = buildQuoteRequestPayload(mockCart.items, "US");

      expect(payload).toBeTruthy();
      expect(payload.items).toBeDefined();
      expect(payload.country).toBe("US");
      expect(Array.isArray(payload.items)).toBe(true);
    });

    it("should convert variant_id to sku string", () => {
      const payload = buildQuoteRequestPayload(mockCart.items, "US");

      payload.items.forEach(item => {
        expect(typeof item.sku).toBe("string");
      });
    });

    it("should handle empty cart", () => {
      const payload = buildQuoteRequestPayload([], "US");
      expect(payload).toBeNull();
    });

    it("should handle missing country", () => {
      const payload = buildQuoteRequestPayload(mockCart.items, null);
      expect(payload).toBeNull();
    });
  });

  describe("extractQuoteData", () => {
    it("should extract quote data from response", () => {
      const quote = extractQuoteData(mockQuoteResponse);

      expect(quote.subtotal).toBe(7000);
      expect(quote.shipping).toBe(1000);
      expect(quote.tax).toBe(640);
      expect(quote.total).toBe(8640);
      expect(quote.currency).toBe("USD");
    });

    it("should handle flat response structure", () => {
      const flatResponse = {
        subtotal: 7000,
        shipping: 1000,
        tax: 640,
        total: 8640,
        currency: "USD",
      };

      const quote = extractQuoteData(flatResponse);

      expect(quote.total).toBe(8640);
      expect(quote.currency).toBe("USD");
    });

    it("should handle null response", () => {
      const quote = extractQuoteData(null);
      expect(quote).toBeNull();
    });

    it("should provide defaults for missing fields", () => {
      const minimalResponse = { currency: "EUR" };
      const quote = extractQuoteData(minimalResponse);

      expect(quote.subtotal).toBe(0);
      expect(quote.currency).toBe("EUR");
    });
  });

  describe("isValidQuote", () => {
    it("should validate correct quote", () => {
      const quote = extractQuoteData(mockQuoteResponse);
      expect(isValidQuote(quote)).toBe(true);
    });

    it("should reject quote with zero total", () => {
      const quote = { total: 0, currency: "USD" };
      expect(isValidQuote(quote)).toBe(false);
    });

    it("should reject quote without currency", () => {
      const quote = { total: 1000 };
      expect(isValidQuote(quote)).toBe(false);
    });

    it("should reject null quote", () => {
      expect(isValidQuote(null)).toBe(false);
    });
  });

  describe("formatCurrency", () => {
    it("should format USD currency", () => {
      const formatted = formatCurrency(2500, "USD");
      expect(formatted).toBe("$25.00");
    });

    it("should format GBP currency", () => {
      const formatted = formatCurrency(2500, "GBP");
      expect(formatted).toBe("£25.00");
    });

    it("should format EUR currency", () => {
      const formatted = formatCurrency(2500, "EUR");
      expect(formatted).toBe("€25.00");
    });

    it("should default to USD", () => {
      const formatted = formatCurrency(2500);
      expect(formatted).toBe("$25.00");
    });

    it("should handle unknown currency", () => {
      const formatted = formatCurrency(2500, "XYZ");
      expect(formatted).toBe("$25.00");
    });
  });

  describe("calculateOrderTotal", () => {
    it("should calculate total from cart items", () => {
      const total = calculateOrderTotal(mockCart.items);

      expect(total).toBeGreaterThan(0);
      expect(typeof total).toBe("number");
    });

    it("should handle empty cart", () => {
      const total = calculateOrderTotal([]);
      expect(total).toBe(0);
    });

    it("should multiply price by quantity", () => {
      const items = [
        { price_cents: 2500, quantity: 2 },
        { price_cents: 4500, quantity: 1 },
      ];

      const total = calculateOrderTotal(items);
      expect(total).toBe(9500);
    });

    it("should handle null input", () => {
      const total = calculateOrderTotal(null);
      expect(total).toBe(0);
    });
  });

  describe("buildCheckoutPayload", () => {
    it("should build checkout payload", () => {
      const payload = buildCheckoutPayload(mockCart.items, "US", "test@example.com");

      expect(payload).toBeTruthy();
      expect(payload.items).toBeDefined();
      expect(payload.country).toBe("US");
      expect(payload.email).toBe("test@example.com");
    });

    it("should handle empty cart", () => {
      const payload = buildCheckoutPayload([], "US", "test@example.com");
      expect(payload).toBeNull();
    });

    it("should include variant_id not sku", () => {
      const payload = buildCheckoutPayload(mockCart.items, "US", "test@example.com");

      payload.items.forEach(item => {
        expect(item.variant_id).toBeDefined();
        expect(item.quantity).toBeDefined();
      });
    });
  });
});
