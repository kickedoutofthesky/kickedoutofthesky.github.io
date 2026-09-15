/**
 * Product Page Utilities - Refactored for Testability
 * Pure functions separated from DOM operations
 */

/**
 * Pure function: Get color names from product
 */
export function getColorNamesFromProduct(product) {
  if (!product || !product.variants || typeof product.variants !== "object") {
    return [];
  }

  return Object.keys(product.variants);
}

/**
 * Pure function: Get sizes for a specific color
 */
export function getSizesForColor(product, colorName) {
  if (!product || !product.variants || !product.variants[colorName]) {
    return [];
  }

  const colorData = product.variants[colorName];
  if (!colorData.sizes || typeof colorData.sizes !== "object") {
    return [];
  }

  return Object.keys(colorData.sizes);
}

/**
 * Pure function: Get variant ID for color and size
 */
export function getVariantIdForColorSize(product, colorName, sizeName) {
  if (!product || !product.variants || !product.variants[colorName]) {
    return null;
  }

  const colorData = product.variants[colorName];
  if (!colorData.sizes || !colorData.sizes[sizeName]) {
    return null;
  }

  return colorData.sizes[sizeName].variant_id || null;
}

/**
 * Pure function: Get price for color and size
 */
export function getPriceForColorSize(product, colorName, sizeName) {
  if (!product || !product.variants || !product.variants[colorName]) {
    return null;
  }

  const colorData = product.variants[colorName];
  if (!colorData.sizes || !colorData.sizes[sizeName]) {
    return null;
  }

  const sizeData = colorData.sizes[sizeName];
  return sizeData.price_cents || null;
}

/**
 * Pure function: Get image for color
 */
export function getImageForColor(product, colorName) {
  if (!product) {
    return null;
  }

  if (colorName && product.variants && product.variants[colorName]) {
    const colorData = product.variants[colorName];
    if (colorData.image) {
      return colorData.image;
    }
  }

  return product.image || null;
}

/**
 * Pure function: Get all mockups for color
 */
export function getMockupsForColor(product, colorName) {
  if (!product || !product.variants || !product.variants[colorName]) {
    return [];
  }

  const colorData = product.variants[colorName];
  if (colorData.mockups && Array.isArray(colorData.mockups)) {
    return colorData.mockups;
  }

  if (colorData.image) {
    return [colorData.image];
  }

  return [];
}

/**
 * Pure function: Validate form data
 */
export function validateProductFormData(formData) {
  return !!(formData && !!formData.color && !!formData.size && formData.quantity > 0 && formData.quantity < 1000);
}

/**
 * Pure function: Get price range from product variants
 */
export function getPriceRangeFromProduct(product) {
  if (!product || !product.variants || typeof product.variants !== "object") {
    return { min: 0, max: 0 };
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

  if (prices.length === 0) {
    return { min: 0, max: 0 };
  }

  const sorted = [...prices].sort((a, b) => a - b);
  return {
    min: sorted[0] / 100,
    max: sorted[sorted.length - 1] / 100,
  };
}

/**
 * Pure function: Build form data from selections
 */
export function buildProductFormData(colorName, sizeName, quantity, variantId, priceCents) {
  return {
    color: colorName,
    size: sizeName,
    quantity: parseInt(quantity, 10),
    variant_id: variantId,
    price_cents: priceCents,
  };
}

/**
 * Pure function: Check if product is sticker
 */
export function isProductSticker(product) {
  if (!product || !product.title) {
    return false;
  }

  return product.title.toLowerCase().includes("sticker");
}

/**
 * Pure function: Normalize image path
 */
export function normalizeImagePath(path, baseUrl = "/store") {
  if (!path) {
    return "";
  }

  // Already absolute
  if (path.startsWith("/") || path.startsWith("http")) {
    return path;
  }

  // Relative path - add base URL
  return `${baseUrl}/${path}`;
}

/**
 * Pure function: Encode image URI
 */
export function encodeImageUri(path) {
  if (!path) {
    return "";
  }

  return encodeURI(path);
}

/**
 * Pure function: Zoom level constraints
 */
export function constrainZoomLevel(zoomLevel, minZoom = 100, maxZoom = 300) {
  return Math.max(minZoom, Math.min(zoomLevel, maxZoom));
}

/**
 * Pure function: Calculate zoom increment
 */
export function calculateZoomIncrement(direction, step = 20) {
  if (direction === "in") {
    return step;
  } else if (direction === "out") {
    return -step;
  }
  return 0;
}

/**
 * Pure function: Validate carousel index
 */
export function validateCarouselIndex(index, maxIndex) {
  return Math.max(0, Math.min(index, maxIndex));
}

export default {
  getColorNamesFromProduct,
  getSizesForColor,
  getVariantIdForColorSize,
  getPriceForColorSize,
  getImageForColor,
  getMockupsForColor,
  validateProductFormData,
  getPriceRangeFromProduct,
  buildProductFormData,
  isProductSticker,
  normalizeImagePath,
  encodeImageUri,
  constrainZoomLevel,
  calculateZoomIncrement,
  validateCarouselIndex,
};
