// Store - Product Grid

function getProductCategory(title) {
  const t = title.toLowerCase();
  if (t.includes("sticker")) return "stickers";
  if (t.includes("hoodie")) return "hoodies";
  if (t.includes("sweatshirt") || t.includes("crewneck")) return "sweatshirts";
  if (t.includes("long sleeve")) return "long-sleeve";
  if (t.includes("snapback") || t.includes("trucker") || t.includes("cap") || t.includes("hat")) return "hats";
  if (t.includes("tee")) return "tees";
  return "other";
}

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("products-grid");
  const errorState = document.getElementById("error-state");

  try {
    // Fetch products data
    const response = await fetch("./data/products.json");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const products = await response.json();

    // Render products grid
    grid.innerHTML = ""; // Clear any placeholder content

    if (products.length === 0) {
      grid.innerHTML = "<p class='text-center col-12'>No products available.</p>";
      return;
    }

    products.forEach(product => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.setAttribute("data-testid", "product-card");
      card.setAttribute("data-category", getProductCategory(product.title));
      card.style.cursor = "pointer";

      // Get display price (single price or range)
      const displayPrice = getPriceDisplay(product);
      const isSticker = product.title.toLowerCase().includes("sticker");

      card.innerHTML = `
        <div class="product-image" data-testid="product-image">
          <img loading="lazy" src="${product.image}" alt="${product.title}" style="${isSticker ? "transform: scale(1.75);" : ""}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22280%22 height=%22250%22%3E%3Crect fill=%22%23666%22 width=%22280%22 height=%22250%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2218%22 fill=%22%23fff%22%3EImage not available%3C/text%3E%3C/svg%3E'">
        </div>
        <div class="product-info">
          <h3 class="product-name" data-testid="product-title">${product.title}</h3>
          <p class="product-price" data-testid="product-price">${displayPrice}</p>
          <a href="product.html?key=${product.product_key}" class="btn btn-warning btn-sm">
            View Details
          </a>
        </div>
      `;

      card.addEventListener("click", () => {
        if (!product.product_key) {
          console.error("Product key is missing for product:", product);
          return;
        }
        window.location.href = `product.html?key=${product.product_key}`;
      });

      grid.appendChild(card);
    });

    // Set up category filter buttons
    const filterBtns = document.querySelectorAll(".filter-btn");
    const validCategories = Array.from(filterBtns).map(b => b.getAttribute("data-category"));

    const applyFilter = category => {
      filterBtns.forEach(b => b.classList.remove("active"));
      const activeBtn = Array.from(filterBtns).find(b => b.getAttribute("data-category") === category);
      if (activeBtn) activeBtn.classList.add("active");

      const cards = grid.querySelectorAll(".product-card");
      cards.forEach(card => {
        if (category === "all" || card.getAttribute("data-category") === category) {
          card.style.display = "";
        } else {
          card.style.display = "none";
        }
      });

      // Update URL and localStorage
      const url = new URL(window.location);
      if (category === "all") {
        url.searchParams.delete("type");
        localStorage.removeItem("kots_filter");
      } else {
        url.searchParams.set("type", category);
        localStorage.setItem("kots_filter", category);
      }
      history.replaceState(null, "", url);
    };

    filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        applyFilter(btn.getAttribute("data-category"));
      });
    });

    // Restore filter: URL param takes priority, then localStorage
    const urlType = new URL(window.location).searchParams.get("type");
    const savedFilter = localStorage.getItem("kots_filter");
    const initialFilter =
      urlType && validCategories.includes(urlType)
        ? urlType
        : savedFilter && validCategories.includes(savedFilter)
          ? savedFilter
          : null;

    if (initialFilter) {
      applyFilter(initialFilter);
    }
  } catch (error) {
    console.error("Error loading products:", error);
    grid.style.display = "none";
    errorState.style.display = "block";
  }
});

// Get all variant prices for a product and return display price (single or range)
function getPriceDisplay(product) {
  const prices = [];

  // Collect all prices from all variants and sizes
  if (product.variants && typeof product.variants === "object") {
    Object.values(product.variants).forEach(colorData => {
      if (colorData.sizes && typeof colorData.sizes === "object") {
        Object.values(colorData.sizes).forEach(sizeData => {
          // Try to get price from variant object first
          if (sizeData.price_cents !== null && sizeData.price_cents !== undefined) {
            prices.push(sizeData.price_cents);
          }
        });
      }
    });
  }

  // If no variant prices found, fall back to display_price
  if (prices.length === 0) {
    return product.display_price;
  }

  // Sort prices and get min and max
  prices.sort((a, b) => a - b);
  const minPrice = prices[0];
  const maxPrice = prices[prices.length - 1];

  // If all prices are the same, show single price
  if (minPrice === maxPrice) {
    return `$${(minPrice / 100).toFixed(2)}`;
  }

  // If prices differ, show range
  return `$${(minPrice / 100).toFixed(2)} - $${(maxPrice / 100).toFixed(2)}`;
}

// Allow importing in Node.js (Jest tests) while keeping browser globals
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getPriceDisplay, getProductCategory };
}
