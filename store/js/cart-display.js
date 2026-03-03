// Cart Display & Checkout

let products = [];

document.addEventListener("DOMContentLoaded", async () => {
  // Debug: Check if cart exists
  console.log("cart object exists:", typeof cart !== "undefined");
  console.log("cart object:", typeof cart !== "undefined" ? cart : "UNDEFINED");

  // Force reload cart from localStorage to ensure we have latest items
  if (typeof cart !== "undefined" && cart && typeof cart.loadCart === "function") {
    const freshItems = cart.loadCart();
    console.log("Fresh items from localStorage:", freshItems);
    cart.items = freshItems;
  }

  await loadProducts();
  displayCart();
  setupCheckout();
});

async function loadProducts() {
  try {
    const response = await fetch("./data/products.json");
    if (!response.ok) throw new Error("Failed to load products");
    products = await response.json();
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

function displayCart() {
  const cartItems = document.getElementById("cart-items");
  const cartSummary = document.getElementById("cart-summary");
  const emptyCart = document.getElementById("empty-cart");

  // Debug logging
  console.log("displayCart called");
  console.log("cart object:", cart);
  console.log("cart.items:", cart?.items);
  console.log("localStorage content:", localStorage.getItem("kots_cart"));

  if (!cart || !cart.items || cart.items.length === 0) {
    cartItems.style.display = "none";
    emptyCart.style.display = "block";
    if (cartSummary) cartSummary.style.display = "none";
    return;
  }

  emptyCart.style.display = "none";
  cartItems.style.display = "grid";
  if (cartSummary) cartSummary.style.display = "block";

  cartItems.innerHTML = "";

  cart.items.forEach((item, index) => {
    const product = products.find(p => p.product_key === item.productKey);
    if (!product) return;

    const image = getProductImage(product, item.color);
    const pricePerItem = cart.getPriceForVariant(product, item.color, item.size);
    const lineTotal = pricePerItem * item.quantity;

    const itemCard = document.createElement("div");
    itemCard.style.cssText = "background: #0f0f0f; padding: 20px; border-radius: 8px; border: 1px solid #1a1a1a; display: flex; gap: 20px;";

    itemCard.innerHTML = `
      <div style="width: 120px; height: 120px; flex-shrink: 0; background: #1a1a1a; border-radius: 4px; overflow: hidden;">
        <img src="${image}" alt="${product.title}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div style="flex: 1; text-align: left;">
        <h4 style="color: #fff; margin-bottom: 8px;">${product.title}</h4>
        <p style="color: #ccc; font-size: 0.9rem; margin: 4px 0;">Color: ${item.color}</p>
        <p style="color: #ccc; font-size: 0.9rem; margin: 4px 0;">Size: ${item.size}</p>
        <div style="display: flex; gap: 10px; align-items: center; margin-top: 15px;">
          <span style="color: #ffc107; font-weight: bold;">$${(pricePerItem / 100).toFixed(2)}</span>
          <span style="color: #ccc;">×</span>
          <button onclick="updateCartQuantity(${index}, ${item.quantity - 1})" style="background: #333; color: #fff; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;">−</button>
          <input type="text" value="${item.quantity}" readonly style="width: 50px; padding: 5px; background: #1a1a1a; color: #fff; border: 1px solid #333; text-align: center; border-radius: 4px;">
          <button onclick="updateCartQuantity(${index}, ${item.quantity + 1})" style="background: #333; color: #fff; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;">+</button>
          <span style="color: #ccc; margin-left: auto;">Total: <span style="color: #ffc107; font-weight: bold;">$${(lineTotal / 100).toFixed(2)}</span></span>
          <button onclick="removeFromCart(${index})" style="background: #cb2431; color: #fff; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Delete</button>
        </div>
      </div>
    `;

    cartItems.appendChild(itemCard);
  });

  updateCartSummary();
}

function updateCartSummary() {
  const subtotalEl = document.getElementById("subtotal");
  const totalEl = document.getElementById("total");

  if (!subtotalEl || !totalEl) return;

  const subtotalCents = cart.getSubtotalCents(products);
  const subtotalDollars = subtotalCents / 100;

  subtotalEl.textContent = `$${subtotalDollars.toFixed(2)}`;
  totalEl.textContent = `$${subtotalDollars.toFixed(2)}`;
}

function updateCartQuantity(index, quantity) {
  if (quantity <= 0) {
    removeFromCart(index);
  } else {
    cart.updateQuantity(index, quantity);
    displayCart();
  }
}

function removeFromCart(index) {
  cart.removeItem(index);
  displayCart();
}

function getProductImage(product, color) {
  // Use color-specific image if available
  if (color && product.variants[color] && product.variants[color].image) {
    return product.variants[color].image;
  }
  // Fallback to product image
  return product.image;
}

function setupCheckout() {
  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", proceedToCheckout);
  }
}

async function proceedToCheckout() {
  if (cart.items.length === 0) {
    alert("Your cart is empty");
    return;
  }

  try {
    // Transform cart items for backend
    const items = cart.items.map(item => {
      const product = products.find(p => p.product_key === item.productKey);
      if (!product) return null;

      const variantId = product.variants[item.color]?.sizes?.[item.size]?.variant_id;
      const priceCents = cart.getPriceForVariant(product, item.color, item.size);

      return {
        variant_id: variantId,
        product_name: product.title,
        color: item.color,
        size: item.size,
        price_cents: priceCents,
        quantity: item.quantity,
      };
    }).filter(item => item !== null);

    const subtotalCents = cart.getSubtotalCents(products);

    // Call backend checkout endpoint
    const response = await fetch(
      "https://kickedoutofthesky-store.vercel.app/api/create-checkout-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          subtotal_cents: subtotalCents,
          orderDate: new Date().toISOString(),
          successUrl: window.location.origin + "/store/success.html",
          cancelUrl: window.location.href,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Checkout failed");
    }

    const data = await response.json();

    // Redirect to Stripe checkout
    if (data.redirect_url) {
      window.location.href = data.redirect_url;
    } else if (data.url) {
      window.location.href = data.url;
    }
  } catch (error) {
    console.error("Checkout error:", error);
    alert("Checkout failed. Please try again.");
  }
}


    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <img src="${image}" alt="${product.title}" style="max-width: 80px; height: auto;">
      </td>
      <td>
        <strong>${product.title}</strong><br>
        Color: ${item.color}<br>
        Size: ${item.size}
      </td>
      <td>$${(pricePerItem / 100).toFixed(2)}</td>
      <td>
        <div class="input-group" style="width: 100px;">
          <button class="btn btn-sm btn-outline-secondary" type="button" onclick="updateCartQuantity(${index}, ${item.quantity - 1})">-</button>
          <input type="text" class="form-control text-center" value="${item.quantity}" readonly>
          <button class="btn btn-sm btn-outline-secondary" type="button" onclick="updateCartQuantity(${index}, ${item.quantity + 1})">+</button>
        </div>
      </td>
      <td>$${(lineTotal / 100).toFixed(2)}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="removeFromCart(${index})">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    cartItems.appendChild(row);
  });

  updateCartSummary();
}

