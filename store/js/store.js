// Store - Product Grid
document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("products-grid");
  const loading = document.getElementById("loading");
  const errorEl = document.getElementById("error");

  try {
    // Fetch products data
    const response = await fetch("./data/products.json");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const products = await response.json();

    // Clear loading state
    loading.style.display = "none";

    // Render products grid
    grid.innerHTML = ""; // Clear any placeholder content

    if (products.length === 0) {
      grid.innerHTML = "<p class='text-center col-12'>No products available.</p>";
      return;
    }

    products.forEach(product => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.title}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22280%22 height=%22250%22%3E%3Crect fill=%22%23e0e0e0%22 width=%22280%22 height=%22250%22/%3E%3C/svg%3E'">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.title}</h3>
                    <p class="product-price">${product.display_price}</p>
                    <a href="product.html?key=${product.product_key}" class="btn btn-primary">View Details</a>
                </div>
            `;
      grid.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading products:", error);
    loading.style.display = "none";
    grid.style.display = "none";
    errorEl.style.display = "block";
  }
});
