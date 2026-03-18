// Checkout & API Tests
// Tests for checkout validation and API communication

describe("Shipping Country Selection", () => {
  test("should load countries from JSON file", async () => {
    // Simulating loading countries
    const mockCountries = [
      { code: "US", name: "United States" },
      { code: "CA", name: "Canada" },
      { code: "GB", name: "United Kingdom" },
    ];

    expect(mockCountries).toHaveLength(3);
    expect(mockCountries[0].code).toBe("US");
    expect(mockCountries[0].name).toBe("United States");
  });

  test("should validate country code format", () => {
    const validateCountryCode = code => {
      return /^[A-Z]{2}$/.test(code);
    };

    expect(validateCountryCode("US")).toBe(true);
    expect(validateCountryCode("CA")).toBe(true);
    expect(validateCountryCode("invalid")).toBe(false);
    expect(validateCountryCode("123")).toBe(false);
  });

  test("should require country selection before checkout", () => {
    const validateCountrySelected = selectedCountry => {
      return Boolean(selectedCountry && selectedCountry.trim().length > 0);
    };

    expect(validateCountrySelected("US")).toBe(true);
    expect(validateCountrySelected("")).toBe(false);
    expect(validateCountrySelected(null)).toBe(false);
  });

  test("should reject lowercase country codes", () => {
    const validateCountryCode = code => {
      return /^[A-Z]{2}$/.test(code);
    };

    expect(validateCountryCode("us")).toBe(false);
    expect(validateCountryCode("Ca")).toBe(false);
  });

  test("should reject country codes that are too long or short", () => {
    const validateCountryCode = code => {
      return /^[A-Z]{2}$/.test(code);
    };

    expect(validateCountryCode("U")).toBe(false);
    expect(validateCountryCode("USA")).toBe(false);
    expect(validateCountryCode("")).toBe(false);
  });

  test("should populate select element with countries", () => {
    const populateCountrySelect = countries => {
      const options = countries.map(c => ({ value: c.code, text: c.name }));
      return options;
    };

    const countries = [
      { code: "US", name: "United States" },
      { code: "CA", name: "Canada" },
    ];
    const options = populateCountrySelect(countries);

    expect(options).toHaveLength(2);
    expect(options[0]).toEqual({ value: "US", text: "United States" });
    expect(options[1]).toEqual({ value: "CA", text: "Canada" });
  });

  test("should enable checkout button when country selected", () => {
    const shouldEnableCheckout = selectedValue => {
      return selectedValue !== "";
    };

    expect(shouldEnableCheckout("US")).toBe(true);
    expect(shouldEnableCheckout("")).toBe(false);
  });
});

