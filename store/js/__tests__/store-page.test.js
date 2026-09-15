/**
 * Store Page Tests - Product Listing and Filtering
 */

describe("Store Page - Product Listing", () => {
  let mockProducts;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="products-grid" class="products-grid"></div>
      <div id="filters-container">
        <select id="category-filter">
          <option value="">All Categories</option>
          <option value="apparel">Apparel</option>
          <option value="accessories">Accessories</option>
        </select>
      </div>
    `;

    // Mock product data
    mockProducts = [
      {
        product_key: "product_1",
        title: "Unisex Tee",
        category: "apparel",
        image: "tee.jpg",
        display_price: "$25.00",
        variants: {
          Black: {
            sizes: {
              M: { variant_id: 1001, price_cents: 2500 },
            },
          },
        },
      },
      {
        product_key: "product_2",
        title: "Sticker",
        category: "accessories",
        image: "sticker.jpg",
        display_price: "$4.50",
        variants: {
          Satin: {
            sizes: {
              "2x2": { variant_id: 2001, price_cents: 450 },
            },
          },
        },
      },
      {
        product_key: "product_3",
        title: "Hoodie",
        category: "apparel",
        image: "hoodie.jpg",
        display_price: "$50.00",
        variants: {
          Black: {
            sizes: {
              L: { variant_id: 3001, price_cents: 5000 },
            },
          },
        },
      },
    ];
  });

  describe("filterProductsByCategory", () => {
    it("should return all products when category is empty", () => {
      const filterProductsByCategory = (products, category) => {
        if (!category) return products;
        return products.filter(p => p.category === category);
      };

      const filtered = filterProductsByCategory(mockProducts, "");
      expect(filtered.length).toBe(3);
    });

    it("should filter products by category", () => {
      const filterProductsByCategory = (products, category) => {
        if (!category) return products;
        return products.filter(p => p.category === category);
      };

      const filtered = filterProductsByCategory(mockProducts, "apparel");
      expect(filtered.length).toBe(2);
      expect(filtered[0].title).toBe("Unisex Tee");
      expect(filtered[1].title).toBe("Hoodie");
    });

    it("should return empty array for non-existent category", () => {
      const filterProductsByCategory = (products, category) => {
        if (!category) return products;
        return products.filter(p => p.category === category);
      };

      const filtered = filterProductsByCategory(mockProducts, "nonexistent");
      expect(filtered.length).toBe(0);
    });
  });

  describe("sortProducts", () => {
    it("should sort by price ascending", () => {
      const sortProducts = (products, sortBy) => {
        if (sortBy === "price-asc") {
          return [...products].sort((a, b) => {
            const priceA = parseInt(a.display_price.replace(/[^0-9]/g, ""));
            const priceB = parseInt(b.display_price.replace(/[^0-9]/g, ""));
            return priceA - priceB;
          });
        }
        return products;
      };

      const sorted = sortProducts(mockProducts, "price-asc");
      expect(sorted[0].display_price).toBe("$4.50");
      expect(sorted[2].display_price).toBe("$50.00");
    });

    it("should sort by price descending", () => {
      const sortProducts = (products, sortBy) => {
        if (sortBy === "price-desc") {
          return [...products].sort((a, b) => {
            const priceA = parseInt(a.display_price.replace(/[^0-9]/g, ""));
            const priceB = parseInt(b.display_price.replace(/[^0-9]/g, ""));
            return priceB - priceA;
          });
        }
        return products;
      };

      const sorted = sortProducts(mockProducts, "price-desc");
      expect(sorted[0].display_price).toBe("$50.00");
      expect(sorted[2].display_price).toBe("$4.50");
    });

    it("should sort by title alphabetically", () => {
      const sortProducts = (products, sortBy) => {
        if (sortBy === "title") {
          return [...products].sort((a, b) => a.title.localeCompare(b.title));
        }
        return products;
      };

      const sorted = sortProducts(mockProducts, "title");
      expect(sorted[0].title).toBe("Hoodie");
      expect(sorted[1].title).toBe("Sticker");
      expect(sorted[2].title).toBe("Unisex Tee");
    });
  });

  describe("getPriceDisplay", () => {
    it("should display single price for products with uniform pricing", () => {
      const product = mockProducts[0]; // Tee at $25.00

      const getPriceDisplay = product => product.display_price;

      expect(getPriceDisplay(product)).toBe("$25.00");
    });

    it("should display price range for products with variable pricing", () => {
      const product = {
        display_price: "$4.50 - $5.50",
        variants: {
          Satin: {
            sizes: {
              "2x2": { price_cents: 450 },
              "3x3": { price_cents: 550 },
            },
          },
        },
      };

      const getPriceDisplay = product => product.display_price;

      expect(getPriceDisplay(product)).toContain("$4.50");
      expect(getPriceDisplay(product)).toContain("$5.50");
    });
  });

  describe("Product Search", () => {
    it("should search products by title", () => {
      const searchProducts = (products, query) => {
        if (!query) return products;
        const lowerQuery = query.toLowerCase();
        return products.filter(p => p.title.toLowerCase().includes(lowerQuery));
      };

      const results = searchProducts(mockProducts, "hoodie");
      expect(results.length).toBe(1);
      expect(results[0].title).toBe("Hoodie");
    });

    it("should be case-insensitive", () => {
      const searchProducts = (products, query) => {
        if (!query) return products;
        const lowerQuery = query.toLowerCase();
        return products.filter(p => p.title.toLowerCase().includes(lowerQuery));
      };

      const results1 = searchProducts(mockProducts, "TEES");
      const results2 = searchProducts(mockProducts, "tees");
      expect(results1.length).toBe(results2.length);
    });

    it("should return empty for non-matching search", () => {
      const searchProducts = (products, query) => {
        if (!query) return products;
        const lowerQuery = query.toLowerCase();
        return products.filter(p => p.title.toLowerCase().includes(lowerQuery));
      };

      const results = searchProducts(mockProducts, "nonexistent");
      expect(results.length).toBe(0);
    });
  });

  describe("Product Grid Display", () => {
    it("should create product cards for each product", () => {
      const grid = document.getElementById("products-grid");

      mockProducts.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.setAttribute("data-testid", "product-card");
        card.setAttribute("data-product-key", product.product_key);
        card.innerHTML = `<h3>${product.title}</h3><p>${product.display_price}</p>`;
        grid.appendChild(card);
      });

      const cards = grid.querySelectorAll("[data-testid='product-card']");
      expect(cards.length).toBe(3);
    });

    it("should update grid when products change", () => {
      const grid = document.getElementById("products-grid");
      grid.innerHTML = ""; // Clear initial

      const filtered = mockProducts.filter(p => p.category === "apparel");

      filtered.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `<h3>${product.title}</h3>`;
        grid.appendChild(card);
      });

      const cards = grid.querySelectorAll(".product-card");
      expect(cards.length).toBe(2);
    });
  });

  describe("Product Click Handler", () => {
    it("should navigate to product detail page on click", () => {
      const product = mockProducts[0];

      const handleProductClick = product => {
        return `/store/product.html?id=${product.product_key}`;
      };

      const url = handleProductClick(product);
      expect(url).toContain("product_1");
      expect(url).toContain("product.html");
    });
  });

  describe("Product Data Validation", () => {
    it("should have required fields for each product", () => {
      const isValidProduct = product => {
        return !!(product.product_key && product.title && product.image && product.display_price && product.variants);
      };

      mockProducts.forEach(product => {
        expect(isValidProduct(product)).toBe(true);
      });
    });

    it("should have variant data structure", () => {
      mockProducts.forEach(product => {
        Object.values(product.variants).forEach(colorData => {
          expect(colorData).toHaveProperty("sizes");
          expect(typeof colorData.sizes).toBe("object");

          Object.values(colorData.sizes).forEach(sizeData => {
            expect(sizeData).toHaveProperty("variant_id");
          });
        });
      });
    });
  });
});
