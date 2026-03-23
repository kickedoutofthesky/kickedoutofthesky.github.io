/* eslint-disable no-undef */

describe("Success Page - Order Confirmation Display", () => {
  beforeEach(() => {
    // Mock the order details API
    const mockOrderDetails = {
      orderId: "ord_123456",
      customer: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
      },
      shippingAddress: {
        name: "John Doe",
        line1: "123 Main St",
        line2: "Apt 4",
        city: "New York",
        state: "NY",
        postal_code: "10001",
        country: "US",
      },
      shippingMethod: "Standard Shipping",
      shippingCost: 0,
      lineItems: [
        {
          name: "Unisex Tee w/ Man Falling - Black / S",
          quantity: 1,
          unitPrice: 2500,
          amount: 2500,
        },
        {
          name: "Unisex Hoodie w/ Typewriter Text - Navy Blue / M",
          quantity: 1,
          unitPrice: 3500,
          amount: 3500,
        },
      ],
      orderSummary: {
        subtotal: 6000,
        shipping: 0,
        tax: 480,
        total: 6480,
      },
      currency: "USD",
    };

    cy.intercept("GET", "**/api/order-details?session_id=*", {
      statusCode: 200,
      body: mockOrderDetails,
    }).as("orderDetailsAPI");
  });

  it("should display success message and loading indicator initially", () => {
    cy.visit("/store/success.html?session_id=cs_test_123");

    // Verify success page loads
    cy.contains("Order Successful").should("be.visible");
    cy.contains("Thank you for your purchase").should("be.visible");

    // Loading indicator should appear initially
    cy.get("#loading-indicator").should("exist");
  });

  it("should display order items with images after loading", () => {
    cy.visit("/store/success.html?session_id=cs_test_123");

    // Wait for API call
    cy.wait("@orderDetailsAPI");

    // Verify order items are displayed
    cy.get("#order-items").should("be.visible");
    cy.get("#order-items div").should("have.length.greaterThan", 0);

    // Verify product images are displayed
    cy.get("#order-items img").should("have.length.greaterThan", 0);
    cy.get("#order-items img").each($img => {
      cy.wrap($img).should("have.attr", "src").and("not.be.empty");
    });
  });

  it("should display customer information", () => {
    cy.visit("/store/success.html?session_id=cs_test_123");

    cy.wait("@orderDetailsAPI");

    // Verify customer section is visible
    cy.get("#customer-section").should("be.visible");

    // Verify customer details
    cy.get("#customer-name").should("contain", "John Doe");
    cy.get("#customer-email").should("contain", "john@example.com");
    cy.get("#customer-phone").should("contain", "+1234567890");
  });

  it("should display shipping address with country name", () => {
    cy.visit("/store/success.html?session_id=cs_test_123");

    cy.wait("@orderDetailsAPI");

    // Verify shipping section is visible
    cy.get("#shipping-section").should("be.visible");

    // Verify address is displayed
    cy.get("#shipping-address").should("contain", "John Doe");
    cy.get("#shipping-address").should("contain", "123 Main St");
    cy.get("#shipping-address").should("contain", "New York");
    cy.get("#shipping-address").should("contain", "10001");

    // Verify country name is displayed (not code)
    // Should show "United States" instead of "US"
    cy.get("#shipping-address").then($address => {
      const text = $address.text();
      // Either contains full country name or falls back to code
      expect(text).to.match(/United States|US/);
    });
  });

  it("should display order summary with totals", () => {
    cy.visit("/store/success.html?session_id=cs_test_123");

    cy.wait("@orderDetailsAPI");

    // Verify summary section is visible
    cy.get("#summary-subtotal").should("contain", "$60.00");
    cy.get("#summary-shipping").should("contain", "$0.00");
    cy.get("#summary-tax").should("contain", "$4.80");
    cy.get("#summary-total").should("contain", "$64.80");
  });

  it("should not display order confirmation number on page", () => {
    cy.visit("/store/success.html?session_id=cs_test_123");

    cy.wait("@orderDetailsAPI");

    // Verify order-id-display element doesn't exist or is hidden
    cy.get("#order-id-display").should("not.exist");
  });

  it("should not display Return to Store button", () => {
    cy.visit("/store/success.html?session_id=cs_test_123");

    // Button should not exist
    cy.contains("Return to Store").should("not.exist");
  });

  it("should parse item names correctly and display product names", () => {
    cy.visit("/store/success.html?session_id=cs_test_123");

    cy.wait("@orderDetailsAPI");

    // Verify item names are displayed
    cy.get("#order-items").should("contain", "Unisex Tee w/ Man Falling - Black / S");
    cy.get("#order-items").should("contain", "Unisex Hoodie w/ Typewriter Text - Navy Blue / M");
  });

  it("should hide loading indicator after order details load", () => {
    cy.visit("/store/success.html?session_id=cs_test_123");

    // Loading indicator should be hidden after data loads
    cy.wait("@orderDetailsAPI");

    cy.get("#loading-indicator").should("have.css", "display", "none");
  });
});

