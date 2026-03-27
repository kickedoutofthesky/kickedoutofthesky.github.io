#!/usr/bin/env node
/**
 * Generate static OG (Open Graph) pages for social sharing.
 *
 * GitHub Pages is static — crawlers (Facebook, iMessage, Slack, etc.)
 * don't run JavaScript, so they only see the HTML meta tags.
 * This script generates lightweight HTML pages with correct OG tags
 * and an instant redirect to the real page.
 *
 * Generated pages:
 *   store/p/{product_key}/index.html  — per-product OG pages
 *
 * Usage: node scripts/generate-og-pages.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PRODUCTS_PATH = path.join(ROOT, "store", "data", "products.json");
const BASE_URL = "https://www.kickedoutofthesky.com";

const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, "utf8"));

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getImageUrl(imagePath) {
  if (imagePath.startsWith("http")) return imagePath;
  // Encode spaces and special chars for URL
  const encoded = imagePath
    .split("/")
    .map(seg => encodeURIComponent(seg))
    .join("/");
  return `${BASE_URL}/store/${encoded}`;
}

function buildPage({ title, description, url, imageUrl, redirectUrl }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${safeTitle}</title>
<meta property="og:type" content="product" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDesc}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${imageUrl}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDesc}" />
<meta name="twitter:image" content="${imageUrl}" />
<link rel="canonical" href="${redirectUrl}" />
<meta http-equiv="refresh" content="0;url=${redirectUrl}" />
</head>
<body>
<script>window.location.replace("${redirectUrl}");</script>
<p>Redirecting to <a href="${redirectUrl}">${safeTitle}</a>...</p>
</body>
</html>`;
}

let generated = 0;

// Generate per-product pages: store/p/{product_key}/index.html
for (const product of products) {
  if (!product.product_key || !product.image) continue;

  const dir = path.join(ROOT, "store", "p", product.product_key);
  fs.mkdirSync(dir, { recursive: true });

  const imageUrl = getImageUrl(product.image);
  const redirectUrl = `${BASE_URL}/store/product.html?key=${product.product_key}`;
  const shareUrl = `${BASE_URL}/store/p/${product.product_key}/`;

  const html = buildPage({
    title: `${product.title} - Kicked Out of the Sky`,
    description: `Shop ${product.title}. Official Kicked Out of the Sky merchandise.`,
    url: shareUrl,
    imageUrl,
    redirectUrl,
  });

  fs.writeFileSync(path.join(dir, "index.html"), html);
  generated++;
}

console.log(`✅ Generated ${generated} product OG pages in store/p/`);
