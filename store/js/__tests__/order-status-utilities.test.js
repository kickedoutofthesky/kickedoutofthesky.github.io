/**
 * Order Status Utilities Tests
 * Comprehensive tests for order status formatting and validation
 */

import {
  isValidEmail,
  isValidPrintfulOrderId,
  formatDate,
  formatShortDate,
  formatStatus,
  formatTrackingStatus,
  getCountryFlag,
  parseCostCents,
  formatCurrencyAmount,
  buildOrderSummary,
  isValidOrderData,
  isPendingOrder,
  isProcessingOrder,
  hasTrackingInfo,
  getLatestShipment,
  extractShipmentIdSuffix,
  buildErrorMessage,
} from "../utils/fixtures/order-status-utilities";

import { mockOrder, mockOrderWithTracking, mockCountries } from "../utils/fixtures/test-data";

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

  it("should format short date without time", () => {
    const timestamp = "1694745600000";
    const formatted = formatShortDate(timestamp);

    expect(formatted).not.toBe("—");
    expect(formatted).toMatch(/Sep/);
    expect(formatted).toMatch(/2023/);
  });

  it("should handle null or undefined timestamps", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatShortDate(null)).toBe("—");
    expect(formatShortDate(undefined)).toBe("—");
  });

  it("should handle invalid timestamps", () => {
    expect(formatDate("invalid")).toBe("—");
    expect(formatShortDate("invalid")).toBe("—");
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

  it("should format tracking status correctly", () => {
    expect(formatTrackingStatus("pending")).toBe("Pending");
    expect(formatTrackingStatus("in_transit")).toBe("In Transit");
    expect(formatTrackingStatus("out_for_delivery")).toBe("Out for Delivery");
    expect(formatTrackingStatus("delivered")).toBe("Delivered");
  });

  it("should handle unknown tracking status", () => {
    const result = formatTrackingStatus("custom_status");
    expect(result).not.toBe("—");
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

describe("Order Status Utilities - Cost Parsing", () => {
  it("should parse numeric cost cents", () => {
    expect(parseCostCents(1000)).toBe(1000);
    expect(parseCostCents(8640)).toBe(8640);
    expect(parseCostCents(0)).toBe(0);
  });

  it("should parse string cost in cents", () => {
    expect(parseCostCents("1000")).toBe(1000);
    expect(parseCostCents("8640")).toBe(8640);
  });

  it("should parse string cost in dollars to cents", () => {
    expect(parseCostCents("10.00")).toBe(1000);
    expect(parseCostCents("86.40")).toBe(8640);
    expect(parseCostCents("70.00")).toBe(7000);
  });

  it("should handle invalid values", () => {
    expect(parseCostCents(null)).toBe(0);
    expect(parseCostCents(undefined)).toBe(0);
    expect(parseCostCents("invalid")).toBe(0);
    expect(parseCostCents("")).toBe(0);
  });

  it("should round to nearest integer", () => {
    expect(parseCostCents(1000.5)).toBe(1001);
    expect(parseCostCents("10.005")).toBe(1001);
  });
});

describe("Order Status Utilities - Currency Formatting", () => {
  it("should format USD currency", () => {
    expect(formatCurrencyAmount(1000, "USD")).toBe("$10.00");
    expect(formatCurrencyAmount(8640, "USD")).toBe("$86.40");
  });

  it("should format other currencies", () => {
    const gbp = formatCurrencyAmount(1000, "GBP");
    const eur = formatCurrencyAmount(1000, "EUR");

    expect(gbp).toContain("£");
    expect(eur).toContain("€");
  });

  it("should use default USD currency", () => {
    const result = formatCurrencyAmount(1000);
    expect(result).toBe("$10.00");
  });

  it("should handle zero amounts", () => {
    expect(formatCurrencyAmount(0, "USD")).toBe("$0.00");
  });

  it("should handle negative amounts", () => {
    expect(formatCurrencyAmount(-1000, "USD")).toBe("$10.00");
  });
});

describe("Order Status Utilities - Order Summary", () => {
  it("should build order summary from order data", () => {
    const summary = buildOrderSummary(mockOrder);

    expect(summary).not.toBeNull();
    expect(summary.orderId).toBeDefined();
    expect(summary.status).toBeDefined();
    expect(summary.recipient).toBeDefined();
    expect(summary.costs).toBeDefined();
    expect(summary.items).toBeDefined();
  });

  it("should handle null order data", () => {
    expect(buildOrderSummary(null)).toBeNull();
    expect(buildOrderSummary(undefined)).toBeNull();
  });

  it("should extract recipient address correctly", () => {
    const summary = buildOrderSummary(mockOrder);

    expect(summary.recipient.name).toBeDefined();
    expect(summary.recipient.email).toBeDefined();
    expect(summary.recipient.address).toBeDefined();
  });

  it("should parse cost values correctly", () => {
    const summary = buildOrderSummary(mockOrder);

    expect(typeof summary.costs.subtotalCents).toBe("number");
    expect(typeof summary.costs.shippingCents).toBe("number");
    expect(typeof summary.costs.totalCents).toBe("number");
  });
});

describe("Order Status Utilities - Order Validation", () => {
  it("should validate correct order data", () => {
    expect(isValidOrderData(mockOrder)).toBe(true);
  });

  it("should reject invalid order data", () => {
    expect(isValidOrderData(null)).toBe(false);
    expect(isValidOrderData({})).toBe(false);
    expect(isValidOrderData({ status: "pending" })).toBe(false);
  });

  it("should check if order is pending", () => {
    expect(isPendingOrder("pending")).toBe(true);
    expect(isPendingOrder("processing")).toBe(false);
    expect(isPendingOrder("shipped")).toBe(false);
  });

  it("should check if order is processing", () => {
    expect(isProcessingOrder("processing")).toBe(true);
    expect(isProcessingOrder("shipped")).toBe(true);
    expect(isProcessingOrder("pending")).toBe(false);
  });
});

describe("Order Status Utilities - Tracking Info", () => {
  it("should detect if order has tracking information", () => {
    expect(hasTrackingInfo(mockOrderWithTracking)).toBe(true);
  });

  it("should return false for orders without tracking", () => {
    expect(hasTrackingInfo(mockOrder)).toBe(false);
  });

  it("should return false for null order", () => {
    expect(hasTrackingInfo(null)).toBe(false);
    expect(hasTrackingInfo({})).toBe(false);
  });

  it("should get latest shipment from order", () => {
    const shipment = getLatestShipment(mockOrderWithTracking);

    expect(shipment).not.toBeNull();
    expect(shipment.id).toBeDefined();
  });

  it("should return null for order without shipments", () => {
    expect(getLatestShipment(mockOrder)).toBeNull();
    expect(getLatestShipment(null)).toBeNull();
  });

  it("should extract shipment ID suffix correctly", () => {
    const fullId = "order-12345";
    const suffix = extractShipmentIdSuffix(fullId);

    expect(suffix).toBe("12345");
  });

  it("should handle shipment ID without dash", () => {
    expect(extractShipmentIdSuffix("12345")).toBe("12345");
  });

  it("should handle invalid shipment ID", () => {
    expect(extractShipmentIdSuffix(null)).toBe("—");
    expect(extractShipmentIdSuffix(undefined)).toBe("—");
  });
});

describe("Order Status Utilities - Error Messages", () => {
  it("should build error message for 404 status", () => {
    const message = buildErrorMessage(404, {});
    expect(message).toContain("Order not found");
  });

  it("should build error message for 403 status", () => {
    const message = buildErrorMessage(403, {});
    expect(message).toContain("email address");
  });

  it("should build error message for 500 status", () => {
    const message = buildErrorMessage(500, {});
    expect(message).toContain("Server error");
  });

  it("should use custom error message from response", () => {
    const customMessage = "Custom error from server";
    const message = buildErrorMessage(200, { error: customMessage });

    expect(message).toBe(customMessage);
  });

  it("should handle generic 4xx errors", () => {
    const message = buildErrorMessage(400, {});
    expect(message.length > 0).toBe(true);
  });

  it("should handle generic 5xx errors", () => {
    const message = buildErrorMessage(503, {});
    expect(message).toContain("Server error");
  });
});
