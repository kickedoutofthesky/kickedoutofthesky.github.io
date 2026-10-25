// Cart Display & Checkout - New Implementation
/* eslint-disable-next-line no-unused-vars */
/* global cart, updateCartQuantity, removeFromCart, showCartBadgeBurst */

import { formatUSD } from "../../js/money.js";
import { getVariantIdForColorSize } from "./utils/fixtures/product-utilities.js";
import { COUNTRY_NAMES, getCountryName, sortCountries } from "../../js/allowed-countries.js";

let products = [];
let countryCodes = [];
let isCheckingOut = false;
let currentShippingCost = null;
let shippingCalculationTimeout = null;
let shippingRequestId = 0;

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
    // Force reload cart from localStorage to ensure we have latest items
    if (typeof cart !== "undefined" && cart && typeof cart.loadCart === "function") {
      cart.items = cart.loadCart();
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
    // Use local allowed countries data instead of API call
    countryCodes = Object.keys(COUNTRY_NAMES);
    populateCountrySelect();
  } catch (error) {
    console.error("Error loading countries:", error);
  }
}

function populateCountrySelect() {
  const select = document.getElementById("shipping-country");
  if (!select) return;

  // Sort countries with priority at top
  const sorted = sortCountries(countryCodes);

  // Add all countries as options
  sorted.forEach(code => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = getCountryName(code);
    select.appendChild(option);
  });
}

function updateCheckoutButtonState() {
  const checkoutBtn = document.getElementById("checkout-btn");
  const select = document.getElementById("shipping-country");
  const termsCheckbox = document.getElementById("terms-checkbox");
  if (!checkoutBtn) return;

  const countrySelected = select && select.value !== "";
  const termsAccepted = termsCheckbox && termsCheckbox.checked;

  // Disable if: no country, no terms, or already checking out
  checkoutBtn.disabled = !countrySelected || !termsAccepted || isCheckingOut;
}

// Resolve cart items to Printful sync variant IDs; items that can't be resolved are skipped
function getCartVariantItems() {
  if (!cart || !Array.isArray(cart.items)) return [];
  return cart.items
    .map(item => {
      const product = products.find(p => p.product_key === item.productKey);
      if (!product) return null;

      const variantId = getVariantIdForColorSize(product, item.color, item.size);
      if (!variantId) return null;

      return { variantId, quantity: item.quantity };
    })
    .filter(item => item !== null);
}

function getShippingErrorMessage(apiError) {
  const message = String(apiError || "").toLowerCase();
  if (
    message.includes("shipping to this country") ||
    message.includes("has been disabled") ||
    message.includes("is not supported")
  ) {
    return "We can't ship to this country.";
  }
  return "Shipping will be calculated at checkout.";
}

async function calculateShippingEstimate(country) {
  if (shippingCalculationTimeout) {
    clearTimeout(shippingCalculationTimeout);
    shippingCalculationTimeout = null;
  }

  // Invalidates any in-flight request so its response is ignored
  const requestId = ++shippingRequestId;

  const items = getCartVariantItems().map(item => ({
    variant_id: Number(item.variantId),
    quantity: item.quantity,
  }));

  // Without items the backend falls back to a one-tee estimate, which would be misleading
  if (!country || items.length === 0) {
    currentShippingCost = null;
    updateShippingEstimateDisplay();
    return;
  }

  // Show loading state
  const shippingEl = document.getElementById("shipping-estimate");
  if (shippingEl) {
    shippingEl.textContent = "Calculating...";
    shippingEl.style.color = "";
  }

  try {
    const backendUrl = window.__API_URL__;
    const response = await fetch(`${backendUrl}/api/calculate-shipping`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ country, items }),
    });

    const data = await response.json().catch(() => ({}));

    if (requestId !== shippingRequestId) return;

    if (!response.ok) {
      const apiError = data.error || data.message;
      console.warn(`API error (POST /api/calculate-shipping): ${response.status} - ${apiError}`);
      currentShippingCost = null;

      const isBadCartData = /quantity for variant|must have a variant_id/i.test(apiError || "");
      if (isBadCartData) {
        console.error("Shipping estimate rejected cart data:", apiError, items);
        updateShippingEstimateDisplay();
      } else {
        updateShippingEstimateDisplay(getShippingErrorMessage(apiError));
      }
      return;
    }

    // Options are sorted cheapest first
    const amount = data.shipping_options?.[0]?.shipping_rate_data?.fixed_amount?.amount;
    if (amount !== undefined) {
      currentShippingCost = amount;
      updateShippingEstimateDisplay();
      return;
    }

    currentShippingCost = null;
    updateShippingEstimateDisplay("Shipping will be calculated at checkout.");
  } catch (error) {
    if (requestId !== shippingRequestId) return;
    console.error("Shipping calculation error:", error);
    currentShippingCost = null;
    updateShippingEstimateDisplay("Shipping will be calculated at checkout.");
  }
}

