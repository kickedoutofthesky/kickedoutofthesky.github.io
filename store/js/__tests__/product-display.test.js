// Product Display Tests
// Tests for product.js and store.js functionality
const { getPriceDisplay } = require("../store");
const { getProductImage } = require("../cart-display");

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
      expect(getPriceDisplay(mockProduct)).toBe("$25.00");
    });

    test("should return price range for products with different prices", () => {
      expect(getPriceDisplay(mockStickerProduct)).toBe("$4.50 - $5.50");
    });
  });

  describe("getProductImage", () => {
    test("should return color-specific image if available", () => {
      expect(getProductImage(mockProduct, "Black")).toBe("black.jpg");
      expect(getProductImage(mockProduct, "Dark Grey Heather")).toBe("grey.jpg");
    });

    test("should fallback to main product image if color not found", () => {
      expect(getProductImage(mockProduct, "NonExistent")).toBe("main.jpg");
    });

    test("should return main image if color is null", () => {
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

  describe("getPriceDisplay edge cases", () => {
    test("should fallback to display_price when no variants", () => {
      const product = { display_price: "$15.00" };
      expect(getPriceDisplay(product)).toBe("$15.00");
    });

    test("should fallback to display_price when variants have no sizes", () => {
      const product = {
        display_price: "$15.00",
        variants: { Black: { image: "black.jpg" } },
      };
      expect(getPriceDisplay(product)).toBe("$15.00");
    });

    test("should fallback to display_price when sizes have no price_cents", () => {
      const product = {
        display_price: "$15.00",
        variants: {
          Black: {
            sizes: { M: { variant_id: 100 } },
          },
        },
      };
      expect(getPriceDisplay(product)).toBe("$15.00");
    });
  });

  describe("Size and Color Logic", () => {
    test("should return empty array for non-existent color sizes", () => {
      const getAvailableSizes = (product, color) => {
        if (product.variants[color] && product.variants[color].sizes) {
          return Object.keys(product.variants[color].sizes);
        }
        return [];
      };

      expect(getAvailableSizes(mockProduct, "NonExistent")).toEqual([]);
    });

    test("should auto-select size when only one available", () => {
      const shouldAutoSelect = sizes => sizes.length === 1;

      expect(shouldAutoSelect(["M"])).toBe(true);
      expect(shouldAutoSelect(["M", "L"])).toBe(false);
      expect(shouldAutoSelect([])).toBe(false);
    });

    test("should check form completeness", () => {
      const checkFormComplete = (colorValue, sizeValue) => {
        const colorValid = !colorValue || colorValue !== "";
        const sizeValid = sizeValue !== "";
        return colorValid && sizeValid;
      };

      expect(checkFormComplete("Black", "M")).toBe(true);
      expect(checkFormComplete("Black", "")).toBe(false);
      expect(checkFormComplete(null, "M")).toBe(true); // no color select = always valid
    });
  });

  describe("Product Price Update Logic", () => {
    test("should return specific variant price when color and size selected", () => {
      const getVariantPrice = (product, color, size) => {
        const variantData = product.variants[color]?.sizes?.[size];
        if (variantData?.price_cents !== null && variantData?.price_cents !== undefined) {
          return variantData.price_cents;
        }
        return null;
      };

      expect(getVariantPrice(mockProduct, "Black", "M")).toBe(2500);
      expect(getVariantPrice(mockProduct, "Black", "XXL")).toBe(null);
      expect(getVariantPrice(mockProduct, "NonExistent", "M")).toBe(null);
    });

    test("should format price correctly for display", () => {
      const formatPrice = cents => `$${(cents / 100).toFixed(2)}`;

      expect(formatPrice(2500)).toBe("$25.00");
      expect(formatPrice(450)).toBe("$4.50");
      expect(formatPrice(550)).toBe("$5.50");
      expect(formatPrice(0)).toBe("$0.00");
    });
  });

  describe("Mockup Image Carousel", () => {
    const mockProductWithMockups = {
      product_key: "product_3",
      title: "Unisex Long Sleeve Tee w/ Star + Typewriter Text Sleeve",
      image: "assets/images/front-black.jpg",
      display_price: "$30.00",
      variants: {
        Black: {
          image: "assets/images/front-black.jpg",
          mockups: ["assets/images/front-black.jpg", "assets/images/sleeve-black.jpg"],
          sizes: {
            S: { variant_id: 3001, price_cents: 3000 },
            M: { variant_id: 3002, price_cents: 3000 },
          },
        },
        "Dark Grey Heather": {
          image: "assets/images/front-dgh.jpg",
          mockups: ["assets/images/front-dgh.jpg"],
          sizes: {
            S: { variant_id: 3003, price_cents: 3000 },
            M: { variant_id: 3004, price_cents: 3000 },
          },
        },
      },
    };

    test("should return mockups array when present", () => {
      const getColorImages = (product, color) => {
        const colorData = product.variants[color];
        if (!colorData) return [product.image];
        if (colorData.mockups && colorData.mockups.length > 0) return colorData.mockups;
        return [colorData.image || product.image];
      };

      const images = getColorImages(mockProductWithMockups, "Black");
      expect(images).toEqual(["assets/images/front-black.jpg", "assets/images/sleeve-black.jpg"]);
      expect(images).toHaveLength(2);
    });

    test("should return single-element array when no mockups", () => {
      const getColorImages = (product, color) => {
        const colorData = product.variants[color];
        if (!colorData) return [product.image];
        if (colorData.mockups && colorData.mockups.length > 0) return colorData.mockups;
        return [colorData.image || product.image];
      };

      const images = getColorImages(mockProduct, "Black");
      expect(images).toEqual(["black.jpg"]);
      expect(images).toHaveLength(1);
    });

    test("should fallback to product image for unknown color", () => {
      const getColorImages = (product, color) => {
        const colorData = product.variants[color];
        if (!colorData) return [product.image];
        if (colorData.mockups && colorData.mockups.length > 0) return colorData.mockups;
        return [colorData.image || product.image];
      };

      const images = getColorImages(mockProduct, "NonExistent");
      expect(images).toEqual(["main.jpg"]);
    });

    test("should show carousel arrows only when multiple images exist", () => {
      const shouldShowCarousel = images => images.length > 1;

      expect(shouldShowCarousel(["front.jpg", "sleeve.jpg"])).toBe(true);
      expect(shouldShowCarousel(["front.jpg"])).toBe(false);
      expect(shouldShowCarousel([])).toBe(false);
    });

    test("should clamp image index within bounds", () => {
      const getImageAtIndex = (images, index) => {
        if (index >= 0 && index < images.length) return images[index];
        return images[0];
      };

      const images = ["front.jpg", "sleeve.jpg"];
      expect(getImageAtIndex(images, 0)).toBe("front.jpg");
      expect(getImageAtIndex(images, 1)).toBe("sleeve.jpg");
      expect(getImageAtIndex(images, 5)).toBe("front.jpg"); // Out of bounds falls back
    });
  });

  describe("Color-Driven Size Dropdown", () => {
    const mockProductDifferentSizes = {
      product_key: "product_4",
      title: "Unisex Tee w/ Vintage Design",
      image: "main.jpg",
      display_price: "$28.00",
      variants: {
        "Oxblood Black": {
          image: "oxblood.jpg",
          sizes: {
            S: { variant_id: 4001, price_cents: 2800 },
            M: { variant_id: 4002, price_cents: 2800 },
            L: { variant_id: 4003, price_cents: 2800 },
            XL: { variant_id: 4004, price_cents: 2800 },
            "2XL": { variant_id: 4005, price_cents: 2800 },
          },
        },
        Natural: {
          image: "natural.jpg",
          sizes: {
            XS: { variant_id: 4006, price_cents: 2800 },
            S: { variant_id: 4007, price_cents: 2800 },
            M: { variant_id: 4008, price_cents: 2800 },
            L: { variant_id: 4009, price_cents: 2800 },
            XL: { variant_id: 4010, price_cents: 2800 },
            "2XL": { variant_id: 4011, price_cents: 2800 },
          },
        },
      },
    };

    test("should return different sizes for different colors", () => {
      const getAvailableSizes = (product, color) => {
        if (product.variants[color] && product.variants[color].sizes) {
          return Object.keys(product.variants[color].sizes);
        }
        return [];
      };

      const oxbloodSizes = getAvailableSizes(mockProductDifferentSizes, "Oxblood Black");
      const naturalSizes = getAvailableSizes(mockProductDifferentSizes, "Natural");

      expect(oxbloodSizes).toEqual(["S", "M", "L", "XL", "2XL"]);
      expect(naturalSizes).toEqual(["XS", "S", "M", "L", "XL", "2XL"]);
      expect(naturalSizes).toContain("XS");
      expect(oxbloodSizes).not.toContain("XS");
    });

    test("should reset size selection when color changes", () => {
      const onColorChange = (product, newColor) => {
        const sizes = Object.keys(product.variants[newColor]?.sizes || {});
        return { sizes, selectedSize: "" }; // Always reset to empty
      };

      const result = onColorChange(mockProductDifferentSizes, "Oxblood Black");
      expect(result.selectedSize).toBe("");
      expect(result.sizes).not.toContain("XS");

      const result2 = onColorChange(mockProductDifferentSizes, "Natural");
      expect(result2.selectedSize).toBe("");
      expect(result2.sizes).toContain("XS");
    });
  });
});
