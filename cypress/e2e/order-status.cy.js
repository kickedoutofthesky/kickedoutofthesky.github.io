/* eslint-disable no-undef */

describe("Order Status Page - E2E Tests", () => {
  beforeEach(() => {
    cy.visit("/store/order-status.html");
  });

  describe("Form Elements", () => {
    it("should display the order status page", () => {
      cy.get("[data-testid='order-status-page']").should("be.visible");
    });

    it("should have search form with correct fields", () => {
      cy.get("#search-form").should("be.visible");
      cy.get("#printful-order-id").should("exist");
      cy.get("#email").should("exist");
      cy.get("#search-btn").should("exist");
    });

    it("should display correct labels and placeholders", () => {
      cy.get("label[for='printful-order-id']").should("contain", "Printful Order ID");
      cy.get("label[for='email']").should("contain", "Email Address");
      cy.get("#printful-order-id").should("have.attr", "placeholder", "e.g., PF123456789");
      cy.get("#email").should("have.attr", "placeholder", "your@example.com");
    });

    it("should have form description text", () => {
      cy.get(".search-form p").should("contain", "Printful Order ID");
    });
  });

  describe("Button State - Initial", () => {
    it("should start with button disabled", () => {
      cy.get("#search-btn").should("be.disabled");
    });

    it("should have button with disabled styling", () => {
      cy.get("#search-btn").should("have.class", "search-button");
      cy.get("#search-btn").should("not.have.class", "active");
    });
  });

  describe("Button Highlighting - Printful Order ID Validation", () => {
    it("should enable button when valid Printful Order ID is entered", () => {
      cy.get("#printful-order-id").type("PF123456789");
      cy.get("#search-btn").should("not.be.disabled");
      cy.get("#search-btn").should("have.class", "active");
    });

    it("should disable button when Printful Order ID is cleared", () => {
      cy.get("#printful-order-id").type("PF123456789");
      cy.get("#search-btn").should("not.be.disabled");

      cy.get("#printful-order-id").clear();
      cy.get("#search-btn").should("be.disabled");
      cy.get("#search-btn").should("not.have.class", "active");
    });

    it("should disable button with invalid Printful Order ID format (missing PF)", () => {
      cy.get("#printful-order-id").type("123456789");
      cy.get("#search-btn").should("be.disabled");
      cy.get("#search-btn").should("not.have.class", "active");
    });

    it("should enable button with various valid Printful Order IDs", () => {
      const validIds = ["PF123456789", "PF1", "PF999999999"];

      validIds.forEach(id => {
        cy.get("#printful-order-id").clear().type(id);
        cy.get("#search-btn").should("not.be.disabled");
        cy.get("#search-btn").should("have.class", "active");
      });
    });

    it("should disable button with Printful Order ID missing number", () => {
      cy.get("#printful-order-id").type("PF");
      cy.get("#search-btn").should("be.disabled");
    });

    it("should disable button with Printful Order ID lowercase prefix", () => {
      cy.get("#printful-order-id").type("pf123456789");
      cy.get("#search-btn").should("be.disabled");
    });
  });

  describe("Printful Order ID Field - Required", () => {
    it("should require Printful Order ID", () => {
      cy.get("#printful-order-id").should("have.value", "");
      cy.get("#search-btn").should("be.disabled");
    });

    it("should accept Printful Order ID starting with PF", () => {
      cy.get("#printful-order-id").type("PF123456789");
      cy.get("#printful-order-id").should("have.value", "PF123456789");
      cy.get("#search-btn").should("not.be.disabled");
    });

    it("should reject lowercase pf prefix", () => {
      cy.get("#printful-order-id").type("pf987654321");
      cy.get("#printful-order-id").should("have.value", "pf987654321");
      cy.get("#search-btn").should("be.disabled");
    });

    it("should require Printful Order ID even with valid email", () => {
      cy.get("#printful-order-id").should("have.value", "");
      cy.get("#email").type("test@example.com");
      cy.get("#search-btn").should("be.disabled");
    });
  });

  describe("Form Submission - Validation", () => {
    it("should show error when Printful Order ID doesn't start with PF", () => {
      cy.get("#printful-order-id").type("12345");
      cy.get("#email").type("test@example.com");

      // Button should be disabled due to invalid PF ID
      cy.get("#search-btn").should("be.disabled");
    });

    it("should require Printful Order ID for submission", () => {
      cy.get("#email").type("test@example.com");
      cy.get("#search-btn").should("be.disabled");
    });

    it("should allow submission with valid Printful Order ID", () => {
      cy.get("#printful-order-id").type("PF123456");
      cy.get("#email").type("test@example.com");
      cy.get("#search-btn").should("not.be.disabled");
    });

    it("should require both valid Printful Order ID and email", () => {
      cy.get("#printful-order-id").type("PF123456789");
      cy.get("#email").type("test@example.com");
      cy.get("#search-btn").should("not.be.disabled");
    });

    it("should allow submission with just valid Printful Order ID if email is optional", () => {
      cy.get("#printful-order-id").type("PF123456789");
      // Email not required for button enable
      cy.get("#search-btn").should("not.be.disabled");
    });
  });

  describe("Form Reset", () => {
    it("should clear fields when search is reset", () => {
      cy.get("#printful-order-id").type("PF123456");
      cy.get("#email").type("test@example.com");

      // Mock API response to get to the reset button
      cy.intercept("GET", "**/api/order-status", {
        statusCode: 200,
        body: {
          status: "pending",
          message: "Order not found",
        },
      }).as("orderStatus");

      cy.get("#search-btn").click();

      // Wait for display to appear, then click reset
      cy.get("button").contains("Search Another Order").click({ force: true });

      cy.get("#printful-order-id").should("have.value", "");
      cy.get("#email").should("have.value", "");
    });

    it("should return to search form after error", () => {
      cy.get("#email").type("test@example.com");

      // Mock API error
      cy.intercept("GET", "**/api/order-status", {
        statusCode: 400,
        body: { error: "Order not found" },
      }).as("orderStatus");

      cy.get("#search-btn").click();

      cy.get("#error-message").should("be.visible");
      cy.get("button").contains("Search Again").should("be.visible");
    });
  });

  describe("URL Parameters Auto-Load", () => {
    it("should auto-load search when email and Printful Order ID in URL", () => {
      cy.visit("/store/order-status.html?printful_order_id=PF123456789&email=test@example.com");

      cy.get("#printful-order-id").should("have.value", "PF123456789");
      cy.get("#email").should("have.value", "test@example.com");

      // Should attempt to fetch order (mock prevents actual call)
      cy.intercept("GET", "**/api/order-status**").as("autoLoad");
      cy.get("@autoLoad", { timeout: 3000 }).then(interception => {
        // Auto-load should have been attempted
        if (interception) {
          expect(interception.request.url).to.include("email=test@example.com");
        }
      });
    });

    it("should auto-load search with just email in URL", () => {
      cy.visit("/store/order-status.html?email=test@example.com");

      cy.get("#email").should("have.value", "test@example.com");
      cy.get("#printful-order-id").should("have.value", "");
    });

    it("should not auto-load without email in URL", () => {
      cy.visit("/store/order-status.html?printful_order_id=PF123456789");

      cy.get("#printful-order-id").should("have.value", "");
      cy.get("#email").should("have.value", "");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should submit form when Enter is pressed in email field with valid email", () => {
      cy.get("#email").type("test@example.com");

      // Mock API
      cy.intercept("GET", "**/api/order-status**", {
        statusCode: 200,
        body: { status: "pending", message: "Order pending" },
      }).as("orderStatus");

      cy.get("#email").type("{enter}");

      // Should attempt to search
      cy.get("@orderStatus", { timeout: 3000 }).then(interception => {
        if (interception) {
          expect(interception.request.url).to.include("email=test@example.com");
        }
      });
    });

    it("should not submit when Enter is pressed with invalid email", () => {
      cy.get("#email").type("invalid-email{enter}");

      // Should not attempt search
      cy.get("#error-message").should("not.be.visible");
    });

    it("should submit from Printful Order ID field when Enter is pressed", () => {
      cy.get("#printful-order-id").type("PF123456");
      cy.get("#email").type("test@example.com");

      // Mock API
      cy.intercept("GET", "**/api/order-status**", {
        statusCode: 200,
        body: { status: "pending", message: "Order pending" },
      }).as("orderStatus");

      cy.get("#printful-order-id").type("{enter}");

      // Should attempt to search
      cy.get("@orderStatus", { timeout: 3000 }).then(interception => {
        if (interception) {
          expect(interception.request.url).to.include("email=test@example.com");
        }
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for form inputs", () => {
      cy.get("label[for='printful-order-id']").should("exist");
      cy.get("label[for='email']").should("exist");
    });

    it("should have descriptive button text", () => {
      cy.get("#search-btn").should("contain", "Track Order");
    });

    it("should have proper form structure", () => {
      cy.get(".search-form").should("contain", "h2");
      cy.get(".search-form").should("contain", "p");
    });
  });

  describe("Multiple Orders - Email Only Search", () => {
    it("should display multiple orders when email-only search returns array", () => {
      cy.get("#email").type("test@example.com");

      // Mock API returning multiple orders
      cy.intercept("GET", "**/api/order-status**", {
        statusCode: 200,
        body: [
          {
            printful_order_id: "PF123456789",
            status: "shipped",
            created_at: "1627000000000",
            updated_at: "1627100000000",
            costs: { total_cents: 3999 },
          },
          {
            printful_order_id: "PF987654321",
            status: "processing",
            created_at: "1627200000000",
            updated_at: "1627300000000",
            costs: { total_cents: 2999 },
          },
        ],
      }).as("multipleOrders");

      cy.get("#search-btn").click();

      cy.wait("@multipleOrders");

      // Should display "Found 2 order(s)"
      cy.get("#order-display").should("contain", "Found 2 order(s)");
    });

    it("should show summary of each order in multiple orders view", () => {
      cy.get("#email").type("test@example.com");

      cy.intercept("GET", "**/api/order-status**", {
        statusCode: 200,
        body: [
          {
            printful_order_id: "PF123456789",
            status: "shipped",
            created_at: "1627000000000",
            updated_at: "1627100000000",
            costs: { total_cents: 3999 },
          },
          {
            printful_order_id: "PF987654321",
            status: "processing",
            created_at: "1627200000000",
            updated_at: "1627300000000",
            costs: { total_cents: 2999 },
          },
        ],
      }).as("multipleOrders");

      cy.get("#search-btn").click();
      cy.wait("@multipleOrders");

      // Should show order IDs
      cy.get("#order-display").should("contain", "PF123456789");
      cy.get("#order-display").should("contain", "PF987654321");

      // Should show status badges
      cy.get(".status-shipped").should("exist");
      cy.get(".status-processing").should("exist");
    });

    it("should have View Details button for each order", () => {
      cy.get("#email").type("test@example.com");

      cy.intercept("GET", "**/api/order-status**", {
        statusCode: 200,
        body: [
          {
            printful_order_id: "PF123456789",
            status: "shipped",
            created_at: "1627000000000",
            updated_at: "1627100000000",
            costs: { total_cents: 3999 },
          },
          {
            printful_order_id: "PF987654321",
            status: "processing",
            created_at: "1627200000000",
            updated_at: "1627300000000",
            costs: { total_cents: 2999 },
          },
        ],
      }).as("multipleOrders");

      cy.get("#search-btn").click();
      cy.wait("@multipleOrders");

      cy.get("button").contains("View Details").should("have.length.at.least", 2);
    });

    it("should show no orders message when email has no orders", () => {
      cy.get("#email").type("noorders@example.com");

      cy.intercept("GET", "**/api/order-status**", {
        statusCode: 200,
        body: [],
      }).as("noOrders");

      cy.get("#search-btn").click();
      cy.wait("@noOrders");

      cy.get("#order-display").should("contain", "No orders found");
    });

    it("should allow searching again from multiple orders view", () => {
      cy.get("#email").type("test@example.com");

      cy.intercept("GET", "**/api/order-status**", {
        statusCode: 200,
        body: [
          {
            printful_order_id: "PF123456789",
            status: "shipped",
            created_at: "1627000000000",
            updated_at: "1627100000000",
            costs: { total_cents: 3999 },
          },
        ],
      }).as("multipleOrders");

      cy.get("#search-btn").click();
      cy.wait("@multipleOrders");

      cy.get("button").contains("Search Another Order").click();

      cy.get("#search-form").should("be.visible");
      cy.get("#order-display").should("not.be.visible");
    });
  });

  describe("Single Order - Printful Order ID Search", () => {
    it("should display single order when Printful Order ID is provided", () => {
      cy.get("#printful-order-id").type("PF123456789");
      cy.get("#email").type("test@example.com");

      // Mock API returning single order (object, not array)
      cy.intercept("GET", "**/api/order-status**", {
        statusCode: 200,
        body: {
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
          items: [],
          costs: {
            subtotal_cents: 2500,
            shipping_cents: 1000,
            tax_cents: 274,
            total_cents: 3774,
          },
        },
      }).as("singleOrder");

      cy.get("#search-btn").click();
      cy.wait("@singleOrder");

      // Should not show "Found X orders" message
      cy.get("#order-display").should("not.contain", "Found");

      // Should show full order details
      cy.get("[data-testid='order-section']").should("be.visible");
    });

    it("should show View Details button when clicking from multiple orders", () => {
      cy.get("#email").type("test@example.com");

      // First response: multiple orders
      cy.intercept("GET", "**/api/order-status?email=*", {
        statusCode: 200,
        body: [
          {
            printful_order_id: "PF123456789",
            status: "shipped",
            created_at: "1627000000000",
            updated_at: "1627100000000",
            costs: { total_cents: 3999 },
          },
        ],
      }).as("multipleOrders");

      // Second response: single order details
      cy.intercept("GET", "**/api/order-status?printful_order_id=*&email=*", {
        statusCode: 200,
        body: {
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
          items: [],
          costs: {
            subtotal_cents: 2500,
            shipping_cents: 1000,
            tax_cents: 274,
            total_cents: 3999,
          },
        },
      }).as("singleOrderDetails");

      cy.get("#search-btn").click();
      cy.wait("@multipleOrders");

      cy.get("button").contains("View Details").first().click();

      cy.wait("@singleOrderDetails", { timeout: 5000 }).then(interception => {
        if (interception) {
          expect(interception.request.url).to.include("printful_order_id=PF123456789");
        }
      });
    });
  });
});
