const fs = require("fs");
const path = require("path");

const productsPath = path.join(__dirname, "../store/data/products.json");

// Garment specifications by type
const garmentSpecs = {
  tee: {
    name: "Unisex T-shirt",
    material: "100% combed and ring-spun cotton",
    weight: "6 oz/yd² (203 g/m²)",
    fit: "Unisex",
    features: ["Side-seamed construction", "Tear away tag", "Preshrunk fabric", "Comfortable classic fit"],
    care: "Machine wash cold with like colors. Tumble dry low. Avoid bleach.",
  },
  "long-sleeve": {
    name: "Unisex Long Sleeve T-shirt",
    material: "100% combed and ring-spun cotton",
    weight: "6 oz/yd² (203 g/m²)",
    fit: "Unisex",
    features: [
      "Side-seamed construction",
      "Tear away tag",
      "Preshrunk fabric",
      "Comfortable classic fit with full-length sleeves",
    ],
    care: "Machine wash cold with like colors. Tumble dry low. Avoid bleach.",
  },
  hoodie: {
    name: "Unisex Hoodie",
    material: "80% combed and ring-spun cotton, 20% polyester",
    weight: "9 oz/yd² (305 g/m²)",
    fit: "Unisex",
    features: [
      "Double-lined drawcord hood",
      "Front pouch pocket",
      "Tear away tag",
      "Preshrunk fabric",
      "Comfortable warmth and style",
    ],
    care: "Machine wash cold with like colors. Tumble dry low. Avoid bleach.",
  },
  sweatshirt: {
    name: "Unisex Crewneck Sweatshirt",
    material: "80% combed and ring-spun cotton, 20% polyester",
    weight: "9 oz/yd² (305 g/m²)",
    fit: "Unisex",
    features: ["Crew neckline", "Tear away tag", "Preshrunk fabric", "Classic comfortable fit"],
    care: "Machine wash cold with like colors. Tumble dry low. Avoid bleach.",
  },
  snapback: {
    name: "Snapback Cap",
    material: "100% cotton twill",
    fit: "One size fits most",
    features: ["Structured 6-panel cap", "Adjustable snapback closure", "Curved bill", "Embroidered design"],
    care: "Spot clean or hand wash. Air dry.",
  },
  trucker: {
    name: "Trucker Cap",
    material: "100% cotton twill front, mesh back panels",
    fit: "One size fits most",
    features: [
      "6-panel trucker style",
      "Mesh back for breathability",
      "Adjustable snapback closure",
      "Curved bill",
      "Embroidered design",
    ],
    care: "Spot clean or hand wash. Air dry.",
  },
  sticker: {
    name: "Die-cut Vinyl Sticker",
    material: "Weather-resistant vinyl",
    features: [
      "Die-cut shape",
      "Weather-resistant and durable",
      "UV-resistant inks",
      "Dishwasher safe",
      "Works on laptops, water bottles, cars, etc.",
    ],
    care: "Clean surface before applying. Apply firmly. Do not use abrasive cleaners.",
  },
};

function getProductType(title) {
  const titleLower = title.toLowerCase();

  if (titleLower.includes("hoodie")) return "hoodie";
  if (titleLower.includes("crewneck sweatshirt")) return "sweatshirt";
  if (titleLower.includes("long sleeve")) return "long-sleeve";
  if (titleLower.includes("trucker cap")) return "trucker";
  if (titleLower.includes("snapback hat")) return "snapback";
  if (titleLower.includes("die-cut sticker")) return "sticker";
  if (titleLower.includes("tee")) return "tee";

  return null;
}

function addGarmentInfo() {
  try {
    const data = fs.readFileSync(productsPath, "utf8");
    let products = JSON.parse(data);

    let updatedCount = 0;
    let skippedCount = 0;

    products = products.map(product => {
      // Skip if garment field already exists
      if (product.garment) {
        skippedCount++;
        return product;
      }

      const productType = getProductType(product.title);

      if (productType && garmentSpecs[productType]) {
        product.garment = garmentSpecs[productType];
        updatedCount++;
        console.log(`✓ Added garment info to: ${product.title}`);
      } else {
        skippedCount++;
        console.log(`⚠ Could not determine type for: ${product.title}`);
      }

      return product;
    });

    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    console.log(`\n✓ Updated ${updatedCount} products with garment information`);
    console.log(`⚠ Skipped ${skippedCount} products`);
    console.log(`✓ File saved: ${productsPath}`);
  } catch (error) {
    console.error("Error processing products.json:", error);
    process.exit(1);
  }
}

addGarmentInfo();
