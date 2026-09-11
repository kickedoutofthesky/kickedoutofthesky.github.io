const http = require("http");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });
require("dotenv").config(); // Falls back to .env if .env.local doesn't exist

const PORT = process.env.PORT || 3000;
const BASE_DIR = __dirname;

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  // Normalize URL and remove query strings
  let filePath = decodeURIComponent(parsedUrl.pathname);

  // Prevent directory traversal
  filePath = path.normalize(filePath);
  if (filePath.includes("..")) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // Serve main index by default for root
  if (filePath === "/") {
    filePath = "/index.html";
  }

  // Try to serve the requested file
  const fullPath = path.join(BASE_DIR, filePath);

  fs.stat(fullPath, (err, stats) => {
    if (err && err.code !== "ENOENT") {
      res.writeHead(500);
      res.end("Server Error");
      console.error(`Error: ${err.message}`);
      return;
    }

    // If it's a directory, try index.html
    if (!err && stats.isDirectory()) {
      // Redirect to trailing slash if needed
      if (!req.url.endsWith("/")) {
        res.writeHead(301, { Location: req.url + "/" });
        res.end();
        return;
      }
      const indexPath = path.join(fullPath, "index.html");
      fs.stat(indexPath, (indexErr, indexStats) => {
        if (indexErr || !indexStats.isFile()) {
          res.writeHead(404);
          res.end(`Not Found: ${filePath}`);
          console.log(`⚠️  404: ${filePath}`);
          return;
        }
        serveFile(indexPath, res);
      });
      return;
    }

    // If file exists, serve it
    if (!err && stats.isFile()) {
      serveFile(fullPath, res);
      return;
    }

    // Try adding .html extension
    const htmlPath = fullPath + ".html";
    fs.stat(htmlPath, (htmlErr, htmlStats) => {
      if (htmlErr || !htmlStats.isFile()) {
        res.writeHead(404);
        res.end(`Not Found: ${filePath}`);
        console.log(`⚠️  404: ${filePath}`);
        return;
      }
      serveFile(htmlPath, res);
    });
  });

  function serveFile(file, response) {
    const ext = path.extname(file).toLowerCase();
    const mimeType = mimeTypes[ext] || "application/octet-stream";

    fs.readFile(file, (err, data) => {
      if (err) {
        response.writeHead(500);
        response.end("Server Error");
        console.error(`Error reading file ${file}:`, err);
        return;
      }

      // Inject dynamic OG tags for store page with ?type= filter
      if (file.endsWith(path.join("store", "index.html")) && parsedUrl.searchParams.has("type")) {
        const type = parsedUrl.searchParams.get("type");
        try {
          const productsPath = path.join(BASE_DIR, "store", "data", "products.json");
          const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));
          const categoryLabels = {
            tees: "Tees",
            "long-sleeve": "Long Sleeve Tees",
            hoodies: "Hoodies",
            sweatshirts: "Sweatshirts",
            hats: "Hats",
            stickers: "Stickers",
          };
          const label = categoryLabels[type];
          if (label) {
            const getCategory = title => {
              const t = title.toLowerCase();
              if (t.includes("sticker")) return "stickers";
              if (t.includes("hoodie")) return "hoodies";
              if (t.includes("sweatshirt") || t.includes("crewneck")) return "sweatshirts";
              if (t.includes("long sleeve")) return "long-sleeve";
              if (t.includes("snapback") || t.includes("trucker") || t.includes("cap") || t.includes("hat"))
                return "hats";
              if (t.includes("tee")) return "tees";
              return "other";
            };
            const firstProduct = products.find(p => getCategory(p.title) === type);
            if (firstProduct) {
              const ogTitle = `${label} - Kicked Out Of The Sky Merch`;
              const ogDesc = `Shop ${label} from Kicked Out Of The Sky.`;
              const ogImage = firstProduct.image.startsWith("http")
                ? firstProduct.image
                : `https://www.kickedoutofthesky.com/store/${firstProduct.image}`;
              let html = data.toString();
              html = html.replace(
                /<meta\s+property="og:title"[\s\S]*?\/?>/,
                `<meta property="og:title" content="${ogTitle}" />`
              );
              html = html.replace(
                /<meta\s+property="og:image"[\s\S]*?\/?>/,
                `<meta property="og:image" content="${ogImage}" />`
              );
              html = html.replace(
                /<meta\s+property="og:description"[\s\S]*?\/?>/,
                `<meta property="og:description" content="${ogDesc}" />`
              );
              html = html.replace(
                /<meta\s+name="twitter:title"[\s\S]*?\/?>/,
                `<meta name="twitter:title" content="${ogTitle}" />`
              );
              html = html.replace(
                /<meta\s+name="twitter:description"[\s\S]*?\/>/,
                `<meta name="twitter:description" content="${ogDesc}" />`
              );
              response.writeHead(200, { "Content-Type": mimeType });
              response.end(html);
              console.log(`✅ ${req.url} (${mimeType}) [OG: ${label}]`);
              return;
            }
          }
        } catch (ogErr) {
          console.error("OG tag injection error:", ogErr.message);
        }
      }

      // Inject dynamic OG tags for product detail page with ?key= param
      if (file.endsWith(path.join("store", "product.html")) && parsedUrl.searchParams.has("key")) {
        const key = parsedUrl.searchParams.get("key");
        try {
          const productsPath = path.join(BASE_DIR, "store", "data", "products.json");
          const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));
          const product = products.find(p => p.product_key === key);
          if (product) {
            const ogTitle = `${product.title} - Kicked Out Of The Sky`;
            const ogDesc = `Shop ${product.title}. Official Kicked Out Of The Sky merchandise.`;
            const ogImage = product.image.startsWith("http")
              ? product.image
              : `https://www.kickedoutofthesky.com/store/${encodeURI(product.image)}`;
            const ogUrl = `https://www.kickedoutofthesky.com/store/p/${product.product_key}/`;
            let html = data.toString();
            html = html.replace(
              /<meta\s+property="og:title"[\s\S]*?\/?>/,
              `<meta property="og:title" content="${ogTitle}" />`
            );
            html = html.replace(
              /<meta\s+property="og:image"[\s\S]*?\/?>/,
              `<meta property="og:image" content="${ogImage}" />`
            );
            html = html.replace(
              /<meta\s+property="og:description"[\s\S]*?\/?>/,
              `<meta property="og:description" content="${ogDesc}" />`
            );
            html = html.replace(
              /<meta\s+property="og:url"[\s\S]*?\/?>/,
              `<meta property="og:url" content="${ogUrl}" />`
            );
            html = html.replace(
              /<meta\s+name="twitter:title"[\s\S]*?\/?>/,
              `<meta name="twitter:title" content="${ogTitle}" />`
            );
            html = html.replace(
              /<meta\s+name="twitter:description"[\s\S]*?\/?>/,
              `<meta name="twitter:description" content="${ogDesc}" />`
            );
            response.writeHead(200, { "Content-Type": mimeType });
            response.end(html);
            console.log(`✅ ${req.url} (${mimeType}) [OG: ${product.title}]`);
            return;
          }
        } catch (ogErr) {
          console.error("Product OG tag injection error:", ogErr.message);
        }
      }

      // Inject dynamic OG tags for release pages (/listen and /[slug])
      const isListenPage = file.endsWith(path.join("listen", "index.html"));
      const isReleasePage = /\/[a-z]+\/index\.html$/.test(file) && !file.includes("store") && !file.includes("/listen");

      if ((isListenPage || isReleasePage) && !file.includes("node_modules")) {
        try {
          const releasesPath = path.join(BASE_DIR, "data", "releases.json");
          const releasesData = JSON.parse(fs.readFileSync(releasesPath, "utf8"));

          // Determine which release to show
          let releaseSlug = releasesData.current;
          if (isReleasePage) {
            // Extract slug from path like /betterpartofme/
            const match = file.match(/\/([a-z-]+)\/index\.html$/);
            if (match) {
              releaseSlug = match[1];
            }
          }

          const release = releasesData.releases.find(r => r.slug === releaseSlug);
          if (release) {
            const ogTitle = `${release.title} - Kicked Out Of The Sky`;
            const ogDesc = `Stream ${release.title} by ${release.artist}. Out ${release.releaseDate.replace(/(\d{4})-(\d{2})-(\d{2})/, "$3/$2/$1")}.`;
            const ogImageCard = release.coverImageCard.startsWith("http")
              ? release.coverImageCard
              : `https://www.kickedoutofthesky.com${release.coverImageCard}`;
            const ogUrl = isListenPage
              ? `https://www.kickedoutofthesky.com/${release.slug}/`
              : `https://www.kickedoutofthesky.com${req.url.replace(/\/$/, "") || req.url}/`;

            let html = data.toString();
            html = html.replace(
              /<meta\s+property="og:title"[\s\S]*?\/?>/,
              `<meta property="og:title" content="${ogTitle}" />`
            );
            html = html.replace(
              /<meta\s+property="og:description"[\s\S]*?\/?>/,
              `<meta property="og:description" content="${ogDesc}" />`
            );
            html = html.replace(
              /<meta\s+property="og:image"[\s\S]*?\/?>/,
              `<meta property="og:image" content="${ogImageCard}" />`
            );
            html = html.replace(
              /<meta\s+property="og:url"[\s\S]*?\/?>/,
              `<meta property="og:url" content="${ogUrl}" />`
            );
            html = html.replace(
              /<meta\s+name="twitter:title"[\s\S]*?\/?>/,
              `<meta name="twitter:title" content="${ogTitle}" />`
            );
            html = html.replace(
              /<meta\s+name="twitter:description"[\s\S]*?\/?>/,
              `<meta name="twitter:description" content="${ogDesc}" />`
            );
            html = html.replace(
              /<meta\s+name="twitter:image"[\s\S]*?\/?>/,
              `<meta name="twitter:image" content="${ogImageCard}" />`
            );

            response.writeHead(200, { "Content-Type": mimeType });
            response.end(html);
            console.log(`✅ ${req.url} (${mimeType}) [Release: ${release.title}]`);
            return;
          }
        } catch (ogErr) {
          console.error("Release OG tag injection error:", ogErr.message);
        }
      }

      response.writeHead(200, { "Content-Type": mimeType });
      response.end(data);
      console.log(`✅ ${req.url} (${mimeType})`);
    });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`
🚀 Development Server Running
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Local:   http://localhost:${PORT}
📍 Store:   http://localhost:${PORT}/store
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Press Ctrl+C to stop
`);
});

// Handle server errors
server.on("error", err => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down server...");
  server.close(() => {
    console.log("✅ Server stopped");
    process.exit(0);
  });
});
