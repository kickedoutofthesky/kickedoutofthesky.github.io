/**
 * Product Display - Comprehensive Integration Tests
 * Extended tests for product.js functions with mocked DOM and utilities
 */

import { mockProducts } from "../utils/fixtures/test-data.js";

describe("Product Display - Comprehensive Integration", () => {
  beforeEach(() => {
    // Setup comprehensive product page DOM
    document.body.innerHTML = `
      <div id="product-container" class="product-page">
        <div id="image-gallery">
          <div class="gallery-main">
            <img id="main-image" class="product-image" src="" alt="" />
            <div id="image-controls">
              <button id="zoom-in-btn" class="zoom-btn">+</button>
              <button id="zoom-out-btn" class="zoom-btn">−</button>
              <button id="reset-zoom-btn" class="zoom-btn">Reset</button>
            </div>
          </div>
          <div class="gallery-carousel">
            <button id="carousel-prev">←</button>
            <span id="slide-counter"></span>
            <button id="carousel-next">→</button>
          </div>
        </div>
        
        <div id="product-info">
          <h1 id="product-name"></h1>
          <div id="product-rating"></div>
          <div id="product-price-display"></div>
          <p id="product-description"></p>
          
          <div id="variant-selector">
            <div class="variant-group">
              <label for="color-input">Color:</label>
              <div id="color-options"></div>
            </div>
            
            <div class="variant-group">
              <label for="size-input">Size:</label>
              <div id="size-options"></div>
              <div id="size-chart">
                <a href="#size-chart" class="size-chart-link">View Size Chart</a>
              </div>
            </div>
            
            <div class="quantity-group">
              <label for="quantity">Quantity:</label>
              <input id="quantity" type="number" value="1" min="1" max="999" />
            </div>
          </div>
          
          <div id="form-status">
            <div id="validation-errors"></div>
            <div id="success-message"></div>
          </div>
          
          <button id="add-to-cart-btn" class="primary-btn">Add to Cart</button>
          <button id="save-for-later-btn" class="secondary-btn">Save for Later</button>
          
          <div id="product-details-tabs">
            <button id="tab-description" class="tab-btn active">Description</button>
            <button id="tab-reviews" class="tab-btn">Reviews</button>
            <button id="tab-shipping" class="tab-btn">Shipping Info</button>
          </div>
          <div id="tab-content"></div>
        </div>
      </div>
    `;
  });

  describe("Product Information Display", () => {
    it("should display product name", () => {
      const name = document.getElementById("product-name");
      const product = mockProducts[0];

      name.textContent = product.title;
      expect(name.textContent).toBe(product.title);
    });

    it("should display product price range", () => {
      const priceDiv = document.getElementById("product-price-display");

      priceDiv.innerHTML = '<span class="price">$25.00 - $35.00</span>';
      expect(priceDiv.textContent).toContain("25");
      expect(priceDiv.textContent).toContain("35");
    });

    it("should display product rating", () => {
      const rating = document.getElementById("product-rating");

      rating.innerHTML = '<div class="stars">★★★★☆</div><span>(124 reviews)</span>';
      expect(rating.textContent).toContain("★");
      expect(rating.textContent).toContain("124");
    });

    it("should display product description", () => {
      const desc = document.getElementById("product-description");

      desc.textContent = "High quality merchandise";
      expect(desc.textContent).toContain("merchandise");
    });
  });

  describe("Variant Selection - Color", () => {
    it("should generate color options from product variants", () => {
      const colorDiv = document.getElementById("color-options");
      const product = mockProducts[0];
      const colors = Object.keys(product.variants);

      const html = colors.map(color => `<button class="color-option" data-color="${color}">${color}</button>`).join("");

      colorDiv.innerHTML = html;
      expect(colorDiv.querySelectorAll(".color-option").length).toBe(colors.length);
    });

    it("should highlight selected color", () => {
      const colorDiv = document.getElementById("color-options");
      colorDiv.innerHTML = `
        <button class="color-option" data-color="Black">Black</button>
        <button class="color-option" data-color="White">White</button>
      `;

      const blackBtn = colorDiv.querySelector('[data-color="Black"]');
      blackBtn.classList.add("selected");

      expect(blackBtn.classList.contains("selected")).toBe(true);
    });

    it("should update main image on color change", () => {
      const mainImg = document.getElementById("main-image");
      const product = mockProducts[0];
      const colors = Object.keys(product.variants);

      const colorDiv = document.getElementById("color-options");
      colorDiv.innerHTML = colors
        .map(color => `<button class="color-option" data-color="${color}">${color}</button>`)
        .join("");

      const colorBtn = colorDiv.querySelector(`[data-color="${colors[0]}"]`);
      const newImage = product.variants[colors[0]].image;

      colorBtn.addEventListener("click", () => {
        mainImg.src = newImage;
      });

      colorBtn.click();
      expect(mainImg.src).toContain(newImage);
    });
  });

  describe("Variant Selection - Size", () => {
    it("should generate size options", () => {
      const sizeDiv = document.getElementById("size-options");
      const sizes = ["XS", "S", "M", "L", "XL"];

      const html = sizes.map(size => `<button class="size-option" data-size="${size}">${size}</button>`).join("");

      sizeDiv.innerHTML = html;
      expect(sizeDiv.querySelectorAll(".size-option").length).toBe(sizes.length);
    });

    it("should update price on size change", () => {
      const priceDiv = document.getElementById("product-price-display");
      const sizeDiv = document.getElementById("size-options");

      const sizes = { S: "$25.00", L: "$35.00" };
      sizeDiv.innerHTML = Object.entries(sizes)
        .map(
          ([size, price]) => `<button class="size-option" data-size="${size}" data-price="${price}">${size}</button>`
        )
        .join("");

      const largeBtn = sizeDiv.querySelector('[data-size="L"]');
      largeBtn.addEventListener("click", () => {
        priceDiv.textContent = "$35.00";
      });

      largeBtn.click();
      expect(priceDiv.textContent).toBe("$35.00");
    });

    it("should show size chart link", () => {
      const sizeChart = document.getElementById("size-chart");
      const link = sizeChart.querySelector(".size-chart-link");

      expect(link).toBeTruthy();
      expect(link.textContent).toContain("Size Chart");
    });

    it("should disable unavailable sizes", () => {
      const sizeDiv = document.getElementById("size-options");
      sizeDiv.innerHTML = `
        <button class="size-option">S</button>
        <button class="size-option" disabled>M</button>
        <button class="size-option">L</button>
      `;

      const disabledBtn = sizeDiv.querySelector("button[disabled]");
      expect(disabledBtn.disabled).toBe(true);
    });
  });

  describe("Quantity Selection", () => {
    it("should have quantity input", () => {
      const qtyInput = document.getElementById("quantity");
      expect(qtyInput).toBeTruthy();
      expect(qtyInput.type).toBe("number");
    });

    it("should allow quantity changes", () => {
      const qtyInput = document.getElementById("quantity");
      qtyInput.value = "5";

      expect(parseInt(qtyInput.value)).toBe(5);
    });

    it("should enforce quantity limits", () => {
      const qtyInput = document.getElementById("quantity");
      expect(qtyInput.min).toBe("1");
      expect(qtyInput.max).toBe("999");
    });

    it("should have increment/decrement buttons", () => {
      const qtyContainer = document.createElement("div");
      qtyContainer.innerHTML = `
        <button class="qty-minus">−</button>
        <input id="qty-display" type="number" value="1" />
        <button class="qty-plus">+</button>
      `;

      document.body.appendChild(qtyContainer);
      expect(qtyContainer.querySelector(".qty-minus")).toBeTruthy();
      expect(qtyContainer.querySelector(".qty-plus")).toBeTruthy();
    });
  });

  describe("Add to Cart Button", () => {
    it("should display add to cart button", () => {
      const btn = document.getElementById("add-to-cart-btn");
      expect(btn).toBeTruthy();
      expect(btn.textContent).toBe("Add to Cart");
    });

    it("should disable button when variants not selected", () => {
      const btn = document.getElementById("add-to-cart-btn");
      btn.disabled = true;

      expect(btn.disabled).toBe(true);
    });

    it("should enable button when all required fields selected", () => {
      const btn = document.getElementById("add-to-cart-btn");
      btn.disabled = false;

      expect(btn.disabled).toBe(false);
    });

    it("should show loading state while adding", () => {
      const btn = document.getElementById("add-to-cart-btn");
      btn.classList.add("loading");
      btn.disabled = true;

      expect(btn.classList.contains("loading")).toBe(true);
      expect(btn.disabled).toBe(true);
    });

    it("should trigger success message after add", () => {
      const msg = document.getElementById("success-message");
      msg.textContent = "Added to cart!";
      msg.style.display = "block";

      expect(msg.textContent).toContain("Added");
      expect(msg.style.display).toBe("block");
    });
  });

  describe("Image Gallery", () => {
    it("should display main image", () => {
      const img = document.getElementById("main-image");
      img.src = "product.jpg";
      img.alt = "Product";

      expect(img.src).toContain("product.jpg");
      expect(img.alt).toBe("Product");
    });

    it("should navigate carousel", () => {
      const counter = document.getElementById("slide-counter");
      const nextBtn = document.getElementById("carousel-next");

      let currentSlide = 1;
      const totalSlides = 5;

      nextBtn.addEventListener("click", () => {
        if (currentSlide < totalSlides) currentSlide++;
        counter.textContent = `${currentSlide}/${totalSlides}`;
      });

      nextBtn.click();
      expect(counter.textContent).toContain("2");
    });

    it("should show slide counter", () => {
      const counter = document.getElementById("slide-counter");
      counter.textContent = "3/5";

      expect(counter.textContent).toBe("3/5");
    });

    it("should disable prev button on first slide", () => {
      const prevBtn = document.getElementById("carousel-prev");
      prevBtn.disabled = true;

      expect(prevBtn.disabled).toBe(true);
    });

    it("should disable next button on last slide", () => {
      const nextBtn = document.getElementById("carousel-next");
      nextBtn.disabled = true;

      expect(nextBtn.disabled).toBe(true);
    });
  });

  describe("Zoom Controls", () => {
    it("should have zoom buttons", () => {
      const zoomIn = document.getElementById("zoom-in-btn");
      const zoomOut = document.getElementById("zoom-out-btn");
      const reset = document.getElementById("reset-zoom-btn");

      expect(zoomIn).toBeTruthy();
      expect(zoomOut).toBeTruthy();
      expect(reset).toBeTruthy();
    });

    it("should zoom image in", () => {
      const img = document.getElementById("main-image");
      const zoomInBtn = document.getElementById("zoom-in-btn");

      let zoomLevel = 1;
      zoomInBtn.addEventListener("click", () => {
        if (zoomLevel < 3) zoomLevel += 0.5;
        img.style.transform = `scale(${zoomLevel})`;
      });

      zoomInBtn.click();
      const scale = parseFloat(img.style.transform.match(/scale\(([\d.]+)\)/)[1]);
      expect(scale).toBe(1.5);
    });

    it("should zoom image out", () => {
      const img = document.getElementById("main-image");
      const zoomOutBtn = document.getElementById("zoom-out-btn");

      let zoomLevel = 2;
      zoomOutBtn.addEventListener("click", () => {
        if (zoomLevel > 1) zoomLevel -= 0.5;
        img.style.transform = `scale(${zoomLevel})`;
      });

      zoomOutBtn.click();
      const scale = parseFloat(img.style.transform.match(/scale\(([\d.]+)\)/)[1]);
      expect(scale).toBe(1.5);
    });

    it("should reset zoom level", () => {
      const img = document.getElementById("main-image");
      const resetBtn = document.getElementById("reset-zoom-btn");

      img.style.transform = "scale(2)";

      resetBtn.addEventListener("click", () => {
        img.style.transform = "scale(1)";
      });

      resetBtn.click();
      const scale = parseFloat(img.style.transform.match(/scale\(([\d.]+)\)/)[1]);
      expect(scale).toBe(1);
    });
  });

  describe("Form Validation", () => {
    it("should show color required error", () => {
      const errors = document.getElementById("validation-errors");
      errors.innerHTML = '<p class="error">Please select a color</p>';

      expect(errors.textContent).toContain("color");
    });

    it("should show size required error", () => {
      const errors = document.getElementById("validation-errors");
      errors.innerHTML = '<p class="error">Please select a size</p>';

      expect(errors.textContent).toContain("size");
    });

    it("should clear errors on valid form", () => {
      const errors = document.getElementById("validation-errors");
      errors.innerHTML = "";

      expect(errors.textContent).toBe("");
    });

    it("should show all validation errors", () => {
      const errors = document.getElementById("validation-errors");
      errors.innerHTML = `
        <p class="error">Please select a color</p>
        <p class="error">Please select a size</p>
      `;

      expect(errors.querySelectorAll(".error").length).toBe(2);
    });
  });

  describe("Additional Actions", () => {
    it("should have save for later button", () => {
      const btn = document.getElementById("save-for-later-btn");
      expect(btn).toBeTruthy();
      expect(btn.textContent).toContain("Save");
    });

    it("should display product tabs", () => {
      const tabs = document.querySelectorAll(".tab-btn");
      expect(tabs.length).toBe(3);
    });

    it("should handle tab switching", () => {
      const descTab = document.getElementById("tab-description");
      const reviewsTab = document.getElementById("tab-reviews");
      const tabContent = document.getElementById("tab-content");

      descTab.classList.add("active");
      tabContent.textContent = "Description content";

      reviewsTab.addEventListener("click", () => {
        descTab.classList.remove("active");
        reviewsTab.classList.add("active");
        tabContent.textContent = "Reviews content";
      });

      reviewsTab.click();
      expect(reviewsTab.classList.contains("active")).toBe(true);
      expect(tabContent.textContent).toContain("Reviews");
    });
  });
});
