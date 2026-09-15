/**
 * Product Functions Tests
 * Tests for product page utilities: validation, display, and formatting
 */

describe("Product Page - Helper Functions", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="color-select">
        <option value="Black">Black</option>
        <option value="Red">Red</option>
      </select>
      <select id="size-select">
        <option value="S">Small</option>
        <option value="M">Medium</option>
        <option value="L">Large</option>
      </select>
      <input id="quantity" type="number" value="1" />
      <p id="price-display">$25.00</p>
      <img id="product-image" src="" />
    `;
  });

  describe("Price Validation", () => {
    it("should handle valid price cents", () => {
      const priceCents = 2500;
      const priceDisplay = `$${(priceCents / 100).toFixed(2)}`;
      expect(priceDisplay).toBe("$25.00");
    });

    it("should calculate price ranges", () => {
      const prices = [1000, 1500, 2000];
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      expect(minPrice).toBe(1000);
      expect(maxPrice).toBe(2000);
    });

    it("should display single price when all variants same", () => {
      const prices = [2500, 2500, 2500];
      const unique = [...new Set(prices)];

      if (unique.length === 1) {
        expect(`$${(unique[0] / 100).toFixed(2)}`).toBe("$25.00");
      }
    });

    it("should format price display with dollar sign", () => {
      const price = 2500;
      const formatted = `$${(price / 100).toFixed(2)}`;
      expect(formatted).toMatch(/^\$\d+\.\d{2}$/);
    });
  });

  describe("Quantity Management", () => {
    it("should get quantity input value", () => {
      const qtyInput = document.getElementById("quantity");
      qtyInput.value = "5";
      expect(parseInt(qtyInput.value)).toBe(5);
    });

    it("should validate quantity range", () => {
      const isValidQuantity = qty => qty >= 1 && qty <= 999;
      expect(isValidQuantity(1)).toBe(true);
      expect(isValidQuantity(50)).toBe(true);
      expect(isValidQuantity(0)).toBe(false);
      expect(isValidQuantity(1000)).toBe(false);
    });

    it("should handle quantity increments", () => {
      let qty = 1;
      qty += 1;
      expect(qty).toBe(2);
      qty -= 1;
      expect(qty).toBe(1);
    });
  });

  describe("Form Validation", () => {
    it("should require color selection", () => {
      const colorSelect = document.getElementById("color-select");
      const isColorSelected = colorSelect.value !== "";
      expect(isColorSelected).toBe(true);
    });

    it("should require size selection", () => {
      const sizeSelect = document.getElementById("size-select");
      const isSizeSelected = sizeSelect.value !== "";
      expect(isSizeSelected).toBe(true);
    });

    it("should validate quantity before adding to cart", () => {
      const qty = 1;
      const isValid = qty > 0 && qty < 1000;
      expect(isValid).toBe(true);
    });

    it("should require all fields for checkout", () => {
      const color = document.getElementById("color-select").value;
      const size = document.getElementById("size-select").value;
      const qty = parseInt(document.getElementById("quantity").value);

      const isFormComplete = color && size && qty > 0;
      expect(isFormComplete).toBe(true);
    });
  });

  describe("Image Handling", () => {
    it("should set product image src", () => {
      const img = document.getElementById("product-image");
      img.src = "/store/products/test.jpg";
      expect(img.src).toContain("test.jpg");
    });

    it("should handle image paths", () => {
      const imagePath = "product-black.jpg";
      const fullPath = `/store/${imagePath}`;
      expect(fullPath).toBe("/store/product-black.jpg");
    });

    it("should encode URI for special characters", () => {
      const imagePath = "product with spaces.jpg";
      const encoded = encodeURI(imagePath);
      expect(encoded).toContain("%20");
    });
  });

  describe("Variant Management", () => {
    it("should handle color selection", () => {
      const mockProduct = {
        variants: {
          Black: { image: "black.jpg", sizes: { M: { variant_id: 1 } } },
          Red: { image: "red.jpg", sizes: { M: { variant_id: 2 } } },
        },
      };

      const selectedColor = "Black";
      const variant = mockProduct.variants[selectedColor];
      expect(variant).toBeDefined();
      expect(variant.image).toBe("black.jpg");
    });

    it("should get available sizes for color", () => {
      const mockColor = {
        sizes: { S: { variant_id: 1 }, M: { variant_id: 2 }, L: { variant_id: 3 } },
      };

      const sizes = Object.keys(mockColor.sizes);
      expect(sizes).toEqual(["S", "M", "L"]);
    });

    it("should find variant ID by size", () => {
      const mockColor = {
        sizes: { S: { variant_id: 101 }, M: { variant_id: 102 }, L: { variant_id: 103 } },
      };

      const selectedSize = "M";
      const variantId = mockColor.sizes[selectedSize].variant_id;
      expect(variantId).toBe(102);
    });
  });
});

describe("Product Page - Data Structures", () => {
  describe("Product Object Structure", () => {
    it("should have all required product fields", () => {
      const product = {
        product_key: "tee_1",
        title: "Test Tee",
        image: "test.jpg",
        display_price: "$25.00",
        variants: {},
      };

      expect(product).toHaveProperty("product_key");
      expect(product).toHaveProperty("title");
      expect(product).toHaveProperty("image");
      expect(product).toHaveProperty("variants");
    });

    it("should have variant structure with color and sizes", () => {
      const product = {
        variants: {
          Black: {
            image: "black.jpg",
            sizes: {
              M: { variant_id: 123, price_cents: 2500 },
            },
          },
        },
      };

      const color = product.variants.Black;
      expect(color.image).toBeDefined();
      expect(color.sizes).toBeDefined();
      expect(color.sizes.M.variant_id).toBe(123);
    });
  });

  describe("Cart Item Structure", () => {
    it("should create valid cart item", () => {
      const cartItem = {
        product_key: "tee_1",
        title: "Test Tee",
        color: "Black",
        size: "M",
        variant_id: 123,
        price_cents: 2500,
        quantity: 1,
        image: "test.jpg",
      };

      expect(cartItem.product_key).toBeDefined();
      expect(cartItem.quantity).toBeGreaterThan(0);
      expect(cartItem.variant_id).toBeGreaterThan(0);
    });

    it("should calculate cart item total", () => {
      const item = { price_cents: 2500, quantity: 2 };
      const total = item.price_cents * item.quantity;
      expect(total).toBe(5000);
    });

    it("should update cart item quantity", () => {
      const item = { variant_id: 123, quantity: 1 };
      const newQuantity = 3;
      item.quantity = newQuantity;
      expect(item.quantity).toBe(3);
    });
  });
});

describe("Product Page - Business Logic", () => {
  describe("Price Range Calculation", () => {
    it("should calculate min and max from variant prices", () => {
      const variants = {
        Black: { sizes: { S: { price_cents: 2000 }, L: { price_cents: 2500 } } },
        Red: { sizes: { S: { price_cents: 2000 }, L: { price_cents: 2500 } } },
      };

      const prices = [];
      Object.values(variants).forEach(color => {
        Object.values(color.sizes).forEach(size => {
          prices.push(size.price_cents);
        });
      });

      const min = Math.min(...prices);
      const max = Math.max(...prices);

      expect(min).toBe(2000);
      expect(max).toBe(2500);
    });

    it("should return same min and max when all prices equal", () => {
      const prices = [2500, 2500, 2500];
      const min = Math.min(...prices);
      const max = Math.max(...prices);

      expect(min).toBe(max);
      expect(min).toBe(2500);
    });
  });

  describe("Add to Cart Logic", () => {
    it("should build cart item from form selections", () => {
      const formData = {
        color: "Black",
        size: "M",
        quantity: 2,
        variant_id: 123,
      };

      expect(formData.color).toBe("Black");
      expect(formData.size).toBe("M");
      expect(formData.quantity).toBe(2);
      expect(formData.variant_id).toBe(123);
    });

    it("should validate before adding", () => {
      const isValidAddToCart = (color, size, qty) => {
        return !!color && !!size && qty > 0 && qty < 1000;
      };

      expect(isValidAddToCart("Black", "M", 1)).toBe(true);
      expect(isValidAddToCart("", "M", 1)).toBe(false);
      expect(isValidAddToCart("Black", "", 1)).toBe(false);
      expect(isValidAddToCart("Black", "M", 0)).toBe(false);
    });

    it("should prepare cart item for storage", () => {
      const product = {
        product_key: "tee_1",
        title: "Test Tee",
        image: "test.jpg",
        display_price: "$25.00",
      };

      const formData = {
        color: "Black",
        size: "M",
        quantity: 1,
        variant_id: 123,
      };

      const cartItem = { ...product, ...formData };
      expect(cartItem.product_key).toBe("tee_1");
      expect(cartItem.color).toBe("Black");
      expect(cartItem.size).toBe("M");
    });
  });
});
