#!/usr/bin/env node

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const https = require("https");

const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
// const STORE_ID = process.env.PRINTFUL_STORE_ID; // Currently unused

if (!PRINTFUL_API_KEY && require.main === module) {
  console.error("❌ Error: PRINTFUL_API_KEY not found in .env file");
  process.exit(1);
}

const API_BASE = "https://api.printful.com";
const IMAGES_DIR = path.join(__dirname, "../store/assets/images");

// Scan local mockup images directory and build a lookup map
// Naming convention: "{Product Title with / removed} - {Front|Sleeve|Back} - {Color}.jpg"
function buildLocalMockupMap() {
  const mockupMap = {};
  if (!fs.existsSync(IMAGES_DIR)) return mockupMap;

  const files = fs.readdirSync(IMAGES_DIR);
  for (const file of files) {
    // Parse: "Product Name - Placement - Color.jpg"
    const match = file.match(/^(.+?) - (Front|Sleeve|Back) - (.+)\.jpg$/i);
    if (!match) continue;
    const [, productName, placement, color] = match;
    const key = `${productName}|${color}`;
    if (!mockupMap[key]) mockupMap[key] = [];
    // Front always comes first, Sleeve/Back are secondary (in that order)
    const entry = { placement: placement.toLowerCase(), path: `assets/images/${file}` };
    if (placement.toLowerCase() === "front") {
      mockupMap[key].unshift(entry);
    } else {
      mockupMap[key].push(entry);
    }
  }
  return mockupMap;
}

// Helper to determine image index based on product type
function getImageIndex(productTitle) {
  if (productTitle.includes("Long Sleeve")) {
    // The Star + Typewriter Sleeve has product images at index 3
    if (productTitle.includes("Star")) return 3;
    // Other long sleeves use index 2
    return 2;
  }
  if (productTitle.includes("Hoodie")) return 2;
  if (productTitle.includes("Hat") || productTitle.includes("Cap")) return 1;
  if (productTitle.includes("Sticker")) return 1;
  if (productTitle.includes("Tee")) return 2; // Regular tees
  return 0; // Default fallback
}

// Helper to make API requests
function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PRINTFUL_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "kickedoutofthesky-store",
      },
    };

    const url = `${API_BASE}${endpoint}`;
    https
      .get(url, options, res => {
        let data = "";

        res.on("data", chunk => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      })
      .on("error", reject);
  });
}

