/* =============================================================
   Ginhawá — APPLICATION SCRIPT
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

// A pool of real bag/leather-goods photos. The first image of each
// product is its main photo (the only one shown on the product page).
const IMAGE_POOL = [
  'photos/toterbgcat.png',
  'photos/backpackrbgcat.png',
  'photos/crossbodyrbgcat.png',
  'photos/satchelrbgcat.png',
  'photos/clutchrbgcat.png',
  'photos/dufrbg.png',
  'photos/hoborbgcat.png',
  'photos/daypackrbg.png',
  'photos/toterbg1.png',
  'photos/saddlerbg1.png',
  'photos/satchelrbg1.png',
  'photos/dufrbg2.png',
  'photos/hoborbgcat.png',
  'photos/hoborbgcat.png',
  'photos/crossbodyrbgcat.png',
  'photos/dufrbgcat.png',
  'backpack',
  'backpack',
  'backpack',
  '19tote',
  'tote',
  'tote',
  '22crossbody',
  'crossbody',
  'crossbody',
  '25clutch',
  'clutch',
  'clutch',
  'clutch',
  '29satchel',
  'satchel',
  'satchel',
  '32hobo',
  'hobo',
  'hobo',
  '35duffel',
  'duffel',
  'duffel'
];

function pickImages(seedIndex) {
  const n = IMAGE_POOL.length;
  return [
    IMAGE_POOL[seedIndex % n],
    IMAGE_POOL[(seedIndex + 4) % n],
    IMAGE_POOL[(seedIndex + 8) % n],
  ];
}

// Build a 3-image gallery from explicit IMAGE_POOL indices (first image = main photo)
function imagesByIndex(a, b, c) {
  return [IMAGE_POOL[a], IMAGE_POOL[b], IMAGE_POOL[c]];
}

// Every bag is sold in a single fixed size. Each product carries its own
// realistic dimensions in centimetres (height x width x depth).
function formatDimensions(dim) {
  if (!dim) return '';
  const inch = (cm) => (cm / 2.54).toFixed(1).replace(/\.0$/, '');
  return `${dim.h} \u00D7 ${dim.w} \u00D7 ${dim.d} cm (${inch(dim.h)} \u00D7 ${inch(dim.w)} \u00D7 ${inch(dim.d)} in)`;
}

const PRODUCTS = [
  { id: 1, name: 'Alder Leather Tote', brand: 'Ginhawá', category: 'Tote', price: 2480, section: 'featured',
    rating: 4.8, reviews: 214, stock: 14, dimensions: { h: 32, w: 40, d: 14 },
    colors: [{ name: 'Cognac', hex: '#A8703E' }, { name: 'Black', hex: '#1E1B18' }, { name: 'Sand', hex: '#D9C7A8' }],
    description: 'A roomy, structured tote in full-grain leather with a magnetic top closure and an interior zip pocket for the essentials.',
    images: pickImages(0) },

  { id: 2, name: 'Rowan Canvas Backpack', brand: 'Northfield', category: 'Backpack', price: 1890, section: 'featured',
    rating: 4.6, reviews: 168, stock: 20, dimensions: { h: 44, w: 30, d: 14 },
    colors: [{ name: 'Olive', hex: '#6B6B4F' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'Waxed canvas and leather trim over a padded 15" laptop sleeve — built for the daily commute and everything after it.',
    images: pickImages(1) },

  { id: 3, name: 'Sable Mini Crossbody', brand: 'Ginhawá', category: 'Crossbody', price: 1650, section: 'featured',
    rating: 4.7, reviews: 132, stock: 9, dimensions: { h: 16, w: 21, d: 6 },
    colors: [{ name: 'Chestnut', hex: '#7A4B2B' }, { name: 'Burgundy', hex: '#6E2B2B' }],
    description: 'A compact crossbody with an adjustable strap and just enough room for a phone, cards, and keys.',
    images: pickImages(2) },

  { id: 4, name: 'Vela Structured Satchel', brand: 'Ferro & Co.', category: 'Satchel', price: 3120, section: 'featured',
    rating: 4.9, reviews: 97, stock: 6, dimensions: { h: 25, w: 33, d: 12 },
    colors: [{ name: 'Black', hex: '#1E1B18' }, { name: 'Cognac', hex: '#A8703E' }],
    description: 'Sharp, architectural lines and a detachable strap make this satchel equally at home on a desk or a shoulder.',
    images: pickImages(3) },

  { id: 5, name: 'Ember Evening Clutch', brand: 'Ginhawá', category: 'Clutch', price: 1280, section: 'new', badge: 'New',
    rating: 4.5, reviews: 41, stock: 12, dimensions: { h: 15, w: 25, d: 3 },
    colors: [{ name: 'Burgundy', hex: '#6E2B2B' }, { name: 'Ivory', hex: '#EFE8DA' }],
    description: 'A slim envelope clutch with a slide-out wrist strap, finished in soft pebbled leather.',
    images: pickImages(4) },

  { id: 6, name: 'Denali Weekend Duffel', brand: 'Northfield', category: 'Duffel', price: 2680, section: 'new', badge: 'New',
    rating: 4.7, reviews: 76, stock: 8, dimensions: { h: 33, w: 52, d: 24 },
    colors: [{ name: 'Olive', hex: '#6B6B4F' }, { name: 'Stone', hex: '#B9AE9C' }],
    description: 'Water-resistant canvas, reinforced base, and a trolley sleeve — sized for a long weekend away.',
    images: pickImages(5) },

  { id: 7, name: 'Juno Slouch Hobo', brand: 'Ferro & Co.', category: 'Hobo', price: 2140, section: 'new', badge: 'New',
    rating: 4.4, reviews: 58, stock: 10, dimensions: { h: 26, w: 36, d: 11 },
    colors: [{ name: 'Chestnut', hex: '#7A4B2B' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'Soft, unstructured leather that slouches beautifully, with a wide top for easy in-and-out access.',
    images: pickImages(6) },

  { id: 8, name: 'Birch Daypack', brand: 'Northfield', category: 'Backpack', price: 1760, section: 'new', badge: 'New',
    rating: 4.6, reviews: 89, stock: 4, dimensions: { h: 40, w: 28, d: 13 },
    colors: [{ name: 'Sand', hex: '#D9C7A8' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'A lightweight daypack with a quick-access front pocket and breathable mesh straps.',
    images: pickImages(7) },

  { id: 9, name: 'Marlow Everyday Tote', brand: 'Ginhawá', category: 'Tote', price: 2320, was: 2650, section: 'best',
    rating: 4.8, reviews: 301, stock: 17, dimensions: { h: 30, w: 38, d: 13 },
    colors: [{ name: 'Black', hex: '#1E1B18' }, { name: 'Cognac', hex: '#A8703E' }],
    description: 'Our best-selling tote: an open top, flat base, and enough structure to hold its shape all day.',
    images: pickImages(8) },

  { id: 10, name: 'Reed Crossbody Saddle', brand: 'Ferro & Co.', category: 'Crossbody', price: 1540, section: 'best',
    rating: 4.6, reviews: 145, stock: 13, dimensions: { h: 17, w: 23, d: 8 },
    colors: [{ name: 'Chestnut', hex: '#7A4B2B' }, { name: 'Cognac', hex: '#A8703E' }],
    description: 'A classic saddle-shaped crossbody with a flap closure and an antique brass buckle.',
    images: pickImages(9) },

  { id: 11, name: 'Halden Top-Handle Satchel', brand: 'Ginhawá', category: 'Satchel', price: 2980, was: 3400, section: 'best',
    rating: 4.9, reviews: 118, stock: 3, dimensions: { h: 22, w: 28, d: 12 },
    colors: [{ name: 'Burgundy', hex: '#6E2B2B' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'A polished top-handle satchel with a fold-over flap and a hidden magnetic clasp.',
    images: pickImages(10) },

  { id: 12, name: 'Otto Trail Duffel', brand: 'Northfield', category: 'Duffel', price: 2450, section: 'best',
    rating: 4.5, reviews: 84, stock: 11, dimensions: { h: 36, w: 55, d: 26 },
    colors: [{ name: 'Olive', hex: '#6B6B4F' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'Rugged, weatherproof, and built around a wide U-shaped opening for fast packing.',
    images: pickImages(11) },

  { id: 13, name: 'Summit Trail Backpack', brand: 'Northfield', category: 'Backpack', price: 1980, section: 'shop',
    rating: 4.5, reviews: 62, stock: 5, dimensions: { h: 48, w: 30, d: 16 },
    colors: [{ name: 'Stone', hex: '#B9AE9C' }, { name: 'Olive', hex: '#6B6B4F' }],
    description: 'A hiking-inspired backpack with a padded hip belt and a hydration-sleeve pocket.',
    images: pickImages(12) },

  { id: 14, name: 'Linen Weekend Tote', brand: 'Ferro & Co.', category: 'Tote', price: 1890, section: 'shop', badge: 'New',
    rating: 4.4, reviews: 29, stock: 14, dimensions: { h: 34, w: 42, d: 14 },
    colors: [{ name: 'Ivory', hex: '#EFE8DA' }, { name: 'Sand', hex: '#D9C7A8' }],
    description: 'A soft linen-and-leather tote for easy weekends — light enough to fold flat when not in use.',
    images: pickImages(13) },

  { id: 15, name: 'Pico Belt Bag Crossbody', brand: 'Ginhawá', category: 'Crossbody', price: 1180, section: 'shop', badge: 'New',
    rating: 4.3, reviews: 22, stock: 3, dimensions: { h: 12, w: 22, d: 7 },
    colors: [{ name: 'Black', hex: '#1E1B18' }, { name: 'Cognac', hex: '#A8703E' }],
    description: 'Wear it crossbody or as a belt bag — a hands-free way to carry the basics.',
    images: pickImages(14) },

  { id: 16, name: 'Opal Satin Clutch', brand: 'Ferro & Co.', category: 'Clutch', price: 1420, section: 'shop', badge: 'New',
    rating: 4.6, reviews: 33, stock: 9, dimensions: { h: 13, w: 22, d: 4 },
    colors: [{ name: 'Ivory', hex: '#EFE8DA' }, { name: 'Burgundy', hex: '#6E2B2B' }],
    description: 'A satin-finished evening clutch with a slim gold frame closure.',
    images: pickImages(0) },

  { id: 17, name: 'Noir Envelope Clutch', brand: 'Ginhawá', category: 'Clutch', price: 1360, section: 'shop',
    rating: 4.7, reviews: 51, stock: 0, dimensions: { h: 15, w: 26, d: 3 },
    colors: [{ name: 'Black', hex: '#1E1B18' }],
    description: 'A minimalist envelope clutch in matte black leather. Currently sold out — more arriving soon.',
    images: pickImages(28) },

  { id: 18, name: 'Corin Frame Satchel', brand: 'Ginhawá', category: 'Satchel', price: 2760, section: 'shop', badge: 'New',
    rating: 4.5, reviews: 18, stock: 11, dimensions: { h: 24, w: 30, d: 12 },
    colors: [{ name: 'Cognac', hex: '#A8703E' }, { name: 'Chestnut', hex: '#7A4B2B' }],
    description: 'A boxy frame satchel with a rigid silhouette and a slim detachable crossbody strap.',
    images: pickImages(2) },

  { id: 19, name: 'Willow Suede Hobo', brand: 'Ferro & Co.', category: 'Hobo', price: 2240, section: 'shop', badge: 'New',
    rating: 4.6, reviews: 27, stock: 7, dimensions: { h: 27, w: 37, d: 11 },
    colors: [{ name: 'Chestnut', hex: '#7A4B2B' }, { name: 'Stone', hex: '#B9AE9C' }],
    description: 'Buttery suede with a relaxed drape and a single slouchy shoulder strap.',
    images: pickImages(3) },

  { id: 20, name: 'Marne Soft Hobo', brand: 'Northfield', category: 'Hobo', price: 1990, section: 'shop',
    rating: 4.4, reviews: 46, stock: 16, dimensions: { h: 26, w: 35, d: 10 },
    colors: [{ name: 'Olive', hex: '#6B6B4F' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'An everyday hobo with a soft gusseted base that flexes to fit what you carry.',
    images: pickImages(4) },

  { id: 21, name: 'Voyage Leather Duffel', brand: 'Ginhawá', category: 'Duffel', price: 3420, section: 'shop', badge: 'New',
    rating: 4.9, reviews: 15, stock: 6, dimensions: { h: 35, w: 55, d: 26 },
    colors: [{ name: 'Cognac', hex: '#A8703E' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'Full-grain leather duffel with brass hardware and a removable shoulder strap — built to age well.',
    images: pickImages(15) },

  /* ---- Additional styles: every category now carries exactly 6 bags ---- */

  { id: 22, name: 'Harbor Roll-Top Backpack', brand: 'Northfield', category: 'Backpack', price: 2090, section: 'shop', badge: 'New',
    rating: 4.6, reviews: 24, stock: 12, dimensions: { h: 46, w: 30, d: 14 },
    colors: [{ name: 'Olive', hex: '#6B6B4F' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'A weatherproof roll-top backpack with an expandable main compartment and a padded 16\" laptop sleeve.',
    images: imagesByIndex(16) },

  { id: 23, name: 'Atlas Leather Backpack', brand: 'Ginhawá', category: 'Backpack', price: 2380, section: 'shop',
    rating: 4.8, reviews: 63, stock: 8, dimensions: { h: 42, w: 29, d: 13 },
    colors: [{ name: 'Cognac', hex: '#A8703E' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'Full-grain leather meets a clean, minimal silhouette — a polished backpack that works from the office to the weekend.',
    images: imagesByIndex(17) },

  { id: 24, name: 'Cove Mini Backpack', brand: 'Ferro & Co.', category: 'Backpack', price: 1620, section: 'shop', badge: 'New',
    rating: 4.4, reviews: 19, stock: 15, dimensions: { h: 28, w: 22, d: 10 },
    colors: [{ name: 'Sand', hex: '#D9C7A8' }, { name: 'Burgundy', hex: '#6E2B2B' }],
    description: 'A compact, lightweight backpack with a zip-around pocket — just right for short days out.',
    images: imagesByIndex(18) },

  { id: 25, name: 'Sienna Market Tote', brand: 'Ferro & Co.', category: 'Tote', price: 2090, section: 'shop',
    rating: 4.6, reviews: 57, stock: 13, dimensions: { h: 33, w: 40, d: 15 },
    colors: [{ name: 'Cognac', hex: '#A8703E' }, { name: 'Sand', hex: '#D9C7A8' }],
    description: 'A relaxed leather market tote with sturdy rolled handles and a generous open main compartment.',
    images: imagesByIndex(19) },

  { id: 26, name: 'Cedar Zip Tote', brand: 'Northfield', category: 'Tote', price: 2260, section: 'shop', badge: 'New',
    rating: 4.5, reviews: 21, stock: 10, dimensions: { h: 29, w: 36, d: 12 },
    colors: [{ name: 'Black', hex: '#1E1B18' }, { name: 'Stone', hex: '#B9AE9C' }],
    description: 'A structured work tote with a full zip closure, a padded laptop pocket, and a trolley-strap sleeve.',
    images: imagesByIndex(20) },

  { id: 27, name: 'Isla Woven Tote', brand: 'Ginhawá', category: 'Tote', price: 1750, section: 'shop',
    rating: 4.3, reviews: 36, stock: 18, dimensions: { h: 30, w: 38, d: 13 },
    colors: [{ name: 'Ivory', hex: '#EFE8DA' }, { name: 'Chestnut', hex: '#7A4B2B' }],
    description: 'A lightweight woven-leather tote with a breathable weave — made for warm days and weekend errands.',
    images: imagesByIndex(21) },

  { id: 28, name: 'Wren Phone Crossbody', brand: 'Ginhawá', category: 'Crossbody', price: 1290, section: 'shop', badge: 'New',
    rating: 4.5, reviews: 28, stock: 16, dimensions: { h: 19, w: 11, d: 4 },
    colors: [{ name: 'Black', hex: '#1E1B18' }, { name: 'Burgundy', hex: '#6E2B2B' }],
    description: 'A slim zip-top crossbody sized for a phone, cards, and keys, with an adjustable chain-and-leather strap.',
    images: imagesByIndex(22) },

  { id: 29, name: 'Lark Camera Bag', brand: 'Northfield', category: 'Crossbody', price: 1720, section: 'shop',
    rating: 4.7, reviews: 44, stock: 7, dimensions: { h: 15, w: 20, d: 10 },
    colors: [{ name: 'Olive', hex: '#6B6B4F' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'A boxy, padded crossbody with a quick-access top flap — a travel favorite for cameras and everyday gear.',
    images: imagesByIndex(23) },

  { id: 30, name: 'Marlo Flap Crossbody', brand: 'Ferro & Co.', category: 'Crossbody', price: 1460, section: 'shop',
    rating: 4.4, reviews: 31, stock: 9, dimensions: { h: 17, w: 24, d: 7 },
    colors: [{ name: 'Cognac', hex: '#A8703E' }, { name: 'Chestnut', hex: '#7A4B2B' }],
    description: 'A classic flap-front crossbody with a magnetic closure and a slim back pocket for quick-grab items.',
    images: imagesByIndex(24) },

  { id: 31, name: 'Vesper Wristlet Clutch', brand: 'Ginhawá', category: 'Clutch', price: 1190, section: 'shop', badge: 'New',
    rating: 4.4, reviews: 17, stock: 14, dimensions: { h: 12, w: 19, d: 3 },
    colors: [{ name: 'Black', hex: '#1E1B18' }, { name: 'Cognac', hex: '#A8703E' }],
    description: 'A zip-top wristlet clutch in soft leather, with a detachable wrist strap for easy day-to-night carry.',
    images: imagesByIndex(25) },

  { id: 32, name: 'Dune Pouch Clutch', brand: 'Ferro & Co.', category: 'Clutch', price: 1330, section: 'shop',
    rating: 4.5, reviews: 26, stock: 11, dimensions: { h: 15, w: 24, d: 6 },
    colors: [{ name: 'Sand', hex: '#D9C7A8' }, { name: 'Ivory', hex: '#EFE8DA' }],
    description: 'A softly gathered pouch clutch in pebbled leather, finished with a gold drawstring-style clasp.',
    images: imagesByIndex(26) },

  { id: 33, name: 'Gala Box Clutch', brand: 'Ginhawá', category: 'Clutch', price: 1580, section: 'shop',
    rating: 4.7, reviews: 38, stock: 5, dimensions: { h: 11, w: 19, d: 6 },
    colors: [{ name: 'Burgundy', hex: '#6E2B2B' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'A rigid box clutch with a polished frame and a hidden chain strap — made for formal evenings.',
    images: imagesByIndex(27) },

  { id: 34, name: 'Pembroke Messenger Satchel', brand: 'Northfield', category: 'Satchel', price: 2890, section: 'shop',
    rating: 4.6, reviews: 41, stock: 9, dimensions: { h: 28, w: 36, d: 10 },
    colors: [{ name: 'Chestnut', hex: '#7A4B2B' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'A roomy messenger-style satchel with twin buckle closures and a padded document compartment.',
    images: imagesByIndex(29) },

  { id: 35, name: 'Tessa Mini Satchel', brand: 'Ginhawá', category: 'Satchel', price: 2540, section: 'shop', badge: 'New',
    rating: 4.7, reviews: 20, stock: 7, dimensions: { h: 16, w: 22, d: 9 },
    colors: [{ name: 'Burgundy', hex: '#6E2B2B' }, { name: 'Cognac', hex: '#A8703E' }],
    description: 'A petite top-handle satchel with a structured base and a detachable strap, sized for the essentials.',
    images: imagesByIndex(30) },

  { id: 36, name: 'Garnet Doctor Satchel', brand: 'Ferro & Co.', category: 'Satchel', price: 3260, was: 3650, section: 'shop',
    rating: 4.9, reviews: 52, stock: 4, dimensions: { h: 26, w: 33, d: 14 },
    colors: [{ name: 'Black', hex: '#1E1B18' }, { name: 'Chestnut', hex: '#7A4B2B' }],
    description: 'A heritage-inspired doctor-style satchel with a wide frame opening and hand-set brass hardware.',
    images: imagesByIndex(31) },

  { id: 37, name: 'Lumen Crescent Hobo', brand: 'Ginhawá', category: 'Hobo', price: 2190, section: 'shop', badge: 'New',
    rating: 4.6, reviews: 23, stock: 10, dimensions: { h: 22, w: 32, d: 9 },
    colors: [{ name: 'Ivory', hex: '#EFE8DA' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'A curved crescent-shaped hobo in smooth leather, with a magnetic top closure and a wide shoulder strap.',
    images: imagesByIndex(32) },

  { id: 38, name: 'Fern Bucket Hobo', brand: 'Northfield', category: 'Hobo', price: 1850, section: 'shop',
    rating: 4.3, reviews: 34, stock: 13, dimensions: { h: 25, w: 23, d: 16 },
    colors: [{ name: 'Olive', hex: '#6B6B4F' }, { name: 'Stone', hex: '#B9AE9C' }],
    description: 'A relaxed bucket-style hobo with a drawstring top and a removable inner zip pouch.',
    images: imagesByIndex(33) },

  { id: 39, name: 'Calla Quilted Hobo', brand: 'Ferro & Co.', category: 'Hobo', price: 2380, section: 'shop',
    rating: 4.7, reviews: 39, stock: 6, dimensions: { h: 25, w: 34, d: 10 },
    colors: [{ name: 'Burgundy', hex: '#6E2B2B' }, { name: 'Chestnut', hex: '#7A4B2B' }],
    description: 'Softly quilted leather with a slouchy shape and a chain-detailed strap — an easy statement piece.',
    images: imagesByIndex(34) },

  { id: 40, name: 'Ridge Gym Duffel', brand: 'Northfield', category: 'Duffel', price: 2290, section: 'shop',
    rating: 4.5, reviews: 48, stock: 15, dimensions: { h: 30, w: 50, d: 24 },
    colors: [{ name: 'Black', hex: '#1E1B18' }, { name: 'Stone', hex: '#B9AE9C' }],
    description: 'A ventilated gym duffel with a separate shoe compartment and a wet-gear pocket.',
    images: imagesByIndex(35) },

  { id: 41, name: 'Tavern Barrel Duffel', brand: 'Ferro & Co.', category: 'Duffel', price: 2790, section: 'shop', badge: 'New',
    rating: 4.6, reviews: 16, stock: 8, dimensions: { h: 30, w: 50, d: 27 },
    colors: [{ name: 'Chestnut', hex: '#7A4B2B' }, { name: 'Olive', hex: '#6B6B4F' }],
    description: 'A classic barrel-shaped duffel in waxed canvas and leather, with a roomy main compartment and a padded handle.',
    images: imagesByIndex(36) },

  { id: 42, name: 'Mesa Overnight Duffel', brand: 'Ginhawá', category: 'Duffel', price: 2980, was: 3300, section: 'shop',
    rating: 4.8, reviews: 29, stock: 5, dimensions: { h: 32, w: 50, d: 22 },
    colors: [{ name: 'Cognac', hex: '#A8703E' }, { name: 'Black', hex: '#1E1B18' }],
    description: 'An overnight duffel with a structured base, a zip-around opening, and a removable padded shoulder strap.',
    images: imagesByIndex(37) },
];

// One representative image per category, for the homepage "Popular Categories" tiles
const CATEGORY_TILES = [
  { name: 'Backpack', img: IMAGE_POOL[1] },
  { name: 'Tote', img: IMAGE_POOL[0] },
  { name: 'Crossbody', img: IMAGE_POOL[2] },
  { name: 'Clutch', img: IMAGE_POOL[4] },
  { name: 'Satchel', img: IMAGE_POOL[3] },
  { name: 'Hobo', img: IMAGE_POOL[6] },
  { name: 'Duffel', img: IMAGE_POOL[14] },
];

function getProductById(id) {
  return PRODUCTS.find((p) => p.id === Number(id));
}

// Starter set of customer reviews shown on the Reviews view until real
// customers add their own (their submissions persist in localStorage
// alongside this seed list — see SECTION 15).
const DEFAULT_REVIEWS = [
  { id: 1, name: 'Maya S.', bagType: 'Tote', rating: 5,
    text: "The Alder Leather Tote is even better in person — it holds its shape all day and the leather is only getting richer with wear. Fits my 13\" laptop with room to spare.",
    image: null, date: '2026-08-14T09:20:00.000Z' },
  { id: 2, name: 'James R.', bagType: 'Backpack', rating: 5,
    text: "Bought the Rowan Canvas Backpack for my commute and it's been flawless — padded sleeve actually protects my laptop, and the canvas has shrugged off two rainy mornings so far.",
    image: null, date: '2026-07-29T15:05:00.000Z' },
  { id: 3, name: 'Dani K.', bagType: 'Duffel', rating: 4,
    text: 'The Denali Weekend Duffel is roomy and well-built. Only wish the shoulder strap padding were a bit thicker for longer walks through the airport, but overall very happy with it.',
    image: null, date: '2026-07-02T11:40:00.000Z' },
  { id: 4, name: 'Priya M.', bagType: 'Crossbody', rating: 5,
    text: "The Sable Mini Crossbody is the perfect size for a night out — fits my phone, cards, and lipstick with zero bulk. Adjustable strap makes it easy to wear across my body or shoulder.",
    image: null, date: '2026-06-18T18:12:00.000Z' },
  { id: 5, name: 'Leo T.', bagType: 'Satchel', rating: 3,
    text: "Beautiful satchel and the hardware feels premium, but I found the detachable strap a touch short for crossbody wear. Comfortable as a top-handle bag though, and customer service was helpful.",
    image: null, date: '2026-06-03T08:50:00.000Z' },
];

/* ------------------------------------------------------------
   SECTION 2: Small utilities
   ------------------------------------------------------------ */
const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

const formatPrice = (n) => `₱${n.toFixed(2).replace(/\.00$/, '')}`;

function starString(rating) {
  const full = Math.round(rating);
  let out = '';
  for (let i = 0; i < 5; i += 1) out += i < full ? '★' : '☆';
  return out;
}

// Basic HTML-escaping for any user-submitted text (reviews, contact form)
// before it's dropped into innerHTML.
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

// A soft leather-toned placeholder used if a product photo fails to load
const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="500">
      <rect width="400" height="500" fill="#EFE6D8"/>
      <text x="50%" y="50%" font-family="sans-serif" font-size="16" fill="#9C6B3E"
            text-anchor="middle" dominant-baseline="middle">Ginhawá</text>
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
  REVIEWS: 'mc_reviews',
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
  reviews: loadJSON(STORAGE_KEYS.REVIEWS, DEFAULT_REVIEWS),
};

// Apply any stock changes from previous orders (persisted separately
// from the product database, which is redeclared fresh on every load)
const stockOverrides = loadJSON(STORAGE_KEYS.STOCK, {});
Object.keys(stockOverrides).forEach((id) => {
  const product = getProductById(id);
  if (product) product.stock = stockOverrides[id];
});

// Carts saved before sizes were removed: drop the size and merge any
// lines that now share the same product + color.
(function migrateLegacyCart() {
  if (!Array.isArray(state.cart)) { state.cart = []; return; }
  const merged = new Map();
  state.cart.forEach((line) => {
    if (!line || !getProductById(line.productId)) return;
    const key = `${line.productId}|${line.color}`;
    const existing = merged.get(key);
    if (existing) existing.qty += (line.qty || 1);
    else merged.set(key, { key, productId: line.productId, color: line.color, qty: line.qty || 1 });
  });
  state.cart = Array.from(merged.values()).map((line) => {
    const product = getProductById(line.productId);
    line.qty = Math.max(1, Math.min(line.qty, Math.max(product.stock, 1)));
    return line;
  });
  saveJSON(STORAGE_KEYS.CART, state.cart);
})();

const saveCart = () => saveJSON(STORAGE_KEYS.CART, state.cart);
const saveWishlist = () => saveJSON(STORAGE_KEYS.WISHLIST, state.wishlist);
const saveUsers = () => saveJSON(STORAGE_KEYS.USERS, state.users);
const saveSession = () => saveJSON(STORAGE_KEYS.SESSION, state.session);
const saveOrders = () => saveJSON(STORAGE_KEYS.ORDERS, state.orders);
const saveReviews = () => saveJSON(STORAGE_KEYS.REVIEWS, state.reviews);
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
const EXPRESS_SHIPPING_RATE = 25;

// Which shipping method is currently selected at checkout ('standard' or
// 'express'). Defaults to 'standard', which reproduces the previous
// flat-rate / free-over-threshold behavior exactly.
let selectedShippingMethod = 'standard';

function computeShippingCost(subtotal, itemCount, method) {
  if (itemCount === 0) return 0;
  if (method === 'express') return EXPRESS_SHIPPING_RATE;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
}

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
  const key = `${productId}|${color}`;

  const existingLine = state.cart.find((line) => line.key === key);
  if (existingLine) {
    existingLine.qty = Math.min(existingLine.qty + addQty, product.stock);
  } else {
    state.cart.push({ key, productId, color, qty: addQty });
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

// Re-checks every cart line against the product's current stock (in case
// stock changed since the item was added) and clamps/removes as needed.
// Returns true if anything had to be adjusted, so callers can warn the user
// and block checkout when there isn't enough stock to fulfill the cart.
function validateCartAgainstStock() {
  let adjusted = false;

  // Drop lines for products that no longer exist or are fully out of stock
  const before = state.cart.length;
  state.cart = state.cart.filter((line) => {
    const product = getProductById(line.productId);
    return product && product.stock > 0;
  });
  if (state.cart.length !== before) adjusted = true;

  // Clamp each product's total requested quantity down to its current stock
  const totals = {};
  state.cart.forEach((line) => { totals[line.productId] = (totals[line.productId] || 0) + line.qty; });

  Object.keys(totals).forEach((pid) => {
    const product = getProductById(Number(pid));
    if (!product) return;
    let over = totals[pid] - product.stock;
    if (over > 0) {
      adjusted = true;
      state.cart.forEach((line) => {
        if (over <= 0 || line.productId !== Number(pid)) return;
        const reduceBy = Math.min(line.qty, over);
        line.qty -= reduceBy;
        over -= reduceBy;
      });
      state.cart = state.cart.filter((line) => line.qty > 0);
    }
  });

  if (adjusted) {
    saveCart();
    updateHeaderCounts();
  }
  return adjusted;
}

/* ------------------------------------------------------------
   Cart selection — which cart lines are checked for checkout.
   New items default to selected; unchecking an item just excludes
   it from checkout totals/placement — it is never removed from the cart.
   ------------------------------------------------------------ */
const cartSelection = new Set();     // keys currently selected
const cartSelectionSeen = new Set(); // keys already given a default once

function syncCartSelectionState() {
  const currentKeys = new Set(state.cart.map((l) => l.key));
  Array.from(cartSelection).forEach((k) => { if (!currentKeys.has(k)) cartSelection.delete(k); });
  Array.from(cartSelectionSeen).forEach((k) => { if (!currentKeys.has(k)) cartSelectionSeen.delete(k); });
  state.cart.forEach((line) => {
    if (!cartSelectionSeen.has(line.key)) {
      cartSelectionSeen.add(line.key);
      cartSelection.add(line.key); // default: selected
    }
  });
}

function setCartLineSelected(key, isSelected) {
  syncCartSelectionState();
  if (isSelected) cartSelection.add(key);
  else cartSelection.delete(key);
  renderCart();
}

function getSelectedCartLines() {
  syncCartSelectionState();
  return state.cart
    .filter((line) => cartSelection.has(line.key))
    .map((line) => ({ ...line, product: getProductById(line.productId) }))
    .filter((line) => line.product);
}

function selectedCartTotals() {
  const items = getSelectedCartLines();
  const subtotal = items.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const itemCount = items.reduce((sum, l) => sum + l.qty, 0);
  const shipping = computeShippingCost(subtotal, itemCount, selectedShippingMethod);
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

  // Stock takes priority in the badge slot: out-of-stock or low-stock
  // messaging is shown before a merchandising badge (New / Sale).
  let badgeLabel = '';
  if (product.stock <= 0) badgeLabel = 'Out of Stock';
  else if (product.stock <= 5) badgeLabel = `Only ${product.stock} left`;
  else if (product.badge) badgeLabel = product.badge;
  else if (product.was) badgeLabel = 'Sale';

  card.innerHTML = `
    <div class="product-media" data-open-modal="${product.id}">
      ${badgeLabel ? `<span class="product-tag">${badgeLabel}</span>` : ''}
      <img src="${product.images[0]}" alt="${product.name}, a ${product.category.toLowerCase()} bag by ${product.brand}" loading="lazy" />
      <div class="product-actions-bottom">
        <button class="product-wish" type="button" data-id="${product.id}" aria-label="Toggle wishlist for ${product.name}" aria-pressed="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.35-9.5-8.8C.7 8 2 4.5 5.4 4c2-.3 3.7.7 4.6 2.2C10.9 4.7 12.6 3.7 14.6 4c3.4.5 4.7 4 3.9 7.2C16 15.65 12 20 12 20Z"/></svg>
        </button>
        <button class="product-quickadd" type="button" data-quickadd="${product.id}" aria-label="Add ${product.name} to cart" ${product.stock <= 0 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 8h12l-1.2 11.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
        </button>
      </div>
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
let modalState = { color: '', qty: 1 };
let previousHash = 'home';

function openProductModal(id) {
  const product = getProductById(id);
  if (!product) { toast('That product could not be found.', 'error'); return; }
  currentModalProduct = product;
  modalState = { color: (product.colors[0] && product.colors[0].name) || '', qty: 1 };
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
  const stockMsg = p.stock <= 0 ? 'Out of stock' : (p.stock <= 5 ? `Only ${p.stock} left in stock` : `${p.stock} in stock`);
  const stockClass = p.stock <= 0 ? 'is-out' : (p.stock <= 5 ? 'is-low' : '');
  const body = $('#modalBody');

  body.innerHTML = `
    <div class="modal-gallery">
      <div class="modal-gallery-main"><img src="${p.images[0]}" alt="${p.name}" id="modalMainImg" /></div>
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
        <div class="option-radio-list" id="modalColors" role="radiogroup" aria-label="Color">
          ${p.colors.map((c) => `
            <label class="option-radio ${c.name === modalState.color ? 'is-active' : ''}">
              <input type="radio" name="modalColor" value="${c.name}" ${c.name === modalState.color ? 'checked' : ''} />
              <span class="option-radio-swatch" style="background:${c.hex}" aria-hidden="true"></span>
              <span class="option-radio-label">${c.name}</span>
            </label>
          `).join('')}
        </div>
      </div>
      <div class="modal-option-group modal-dimensions-group">
        <span>Dimensions</span>
        <p class="modal-dimensions" id="modalDimensions">${formatDimensions(p.dimensions)}</p>
        <p class="modal-dimensions-note">Height \u00D7 Width \u00D7 Depth &middot; One fixed size</p>
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

  $('#modalColors', body).addEventListener('change', (e) => {
    const input = e.target.closest('input[name="modalColor"]');
    if (!input) return;
    modalState.color = input.value;
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
    addToCart(p.id, { color: modalState.color, qty: modalState.qty });
  });
  const buyBtn = $('#modalBuyNow', body);
  if (buyBtn) buyBtn.addEventListener('click', () => {
    const added = addToCart(p.id, { color: modalState.color, qty: modalState.qty });
    if (added) {
      closeProductModal();
      requireLoginOrRedirect('checkout') && (location.hash = 'checkout');
    }
  });
}

/* ------------------------------------------------------------
   SECTION 9: Router
   ------------------------------------------------------------ */
const KNOWN_VIEWS = [
  'home', 'shop', 'cart', 'wishlist', 'login', 'register', 'account', 'checkout', 'orders', 'confirmation',
  'about', 'compare', 'reviews', 'faq', 'contact', 'shipping', 'returns',
];
const LOGIN_REQUIRED_VIEWS = ['checkout', 'orders', 'account'];
let lastOrder = null;

function showView(name) {
  $$('.view').forEach((v) => v.classList.remove('is-active'));
  const el = document.getElementById(`view-${name}`);
  if (el) el.classList.add('is-active');
  previousHash = name;

  // Wayfinding + nav chrome — kept in sync with whichever view is active
  $('#backHomeBar').hidden = (name === 'home');
  $$('.primary-nav a[href]').forEach((a) => {
    a.classList.toggle('is-active', a.getAttribute('href') === `#${name}`);
  });
  $('#primaryNav').classList.remove('is-open');
  $('#hamburgerBtn').setAttribute('aria-expanded', 'false');
  $('#categoryPanel').classList.remove('is-open');
  $('#categoriesToggle').setAttribute('aria-expanded', 'false');

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
    case 'reviews': renderReviews(); break;
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
  syncCartSelectionState();
  const { items: allItems } = cartTotals();
  const { subtotal, shipping, total } = selectedCartTotals();
  const cartItemsEl = $('#cartItems');
  const layout = $('#cartLayout');
  const empty = $('#cartEmpty');

  if (allItems.length === 0) {
    layout.style.display = 'none';
    empty.hidden = false;
    return;
  }
  layout.style.display = '';
  empty.hidden = true;

  cartItemsEl.innerHTML = '';
  allItems.forEach((line) => {
    const row = document.createElement('div');
    row.className = 'cart-line';
    row.innerHTML = `
      <div class="cart-line-controls">
        <button class="product-wish" type="button" data-id="${line.productId}" aria-label="Toggle wishlist for ${line.product.name}" aria-pressed="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.35-9.5-8.8C.7 8 2 4.5 5.4 4c2-.3 3.7.7 4.6 2.2C10.9 4.7 12.6 3.7 14.6 4c3.4.5 4.7 4 3.9 7.2C16 15.65 12 20 12 20Z"/></svg>
        </button>
        <input type="checkbox" class="cart-line-select" data-key="${line.key}" ${cartSelection.has(line.key) ? 'checked' : ''} aria-label="Select ${line.product.name} for checkout" />
      </div>
      <div class="cart-line-media"><img src="${line.product.images[0]}" alt="${line.product.name}" /></div>
      <div class="cart-line-info">
        <p class="product-brand">${line.product.brand}</p>
        <h3 class="product-name">${line.product.name}</h3>
        <p class="cart-line-options">${line.color}</p>
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

    const wishBtn = row.querySelector('.product-wish');
    syncWishlistButton(wishBtn, line.productId);
    wishBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleWishlist(line.productId); });

    row.querySelector('.cart-line-select').addEventListener('change', (e) => {
      setCartLineSelected(line.key, e.target.checked);
    });

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
  if (validateCartAgainstStock()) {
    toast('Some items in your cart exceeded available stock and were adjusted.', 'error');
    renderCart();
  }
  const { itemCount } = selectedCartTotals();
  if (itemCount === 0) {
    toast('Select at least one item in your cart to checkout.', 'error');
    location.hash = 'cart';
    return;
  }
  prefillCheckoutForms();
  renderCheckoutSummary();
  updateShippingOptionPrices();
  showCheckoutStep(checkoutStep);
}

// Keeps the per-method price shown next to each Shipping Method radio in
// sync with the current cart subtotal (e.g. "Free" once the free-shipping
// threshold is reached on Standard, while Express always shows its flat rate).
function updateShippingOptionPrices() {
  const { subtotal, itemCount } = selectedCartTotals();
  const standardCost = computeShippingCost(subtotal, itemCount, 'standard');
  const expressCost = computeShippingCost(subtotal, itemCount, 'express');
  const stdEl = $('#shipStandardPrice');
  const expEl = $('#shipExpressPrice');
  if (stdEl) stdEl.textContent = standardCost === 0 ? 'Free' : formatPrice(standardCost);
  if (expEl) expEl.textContent = formatPrice(expressCost);
}

function prefillCheckoutForms() {
  const user = getCurrentUser();
  if (user && !$('#shipFullName').value) $('#shipFullName').value = user.name;
  if (user && !$('#shipEmail').value) $('#shipEmail').value = user.email;
}

function renderCheckoutSummary() {
  const { items, subtotal, shipping, total } = selectedCartTotals();
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
    shippingMethod: $('input[name="shippingMethod"]:checked').value,
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
  const { items, subtotal, shipping, total } = selectedCartTotals();

  const shippingMethodLabel = s.shippingMethod === 'express'
    ? 'Express Shipping (1–2 business days)'
    : 'Standard Shipping (3–5 business days)';

  $('#reviewShipping').innerHTML = `
    <h3>Shipping To</h3>
    <p>${s.shipFullName}<br>${s.shipAddress}<br>${s.shipCity}, ${s.shipState} ${s.shipZip}<br>${s.shipCountry}</p>
    <p>${s.shipEmail} · ${s.shipPhone}</p>
    <p>${shippingMethodLabel}</p>
  `;

  const paymentLabel = p.method === 'card'
    ? `Card ending in ${p.cardLast4}`
    : (p.method === 'paypal' ? 'PayPal' : 'Cash on Delivery');
  $('#reviewPayment').innerHTML = `<h3>Payment</h3><p>${paymentLabel}</p>`;

  $('#reviewItems').innerHTML = `
    <h3>Items</h3>
    ${items.map((l) => `
      <div class="review-item-row">
        <span>${l.product.name} (${l.color}) × ${l.qty}</span>
        <span>${formatPrice(l.product.price * l.qty)}</span>
      </div>
    `).join('')}
    <div class="review-item-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
    <div class="review-item-row"><span>Shipping</span><span>${shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
    <div class="review-item-row" style="font-weight:700;"><span>Total</span><span>${formatPrice(total)}</span></div>
  `;
}

function placeOrder() {
  // Final stock check — prevents checkout from completing if any item in the
  // cart now exceeds what's actually available (e.g. stock changed since it
  // was added).
  if (validateCartAgainstStock()) {
    toast('Stock changed for one or more items — your order was not placed. Please review your cart.', 'error');
    renderCheckoutSummary();
    if (checkoutStep === 'review') renderReviewStep();
    return;
  }

  const { items, subtotal, shipping, total, itemCount } = selectedCartTotals();
  if (itemCount === 0) {
    toast('Select at least one item in your cart to checkout.', 'error');
    location.hash = 'cart';
    return;
  }

  const btn = $('#placeOrderBtn');
  btn.classList.add('is-loading');
  btn.disabled = true;

  setTimeout(() => {
    const order = {
      id: `MC${Date.now().toString().slice(-8)}`,
      userEmail: getCurrentUser().email,
      date: new Date().toISOString(),
      status: 'Confirmed',
      items: items.map((l) => ({ productId: l.productId, name: l.product.name, color: l.color, qty: l.qty, price: l.product.price })),
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

    // Only remove the purchased (selected) lines — anything left unselected
    // stays in the cart.
    const purchasedKeys = new Set(items.map((l) => l.key));
    state.cart = state.cart.filter((l) => !purchasedKeys.has(l.key));
    purchasedKeys.forEach((k) => { cartSelection.delete(k); cartSelectionSeen.delete(k); });
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
    <pre class="ascii-bag" aria-hidden="true">     ____
    /    \\
   /______\\
  |        |
  | Ginhawá |
  |_________|</pre>
    <p class="ascii-bag-caption">Packed with care, just for you.</p>
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

  // Hamburger menu — toggles the primary nav drawer on mobile/tablet
  const hamburgerBtn = $('#hamburgerBtn');
  const primaryNav = $('#primaryNav');
  hamburgerBtn.addEventListener('click', () => {
    const isOpen = primaryNav.classList.toggle('is-open');
    hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
  });

  // Categories dropdown — a single toggle reveals the category pills
  const categoriesToggle = $('#categoriesToggle');
  const categoryPanel = $('#categoryPanel');
  categoriesToggle.addEventListener('click', () => {
    const isOpen = categoryPanel.classList.toggle('is-open');
    categoriesToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Skip to footer — small floating button, smooth-scrolls to the footer
  const skipToFooterBtn = $('#skipToFooterBtn');
  if (skipToFooterBtn) {
    skipToFooterBtn.addEventListener('click', () => {
      $('#siteFooter').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Category pills (persistent in the header, control the Shop view)
  $$('.cat-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      setCategoryFilter(pill.dataset.category);
      categoryPanel.classList.remove('is-open');
      categoriesToggle.setAttribute('aria-expanded', 'false');
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

  // Footer social icons link out to the real platforms (see index.html);
  // no JS interception needed — the browser handles the navigation.

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

    // Checkout flow: on the final Review step there's no <form> to submit,
    // so pressing Enter wouldn't otherwise do anything. Make it behave like
    // clicking "Place Order". (On the earlier Shipping/Payment steps, Enter
    // already submits those forms natively via their submit buttons.)
    if (e.key === 'Enter' && e.target.tagName.toLowerCase() !== 'textarea') {
      const checkoutView = $('#view-checkout');
      if (checkoutView && checkoutView.classList.contains('is-active') && checkoutStep === 'review') {
        e.preventDefault();
        const placeOrderBtn = $('#placeOrderBtn');
        if (placeOrderBtn && !placeOrderBtn.disabled) placeOrder();
      }
    }
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

  // Checkout — shipping method
  $$('input[name="shippingMethod"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      $$('#shippingOptions .payment-option').forEach((label) => label.classList.toggle('is-active', label.querySelector('input').checked));
      selectedShippingMethod = $('input[name="shippingMethod"]:checked').value;
      renderCheckoutSummary();
    });
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
    if (selectedCartTotals().itemCount === 0) { toast('Select at least one item in your cart to checkout.', 'error'); return; }
    goTo('checkout');
  });

  // Checkout — place order
  $('#placeOrderBtn').addEventListener('click', placeOrder);

  // Hash-based routing
  window.addEventListener('hashchange', renderRoute);
}

/* ------------------------------------------------------------
   SECTION 15: Customer Reviews (ratings, submission, photo upload)
   ------------------------------------------------------------ */
function computeReviewStats() {
  const total = state.reviews.length;
  const avg = total ? state.reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
  const counts = [0, 0, 0, 0, 0]; // index 0 => 1-star count ... index 4 => 5-star count
  state.reviews.forEach((r) => { counts[r.rating - 1] += 1; });
  return { total, avg, counts };
}

function renderReviewsSummary() {
  const { total, avg, counts } = computeReviewStats();
  const el = $('#reviewsSummary');
  if (!el) return;
  el.innerHTML = `
    <div class="reviews-summary-score">
      <span class="reviews-summary-avg">${avg.toFixed(1)}</span>
      <span class="stars">${starString(avg)}</span>
      <span class="reviews-summary-count">${total} review${total === 1 ? '' : 's'}</span>
    </div>
    <div class="reviews-summary-bars">
      ${[5, 4, 3, 2, 1].map((n) => {
        const count = counts[n - 1];
        const pct = total ? Math.round((count / total) * 100) : 0;
        return `
          <div class="rating-bar-row">
            <span>${n}★</span>
            <div class="rating-bar"><div class="rating-bar-fill" style="width:${pct}%"></div></div>
            <span>${count}</span>
          </div>`;
      }).join('')}
    </div>
  `;
}

function renderReviews() {
  renderReviewsSummary();
  const list = $('#reviewsList');
  if (!list) return;
  const sorted = state.reviews.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  list.innerHTML = sorted.map((r) => `
    <article class="review-card">
      <div class="review-card-head">
        <p class="review-card-name">${escapeHtml(r.name)}</p>
        <p class="review-card-meta">
          <span class="stars">${starString(r.rating)}</span>
          ${r.bagType ? `· ${escapeHtml(r.bagType)}` : ''}
          · ${new Date(r.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
        </p>
      </div>
      <p class="review-card-text">${escapeHtml(r.text)}</p>
      ${r.image ? `<img class="review-card-image" src="${r.image}" alt="Photo submitted with ${escapeHtml(r.name)}'s review" />` : ''}
    </article>
  `).join('');
}

let reviewImageData = null;

function initReviewsForm() {
  const form = $('#reviewForm');
  if (!form) return;

  const ratingWrap = $('#reviewRatingInput');
  const ratingButtons = $$('.star-input', ratingWrap);
  const ratingValueInput = $('#reviewRatingValue');

  ratingButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      ratingValueInput.value = btn.dataset.rating;
      ratingButtons.forEach((b) => {
        b.classList.toggle('is-filled', Number(b.dataset.rating) <= Number(btn.dataset.rating));
      });
      setFieldError('reviewRating', '');
    });
  });

  const fileInput = $('#reviewImage');
  const previewWrap = $('#reviewImagePreview');
  const previewImg = $('#reviewImagePreviewImg');

  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file.', 'error');
      fileInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      reviewImageData = reader.result;
      previewImg.src = reviewImageData;
      previewWrap.hidden = false;
    };
    reader.readAsDataURL(file);
  });

  $('#reviewImageRemove').addEventListener('click', () => {
    reviewImageData = null;
    fileInput.value = '';
    previewWrap.hidden = true;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    setFieldError('reviewName', ''); setFieldError('reviewText', ''); setFieldError('reviewRating', '');

    const name = $('#reviewName').value.trim();
    const bagType = $('#reviewBagType').value;
    const rating = Number(ratingValueInput.value);
    const text = $('#reviewText').value.trim();

    if (!name) { setFieldError('reviewName', 'Please enter your name.'); ok = false; }
    if (!rating) { setFieldError('reviewRating', 'Please select a star rating.'); ok = false; }
    if (!text) { setFieldError('reviewText', 'Please share a few words about your experience.'); ok = false; }
    if (!ok) return;

    const btn = $('#reviewSubmitBtn');
    btn.classList.add('is-loading'); btn.disabled = true;

    setTimeout(() => {
      state.reviews.push({
        id: Date.now(),
        name, bagType, rating, text,
        image: reviewImageData,
        date: new Date().toISOString(),
      });
      saveReviews();

      btn.classList.remove('is-loading'); btn.disabled = false;
      form.reset();
      ratingButtons.forEach((b) => b.classList.remove('is-filled'));
      ratingValueInput.value = '0';
      reviewImageData = null;
      previewWrap.hidden = true;

      renderReviews();
      toast('Thank you for your review!', 'success');
    }, 500);
  });
}

/* ------------------------------------------------------------
   SECTION 16: Compare Bags / Contact / Shipping / Newsletter
   ------------------------------------------------------------ */
function initCompareView() {
  const btn = $('#compareToggleBtn');
  const wrap = $('#compareTableWrap');
  if (!btn || !wrap) return;
  btn.addEventListener('click', () => {
    const isHidden = wrap.classList.toggle('is-hidden');
    btn.textContent = isHidden ? 'Show Table' : 'Hide Table';
    btn.setAttribute('aria-expanded', String(!isHidden));
  });
}

function initContactForm() {
  const form = $('#contactForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    ['contactName', 'contactEmail', 'contactMessage'].forEach((id) => setFieldError(id, ''));

    const name = $('#contactName').value.trim();
    const email = $('#contactEmail').value.trim();
    const message = $('#contactMessage').value.trim();

    if (!name) { setFieldError('contactName', 'Please enter your name.'); ok = false; }
    if (!EMAIL_RE.test(email)) { setFieldError('contactEmail', 'Enter a valid email address.'); ok = false; }
    if (!message) { setFieldError('contactMessage', 'Please enter a message.'); ok = false; }
    if (!ok) return;

    const btn = $('#contactSubmitBtn');
    btn.classList.add('is-loading'); btn.disabled = true;
    setTimeout(() => {
      btn.classList.remove('is-loading'); btn.disabled = false;
      form.reset();
      toast('Message sent — we will get back to you soon.', 'success');
    }, 600);
  });
}

function initNewsletterForm() {
  const form = $('#newsletterForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = $('#newsletterEmail');
    const email = emailInput.value.trim();
    setFieldError('newsletterEmail', '');

    if (!EMAIL_RE.test(email)) {
      setFieldError('newsletterEmail', 'Enter a valid email address.');
      return;
    }

    const btn = $('#newsletterSubmitBtn');
    btn.classList.add('is-loading'); btn.disabled = true;
    setTimeout(() => {
      btn.classList.remove('is-loading'); btn.disabled = false;
      form.reset();
      toast(`Subscribed! Look out for updates at ${email}.`, 'success');
    }, 500);
  });
}

// Keep the Shipping Information page's flat-rate/free-shipping copy in
// sync with the actual checkout constants, rather than hardcoding them twice.
function initShippingInfoText() {
  const flatEl = $('#shippingFlatRateText');
  const thresholdEl = $('#freeShippingThresholdText');
  if (flatEl) flatEl.textContent = formatPrice(SHIPPING_FLAT);
  if (thresholdEl) thresholdEl.textContent = formatPrice(FREE_SHIPPING_THRESHOLD);
}

/* ------------------------------------------------------------
   SECTION 17: "A Moment of Ginhawá" audio chime toggle
   ------------------------------------------------------------ */
function initChimeAudio() {
  const btn = $('#chimeToggle');
  const audio = $('#chimeAudio');
  if (!btn || !audio) return;
  const iconPlay = $('.icon-play', btn);
  const iconPause = $('.icon-pause', btn);

  btn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => toast('Audio could not be played.', 'error'));
    } else {
      audio.pause();
    }
  });
  audio.addEventListener('play', () => {
    btn.setAttribute('aria-pressed', 'true');
    btn.setAttribute('aria-label', 'Pause the chime');
    iconPlay.hidden = true;
    iconPause.hidden = false;
  });
  audio.addEventListener('pause', () => {
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Play a moment of ginhawá');
    iconPlay.hidden = false;
    iconPause.hidden = true;
  });
  audio.addEventListener('ended', () => {
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Play a moment of ginhawá');
    iconPlay.hidden = false;
    iconPause.hidden = true;
  });
}

/* ------------------------------------------------------------
   SECTION 18: "Follow the Journey" responsive image map
   The <area> coords are recalculated from each region's percentage
   bounds (data-rect) against the image's *current rendered* size,
   so the clickable regions stay lined up at any screen width.
   ------------------------------------------------------------ */
function initFollowMap() {
  const img = $('#followBannerImg');
  const areas = $$('#followMap area');
  if (!img || !areas.length) return;

  function updateAreas() {
    const w = img.clientWidth;
    const h = img.clientHeight;
    if (!w || !h) return;
    areas.forEach((area) => {
      const [x1, y1, x2, y2] = area.dataset.rect.split(',').map(Number);
      const coords = [
        Math.round((x1 / 100) * w),
        Math.round((y1 / 100) * h),
        Math.round((x2 / 100) * w),
        Math.round((y2 / 100) * h),
      ];
      area.coords = coords.join(',');
    });
  }

  if (img.complete) updateAreas();
  img.addEventListener('load', updateAreas);

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateAreas, 120);
  });
}

/* ------------------------------------------------------------
   SECTION 19: Bag Care & Storage Guide — expand/collapse toggles
   Each panel (PDF or video) has one toggle button that grows the
   embedded iframe taller and swaps its icon + aria-expanded state.
   ------------------------------------------------------------ */
function initCareGuide() {
  $$('.care-guide-toggle').forEach((btn) => {
    const panel = document.getElementById(btn.dataset.target);
    if (!panel) return;
    const iconExpand = $('.icon-expand', btn);
    const iconCollapse = $('.icon-collapse', btn);

    btn.addEventListener('click', () => {
      const isExpanded = panel.classList.toggle('is-expanded');
      btn.setAttribute('aria-expanded', String(isExpanded));
      if (iconExpand) iconExpand.hidden = isExpanded;
      if (iconCollapse) iconCollapse.hidden = !isExpanded;
      if (isExpanded) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });
}

/* ------------------------------------------------------------
   SECTION 21: Care video — autoplay on open + play/pause toggle
   The video panel's iframe uses srcdoc, so its <video> is same-
   origin and fully scriptable. Every time the page (or the
   iframe) loads, the video starts playing (muted, as browsers
   require for autoplay); the button lets the visitor pause or
   resume it, with the icon swapping to reflect the current state.
   ------------------------------------------------------------ */
function initCareVideoPlayback() {
  const btn = $('#careVideoPlayToggle');
  const frame = $('#careVideoFrame');
  if (!btn || !frame) return;
  const iconPlay = $('.icon-play', btn);
  const iconPause = $('.icon-pause', btn);

  function syncButton(video) {
    const playing = !video.paused && !video.ended;
    btn.setAttribute('aria-pressed', String(playing));
    btn.setAttribute('aria-label', playing ? 'Pause the care video' : 'Play the care video');
    if (iconPlay) iconPlay.hidden = playing;
    if (iconPause) iconPause.hidden = !playing;
  }

  function wireVideo() {
    let video = null;
    try { video = frame.contentDocument && frame.contentDocument.getElementById('careVideo'); }
    catch (err) { video = null; }
    if (!video) { btn.disabled = true; return; }

    video.play().catch(() => {}); // autoplay every time the site/panel loads
    syncButton(video);
    video.addEventListener('play', () => syncButton(video));
    video.addEventListener('pause', () => syncButton(video));
    video.addEventListener('ended', () => syncButton(video));

    btn.onclick = () => {
      if (video.paused || video.ended) video.play().catch(() => {});
      else video.pause();
    };
  }

  if (frame.contentDocument && frame.contentDocument.readyState === 'complete') wireVideo();
  frame.addEventListener('load', wireVideo);
}

/* ------------------------------------------------------------
   SECTION 14: Init
   ------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderCounts();
  initHeaderAndGlobalEvents();
  initHeroSlideshow();
  initCompareView();
  initReviewsForm();
  initContactForm();
  initNewsletterForm();
  initShippingInfoText();
  initChimeAudio();
  initFollowMap();
  initCareGuide();
  initCareVideoPlayback();
  renderHome();
  renderRoute();
});