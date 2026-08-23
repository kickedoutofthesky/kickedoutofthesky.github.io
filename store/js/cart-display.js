// Cart Display & Checkout
/* eslint-disable-next-line no-unused-vars */
/* global cart, updateCartQuantity, removeFromCart, showCartBadgeBurst */

import { initializeCurrency, updateCurrencyForCountry, convertPrice, formatPrice } from "./utils/currency.js";

let products = [];
let countries = [];
let quoteDebounceTimer = null;
let currentQuote = null;
let isCheckingOut = false;

/**
 * Initialize localStorage defaults for country selection
 * Sets US as the default country unless already set
 */
function initializeCountryDefaults() {
  if (!localStorage.getItem("selectedShippingCountry")) {
    localStorage.setItem("selectedShippingCountry", "US");
    localStorage.setItem("countryManuallySet", "false");
    console.log("✓ Initialized localStorage with default country: US");
  }
}

// Initialize country defaults immediately when module loads
initializeCountryDefaults();

// Debounce utility function
function debounce(func, delayMs) {
  return function debounced(...args) {
    clearTimeout(quoteDebounceTimer);
    quoteDebounceTimer = setTimeout(() => {
      func.apply(this, args);
    }, delayMs);
  };
}

// CSRF Token Management
function generateCSRFToken() {
  // Generate a random token (in production, get this from server)
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Fallback for Node.js environment (tests)
  return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
}

function getCSRFToken() {
  // Only try to use sessionStorage in browser environment
  if (typeof sessionStorage === "undefined") {
    return generateCSRFToken();
  }

  let token = sessionStorage.getItem("csrf_token");
  if (!token) {
    token = generateCSRFToken();
    sessionStorage.setItem("csrf_token", token);
    // Also set in meta tag if it doesn't exist
    if (!document.querySelector('meta[name="csrf-token"]')) {
      const meta = document.createElement("meta");
      meta.name = "csrf-token";
      meta.content = token;
      document.head.appendChild(meta);
    }
  }
  return token;
}

// Initialize CSRF token on page load (only in browser environment)
if (typeof sessionStorage !== "undefined") {
  getCSRFToken();
}

