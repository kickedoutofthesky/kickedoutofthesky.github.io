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
  // Normalize URL and remove query strings
  let filePath = decodeURIComponent(req.url.split("?")[0]);

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

      response.writeHead(200, { "Content-Type": mimeType });
      response.end(data);
      console.log(`✅ ${req.url} (${mimeType})`);
    });
  }
});

server.listen(PORT, () => {
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
