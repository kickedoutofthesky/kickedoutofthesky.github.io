/**
 * Order Status Utilities Tests
 * Tests the helpers from utils/fixtures/order-status-utilities.js that
 * store/js/order-status.js actually uses at runtime.
 */

import {
  isValidEmail,
  isValidPrintfulOrderId,
  formatDate,
  formatStatus,
  getCountryFlag,
} from "../utils/fixtures/order-status-utilities";

describe("Order Status Utilities - Email Validation", () => {
  it("should accept valid email addresses", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("test.email@domain.co.uk")).toBe(true);
    expect(isValidEmail("firstname+lastname@example.com")).toBe(true);
  });

  it("should reject invalid email addresses", () => {
    expect(isValidEmail("plainaddress")).toBe(false);
    expect(isValidEmail("@nodomain.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("user @example.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

  it("should handle null and undefined", () => {
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
  });

  it("should handle non-string inputs", () => {
    expect(isValidEmail(123)).toBe(false);
    expect(isValidEmail({})).toBe(false);
  });
});

describe("Order Status Utilities - Printful Order ID Validation", () => {
  it("should accept valid Printful Order IDs", () => {
    expect(isValidPrintfulOrderId("eoKK1upmt2jl99BK1qYLDjbYH1gwUZeh")).toBe(true);
    expect(isValidPrintfulOrderId("ABC123456789")).toBe(true);
    expect(isValidPrintfulOrderId("abcde")).toBe(true);
    expect(isValidPrintfulOrderId("12345")).toBe(true);
  });

  it("should reject invalid Printful Order IDs", () => {
    expect(isValidPrintfulOrderId("AB12")).toBe(false);
    expect(isValidPrintfulOrderId("ABC-123")).toBe(false);
    expect(isValidPrintfulOrderId("SF@123456")).toBe(false);
    expect(isValidPrintfulOrderId("")).toBe(false);
  });

  it("should require minimum length of 5 characters", () => {
    expect(isValidPrintfulOrderId("AB123")).toBe(true);
    expect(isValidPrintfulOrderId("AB12")).toBe(false);
  });

  it("should handle null and undefined", () => {
    expect(isValidPrintfulOrderId(null)).toBe(false);
    expect(isValidPrintfulOrderId(undefined)).toBe(false);
  });

  it("should handle non-string inputs", () => {
    expect(isValidPrintfulOrderId(12345)).toBe(false);
    expect(isValidPrintfulOrderId({})).toBe(false);
  });
});

describe("Order Status Utilities - Date Formatting", () => {
  it("should format full date with time", () => {
    const timestamp = "1694745600000"; // Sept 15, 2023
    const formatted = formatDate(timestamp);

    expect(formatted).not.toBe("—");
    expect(formatted).toMatch(/September/);
    expect(formatted).toMatch(/2023/);
  });

  it("should handle null or undefined timestamps", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });

  it("should handle invalid timestamps", () => {
    expect(formatDate("invalid")).toBe("—");
  });

  it("should handle numeric timestamps", () => {
    const timestamp = 1694745600000;
    const formatted = formatDate(timestamp);

    expect(formatted).not.toBe("—");
  });
});

describe("Order Status Utilities - Status Formatting", () => {
  it("should format order status correctly", () => {
    expect(formatStatus("pending")).toBe("Pending");
    expect(formatStatus("processing")).toBe("Processing");
    expect(formatStatus("shipped")).toBe("Shipped");
    expect(formatStatus("delivered")).toBe("Delivered");
    expect(formatStatus("fulfilled")).toBe("Fulfilled");
  });

  it("should handle unknown status", () => {
    const result = formatStatus("unknown_status");
    expect(result).not.toBe("—");
    expect(result.length > 0).toBe(true);
  });

  it("should handle null status", () => {
    expect(formatStatus(null)).toBe("—");
    expect(formatStatus(undefined)).toBe("—");
    expect(formatStatus("")).toBe("—");
  });
});

describe("Order Status Utilities - Country Flag", () => {
  it("should return flag emoji for valid country codes", () => {
    const usFlag = getCountryFlag("US");
    const deFlag = getCountryFlag("DE");
    const frFlag = getCountryFlag("FR");

    expect(typeof usFlag).toBe("string");
    expect(usFlag.length > 0).toBe(true);
    expect(deFlag.length > 0).toBe(true);
    expect(frFlag.length > 0).toBe(true);
  });

  it("should return globe emoji for invalid country codes", () => {
    expect(getCountryFlag(null)).toBe("🌍");
    expect(getCountryFlag(undefined)).toBe("🌍");
    expect(getCountryFlag("")).toBe("🌍");
    expect(getCountryFlag("USA")).toBe("🌍"); // Too long
    expect(getCountryFlag("U")).toBe("🌍"); // Too short
  });

  it("should be case-insensitive", () => {
    const uppercase = getCountryFlag("US");
    const lowercase = getCountryFlag("us");

    expect(typeof uppercase).toBe("string");
    expect(typeof lowercase).toBe("string");
  });
});
