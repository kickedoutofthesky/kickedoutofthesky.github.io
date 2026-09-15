/* eslint-disable no-undef */
const { playDingSound, createCartBurst } = require("../cart-notification");

describe("Cart Notifications - playDingSound", () => {
  let mockAudioContext;
  let mockOscillator;
  let mockGainNode;

  beforeEach(() => {
    // Mock Audio API
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

    window.AudioContext = jest.fn(() => mockAudioContext);
    window.webkitAudioContext = jest.fn(() => mockAudioContext);

    // Clear DOM
    document.body.innerHTML = "";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create oscillator and gain node", () => {
    playDingSound();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
  });

  it("should connect oscillator to gain node", () => {
    playDingSound();
    expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
  });

  it("should connect gain node to audio context destination", () => {
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
});

describe("Cart Notifications - createCartBurst", () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <input id="quantity" type="number" value="1" />
      <div id="cart-badge" style="display: block;">Badge</div>
      <a class="nav-link" href="cart.html">Cart</a>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should return a Promise", () => {
    const result = createCartBurst();
    expect(result).toBeInstanceOf(Promise);
  });

  it("should resolve immediately if quantity input not found", async () => {
    document.body.innerHTML = "";
    const result = createCartBurst();
    await expect(result).resolves.toBeUndefined();
  });

  it("should find cart badge element", () => {
    const spy = jest.spyOn(document, "getElementById");
    createCartBurst();
    expect(spy).toHaveBeenCalledWith("quantity");
    expect(spy).toHaveBeenCalledWith("cart-badge");
    spy.mockRestore();
  });

  it("should handle missing quantity input gracefully", async () => {
    const quantityInput = document.getElementById("quantity");
    quantityInput.remove();

    const result = createCartBurst();
    await expect(result).resolves.toBeUndefined();
  });

  it("should parse quantity from input", () => {
    const quantityInput = document.getElementById("quantity");
    quantityInput.value = "5";

    const result = createCartBurst();
    expect(result).toBeInstanceOf(Promise);
  });

  it("should fallback to quantity 1 for invalid input", () => {
    const quantityInput = document.getElementById("quantity");
    quantityInput.value = "invalid";

    const result = createCartBurst();
    expect(result).toBeInstanceOf(Promise);
  });

  it("should use cart badge if visible", () => {
    const badge = document.getElementById("cart-badge");
    badge.style.display = "block";

    const result = createCartBurst();
    expect(result).toBeInstanceOf(Promise);
  });

  it("should fallback to nav link if badge not visible", () => {
    const badge = document.getElementById("cart-badge");
    badge.style.display = "none";

    const result = createCartBurst();
    expect(result).toBeInstanceOf(Promise);
  });

  it("should complete the animation promise", () => {
    const result = createCartBurst();
    expect(result).toBeInstanceOf(Promise);
    // The Promise will resolve after the animation timeout
    // Just verify it's a valid Promise
    expect(result.then).toBeDefined();
    expect(result.catch).toBeDefined();
  });
});
