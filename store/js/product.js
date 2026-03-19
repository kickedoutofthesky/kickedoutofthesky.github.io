/* global cart, playDingSound, createCartBurst */
// Product Detail Page
let currentProduct = null;
let currentImageIndex = 0; // Track carousel position (0 = main, 1 = sleeve mockup)

// Zoom and Pan state
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartPanX = 0;
let dragStartPanY = 0;
const MAX_ZOOM = 3;
const MIN_ZOOM = 1;
const ZOOM_STEP = 0.2;

// Check if current product and color have a sleeve mockup
function hasSleeveMockup() {
  if (!currentProduct) return false;
  const colorSelect = document.getElementById("color");
  const selectedColor = colorSelect?.value || Object.keys(currentProduct.variants)[0];

  return (
    currentProduct.title.includes("Long Sleeve") &&
    selectedColor &&
    currentProduct.variants[selectedColor] &&
    currentProduct.variants[selectedColor].sleeve_mockup
  );
}

// Get the current display image based on index
function getCurrentDisplayImage() {
  if (!currentProduct) return currentProduct?.image;
  const colorSelect = document.getElementById("color");
  const selectedColor = colorSelect?.value || Object.keys(currentProduct.variants)[0];
  const colorData = currentProduct.variants[selectedColor];

  if (currentImageIndex === 0) {
    return colorData?.image || currentProduct.image;
  } else if (currentImageIndex === 1 && hasSleeveMockup()) {
    return currentProduct.variants[selectedColor].sleeve_mockup;
  }

  return colorData?.image || currentProduct.image;
}

// Update the carousel UI (show/hide arrows)
function updateCarouselUI() {
  const prevBtn = document.getElementById("carousel-prev");
  const nextBtn = document.getElementById("carousel-next");

  if (!hasSleeveMockup()) {
    if (prevBtn) prevBtn.style.display = "none";
    if (nextBtn) nextBtn.style.display = "none";
    return;
  }

  if (prevBtn) prevBtn.style.display = currentImageIndex > 0 ? "flex" : "none";
  if (nextBtn) nextBtn.style.display = currentImageIndex < 1 ? "flex" : "none";
}

// Navigate to previous image
// eslint-disable-next-line no-unused-vars
function showPreviousImage() {
  if (currentImageIndex > 0) {
    currentImageIndex--;
    resetZoom();
    updateProductImage();
    updateCarouselUI();
  }
}

// Navigate to next image
// eslint-disable-next-line no-unused-vars
function showNextImage() {
  if (hasSleeveMockup() && currentImageIndex < 1) {
    currentImageIndex++;
    resetZoom();
    updateProductImage();
    updateCarouselUI();
  }
}

// Update the product image display
function updateProductImage() {
  const img = document.getElementById("product-image");
  if (img) {
    img.src = getCurrentDisplayImage();
  }
}

// Zoom and Pan Functions

// Apply zoom and pan transform to image
function applyImageTransform() {
  const img = document.getElementById("product-image");
  if (img) {
    img.style.transform = `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`;

    const zoomDisplay = document.getElementById("zoom-level");
    if (zoomDisplay) {
      zoomDisplay.style.display = zoomLevel > 1 ? "block" : "none";
    }

    const panControls = document.getElementById("pan-controls");
    if (panControls) {
      panControls.style.display = zoomLevel > 1 ? "block" : "none";
    }
  }
}

// eslint-disable-next-line no-unused-vars
function zoomIn() {
  if (zoomLevel < MAX_ZOOM) {
    zoomLevel = Math.min(zoomLevel + ZOOM_STEP, MAX_ZOOM);
    updateZoomDisplay();
    applyImageTransform();
  }
}

// eslint-disable-next-line no-unused-vars
function zoomOut() {
  if (zoomLevel > MIN_ZOOM) {
    zoomLevel = Math.max(zoomLevel - ZOOM_STEP, MIN_ZOOM);
    updateZoomDisplay();
    applyImageTransform();
    if (zoomLevel === MIN_ZOOM) {
      panX = 0;
      panY = 0;
    }
  }
}

// eslint-disable-next-line no-unused-vars
function resetZoom() {
  zoomLevel = 1;
  panX = 0;
  panY = 0;
  updateZoomDisplay();
  applyImageTransform();
}