function updateShippingEstimateDisplay(message = null) {
  const shippingEl = document.getElementById("shipping-estimate");
  if (!shippingEl) return;

  if (message) {
    shippingEl.textContent = message;
    shippingEl.style.color = "#ff6b6b";
  } else if (currentShippingCost !== null) {
    shippingEl.textContent = formatUSD(currentShippingCost);
    shippingEl.style.color = "";
  } else {
    shippingEl.textContent = "—";
    shippingEl.style.color = "";
  }
}

// Re-estimates 300ms after the last change, using the country selected at that moment
function debouncedCalculateShipping() {
  if (shippingCalculationTimeout) {
    clearTimeout(shippingCalculationTimeout);
  }

  shippingCalculationTimeout = setTimeout(() => {
    shippingCalculationTimeout = null;
    const select = document.getElementById("shipping-country");
    calculateShippingEstimate(select ? select.value : "");
  }, 300);
}

function setupCountrySelector() {
  const select = document.getElementById("shipping-country");
  const termsCheckbox = document.getElementById("terms-checkbox");

  if (select) {
    // Restore previously selected country from localStorage with try/catch for private browsing
    try {
      const savedCountry = localStorage.getItem("selectedShippingCountry");
      if (savedCountry && select.querySelector(`option[value="${savedCountry}"]`)) {
        select.value = savedCountry;
        console.log(`✓ Cart: Restored country from storage: ${savedCountry}`);
        updateShippingToLine();
        // Calculate shipping for restored country
        calculateShippingEstimate(savedCountry);
      }
    } catch {
      // Private browsing or localStorage disabled - silently continue
      console.warn("localStorage unavailable, proceeding without saved country");
    }

    select.addEventListener("change", () => {
      if (!isCheckingOut) {
        // Save customer's chosen country to localStorage with try/catch for private browsing
        try {
          if (select.value) {
            localStorage.setItem("selectedShippingCountry", select.value);
            console.log(`✓ Cart: Updated shipping country to ${select.value}`);
          }
        } catch {
          // Private browsing or localStorage disabled - silently continue
          console.warn("localStorage unavailable, country not persisted");
        }

        updateShippingToLine();
        updateCheckoutButtonState();
        debouncedCalculateShipping();
      }
    });
  }

  if (termsCheckbox) {
    termsCheckbox.addEventListener("change", () => {
      updateCheckoutButtonState();
    });
  }

  updateCheckoutButtonState();
}

function updateShippingToLine() {
  const select = document.getElementById("shipping-country");
  const shippingToEl = document.getElementById("shipping-to-line");

  if (!shippingToEl || !select || !select.value) {
    if (shippingToEl) shippingToEl.style.display = "none";
    return;
  }

  const countryName = getCountryName(select.value);
  shippingToEl.innerHTML = `
    <p style="margin: 0; color: #999; font-size: 0.9rem; line-height: 1.6;">
      Shipping to <strong>${countryName}</strong>, calculated at checkout.<br/>
      To ship somewhere else, change the country above before continuing.
    </p>
  `;
  shippingToEl.style.display = "block";
}

