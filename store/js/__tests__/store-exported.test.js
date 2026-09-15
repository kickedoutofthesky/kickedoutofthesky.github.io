/**
 * Store - Exported Functions Tests
 * Tests exported functions: getPriceDisplay, getProductCategory
 */

import { getPriceDisplay, getProductCategory } from "../store";

describe("Store - Exported Functions", () => {
  describe("getProductCategory", () => {
    it("should categorize stickers", () => {
      expect(getProductCategory("Sticker Pack")).toBe("stickers");
      expect(getProductCategory("STICKER Design")).toBe("stickers");
      expect(getProductCategory("vinyl sticker")).toBe("stickers");
    });

    it("should categorize hoodies", () => {
      expect(getProductCategory("Hoodie")).toBe("hoodies");
      expect(getProductCategory("HOODIE Unisex")).toBe("hoodies");
      expect(getProductCategory("premium hoodie")).toBe("hoodies");
    });

    it("should categorize sweatshirts", () => {
      expect(getProductCategory("Sweatshirt")).toBe("sweatshirts");
      expect(getProductCategory("SWEATSHIRT Crew")).toBe("sweatshirts");
      expect(getProductCategory("Crewneck Sweatshirt")).toBe("sweatshirts");
    });

    it("should categorize long sleeve shirts", () => {
      expect(getProductCategory("Long Sleeve Tee")).toBe("long-sleeve");
      expect(getProductCategory("LONG SLEEVE Shirt")).toBe("long-sleeve");
      expect(getProductCategory("long sleeve")).toBe("long-sleeve");
    });

    it("should categorize hats", () => {
      expect(getProductCategory("Snapback Cap")).toBe("hats");
      expect(getProductCategory("TRUCKER Hat")).toBe("hats");
      expect(getProductCategory("baseball cap")).toBe("hats");
      expect(getProductCategory("Hat Trucker")).toBe("hats");
    });

    it("should categorize tees", () => {
      expect(getProductCategory("Tee Unisex")).toBe("tees");
      expect(getProductCategory("T-Tee")).toBe("tees");
      expect(getProductCategory("tee shirt")).toBe("tees");
    });

    it("should default to other for unknown categories", () => {
      expect(getProductCategory("Mystery Item")).toBe("other");
      expect(getProductCategory("Unknown Product")).toBe("other");
      expect(getProductCategory("")).toBe("other");
    });

    it("should be case insensitive", () => {
      expect(getProductCategory("STICKER")).toBe("stickers");
      expect(getProductCategory("StIcKeR")).toBe("stickers");
      expect(getProductCategory("sticker")).toBe("stickers");
    });

    it("should handle multiple matching keywords (priority order)", () => {
      // Sticker takes priority if both sticker and other keywords present
      expect(getProductCategory("Sticker Long Sleeve")).toBe("stickers");

      // Hoodie prioritized over sweatshirt
      expect(getProductCategory("Hoodie Sweatshirt")).toBe("hoodies");

      // Long Sleeve takes priority over snapback in the order
      expect(getProductCategory("Snapback Long Sleeve")).toBe("long-sleeve");
    });

    it("should handle special characters in title", () => {
      expect(getProductCategory("Sticker-Pack")).toBe("stickers");
      expect(getProductCategory("Hoodie (Premium)")).toBe("hoodies");
      expect(getProductCategory("T-Shirt/Tee")).toBe("tees");
    });

    it("should handle numeric characters in title", () => {
      expect(getProductCategory("Sticker 3-Pack")).toBe("stickers");
      expect(getProductCategory("Hoodie 2XL")).toBe("hoodies");
      expect(getProductCategory("Hat Size S-M")).toBe("hats");
    });

    it("should handle very long titles", () => {
      const longTitle = "A Very Long Title That Contains Sticker " + "word ".repeat(100);
      expect(getProductCategory(longTitle)).toBe("stickers");
    });

    it("should handle whitespace variations", () => {
      expect(getProductCategory("  Sticker  ")).toBe("stickers");
      expect(getProductCategory("Sticker\nPack")).toBe("stickers");
      expect(getProductCategory("Sticker\tPack")).toBe("stickers");
    });

    it("should categorize all common variations", () => {
      const variations = {
        Snapback: "hats",
        "Trucker Cap": "hats",
        "Baseball Cap": "hats",
        "Dad Hat": "hats",
        Crewneck: "sweatshirts",
        "Crewneck Sweatshirt": "sweatshirts",
      };

      Object.entries(variations).forEach(([title, category]) => {
        expect(getProductCategory(title)).toBe(category);
      });
    });
  });

  describe("getPriceDisplay", () => {
    it("should display single price when all variants have same price", () => {
      const product = {
        display_price: "$39.99",
        variants: {
          Black: {
            sizes: {
              S: { price_cents: 3999 },
              M: { price_cents: 3999 },
              L: { price_cents: 3999 },
            },
          },
        },
      };

      const result = getPriceDisplay(product);
      expect(result).toBe("$39.99");
    });

    it("should display price range when variants have different prices", () => {
      const product = {
        variants: {
          Black: {
            sizes: {
              S: { price_cents: 2999 },
              L: { price_cents: 4999 },
            },
          },
        },
      };

      const result = getPriceDisplay(product);
      expect(result).toBe("$29.99 - $49.99");
    });

    it("should handle multiple colors with different prices", () => {
      const product = {
        variants: {
          Black: {
            sizes: {
              M: { price_cents: 3999 },
            },
          },
          White: {
            sizes: {
              M: { price_cents: 2999 },
              L: { price_cents: 4999 },
            },
          },
        },
      };

      const result = getPriceDisplay(product);
      expect(result).toBe("$29.99 - $49.99");
    });

    it("should fallback to display_price when no variant prices", () => {
      const product = {
        display_price: "$35.00",
        variants: {
          Black: {
            sizes: {},
          },
        },
      };

      const result = getPriceDisplay(product);
      expect(result).toBe("$35.00");
    });

    it("should handle product with no variants", () => {
      const product = {
        display_price: "$25.00",
      };

      const result = getPriceDisplay(product);
      expect(result).toBe("$25.00");
    });

    it("should handle null product gracefully", () => {
      const product = null;
      try {
        const result = getPriceDisplay(product);
        // Should either return a default or throw
        expect(result).toBeDefined();
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it("should format prices with two decimal places", () => {
      const product = {
        variants: {
          Black: {
            sizes: {
              M: { price_cents: 1000 },
              L: { price_cents: 2000 },
            },
          },
        },
      };

      const result = getPriceDisplay(product);
      expect(result).toMatch(/\$\d+\.\d{2} - \$\d+\.\d{2}/);
    });

    it("should sort prices correctly", () => {
      const product = {
        variants: {
          Black: {
            sizes: {
              S: { price_cents: 4999 },
              L: { price_cents: 2999 },
              XL: { price_cents: 5999 },
            },
          },
        },
      };

      const result = getPriceDisplay(product);
      expect(result).toBe("$29.99 - $59.99");
    });

    it("should handle high prices correctly", () => {
      const product = {
        variants: {
          Premium: {
            sizes: {
              "One Size": { price_cents: 19999 },
            },
          },
        },
      };

      const result = getPriceDisplay(product);
      expect(result).toContain("199.99");
    });

    it("should handle low prices correctly", () => {
      const product = {
        variants: {
          Sticker: {
            sizes: {
              "One Size": { price_cents: 199 },
            },
          },
        },
      };

      const result = getPriceDisplay(product);
      expect(result).toContain("1.99");
    });

    it("should handle zero prices", () => {
      const product = {
        variants: {
          Free: {
            sizes: {
              "One Size": { price_cents: 0 },
            },
          },
        },
      };

      const result = getPriceDisplay(product);
      expect(result).toBe("$0.00");
    });

    it("should handle missing price_cents", () => {
      const product = {
        display_price: "$50.00",
        variants: {
          Black: {
            sizes: {
              M: {
                /* no price_cents */
              },
            },
          },
        },
      };

      const result = getPriceDisplay(product);
      expect(result).toBe("$50.00");
    });

    it("should handle null price_cents", () => {
      const product = {
        display_price: "$40.00",
        variants: {
          Black: {
            sizes: {
              M: { price_cents: null },
            },
          },
        },
      };

      const result = getPriceDisplay(product);
      expect(result).toBe("$40.00");
    });

    it("should handle undefined price_cents", () => {
      const product = {
        display_price: "$45.00",
        variants: {
          Black: {
            sizes: {
              M: { price_cents: undefined },
            },
          },
        },
      };

      const result = getPriceDisplay(product);
      expect(result).toBe("$45.00");
    });

    it("should work with complex multi-variant products", () => {
      const product = {
        display_price: "$39.99",
        variants: {
          Black: {
            sizes: {
              XS: { price_cents: 3499 },
              S: { price_cents: 3599 },
              M: { price_cents: 3699 },
              L: { price_cents: 3799 },
              XL: { price_cents: 3899 },
              "2XL": { price_cents: 3999 },
            },
          },
          White: {
            sizes: {
              S: { price_cents: 3599 },
              M: { price_cents: 3699 },
              L: { price_cents: 3799 },
            },
          },
          Navy: {
            sizes: {
              M: { price_cents: 3699 },
              L: { price_cents: 3799 },
              XL: { price_cents: 3899 },
            },
          },
        },
      };

      const result = getPriceDisplay(product);
      expect(result).toBe("$34.99 - $39.99");
    });

    it("should handle product with no display_price", () => {
      const product = {
        variants: {
          Black: {
            sizes: {
              M: { price_cents: 3999 },
            },
          },
        },
      };

      const result = getPriceDisplay(product);
      expect(result).toBe("$39.99");
    });

    it("should handle very large price values", () => {
      const product = {
        variants: {
          Premium: {
            sizes: {
              "One Size": { price_cents: 999999 },
            },
          },
        },
      };

      const result = getPriceDisplay(product);
      expect(result).toContain("9999.99");
    });

    it("should handle fractional cents (rounding)", () => {
      const product = {
        variants: {
          Black: {
            sizes: {
              M: { price_cents: 3995 }, // $39.95
              L: { price_cents: 4995 }, // $49.95
            },
          },
        },
      };

      const result = getPriceDisplay(product);
      expect(result).toBe("$39.95 - $49.95");
    });
  });

  describe("Integration scenarios", () => {
    it("should categorize and display price for complete product", () => {
      const product = {
        product_key: "sticker_pack_1",
        title: "Sticker Pack 5-Pack",
        display_price: "$9.99",
        variants: {
          Default: {
            sizes: {
              "One Size": { price_cents: 999 },
            },
          },
        },
      };

      const category = getProductCategory(product.title);
      const price = getPriceDisplay(product);

      expect(category).toBe("stickers");
      expect(price).toBe("$9.99");
    });

    it("should handle product listing workflow", () => {
      const products = [
        {
          title: "Hoodie Classic",
          variants: {
            Black: {
              sizes: { M: { price_cents: 4999 } },
            },
          },
        },
        {
          title: "Long Sleeve Tee",
          variants: {
            White: {
              sizes: { S: { price_cents: 1999 }, L: { price_cents: 2199 } },
            },
          },
        },
        {
          title: "Snapback Hat",
          display_price: "$24.99",
          variants: {},
        },
      ];

      const results = products.map(p => ({
        category: getProductCategory(p.title),
        price: getPriceDisplay(p),
      }));

      expect(results[0].category).toBe("hoodies");
      expect(results[0].price).toBe("$49.99");
      expect(results[1].category).toBe("long-sleeve");
      expect(results[1].price).toBe("$19.99 - $21.99");
      expect(results[2].category).toBe("hats");
      expect(results[2].price).toBe("$24.99");
    });

    it("should work with store filtering logic", () => {
      const product1 = {
        title: "Sticker Pack",
        variants: { Default: { sizes: { "One Size": { price_cents: 999 } } } },
      };
      const product2 = { title: "Hoodie Premium", variants: { Black: { sizes: { M: { price_cents: 5999 } } } } };
      const product3 = { title: "Trucker Cap", display_price: "$24.99", variants: {} };

      const filter = (products, categoryFilter) => {
        return products.filter(p => {
          const category = getProductCategory(p.title);
          return categoryFilter === "all" || category === categoryFilter;
        });
      };

      const allProducts = [product1, product2, product3];
      const stickers = filter(allProducts, "stickers");
      const hoodies = filter(allProducts, "hoodies");

      expect(stickers).toHaveLength(1);
      expect(stickers[0].title).toBe("Sticker Pack");
      expect(hoodies).toHaveLength(1);
      expect(hoodies[0].title).toBe("Hoodie Premium");
    });
  });

  describe("Edge cases", () => {
    it("should handle products with mixed valid and invalid price data", () => {
      const product = {
        display_price: "$45.00",
        variants: {
          Black: {
            sizes: {
              S: { price_cents: 3999 },
              M: {
                /* missing price */
              },
              L: { price_cents: 4999 },
            },
          },
        },
      };

      const result = getPriceDisplay(product);
      // Should use valid prices found
      expect(result).toMatch(/\$\d+\.\d{2}/);
    });

    it("should handle empty size objects", () => {
      const product = {
        display_price: "$30.00",
        variants: {
          Black: {
            sizes: {},
          },
          White: {
            sizes: {},
          },
        },
      };

      const result = getPriceDisplay(product);
      expect(result).toBe("$30.00");
    });

    it("should handle variant without sizes property", () => {
      const product = {
        display_price: "$35.00",
        variants: {
          Black: {
            /* no sizes property */
          },
        },
      };

      const result = getPriceDisplay(product);
      expect(result).toBe("$35.00");
    });

    it("should handle empty string title", () => {
      expect(getProductCategory("")).toBe("other");
    });

    it("should handle whitespace-only title", () => {
      expect(getProductCategory("   ")).toBe("other");
    });

    it("should throw on null title", () => {
      // The function doesn't handle null, it will throw when calling toLowerCase()
      expect(() => {
        getProductCategory(null);
      }).toThrow();
    });
  });
});
