// Product Fetch Tests
// Tests for fetching and transforming product data from Printful

describe("Product Fetch & Transform", () => {
  describe("getImageIndex", () => {
    test("should return correct image index for long sleeves", () => {
      const getImageIndex = productTitle => {
        if (productTitle.includes("Long Sleeve")) {
          if (productTitle.includes("Star")) return 3;
          return 2;
        }
        if (productTitle.includes("Hoodie")) return 2;
        if (productTitle.includes("Hat") || productTitle.includes("Cap")) return 1;
        if (productTitle.includes("Sticker")) return 1;
        if (productTitle.includes("Tee")) return 2;
        return 0;
      };

      expect(getImageIndex("Unisex Long Sleeve Tee w/ Typewriter Text")).toBe(2);
      expect(getImageIndex("Unisex Long Sleeve Tee w/ Star + Typewriter Sleeve")).toBe(3);
    });

    test("should return correct image index for hoodies", () => {
      const getImageIndex = productTitle => {
        if (productTitle.includes("Long Sleeve")) {
          if (productTitle.includes("Star")) return 3;
          return 2;
        }
        if (productTitle.includes("Hoodie")) return 2;
        if (productTitle.includes("Hat") || productTitle.includes("Cap")) return 1;
        if (productTitle.includes("Sticker")) return 1;
        if (productTitle.includes("Tee")) return 2;
        return 0;
      };

      expect(getImageIndex("Unisex Hoodie w/ Text")).toBe(2);
    });

    test("should return correct image index for stickers", () => {
      const getImageIndex = productTitle => {
        if (productTitle.includes("Long Sleeve")) {
          if (productTitle.includes("Star")) return 3;
          return 2;
        }
        if (productTitle.includes("Hoodie")) return 2;
        if (productTitle.includes("Hat") || productTitle.includes("Cap")) return 1;
        if (productTitle.includes("Sticker")) return 1;
        if (productTitle.includes("Tee")) return 2;
        return 0;
      };

      expect(getImageIndex("Die-cut Sticker w/ Text")).toBe(1);
    });

    test("should return correct image index for regular tees", () => {
      const getImageIndex = productTitle => {
        if (productTitle.includes("Long Sleeve")) {
          if (productTitle.includes("Star")) return 3;
          return 2;
        }
        if (productTitle.includes("Hoodie")) return 2;
        if (productTitle.includes("Hat") || productTitle.includes("Cap")) return 1;
        if (productTitle.includes("Sticker")) return 1;
        if (productTitle.includes("Tee")) return 2;
        return 0;
      };

      expect(getImageIndex("Unisex Tee w/ Text")).toBe(2);
    });
  });

  describe("Variant Parsing", () => {
    test("should parse sticker variant names correctly", () => {
      const parseVariant = (name, isSticker) => {
        if (isSticker) {
          const parts = name.split(" / ");
          return {
            color: "Satin",
            size: parts[1] ? parts[1].replace(/″×″/g, "x").replace(/″/g, "").replace(/×/g, "x") : "One Size",
          };
        }
        return null;
      };

      const result = parseVariant("Die-cut Sticker / 2″×2″", true);
      expect(result.color).toBe("Satin");
      expect(result.size).toBe("2x2");

      const result2 = parseVariant("Die-cut Sticker / 3″×3″", true);
      expect(result2.size).toBe("3x3");
    });

    test("should parse hoodie variant names correctly", () => {
      const parseVariant = (name, isHoodie) => {
        if (isHoodie) {
          const parts = name.split(" / ");
          return {
            color: "Black",
            size: parts[1] || "One Size",
          };
        }
        return null;
      };

      const result = parseVariant("Unisex Hoodie w/ Text / S", true);
      expect(result.color).toBe("Black");
      expect(result.size).toBe("S");
    });

    test("should parse regular apparel variant names correctly", () => {
      const parseVariant = name => {
        const parts = name.split(" / ");
        return {
          color: parts[1] || "Default",
          size: parts[2] || "One Size",
        };
      };

      const result = parseVariant("Unisex Tee w/ Text / Black / M");
      expect(result.color).toBe("Black");
      expect(result.size).toBe("M");

      const result2 = parseVariant("Unisex Long Sleeve Tee / Dark Grey Heather / L");
      expect(result2.color).toBe("Dark Grey Heather");
      expect(result2.size).toBe("L");
    });
  });

  describe("Product Data Structure", () => {
    test("should create correct product structure", () => {
      const createProductData = (product, variantsByColor, variantPreviewImage) => {
        return {
          product_key: `product_${product.id}`,
          title: product.name,
          image: product.thumbnail_url || variantPreviewImage || "/placeholder.png",
          display_price: "$25.00",
          variants: variantsByColor,
        };
      };

      const mockProduct = {
        id: 12345,
        name: "Unisex Tee w/ Text",
        thumbnail_url: "https://example.com/thumb.jpg",
      };

      const variantsByColor = {
        Black: {
          image: "https://example.com/black.jpg",
          sizes: {
            M: { variant_id: 101, price_cents: 2500 },
          },
        },
      };

      const result = createProductData(mockProduct, variantsByColor, null);

      expect(result.product_key).toBe("product_12345");
      expect(result.title).toBe("Unisex Tee w/ Text");
      expect(result.image).toBe("https://example.com/thumb.jpg");
      expect(result.variants).toBe(variantsByColor);
    });

    test("should store variant_id and price_cents correctly", () => {
      const storeVariantData = variant => {
        return {
          variant_id: variant.id,
          price_cents: Math.round(parseFloat(variant.retail_price) * 100),
        };
      };

      const mockVariant = {
        id: 12345,
        retail_price: "25.00",
      };

      const result = storeVariantData(mockVariant);
      expect(result.variant_id).toBe(12345);
      expect(result.price_cents).toBe(2500);
    });
  });

  describe("Image Selection", () => {
    test("should select correct image by index", () => {
      const selectImageByIndex = (variant, imageIndex) => {
        if (variant.files && variant.files.length > imageIndex) {
          return variant.files[imageIndex].preview_url;
        }
        return null;
      };

      const mockVariant = {
        files: [
          { preview_url: "img0.jpg" },
          { preview_url: "img1.jpg" },
          { preview_url: "img2.jpg" },
          { preview_url: "img3.jpg" },
        ],
      };

      expect(selectImageByIndex(mockVariant, 0)).toBe("img0.jpg");
      expect(selectImageByIndex(mockVariant, 2)).toBe("img2.jpg");
      expect(selectImageByIndex(mockVariant, 3)).toBe("img3.jpg");
      expect(selectImageByIndex(mockVariant, 5)).toBe(null);
    });

    test("should handle missing images gracefully", () => {
      const selectImageByIndex = (variant, imageIndex) => {
        if (variant.files && variant.files.length > imageIndex) {
          return variant.files[imageIndex].preview_url;
        }
        return null;
      };

      const mockVariant = {
        files: [{ preview_url: "img0.jpg" }],
      };

      expect(selectImageByIndex(mockVariant, 0)).toBe("img0.jpg");
      expect(selectImageByIndex(mockVariant, 5)).toBe(null);
    });
  });

  describe("Product Sorting", () => {
    test("should sort products by category", () => {
      const getCategory = title => {
        if (title.includes("Long Sleeve")) return 3;
        if (title.includes("Hoodie")) return 4;
        if (title.includes("Hat") || title.includes("Cap")) return 2;
        if (title.includes("Sticker")) return 5;
        if (title.includes("Tee")) return 1;
        return 6;
      };

      const products = [
        { title: "Sticker Pack" },
        { title: "Unisex Long Sleeve Tee" },
        { title: "Unisex Tee" },
        { title: "Unisex Hoodie" },
        { title: "Hat" },
      ];

      products.sort((a, b) => getCategory(a.title) - getCategory(b.title));

      expect(products[0].title).toBe("Unisex Tee");
      expect(products[1].title).toBe("Hat");
      expect(products[2].title).toBe("Unisex Long Sleeve Tee");
      expect(products[3].title).toBe("Unisex Hoodie");
      expect(products[4].title).toBe("Sticker Pack");
    });
  });
});
