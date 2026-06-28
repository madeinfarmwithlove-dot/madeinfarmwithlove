/* ==========================================================================
   MADE IN FARM - FRONTEND INTERACTION & CART APP
   ========================================================================== */

let productsData = [];
let cart = [];
let selectedWeights = {}; // Map of productId -> selected weight string ("250g", "500g", "1kg")
let storeConfig = { whatsappNumber: "919876543210" };

// Fallback products catalog if offline or direct static view
const fallbackProducts = [
  {
    id: "cashews",
    name: "Royal King Cashews",
    tagline: "Whole jumbo W240 grade cashews, buttery & crisp.",
    organic: true,
    image: "images/cashews.jpg",
    prices: { "250g": 380, "500g": 720, "1kg": 1400 }
  },
  {
    id: "almonds",
    name: "Mammoth California Almonds",
    tagline: "Crunchy, high-protein organic raw almonds.",
    organic: true,
    image: "images/almonds.jpg",
    prices: { "250g": 320, "500g": 620, "1kg": 1200 }
  },
  {
    id: "walnuts",
    name: "Mountain Harvest Walnuts",
    tagline: "Rich in Omega-3, soft Chilean halves.",
    organic: false,
    image: "images/walnuts.jpg",
    prices: { "250g": 360, "500g": 690, "1kg": 1350 }
  },
  {
    id: "pistachios",
    name: "Roasted Salted Pistachios",
    tagline: "Premium Iranian green pistachios in light sea salt.",
    organic: false,
    image: "images/pistachios.jpg",
    prices: { "250g": 410, "500g": 790, "1kg": 1550 }
  },
  {
    id: "raisins",
    name: "Sun-Dried Golden Raisins",
    tagline: "Naturally sweet Afghan golden raisins.",
    organic: false,
    image: "images/raisins.jpg",
    video: "images/raisins.mp4",
    prices: { "250g": 180, "500g": 340, "1kg": 650 }
  },
  {
    id: "dates",
    name: "Royal Medjool Dates",
    tagline: "Soft, caramel-like organic handpicked dates.",
    organic: true,
    image: "images/dates.jpg",
    prices: { "250g": 450, "500g": 880, "1kg": 1700 }
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initNavbarScroll();
  initScrollReveal();
  initCartListeners();
  loadProducts();
});

// 1. Sticky Navbar Effect
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// 2. Scroll Reveal Animations
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.15 });

  reveals.forEach(reveal => observer.observe(reveal));
}

// 3. Load Products from Backend API
async function loadProducts() {
  const container = document.getElementById('products-grid-container');
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data.success && data.products) {
      productsData = data.products;
      if (data.storeConfig) storeConfig = data.storeConfig;
    } else {
      productsData = fallbackProducts;
    }
  } catch (err) {
    console.log("Using fallback products catalog.");
    productsData = fallbackProducts;
  }

  // Set default weights
  productsData.forEach(p => {
    selectedWeights[p.id] = "250g";
  });

  renderProducts();
}

