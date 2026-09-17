/**
 * Order Status Utilities - Refactored for Testability
 * Pure functions separated from DOM operations
 */

/**
 * Validate email address format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export function isValidEmail(email) {
  if (!email || typeof email !== "string") {
    return false;
  }

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate Printful Order ID format
 * @param {string} orderId - Order ID to validate
 * @returns {boolean} - True if valid order ID format
 */
export function isValidPrintfulOrderId(orderId) {
  if (!orderId || typeof orderId !== "string") {
    return false;
  }

  // Printful Order IDs: minimum 5 characters, alphanumeric
  // Can be: PF123456789, ABC123456789, eoKK1upmt2jl99BK1qYLDjbYH1gwUZeh, etc.
  const orderIdRegex = /^[a-zA-Z0-9]{5,}$/;
  return orderIdRegex.test(orderId.trim());
}

/**
 * Format timestamp to human-readable date string
 * @param {number|string} timestamp - Unix timestamp in milliseconds
 * @returns {string} - Formatted date string
 */
export function formatDate(timestamp) {
  if (!timestamp) {
    return "—";
  }

  try {
    const date = new Date(parseInt(timestamp));

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "—";
    }

    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    };

    return date.toLocaleDateString("en-US", options);
  } catch (error) {
    return "—";
  }
}

/**
 * Format short date (no time)
 * @param {number|string} timestamp - Unix timestamp in milliseconds
 * @returns {string} - Formatted short date
 */
export function formatShortDate(timestamp) {
  if (!timestamp) {
    return "—";
  }

  try {
    const date = new Date(parseInt(timestamp));

    if (isNaN(date.getTime())) {
      return "—";
    }

    const options = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };

    return date.toLocaleDateString("en-US", options);
  } catch (error) {
    return "—";
  }
}

/**
 * Format order status to display text
 * @param {string} status - Order status
 * @returns {string} - Formatted status text
 */
export function formatStatus(status) {
  const statuses = {
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    fulfilled: "Fulfilled",
  };

  return statuses[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : "—");
}

/**
 * Format tracking status to display text
 * @param {string} status - Tracking status
 * @returns {string} - Formatted tracking status
 */
export function formatTrackingStatus(status) {
  const statuses = {
    pending: "Pending",
    in_transit: "In Transit",
    out_for_delivery: "Out for Delivery",
    attempted_delivery: "Attempted Delivery",
    returned: "Returned",
    delivered: "Delivered",
    failed: "Failed",
    expired: "Expired",
  };

  return statuses[status] || (status ? status.replace(/_/g, " ").toUpperCase() : "—");
}

/**
 * Get country flag emoji from country code
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {string} - Flag emoji or default globe
 */
export function getCountryFlag(countryCode) {
  if (!countryCode || typeof countryCode !== "string" || countryCode.length !== 2) {
    return "🌍";
  }

  try {
    // Convert country code to regional indicator symbols for flag emoji
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch (error) {
    return "🌍";
  }
}

/**
 * Parse cost values (handle string or number)
 * @param {string|number} value - Cost value to parse
 * @returns {number} - Parsed value as integer cents
 */
export function parseCostCents(value) {
  if (typeof value === "number") {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      return 0;
    }
    // If string value is in dollars (e.g., "70.00"), convert to cents
    if (value.includes(".")) {
      return Math.round(parsed * 100);
    }
    // If already in cents
    return Math.round(parsed);
  }

  return 0;
}

/**
 * Format cents as currency string
 * @param {number} cents - Amount in cents
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} - Formatted currency string
 */
