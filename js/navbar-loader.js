/**
 * Navbar Loader - Loads shared navbar into all pages
 * Handles path adjustments based on page location
 */

async function loadNavbar() {
  try {
    // Fetch the navbar template from root directory
    const response = await fetch("/navbar.html");
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

    // Position content after navbar loads
    setTimeout(positionContent, 50);
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
 * Position content to account for navbar height
 */
function positionContent() {
  const navbar = document.getElementById("navbarMain");
  const legalContainer = document.querySelector(".legal-container");
  const mainContent = document.getElementById("main-content");
  const categoryFilter = document.getElementById("category-filter");

  if (navbar) {
    const navHeight = navbar.offsetHeight;

    if (categoryFilter) {
      // Merch page with category filter
      categoryFilter.style.top = navHeight + "px";
      const filterHeight = categoryFilter.offsetHeight;
      mainContent.style.paddingTop = navHeight + filterHeight + "px";
    } else if (mainContent) {
      // Cart/Order Status pages without category filter
      mainContent.style.paddingTop = navHeight + "px";
    } else if (legalContainer) {
      // Legal pages
      legalContainer.style.paddingTop = navHeight + 20 + "px";
    }
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

// Reposition on window resize
window.addEventListener("resize", positionContent);
window.addEventListener("load", positionContent);