function updateCartSummary() {
  const subtotalEl = document.getElementById("subtotal");
  const totalEl = document.getElementById("total");

  if (!subtotalEl || !totalEl) return;

  const subtotalCents = cart.getSubtotalCents(products);
  const subtotalDollars = subtotalCents / 100;

  subtotalEl.textContent = `$${subtotalDollars.toFixed(2)}`;
  totalEl.textContent = `$${subtotalDollars.toFixed(2)}`;
}

function updateCartQuantity(index, quantity) {
  if (quantity <= 0) {
    removeFromCart(index);
  } else {
    cart.updateQuantity(index, quantity);
    displayCart();
  }
}

function removeFromCart(index) {
  cart.removeItem(index);
  displayCart();
}

function getProductImage(product, color) {
  // All colors share the same product image
  return product.image;
}

function setupCheckout() {
  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", proceedToCheckout);
  }
}

async function proceedToCheckout() {
  if (cart.items.length === 0) {
    alert("Your cart is empty");
    return;
  }

  try {
    // Transform cart items for backend
    const items = cart.items
      .map(item => {
        const product = products.find(p => p.product_key === item.productKey);
        if (!product) return null;

        const variantId = product.variants[item.color]?.[item.size]?.variant_id;
        const priceCents = cart.getPriceForVariant(product, item.color, item.size);

        return {
          variant_id: variantId,
          product_name: product.title,
          color: item.color,
          size: item.size,
          price_cents: priceCents,
          quantity: item.quantity,
        };
      })
      .filter(item => item !== null);

    const subtotalCents = cart.getSubtotalCents(products);

    // Call backend checkout endpoint
    const response = await fetch("https://kickedoutofthesky-store.vercel.app/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items,
        subtotal_cents: subtotalCents,
        orderDate: new Date().toISOString(),
        successUrl: window.location.origin + "/store/success.html",
        cancelUrl: window.location.href,
      }),
    });

    if (!response.ok) {
      throw new Error("Checkout failed");
    }

    const data = await response.json();

    // Redirect to Stripe checkout
    if (data.redirect_url) {
      window.location.href = data.redirect_url;
    } else if (data.url) {
      window.location.href = data.url;
    }
  } catch (error) {
    console.error("Checkout error:", error);
    alert("Checkout failed. Please try again.");
  }
}
