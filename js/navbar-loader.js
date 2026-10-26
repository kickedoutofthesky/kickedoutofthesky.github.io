/**
 * Navbar Loader - Loads shared navbar into all pages
 * Handles path adjustments based on page location
 */

async function loadNavbar() {
  try {
    // Fetch the navbar template from root directory
    const response = await fetch("/navbar.html?v=20261026130000");
    if (!response.ok) throw new Error("Failed to load navbar");

    let navbarHtml = await response.text();

    // Create a temporary container
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = navbarHtml;

    // Insert navbar at the beginning of body
    document.body.insertBefore(tempDiv.firstElementChild, document.body.firstChild);

    // Initialize cart badge
    updateCartBadge();

    // Listen for storage changes (cart updates from other tabs)
    window.addEventListener("storage", updateCartBadge);

    // Keep the merch page's sticky category bar directly below the navbar
    pinCategoryFilter();
  } catch (error) {
    console.error("Error loading navbar:", error);
  }
}

/**
 * Update cart badge count from localStorage
 */
function updateCartBadge() {
  try {
    const cart = JSON.parse(localStorage.getItem("kots_cart")) || [];
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const badge = document.getElementById("cart-badge");
    if (badge) {
      badge.style.display = totalItems > 0 ? "flex" : "none";
      badge.textContent = totalItems;
    }
  } catch (e) {
    console.error("Error updating cart badge:", e);
  }
}

/**
 * The navbar is position: sticky, so page content flows below it on its own (no padding to compute).
 * Only the merch page's sticky category bar needs to know the navbar height for its `top`. A
 * ResizeObserver tracks real navbar size changes, unlike window resize events, which mobile
 * browsers fire constantly while their toolbars collapse and expand.
 */
function pinCategoryFilter() {
  const navbar = document.getElementById("navbarMain");
  const categoryFilter = document.getElementById("category-filter");
  if (!navbar || !categoryFilter) return;

  const update = () => {
    categoryFilter.style.top = navbar.offsetHeight + "px";
  };
  update();
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(update).observe(navbar);
  }
}

/**
 * Load navbar when DOM is ready
 */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadNavbar);
} else {
  loadNavbar();
}
