// Product Fetch Tests
// Tests for fetching and transforming product data from Printful
const { getImageIndex } = require("../../../scripts/fetch-printful-products");

describe("Product Fetch & Transform", () => {
  describe("getImageIndex", () => {
    test("should return correct image index for long sleeves", () => {
      expect(getImageIndex("Unisex Long Sleeve Tee w/ Typewriter Text")).toBe(2);
      expect(getImageIndex("Unisex Long Sleeve Tee w/ Star + Typewriter Sleeve")).toBe(3);
    });

    test("should return correct image index for hoodies", () => {
      expect(getImageIndex("Unisex Hoodie w/ Text")).toBe(2);
    });

    test("should return correct image index for stickers", () => {
      expect(getImageIndex("Die-cut Sticker w/ Text")).toBe(1);
    });

    test("should return correct image index for regular tees", () => {
      expect(getImageIndex("Unisex Tee w/ Text")).toBe(2);
    });
  });
});
