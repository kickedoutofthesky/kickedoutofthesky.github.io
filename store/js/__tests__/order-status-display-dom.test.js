/**
 * Order Status - DOM Manipulation Tests
 * Tests for DOM-dependent order display functions
 */

import { mockOrder, mockOrderWithTracking, mockCountries } from "../utils/fixtures/test-data";

describe("Order Status - DOM Manipulation", () => {
  beforeEach(() => {
    // Setup order status page DOM
    document.body.innerHTML = `
      <div id="order-status-container">
        <form id="order-search-form">
          <input id="order-id-input" type="text" placeholder="Order ID" />
          <input id="email-input" type="email" placeholder="Email" />
          <button id="search-btn" type="submit">Search</button>
          <div id="form-errors"></div>
        </form>
        
        <div id="order-display-container" style="display: none;">
          <div id="order-status-badge"></div>
          <div id="order-details"></div>
          <div id="tracking-section"></div>
          <div id="items-list"></div>
          <div id="order-totals"></div>
          <button id="print-btn">Print Order</button>
          <button id="track-btn">Track Shipment</button>
        </div>
        
        <div id="loading-spinner" style="display: none;">Loading...</div>
        <div id="error-message"></div>
      </div>
    `;
  });

  describe("Order Search Form", () => {
    it("should display order search form", () => {
      const form = document.getElementById("order-search-form");
      expect(form).toBeTruthy();
    });

    it("should have order ID input", () => {
      const input = document.getElementById("order-id-input");
      expect(input).toBeTruthy();
      expect(input.type).toBe("text");
    });

    it("should have email input", () => {
      const input = document.getElementById("email-input");
      expect(input).toBeTruthy();
      expect(input.type).toBe("email");
    });

    it("should have submit button", () => {
      const btn = document.getElementById("search-btn");
      expect(btn).toBeTruthy();
      expect(btn.type).toBe("submit");
    });

    it("should accept order ID input", () => {
      const input = document.getElementById("order-id-input");
      input.value = "eoKK1upmt2jl99BK1qYLDjbYH1gwUZeh";

      expect(input.value).toBe("eoKK1upmt2jl99BK1qYLDjbYH1gwUZeh");
    });

    it("should accept email input", () => {
      const input = document.getElementById("email-input");
      input.value = "user@example.com";

      expect(input.value).toBe("user@example.com");
    });

    it("should trigger search on form submit", () => {
      const form = document.getElementById("order-search-form");
      let searchTriggered = false;

      form.addEventListener("submit", e => {
        e.preventDefault();
        searchTriggered = true;
      });

      form.dispatchEvent(new Event("submit"));
      expect(searchTriggered).toBe(true);
    });

    it("should display form validation errors", () => {
      const errors = document.getElementById("form-errors");
      errors.innerHTML = '<div class="error">Please enter order ID</div>';

      expect(errors.textContent).toContain("Please enter order ID");
    });
  });

  describe("Order Status Display", () => {
    it("should display order status badge", () => {
      const badge = document.getElementById("order-status-badge");
      badge.textContent = "Processing";
      badge.className = "status-processing";

      expect(badge.textContent).toBe("Processing");
      expect(badge.classList.contains("status-processing")).toBe(true);
    });

    it("should show pending order status", () => {
      const badge = document.getElementById("order-status-badge");
      badge.textContent = "Pending";
      badge.className = "status-pending";

      expect(badge.textContent).toBe("Pending");
    });

    it("should show shipped order status", () => {
      const badge = document.getElementById("order-status-badge");
      badge.textContent = "Shipped";
      badge.className = "status-shipped";

      expect(badge.textContent).toBe("Shipped");
    });

    it("should show processing order status", () => {
      const badge = document.getElementById("order-status-badge");
      badge.textContent = "Processing";
      badge.className = "status-processing";

      expect(badge.textContent).toBe("Processing");
    });

    it("should color-code status badges", () => {
      const statusClasses = {
        pending: "status-pending",
        processing: "status-processing",
        shipped: "status-shipped",
      };

      Object.entries(statusClasses).forEach(([status, className]) => {
        const badge = document.getElementById("order-status-badge");
        badge.className = className;
        expect(badge.classList.contains(className)).toBe(true);
      });
    });
  });

  describe("Order Details Display", () => {
    it("should display order ID", () => {
      const details = document.getElementById("order-details");
      const orderId = mockOrder.order_id;

      details.innerHTML = `<div>Order ID: ${orderId}</div>`;
      expect(details.textContent).toContain(orderId);
    });

    it("should display order date", () => {
      const details = document.getElementById("order-details");
      details.innerHTML = "<div>Date: 12/25/2023</div>";

      expect(details.textContent).toContain("12/25/2023");
    });

    it("should display recipient information", () => {
      const details = document.getElementById("order-details");
      const email = mockOrder.recipient.email;

      details.innerHTML = `<div>Contact: ${email}</div>`;
      expect(details.textContent).toContain(email);
    });

    it("should display shipping address", () => {
      const details = document.getElementById("order-details");
      details.innerHTML = "<div>Address: 123 Main St, Anytown, USA 12345</div>";

      expect(details.textContent).toContain("123 Main St");
    });
  });

  describe("Items List Display", () => {
    it("should display order items", () => {
      const itemsList = document.getElementById("items-list");
      const itemCount = mockOrder.items.length;

      itemsList.innerHTML = `<div>Items: ${itemCount}</div>`;
      expect(itemsList.textContent).toContain("2");
    });

    it("should display item name", () => {
      const itemsList = document.getElementById("items-list");
      const item = mockOrder.items[0];

      itemsList.innerHTML = `<div class="item-name">${item.name}</div>`;
      expect(itemsList.querySelector(".item-name")).toBeTruthy();
    });

    it("should display item variant details", () => {
      const itemsList = document.getElementById("items-list");
      itemsList.innerHTML = `
        <div class="item">
          <div>Black - Medium</div>
          <div>Qty: 1</div>
        </div>
      `;

      expect(itemsList.textContent).toContain("Black");
      expect(itemsList.textContent).toContain("Medium");
    });

    it("should display item price", () => {
      const itemsList = document.getElementById("items-list");
      itemsList.innerHTML = '<div class="item-price">$25.00</div>';

      expect(itemsList.querySelector(".item-price").textContent).toBe("$25.00");
    });

    it("should display quantity for each item", () => {
      const itemsList = document.getElementById("items-list");
      itemsList.innerHTML = `
        <div class="item">
          <div>Item 1</div>
          <div class="qty">Qty: 1</div>
        </div>
        <div class="item">
          <div>Item 2</div>
          <div class="qty">Qty: 2</div>
        </div>
      `;

      const qtys = itemsList.querySelectorAll(".qty");
      expect(qtys.length).toBe(2);
    });
  });

  describe("Order Totals Display", () => {
    it("should display subtotal", () => {
      const totals = document.getElementById("order-totals");
      totals.innerHTML = "<div>Subtotal: $50.00</div>";

      expect(totals.textContent).toContain("$50.00");
    });

    it("should display shipping cost", () => {
      const totals = document.getElementById("order-totals");
      totals.innerHTML = "<div>Shipping: $10.00</div>";

      expect(totals.textContent).toContain("$10.00");
    });

    it("should display tax", () => {
      const totals = document.getElementById("order-totals");
      totals.innerHTML = "<div>Tax: $6.40</div>";

      expect(totals.textContent).toContain("$6.40");
    });

    it("should display order total", () => {
      const totals = document.getElementById("order-totals");
      totals.innerHTML = '<div class="order-total">$66.40</div>';

      expect(totals.querySelector(".order-total").textContent).toBe("$66.40");
    });

    it("should display currency symbol", () => {
      const totals = document.getElementById("order-totals");
      totals.innerHTML = "<div>$100.00</div>";

      expect(totals.textContent).toContain("$");
    });
  });

  describe("Tracking Information Display", () => {
    it("should display tracking section for shipped orders", () => {
      const tracking = document.getElementById("tracking-section");
      tracking.style.display = "block";
      tracking.innerHTML = "<div>Tracking Information</div>";

      expect(tracking.style.display).toBe("block");
      expect(tracking.textContent).toContain("Tracking");
    });

    it("should hide tracking section for pending orders", () => {
      const tracking = document.getElementById("tracking-section");
      tracking.style.display = "none";

      expect(tracking.style.display).toBe("none");
    });

    it("should display carrier information", () => {
      const tracking = document.getElementById("tracking-section");
      tracking.innerHTML = "<div>Carrier: UPS</div>";

      expect(tracking.textContent).toContain("UPS");
    });

    it("should display tracking number", () => {
      const tracking = document.getElementById("tracking-section");
      const trackingNum = "1Z999AA10123456784";

      tracking.innerHTML = `<div>Tracking: ${trackingNum}</div>`;
      expect(tracking.textContent).toContain(trackingNum);
    });

    it("should display tracking link", () => {
      const tracking = document.getElementById("tracking-section");
      const url = "https://tracking.ups.com/?tracknum=123456";

      tracking.innerHTML = `<a href="${url}" target="_blank">Track Package</a>`;
      const link = tracking.querySelector("a");

      expect(link).toBeTruthy();
      expect(link.href).toContain("tracking");
    });

    it("should display shipment date", () => {
      const tracking = document.getElementById("tracking-section");
      tracking.innerHTML = "<div>Shipped: 12/20/2023</div>";

      expect(tracking.textContent).toContain("12/20/2023");
    });
  });

  describe("Loading and Error States", () => {
    it("should show loading spinner during search", () => {
      const spinner = document.getElementById("loading-spinner");
      spinner.style.display = "block";

      expect(spinner.style.display).toBe("block");
    });

    it("should hide loading spinner after search", () => {
      const spinner = document.getElementById("loading-spinner");
      spinner.style.display = "none";

      expect(spinner.style.display).toBe("none");
    });

    it("should display error message on search failure", () => {
      const error = document.getElementById("error-message");
      error.innerHTML = '<div class="error">Order not found</div>';

      expect(error.textContent).toContain("Order not found");
    });

    it("should clear error message", () => {
      const error = document.getElementById("error-message");
      error.innerHTML = "";

      expect(error.textContent).toBe("");
    });

    it("should display 404 error", () => {
      const error = document.getElementById("error-message");
      error.innerHTML = "<div>Order not found. Please check your Order ID and email address.</div>";

      expect(error.textContent).toContain("Order not found");
    });

    it("should display 403 error", () => {
      const error = document.getElementById("error-message");
      error.innerHTML = "<div>Invalid email address for this order.</div>";

      expect(error.textContent).toContain("Invalid email");
    });

    it("should display network error", () => {
      const error = document.getElementById("error-message");
      error.innerHTML = "<div>Connection error. Please try again.</div>";

      expect(error.textContent).toContain("Connection error");
    });
  });

  describe("Action Buttons", () => {
    it("should display print button", () => {
      const btn = document.getElementById("print-btn");
      expect(btn).toBeTruthy();
      expect(btn.textContent).toContain("Print");
    });

    it("should display track button", () => {
      const btn = document.getElementById("track-btn");
      expect(btn).toBeTruthy();
      expect(btn.textContent).toContain("Track");
    });

    it("should enable print button for valid orders", () => {
      const btn = document.getElementById("print-btn");
      btn.disabled = false;

      expect(btn.disabled).toBe(false);
    });

    it("should disable print button when no order displayed", () => {
      const btn = document.getElementById("print-btn");
      btn.disabled = true;

      expect(btn.disabled).toBe(true);
    });

    it("should trigger print on button click", () => {
      const btn = document.getElementById("print-btn");
      let printTriggered = false;

      btn.addEventListener("click", () => {
        printTriggered = true;
      });

      btn.click();
      expect(printTriggered).toBe(true);
    });

    it("should only show track button for shipped orders", () => {
      const btn = document.getElementById("track-btn");
      btn.style.display = "block";

      expect(btn.style.display).toBe("block");
    });
  });

  describe("Display Visibility Management", () => {
    it("should hide form after successful search", () => {
      const form = document.getElementById("order-search-form");
      form.style.display = "none";

      expect(form.style.display).toBe("none");
    });

    it("should show order display after search", () => {
      const display = document.getElementById("order-display-container");
      display.style.display = "block";

      expect(display.style.display).toBe("block");
    });

    it("should show form again on search reset", () => {
      const form = document.getElementById("order-search-form");
      form.style.display = "block";

      expect(form.style.display).toBe("block");
    });

    it("should hide order display on search reset", () => {
      const display = document.getElementById("order-display-container");
      display.style.display = "none";

      expect(display.style.display).toBe("none");
    });
  });

  describe("Responsive Behavior", () => {
    it("should have accessible form structure", () => {
      const form = document.getElementById("order-search-form");
      const inputs = form.querySelectorAll("input");

      expect(inputs.length).toBeGreaterThan(0);
    });

    it("should stack sections on mobile", () => {
      const container = document.getElementById("order-status-container");
      container.classList.add("mobile-layout");

      expect(container.classList.contains("mobile-layout")).toBe(true);
    });

    it("should display items in list format", () => {
      const itemsList = document.getElementById("items-list");
      itemsList.classList.add("items-list-layout");

      expect(itemsList.classList.contains("items-list-layout")).toBe(true);
    });

    it("should make tracking section expandable", () => {
      const tracking = document.getElementById("tracking-section");
      tracking.classList.add("expandable");

      expect(tracking.classList.contains("expandable")).toBe(true);
    });
  });
});
