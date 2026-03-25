#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const SITE_URL = "https://www.kickedoutofthesky.com";
const PRODUCTS_PATH = path.join(__dirname, "../store/data/products.json");
const SITEMAP_PATH = path.join(__dirname, "../sitemap.xml");

function generateSitemap() {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, "utf-8"));

  const staticPages = [
    { loc: "/", priority: "1.0" },
    { loc: "/epk.html", priority: "0.8" },
    { loc: "/store/", priority: "0.9" },
    { loc: "/store/cart.html", priority: "0.5" },
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const page of staticPages) {
    xml += "  <url>\n";
    xml += `    <loc>${SITE_URL}${page.loc}</loc>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += "  </url>\n";
  }

  for (const product of products) {
    xml += "  <url>\n";
    xml += `    <loc>${SITE_URL}/store/product.html?key=${product.product_key}</loc>\n`;
    xml += "    <priority>0.7</priority>\n";
    xml += "  </url>\n";
  }

  xml += "</urlset>\n";

  fs.writeFileSync(SITEMAP_PATH, xml, "utf-8");
  console.log(`✅ Sitemap generated with ${staticPages.length + products.length} URLs`);
}

generateSitemap();
