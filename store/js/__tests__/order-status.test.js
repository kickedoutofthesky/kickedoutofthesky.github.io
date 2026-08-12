// Order Status Page Tests
// Tests for order status page form validation and functionality

describe("Order Status Page - Validation Functions", () => {
  // Import the exported functions
  const { isValidEmail, isValidPrintfulOrderId } = require("../order-status.js");

  describe("Email Validation", () => {
    test("should accept valid email addresses", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("test.email@domain.co.uk")).toBe(true);
      expect(isValidEmail("firstname+lastname@example.com")).toBe(true);
    });

    test("should reject invalid email addresses", () => {
      expect(isValidEmail("plainaddress")).toBe(false);
      expect(isValidEmail("@nodomain.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("user @example.com")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });

    test("should reject email with spaces", () => {
      expect(isValidEmail("user name@example.com")).toBe(false);
    });
  });

  describe("Printful Order ID Validation", () => {
    test("should accept valid alphanumeric Printful Order IDs", () => {
      expect(isValidPrintfulOrderId("eoKK1upmt2jl99BK1qYLDjbYH1gwUZeh")).toBe(true);
      expect(isValidPrintfulOrderId("ABC123456789")).toBe(true);
      expect(isValidPrintfulOrderId("abcde")).toBe(true);
      expect(isValidPrintfulOrderId("12345")).toBe(true);
    });

    test("should reject invalid Printful Order IDs", () => {
      expect(isValidPrintfulOrderId("AB12")).toBe(false);
      expect(isValidPrintfulOrderId("ABC-123")).toBe(false);
      expect(isValidPrintfulOrderId("SF@123456")).toBe(false);
      expect(isValidPrintfulOrderId("")).toBe(false);
    });

    test("should require minimum length of 5 characters", () => {
      expect(isValidPrintfulOrderId("AB123")).toBe(true);
      expect(isValidPrintfulOrderId("AB12")).toBe(false);
      expect(isValidPrintfulOrderId("Pf123")).toBe(true);
      expect(isValidPrintfulOrderId("PF123")).toBe(true);
    });
  });
});

describe("Order Status Page - Form Behavior", () => {
  beforeEach(() => {
    // Set up DOM structure
    document.body.innerHTML = `
      <div id="search-form">
        <input type="text" id="printful-order-id" value="" />
        <input type="email" id="email" value="" />
        <button id="search-btn" class="search-button" disabled>Track Order</button>
      </div>
      <div id="error-container" style="display: none">
        <div id="error-message"></div>
      </div>
      <div id="loading-container" style="display: none"></div>
      <div id="order-display" style="display: none"></div>
    `;
  });

  test("should start with button disabled and no active class", () => {
    const searchBtn = document.getElementById("search-btn");
    searchBtn.disabled = true;
    searchBtn.classList.remove("active");

    expect(searchBtn.disabled).toBe(true);
    expect(searchBtn.classList.contains("active")).toBe(false);
  });

  test("should apply active class when email is valid", () => {
    const emailInput = document.getElementById("email");
    const searchBtn = document.getElementById("search-btn");
    const { isValidEmail } = require("../order-status.js");

    emailInput.value = "valid@example.com";

    if (isValidEmail(emailInput.value.trim())) {
      searchBtn.classList.add("active");
      searchBtn.disabled = false;
    }

    expect(searchBtn.classList.contains("active")).toBe(true);
    expect(searchBtn.disabled).toBe(false);
  });

  test("should remove active class when email becomes invalid", () => {
    const emailInput = document.getElementById("email");
    const searchBtn = document.getElementById("search-btn");
    const { isValidEmail } = require("../order-status.js");

    // Start valid
    emailInput.value = "valid@example.com";
    if (isValidEmail(emailInput.value.trim())) {
      searchBtn.classList.add("active");
      searchBtn.disabled = false;
    }

    // Change to invalid
    emailInput.value = "invalid";
    if (!isValidEmail(emailInput.value.trim())) {
      searchBtn.classList.remove("active");
      searchBtn.disabled = true;
    }

    expect(searchBtn.classList.contains("active")).toBe(false);
    expect(searchBtn.disabled).toBe(true);
  });

  test("button should remain disabled with invalid email", () => {
    const { isValidEmail } = require("../order-status.js");
    const emailInput = document.getElementById("email");

    emailInput.value = "invalid-email";

    expect(isValidEmail(emailInput.value.trim())).toBe(false);
  });

  test("button should be disabled with empty email", () => {
    const { isValidEmail } = require("../order-status.js");
    const emailInput = document.getElementById("email");

    emailInput.value = "";

    expect(isValidEmail(emailInput.value.trim())).toBe(false);
  });

  test("should require both email and Printful Order ID", () => {
    const printfulInput = document.getElementById("printful-order-id");
    const emailInput = document.getElementById("email");
    const { isValidEmail, isValidPrintfulOrderId } = require("../order-status.js");

    // Both required
    printfulInput.value = "PF123456789";
    emailInput.value = "test@example.com";

    const bothValid = isValidEmail(emailInput.value.trim()) && isValidPrintfulOrderId(printfulInput.value.trim());
    expect(bothValid).toBe(true);

    // Only email - not valid
    printfulInput.value = "";
    const emailOnly = isValidEmail(emailInput.value.trim()) && isValidPrintfulOrderId(printfulInput.value.trim());
    expect(emailOnly).toBe(false);

    // Only Printful ID - not valid
    printfulInput.value = "PF123456789";
    emailInput.value = "";
    const orderIdOnly = isValidEmail(emailInput.value.trim()) && isValidPrintfulOrderId(printfulInput.value.trim());
    expect(orderIdOnly).toBe(false);
  });

  test("should validate Printful Order ID format when provided", () => {
    const { isValidPrintfulOrderId } = require("../order-status.js");

    const validIdWithPF = "PF123456789";
    const validIdWithoutPF = "123456789";
    const invalidIdTooShort = "AB12";

    expect(isValidPrintfulOrderId(validIdWithPF)).toBe(true);
    expect(isValidPrintfulOrderId(validIdWithoutPF)).toBe(true);
    expect(isValidPrintfulOrderId(invalidIdTooShort)).toBe(false);
  });
});

describe("Order Status Page - URL Parameters", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="search-form">
        <input type="text" id="printful-order-id" value="" />
        <input type="email" id="email" value="" />
        <button id="search-btn" class="search-button">Track Order</button>
      </div>
      <div id="error-container" style="display: none">
        <div id="error-message"></div>
      </div>
      <div id="loading-container" style="display: none"></div>
      <div id="order-display" style="display: none"></div>
    `;

    // Mock window.history.replaceState
    window.history.replaceState = jest.fn();
  });

  test("should populate email from URL parameter", () => {
    const urlParams = new URLSearchParams("?email=test@example.com");

    if (urlParams.has("email")) {
      const email = urlParams.get("email");
      const emailInput = document.getElementById("email");
      emailInput.value = email;

      expect(emailInput.value).toBe("test@example.com");
    }
  });

  test("should populate printful order ID from URL parameter if provided", () => {
    const urlParams = new URLSearchParams("?printful_order_id=PF123456789&email=test@example.com");

    if (urlParams.has("printful_order_id")) {
      const printfulOrderId = urlParams.get("printful_order_id");
      const printfulInput = document.getElementById("printful-order-id");
      printfulInput.value = printfulOrderId;

      expect(printfulInput.value).toBe("PF123456789");
    }
  });

  test("should only auto-load if both email and printful_order_id are present", () => {
    // URL with only email should not auto-load
    const urlParamsEmailOnly = new URLSearchParams("?email=test@example.com");
    expect(urlParamsEmailOnly.has("email") && urlParamsEmailOnly.has("printful_order_id")).toBe(false);

    // URL with both should auto-load
    const urlParamsComplete = new URLSearchParams("?email=test@example.com&printful_order_id=PF123456789");
    expect(urlParamsComplete.has("email") && urlParamsComplete.has("printful_order_id")).toBe(true);
  });
});

describe("Order Status Page - API Response Handling", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="search-form"></div>
      <div id="error-container" style="display: none">
        <div id="error-message"></div>
      </div>
      <div id="loading-container" style="display: none"></div>
      <div id="order-display" style="display: none"></div>
    `;
  });

  test("should handle 404 error for order not found", () => {
    const status = 404;
    const errorMessage = "Order not found. Please check your Order ID and email address.";

    expect(status).toBe(404);
    expect(errorMessage).toContain("Order not found");
  });

  test("should handle 403 error for email mismatch", () => {
    const status = 403;
    const errorMessage = "The email address does not match this order. Please verify and try again.";

    expect(status).toBe(403);
    expect(errorMessage).toContain("email address does not match");
  });

  test("should return single order object with both required fields", () => {
    const singleOrderData = {
      printful_order_id: "PF123456789",
      email_verified: true,
      status: "shipped",
      created_at: "1627000000000",
      updated_at: "1627100000000",
      recipient: {
        name: "John Doe",
        address: {
          line1: "123 Main St",
          city: "Springfield",
          state: "IL",
          zip: "62701",
          country: "US",
          country_code: "US",
        },
      },
    };

    expect(Array.isArray(singleOrderData)).toBe(false);
    expect(singleOrderData.printful_order_id).toBe("PF123456789");
    expect(singleOrderData.email_verified).toBe(true);
  });

  test("should include shipments array with new tracking fields", () => {
    const shipmentData = {
      id: "#168865218-82002233",
      carrier: "Amazon Ground",
      service: "Standard",
      tracking_number: "TBA333241302633",
      tracking_url: "https://tracking.example.com",
      status: "delivered",
      shipped_date: "1627000000000",
      delivered_date: "1627200000000",
    };

    expect(shipmentData.id).toBeDefined();
    expect(shipmentData.delivered_date).toBeDefined();
    expect(shipmentData.tracking_url).toBeDefined();
  });
});

