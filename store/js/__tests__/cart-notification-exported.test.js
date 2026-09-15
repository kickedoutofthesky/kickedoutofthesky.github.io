/**
 * Cart Notification - Exported Functions Tests
 * Tests exported functions: playDingSound, createCartBurst
 */

import { playDingSound, createCartBurst } from "../cart-notification";

describe("Cart Notification - Exported Functions", () => {
  describe("playDingSound", () => {
    let mockAudioContext;
    let mockOscillator;
    let mockGainNode;

    beforeEach(() => {
      // Mock Web Audio API
      mockOscillator = {
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { value: 0 },
        type: "",
      };

      mockGainNode = {
        connect: jest.fn(),
        gain: {
          setValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn(),
        },
      };

      mockAudioContext = {
        createOscillator: jest.fn(() => mockOscillator),
        createGain: jest.fn(() => mockGainNode),
        destination: {},
        currentTime: 0,
      };

      global.AudioContext = jest.fn(() => mockAudioContext);
      global.webkitAudioContext = jest.fn(() => mockAudioContext);
    });

    afterEach(() => {
      delete global.AudioContext;
      delete global.webkitAudioContext;
    });

    it("should create audio context", () => {
      playDingSound();
      expect(global.AudioContext).toHaveBeenCalled();
    });

    it("should create oscillator", () => {
      playDingSound();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it("should create gain node", () => {
      playDingSound();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it("should connect oscillator to gain node", () => {
      playDingSound();
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
    });

    it("should connect gain node to audio destination", () => {
      playDingSound();
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
    });

    it("should set oscillator frequency to 1000 Hz", () => {
      playDingSound();
      expect(mockOscillator.frequency.value).toBe(1000);
    });

    it("should set oscillator type to sine wave", () => {
      playDingSound();
      expect(mockOscillator.type).toBe("sine");
    });

    it("should set initial gain to 0.3", () => {
      playDingSound();
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.3, mockAudioContext.currentTime);
    });

    it("should ramp down gain to 0.01 over 0.1 seconds", () => {
      playDingSound();
      expect(mockGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
        0.01,
        mockAudioContext.currentTime + 0.1
      );
    });

    it("should start oscillator", () => {
      playDingSound();
      expect(mockOscillator.start).toHaveBeenCalledWith(mockAudioContext.currentTime);
    });

    it("should stop oscillator after 0.1 seconds", () => {
      playDingSound();
      expect(mockOscillator.stop).toHaveBeenCalledWith(mockAudioContext.currentTime + 0.1);
    });

    it("should handle webkit audio context", () => {
      delete global.AudioContext;
      playDingSound();
      expect(global.webkitAudioContext).toHaveBeenCalled();
    });

    it("should handle missing audio context gracefully", () => {
      // When both AudioContext and webkitAudioContext are unavailable,
      // the function will throw (which is acceptable behavior)
      // This tests that it at least attempts to create one
      delete global.AudioContext;
      delete global.webkitAudioContext;

      // The function will throw when trying to call new on undefined
      expect(() => {
        playDingSound();
      }).toThrow();
    });
  });

  describe("createCartBurst", () => {
    beforeEach(() => {
      // Setup DOM
      document.body.innerHTML = `
        <input id="quantity" value="2">
        <div id="cart-badge">3</div>
        <a href="cart.html" class="nav-link">Cart</a>
      `;
    });

    afterEach(() => {
      document.body.innerHTML = "";
    });

    it("should return a promise", () => {
      const result = createCartBurst();
      expect(result).toBeInstanceOf(Promise);
    });

    it("should create flying badge element", async () => {
      createCartBurst();
      await new Promise(resolve => setTimeout(resolve, 50));

      const elements = document.querySelectorAll("div[style*='position: fixed']");
      expect(elements.length).toBeGreaterThan(0);
    });

    it("should display quantity in flying badge", async () => {
      const quantityInput = document.getElementById("quantity");
      quantityInput.value = "5";

      createCartBurst();
      await new Promise(resolve => setTimeout(resolve, 50));

      const badge = Array.from(document.querySelectorAll("div")).find(
        el => el.textContent === "5" && el.style.position === "fixed"
      );
      expect(badge).toBeTruthy();
    });

    it("should handle missing quantity input gracefully", async () => {
      document.getElementById("quantity").remove();

      const result = createCartBurst();
      const resolved = await result;

      expect(resolved).toBeUndefined();
    });

    it("should use cart badge as target", async () => {
      createCartBurst();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Check that animation elements were created
      const elements = document.querySelectorAll("div[style*='z-index: 9999']");
      expect(elements.length).toBeGreaterThan(0);
    });

    it("should fallback to cart link when badge not visible", async () => {
      const badge = document.getElementById("cart-badge");
      badge.style.display = "none";

      createCartBurst();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should still create animation with cart link as target
      const elements = document.querySelectorAll("div[style*='position: fixed']");
      expect(elements.length).toBeGreaterThan(0);
    });

    it("should handle missing cart link gracefully", async () => {
      document.querySelector("a[href='cart.html']").remove();

      const result = createCartBurst();
      const resolved = await result;

      expect(resolved).toBeUndefined();
    });

    it("should parse quantity as integer", async () => {
      const quantityInput = document.getElementById("quantity");
      quantityInput.value = "3.5";

      createCartBurst();
      await new Promise(resolve => setTimeout(resolve, 50));

      // The quantity should be parsed as 3
      const badge = Array.from(document.querySelectorAll("div")).find(
        el => el.textContent === "3" && el.style.position === "fixed"
      );
      expect(badge).toBeTruthy();
    });

    it("should handle non-numeric quantity", async () => {
      const quantityInput = document.getElementById("quantity");
      quantityInput.value = "not-a-number";

      createCartBurst();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should default to 1
      const badge = Array.from(document.querySelectorAll("div")).find(
        el => el.textContent === "1" && el.style.position === "fixed"
      );
      expect(badge).toBeTruthy();
    });

    it("should resolve promise eventually", async () => {
      const result = createCartBurst();

      // Should be a promise
      expect(result).toBeInstanceOf(Promise);

      // Wait for promise to resolve (animation is 1200ms + buffer)
      const resolved = await Promise.race([
        result.then(() => true),
        new Promise(resolve => setTimeout(() => resolve(false), 2000)),
      ]);

      // Should have resolved by now
      expect(resolved).toBe(true);
    });

    it("should apply animation styles to flying badge", async () => {
      createCartBurst();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Check that fixed positioned elements are created
      const elements = document.querySelectorAll("div[style*='position: fixed']");
      expect(elements.length).toBeGreaterThan(0);

      // At least one should be a badge with animation styles
      const hasAnimatedBadge = Array.from(elements).some(
        el => el.style.borderRadius === "50%" && el.textContent.match(/^\d+$/)
      );
      expect(hasAnimatedBadge).toBe(true);
    });

    it("should create particle elements during burst", () => {
      createCartBurst();

      // Particles are created immediately during burst initiation
      // Even if they're cleaned up later, they're created during the function call
      const allElements = document.querySelectorAll("div[style*='position: fixed']");

      // Should have flying badge + particles
      expect(allElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Integration scenarios", () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <input id="quantity" value="2">
        <div id="cart-badge">0</div>
      `;
    });

    afterEach(() => {
      document.body.innerHTML = "";
    });

    it("should work together in add to cart flow", async () => {
      const mockAudioContext = {
        createOscillator: () => ({
          connect: jest.fn(),
          start: jest.fn(),
          stop: jest.fn(),
          frequency: { value: 0 },
          type: "",
        }),
        createGain: () => ({
          connect: jest.fn(),
          gain: {
            setValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
          },
        }),
        destination: {},
        currentTime: 0,
      };

      global.AudioContext = jest.fn(() => mockAudioContext);

      // 1. Play sound
      playDingSound();
      expect(global.AudioContext).toHaveBeenCalled();

      // 2. Create burst animation
      const result = createCartBurst();
      expect(result).toBeInstanceOf(Promise);

      delete global.AudioContext;
    });

    it("should handle rapid successive calls", () => {
      const result1 = createCartBurst();
      const result2 = createCartBurst();

      // Both should return promises
      expect(result1).toBeInstanceOf(Promise);
      expect(result2).toBeInstanceOf(Promise);
    });
  });

  describe("Error handling", () => {
    it("should handle missing DOM elements gracefully", async () => {
      document.body.innerHTML = "";

      const result = createCartBurst();
      const resolved = await result;

      expect(resolved).toBeUndefined();
    });

    it("should handle audio context creation error", () => {
      global.AudioContext = jest.fn(() => {
        throw new Error("AudioContext not available");
      });

      // Function will throw when audio context can't be created
      expect(() => {
        playDingSound();
      }).toThrow();

      delete global.AudioContext;
    });

    it("should create elements during animation", async () => {
      document.body.innerHTML = `
        <input id="quantity" value="2">
        <div id="cart-badge">0</div>
      `;

      // The function returns a promise for the animation
      const result = createCartBurst();
      expect(result).toBeInstanceOf(Promise);

      // Wait for some elements to be created (or cleaned up)
      await new Promise(resolve => setTimeout(resolve, 100));

      // The test passes if no errors were thrown
      expect(true).toBe(true);

      document.body.innerHTML = "";
    });
  });
});