export function formatCurrencyAmount(cents, currency = "USD") {
  const symbols = {
    USD: "$",
    GBP: "£",
    EUR: "€",
    CAD: "$",
    AUD: "$",
    JPY: "¥",
  };

  const symbol = symbols[currency] || "$";
  const amount = Math.abs(cents) / 100;
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Build order summary object from order data
 * @param {object} orderData - Order data from API
 * @returns {object} - Order summary object
 */
export function buildOrderSummary(orderData) {
  if (!orderData) {
    return null;
  }

  const costs = orderData.costs || {};
  const recipient = orderData.recipient || {};
  const address = recipient.address || {};

  return {
    orderId: orderData.printful_order_id || "—",
    status: orderData.status || "unknown",
    createdAt: orderData.created_at,
    recipient: {
      name: recipient.name || "—",
      email: recipient.email || "—",
      address: {
        line1: address.line1 || "—",
        line2: address.line2 || "",
        city: address.city || "—",
        state: address.state || "",
        zip: address.zip || "—",
        country: address.country || "—",
        countryCode: address.country_code || "",
      },
    },
    costs: {
      subtotalCents: parseCostCents(costs.subtotal_cents),
      shippingCents: parseCostCents(costs.shipping_cents),
      taxCents: parseCostCents(costs.tax_cents),
      totalCents: parseCostCents(costs.total_cents),
    },
    items: Array.isArray(orderData.items) ? orderData.items : [],
    shipments: Array.isArray(orderData.shipments) ? orderData.shipments : [],
  };
}

/**
 * Validate order data structure
 * @param {object} orderData - Order data to validate
 * @returns {boolean} - True if valid order data
 */
export function isValidOrderData(orderData) {
  return !!(
    orderData &&
    typeof orderData === "object" &&
    orderData.printful_order_id &&
    orderData.status &&
    orderData.recipient
  );
}

/**
 * Check if order is pending
 * @param {string} status - Order status
 * @returns {boolean} - True if status is pending
 */
export function isPendingOrder(status) {
  return status === "pending";
}

/**
 * Check if order is processing
 * @param {string} status - Order status
 * @returns {boolean} - True if status is processing-related
 */
export function isProcessingOrder(status) {
  return ["processing", "shipped", "delivered", "fulfilled"].includes(status);
}

/**
 * Check if order has tracking information
 * @param {object} orderData - Order data
 * @returns {boolean} - True if order has shipments with tracking
 */
export function hasTrackingInfo(orderData) {
  if (!orderData || !Array.isArray(orderData.shipments)) {
    return false;
  }

  return orderData.shipments.length > 0 && orderData.shipments.some(s => s.tracking_number);
}

/**
 * Get latest shipment from order
 * @param {object} orderData - Order data
 * @returns {object|null} - Latest shipment or null
 */
export function getLatestShipment(orderData) {
  if (!orderData || !Array.isArray(orderData.shipments) || orderData.shipments.length === 0) {
    return null;
  }

  return orderData.shipments[orderData.shipments.length - 1];
}

/**
 * Extract shipment ID suffix (for display)
 * @param {string} shipmentId - Full shipment ID
 * @returns {string} - Extracted ID or original
 */
export function extractShipmentIdSuffix(shipmentId) {
  if (!shipmentId || typeof shipmentId !== "string") {
    return "—";
  }

  // If ID contains "-", return the part after the last dash
  if (shipmentId.includes("-")) {
    return shipmentId.split("-").pop();
  }

  return shipmentId;
}

/**
 * Build error message from API response
 * @param {number} statusCode - HTTP status code
 * @param {object} responseData - Response data from API
 * @returns {string} - Error message
 */
export function buildErrorMessage(statusCode, responseData = {}) {
  let message = responseData.error || responseData.message || "Failed to fetch order status";

  if (statusCode === 404) {
    message = "Order not found. Please check your Order ID and email address.";
  } else if (statusCode === 403) {
    message = "The email address does not match this order. Please verify and try again.";
  } else if (statusCode === 500) {
    message = "Server error. Please try again later.";
  } else if (statusCode >= 400 && statusCode < 500) {
    message = "Invalid request. Please check your input and try again.";
  } else if (statusCode >= 500) {
    message = "Server error. Please try again later.";
  }

  return message;
}
