// Success Page Tests
// Tests for order confirmation page functionality

describe("Success Page - Item Name Parsing", () => {
  function parseItemName(itemName) {
    // Example: "Unisex Tee w/ Man Falling - Black / S"
    const parts = itemName.split(" - ");
    if (parts.length < 2) {
      return { productTitle: itemName, color: null, size: null };
    }

    const productTitle = parts[0];
    const colorSizePart = parts.slice(1).join(" - ");
    const colorSizeSplit = colorSizePart.split(" / ");
    const color = colorSizeSplit[0];
    const size = colorSizeSplit[1] || null;

    return { productTitle, color, size };
  }

  test("should parse item name with product title, color, and size", () => {
    const result = parseItemName("Unisex Tee w/ Man Falling - Black / S");
    expect(result.productTitle).toBe("Unisex Tee w/ Man Falling");
    expect(result.color).toBe("Black");
    expect(result.size).toBe("S");
  });

  test("should parse item name with two-word color", () => {
    const result = parseItemName("Unisex Tee w/ Text - Dark Grey / M");
    expect(result.productTitle).toBe("Unisex Tee w/ Text");
    expect(result.color).toBe("Dark Grey");
    expect(result.size).toBe("M");
  });

  test("should handle item name without size", () => {
    const result = parseItemName("Die-cut Sticker w/ Text - White");
    expect(result.productTitle).toBe("Die-cut Sticker w/ Text");
    expect(result.color).toBe("White");
    expect(result.size).toBeNull();
  });

  test("should return original name if parsing fails", () => {
    const result = parseItemName("Single Word Item");
    expect(result.productTitle).toBe("Single Word Item");
    expect(result.color).toBeNull();
    expect(result.size).toBeNull();
  });

  test("should handle color names with special characters", () => {
    const result = parseItemName("Unisex Hoodie - Navy Blue / L");
    expect(result.productTitle).toBe("Unisex Hoodie");
    expect(result.color).toBe("Navy Blue");
    expect(result.size).toBe("L");
  });
});

describe("Success Page - Product Image Retrieval", () => {
  function getProductImage(product, color) {
    if (!product) return null;
    // Use color-specific image if available
    if (color && product.variants && product.variants[color] && product.variants[color].image) {
      return product.variants[color].image;
    }
    // Fallback to product image
    return product.image || null;
  }

  test("should return color-specific image when available", () => {
    const product = {
      title: "Unisex Tee",
      image: "https://example.com/default.jpg",
      variants: {
        Black: {
          image: "https://example.com/black.jpg",
        },
        White: {
          image: "https://example.com/white.jpg",
        },
      },
    };

    const result = getProductImage(product, "Black");
    expect(result).toBe("https://example.com/black.jpg");
  });

  test("should fallback to main product image if color not in variants", () => {
    const product = {
      title: "Unisex Tee",
      image: "https://example.com/default.jpg",
      variants: {
        Black: {
          image: "https://example.com/black.jpg",
        },
      },
    };

    const result = getProductImage(product, "Red");
    expect(result).toBe("https://example.com/default.jpg");
  });

  test("should fallback to main product image if color variant has no image", () => {
    const product = {
      title: "Unisex Tee",
      image: "https://example.com/default.jpg",
      variants: {
        Black: {
          sizes: { S: { variant_id: 123 } },
        },
      },
    };

    const result = getProductImage(product, "Black");
    expect(result).toBe("https://example.com/default.jpg");
  });

  test("should return null if no product provided", () => {
    const result = getProductImage(null, "Black");
    expect(result).toBeNull();
  });

  test("should return null if product has no image", () => {
    const product = {
      title: "Unisex Tee",
      variants: {
        Black: {
          image: "https://example.com/black.jpg",
        },
      },
    };

    const result = getProductImage(product, "Red");
    expect(result).toBeNull();
  });
});

describe("Success Page - Country Name Mapping", () => {
  function getCountryName(code, countryNameMap) {
    return countryNameMap[code] || code;
  }

  test("should return country name for valid code", () => {
    const countryNameMap = {
      US: "United States",
      GB: "United Kingdom",
      CA: "Canada",
    };

    expect(getCountryName("US", countryNameMap)).toBe("United States");
    expect(getCountryName("GB", countryNameMap)).toBe("United Kingdom");
  });

  test("should fallback to code if country not found", () => {
    const countryNameMap = {
      US: "United States",
    };

    expect(getCountryName("XX", countryNameMap)).toBe("XX");
  });

  test("should handle empty map", () => {
    const countryNameMap = {};

    expect(getCountryName("US", countryNameMap)).toBe("US");
  });
});