function displayCart() {
  const cartItems = document.getElementById("cart-items");
  const cartSummary = document.getElementById("cart-summary");
  const emptyCart = document.getElementById("empty-cart");

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
      "background: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #262626; display: flex; gap: 20px; cursor: pointer; transition: background 0.2s;";

    const productUrl = `product.html?key=${encodeURIComponent(item.productKey)}&color=${encodeURIComponent(item.color)}&size=${encodeURIComponent(item.size)}&quantity=${item.quantity}`;

    // Make entire card clickable, but let buttons/inputs handle their own clicks
    itemCard.addEventListener("click", e => {
      if (e.target.closest("button") || e.target.closest("input")) return;
      window.location.href = productUrl;
    });
    itemCard.addEventListener("mouseenter", () => {
      itemCard.style.background = "#262626";
    });
    itemCard.addEventListener("mouseleave", () => {
      itemCard.style.background = "#1a1a1a";
    });

    itemCard.innerHTML = `
      <div class="cart-item-image" style="background: #1a1a1a; border-radius: 4px; overflow: hidden;">
        <img loading="lazy" src="${image}" alt="${product.title}" style="width: 100%; height: 100%; object-fit: cover; image-rendering: auto;${itemIsSticker ? " transform: scale(1.75);" : ""}">
      </div>
      <div class="cart-item-details" style="text-align: left;">
        <h4 style="color: #fff; margin-bottom: 8px;" data-testid="item-name">${product.title}</h4>
        <p style="color: #ccc; font-size: 0.9rem; margin: 4px 0;">Color: ${item.color}</p>
        <p style="color: #ccc; font-size: 0.9rem; margin: 4px 0;">Size: ${item.size}</p>
        <div class="cart-item-qty-row" style="display: flex; gap: 10px; align-items: center; margin-top: 15px;">
          <span style="color: #ffc107; font-weight: bold;" data-testid="item-price">${formatUSD(pricePerItem)}</span>
          <span style="color: #ccc;">×</span>
          <button class="cart-qty-btn" onclick="updateCartQuantity(${index}, ${item.quantity - 1})" style="background: #3a3a3a; color: #fff; border: none; width: 22px; height: 22px; padding: 0; cursor: pointer; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; line-height: 1;"><i class="fas fa-minus" style="font-size: 0.55rem;"></i></button>
          <input type="text" class="quantity-input" data-testid="quantity-input" value="${item.quantity}" readonly style="width: 50px; padding: 5px; background: #1a1a1a; color: #fff; border: 1px solid #333; text-align: center; border-radius: 4px;">
          <button class="cart-qty-btn" onclick="updateCartQuantity(${index}, ${item.quantity + 1})" style="background: #3a3a3a; color: #fff; border: none; width: 22px; height: 22px; padding: 0; cursor: pointer; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; line-height: 1;"><i class="fas fa-plus" style="font-size: 0.55rem;"></i></button>
          <span class="cart-item-line-total" style="display: flex; align-items: center; gap: 10px; margin-left: auto;">
            <span style="color: #ccc;">=</span>
            <span style="color: #ffc107; font-weight: bold;">${formatUSD(lineTotal)}</span>
            <button onclick="removeFromCart(${index})" data-testid="remove-item" style="background: none; color: #fff; border: none; padding: 8px 0 8px 12px; cursor: pointer; font-size: 1.1rem;"><i class="fas fa-trash"></i></button>
          </span>
        </div>
      </div>
    `;

    cartItems.appendChild(itemCard);
  });

  // Update subtotal display
  updateSubtotalDisplay();
}

function updateSubtotalDisplay() {
  const subtotalEl = document.getElementById("subtotal");
  if (!subtotalEl) return;

  // Calculate subtotal from cart items
  let subtotalCents = 0;
  cart.items.forEach(item => {
    const product = products.find(p => p.product_key === item.productKey);
    if (product) {
      const price = cart.getPriceForVariant(product, item.color, item.size);
      subtotalCents += price * item.quantity;
    }
  });

  subtotalEl.textContent = formatUSD(subtotalCents);
}

function updateCartQuantity(index, quantity) {
  if (quantity <= 0) {
    removeFromCart(index);
  } else {
    cart.updateQuantity(index, quantity);
    displayCart();
    showCartBadgeBurst();
    debouncedCalculateShipping();
  }
}

