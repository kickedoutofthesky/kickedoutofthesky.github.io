/**
 * Test Fixtures and Mock Data
 * Comprehensive test data for product, cart, and order testing
 */

// Mock Products
export const mockProducts = [
  {
    product_key: "tee_001",
    title: "Classic Tee",
    image: "tee-main.jpg",
    display_price: "$25.00",
    variants: {
      Black: {
        image: "tee-black.jpg",
        sizes: {
          S: { variant_id: 1001, price_cents: 2500 },
          M: { variant_id: 1002, price_cents: 2500 },
          L: { variant_id: 1003, price_cents: 2500 },
          XL: { variant_id: 1004, price_cents: 2500 },
        },
      },
      Red: {
        image: "tee-red.jpg",
        sizes: {
          S: { variant_id: 1005, price_cents: 2500 },
          M: { variant_id: 1006, price_cents: 2500 },
          L: { variant_id: 1007, price_cents: 2500 },
          XL: { variant_id: 1008, price_cents: 2500 },
        },
      },
      White: {
        image: "tee-white.jpg",
        sizes: {
          S: { variant_id: 1009, price_cents: 2500 },
          M: { variant_id: 1010, price_cents: 2500 },
          L: { variant_id: 1011, price_cents: 2500 },
          XL: { variant_id: 1012, price_cents: 2500 },
        },
      },
    },
  },
  {
    product_key: "hoodie_001",
    title: "Classic Hoodie",
    image: "hoodie-main.jpg",
    display_price: "$45.00",
    variants: {
      Black: {
        image: "hoodie-black.jpg",
        sizes: {
          S: { variant_id: 2001, price_cents: 4500 },
          M: { variant_id: 2002, price_cents: 4500 },
          L: { variant_id: 2003, price_cents: 4500 },
          XL: { variant_id: 2004, price_cents: 4500 },
          XXL: { variant_id: 2005, price_cents: 5000 },
        },
      },
      Navy: {
        image: "hoodie-navy.jpg",
        sizes: {
          S: { variant_id: 2006, price_cents: 4500 },
          M: { variant_id: 2007, price_cents: 4500 },
          L: { variant_id: 2008, price_cents: 4500 },
          XL: { variant_id: 2009, price_cents: 4500 },
          XXL: { variant_id: 2010, price_cents: 5000 },
        },
      },
    },
  },
  {
    product_key: "sticker_001",
    title: "Vinyl Sticker Pack",
    image: "sticker-main.jpg",
    display_price: "$5.00",
    variants: {
      Default: {
        image: "sticker-main.jpg",
        sizes: {
          OneSize: { variant_id: 3001, price_cents: 500 },
        },
      },
    },
  },
];

// Mock Cart
export const mockCart = {
  items: [
    {
      product_key: "tee_001",
      title: "Classic Tee",
      color: "Black",
      size: "M",
      variant_id: 1002,
      quantity: 1,
      price_cents: 2500,
      image: "tee-black.jpg",
    },
    {
      product_key: "hoodie_001",
      title: "Classic Hoodie",
      color: "Navy",
      size: "L",
      variant_id: 2008,
      quantity: 1,
      price_cents: 4500,
      image: "hoodie-navy.jpg",
    },
  ],
  getSubtotalCents: function () {
    return this.items.reduce((total, item) => total + item.price_cents * item.quantity, 0);
  },
  getTotalCents: function () {
    return this.getSubtotalCents();
  },
};

// Mock Quote Response
export const mockQuoteResponse = {
  prices: {
    subtotal: 7000,
    shipping: 1000,
    tax: 640,
    total: 8640,
  },
  currency: "USD",
  taxLabel: "Sales Tax",
  shippingNote: "Estimated delivery in 5-7 business days",
  calculationId: "calc_123456",
};

// Mock Quote Response (Different Country)
export const mockQuoteResponseDE = {
  prices: {
    subtotal: 7000,
    shipping: 1500,
    tax: 1330,
    total: 9830,
  },
  currency: "EUR",
  taxLabel: "VAT",
  shippingNote: "Estimated delivery in 7-10 business days",
  calculationId: "calc_789012",
};

// Mock Countries
export const mockCountries = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "JP", name: "Japan" },
];

// Mock Order
export const mockOrder = {
  printful_order_id: "PF123456789",
  external_order_id: "ORD-2024-001",
  status: "processing",
  created: 1725355200,
  updated: 1725355800,
  items: [
    {
      id: "item_001",
      product_key: "tee_001",
      product_name: "Classic Tee",
      variant_name: "Black / Medium",
      quantity: 1,
      price: "25.00",
    },
    {
      id: "item_002",
      product_key: "hoodie_001",
      product_name: "Classic Hoodie",
      variant_name: "Navy / Large",
      quantity: 1,
      price: "45.00",
    },
  ],
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
  shipping: {
    status: "pending",
    carrier: "USPS",
    tracking_number: null,
  },
};

// Mock Order with Tracking
export const mockOrderWithTracking = {
  ...mockOrder,
  status: "shipped",
  shipping: {
    status: "in_transit",
    carrier: "USPS",
    tracking_number: "9400111899223456789012",
    tracking_url: "https://tools.usps.com/go/TrackConfirmAction",
  },
};

// Mock Checkout Session Response
export const mockCheckoutSessionResponse = {
  session_id: "cs_test_a1b2c3d4e5f6g7h8i9j0",
  redirect_url: "https://checkout.stripe.com/pay/cs_test_a1b2c3d4e5f6g7h8i9j0",
};

// Mock Geolocation Response
export const mockGeolocationResponse = {
  country: "US",
  region: "IL",
  timezone: "America/Chicago",
  currency: "USD",
};

// Fixture: Product with no variants
export const mockProductNoVariants = {
  product_key: "simple_001",
  title: "Simple Product",
  image: "simple.jpg",
  display_price: "$15.00",
  variants: {},
};

// Fixture: Order with multiple items
export const mockOrderMultipleItems = {
  printful_order_id: "PF987654321",
  status: "delivered",
  created: 1725268800,
  updated: 1725355200,
  items: mockProducts.map((product, idx) => ({
    id: `item_${idx}`,
    product_key: product.product_key,
    product_name: product.title,
    quantity: 1,
    price: product.display_price,
  })),
  recipient: {
    name: "Jane Smith",
    address: {
      line1: "456 Oak Ave",
      city: "London",
      country: "GB",
    },
  },
};

// Fixture: Cart with mixed items
export const mockCartMultipleItems = {
  items: [
    ...mockCart.items,
    {
      product_key: "sticker_001",
      title: "Vinyl Sticker Pack",
      variant_id: 3001,
      quantity: 2,
      price_cents: 500,
      image: "sticker-main.jpg",
    },
  ],
  getSubtotalCents: function () {
    return this.items.reduce((total, item) => total + item.price_cents * item.quantity, 0);
  },
};

export default {
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
};