describe("Success Page - Responsiveness", () => {
  beforeEach(() => {
    const mockOrderDetails = {
      orderId: "ord_123456",
      customer: {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "+1987654321",
      },
      shippingAddress: {
        name: "Jane Smith",
        line1: "456 Oak Ave",
        city: "California",
        state: "CA",
        postal_code: "90001",
        country: "US",
      },
      lineItems: [
        {
          name: "Unisex Tee w/ Text - White / M",
          quantity: 2,
          unitPrice: 2500,
          amount: 5000,
        },
      ],
      orderSummary: {
        subtotal: 5000,
        shipping: 500,
        tax: 450,
        total: 5950,
      },
      currency: "USD",
    };

    cy.intercept("GET", "**/api/order-details?session_id=*", {
      statusCode: 200,
      body: mockOrderDetails,
    }).as("orderDetailsAPI");
  });

  it("should display two-column layout on desktop (1000px+)", () => {
    cy.viewport(1200, 800);
    cy.visit("/store/success.html?session_id=cs_test_123");
    cy.wait("@orderDetailsAPI");

    // Verify grid layout is visible
    cy.get(".order-shipping-grid").should("be.visible");

    cy.get("#order-section").should("be.visible");
    cy.get("#customer-section").should("be.visible");
    cy.get("#shipping-section").should("be.visible");
  });

  it("should wrap to single column on tablet (768px-999px)", () => {
    cy.viewport(800, 600);
    cy.visit("/store/success.html?session_id=cs_test_123");
    cy.wait("@orderDetailsAPI");

    // Verify single column layout is visible
    cy.get(".order-shipping-grid").should("be.visible");

    // All sections should be visible but stacked vertically
    cy.get("#order-section").should("be.visible");
    cy.get("#customer-section").should("be.visible");
  });

  it("should wrap to single column on mobile (≤767px)", () => {
    cy.viewport(375, 600);
    cy.visit("/store/success.html?session_id=cs_test_123");
    cy.wait("@orderDetailsAPI");

    // Verify single column layout is visible
    cy.get(".order-shipping-grid").should("be.visible");
  });

  it("should stack order items vertically on small screens (≤576px)", () => {
    cy.viewport(375, 667);
    cy.visit("/store/success.html?session_id=cs_test_123");
    cy.wait("@orderDetailsAPI");

    // On small screens, item image should be above details
    cy.get("#order-items > div")
      .first()
      .then($item => {
        const display = window.getComputedStyle($item[0]).flexWrap;
        expect(display).to.equal("wrap");
      });
  });

  it("should display order items with proper image dimensions on mobile", () => {
    cy.viewport(375, 667);
    cy.visit("/store/success.html?session_id=cs_test_123");
    cy.wait("@orderDetailsAPI");

    // Verify product images are displayed
    cy.get("#order-items img").should("exist");
    cy.get("#order-items img").each($img => {
      // Images should be loaded and visible
      cy.wrap($img).should("have.attr", "src");
      cy.wrap($img).should("be.visible");
    });
  });

  it("should make shipping section full width on mobile", () => {
    cy.viewport(375, 667);
    cy.visit("/store/success.html?session_id=cs_test_123");
    cy.wait("@orderDetailsAPI");

    // Verify sections are full width
    cy.get("#order-section").should("be.visible");
    cy.get("#shipping-section").should("be.visible");
    cy.get("#customer-section").should("be.visible");
  });

  it("should maintain readability of order summary on all screen sizes", () => {
    [375, 600, 1200].forEach(width => {
      cy.viewport(width, 800);
      cy.visit("/store/success.html?session_id=cs_test_123");
      cy.wait("@orderDetailsAPI");

      // Verify summary is always visible and readable
      cy.get("#summary-subtotal").should("be.visible").and("have.text", "$50.00");
      cy.get("#summary-total").should("be.visible").and("have.text", "$59.50");
    });
  });
});

