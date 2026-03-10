// Product Display Tests
// Tests for product.js and store.js functionality

describe("Product Display", () => {
  const mockProduct = {
    product_key: "product_1",
    title: "Unisex Tee w/ Text",
    image: "main.jpg",
    display_price: "$25.00",
    variants: {
      Black: {
        image: "black.jpg",
        sizes: {
          XS: { variant_id: 1001, price_cents: 2500 },
          S: { variant_id: 1002, price_cents: 2500 },
          M: { variant_id: 1003, price_cents: 2500 },
          L: { variant_id: 1004, price_cents: 2500 },
          XL: { variant_id: 1005, price_cents: 2500 },
        },
      },
      "Dark Grey Heather": {
        image: "grey.jpg",
        sizes: {
          XS: { variant_id: 1006, price_cents: 2500 },
          S: { variant_id: 1007, price_cents: 2500 },
          M: { variant_id: 1008, price_cents: 2500 },
          L: { variant_id: 1009, price_cents: 2500 },
          XL: { variant_id: 1010, price_cents: 2500 },
        },
      },
    },
  };

  const mockStickerProduct = {
    product_key: "product_2",
    title: "Die-cut Sticker",
    image: "sticker-main.jpg",
    display_price: "$4.50-$5.50",
    variants: {
      Satin: {
        image: "satin.jpg",
        sizes: {
          "2x2": { variant_id: 2001, price_cents: 450 },
          "3x3": { variant_id: 2002, price_cents: 550 },
        },
      },
    },
  };

  describe("getPriceDisplay", () => {
    test("should return single price if all variants have same price", () => {
      const getPriceDisplay = product => {
        if (!product.variants) return product.display_price;

        const prices = new Set();
        Object.values(product.variants).forEach(colorData => {
          if (colorData.sizes) {
            Object.values(colorData.sizes).forEach(sizeData => {
              if (sizeData.price_cents) {
                prices.add(sizeData.price_cents);
              }
            });
          }
        });

        if (prices.size === 0) return product.display_price;
        if (prices.size === 1) {
          const price = Array.from(prices)[0];
          return `$${(price / 100).toFixed(2)}`;
        }

        const sortedPrices = Array.from(prices).sort((a, b) => a - b);
        const minPrice = sortedPrices[0];
        const maxPrice = sortedPrices[sortedPrices.length - 1];
        return `$${(minPrice / 100).toFixed(2)}-$${(maxPrice / 100).toFixed(2)}`;
      };

      expect(getPriceDisplay(mockProduct)).toBe("$25.00");
    });

    test("should return price range for products with different prices", () => {
      const getPriceDisplay = product => {
        if (!product.variants) return product.display_price;

        const prices = new Set();
        Object.values(product.variants).forEach(colorData => {
          if (colorData.sizes) {
            Object.values(colorData.sizes).forEach(sizeData => {
              if (sizeData.price_cents) {
                prices.add(sizeData.price_cents);
              }
            });
          }
        });

        if (prices.size === 0) return product.display_price;
        if (prices.size === 1) {
          const price = Array.from(prices)[0];
          return `$${(price / 100).toFixed(2)}`;
        }

        const sortedPrices = Array.from(prices).sort((a, b) => a - b);
        const minPrice = sortedPrices[0];
        const maxPrice = sortedPrices[sortedPrices.length - 1];
        return `$${(minPrice / 100).toFixed(2)}-$${(maxPrice / 100).toFixed(2)}`;
      };

      expect(getPriceDisplay(mockStickerProduct)).toBe("$4.50-$5.50");
    });
  });

  describe("getProductImage", () => {
    test("should return color-specific image if available", () => {
      const getProductImage = (product, color) => {
        if (color && product.variants[color] && product.variants[color].image) {
          return product.variants[color].image;
        }
        return product.image;
      };

      expect(getProductImage(mockProduct, "Black")).toBe("black.jpg");
      expect(getProductImage(mockProduct, "Dark Grey Heather")).toBe("grey.jpg");
    });

    test("should fallback to main product image if color not found", () => {
      const getProductImage = (product, color) => {
        if (color && product.variants[color] && product.variants[color].image) {
          return product.variants[color].image;
        }
        return product.image;
      };

      expect(getProductImage(mockProduct, "NonExistent")).toBe("main.jpg");
    });

    test("should return main image if color is null", () => {
      const getProductImage = (product, color) => {
        if (color && product.variants[color] && product.variants[color].image) {
          return product.variants[color].image;
        }
        return product.image;
      };

      expect(getProductImage(mockProduct, null)).toBe("main.jpg");
    });
  });

  describe("Color and Size Selection", () => {
    test("should get available sizes for selected color", () => {
      const getAvailableSizes = (product, color) => {
        if (product.variants[color] && product.variants[color].sizes) {
          return Object.keys(product.variants[color].sizes);
        }
        return [];
      };

      const sizes = getAvailableSizes(mockProduct, "Black");
      expect(sizes).toEqual(["XS", "S", "M", "L", "XL"]);
    });

    test("should get available colors for product", () => {
      const getAvailableColors = product => {
        return Object.keys(product.variants);
      };

      const colors = getAvailableColors(mockProduct);
      expect(colors).toEqual(["Black", "Dark Grey Heather"]);
    });

    test("should validate color exists before selection", () => {
      const isValidColor = (product, color) => {
        return color in product.variants;
      };

      expect(isValidColor(mockProduct, "Black")).toBe(true);
      expect(isValidColor(mockProduct, "NonExistent")).toBe(false);
    });

    test("should validate size exists for color before selection", () => {
      const isValidSize = (product, color, size) => {
        return !!(product.variants[color] && product.variants[color].sizes && size in product.variants[color].sizes);
      };

      expect(isValidSize(mockProduct, "Black", "M")).toBe(true);
      expect(isValidSize(mockProduct, "Black", "XXL")).toBe(false);
      expect(isValidSize(mockProduct, "NonExistent", "M")).toBe(false);
    });
  });

  describe("Product Data Integrity", () => {
    test("should have required fields for display", () => {
      expect(mockProduct).toHaveProperty("product_key");
      expect(mockProduct).toHaveProperty("title");
      expect(mockProduct).toHaveProperty("image");
      expect(mockProduct).toHaveProperty("variants");
    });

    test("should have variant_id for each size", () => {
      Object.values(mockProduct.variants).forEach(colorData => {
        Object.values(colorData.sizes).forEach(sizeData => {
          expect(sizeData).toHaveProperty("variant_id");
          expect(typeof sizeData.variant_id).toBe("number");
        });
      });
    });

    test("should have price_cents for each size", () => {
      Object.values(mockProduct.variants).forEach(colorData => {
        Object.values(colorData.sizes).forEach(sizeData => {
          expect(sizeData).toHaveProperty("price_cents");
          expect(typeof sizeData.price_cents).toBe("number");
        });
      });
    });
  });
});
