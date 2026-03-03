// Store - Product Grid
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
      card.style.cursor = "pointer";

      card.innerHTML = `
        <div class="product-image">
          <img src="${product.image}" alt="${product.title}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22280%22 height=%22250%22%3E%3Crect fill=%22%23666%22 width=%22280%22 height=%22250%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2218%22 fill=%22%23fff%22%3EImage not available%3C/text%3E%3C/svg%3E'">
        </div>
        <div class="product-info">
          <h3 class="product-name">${product.title}</h3>
          <p class="product-price">${product.display_price}</p>
          <a href="product.html?key=${product.product_key}" class="btn btn-warning btn-sm">
            View Details
          </a>
        </div>
      `;

      card.addEventListener("click", () => {
        window.location.href = `product.html?key=${product.product_key}`;
      });

      grid.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading products:", error);
    grid.style.display = "none";
    errorState.style.display = "block";
  }
});
