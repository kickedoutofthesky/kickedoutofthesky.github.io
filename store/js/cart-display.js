// Cart Display & Checkout
/* eslint-disable-next-line no-unused-vars */
/* global cart, updateCartQuantity, removeFromCart, showCartBadgeBurst */

import { initializeCurrency, updateCurrencyForCountry, formatPrice } from "./utils/currency.js";
import { extractQuoteData, isValidQuote } from "./utils/fixtures/cart-utilities.js";
import { getVariantIdForColorSize, getImageForColor } from "./utils/fixtures/product-utilities.js";

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
    if (hasCartItems && !countryManuallySet && geoCountry && select.querySelector(`option[value="${geoCountry}"]`)) {
      select.value = geoCountry;
      localStorage.setItem("selectedShippingCountry", geoCountry);
      localStorage.setItem("countryManuallySet", "false");
      console.log(`✓ Cart: Auto-selected country from geo-location: ${geoCountry}`);
      // Fetch quote for the auto-selected country
      debouncedFetchQuote();
    } else if (savedCountry && select.querySelector(`option[value="${savedCountry}"]`)) {
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

        // IMPORTANT: Clear current quote immediately so checkout button is disabled
        // until a fresh quote loads. This prevents stale calculationId issues.
        currentQuote = null;
        updateOrderSummaryDisplay(null);

        // Update currency display for the newly selected country
        await updateCurrencyForCountry(select.value);

        updateCheckoutButtonState();
        // Fetch quote with debouncing for the new country
        if (select.value) {
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
  const cartLoading = document.getElementById("cart-loading");

  if (!cart || !cart.items || cart.items.length === 0) {
    cartItems.style.display = "none";
    cartLoading.style.display = "none";
    emptyCart.style.display = "block";
    if (cartSummary) cartSummary.style.display = "none";
    currentQuote = null;
    return;
  }

  // Cart has items - always show items, loading widget shown during quote fetch
  emptyCart.style.display = "none";
  cartLoading.style.display = "none"; // Hide initially - will show when quote is being fetched
  cartItems.style.display = "grid"; // Always show items
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

// Convert relative image paths to absolute URLs for Stripe
function getAbsoluteImageUrl(relativePath) {
  // If already an absolute URL, return as-is
  if (!relativePath || /^https?:\/\//.test(relativePath)) {
    return relativePath;
  }

  // Build absolute URL with production domain and store path
  // Image paths like "assets/images/..." need to be /store/assets/images/...
  const productionDomain = "https://kickedoutofthesky.com";
  const imagePath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return `${productionDomain}/store${imagePath}`;
}

// Transform cart items to SKU format for API (wrapper around utility function)
function buildQuoteItems() {
  // Convert cart items to checkout format with full product details
  const items = cart.items
    .map(item => {
      // Find the product for this cart item
      const product = products.find(p => p.product_key === item.productKey);
      if (!product) {
        return null; // Skip items without products
      }

      // Get the variant_id for this color/size combination
      const variantId = getVariantIdForColorSize(product, item.color, item.size);
      if (!variantId) {
        return null; // Skip items without valid variants
      }

      const imageUrl = getImageForColor(product, item.color) || product.image;
      return {
        variant_id: variantId,
        quantity: item.quantity,
        name: product.title || product.name, // Use title (from products.json) or name as fallback
        image: getAbsoluteImageUrl(imageUrl),
        color: item.color,
        size: item.size,
      };
    })
    .filter(item => item !== null); // Remove null items

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
  if (!cart || !cart.items || cart.items.length === 0) {
    currentQuote = null;
    updateOrderSummaryDisplay(null);
    return;
  }

  // Show loading state for both cart and quote sections
  const cartLoading = document.getElementById("cart-loading");
  if (cartLoading) cartLoading.style.display = "block";
  showQuoteLoading(true);
  hideQuoteError();

  try {
    // Build payload: cart items have productKey/color/size, need to resolve to variant_id/sku
    const items = cart.items
      .map(item => {
        // Validate quantity exists and is a positive integer
        if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity <= 0) {
          console.error(`Invalid quantity for cart item: ${item.productKey} - quantity: ${item.quantity}`);
          return null;
        }

        const product = products.find(p => p.product_key === item.productKey);
        if (!product) {
          console.error(`Product not found for cart item: ${item.productKey}`);
          return null;
        }

        const variantId = getVariantIdForColorSize(product, item.color, item.size);
        if (!variantId) {
          console.error(`Variant not found for ${item.productKey} - ${item.color} - ${item.size}`);
          return null;
        }

        return {
          sku: String(variantId),
          quantity: item.quantity,
        };
      })
      .filter(item => item !== null);

    if (items.length === 0) {
      throw new Error("No valid cart items to quote");
    }

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

    const quoteData = await response.json();
    console.log("Quote response:", quoteData); // Debug: log the full quote response

    // Use utility function to normalize quote data
    currentQuote = extractQuoteData(quoteData);

    if (!isValidQuote(currentQuote)) {
      throw new Error("Invalid quote data received from server");
    }

    updateOrderSummaryDisplay(currentQuote);
    showQuoteLoading(false);
    // Hide loading widget on success
    const cartLoading = document.getElementById("cart-loading");
    if (cartLoading) cartLoading.style.display = "none";
  } catch (error) {
    console.error("Error fetching quote:", error);
    showQuoteError(error.message || "Failed to calculate order total. Please try again.");
    showQuoteLoading(false);
    // Hide loading widget on error too
    const cartLoading = document.getElementById("cart-loading");
    if (cartLoading) cartLoading.style.display = "none";
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
  const cartLoading = document.getElementById("cart-loading");
  const currencyEl = document.getElementById("currency-display");
  const subtotalEl = document.getElementById("subtotal");
  const taxLabelEl = document.getElementById("tax-label");
  const taxValueEl = document.getElementById("tax-value");
  const importDutiesEl = document.getElementById("import-duties-note");

  if (!contentEl || !subtotalEl) return;

  if (!quote) {
    contentEl.style.display = "none";
    // Hide loading widget when quote is cleared
    if (cartLoading) cartLoading.style.display = "none";
    return;
  }

  // Hide loading widget when quote is ready
  if (cartLoading) cartLoading.style.display = "none";

  // Use utility function to normalize quote data if not already normalized
  const normalizedQuote = quote.subtotal !== undefined ? quote : extractQuoteData(quote);

  // Display currency code
  // Fallback to window.customerCurrency if quote doesn't have currency
  const currency = normalizedQuote.currency || (window.customerCurrency && window.customerCurrency.currency) || "USD";

  if (currencyEl && currency) {
    currencyEl.textContent = currency;
  }

  contentEl.style.display = "block";

  // Get prices from normalized quote (already in cents from utility function)
  const subtotalConverted = normalizedQuote.subtotal;
  const taxConverted = normalizedQuote.tax;
  const totalConverted = normalizedQuote.total;

  // Format amounts using the target currency
  const subtotalFormatted = formatPrice(subtotalConverted, currency);
  const taxFormatted = formatPrice(taxConverted, currency);

  // Update subtotal
  subtotalEl.textContent = subtotalFormatted;

  // Handle tax/VAT label and display
  let taxLabel;
  let taxLabelNote;
  let taxValue;

  // Determine if this is a VAT country based on taxIncluded flag
  if (normalizedQuote.taxIncluded) {
    // VAT country - tax is included in the price
    taxLabel = "VAT:";
    taxLabelNote = "";
    taxValue = "Included in price";
  } else {
    // Tax country - tax will be calculated at checkout
    taxLabel = "Tax:";
    taxLabelNote = "";
    // If tax value is 0 and we don't have it yet, show the note in the value
    if (taxConverted === 0) {
      taxValue = "Calculated at checkout";
    } else {
      taxValue = taxFormatted;
    }
  }

  // Update tax label with colon and note
  if (taxLabelEl) {
    taxLabelEl.innerHTML = `${taxLabel}<span id="tax-label-note" style="font-size: 0.95rem; color: #999">${taxLabelNote}</span>`;
  }
  taxValueEl.textContent = taxValue;

  // Show import duties note if applicable
  if (importDutiesEl) {
    importDutiesEl.style.display = quote.importDutiesNote ? "block" : "none";
  }

  // Update checkout button state (only enable if quote is fresh and terms accepted)
  updateCheckoutButtonState();
}

function updateCartQuantity(index, quantity) {
  if (quantity <= 0) {
    removeFromCart(index);
  } else {
    cart.updateQuantity(index, quantity);
    displayCart();
    showCartBadgeBurst();
  }
}

function removeFromCart(index) {
  cart.removeItem(index);
  displayCart();
  showCartBadgeBurst();
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
      shippingCountry: countrySelect.value,
      termsAccepted: termsCheckbox.checked,
    };

    let checkoutUrl = backendUrl + "/api/create-checkout-session";
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

    console.log("Checkout response:", data);

    // Cart will be cleared on success.html after payment is confirmed
    // This preserves items if user abandons checkout or encounters an error

    // Redirect to Stripe Checkout Session (handle both redirect_url and url fields)
    const stripeUrl = data.redirect_url || data.url;
    if (stripeUrl) {
      window.location.href = stripeUrl;
    } else {
      throw new Error("No redirect_url or url provided by server");
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
  module.exports = {
    getProductImage,
    debounce,
    generateCSRFToken,
    getCSRFToken,
    updateCheckoutButtonState,
    buildQuoteItems,
    populateCountrySelect,
    initializeCountryDefaults,
  };
}