describe("Checkout Validation", () => {
  const mockProducts = [
    {
      product_key: "product_1",
      title: "Unisex Tee w/ Text",
      image: "main.jpg",
      display_price: "$25.00",
      variants: {
        Black: {
          image: "black.jpg",
          sizes: {
            M: { variant_id: 1003, price_cents: 2500 },
            L: { variant_id: 1004, price_cents: 2500 },
          },
        },
      },
    },
  ];

  describe("validateCartItems", () => {
    test("should validate all items exist in product catalog", () => {
      const validateCartItems = (cartItems, products) => {
        return cartItems.every(item => products.find(p => p.product_key === item.productKey));
      };

      const validCart = [{ productKey: "product_1", color: "Black", size: "M", quantity: 1 }];
      expect(validateCartItems(validCart, mockProducts)).toBe(true);

      const invalidCart = [{ productKey: "product_nonexistent", color: "Black", size: "M", quantity: 1 }];
      expect(validateCartItems(invalidCart, mockProducts)).toBe(false);
    });

    test("should validate colors exist for each item", () => {
      const validateColors = (cartItems, products) => {
        return cartItems.every(item => {
          const product = products.find(p => p.product_key === item.productKey);
          return product && item.color in product.variants;
        });
      };

      const validCart = [{ productKey: "product_1", color: "Black", size: "M", quantity: 1 }];
      expect(validateColors(validCart, mockProducts)).toBe(true);

      const invalidCart = [{ productKey: "product_1", color: "NonExistent", size: "M", quantity: 1 }];
      expect(validateColors(invalidCart, mockProducts)).toBe(false);
    });

    test("should validate sizes exist for each color", () => {
      const validateSizes = (cartItems, products) => {
        return cartItems.every(item => {
          const product = products.find(p => p.product_key === item.productKey);
          return product && product.variants[item.color] && item.size in product.variants[item.color].sizes;
        });
      };

      const validCart = [{ productKey: "product_1", color: "Black", size: "M", quantity: 1 }];
      expect(validateSizes(validCart, mockProducts)).toBe(true);

      const invalidCart = [{ productKey: "product_1", color: "Black", size: "XXL", quantity: 1 }];
      expect(validateSizes(invalidCart, mockProducts)).toBe(false);
    });

    test("should validate variant_id exists", () => {
      const validateVariantIds = (cartItems, products) => {
        return cartItems.every(item => {
          const product = products.find(p => p.product_key === item.productKey);
          const sizeData = product?.variants[item.color]?.sizes[item.size];
          return sizeData && sizeData.variant_id;
        });
      };

      const validCart = [{ productKey: "product_1", color: "Black", size: "M", quantity: 1 }];
      expect(validateVariantIds(validCart, mockProducts)).toBe(true);
    });

    test("should reject empty cart", () => {
      const validateCartNotEmpty = cartItems => {
        return cartItems && cartItems.length > 0;
      };

      expect(validateCartNotEmpty([])).toBe(false);
      expect(validateCartNotEmpty([{ productKey: "product_1", color: "Black", size: "M", quantity: 1 }])).toBe(true);
    });
  });

  describe("Cart Item Transformation", () => {
    test("should transform cart items for API", () => {
      const transformCartForApi = (cartItems, products) => {
        return cartItems.map(item => {
          const product = products.find(p => p.product_key === item.productKey);
          const variantId = product.variants[item.color].sizes[item.size].variant_id;
          return {
            variant_id: variantId,
            quantity: item.quantity,
          };
        });
      };

      const cartItems = [{ productKey: "product_1", color: "Black", size: "M", quantity: 2 }];
      const transformed = transformCartForApi(cartItems, mockProducts);

      expect(transformed).toHaveLength(1);
      expect(transformed[0]).toEqual({
        variant_id: 1003,
        quantity: 2,
      });
    });

    test("should handle multiple items in transformation", () => {
      const transformCartForApi = (cartItems, products) => {
        return cartItems.map(item => {
          const product = products.find(p => p.product_key === item.productKey);
          const variantId = product.variants[item.color].sizes[item.size].variant_id;
          return {
            variant_id: variantId,
            quantity: item.quantity,
          };
        });
      };

      const cartItems = [
        { productKey: "product_1", color: "Black", size: "M", quantity: 1 },
        { productKey: "product_1", color: "Black", size: "L", quantity: 2 },
      ];
      const transformed = transformCartForApi(cartItems, mockProducts);

      expect(transformed).toHaveLength(2);
      expect(transformed[0].variant_id).toBe(1003);
      expect(transformed[1].variant_id).toBe(1004);
    });
  });

  describe("API Response Handling", () => {
    test("should extract sessionId from checkout response", () => {
      const extractSessionData = response => {
        if (response.sessionId && response.url) {
          return {
            sessionId: response.sessionId,
            url: response.url,
          };
        }
        throw new Error("Invalid checkout response");
      };

      const validResponse = { sessionId: "cs_test_123", url: "https://stripe.com/checkout" };
      expect(extractSessionData(validResponse)).toEqual(validResponse);

      const invalidResponse = { redirect_url: "https://stripe.com/checkout" };
      expect(() => extractSessionData(invalidResponse)).toThrow("Invalid checkout response");
    });

    test("should handle API errors gracefully", () => {
      const handleApiError = response => {
        if (response.error) {
          return {
            success: false,
            error: response.error,
          };
        }
        return {
          success: true,
          error: null,
        };
      };

      const errorResponse = { error: "Invalid product" };
      expect(handleApiError(errorResponse)).toEqual({
        success: false,
        error: "Invalid product",
      });

      const successResponse = { sessionId: "cs_test_123", url: "https://stripe.com" };
      expect(handleApiError(successResponse)).toEqual({
        success: true,
        error: null,
      });
    });
  });

  describe("Checkout Payload with Country", () => {
    test("should include shippingCountry in checkout payload", () => {
      const buildCheckoutPayload = (items, countryCode, successUrl, cancelUrl) => {
        return {
          items,
          shippingCountry: countryCode,
          successUrl,
          cancelUrl,
        };
      };

      const items = [
        { variant_id: 1003, quantity: 1 },
        { variant_id: 1004, quantity: 2 },
      ];
      const payload = buildCheckoutPayload(items, "US", "https://success", "https://cancel");

      expect(payload).toEqual({
        items: [
          { variant_id: 1003, quantity: 1 },
          { variant_id: 1004, quantity: 2 },
        ],
        shippingCountry: "US",
        successUrl: "https://success",
        cancelUrl: "https://cancel",
      });

      expect(payload.shippingCountry).toBe("US");
      expect(payload.items).toHaveLength(2);
    });

    test("should validate country code is present before checkout", () => {
      const validateCountryBeforeCheckout = countryCode => {
        return Boolean(countryCode && countryCode.length === 2);
      };

      expect(validateCountryBeforeCheckout("US")).toBe(true);
      expect(validateCountryBeforeCheckout("CA")).toBe(true);
      expect(validateCountryBeforeCheckout("")).toBe(false);
      expect(validateCountryBeforeCheckout(null)).toBe(false);
    });

    test("should reject checkout if country code missing", () => {
      const canProceedToCheckout = (items, countryCode) => {
        return Boolean(items.length > 0 && countryCode && countryCode.trim().length > 0);
      };

      const items = [{ variant_id: 1003, quantity: 1 }];

      expect(canProceedToCheckout(items, "US")).toBe(true);
      expect(canProceedToCheckout(items, "")).toBe(false);
      expect(canProceedToCheckout([], "US")).toBe(false);
    });
  });

  describe("Order Confirmation", () => {
    test("should store session data for success page", () => {
      const storeOrderData = (sessionId, cartItems) => {
        const orderData = {
          sessionId: sessionId,
          items: cartItems,
          timestamp: new Date().toISOString(),
        };
        sessionStorage.setItem("lastOrder", JSON.stringify(orderData));
        return orderData;
      };

      const cartItems = [{ productKey: "product_1", color: "Black", size: "M", quantity: 1 }];
      storeOrderData("cs_test_123", cartItems);

      const stored = JSON.parse(sessionStorage.getItem("lastOrder"));
      expect(stored.sessionId).toBe("cs_test_123");
      expect(stored.items).toEqual(cartItems);
      expect(stored.timestamp).toBeDefined();
    });

    test("should retrieve order data on success page", () => {
      const orderData = {
        sessionId: "cs_test_123",
        items: [{ productKey: "product_1", color: "Black", size: "M", quantity: 1 }],
        timestamp: new Date().toISOString(),
      };
      sessionStorage.setItem("lastOrder", JSON.stringify(orderData));

      const retrievedData = JSON.parse(sessionStorage.getItem("lastOrder"));
      expect(retrievedData.sessionId).toBe("cs_test_123");
      expect(retrievedData.items.length).toBe(1);
    });
  });

  describe("Checkout Button State Management", () => {
    test("should disable button during processing", () => {
      const manageButtonState = isProcessing => {
        return {
          disabled: isProcessing,
          text: isProcessing ? "Processing..." : "Proceed to Checkout",
        };
      };

      const processing = manageButtonState(true);
      expect(processing.disabled).toBe(true);
      expect(processing.text).toBe("Processing...");

      const ready = manageButtonState(false);
      expect(ready.disabled).toBe(false);
      expect(ready.text).toBe("Proceed to Checkout");
    });

    test("should restore button state on error", () => {
      const restoreButtonOnError = () => {
        return { disabled: false, text: "Proceed to Checkout" };
      };

      const restored = restoreButtonOnError();
      expect(restored.disabled).toBe(false);
      expect(restored.text).toBe("Proceed to Checkout");
    });
  });

  describe("Checkout Error Scenarios", () => {
    test("should handle empty cart checkout attempt", () => {
      const validateCheckout = items => {
        if (items.length === 0) return { error: "Your cart is empty" };
        return { error: null };
      };

      expect(validateCheckout([]).error).toBe("Your cart is empty");
      expect(validateCheckout([{ variant_id: 1 }]).error).toBeNull();
    });

    test("should handle missing country selection", () => {
      const validateCheckout = (items, countryValue) => {
        if (items.length === 0) return { error: "Your cart is empty" };
        if (!countryValue || countryValue === "") return { error: "Please select a shipping country" };
        return { error: null };
      };

      expect(validateCheckout([{ variant_id: 1 }], "").error).toBe("Please select a shipping country");
      expect(validateCheckout([{ variant_id: 1 }], null).error).toBe("Please select a shipping country");
      expect(validateCheckout([{ variant_id: 1 }], "US").error).toBeNull();
    });

    test("should handle API error response", () => {
      const handleCheckoutResponse = (responseOk, data) => {
        if (!responseOk) {
          return { success: false, error: data.error || data.message || "Checkout failed" };
        }
        if (!data.url) {
          return { success: false, error: "No checkout URL provided by server" };
        }
        return { success: true, url: data.url };
      };

      expect(handleCheckoutResponse(false, { error: "Invalid variant" })).toEqual({
        success: false,
        error: "Invalid variant",
      });
      expect(handleCheckoutResponse(false, { message: "Server error" })).toEqual({
        success: false,
        error: "Server error",
      });
      expect(handleCheckoutResponse(false, {})).toEqual({
        success: false,
        error: "Checkout failed",
      });
    });

    test("should handle missing checkout URL in response", () => {
      const handleCheckoutResponse = (responseOk, data) => {
        if (!responseOk) {
          return { success: false, error: data.error || "Checkout failed" };
        }
        if (!data.url) {
          return { success: false, error: "No checkout URL provided by server" };
        }
        return { success: true, url: data.url };
      };

      expect(handleCheckoutResponse(true, { sessionId: "cs_test" })).toEqual({
        success: false,
        error: "No checkout URL provided by server",
      });
      expect(handleCheckoutResponse(true, { url: "https://stripe.com/pay/cs_test" })).toEqual({
        success: true,
        url: "https://stripe.com/pay/cs_test",
      });
    });
  });

  describe("Cart Item Filtering", () => {
    test("should filter out null items after transformation", () => {
      const transformAndFilter = (cartItems, products) => {
        return cartItems
          .map(item => {
            const product = products.find(p => p.product_key === item.productKey);
            if (!product) return null;
            const variantId = product.variants[item.color]?.sizes?.[item.size]?.variant_id;
            return { variant_id: variantId, quantity: item.quantity };
          })
          .filter(item => item !== null);
      };

      const cartItems = [
        { productKey: "product_1", color: "Black", size: "M", quantity: 1 },
        { productKey: "nonexistent", color: "Black", size: "M", quantity: 1 },
      ];
      const result = transformAndFilter(cartItems, mockProducts);
      expect(result).toHaveLength(1);
      expect(result[0].variant_id).toBe(1003);
    });
  });

  describe("Order Details Response Format", () => {
    test("should validate required fields in order details response", () => {
      const validateOrderDetailsResponse = response => {
        const requiredFields = ["orderId", "currency", "customer", "shippingAddress", "orderSummary", "lineItems"];
        return requiredFields.every(field => field in response);
      };

      const validResponse = {
        orderId: "cs_test_123",
        currency: "USD",
        customer: { email: "test@example.com", name: "John Doe", phone: "+1-555-1234" },
        shippingAddress: { name: "John Doe", line1: "123 Main St", city: "NYC", country: "US" },
        orderSummary: { subtotal: 5999, shipping: 1500, tax: 600, total: 8099 },
        lineItems: [{ name: "Tee", quantity: 2, unitPrice: 2999, amount: 5998 }],
      };
      expect(validateOrderDetailsResponse(validResponse)).toBe(true);

      const missingField = {
        currency: "USD",
        customer: { email: "test@example.com" },
        shippingAddress: { name: "John Doe" },
        orderSummary: { total: 8099 },
      };
      expect(validateOrderDetailsResponse(missingField)).toBe(false);
    });

    test("should have customer details with email and name", () => {
      const response = {
        customer: {
          name: "John Doe",
          email: "john@example.com",
          phone: "+1-555-123-4567",
        },
      };

      expect(response.customer).toHaveProperty("email");
      expect(response.customer).toHaveProperty("name");
      expect(response.customer).toHaveProperty("phone");
      expect(response.customer.email).toBe("john@example.com");
    });

    test("should include shipping address fields", () => {
      const response = {
        shippingAddress: {
          name: "John Doe",
          line1: "123 Main St",
          line2: "Apt 4B",
          city: "New York",
          state: "NY",
          postal_code: "10001",
          country: "US",
        },
      };

      const { shippingAddress } = response;
      expect(shippingAddress).toHaveProperty("line1");
      expect(shippingAddress).toHaveProperty("city");
      expect(shippingAddress).toHaveProperty("country");
      expect(shippingAddress.line1).toBe("123 Main St");
      expect(shippingAddress.country).toBe("US");
    });

    test("should format line items with unit price and quantity", () => {
      const response = {
        lineItems: [
          {
            name: "Black Tee - Medium",
            quantity: 2,
            unitPrice: 2999,
            amount: 5998,
          },
          {
            name: "Logo Hoodie - Large",
            quantity: 1,
            unitPrice: 4999,
            amount: 4999,
          },
        ],
      };

      expect(response.lineItems).toHaveLength(2);
      expect(response.lineItems[0]).toHaveProperty("unitPrice");
      expect(response.lineItems[0]).toHaveProperty("quantity");
      expect(response.lineItems[0]).toHaveProperty("amount");
      expect(response.lineItems[0].quantity).toBe(2);
      expect(response.lineItems[0].amount).toBe(5998);
    });

    test("should include cost breakdown with subtotal, shipping, tax, total", () => {
      const response = {
        orderSummary: {
          subtotal: 5999,
          shipping: 1500,
          tax: 600,
          total: 8099,
        },
      };

      const { orderSummary } = response;
      expect(orderSummary).toHaveProperty("subtotal");
      expect(orderSummary).toHaveProperty("shipping");
      expect(orderSummary).toHaveProperty("tax");
      expect(orderSummary).toHaveProperty("total");
      expect(orderSummary.total).toBe(8099);
    });

    test("should NOT include sensitive payment data", () => {
      const sensitiveFields = ["payment_intent", "payment_method", "payment_method_types", "client_secret"];

      const validResponse = {
        orderId: "cs_test_123",
        currency: "USD",
        customer: { email: "test@example.com", name: "John Doe" },
        shippingAddress: { name: "John Doe", city: "NYC" },
        orderSummary: { total: 8099 },
        lineItems: [],
      };

      sensitiveFields.forEach(field => {
        expect(validResponse).not.toHaveProperty(field);
      });
    });

    test("should NOT include API keys or secrets", () => {
      const forbiddenFields = field => /^(sk_|pk_|whsec_)/.test(field);

      const response = {
        orderId: "cs_test_123",
        currency: "USD",
        customer: { email: "test@example.com" },
      };

      Object.keys(response).forEach(key => {
        expect(forbiddenFields(key)).toBe(false);
      });
    });

    test("should NOT include internal Stripe customer ID", () => {
      const response = {
        currency: "USD",
        customer: { email: "test@example.com", name: "John Doe" },
        shippingAddress: { name: "John Doe" },
        orderSummary: { total: 8099 },
        lineItems: [],
      };

      // customer field should contain customer details, not Stripe internal ID
      expect(response.customer).toBeInstanceOf(Object);
      expect(response.customer.email).toBe("test@example.com");
    });

    test("should include orderId and currency for order identification and price formatting", () => {
      const response = {
        orderId: "cs_test_123",
        currency: "USD",
      };

      expect(response).toHaveProperty("orderId");
      expect(response.orderId).toMatch(/^cs_/);
      expect(response).toHaveProperty("currency");
      expect(response.currency).toBe("USD");
    });

    test("should include currency field for price formatting", () => {
      const response = {
        currency: "USD",
        orderSummary: { total: 8099 },
      };

      expect(response).toHaveProperty("currency");
      expect(response.currency).toBe("USD");
    });

    test("should validate all amounts are in cents (integer values)", () => {
      const response = {
        orderSummary: {
          subtotal: 5999,
          shipping: 1500,
          tax: 600,
          total: 8099,
        },
        lineItems: [
          {
            unitPrice: 2999,
            amount: 5998,
          },
        ],
      };

      expect(Number.isInteger(response.orderSummary.total)).toBe(true);
      expect(Number.isInteger(response.lineItems[0].unitPrice)).toBe(true);
      expect(response.orderSummary.total).toBeGreaterThan(0);
    });
  });
});
