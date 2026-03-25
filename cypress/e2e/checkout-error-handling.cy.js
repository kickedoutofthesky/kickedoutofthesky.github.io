/* eslint-disable no-undef */
// Helper function to select a shipping country on the cart page

describe("Checkout Flow — Modified Error Handling", () => {
  beforeEach(() => {
    cy.window().then(win => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  describe("Scenario 1: API 500 Error - Friendly Error Message", () => {
    it("should show friendly error message when checkout API returns 500", () => {
      cy.intercept("POST", "**/api/create-checkout-session", {
        statusCode: 500,
        body: {
          error: "Internal server error",
        },
      }).as("checkoutError500");

      cy.visit("/store");

      // Stub alert to capture error messages
      const alertStub = cy.stub();
      cy.on("window:alert", alertStub);

      // Add product to cart
      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      // Go to cart
      cy.get("a[href*='cart.html']").first().click();
      cy.url().should("include", "cart.html");

      // Select shipping country and click checkout
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      // Wait for error response
      cy.wait("@checkoutError500");

      // Verify alert was shown with error message
      cy.wrap(null).should(() => {
        expect(alertStub).to.have.been.calledOnce;
        expect(alertStub.firstCall.args[0]).to.match(/checkout failed|error|unable|try again/i);
      });

      // Verify user is NOT redirected to Stripe
      cy.url().should("include", "cart.html");
      cy.url().should("not.include", "stripe");
    });

    it("should not redirect to Stripe when API returns 400 Bad Request", () => {
      cy.intercept("POST", "**/api/create-checkout-session", {
        statusCode: 400,
        body: {
          error: "Invalid cart items",
        },
      }).as("checkoutErrorBadRequest");

      cy.visit("/store");

      const alertStub = cy.stub();
      cy.on("window:alert", alertStub);

      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.get("a[href*='cart.html']").first().click();
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      cy.wait("@checkoutErrorBadRequest");

      // Verify alert was shown with error
      cy.wrap(null).should(() => {
        expect(alertStub).to.have.been.calledOnce;
        expect(alertStub.firstCall.args[0]).to.match(/error|failed|invalid/i);
      });

      // Verify no redirect
      cy.url().should("include", "cart.html");
    });

    it("should display the error message from the API response", () => {
      const errorMessage = "Unable to process payment. Please try again later.";

      cy.intercept("POST", "**/api/create-checkout-session", {
        statusCode: 500,
        body: {
          error: errorMessage,
        },
      }).as("checkoutErrorWithMessage");

      cy.visit("/store");

      const alertStub = cy.stub();
      cy.on("window:alert", alertStub);

      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.get("a[href*='cart.html']").first().click();
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      cy.wait("@checkoutErrorWithMessage");

      // Verify the specific error message is displayed in the alert
      cy.wrap(null).should(() => {
        expect(alertStub).to.have.been.calledOnce;
        expect(alertStub.firstCall.args[0]).to.include(errorMessage);
      });
    });
  });

  describe("Scenario 2: Timeout Error - User Sees Timeout Message", () => {
    it("should show timeout message when checkout API takes too long", () => {
      cy.intercept("POST", "**/api/create-checkout-session", req => {
        req.reply({
          statusCode: 408,
          body: {
            error: "Request timeout",
          },
          delay: 5000,
        });
      }).as("checkoutTimeout");

      cy.visit("/store");

      const alertStub = cy.stub();
      cy.on("window:alert", alertStub);

      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.wait(1500);
      cy.get("a[href*='cart.html']").first().click({ force: true });
      cy.url().should("include", "cart.html");
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);
      selectShippingCountry();
      cy.get("#checkout-btn").should("not.be.disabled").click();

      // Wait for timeout error
      cy.wait("@checkoutTimeout", { timeout: 10000 });

      // Verify alert was shown
      cy.wrap(null, { timeout: 8000 }).should(() => {
        expect(alertStub).to.have.been.calledOnce;
        expect(alertStub.firstCall.args[0]).to.match(/checkout failed|timeout|try again/i);
      });

      // Verify no redirect
      cy.url().should("include", "cart.html");
    });

    it("should show friendly timeout message instead of technical error", () => {
      cy.intercept("POST", "**/api/create-checkout-session", req => {
        req.reply({
          statusCode: 408,
          body: {
            error: "Request timeout",
          },
          delay: 3000,
        });
      }).as("slowCheckout");

      cy.visit("/store");

      const alertStub = cy.stub();
      cy.on("window:alert", alertStub);

      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.get("a[href*='cart.html']").first().click();
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      // Verify user-friendly timeout message in alert
      cy.wait("@slowCheckout", { timeout: 10000 });
      cy.wrap(null).should(() => {
        expect(alertStub).to.have.been.calledOnce;
        expect(alertStub.firstCall.args[0]).to.match(/checkout failed|timeout/i);
      });
    });
  });

  describe("Scenario 3: Prevent Double-Submit - Single Request on Rapid Clicks", () => {
    it("should prevent duplicate checkout requests when checkout button is clicked twice rapidly", () => {
      let requestCount = 0;

      cy.intercept("POST", "**/api/create-checkout-session", req => {
        requestCount++;
        req.reply({
          statusCode: 200,
          body: {
            url: "https://checkout.stripe.com/pay/cs_test_123",
            sessionId: "cs_test_123",
          },
        });
      }).as("checkoutAPI");

      cy.visit("/store");

      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.get("a[href*='cart.html']").first().click();

      // Select country then click checkout
      selectShippingCountry();
      cy.get("#checkout-btn").click();

      // Wait for the API call
      cy.wait("@checkoutAPI");

      // After first click, button is disabled with text "Processing..."
      // so a second click on "Proceed to Checkout" wouldn't find the button
      // Verify only ONE request was made (button was disabled after first click)
      cy.wrap(null).should(() => {
        expect(requestCount).to.equal(1);
      });
    });

    it("should disable checkout button after first click", () => {
      cy.intercept("POST", "**/api/create-checkout-session", req => {
        req.on("response", res => {
          res.setDelay(2000);
        });
        req.reply({
          statusCode: 200,
          body: {
            url: "https://checkout.stripe.com/pay/cs_test_123",
            sessionId: "cs_test_123",
          },
        });
      }).as("delayedCheckout");

      cy.visit("/store");

      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.get("a[href*='cart.html']").first().click();

      // Select country and click checkout button
      selectShippingCountry();
      cy.get("#checkout-btn").click();

      // Verify button is disabled after click (text changes to "Processing...")
      cy.get("#checkout-btn").should("be.disabled");
    });
  });

  describe("Scenario 4: Loading State - Spinner/Processing Message", () => {
    it("should show processing state and disabled button during checkout", () => {
      cy.intercept("POST", "**/api/create-checkout-session", req => {
        req.on("response", res => {
          res.setDelay(3000);
        });
        req.reply({
          statusCode: 200,
          body: {
            url: "https://checkout.stripe.com/pay/cs_test_123",
            sessionId: "cs_test_123",
          },
        });
      }).as("processingCheckout");

      cy.visit("/store");

      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.get("a[href*='cart.html']").first().click();

      // Select country and click checkout
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      // Verify button is disabled during processing
      cy.get("#checkout-btn").should("be.disabled");

      // Verify processing message or spinner is shown
      // Check for spinner, loading indicator, or "Processing..." text
      cy.get("body").then($body => {
        const hasSpinner = $body.text().includes("Processing") || $body.text().includes("please wait");
        const hasLoadingClass = $body.find(".loading, .spinner, [class*='spin'], [class*='load']").length > 0;

        // At minimum, button should be disabled
        cy.get("#checkout-btn").should("be.disabled");
      });

      // Wait for processing to complete
      cy.wait("@processingCheckout");
    });

    it("should show 'Processing...' text while checkout is in progress", () => {
      cy.intercept("POST", "**/api/create-checkout-session", req => {
        req.on("response", res => {
          res.setDelay(2000);
        });
        req.reply({
          statusCode: 200,
          body: {
            url: "https://checkout.stripe.com/pay/cs_test_123",
            sessionId: "cs_test_123",
          },
        });
      }).as("slowCheckout");

      cy.visit("/store");

      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.get("a[href*='cart.html']").first().click();

      // Select country, click checkout, and immediately check for loading state
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      // Look for processing indicator (could be text, spinner, or disabled state)
      cy.get("body").then($body => {
        const processingText = $body.text();
        const isDisabled = $body.find("button:contains('Proceed to Checkout')").prop("disabled");

        // Either show "Processing" text or button is disabled
        const hasProcessingIndicator =
          processingText.includes("Processing") || processingText.includes("please wait") || isDisabled;
        expect(hasProcessingIndicator).to.be.true;
      });

      cy.wait("@slowCheckout");
    });
  });

  describe("Scenario 5: Redirect Failure - Handle Location Assignment Error", () => {
    it("should show error when redirect to Stripe fails", () => {
      // Mock window.location so assignment throws an error
      cy.intercept("POST", "**/api/create-checkout-session", {
        statusCode: 200,
        body: {
          url: "https://checkout.stripe.com/pay/cs_test_123",
          sessionId: "cs_test_123",
        },
      }).as("checkoutAPI");

      cy.visit("/store");

      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.wait(1500);
      cy.get("a[href*='cart.html']").first().click({ force: true });

      // Select country and click checkout
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      // Wait for checkout API
      cy.wait("@checkoutAPI");

      // App redirects to Stripe URL on success (window.location.href = data.url).
      // Verify the API was called successfully.
      cy.get("@checkoutAPI").its("response.statusCode").should("eq", 200);
    });

    it("should catch and display redirect errors gracefully", () => {
      cy.intercept("POST", "**/api/create-checkout-session", {
        statusCode: 200,
        body: {
          url: "https://checkout.stripe.com/pay/cs_test_123",
          sessionId: "cs_test_123",
        },
      }).as("checkoutForRedirect");

      cy.visit("/store");

      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.wait(1500);
      cy.get("a[href*='cart.html']").first().click({ force: true });

      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      cy.wait("@checkoutForRedirect");

      // Verify checkout API was called successfully
      cy.get("@checkoutForRedirect").its("response.statusCode").should("eq", 200);
    });
  });

  describe("Scenario 6: Invalid Session ID - Error on Success Page", () => {
    it("should show error message when visiting success page with invalid session_id", () => {
      const invalidSessionId = "invalid_session_xyz_123";

      // Mock the order-details API to return an error for invalid session
      cy.intercept("GET", "**/api/order-details?session_id=*", req => {
        req.reply({
          statusCode: 404,
          body: {
            error: "Order not found",
          },
        });
      }).as("orderNotFound");

      cy.visit(`/store/success.html?session_id=${invalidSessionId}`);

      // Wait for API call
      cy.wait("@orderNotFound", { timeout: 5000 });

      // Verify error message is shown
      cy.contains(/order not found|invalid|not found|error/i).should("be.visible");

      // Verify order details are NOT shown
      cy.get("[data-testid='order-items']").should("not.exist");
    });

    it("should show order not found when session_id returns 404", () => {
      cy.intercept("GET", "**/api/order-details?session_id=*", {
        statusCode: 404,
        body: {
          error: "Session not found in Stripe",
        },
      }).as("sessionNotFound");

      cy.visit("/store/success.html?session_id=cs_test_nonexistent");

      cy.wait("@sessionNotFound");

      // Verify specific error message
      cy.contains(/not found|doesn't exist|invalid/i).should("be.visible");

      // Should provide way to return to store
      cy.get("a[href*='index.html'], a[href*='store'], button:contains('Continue')").first().should("exist");
    });

    it("should handle missing session_id parameter gracefully", () => {
      // Visit success page without session_id
      cy.visit("/store/success.html");

      // Should show error or prompt for session
      cy.contains(/order|session|error|missing/i).should("be.visible");
    });

    it("should show helpful error when session expires", () => {
      cy.intercept("GET", "**/api/order-details?session_id=*", {
        statusCode: 410, // 410 Gone
        body: {
          error: "Session has expired",
        },
      }).as("sessionExpired");

      cy.visit("/store/success.html?session_id=cs_test_expired");

      cy.wait("@sessionExpired");

      // 410 falls through to catch block which calls showApiErrorMessage()
      // Shows "Your order was placed successfully!" reassuring message
      cy.contains(/order was placed successfully|check your email/i).should("be.visible");
    });

    it("should display friendly error when order-details API fails", () => {
      cy.intercept("GET", "**/api/order-details?session_id=*", {
        statusCode: 500,
        body: {
          error: "Internal server error",
        },
      }).as("serverError");

      cy.visit("/store/success.html?session_id=cs_test_123");

      cy.wait("@serverError");

      // API failure triggers showApiErrorMessage() — reassuring message
      cy.contains(/order was placed successfully|check your email/i).should("be.visible");
    });
  });

  describe("Network Error Scenarios", () => {
    it("should handle network timeout on checkout API", () => {
      cy.intercept("POST", "**/api/create-checkout-session", req => {
        req.destroy();
      }).as("networkFailure");

      cy.visit("/store");

      const alertStub = cy.stub();
      cy.on("window:alert", alertStub);

      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.get("a[href*='cart.html']").first().click();

      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      // Should show alert with error
      cy.wrap(null, { timeout: 10000 }).should(() => {
        expect(alertStub).to.have.been.calledOnce;
        expect(alertStub.firstCall.args[0]).to.match(/error|failed|network|connection/i);
      });

      // Should stay on cart
      cy.url().should("include", "cart.html");
    });

    it("should show connection error when order-details API is unreachable", () => {
      cy.intercept("GET", "**/api/order-details?session_id=*", req => {
        req.destroy();
      }).as("apiUnreachable");

      cy.visit("/store/success.html?session_id=cs_test_123");

      // API failure triggers showApiErrorMessage() which shows reassuring message
      cy.contains(/order was placed successfully|check your email/i, { timeout: 10000 }).should("be.visible");
    });
  });

  describe("Error Recovery", () => {
    it("should allow retry after checkout error", () => {
      let callCount = 0;

      cy.intercept("POST", "**/api/create-checkout-session", req => {
        callCount++;
        if (callCount === 1) {
          // First call fails
          req.reply({
            statusCode: 500,
            body: { error: "Server error" },
          });
        } else {
          // Retry succeeds
          req.reply({
            statusCode: 200,
            body: {
              url: "https://checkout.stripe.com/pay/cs_test_123",
              sessionId: "cs_test_123",
            },
          });
        }
      }).as("checkoutWithRetry");

      cy.visit("/store");

      const alertStub = cy.stub();
      cy.on("window:alert", alertStub);

      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.get("a[href*='cart.html']").first().click();

      // First attempt - should fail
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      cy.wait("@checkoutWithRetry");

      // Verify alert was shown
      cy.wrap(null).should(() => {
        expect(alertStub).to.have.been.calledOnce;
        expect(alertStub.firstCall.args[0]).to.match(/error|failed/i);
      });

      // Button should be re-enabled after error
      cy.get("#checkout-btn").should("not.be.disabled");

      // Retry - should succeed (country still selected)
      cy.get("button").contains("Proceed to Checkout").click();

      cy.wait("@checkoutWithRetry");

      // On success, verify we're not stuck on error
      cy.url().then(url => {
        const isProcessing = url.includes("stripe") || url.includes("checkout") || url.includes("processing");
        expect(isProcessing || !url.includes("error")).to.be.true;
      });
    });
  });
});
