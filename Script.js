/* =============================================================
   MAISON CUIR — APPLICATION SCRIPT
   A front-end-only e-commerce app. No backend: everything that
   needs to survive a refresh is saved in localStorage.

   Contents (search "SECTION:" to jump around):
     1.  Product database
     2.  Small utilities (format, stars, toast)
     3.  Persistent state (load/save from localStorage)
     4.  Cart logic
     5.  Wishlist logic
     6.  Auth (register / login / logout / session)
     7.  Product cards (shared renderer)
     8.  Product quick-view modal
     9.  Router (hash-based views)
     10. View renderers (home, shop, cart, wishlist, account…)
     11. Checkout flow (shipping -> payment -> review -> order)
     12. Hero slideshow
     13. Header + misc event wiring
     14. Init
   ============================================================= */

/* ------------------------------------------------------------
   SECTION 1: Product database
   Add or edit products here — every view reads from this array.
   ------------------------------------------------------------ */

// A pool of real bag/leather-goods photos. Each product picks
// three of these (by index) to simulate a multi-angle gallery.
const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1547949003-9792a18a2645?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1524498351468-7a3c2ba32b8b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1614179689702-355944cd0918?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1601369447742-1ec1a7a15b16?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1575032617751-6ddec2089882?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1591085686350-798c0f9faa7f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80',
];

function pickImages(seedIndex) {
  const n = IMAGE_POOL.length;
  return [
    IMAGE_POOL[seedIndex % n],
    IMAGE_POOL[(seedIndex + 4) % n],
    IMAGE_POOL[(seedIndex + 8) % n],
  ];
}

const BAG_SIZES = ['Small', 'Medium', 'Large'];
const ONE_SIZE = ['One Size'];

