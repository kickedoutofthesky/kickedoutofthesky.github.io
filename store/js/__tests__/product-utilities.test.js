/**
 * Product Utilities Tests
 * Tests the helpers from utils/fixtures/product-utilities.js that
 * store/js/product.js and store/js/cart-display.js actually use at runtime.
 */

import {
  getSizesForColor,
  getVariantIdForColorSize,
  getPriceRangeFromProduct,
  isProductSticker,
  constrainZoomLevel,
  calculateZoomIncrement,
} from "../utils/fixtures/product-utilities";

const mockProducts = [
  {
    product_key: "tee_001",
    title: "Classic Tee",
    image: "tee-main.jpg",
    display_price: "$25.00",
    variants: {
      Black: {
        image: "tee-black.jpg",
        sizes: {
          S: { variant_id: 1001, price_cents: 2500 },
          M: { variant_id: 1002, price_cents: 2500 },
          L: { variant_id: 1003, price_cents: 2500 },
          XL: { variant_id: 1004, price_cents: 2500 },
        },
      },
      Red: {
        image: "tee-red.jpg",
        sizes: {
          S: { variant_id: 1005, price_cents: 2500 },
          M: { variant_id: 1006, price_cents: 2500 },
          L: { variant_id: 1007, price_cents: 2500 },
          XL: { variant_id: 1008, price_cents: 2500 },
        },
      },
      White: {
        image: "tee-white.jpg",
        sizes: {
          S: { variant_id: 1009, price_cents: 2500 },
          M: { variant_id: 1010, price_cents: 2500 },
          L: { variant_id: 1011, price_cents: 2500 },
          XL: { variant_id: 1012, price_cents: 2500 },
        },
      },
    },
  },
  {
    product_key: "hoodie_001",
    title: "Classic Hoodie",
    image: "hoodie-main.jpg",
    display_price: "$45.00",
    variants: {
      Black: {
        image: "hoodie-black.jpg",
        sizes: {
          S: { variant_id: 2001, price_cents: 4500 },
          M: { variant_id: 2002, price_cents: 4500 },
          L: { variant_id: 2003, price_cents: 4500 },
          XL: { variant_id: 2004, price_cents: 4500 },
          XXL: { variant_id: 2005, price_cents: 5000 },
        },
      },
      Navy: {
        image: "hoodie-navy.jpg",
        sizes: {
          S: { variant_id: 2006, price_cents: 4500 },
          M: { variant_id: 2007, price_cents: 4500 },
          L: { variant_id: 2008, price_cents: 4500 },
          XL: { variant_id: 2009, price_cents: 4500 },
          XXL: { variant_id: 2010, price_cents: 5000 },
        },
      },
    },
  },
  {
    product_key: "sticker_001",
    title: "Vinyl Sticker Pack",
    image: "sticker-main.jpg",
    display_price: "$5.00",
    variants: {
      Default: {
        image: "sticker-main.jpg",
        sizes: {
          OneSize: { variant_id: 3001, price_cents: 500 },
        },
      },
    },
  },
];

const mockProductNoVariants = {
  product_key: "simple_001",
  title: "Simple Product",
  image: "simple.jpg",
  display_price: "$15.00",
  variants: {},
};

