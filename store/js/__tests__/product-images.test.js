const fs = require("fs");
const path = require("path");

describe("Product Images", () => {
  let products;
  let imageFiles;

  beforeAll(() => {
    const productsPath = path.join(__dirname, "../../data/products.json");
    const imagesDir = path.join(__dirname, "../../../store/assets/images");

    products = JSON.parse(fs.readFileSync(productsPath, "utf8"));
    imageFiles = fs.readdirSync(imagesDir);
  });

  test("all products have mockup images defined", () => {
    const missingMockups = [];

    products.forEach(product => {
      Object.entries(product.variants).forEach(([color, variantData]) => {
        const mockups = variantData.mockups || [];

        if (mockups.length === 0) {
          missingMockups.push(`${product.title} (${color})`);
        }
      });
    });

    expect(missingMockups).toEqual([]);
  });

  test("all mockup images exist in file system", () => {
    const missingFiles = [];

    products.forEach(product => {
      Object.entries(product.variants).forEach(([color, variantData]) => {
        const mockups = variantData.mockups || [];

        mockups.forEach(mockupPath => {
          const filename = path.basename(mockupPath);
          if (!imageFiles.includes(filename)) {
            missingFiles.push({
              product: product.title,
              color,
              file: filename,
            });
          }
        });
      });
    });

    expect(missingFiles).toEqual([]);
  });

  test("products catalog is complete", () => {
    expect(products.length).toBeGreaterThan(0);
    expect(products.length).toBe(45);
  });

  test("all product variants have at least one mockup", () => {
    let totalVariants = 0;
    let variantsWithMockups = 0;

    products.forEach(product => {
      Object.entries(product.variants).forEach(([_color, variantData]) => {
        totalVariants += 1;
        const mockups = variantData.mockups || [];
        if (mockups.length > 0) {
          variantsWithMockups += 1;
        }
      });
    });

    expect(variantsWithMockups).toBe(totalVariants);
  });
});
