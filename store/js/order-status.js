// Order Status Page
/* eslint-disable-next-line no-unused-vars */

let products = [];

document.addEventListener("DOMContentLoaded", async () => {
  await loadProducts();
  setupEventListeners();

  // Check if there's a stored order to restore from session
  const storedOrderData = sessionStorage.getItem("kots_order_data");
  if (storedOrderData) {
    try {
      const orderData = JSON.parse(storedOrderData);
      displayOrder(orderData);
    } catch (error) {
      console.error("Error restoring stored order:", error);
      // If restore fails, proceed to normal flow
      checkForAutoLoad();
    }
  } else {
    checkForAutoLoad();
  }
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

function setupEventListeners() {
  const searchBtn = document.getElementById("search-btn");
  const printfulOrderIdInput = document.getElementById("printful-order-id");
  const emailInput = document.getElementById("email");

  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearch);
  }

  // Allow Enter key to trigger search
  if (printfulOrderIdInput) {
    printfulOrderIdInput.addEventListener("keypress", e => {
      if (e.key === "Enter") handleSearch();
    });
    // Real-time validation to highlight button
    printfulOrderIdInput.addEventListener("input", updateButtonState);
    printfulOrderIdInput.addEventListener("change", updateButtonState);
  }

  if (emailInput) {
    emailInput.addEventListener("keypress", e => {
      if (e.key === "Enter") handleSearch();
    });
    // Real-time validation to highlight button
    emailInput.addEventListener("input", updateButtonState);
    emailInput.addEventListener("change", updateButtonState);
  }

  // Initialize button state on load
  updateButtonState();
}

function updateButtonState() {
  const emailInput = document.getElementById("email");
  const printfulOrderIdInput = document.getElementById("printful-order-id");
  const searchBtn = document.getElementById("search-btn");
  const email = emailInput.value.trim();
  const printfulOrderId = printfulOrderIdInput.value.trim();

  // Both email and Printful Order ID are required
  const isValid =
    email &&
    isValidEmail(email) &&
    printfulOrderId &&
    isValidPrintfulOrderId(printfulOrderId);

  if (isValid) {
    searchBtn.classList.add("active");
    searchBtn.disabled = false;
  } else {
    searchBtn.classList.remove("active");
    searchBtn.disabled = true;
  }
}

function checkForAutoLoad() {
  // Check if printful_order_id and email are in URL query parameters
  // Note: printful_order_id is now required
  const params = new URLSearchParams(window.location.search);
  const printfulOrderId = params.get("printful_order_id");
  const email = params.get("email");

  if (email && printfulOrderId) {
    document.getElementById("email").value = email;
    document.getElementById("printful-order-id").value = printfulOrderId;
    handleSearch();
  }
}

