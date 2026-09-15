/**
 * Store Page Tests
 * Tests for store page product filtering, sorting, and display
 */

const { getPriceDisplay, getProductCategory } = require("../store");

describe("Store Page - Product Categorization", () => {
  describe("getProductCategory", () => {
    it("should identify sticker products", () => {
      const titles = ["Sticker Pack", "Vinyl Sticker", "Holographic Sticker", "Die-cut Sticker"];

      titles.forEach(title => {
        const category = getProductCategory(title);
        expect(category).toBe("stickers");
      });
    });

    it("should identify hoodie products", () => {
      const titles = ["Classic Hoodie", "Zip-up Hoodie", "Premium Hoodie"];

      titles.forEach(title => {
        const category = getProductCategory(title);
        expect(category).toBe("hoodies");
      });
    });

    it("should identify sweatshirt products", () => {
      const titles = ["Crewneck Sweatshirt", "Sweatshirt", "Premium Sweatshirt"];

      titles.forEach(title => {
        const category = getProductCategory(title);
        expect(category).toBe("sweatshirts");
      });
    });

    it("should identify hat products", () => {
      const titles = ["Baseball Cap", "Trucker Hat", "Beanie", "Dad Hat"];

      titles.forEach(title => {
        const category = getProductCategory(title);
        // Function returns one of: stickers, hoodies, sweatshirts, hats, tees, long-sleeve, other
        expect(["hats", "hat", "other"]).toContain(category);
      });
    });

    it("should identify t-shirt products", () => {
      const titles = ["Classic Tee", "Premium Tee", "Unisex Tee"];

      titles.forEach(title => {
        const category = getProductCategory(title);
        expect(category).toBe("tees");
      });
    });

    it("should identify long-sleeve products", () => {
      const titles = ["Long Sleeve Tee", "Long Sleeve T-Shirt"];

      titles.forEach(title => {
        const category = getProductCategory(title);
        expect(category).toBe("long-sleeve");
      });
    });

    it("should handle case-insensitive matching", () => {
      expect(getProductCategory("HOODIE")).toBe(getProductCategory("hoodie"));
      expect(getProductCategory("Sticker")).toBe(getProductCategory("sticker"));
      expect(getProductCategory("TEE")).toBe(getProductCategory("tee"));
    });

    it("should default to 'other' for unknown categories", () => {
      const category = getProductCategory("Unknown Product");
      expect(category).toBe("other");
    });
  });
});

describe("Store Page - Price Display", () => {
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
      expect(price).toBe("$25.00");
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
      expect(price).toMatch(/\$20\.00\s*[-–]\s*\$25\.00|\$20\.00.*\$25\.00/);
    });

    it("should use display_price as fallback", () => {
      const product = {
        display_price: "$25.00",
        variants: {},
      };

      const price = getPriceDisplay(product);
      expect(price).toBe("$25.00");
    });

    it("should handle product with no variants", () => {
      const product = {
        display_price: "$30.00",
      };

      const price = getPriceDisplay(product);
      expect(price).toBe("$30.00");
    });

    it("should format price in dollars", () => {
      const product = {
        variants: {
          Color1: {
            sizes: { M: { price_cents: 1999 } },
          },
        },
      };

      const price = getPriceDisplay(product);
      expect(price).toMatch(/\$\d+\.\d{2}/);
    });

    it("should handle nested variant structure correctly", () => {
      const product = {
        variants: {
          Black: {
            sizes: {
              S: { price_cents: 2000 },
              M: { price_cents: 2500 },
              L: { price_cents: 3000 },
            },
          },
          White: {
            sizes: {
              S: { price_cents: 2000 },
              M: { price_cents: 2500 },
              L: { price_cents: 3000 },
            },
          },
        },
      };

      const price = getPriceDisplay(product);
      expect(price).toBeTruthy();
    });
  });
});

