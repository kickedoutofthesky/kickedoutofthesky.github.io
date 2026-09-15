/**
 * Cart Display Utilities - Refactored for Testability
 * Pure functions separated from DOM operations
 */

/**
 * Pure function: Extract prices from product variants
 * No DOM dependencies, fully testable
 */
export function extractPricesFromProduct(product) {
  if (!product || !product.variants || typeof product.variants !== "object") {
    return [];
  }

  const prices = [];
  Object.values(product.variants).forEach(color => {
    if (color && typeof color === "object" && color.sizes) {
      Object.values(color.sizes).forEach(size => {
        if (size && typeof size.price_cents === "number") {
          prices.push(size.price_cents);
        }
      });
    }
  });

  return prices;
}

/**
 * Pure function: Calculate price range
 * No DOM dependencies
 */
export function calculatePriceRange(prices) {
  if (!Array.isArray(prices) || prices.length === 0) {
    return { min: 0, max: 0 };
  }

  const sorted = [...prices].sort((a, b) => a - b);
  return {
    min: sorted[0] / 100,
    max: sorted[sorted.length - 1] / 100,
  };
}

/**
 * Pure function: Format price for display
 * No DOM dependencies
 */
export function formatPriceForDisplay(minCents, maxCents) {
  const formatCents = cents => `$${(cents / 100).toFixed(2)}`;

  if (minCents === maxCents) {
    return formatCents(minCents);
  }

  return `${formatCents(minCents)} - ${formatCents(maxCents)}`;
}

/**
 * Pure function: Build cart item from form data
 * No DOM dependencies
 */
export function buildCartItem(product, formData) {
  if (!product || !formData) {
    return null;
  }

  return {
    product_key: product.product_key,
    title: product.title,
    image: product.image,
    color: formData.color,
    size: formData.size,
    variant_id: formData.variant_id,
    quantity: formData.quantity,
    price_cents: formData.price_cents,
  };
}

/**
 * Pure function: Validate cart item
 * No DOM dependencies
 */
export function validateCartItem(item) {
  return !!(item && item.product_key && item.variant_id && item.quantity > 0 && item.quantity < 1000);
}

/**
 * Pure function: Get product image for variant
 * No DOM dependencies
 */
export function getProductImageForVariant(product, colorName) {
  if (!product) {
    return null;
  }

  if (colorName && product.variants && product.variants[colorName]) {
    const colorVariant = product.variants[colorName];
    if (colorVariant.image) {
      return colorVariant.image;
    }
  }

  return product.image;
}

/**
 * Pure function: Build quote request payload
 * No DOM dependencies
 */
export function buildQuoteRequestPayload(cartItems, country) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return null;
  }

  if (!country) {
    return null;
  }

  return {
    items: cartItems.map(item => ({
      sku: String(item.variant_id),
      quantity: item.quantity,
    })),
    country: country,
  };
}

/**
 * Pure function: Extract quote data from API response
 * Handles multiple response formats
 */
export function extractQuoteData(response) {
  if (!response) {
    return null;
  }

  // Handle response with nested prices object
  const prices = response.prices || response;

  return {
    subtotal: prices.subtotal || 0,
    shipping: prices.shipping || 0,
    tax: prices.tax || 0,
    total: prices.total || 0,
    currency: response.currency || "USD",
    taxLabel: response.taxLabel || "Tax",
    shippingNote: response.shippingNote || "",
    calculationId: response.calculationId || null,
  };
}

/**
 * Pure function: Validate quote data
 */
export function isValidQuote(quote) {
  return !!(quote && typeof quote.total === "number" && quote.total > 0 && quote.currency);
}

/**
 * Pure function: Format currency value
 */
export function formatCurrency(cents, currency = "USD") {
  const symbols = {
    USD: "$",
    GBP: "£",
    EUR: "€",
    CAD: "$",
    AUD: "$",
    JPY: "¥",
  };

  const symbol = symbols[currency] || "$";
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

/**
 * Pure function: Calculate order total
 */
export function calculateOrderTotal(items) {
  if (!Array.isArray(items)) {
    return 0;
  }

  return items.reduce((total, item) => {
    const itemPrice = item.price_cents || 0;
    const itemQuantity = item.quantity || 0;
    return total + itemPrice * itemQuantity;
  }, 0);
}

/**
 * Pure function: Build checkout payload
 */
export function buildCheckoutPayload(cartItems, country, customerEmail) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return null;
  }

  return {
    items: cartItems.map(item => ({
      variant_id: item.variant_id,
      quantity: item.quantity,
    })),
    country: country,
    email: customerEmail,
    csrf_token: typeof window !== "undefined" ? window.csrfToken : null,
  };
}

export default {
  extractPricesFromProduct,
  calculatePriceRange,
  formatPriceForDisplay,
  buildCartItem,
  validateCartItem,
  getProductImageForVariant,
  buildQuoteRequestPayload,
  extractQuoteData,
  isValidQuote,
  formatCurrency,
  calculateOrderTotal,
  buildCheckoutPayload,
};
