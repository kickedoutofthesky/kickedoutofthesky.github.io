/**
 * Cart Display - Exported Functions Tests
 * Tests exported utility functions: getProductImage
 */

import { getProductImage } from "../cart-display";

describe("Cart Display - Exported Functions", () => {
  describe("getProductImage", () => {
    it("should return product image URL from variant", () => {
      const product = {
        image: "/store/assets/images/shirt-default.jpg",
        variants: {
          Black: {
            image: "/store/assets/images/shirt-black.jpg",
          },
        },
      };

      const result = getProductImage(product, "Black");
      expect(result).toBe("/store/assets/images/shirt-black.jpg");
    });

    it("should return fallback product image when color not found", () => {
      const product = {
        image: "/store/assets/images/shirt-default.jpg",
        variants: {
          Black: {
            image: "/store/assets/images/shirt-black.jpg",
          },
        },
      };

      const result = getProductImage(product, "Red");
      expect(result).toBe("/store/assets/images/shirt-default.jpg");
    });

    it("should handle product without variants", () => {
      const product = {
        image: "/store/assets/images/shirt-default.jpg",
      };

      const result = getProductImage(product, "Black");
      expect(result).toBe("/store/assets/images/shirt-default.jpg");
    });

    it("should throw error for null product", () => {
      expect(() => {
        getProductImage(null, "Black");
      }).toThrow();
    });

    it("should handle null color", () => {
      const product = {
        image: "/store/assets/images/shirt-default.jpg",
        variants: {
          Black: {
            image: "/store/assets/images/shirt-black.jpg",
          },
        },
      };

      const result = getProductImage(product, null);
      expect(result).toBe("/store/assets/images/shirt-default.jpg");
    });

    it("should return image from multiple color variants", () => {
      const product = {
        image: "/store/assets/images/default.jpg",
        variants: {
          Black: { image: "/black.jpg" },
          White: { image: "/white.jpg" },
          Red: { image: "/red.jpg" },
        },
      };

      expect(getProductImage(product, "Black")).toBe("/black.jpg");
      expect(getProductImage(product, "White")).toBe("/white.jpg");
      expect(getProductImage(product, "Red")).toBe("/red.jpg");
    });

    it("should prioritize variant image over product image", () => {
      const product = {
        image: "/default.jpg",
        variants: {
          Black: {
            image: "/black.jpg",
          },
        },
      };

      const result = getProductImage(product, "Black");
      expect(result).toBe("/black.jpg");
      expect(result).not.toBe("/default.jpg");
    });
  });
});