// Fetch and transform products
async function fetchProducts() {
  try {
    console.log("📦 Fetching available stores...");

    // First, get available stores
    const storesResponse = await makeRequest(`/stores`);

    if (!storesResponse.result || storesResponse.result.length === 0) {
      throw new Error("No stores found. Check your API key.");
    }

    const storeId = storesResponse.result[0].id;
    const storeType = storesResponse.result[0].type;
    console.log(`✅ Using store ID: ${storeId} (Type: ${storeType})\n`);

    console.log("📦 Fetching products...");
    // Use /store/products endpoint with limit to get all products
    const listResponse = await makeRequest(`/store/products?limit=100`);

    console.log(`📋 API Response summary: Found ${listResponse.result ? listResponse.result.length : 0} products`);

    if (!listResponse.result || !Array.isArray(listResponse.result)) {
      throw new Error(`Invalid API response: result is not an array. Got: ${typeof listResponse.result}`);
    }

    // Build local mockup lookup
    const mockupMap = buildLocalMockupMap();
    console.log(`🖼️  Found ${Object.keys(mockupMap).length} local mockup entries\n`);

    // Fetch variants for each product
    const products = [];
    for (const product of listResponse.result) {
      console.log(`  📍 Fetching variants for: ${product.name} (ID: ${product.id})`);

      try {
        const variantsResponse = await makeRequest(`/store/products/${product.id}`);

        if (!variantsResponse.result || !variantsResponse.result.sync_variants) {
          console.warn(`    ⚠️  No sync_variants found for ${product.name}`);
          continue;
        }

        const variants = variantsResponse.result.sync_variants || [];
        console.log(`    📦 Found ${variants.length} variants`);

        const variantsByColor = {};
        let baseRetailPrice = null;
        let variantPreviewImage = null;
        const imageIndex = getImageIndex(product.name);

        // Group variants by color, then by size parsing the name
        // For Stickers, there are no colors, just sizes
        // For Trucker Caps, there is only one color (Black & White), and One Size
        const isSticker = product.name.includes("Sticker");
        const isTruckerCap = product.name.includes("Trucker Cap");
        const KNOWN_SIZES = /^(XS|S|M|L|XL|2XL|3XL|4XL|5XL|One Size)$/;

        variants.forEach(variant => {
          // Parse name like "Unisex Tee w/ Text / Black Heather / XS"
          // Some single-color products only have 2 parts: "Product / Size"
          const parts = variant.name.split(" / ");

          let color, size;
          if (isSticker) {
            color = "Satin"; // Default color for stickers
            size = parts[1] || "One Size";
            // Normalize sticker sizes: "2″×2″" -> "2x2", "3″×3″" -> "3x3"
            size = size.replace(/″×″/g, "x").replace(/″/g, "").replace(/×/g, "x");
          } else if (isTruckerCap) {
            color = "Black & White"; // Trucker Cap is always Black & White
            size = parts[1] || "One Size";
          } else if (parts.length === 2 && KNOWN_SIZES.test(parts[1])) {
            // Single-color product: "Product Name / Size"
            color = "Black";
            size = parts[1];
          } else {
            // Multi-color product: "Product Name / Color / Size"
            color = parts[1] || "Default";
            size = parts[2] || "One Size";
          }

          if (!variantsByColor[color]) {
            variantsByColor[color] = {
              image: null,
              sizes: {},
            };
          }

          variantsByColor[color].sizes[size] = {
            variant_id: variant.id,
            price_cents: variant.retail_price ? Math.round(parseFloat(variant.retail_price) * 100) : null,
          };

          // Capture first variant's retail price for display
          if (!baseRetailPrice && variant.retail_price) {
            baseRetailPrice = variant.retail_price;
          }

          // Log all available images for this variant
          if (variant.files && variant.files.length > 0) {
            console.log(`      📸 ${variant.name}:`);
            variant.files.forEach((file, idx) => {
              console.log(`         [${idx}] ${file.preview_url}`);
            });
          }

          // Capture Printful image for this color at the correct index
          if (!variantsByColor[color].image && variant.files && variant.files.length > imageIndex) {
            variantsByColor[color].image = variant.files[imageIndex].preview_url;
          }

          // Capture first variant's preview image if available
          if (!variantPreviewImage && variant.files && variant.files.length > imageIndex) {
            variantPreviewImage = variant.files[imageIndex].preview_url;
          }
        });

        // Map local mockup images to each color variant
        // Product title in filenames has "/" removed
        const mockupTitle = product.name.replace(/\//g, "");
        for (const [color, colorData] of Object.entries(variantsByColor)) {
          const key = `${mockupTitle}|${color.replace(/\//g, "")}`;
          const localMockups = mockupMap[key];
          if (localMockups && localMockups.length > 0) {
            // Use local front mockup as the main image, keep Printful as fallback
            colorData.mockups = localMockups.map(m => m.path);
            const frontMockup = localMockups.find(m => m.placement === "front");
            if (frontMockup) {
              colorData.image = frontMockup.path;
            }
            console.log(`    🖼️  ${color}: ${localMockups.length} local mockup(s)`);
          }
        }

        const displayPrice = baseRetailPrice ? `$${parseFloat(baseRetailPrice).toFixed(2)}` : "Contact for Price";

        // For main product image, prefer the first color's local mockup
        const firstColor = Object.keys(variantsByColor)[0];
        const firstColorData = variantsByColor[firstColor];
        let mainImage;
        if (firstColorData?.mockups?.length > 0) {
          mainImage = firstColorData.mockups[0];
        } else if (isTruckerCap) {
          mainImage = variantPreviewImage || product.thumbnail_url || "/store/assets/images/placeholder.png";
        } else {
          mainImage = product.thumbnail_url || variantPreviewImage || "/store/assets/images/placeholder.png";
        }

        const productData = {
          product_key: `product_${product.id}`,
          title: product.name,
          image: mainImage,
          display_price: displayPrice,
          variants: variantsByColor,
        };

        products.push(productData);
        console.log(`    ✅ Added ${Object.keys(variantsByColor).length} color(s)`);
      } catch (error) {
        console.error(`    ❌ Error fetching variants for ${product.name}:`, error.message);
      }
    }

    console.log(`\n✅ Found ${products.length} products with variants`);

    // Sort products: Tees, Long Sleeve, Hoodie, Sweatshirt (each: Color, Cover, other, Vintage), Hats, Stickers
    products.sort((a, b) => {
      const getCategory = title => {
        if (title.includes("Hat") || title.includes("Cap")) return 50;
        if (title.includes("Sticker")) return 60;

        // Apply consistent sorting: Color, Cover, Other, Vintage for each type
        if (title.includes("Long Sleeve")) {
          if (title.includes("Color")) return 21;
          if (title.includes("Cover")) return 22;
          if (title.includes("Vintage")) return 24;
          return 23;
        }
        if (title.includes("Hoodie")) {
          if (title.includes("Color")) return 31;
          if (title.includes("Cover")) return 32;
          if (title.includes("Vintage")) return 34;
          return 33;
        }
        if (title.includes("Crewneck") || title.includes("Sweatshirt")) {
          if (title.includes("Color")) return 41;
          if (title.includes("Cover")) return 42;
          if (title.includes("Vintage")) return 44;
          return 43;
        }
        if (title.includes("Tee")) {
          if (title.includes("Color")) return 11;
          if (title.includes("Cover")) return 12;
          if (title.includes("Vintage")) return 14;
          return 13;
        }
        return 70;
      };
      return getCategory(a.title) - getCategory(b.title);
    });

    // Write to products.json
    const outputPath = path.join(__dirname, "../store/data/products.json");
    fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
    console.log(`💾 Saved to ${outputPath}`);

    return products;
  } catch (error) {
    console.error("❌ Error fetching products:", error.message);
    process.exit(1);
  }
}

// Run only when executed directly (not when imported for testing)
if (require.main === module) {
  fetchProducts();
}

module.exports = { getImageIndex, buildLocalMockupMap };
