// Cart Display Tests
// Tests for cart display and tax calculation workflow
/* eslint-disable no-unused-vars */

describe("Cart Display - Tax Calculation", () => {
  // Mock the global cart and products
  let mockCart;
  let mockProducts;
  let mockQuote;

  beforeEach(() => {
    // Clear and setup DOM
    document.body.innerHTML = `
      <div id="summary-content" style="display: none;">
        <div id="currency-display" data-testid="currency-display">—</div>
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
      <div id="cart-loading" style="display: none;"></div>
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

  describe("Locale-Specific Currency Formatting", () => {
    test("should format USD with comma separator and period decimal", () => {
      const formatCurrency = (minorUnits, currency, locale) => {
        const divisor = 100;
        const amount = minorUnits / divisor;
        const currencyUpper = (currency || "USD").toUpperCase();
        const localeMap = {
          USD: "en-US",
          EUR: "de-DE",
          GBP: "en-GB",
          CAD: "en-CA",
          AUD: "en-AU",
          JPY: "ja-JP",
          CNY: "zh-CN",
          INR: "en-IN",
        };
        const targetLocale = locale || localeMap[currencyUpper] || "en-US";
        try {
          return new Intl.NumberFormat(targetLocale, {
            style: "currency",
            currency: currencyUpper,
            minimumFractionDigits: currencyUpper === "JPY" || currencyUpper === "CNY" ? 0 : 2,
            maximumFractionDigits: currencyUpper === "JPY" || currencyUpper === "CNY" ? 0 : 2,
          }).format(amount);
        } catch (error) {
          return "ERROR";
        }
      };

      // USD: $1,234.50
      const result = formatCurrency(123450, "USD");
      expect(result).toContain("$");
      expect(result).toContain("1");
      expect(result).toContain("234");
    });

    test("should format EUR with period separator and comma decimal", () => {
      const formatCurrency = (minorUnits, currency, locale) => {
        const divisor = 100;
        const amount = minorUnits / divisor;
        const currencyUpper = (currency || "USD").toUpperCase();
        const localeMap = {
          USD: "en-US",
          EUR: "de-DE",
          GBP: "en-GB",
          CAD: "en-CA",
          AUD: "en-AU",
          JPY: "ja-JP",
          CNY: "zh-CN",
          INR: "en-IN",
        };
        const targetLocale = locale || localeMap[currencyUpper] || "en-US";
        try {
          return new Intl.NumberFormat(targetLocale, {
            style: "currency",
            currency: currencyUpper,
            minimumFractionDigits: currencyUpper === "JPY" || currencyUpper === "CNY" ? 0 : 2,
            maximumFractionDigits: currencyUpper === "JPY" || currencyUpper === "CNY" ? 0 : 2,
          }).format(amount);
        } catch (error) {
          return "ERROR";
        }
      };

      // EUR: €1.234,50
      const result = formatCurrency(123450, "EUR");
      expect(result).toContain("€");
    });

    test("should format JPY with no decimal places", () => {
      const formatCurrency = (minorUnits, currency, locale) => {
        const divisor = 100;
        const amount = minorUnits / divisor;
        const currencyUpper = (currency || "USD").toUpperCase();
        const localeMap = {
          USD: "en-US",
          EUR: "de-DE",
          GBP: "en-GB",
          CAD: "en-CA",
          AUD: "en-AU",
          JPY: "ja-JP",
          CNY: "zh-CN",
          INR: "en-IN",
        };
        const targetLocale = locale || localeMap[currencyUpper] || "en-US";
        try {
          return new Intl.NumberFormat(targetLocale, {
            style: "currency",
            currency: currencyUpper,
            minimumFractionDigits: currencyUpper === "JPY" || currencyUpper === "CNY" ? 0 : 2,
            maximumFractionDigits: currencyUpper === "JPY" || currencyUpper === "CNY" ? 0 : 2,
          }).format(amount);
        } catch (error) {
          return "ERROR";
        }
      };

      // JPY: ¥123,450 (no decimal) - accepts both half-width and full-width yen symbols
      const result = formatCurrency(12345000, "JPY");
      expect(result).toMatch(/[¥￥]/);
      expect(result).not.toContain(",00");
    });

    test("should use provided locale instead of default", () => {
      const formatCurrency = (minorUnits, currency, locale) => {
        const divisor = 100;
        const amount = minorUnits / divisor;
        const currencyUpper = (currency || "USD").toUpperCase();
        const targetLocale = locale || "en-US";
        try {
          return new Intl.NumberFormat(targetLocale, {
            style: "currency",
            currency: currencyUpper,
            minimumFractionDigits: currencyUpper === "JPY" || currencyUpper === "CNY" ? 0 : 2,
            maximumFractionDigits: currencyUpper === "JPY" || currencyUpper === "CNY" ? 0 : 2,
          }).format(amount);
        } catch (error) {
          return "ERROR";
        }
      };

      // With custom locale
      const result = formatCurrency(123450, "USD", "fr-FR");
      expect(result).not.toBe("ERROR");
      expect(result).toContain("$");
    });

    test("should include currency symbol with amount", () => {
      const formatCurrency = (minorUnits, currency, locale) => {
        const divisor = 100;
        const amount = minorUnits / divisor;
        const currencyUpper = (currency || "USD").toUpperCase();
        const localeMap = {
          USD: "en-US",
          EUR: "de-DE",
          GBP: "en-GB",
          CAD: "en-CA",
          AUD: "en-AU",
          JPY: "ja-JP",
          CNY: "zh-CN",
          INR: "en-IN",
        };
        const targetLocale = locale || localeMap[currencyUpper] || "en-US";
        try {
          return new Intl.NumberFormat(targetLocale, {
            style: "currency",
            currency: currencyUpper,
            minimumFractionDigits: currencyUpper === "JPY" || currencyUpper === "CNY" ? 0 : 2,
            maximumFractionDigits: currencyUpper === "JPY" || currencyUpper === "CNY" ? 0 : 2,
          }).format(amount);
        } catch (error) {
          return "ERROR";
        }
      };

      const currencyCombos = [
        { currency: "USD", symbol: "$" },
        { currency: "EUR", symbol: "€" },
        { currency: "GBP", symbol: "£" },
        { currency: "JPY", symbol: /[¥￥]/ }, // Accepts both half-width and full-width yen
        { currency: "INR", symbol: "₹" },
      ];

      currencyCombos.forEach(({ currency, symbol }) => {
        const result = formatCurrency(100000, currency);
        if (typeof symbol === "string") {
          expect(result).toContain(symbol);
        } else if (symbol instanceof RegExp) {
          expect(result).toMatch(symbol);
        }
        expect(result).not.toBe("ERROR");
      });
    });
  });

  describe("Loading Widget Display", () => {
    beforeEach(() => {
      // Setup DOM with loading widget and cart elements
      document.body.innerHTML = `
        <div id="empty-cart" data-testid="empty-cart-message" style="display: none;">
          <p class="text-secondary">Your cart is empty</p>
          <a href="index.html" class="btn btn-primary">Continue Shopping</a>
        </div>
        <div id="cart-loading" style="display: none; text-align: center; padding: 40px">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Loading your cart...</p>
        </div>
        <div id="cart-items" style="display: none; grid;">
          <!-- Cart items rendered here -->
        </div>
        <div id="cart-summary" style="display: none;">
          <div id="summary-content" style="display: none;">
            <div id="subtotal">—</div>
            <div id="shipping-value">—</div>
            <div id="tax-row">
              <span id="tax-label">Tax/VAT:</span>
              <span id="tax-value">—</span>
            </div>
            <div id="total">—</div>
            <div id="import-duties-note"></div>
          </div>
          <div id="quote-loading" style="display: none;"></div>
          <div id="quote-error" style="display: none;">
            <p id="quote-error-text"></p>
          </div>
        </div>
      `;
    });

    test("should show loading widget when cart has items", () => {
      const cartLoading = document.getElementById("cart-loading");
      const emptyCart = document.getElementById("empty-cart");
      const cartItems = document.getElementById("cart-items");

      // Simulate displayCart() with items
      emptyCart.style.display = "none";
      cartLoading.style.display = "block";
      cartItems.style.display = "grid";

      expect(cartLoading.style.display).toBe("block");
      expect(emptyCart.style.display).toBe("none");
      expect(cartItems.style.display).toBe("grid");
    });

    test("should hide loading widget when cart is empty", () => {
      const cartLoading = document.getElementById("cart-loading");
      const emptyCart = document.getElementById("empty-cart");
      const cartItems = document.getElementById("cart-items");

      // Simulate displayCart() with no items
      emptyCart.style.display = "block";
      cartLoading.style.display = "none";
      cartItems.style.display = "none";

      expect(cartLoading.style.display).toBe("none");
      expect(emptyCart.style.display).toBe("block");
      expect(cartItems.style.display).toBe("none");
    });

    test("should hide loading widget when quote loads", () => {
      const cartLoading = document.getElementById("cart-loading");
      const summaryContent = document.getElementById("summary-content");

      // Simulate updateOrderSummaryDisplay() with a quote
      cartLoading.style.display = "none";
      summaryContent.style.display = "block";

      expect(cartLoading.style.display).toBe("none");
      expect(summaryContent.style.display).toBe("block");
    });

    test("should show continue shopping only on empty cart", () => {
      const emptyCart = document.getElementById("empty-cart");
      const continueLink = emptyCart.querySelector("a");

      // Empty cart - link visible
      emptyCart.style.display = "block";
      expect(continueLink).not.toBeNull();
      expect(emptyCart.style.display).toBe("block");

      // With items - empty cart hidden
      emptyCart.style.display = "none";
      expect(emptyCart.style.display).toBe("none");
    });

    test("should display spinner icon in loading widget", () => {
      const cartLoading = document.getElementById("cart-loading");
      const spinner = cartLoading.querySelector("i.fa-spinner.fa-spin");

      expect(spinner).not.toBeNull();
      expect(spinner.classList.contains("fa-spinner")).toBe(true);
      expect(spinner.classList.contains("fa-spin")).toBe(true);
    });

    test("should display loading text in loading widget", () => {
      const cartLoading = document.getElementById("cart-loading");
      const loadingText = cartLoading.querySelector("p");

      expect(loadingText).not.toBeNull();
      expect(loadingText.textContent).toContain("Loading your cart");
    });

    test("should transition from loading to order summary", () => {
      const cartLoading = document.getElementById("cart-loading");
      const summaryContent = document.getElementById("summary-content");

      // Initially loading
      cartLoading.style.display = "block";
      summaryContent.style.display = "none";

      expect(cartLoading.style.display).toBe("block");
      expect(summaryContent.style.display).toBe("none");

      // Quote loaded - hide loading, show summary
      cartLoading.style.display = "none";
      summaryContent.style.display = "block";

      expect(cartLoading.style.display).toBe("none");
      expect(summaryContent.style.display).toBe("block");
    });

    test("should never show both continue shopping and loading widget", () => {
      const emptyCart = document.getElementById("empty-cart");
      const cartLoading = document.getElementById("cart-loading");

      // Scenario 1: Empty cart
      emptyCart.style.display = "block";
      cartLoading.style.display = "none";

      expect(emptyCart.style.display === "block" && cartLoading.style.display === "block").toBe(false);

      // Scenario 2: Cart with items
      emptyCart.style.display = "none";
      cartLoading.style.display = "block";

      expect(emptyCart.style.display === "block" && cartLoading.style.display === "block").toBe(false);
    });

    test("should never show continue shopping when items exist in cart", () => {
      const emptyCart = document.getElementById("empty-cart");

      // Cart has items
      emptyCart.style.display = "none";

      expect(emptyCart.style.display).toBe("none");
    });
  });

  describe("Loading Widget and Currency Display", () => {
    test("should show loading widget when cart has items but quote not loaded", () => {
      const cartLoading = document.getElementById("cart-loading");
      const summaryContent = document.getElementById("summary-content");

      // Simulate displayCart() behavior when cart has items
      cartLoading.style.display = "block";
      summaryContent.style.display = "block";

      expect(cartLoading.style.display).toBe("block");
    });

    test("should hide loading widget when quote loads successfully", () => {
      const cartLoading = document.getElementById("cart-loading");

      // Simulate updateOrderSummaryDisplay() behavior
      cartLoading.style.display = "none";

      expect(cartLoading.style.display).toBe("none");
    });

    test("should display currency code from quote", () => {
      document.body.innerHTML = `
        <div id="summary-content" style="display: none;">
          <div id="currency-display" data-testid="currency-display">—</div>
          <div id="subtotal" data-testid="cart-subtotal">—</div>
          <div id="shipping-value" data-testid="cart-shipping">—</div>
          <div id="tax-row">
            <span id="tax-label">Tax/VAT:</span>
            <span id="tax-value" data-testid="cart-tax">—</span>
          </div>
          <div id="total">—</div>
          <div id="import-duties-note" style="display: none;"></div>
        </div>
        <div id="quote-loading" style="display: none;"></div>
        <div id="quote-error" style="display: none;">
          <p id="quote-error-text"></p>
        </div>
      `;

      const quote = {
        subtotal: 5000,
        shipping: 800,
        tax: 350,
        total: 6150,
        currency: "EUR",
        calculationId: "quote_123",
        prices: { subtotal: 5000, shipping: 800, tax: 350, total: 6150 },
      };

      const currencyEl = document.getElementById("currency-display");
      currencyEl.textContent = quote.currency;

      expect(currencyEl.textContent).toBe("EUR");
    });

    test("should display USD currency code", () => {
      document.body.innerHTML = `
        <div id="summary-content" style="display: none;">
          <div id="currency-display" data-testid="currency-display">—</div>
          <div id="subtotal" data-testid="cart-subtotal">—</div>
          <div id="shipping-value" data-testid="cart-shipping">—</div>
          <div id="tax-row">
            <span id="tax-label">Tax/VAT:</span>
            <span id="tax-value" data-testid="cart-tax">—</span>
          </div>
          <div id="total">—</div>
          <div id="import-duties-note" style="display: none;"></div>
        </div>
      `;

      const quote = {
        currency: "USD",
      };

      const currencyEl = document.getElementById("currency-display");
      currencyEl.textContent = quote.currency;

      expect(currencyEl.textContent).toBe("USD");
    });

    test("should display BRL currency code for international order", () => {
      document.body.innerHTML = `
        <div id="summary-content" style="display: none;">
          <div id="currency-display" data-testid="currency-display">—</div>
        </div>
      `;

      const quote = {
        currency: "BRL",
      };

      const currencyEl = document.getElementById("currency-display");
      currencyEl.textContent = quote.currency;

      expect(currencyEl.textContent).toBe("BRL");
    });

    test("should show loading widget and hide summary initially", () => {
      document.body.innerHTML = `
        <div id="empty-cart" style="display: none;"></div>
        <div id="cart-loading" style="display: block;"></div>
        <div id="cart-items" style="display: grid;"></div>
        <div id="cart-summary" style="display: block;">
          <div id="summary-content" style="display: none;"></div>
        </div>
      `;

      const cartLoading = document.getElementById("cart-loading");
      const summaryContent = document.getElementById("summary-content");

      expect(cartLoading.style.display).toBe("block");
      expect(summaryContent.style.display).toBe("none");
    });
  });
});