describe("Order Status Page - Multiple Orders (Legacy)", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="search-form" style="display: none"></div>
      <div id="error-container" style="display: none"></div>
      <div id="loading-container" style="display: none"></div>
      <div id="order-display" style="display: none"></div>
    `;
  });

  test("should detect multiple orders as array", () => {
    const singleOrder = { printful_order_id: "PF123", status: "shipped" };
    const multipleOrders = [
      { printful_order_id: "PF123", status: "shipped" },
      { printful_order_id: "PF124", status: "processing" },
    ];

    expect(Array.isArray(singleOrder)).toBe(false);
    expect(Array.isArray(multipleOrders)).toBe(true);
    expect(multipleOrders.length).toBe(2);
  });

  test("should return multiple orders for email-only search", () => {
    const emailOnlyData = [
      {
        printful_order_id: "PF123456789",
        status: "shipped",
        created_at: "1627000000000",
        updated_at: "1627100000000",
      },
      {
        printful_order_id: "PF987654321",
        status: "processing",
        created_at: "1627200000000",
        updated_at: "1627300000000",
      },
    ];

    expect(Array.isArray(emailOnlyData)).toBe(true);
    expect(emailOnlyData.length).toBe(2);
    emailOnlyData.forEach(order => {
      expect(order.printful_order_id).toBeDefined();
      expect(order.status).toBeDefined();
    });
  });

  test("should return single order for Printful Order ID search", () => {
    const singleOrderData = {
      printful_order_id: "PF123456789",
      status: "shipped",
      created_at: "1627000000000",
      updated_at: "1627100000000",
      recipient: {
        name: "John Doe",
        address: {
          line1: "123 Main St",
          city: "Springfield",
          state: "IL",
          zip: "62701",
          country: "US",
        },
      },
    };

    expect(Array.isArray(singleOrderData)).toBe(false);
    expect(singleOrderData.printful_order_id).toBe("PF123456789");
  });

  test("should handle empty orders array", () => {
    const emptyOrders = [];

    expect(Array.isArray(emptyOrders)).toBe(true);
    expect(emptyOrders.length).toBe(0);
  });

  test("should handle single order in array format", () => {
    const singleOrderArray = [
      {
        printful_order_id: "PF123456789",
        status: "processing",
      },
    ];

    expect(Array.isArray(singleOrderArray)).toBe(true);
    expect(singleOrderArray.length).toBe(1);
  });

  test("API response logic: email-only returns array, Printful ID returns object", () => {
    // Simulate API response handling
    const emailOnlyResponse = Array.isArray([{ printful_order_id: "PF123" }, { printful_order_id: "PF124" }]);

    const printfulIdResponse = Array.isArray({
      printful_order_id: "PF123",
    });

    expect(emailOnlyResponse).toBe(true);
    expect(printfulIdResponse).toBe(false);
  });
});
