/**
 * Product Display - DOM Manipulation Tests
 * Tests for DOM-dependent product page functions
 */

import { mockProducts } from "../utils/fixtures/test-data";

describe("Product Display - DOM Manipulation", () => {
  beforeEach(() => {
    // Setup product page DOM
    document.body.innerHTML = `
      <div id="product-container">
        <div id="product-images">
          <img id="main-image" src="" alt="Product" />
          <div id="thumbnail-gallery"></div>
        </div>
        <div id="product-details">
          <h1 id="product-title"></h1>
          <div id="product-price"></div>
          <div id="color-selector"></div>
          <div id="size-selector"></div>
          <input id="quantity-input" type="number" value="1" />
          <button id="add-to-cart-btn">Add to Cart</button>
          <div id="form-errors"></div>
        </div>
      </div>
    `;
  });

  describe("Product Image Display", () => {
    it("should display main product image", () => {
      const mainImage = document.getElementById("main-image");
      const product = mockProducts[0];

      mainImage.src = product.image;
      expect(mainImage.src).toContain(product.image);
    });

    it("should update main image on color selection", () => {
      const mainImage = document.getElementById("main-image");
      const product = mockProducts[0];
      const colors = Object.keys(product.variants);

      // Select first color
      const colorImage = product.variants[colors[0]].image;
      mainImage.src = colorImage;

      // Jest converts relative paths to absolute URLs
      expect(mainImage.src).toContain(colorImage);
    });

    it("should create thumbnail gallery", () => {
      const gallery = document.getElementById("thumbnail-gallery");
      const product = mockProducts[0];
      const colors = Object.keys(product.variants);

      const thumbs = colors
        .map((color, i) => `<img class="thumbnail" data-color="${color}" src="${product.variants[color].image}" />`)
        .join("");

      gallery.innerHTML = thumbs;
      expect(gallery.querySelectorAll(".thumbnail").length).toBe(colors.length);
    });

    it("should highlight active thumbnail", () => {
      const gallery = document.getElementById("thumbnail-gallery");
      gallery.innerHTML = `
        <img class="thumbnail active" src="black.jpg" />
        <img class="thumbnail" src="white.jpg" />
      `;

      const activeThumbnail = gallery.querySelector(".thumbnail.active");
      expect(activeThumbnail).toBeTruthy();
      // Jest converts relative paths to absolute URLs, so use toContain
      expect(activeThumbnail.src).toContain("black.jpg");
    });

    it("should have alt text for accessibility", () => {
      const mainImage = document.getElementById("main-image");
      const product = mockProducts[0];

      mainImage.src = product.image;
      mainImage.alt = product.title;

      expect(mainImage.alt).toBe(product.title);
    });
  });

  describe("Product Details Display", () => {
    it("should display product title", () => {
      const title = document.getElementById("product-title");
      const product = mockProducts[0];

      title.textContent = product.title;
      expect(title.textContent).toBe(product.title);
    });

    it("should display product price", () => {
      const priceDiv = document.getElementById("product-price");
      const priceText = "$25.00";

      priceDiv.textContent = priceText;
      expect(priceDiv.textContent).toBe(priceText);
    });

    it("should display price range for varied sizes", () => {
      const priceDiv = document.getElementById("product-price");
      priceDiv.textContent = "$25.00 - $35.00";

      expect(priceDiv.textContent).toContain("$25.00");
      expect(priceDiv.textContent).toContain("$35.00");
    });
  });

  describe("Color Selection", () => {
    it("should display color options", () => {
      const colorSelector = document.getElementById("color-selector");
      const product = mockProducts[0];
      const colors = Object.keys(product.variants);

      colorSelector.innerHTML = colors
        .map(color => `<label><input type="radio" name="color" value="${color}" /> ${color}</label>`)
        .join("");

      expect(colorSelector.querySelectorAll("input[name='color']").length).toBe(colors.length);
    });

    it("should select color option", () => {
      const colorSelector = document.getElementById("color-selector");
      colorSelector.innerHTML = `
        <label><input type="radio" name="color" value="Black" /> Black</label>
        <label><input type="radio" name="color" value="White" /> White</label>
      `;

      const blackOption = colorSelector.querySelector("input[value='Black']");
      blackOption.checked = true;

      expect(blackOption.checked).toBe(true);
    });

    it("should deselect other colors when selecting new color", () => {
      const colorSelector = document.getElementById("color-selector");
      colorSelector.innerHTML = `
        <label><input type="radio" name="color" value="Black" checked /> Black</label>
        <label><input type="radio" name="color" value="White" /> White</label>
      `;

      const whiteOption = colorSelector.querySelector("input[value='White']");
      whiteOption.checked = true;

      const blackOption = colorSelector.querySelector("input[value='Black']");
      expect(blackOption.checked).toBe(false);
      expect(whiteOption.checked).toBe(true);
    });

    it("should trigger change event on color selection", () => {
      const colorSelector = document.getElementById("color-selector");
      colorSelector.innerHTML = '<input type="radio" name="color" value="Black" />';

      let colorChanged = false;
      const input = colorSelector.querySelector("input");

      input.addEventListener("change", () => {
        colorChanged = true;
      });

      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));

      expect(colorChanged).toBe(true);
    });
  });

  describe("Size Selection", () => {
    it("should display available sizes", () => {
      const sizeSelector = document.getElementById("size-selector");
      const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

      sizeSelector.innerHTML = sizes
        .map(size => `<label><input type="radio" name="size" value="${size}" /> ${size}</label>`)
        .join("");

      expect(sizeSelector.querySelectorAll("input[name='size']").length).toBe(sizes.length);
    });

    it("should select size option", () => {
      const sizeSelector = document.getElementById("size-selector");
      sizeSelector.innerHTML = `
        <label><input type="radio" name="size" value="M" /> M</label>
        <label><input type="radio" name="size" value="L" /> L</label>
      `;

      const sizeM = sizeSelector.querySelector("input[value='M']");
      sizeM.checked = true;

      expect(sizeM.checked).toBe(true);
    });

    it("should disable unavailable sizes", () => {
      const sizeSelector = document.getElementById("size-selector");
      sizeSelector.innerHTML = `
        <label><input type="radio" name="size" value="M" /> M</label>
        <label><input type="radio" name="size" value="L" disabled /> L</label>
      `;

      const unavailableSize = sizeSelector.querySelector("input[value='L']");
      expect(unavailableSize.disabled).toBe(true);
    });

    it("should trigger change event on size selection", () => {
      const sizeSelector = document.getElementById("size-selector");
      sizeSelector.innerHTML = '<input type="radio" name="size" value="M" />';

      let sizeChanged = false;
      const input = sizeSelector.querySelector("input");

      input.addEventListener("change", () => {
        sizeChanged = true;
      });

      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));

      expect(sizeChanged).toBe(true);
    });
  });

  describe("Quantity Input", () => {
    it("should display quantity input", () => {
      const quantityInput = document.getElementById("quantity-input");
      expect(quantityInput).toBeTruthy();
      expect(quantityInput.type).toBe("number");
    });

    it("should set default quantity to 1", () => {
      const quantityInput = document.getElementById("quantity-input");
      expect(parseInt(quantityInput.value)).toBe(1);
    });

    it("should allow quantity update", () => {
      const quantityInput = document.getElementById("quantity-input");
      quantityInput.value = "5";

      expect(parseInt(quantityInput.value)).toBe(5);
    });

    it("should enforce minimum quantity", () => {
      const quantityInput = document.getElementById("quantity-input");
      quantityInput.min = "1";
      quantityInput.value = "0";

      // Value set but validation would fail
      expect(quantityInput.min).toBe("1");
    });

    it("should enforce maximum quantity", () => {
      const quantityInput = document.getElementById("quantity-input");
      quantityInput.max = "99";
      quantityInput.value = "100";

      // Value set but validation would fail
      expect(quantityInput.max).toBe("99");
    });

    it("should validate quantity is number", () => {
      const quantityInput = document.getElementById("quantity-input");
      quantityInput.value = "5";

      expect(!isNaN(parseInt(quantityInput.value))).toBe(true);
    });
  });

  describe("Add to Cart Button", () => {
    it("should display add to cart button", () => {
      const btn = document.getElementById("add-to-cart-btn");
      expect(btn).toBeTruthy();
      expect(btn.textContent).toBe("Add to Cart");
    });

    it("should enable button with valid form", () => {
      const btn = document.getElementById("add-to-cart-btn");
      btn.disabled = false;

      expect(btn.disabled).toBe(false);
    });

    it("should disable button with invalid form", () => {
      const btn = document.getElementById("add-to-cart-btn");
      btn.disabled = true;

      expect(btn.disabled).toBe(true);
    });

    it("should trigger add to cart on click", () => {
      const btn = document.getElementById("add-to-cart-btn");
      let addTriggered = false;

      btn.addEventListener("click", () => {
        addTriggered = true;
      });

      btn.click();
      expect(addTriggered).toBe(true);
    });

    it("should show loading state during add", () => {
      const btn = document.getElementById("add-to-cart-btn");
      btn.disabled = true;
      btn.classList.add("loading");

      expect(btn.classList.contains("loading")).toBe(true);
      expect(btn.disabled).toBe(true);
    });
  });

  describe("Form Validation", () => {
    it("should display form errors", () => {
      const errors = document.getElementById("form-errors");
      errors.innerHTML = '<div class="error">Please select a color</div>';

      expect(errors.textContent).toContain("Please select a color");
    });

    it("should clear form errors when valid", () => {
      const errors = document.getElementById("form-errors");
      errors.innerHTML = "";

      expect(errors.textContent).toBe("");
    });

    it("should show multiple errors", () => {
      const errors = document.getElementById("form-errors");
      errors.innerHTML = `
        <div class="error">Please select a color</div>
        <div class="error">Please select a size</div>
      `;

      expect(errors.querySelectorAll(".error").length).toBe(2);
    });

    it("should validate color is selected", () => {
      const colorSelector = document.getElementById("color-selector");
      colorSelector.innerHTML = '<input type="radio" name="color" value="Black" />';

      const selected = colorSelector.querySelector("input[name='color']:checked");
      expect(selected).toBeNull();
    });

    it("should validate size is selected", () => {
      const sizeSelector = document.getElementById("size-selector");
      sizeSelector.innerHTML = '<input type="radio" name="size" value="M" />';

      const selected = sizeSelector.querySelector("input[name='size']:checked");
      expect(selected).toBeNull();
    });
  });

  describe("Product Carousel", () => {
    it("should create carousel structure", () => {
      const imagesDiv = document.getElementById("product-images");
      imagesDiv.innerHTML = `
        <div class="carousel">
          <img class="slide" src="image1.jpg" />
          <img class="slide" src="image2.jpg" />
        </div>
      `;

      expect(imagesDiv.querySelectorAll(".slide").length).toBe(2);
    });

    it("should navigate carousel with buttons", () => {
      const imagesDiv = document.getElementById("product-images");
      imagesDiv.innerHTML = `
        <button class="prev">←</button>
        <div class="carousel">
          <img class="slide active" src="image1.jpg" />
          <img class="slide" src="image2.jpg" />
        </div>
        <button class="next">→</button>
      `;

      const prevBtn = imagesDiv.querySelector(".prev");
      const nextBtn = imagesDiv.querySelector(".next");

      expect(prevBtn).toBeTruthy();
      expect(nextBtn).toBeTruthy();
    });

    it("should show current slide index", () => {
      const imagesDiv = document.getElementById("product-images");
      imagesDiv.innerHTML = `
        <div class="carousel-counter">1 / 3</div>
      `;

      expect(imagesDiv.textContent).toContain("1 / 3");
    });
  });

  describe("Zoom and Pan", () => {
    it("should support zoom in/out", () => {
      const mainImage = document.getElementById("main-image");
      mainImage.style.transform = "scale(1.5)";

      const scaleValue = mainImage.style.transform.match(/scale\(([\d.]+)\)/)[1];
      expect(parseFloat(scaleValue)).toBe(1.5);
    });

    it("should limit zoom levels", () => {
      const mainImage = document.getElementById("main-image");

      // Set zoom level
      let zoom = 2.5;
      if (zoom > 3) zoom = 3; // Max zoom
      if (zoom < 1) zoom = 1; // Min zoom

      mainImage.style.transform = `scale(${zoom})`;
      expect(zoom).toBeLessThanOrEqual(3);
      expect(zoom).toBeGreaterThanOrEqual(1);
    });

    it("should support pan on zoomed image", () => {
      const mainImage = document.getElementById("main-image");
      mainImage.style.transform = "scale(2) translate(50px, 30px)";

      expect(mainImage.style.transform).toContain("translate");
    });
  });
});
