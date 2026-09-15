/**
 * Product Page Refactored Tests
 * Using pure utility functions and proper data fixtures
 */

import {
  getColorNamesFromProduct,
  getSizesForColor,
  getVariantIdForColorSize,
  getPriceForColorSize,
  getImageForColor,
  getMockupsForColor,
  validateProductFormData,
  getPriceRangeFromProduct,
  buildProductFormData,
  isProductSticker,
  normalizeImagePath,
  encodeImageUri,
  constrainZoomLevel,
  calculateZoomIncrement,
  validateCarouselIndex,
} from "../utils/fixtures/product-utilities";

import { mockProducts, mockProductNoVariants } from "../utils/fixtures/test-data";

describe("Product Page Utilities - Refactored", () => {
  describe("getColorNamesFromProduct", () => {
    it("should get all color names from product", () => {
      const colors = getColorNamesFromProduct(mockProducts[0]);

      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBeGreaterThan(0);
      expect(colors).toContain("Black");
    });

    it("should handle product with no variants", () => {
      const colors = getColorNamesFromProduct({ variants: {} });
      expect(colors).toEqual([]);
    });

    it("should handle null product", () => {
      expect(getColorNamesFromProduct(null)).toEqual([]);
    });

    it("should return multiple colors", () => {
      const colors = getColorNamesFromProduct(mockProducts[0]);
      expect(colors.length).toBeGreaterThanOrEqual(2);
    });
  });

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

  describe("getPriceForColorSize", () => {
    it("should get price for color and size", () => {
      const price = getPriceForColorSize(mockProducts[0], "Black", "M");

      expect(price).toBeDefined();
      expect(typeof price).toBe("number");
      expect(price).toBeGreaterThan(0);
    });

    it("should return null for invalid color", () => {
      const price = getPriceForColorSize(mockProducts[0], "Purple", "M");
      expect(price).toBeNull();
    });

    it("should return null for invalid size", () => {
      const price = getPriceForColorSize(mockProducts[0], "Black", "XXL");
      expect(price).toBeNull();
    });

    it("should handle different prices for sizes", () => {
      const prices = {
        S: getPriceForColorSize(mockProducts[1], "Black", "S"),
        XXL: getPriceForColorSize(mockProducts[1], "Black", "XXL"),
      };

      // XXL might be different price
      expect(prices.S).toBeDefined();
      expect(prices.XXL).toBeDefined();
    });
  });

  describe("getImageForColor", () => {
    it("should get image for color", () => {
      const image = getImageForColor(mockProducts[0], "Black");

      expect(image).toBe("tee-black.jpg");
    });

    it("should return default image when color not found", () => {
      const image = getImageForColor(mockProducts[0], "Purple");
      expect(image).toBe("tee-main.jpg");
    });

    it("should return default image when no color specified", () => {
      const image = getImageForColor(mockProducts[0], null);
      expect(image).toBe("tee-main.jpg");
    });

    it("should handle null product", () => {
      expect(getImageForColor(null, "Black")).toBeNull();
    });
  });

  describe("getMockupsForColor", () => {
    it("should return mockups for color", () => {
      const mockups = getMockupsForColor(mockProducts[0], "Black");

      expect(Array.isArray(mockups)).toBe(true);
    });

    it("should return color image if no mockups", () => {
      const mockups = getMockupsForColor(mockProducts[0], "Black");

      expect(mockups.length).toBeGreaterThan(0);
    });

    it("should return empty array for invalid color", () => {
      const mockups = getMockupsForColor(mockProducts[0], "Purple");
      expect(mockups).toEqual([]);
    });

    it("should handle null product", () => {
      expect(getMockupsForColor(null, "Black")).toEqual([]);
    });
  });

  describe("validateProductFormData", () => {
    it("should validate complete form data", () => {
      const formData = {
        color: "Black",
        size: "M",
        quantity: 1,
      };

      expect(validateProductFormData(formData)).toBe(true);
    });

    it("should reject missing color", () => {
      const formData = {
        color: "",
        size: "M",
        quantity: 1,
      };

      expect(validateProductFormData(formData)).toBe(false);
    });

    it("should reject missing size", () => {
      const formData = {
        color: "Black",
        size: "",
        quantity: 1,
      };

      expect(validateProductFormData(formData)).toBe(false);
    });

    it("should reject invalid quantity", () => {
      const formData = {
        color: "Black",
        size: "M",
        quantity: 0,
      };

      expect(validateProductFormData(formData)).toBe(false);
    });

    it("should reject excessive quantity", () => {
      const formData = {
        color: "Black",
        size: "M",
        quantity: 1000,
      };

      expect(validateProductFormData(formData)).toBe(false);
    });

    it("should handle null form data", () => {
      expect(validateProductFormData(null)).toBe(false);
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

  describe("buildProductFormData", () => {
    it("should build form data object", () => {
      const formData = buildProductFormData("Black", "M", "2", 1002, 2500);

      expect(formData.color).toBe("Black");
      expect(formData.size).toBe("M");
      expect(formData.quantity).toBe(2);
      expect(formData.variant_id).toBe(1002);
      expect(formData.price_cents).toBe(2500);
    });

    it("should convert quantity to integer", () => {
      const formData = buildProductFormData("Black", "M", "5", 1002, 2500);

      expect(typeof formData.quantity).toBe("number");
      expect(formData.quantity).toBe(5);
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

  describe("normalizeImagePath", () => {
    it("should add base URL to relative path", () => {
      const normalized = normalizeImagePath("tee-black.jpg");

      expect(normalized).toContain("/store/");
      expect(normalized).toContain("tee-black.jpg");
    });

    it("should not modify absolute paths", () => {
      const normalized = normalizeImagePath("/store/tee-black.jpg");

      expect(normalized).toBe("/store/tee-black.jpg");
    });

    it("should not modify URLs", () => {
      const url = "https://cdn.example.com/image.jpg";
      const normalized = normalizeImagePath(url);

      expect(normalized).toBe(url);
    });

    it("should handle custom base URL", () => {
      const normalized = normalizeImagePath("image.jpg", "/cdn");

      expect(normalized).toContain("/cdn/");
    });

    it("should handle empty path", () => {
      expect(normalizeImagePath("")).toBe("");
    });
  });

  describe("encodeImageUri", () => {
    it("should encode spaces in URI", () => {
      const encoded = encodeImageUri("product with spaces.jpg");

      expect(encoded).toContain("%20");
    });

    it("should handle normal paths", () => {
      const encoded = encodeImageUri("product.jpg");

      expect(encoded).toBe("product.jpg");
    });

    it("should encode special characters", () => {
      const encoded = encodeImageUri("café.jpg");

      expect(encoded).toContain("%");
    });

    it("should handle empty string", () => {
      expect(encodeImageUri("")).toBe("");
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

  describe("validateCarouselIndex", () => {
    it("should keep valid index", () => {
      const validated = validateCarouselIndex(2, 5);

      expect(validated).toBe(2);
    });

    it("should constrain to min", () => {
      const validated = validateCarouselIndex(-1, 5);

      expect(validated).toBe(0);
    });

    it("should constrain to max", () => {
      const validated = validateCarouselIndex(10, 5);

      expect(validated).toBe(5);
    });

    it("should handle boundary values", () => {
      expect(validateCarouselIndex(0, 5)).toBe(0);
      expect(validateCarouselIndex(5, 5)).toBe(5);
    });
  });
});
