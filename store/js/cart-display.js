// Cart Display & Checkout
/* eslint-disable-next-line no-unused-vars */
/* global cart, updateCartQuantity, removeFromCart, showCartBadgeBurst */

let products = [];
let countries = [];

// Make sure cart is ready before displaying
function waitForCart(callback) {
  if (typeof cart !== "undefined" && cart) {
    callback();
  } else {
    setTimeout(() => waitForCart(callback), 100);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Wait for cart to be ready
  waitForCart(async () => {
    // Debug: Check if cart exists
    console.log("cart object exists:", typeof cart !== "undefined");
    console.log("cart object:", typeof cart !== "undefined" ? cart : "UNDEFINED");

    // Force reload cart from localStorage to ensure we have latest items
    if (typeof cart !== "undefined" && cart && typeof cart.loadCart === "function") {
      const freshItems = cart.loadCart();
      console.log("Fresh items from localStorage:", freshItems);
      cart.items = freshItems;
    }

    await loadProducts();
    await loadCountries();
    displayCart();
    setupCountrySelector();
    setupCheckout();
  });
});

async function loadProducts() {
  try {
    const response = await fetch("./data/products.json");
    if (!response.ok) throw new Error("Failed to load products");
    products = await response.json();
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

async function loadCountries() {
  try {
    const response = await fetch("./data/printful-shipping-countries.json");
    if (!response.ok) throw new Error("Failed to load countries");
    countries = await response.json();
    populateCountrySelect();
  } catch (error) {
    console.error("Error loading countries:", error);
  }
}

function populateCountrySelect() {
  const select = document.getElementById("shipping-country");
  if (!select) return;

  // Add all countries as options
  countries.forEach(country => {
    const option = document.createElement("option");
    option.value = country.code;
    option.textContent = country.name;
    select.appendChild(option);
  });
}

function setupCountrySelector() {
  const select = document.getElementById("shipping-country");
  const checkoutBtn = document.getElementById("checkout-btn");

  if (select && checkoutBtn) {
    // Restore previously selected country from localStorage
    const savedCountry = localStorage.getItem("selectedShippingCountry");
    if (savedCountry) {
      select.value = savedCountry;
      checkoutBtn.disabled = false;
    } else {
      checkoutBtn.disabled = select.value === "";
    }

    select.addEventListener("change", () => {
      // Enable checkout button only if a country is selected
      checkoutBtn.disabled = select.value === "";
    });
  }
}

function displayCart() {
  const cartItems = document.getElementById("cart-items");
  const cartSummary = document.getElementById("cart-summary");
  const emptyCart = document.getElementById("empty-cart");

  // Debug logging
  console.log("displayCart called");
  console.log("cart object:", cart);
  console.log("cart.items:", cart?.items);
  console.log("localStorage content:", localStorage.getItem("kots_cart"));

  if (!cart || !cart.items || cart.items.length === 0) {
    cartItems.style.display = "none";
    emptyCart.style.display = "block";
    if (cartSummary) cartSummary.style.display = "none";
    return;
  }

  emptyCart.style.display = "none";
  cartItems.style.display = "grid";
  if (cartSummary) cartSummary.style.display = "block";

  cartItems.innerHTML = "";

  cart.items.forEach((item, index) => {
    const product = products.find(p => p.product_key === item.productKey);
    if (!product) return;

    const image = getProductImage(product, item.color);
    const itemIsSticker = product.title.toLowerCase().includes("sticker");
    const pricePerItem = cart.getPriceForVariant(product, item.color, item.size);
    const lineTotal = pricePerItem * item.quantity;

    const itemCard = document.createElement("div");
    itemCard.setAttribute("data-testid", "cart-item");
    itemCard.style.cssText =
      "background: #0f0f0f; padding: 20px; border-radius: 8px; border: 1px solid #1a1a1a; display: flex; gap: 20px; cursor: pointer; transition: background 0.2s;";

    const productUrl = `product.html?key=${encodeURIComponent(item.productKey)}&color=${encodeURIComponent(item.color)}&size=${encodeURIComponent(item.size)}&quantity=${item.quantity}`;

    // Make entire card clickable, but let buttons/inputs handle their own clicks
    itemCard.addEventListener("click", e => {
      if (e.target.closest("button") || e.target.closest("input")) return;
      window.location.href = productUrl;
    });
    itemCard.addEventListener("mouseenter", () => {
      itemCard.style.background = "#1a1a1a";
    });
    itemCard.addEventListener("mouseleave", () => {
      itemCard.style.background = "#0f0f0f";
    });

    itemCard.innerHTML = `
      <div style="width: 120px; height: 120px; flex-shrink: 0; background: #1a1a1a; border-radius: 4px; overflow: hidden;">
        <img src="${image}" alt="${product.title}" style="width: 100%; height: 100%; object-fit: cover; image-rendering: auto;${itemIsSticker ? " transform: scale(1.75);" : ""}">
      </div>
      <div style="flex: 1; text-align: left;">
        <h4 style="color: #fff; margin-bottom: 8px;" data-testid="item-name">${product.title}</h4>
        <p style="color: #ccc; font-size: 0.9rem; margin: 4px 0;">Color: ${item.color}</p>
        <p style="color: #ccc; font-size: 0.9rem; margin: 4px 0;">Size: ${item.size}</p>
        <div style="display: flex; gap: 10px; align-items: center; margin-top: 15px;">
          <span style="color: #ffc107; font-weight: bold;" data-testid="item-price">$${(pricePerItem / 100).toFixed(2)}</span>
          <span style="color: #ccc;">×</span>
          <button onclick="updateCartQuantity(${index}, ${item.quantity - 1})" style="background: #333; color: #fff; border: none; width: 30px; height: 30px; cursor: pointer; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem;"><i class="fas fa-minus"></i></button>
          <input type="text" data-testid="quantity-input" value="${item.quantity}" readonly style="width: 50px; padding: 5px; background: #1a1a1a; color: #fff; border: 1px solid #333; text-align: center; border-radius: 4px;">
          <button onclick="updateCartQuantity(${index}, ${item.quantity + 1})" style="background: #333; color: #fff; border: none; width: 30px; height: 30px; cursor: pointer; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem;"><i class="fas fa-plus"></i></button>
          <span style="color: #ccc; margin-left: auto;">Total: <span style="color: #ffc107; font-weight: bold;">$${(lineTotal / 100).toFixed(2)}</span></span>
          <button onclick="removeFromCart(${index})" data-testid="remove-item" style="background: none; color: #fff; border: none; padding: 8px 0 8px 12px; cursor: pointer; font-size: 1.1rem;"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;

    cartItems.appendChild(itemCard);
  });

  updateCartSummary();
}

function updateCartSummary() {
  const subtotalEl = document.getElementById("subtotal");
  const totalEl = document.getElementById("total");

  if (!subtotalEl || !totalEl) return;

  const subtotalCents = cart.getSubtotalCents(products);
  const subtotalDollars = subtotalCents / 100;

  subtotalEl.textContent = `$${subtotalDollars.toFixed(2)}`;
  totalEl.textContent = `$${subtotalDollars.toFixed(2)}`;
}

// eslint-disable-next-line no-unused-vars
function updateCartQuantity(index, quantity) {
  if (quantity <= 0) {
    removeFromCart(index);
  } else {
    cart.updateQuantity(index, quantity);
    displayCart();
    showCartBadgeBurst();
  }
}

// eslint-disable-next-line no-unused-vars
function removeFromCart(index) {
  cart.removeItem(index);
  displayCart();
  showCartBadgeBurst();
}

function getProductImage(product, color) {
  // Use color-specific image if available
  if (color && product.variants[color] && product.variants[color].image) {
    return product.variants[color].image;
  }
  // Fallback to product image
  return product.image;
}

function setupCheckout() {
  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", proceedToCheckout);
  }
}

async function proceedToCheckout() {
  if (cart.items.length === 0) {
    alert("Your cart is empty");
    return;
  }

  // Check if country is selected
  const countrySelect = document.getElementById("shipping-country");
  if (!countrySelect || countrySelect.value === "") {
    alert("Please select a shipping country");
    return;
  }

  // Validate cart items before proceeding
  const validation = cart.validateItemsForCheckout(products);
  if (!validation.valid) {
    alert("Cannot proceed to checkout:\n\n" + validation.errors.join("\n"));
    console.error("Checkout validation errors:", validation.errors);
    return;
  }

  try {
    // Save the selected country to localStorage
    localStorage.setItem("selectedShippingCountry", countrySelect.value);

    // Disable checkout button during processing
    const checkoutBtn = document.getElementById("checkout-btn");
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Processing...";

    // Transform cart items for backend
    const items = cart.items
      .map(item => {
        const product = products.find(p => p.product_key === item.productKey);
        if (!product) return null;

        const variantId = product.variants[item.color]?.sizes?.[item.size]?.variant_id;

        return {
          variant_id: variantId,
          quantity: item.quantity,
        };
      })
      .filter(item => item !== null);

    // Call backend checkout endpoint
    const backendUrl = window.__API_URL__ || "https://kickedoutofthesky-store.vercel.app";
    const response = await fetch(backendUrl + "/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items,
        shippingCountry: countrySelect.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Parse error response from backend
      const errorMessage = data.error || data.message || "Checkout failed";
      console.error("Checkout error:", errorMessage);
      alert("Checkout failed: " + errorMessage);

      // Restore button state on error
      const checkoutBtn = document.getElementById("checkout-btn");
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = "Proceed to Checkout";
      return;
    }

    // Redirect to Stripe checkout using the new response format
    // (Cart will be cleared on success page after payment confirmation)
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error("No checkout URL provided by server");
    }
  } catch (error) {
    console.error("Checkout error:", error);
    alert("Checkout failed: " + (error.message || "Please try again."));

    // Restore button state on error
    const checkoutBtn = document.getElementById("checkout-btn");
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = "Proceed to Checkout";
  }
}

// Allow importing in Node.js (Jest tests) while keeping browser globals
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getProductImage };
}