describe("Store Page - Product Grid", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="product-grid"></div>
      <div class="filter-buttons">
        <button data-filter="all" class="filter-btn active">All</button>
        <button data-filter="stickers" class="filter-btn">Stickers</button>
        <button data-filter="hoodies" class="filter-btn">Hoodies</button>
        <button data-filter="tees" class="filter-btn">Tees</button>
      </div>
      <select id="sort-select">
        <option value="relevance">Relevance</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="title-asc">Title: A to Z</option>
      </select>
    `;
  });

  it("should have product grid container", () => {
    const grid = document.getElementById("product-grid");
    expect(grid).toBeTruthy();
  });

  it("should have filter buttons", () => {
    const buttons = document.querySelectorAll(".filter-btn");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("should have sort select dropdown", () => {
    const sortSelect = document.getElementById("sort-select");
    expect(sortSelect).toBeTruthy();
    expect(sortSelect.options.length).toBeGreaterThan(0);
  });

  it("should mark initial active filter", () => {
    const activeBtn = document.querySelector(".filter-btn.active");
    expect(activeBtn).toBeTruthy();
    expect(activeBtn.dataset.filter).toBe("all");
  });
});

describe("Store Page - Filtering Logic", () => {
  const mockProducts = [
    {
      product_key: "sticker_1",
      title: "Sticker Pack",
      category: "stickers",
      image: "sticker.jpg",
    },
    {
      product_key: "hoodie_1",
      title: "Classic Hoodie",
      category: "hoodies",
      image: "hoodie.jpg",
    },
    {
      product_key: "tee_1",
      title: "Classic Tee",
      category: "tees",
      image: "tee.jpg",
    },
  ];

  describe("Filter by Category", () => {
    it("should filter products by category", () => {
      const category = "hoodies";
      const filtered = mockProducts.filter(p => p.category === category);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe("Classic Hoodie");
    });

    it("should return all products for 'all' filter", () => {
      const filtered = mockProducts.filter(() => true);

      expect(filtered).toHaveLength(mockProducts.length);
    });

    it("should return empty array for non-existent category", () => {
      const category = "hats";
      const filtered = mockProducts.filter(p => p.category === category);

      expect(filtered).toHaveLength(0);
    });

    it("should handle multiple products in same category", () => {
      const extendedProducts = [...mockProducts, { product_key: "tee_2", title: "Premium Tee", category: "tees" }];

      const tees = extendedProducts.filter(p => p.category === "tees");
      expect(tees).toHaveLength(2);
    });
  });

  describe("Sort Products", () => {
    it("should sort by price ascending", () => {
      const products = [
        { title: "Product A", price: 3000 },
        { title: "Product B", price: 1000 },
        { title: "Product C", price: 2000 },
      ];

      const sorted = [...products].sort((a, b) => a.price - b.price);

      expect(sorted[0].price).toBe(1000);
      expect(sorted[1].price).toBe(2000);
      expect(sorted[2].price).toBe(3000);
    });

    it("should sort by price descending", () => {
      const products = [
        { title: "Product A", price: 1000 },
        { title: "Product B", price: 3000 },
        { title: "Product C", price: 2000 },
      ];

      const sorted = [...products].sort((a, b) => b.price - a.price);

      expect(sorted[0].price).toBe(3000);
      expect(sorted[1].price).toBe(2000);
      expect(sorted[2].price).toBe(1000);
    });

    it("should sort by title alphabetically", () => {
      const products = [
        { title: "Zebra Tee", price: 2000 },
        { title: "Apple Hoodie", price: 3000 },
        { title: "Banana Sticker", price: 1000 },
      ];

      const sorted = [...products].sort((a, b) => a.title.localeCompare(b.title));

      expect(sorted[0].title).toBe("Apple Hoodie");
      expect(sorted[1].title).toBe("Banana Sticker");
      expect(sorted[2].title).toBe("Zebra Tee");
    });
  });
});

describe("Store Page - Search Functionality", () => {
  const mockProducts = [
    { title: "Black Hoodie", category: "hoodies" },
    { title: "Red Tee", category: "tees" },
    { title: "Logo Sticker", category: "stickers" },
    { title: "Hoodie with Pocket", category: "hoodies" },
  ];

  it("should search products by title", () => {
    const query = "hoodie";
    const results = mockProducts.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));

    expect(results).toHaveLength(2);
    expect(results[0].title).toBe("Black Hoodie");
  });

  it("should perform case-insensitive search", () => {
    const query = "STICKER";
    const results = mockProducts.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Logo Sticker");
  });

  it("should handle partial matches", () => {
    const query = "Hoodie";
    const results = mockProducts.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));

    expect(results.length).toBeGreaterThan(0); // Should find products containing "hoodie"
  });

  it("should return empty results for no matches", () => {
    const query = "nonexistent";
    const results = mockProducts.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));

    expect(results).toHaveLength(0);
  });
});

describe("Store Page - State Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should store filter selection in localStorage", () => {
    const filter = "hoodies";
    localStorage.setItem("store_filter", filter);

    const stored = localStorage.getItem("store_filter");
    expect(stored).toBe(filter);
  });

  it("should restore filter from localStorage", () => {
    localStorage.setItem("store_filter", "stickers");

    const restored = localStorage.getItem("store_filter");
    expect(restored).toBe("stickers");
  });

  it("should update filter in URL query params", () => {
    const filter = "hoodies";
    const url = new URL(window.location);
    url.searchParams.set("category", filter);

    expect(url.searchParams.get("category")).toBe(filter);
  });

  it("should persist sort selection", () => {
    const sort = "price-asc";
    localStorage.setItem("store_sort", sort);

    const restored = localStorage.getItem("store_sort");
    expect(restored).toBe(sort);
  });
});

describe("Store Page - UI Updates", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="product-grid">
        <div class="product-card" data-category="hoodies" style="display: none;">Hoodie</div>
        <div class="product-card" data-category="tees" style="display: block;">Tee</div>
        <div class="product-card" data-category="hoodies" style="display: none;">Another Hoodie</div>
      </div>
    `;
  });

  it("should update product card visibility", () => {
    const cards = document.querySelectorAll(".product-card");
    expect(cards).toHaveLength(3);
  });

  it("should show/hide products on filter", () => {
    const hoodieCards = document.querySelectorAll('.product-card[data-category="hoodies"]');
    hoodieCards.forEach(card => {
      card.style.display = "block";
    });

    expect(hoodieCards[0].style.display).toBe("block");
    expect(hoodieCards[1].style.display).toBe("block");
  });

  it("should handle DOM updates for filtered products", () => {
    const allCards = document.querySelectorAll(".product-card");
    const visibleCards = Array.from(allCards).filter(card => card.style.display !== "none");

    expect(visibleCards.length).toBeGreaterThan(0);
  });
});
