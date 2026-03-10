// Shopping Cart Management
/* eslint-disable-next-line no-unused-vars */
/* global cart */

class ShoppingCart {
  constructor() {
    this.storageKey = "kots_cart";
    this.items = this.loadCart();
    console.log("ShoppingCart initialized with items:", this.items);
    this.updateCartBadge();
  }

  loadCart() {
    const saved = localStorage.getItem(this.storageKey);
    console.log("loadCart - localStorage content:", saved);
    return saved ? JSON.parse(saved) : [];
  }

  saveCart(skipBadgeUpdate = false) {
    console.log("saveCart - saving items:", this.items);
    localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    console.log("saveCart - localStorage now contains:", localStorage.getItem(this.storageKey));
    if (!skipBadgeUpdate) {
      this.updateCartBadge();
    }
  }

  addItem(productKey, color, size, quantity, skipBadgeUpdate = false) {
    const existingItem = this.items.find(
      item => item.productKey === productKey && item.color === color && item.size === size
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({ productKey, color, size, quantity });
    }

    this.saveCart(skipBadgeUpdate);
    return true;
  }

  removeItem(index) {
    this.items.splice(index, 1);
    this.saveCart();
  }

  updateQuantity(index, quantity) {
    if (quantity <= 0) {
      this.removeItem(index);
    } else {
      this.items[index].quantity = quantity;
      this.saveCart();
    }
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getSubtotalCents(products) {
    let subtotal = 0;
    this.items.forEach(item => {
      const product = products.find(p => p.product_key === item.productKey);
      if (product) {
        const price = this.getPriceForVariant(product, item.color, item.size);
        subtotal += price * item.quantity;
      }
    });
    return subtotal;
  }

  getPriceForVariant(product, color, size) {
    // Try to get price from variant object first
    if (
      product.variants &&
      product.variants[color] &&
      product.variants[color].sizes &&
      product.variants[color].sizes[size]
    ) {
      const variantPrice = product.variants[color].sizes[size].price_cents;
      if (variantPrice !== null && variantPrice !== undefined) {
        return variantPrice;
      }
    }

    // Fallback to product display_price (for backwards compatibility)
    if (!product.display_price) return 0;
    const priceStr = product.display_price.replace("$", "");
    return Math.round(parseFloat(priceStr) * 100);
  }

  updateCartBadge() {
    const badge = document.getElementById("cart-badge");
    const total = this.getTotal();
    if (badge) {
      if (total > 0) {
        badge.textContent = total;
        badge.style.display = "flex";
      } else {
        badge.style.display = "none";
      }
    }
  }

  clear() {
    this.items = [];
    this.saveCart();
  }

  validateItemsForCheckout(products) {
    const errors = [];

    this.items.forEach((item, index) => {
      const product = products.find(p => p.product_key === item.productKey);

      if (!product) {
        errors.push(`Item ${index + 1}: Product not found`);
        return;
      }

      if (!product.variants[item.color]) {
        errors.push(`Item ${index + 1}: Color "${item.color}" not available for ${product.title}`);
        return;
      }

      if (!product.variants[item.color].sizes[item.size]) {
        errors.push(`Item ${index + 1}: Size "${item.size}" not available for ${product.title} in ${item.color}`);
        return;
      }

      const variantId = product.variants[item.color].sizes[item.size].variant_id;
      if (!variantId) {
        errors.push(`Item ${index + 1}: Variant ID missing for ${product.title}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Initialize global cart instance
// eslint-disable-next-line no-unused-vars
var cart = new ShoppingCart();