const PRODUCTS = [
  { id: 1, name: 'Alder Leather Tote', brand: 'Maison Cuir', category: 'Tote', price: 248, section: 'featured',
    rating: 4.8, reviews: 214, stock: 14, sizes: BAG_SIZES,
    colors: [{ name: 'Cognac', hex: '#A8703E' }, { name: 'Black', hex: '#1E1B18' }, { name: 'Sand', hex: '#D9C7A8' }],
    description: 'A roomy, structured tote in full-grain leather with a magnetic top closure and an interior zip pocket for the essentials.',
    images: pickImages(0) },

  { id: 2, name: 'Rowan Canvas Backpack', brand: 'Northfield', category: 'Backpack', price: 189, section: 'featured',
    rating: 4.6, reviews: 168, stock: 20, sizes: BAG_SIZES,
    colors: [{ name: 'Olive', hex: '#6B6B4F' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'Waxed canvas and leather trim over a padded 15" laptop sleeve — built for the daily commute and everything after it.',
    images: pickImages(1) },

  { id: 3, name: 'Sable Mini Crossbody', brand: 'Maison Cuir', category: 'Crossbody', price: 165, section: 'featured',
    rating: 4.7, reviews: 132, stock: 9, sizes: ONE_SIZE,
    colors: [{ name: 'Chestnut', hex: '#7A4B2B' }, { name: 'Burgundy', hex: '#6E2B2B' }],
    description: 'A compact crossbody with an adjustable strap and just enough room for a phone, cards, and keys.',
    images: pickImages(2) },

  { id: 4, name: 'Vela Structured Satchel', brand: 'Ferro & Co.', category: 'Satchel', price: 312, section: 'featured',
    rating: 4.9, reviews: 97, stock: 6, sizes: BAG_SIZES,
    colors: [{ name: 'Black', hex: '#1E1B18' }, { name: 'Cognac', hex: '#A8703E' }],
    description: 'Sharp, architectural lines and a detachable strap make this satchel equally at home on a desk or a shoulder.',
    images: pickImages(3) },

  { id: 5, name: 'Ember Evening Clutch', brand: 'Maison Cuir', category: 'Clutch', price: 128, section: 'new', badge: 'New',
    rating: 4.5, reviews: 41, stock: 12, sizes: ONE_SIZE,
    colors: [{ name: 'Burgundy', hex: '#6E2B2B' }, { name: 'Ivory', hex: '#EFE8DA' }],
    description: 'A slim envelope clutch with a slide-out wrist strap, finished in soft pebbled leather.',
    images: pickImages(4) },

  { id: 6, name: 'Denali Weekend Duffel', brand: 'Northfield', category: 'Duffel', price: 268, section: 'new', badge: 'New',
    rating: 4.7, reviews: 76, stock: 8, sizes: BAG_SIZES,
    colors: [{ name: 'Olive', hex: '#6B6B4F' }, { name: 'Stone', hex: '#B9AE9C' }],
    description: 'Water-resistant canvas, reinforced base, and a trolley sleeve — sized for a long weekend away.',
    images: pickImages(5) },

  { id: 7, name: 'Juno Slouch Hobo', brand: 'Ferro & Co.', category: 'Hobo', price: 214, section: 'new', badge: 'New',
    rating: 4.4, reviews: 58, stock: 10, sizes: ONE_SIZE,
    colors: [{ name: 'Chestnut', hex: '#7A4B2B' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'Soft, unstructured leather that slouches beautifully, with a wide top for easy in-and-out access.',
    images: pickImages(6) },

  { id: 8, name: 'Birch Daypack', brand: 'Northfield', category: 'Backpack', price: 176, section: 'new', badge: 'New',
    rating: 4.6, reviews: 89, stock: 4, sizes: BAG_SIZES,
    colors: [{ name: 'Sand', hex: '#D9C7A8' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'A lightweight daypack with a quick-access front pocket and breathable mesh straps.',
    images: pickImages(7) },

  { id: 9, name: 'Marlow Everyday Tote', brand: 'Maison Cuir', category: 'Tote', price: 232, was: 265, section: 'best',
    rating: 4.8, reviews: 301, stock: 17, sizes: BAG_SIZES,
    colors: [{ name: 'Black', hex: '#1E1B18' }, { name: 'Cognac', hex: '#A8703E' }],
    description: 'Our best-selling tote: an open top, flat base, and enough structure to hold its shape all day.',
    images: pickImages(8) },

  { id: 10, name: 'Reed Crossbody Saddle', brand: 'Ferro & Co.', category: 'Crossbody', price: 154, section: 'best',
    rating: 4.6, reviews: 145, stock: 13, sizes: ONE_SIZE,
    colors: [{ name: 'Chestnut', hex: '#7A4B2B' }, { name: 'Cognac', hex: '#A8703E' }],
    description: 'A classic saddle-shaped crossbody with a flap closure and an antique brass buckle.',
    images: pickImages(9) },

  { id: 11, name: 'Halden Top-Handle Satchel', brand: 'Maison Cuir', category: 'Satchel', price: 298, was: 340, section: 'best',
    rating: 4.9, reviews: 118, stock: 3, sizes: BAG_SIZES,
    colors: [{ name: 'Burgundy', hex: '#6E2B2B' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'A polished top-handle satchel with a fold-over flap and a hidden magnetic clasp.',
    images: pickImages(10) },

  { id: 12, name: 'Otto Trail Duffel', brand: 'Northfield', category: 'Duffel', price: 245, section: 'best',
    rating: 4.5, reviews: 84, stock: 11, sizes: BAG_SIZES,
    colors: [{ name: 'Olive', hex: '#6B6B4F' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'Rugged, weatherproof, and built around a wide U-shaped opening for fast packing.',
    images: pickImages(11) },

  { id: 13, name: 'Summit Trail Backpack', brand: 'Northfield', category: 'Backpack', price: 198, section: 'shop',
    rating: 4.5, reviews: 62, stock: 5, sizes: BAG_SIZES,
    colors: [{ name: 'Stone', hex: '#B9AE9C' }, { name: 'Olive', hex: '#6B6B4F' }],
    description: 'A hiking-inspired backpack with a padded hip belt and a hydration-sleeve pocket.',
    images: pickImages(12) },

  { id: 14, name: 'Linen Weekend Tote', brand: 'Ferro & Co.', category: 'Tote', price: 189, section: 'shop', badge: 'New',
    rating: 4.4, reviews: 29, stock: 14, sizes: BAG_SIZES,
    colors: [{ name: 'Ivory', hex: '#EFE8DA' }, { name: 'Sand', hex: '#D9C7A8' }],
    description: 'A soft linen-and-leather tote for easy weekends — light enough to fold flat when not in use.',
    images: pickImages(13) },

  { id: 15, name: 'Pico Belt Bag Crossbody', brand: 'Maison Cuir', category: 'Crossbody', price: 118, section: 'shop', badge: 'New',
    rating: 4.3, reviews: 22, stock: 3, sizes: ONE_SIZE,
    colors: [{ name: 'Black', hex: '#1E1B18' }, { name: 'Cognac', hex: '#A8703E' }],
    description: 'Wear it crossbody or as a belt bag — a hands-free way to carry the basics.',
    images: pickImages(14) },

  { id: 16, name: 'Opal Satin Clutch', brand: 'Ferro & Co.', category: 'Clutch', price: 142, section: 'shop', badge: 'New',
    rating: 4.6, reviews: 33, stock: 9, sizes: ONE_SIZE,
    colors: [{ name: 'Ivory', hex: '#EFE8DA' }, { name: 'Burgundy', hex: '#6E2B2B' }],
    description: 'A satin-finished evening clutch with a slim gold frame closure.',
    images: pickImages(0) },

  { id: 17, name: 'Noir Envelope Clutch', brand: 'Maison Cuir', category: 'Clutch', price: 136, section: 'shop',
    rating: 4.7, reviews: 51, stock: 0, sizes: ONE_SIZE,
    colors: [{ name: 'Black', hex: '#1E1B18' }],
    description: 'A minimalist envelope clutch in matte black leather. Currently sold out — more arriving soon.',
    images: pickImages(1) },

  { id: 18, name: 'Corin Frame Satchel', brand: 'Maison Cuir', category: 'Satchel', price: 276, section: 'shop', badge: 'New',
    rating: 4.5, reviews: 18, stock: 11, sizes: BAG_SIZES,
    colors: [{ name: 'Cognac', hex: '#A8703E' }, { name: 'Chestnut', hex: '#7A4B2B' }],
    description: 'A boxy frame satchel with a rigid silhouette and a slim detachable crossbody strap.',
    images: pickImages(2) },

  { id: 19, name: 'Willow Suede Hobo', brand: 'Ferro & Co.', category: 'Hobo', price: 224, section: 'shop', badge: 'New',
    rating: 4.6, reviews: 27, stock: 7, sizes: ONE_SIZE,
    colors: [{ name: 'Chestnut', hex: '#7A4B2B' }, { name: 'Stone', hex: '#B9AE9C' }],
    description: 'Buttery suede with a relaxed drape and a single slouchy shoulder strap.',
    images: pickImages(3) },

  { id: 20, name: 'Marne Soft Hobo', brand: 'Northfield', category: 'Hobo', price: 199, section: 'shop',
    rating: 4.4, reviews: 46, stock: 16, sizes: ONE_SIZE,
    colors: [{ name: 'Olive', hex: '#6B6B4F' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'An everyday hobo with a soft gusseted base that flexes to fit what you carry.',
    images: pickImages(4) },

  { id: 21, name: 'Voyage Leather Duffel', brand: 'Maison Cuir', category: 'Duffel', price: 342, section: 'shop', badge: 'New',
    rating: 4.9, reviews: 15, stock: 6, sizes: BAG_SIZES,
    colors: [{ name: 'Cognac', hex: '#A8703E' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'Full-grain leather duffel with brass hardware and a removable shoulder strap — built to age well.',
    images: pickImages(5) },
];

// One representative image per category, for the homepage "Popular Categories" tiles
const CATEGORY_TILES = [
  { name: 'Backpack', img: IMAGE_POOL[11] },
  { name: 'Tote', img: IMAGE_POOL[12] },
  { name: 'Crossbody', img: IMAGE_POOL[7] },
  { name: 'Clutch', img: IMAGE_POOL[9] },
  { name: 'Satchel', img: IMAGE_POOL[3] },
  { name: 'Hobo', img: IMAGE_POOL[6] },
  { name: 'Duffel', img: IMAGE_POOL[10] },
];

function getProductById(id) {
  return PRODUCTS.find((p) => p.id === Number(id));
}

/* ------------------------------------------------------------
   SECTION 2: Small utilities
   ------------------------------------------------------------ */
const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

const formatPrice = (n) => `$${n.toFixed(2).replace(/\.00$/, '')}`;

function starString(rating) {
  const full = Math.round(rating);
  let out = '';
  for (let i = 0; i < 5; i += 1) out += i < full ? '★' : '☆';
  return out;
}

// A soft leather-toned placeholder used if a product photo fails to load
const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="500">
      <rect width="400" height="500" fill="#EFE6D8"/>
      <text x="50%" y="50%" font-family="sans-serif" font-size="16" fill="#9C6B3E"
            text-anchor="middle" dominant-baseline="middle">Maison Cuir</text>
    </svg>`);

let toastTimer = null;
function toast(message, type = 'success') {
  const container = $('#toastContainer');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${message}</span><button class="toast-close" aria-label="Dismiss">&times;</button>`;
  container.appendChild(el);
  const remove = () => el.remove();
  el.querySelector('.toast-close').addEventListener('click', remove);
  setTimeout(remove, 3800);
}

/* ------------------------------------------------------------
   SECTION 3: Persistent state (localStorage)
   ------------------------------------------------------------ */
const STORAGE_KEYS = {
  CART: 'mc_cart',
  WISHLIST: 'mc_wishlist',
  USERS: 'mc_users',
  SESSION: 'mc_session',
  ORDERS: 'mc_orders',
  STOCK: 'mc_stock',
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}
function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    /* localStorage unavailable — app still works for this session */
  }
}

const state = {
  cart: loadJSON(STORAGE_KEYS.CART, []),
  wishlist: loadJSON(STORAGE_KEYS.WISHLIST, []),
  users: loadJSON(STORAGE_KEYS.USERS, []),
  session: loadJSON(STORAGE_KEYS.SESSION, null),
  orders: loadJSON(STORAGE_KEYS.ORDERS, []),
};

// Apply any stock changes from previous orders (persisted separately
// from the product database, which is redeclared fresh on every load)
const stockOverrides = loadJSON(STORAGE_KEYS.STOCK, {});
Object.keys(stockOverrides).forEach((id) => {
  const product = getProductById(id);
  if (product) product.stock = stockOverrides[id];
});

const saveCart = () => saveJSON(STORAGE_KEYS.CART, state.cart);
const saveWishlist = () => saveJSON(STORAGE_KEYS.WISHLIST, state.wishlist);
const saveUsers = () => saveJSON(STORAGE_KEYS.USERS, state.users);
const saveSession = () => saveJSON(STORAGE_KEYS.SESSION, state.session);
const saveOrders = () => saveJSON(STORAGE_KEYS.ORDERS, state.orders);
const saveStock = () => {
  const map = {};
  PRODUCTS.forEach((p) => { map[p.id] = p.stock; });
  saveJSON(STORAGE_KEYS.STOCK, map);
};

/* ------------------------------------------------------------
   SECTION 4: Cart logic
   ------------------------------------------------------------ */
const SHIPPING_FLAT = 12;
const FREE_SHIPPING_THRESHOLD = 150;

function getCartQtyForProduct(productId) {
  return state.cart
    .filter((line) => line.productId === productId)
    .reduce((sum, line) => sum + line.qty, 0);
}

function addToCart(productId, opts = {}) {
  const product = getProductById(productId);
  if (!product) return false;

  if (product.stock <= 0) {
    toast(`${product.name} is currently out of stock.`, 'error');
    return false;
  }

  const already = getCartQtyForProduct(productId);
  const room = product.stock - already;
  if (room <= 0) {
    toast(`You already have all ${product.stock} available of ${product.name} in your cart.`, 'error');
    return false;
  }

  const requestedQty = opts.qty || 1;
  const addQty = Math.min(requestedQty, room);
  const color = opts.color || (product.colors[0] && product.colors[0].name) || '';
  const size = opts.size || product.sizes[0] || '';
  const key = `${productId}|${color}|${size}`;

  const existingLine = state.cart.find((line) => line.key === key);
  if (existingLine) {
    existingLine.qty = Math.min(existingLine.qty + addQty, product.stock);
  } else {
    state.cart.push({ key, productId, color, size, qty: addQty });
  }

  saveCart();
  updateHeaderCounts();
  toast(`Added ${product.name} to your cart.`, 'success');
  if (addQty < requestedQty) {
    toast(`Only ${room} left in stock — added what we could.`, 'error');
  }
  return true;
}

function updateCartLineQty(key, nextQty) {
  const line = state.cart.find((l) => l.key === key);
  if (!line) return;
  const product = getProductById(line.productId);
  const otherLinesQty = getCartQtyForProduct(line.productId) - line.qty;
  const maxAllowed = Math.max(product.stock - otherLinesQty, 0);

  if (nextQty < 1) { removeCartLine(key); return; }

  if (nextQty > maxAllowed) {
    nextQty = maxAllowed;
    toast(`Only ${maxAllowed} of ${product.name} available.`, 'error');
  }
  if (nextQty === 0) { removeCartLine(key); return; }

  line.qty = nextQty;
  saveCart();
  updateHeaderCounts();
  renderCart();
}

function removeCartLine(key) {
  state.cart = state.cart.filter((l) => l.key !== key);
  saveCart();
  updateHeaderCounts();
  renderCart();
  toast('Removed from cart.', 'success');
}

function cartTotals() {
  const items = state.cart
    .map((line) => ({ ...line, product: getProductById(line.productId) }))
    .filter((line) => line.product);
  const subtotal = items.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const itemCount = items.reduce((sum, l) => sum + l.qty, 0);
  const shipping = itemCount === 0 ? 0 : (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT);
  const total = subtotal + shipping;
  return { items, subtotal, shipping, total, itemCount };
}

/* ------------------------------------------------------------
   SECTION 5: Wishlist logic
   ------------------------------------------------------------ */
function toggleWishlist(productId) {
  const idx = state.wishlist.indexOf(productId);
  if (idx > -1) {
    state.wishlist.splice(idx, 1);
    toast('Removed from wishlist.', 'success');
  } else {
    state.wishlist.push(productId);
    toast('Added to wishlist.', 'success');
  }
  saveWishlist();
  updateHeaderCounts();
  refreshAllWishlistButtons();
  if (location.hash === '#wishlist') renderWishlist();
}

function syncWishlistButton(btn, productId) {
  const active = state.wishlist.includes(productId);
  btn.classList.toggle('is-active', active);
  btn.setAttribute('aria-pressed', String(active));
  btn.querySelector('svg').setAttribute('fill', active ? 'currentColor' : 'none');
}

function refreshAllWishlistButtons() {
  $$('.product-wish[data-id]').forEach((btn) => syncWishlistButton(btn, Number(btn.dataset.id)));
}

function moveWishlistToCart(productId) {
  const added = addToCart(productId);
  if (added) {
    state.wishlist = state.wishlist.filter((id) => id !== productId);
    saveWishlist();
    updateHeaderCounts();
    refreshAllWishlistButtons();
    renderWishlist();
  }
}

/* ------------------------------------------------------------
   SECTION 6: Auth
   ------------------------------------------------------------ */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let pendingRedirect = null; // where to send the user after a successful login

function getCurrentUser() {
  if (!state.session) return null;
  return state.users.find((u) => u.email === state.session) || null;
}

function setFieldError(fieldId, message) {
  const errorEl = document.getElementById(`${fieldId}Error`);
  if (!errorEl) return;
  errorEl.textContent = message || '';
  const fieldWrap = errorEl.closest('.field');
  if (fieldWrap) fieldWrap.classList.toggle('has-error', Boolean(message));
}

function registerUser(name, email, password, confirm) {
  let ok = true;
  setFieldError('registerName', ''); setFieldError('registerEmail', '');
  setFieldError('registerPassword', ''); setFieldError('registerConfirm', '');

  if (!name.trim()) { setFieldError('registerName', 'Please enter your name.'); ok = false; }
  if (!EMAIL_RE.test(email)) { setFieldError('registerEmail', 'Enter a valid email address.'); ok = false; }
  else if (state.users.some((u) => u.email === email.toLowerCase())) {
    setFieldError('registerEmail', 'An account with this email already exists.'); ok = false;
  }
  if (password.length < 6) { setFieldError('registerPassword', 'Use at least 6 characters.'); ok = false; }
  if (confirm !== password) { setFieldError('registerConfirm', 'Passwords do not match.'); ok = false; }

  if (!ok) return false;

  state.users.push({ name: name.trim(), email: email.toLowerCase(), password: btoa(password) });
  saveUsers();
  state.session = email.toLowerCase();
  saveSession();
  toast(`Welcome, ${name.trim()}!`, 'success');
  return true;
}

function loginUser(email, password) {
  let ok = true;
  setFieldError('loginEmail', ''); setFieldError('loginPassword', '');

  if (!EMAIL_RE.test(email)) { setFieldError('loginEmail', 'Enter a valid email address.'); ok = false; }
  if (!password) { setFieldError('loginPassword', 'Enter your password.'); ok = false; }
  if (!ok) return false;

  const user = state.users.find((u) => u.email === email.toLowerCase());
  if (!user || user.password !== btoa(password)) {
    setFieldError('loginPassword', 'Incorrect email or password.');
    toast('Incorrect email or password.', 'error');
    return false;
  }

  state.session = user.email;
  saveSession();
  toast(`Welcome back, ${user.name}!`, 'success');
  return true;
}

function logoutUser() {
  state.session = null;
  saveSession();
  toast('Logged out.', 'success');
  location.hash = 'home';
}

function requireLoginOrRedirect(viewName) {
  if (getCurrentUser()) return true;
  pendingRedirect = viewName;
  toast('Please log in to continue.', 'error');
  location.hash = 'login';
  return false;
}

/* ------------------------------------------------------------
   SECTION 7: Product cards (shared by home / shop / wishlist)
   ------------------------------------------------------------ */
function renderProductCard(product, opts = {}) {
  const card = document.createElement('article');
  card.className = 'product-card' + (product.stock <= 0 ? ' is-out-of-stock' : '');
  card.dataset.id = product.id;

  const badgeLabel = product.stock <= 0 ? 'Out of Stock' : (product.badge || (product.was ? 'Sale' : ''));

  card.innerHTML = `
    <div class="product-media" data-open-modal="${product.id}">
      ${badgeLabel ? `<span class="product-tag">${badgeLabel}</span>` : ''}
      <button class="product-wish" type="button" data-id="${product.id}" aria-label="Toggle wishlist for ${product.name}" aria-pressed="false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.35-9.5-8.8C.7 8 2 4.5 5.4 4c2-.3 3.7.7 4.6 2.2C10.9 4.7 12.6 3.7 14.6 4c3.4.5 4.7 4 3.9 7.2C16 15.65 12 20 12 20Z"/></svg>
      </button>
      <img src="${product.images[0]}" alt="${product.name}, a ${product.category.toLowerCase()} bag by ${product.brand}" loading="lazy" />
      <button class="product-quickadd" type="button" data-quickadd="${product.id}" aria-label="Add ${product.name} to cart" ${product.stock <= 0 ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 8h12l-1.2 11.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
      </button>
    </div>
    <p class="product-brand">${product.brand}</p>
    <h3 class="product-name product-name-link" data-open-modal="${product.id}">${product.name}</h3>
    <div class="product-rating"><span class="stars">${starString(product.rating)}</span><span>${product.rating.toFixed(1)} (${product.reviews})</span></div>
    <p class="product-price">${product.was ? `<span class="was">${formatPrice(product.was)}</span>` : ''}${formatPrice(product.price)}</p>
    ${opts.showMoveToCart ? `<button class="btn btn-ghost-dark btn-block" type="button" data-move="${product.id}" style="margin-top:10px;">Move to Cart</button>` : ''}
  `;

  const img = card.querySelector('img');
  img.addEventListener('error', () => { img.src = FALLBACK_IMG; }, { once: true });

  $$('[data-open-modal]', card).forEach((el) => {
    el.addEventListener('click', () => { location.hash = `product/${product.id}`; });
  });

  const wishBtn = card.querySelector('.product-wish');
  syncWishlistButton(wishBtn, product.id);
  wishBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleWishlist(product.id); });

  const quickAddBtn = card.querySelector('.product-quickadd');
  quickAddBtn.addEventListener('click', (e) => { e.stopPropagation(); addToCart(product.id); });

  if (opts.showMoveToCart) {
    card.querySelector('[data-move]').addEventListener('click', (e) => {
      e.stopPropagation();
      moveWishlistToCart(product.id);
    });
  }

  return card;
}

function renderGrid(targetId, items, opts = {}) {
  const grid = document.getElementById(targetId);
  if (!grid) return;
  grid.innerHTML = '';
  items.forEach((p) => grid.appendChild(renderProductCard(p, opts)));
}

/* ------------------------------------------------------------
   SECTION 8: Product quick-view modal
   ------------------------------------------------------------ */
let currentModalProduct = null;
let modalState = { color: '', size: '', qty: 1, imgIndex: 0 };
let previousHash = 'home';

function openProductModal(id) {
  const product = getProductById(id);
  if (!product) { toast('That product could not be found.', 'error'); return; }
  currentModalProduct = product;
  modalState = { color: (product.colors[0] && product.colors[0].name) || '', size: product.sizes[0] || '', qty: 1, imgIndex: 0 };
  renderModalBody();
  $('#productModal').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  $('#productModal').hidden = true;
  document.body.style.overflow = '';
  currentModalProduct = null;
  if (location.hash.startsWith('#product/')) {
    location.hash = previousHash;
  }
}

function renderModalBody() {
  const p = currentModalProduct;
  if (!p) return;
  const stockMsg = p.stock <= 0 ? 'Out of stock' : (p.stock <= 5 ? `Only ${p.stock} left in stock` : 'In stock');
  const stockClass = p.stock <= 0 ? 'is-out' : (p.stock <= 5 ? 'is-low' : '');
  const body = $('#modalBody');

  body.innerHTML = `
    <div class="modal-gallery">
      <div class="modal-gallery-main"><img src="${p.images[modalState.imgIndex]}" alt="${p.name}" id="modalMainImg" /></div>
      <div class="modal-gallery-thumbs" id="modalThumbs">
        ${p.images.map((img, i) => `<button class="modal-thumb ${i === modalState.imgIndex ? 'is-active' : ''}" data-idx="${i}" type="button" aria-label="View angle ${i + 1}"><img src="${img}" alt="${p.name} angle ${i + 1}" /></button>`).join('')}
      </div>
    </div>
    <div class="modal-details">
      <p class="product-brand">${p.brand}</p>
      <h2 id="modalProductName">${p.name}</h2>
      <div class="product-rating"><span class="stars">${starString(p.rating)}</span><span>${p.rating.toFixed(1)} (${p.reviews} reviews)</span></div>
      <p class="modal-price">${p.was ? `<span class="was">${formatPrice(p.was)}</span>` : ''}${formatPrice(p.price)}</p>
      <p class="modal-stock ${stockClass}">${stockMsg}</p>
      <p class="modal-description">${p.description}</p>
      <div class="modal-option-group">
        <span>Color — ${modalState.color}</span>
        <div class="swatches" id="modalColors">
          ${p.colors.map((c) => `<button class="swatch ${c.name === modalState.color ? 'is-active' : ''}" data-color="${c.name}" style="background:${c.hex}" type="button" aria-label="${c.name}"></button>`).join('')}
        </div>
      </div>
      <div class="modal-option-group">
        <span>Size</span>
        <div class="size-options" id="modalSizes">
          ${p.sizes.map((s) => `<button class="size-pill ${s === modalState.size ? 'is-active' : ''}" data-size="${s}" type="button">${s}</button>`).join('')}
        </div>
      </div>
      <div class="modal-qty-row">
        <span>Quantity</span>
        <div class="qty-stepper">
          <button type="button" id="modalQtyMinus" aria-label="Decrease quantity">&minus;</button>
          <input type="text" id="modalQtyInput" inputmode="numeric" value="${modalState.qty}" aria-label="Quantity" />
          <button type="button" id="modalQtyPlus" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost-dark" id="modalAddToCart" type="button" ${p.stock <= 0 ? 'disabled' : ''}>Add to Cart</button>
        <button class="btn btn-primary" id="modalBuyNow" type="button" ${p.stock <= 0 ? 'disabled' : ''}>Buy Now</button>
      </div>
    </div>
  `;

  $('#modalThumbs', body).addEventListener('click', (e) => {
    const btn = e.target.closest('[data-idx]');
    if (!btn) return;
    modalState.imgIndex = Number(btn.dataset.idx);
    renderModalBody();
  });
  $('#modalColors', body).addEventListener('click', (e) => {
    const btn = e.target.closest('[data-color]');
    if (!btn) return;
    modalState.color = btn.dataset.color;
    renderModalBody();
  });
  $('#modalSizes', body).addEventListener('click', (e) => {
    const btn = e.target.closest('[data-size]');
    if (!btn) return;
    modalState.size = btn.dataset.size;
    renderModalBody();
  });

  const qtyInput = $('#modalQtyInput', body);
  const maxQty = Math.max(p.stock, 1);
  $('#modalQtyMinus', body).addEventListener('click', () => {
    modalState.qty = Math.max(1, modalState.qty - 1);
    qtyInput.value = modalState.qty;
  });
  $('#modalQtyPlus', body).addEventListener('click', () => {
    modalState.qty = Math.min(maxQty, modalState.qty + 1);
    qtyInput.value = modalState.qty;
  });
  qtyInput.addEventListener('change', () => {
    let v = parseInt(qtyInput.value, 10);
    if (Number.isNaN(v) || v < 1) v = 1;
    v = Math.min(v, maxQty);
    modalState.qty = v;
    qtyInput.value = v;
  });

  const addBtn = $('#modalAddToCart', body);
  if (addBtn) addBtn.addEventListener('click', () => {
    addToCart(p.id, { color: modalState.color, size: modalState.size, qty: modalState.qty });
  });
  const buyBtn = $('#modalBuyNow', body);
  if (buyBtn) buyBtn.addEventListener('click', () => {
    const added = addToCart(p.id, { color: modalState.color, size: modalState.size, qty: modalState.qty });
    if (added) {
      closeProductModal();
      requireLoginOrRedirect('checkout') && (location.hash = 'checkout');
    }
  });
}

/* ------------------------------------------------------------
   SECTION 9: Router
   ------------------------------------------------------------ */
const KNOWN_VIEWS = ['home', 'shop', 'cart', 'wishlist', 'login', 'register', 'account', 'checkout', 'orders', 'confirmation'];
const LOGIN_REQUIRED_VIEWS = ['checkout', 'orders', 'account'];
let lastOrder = null;

function showView(name) {
  $$('.view').forEach((v) => v.classList.remove('is-active'));
  const el = document.getElementById(`view-${name}`);
  if (el) el.classList.add('is-active');
  previousHash = name;
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderRoute() {
  const hash = (location.hash || '#home').slice(1);

  if (hash.startsWith('product/')) {
    const id = Number(hash.split('/')[1]);
    openProductModal(id);
    return;
  }

  if (!KNOWN_VIEWS.includes(hash)) return; // e.g. #lifestyle-anchor — let the browser scroll normally

  $('#productModal').hidden = true; // close any open modal when switching views
  document.body.style.overflow = '';

  if (LOGIN_REQUIRED_VIEWS.includes(hash) && !getCurrentUser()) {
    pendingRedirect = hash;
    toast('Please log in to continue.', 'error');
    if (location.hash !== '#login') location.hash = 'login';
    return;
  }

  if (hash === 'confirmation' && !lastOrder) {
    location.hash = 'home';
    return;
  }

  showView(hash);

  switch (hash) {
    case 'home': renderHome(); break;
    case 'shop': renderShop(); break;
    case 'cart': renderCart(); break;
    case 'wishlist': renderWishlist(); break;
    case 'account': renderAccount(); break;
    case 'checkout': renderCheckoutEntry(); break;
    case 'orders': renderOrders(); break;
    case 'confirmation': renderConfirmationView(lastOrder); break;
    default: break;
  }
}

function goTo(view) {
  if (location.hash === `#${view}`) renderRoute();
  else location.hash = view;
}

/* ------------------------------------------------------------
   SECTION 10: View renderers
   ------------------------------------------------------------ */

// ---- Home ----
function renderHome() {
  renderGrid('featuredGrid', PRODUCTS.filter((p) => p.section === 'featured'));
  renderGrid('newArrivalsGrid', PRODUCTS.filter((p) => p.section === 'new'));
  renderGrid('bestSellersGrid', PRODUCTS.filter((p) => p.section === 'best'));

  const categoryGrid = $('#categoryGrid');
  if (categoryGrid && !categoryGrid.dataset.rendered) {
    CATEGORY_TILES.forEach((cat) => {
      const el = document.createElement('a');
      el.href = '#shop';
      el.className = 'category-card';
      el.innerHTML = `<img src="${cat.img}" alt="${cat.name} bags" loading="lazy" /><span class="category-card-label">${cat.name}</span>`;
      el.querySelector('img').addEventListener('error', (e) => { e.target.src = FALLBACK_IMG; }, { once: true });
      el.addEventListener('click', (e) => {
        e.preventDefault();
        setCategoryFilter(cat.name);
        goTo('shop');
      });
      categoryGrid.appendChild(el);
    });
    categoryGrid.dataset.rendered = 'true';
  }
}

// ---- Shop ----
const shopState = { category: 'all', query: '', sort: 'featured' };

function setCategoryFilter(category) {
  shopState.category = category;
  shopState.query = '';
  $('#searchInput').value = '';
  $('#searchClear').hidden = true;
  syncCategoryPills();
}

function syncCategoryPills() {
  $$('.cat-pill').forEach((pill) => pill.classList.toggle('is-active', pill.dataset.category === shopState.category));
}

function getFilteredSortedProducts() {
  let list = PRODUCTS.slice();
  if (shopState.category !== 'all') list = list.filter((p) => p.category === shopState.category);
  if (shopState.query) {
    const q = shopState.query.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }
  switch (shopState.sort) {
    case 'price-asc': list = list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list = list.sort((a, b) => b.price - a.price); break;
    case 'rating': list = list.sort((a, b) => b.rating - a.rating); break;
    case 'newest': list = list.sort((a, b) => b.id - a.id); break;
    default: break; // featured order = declaration order
  }
  return list;
}

function renderShop() {
  syncCategoryPills();
  $('#sortSelect').value = shopState.sort;

  const results = getFilteredSortedProducts();
  const titleBits = [];
  if (shopState.category !== 'all') titleBits.push(shopState.category);
  if (shopState.query) titleBits.push(`“${shopState.query}”`);
  $('#shopTitle').textContent = titleBits.length ? titleBits.join(' — ') : 'Shop All Bags';
  $('#shopActiveFilter').textContent = `${results.length} result${results.length === 1 ? '' : 's'}`;
  $('#shopMeta').textContent = shopState.category === 'all' && !shopState.query
    ? 'Showing every style.'
    : 'Refine with a category pill, the search bar, or the sort menu.';

  renderGrid('shopGrid', results);
  $('#shopEmpty').hidden = results.length > 0;
  $('#shopGrid').style.display = results.length > 0 ? '' : 'none';
}

// ---- Cart ----
function renderCart() {
  const { items, subtotal, shipping, total } = cartTotals();
  const cartItemsEl = $('#cartItems');
  const layout = $('#cartLayout');
  const empty = $('#cartEmpty');

  if (items.length === 0) {
    layout.style.display = 'none';
    empty.hidden = false;
    return;
  }
  layout.style.display = '';
  empty.hidden = true;

  cartItemsEl.innerHTML = '';
  items.forEach((line) => {
    const row = document.createElement('div');
    row.className = 'cart-line';
    row.innerHTML = `
      <div class="cart-line-media"><img src="${line.product.images[0]}" alt="${line.product.name}" /></div>
      <div class="cart-line-info">
        <p class="product-brand">${line.product.brand}</p>
        <h3 class="product-name">${line.product.name}</h3>
        <p class="cart-line-options">${line.color}${line.size ? ' · ' + line.size : ''}</p>
        <div class="cart-line-actions">
          <div class="qty-stepper">
            <button type="button" data-qty-minus aria-label="Decrease quantity">&minus;</button>
            <input type="text" value="${line.qty}" inputmode="numeric" data-qty-input aria-label="Quantity" />
            <button type="button" data-qty-plus aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="cart-line-remove" data-remove>Remove</button>
        </div>
      </div>
      <div class="cart-line-price">${formatPrice(line.product.price * line.qty)}</div>
    `;
    row.querySelector('img').addEventListener('error', (e) => { e.target.src = FALLBACK_IMG; }, { once: true });
    row.querySelector('[data-qty-minus]').addEventListener('click', () => updateCartLineQty(line.key, line.qty - 1));
    row.querySelector('[data-qty-plus]').addEventListener('click', () => updateCartLineQty(line.key, line.qty + 1));
    row.querySelector('[data-qty-input]').addEventListener('change', (e) => {
      let v = parseInt(e.target.value, 10);
      if (Number.isNaN(v)) v = line.qty;
      updateCartLineQty(line.key, v);
    });
    row.querySelector('[data-remove]').addEventListener('click', () => removeCartLine(line.key));
    cartItemsEl.appendChild(row);
  });

  $('#cartSubtotal').textContent = formatPrice(subtotal);
  $('#cartShipping').textContent = shipping === 0 ? 'Free' : formatPrice(shipping);
  $('#cartTotal').textContent = formatPrice(total);
  $('#cartShippingNote').textContent = shipping === 0
    ? 'You qualify for free shipping!'
    : `Free shipping on orders over ${formatPrice(FREE_SHIPPING_THRESHOLD)}.`;
}

// ---- Wishlist ----
function renderWishlist() {
  const items = state.wishlist.map((id) => getProductById(id)).filter(Boolean);
  $('#wishlistEmpty').hidden = items.length > 0;
  $('#wishlistGrid').style.display = items.length > 0 ? '' : 'none';
  renderGrid('wishlistGrid', items, { showMoveToCart: true });
}

// ---- Account ----
function renderAccount() {
  const user = getCurrentUser();
  if (!user) return;
  $('#accountInfo').innerHTML = `
    <p class="account-name">${user.name}</p>
    <p class="account-email">${user.email}</p>
    <p class="account-meta">${state.orders.filter((o) => o.userEmail === user.email).length} order(s) placed · ${state.wishlist.length} item(s) saved</p>
  `;
}

// ---- Orders ----
function renderOrders() {
  const user = getCurrentUser();
  const myOrders = state.orders
    .filter((o) => o.userEmail === (user && user.email))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  $('#ordersEmpty').hidden = myOrders.length > 0;
  const list = $('#ordersList');
  list.style.display = myOrders.length > 0 ? '' : 'none';
  list.innerHTML = '';

  myOrders.forEach((order) => {
    const card = document.createElement('article');
    card.className = 'order-card';
    const previewNames = order.items.slice(0, 2).map((i) => i.name).join(', ');
    const more = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';
    card.innerHTML = `
      <div class="order-card-head">
        <h3>Order ${order.id}</h3>
        <span class="order-status">${order.status}</span>
      </div>
      <p class="order-date">${new Date(order.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p class="order-items-preview">${previewNames}${more} · ${order.items.reduce((s, i) => s + i.qty, 0)} item(s)</p>
      <p class="order-total">Total: ${formatPrice(order.total)}</p>
    `;
    list.appendChild(card);
  });
}

/* ------------------------------------------------------------
   SECTION 11: Checkout flow
   ------------------------------------------------------------ */
let checkoutStep = 'shipping';
const checkoutData = {
  shipping: null,
  payment: null,
};

function renderCheckoutEntry() {
  const { itemCount } = cartTotals();
  if (itemCount === 0) {
    toast('Your cart is empty.', 'error');
    location.hash = 'cart';
    return;
  }
  prefillCheckoutForms();
  renderCheckoutSummary();
  showCheckoutStep(checkoutStep);
}

function prefillCheckoutForms() {
  const user = getCurrentUser();
  if (user && !$('#shipFullName').value) $('#shipFullName').value = user.name;
  if (user && !$('#shipEmail').value) $('#shipEmail').value = user.email;
}

function renderCheckoutSummary() {
  const { items, subtotal, shipping, total } = cartTotals();
  const wrap = $('#checkoutSummaryItems');
  wrap.innerHTML = items.map((l) => `
    <div class="summary-item-row">
      <span>${l.product.name} × ${l.qty}</span>
      <span>${formatPrice(l.product.price * l.qty)}</span>
    </div>
  `).join('');
  $('#checkoutSubtotal').textContent = formatPrice(subtotal);
  $('#checkoutShipping').textContent = shipping === 0 ? 'Free' : formatPrice(shipping);
  $('#checkoutTotal').textContent = formatPrice(total);
}

function showCheckoutStep(name) {
  checkoutStep = name;
  const order = ['shipping', 'payment', 'review'];
  order.forEach((s) => {
    document.getElementById(`step${s.charAt(0).toUpperCase() + s.slice(1)}`).classList.toggle('is-active', s === name);
  });
  $$('#stepIndicator .step').forEach((li) => {
    const s = li.dataset.step;
    li.classList.toggle('is-active', s === name);
    li.classList.toggle('is-done', order.indexOf(s) < order.indexOf(name));
  });
  if (name === 'review') renderReviewStep();
}

function validateShippingForm() {
  const fields = {
    shipFullName: $('#shipFullName').value.trim(),
    shipEmail: $('#shipEmail').value.trim(),
    shipPhone: $('#shipPhone').value.trim(),
    shipAddress: $('#shipAddress').value.trim(),
    shipCity: $('#shipCity').value.trim(),
    shipState: $('#shipState').value.trim(),
    shipZip: $('#shipZip').value.trim(),
    shipCountry: $('#shipCountry').value,
  };
  let ok = true;
  Object.keys(fields).forEach((id) => setFieldError(id, ''));

  if (!fields.shipFullName) { setFieldError('shipFullName', 'Full name is required.'); ok = false; }
  if (!EMAIL_RE.test(fields.shipEmail)) { setFieldError('shipEmail', 'Enter a valid email address.'); ok = false; }
  if (fields.shipPhone.replace(/\D/g, '').length < 7) { setFieldError('shipPhone', 'Enter a valid phone number.'); ok = false; }
  if (!fields.shipAddress) { setFieldError('shipAddress', 'Address is required.'); ok = false; }
  if (!fields.shipCity) { setFieldError('shipCity', 'City is required.'); ok = false; }
  if (!fields.shipState) { setFieldError('shipState', 'State / province is required.'); ok = false; }
  if (!fields.shipZip) { setFieldError('shipZip', 'Postal code is required.'); ok = false; }
  if (!fields.shipCountry) { setFieldError('shipCountry', 'Select a country.'); ok = false; }

  if (ok) checkoutData.shipping = fields;
  return ok;
}

function validatePaymentForm() {
  const method = $('input[name="paymentMethod"]:checked').value;
  let ok = true;
  ['cardName', 'cardNumber', 'cardExpiry', 'cardCvc'].forEach((id) => setFieldError(id, ''));

  const payment = { method };

  if (method === 'card') {
    const cardName = $('#cardName').value.trim();
    const cardNumber = $('#cardNumber').value.replace(/\s+/g, '');
    const cardExpiry = $('#cardExpiry').value.trim();
    const cardCvc = $('#cardCvc').value.trim();

    if (!cardName) { setFieldError('cardName', 'Name on card is required.'); ok = false; }
    if (!/^\d{13,19}$/.test(cardNumber)) { setFieldError('cardNumber', 'Enter a valid card number.'); ok = false; }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) { setFieldError('cardExpiry', 'Use MM/YY format.'); ok = false; }
    if (!/^\d{3,4}$/.test(cardCvc)) { setFieldError('cardCvc', 'Enter a valid CVC.'); ok = false; }

    if (ok) {
      payment.cardName = cardName;
      payment.cardLast4 = cardNumber.slice(-4);
    }
  }

  if (ok) checkoutData.payment = payment;
  return ok;
}

function renderReviewStep() {
  const s = checkoutData.shipping;
  const p = checkoutData.payment;
  const { items, subtotal, shipping, total } = cartTotals();

  $('#reviewShipping').innerHTML = `
    <h3>Shipping To</h3>
    <p>${s.shipFullName}<br>${s.shipAddress}<br>${s.shipCity}, ${s.shipState} ${s.shipZip}<br>${s.shipCountry}</p>
    <p>${s.shipEmail} · ${s.shipPhone}</p>
  `;

  const paymentLabel = p.method === 'card'
    ? `Card ending in ${p.cardLast4}`
    : (p.method === 'paypal' ? 'PayPal' : 'Cash on Delivery');
  $('#reviewPayment').innerHTML = `<h3>Payment</h3><p>${paymentLabel}</p>`;

  $('#reviewItems').innerHTML = `
    <h3>Items</h3>
    ${items.map((l) => `
      <div class="review-item-row">
        <span>${l.product.name} (${l.color}${l.size ? ', ' + l.size : ''}) × ${l.qty}</span>
        <span>${formatPrice(l.product.price * l.qty)}</span>
      </div>
    `).join('')}
    <div class="review-item-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
    <div class="review-item-row"><span>Shipping</span><span>${shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
    <div class="review-item-row" style="font-weight:700;"><span>Total</span><span>${formatPrice(total)}</span></div>
  `;
}

function placeOrder() {
  const { items, subtotal, shipping, total } = cartTotals();
  const btn = $('#placeOrderBtn');
  btn.classList.add('is-loading');
  btn.disabled = true;

  setTimeout(() => {
    const order = {
      id: `MC${Date.now().toString().slice(-8)}`,
      userEmail: getCurrentUser().email,
      date: new Date().toISOString(),
      status: 'Confirmed',
      items: items.map((l) => ({ productId: l.productId, name: l.product.name, color: l.color, size: l.size, qty: l.qty, price: l.product.price })),
      subtotal, shipping, total,
      shippingInfo: checkoutData.shipping,
      payment: checkoutData.payment,
    };

    // Decrement stock and persist it
    items.forEach((l) => {
      l.product.stock = Math.max(0, l.product.stock - l.qty);
    });
    saveStock();

    state.orders.push(order);
    saveOrders();

    state.cart = [];
    saveCart();
    updateHeaderCounts();

    lastOrder = order;
    checkoutStep = 'shipping';
    checkoutData.shipping = null;
    checkoutData.payment = null;
    btn.classList.remove('is-loading');
    btn.disabled = false;

    toast('Order placed! Check your confirmation below.', 'success');
    location.hash = 'confirmation';
  }, 900);
}

function renderConfirmationView(order) {
  if (!order) return;
  const el = $('#confirmationContent');
  el.innerHTML = `
    <div class="confirmation-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 13l4 4L19 7"/></svg>
    </div>
    <h1>Thank you — your order is confirmed</h1>
    <p class="confirmation-order-id">Order ${order.id}</p>
    <p>A confirmation has been prepared for ${order.shippingInfo.shipEmail}. Here's a quick recap:</p>
    <div class="confirmation-summary">
      ${order.items.map((i) => `
        <div class="review-item-row">
          <span>${i.name} (${i.color}${i.size ? ', ' + i.size : ''}) × ${i.qty}</span>
          <span>${formatPrice(i.price * i.qty)}</span>
        </div>
      `).join('')}
      <div class="review-item-row"><span>Subtotal</span><span>${formatPrice(order.subtotal)}</span></div>
      <div class="review-item-row"><span>Shipping</span><span>${order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</span></div>
      <div class="review-item-row" style="font-weight:700;"><span>Total</span><span>${formatPrice(order.total)}</span></div>
    </div>
    <div class="confirmation-actions">
      <a href="#home" class="btn btn-primary">Continue Shopping</a>
      <a href="#orders" class="btn btn-ghost-dark">View Order History</a>
    </div>
  `;
}

/* ------------------------------------------------------------
   SECTION 12: Hero slideshow
   ------------------------------------------------------------ */
function initHeroSlideshow() {
  const slides = $$('.hero-slide');
  const dotsWrap = $('#heroDots');
  if (!slides.length || !dotsWrap) return;
  let current = 0;
  let timer;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'hero-dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => goToSlide(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function goToSlide(index) {
    slides[current].classList.remove('is-active');
    dots[current].classList.remove('is-active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    dots[current].classList.add('is-active');
    restart();
  }
  function restart() {
    clearInterval(timer);
    timer = setInterval(() => goToSlide(current + 1), 5500);
  }

  $('#heroNext').addEventListener('click', () => goToSlide(current + 1));
  $('#heroPrev').addEventListener('click', () => goToSlide(current - 1));
  restart();
}

/* ------------------------------------------------------------
   SECTION 13: Header + misc event wiring
   ------------------------------------------------------------ */
function updateHeaderCounts() {
  const wishEl = $('#wishlistCount');
  const cartEl = $('#cartCount');
  const wishCount = state.wishlist.length;
  const cartCount = state.cart.reduce((s, l) => s + l.qty, 0);

  wishEl.textContent = wishCount;
  wishCount > 0 ? wishEl.removeAttribute('data-zero') : wishEl.setAttribute('data-zero', '');

  cartEl.textContent = cartCount;
  cartCount > 0 ? cartEl.removeAttribute('data-zero') : cartEl.setAttribute('data-zero', '');
}

function initHeaderAndGlobalEvents() {
  // Search toggle + live filtering
  const searchToggleBtn = $('#searchToggleBtn');
  const searchBar = $('#searchBar');
  const searchInput = $('#searchInput');
  const searchClear = $('#searchClear');

  searchToggleBtn.addEventListener('click', () => {
    const isOpen = searchBar.classList.toggle('is-open');
    searchToggleBtn.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) setTimeout(() => searchInput.focus(), 200);
  });

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();
    searchClear.hidden = q.length === 0;
    shopState.query = q;
    shopState.category = 'all';
    syncCategoryPills();
    goTo('shop');
  });
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.hidden = true;
    shopState.query = '';
    goTo('shop');
    searchInput.focus();
  });

  // Category pills (persistent in the header, control the Shop view)
  $$('.cat-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      setCategoryFilter(pill.dataset.category);
      goTo('shop');
    });
  });

  // Sort select (Shop view)
  $('#sortSelect').addEventListener('change', (e) => {
    shopState.sort = e.target.value;
    renderShop();
  });
  $('#shopResetBtn').addEventListener('click', () => {
    setCategoryFilter('all');
    renderShop();
  });

  // Header icon buttons
  $('#brandLink').addEventListener('click', (e) => { e.preventDefault(); goTo('home'); });
  $('#accountBtn').addEventListener('click', () => goTo(getCurrentUser() ? 'account' : 'login'));
  $('#wishlistBtn').addEventListener('click', () => goTo('wishlist'));
  $('#cartBtn').addEventListener('click', () => goTo('cart'));

  // Footer social icons are placeholders — prevent an unexpected jump home
  $$('.footer-socials a').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));

  // Back-to-top
  const backToTop = $('#backToTop');
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('is-visible', window.scrollY > 480);
  }, { passive: true });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Scroll-reveal for section headings (home view)
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  $$('.section-head').forEach((el) => revealObserver.observe(el));

  // Product modal close (button, overlay click, Escape key)
  $('#modalCloseBtn').addEventListener('click', closeProductModal);
  $('#productModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeProductModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#productModal').hidden) closeProductModal();
  });

  // Auth forms
  $('#loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = $('#loginSubmitBtn');
    btn.classList.add('is-loading'); btn.disabled = true;
    setTimeout(() => {
      const ok = loginUser($('#loginEmail').value.trim(), $('#loginPassword').value);
      btn.classList.remove('is-loading'); btn.disabled = false;
      if (ok) {
        $('#loginForm').reset();
        const target = pendingRedirect || 'home';
        pendingRedirect = null;
        if (location.hash === `#${target}`) renderRoute();
        else location.hash = target;
      }
    }, 500);
  });

  $('#registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = $('#registerSubmitBtn');
    btn.classList.add('is-loading'); btn.disabled = true;
    setTimeout(() => {
      const ok = registerUser(
        $('#registerName').value, $('#registerEmail').value,
        $('#registerPassword').value, $('#registerConfirm').value,
      );
      btn.classList.remove('is-loading'); btn.disabled = false;
      if (ok) {
        $('#registerForm').reset();
        const target = pendingRedirect || 'home';
        pendingRedirect = null;
        location.hash = target;
        if (location.hash === `#${target}`) renderRoute();
      }
    }, 500);
  });

  $('#logoutBtn').addEventListener('click', logoutUser);

  // Checkout — shipping step
  $('#stepShipping').addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateShippingForm()) showCheckoutStep('payment');
    else toast('Please fix the highlighted fields.', 'error');
  });

  // Checkout — payment step
  $$('input[name="paymentMethod"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      $$('.payment-option').forEach((label) => label.classList.toggle('is-active', label.querySelector('input').checked));
      const selected = $('input[name="paymentMethod"]:checked').value;
      $('#cardFields').style.display = selected === 'card' ? '' : 'none';
    });
  });
  $('#stepPayment').addEventListener('submit', (e) => {
    e.preventDefault();
    if (validatePaymentForm()) showCheckoutStep('review');
    else toast('Please fix the highlighted fields.', 'error');
  });

  // Checkout — back buttons
  $$('[data-checkout-back]').forEach((btn) => {
    btn.addEventListener('click', () => showCheckoutStep(btn.dataset.checkoutBack));
  });

  // Checkout — cart button
  $('#checkoutBtn').addEventListener('click', () => {
    if (cartTotals().itemCount === 0) { toast('Your cart is empty.', 'error'); return; }
    goTo('checkout');
  });

  // Checkout — place order
  $('#placeOrderBtn').addEventListener('click', placeOrder);

  // Hash-based routing
  window.addEventListener('hashchange', renderRoute);
}

/* ------------------------------------------------------------
   SECTION 14: Init
   ------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderCounts();
  initHeaderAndGlobalEvents();
  initHeroSlideshow();
  renderHome();
  renderRoute();
});