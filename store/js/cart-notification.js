/* global cart */
// Cart Notifications & Animations
// These functions are used globally from other scripts

function playDingSound() {
  // Create a simple beep sound using Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 1000;
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
}

function createCartBurst() {
  // Get the quantity input position
  const quantityInput = document.getElementById("quantity");
  const cartBadge = document.getElementById("cart-badge");

  if (!quantityInput || !cartBadge) {
    console.warn("Quantity input or cart badge not found");
    return Promise.resolve();
  }

  const quantity = parseInt(quantityInput.value) || 1;

  // Get positions
  const inputRect = quantityInput.getBoundingClientRect();
  const badgeRect = cartBadge.getBoundingClientRect();

  return new Promise(resolve => {
    // Create flying badge circle
    const flyingBadge = document.createElement("div");
    flyingBadge.style.cssText = `
      position: fixed;
      top: ${inputRect.top + inputRect.height / 2}px;
      left: ${inputRect.left + inputRect.width / 2}px;
      width: 40px;
      height: 40px;
      background-color: #ffc107;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      font-weight: bold;
      font-size: 1.2rem;
      z-index: 9999;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(255, 193, 7, 0.6);
      transform: translate(-50%, -50%);
    `;
    flyingBadge.textContent = quantity;
    document.body.appendChild(flyingBadge);

    // Animate to cart badge (slower: 1.2s instead of 0.6s)
    setTimeout(() => {
      flyingBadge.style.transition = "all 1.2s ease-in-out";
      flyingBadge.style.top = `${badgeRect.top + badgeRect.height / 2}px`;
      flyingBadge.style.left = `${badgeRect.left + badgeRect.width / 2}px`;
      flyingBadge.style.transform = "translate(-50%, -50%) scale(0.8)";
    }, 10);

    // Burst animation when reaching badge
    setTimeout(() => {
      // Update cart badge and create burst animation
      if (cartBadge && typeof cart !== "undefined") {
        cart.updateCartBadge();

        // Add burst animation to the badge
        cartBadge.style.animation = "badgeBurst 0.5s ease-out";
        setTimeout(() => {
          cartBadge.style.animation = "";
        }, 500);
      }

      // Create burst particles
      for (let i = 0; i < 8; i++) {
        const particle = document.createElement("div");
        const angle = (i / 8) * Math.PI * 2;
        const velocity = 100;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        particle.style.cssText = `
          position: fixed;
          top: ${badgeRect.top + badgeRect.height / 2}px;
          left: ${badgeRect.left + badgeRect.width / 2}px;
          width: 8px;
          height: 8px;
          background-color: #ffc107;
          border-radius: 50%;
          z-index: 9998;
          pointer-events: none;
          box-shadow: 0 2px 8px rgba(255, 193, 7, 0.8);
          transform: translate(-50%, -50%);
        `;
        document.body.appendChild(particle);

        // Animate particles outward
        setTimeout(() => {
          particle.style.transition = "all 0.5s ease-out";
          particle.style.top = `${badgeRect.top + badgeRect.height / 2 + vy}px`;
          particle.style.left = `${badgeRect.left + badgeRect.width / 2 + vx}px`;
          particle.style.opacity = "0";
        }, 10);

        setTimeout(() => particle.remove(), 600);
      }

      flyingBadge.remove();
      resolve();
    }, 1200);
  });
}

function showCartBadgeBurst() {
  // Play ding sound
  playDingSound();

  // Update cart badge and show burst animation
  const cartBadge = document.getElementById("cart-badge");
  if (cartBadge && typeof cart !== "undefined") {
    cart.updateCartBadge();

    // Add burst animation to the badge
    cartBadge.style.animation = "badgeBurst 0.5s ease-out";
    setTimeout(() => {
      cartBadge.style.animation = "";
    }, 500);

    // Create burst particles
    const badgeRect = cartBadge.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement("div");
      const angle = (i / 8) * Math.PI * 2;
      const velocity = 100;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;

      particle.style.cssText = `
        position: fixed;
        top: ${badgeRect.top + badgeRect.height / 2}px;
        left: ${badgeRect.left + badgeRect.width / 2}px;
        width: 8px;
        height: 8px;
        background-color: #ffc107;
        border-radius: 50%;
        z-index: 9998;
        pointer-events: none;
        box-shadow: 0 2px 8px rgba(255, 193, 7, 0.8);
        transform: translate(-50%, -50%);
      `;
      document.body.appendChild(particle);

      // Animate particles outward
      setTimeout(() => {
        particle.style.transition = "all 0.5s ease-out";
        particle.style.top = `${badgeRect.top + badgeRect.height / 2 + vy}px`;
        particle.style.left = `${badgeRect.left + badgeRect.width / 2 + vx}px`;
        particle.style.opacity = "0";
      }, 10);

      setTimeout(() => particle.remove(), 600);
    }
  }
}

function showCartNotification(productName) {
  const notification = document.createElement("div");
  notification.className = "alert alert-success";
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 9998;
    min-width: 300px;
    animation: slideIn 0.3s ease-out;
  `;

  notification.innerHTML = `
    <i class="fas fa-check-circle"></i>
    <strong>${productName}</strong> added to cart!
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 2500);
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }

  @keyframes badgeBurst {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.3);
    }
    100% {
      transform: scale(1);
    }
  }
`;
document.head.appendChild(style);