async function handleSearch() {
  const printfulOrderId = document.getElementById("printful-order-id").value.trim();
  const email = document.getElementById("email").value.trim();
  const searchBtn = document.getElementById("search-btn");

  // Validate inputs - both are required
  if (!email) {
    showError("Please enter an email address");
    return;
  }

  if (!isValidEmail(email)) {
    showError("Please enter a valid email address");
    return;
  }

  if (!printfulOrderId) {
    showError("Please enter a Printful Order ID");
    return;
  }

  if (!isValidPrintfulOrderId(printfulOrderId)) {
    showError("Printful Order ID must start with 'PF'");
    return;
  }

  // Show loading state
  showLoading();

  try {
    // Disable search button during request
    searchBtn.disabled = true;

    const backendUrl = window.__API_URL__ || "https://api.kickedoutofthesky.com";
    const url = new URL(`${backendUrl}/api/order-status`);
    url.searchParams.append("email", email);
    if (printfulOrderId) {
      url.searchParams.append("printful_order_id", printfulOrderId);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    const data = await response.json();
    console.log("Response data:", data);

    if (!response.ok) {
      let errorMsg = data.error || data.message || "Failed to fetch order status";

      // Handle specific error codes
      if (response.status === 404) {
        errorMsg = "Order not found. Please check your Order ID and email address.";
      } else if (response.status === 403) {
        errorMsg = "The email address does not match this order. Please verify and try again.";
      }

      console.error("API error:", errorMsg);
      showError(errorMsg);
      searchBtn.disabled = false;
      return;
    }

    // Display single or multiple orders based on response
    console.log("Displaying order:", data);
    try {
      displayOrder(data);
      console.log("displayOrder completed successfully");
    } catch (displayError) {
      console.error("Error in displayOrder:", displayError);
      console.error("Display error message:", displayError.message);
      showError("Error displaying order: " + displayError.message);
      searchBtn.disabled = false;
      return;
    }
    searchBtn.disabled = false;
  } catch (error) {
    console.error("Error fetching order status:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    showError("Unable to connect to the server. Please try again later.");
    searchBtn.disabled = false;
  }
}

function displayOrder(orderData) {
  console.log("displayOrder called with:", orderData);
  hideLoading();
  hideError();
  hideSearchForm();

  // Save order data to sessionStorage for page refresh persistence
  try {
    sessionStorage.setItem("kots_order_data", JSON.stringify(orderData));
  } catch (error) {
    console.error("Error saving order to sessionStorage:", error);
  }

  const orderDisplay = document.getElementById("order-display");
  const pendingSection = document.getElementById("pending-section");
  const processingSection = document.getElementById("processing-section");

  // Reset displays
  pendingSection.style.display = "none";
  processingSection.style.display = "none";

  // Show order display
  orderDisplay.style.display = "block";

  if (orderData.status === "pending") {
    displayPendingOrder(orderData);
  } else {
    console.log("Calling displayProcessingOrder");
    displayProcessingOrder(orderData);

    if (orderData.status === "shipped") {
      displayTrackingInfo();
    }
  }
}

function displayPendingOrder(orderData) {
  const pendingSection = document.getElementById("pending-section");
  const pendingMessage = document.getElementById("pending-message");

  pendingMessage.textContent = orderData.message || "Order is being prepared. Please check back soon.";
  pendingSection.style.display = "block";
}

function displayProcessingOrder(orderData) {
  console.log("displayProcessingOrder called with:", orderData);

  try {
    const recipient = orderData.recipient || {};
    const address = recipient.address || {};
    const countryCode = address.country_code || "";
    const shipments = orderData.shipments || [];
    const items = orderData.items || [];
    const costs = orderData.costs || {};
    const enrichedItems = items.map(item => enrichItemWithProductData(item));

    // Parse costs
    const subtotalCents =
      typeof costs.subtotal_cents === "string"
        ? parseFloat(costs.subtotal_cents) * 100
        : parseInt(costs.subtotal_cents);
    const shippingCents =
      typeof costs.shipping_cents === "string"
        ? parseFloat(costs.shipping_cents) * 100
        : parseInt(costs.shipping_cents);
    const taxCents =
      typeof costs.tax_cents === "string" ? parseFloat(costs.tax_cents) * 100 : parseInt(costs.tax_cents);
    const totalCents =
      typeof costs.total_cents === "string" ? parseFloat(costs.total_cents) * 100 : parseInt(costs.total_cents);

    // Build items (left column)
    const itemsHTML = enrichedItems
      .map(item => {
        const priceCents =
          typeof item.price_cents === "string" ? parseFloat(item.price_cents) * 100 : parseInt(item.price_cents);
        const lineTotal = priceCents * item.quantity;

        const productName = item.product_title || item.product_name || "Unknown Product";
        const colorDisplay = item.color || "";
        const sizeDisplay = item.size || "";

        return `<div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #333; display: flex; gap: 16px; flex-wrap: wrap; text-align: left;">
        <div style="flex-shrink: 0; width: 80px; height: 80px; overflow: hidden; border-radius: 4px;">
          ${
            item.image
              ? `<img src="${item.image}" alt="${productName}" style="width: 100%; height: 100%; object-fit: cover;">`
              : `<div style="width: 100%; height: 100%; background: #2a2a2a; display: flex; align-items: center; justify-content: center; color: #666;">No Image</div>`
          }
        </div>
        <div style="flex: 1; text-align: left;">
          <div style="display: flex; justify-content: space-between; gap: 10px; margin-bottom: 6px">
            <div>${productName}${colorDisplay ? " - " + colorDisplay : ""}${sizeDisplay ? " - " + sizeDisplay : ""}</div>
            <div style="font-weight: bold; white-space: nowrap">$${(lineTotal / 100).toFixed(2)}</div>
          </div>
          <div style="display: flex; justify-content: flex-start; color: #999; font-size: 0.85rem">
            <div>Qty: ${item.quantity} × $${(priceCents / 100).toFixed(2)} each</div>
          </div>
        </div>
      </div>`;
      })
      .join("");

    // Build shipping and tracking combined section
    let shippingTrackingHTML = "";
    if (shipments.length > 0) {
      const latestShipment = shipments[shipments.length - 1];
      const shippedDate = latestShipment.shipped_date
        ? new Date(parseInt(latestShipment.shipped_date)).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "";
      const deliveredDate = latestShipment.delivered_date
        ? new Date(parseInt(latestShipment.delivered_date)).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "";

      shippingTrackingHTML = `
    <div class="shipping-tracking-grid">
      <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #262626;">
        <h3 style="color: #ffc107; margin-bottom: 15px; font-size: 1.1rem;">Shipping Address</h3>
        <div style="color: #ccc; line-height: 1.6;">
          <div style="color: #fff; font-weight: bold; margin-bottom: 8px;">${recipient.name || "—"}</div>
          <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #262626;">${recipient.email || "—"}</div>
          <div>${address.line1 || "—"}${address.line2 ? "<br>" + address.line2 : ""}</div>
          <div>${address.city || "—"}${address.state ? ", " + address.state : ""} ${address.zip || "—"}</div>
          <div>${address.country || "—"}</div>
        </div>
      </div>
      <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #262626;">
        <h3 style="color: #ffc107; margin-bottom: 15px; font-size: 1.1rem;">Tracking Information</h3>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #262626; color: #ccc;">
          <span>Shipment ID:</span>
          <span style="color: #fff; font-weight: bold;">
            #${
              latestShipment.id
                ? typeof latestShipment.id === "string" && latestShipment.id.includes("-")
                  ? latestShipment.id.split("-")[1]
                  : latestShipment.id
                : "—"
            }
          </span>
        </div>
        ${countryCode ? `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #262626; color: #ccc;"><span>Origin:</span><span style="font-size: 1.8rem;" aria-label="Origin: ${countryCode}">${getCountryFlag(countryCode)}</span></div>` : ""}
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #262626; color: #ccc;">
          <span>Carrier:</span>
          <span>${latestShipment.carrier || "—"}</span>
        </div>
        ${
          latestShipment.tracking_number
            ? `<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #262626; color: #ccc;">
          <span>Tracking:</span>
          <span style="word-break: break-all; font-family: monospace;">${latestShipment.tracking_number}</span>
        </div>`
            : ""
        }
        ${
          shippedDate
            ? `<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #262626; color: #ccc;">
          <span>Shipped:</span>
          <span>${shippedDate}</span>
        </div>`
            : ""
        }
        ${
          deliveredDate
            ? `<div style="display: flex; justify-content: space-between; align-items: flex-start; color: #ccc;">
          <span>Delivered:</span>
          <span>${deliveredDate}</span>
        </div>`
            : ""
        }
        ${
          latestShipment.tracking_url
            ? `<a href="${latestShipment.tracking_url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 12px; color: #ffc107; text-decoration: none;" aria-label="Track shipment ${latestShipment.id} (opens in new window)">
            <i class="fas fa-external-link-alt" style="margin-right: 8px"></i>Track This Shipment
          </a>`
            : ""
        }
      </div>
      <button id="search-another-btn" style="width: 100%; padding: 12px; background-color: #ffc107; color: #000; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 1rem;" aria-label="Search for another order">
        Search Another Order
      </button>
    </div>
  `;
    }

    // Combine all sections with two-column layout using the responsive grid
    const processingHTML = `
    <div class="order-shipping-grid">
      <div>
        <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #262626;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <h3 style="color: #fff; margin-bottom: 0; margin-top: 0; padding: 0;">Order #${orderData.printful_order_id || "—"}</h3>
            <span class="status-badge status-${orderData.status}" style="text-align: center;" aria-label="Order status: ${formatStatus(orderData.status)}">${formatStatus(orderData.status)}</span>
          </div>
          <p style="color: #999; font-size: 0.9rem; margin-bottom: 25px; margin-top: 0; text-align: left;">${formatDate(orderData.created_at)}</p>
          ${itemsHTML}
          <div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 20px">
            <div style="display: flex; justify-content: space-between; color: #ccc; margin-bottom: 12px; font-size: 0.95rem;">
              <span>Subtotal:</span>
              <span>$${(subtotalCents / 100).toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #ccc; margin-bottom: 12px; font-size: 0.95rem;">
              <span>Shipping:</span>
              <span>$${(shippingCents / 100).toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #ccc; margin-bottom: 15px; font-size: 0.95rem;">
              <span>Tax:</span>
              <span>$${(taxCents / 100).toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #ffc107; font-weight: bold; font-size: 1.15rem; border-top: 1px solid #333; padding-top: 15px;">
              <span>Total:</span>
              <span>$${(totalCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 20px">
        ${shippingTrackingHTML}
      </div>
    </div>
  `;

    try {
      console.log("Setting innerHTML on processing-section");
      document.getElementById("processing-section").innerHTML = processingHTML;
      document.getElementById("processing-section").style.display = "block";

      // Add event listener to "Search Another Order" button
      const searchAnotherBtn = document.getElementById("search-another-btn");
      if (searchAnotherBtn) {
        searchAnotherBtn.addEventListener("click", resetForm);
      }

      console.log("displayProcessingOrder completed successfully");
    } catch (error) {
      console.error("Error setting innerHTML:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in displayProcessingOrder:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    throw error;
  }
}

function displayTrackingInfo() {
  // Tracking info is now integrated into main order display
  // Keep this function for legacy support but hide the tracking section
  const trackingSection = document.getElementById("tracking-section");
  if (trackingSection) {
    trackingSection.style.display = "none";
  }
}

// Enrich item data with product catalog information
function enrichItemWithProductData(item) {
  const enrichedItem = { ...item };

  // Ensure price_cents and retail_price_cents are numbers
  if (typeof enrichedItem.price_cents === "string") {
    enrichedItem.price_cents = parseFloat(enrichedItem.price_cents) * 100;
  }
  if (typeof enrichedItem.retail_price_cents === "string") {
    enrichedItem.retail_price_cents = parseFloat(enrichedItem.retail_price_cents) * 100;
  }

  // Try to find product in catalog using variant_id or sync_variant_id
  for (const product of products) {
    for (const [color, colorData] of Object.entries(product.variants || {})) {
      for (const [size, sizeData] of Object.entries(colorData.sizes || {})) {
        if (
          sizeData.variant_id === item.variant_id ||
          sizeData.variant_id === item.sync_variant_id ||
          sizeData.variant_id === parseInt(item.variant_id) ||
          sizeData.variant_id === parseInt(item.sync_variant_id)
        ) {
          // Found matching product
          enrichedItem.product_title = product.title;
          enrichedItem.product_name = product.title; // For backward compatibility
          enrichedItem.image = colorData.image || product.image;
          enrichedItem.color = color;
          enrichedItem.size = size;
          enrichedItem.variant_name = `${color} / ${size}`;
          enrichedItem.garment_name = product.garment?.name;
          // Add price from catalog if not already set
          if (!enrichedItem.price_cents && sizeData.price_cents) {
            enrichedItem.price_cents = sizeData.price_cents;
          }
          return enrichedItem;
        }
      }
    }
  }

  // If no product found in catalog, return item as-is with fallback name
  enrichedItem.product_name = enrichedItem.product_name || "Unknown Product";
  return enrichedItem;
}

// Helper functions
function getCountryFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return "🌍";

  // Convert country code to regional indicator symbols for flag emoji
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function formatDate(timestamp) {
  if (!timestamp) return "—";

  const date = new Date(parseInt(timestamp));
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
}

function formatStatus(status) {
  const statuses = {
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    fulfilled: "Fulfilled",
  };
  return statuses[status] || status;
}

function formatTrackingStatus(status) {
  const statuses = {
    pending: "Pending",
    in_transit: "In Transit",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    failed_attempt: "Failed Delivery Attempt",
    returned: "Returned",
  };
  return statuses[status] || status;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPrintfulOrderId(orderId) {
  // Printful Order ID: must start with 'PF' followed by digits (e.g., PF123456789)
  return /^PF\d+$/.test(orderId);
}

function showError(message) {
  const errorContainer = document.getElementById("error-container");
  const errorMessage = document.getElementById("error-message");

  errorMessage.textContent = message;
  errorContainer.style.display = "block";
  document.getElementById("loading-container").style.display = "none";
  document.getElementById("order-display").style.display = "none";
  document.getElementById("search-form").style.display = "block";
}

function hideError() {
  document.getElementById("error-container").style.display = "none";
}

function showLoading() {
  document.getElementById("loading-container").style.display = "block";
  document.getElementById("error-container").style.display = "none";
  document.getElementById("order-display").style.display = "none";
  document.getElementById("search-form").style.display = "none";
}

function hideLoading() {
  document.getElementById("loading-container").style.display = "none";
}

function hideSearchForm() {
  document.getElementById("search-form").style.display = "none";
}

/* eslint-disable-next-line no-unused-vars */
function resetForm() {
  document.getElementById("printful-order-id").value = "";
  document.getElementById("email").value = "";
  document.getElementById("error-container").style.display = "none";
  document.getElementById("order-display").style.display = "none";
  document.getElementById("search-form").style.display = "block";
  document.getElementById("printful-order-id").focus();

  // Clear stored order data from sessionStorage
  try {
    sessionStorage.removeItem("kots_order_data");
  } catch (error) {
    console.error("Error clearing order from sessionStorage:", error);
  }

  // Clear URL query parameters
  window.history.replaceState({}, document.title, window.location.pathname);
}

// Allow importing in Node.js (Jest tests) while keeping browser globals
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    formatDate,
    formatStatus,
    formatTrackingStatus,
    isValidEmail,
    isValidPrintfulOrderId,
    enrichItemWithProductData,
  };
}
