// Tests for server.js dynamic OG tag injection.
// Spawns the real dev server (server.js) on a test port and inspects its responses.
const http = require("http");
const path = require("path");
const { spawn } = require("child_process");

// Use a high port to avoid conflicts with a running dev server
const TEST_PORT = 9876;
const SERVER_PATH = path.join(__dirname, "..", "..", "..", "server.js");
let serverProcess;

function startServer() {
  return new Promise((resolve, reject) => {
    serverProcess = spawn(process.execPath, [SERVER_PATH], {
      cwd: path.dirname(SERVER_PATH),
      env: { ...process.env, PORT: String(TEST_PORT) },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    const timeout = setTimeout(() => reject(new Error(`server.js did not start in time. ${stderr}`)), 10000);

    serverProcess.stdout.on("data", chunk => {
      if (chunk.toString().includes("Development Server Running")) {
        clearTimeout(timeout);
        resolve();
      }
    });
    serverProcess.stderr.on("data", chunk => {
      stderr += chunk.toString();
    });
    serverProcess.on("exit", code => {
      clearTimeout(timeout);
      reject(new Error(`server.js exited early with code ${code}. ${stderr}`));
    });
    serverProcess.on("error", err => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

function stopServer() {
  return new Promise(resolve => {
    if (!serverProcess || serverProcess.exitCode !== null) {
      resolve();
      return;
    }
    serverProcess.removeAllListeners("exit");
    serverProcess.on("exit", () => resolve());
    serverProcess.kill("SIGTERM");
  });
}

function httpGet(urlPath) {
  return new Promise((resolve, reject) => {
    http
      .get(`http://127.0.0.1:${TEST_PORT}${urlPath}`, res => {
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
    expect(res.body).toContain('content="Merch - Kicked Out Of The Sky"');
    // Default OG image should be first product's front image
    expect(res.body).toContain("Unisex%20Tee%20w%20Color%20Block%20Graphic");
  });

  test("should inject tees OG tags when ?type=tees", async () => {
    const res = await httpGet("/store/index.html?type=tees");
    expect(res.status).toBe(200);
    expect(res.body).toContain('content="Tees - Kicked Out Of The Sky Merch"');
    expect(res.body).toContain('content="Shop Tees from Kicked Out Of The Sky."');
  });

  test("should inject hoodies OG tags when ?type=hoodies", async () => {
    const res = await httpGet("/store/index.html?type=hoodies");
    expect(res.status).toBe(200);
    expect(res.body).toContain('content="Hoodies - Kicked Out Of The Sky Merch"');
    expect(res.body).toContain('content="Shop Hoodies from Kicked Out Of The Sky."');
  });

  test("should inject hats OG tags when ?type=hats", async () => {
    const res = await httpGet("/store/index.html?type=hats");
    expect(res.status).toBe(200);
    expect(res.body).toContain('content="Hats - Kicked Out Of The Sky Merch"');
    expect(res.body).toContain('content="Shop Hats from Kicked Out Of The Sky."');
  });

  test("should inject stickers OG tags when ?type=stickers", async () => {
    const res = await httpGet("/store/index.html?type=stickers");
    expect(res.status).toBe(200);
    expect(res.body).toContain('content="Stickers - Kicked Out Of The Sky Merch"');
    expect(res.body).toContain('content="Shop Stickers from Kicked Out Of The Sky."');
  });

  test("should inject long-sleeve OG tags when ?type=long-sleeve", async () => {
    const res = await httpGet("/store/index.html?type=long-sleeve");
    expect(res.status).toBe(200);
    expect(res.body).toContain('content="Long Sleeve Tees - Kicked Out Of The Sky Merch"');
    expect(res.body).toContain('content="Shop Long Sleeve Tees from Kicked Out Of The Sky."');
  });

  test("should inject sweatshirts OG tags when ?type=sweatshirts", async () => {
    const res = await httpGet("/store/index.html?type=sweatshirts");
    expect(res.status).toBe(200);
    expect(res.body).toContain('content="Sweatshirts - Kicked Out Of The Sky Merch"');
    expect(res.body).toContain('content="Shop Sweatshirts from Kicked Out Of The Sky."');
  });

  test("should include product image URL in OG image tag", async () => {
    const res = await httpGet("/store/index.html?type=tees");
    expect(res.status).toBe(200);
    // OG image should contain a product image, not the default band logo
    const ogImageMatch = res.body.match(/og:image[\s\S]*?content="([^"]*)"/);
    expect(ogImageMatch).not.toBeNull();
    expect(ogImageMatch[1]).not.toContain("Kicked-Out-Of-The-Sky_transparent.png");
    expect(ogImageMatch[1]).toMatch(/^https:\/\/www\.kickedoutofthesky\.com\/store\//);
  });

  test("should fall back to default OG tags for invalid type", async () => {
    const res = await httpGet("/store/index.html?type=invalid");
    expect(res.status).toBe(200);
    // Should still have the default OG title
    expect(res.body).toContain('content="Merch - Kicked Out Of The Sky"');
  });

  test("should update twitter meta tags alongside OG tags", async () => {
    const res = await httpGet("/store/index.html?type=tees");
    expect(res.status).toBe(200);
    expect(res.body).toContain('twitter:title" content="Tees - Kicked Out Of The Sky Merch"');
    expect(res.body).toContain('twitter:description" content="Shop Tees from Kicked Out Of The Sky."');
  });

  test("should inject product OG tags when ?key= param on product page", async () => {
    const res = await httpGet("/store/product.html?key=product_425342399");
    expect(res.status).toBe(200);
    expect(res.body).toContain("Unisex Tee w/ Color Block Graphic - Kicked Out Of The Sky");
    expect(res.body).toContain("https://www.kickedoutofthesky.com/store/p/product_425342399/");
    expect(res.body).toContain("Unisex%20Tee%20w%20Color%20Block%20Graphic");
  });
});
