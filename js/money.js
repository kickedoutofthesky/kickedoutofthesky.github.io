/**
 * USD Price Formatter
 * Single, canonical function for formatting all prices as USD.
 * Locale is hardcoded to en-US to ensure consistent display worldwide.
 */

/**
 * Format cents as USD with required " USD" suffix.
 *
 * @param {number} cents - Price in USD cents (e.g., 3400 = $34.00)
 * @returns {string} Formatted price like "$34.00 USD"
 *
 * Examples:
 *   formatUSD(2500) === "$25.00 USD"
 *   formatUSD(3400) === "$34.00 USD"
 *   formatUSD(1) === "$0.01 USD"
 */
export function formatUSD(cents) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(cents / 100) + " USD";
}

/**
 * Disclaimer note about USD pricing and duties/VAT.
 * Constant to ensure consistency across the entire site.
 */
export const PRICE_DISCLAIMER =
  "Prices in USD. Orders outside the US may be subject to import duties or VAT charged on delivery.";

/**
 * HTML version of disclaimer with link to shipping page.
 * Used in cart, product, and other locations where we want to link to details.
 */
export const PRICE_DISCLAIMER_WITH_LINK =
  'Prices in USD. Orders outside the US may be subject to <a href="/legal/shipping-policy.html#duties" style="color: inherit; text-decoration: underline;">import duties or VAT</a> charged on delivery.';
