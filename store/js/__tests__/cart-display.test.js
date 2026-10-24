// Cart Display Tests
// Tests for the real getProductImage exported from store/js/cart-display.js

describe("Cart Display - Product Image Function", () => {
  const { getProductImage } = require("../cart-display");

  describe("getProductImage", () => {
    it("should return color-specific image when available", () => {
      const product = {
        image: "default.jpg",
        variants: {
          Black: {
            image: "black.jpg",
          },
          Red: {
            image: "red.jpg",
          },
        },
      };

      const imageBlack = getProductImage(product, "Black");
      const imageRed = getProductImage(product, "Red");

      expect(imageBlack).toBe("black.jpg");
      expect(imageRed).toBe("red.jpg");
    });

    it("should return fallback image when color not specified", () => {
      const product = {
        image: "default.jpg",
        variants: {
          Black: {
            image: "black.jpg",
          },
        },
      };

      const image = getProductImage(product, null);
      expect(image).toBe("default.jpg");
    });

    it("should return fallback image when color not in variants", () => {
      const product = {
        image: "default.jpg",
        variants: {
          Black: {
            image: "black.jpg",
          },
        },
      };

      const image = getProductImage(product, "NonExistent");
      expect(image).toBe("default.jpg");
    });

    it("should return fallback image when color variant has no image", () => {
      const product = {
        image: "default.jpg",
        variants: {
          Black: {}, // No image property
        },
      };

      const image = getProductImage(product, "Black");
      expect(image).toBe("default.jpg");
    });

    it("should handle empty color string", () => {
      const product = {
        image: "default.jpg",
        variants: {
          Black: {
            image: "black.jpg",
          },
        },
      };

      const image = getProductImage(product, "");
      expect(image).toBe("default.jpg");
    });

    it("should handle product with no variants", () => {
      const product = {
        image: "default.jpg",
        variants: {},
      };

      const image = getProductImage(product, "Black");
      expect(image).toBe("default.jpg");
    });

    it("should handle product with undefined variants", () => {
      const product = {
        image: "default.jpg",
      };

      const image = getProductImage(product, "Black");
      expect(image).toBe("default.jpg");
    });

    it("should return correct image for multiple color options", () => {
      const product = {
        image: "main.jpg",
        variants: {
          "Forest Green": {
            image: "forest-green.jpg",
          },
          "Navy Blue": {
            image: "navy-blue.jpg",
          },
          "Bright Red": {
            image: "bright-red.jpg",
          },
        },
      };

      expect(getProductImage(product, "Forest Green")).toBe("forest-green.jpg");
      expect(getProductImage(product, "Navy Blue")).toBe("navy-blue.jpg");
      expect(getProductImage(product, "Bright Red")).toBe("bright-red.jpg");
      expect(getProductImage(product, "NotAColor")).toBe("main.jpg");
    });

    it("should prioritize color-specific image over default", () => {
      const product = {
        image: "generic.jpg",
        variants: {
          Premium: {
            image: "premium-variant.jpg",
          },
        },
      };

      const imageWithColor = getProductImage(product, "Premium");
      const imageWithoutColor = getProductImage(product, null);

      expect(imageWithColor).toBe("premium-variant.jpg");
      expect(imageWithoutColor).toBe("generic.jpg");
      expect(imageWithColor).not.toBe(imageWithoutColor);
    });

    it("should handle case sensitivity in color names", () => {
      const product = {
        image: "default.jpg",
        variants: {
          Black: {
            image: "black.jpg",
          },
        },
      };

      // Exact match
      expect(getProductImage(product, "Black")).toBe("black.jpg");
      // Case mismatch - won't find it (case sensitive)
      expect(getProductImage(product, "black")).toBe("default.jpg");
      expect(getProductImage(product, "BLACK")).toBe("default.jpg");
    });

    it("should throw for a null product", () => {
      expect(() => getProductImage(null, "Black")).toThrow();
    });
  });
});