// Make sure cart is ready before displaying
function waitForCart(callback) {
  if (typeof cart !== "undefined" && cart) {
    callback();
  } else {
    setTimeout(() => waitForCart(callback), 100);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize currency from geo-location first
  await initializeCurrency();

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

function updateCheckoutButtonState() {
  const checkoutBtn = document.getElementById("checkout-btn");
  const select = document.getElementById("shipping-country");
  const termsCheckbox = document.getElementById("terms-checkbox");
  if (!checkoutBtn) return;

  const countrySelected = select && select.value !== "";
  const termsAccepted = termsCheckbox && termsCheckbox.checked;
  const quoteLoaded = currentQuote !== null && currentQuote !== undefined;

  // Disable if: no country, no terms, no quote, or already checking out
  checkoutBtn.disabled = !countrySelected || !termsAccepted || !quoteLoaded || isCheckingOut;
}

function setupCountrySelector() {
  const select = document.getElementById("shipping-country");
  const termsCheckbox = document.getElementById("terms-checkbox");

  if (select) {
    // Restore previously selected country from localStorage
    // This will be the geo-detected country (from initializeCurrency on product page)
    // or the customer's previously chosen country (which overrides geo-location)
    const savedCountry = localStorage.getItem("selectedShippingCountry");
    const countryManuallySet = localStorage.getItem("countryManuallySet") === "true";

    // Check if cart has items and no country is selected
    const hasCartItems = cart && cart.items && cart.items.length > 0;
    const geoCountry = window.customerCurrency?.country;

    // Auto-select geo-detected country if cart has items and no country is saved
    // Only auto-select if user hasn't manually set a country before
    if (hasCartItems && !countryManuallySet && geoCountry && select.options.namedItem(geoCountry)) {
      select.value = geoCountry;
      localStorage.setItem("selectedShippingCountry", geoCountry);
      localStorage.setItem("countryManuallySet", "false");
      console.log(`✓ Cart: Auto-selected country from geo-location: ${geoCountry}`);
      // Fetch quote for the auto-selected country
      debouncedFetchQuote();
    } else if (savedCountry && select.options.namedItem(savedCountry)) {
      // Only set if the country exists in the dropdown
      select.value = savedCountry;
      console.log(`✓ Cart: Restored country from storage: ${savedCountry} (manually set: ${countryManuallySet})`);
      // Fetch quote for the saved country
      debouncedFetchQuote();
    }

    select.addEventListener("change", async () => {
      if (!isCheckingOut) {
        // Save customer's chosen country to localStorage
        localStorage.setItem("selectedShippingCountry", select.value);
        // Mark that user manually selected this country (prevents geo overwrite)
        localStorage.setItem("countryManuallySet", "true");
        console.log(`✓ Cart: Updated shipping country to ${select.value} (user selected)`);

        // Update currency display for the newly selected country
        await updateCurrencyForCountry(select.value);

        updateCheckoutButtonState();
        // Clear quote if no country selected
        if (!select.value) {
          currentQuote = null;
          updateOrderSummaryDisplay(null);
        } else {
          // Fetch quote with debouncing
          debouncedFetchQuote();
        }
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

// Debounced quote fetch (~400ms)
const debouncedFetchQuote = debounce(fetchQuote, 400);

function displayCart() {
  const cartItems = document.getElementById("cart-items");
  const cartSummary = document.getElementById("cart-summary");
  const emptyCart = document.getElementById("empty-cart");

  if (!cart || !cart.items || cart.items.length === 0) {
    cartItems.style.display = "none";
    emptyCart.style.display = "block";
    if (cartSummary) cartSummary.style.display = "none";
    currentQuote = null;
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
      <div style="width: 120px; height: 120px; flex-shrink: 0; background: #1a1a1a; border-radius: 4px; overflow: hidden;">
        <img loading="lazy" src="${image}" alt="${product.title}" style="width: 100%; height: 100%; object-fit: cover; image-rendering: auto;${itemIsSticker ? " transform: scale(1.75);" : ""}">
      </div>
      <div style="flex: 1; text-align: left;">
        <h4 style="color: #fff; margin-bottom: 8px;" data-testid="item-name">${product.title}</h4>
        <p style="color: #ccc; font-size: 0.9rem; margin: 4px 0;">Color: ${item.color}</p>
        <p style="color: #ccc; font-size: 0.9rem; margin: 4px 0;">Size: ${item.size}</p>
        <div style="display: flex; gap: 10px; align-items: center; margin-top: 15px;">
          <span style="color: #ffc107; font-weight: bold;" data-testid="item-price">${formatCurrency(pricePerItem, "USD")}</span>
          <span style="color: #ccc;">×</span>
          <button class="cart-qty-btn" onclick="updateCartQuantity(${index}, ${item.quantity - 1})" style="background: #3a3a3a; color: #fff; border: none; width: 22px; height: 22px; padding: 0; cursor: pointer; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; line-height: 1;"><i class="fas fa-minus" style="font-size: 0.55rem;"></i></button>
          <input type="text" class="quantity-input" data-testid="quantity-input" value="${item.quantity}" readonly style="width: 50px; padding: 5px; background: #1a1a1a; color: #fff; border: 1px solid #333; text-align: center; border-radius: 4px;">
          <button class="cart-qty-btn" onclick="updateCartQuantity(${index}, ${item.quantity + 1})" style="background: #3a3a3a; color: #fff; border: none; width: 22px; height: 22px; padding: 0; cursor: pointer; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; line-height: 1;"><i class="fas fa-plus" style="font-size: 0.55rem;"></i></button>
          <span style="color: #ccc; margin-left: auto;">Total: <span style="color: #ffc107; font-weight: bold;">${formatCurrency(lineTotal, "USD")}</span></span>
          <button onclick="removeFromCart(${index})" data-testid="remove-item" style="background: none; color: #fff; border: none; padding: 8px 0 8px 12px; cursor: pointer; font-size: 1.1rem;"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;

    cartItems.appendChild(itemCard);
  });

  // Trigger quote fetch if country is selected (with debouncing)
  const countrySelect = document.getElementById("shipping-country");
  if (countrySelect && countrySelect.value && !isCheckingOut) {
    debouncedFetchQuote();
  }
}

// Transform cart items to SKU format for API
function buildQuoteItems() {
  const items = [];
  cart.items.forEach(item => {
    const product = products.find(p => p.product_key === item.productKey);
    if (product) {
      const variantId = product.variants[item.color]?.sizes?.[item.size]?.variant_id;
      if (variantId) {
        items.push({
          sku: variantId,
          qty: item.quantity,
        });
      }
    }
  });
  return items;
}

async function fetchQuote() {
  const countrySelect = document.getElementById("shipping-country");
  if (!countrySelect || !countrySelect.value) {
    currentQuote = null;
    updateOrderSummaryDisplay(null);
    return;
  }

  const country = countrySelect.value;
  const items = buildQuoteItems();

  if (items.length === 0) {
    currentQuote = null;
    updateOrderSummaryDisplay(null);
    return;
  }

  // Show loading state
  showQuoteLoading(true);
  hideQuoteError();

  try {
    const backendUrl = window.__API_URL__ || "https://api.kickedoutofthesky.com";
    const response = await fetch(`${backendUrl}/api/quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items,
        country,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch quote");
    }

    const quote = await response.json();
    currentQuote = quote;
    updateOrderSummaryDisplay(quote);
    showQuoteLoading(false);
  } catch (error) {
    console.error("Error fetching quote:", error);
    showQuoteError(error.message || "Failed to calculate order total. Please try again.");
    showQuoteLoading(false);
  }
}

function showQuoteLoading(isLoading) {
  const loadingEl = document.getElementById("quote-loading");
  const contentEl = document.getElementById("summary-content");
  if (loadingEl && contentEl) {
    loadingEl.style.display = isLoading ? "block" : "none";
    contentEl.style.display = isLoading ? "none" : "block";
  }
}

function showQuoteError(errorMessage) {
  const errorEl = document.getElementById("quote-error");
  const errorTextEl = document.getElementById("quote-error-text");
  if (errorEl && errorTextEl) {
    errorTextEl.textContent = errorMessage;
    errorEl.style.display = "block";
  }
}

function hideQuoteError() {
  const errorEl = document.getElementById("quote-error");
  if (errorEl) {
    errorEl.style.display = "none";
  }
}

function formatCurrency(minorUnits, currency, locale) {
  // Convert minor units (cents) to dollars/euros/etc
  const divisor = 100; // assuming cents-based currencies
  const amount = minorUnits / divisor;

  // Normalize currency to uppercase
  const currencyUpper = (currency || "USD").toUpperCase();

  // Map currency codes to their proper locales for toLocaleString()
  const localeMap = {
    USD: "en-US", // $1,234.50
    EUR: "de-DE", // €1.234,50
    GBP: "en-GB", // £1,234.50
    CAD: "en-CA", // $1,234.50
    AUD: "en-AU", // $1,234.50
    JPY: "ja-JP", // ¥123,450
    CNY: "zh-CN", // ¥1,234.50
    INR: "en-IN", // ₹1,234.50
  };

  // Use provided locale or map to appropriate locale for the currency
  const targetLocale = locale || localeMap[currencyUpper] || "en-US";

  // Format using toLocaleString with currency option
  try {
    return new Intl.NumberFormat(targetLocale, {
      style: "currency",
      currency: currencyUpper,
      minimumFractionDigits: currencyUpper === "JPY" || currencyUpper === "CNY" ? 0 : 2,
      maximumFractionDigits: currencyUpper === "JPY" || currencyUpper === "CNY" ? 0 : 2,
    }).format(amount);
  } catch (error) {
    // Fallback if Intl.NumberFormat fails
    console.warn(`Currency formatting error for ${currencyUpper}:`, error);
    const currencySymbols = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      CAD: "C$",
      AUD: "A$",
      JPY: "¥",
      CNY: "¥",
      INR: "₹",
    };
    const symbol = currencySymbols[currencyUpper] || currencyUpper;
    if (currencyUpper === "JPY" || currencyUpper === "CNY") {
      return `${symbol}${Math.round(amount)}`;
    }
    return `${symbol}${amount.toFixed(2)}`;
  }
}

function updateOrderSummaryDisplay(quote) {
  const contentEl = document.getElementById("summary-content");
  const subtotalEl = document.getElementById("subtotal");
  const shippingEl = document.getElementById("shipping-value");
  const taxLabelEl = document.getElementById("tax-label");
  const taxValueEl = document.getElementById("tax-value");
  const taxRowEl = document.getElementById("tax-row");
  const totalEl = document.getElementById("total");
  const importDutiesEl = document.getElementById("import-duties-note");

  if (!contentEl || !subtotalEl) return;

  if (!quote) {
    contentEl.style.display = "none";
    return;
  }

  contentEl.style.display = "block";

  // Get customer's currency if available, otherwise use quote currency
  const customerCurrency = window.customerCurrency;
  const targetCurrency = customerCurrency?.currency || quote.currency || "USD";

  // Convert prices from USD to customer's currency if needed
  let subtotalConverted = quote.subtotal;
  let shippingConverted = quote.shipping;
  let taxConverted = quote.tax;
  let totalConverted = quote.total;

  if (customerCurrency && targetCurrency !== "USD") {
    // Convert all amounts using the convertPrice function
    subtotalConverted = convertPrice(quote.subtotal);
    shippingConverted = convertPrice(quote.shipping);
    taxConverted = convertPrice(quote.tax);
    totalConverted = convertPrice(quote.total);
  }

  // Format amounts using the target currency
  const subtotalFormatted = formatPrice(subtotalConverted, targetCurrency);
  const shippingFormatted = formatPrice(shippingConverted, targetCurrency);
  const taxFormatted = formatPrice(taxConverted, targetCurrency);
  const totalFormatted = formatPrice(totalConverted, targetCurrency);

  // Update subtotal, shipping, and total
  subtotalEl.textContent = subtotalFormatted;
  shippingEl.textContent = shippingFormatted;
  totalEl.textContent = totalFormatted;

  // Handle tax/VAT display based on tax amount
  let taxLabel = "Tax/VAT:";
  let taxValue = taxFormatted;

  // If there is tax, show "Tax" with the amount
  if (taxConverted > 0) {
    taxLabel = "Tax:";
    taxValue = taxFormatted;
  } else {
    // If tax is 0, show "VAT" and "Included"
    taxLabel = "VAT:";
    taxValue = "Included";
  }

  taxLabelEl.textContent = taxLabel;
  taxValueEl.textContent = taxValue;

  // Style tax row: muted if tax is included in price
  if (quote.taxIncluded) {
    taxRowEl.style.opacity = "0.6";
    taxRowEl.style.fontSize = "0.9rem";
  } else {
    taxRowEl.style.opacity = "1";
    taxRowEl.style.fontSize = "1rem";
  }

  // Show import duties note if applicable
  if (importDutiesEl) {
    importDutiesEl.style.display = quote.importDutiesNote ? "block" : "none";
  }

  // Update checkout button state (only enable if quote is fresh and terms accepted)
  updateCheckoutButtonState();
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

  // Check if terms are accepted
  const termsCheckbox = document.getElementById("terms-checkbox");
  if (!termsCheckbox || !termsCheckbox.checked) {
    alert("You must agree to the Terms & Conditions to place an order.");
    return;
  }

  // Check if quote is loaded
  if (!currentQuote || !currentQuote.calculationId) {
    alert("Unable to proceed: Order total calculation failed. Please try again.");
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
    isCheckingOut = true;

    // Lock country selector during checkout
    countrySelect.disabled = true;

    // Country already saved to localStorage when dropdown changed
    // No need to save again here (already saved in event listener)

    // Disable checkout button during processing
    const checkoutBtn = document.getElementById("checkout-btn");
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Processing...";

    // Build items in SKU format for checkout
    const items = buildQuoteItems();

    // Call backend checkout endpoint with calculationId
    const backendUrl = window.__API_URL__ || "https://api.kickedoutofthesky.com";
    const isLocalhost = backendUrl.includes("localhost");
    const isStaging = backendUrl.includes("api-staging.");
    const headers = {
      "Content-Type": "application/json",
    };

    // Only add CSRF token for production URLs
    if (!isLocalhost && !isStaging) {
      const csrfToken = getCSRFToken();
      headers["X-CSRF-Token"] = csrfToken;
    }

    const requestBody = {
      calculationId: currentQuote.calculationId,
      items,
      country: countrySelect.value,
    };

    let checkoutUrl = backendUrl + "/api/checkout";
    if (backendUrl.includes("api-staging.kickedoutofthesky.com")) {
      checkoutUrl += "?x-vercel-protection-bypass=Xq8xpir5ZCR25Za5w6rpHxLofddagWJA";
    }

    const response = await fetch(checkoutUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || data.message || "Checkout failed";
      console.error("Checkout error:", errorMessage);
      alert("Checkout failed: " + errorMessage);

      // Restore UI state on error
      isCheckingOut = false;
      countrySelect.disabled = false;
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = "Proceed to Checkout";
      return;
    }

    // Use Stripe's redirect with client_secret for hosted checkout or embedded checkout
    if (data.client_secret) {
      // For hosted checkout, redirect to Stripe
      // For embedded checkout, you'd initialize Stripe.js here
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        // Alternative: use client_secret with Stripe.js or redirect to success
        alert("Payment initiated. Please complete payment.");
      }
    } else {
      throw new Error("No client_secret provided by server");
    }
  } catch (error) {
    console.error("Checkout error:", error);
    alert("Checkout failed: " + (error.message || "Please try again."));

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
  module.exports = { getProductImage };
}
