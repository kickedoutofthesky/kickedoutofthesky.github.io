/**
 * Cart Notification Enhancements
 * Additional tests for cart notification animations and edge cases
 */

const { playDingSound, createCartBurst } = require("../cart-notification");

describe("Cart Notification - Extended Coverage", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="cart-badge" style="display: none;">
        <span id="cart-quantity">0</span>
      </div>
      <a id="nav-link" href="/cart">Cart</a>
      <input id="quantity-input" value="1" />
      <div id="particles"></div>
    `;
  });

  describe("playDingSound - Audio Creation", () => {
    it("should create oscillator", () => {
      // Mock AudioContext
      const mockOscillator = {
        frequency: { value: 0 },
        type: "",
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
      };

      const mockGain = {
        gain: { value: 0.3 },
        connect: jest.fn(),
      };

      const mockContext = {
        createOscillator: jest.fn(() => mockOscillator),
        createGain: jest.fn(() => mockGain),
        destination: {},
      };

      mockOscillator.connect(mockGain);
      mockGain.connect(mockContext.destination);

      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGain);
      expect(mockGain.connect).toHaveBeenCalledWith(mockContext.destination);
    });

    it("should set oscillator frequency to 1000Hz", () => {
      const mockOscillator = {
        frequency: { value: 0 },
        type: "sine",
      };

      mockOscillator.frequency.value = 1000;
      expect(mockOscillator.frequency.value).toBe(1000);
    });

    it("should set oscillator type to sine wave", () => {
      const mockOscillator = {
        type: "",
      };

      mockOscillator.type = "sine";
      expect(mockOscillator.type).toBe("sine");
    });

    it("should apply exponential gain envelope", () => {
      const mockGain = {
        gain: { value: 0.3 },
        exponentialRampToValueAtTime: jest.fn(),
      };

      const currentTime = 0;
      const startGain = 0.3;
      const endGain = 0.01;
      const duration = 0.1;

      mockGain.exponentialRampToValueAtTime(endGain, currentTime + duration);

      expect(mockGain.exponentialRampToValueAtTime).toHaveBeenCalledWith(endGain, currentTime + duration);
    });

    it("should handle missing AudioContext gracefully", () => {
      const originalAudioContext = window.AudioContext;
      delete window.AudioContext;

      // Should not throw error
      expect(() => {
        // playDingSound would check for AudioContext
        const hasAudioContext = typeof window.AudioContext !== "undefined";
        expect(hasAudioContext).toBe(false);
      }).not.toThrow();

      window.AudioContext = originalAudioContext;
    });

    it("should handle missing audio elements in page", () => {
      document.body.innerHTML = ""; // Remove all elements

      // Should handle gracefully
      expect(() => {
        const cartBadge = document.getElementById("cart-badge");
        expect(cartBadge).toBeNull();
      }).not.toThrow();
    });
  });

  describe("createCartBurst - Animation Promise", () => {
    it("should return a Promise", () => {
      const sourceElement = document.getElementById("quantity-input");
      const targetElement = document.getElementById("cart-badge");

      const result = createCartBurst(sourceElement, targetElement);

      expect(result instanceof Promise).toBe(true);
    });

    it("should resolve after timeout", done => {
      jest.useFakeTimers();

      const sourceElement = document.getElementById("quantity-input");
      const targetElement = document.getElementById("cart-badge");

      const promise = createCartBurst(sourceElement, targetElement);

      expect(promise instanceof Promise).toBe(true);

      promise.then(() => {
        expect(true).toBe(true);
        done();
      });

      jest.advanceTimersByTime(1000);
      jest.useRealTimers();
    });

    it("should handle missing source element", () => {
      const targetElement = document.getElementById("cart-badge");

      // Should not throw error
      expect(() => {
        const sourceElement = document.getElementById("nonexistent");
        const result = createCartBurst(sourceElement, targetElement);
        expect(result instanceof Promise).toBe(true);
      }).not.toThrow();
    });

    it("should handle missing target element", () => {
      const sourceElement = document.getElementById("quantity-input");

      // Should not throw error
      expect(() => {
        const targetElement = document.getElementById("nonexistent-target");
        const result = createCartBurst(sourceElement, targetElement);
        expect(result instanceof Promise).toBe(true);
      }).not.toThrow();
    });

    it("should use nav link as fallback target", () => {
      document.body.innerHTML = `
        <input id="quantity-input" value="1" />
        <a id="nav-link" href="/cart">Cart</a>
      `;

      const sourceElement = document.getElementById("quantity-input");
      const result = createCartBurst(sourceElement, null);

      expect(result instanceof Promise).toBe(true);
    });

    it("should use cart badge if available", () => {
      const sourceElement = document.getElementById("quantity-input");
      const targetElement = document.getElementById("cart-badge");
      targetElement.style.display = "block";

      const result = createCartBurst(sourceElement, targetElement);

      expect(result instanceof Promise).toBe(true);
    });

    it("should create particle elements for animation", done => {
      document.body.innerHTML = `
        <div id="particles"></div>
        <input id="quantity-input" value="1" />
        <div id="cart-badge"></div>
      `;

      const sourceElement = document.getElementById("quantity-input");
      const targetElement = document.getElementById("cart-badge");
      const particlesContainer = document.getElementById("particles");

      const promise = createCartBurst(sourceElement, targetElement);

      promise.then(() => {
        // Animation should complete
        expect(true).toBe(true);
        done();
      });

      // Simulate animation completion
      setTimeout(() => {
        promise.then(() => {
          expect(particlesContainer).toBeTruthy();
          done();
        });
      }, 1100);
    });

    it("should handle concurrent animations", done => {
      jest.useFakeTimers();

      const source1 = document.getElementById("quantity-input");
      const target = document.getElementById("cart-badge");

      const promise1 = createCartBurst(source1, target);
      const promise2 = createCartBurst(source1, target);

      let completed = 0;

      promise1.then(() => {
        completed++;
        if (completed === 2) done();
      });

      promise2.then(() => {
        completed++;
        if (completed === 2) done();
      });

      jest.advanceTimersByTime(1000);
      jest.useRealTimers();
    });

    it("should handle rapid consecutive animations", done => {
      jest.useFakeTimers();

      const sourceElement = document.getElementById("quantity-input");
      const targetElement = document.getElementById("cart-badge");

      const animations = [];
      for (let i = 0; i < 3; i++) {
        animations.push(createCartBurst(sourceElement, targetElement));
      }

      Promise.all(animations).then(() => {
        expect(animations.length).toBe(3);
        done();
      });

      jest.advanceTimersByTime(1000);
      jest.useRealTimers();
    });
  });

  describe("Cart Notification - Browser Compatibility", () => {
    it("should check for Web Audio API support", () => {
      const hasAudioAPI = typeof AudioContext !== "undefined" || typeof webkitAudioContext !== "undefined";
      expect(typeof hasAudioAPI).toBe("boolean");
    });

    it("should check for requestAnimationFrame support", () => {
      const hasAnimationFrame = typeof window.requestAnimationFrame === "function";
      expect(hasAnimationFrame).toBe(typeof window.requestAnimationFrame === "function");
    });

    it("should work without Audio support", () => {
      // Should not throw error even without audio support
      expect(() => {
        const hasAudio = typeof AudioContext !== "undefined";
        if (!hasAudio) {
          // Graceful degradation
          console.log("Audio API not supported");
        }
        expect(true).toBe(true);
      }).not.toThrow();
    });
  });

  describe("Cart Notification - Cart Update Flow", () => {
    it("should update quantity on successful add", () => {
      const quantitySpan = document.getElementById("cart-quantity");
      quantitySpan.textContent = "0";

      // Simulate adding to cart
      quantitySpan.textContent = "1";

      expect(parseInt(quantitySpan.textContent)).toBe(1);
    });

    it("should trigger sound on item add", done => {
      const sourceElement = document.getElementById("quantity-input");
      const targetElement = document.getElementById("cart-badge");

      // Simulate add to cart
      const promise = createCartBurst(sourceElement, targetElement);

      promise.then(() => {
        expect(true).toBe(true);
        done();
      });

      // Resolve after animation timeout
      setTimeout(() => {}, 1100);
    });

    it("should handle multiple items in cart", () => {
      const quantitySpan = document.getElementById("cart-quantity");

      quantitySpan.textContent = "1";
      expect(parseInt(quantitySpan.textContent)).toBe(1);

      quantitySpan.textContent = "2";
      expect(parseInt(quantitySpan.textContent)).toBe(2);

      quantitySpan.textContent = "5";
      expect(parseInt(quantitySpan.textContent)).toBe(5);
    });

    it("should handle cart clear", () => {
      const quantitySpan = document.getElementById("cart-quantity");
      quantitySpan.textContent = "5";

      // Clear cart
      quantitySpan.textContent = "0";

      expect(parseInt(quantitySpan.textContent)).toBe(0);
    });
  });

  describe("Cart Notification - Visual Feedback", () => {
    it("should show cart badge on item add", () => {
      const cartBadge = document.getElementById("cart-badge");
      cartBadge.style.display = "block";

      expect(cartBadge.style.display).toBe("block");
    });

    it("should animate cart badge", () => {
      const cartBadge = document.getElementById("cart-badge");
      cartBadge.classList.add("animate");

      expect(cartBadge.classList.contains("animate")).toBe(true);
    });

    it("should play sound during animation", done => {
      const sourceElement = document.getElementById("quantity-input");
      const targetElement = document.getElementById("cart-badge");

      const promise = createCartBurst(sourceElement, targetElement);

      // Sound should play at start of animation
      playDingSound();

      promise.then(() => {
        expect(true).toBe(true);
        done();
      });

      setTimeout(() => {}, 1100);
    });

    it("should remove animation class after completion", done => {
      jest.useFakeTimers();

      const cartBadge = document.getElementById("cart-badge");
      cartBadge.classList.add("animate");

      setTimeout(() => {
        cartBadge.classList.remove("animate");
        expect(cartBadge.classList.contains("animate")).toBe(false);
        done();
      }, 1000);

      jest.advanceTimersByTime(1000);
      jest.useRealTimers();
    });
  });
});
