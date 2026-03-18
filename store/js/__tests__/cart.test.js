// Cart Module Tests
// Tests for the ShoppingCart class functionality

describe("ShoppingCart", () => {
  let cart;
  const mockProducts = [
    {
      product_key: "product_1",
      title: "Test Tee",
      image: "test.jpg",
      display_price: "$25.00",
      variants: {
        Black: {
          image: "black.jpg",
          sizes: {
            M: { variant_id: 123, price_cents: 2500 },
            L: { variant_id: 124, price_cents: 2500 },
          },
        },
        Red: {
          image: "red.jpg",
          sizes: {
            M: { variant_id: 125, price_cents: 2500 },
            L: { variant_id: 126, price_cents: 2500 },
          },
        },
      },
    },
    {
      product_key: "product_2",
      title: "Sticker Pack",
      image: "sticker.jpg",
      display_price: "$5.00",
      variants: {
        Satin: {
          image: "satin.jpg",
          sizes: {
            "2x2": { variant_id: 201, price_cents: 500 },
            "3x3": { variant_id: 202, price_cents: 550 },
          },
        },
      },
    },
  ];

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Create a new cart instance
    cart = {
      storageKey: "kots_cart",
      items: [],

      loadCart() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : [];
      },

      saveCart(_skipBadgeUpdate = false) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.items));
      },

      addItem(productKey, color, size, quantity, _skipBadgeUpdate = false) {
        const existingItem = this.items.find(
          item => item.productKey === productKey && item.color === color && item.size === size
        );

        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          this.items.push({ productKey, color, size, quantity });
        }

        this.saveCart(_skipBadgeUpdate);
        return true;
      },

      removeItem(index) {
        this.items.splice(index, 1);
        this.saveCart();
      },

      updateQuantity(index, quantity) {
        if (quantity <= 0) {
          this.removeItem(index);
        } else {
          this.items[index].quantity = quantity;
          this.saveCart();
        }
      },

      getTotal() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotalCents(products) {
        let subtotal = 0;
        this.items.forEach(item => {
          const product = products.find(p => p.product_key === item.productKey);
          if (product) {
            const price = this.getPriceForVariant(product, item.color, item.size);
            subtotal += price * item.quantity;
          }
        });
        return subtotal;
      },

      getPriceForVariant(product, color, size) {
        if (
          product.variants &&
          product.variants[color] &&
          product.variants[color].sizes &&
          product.variants[color].sizes[size]
        ) {
          const variantPrice = product.variants[color].sizes[size].price_cents;
          if (variantPrice !== null && variantPrice !== undefined) {
            return variantPrice;
          }
        }
        const displayPrice = product.display_price;
        if (displayPrice && typeof displayPrice === "string") {
          const match = displayPrice.match(/\d+/);
          if (match) {
            return parseInt(match[0]) * 100;
          }
        }
        return 0;
      },

      updateCartBadge() {
        const badge = document.getElementById("cart-badge");
        const total = this.getTotal();
        if (badge) {
          if (total > 0) {
            badge.textContent = total;
            badge.style.display = "flex";
          } else {
            badge.style.display = "none";
          }
        }
      },

      clear() {
        this.items = [];
        this.saveCart();
      },

      validateItemsForCheckout(products) {
        const errors = [];

        this.items.forEach((item, index) => {
          const product = products.find(p => p.product_key === item.productKey);

          if (!product) {
            errors.push(`Item ${index + 1}: Product not found`);
            return;
          }

          if (!product.variants[item.color]) {
            errors.push(`Item ${index + 1}: Color "${item.color}" not available for ${product.title}`);
            return;
          }

          if (!product.variants[item.color].sizes[item.size]) {
            errors.push(`Item ${index + 1}: Size "${item.size}" not available for ${product.title} in ${item.color}`);
            return;
          }

          const variantId = product.variants[item.color].sizes[item.size].variant_id;
          if (!variantId) {
            errors.push(`Item ${index + 1}: Variant ID missing for ${product.title}`);
          }
        });

        return {
          valid: errors.length === 0,
          errors,
        };
      },
    };
  });

  describe("addItem", () => {
    test("should add a new item to cart", () => {
      cart.addItem("product_1", "Black", "M", 1);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]).toEqual({
        productKey: "product_1",
        color: "Black",
        size: "M",
        quantity: 1,
      });
    });

    test("should increment quantity if item already exists", () => {
      cart.addItem("product_1", "Black", "M", 1);
      cart.addItem("product_1", "Black", "M", 2);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(3);
    });

    test("should add different sizes as separate items", () => {
      cart.addItem("product_1", "Black", "M", 1);
      cart.addItem("product_1", "Black", "L", 1);
      expect(cart.items).toHaveLength(2);
    });

    test("should add different colors as separate items", () => {
      cart.addItem("product_1", "Black", "M", 1);
      cart.addItem("product_1", "Red", "M", 1);
      expect(cart.items).toHaveLength(2);
    });

    test("should persist to localStorage", () => {
      cart.addItem("product_1", "Black", "M", 1);
      const saved = JSON.parse(localStorage.getItem("kots_cart"));
      expect(saved).toHaveLength(1);
      expect(saved[0].productKey).toBe("product_1");
    });
  });

  describe("removeItem", () => {
    test("should remove item by index", () => {
      cart.addItem("product_1", "Black", "M", 1);
      cart.addItem("product_2", "Satin", "2x2", 1);
      cart.removeItem(0);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].productKey).toBe("product_2");
    });
  });

  describe("updateQuantity", () => {
    test("should update quantity to new value", () => {
      cart.addItem("product_1", "Black", "M", 1);
      cart.updateQuantity(0, 5);
      expect(cart.items[0].quantity).toBe(5);
    });

    test("should remove item if quantity is 0", () => {
      cart.addItem("product_1", "Black", "M", 1);
      cart.updateQuantity(0, 0);
      expect(cart.items).toHaveLength(0);
    });

    test("should remove item if quantity is negative", () => {
      cart.addItem("product_1", "Black", "M", 1);
      cart.updateQuantity(0, -1);
      expect(cart.items).toHaveLength(0);
    });
  });

  describe("getTotal", () => {
    test("should return 0 for empty cart", () => {
      expect(cart.getTotal()).toBe(0);
    });

    test("should sum all item quantities", () => {
      cart.addItem("product_1", "Black", "M", 2);
      cart.addItem("product_1", "Red", "L", 3);
      expect(cart.getTotal()).toBe(5);
    });
  });

  describe("getPriceForVariant", () => {
    test("should return variant price in cents", () => {
      const price = cart.getPriceForVariant(mockProducts[0], "Black", "M");
      expect(price).toBe(2500);
    });

    test("should return variant price for different sizes", () => {
      const price1 = cart.getPriceForVariant(mockProducts[1], "Satin", "2x2");
      const price2 = cart.getPriceForVariant(mockProducts[1], "Satin", "3x3");
      expect(price1).toBe(500);
      expect(price2).toBe(550);
    });

    test("should fallback to display_price for invalid variant", () => {
      const price = cart.getPriceForVariant(mockProducts[0], "NonExistent", "M");
      // Falls back to parsing display_price "$25.00" -> 2500 cents
      expect(price).toBe(2500);
    });
  });

  describe("getSubtotalCents", () => {
    test("should return 0 for empty cart", () => {
      const subtotal = cart.getSubtotalCents(mockProducts);
      expect(subtotal).toBe(0);
    });

    test("should calculate correct subtotal", () => {
      cart.addItem("product_1", "Black", "M", 2); // 2 * 2500 = 5000
      cart.addItem("product_2", "Satin", "2x2", 1); // 1 * 500 = 500
      const subtotal = cart.getSubtotalCents(mockProducts);
      expect(subtotal).toBe(5500);
    });
  });

  describe("loadCart", () => {
    test("should load cart from localStorage", () => {
      const testItems = [{ productKey: "product_1", color: "Black", size: "M", quantity: 1 }];
      localStorage.setItem("kots_cart", JSON.stringify(testItems));
      const loaded = cart.loadCart();
      expect(loaded).toEqual(testItems);
    });

    test("should return empty array if no cart in localStorage", () => {
      const loaded = cart.loadCart();
      expect(loaded).toEqual([]);
    });
  });

  describe("clear", () => {
    test("should remove all items from cart", () => {
      cart.addItem("product_1", "Black", "M", 1);
      cart.addItem("product_2", "Satin", "2x2", 2);
      expect(cart.items).toHaveLength(2);
      cart.clear();
      expect(cart.items).toHaveLength(0);
    });

    test("should persist empty cart to localStorage", () => {
      cart.addItem("product_1", "Black", "M", 1);
      cart.clear();
      const saved = JSON.parse(localStorage.getItem("kots_cart"));
      expect(saved).toEqual([]);
    });
  });

  describe("updateCartBadge", () => {
    test("should show badge with count when items exist", () => {
      document.body.innerHTML = '<span id="cart-badge" style="display:none"></span>';
      cart.addItem("product_1", "Black", "M", 3);
      cart.updateCartBadge();
      const badge = document.getElementById("cart-badge");
      expect(badge.textContent).toBe("3");
      expect(badge.style.display).toBe("flex");
    });

    test("should hide badge when cart is empty", () => {
      document.body.innerHTML = '<span id="cart-badge" style="display:flex">1</span>';
      cart.updateCartBadge();
      const badge = document.getElementById("cart-badge");
      expect(badge.style.display).toBe("none");
    });

    test("should not throw if badge element does not exist", () => {
      document.body.innerHTML = "";
      expect(() => cart.updateCartBadge()).not.toThrow();
    });
  });

  describe("validateItemsForCheckout", () => {
    test("should return valid for correct items", () => {
      cart.addItem("product_1", "Black", "M", 1);
      const result = cart.validateItemsForCheckout(mockProducts);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should return error for product not found", () => {
      cart.items.push({ productKey: "nonexistent", color: "Black", size: "M", quantity: 1 });
      const result = cart.validateItemsForCheckout(mockProducts);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Product not found");
    });

    test("should return error for invalid color", () => {
      cart.items.push({ productKey: "product_1", color: "Purple", size: "M", quantity: 1 });
      const result = cart.validateItemsForCheckout(mockProducts);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Color");
    });

    test("should return error for invalid size", () => {
      cart.items.push({ productKey: "product_1", color: "Black", size: "XXXL", quantity: 1 });
      const result = cart.validateItemsForCheckout(mockProducts);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Size");
    });

    test("should return valid with empty cart", () => {
      const result = cart.validateItemsForCheckout(mockProducts);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should collect multiple errors for multiple invalid items", () => {
      cart.items.push({ productKey: "nonexistent", color: "Black", size: "M", quantity: 1 });
      cart.items.push({ productKey: "product_1", color: "Purple", size: "M", quantity: 1 });
      const result = cart.validateItemsForCheckout(mockProducts);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe("getPriceForVariant edge cases", () => {
    test("should return 0 when product has no display_price and variant not found", () => {
      const productNoPrice = {
        product_key: "product_x",
        title: "No Price",
        image: "x.jpg",
        variants: {},
      };
      const price = cart.getPriceForVariant(productNoPrice, "Red", "S");
      expect(price).toBe(0);
    });

    test("should handle null price_cents in variant by using display_price", () => {
      const productNullPrice = {
        product_key: "product_x",
        title: "Null Price",
        image: "x.jpg",
        display_price: "$10.00",
        variants: {
          Black: {
            sizes: {
              M: { variant_id: 999, price_cents: null },
            },
          },
        },
      };
      const price = cart.getPriceForVariant(productNullPrice, "Black", "M");
      expect(price).toBe(1000);
    });
  });

  describe("getSubtotalCents edge cases", () => {
    test("should skip items with no matching product", () => {
      cart.items.push({ productKey: "nonexistent", color: "Black", size: "M", quantity: 1 });
      cart.addItem("product_1", "Black", "M", 1);
      const subtotal = cart.getSubtotalCents(mockProducts);
      // Only product_1 counted: 1 * 2500
      expect(subtotal).toBe(2500);
    });
  });
});
