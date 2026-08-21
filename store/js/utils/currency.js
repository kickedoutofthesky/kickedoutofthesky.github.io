/**
 * Multi-Currency Utility Module
 * Handles currency detection, price conversion, and locale-aware formatting
 */

let customerCurrency = null;
let detectionInProgress = false;

/**
 * Detect country from timezone using Intl API
 * Provides a fallback when IP geolocation APIs fail
 * @returns {string|null} Two-letter country code or null if unable to detect
 */
function getCountryFromTimezone() {
  try {
    // Get timezone from browser
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timezone) return null;

    // Map common timezones to country codes
    const timezoneToCountry = {
      // North America
      "America/New_York": "US",
      "America/Chicago": "US",
      "America/Denver": "US",
      "America/Los_Angeles": "US",
      "America/Anchorage": "US",
      "Pacific/Honolulu": "US",
      "America/Toronto": "CA",
      "America/Mexico_City": "MX",

      // Europe
      "Europe/London": "GB",
      "Europe/Paris": "FR",
      "Europe/Berlin": "DE",
      "Europe/Madrid": "ES",
      "Europe/Rome": "IT",
      "Europe/Amsterdam": "NL",
      "Europe/Brussels": "BE",
      "Europe/Vienna": "AT",
      "Europe/Prague": "CZ",
      "Europe/Warsaw": "PL",
      "Europe/Stockholm": "SE",
      "Europe/Oslo": "NO",
      "Europe/Copenhagen": "DK",
      "Europe/Zurich": "CH",
      "Europe/Dublin": "IE",
      "Europe/Moscow": "RU",

      // Asia
      "Asia/Tokyo": "JP",
      "Asia/Shanghai": "CN",
      "Asia/Hong_Kong": "HK",
      "Asia/Singapore": "SG",
      "Asia/Bangkok": "TH",
      "Asia/Kolkata": "IN",
      "Asia/Dubai": "AE",
      "Asia/Seoul": "KR",
      "Asia/Manila": "PH",
      "Asia/Jakarta": "ID",
      "Asia/Kuala_Lumpur": "MY",
      "Asia/Ho_Chi_Minh": "VN",

      // Australia/Pacific
      "Australia/Sydney": "AU",
      "Australia/Melbourne": "AU",
      "Pacific/Auckland": "NZ",

      // South America
      "America/Sao_Paulo": "BR",
      "America/Argentina/Buenos_Aires": "AR",
      "America/Santiago": "CL",
      "America/Bogota": "CO",
    };

    return timezoneToCountry[timezone] || null;
  } catch (error) {
    console.warn("Could not detect timezone:", error);
    return null;
  }
}

/**
 * Detect country via IP geolocation (client-side)
 * Works on localhost (browser has real public IP) and production
 * @returns {Promise<string|null>} Two-letter country code or null if detection fails
 */
async function detectCountryViaIP() {
  try {
    // Use ipapi.co which works on localhost (browser makes the request with its real public IP)
    const response = await fetch("https://ipapi.co/json/", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.warn(`IP geolocation API returned status ${response.status}`);
      return null;
    }

    const data = await response.json();
    const country = data.country_code;

    if (country && country.length === 2) {
      console.log(`✓ IP geolocation detected country: ${country}`);
      return country;
    }

    return null;
  } catch (error) {
    console.warn("IP geolocation detection failed:", error);
    return null;
  }
}

/**
 * Fetch currency data from backend /api/geo endpoint
 * Must have a detected country to work
 * @param {string} country - Two-letter country code
 * @returns {Promise<object|null>} Currency data or null if fetch fails
 */
async function fetchCurrencyData(country) {
  try {
    const backendUrl = window.__API_URL__ || "https://api.kickedoutofthesky.com";
    const response = await fetch(`${backendUrl}/api/geo?country=${country}`);

    if (!response.ok) {
      console.warn(`Backend geo endpoint returned status ${response.status}`);
      return null;
    }

    const geoData = await response.json();
    return geoData;
  } catch (error) {
    console.warn("Failed to fetch currency data from backend:", error);
    return null;
  }
}

