/**
 * Test Data Fixtures Validation Tests
 * Validates all mock objects, data structures, and methods
 */

import {
  mockProducts,
  mockCart,
  mockQuoteResponse,
  mockQuoteResponseDE,
  mockCountries,
  mockOrder,
  mockOrderWithTracking,
  mockCheckoutSessionResponse,
  mockGeolocationResponse,
  mockProductNoVariants,
  mockOrderMultipleItems,
  mockCartMultipleItems,
} from "../utils/fixtures/test-data";

import testDataModule from "../utils/fixtures/test-data";

describe("Test Data Fixtures - Structure Validation", () => {
  describe("Mock Products", () => {
    it("should be an array", () => {
      expect(Array.isArray(mockProducts)).toBe(true);
    });

    it("should have exactly 3 products", () => {
      expect(mockProducts.length).toBe(3);
    });

    it("should have tee product with correct structure", () => {
      const tee = mockProducts[0];

      expect(tee).toHaveProperty("product_key", "tee_001");
      expect(tee).toHaveProperty("title", "Classic Tee");
      expect(tee).toHaveProperty("image");
      expect(tee).toHaveProperty("display_price");
      expect(tee).toHaveProperty("variants");
    });

    it("should have hoodie product with correct structure", () => {
      const hoodie = mockProducts[1];

      expect(hoodie).toHaveProperty("product_key", "hoodie_001");
      expect(hoodie).toHaveProperty("title", "Classic Hoodie");
      expect(hoodie.variants).toHaveProperty("Black");
      expect(hoodie.variants).toHaveProperty("Navy");
    });

    it("should have sticker product with correct structure", () => {
      const sticker = mockProducts[2];

      expect(sticker).toHaveProperty("product_key", "sticker_001");
      expect(sticker).toHaveProperty("title", "Vinyl Sticker Pack");
      expect(sticker.variants.Default.sizes).toHaveProperty("OneSize");
    });

    it("should have tee with multiple color variants", () => {
      const tee = mockProducts[0];

      expect(Object.keys(tee.variants)).toContain("Black");
      expect(Object.keys(tee.variants)).toContain("Red");
      expect(Object.keys(tee.variants)).toContain("White");
    });

    it("should have tee with multiple size options per color", () => {
      const tee = mockProducts[0];
      const blackTee = tee.variants.Black;

      expect(Object.keys(blackTee.sizes)).toEqual(["S", "M", "L", "XL"]);
    });

    it("should have hoodie with XXL size", () => {
      const hoodie = mockProducts[1];
      const blackHoodie = hoodie.variants.Black;

      expect(Object.keys(blackHoodie.sizes)).toContain("XXL");
      expect(blackHoodie.sizes.XXL.price_cents).toBe(5000);
    });

    it("should have correct price structures", () => {
      mockProducts.forEach(product => {
        Object.values(product.variants).forEach(color => {
          Object.values(color.sizes).forEach(size => {
            expect(size).toHaveProperty("variant_id");
            expect(size).toHaveProperty("price_cents");
            expect(typeof size.variant_id).toBe("number");
            expect(typeof size.price_cents).toBe("number");
          });
        });
      });
    });

    it("should have unique variant IDs across all products", () => {
      const variantIds = [];

      mockProducts.forEach(product => {
        Object.values(product.variants).forEach(color => {
          Object.values(color.sizes).forEach(size => {
            variantIds.push(size.variant_id);
          });
        });
      });

      const uniqueIds = new Set(variantIds);
      expect(uniqueIds.size).toBe(variantIds.length);
    });
  });

  describe("Mock Cart", () => {
    it("should have items array", () => {
      expect(Array.isArray(mockCart.items)).toBe(true);
    });

    it("should have 2 items", () => {
      expect(mockCart.items.length).toBe(2);
    });

    it("should have tee item with correct properties", () => {
      const teeItem = mockCart.items[0];

      expect(teeItem).toHaveProperty("product_key", "tee_001");
      expect(teeItem).toHaveProperty("title", "Classic Tee");
      expect(teeItem).toHaveProperty("color", "Black");
      expect(teeItem).toHaveProperty("size", "M");
      expect(teeItem).toHaveProperty("variant_id");
      expect(teeItem).toHaveProperty("quantity");
      expect(teeItem).toHaveProperty("price_cents");
      expect(teeItem).toHaveProperty("image");
    });

    it("should have hoodie item with correct properties", () => {
      const hoodieItem = mockCart.items[1];

      expect(hoodieItem).toHaveProperty("product_key", "hoodie_001");
      expect(hoodieItem).toHaveProperty("color", "Navy");
      expect(hoodieItem).toHaveProperty("size", "L");
    });

    it("should have getSubtotalCents method", () => {
      expect(typeof mockCart.getSubtotalCents).toBe("function");
    });

    it("should have getTotalCents method", () => {
      expect(typeof mockCart.getTotalCents).toBe("function");
    });

    it("should calculate correct subtotal", () => {
      const subtotal = mockCart.getSubtotalCents();

      expect(subtotal).toBe(2500 + 4500);
      expect(subtotal).toBe(7000);
    });

    it("should calculate correct total", () => {
      const total = mockCart.getTotalCents();

      expect(total).toBe(7000);
    });

    it("subtotal should equal total for cart without shipping/tax", () => {
      const subtotal = mockCart.getSubtotalCents();
      const total = mockCart.getTotalCents();

      expect(subtotal).toBe(total);
    });
  });

  describe("Mock Quote Responses", () => {
    it("should have USD quote with correct structure", () => {
      expect(mockQuoteResponse).toHaveProperty("prices");
      expect(mockQuoteResponse).toHaveProperty("currency", "USD");
      expect(mockQuoteResponse).toHaveProperty("taxLabel");
      expect(mockQuoteResponse).toHaveProperty("shippingNote");
      expect(mockQuoteResponse).toHaveProperty("calculationId");
    });

    it("should have correct price breakdown for USD quote", () => {
      const { prices } = mockQuoteResponse;

      expect(prices).toHaveProperty("subtotal", 7000);
      expect(prices).toHaveProperty("shipping", 1000);
      expect(prices).toHaveProperty("tax", 640);
      expect(prices).toHaveProperty("total", 8640);
    });

    it("should have USD prices greater than subtotal", () => {
      const { prices } = mockQuoteResponse;

      expect(prices.total).toBeGreaterThan(prices.subtotal);
      expect(prices.total).toBe(prices.subtotal + prices.shipping + prices.tax);
    });

    it("should have EUR quote with different currency", () => {
      expect(mockQuoteResponseDE).toHaveProperty("currency", "EUR");
      expect(mockQuoteResponseDE).toHaveProperty("taxLabel", "VAT");
    });

    it("should have EUR quote with higher shipping costs", () => {
      expect(mockQuoteResponseDE.prices.shipping).toBeGreaterThan(mockQuoteResponse.prices.shipping);
      expect(mockQuoteResponseDE.prices.shipping).toBe(1500);
    });

    it("should have EUR quote with higher tax", () => {
      expect(mockQuoteResponseDE.prices.tax).toBeGreaterThan(mockQuoteResponse.prices.tax);
      expect(mockQuoteResponseDE.prices.tax).toBe(1330);
    });

    it("should have same subtotal across currencies", () => {
      expect(mockQuoteResponse.prices.subtotal).toBe(mockQuoteResponseDE.prices.subtotal);
    });
  });

  describe("Mock Countries", () => {
    it("should be an array", () => {
      expect(Array.isArray(mockCountries)).toBe(true);
    });

    it("should have at least 7 countries", () => {
      expect(mockCountries.length).toBeGreaterThanOrEqual(7);
    });

    it("should have US country", () => {
      const us = mockCountries.find(c => c.code === "US");

      expect(us).toBeDefined();
      expect(us).toHaveProperty("code", "US");
      expect(us).toHaveProperty("name", "United States");
    });

    it("should have GB country", () => {
      const gb = mockCountries.find(c => c.code === "GB");

      expect(gb).toBeDefined();
      expect(gb.name).toBe("United Kingdom");
    });

    it("should have DE country", () => {
      const de = mockCountries.find(c => c.code === "DE");

      expect(de).toBeDefined();
      expect(de.name).toBe("Germany");
    });

    it("should have CA country", () => {
      const ca = mockCountries.find(c => c.code === "CA");

      expect(ca).toBeDefined();
      expect(ca.name).toBe("Canada");
    });

    it("should have AU country", () => {
      const au = mockCountries.find(c => c.code === "AU");

      expect(au).toBeDefined();
      expect(au.name).toBe("Australia");
    });

    it("should have JP country", () => {
      const jp = mockCountries.find(c => c.code === "JP");

      expect(jp).toBeDefined();
      expect(jp.name).toBe("Japan");
    });

    it("should have FR country", () => {
      const fr = mockCountries.find(c => c.code === "FR");

      expect(fr).toBeDefined();
      expect(fr.name).toBe("France");
    });

    it("should have unique country codes", () => {
      const codes = mockCountries.map(c => c.code);
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });

    it("should have 2-letter country codes", () => {
      mockCountries.forEach(country => {
        expect(country.code.length).toBe(2);
      });
    });
  });

  describe("Mock Order", () => {
    it("should have required order properties", () => {
      expect(mockOrder).toHaveProperty("printful_order_id");
      expect(mockOrder).toHaveProperty("status");
      expect(mockOrder).toHaveProperty("created_at");
      expect(mockOrder).toHaveProperty("costs");
      expect(mockOrder).toHaveProperty("items");
      expect(mockOrder).toHaveProperty("recipient");
    });

    it("should have processing status", () => {
      expect(mockOrder.status).toBe("processing");
    });

    it("should have 2 items", () => {
      expect(mockOrder.items.length).toBe(2);
    });

    it("should have correct cost breakdown", () => {
      const { costs } = mockOrder;

      expect(costs).toHaveProperty("subtotal_cents", "7000");
      expect(costs).toHaveProperty("shipping_cents", "1000");
      expect(costs).toHaveProperty("tax_cents", "640");
      expect(costs).toHaveProperty("total_cents", "8640");
    });

    it("should have total equal to subtotal + shipping + tax", () => {
      const { costs } = mockOrder;
      const total = parseInt(costs.subtotal_cents) + parseInt(costs.shipping_cents) + parseInt(costs.tax_cents);

      expect(parseInt(costs.total_cents)).toBe(total);
    });

    it("should have recipient with address", () => {
      const { recipient } = mockOrder;

      expect(recipient).toHaveProperty("name", "John Doe");
      expect(recipient).toHaveProperty("email");
      expect(recipient).toHaveProperty("address");
    });

    it("should have recipient address with required fields", () => {
      const { address } = mockOrder.recipient;

      expect(address).toHaveProperty("line1");
      expect(address).toHaveProperty("city");
      expect(address).toHaveProperty("state");
      expect(address).toHaveProperty("zip");
      expect(address).toHaveProperty("country");
      expect(address).toHaveProperty("country_code", "US");
    });

    it("should have items with complete information", () => {
      mockOrder.items.forEach(item => {
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("product_key");
        expect(item).toHaveProperty("product_name");
        expect(item).toHaveProperty("variant_id");
        expect(item).toHaveProperty("color");
        expect(item).toHaveProperty("size");
        expect(item).toHaveProperty("quantity");
        expect(item).toHaveProperty("price_cents");
      });
    });

    it("should have empty shipments array", () => {
      expect(Array.isArray(mockOrder.shipments)).toBe(true);
      expect(mockOrder.shipments.length).toBe(0);
    });
  });

  describe("Mock Order with Tracking", () => {
    it("should inherit from mockOrder", () => {
      expect(mockOrderWithTracking.printful_order_id).toBe(mockOrder.printful_order_id);
      expect(mockOrderWithTracking.items).toEqual(mockOrder.items);
    });

    it("should have shipped status", () => {
      expect(mockOrderWithTracking.status).toBe("shipped");
    });

    it("should have shipment information", () => {
      expect(mockOrderWithTracking.shipments.length).toBeGreaterThan(0);
    });

    it("should have shipment with tracking details", () => {
      const shipment = mockOrderWithTracking.shipments[0];

      expect(shipment).toHaveProperty("id");
      expect(shipment).toHaveProperty("carrier");
      expect(shipment).toHaveProperty("tracking_number");
      expect(shipment).toHaveProperty("tracking_url");
      expect(shipment).toHaveProperty("shipped_date");
    });

    it("should have USPS carrier", () => {
      const shipment = mockOrderWithTracking.shipments[0];

      expect(shipment.carrier).toBe("USPS");
    });

    it("should have shipment items", () => {
      const shipment = mockOrderWithTracking.shipments[0];

      expect(Array.isArray(shipment.items)).toBe(true);
      expect(shipment.items.length).toBe(2);
    });

    it("should link shipment items to order items", () => {
      const shipment = mockOrderWithTracking.shipments[0];

      expect(shipment.items[0].item_id).toBe("item_001");
      expect(shipment.items[1].item_id).toBe("item_002");
    });
  });

  describe("Mock Checkout Session Response", () => {
    it("should have session_id", () => {
      expect(mockCheckoutSessionResponse).toHaveProperty("session_id");
    });

    it("should have redirect_url", () => {
      expect(mockCheckoutSessionResponse).toHaveProperty("redirect_url");
    });

    it("should have stripe.com in redirect URL", () => {
      expect(mockCheckoutSessionResponse.redirect_url).toContain("stripe.com");
    });

    it("should have session ID in redirect URL", () => {
      expect(mockCheckoutSessionResponse.redirect_url).toContain(mockCheckoutSessionResponse.session_id);
    });
  });

  describe("Mock Geolocation Response", () => {
    it("should have country code", () => {
      expect(mockGeolocationResponse).toHaveProperty("country", "US");
    });

    it("should have region", () => {
      expect(mockGeolocationResponse).toHaveProperty("region", "IL");
    });

    it("should have timezone", () => {
      expect(mockGeolocationResponse).toHaveProperty("timezone");
      expect(mockGeolocationResponse.timezone).toContain("America");
    });

    it("should have currency", () => {
      expect(mockGeolocationResponse).toHaveProperty("currency", "USD");
    });
  });

  describe("Mock Product No Variants", () => {
    it("should exist", () => {
      expect(mockProductNoVariants).toBeDefined();
    });

    it("should have basic product properties", () => {
      expect(mockProductNoVariants).toHaveProperty("product_key");
      expect(mockProductNoVariants).toHaveProperty("title");
      expect(mockProductNoVariants).toHaveProperty("image");
    });

    it("should have empty variants object", () => {
      expect(mockProductNoVariants.variants).toEqual({});
    });

    it("should not have color options", () => {
      expect(Object.keys(mockProductNoVariants.variants).length).toBe(0);
    });
  });

  describe("Mock Order Multiple Items", () => {
    it("should have delivered status", () => {
      expect(mockOrderMultipleItems.status).toBe("delivered");
    });

    it("should have items from all products", () => {
      expect(mockOrderMultipleItems.items.length).toBe(mockProducts.length);
    });

    it("should have recipient from different country", () => {
      expect(mockOrderMultipleItems.recipient.address.country).toBe("GB");
    });

    it("should have items with correct product keys", () => {
      const productKeys = mockOrderMultipleItems.items.map(item => item.product_key);

      expect(productKeys).toContain("tee_001");
      expect(productKeys).toContain("hoodie_001");
      expect(productKeys).toContain("sticker_001");
    });
  });

  describe("Mock Cart Multiple Items", () => {
    it("should have more items than mockCart", () => {
      expect(mockCartMultipleItems.items.length).toBeGreaterThan(mockCart.items.length);
    });

    it("should have 3 items", () => {
      expect(mockCartMultipleItems.items.length).toBe(3);
    });

    it("should include sticker item", () => {
      const stickerItem = mockCartMultipleItems.items.find(item => item.product_key === "sticker_001");

      expect(stickerItem).toBeDefined();
      expect(stickerItem.quantity).toBe(2);
    });

    it("should have getSubtotalCents method", () => {
      expect(typeof mockCartMultipleItems.getSubtotalCents).toBe("function");
    });

    it("should calculate subtotal with multiple quantities", () => {
      const subtotal = mockCartMultipleItems.getSubtotalCents();

      // 2500 (tee) + 4500 (hoodie) + 500*2 (2 stickers)
      expect(subtotal).toBe(2500 + 4500 + 500 * 2);
      expect(subtotal).toBe(8000);
    });
  });

  describe("Default Export", () => {
    it("should export all fixtures as default object", () => {
      expect(testDataModule).toBeDefined();
    });

    it("should have mockProducts in default export", () => {
      expect(testDataModule.mockProducts).toBeDefined();
      expect(testDataModule.mockProducts).toBe(mockProducts);
    });

    it("should have mockCart in default export", () => {
      expect(testDataModule.mockCart).toBeDefined();
      expect(testDataModule.mockCart).toBe(mockCart);
    });

    it("should have mockQuoteResponse in default export", () => {
      expect(testDataModule.mockQuoteResponse).toBeDefined();
      expect(testDataModule.mockQuoteResponse).toBe(mockQuoteResponse);
    });

    it("should have mockQuoteResponseDE in default export", () => {
      expect(testDataModule.mockQuoteResponseDE).toBeDefined();
    });

    it("should have mockCountries in default export", () => {
      expect(testDataModule.mockCountries).toBeDefined();
      expect(testDataModule.mockCountries).toBe(mockCountries);
    });

    it("should have mockOrder in default export", () => {
      expect(testDataModule.mockOrder).toBeDefined();
      expect(testDataModule.mockOrder).toBe(mockOrder);
    });

    it("should have mockOrderWithTracking in default export", () => {
      expect(testDataModule.mockOrderWithTracking).toBeDefined();
    });

    it("should have mockCheckoutSessionResponse in default export", () => {
      expect(testDataModule.mockCheckoutSessionResponse).toBeDefined();
    });

    it("should have mockGeolocationResponse in default export", () => {
      expect(testDataModule.mockGeolocationResponse).toBeDefined();
    });

    it("should have mockProductNoVariants in default export", () => {
      expect(testDataModule.mockProductNoVariants).toBeDefined();
    });

    it("should have mockOrderMultipleItems in default export", () => {
      expect(testDataModule.mockOrderMultipleItems).toBeDefined();
    });

    it("should have mockCartMultipleItems in default export", () => {
      expect(testDataModule.mockCartMultipleItems).toBeDefined();
    });

    it("should have 12 total exports", () => {
      expect(Object.keys(testDataModule).length).toBe(12);
    });
  });
});
