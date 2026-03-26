module.exports = {
  ci: {
    collect: {
      startServerCommand: "PORT=9222 node server.js",
      startServerReadyPattern: "Development Server Running",
      url: [
        "http://localhost:9222/",
        "http://localhost:9222/store/",
        "http://localhost:9222/store/cart.html",
        // "http://localhost:9222/epk.html",
      ],
      numberOfRuns: 1,
      settings: {
        preset: "desktop",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.8 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
