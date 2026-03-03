// Shopping Cart Management
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

  saveCart() {
    console.log("saveCart - saving items:", this.items);
    localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    console.log("saveCart - localStorage now contains:", localStorage.getItem(this.storageKey));
    this.updateCartBadge();
  }

  addItem(productKey, color, size, quantity) {
    const existingItem = this.items.find(
      item => item.productKey === productKey && item.color === color && item.size === size
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({ productKey, color, size, quantity });
    }

    this.saveCart();
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

  getPriceForVariant(product, _color, _size) {
    // All variants of a product have the same price (product.display_price)
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
}

// Initialize global cart instance
const cart = new ShoppingCart();
