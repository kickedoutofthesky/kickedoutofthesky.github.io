/**
 * Multi-Currency Utility Module
 * Handles currency detection, price conversion, and locale-aware formatting
 */

let customerCurrency = null;

/**
 * Initialize currency from geo-location API
 * Calls /api/geo to detect customer's country and currency
 */
export async function initializeCurrency() {
  try {
    const backendUrl = window.__API_URL__ || "https://api.kickedoutofthesky.com";
    const response = await fetch(`${backendUrl}/api/geo`);
    const geoData = await response.json();

    customerCurrency = {
      country: geoData.country,
      currency: geoData.currency,
      exchangeRates: geoData.exchangeRates,
      vatRate: geoData.vatRate,
      isEU: geoData.isEU,
    };

    // Store globally for access from other modules
    window.customerCurrency = customerCurrency;
    console.log(`✓ Currency initialized: ${geoData.country} → ${geoData.currency}`);

    return customerCurrency;
  } catch (error) {
    console.error("✗ Failed to detect currency, falling back to USD:", error);
    customerCurrency = {
      country: "US",
      currency: "USD",
      exchangeRates: { USD: 1.0 },
      vatRate: 0,
      isEU: false,
    };
    window.customerCurrency = customerCurrency;
    return customerCurrency;
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
