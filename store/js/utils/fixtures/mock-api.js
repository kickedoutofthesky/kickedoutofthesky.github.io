/**
 * Mock Fetch Utilities
 * For mocking API calls in tests
 */

/**
 * Create a mock fetch function
 */
export function createMockFetch(responses = {}) {
  return async (url, options = {}) => {
    const method = options.method || "GET";
    const key = `${method} ${url}`;

    if (responses[key]) {
      const response = responses[key];

      return {
        ok: response.ok !== false,
        status: response.status || 200,
        json: async () => response.data || {},
        text: async () => JSON.stringify(response.data || {}),
      };
    }

    // Default response if no mock defined
    return {
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => "{}",
    };
  };
}

/**
 * Create mock fetch for quote API
 */
export function createMockQuoteFetch(quoteResponse) {
  return createMockFetch({
    "GET /api/quote": {
      ok: true,
      status: 200,
      data: quoteResponse,
    },
    "POST /api/quote": {
      ok: true,
      status: 200,
      data: quoteResponse,
    },
  });
}

/**
 * Create mock fetch for checkout API
 */
export function createMockCheckoutFetch(checkoutResponse) {
  return createMockFetch({
    "GET /api/checkout": {
      ok: true,
      status: 200,
      data: checkoutResponse,
    },
    "POST /api/checkout": {
      ok: true,
      status: 200,
      data: checkoutResponse,
    },
  });
}

/**
 * Create mock fetch for order details API
 */
export function createMockOrderDetailsFetch(orderData) {
  return createMockFetch({
    "GET /api/order-details": {
      ok: true,
      status: 200,
      data: orderData,
    },
  });
}

/**
 * Create mock fetch that returns error
 */
export function createMockErrorFetch(errorMessage = "API Error") {
  return async (url, options = {}) => ({
    ok: false,
    status: 500,
    json: async () => ({ error: errorMessage }),
    text: async () => JSON.stringify({ error: errorMessage }),
  });
}

/**
 * Create mock fetch with delay
 */
export function createMockFetchWithDelay(responses = {}, delay = 100) {
  return async (url, options = {}) => {
    await new Promise(resolve => setTimeout(resolve, delay));

    const method = options.method || "GET";
    const key = `${method} ${url}`;

    if (responses[key]) {
      const response = responses[key];
      return {
        ok: response.ok !== false,
        status: response.status || 200,
        json: async () => response.data || {},
        text: async () => JSON.stringify(response.data || {}),
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => "{}",
    };
  };
}

/**
 * Create mock fetch that validates request
 */
export function createValidatingMockFetch(validator, responseData) {
  return async (url, options = {}) => {
    try {
      const body = options.body ? JSON.parse(options.body) : null;
      const isValid = validator(url, options.method, body);

      if (!isValid) {
        return {
          ok: false,
          status: 400,
          json: async () => ({ error: "Invalid request" }),
        };
      }

      return {
        ok: true,
        status: 200,
        json: async () => responseData,
        text: async () => JSON.stringify(responseData),
      };
    } catch (error) {
      return {
        ok: false,
        status: 400,
        json: async () => ({ error: error.message }),
      };
    }
  };
}

/**
 * Create mock sessionStorage
 */
export function createMockSessionStorage() {
  const store = {};

  return {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      Object.keys(store).forEach(key => delete store[key]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key(index) {
      return Object.keys(store)[index] || null;
    },
  };
}

/**
 * Create mock localStorage
 */
export function createMockLocalStorage() {
  const store = {};

  return {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      Object.keys(store).forEach(key => delete store[key]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key(index) {
      return Object.keys(store)[index] || null;
    },
  };
}

/**
 * Create mock AudioContext for audio tests
 */
export function createMockAudioContext() {
  const mockOscillator = {
    frequency: { value: 0 },
    type: "sine",
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  };

  const mockGain = {
    gain: { value: 1, setTargetAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
    connect: jest.fn(),
  };

  return {
    createOscillator: jest.fn(() => mockOscillator),
    createGain: jest.fn(() => mockGain),
    destination: {},
    createBiquadFilter: jest.fn(),
    createAnalyser: jest.fn(),
    close: jest.fn(),
  };
}

/**
 * Mock geolocation
 */
export function mockGeolocation(position) {
  return {
    getCurrentPosition: jest.fn(success => {
      success(position);
    }),
    watchPosition: jest.fn(),
  };
}

/**
 * Setup fetch mock globally
 */
export function setupFetchMock(mockFn) {
  global.fetch = mockFn;
}

/**
 * Reset fetch mock
 */
export function resetFetchMock() {
  delete global.fetch;
}

export default {
  createMockFetch,
  createMockQuoteFetch,
  createMockCheckoutFetch,
  createMockOrderDetailsFetch,
  createMockErrorFetch,
  createMockFetchWithDelay,
  createValidatingMockFetch,
  createMockSessionStorage,
  createMockLocalStorage,
  createMockAudioContext,
  mockGeolocation,
  setupFetchMock,
  resetFetchMock,
};
