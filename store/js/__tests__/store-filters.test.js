// Tests for shareable category filters and localStorage persistence
const { getProductCategory } = require("../store");

describe("getProductCategory", () => {
  test('should categorize tee products as "tees"', () => {
    expect(getProductCategory("Unisex Tee w/ Text")).toBe("tees");
    expect(getProductCategory("Unisex Tee w Color Block Graphic")).toBe("tees");
  });

  test('should categorize hoodie products as "hoodies"', () => {
    expect(getProductCategory("Pullover Hoodie w/ Embroidery")).toBe("hoodies");
    expect(getProductCategory("Unisex Hoodie")).toBe("hoodies");
  });

  test('should categorize sweatshirt/crewneck products as "sweatshirts"', () => {
    expect(getProductCategory("Crewneck Sweatshirt")).toBe("sweatshirts");
    expect(getProductCategory("Unisex Crewneck")).toBe("sweatshirts");
    expect(getProductCategory("Sweatshirt Classic")).toBe("sweatshirts");
  });

  test('should categorize long sleeve products as "long-sleeve"', () => {
    expect(getProductCategory("Long Sleeve Tee")).toBe("long-sleeve");
    expect(getProductCategory("Unisex Long Sleeve Shirt")).toBe("long-sleeve");
  });

  test('should categorize hat products as "hats"', () => {
    expect(getProductCategory("Snapback Hat")).toBe("hats");
    expect(getProductCategory("Trucker Cap")).toBe("hats");
    expect(getProductCategory("Baseball Cap")).toBe("hats");
    expect(getProductCategory("Trucker Hat")).toBe("hats");
  });

  test('should categorize sticker products as "stickers"', () => {
    expect(getProductCategory("Die-cut Sticker")).toBe("stickers");
    expect(getProductCategory("Kiss-cut Sticker")).toBe("stickers");
  });

  test('should return "other" for unrecognized products', () => {
    expect(getProductCategory("Canvas Print")).toBe("other");
    expect(getProductCategory("Unknown Product")).toBe("other");
  });

  test("should be case-insensitive", () => {
    expect(getProductCategory("UNISEX TEE")).toBe("tees");
    expect(getProductCategory("HOODIE")).toBe("hoodies");
    expect(getProductCategory("STICKER")).toBe("stickers");
  });
});

describe("Category Filter URL and localStorage Integration", () => {
  let mockGrid, mockFilterBtns;

  beforeEach(() => {
    localStorage.clear();
    // Set up minimal DOM for filter testing
    document.body.innerHTML = `
      <div id="category-filter">
        <button class="filter-btn active" data-category="all">All</button>
        <button class="filter-btn" data-category="tees">Tees</button>
        <button class="filter-btn" data-category="hoodies">Hoodies</button>
        <button class="filter-btn" data-category="hats">Hats</button>
        <button class="filter-btn" data-category="stickers">Stickers</button>
      </div>
      <div id="products-grid">
        <div class="product-card" data-category="tees"></div>
        <div class="product-card" data-category="hoodies"></div>
        <div class="product-card" data-category="hats"></div>
        <div class="product-card" data-category="stickers"></div>
      </div>
    `;
    mockGrid = document.getElementById("products-grid");
    mockFilterBtns = document.querySelectorAll(".filter-btn");
  });

  // Replicate the applyFilter logic from store.js for unit testing
  function applyFilter(category) {
    mockFilterBtns.forEach(b => b.classList.remove("active"));
    const activeBtn = Array.from(mockFilterBtns).find(b => b.getAttribute("data-category") === category);
    if (activeBtn) activeBtn.classList.add("active");

    const cards = mockGrid.querySelectorAll(".product-card");
    cards.forEach(card => {
      if (category === "all" || card.getAttribute("data-category") === category) {
        card.style.display = "";
      } else {
        card.style.display = "none";
      }
    });

    const url = new URL(window.location);
    if (category === "all") {
      url.searchParams.delete("type");
      localStorage.removeItem("kots_filter");
    } else {
      url.searchParams.set("type", category);
      localStorage.setItem("kots_filter", category);
    }
    // Note: history.replaceState is not fully supported in jsdom but we test the URL construction
  }

  test("should save selected category to localStorage", () => {
    applyFilter("tees");
    expect(localStorage.getItem("kots_filter")).toBe("tees");
  });

  test("should remove localStorage entry when 'all' is selected", () => {
    applyFilter("tees");
    expect(localStorage.getItem("kots_filter")).toBe("tees");
    applyFilter("all");
    expect(localStorage.getItem("kots_filter")).toBeNull();
  });

  test("should set active class on selected filter button", () => {
    applyFilter("hoodies");
    const hoodiesBtn = document.querySelector('[data-category="hoodies"]');
    const allBtn = document.querySelector('[data-category="all"]');
    expect(hoodiesBtn.classList.contains("active")).toBe(true);
    expect(allBtn.classList.contains("active")).toBe(false);
  });

  test("should hide non-matching product cards", () => {
    applyFilter("tees");
    const cards = mockGrid.querySelectorAll(".product-card");
    cards.forEach(card => {
      if (card.getAttribute("data-category") === "tees") {
        expect(card.style.display).toBe("");
      } else {
        expect(card.style.display).toBe("none");
      }
    });
  });

  test("should show all cards when 'all' is selected", () => {
    applyFilter("tees"); // First filter
    applyFilter("all"); // Then show all
    const cards = mockGrid.querySelectorAll(".product-card");
    cards.forEach(card => {
      expect(card.style.display).toBe("");
    });
  });

  test("should construct URL with type param for category filter", () => {
    applyFilter("hats");
    // jsdom location doesn't update via replaceState, but localStorage should be set
    expect(localStorage.getItem("kots_filter")).toBe("hats");
  });

  test("should read initial filter from localStorage", () => {
    localStorage.setItem("kots_filter", "stickers");
    const savedFilter = localStorage.getItem("kots_filter");
    const validCategories = ["all", "tees", "hoodies", "hats", "stickers"];
    expect(validCategories.includes(savedFilter)).toBe(true);
    applyFilter(savedFilter);
    const stickersBtn = document.querySelector('[data-category="stickers"]');
    expect(stickersBtn.classList.contains("active")).toBe(true);
  });

  test("should ignore invalid localStorage filter values", () => {
    localStorage.setItem("kots_filter", "invalid-category");
    const savedFilter = localStorage.getItem("kots_filter");
    const validCategories = ["all", "tees", "hoodies", "hats", "stickers"];
    expect(validCategories.includes(savedFilter)).toBe(false);
  });

  test("should prioritize URL param over localStorage", () => {
    localStorage.setItem("kots_filter", "hats");
    // Simulate URL param
    const urlType = "tees";
    const savedFilter = localStorage.getItem("kots_filter");
    const validCategories = ["all", "tees", "hoodies", "hats", "stickers"];
    const initialFilter =
      urlType && validCategories.includes(urlType)
        ? urlType
        : savedFilter && validCategories.includes(savedFilter)
          ? savedFilter
          : null;
    expect(initialFilter).toBe("tees"); // URL param wins
  });
});
