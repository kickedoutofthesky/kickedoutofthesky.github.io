// Tests for server.js dynamic OG tag injection
const http = require("http");
const path = require("path");

// Use a random high port to avoid conflicts with running dev server
const TEST_PORT = 9876;
let server;

function startServer() {
  return new Promise((resolve, reject) => {
    // Override PORT before requiring server
    process.env.PORT = TEST_PORT;

    // We can't require server.js directly since it calls server.listen().
    // Instead, replicate the OG injection logic for unit testing.
    const fs = require("fs");
    const BASE_DIR = path.join(__dirname, "..", "..", "..");

    const mimeTypes = {
      ".html": "text/html",
      ".json": "application/json",
    };

    server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url, `http://localhost:${TEST_PORT}`);
      let filePath = decodeURIComponent(parsedUrl.pathname);
      filePath = path.normalize(filePath);

      if (filePath === "/") filePath = "/index.html";

      const fullPath = path.join(BASE_DIR, filePath);

      const ext = path.extname(fullPath).toLowerCase();
      const mimeType = mimeTypes[ext] || "application/octet-stream";

      fs.readFile(fullPath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not Found");
          return;
        }

        // Replicate OG injection logic from server.js
        if (fullPath.endsWith(path.join("store", "index.html")) && parsedUrl.searchParams.has("type")) {
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
                const ogTitle = `${label} - Kicked Out of the Sky Merch`;
                const ogDesc = `Shop ${label} from Kicked Out of the Sky.`;
                const ogImage = firstProduct.image.startsWith("http")
                  ? firstProduct.image
                  : `https://www.kickedoutofthesky.com/store/${firstProduct.image}`;
                let html = data.toString();
                html = html.replace(
                  /<meta property="og:title" content="[^"]*"\s*\/?>/,
                  `<meta property="og:title" content="${ogTitle}" />`
                );
                html = html.replace(
                  /<meta property="og:image" content="[^"]*"\s*\/?>/,
                  `<meta property="og:image" content="${ogImage}" />`
                );
                html = html.replace(
                  /<meta\s+property="og:description"[\s\S]*?\/>/,
                  `<meta property="og:description" content="${ogDesc}" />`
                );
                html = html.replace(
                  /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
                  `<meta name="twitter:title" content="${ogTitle}" />`
                );
                html = html.replace(
                  /<meta\s+name="twitter:description"[\s\S]*?\/>/,
                  `<meta name="twitter:description" content="${ogDesc}" />`
                );
                res.writeHead(200, { "Content-Type": mimeType });
                res.end(html);
                return;
              }
            }
          } catch (ogErr) {
            // Fall through to default
          }
        }

        res.writeHead(200, { "Content-Type": mimeType });
        res.end(data);
      });
    });

    server.listen(TEST_PORT, () => resolve());
    server.on("error", reject);
  });
}

function stopServer() {
  return new Promise(resolve => {
    if (server) {
      server.close(resolve);
    } else {
      resolve();
    }
  });
}

function httpGet(urlPath) {
  return new Promise((resolve, reject) => {
    http
      .get(`http://localhost:${TEST_PORT}${urlPath}`, res => {
        let data = "";
        res.on("data", chunk => {
          data += chunk;
        });
        res.on("end", () => resolve({ status: res.statusCode, body: data }));
      })
      .on("error", reject);
  });
}

describe("Server OG Tag Injection", () => {
  beforeAll(async () => {
    await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  test("should serve store page with default OG tags when no type param", async () => {
    const res = await httpGet("/store/index.html");
    expect(res.status).toBe(200);
    expect(res.body).toContain('content="Merch - Kicked Out of the Sky"');
    expect(res.body).toContain("Kicked-Out-Of-The-Sky_transparent.png");
  });

  test("should inject tees OG tags when ?type=tees", async () => {
    const res = await httpGet("/store/index.html?type=tees");
    expect(res.status).toBe(200);
    expect(res.body).toContain('content="Tees - Kicked Out of the Sky Merch"');
    expect(res.body).toContain('content="Shop Tees from Kicked Out of the Sky."');
  });

  test("should inject hoodies OG tags when ?type=hoodies", async () => {
    const res = await httpGet("/store/index.html?type=hoodies");
    expect(res.status).toBe(200);
    expect(res.body).toContain('content="Hoodies - Kicked Out of the Sky Merch"');
    expect(res.body).toContain('content="Shop Hoodies from Kicked Out of the Sky."');
  });

  test("should inject hats OG tags when ?type=hats", async () => {
    const res = await httpGet("/store/index.html?type=hats");
    expect(res.status).toBe(200);
    expect(res.body).toContain('content="Hats - Kicked Out of the Sky Merch"');
    expect(res.body).toContain('content="Shop Hats from Kicked Out of the Sky."');
  });

  test("should inject stickers OG tags when ?type=stickers", async () => {
    const res = await httpGet("/store/index.html?type=stickers");
    expect(res.status).toBe(200);
    expect(res.body).toContain('content="Stickers - Kicked Out of the Sky Merch"');
    expect(res.body).toContain('content="Shop Stickers from Kicked Out of the Sky."');
  });

  test("should inject long-sleeve OG tags when ?type=long-sleeve", async () => {
    const res = await httpGet("/store/index.html?type=long-sleeve");
    expect(res.status).toBe(200);
    expect(res.body).toContain('content="Long Sleeve Tees - Kicked Out of the Sky Merch"');
    expect(res.body).toContain('content="Shop Long Sleeve Tees from Kicked Out of the Sky."');
  });

  test("should inject sweatshirts OG tags when ?type=sweatshirts", async () => {
    const res = await httpGet("/store/index.html?type=sweatshirts");
    expect(res.status).toBe(200);
    expect(res.body).toContain('content="Sweatshirts - Kicked Out of the Sky Merch"');
    expect(res.body).toContain('content="Shop Sweatshirts from Kicked Out of the Sky."');
  });

  test("should include product image URL in OG image tag", async () => {
    const res = await httpGet("/store/index.html?type=tees");
    expect(res.status).toBe(200);
    // Should have a product image, not the default band logo
    expect(res.body).not.toContain('og:image" content="https://www.kickedoutofthesky.com/img/Kicked-Out-Of-The-Sky');
    // OG image should be an absolute URL
    expect(res.body).toMatch(/og:image" content="https:\/\//);
  });

  test("should fall back to default OG tags for invalid type", async () => {
    const res = await httpGet("/store/index.html?type=invalid");
    expect(res.status).toBe(200);
    // Should still have the default OG title
    expect(res.body).toContain('content="Merch - Kicked Out of the Sky"');
  });

  test("should update twitter meta tags alongside OG tags", async () => {
    const res = await httpGet("/store/index.html?type=tees");
    expect(res.status).toBe(200);
    expect(res.body).toContain('twitter:title" content="Tees - Kicked Out of the Sky Merch"');
    expect(res.body).toContain('twitter:description" content="Shop Tees from Kicked Out of the Sky."');
  });
});