/**
 * Initialize currency and detect country on first page load
 * Fire-once, non-blocking detection that respects user's manual country selection
 * Detection happens in background; UI renders immediately with defaults
 *
 * Sequence:
 * 1. If user manually set country before, use that (never overwrite)
 * 2. If country already detected, use it
 * 3. Otherwise, detect via:
 *    a. IP geolocation (ipapi.co) - works on localhost + production
 *    b. Timezone fallback - works offline, less accurate
 *    c. Default to US - never end up with no country
 */
export async function initializeCurrency() {
  // Prevent multiple concurrent detections
  if (detectionInProgress) {
    return window.customerCurrency;
  }

  // If already initialized, return cached value
  if (window.customerCurrency) {
    return window.customerCurrency;
  }

  detectionInProgress = true;

  try {
    // Check if user manually set country before (flag prevents overwriting)
    const countryManuallySet = localStorage.getItem("countryManuallySet") === "true";
    const savedCountry = localStorage.getItem("selectedShippingCountry");

    let detectedCountry = null;

    // If user manually set country, never override it with detection
    if (countryManuallySet && savedCountry) {
      console.log(`✓ Using manually selected country: ${savedCountry}`);
      detectedCountry = savedCountry;
    } else if (savedCountry) {
      // Use previously detected country
      console.log(`✓ Using previously detected country: ${savedCountry}`);
      detectedCountry = savedCountry;
    } else {
      // Detect country (fire-and-forget, non-blocking)
      // Try IP detection first, fall back to timezone, then default to US
      detectedCountry = await detectCountryViaIP();

      if (!detectedCountry) {
        console.warn("IP detection failed, trying timezone fallback...");
        detectedCountry = getCountryFromTimezone();
      }

      if (!detectedCountry) {
        console.warn("Timezone detection failed, defaulting to US");
        detectedCountry = "US";
      }

      // Store detected country (not manually set)
      localStorage.setItem("selectedShippingCountry", detectedCountry);
      localStorage.setItem("countryManuallySet", "false");
      console.log(`✓ Auto-detected country: ${detectedCountry}`);
    }

    // Fetch currency data from backend
    const geoData = await fetchCurrencyData(detectedCountry);

    if (geoData) {
      customerCurrency = {
        country: geoData.country || detectedCountry,
        currency: geoData.currency || "USD",
        exchangeRates: geoData.exchangeRates || { USD: 1.0 },
        vatRate: geoData.vatRate || 0,
        isEU: geoData.isEU || false,
      };
    } else {
      // Fallback to default if backend fails
      console.warn("Backend failed, using defaults");
      customerCurrency = {
        country: detectedCountry,
        currency: "USD",
        exchangeRates: { USD: 1.0 },
        vatRate: 0,
        isEU: false,
      };
    }

    // Store globally for access from other modules
    window.customerCurrency = customerCurrency;

    console.log(`✓ Currency initialized: ${customerCurrency.country} → ${customerCurrency.currency}`);
    return customerCurrency;
  } catch (error) {
    console.error("Critical error during currency initialization:", error);

    // Last resort fallback
    customerCurrency = {
      country: "US",
      currency: "USD",
      exchangeRates: { USD: 1.0 },
      vatRate: 0,
      isEU: false,
    };
    window.customerCurrency = customerCurrency;

    // Ensure country is in localStorage
    if (!localStorage.getItem("selectedShippingCountry")) {
      localStorage.setItem("selectedShippingCountry", "US");
    }

    return customerCurrency;
  } finally {
    detectionInProgress = false;
  }
}

/**
 * Get decimal places for a currency
 * Most currencies use 2 decimals, but JPY/KRW use 0, some others use 3
 */
export function getCurrencyDecimals(currency) {
  const currencyUpper = (currency || "USD").toUpperCase();
  const zeroDecimalCurrencies = ["JPY", "KRW"];
  const threeDecimalCurrencies = ["BHD", "JOD", "KWD", "OMR", "TND"];

  if (zeroDecimalCurrencies.includes(currencyUpper)) {
    return 0;
  }
  if (threeDecimalCurrencies.includes(currencyUpper)) {
    return 3;
  }
  return 2; // Default for most currencies
}