// 4. Render Product Cards
function renderProducts() {
  const container = document.getElementById('products-grid-container');
  container.innerHTML = '';

  productsData.forEach(product => {
    const currentWeight = selectedWeights[product.id] || "250g";
    const currentPrice = product.prices[currentWeight];

    const card = document.createElement('div');
    card.className = 'product-card reveal active';
    card.innerHTML = `
      <div class="product-img-box" onclick="openProductModal('${product.id}')" style="cursor: pointer;">
        ${product.video ? 
          `<video src="${product.video}" autoplay loop muted playsinline poster="${product.image}"></video>` : 
          `<img src="${product.image}" alt="${product.name}">`
        }
        ${product.organic ? `<div class="organic-badge">🌿 Natural & Organic</div>` : ''}
      </div>
      <div class="product-content">
        <h3 class="product-name" onclick="openProductModal('${product.id}')" style="cursor: pointer;">${product.name}</h3>
        <p class="product-desc">${product.tagline}</p>
        
        <div class="weight-selector">
          ${Object.keys(product.prices).map(weight => `
            <button class="weight-btn ${weight === currentWeight ? 'active' : ''}" 
                    onclick="selectWeight('${product.id}', '${weight}')">
              ${weight}
            </button>
          `).join('')}
        </div>

        <div class="product-footer">
          <div class="product-price">₹<span id="price-${product.id}">${currentPrice}</span></div>
          <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
            Add to Cart
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Switch Weight Option per product
function selectWeight(productId, weight) {
  selectedWeights[productId] = weight;
  const product = productsData.find(p => p.id === productId);
  if (product) {
    const priceSpan = document.getElementById(`price-${productId}`);
    if (priceSpan) {
      priceSpan.innerText = product.prices[weight];
    }
    // Update active button state
    const card = priceSpan.closest('.product-card');
    const btns = card.querySelectorAll('.weight-btn');
    btns.forEach(btn => {
      if (btn.innerText.trim() === weight) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
}

// 5. Cart Management
function addToCart(productId) {
  const product = productsData.find(p => p.id === productId);
  const weight = selectedWeights[productId] || "250g";
  const price = product.prices[weight];

  const existingItemIndex = cart.findIndex(item => item.id === productId && item.weight === weight);

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      weight: weight,
      price: price,
      quantity: 1,
      image: product.image
    });
  }

  updateCartUI();
  openCart();
}

function updateCartUI() {
  const countBadge = document.getElementById('cart-count-badge');
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  countBadge.innerText = totalItems;

  const itemsContainer = document.getElementById('cart-items-container');
  const checkoutForm = document.getElementById('checkout-form-box');
  const checkoutBtn = document.getElementById('whatsapp-checkout-btn');
  const totalPriceSpan = document.getElementById('cart-total-price');

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem 0; color: #777;">
        <span style="font-size: 3rem; display: block; margin-bottom: 1rem;">🧺</span>
        <p>Your farm cart is empty.</p>
        <p style="font-size: 0.85rem; margin-top: 0.5rem;">Explore our high-grade harvest dry fruits!</p>
      </div>
    `;
    checkoutForm.style.display = 'none';
    checkoutBtn.disabled = true;
    totalPriceSpan.innerText = '₹0';
    return;
  }

  checkoutForm.style.display = 'block';
  checkoutBtn.disabled = false;

  let total = 0;
  itemsContainer.innerHTML = '';

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';
    itemEl.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">Pack: <strong>${item.weight}</strong> | ₹${item.price} each</div>
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.4rem;">
          <button style="padding: 2px 8px; border: 1px solid #ccc; background: #fff;" onclick="changeQty(${index}, -1)">-</button>
          <span style="font-weight: 700; font-size: 0.9rem;">${item.quantity}</span>
          <button style="padding: 2px 8px; border: 1px solid #ccc; background: #fff;" onclick="changeQty(${index}, 1)">+</button>
        </div>
      </div>
      <div style="text-align: right;">
        <div class="cart-item-price">₹${itemTotal}</div>
        <button class="remove-item-btn" onclick="removeItem(${index})">🗑️</button>
      </div>
    `;
    itemsContainer.appendChild(itemEl);
  });

  totalPriceSpan.innerText = `₹${total}`;
}

function changeQty(index, delta) {
  if (cart[index]) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    updateCartUI();
  }
}

function removeItem(index) {
  cart.splice(index, 1);
  updateCartUI();
}

// 6. Drawer Overlay Control
function initCartListeners() {
  const openBtn = document.getElementById('open-cart-btn');
  const closeBtn = document.getElementById('close-cart-btn');
  const overlay = document.getElementById('cart-overlay');
  const checkoutBtn = document.getElementById('whatsapp-checkout-btn');

  openBtn.addEventListener('click', openCart);
  closeBtn.addEventListener('click', closeCart);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeCart();
  });

  checkoutBtn.addEventListener('click', handleWhatsAppCheckout);
}

function openCart() {
  document.getElementById('cart-overlay').classList.add('open');
}

function closeCart() {
  document.getElementById('cart-overlay').classList.remove('open');
}

// 7. Process WhatsApp Checkout
async function handleWhatsAppCheckout() {
  const name = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const address = document.getElementById('cust-address').value.trim();
  const pincode = document.getElementById('cust-pincode').value.trim();

  if (!name || !phone || !address || !pincode) {
    alert('Please fill in all delivery information fields (Name, Phone, Address, Pincode) so we can dispatch your harvest order!');
    return;
  }

  const totalAmount = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const payload = {
    customer: { name, phone, address, pincode },
    items: cart,
    totalAmount
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success && data.whatsappUrl) {
      window.open(data.whatsappUrl, '_blank');
    } else {
      fallbackWhatsAppLaunch(payload);
    }
  } catch (err) {
    fallbackWhatsAppLaunch(payload);
  }
}

function fallbackWhatsAppLaunch(payload) {
  let text = `*New Order - Made in Farm*\n\n`;
  text += `*Customer Details:*\n👤 Name: ${payload.customer.name}\n📞 Phone: ${payload.customer.phone}\n📍 Address: ${payload.customer.address}, ${payload.customer.pincode}\n\n`;
  text += `*Ordered Items:*\n`;
  payload.items.forEach((item, idx) => {
    text += `${idx + 1}. ${item.name} (${item.weight}) x ${item.quantity} = ₹${item.price * item.quantity}\n`;
  });
  text += `\n*Total Amount:* ₹${payload.totalAmount}\n\nPlease confirm my order!`;

  const url = `https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

// 8. Store WhatsApp Config Modal
function openConfigModal() {
  document.getElementById('store-wa-number').value = storeConfig.whatsappNumber;
  document.getElementById('config-modal').style.display = 'flex';
}

function closeConfigModal() {
  document.getElementById('config-modal').style.display = 'none';
}

async function saveStoreConfig() {
  const num = document.getElementById('store-wa-number').value.trim();
  if (num) {
    storeConfig.whatsappNumber = num.replace(/[^0-9]/g, '');
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNumber: storeConfig.whatsappNumber })
      });
    } catch(e) {}
    alert(`Store WhatsApp number set to: +${storeConfig.whatsappNumber}`);
    closeConfigModal();
  }
}