// eslint-disable-next-line no-unused-vars
function panImage(deltaX, deltaY) {
  if (zoomLevel <= 1) return;

  const container = document.getElementById("product-image-container");
  if (!container) return;

  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const maxPanX = (containerWidth * (zoomLevel - 1)) / (2 * zoomLevel);
  const maxPanY = (containerHeight * (zoomLevel - 1)) / (2 * zoomLevel);

  panX = Math.max(-maxPanX, Math.min(maxPanX, panX + deltaX));
  panY = Math.max(-maxPanY, Math.min(maxPanY, panY + deltaY));

  applyImageTransform();
}

function updateZoomDisplay() {
  const zoomDisplay = document.getElementById("zoom-level");
  if (zoomDisplay) {
    zoomDisplay.textContent = Math.round(zoomLevel * 100) + "%";
  }
}

function handleImageWheel(e) {
  if (zoomLevel <= 1 && e.deltaY > 0) {
    return;
  }

  e.preventDefault();

  const oldZoom = zoomLevel;
  const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
  zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + delta));

  if (zoomLevel === MIN_ZOOM) {
    panX = 0;
    panY = 0;
  }

  if (zoomLevel !== oldZoom) {
    updateZoomDisplay();
    applyImageTransform();
  }
}

function handleImageMouseDown(e) {
  if (zoomLevel > 1) {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartPanX = panX;
    dragStartPanY = panY;
    document.getElementById("product-image-container").style.cursor = "grabbing";
  }
}

function handleImageMouseMove(e) {
  if (isDragging && zoomLevel > 1) {
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;

    const container = document.getElementById("product-image-container");
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const maxPanX = (containerWidth * (zoomLevel - 1)) / (2 * zoomLevel);
    const maxPanY = (containerHeight * (zoomLevel - 1)) / (2 * zoomLevel);

    panX = Math.max(-maxPanX, Math.min(maxPanX, dragStartPanX + deltaX / zoomLevel));
    panY = Math.max(-maxPanY, Math.min(maxPanY, dragStartPanY + deltaY / zoomLevel));

    applyImageTransform();
  }
}

function handleImageMouseUp() {
  isDragging = false;
  const container = document.getElementById("product-image-container");
  if (container) container.style.cursor = "default";
}

let touchDistance = 0;

function handleImageTouchStart(e) {
  if (e.touches.length === 2) {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    touchDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
  } else if (e.touches.length === 1 && zoomLevel > 1) {
    isDragging = true;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
    dragStartPanX = panX;
    dragStartPanY = panY;
  }
}

function handleImageTouchMove(e) {
  if (e.touches.length === 2) {
    e.preventDefault();
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const newDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);

    if (touchDistance > 0) {
      const scale = newDistance / touchDistance;
      const oldZoom = zoomLevel;
      zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel * scale));

      if (zoomLevel !== oldZoom) {
        updateZoomDisplay();
        applyImageTransform();
      }

      touchDistance = newDistance;
    }
  } else if (isDragging && zoomLevel > 1 && e.touches.length === 1) {
    const deltaX = e.touches[0].clientX - dragStartX;
    const deltaY = e.touches[0].clientY - dragStartY;

    const container = document.getElementById("product-image-container");
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const maxPanX = (containerWidth * (zoomLevel - 1)) / (2 * zoomLevel);
    const maxPanY = (containerHeight * (zoomLevel - 1)) / (2 * zoomLevel);

    panX = Math.max(-maxPanX, Math.min(maxPanX, dragStartPanX + deltaX / zoomLevel));
    panY = Math.max(-maxPanY, Math.min(maxPanY, dragStartPanY + deltaY / zoomLevel));

    applyImageTransform();
  }
}

function handleImageTouchEnd() {
  isDragging = false;
  touchDistance = 0;
}

