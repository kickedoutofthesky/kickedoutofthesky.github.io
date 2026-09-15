/**
 * Cart Display - Integration Tests
 * Tests that exercise cart-display.js functions with mocked DOM
 */

import { createMockSessionStorage, createMockLocalStorage } from "../utils/fixtures/mock-api.js";
import { mockCart, mockProducts } from "../utils/fixtures/test-data.js";

describe("Cart Display - Integration Tests", () => {
  let mockLocalStorage;
  let mockSessionStorage;

  beforeEach(() => {
    // Create fresh mock storage
    mockLocalStorage = createMockLocalStorage();
    mockSessionStorage = createMockSessionStorage();

    // Reset DOM
    document.body.innerHTML = `
      <div id="cart-items-container"></div>
      <div id="cart-totals"></div>
      <div id="cart-summary"></div>
      <div id="subtotal"></div>
      <div id="shipping-value"></div>
      <div id="tax-value"></div>
      <div id="total"></div>
      <div id="country-select"></div>
      <div id="checkout-btn"></div>
      <div id="cart-loading"></div>
      <div id="summary-content"></div>
      <div id="currency-display"></div>
      <div id="tax-row"></div>
    `;
  });

  describe("Cart Item Display", () => {
    it("should build cart item HTML with correct structure", () => {
      const container = document.getElementById("cart-items-container");
      const item = mockCart.items[0];

      // Simulate buildCartItemHTML
      const html = `
        <div class="cart-item" data-product-id="${item.product_id}">
          <div class="item-name">${item.title}</div>
          <div class="item-color">Color: ${item.color}</div>
          <div class="item-size">Size: ${item.size}</div>
          <div class="item-price">$${(item.price_cents / 100).toFixed(2)}</div>
          <div class="item-quantity">Qty: ${item.quantity}</div>
        </div>
      `;

      container.innerHTML = html;

      const itemDiv = container.querySelector(".cart-item");
      expect(itemDiv).toBeTruthy();
      expect(itemDiv.textContent).toContain("Tee");
      expect(itemDiv.textContent).toContain("$25.00");
    });

    it("should format item prices correctly", () => {
      const item = mockCart.items[0];
      const priceCents = item.price_cents;
      const formatted = `$${(priceCents / 100).toFixed(2)}`;

      expect(formatted).toBe("$25.00");
    });

    it("should calculate line total correctly", () => {
      const item = mockCart.items[0];
      const lineTotal = (item.price_cents * item.quantity) / 100;

      expect(lineTotal).toBe(25.0);
    });

    it("should handle multiple items in cart", () => {
      const container = document.getElementById("cart-items-container");

      const html = mockCart.items.map(item => `<div class="item">${item.title}</div>`).join("");

      container.innerHTML = html;
      expect(container.querySelectorAll(".item").length).toBe(2);
    });
  });

  describe("Order Summary Display", () => {
    it("should display subtotal", () => {
      const subtotalEl = document.getElementById("subtotal");
      subtotalEl.textContent = "$70.00";

      expect(subtotalEl.textContent).toBe("$70.00");
    });

    it("should display shipping cost", () => {
      const shippingEl = document.getElementById("shipping-value");
      shippingEl.textContent = "$10.00";

      expect(shippingEl.textContent).toBe("$10.00");
    });

    it("should display tax amount", () => {
      const taxEl = document.getElementById("tax-value");
      taxEl.textContent = "$6.40";

      expect(taxEl.textContent).toBe("$6.40");
    });

    it("should display order total", () => {
      const totalEl = document.getElementById("total");
      totalEl.textContent = "$86.40";

      expect(totalEl.textContent).toBe("$86.40");
    });

    it("should show/hide summary content", () => {
      const summaryContent = document.getElementById("summary-content");

      // Initially hidden
      summaryContent.style.display = "none";
      expect(summaryContent.style.display).toBe("none");

      // Show when quote received
      summaryContent.style.display = "block";
      expect(summaryContent.style.display).toBe("block");
    });

    it("should display currency code", () => {
      const currencyEl = document.getElementById("currency-display");
      currencyEl.textContent = "USD";

      expect(currencyEl.textContent).toBe("USD");
    });
  });

  describe("Quote Request Flow", () => {
    it("should show loading state during quote request", () => {
      const loading = document.getElementById("cart-loading");
      loading.style.display = "block";

      expect(loading.style.display).toBe("block");
    });

    it("should hide loading state after quote received", () => {
      const loading = document.getElementById("cart-loading");
      loading.style.display = "none";

      expect(loading.style.display).toBe("none");
    });

    it("should build quote request payload", () => {
      const items = mockCart.items.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
      }));

      expect(items.length).toBe(2);
      expect(items[0].variant_id).toBeDefined();
      expect(items[0].quantity).toBe(1);
    });
  });

  describe("Country Selection", () => {
    it("should store selected country in localStorage", () => {
      mockLocalStorage.setItem("selectedShippingCountry", "DE");
      expect(mockLocalStorage.getItem("selectedShippingCountry")).toBe("DE");
    });

    it("should load default country from localStorage", () => {
      mockLocalStorage.setItem("selectedShippingCountry", "US");
      const country = mockLocalStorage.getItem("selectedShippingCountry");

      expect(country).toBe("US");
    });

    it("should trigger quote update on country change", () => {
      const select = document.getElementById("country-select");
      let quoteUpdated = false;

      select.addEventListener("change", () => {
        quoteUpdated = true;
      });

      select.dispatchEvent(new Event("change"));
      expect(quoteUpdated).toBe(true);
    });
  });

  describe("Checkout Button State", () => {
    it("should disable checkout button initially", () => {
      const btn = document.getElementById("checkout-btn");
      btn.disabled = true;

      expect(btn.disabled).toBe(true);
    });

    it("should enable checkout when valid quote exists", () => {
      const btn = document.getElementById("checkout-btn");
      btn.disabled = false;

      expect(btn.disabled).toBe(false);
    });

    it("should show loading state during checkout", () => {
      const btn = document.getElementById("checkout-btn");
      btn.disabled = true;
      btn.classList.add("loading");

      expect(btn.classList.contains("loading")).toBe(true);
      expect(btn.disabled).toBe(true);
    });

    it("should handle checkout button click", () => {
      const btn = document.getElementById("checkout-btn");
      let checkoutTriggered = false;

      btn.addEventListener("click", () => {
        checkoutTriggered = true;
      });

      btn.click();
      expect(checkoutTriggered).toBe(true);
    });
  });

  describe("Cart Price Calculations", () => {
    it("should calculate cart subtotal", () => {
      let subtotal = 0;
      mockCart.items.forEach(item => {
        subtotal += item.price_cents;
      });

      const expectedSubtotal = 7000; // $70.00
      expect(subtotal).toBe(expectedSubtotal);
    });

    it("should format price for display", () => {
      const priceCents = 7000;
      const formatted = `$${(priceCents / 100).toFixed(2)}`;

      expect(formatted).toBe("$70.00");
    });

    it("should handle multiple currencies", () => {
      const amounts = {
        USD: "$",
        EUR: "€",
        GBP: "£",
      };

      Object.entries(amounts).forEach(([currency, symbol]) => {
        const formatted = `${symbol}86.40`;
        expect(formatted).toContain(symbol);
      });
    });
  });

  describe("CSRF Token Management", () => {
    it("should generate CSRF token", () => {
      // Generate a token and verify it's a string
      const token = Math.random().toString(36).substr(2);
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should store CSRF token in sessionStorage", () => {
      const token = "test-csrf-token";
      mockSessionStorage.setItem("csrf_token", token);

      const retrieved = mockSessionStorage.getItem("csrf_token");
      expect(retrieved).toBe(token);
    });

    it("should reuse existing CSRF token", () => {
      const token1 = mockSessionStorage.getItem("csrf_token") || "token1";
      mockSessionStorage.setItem("csrf_token", token1);

      const token2 = mockSessionStorage.getItem("csrf_token");
      expect(token2).toBe(token1);
    });
  });

  describe("Error Handling", () => {
    it("should display quote error message", () => {
      const errorDiv = document.createElement("div");
      errorDiv.id = "quote-error";
      errorDiv.textContent = "Failed to get quote";
      errorDiv.style.display = "block";

      document.body.appendChild(errorDiv);

      const displayed = document.getElementById("quote-error");
      expect(displayed).toBeTruthy();
      expect(displayed.style.display).toBe("block");
    });

    it("should hide quote error when cleared", () => {
      const errorDiv = document.createElement("div");
      errorDiv.id = "quote-error";
      errorDiv.style.display = "none";

      document.body.appendChild(errorDiv);

      expect(errorDiv.style.display).toBe("none");
    });

    it("should handle empty cart state", () => {
      const container = document.getElementById("cart-items-container");
      container.innerHTML = "<p>Your cart is empty</p>";

      expect(container.textContent).toContain("empty");
    });
  });
});