// 9. Amazon / Flipkart Style Product Detail Slideshow Modal Logic
let activeModalProductId = null;
let modalQty = 1;

function getProductGallery(product) {
  const gallery = [{ type: 'image', url: product.image }];
  if (product.video) {
    gallery.push({ type: 'video', url: product.video, poster: product.image });
  }
  gallery.push({ type: 'image', url: 'images/hero.jpg' });
  gallery.push({ type: 'image', url: 'images/farm.jpg' });
  return gallery;
}

function openProductModal(productId) {
  activeModalProductId = productId;
  modalQty = 1;
  const product = productsData.find(p => p.id === productId);
  if (!product) return;

  const currentWeight = selectedWeights[productId] || "250g";
  const currentPrice = product.prices[currentWeight];

  document.getElementById('modal-product-title').innerText = product.name;
  document.getElementById('modal-product-tagline').innerText = product.tagline;
  document.getElementById('modal-product-price').innerText = `₹${currentPrice}`;
  document.getElementById('modal-qty-val').innerText = modalQty;

  const badgeEl = document.getElementById('modal-organic-badge');
  if (product.organic) {
    badgeEl.innerHTML = `<div class="organic-badge" style="position:relative; top:0; left:0; display:inline-flex; margin-bottom:0.75rem;">🌿 Natural & Organic</div>`;
  } else {
    badgeEl.innerHTML = '';
  }

  // Render Weight Selector
  const weightContainer = document.getElementById('modal-weight-selector');
  weightContainer.innerHTML = Object.keys(product.prices).map(w => `
    <button class="weight-btn ${w === currentWeight ? 'active' : ''}" onclick="selectModalWeight('${w}')">
      ${w}
    </button>
  `).join('');

  // Render Gallery Slideshow
  const gallery = getProductGallery(product);
  renderModalGallery(gallery);

  // Set CTA action
  const addBtn = document.getElementById('modal-add-cart-btn');
  addBtn.onclick = () => addModalItemToCart();

  document.getElementById('product-modal-overlay').classList.add('open');
}

function closeProductModal() {
  document.getElementById('product-modal-overlay').classList.remove('open');
  // Stop playing video when modal closes
  const mainBox = document.getElementById('modal-main-display');
  mainBox.innerHTML = '';
}

function renderModalGallery(gallery) {
  const thumbStrip = document.getElementById('modal-thumbnail-strip');
  thumbStrip.innerHTML = '';

  // Display first item initially
  switchModalMedia(gallery[0]);

  gallery.forEach((item, index) => {
    const thumb = document.createElement('div');
    thumb.className = `thumb-item ${index === 0 ? 'active' : ''}`;
    if (item.type === 'video') {
      thumb.innerHTML = `
        <video src="${item.url}" muted preload="metadata"></video>
        <div class="thumb-video-icon">▶</div>
      `;
    } else {
      thumb.innerHTML = `<img src="${item.url}" alt="Thumbnail">`;
    }

    thumb.onclick = () => {
      document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      switchModalMedia(item);
    };

    thumbStrip.appendChild(thumb);
  });
}

function switchModalMedia(item) {
  const mainBox = document.getElementById('modal-main-display');
  if (item.type === 'video') {
    mainBox.innerHTML = `<video src="${item.url}" controls autoplay loop playsinline poster="${item.poster || ''}" style="width:100%; height:100%; object-fit:cover;"></video>`;
  } else {
    mainBox.innerHTML = `<img src="${item.url}" alt="Main Display" style="width:100%; height:100%; object-fit:cover;">`;
  }
}

function selectModalWeight(weight) {
  if (!activeModalProductId) return;
  selectedWeights[activeModalProductId] = weight;
  const product = productsData.find(p => p.id === activeModalProductId);
  if (product) {
    document.getElementById('modal-product-price').innerText = `₹${product.prices[weight]}`;
    selectWeight(activeModalProductId, weight);
    const btns = document.querySelectorAll('#modal-weight-selector .weight-btn');
    btns.forEach(btn => {
      if (btn.innerText.trim() === weight) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }
}

function changeModalQty(delta) {
  modalQty += delta;
  if (modalQty < 1) modalQty = 1;
  document.getElementById('modal-qty-val').innerText = modalQty;
}

function addModalItemToCart() {
  if (!activeModalProductId) return;
  const product = productsData.find(p => p.id === activeModalProductId);
  const weight = selectedWeights[activeModalProductId] || "250g";
  const price = product.prices[weight];

  const existingIndex = cart.findIndex(i => i.id === activeModalProductId && i.weight === weight);
  if (existingIndex > -1) {
    cart[existingIndex].quantity += modalQty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      weight: weight,
      price: price,
      quantity: modalQty,
      image: product.image
    });
  }

  updateCartUI();
  closeProductModal();
  openCart();
}