describe("Success Page - Loading Indicator", () => {
  beforeEach(() => {
    // Create a DOM element for testing
    document.body.innerHTML = '<div id="loading-indicator" style="display: none;"></div>';
  });

  function showLoadingIndicator() {
    const loadingEl = document.getElementById("loading-indicator");
    if (loadingEl) {
      loadingEl.style.display = "block";
    }
  }

  function hideLoadingIndicator() {
    const loadingEl = document.getElementById("loading-indicator");
    if (loadingEl) {
      loadingEl.style.display = "none";
    }
  }

  test("should show loading indicator", () => {
    const indicator = document.getElementById("loading-indicator");
    expect(indicator.style.display).toBe("none");

    showLoadingIndicator();
    expect(indicator.style.display).toBe("block");
  });

  test("should hide loading indicator", () => {
    const indicator = document.getElementById("loading-indicator");
    showLoadingIndicator();
    expect(indicator.style.display).toBe("block");

    hideLoadingIndicator();
    expect(indicator.style.display).toBe("none");
  });

  test("should handle missing loading indicator element gracefully", () => {
    document.body.innerHTML = "";

    // Should not throw error
    expect(() => {
      showLoadingIndicator();
      hideLoadingIndicator();
    }).not.toThrow();
  });
});

describe("Success Page - Order Items Display", () => {
  test("should format currency correctly", () => {
    const formatCurrency = (cents, symbol = "$") => {
      return `${symbol}${(cents / 100).toFixed(2)}`;
    };

    expect(formatCurrency(2500)).toBe("$25.00");
    expect(formatCurrency(100)).toBe("$1.00");
    expect(formatCurrency(0)).toBe("$0.00");
    expect(formatCurrency(1234)).toBe("$12.34");
  });

  test("should calculate line totals correctly", () => {
    const lineItem = {
      quantity: 2,
      unitPrice: 2500, // $25.00
      amount: 5000, // $50.00 (2 × $25)
    };

    const unitPrice = lineItem.unitPrice / 100;
    const lineTotal = lineItem.amount / 100;

    expect(unitPrice).toBe(25.0);
    expect(lineTotal).toBe(50.0);
    expect(lineTotal).toBe(unitPrice * lineItem.quantity);
  });

  test("should validate line item structure", () => {
    const validateLineItem = item => {
      return Boolean(item.name && item.quantity && item.unitPrice !== undefined && item.amount !== undefined);
    };

    const validItem = {
      name: "Unisex Tee w/ Man Falling - Black / S",
      quantity: 1,
      unitPrice: 2500,
      amount: 2500,
    };

    const invalidItem = {
      name: "Unisex Tee",
      // missing quantity
      unitPrice: 2500,
      amount: 2500,
    };

    expect(validateLineItem(validItem)).toBe(true);
    expect(validateLineItem(invalidItem)).toBe(false);
  });
});

describe("Success Page - Address Display", () => {
  test("should format shipping address correctly", () => {
    const formatAddress = address => {
      const parts = [];

      if (address.name) parts.push(`<strong>${address.name}</strong>`);
      if (address.line1) parts.push(address.line1);
      if (address.line2) parts.push(address.line2);

      const cityStateZip = [address.city, address.state, address.postal_code].filter(Boolean).join(" ");
      if (cityStateZip) parts.push(cityStateZip);

      if (address.country) parts.push(address.country);

      return parts.join("<br>");
    };

    const address = {
      name: "John Doe",
      line1: "123 Main St",
      line2: "Apt 4",
      city: "New York",
      state: "NY",
      postal_code: "10001",
      country: "United States",
    };

    const result = formatAddress(address);
    expect(result).toContain("<strong>John Doe</strong>");
    expect(result).toContain("123 Main St");
    expect(result).toContain("Apt 4");
    expect(result).toContain("New York NY 10001");
    expect(result).toContain("United States");
  });

  test("should handle partial address", () => {
    const formatAddress = address => {
      const parts = [];

      if (address.name) parts.push(`<strong>${address.name}</strong>`);
      if (address.line1) parts.push(address.line1);
      if (address.line2) parts.push(address.line2);

      const cityStateZip = [address.city, address.state, address.postal_code].filter(Boolean).join(" ");
      if (cityStateZip) parts.push(cityStateZip);

      if (address.country) parts.push(address.country);

      return parts.join("<br>");
    };

    const address = {
      line1: "456 Oak Ave",
      city: "Los Angeles",
      postal_code: "90001",
      country: "United States",
    };

    const result = formatAddress(address);
    expect(result).not.toContain("Apt");
    expect(result).toContain("456 Oak Ave");
    expect(result).toContain("Los Angeles 90001");
  });
});