/**
 * Convert USD price to customer's detected currency
 * @param {number} usdCents - Price in USD cents (e.g., 2500 = $25.00)
 * @returns {number} Price in target currency's smallest unit
 */
export function convertPrice(usdCents) {
  const cc = window.customerCurrency;
  if (!cc) {
    return usdCents;
  }

  const currencyUpper = (cc.currency || "USD").toUpperCase();
  if (currencyUpper === "USD") {
    return usdCents;
  }

  const { exchangeRates } = cc;
  const rate = exchangeRates?.[currencyUpper] || 1;

  // Convert USD cents to dollars, apply exchange rate
  const usdDollars = usdCents / 100;
  const convertedAmount = usdDollars * rate;

  // Convert to target currency's smallest unit
  const decimals = getCurrencyDecimals(currencyUpper);
  const multiplier = Math.pow(10, decimals);

  return Math.round(convertedAmount * multiplier);
}

/**
 * Format price with currency symbol and locale-aware formatting
 * @param {number} cents - Price in smallest currency unit
 * @param {string} currencyOverride - Optional currency to use instead of detected
 * @returns {string} Formatted price string (e.g., "€23,00", "$25.00", "¥275,000")
 */
export function formatPrice(cents, currencyOverride = null) {
  const cc = window.customerCurrency;
  if (!cc) {
    // Fallback formatting
    return "$" + (cents / 100).toFixed(2);
  }

  const currency = currencyOverride || cc.currency;
  const currencyUpper = (currency || "USD").toUpperCase();
  const decimals = getCurrencyDecimals(currencyUpper);
  const amount = cents / Math.pow(10, decimals);

  // Map currencies to their standard locales
  const localeMap = {
    USD: "en-US",
    EUR: "de-DE", // German format: €1.234,50
    GBP: "en-GB", // British format: £1,234.50
    JPY: "ja-JP",
    CAD: "en-CA",
    AUD: "en-AU",
    CHF: "de-CH",
    SEK: "sv-SE",
    NOK: "nb-NO",
    DKK: "da-DK",
    PLN: "pl-PL",
    CZK: "cs-CZ",
    HUH: "hu-HU",
    RON: "ro-RO",
    SGD: "en-SG",
    THB: "th-TH",
    ZAR: "en-ZA",
    BRL: "pt-BR",
    MXN: "es-MX",
    ARS: "es-AR",
    CLP: "es-CL",
    COP: "es-CO",
    AED: "ar-AE",
    SAR: "ar-SA",
    ILS: "he-IL",
    EGY: "ar-EG",
  };

  const locale = localeMap[currencyUpper] || navigator.language || "en-US";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyUpper,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch (error) {
    // Fallback if Intl.NumberFormat fails
    console.warn(`Currency formatting error for ${currencyUpper}:`, error);
    const currencySymbols = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      CAD: "C$",
      AUD: "A$",
      JPY: "¥",
      CNY: "¥",
      INR: "₹",
    };
    const symbol = currencySymbols[currencyUpper] || currencyUpper;
    if (decimals === 0) {
      return `${symbol}${Math.round(amount)}`;
    }
    return `${symbol}${amount.toFixed(decimals)}`;
  }
}

/**
 * Get current customer currency info
 * @returns {object} Currency info object or null if not initialized
 */
export function getCurrency() {
  return window.customerCurrency;
}

/**
 * Get exchange rate for a specific currency
 * @param {string} currency - Currency code
 * @returns {number} Exchange rate or 1 if not found
 */
export function getExchangeRate(currency) {
  const cc = window.customerCurrency;
  if (!cc || !cc.exchangeRates) {
    return 1;
  }
  const currencyUpper = (currency || "USD").toUpperCase();
  return cc.exchangeRates[currencyUpper] || 1;
}

/**
 * Reset detection flag for testing (internal use only)
 * @private
 */
export function _resetDetection() {
  detectionInProgress = false;
  customerCurrency = null;
}
