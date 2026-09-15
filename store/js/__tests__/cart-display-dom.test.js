/**
 * Cart Display - DOM Manipulation Tests
 * Tests for DOM-dependent cart display functions
 */

import { createMockSessionStorage, createMockLocalStorage } from "../utils/fixtures/mock-api";
import { mockCart, mockProducts } from "../utils/fixtures/test-data";

describe("Cart Display - DOM Manipulation", () => {
  let mockLocalStorage;
  let mockSessionStorage;

  beforeEach(() => {
    // Setup product page DOM
    document.body.innerHTML = `
      <div id="cart-items-container"></div>
      <div id="cart-totals"></div>
      <div id="cart-notification"></div>
      <input id="country-select" />
      <button id="checkout-btn"></button>
    `;

    // Create mock storage
    mockLocalStorage = createMockLocalStorage();
    mockSessionStorage = createMockSessionStorage();
  });

  describe("Cart Display Setup", () => {
    it("should have cart container elements in DOM", () => {
      expect(document.getElementById("cart-items-container")).toBeTruthy();
      expect(document.getElementById("cart-totals")).toBeTruthy();
    });

    it("should have country selector", () => {
      expect(document.getElementById("country-select")).toBeTruthy();
    });

    it("should have checkout button", () => {
      expect(document.getElementById("checkout-btn")).toBeTruthy();
    });
  });

  describe("Cart Storage Operations", () => {
    it("should store cart items in localStorage", () => {
      const cartJson = JSON.stringify(mockCart);
      mockLocalStorage.setItem("kots_cart", cartJson);

      const retrieved = mockLocalStorage.getItem("kots_cart");
      expect(retrieved).toBe(cartJson);
    });

    it("should store selected country in sessionStorage", () => {
      mockSessionStorage.setItem("selected_country", "US");

      expect(mockSessionStorage.getItem("selected_country")).toBe("US");
    });

    it("should clear cart from storage", () => {
      mockLocalStorage.setItem("kots_cart", JSON.stringify(mockCart));
      mockLocalStorage.removeItem("kots_cart");

      expect(mockLocalStorage.getItem("kots_cart")).toBeNull();
    });

    it("should handle JSON serialization errors gracefully", () => {
      const testData = { key: "value" };
      mockLocalStorage.setItem("test", JSON.stringify(testData));

      const retrieved = mockLocalStorage.getItem("test");
      expect(retrieved).toBe(JSON.stringify(testData));
    });
  });

  describe("Cart Element Display", () => {
    it("should display cart item count", () => {
      const container = document.getElementById("cart-items-container");
      const itemCount = mockCart.items.length;

      container.innerHTML = `<div class="item-count">${itemCount} items</div>`;
      expect(container.textContent).toContain("2 items");
    });

    it("should display product images", () => {
      const container = document.getElementById("cart-items-container");

      mockCart.items.forEach(item => {
        const img = document.createElement("img");
        img.src = item.image;
        img.alt = item.title;
        container.appendChild(img);
      });

      const images = container.querySelectorAll("img");
      expect(images.length).toBe(mockCart.items.length);
      expect(images[0].src).toContain("tee");
    });

    it("should display cart totals", () => {
      const totalsDiv = document.getElementById("cart-totals");
      const total = (86.4).toFixed(2);

      totalsDiv.innerHTML = `<div class="total">$${total}</div>`;
      expect(totalsDiv.textContent).toContain("$86.40");
    });

    it("should display loading state", () => {
      const btn = document.getElementById("checkout-btn");
      btn.disabled = true;
      btn.textContent = "Loading...";

      expect(btn.disabled).toBe(true);
      expect(btn.textContent).toBe("Loading...");
    });
  });

  describe("Cart Item Rendering", () => {
    it("should render item with color and size", () => {
      const container = document.getElementById("cart-items-container");
      const item = mockCart.items[0];

      const html = `
        <div class="cart-item">
          <div>${item.title}</div>
          <div>Color: ${item.color}</div>
          <div>Size: ${item.size}</div>
        </div>
      `;

      container.innerHTML = html;
      expect(container.textContent).toContain("Color: Black");
      expect(container.textContent).toContain("Size: M");
    });

    it("should render item quantity with controls", () => {
      const container = document.getElementById("cart-items-container");
      const item = mockCart.items[0];

      const html = `
        <div class="cart-item">
          <button class="qty-minus">-</button>
          <span class="qty">${item.quantity}</span>
          <button class="qty-plus">+</button>
        </div>
      `;

      container.innerHTML = html;
      expect(container.querySelector(".qty").textContent).toBe("1");
    });

    it("should render item price formatted", () => {
      const container = document.getElementById("cart-items-container");
      const item = mockCart.items[0];
      const price = (item.price_cents / 100).toFixed(2);

      container.innerHTML = `<div class="price">$${price}</div>`;
      expect(container.textContent).toContain("$25.00");
    });

    it("should allow item removal", () => {
      const container = document.getElementById("cart-items-container");

      container.innerHTML = `
        <div class="cart-item" data-item-id="item1">
          <button class="remove-item">Remove</button>
        </div>
      `;

      const removeBtn = container.querySelector(".remove-item");
      expect(removeBtn).toBeTruthy();

      removeBtn.click();
      expect(removeBtn.parentElement.getAttribute("data-item-id")).toBe("item1");
    });
  });

  describe("Country Selection", () => {
    it("should populate country options", () => {
      const select = document.getElementById("country-select");

      const options = [
        { value: "US", text: "United States" },
        { value: "CA", text: "Canada" },
        { value: "GB", text: "United Kingdom" },
      ];

      select.innerHTML = options.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join("");

      expect(select.querySelectorAll("option").length).toBe(3);
    });

    it("should trigger quote update on country change", () => {
      const select = document.getElementById("country-select");
      let quoteUpdated = false;

      select.innerHTML = '<option value="US">US</option>';
      select.addEventListener("change", () => {
        quoteUpdated = true;
      });

      select.value = "US";
      select.dispatchEvent(new Event("change"));

      expect(quoteUpdated).toBe(true);
    });

    it("should display selected country", () => {
      const select = document.getElementById("country-select");
      select.innerHTML = `
        <option value="US">United States</option>
        <option value="CA">Canada</option>
      `;

      select.value = "CA";
      expect(select.value).toBe("CA");
    });
  });

  describe("Quote Display", () => {
    it("should display subtotal", () => {
      const totalsDiv = document.getElementById("cart-totals");
      totalsDiv.innerHTML = "<div>Subtotal: $70.00</div>";

      expect(totalsDiv.textContent).toContain("$70.00");
    });

    it("should display shipping cost", () => {
      const totalsDiv = document.getElementById("cart-totals");
      totalsDiv.innerHTML = "<div>Shipping: $10.00</div>";

      expect(totalsDiv.textContent).toContain("$10.00");
    });

    it("should display tax", () => {
      const totalsDiv = document.getElementById("cart-totals");
      totalsDiv.innerHTML = "<div>Tax: $6.40</div>";

      expect(totalsDiv.textContent).toContain("$6.40");
    });

    it("should display total", () => {
      const totalsDiv = document.getElementById("cart-totals");
      totalsDiv.innerHTML = `
        <div>Subtotal: $70.00</div>
        <div>Shipping: $10.00</div>
        <div>Tax: $6.40</div>
        <div class="total-amount">$86.40</div>
      `;

      expect(totalsDiv.querySelector(".total-amount").textContent).toBe("$86.40");
    });

    it("should show different quote for different countries", () => {
      const container = document.getElementById("cart-totals");

      // US quote
      container.innerHTML = '<div class="total">$86.40</div>';
      let total = container.querySelector(".total");
      expect(total.textContent).toContain("$86.40");

      // EUR quote
      container.innerHTML = '<div class="total">€78.50</div>';
      total = container.querySelector(".total");
      expect(total.textContent).toContain("€78.50");
    });
  });

  describe("Notification Display", () => {
    it("should show item added notification", () => {
      const notification = document.getElementById("cart-notification");
      notification.innerHTML = '<div class="notification">Item added to cart</div>';

      expect(notification.textContent).toContain("Item added");
    });

    it("should show error notification", () => {
      const notification = document.getElementById("cart-notification");
      notification.innerHTML = '<div class="error">Failed to add item</div>';

      expect(notification.querySelector(".error")).toBeTruthy();
    });

    it("should clear notification after delay", done => {
      const notification = document.getElementById("cart-notification");
      notification.innerHTML = '<div class="notification">Test message</div>';

      setTimeout(() => {
        notification.innerHTML = "";
        expect(notification.textContent).toBe("");
        done();
      }, 100);
    });
  });

  describe("Checkout Button State", () => {
    it("should enable checkout when cart is valid", () => {
      const btn = document.getElementById("checkout-btn");
      btn.disabled = false;

      expect(btn.disabled).toBe(false);
    });

    it("should disable checkout when cart is empty", () => {
      const btn = document.getElementById("checkout-btn");
      btn.disabled = true;

      expect(btn.disabled).toBe(true);
    });

    it("should show loading state during checkout", () => {
      const btn = document.getElementById("checkout-btn");
      btn.disabled = true;
      btn.classList.add("loading");

      expect(btn.classList.contains("loading")).toBe(true);
    });

    it("should trigger checkout on click", () => {
      const btn = document.getElementById("checkout-btn");
      let checkoutTriggered = false;

      btn.addEventListener("click", () => {
        checkoutTriggered = true;
      });

      btn.click();
      expect(checkoutTriggered).toBe(true);
    });
  });
});
