/* global cart, playDingSound, createCartBurst */
// Product Detail Page
let currentProduct = null;

document.addEventListener("DOMContentLoaded", async () => {
  const detail = document.getElementById("product-detail");
  const loading = document.getElementById("loading");
  const errorEl = document.getElementById("error");

  // Get product key from URL query parameter
  const params = new URLSearchParams(window.location.search);
  const productKey = params.get("key");

  if (!productKey) {
    loading.style.display = "none";
    detail.style.display = "none";
    errorEl.style.display = "block";
    errorEl.querySelector("p").textContent = "Product not found. Please return to the store.";
    return;
  }

  try {
    // Fetch products data
    const response = await fetch("./data/products.json");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const products = await response.json();
    const product = products.find(p => p.product_key === productKey);

    if (!product) {
      loading.style.display = "none";
      detail.style.display = "none";
      errorEl.style.display = "block";
      errorEl.querySelector("p").textContent = "Product not found. Please return to the store.";
      return;
    }

    currentProduct = product;

    // Clear loading state
    loading.style.display = "none";

    // Get first color as default
    const availableColors = Object.keys(product.variants);
    const defaultColor = availableColors[0];
    const defaultImage = product.image;

    // Get price range for display
    const priceDisplay = getPriceDisplay(product);

    // Render product detail
    detail.innerHTML = `
      <div class="row">
        <div class="col-md-7">
            <div class="product-detail-image">
              <img id="product-image" data-testid="product-image" src="${defaultImage}" alt="${product.title}" class="img-fluid rounded">
            </div>
          </div>
          <div class="col-md-5">
            <div class="product-detail-info" style="text-align: left;">
              <h1 class="mb-3" data-testid="product-title">${product.title}</h1>
              <p class="product-detail-price fs-4 mb-4 text-warning" id="price-display" data-testid="product-price">${priceDisplay}</p>

              <div class="mb-4">
                ${
                  availableColors.length >= 1
                    ? `
                <div class="mb-3">
                  <label for="color" class="form-label">Color</label>
                  <select id="color" data-testid="color-select" class="form-select" onchange="updateColorAndPrice(); checkFormComplete()">
                    ${availableColors.map(color => `<option value="${color}">${color}</option>`).join("")}
                  </select>
                </div>
                `
                    : ""
                }

                <div class="mb-3">
                  <label for="size" class="form-label">Size</label>
                  <select id="size" data-testid="size-select" class="form-select" onchange="updatePrice(); checkFormComplete()">
                    <option value="">-- Choose a size --</option>
                  </select>
                </div>

                <div class="mb-3">
                  <label for="quantity" class="form-label">Quantity</label>
                  <input type="number" id="quantity" class="form-control" style="max-width: 100px;" min="1" value="1" onchange="checkFormComplete()">
                </div>
              </div>

              <button id="add-to-cart-btn" class="btn btn-warning btn-lg fw-bold" onclick="addToCart()" disabled>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
    `;

    // Initialize sizes for default color
    updateSizes(defaultColor);
  } catch (error) {
    console.error("Error loading product:", error);
    loading.style.display = "none";
    detail.style.display = "none";
    errorEl.style.display = "block";
  }
});

function updateSizes(selectedColor) {
  if (!currentProduct) return;

  const sizeSelect = document.getElementById("size");
  const color = selectedColor || document.getElementById("color")?.value;

  // Clear existing sizes
  sizeSelect.innerHTML = '<option value="">-- Choose a size --</option>';

  if (color && currentProduct.variants[color]) {
    const colorData = currentProduct.variants[color];
    const sizes = colorData.sizes ? Object.keys(colorData.sizes) : Object.keys(colorData).filter(k => k !== "image");

    sizes.forEach(size => {
      const option = document.createElement("option");
      option.value = size;
      option.textContent = size;
      sizeSelect.appendChild(option);
    });

    // Auto-select first size if only one available
    if (sizes.length === 1) {
      sizeSelect.value = sizes[0];
    }
  }

  checkFormComplete();
}

// eslint-disable-next-line no-unused-vars
function updateColorAndPrice() {
  const colorSelect = document.getElementById("color");
  const selectedColor = colorSelect.value;

  if (currentProduct && selectedColor && currentProduct.variants[selectedColor]) {
    // Use color-specific image if available
    const colorData = currentProduct.variants[selectedColor];
    const colorImage = colorData.image || currentProduct.image;
    document.getElementById("product-image").src = colorImage;

    // Reset sizes
    updateSizes(selectedColor);
    updatePrice();
  }
}

// eslint-disable-next-line no-unused-vars
function selectColorThumbnail(color) {
  // Update the color dropdown
  const colorSelect = document.getElementById("color");
  if (colorSelect) {
    colorSelect.value = color;
  }

  // Update main image
  if (currentProduct && currentProduct.variants[color]) {
    const colorData = currentProduct.variants[color];
    const colorImage = colorData.image || currentProduct.image;
    document.getElementById("product-image").src = colorImage;
  }

  // Update thumbnail highlights
  const thumbnails = document.querySelectorAll("#color-thumbnails img");
  thumbnails.forEach((thumb, index) => {
    const availableColors = Object.keys(currentProduct.variants);
    if (availableColors[index] === color) {
      thumb.style.border = "3px solid #ffc107";
    } else {
      thumb.style.border = "2px solid #333";
    }
  });

  // Update sizes and price
  updateSizes(color);
  updatePrice();
}

function updatePrice() {
  if (!currentProduct) return;

  const colorSelect = document.getElementById("color");
  const sizeSelect = document.getElementById("size");
  const color = colorSelect?.value || Object.keys(currentProduct.variants)[0];
  const size = sizeSelect.value;

  // If size is selected, show specific variant price
  if (size && color) {
    const variantData = currentProduct.variants[color]?.sizes?.[size];
    if (variantData?.price_cents !== null && variantData?.price_cents !== undefined) {
      const price = variantData.price_cents / 100;
      document.getElementById("price-display").textContent = `$${price.toFixed(2)}`;
      return;
    }
  }

  // If no size selected or price not found, show price range
  const priceDisplay = getPriceDisplay(currentProduct);
  document.getElementById("price-display").textContent = priceDisplay;
}

function checkFormComplete() {
  const colorSelect = document.getElementById("color");
  const sizeSelect = document.getElementById("size");
  const button = document.getElementById("add-to-cart-btn");

  // Check if color is required (multiple colors) and selected
  const colorValid = !colorSelect || colorSelect.value !== "";

  // Check if size is selected
  const sizeValid = sizeSelect.value !== "";

  // Enable button only if both are valid
  if (colorValid && sizeValid) {
    button.disabled = false;
  } else {
    button.disabled = true;
  }
}

// eslint-disable-next-line no-unused-vars
async function addToCart() {
  if (!currentProduct) return;

  const colorSelect = document.getElementById("color");
  const sizeSelect = document.getElementById("size");
  const quantityInput = document.getElementById("quantity");

  const color = colorSelect?.value || Object.keys(currentProduct.variants)[0];
  const size = sizeSelect.value;
  const quantity = parseInt(quantityInput.value) || 1;

  if (!size) {
    alert("Please select a size.");
    return;
  }

  // Add to cart without updating badge yet (skipBadgeUpdate = true)
  cart.addItem(currentProduct.product_key, color, size, quantity, true);

  // Show notifications and wait for animation to complete
  playDingSound();
  await createCartBurst();

  // Update badge after animation completes
  cart.updateCartBadge();
}

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
