#!/usr/bin/env node

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const https = require("https");

const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
// const STORE_ID = process.env.PRINTFUL_STORE_ID; // Currently unused

if (!PRINTFUL_API_KEY) {
  console.error("❌ Error: PRINTFUL_API_KEY not found in .env file");
  process.exit(1);
}

const API_BASE = "https://api.printful.com";

// Helper to determine image index based on product type
function getImageIndex(productTitle) {
  if (productTitle.includes("Long Sleeve")) return 3;
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
    // Use /store/products endpoint
    const listResponse = await makeRequest(`/store/products`);

    console.log(`📋 API Response: ${JSON.stringify(listResponse, null, 2)}`);

    if (!listResponse.result || !Array.isArray(listResponse.result)) {
      throw new Error(`Invalid API response: result is not an array. Got: ${typeof listResponse.result}`);
    }

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
        variants.forEach(variant => {
          // Parse name like "Unisex Tee w/ Text / Black Heather / XS"
          const parts = variant.name.split(" / ");
          const color = parts[1] || "Default";
          const size = parts[2] || "One Size";

          if (!variantsByColor[color]) {
            variantsByColor[color] = {
              image: null,
              sizes: {},
            };
          }

          variantsByColor[color].sizes[size] = {
            variant_id: variant.id,
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

          // Capture image for this color at the correct index
          if (!variantsByColor[color].image && variant.files && variant.files.length > imageIndex) {
            variantsByColor[color].image = variant.files[imageIndex].preview_url;
          }

          // Capture first variant's preview image if available
          if (!variantPreviewImage && variant.files && variant.files.length > imageIndex) {
            variantPreviewImage = variant.files[imageIndex].preview_url;
          }
        });

        const displayPrice = baseRetailPrice ? `$${parseFloat(baseRetailPrice).toFixed(2)}` : "Contact for Price";

        const productData = {
          product_key: `product_${product.id}`,
          title: product.name,
          image: variantPreviewImage || product.thumbnail_url || "/store/assets/images/placeholder.png",
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

    // Sort products: Tees, Hats, Long Sleeve, Hoodie, Stickers
    products.sort((a, b) => {
      const getCategory = title => {
        if (title.includes("Long Sleeve")) return 3;
        if (title.includes("Hoodie")) return 4;
        if (title.includes("Hat") || title.includes("Cap")) return 2;
        if (title.includes("Sticker")) return 5;
        if (title.includes("Tee")) return 1;
        return 6;
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

// Run
fetchProducts();
