/**
 * Cart Display - Exported Functions Tests
 * Tests exported utility functions: getProductImage, debounce, generateCSRFToken, getCSRFToken
 */

import { getProductImage, debounce, generateCSRFToken, getCSRFToken } from "../cart-display";

describe("Cart Display - Exported Functions", () => {
  describe("getProductImage", () => {
    it("should return product image URL from variant", () => {
      const product = {
        image: "/store/assets/images/shirt-default.jpg",
        variants: {
          Black: {
            image: "/store/assets/images/shirt-black.jpg",
          },
        },
      };

      const result = getProductImage(product, "Black");
      expect(result).toBe("/store/assets/images/shirt-black.jpg");
    });

    it("should return fallback product image when color not found", () => {
      const product = {
        image: "/store/assets/images/shirt-default.jpg",
        variants: {
          Black: {
            image: "/store/assets/images/shirt-black.jpg",
          },
        },
      };

      const result = getProductImage(product, "Red");
      expect(result).toBe("/store/assets/images/shirt-default.jpg");
    });

    it("should handle product without variants", () => {
      const product = {
        image: "/store/assets/images/shirt-default.jpg",
      };

      const result = getProductImage(product, "Black");
      expect(result).toBe("/store/assets/images/shirt-default.jpg");
    });

    it("should throw error for null product", () => {
      expect(() => {
        getProductImage(null, "Black");
      }).toThrow();
    });

    it("should handle null color", () => {
      const product = {
        image: "/store/assets/images/shirt-default.jpg",
        variants: {
          Black: {
            image: "/store/assets/images/shirt-black.jpg",
          },
        },
      };

      const result = getProductImage(product, null);
      expect(result).toBe("/store/assets/images/shirt-default.jpg");
    });

    it("should return image from multiple color variants", () => {
      const product = {
        image: "/store/assets/images/default.jpg",
        variants: {
          Black: { image: "/black.jpg" },
          White: { image: "/white.jpg" },
          Red: { image: "/red.jpg" },
        },
      };

      expect(getProductImage(product, "Black")).toBe("/black.jpg");
      expect(getProductImage(product, "White")).toBe("/white.jpg");
      expect(getProductImage(product, "Red")).toBe("/red.jpg");
    });

    it("should prioritize variant image over product image", () => {
      const product = {
        image: "/default.jpg",
        variants: {
          Black: {
            image: "/black.jpg",
          },
        },
      };

      const result = getProductImage(product, "Black");
      expect(result).toBe("/black.jpg");
      expect(result).not.toBe("/default.jpg");
    });
  });

  describe("debounce", () => {
    it("should return a function", () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);
      expect(typeof debouncedFn).toBe("function");
    });

    it("should delay function execution", async () => {
      jest.useFakeTimers();
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn("test");

      // Function should not be called immediately
      expect(mockFn).not.toHaveBeenCalled();

      // Advance time by less than delay
      jest.advanceTimersByTime(100);
      expect(mockFn).not.toHaveBeenCalled();

      // Advance time past delay
      jest.advanceTimersByTime(250);
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it("should pass arguments to debounced function", async () => {
      jest.useFakeTimers();
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn("arg1", 42, { key: "value" });

      jest.advanceTimersByTime(300);
      expect(mockFn).toHaveBeenCalledWith("arg1", 42, { key: "value" });

      jest.useRealTimers();
    });

    it("should handle rapid successive calls", async () => {
      jest.useFakeTimers();
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 300);

      // Make three calls in quick succession
      debouncedFn(1);
      jest.advanceTimersByTime(100);
      debouncedFn(2);
      jest.advanceTimersByTime(100);
      debouncedFn(3);

      // Should still be waiting
      expect(mockFn).not.toHaveBeenCalled();

      // Complete the delay from last call
      jest.advanceTimersByTime(300);

      // Should only call once with the last value
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith(3);

      jest.useRealTimers();
    });

    it("should work with zero delay", async () => {
      jest.useFakeTimers();
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 0);

      debouncedFn("test");

      jest.advanceTimersByTime(0);
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe("generateCSRFToken", () => {
    it("should generate a token string", () => {
      const token = generateCSRFToken();
      expect(typeof token).toBe("string");
    });

    it("should generate tokens of reasonable length", () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      // Both should be strings with substantial length
      expect(typeof token1).toBe("string");
      expect(typeof token2).toBe("string");
      expect(token1.length).toBeGreaterThanOrEqual(20);
      expect(token2.length).toBeGreaterThanOrEqual(20);
    });

    it("should generate unique tokens", () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateCSRFToken());
      }
      expect(tokens.size).toBe(100);
    });

    it("should contain valid characters", () => {
      const token = generateCSRFToken();
      // Tokens are base64-encoded or hex-encoded
      expect(/^[a-fA-F0-9]+$/.test(token) || /^[a-zA-Z0-9+/]+={0,2}$/.test(token)).toBe(true);
    });

    it("should have reasonable length for security", () => {
      const token = generateCSRFToken();
      // CSRF tokens should be at least 16 bytes when encoded
      expect(token.length).toBeGreaterThanOrEqual(20);
    });
  });

  describe("getCSRFToken", () => {
    beforeEach(() => {
      // Clear sessionStorage
      sessionStorage.clear();
    });

    it("should retrieve token from session storage", () => {
      const token = "test-token-12345";
      sessionStorage.setItem("csrf_token", token);

      const result = getCSRFToken();
      expect(result).toBe(token);
    });

    it("should generate and store new token if none exists", () => {
      sessionStorage.clear();
      const result = getCSRFToken();

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
      expect(sessionStorage.getItem("csrf_token")).toBe(result);
    });

    it("should return same token on multiple calls", () => {
      const token1 = getCSRFToken();
      const token2 = getCSRFToken();

      expect(token1).toBe(token2);
    });

    it("should handle missing sessionStorage gracefully", () => {
      const originalSessionStorage = global.sessionStorage;
      delete global.sessionStorage;

      const result = getCSRFToken();
      expect(typeof result).toBe("string");

      global.sessionStorage = originalSessionStorage;
    });

    it("should store token with correct key", () => {
      sessionStorage.clear();
      getCSRFToken();

      expect(sessionStorage.getItem("csrf_token")).toBeTruthy();
    });

    it("should work with pre-existing token", () => {
      const existingToken = "existing-token-xyz";
      sessionStorage.setItem("csrf_token", existingToken);

      const result = getCSRFToken();
      expect(result).toBe(existingToken);
    });
  });

  describe("Integration scenarios", () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    it("should get CSRF token and use in request", () => {
      const token = getCSRFToken();
      expect(token).toBeTruthy();

      // Simulate using token in request headers
      const headers = { "X-CSRF-Token": token };
      expect(headers["X-CSRF-Token"]).toBe(token);
    });

    it("should debounce product image fetching", () => {
      jest.useFakeTimers();
      const mockFetchImage = jest.fn();
      const debouncedFetch = debounce(mockFetchImage, 300);

      const product = { variants: { Black: { image: "/test.jpg" } } };

      // Simulate rapid calls
      debouncedFetch(product, { color: "Black" });
      debouncedFetch(product, { color: "Black" });
      debouncedFetch(product, { color: "Black" });

      expect(mockFetchImage).not.toHaveBeenCalled();

      jest.runAllTimers();
      expect(mockFetchImage).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });
});
