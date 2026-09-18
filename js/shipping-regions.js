/**
 * Shipping regions and fulfillment information for Kicked Out Of The Sky merch.
 * This is static data used to populate the Shipping & Returns policy page.
 * Do NOT fetch from API. Do NOT call Printful from the frontend.
 */

export const SHIPPING_REGIONS = [
  {
    region: "United States (Domestic)",
    shipsFrom: "Printful (US)",
    fulfillment: "Print-on-demand",
    typicalDelivery: "3–7 business days after shipping",
  },
  {
    region: "Canada",
    shipsFrom: "Printful (CA)",
    fulfillment: "Print-on-demand",
    typicalDelivery: "6–10 business days after shipping",
  },
  {
    region: "Europe",
    shipsFrom: "Printful (EU)",
    fulfillment: "Print-on-demand",
    typicalDelivery: "6–12 business days after shipping",
  },
  {
    region: "Australia & New Zealand",
    shipsFrom: "Printful (AU)",
    fulfillment: "Print-on-demand",
    typicalDelivery: "8–15 business days after shipping",
  },
  {
    region: "UK & Ireland",
    shipsFrom: "Printful (UK)",
    fulfillment: "Print-on-demand",
    typicalDelivery: "6–10 business days after shipping",
  },
  {
    region: "Rest of World",
    shipsFrom: "Printful (Various)",
    fulfillment: "Print-on-demand",
    typicalDelivery: "8–20 business days after shipping",
  },
];

/**
 * Countries and regions where we cannot ship.
 */
export const RESTRICTED_DESTINATIONS = ["Afghanistan", "Belarus", "Cuba", "Iran", "North Korea", "Russia", "Syria"];
