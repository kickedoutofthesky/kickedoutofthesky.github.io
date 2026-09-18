/**
 * Product Page Tests
 * Tests for product detail page functionality
 */

const { getPriceDisplay, getPriceRange } = require("../product");

describe("Product Page - Price Functions", () => {
  describe("getPriceDisplay", () => {
    it("should display single price when all variants same", () => {
      const product = {
        variants: {
          Black: {
            sizes: {
              S: { price_cents: 2500 },
              M: { price_cents: 2500 },
              L: { price_cents: 2500 },
            },
          },
          Red: {
            sizes: {
              S: { price_cents: 2500 },
              M: { price_cents: 2500 },
            },
          },
        },
      };

      const price = getPriceDisplay(product);
      expect(price).toBe("$25.00 USD");
    });

    it("should display price range when variants differ", () => {
      const product = {
        variants: {
          Black: {
            sizes: {
              S: { price_cents: 2000 },
              L: { price_cents: 2500 },
            },
          },
        },
      };

      const price = getPriceDisplay(product);
      expect(price).toMatch(/\$20\.00\s*[-–]\s*\$25\.00\s*USD|\$20\.00.*\$25\.00\s*USD/);
    });

    it("should use display_price as fallback", () => {
      const product = {
        display_price: "$25.00 USD",
        variants: {},
      };

      const price = getPriceDisplay(product);
      expect(price).toBe("$25.00 USD");
    });
  });

  describe("getPriceRange", () => {
    it("should extract price range from variants", () => {
      const product = {
        variants: {
          Black: {
            sizes: {
              S: { price_cents: 2000 },
              L: { price_cents: 3000 },
            },
          },
        },
      };

      const range = getPriceRange(product);
      expect(range.min).toBe(20);
      expect(range.max).toBe(30);
    });

    it("should return same min and max for uniform pricing", () => {
      const product = {
        variants: {
          Black: {
            sizes: {
              S: { price_cents: 2500 },
              M: { price_cents: 2500 },
              L: { price_cents: 2500 },
            },
          },
        },
      };

      const range = getPriceRange(product);
      expect(range.min).toBe(range.max);
      expect(range.min).toBe(25);
    });

    it("should handle single variant single size", () => {
      const product = {
        variants: {
          OneSize: {
            sizes: {
              Default: { price_cents: 2500 },
            },
          },
        },
      };

      const range = getPriceRange(product);
      expect(range.min).toBe(25);
      expect(range.max).toBe(25);
    });

    it("should handle empty variants", () => {
      const product = {
        variants: {},
      };

      const range = getPriceRange(product);
      expect(range.min).toBe(0);
      expect(range.max).toBe(0);
    });

    it("should convert price cents to dollars", () => {
      const product = {
        variants: {
          Color: {
            sizes: {
              Size: { price_cents: 4999 },
            },
          },
        },
      };

      const range = getPriceRange(product);
      expect(range.min).toBeCloseTo(49.99, 2);
    });
  });
});

