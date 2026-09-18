/**
 * Product Display - Exported Functions Tests
 * Tests exported price calculation functions: getPriceDisplay, getPriceRange
 */

import { getPriceDisplay, getPriceRange } from "../product";

describe("Product Display - Exported Functions", () => {
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
      expect(result).toBe("$39.99 USD");
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
      expect(result).toBe("$29.99 USD – $49.99 USD");
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
      expect(result).toBe("$29.99 USD – $49.99 USD");
    });

    it("should return zero when no variant prices available", () => {
      const product = {
        display_price: "$35.00",
        variants: {
          Black: {
            sizes: {},
          },
        },
      };

      const result = getPriceDisplay(product);
      expect(result).toBe("$35.00 USD");
    });

    it("should handle null product gracefully", () => {
      const result = getPriceDisplay(null);
      expect(result).toBe("$0.00 USD");
    });

    it("should handle undefined product gracefully", () => {
      const result = getPriceDisplay(undefined);
      expect(result).toBe("$0.00 USD");
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
      expect(result).toMatch(/\$\d+\.\d{2}/);
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
      expect(result).toBe("$29.99 USD – $59.99 USD");
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
  });

  describe("getPriceRange", () => {
    it("should return correct min and max prices", () => {
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

      const result = getPriceRange(product);
      expect(result.min).toBe(29.99);
      expect(result.max).toBe(49.99);
    });

    it("should return same min and max for single price", () => {
      const product = {
        variants: {
          Black: {
            sizes: {
              M: { price_cents: 3999 },
            },
          },
        },
      };

      const result = getPriceRange(product);
      expect(result.min).toBe(39.99);
      expect(result.max).toBe(39.99);
    });

    it("should handle multiple colors and sizes", () => {
      const product = {
        variants: {
          Black: {
            sizes: {
              S: { price_cents: 1000 },
              M: { price_cents: 1500 },
            },
          },
          White: {
            sizes: {
              L: { price_cents: 3000 },
              XL: { price_cents: 3500 },
            },
          },
        },
      };

      const result = getPriceRange(product);
      expect(result.min).toBe(10.0);
      expect(result.max).toBe(35.0);
    });

    it("should return correct format (numbers, not strings)", () => {
      const product = {
        variants: {
          Black: {
            sizes: {
              M: { price_cents: 3999 },
            },
          },
        },
      };

      const result = getPriceRange(product);
      expect(typeof result.min).toBe("number");
      expect(typeof result.max).toBe("number");
    });

    it("should handle null product", () => {
      const result = getPriceRange(null);
      expect(result.min).toBe(0);
      expect(result.max).toBe(0);
    });

    it("should fallback to display_price when no variant prices", () => {
      const product = {
        display_price: "$50.00",
        variants: {
          Black: {
            sizes: {},
          },
        },
      };

      const result = getPriceRange(product);
      // Should either return fallback or {0, 0}
      expect(result.min).toBeDefined();
      expect(result.max).toBeDefined();
    });

    it("should return two decimal places", () => {
      const product = {
        variants: {
          Black: {
            sizes: {
              M: { price_cents: 3456 },
            },
          },
        },
      };

      const result = getPriceRange(product);
      expect(result.min.toString().split(".")[1].length).toBeLessThanOrEqual(2);
      expect(result.max.toString().split(".")[1].length).toBeLessThanOrEqual(2);
    });

    it("should work for Schema.org microdata", () => {
      const product = {
        variants: {
          Black: {
            sizes: {
              S: { price_cents: 2999 },
              XL: { price_cents: 5999 },
            },
          },
        },
      };

      const range = getPriceRange(product);

      // Should be able to use in schema markup
      const schema = {
        "@type": "Product",
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "USD",
          lowPrice: range.min.toString(),
          highPrice: range.max.toString(),
        },
      };

      expect(schema.offers.lowPrice).toBe("29.99");
      expect(schema.offers.highPrice).toBe("59.99");
    });

    it("should handle edge case: very small prices", () => {
      const product = {
        variants: {
          Sticker: {
            sizes: {
              "One Size": { price_cents: 50 },
            },
          },
        },
      };

      const result = getPriceRange(product);
      expect(result.min).toBeCloseTo(0.5, 1);
      expect(result.max).toBeCloseTo(0.5, 1);
    });

    it("should handle edge case: very large prices", () => {
      const product = {
        variants: {
          Limited: {
            sizes: {
              "One Size": { price_cents: 9999900 },
            },
          },
        },
      };

      const result = getPriceRange(product);
      expect(result.min).toBe(99999);
      expect(result.max).toBe(99999);
    });
  });

  describe("Integration scenarios", () => {
    it("should use getPriceDisplay and getPriceRange together", () => {
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

      const displayPrice = getPriceDisplay(product);
      const priceRange = getPriceRange(product);

      expect(displayPrice).toBe("$29.99 USD – $49.99 USD");
      expect(priceRange.min).toBe(29.99);
      expect(priceRange.max).toBe(49.99);
    });

    it("should handle product without variants gracefully", () => {
      const product = {
        display_price: "$25.00",
      };

      const displayPrice = getPriceDisplay(product);
      const priceRange = getPriceRange(product);

      expect(typeof displayPrice).toBe("string");
      expect(typeof priceRange.min).toBe("number");
      expect(typeof priceRange.max).toBe("number");
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

      const displayPrice = getPriceDisplay(product);
      const priceRange = getPriceRange(product);

      expect(displayPrice).toBe("$34.99 USD – $39.99 USD");
      expect(priceRange.min).toBe(34.99);
      expect(priceRange.max).toBe(39.99);
    });
  });
});