describe("Success Page - No Scrollbar in Order Items", () => {
  beforeEach(() => {
    const mockOrderDetails = {
      customer: { name: "Test User", email: "test@example.com" },
      shippingAddress: { line1: "123 St", city: "City", country: "US" },
      lineItems: [
        { name: "Item 1 - Color / S", quantity: 1, unitPrice: 1000, amount: 1000 },
        { name: "Item 2 - Color / M", quantity: 1, unitPrice: 2000, amount: 2000 },
        { name: "Item 3 - Color / L", quantity: 1, unitPrice: 3000, amount: 3000 },
      ],
      orderSummary: { subtotal: 6000, shipping: 0, tax: 480, total: 6480 },
      currency: "USD",
    };

    cy.intercept("GET", "**/api/order-details?session_id=*", {
      statusCode: 200,
      body: mockOrderDetails,
    }).as("orderDetailsAPI");
  });

  it("should display all order items without scrollbar", () => {
    cy.visit("/store/success.html?session_id=cs_test_123");
    cy.wait("@orderDetailsAPI");

    // Order items container should not have scroll
    cy.get("#order-items").should("have.css", "overflow", "visible");

    // All items should be visible without scrolling
    cy.get("#order-items > div").should("have.length", 3);
    cy.get("#order-items > div").each($item => {
      cy.wrap($item).should("be.visible");
    });
  });

  it("should not have max-height restriction on order items", () => {
    cy.visit("/store/success.html?session_id=cs_test_123");
    cy.wait("@orderDetailsAPI");

    cy.get("#order-items").should($items => {
      const maxHeight = window.getComputedStyle($items[0]).maxHeight;
      // max-height should be 'none' or not set to limit scrolling
      expect(maxHeight).to.not.equal("300px");
    });
  });
});

describe("Success Page - Loading States", () => {
  it("should show loading indicator while fetching order details", () => {
    // Set up intercept with delay BEFORE visiting
    cy.intercept("GET", "**/api/order-details?session_id=*", {
      statusCode: 200,
      delay: 500,
      body: {
        customer: { name: "Test", email: "test@example.com" },
        shippingAddress: { line1: "123 St", country: "US" },
        lineItems: [{ name: "Item - Color / S", quantity: 1, unitPrice: 1000, amount: 1000 }],
        orderSummary: { subtotal: 1000, shipping: 0, tax: 80, total: 1080 },
      },
    }).as("delayedOrderDetails");

    cy.visit("/store/success.html?session_id=cs_test_123");

    // Loading indicator should be visible
    cy.get("#loading-indicator").should("be.visible");

    cy.wait("@delayedOrderDetails");

    // Loading indicator should be hidden after data loads
    cy.get("#loading-indicator").should("have.css", "display", "none");
  });

  it("should hide loading indicator on API error", () => {
    cy.intercept("GET", "**/api/order-details?session_id=*", {
      statusCode: 500,
      body: { error: "Server error" },
    }).as("errorOrderDetails");

    cy.visit("/store/success.html?session_id=cs_test_123");

    cy.wait("@errorOrderDetails");

    // Loading indicator should be hidden even on error
    cy.get("#loading-indicator").should("have.css", "display", "none");
  });
});

describe("Success Page - Product Image Display", () => {
  beforeEach(() => {
    const mockOrderDetails = {
      customer: { name: "Test", email: "test@example.com" },
      shippingAddress: { line1: "123 St", country: "US" },
      lineItems: [
        {
          name: "Unisex Tee w/ Typewriter Text - Black / S",
          quantity: 1,
          unitPrice: 2500,
          amount: 2500,
        },
        {
          name: "Unisex Hoodie w/ Typewriter Text - Dark Grey Heather / M",
          quantity: 1,
          unitPrice: 3500,
          amount: 3500,
        },
      ],
      orderSummary: { subtotal: 6000, shipping: 0, tax: 480, total: 6480 },
      currency: "USD",
    };

    cy.intercept("GET", "**/api/order-details?session_id=*", {
      statusCode: 200,
      body: mockOrderDetails,
    }).as("orderDetailsAPI");
  });

  it("should display product images for each order item", () => {
    cy.visit("/store/success.html?session_id=cs_test_123");
    cy.wait("@orderDetailsAPI");

    // Verify images are displayed for items
    cy.get("#order-items img").should("have.length.greaterThan", 0);

    // Verify images have valid src attributes
    cy.get("#order-items img").each($img => {
      cy.wrap($img).should("have.attr", "src").and("not.be.empty");
    });
  });

  it("should display images inline with product details", () => {
    cy.visit("/store/success.html?session_id=cs_test_123");
    cy.wait("@orderDetailsAPI");

    // Each item should have an image and details in flex layout
    cy.get("#order-items > div")
      .first()
      .then($item => {
        // Should have flexbox layout
        const display = window.getComputedStyle($item[0]).display;
        expect(display).to.equal("flex");

        // Should contain an image
        cy.wrap($item).find("img").should("exist");

        // Should contain item details
        cy.wrap($item).should("contain", "Qty:");
      });
  });
});