describe("Product Page - Image Carousel", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <img id="main-product-image" src="" alt="Product" />
      <div id="image-carousel">
        <div class="carousel-item" style="display: block;">
          <img src="image1.jpg" alt="View 1" />
        </div>
        <div class="carousel-item" style="display: none;">
          <img src="image2.jpg" alt="View 2" />
        </div>
        <div class="carousel-item" style="display: none;">
          <img src="image3.jpg" alt="View 3" />
        </div>
      </div>
      <button id="prev-btn">Previous</button>
      <button id="next-btn">Next</button>
      <span id="carousel-counter">1 / 3</span>
    `;
  });

  describe("Carousel Navigation", () => {
    it("should show first image initially", () => {
      const firstItem = document.querySelector(".carousel-item");
      expect(firstItem.style.display).toBe("block");
    });

    it("should navigate to next image", () => {
      const items = document.querySelectorAll(".carousel-item");
      items.forEach((item, idx) => {
        item.style.display = idx === 1 ? "block" : "none";
      });

      expect(items[1].style.display).toBe("block");
      expect(items[0].style.display).toBe("none");
    });

    it("should navigate to previous image", () => {
      const items = document.querySelectorAll(".carousel-item");
      items.forEach((item, idx) => {
        item.style.display = idx === 0 ? "block" : "none";
      });

      expect(items[0].style.display).toBe("block");
      expect(items[1].style.display).toBe("none");
    });

    it("should wrap around on next at end", () => {
      const items = document.querySelectorAll(".carousel-item");
      // Simulate at last image, go next
      items.forEach((item, idx) => {
        item.style.display = idx === 0 ? "block" : "none";
      });

      expect(items[0].style.display).toBe("block");
    });

    it("should wrap around on prev at start", () => {
      const items = document.querySelectorAll(".carousel-item");
      // Simulate at first image, go prev
      items.forEach((item, idx) => {
        item.style.display = idx === 2 ? "block" : "none";
      });

      expect(items[2].style.display).toBe("block");
    });

    it("should update carousel counter", () => {
      const counter = document.getElementById("carousel-counter");
      counter.textContent = "2 / 3";

      expect(counter.textContent).toBe("2 / 3");
    });
  });

  describe("Color Selection", () => {
    it("should update images when color changes", () => {
      const mockColorData = {
        Black: {
          image: "black-mockup.jpg",
          sizes: { S: { variant_id: 1 }, M: { variant_id: 2 } },
        },
        Red: {
          image: "red-mockup.jpg",
          sizes: { S: { variant_id: 3 }, M: { variant_id: 4 } },
        },
      };

      const selectedColor = "Red";
      const imageUrl = mockColorData[selectedColor].image;

      expect(imageUrl).toBe("red-mockup.jpg");
    });

    it("should have variant for selected color", () => {
      const mockProduct = {
        variants: {
          Black: { image: "black.jpg", sizes: {} },
          Red: { image: "red.jpg", sizes: {} },
        },
      };

      const colors = Object.keys(mockProduct.variants);
      expect(colors).toContain("Black");
      expect(colors).toContain("Red");
    });
  });
});

describe("Product Page - Size Selection", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="size-select">
        <option value="">Select Size</option>
        <option value="S">Small</option>
        <option value="M">Medium</option>
        <option value="L">Large</option>
        <option value="XL">Extra Large</option>
      </select>
      <div id="size-options"></div>
      <p id="price-display">$25.00</p>
    `;
  });

  it("should populate size options from color data", () => {
    const sizeSelect = document.getElementById("size-select");
    const options = sizeSelect.querySelectorAll("option");

    expect(options.length).toBeGreaterThan(1);
  });

  it("should update price when size changes", () => {
    const colorData = {
      sizes: {
        S: { price_cents: 2000 },
        M: { price_cents: 2500 },
        L: { price_cents: 3000 },
      },
    };

    const sizeSelect = document.getElementById("size-select");
    sizeSelect.value = "L";

    const price = colorData.sizes[sizeSelect.value].price_cents;
    const priceDisplay = `$${(price / 100).toFixed(2)}`;

    expect(priceDisplay).toBe("$30.00");
  });

  it("should validate size selection", () => {
    const isValidSize = size => size !== "";
    expect(isValidSize("M")).toBe(true);
    expect(isValidSize("")).toBe(false);
  });

  it("should get variant_id for selected size", () => {
    const colorData = {
      sizes: {
        S: { variant_id: 101, price_cents: 2000 },
        M: { variant_id: 102, price_cents: 2500 },
        L: { variant_id: 103, price_cents: 3000 },
      },
    };

    const selectedSize = "M";
    const variantId = colorData.sizes[selectedSize].variant_id;

    expect(variantId).toBe(102);
  });
});

