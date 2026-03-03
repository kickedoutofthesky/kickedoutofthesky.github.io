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
  // Create visual burst when item added to cart
  const burst = document.createElement("div");
  burst.style.cssText = `
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9999;
    pointer-events: none;
    font-size: 2rem;
    animation: cartBurst 0.6s ease-out forwards;
  `;

  const icons = ["🎉", "✨", "🌟", "💫"];
  burst.innerHTML = icons[Math.floor(Math.random() * icons.length)];

  document.body.appendChild(burst);

  setTimeout(() => burst.remove(), 600);
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
  @keyframes cartBurst {
    0% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -200%) scale(0.5);
    }
  }

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
`;
document.head.appendChild(style);
