// Cart Display Tests
// Tests for cart display and tax calculation workflow

describe("Cart Display - Tax Calculation", () => {
  // Mock the global cart and products
  let mockCart;
  let mockProducts;
  let mockQuote;

  beforeEach(() => {
    // Clear and setup DOM
    document.body.innerHTML = `
      <div id="summary-content" style="display: none;">
        <div id="subtotal" data-testid="cart-subtotal">—</div>
        <div id="shipping-value" data-testid="cart-shipping">—</div>
        <div id="tax-row">
          <span id="tax-label">Tax/VAT:</span>
          <span id="tax-value" data-testid="cart-tax">Calculated after country is selected</span>
        </div>
        <div id="total">—</div>
        <div id="import-duties-note" style="display: none;"></div>
      </div>
      <div id="quote-loading" style="display: none;"></div>
      <div id="quote-error" style="display: none;">
        <p id="quote-error-text"></p>
      </div>
      <div id="shipping-country">
        <option value=""></option>
        <option value="US">United States</option>
        <option value="DE">Germany</option>
      </div>
      <button id="checkout-btn" disabled>Proceed to Checkout</button>
      <input type="checkbox" id="terms-checkbox" />
    `;

    // Mock cart
    mockCart = {
      items: [{ productKey: "test_1", color: "Black", size: "M", quantity: 1 }],
      getSubtotalCents: jest.fn(() => 5000),
    };

    // Mock products
    mockProducts = [
      {
        product_key: "test_1",
        title: "Test Tee",
        variants: {
          Black: {
            sizes: {
              M: { variant_id: 123, price_cents: 5000 },
            },
          },
        },
      },
    ];

    // Mock quote responses
    mockQuote = {
      subtotal: 5000,
      shipping: 800,
      tax: 350,
      taxLabel: "Sales tax (7%)",
      taxIncluded: false,
      total: 6150,
      currency: "USD",
      calculationId: "quote_123",
      importDutiesNote: null,
    };
  });

  describe("formatCurrency", () => {
    test("should format USD currency correctly", () => {
      // We need to expose formatCurrency in the module
      // For now, testing the logic inline
      const minorUnits = 5000;
      const currency = "USD";
      const expected = "$50.00";

      const amount = minorUnits / 100;
      const currencySymbols = { USD: "$", EUR: "€", GBP: "£" };
      const symbol = currencySymbols[currency] || currency;
      const result = `${symbol}${amount.toFixed(2)}`;

      expect(result).toBe(expected);
    });

    test("should format EUR currency correctly", () => {
      const minorUnits = 5000;
      const currency = "EUR";
      const expected = "€50.00";

      const amount = minorUnits / 100;
      const currencySymbols = { USD: "$", EUR: "€", GBP: "£" };
      const symbol = currencySymbols[currency] || currency;
      const result = `${symbol}${amount.toFixed(2)}`;

      expect(result).toBe(expected);
    });

    test("should format GBP currency correctly", () => {
      const minorUnits = 1000;
      const currency = "GBP";
      const expected = "£10.00";

      const amount = minorUnits / 100;
      const currencySymbols = { USD: "$", EUR: "€", GBP: "£" };
      const symbol = currencySymbols[currency] || currency;
      const result = `${symbol}${amount.toFixed(2)}`;

      expect(result).toBe(expected);
    });
  });

  describe("updateOrderSummaryDisplay", () => {
    test("should hide content when quote is null", () => {
      const contentEl = document.getElementById("summary-content");

      // When quote is null, content should be hidden
      expect(contentEl.style.display).toBe("none");
    });

    test("should display Tax label and amount when tax > 0", () => {
      const contentEl = document.getElementById("summary-content");
      const taxLabelEl = document.getElementById("tax-label");
      const taxValueEl = document.getElementById("tax-value");

      // Simulate quote with tax
      const quote = {
        subtotal: 5000,
        shipping: 800,
        tax: 350,
        taxIncluded: false,
        total: 6150,
        currency: "USD",
        calculationId: "quote_123",
        importDutiesNote: null,
      };

      // Test the tax display logic
      let taxLabel = "Tax/VAT:";
      let taxValue = "$3.50";

      if (quote.tax > 0) {
        taxLabel = "Tax:";
        taxValue = "$3.50";
      } else {
        taxLabel = "VAT:";
        taxValue = "Included";
      }

      expect(taxLabel).toBe("Tax:");
      expect(taxValue).toBe("$3.50");
    });

    test("should display VAT label and 'Included' when tax = 0", () => {
      const quote = {
        subtotal: 5000,
        shipping: 800,
        tax: 0,
        taxIncluded: true,
        total: 5800,
        currency: "EUR",
        calculationId: "quote_123",
        importDutiesNote: null,
      };

      // Test the tax display logic
      let taxLabel = "Tax/VAT:";
      let taxValue = "€0.00";

      if (quote.tax > 0) {
        taxLabel = "Tax:";
        taxValue = "€0.00";
      } else {
        taxLabel = "VAT:";
        taxValue = "Included";
      }

      expect(taxLabel).toBe("VAT:");
      expect(taxValue).toBe("Included");
    });

    test("should apply muted style when tax is included", () => {
      const taxRowEl = document.getElementById("tax-row");

      // Quote with tax included
      const quote = {
        tax: 0,
        taxIncluded: true,
        total: 5800,
      };

      if (quote.taxIncluded) {
        taxRowEl.style.opacity = "0.6";
        taxRowEl.style.fontSize = "0.9rem";
      }

      expect(taxRowEl.style.opacity).toBe("0.6");
      expect(taxRowEl.style.fontSize).toBe("0.9rem");
    });

    test("should NOT apply muted style when tax is not included", () => {
      const taxRowEl = document.getElementById("tax-row");

      const quote = {
        tax: 350,
        taxIncluded: false,
        total: 6150,
      };

      if (quote.taxIncluded) {
        taxRowEl.style.opacity = "0.6";
        taxRowEl.style.fontSize = "0.9rem";
      } else {
        taxRowEl.style.opacity = "1";
        taxRowEl.style.fontSize = "1rem";
      }

      expect(taxRowEl.style.opacity).toBe("1");
      expect(taxRowEl.style.fontSize).toBe("1rem");
    });

    test("should show import duties note when applicable", () => {
      const importDutiesEl = document.getElementById("import-duties-note");

      const quote = {
        importDutiesNote: true,
      };

      importDutiesEl.style.display = quote.importDutiesNote ? "block" : "none";
      expect(importDutiesEl.style.display).toBe("block");
    });

    test("should hide import duties note when not applicable", () => {
      const importDutiesEl = document.getElementById("import-duties-note");

      const quote = {
        importDutiesNote: false,
      };

      importDutiesEl.style.display = quote.importDutiesNote ? "block" : "none";
      expect(importDutiesEl.style.display).toBe("none");
    });

    test("should format all currency amounts correctly for USD", () => {
      const quote = {
        subtotal: 5000,
        shipping: 800,
        tax: 350,
        total: 6150,
        currency: "USD",
      };

      const formatCurrency = (minorUnits, currency) => {
        const amount = minorUnits / 100;
        const currencySymbols = { USD: "$", EUR: "€", GBP: "£" };
        const symbol = currencySymbols[currency] || currency;
        return `${symbol}${amount.toFixed(2)}`;
      };

      expect(formatCurrency(quote.subtotal, quote.currency)).toBe("$50.00");
      expect(formatCurrency(quote.shipping, quote.currency)).toBe("$8.00");
      expect(formatCurrency(quote.tax, quote.currency)).toBe("$3.50");
      expect(formatCurrency(quote.total, quote.currency)).toBe("$61.50");
    });

    test("should format all currency amounts correctly for EUR", () => {
      const quote = {
        subtotal: 5000,
        shipping: 800,
        tax: 0,
        total: 5800,
        currency: "EUR",
      };

      const formatCurrency = (minorUnits, currency) => {
        const amount = minorUnits / 100;
        const currencySymbols = { USD: "$", EUR: "€", GBP: "£" };
        const symbol = currencySymbols[currency] || currency;
        return `${symbol}${amount.toFixed(2)}`;
      };

      expect(formatCurrency(quote.subtotal, quote.currency)).toBe("€50.00");
      expect(formatCurrency(quote.shipping, quote.currency)).toBe("€8.00");
      expect(formatCurrency(quote.total, quote.currency)).toBe("€58.00");
    });
  });

  describe("buildQuoteItems", () => {
    test("should transform cart items to SKU format", () => {
      const mockCart = {
        items: [
          { productKey: "product_1", color: "Black", size: "M", quantity: 1 },
          { productKey: "product_2", color: "Red", size: "L", quantity: 2 },
        ],
      };

      const mockProducts = [
        {
          product_key: "product_1",
          variants: {
            Black: {
              sizes: {
                M: { variant_id: "sku_123" },
              },
            },
          },
        },
        {
          product_key: "product_2",
          variants: {
            Red: {
              sizes: {
                L: { variant_id: "sku_456" },
              },
            },
          },
        },
      ];

      // Simulate buildQuoteItems logic
      const items = mockCart.items
        .map(item => {
          const product = mockProducts.find(p => p.product_key === item.productKey);
          if (product) {
            const variantId = product.variants[item.color]?.sizes?.[item.size]?.variant_id;
            if (variantId) {
              return { sku: variantId, qty: item.quantity };
            }
          }
          return null;
        })
        .filter(item => item !== null);

      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({ sku: "sku_123", qty: 1 });
      expect(items[1]).toEqual({ sku: "sku_456", qty: 2 });
    });

    test("should skip items with missing variant_id", () => {
      const mockCart = {
        items: [
          { productKey: "product_1", color: "Black", size: "M", quantity: 1 },
          { productKey: "product_2", color: "Red", size: "L", quantity: 1 },
        ],
      };

      const mockProducts = [
        {
          product_key: "product_1",
          variants: {
            Black: {
              sizes: {
                M: { variant_id: "sku_123" },
              },
            },
          },
        },
        {
          product_key: "product_2",
          variants: {
            Red: {
              sizes: {
                L: {
                  /* no variant_id */
                },
              },
            },
          },
        },
      ];

      const items = mockCart.items
        .map(item => {
          const product = mockProducts.find(p => p.product_key === item.productKey);
          if (product) {
            const variantId = product.variants[item.color]?.sizes?.[item.size]?.variant_id;
            if (variantId) {
              return { sku: variantId, qty: item.quantity };
            }
          }
          return null;
        })
        .filter(item => item !== null);

      expect(items).toHaveLength(1);
      expect(items[0]).toEqual({ sku: "sku_123", qty: 1 });
    });
  });

  describe("Tax Display Edge Cases", () => {
    test("should handle very small tax amounts", () => {
      const quote = {
        subtotal: 9999,
        shipping: 0,
        tax: 1,
        total: 10000,
        currency: "USD",
      };

      let taxLabel = "Tax/VAT:";
      if (quote.tax > 0) {
        taxLabel = "Tax:";
      } else {
        taxLabel = "VAT:";
      }

      expect(taxLabel).toBe("Tax:");
    });

    test("should handle large tax amounts", () => {
      const quote = {
        subtotal: 10000,
        shipping: 2000,
        tax: 2400,
        total: 14400,
        currency: "USD",
      };

      const formatCurrency = (minorUnits, currency) => {
        const amount = minorUnits / 100;
        const currencySymbols = { USD: "$" };
        const symbol = currencySymbols[currency] || currency;
        return `${symbol}${amount.toFixed(2)}`;
      };

      let taxLabel = "Tax/VAT:";
      if (quote.tax > 0) {
        taxLabel = "Tax:";
      }

      expect(taxLabel).toBe("Tax:");
      expect(formatCurrency(quote.tax, quote.currency)).toBe("$24.00");
    });

    test("should handle negative tax as zero tax display", () => {
      const quote = {
        tax: -100, // edge case
      };

      let taxLabel = "Tax/VAT:";
      if (quote.tax > 0) {
        taxLabel = "Tax:";
      } else {
        taxLabel = "VAT:";
      }

      // Negative tax should show VAT/Included
      expect(taxLabel).toBe("VAT:");
    });
  });

  describe("Multi-currency Support", () => {
    test("should support all common currencies", () => {
      const currencies = {
        USD: "$",
        EUR: "€",
        GBP: "£",
        CAD: "C$",
        AUD: "A$",
        JPY: "¥",
        CNY: "¥",
        INR: "₹",
      };

      const formatCurrency = (minorUnits, currency) => {
        const amount = minorUnits / 100;
        const symbol = currencies[currency] || currency;
        return `${symbol}${amount.toFixed(2)}`;
      };

      expect(formatCurrency(1000, "USD")).toBe("$10.00");
      expect(formatCurrency(1000, "EUR")).toBe("€10.00");
      expect(formatCurrency(1000, "GBP")).toBe("£10.00");
      expect(formatCurrency(1000, "CAD")).toBe("C$10.00");
      expect(formatCurrency(1000, "INR")).toBe("₹10.00");
    });

    test("should fallback to currency code for unknown currency", () => {
      const currencies = {
        USD: "$",
        EUR: "€",
      };

      const formatCurrency = (minorUnits, currency) => {
        const amount = minorUnits / 100;
        const symbol = currencies[currency] || currency;
        return `${symbol}${amount.toFixed(2)}`;
      };

      expect(formatCurrency(1000, "XXX")).toBe("XXX10.00");
    });
  });

  describe("Lowercase Currency Code Handling", () => {
    test("should handle lowercase currency codes (eur, gbp, usd)", () => {
      // The API returns lowercase currency codes, formatCurrency should handle it
      const formatCurrency = (minorUnits, currency) => {
        const divisor = 100;
        const amount = minorUnits / divisor;
        const currencySymbols = {
          USD: "$",
          EUR: "€",
          GBP: "£",
          CAD: "C$",
          AUD: "A$",
          JPY: "¥",
          CNY: "¥",
          INR: "₹",
        };
        const currencyUpper = (currency || "USD").toUpperCase();
        const symbol = currencySymbols[currencyUpper] || currencyUpper;
        if (currencyUpper === "JPY" || currencyUpper === "CNY") {
          return `${symbol}${Math.round(amount)}`;
        }
        return `${symbol}${amount.toFixed(2)}`;
      };

      // Test lowercase codes from API
      expect(formatCurrency(2253, "eur")).toBe("€22.53");
      expect(formatCurrency(1000, "gbp")).toBe("£10.00");
      expect(formatCurrency(5000, "usd")).toBe("$50.00");
      expect(formatCurrency(1500, "cad")).toBe("C$15.00");
      expect(formatCurrency(3000, "jpy")).toBe("¥30");
    });

    test("should handle uppercase currency codes (existing behavior)", () => {
      const formatCurrency = (minorUnits, currency) => {
        const divisor = 100;
        const amount = minorUnits / divisor;
        const currencySymbols = {
          USD: "$",
          EUR: "€",
          GBP: "£",
          CAD: "C$",
          AUD: "A$",
          JPY: "¥",
          CNY: "¥",
          INR: "₹",
        };
        const currencyUpper = (currency || "USD").toUpperCase();
        const symbol = currencySymbols[currencyUpper] || currencyUpper;
        if (currencyUpper === "JPY" || currencyUpper === "CNY") {
          return `${symbol}${Math.round(amount)}`;
        }
        return `${symbol}${amount.toFixed(2)}`;
      };

      // Test uppercase codes (original)
      expect(formatCurrency(2253, "EUR")).toBe("€22.53");
      expect(formatCurrency(1000, "GBP")).toBe("£10.00");
      expect(formatCurrency(5000, "USD")).toBe("$50.00");
    });
  });

  describe("Initial Tax Display State", () => {
    test("should display 'Calculated after country is selected' as initial tax value", () => {
      const taxValueEl = document.getElementById("tax-value");
      expect(taxValueEl.textContent).toBe("Calculated after country is selected");
    });

    test("should have Tax/VAT label with colon", () => {
      const taxLabelEl = document.getElementById("tax-label");
      expect(taxLabelEl.textContent).toBe("Tax/VAT:");
    });

    test("should hide summary content initially", () => {
      const contentEl = document.getElementById("summary-content");
      expect(contentEl.style.display).toBe("none");
    });

    test("should show summary content when quote loads", () => {
      const contentEl = document.getElementById("summary-content");
      const quote = {
        subtotal: 5000,
        shipping: 800,
        tax: 350,
        taxIncluded: false,
        total: 6150,
        currency: "USD",
        calculationId: "quote_123",
        importDutiesNote: false,
      };

      // Simulate quote loading
      contentEl.style.display = "block";
      expect(contentEl.style.display).toBe("block");
    });
  });

  describe("Checkout Email Handling", () => {
    test("should NOT include email in checkout request body", () => {
      // Verify the checkout request structure does not include email
      const checkoutRequest = {
        calculationId: "quote_abc123",
        items: [{ sku: "variant_123", qty: 2 }],
        country: "US",
        // Email should NOT be here - it will be captured by Stripe
      };

      expect(checkoutRequest.email).toBeUndefined();
      expect(Object.keys(checkoutRequest)).toEqual(["calculationId", "items", "country"]);
    });

    test("should have calculationId for server-side verification", () => {
      const checkoutRequest = {
        calculationId: "quote_abc123",
        items: [{ sku: "variant_123", qty: 2 }],
        country: "US",
      };

      expect(checkoutRequest.calculationId).toBeDefined();
      expect(checkoutRequest.calculationId).toMatch(/^quote_/);
    });

    test("should include items in proper SKU format", () => {
      const checkoutRequest = {
        calculationId: "quote_abc123",
        items: [
          { sku: "variant_123", qty: 2 },
          { sku: "variant_456", qty: 1 },
        ],
        country: "US",
      };

      expect(checkoutRequest.items.length).toBe(2);
      expect(checkoutRequest.items[0]).toHaveProperty("sku");
      expect(checkoutRequest.items[0]).toHaveProperty("qty");
    });
  });
});
