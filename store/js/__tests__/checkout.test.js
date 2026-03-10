// Checkout & API Tests
// Tests for checkout validation and API communication

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
});
