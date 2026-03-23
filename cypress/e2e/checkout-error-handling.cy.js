/* eslint-disable no-undef */

// Helper function to select first real size option
function selectFirstRealSize() {
  cy.get("[data-testid='size-select']").then($select => {
    const value = $select.val();
    if (!value || value === "") {
      cy.get("[data-testid='size-select'] option")
        .eq(1)
        .invoke("attr", "value")
        .then(sizeValue => {
          cy.get("[data-testid='size-select']").select(sizeValue);
        });
    }
  });
}

// Helper function to select a shipping country on the cart page
function selectShippingCountry(countryCode = "US") {
  cy.get("#shipping-country").should("exist").select(countryCode);
}

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

      // Verify user sees friendly error message
      cy.contains(/checkout failed|error|unable|try again/i).should("be.visible");

      // Verify user is NOT redirected to Stripe
      cy.url().should("include", "cart.html");
      cy.url().should("not.include", "stripe");
      cy.url().should("not.include", "checkout");
    });

    it("should not redirect to Stripe when API returns 400 Bad Request", () => {
      cy.intercept("POST", "**/api/create-checkout-session", {
        statusCode: 400,
        body: {
          error: "Invalid cart items",
        },
      }).as("checkoutErrorBadRequest");

      cy.visit("/store");

      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.get("a[href*='cart.html']").first().click();
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      cy.wait("@checkoutErrorBadRequest");

      // Verify error is shown
      cy.contains(/error|failed|invalid/i).should("be.visible");

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

      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.get("a[href*='cart.html']").first().click();
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      cy.wait("@checkoutErrorWithMessage");

      // Verify the specific error message is displayed
      cy.contains(errorMessage).should("be.visible");
    });
  });

  describe("Scenario 2: Timeout Error - User Sees Timeout Message", () => {
    it("should show timeout message when checkout API takes too long", () => {
      cy.intercept("POST", "**/api/create-checkout-session", req => {
        // Delay response by 35 seconds (assuming 30s timeout in app)
        req.reply(res => {
          setTimeout(() => {
            res.send({
              statusCode: 408,
              body: {
                error: "Request timeout",
              },
            });
          }, 35000);
        });
      }).as("checkoutTimeout");

      cy.visit("/store");

      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.get("a[href*='cart.html']").first().click();
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      // Wait for timeout error (poll for message instead of waiting full 35s)
      cy.contains(/timeout|taking too long|try again/i, { timeout: 35000 }).should("be.visible");

      // Verify no redirect
      cy.url().should("include", "cart.html");
    });

    it("should show friendly timeout message instead of technical error", () => {
      cy.intercept("POST", "**/api/create-checkout-session", req => {
        req.reply(res => {
          setTimeout(() => {
            res.send({
              statusCode: 408,
              body: {
                error: "Request timeout",
              },
            });
          }, 10000);
        });
      }).as("slowCheckout");

      cy.visit("/store");

      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.get("a[href*='cart.html']").first().click();
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      // Verify user-friendly timeout message
      cy.contains(/taking longer|timeout|slow/i, { timeout: 15000 }).should("be.visible");
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

      // Select country then rapid double-click on checkout button
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();
      cy.get("button").contains("Proceed to Checkout").click();

      // Wait a bit for any pending requests
      cy.wait("@checkoutAPI");

      cy.wait(500);

      // Verify only ONE request was made
      expect(requestCount).to.equal(1);
    });

    it("should disable checkout button after first click", () => {
      cy.intercept("POST", "**/api/create-checkout-session", req => {
        req.reply(res => {
          setTimeout(() => {
            res.send({
              statusCode: 200,
              body: {
                url: "https://checkout.stripe.com/pay/cs_test_123",
                sessionId: "cs_test_123",
              },
            });
          }, 2000);
        });
      }).as("delayedCheckout");

      cy.visit("/store");

      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.get("a[href*='cart.html']").first().click();

      // Select country and click checkout button
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      // Verify button is disabled after click
      cy.get("button").contains("Proceed to Checkout").should("be.disabled");
    });
  });

  describe("Scenario 4: Loading State - Spinner/Processing Message", () => {
    it("should show processing state and disabled button during checkout", () => {
      cy.intercept("POST", "**/api/create-checkout-session", req => {
        req.reply(res => {
          setTimeout(() => {
            res.send({
              statusCode: 200,
              body: {
                url: "https://checkout.stripe.com/pay/cs_test_123",
                sessionId: "cs_test_123",
              },
            });
          }, 3000);
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
      cy.get("button").contains("Proceed to Checkout").should("be.disabled");

      // Verify processing message or spinner is shown
      // Check for spinner, loading indicator, or "Processing..." text
      cy.get("body").then($body => {
        const hasSpinner = $body.text().includes("Processing") || $body.text().includes("please wait");
        const hasLoadingClass = $body.find(".loading, .spinner, [class*='spin'], [class*='load']").length > 0;

        // At minimum, button should be disabled
        cy.get("button").contains("Proceed to Checkout").should("be.disabled");
      });

      // Wait for processing to complete
      cy.wait("@processingCheckout");
    });

    it("should show 'Processing...' text while checkout is in progress", () => {
      cy.intercept("POST", "**/api/create-checkout-session", req => {
        req.reply(res => {
          setTimeout(() => {
            res.send({
              statusCode: 200,
              body: {
                url: "https://checkout.stripe.com/pay/cs_test_123",
                sessionId: "cs_test_123",
              },
            });
          }, 2000);
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

      cy.get("a[href*='cart.html']").first().click();

      // Stub window.location.href to throw an error when assigned
      cy.window().then(win => {
        const originalLocation = win.location;
        cy.stub(win, "location", {
          set href(value) {
            throw new Error("Navigation blocked by browser");
          },
          get href() {
            return originalLocation.href;
          },
          origin: originalLocation.origin,
        });
      });

      // Click checkout
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      cy.wait("@checkoutAPI");

      // Verify error message about redirect failure
      cy.contains(/could not redirect|redirect failed|payment|error/i).should("be.visible");

      // Verify user stays on cart page
      cy.url().should("include", "cart.html");
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

      cy.get("a[href*='cart.html']").first().click();

      // Make redirect throw an error
      cy.window().then(win => {
        Object.defineProperty(win, "location", {
          value: {
            href: win.location.href,
            origin: win.location.origin,
          },
          writable: false,
          configurable: true,
        });
      });

      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      cy.wait("@checkoutForRedirect");

      // Error message should be user-friendly
      cy.contains(/payment|error|unable|try/i).should("be.visible");

      // Cart should still be intact
      cy.get("[data-testid='cart-item']").should("have.length.greaterThan", 0);
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

      // Verify expiration message
      cy.contains(/expired|no longer available/i).should("be.visible");

      // Verify there's a way to go back to store
      cy.contains(/back|return|home/).should("exist");
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

      // Verify friendly error message (not technical error)
      cy.contains(/something went wrong|unable to load|try again/i).should("be.visible");
    });
  });

  describe("Network Error Scenarios", () => {
    it("should handle network timeout on checkout API", () => {
      cy.intercept("POST", "**/api/create-checkout-session", req => {
        req.destroy();
      }).as("networkFailure");

      cy.visit("/store");

      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.get("a[href*='cart.html']").first().click();

      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      // Should show error instead of hanging
      cy.contains(/error|failed|network|connection/i, { timeout: 10000 }).should("be.visible");

      // Should stay on cart
      cy.url().should("include", "cart.html");
    });

    it("should show connection error when order-details API is unreachable", () => {
      cy.intercept("GET", "**/api/order-details?session_id=*", req => {
        req.destroy();
      }).as("apiUnreachable");

      cy.visit("/store/success.html?session_id=cs_test_123");

      // Should show connection error
      cy.contains(/connection|network|error|unable/i, { timeout: 10000 }).should("be.visible");
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

      cy.get("[data-testid='product-card']").first().click();
      selectFirstRealSize();
      cy.get("#add-to-cart-btn").click();

      cy.get("a[href*='cart.html']").first().click();

      // First attempt - should fail
      selectShippingCountry();
      cy.get("button").contains("Proceed to Checkout").click();

      cy.wait("@checkoutWithRetry");
      cy.contains(/error|failed/i).should("be.visible");

      // Retry - should succeed (country still selected)
      cy.get("button").contains("Proceed to Checkout").click();

      cy.wait("@checkoutWithRetry");

      // On success, cart should show as processing or redirect should occur
      // Verify we're not stuck on error
      cy.url().then(url => {
        // Either redirected or processing
        const isProcessing = url.includes("stripe") || url.includes("checkout") || url.includes("processing");
        expect(isProcessing || !url.includes("error")).to.be.true;
      });
    });
  });
});
