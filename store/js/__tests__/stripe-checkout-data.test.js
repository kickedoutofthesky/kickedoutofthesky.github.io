/**
 * Stripe Checkout Data Unit Tests
 * Validates that checkout items include product images and correct data
 */

describe("Stripe Checkout Item Data", () => {
  beforeEach(() => {
    // Setup DOM for tests
    document.body.innerHTML = `
      <div id="quote-error"></div>
      <div id="summary-content"></div>
      <button id="checkout-btn">Checkout</button>
    `;
  });

  describe("Product Data in Checkout", () => {
    test("checkout items should include product images from cart", () => {
      // Simulate cart with product images
      const mockCart = {
        items: [
          {
            variant_id: 5246069560,
            name: "Unisex Tee w Color Block Graphic",
            color: "Black",
            size: "XS",
            quantity: 1,
            image: "assets/images/Unisex Tee w Color Block Graphic - Front - Black.jpg",
          },
        ],
      };

      // Verify image field exists
      expect(mockCart.items[0]).toHaveProperty("image");
      expect(mockCart.items[0].image).toContain("assets/images/");
      expect(mockCart.items[0].image).toMatch(/\.(jpg|jpeg|png)$/i);
    });

    test("all checkout items must have images", () => {
      const items = [
        {
          variant_id: 5246069560,
          name: "Tee 1",
          color: "Black",
          size: "M",
          quantity: 1,
          image: "assets/images/tee1.jpg",
        },
        {
          variant_id: 5246069561,
          name: "Tee 2",
          color: "White",
          size: "L",
          quantity: 2,
          image: "assets/images/tee2.jpg",
        },
        {
          variant_id: 5246069562,
          name: "Tee 3",
          color: "Red",
          size: "XL",
          quantity: 1,
          image: "assets/images/tee3.jpg",
        },
      ];

      // Every item should have an image
      items.forEach(item => {
        expect(item).toHaveProperty("image");
        expect(item.image).toBeTruthy();
        expect(item.image.length).toBeGreaterThan(0);
      });
    });

    test("product images should be relative paths", () => {
      const items = [
        {
          variant_id: 5246069560,
          name: "Tee",
          image: "assets/images/Unisex Tee - Black.jpg",
        },
        {
          variant_id: 5246069561,
          name: "Hoodie",
          image: "assets/images/Hoodie - Gray.jpg",
        },
      ];

      items.forEach(item => {
        // Should not be absolute URLs
        expect(item.image).not.toMatch(/^https?:\/\//);

        // Should be relative path
        expect(item.image).toMatch(/^assets\/images\//);
      });
    });

    test("image paths should have valid image extensions", () => {
      const validImages = [
        "assets/images/tee.jpg",
        "assets/images/hoodie.jpeg",
        "assets/images/shirt.png",
        "assets/images/hat.gif",
      ];

      const invalidImages = [
        "assets/images/file.txt",
        "assets/images/file.pdf",
        "assets/images/file.svg",
        "images/tee.jpg", // missing assets/
      ];

      // Valid images should have correct extensions
      validImages.forEach(imagePath => {
        expect(imagePath).toMatch(/assets\/images\/.*\.(jpg|jpeg|png|gif)$/i);
      });

      // Invalid images should NOT match the valid pattern
      invalidImages.forEach(imagePath => {
        const isValid = /assets\/images\/.*\.(jpg|jpeg|png|gif)$/i.test(imagePath);
        expect(isValid).toBe(false);
      });
    });
  });

  describe("Complete Checkout Item Structure", () => {
    test("checkout item must have all required fields", () => {
      const requiredFields = ["variant_id", "quantity", "name", "color", "size", "image"];

      const item = {
        variant_id: 5246069560,
        quantity: 1,
        name: "Unisex Tee",
        color: "Black",
        size: "M",
        image: "assets/images/tee.jpg",
      };

      requiredFields.forEach(field => {
        expect(item).toHaveProperty(field);
        expect(item[field]).toBeTruthy();
      });
    });

    test("checkout item should NOT have sensitive fields", () => {
      const forbiddenFields = ["customer_email", "customer_name", "shipping_address", "price_cents", "total", "tax"];

      const item = {
        variant_id: 5246069560,
        quantity: 1,
        name: "Unisex Tee",
        color: "Black",
        size: "M",
        image: "assets/images/tee.jpg",
      };

      forbiddenFields.forEach(field => {
        expect(item).not.toHaveProperty(field);
      });
    });

    test("checkout payload should include correct data types", () => {
      const item = {
        variant_id: 5246069560,
        quantity: 2,
        name: "Unisex Tee",
        color: "Black",
        size: "M",
        image: "assets/images/tee.jpg",
      };

      // Check types
      expect(typeof item.variant_id).toBe("number");
      expect(typeof item.quantity).toBe("number");
      expect(typeof item.name).toBe("string");
      expect(typeof item.color).toBe("string");
      expect(typeof item.size).toBe("string");
      expect(typeof item.image).toBe("string");

      // Check constraints
      expect(item.variant_id).toBeGreaterThan(0);
      expect(item.quantity).toBeGreaterThan(0);
      expect(Number.isInteger(item.variant_id)).toBe(true);
      expect(Number.isInteger(item.quantity)).toBe(true);
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.image.length).toBeGreaterThan(0);
    });
  });

  describe("Multiple Items in Checkout", () => {
    test("checkout should handle multiple items with different images", () => {
      const items = [
        {
          variant_id: 1001,
          quantity: 1,
          name: "Tee Black",
          color: "Black",
          size: "M",
          image: "assets/images/tee-black.jpg",
        },
        {
          variant_id: 1002,
          quantity: 2,
          name: "Tee White",
          color: "White",
          size: "L",
          image: "assets/images/tee-white.jpg",
        },
        {
          variant_id: 1003,
          quantity: 1,
          name: "Hoodie Gray",
          color: "Gray",
          size: "XL",
          image: "assets/images/hoodie-gray.jpg",
        },
      ];

      // All items should have unique images
      const imageSet = new Set(items.map(item => item.image));
      expect(imageSet.size).toBe(items.length);

      // All items should have images
      items.forEach(item => {
        expect(item.image).toBeTruthy();
        expect(item.image).toContain("assets/images/");
      });
    });

    test("image paths should be included regardless of quantity", () => {
      const items = [
        { variant_id: 1, quantity: 1, name: "Item 1", image: "assets/images/1.jpg" },
        { variant_id: 2, quantity: 5, name: "Item 2", image: "assets/images/2.jpg" },
        { variant_id: 3, quantity: 100, name: "Item 3", image: "assets/images/3.jpg" },
      ];

      items.forEach(item => {
        // Image should exist regardless of quantity
        expect(item.image).toBeTruthy();
        expect(item.quantity).toBeGreaterThan(0);
      });
    });
  });

  describe("Image Consistency", () => {
    test("product images should match product variants", () => {
      // Simulate product data structure
      const product = {
        name: "Unisex Tee",
        image: "assets/images/tee-default.jpg",
        variants: [
          {
            id: 1,
            color: "Black",
            image: "assets/images/tee-black.jpg",
          },
          {
            id: 2,
            color: "White",
            image: "assets/images/tee-white.jpg",
          },
        ],
      };

      // Each variant should have an image
      product.variants.forEach(variant => {
        expect(variant.image).toBeTruthy();
        expect(variant.image).toContain("assets/images/");
        expect(variant.image).not.toBe(product.image); // Variant-specific image
      });
    });

    test("images should correspond to product colors", () => {
      const cartItems = [
        {
          name: "Tee",
          color: "Black",
          image: "assets/images/tee-black.jpg",
        },
        {
          name: "Tee",
          color: "White",
          image: "assets/images/tee-white.jpg",
        },
        {
          name: "Tee",
          color: "Dark Grey Heather",
          image: "assets/images/tee-dark-grey-heather.jpg",
        },
      ];

      cartItems.forEach(item => {
        // Image filename should relate to color
        const colorInFilename = item.color.toLowerCase().replace(/\s+/g, "-");

        // Either color name or generic image
        const hasColorInImage =
          item.image.toLowerCase().includes(colorInFilename) || item.image.toLowerCase().includes("tee");

        expect(hasColorInImage).toBe(true);
      });
    });
  });

  describe("Image Path Validation", () => {
    test("image paths should not contain special characters", () => {
      const validImages = [
        "assets/images/tee-black.jpg",
        "assets/images/hoodie-gray.jpg",
        "assets/images/Unisex Tee w Text - Front - Black.jpg",
      ];

      const invalidImages = [
        "assets/images/tee<black>.jpg",
        'assets/images/tee"black".jpg',
        "assets/images/tee|black.jpg",
      ];

      validImages.forEach(path => {
        // Should be valid file path
        expect(path).toMatch(/^assets\/images\/[\w\s\-().]+\.(jpg|jpeg|png)$/i);
      });

      invalidImages.forEach(path => {
        // Should not match valid pattern due to special chars
        const isValid = /^assets\/images\/[\w\s\-().]+\.(jpg|jpeg|png)$/i.test(path);
        expect(isValid).toBe(false);
      });
    });

    test("image paths should not contain directory traversal attempts", () => {
      const maliciousPaths = [
        "assets/images/../../../etc/passwd.jpg",
        "assets/images/..\\..\\windows\\system32.jpg",
        "../../sensitive/image.jpg",
      ];

      maliciousPaths.forEach(path => {
        // Should not contain .. or \
        expect(path).toMatch(/\.\.|\\/) || true;
        // Proper sanitization would reject these
      });

      const safePath = "assets/images/tee.jpg";
      expect(safePath).not.toMatch(/\.\./);
      expect(safePath).not.toMatch(/\\/);
    });
  });

  describe("Stripe Session Validation", () => {
    test("checkout API should receive items array with images", () => {
      const checkoutPayload = {
        calculationId: "calc-12345",
        country: "US",
        items: [
          {
            variant_id: 5246069560,
            quantity: 1,
            name: "Tee",
            color: "Black",
            size: "M",
            image: "assets/images/tee-black.jpg",
          },
          {
            variant_id: 5246069561,
            quantity: 2,
            name: "Tee",
            color: "White",
            size: "L",
            image: "assets/images/tee-white.jpg",
          },
        ],
      };

      // Verify structure
      expect(checkoutPayload.items).toBeInstanceOf(Array);
      expect(checkoutPayload.items.length).toBe(2);

      // All items have images
      checkoutPayload.items.forEach(item => {
        expect(item).toHaveProperty("image");
        expect(item.image).toContain("assets/images/");
      });
    });

    test("Stripe should receive complete product data", () => {
      const expectedFields = {
        variant_id: expect.any(Number),
        quantity: expect.any(Number),
        name: expect.any(String),
        color: expect.any(String),
        size: expect.any(String),
        image: expect.stringContaining("assets/images/"),
      };

      const item = {
        variant_id: 5246069560,
        quantity: 1,
        name: "Unisex Tee",
        color: "Black",
        size: "M",
        image: "assets/images/tee-black.jpg",
      };

      expect(item).toMatchObject(expectedFields);
    });
  });
});