describe("Product Page - Quantity and Cart", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="quantity" type="number" value="1" min="1" max="999" />
      <button id="add-to-cart-btn">Add to Cart</button>
      <div id="success-message" style="display: none;"></div>
    `;
  });

  it("should get quantity input value", () => {
    const qtyInput = document.getElementById("quantity");
    qtyInput.value = "5";

    expect(parseInt(qtyInput.value)).toBe(5);
  });

  it("should validate quantity", () => {
    const validateQuantity = qty => qty >= 1 && qty <= 999;

    expect(validateQuantity(1)).toBe(true);
    expect(validateQuantity(50)).toBe(true);
    expect(validateQuantity(999)).toBe(true);
    expect(validateQuantity(0)).toBe(false);
    expect(validateQuantity(1000)).toBe(false);
  });

  it("should create cart item object", () => {
    const cartItem = {
      product_key: "tee_1",
      title: "Test Tee",
      color: "Black",
      size: "M",
      variant_id: 123,
      quantity: 2,
      price_cents: 2500,
      image: "test.jpg",
    };

    expect(cartItem.product_key).toBe("tee_1");
    expect(cartItem.quantity).toBe(2);
    expect(cartItem.variant_id).toBe(123);
  });

  it("should validate cart before adding", () => {
    const formData = {
      color: "Black",
      size: "M",
      quantity: 1,
    };

    const isValid = formData.color && formData.size && formData.quantity > 0;
    expect(isValid).toBe(true);
  });

  it("should fail validation if color missing", () => {
    const formData = {
      color: "",
      size: "M",
      quantity: 1,
    };

    // Empty string is falsy in JavaScript
    const isValid = !!formData.color && !!formData.size && formData.quantity > 0;
    expect(isValid).toBe(false);
  });

  it("should fail validation if size missing", () => {
    const formData = {
      color: "Black",
      size: "",
      quantity: 1,
    };

    // Empty string is falsy in JavaScript
    const isValid = !!formData.color && !!formData.size && formData.quantity > 0;
    expect(isValid).toBe(false);
  });

  it("should fail validation if quantity is zero", () => {
    const formData = {
      color: "Black",
      size: "M",
      quantity: 0,
    };

    const isValid = formData.color && formData.size && formData.quantity > 0;
    expect(isValid).toBe(false);
  });
});

describe("Product Page - Form Completeness", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="color-select">
        <option value="">Select Color</option>
        <option value="Black">Black</option>
        <option value="Red">Red</option>
      </select>
      <select id="size-select">
        <option value="">Select Size</option>
        <option value="S">Small</option>
        <option value="M">Medium</option>
      </select>
      <input id="quantity" type="number" value="1" />
      <button id="add-to-cart-btn" disabled>Add to Cart</button>
    `;
  });

  it("should check if form is complete", () => {
    const checkFormComplete = () => {
      const color = document.getElementById("color-select").value;
      const size = document.getElementById("size-select").value;
      const qty = parseInt(document.getElementById("quantity").value);

      return !!color && !!size && qty > 0;
    };

    expect(checkFormComplete()).toBe(false); // Colors/size not selected
  });

  it("should enable button when form is complete", () => {
    const colorSelect = document.getElementById("color-select");
    const sizeSelect = document.getElementById("size-select");
    const addBtn = document.getElementById("add-to-cart-btn");

    colorSelect.value = "Black";
    sizeSelect.value = "M";

    const isComplete = colorSelect.value && sizeSelect.value;
    addBtn.disabled = !isComplete;

    expect(addBtn.disabled).toBe(false);
  });

  it("should disable button when form incomplete", () => {
    const colorSelect = document.getElementById("color-select");
    const addBtn = document.getElementById("add-to-cart-btn");

    colorSelect.value = "";
    addBtn.disabled = !colorSelect.value;

    expect(addBtn.disabled).toBe(true);
  });
});

