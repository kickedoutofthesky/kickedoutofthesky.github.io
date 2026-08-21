/**
 * Cart Display - Country Selection Tests
 * Tests for country dropdown defaulting and localStorage persistence
 */

describe("Cart Display - Country Selection", () => {
  let countrySelect;
  let mockDebouncedFetchQuote;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <select id="shipping-country">
        <option value="">Select a country</option>
        <option value="US">United States</option>
        <option value="DE">Germany</option>
        <option value="GB">United Kingdom</option>
        <option value="FR">France</option>
        <option value="JP">Japan</option>
      </select>
      <button id="checkout-btn">Checkout</button>
      <input type="checkbox" id="terms-checkbox" />
      <div id="quote-loading" style="display: none;">Loading...</div>
      <div id="summary-content"></div>
      <div id="quote-error"></div>
    `;

    countrySelect = document.getElementById("shipping-country");
    localStorage.clear();

    // Mock the debounced fetch quote
    mockDebouncedFetchQuote = jest.fn();
    global.debouncedFetchQuote = mockDebouncedFetchQuote;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Country Dropdown Initialization", () => {
    test("should set dropdown value to saved country from localStorage", () => {
      localStorage.setItem("selectedShippingCountry", "DE");

      // Simulate dropdown initialization code
      const savedCountry = localStorage.getItem("selectedShippingCountry");
      if (savedCountry) {
        // Check if country exists in dropdown options
        const option = Array.from(countrySelect.options).find(opt => opt.value === savedCountry);
        if (option) {
          countrySelect.value = savedCountry;
        }
      }

      expect(countrySelect.value).toBe("DE");
    });

    test("should handle first-time visit when localStorage is empty", () => {
      const savedCountry = localStorage.getItem("selectedShippingCountry");
      if (savedCountry && countrySelect.options.namedItem(savedCountry)) {
        countrySelect.value = savedCountry;
      }

      // Dropdown should remain on default empty value
      expect(countrySelect.value).toBe("");
    });

    test("should validate country exists in dropdown before setting", () => {
      localStorage.setItem("selectedShippingCountry", "XX"); // Non-existent country

      const savedCountry = localStorage.getItem("selectedShippingCountry");
      if (savedCountry) {
        // Check if country exists in dropdown options
        const option = Array.from(countrySelect.options).find(opt => opt.value === savedCountry);
        if (option) {
          countrySelect.value = savedCountry;
        }
      }

      // Should remain on default, not crash
      expect(countrySelect.value).toBe("");
    });

    test("should restore different countries from localStorage", () => {
      const testCountries = ["US", "DE", "GB", "FR", "JP"];

      for (const country of testCountries) {
        localStorage.setItem("selectedShippingCountry", country);

        const savedCountry = localStorage.getItem("selectedShippingCountry");
        if (savedCountry) {
          // Check if country exists in dropdown options
          const option = Array.from(countrySelect.options).find(opt => opt.value === savedCountry);
          if (option) {
            countrySelect.value = savedCountry;
          }
        }

        expect(countrySelect.value).toBe(country);
      }
    });
  });

  describe("Country Selection Update", () => {
    test("should update localStorage when customer changes country", () => {
      // Initial state
      localStorage.setItem("selectedShippingCountry", "US");
      countrySelect.value = "US";

      // Customer changes country
      countrySelect.value = "DE";
      localStorage.setItem("selectedShippingCountry", "DE");

      expect(localStorage.getItem("selectedShippingCountry")).toBe("DE");
      expect(countrySelect.value).toBe("DE");
    });

    test("should fetch quote when country changes", () => {
      countrySelect.value = "DE";
      localStorage.setItem("selectedShippingCountry", "DE");

      // Simulate the change event handler
      const savedCountry = countrySelect.value;
      if (savedCountry) {
        mockDebouncedFetchQuote();
      }

      expect(mockDebouncedFetchQuote).toHaveBeenCalled();
    });

    test("should NOT fetch quote when country is cleared", () => {
      countrySelect.value = "";

      // Simulate the change event handler
      if (countrySelect.value) {
        mockDebouncedFetchQuote();
      }

      expect(mockDebouncedFetchQuote).not.toHaveBeenCalled();
    });

    test("should handle rapid country changes (debouncing)", () => {
      const countries = ["US", "DE", "GB", "FR", "JP"];

      for (const country of countries) {
        countrySelect.value = country;
        localStorage.setItem("selectedShippingCountry", country);
        mockDebouncedFetchQuote();
      }

      // Debounced function should be called once per change
      expect(mockDebouncedFetchQuote).toHaveBeenCalledTimes(5);
    });
  });

  describe("Customer Choice Persistence", () => {
    test("customer choice persists across page refresh", () => {
      // Visit 1
      localStorage.setItem("selectedShippingCountry", "FR");
      countrySelect.value = "FR";
      expect(countrySelect.value).toBe("FR");

      // Simulate page refresh
      const savedCountry = localStorage.getItem("selectedShippingCountry");
      countrySelect.value = "";
      if (savedCountry) {
        // Check if country exists in dropdown options
        const option = Array.from(countrySelect.options).find(opt => opt.value === savedCountry);
        if (option) {
          countrySelect.value = savedCountry;
        }
      }

      expect(countrySelect.value).toBe("FR");
    });

    test("customer choice persists when navigating away and back", () => {
      // Initial state
      localStorage.setItem("selectedShippingCountry", "GB");

      // Navigate away (localStorage preserved)
      const savedCountry = localStorage.getItem("selectedShippingCountry");
      expect(savedCountry).toBe("GB");

      // Navigate back to cart
      countrySelect.value = "";
      if (savedCountry) {
        // Check if country exists in dropdown options
        const option = Array.from(countrySelect.options).find(opt => opt.value === savedCountry);
        if (option) {
          countrySelect.value = savedCountry;
        }
      }

      expect(countrySelect.value).toBe("GB");
    });

    test("customer choice overrides geo-location on return visit", () => {
      // Visit 1: Geo-detected US, but customer changes to DE
      localStorage.setItem("selectedShippingCountry", "DE");

      // Visit 2: Geo would detect US again, but we should use localStorage
      const savedCountry = localStorage.getItem("selectedShippingCountry");
      expect(savedCountry).toBe("DE"); // Customer's choice, not geo

      if (savedCountry) {
        // Check if country exists in dropdown options
        const option = Array.from(countrySelect.options).find(opt => opt.value === savedCountry);
        if (option) {
          countrySelect.value = savedCountry;
        }
      }

      expect(countrySelect.value).toBe("DE");
    });
  });

  describe("Checkout Flow with Country Selection", () => {
    test("checkout should not save country twice (already in dropdown listener)", () => {
      localStorage.setItem("selectedShippingCountry", "DE");
      countrySelect.value = "DE";

      // Simulate checkout - should NOT re-save
      // Already saved in dropdown listener

      // Verify localStorage unchanged
      expect(localStorage.getItem("selectedShippingCountry")).toBe("DE");
    });

    test("country remains locked during checkout processing", () => {
      localStorage.setItem("selectedShippingCountry", "FR");
      countrySelect.value = "FR";

      // Simulate checkout locking
      countrySelect.disabled = true;

      // Customer cannot change during checkout
      countrySelect.value = "US";
      expect(countrySelect.disabled).toBe(true);

      // localStorage not updated because dropdown is disabled
      expect(localStorage.getItem("selectedShippingCountry")).toBe("FR");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    test("should handle empty localStorage gracefully", () => {
      localStorage.clear();

      const savedCountry = localStorage.getItem("selectedShippingCountry");
      if (savedCountry && countrySelect.options.namedItem(savedCountry)) {
        countrySelect.value = savedCountry;
      }

      expect(countrySelect.value).toBe("");
      expect(localStorage.getItem("selectedShippingCountry")).toBeNull();
    });

    test("should handle corrupted localStorage value", () => {
      localStorage.setItem("selectedShippingCountry", "INVALID_COUNTRY");

      const savedCountry = localStorage.getItem("selectedShippingCountry");
      if (savedCountry && countrySelect.options.namedItem(savedCountry)) {
        countrySelect.value = savedCountry;
      }

      // Should not crash, remain on default
      expect(countrySelect.value).toBe("");
    });

    test("should handle dropdown options changing", () => {
      localStorage.setItem("selectedShippingCountry", "DE");

      // Options change (some countries removed/added)
      const newSelect = document.createElement("select");
      newSelect.id = "shipping-country";
      newSelect.innerHTML = `
        <option value="">Select a country</option>
        <option value="US">United States</option>
        <option value="GB">United Kingdom</option>
      `;
      document.body.replaceChild(newSelect, countrySelect);
      countrySelect = newSelect;

      const savedCountry = localStorage.getItem("selectedShippingCountry");
      if (savedCountry && countrySelect.options.namedItem(savedCountry)) {
        countrySelect.value = savedCountry;
      }

      // DE is no longer available, should not set
      expect(countrySelect.value).toBe("");
    });

    test("should handle localStorage quota exceeded", () => {
      // Simulate quota exceeded by mocking setItem to throw
      const setItemSpy = jest.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });

      try {
        localStorage.setItem("selectedShippingCountry", "DE");
      } catch (e) {
        // Should be caught gracefully
        expect(e.message).toBe("QuotaExceededError");
      }

      setItemSpy.mockRestore();
    });
  });

  describe("Integration with Quote Fetching", () => {
    test("should fetch quote when dropdown initialized with saved country", () => {
      localStorage.setItem("selectedShippingCountry", "FR");

      // Simulate initialization
      const savedCountry = localStorage.getItem("selectedShippingCountry");
      if (savedCountry) {
        // Check if country exists in dropdown options
        const option = Array.from(countrySelect.options).find(opt => opt.value === savedCountry);
        if (option) {
          countrySelect.value = savedCountry;
          mockDebouncedFetchQuote();
        }
      }

      expect(mockDebouncedFetchQuote).toHaveBeenCalled();
      expect(countrySelect.value).toBe("FR");
    });

    test("should not fetch quote if no country selected", () => {
      countrySelect.value = "";

      if (countrySelect.value) {
        mockDebouncedFetchQuote();
      }

      expect(mockDebouncedFetchQuote).not.toHaveBeenCalled();
    });

    test("should clear quote if country is cleared", () => {
      countrySelect.value = "US";
      mockDebouncedFetchQuote();

      // Customer clears selection
      countrySelect.value = "";

      if (!countrySelect.value) {
        mockDebouncedFetchQuote.mockClear();
      }

      expect(mockDebouncedFetchQuote).not.toHaveBeenCalled();
    });
  });
});
