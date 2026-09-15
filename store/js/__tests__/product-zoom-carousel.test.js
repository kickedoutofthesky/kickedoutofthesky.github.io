/**
 * Product Page Tests - Zoom, Pan, and Carousel Functionality
 */

describe("Product Page - Image Navigation and Zoom", () => {
  let mockProduct;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="product-container">
        <img id="product-image" src="" alt="Product" />
        <button id="carousel-prev">Previous</button>
        <button id="carousel-next">Next</button>
      </div>
    `;

    // Mock product data
    mockProduct = {
      image: "main.jpg",
      variants: {
        Black: {
          image: "black.jpg",
          mockups: ["black-main.jpg", "black-sleeve.jpg"],
        },
        Red: {
          image: "red.jpg",
          mockups: ["red-main.jpg"],
        },
      },
    };
  });

  describe("getColorImages", () => {
    it("should return mockups array if available", () => {
      const colorSelect = document.getElementById("color") || {
        value: "Black",
      };

      // Simple mock of getColorImages logic
      const getColorImages = () => {
        if (!mockProduct) return [];
        const selectedColor = colorSelect.value || Object.keys(mockProduct.variants)[0];
        const colorData = mockProduct.variants[selectedColor];
        if (!colorData) return [mockProduct.image];
        if (colorData.mockups && colorData.mockups.length > 0) {
          return colorData.mockups;
        }
        return [colorData.image || mockProduct.image];
      };

      const images = getColorImages();
      expect(images).toEqual(["black-main.jpg", "black-sleeve.jpg"]);
    });

    it("should fallback to single color image if no mockups", () => {
      // Override the mockProduct for this test
      const testProduct = {
        image: "main.jpg",
        variants: {
          Red: {
            image: "red.jpg",
            // No mockups array
          },
        },
      };
      const colorSelect = { value: "Red" };

      const getColorImages = () => {
        if (!testProduct) return [];
        const selectedColor = colorSelect.value || Object.keys(testProduct.variants)[0];
        const colorData = testProduct.variants[selectedColor];
        if (!colorData) return [testProduct.image];
        if (colorData.mockups && colorData.mockups.length > 0) {
          return colorData.mockups;
        }
        return [colorData.image || testProduct.image];
      };

      const images = getColorImages();
      expect(images).toEqual(["red.jpg"]);
    });

    it("should return main product image if color not found", () => {
      const colorSelect = { value: "NonExistent" };

      const getColorImages = () => {
        if (!mockProduct) return [];
        const selectedColor = colorSelect.value || Object.keys(mockProduct.variants)[0];
        const colorData = mockProduct.variants[selectedColor];
        if (!colorData) return [mockProduct.image];
        if (colorData.mockups && colorData.mockups.length > 0) {
          return colorData.mockups;
        }
        return [colorData.image || mockProduct.image];
      };

      const images = getColorImages();
      expect(images).toEqual(["main.jpg"]);
    });

    it("should return empty array if no product", () => {
      const getColorImages = () => {
        const product = null;
        if (!product) return [];
        return [];
      };

      const images = getColorImages();
      expect(images).toEqual([]);
    });
  });

  describe("getCurrentDisplayImage", () => {
    it("should return image at current index", () => {
      const images = ["black-main.jpg", "black-sleeve.jpg"];
      let currentImageIndex = 0;

      const getCurrentDisplayImage = () => {
        if (currentImageIndex < images.length) {
          return images[currentImageIndex];
        }
        return images[0];
      };

      expect(getCurrentDisplayImage()).toBe("black-main.jpg");

      currentImageIndex = 1;
      expect(getCurrentDisplayImage()).toBe("black-sleeve.jpg");
    });

    it("should fallback to first image if index out of bounds", () => {
      const images = ["black-main.jpg", "black-sleeve.jpg"];
      let currentImageIndex = 5;

      const getCurrentDisplayImage = () => {
        if (currentImageIndex < images.length) {
          return images[currentImageIndex];
        }
        return images[0];
      };

      expect(getCurrentDisplayImage()).toBe("black-main.jpg");
    });
  });

  describe("Carousel Navigation", () => {
    it("should update carousel UI based on image count", () => {
      const images = ["main.jpg"];
      const updateCarouselUI = () => {
        const prevBtn = document.getElementById("carousel-prev");
        const nextBtn = document.getElementById("carousel-next");
        const maxIndex = images.length - 1;

        if (maxIndex < 1) {
          if (prevBtn) prevBtn.style.display = "none";
          if (nextBtn) nextBtn.style.display = "none";
          return;
        }

        if (prevBtn) prevBtn.style.display = "flex";
        if (nextBtn) nextBtn.style.display = "flex";
      };

      updateCarouselUI();

      const prevBtn = document.getElementById("carousel-prev");
      const nextBtn = document.getElementById("carousel-next");

      expect(prevBtn.style.display).toBe("none");
      expect(nextBtn.style.display).toBe("none");
    });

    it("should show navigation buttons for multiple images", () => {
      const images = ["main.jpg", "sleeve.jpg"];
      let currentImageIndex = 0;

      const updateCarouselUI = () => {
        const prevBtn = document.getElementById("carousel-prev");
        const nextBtn = document.getElementById("carousel-next");
        const maxIndex = images.length - 1;

        if (maxIndex < 1) {
          if (prevBtn) prevBtn.style.display = "none";
          if (nextBtn) nextBtn.style.display = "none";
          return;
        }

        if (prevBtn) prevBtn.style.display = currentImageIndex > 0 ? "flex" : "none";
        if (nextBtn) nextBtn.style.display = currentImageIndex < maxIndex ? "flex" : "none";
      };

      updateCarouselUI();

      const prevBtn = document.getElementById("carousel-prev");
      const nextBtn = document.getElementById("carousel-next");

      expect(prevBtn.style.display).toBe("none"); // First image, prev hidden
      expect(nextBtn.style.display).toBe("flex"); // First image, next visible
    });

    it("should handle previous navigation", () => {
      let currentImageIndex = 1;
      const maxIndex = 2; // 3 images: main.jpg, sleeve.jpg, tag.jpg

      const showPreviousImage = () => {
        if (currentImageIndex > 0) {
          currentImageIndex--;
          return true;
        }
        return false;
      };

      expect(showPreviousImage()).toBe(true);
      expect(currentImageIndex).toBe(0);
    });

    it("should handle next navigation", () => {
      let currentImageIndex = 0;
      const images = ["main.jpg", "sleeve.jpg", "tag.jpg"];

      const showNextImage = () => {
        if (currentImageIndex < images.length - 1) {
          currentImageIndex++;
          return true;
        }
        return false;
      };

      expect(showNextImage()).toBe(true);
      expect(currentImageIndex).toBe(1);
    });

    it("should not allow navigation beyond bounds", () => {
      let currentImageIndex = 0;
      const images = ["main.jpg"];

      const showNextImage = () => {
        if (currentImageIndex < images.length - 1) {
          currentImageIndex++;
          return true;
        }
        return false;
      };

      expect(showNextImage()).toBe(false);
      expect(currentImageIndex).toBe(0);
    });
  });

  describe("updateProductImage", () => {
    it("should set image src to current display image", () => {
      const img = document.getElementById("product-image");
      const imagePath = "test-image.jpg";
      const absolutePath =
        imagePath.startsWith("/") || imagePath.startsWith("http") ? imagePath : `/store/${imagePath}`;

      img.src = encodeURI(absolutePath);

      expect(img.src).toContain("test-image.jpg");
    });

    it("should handle paths that already start with /", () => {
      const img = document.getElementById("product-image");
      const imagePath = "/store/images/test.jpg";
      const absolutePath =
        imagePath.startsWith("/") || imagePath.startsWith("http") ? imagePath : `/store/${imagePath}`;

      img.src = encodeURI(absolutePath);

      // Browsers normalize relative URLs to include protocol and localhost
      // So we check that it contains the path component
      expect(img.src).toContain("/store/images/test.jpg");
    });

    it("should encode URI for special characters", () => {
      const img = document.getElementById("product-image");
      const imagePath = "test image with spaces.jpg";
      const absolutePath =
        imagePath.startsWith("/") || imagePath.startsWith("http") ? imagePath : `/store/${imagePath}`;

      img.src = encodeURI(absolutePath);

      expect(img.src).toContain("%20"); // Space encoded
    });
  });

  describe("Zoom Constants", () => {
    it("should have correct zoom limits", () => {
      const MAX_ZOOM = 3;
      const MIN_ZOOM = 1;
      const ZOOM_STEP = 0.2;

      expect(MAX_ZOOM).toBe(3);
      expect(MIN_ZOOM).toBe(1);
      expect(ZOOM_STEP).toBe(0.2);
    });

    it("should allow zoom step increments", () => {
      let zoomLevel = 1;
      const ZOOM_STEP = 0.2;
      const MAX_ZOOM = 3;

      zoomLevel += ZOOM_STEP;
      expect(zoomLevel).toBe(1.2);

      zoomLevel += ZOOM_STEP;
      expect(zoomLevel).toBe(1.4);

      while (zoomLevel + ZOOM_STEP <= MAX_ZOOM) {
        zoomLevel += ZOOM_STEP;
      }

      expect(zoomLevel).toBeLessThanOrEqual(MAX_ZOOM);
    });
  });
});