function removeFromCart(index) {
  cart.removeItem(index);
  displayCart();
  showCartBadgeBurst();
  debouncedCalculateShipping();
}

function getProductImage(product, color) {
  // Use color-specific image if available
  if (color && product.variants && product.variants[color] && product.variants[color].image) {
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

function showCheckoutError(errorMessage) {
  const errorEl = document.getElementById("checkout-error");
  const errorTextEl = document.getElementById("checkout-error-text");
  if (errorEl && errorTextEl) {
    errorTextEl.textContent = errorMessage;
    errorEl.style.display = "block";
    // Scroll to error
    errorEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function hideCheckoutError() {
  const errorEl = document.getElementById("checkout-error");
  if (errorEl) {
    errorEl.style.display = "none";
  }
}

async function proceedToCheckout() {
  // Prevent double-click
  if (isCheckingOut) return;

  hideCheckoutError();

  if (cart.items.length === 0) {
    showCheckoutError("Your cart is empty");
    return;
  }

  // Check if country is selected
  const countrySelect = document.getElementById("shipping-country");
  if (!countrySelect || countrySelect.value === "") {
    showCheckoutError("Please select a shipping country");
    return;
  }

  // Check if terms are accepted
  const termsCheckbox = document.getElementById("terms-checkbox");
  if (!termsCheckbox || !termsCheckbox.checked) {
    showCheckoutError("You must agree to the Terms & Conditions to place an order.");
    return;
  }

  // Validate cart items before proceeding
  const validation = cart.validateItemsForCheckout(products);
  if (!validation.valid) {
    showCheckoutError("Cannot proceed to checkout:\n\n" + validation.errors.join("\n"));
    console.error("Checkout validation errors:", validation.errors);
    return;
  }

  try {
    isCheckingOut = true;

    // Lock country selector during checkout
    countrySelect.disabled = true;

    // Disable checkout button and show pending state
    const checkoutBtn = document.getElementById("checkout-btn");
    checkoutBtn.disabled = true;
    const originalText = checkoutBtn.textContent;
    checkoutBtn.textContent = "Processing...";

    // Build items for checkout: variant_id and quantity only
    const items = getCartVariantItems().map(item => ({
      variantId: String(item.variantId),
      quantity: item.quantity,
    }));

    if (items.length === 0) {
      throw new Error("No valid cart items");
    }

    // Call backend checkout endpoint
    const backendUrl = window.__API_URL__;
    const response = await fetch(`${backendUrl}/api/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items,
        country: countrySelect.value,
        termsAccepted: termsCheckbox.checked,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        `API error (POST /api/create-checkout-session): ${response.status} - ${data.error || data.message}`
      );

      // Handle specific error cases
      if (response.status === 422 && data.code === "unsupported_destination") {
        const countryName = getCountryName(countrySelect.value);
        showCheckoutError(
          `We're not able to ship to ${countryName} right now. Try another destination, or email us and we'll see what we can do.`
        );
      } else {
        showCheckoutError(data.error || data.message || "Checkout failed. Please try again.");
      }

      // Restore UI state on error
      isCheckingOut = false;
      countrySelect.disabled = false;
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = originalText;
      return;
    }

    console.log("Checkout response:", data);

    // Redirect to Stripe Checkout Session
    const stripeUrl = data.redirect_url || data.url;
    if (stripeUrl) {
      window.location.href = stripeUrl;
    } else {
      throw new Error("No redirect_url provided by server");
    }
  } catch (error) {
    console.error("Checkout error:", error);
    showCheckoutError(error.message || "Checkout failed. Please try again.");

    // Restore UI state on error
    isCheckingOut = false;
    const countrySelect = document.getElementById("shipping-country");
    if (countrySelect) countrySelect.disabled = false;

    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = "Proceed to Checkout";
    }
  }
}

// Expose functions to global scope for HTML onclick handlers
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;

// Allow importing in Node.js (Jest tests) while keeping browser globals
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    getProductImage,
    updateCheckoutButtonState,
  };
}