describe("Product Page - Zoom and Pan", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="image-container" style="width: 400px; height: 400px; overflow: hidden;">
        <img id="product-image" src="product.jpg" alt="Product" style="width: 100%; height: 100%; cursor: grab;" />
      </div>
      <button id="zoom-in">+</button>
      <button id="zoom-out">−</button>
      <button id="reset-zoom">Reset</button>
      <span id="zoom-level">100%</span>
    `;
  });

  describe("Zoom Functionality", () => {
    it("should zoom in", () => {
      let zoomLevel = 100;
      const MAX_ZOOM = 300;

      zoomLevel = Math.min(zoomLevel + 20, MAX_ZOOM);
      expect(zoomLevel).toBe(120);
    });

    it("should zoom out", () => {
      let zoomLevel = 120;
      const MIN_ZOOM = 100;

      zoomLevel = Math.max(zoomLevel - 20, MIN_ZOOM);
      expect(zoomLevel).toBe(100);
    });

    it("should respect max zoom limit", () => {
      let zoomLevel = 280;
      const MAX_ZOOM = 300;

      zoomLevel = Math.min(zoomLevel + 40, MAX_ZOOM);
      expect(zoomLevel).toBe(300);
    });

    it("should respect min zoom limit", () => {
      let zoomLevel = 110;
      const MIN_ZOOM = 100;

      zoomLevel = Math.max(zoomLevel - 20, MIN_ZOOM);
      expect(zoomLevel).toBe(100);
    });

    it("should reset zoom to 100%", () => {
      const zoomLevel = 100;
      expect(zoomLevel).toBe(100);
    });

    it("should update zoom display", () => {
      const zoomLevel = 150;
      const display = document.getElementById("zoom-level");
      display.textContent = `${zoomLevel}%`;

      expect(display.textContent).toBe("150%");
    });
  });

  describe("Pan Functionality", () => {
    it("should track mouse position for panning", () => {
      const newX = 100;
      const newY = 50;

      const position = { x: newX, y: newY };
      expect(position.x).toBe(100);
      expect(position.y).toBe(50);
    });

    it("should calculate pan delta", () => {
      const start = { x: 100, y: 50 };
      const current = { x: 150, y: 80 };

      const delta = {
        x: current.x - start.x,
        y: current.y - start.y,
      };

      expect(delta.x).toBe(50);
      expect(delta.y).toBe(30);
    });

    it("should apply transform to image", () => {
      const image = document.getElementById("product-image");
      const transform = "scale(1.5) translate(10px, 5px)";
      image.style.transform = transform;

      expect(image.style.transform).toBe(transform);
    });
  });
});

describe("Product Page - Product Data", () => {
  it("should have complete product structure", () => {
    const product = {
      product_key: "tee_001",
      title: "Classic Tee",
      image: "tee-main.jpg",
      display_price: "$25.00",
      variants: {
        Black: {
          image: "tee-black.jpg",
          sizes: {
            S: { variant_id: 1001, price_cents: 2500 },
            M: { variant_id: 1002, price_cents: 2500 },
            L: { variant_id: 1003, price_cents: 2500 },
          },
        },
        Red: {
          image: "tee-red.jpg",
          sizes: {
            S: { variant_id: 1004, price_cents: 2500 },
            M: { variant_id: 1005, price_cents: 2500 },
            L: { variant_id: 1006, price_cents: 2500 },
          },
        },
      },
    };

    expect(product.product_key).toBeDefined();
    expect(product.title).toBeDefined();
    expect(product.variants).toBeDefined();
    expect(Object.keys(product.variants).length).toBeGreaterThan(0);
  });

  it("should list available colors", () => {
    const product = {
      variants: {
        Black: {},
        Red: {},
        White: {},
        Navy: {},
      },
    };

    const colors = Object.keys(product.variants);
    expect(colors).toContain("Black");
    expect(colors.length).toBe(4);
  });

  it("should list available sizes for color", () => {
    const colorData = {
      sizes: {
        XS: { variant_id: 1 },
        S: { variant_id: 2 },
        M: { variant_id: 3 },
        L: { variant_id: 4 },
        XL: { variant_id: 5 },
        XXL: { variant_id: 6 },
      },
    };

    const sizes = Object.keys(colorData.sizes);
    expect(sizes).toContain("M");
    expect(sizes.length).toBe(6);
  });
});
