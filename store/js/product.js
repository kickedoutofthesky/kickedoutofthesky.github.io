// Product Detail Page
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

    // Clear loading state
    loading.style.display = "none";

    // Render product detail
    detail.innerHTML = `
            <div class="row">
              <div class="col-md-6">
                <div class="product-detail-image">
                    <img src="${product.image}" alt="${product.title}" class="img-fluid" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect fill=%22%23e0e0e0%22 width=%22400%22 height=%22400%22/%3E%3C/svg%3E'">
                </div>
              </div>
              <div class="col-md-6">
                <div class="product-detail-info">
                    <h1 class="mb-3">${product.title}</h1>
                    <p class="product-detail-price fs-4 mb-4">${product.display_price}</p>

                    <div class="mb-4">
                      <h5>Select Options:</h5>
                      <div class="mb-3">
                        <label for="color" class="form-label">Color</label>
                        <select id="color" class="form-select" onchange="updateSizes()">
                          <option value="">-- Choose a color --</option>
                          ${Object.keys(product.variants)
                            .map(color => `<option value="${color}">${color}</option>`)
                            .join("")}
                        </select>
                      </div>

                      <div class="mb-3">
                        <label for="size" class="form-label">Size</label>
                        <select id="size" class="form-select">
                          <option value="">-- Choose a size --</option>
                        </select>
                      </div>

                      <div class="mb-3">
                        <label for="quantity" class="form-label">Quantity</label>
                        <input type="number" id="quantity" class="form-control" style="max-width: 100px;" min="1" value="1">
                      </div>
                    </div>

                    <button class="btn btn-primary btn-lg" onclick="addToCart('${product.product_key}')">Add to Cart</button>
                </div>
              </div>
            </div>
        `;

    // Store variants in window for later use
    window.currentProduct = product;
  } catch (error) {
    console.error("Error loading product:", error);
    loading.style.display = "none";
    detail.style.display = "none";
    errorEl.style.display = "block";
  }
});

function updateSizes() {
  const colorSelect = document.getElementById("color");
  const sizeSelect = document.getElementById("size");
  const selectedColor = colorSelect.value;

  // Clear existing sizes
  sizeSelect.innerHTML = '<option value="">-- Choose a size --</option>';

  if (selectedColor && window.currentProduct) {
    const sizes = Object.keys(window.currentProduct.variants[selectedColor] || {});
    sizes.forEach(size => {
      const option = document.createElement("option");
      option.value = size;
      option.textContent = size;
      sizeSelect.appendChild(option);
    });
  }
}

function addToCart(productKey) {
  const colorSelect = document.getElementById("color");
  const sizeSelect = document.getElementById("size");
  const quantity = document.getElementById("quantity").value;

  const color = colorSelect.value;
  const size = sizeSelect.value;

  if (!color || !size) {
    alert("Please select a color and size.");
    return;
  }

  // Get variant ID
  const variantId = window.currentProduct.variants[color][size].variant_id;

  alert(`Added ${quantity} x ${window.currentProduct.title} (${color} / ${size}) to cart!\nVariant ID: ${variantId}`);
  // TODO: Implement actual cart functionality
}