function initializeZoomPan() {
  const img = document.getElementById("product-image");
  const container = document.getElementById("product-image-container");

  if (container && img) {
    img.addEventListener("wheel", handleImageWheel, { passive: false });
    img.addEventListener("mousedown", handleImageMouseDown);
    document.addEventListener("mousemove", handleImageMouseMove);
    document.addEventListener("mouseup", handleImageMouseUp);

    img.addEventListener("touchstart", handleImageTouchStart, { passive: true });
    img.addEventListener("touchmove", handleImageTouchMove, { passive: false });
    img.addEventListener("touchend", handleImageTouchEnd);

    img.addEventListener("mouseenter", function () {
      if (zoomLevel > 1) {
        this.style.cursor = "grab";
      }
    });

    img.addEventListener("mouseleave", function () {
      if (!isDragging) {
        this.style.cursor = "default";
      }
    });
  }
}

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
            <div class="product-detail-image" style="position: relative;">
              <div id="product-image-container" style="position: relative; overflow: hidden; border-radius: 0.375rem; width: 100%; height: 100%;">
                <img id="product-image" data-testid="product-image" src="${defaultImage}" alt="${product.title}" class="rounded" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.1s ease; transform-origin: center center; user-select: none; -webkit-user-drag: none;">
              </div>

              <!-- Zoom Level Display (above zoom controls) -->
              <div id="zoom-level" style="display: none; position: absolute; bottom: 130px; right: 10px; background: rgba(0,0,0,0.6); color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 13px; z-index: 10;">100%</div>

              <!-- Zoom Controls -->
              <div id="zoom-controls" style="position: absolute; bottom: 10px; right: 10px; display: flex; flex-direction: column; gap: 4px; z-index: 10;">
                <button onclick="zoomIn()" title="Zoom In" style="width: 36px; height: 36px; border: none; border-radius: 6px; background: rgba(0,0,0,0.6); color: #fff; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">
                  <i class="fas fa-search-plus"></i>
                </button>
                <button onclick="zoomOut()" title="Zoom Out" style="width: 36px; height: 36px; border: none; border-radius: 6px; background: rgba(0,0,0,0.6); color: #fff; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">
                  <i class="fas fa-search-minus"></i>
                </button>
                <button onclick="resetZoom()" title="Reset Zoom" style="width: 36px; height: 36px; border: none; border-radius: 6px; background: rgba(0,0,0,0.6); color: #fff; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">
                  <i class="fas fa-compress-arrows-alt"></i>
                </button>
              </div>

              <!-- Pan Controls (visible only when zoomed) -->
              <div id="pan-controls" style="display: none; position: absolute; bottom: 10px; left: 10px; z-index: 10;">
                <div style="display: grid; grid-template-columns: 30px 30px 30px; grid-template-rows: 30px 30px 30px; gap: 2px;">
                  <div></div>
                  <button onclick="panImage(0, 20)" title="Pan Up" style="width: 30px; height: 30px; border: none; border-radius: 4px; background: rgba(0,0,0,0.6); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px;">
                    <i class="fas fa-chevron-up"></i>
                  </button>
                  <div></div>
                  <button onclick="panImage(20, 0)" title="Pan Left" style="width: 30px; height: 30px; border: none; border-radius: 4px; background: rgba(0,0,0,0.6); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px;">
                    <i class="fas fa-chevron-left"></i>
                  </button>
                  <div></div>
                  <button onclick="panImage(-20, 0)" title="Pan Right" style="width: 30px; height: 30px; border: none; border-radius: 4px; background: rgba(0,0,0,0.6); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px;">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                  <div></div>
                  <button onclick="panImage(0, -20)" title="Pan Down" style="width: 30px; height: 30px; border: none; border-radius: 4px; background: rgba(0,0,0,0.6); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px;">
                    <i class="fas fa-chevron-down"></i>
                  </button>
                  <div></div>
                </div>
              </div>

              <!-- Carousel Arrows for sleeve mockup images -->
              <button id="carousel-prev" onclick="showPreviousImage()" style="display: none; position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; border: none; border-radius: 50%; background: rgba(0,0,0,0.6); color: #fff; font-size: 18px; cursor: pointer; align-items: center; justify-content: center; z-index: 10; transition: background 0.2s;">
                <i class="fas fa-chevron-left"></i>
              </button>
              <button id="carousel-next" onclick="showNextImage()" style="display: none; position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; border: none; border-radius: 50%; background: rgba(0,0,0,0.6); color: #fff; font-size: 18px; cursor: pointer; align-items: center; justify-content: center; z-index: 10; transition: background 0.2s;">
                <i class="fas fa-chevron-right"></i>
              </button>
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

  // Initialize zoom/pan and carousel
  initializeZoomPan();
  updateCarouselUI();
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

    // Reset carousel and zoom on color change
    currentImageIndex = 0;
    resetZoom();
    updateCarouselUI();

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

  // Reset carousel and zoom on color change
  currentImageIndex = 0;
  resetZoom();
  updateCarouselUI();

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