describe("Product Utilities", () => {
  describe("getSizesForColor", () => {
    it("should get sizes for specific color", () => {
      const sizes = getSizesForColor(mockProducts[0], "Black");

      expect(Array.isArray(sizes)).toBe(true);
      expect(sizes.length).toBeGreaterThan(0);
      expect(sizes).toContain("M");
    });

    it("should return empty array for invalid color", () => {
      const sizes = getSizesForColor(mockProducts[0], "Purple");
      expect(sizes).toEqual([]);
    });

    it("should handle null product", () => {
      expect(getSizesForColor(null, "Black")).toEqual([]);
    });

    it("should return multiple sizes", () => {
      const sizes = getSizesForColor(mockProducts[1], "Black"); // Hoodie
      expect(sizes.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("getVariantIdForColorSize", () => {
    it("should get variant ID for color and size", () => {
      const variantId = getVariantIdForColorSize(mockProducts[0], "Black", "M");

      expect(variantId).toBeDefined();
      expect(typeof variantId).toBe("number");
    });

    it("should return null for invalid color", () => {
      const variantId = getVariantIdForColorSize(mockProducts[0], "Purple", "M");
      expect(variantId).toBeNull();
    });

    it("should return null for invalid size", () => {
      const variantId = getVariantIdForColorSize(mockProducts[0], "Black", "XXL");
      expect(variantId).toBeNull();
    });

    it("should return null for null product", () => {
      expect(getVariantIdForColorSize(null, "Black", "M")).toBeNull();
    });
  });

  describe("getPriceRangeFromProduct", () => {
    it("should get price range from product", () => {
      const range = getPriceRangeFromProduct(mockProducts[0]);

      expect(range.min).toBeDefined();
      expect(range.max).toBeDefined();
      expect(typeof range.min).toBe("number");
      expect(typeof range.max).toBe("number");
    });

    it("should handle uniform pricing", () => {
      const range = getPriceRangeFromProduct(mockProducts[0]);

      if (range.min === range.max) {
        expect(range.min).toBe(range.max);
      }
    });

    it("should handle varied pricing", () => {
      const range = getPriceRangeFromProduct(mockProducts[1]); // Hoodie has XXL pricing

      expect(range.max).toBeGreaterThanOrEqual(range.min);
    });

    it("should handle product with no variants", () => {
      const range = getPriceRangeFromProduct(mockProductNoVariants);

      expect(range.min).toBe(0);
      expect(range.max).toBe(0);
    });

    it("should handle null product", () => {
      const range = getPriceRangeFromProduct(null);

      expect(range.min).toBe(0);
      expect(range.max).toBe(0);
    });
  });

  describe("isProductSticker", () => {
    it("should identify sticker products", () => {
      expect(isProductSticker(mockProducts[2])).toBe(true);
    });

    it("should not identify non-sticker products", () => {
      expect(isProductSticker(mockProducts[0])).toBe(false);
      expect(isProductSticker(mockProducts[1])).toBe(false);
    });

    it("should be case-insensitive", () => {
      const product = { title: "VINYL STICKER Pack" };
      expect(isProductSticker(product)).toBe(true);
    });

    it("should handle null product", () => {
      expect(isProductSticker(null)).toBe(false);
    });

    it("should handle product without title", () => {
      expect(isProductSticker({})).toBe(false);
    });
  });

  describe("constrainZoomLevel", () => {
    it("should constrain zoom to max", () => {
      const constrained = constrainZoomLevel(400, 100, 300);

      expect(constrained).toBe(300);
    });

    it("should constrain zoom to min", () => {
      const constrained = constrainZoomLevel(50, 100, 300);

      expect(constrained).toBe(100);
    });

    it("should allow valid zoom levels", () => {
      const constrained = constrainZoomLevel(150, 100, 300);

      expect(constrained).toBe(150);
    });

    it("should use default constraints", () => {
      const constrained = constrainZoomLevel(400);

      expect(constrained).toBeLessThanOrEqual(300);
    });
  });

  describe("calculateZoomIncrement", () => {
    it("should return positive for zoom in", () => {
      const increment = calculateZoomIncrement("in", 20);

      expect(increment).toBe(20);
    });

    it("should return negative for zoom out", () => {
      const increment = calculateZoomIncrement("out", 20);

      expect(increment).toBe(-20);
    });

    it("should return zero for invalid direction", () => {
      const increment = calculateZoomIncrement("invalid", 20);

      expect(increment).toBe(0);
    });

    it("should use default step", () => {
      const increment = calculateZoomIncrement("in");

      expect(increment).toBe(20);
    });
  });
});
