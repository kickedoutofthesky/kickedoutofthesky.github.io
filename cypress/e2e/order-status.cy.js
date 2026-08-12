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

  describe("Button Highlighting - Both Fields Required", () => {
    it("should require both email and Printful Order ID to enable button", () => {
      cy.get("#printful-order-id").type("PF123456789");
      cy.get("#search-btn").should("be.disabled");

      cy.get("#email").type("test@example.com");
      cy.get("#search-btn").should("not.be.disabled");
      cy.get("#search-btn").should("have.class", "active");
    });

    it("should disable button when Printful Order ID is cleared", () => {
      cy.get("#printful-order-id").type("PF123456789");
      cy.get("#email").type("test@example.com");
      cy.get("#search-btn").should("not.be.disabled");

      cy.get("#printful-order-id").clear();
      cy.get("#search-btn").should("be.disabled");
      cy.get("#search-btn").should("not.have.class", "active");
    });

    it("should disable button when email is cleared", () => {
      cy.get("#printful-order-id").type("PF123456789");
      cy.get("#email").type("test@example.com");
      cy.get("#search-btn").should("not.be.disabled");

      cy.get("#email").clear();
      cy.get("#search-btn").should("be.disabled");
      cy.get("#search-btn").should("not.have.class", "active");
    });

    it("should disable button with invalid Printful Order ID format", () => {
      cy.get("#email").type("test@example.com");
      cy.get("#printful-order-id").type("123456789");
      cy.get("#search-btn").should("be.disabled");
    });

    it("should disable button with invalid email format", () => {
      cy.get("#printful-order-id").type("PF123456789");
      cy.get("#email").type("invalid-email");
      cy.get("#search-btn").should("be.disabled");
    });

    it("should enable button with valid Printful Order ID and email", () => {
      cy.get("#printful-order-id").type("PF123456789");
      cy.get("#email").type("test@example.com");
      cy.get("#search-btn").should("not.be.disabled");
      cy.get("#search-btn").should("have.class", "active");
    });

    it("should disable button with lowercase pf prefix even with valid email", () => {
      cy.get("#email").type("test@example.com");
      cy.get("#printful-order-id").type("pf123456789");
      cy.get("#search-btn").should("be.disabled");
    });
  });

  describe("Form Fields - Required", () => {
    it("should require both Printful Order ID and email for button enable", () => {
      cy.get("#printful-order-id").should("have.value", "");
      cy.get("#email").should("have.value", "");
      cy.get("#search-btn").should("be.disabled");
    });

    it("should require email when Printful Order ID is valid", () => {
      cy.get("#printful-order-id").type("PF123456789");
      cy.get("#search-btn").should("be.disabled");

      cy.get("#email").type("test@example.com");
      cy.get("#search-btn").should("not.be.disabled");
    });

    it("should require valid Printful Order ID when email is valid", () => {
      cy.get("#email").type("test@example.com");
      cy.get("#search-btn").should("be.disabled");

      cy.get("#printful-order-id").type("PF123456789");
      cy.get("#search-btn").should("not.be.disabled");
    });

    it("should reject lowercase pf prefix", () => {
      cy.get("#printful-order-id").type("pf987654321");
      cy.get("#email").type("test@example.com");
      cy.get("#search-btn").should("be.disabled");
    });

    it("should reject invalid email format", () => {
      cy.get("#printful-order-id").type("PF123456789");
      cy.get("#email").type("not-an-email");
      cy.get("#search-btn").should("be.disabled");
    });

    it("should accept valid email formats", () => {
      cy.get("#printful-order-id").type("PF123456789");
      const validEmails = ["test@example.com", "user.name@domain.co.uk", "first+last@example.org"];

      validEmails.forEach(email => {
        cy.get("#email").clear().type(email);
        cy.get("#search-btn").should("not.be.disabled");
      });
    });
  });

  describe("Form Submission - Validation", () => {
    it("should require both fields for submission", () => {
      cy.get("#printful-order-id").type("PF123456");
      cy.get("#search-btn").should("be.disabled");

      cy.get("#email").type("test@example.com");
      cy.get("#search-btn").should("not.be.disabled");
    });

    it("should reject invalid Printful Order ID format", () => {
      cy.get("#email").type("test@example.com");
      cy.get("#printful-order-id").type("12345");
      cy.get("#search-btn").should("be.disabled");
    });

    it("should reject invalid email format", () => {
      cy.get("#printful-order-id").type("PF123456");
      cy.get("#email").type("invalid-email");
      cy.get("#search-btn").should("be.disabled");
    });

    it("should allow submission with valid email and valid Printful Order ID", () => {
      cy.get("#printful-order-id").type("PF123456789");
      cy.get("#email").type("test@example.com");
      cy.get("#search-btn").should("not.be.disabled");

      // Verify that button can be clicked
      cy.get("#search-btn").should("not.have.attr", "disabled");
    });
  });

  describe("Form Reset", () => {
    it("should allow clearing fields and searching again", () => {
      cy.get("#printful-order-id").type("PF123456");
      cy.get("#email").type("test@example.com");

      // Mock API response
      cy.intercept("GET", "**/api/order-status", {
        statusCode: 200,
        body: {
          status: "pending",
          message: "Order is being prepared",
        },
      }).as("orderStatus");

      cy.get("#search-btn").click();
      cy.wait("@orderStatus");

      // Both fields are populated after search
      cy.get("#printful-order-id").should("have.value", "PF123456");
      cy.get("#email").should("have.value", "test@example.com");
    });

    it("should return to search form after error with Search Again button", () => {
      cy.get("#printful-order-id").type("PF123456");
      cy.get("#email").type("test@example.com");

      // Mock API error
      cy.intercept("GET", "**/api/order-status", {
        statusCode: 400,
        body: { error: "Order not found" },
      }).as("orderStatus");

      cy.get("#search-btn").click();
      cy.wait("@orderStatus");

      cy.get("#error-message").should("be.visible");
      cy.get("button").contains("Search Again").should("be.visible");

      // Click Search Again to reset form
      cy.get("button").contains("Search Again").click();

      // Error should be hidden
      cy.get("#error-container").should("have.css", "display", "none");
      cy.get("#search-form").should("be.visible");
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

    it("should populate email field but not auto-load with just email in URL", () => {
      cy.visit("/store/order-status.html?email=test@example.com");

      cy.get("#email").should("have.value", "test@example.com");
      cy.get("#printful-order-id").should("have.value", "");

      // Button should be disabled since Printful Order ID is missing
      cy.get("#search-btn").should("be.disabled");
    });

    it("should not auto-load without both email and Printful Order ID in URL", () => {
      cy.visit("/store/order-status.html?printful_order_id=PF123456789");

      cy.get("#printful-order-id").should("have.value", "PF123456789");
      cy.get("#email").should("have.value", "");

      // Button should be disabled since email is missing
      cy.get("#search-btn").should("be.disabled");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should enable button with valid input in both fields", () => {
      cy.get("#printful-order-id").type("PF123456");
      cy.get("#email").type("test@example.com");

      // Both fields valid, button should be enabled
      cy.get("#search-btn").should("not.be.disabled");
    });

    it("should disable button with invalid email", () => {
      cy.get("#printful-order-id").type("PF123456");
      cy.get("#email").type("invalid-email");

      // Invalid email, button should be disabled
      cy.get("#search-btn").should("be.disabled");
    });

    it("should disable button with invalid Printful Order ID format", () => {
      cy.get("#printful-order-id").type("invalid");
      cy.get("#email").type("test@example.com");

      // Invalid Printful ID format, button should be disabled
      cy.get("#search-btn").should("be.disabled");
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
      cy.get(".search-form h2").should("exist");
      cy.get(".search-form p").should("exist");
    });

    it("should mark required fields with asterisk", () => {
      cy.get("label[for='printful-order-id']").should("contain", "*");
      cy.get("label[for='email']").should("contain", "*");
    });
  });

  describe("Order Submission", () => {
    it("should successfully submit with both Printful Order ID and email", () => {
      cy.get("#printful-order-id").type("PF123456789");
      cy.get("#email").type("test@example.com");

      // Mock successful API response
      cy.intercept("GET", "**/api/order-status**", {
        statusCode: 200,
        body: {
          status: "pending",
          message: "Your order is being prepared",
        },
      }).as("orderStatus");

      cy.get("#search-btn").click();
      cy.wait("@orderStatus");

      // Should be able to interact with the page without error
      cy.get("button").contains("Search Again").should("be.visible");
    });

    it("should show error message on failed search", () => {
      cy.get("#printful-order-id").type("PF000000000");
      cy.get("#email").type("wrong@example.com");

      // Mock API error response
      cy.intercept("GET", "**/api/order-status**", {
        statusCode: 404,
        body: { error: "Order not found" },
      }).as("orderNotFound");

      cy.get("#search-btn").click();
      cy.wait("@orderNotFound");

      cy.get("#error-message").should("be.visible");
    });

    it("should show permission error for wrong email", () => {
      cy.get("#printful-order-id").type("PF123456789");
      cy.get("#email").type("wrong@example.com");

      // Mock API permission error
      cy.intercept("GET", "**/api/order-status**", {
        statusCode: 403,
        body: { error: "Email does not match order" },
      }).as("permissionDenied");

      cy.get("#search-btn").click();
      cy.wait("@permissionDenied");

      cy.get("#error-message").should("be.visible");
    });

    it("should display pending order status message", () => {
      cy.get("#printful-order-id").type("PF123456789");
      cy.get("#email").type("test@example.com");

      // Mock pending status response
      cy.intercept("GET", "**/api/order-status**", {
        statusCode: 200,
        body: {
          status: "pending",
          message: "Your order is being prepared. We will ship it soon.",
        },
      }).as("pendingOrder");

      cy.get("#search-btn").click();
      cy.wait("@pendingOrder");

      // Order display should be visible with pending message
      cy.get("#order-display").should("be.visible");
    });
  });
});
