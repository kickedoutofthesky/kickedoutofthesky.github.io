// Product Fetch Tests
// Tests for fetching and transforming product data from Printful
const { getImageIndex } = require("../../../scripts/fetch-printful-products");

describe("Product Fetch & Transform", () => {
  describe("getImageIndex", () => {
    test("should return correct image index for long sleeves", () => {
      expect(getImageIndex("Unisex Long Sleeve Tee w/ Typewriter Text")).toBe(2);
      expect(getImageIndex("Unisex Long Sleeve Tee w/ Star + Typewriter Sleeve")).toBe(3);
    });

    test("should return correct image index for hoodies", () => {
      expect(getImageIndex("Unisex Hoodie w/ Text")).toBe(2);
    });

    test("should return correct image index for stickers", () => {
      expect(getImageIndex("Die-cut Sticker w/ Text")).toBe(1);
    });

    test("should return correct image index for regular tees", () => {
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

    test("should parse single-color product variants (2-part names)", () => {
      const KNOWN_SIZES = /^(XS|S|M|L|XL|2XL|3XL|4XL|5XL|One Size)$/;

      const parseVariant = name => {
        const parts = name.split(" / ");
        if (parts.length === 2 && KNOWN_SIZES.test(parts[1])) {
          return { color: "Black", size: parts[1] };
        }
        return { color: parts[1] || "Default", size: parts[2] || "One Size" };
      };

      const result = parseVariant("Unisex Tee w/ Wasting My Life Away Cover / XS");
      expect(result.color).toBe("Black");
      expect(result.size).toBe("XS");

      const result2 = parseVariant("Unisex Tee w/ Color Block Graphic / 2XL");
      expect(result2.color).toBe("Black");
      expect(result2.size).toBe("2XL");

      // 3-part names should still parse normally
      const result3 = parseVariant("Unisex Tee w/ Text / Dark Grey Heather / M");
      expect(result3.color).toBe("Dark Grey Heather");
      expect(result3.size).toBe("M");
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

  describe("Local Mockup Map", () => {
    test("should parse mockup filenames into product+color keys", () => {
      const parseMockupFilename = filename => {
        const match = filename.match(/^(.+?) - (Front|Sleeve) - (.+)\.jpg$/i);
        if (!match) return null;
        return { productName: match[1], placement: match[2].toLowerCase(), color: match[3] };
      };

      const result = parseMockupFilename("Unisex Tee w Star Logo - Front - Black.jpg");
      expect(result.productName).toBe("Unisex Tee w Star Logo");
      expect(result.placement).toBe("front");
      expect(result.color).toBe("Black");

      const result2 = parseMockupFilename(
        "Unisex Long Sleeve Tee w Star + Typewriter Text Sleeve - Sleeve - Dark Grey Heather.jpg"
      );
      expect(result2.productName).toBe("Unisex Long Sleeve Tee w Star + Typewriter Text Sleeve");
      expect(result2.placement).toBe("sleeve");
      expect(result2.color).toBe("Dark Grey Heather");
    });

    test("should return null for non-matching filenames", () => {
      const parseMockupFilename = filename => {
        const match = filename.match(/^(.+?) - (Front|Sleeve) - (.+)\.jpg$/i);
        if (!match) return null;
        return { productName: match[1], placement: match[2].toLowerCase(), color: match[3] };
      };

      expect(parseMockupFilename("random-file.png")).toBeNull();
      expect(parseMockupFilename("no-placement.jpg")).toBeNull();
    });

    test("should build mockup map with front images first", () => {
      const buildMockupMap = files => {
        const mockupMap = {};
        for (const file of files) {
          const match = file.match(/^(.+?) - (Front|Sleeve) - (.+)\.jpg$/i);
          if (!match) continue;
          const [, productName, placement, color] = match;
          const key = `${productName}|${color}`;
          if (!mockupMap[key]) mockupMap[key] = [];
          const entry = { placement: placement.toLowerCase(), path: `assets/images/${file}` };
          if (placement.toLowerCase() === "front") {
            mockupMap[key].unshift(entry);
          } else {
            mockupMap[key].push(entry);
          }
        }
        return mockupMap;
      };

      const files = [
        "Unisex Long Sleeve Tee w Star + Typewriter Text Sleeve - Sleeve - Black.jpg",
        "Unisex Tee w Star Logo - Front - Black.jpg",
        "Unisex Long Sleeve Tee w Star + Typewriter Text Sleeve - Front - Black.jpg",
      ];

      const map = buildMockupMap(files);

      // Front should always be first in the array
      const sleeveKey = "Unisex Long Sleeve Tee w Star + Typewriter Text Sleeve|Black";
      expect(map[sleeveKey]).toHaveLength(2);
      expect(map[sleeveKey][0].placement).toBe("front");
      expect(map[sleeveKey][1].placement).toBe("sleeve");

      const teeKey = "Unisex Tee w Star Logo|Black";
      expect(map[teeKey]).toHaveLength(1);
      expect(map[teeKey][0].placement).toBe("front");
    });

    test("should strip forward slashes from product title for matching", () => {
      const toMockupTitle = title => title.replace(/\//g, "");

      expect(toMockupTitle("Unisex Tee w/ Star Logo")).toBe("Unisex Tee w Star Logo");
      expect(toMockupTitle("Unisex Long Sleeve Tee w/ Star + Typewriter Text Sleeve")).toBe(
        "Unisex Long Sleeve Tee w Star + Typewriter Text Sleeve"
      );
    });
  });
});
