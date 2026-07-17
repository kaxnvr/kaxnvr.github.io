/* ===== KAXNiOR shared data layer =====
   Single source of truth for products, categories, scent families and notes.
   Consumed by site.js (nav/footer/mega) and every page (product / scent / about / store).

   IMAGE DISPLAY MODE — each product has `fit`:
     'blend' = white-background cut-out shown on a light plinth with mix-blend:multiply
               (the four fragrances + the discovery set box).
     'cover' = a finished photographic shot on its own grey/light background, shown
               full-bleed (lip balms, candles, room fragrance).
   To add a real image later: drop the optimized jpg in website/img/, set `img` + `fit`,
   and remove `soon:true`. */

const ASSET = '/kaxnior-fragrance/img/';

/* The four signature fragrances. Each carries a unique raw-stone stopper — no two alike. */
const FRAGRANCES = [
  {
    id: 'dusk-isle', no: '01', name: 'Dusk Isle', family: 'Woody Floral',
    img: ASSET + 'dusk-isle.avif', gallery: [ASSET + 'dusk-isle.avif', ASSET + 'dusk-isle-box.avif'], stone: 'Veined Quartzite',
    accord: ['Mandarin', 'Immortelle', 'Frangipani'],
    notes: {
      top: ['Hand-Pressed Mandarin', 'Bergamot Calabria'],
      heart: ['Immortelle Absolute', 'Frangipani', 'Orange Blossom'],
      base: ['Sandalwood', 'Tonka Bean', 'Soft Amber'],
    },
    vol: '100 ml · 3.38 FL OZ · Eau de Parfum',
    desc: 'The last light on an unnamed island. Warm citrus pressed at the moment of ripeness, carried on a current of immortelle — flowers that do not wither.',
    story: 'Dusk Isle opens on citrus pressed by hand at the exact moment of ripeness, then settles into immortelle — the flower that never fades. A fragrance held at golden hour, the instant before light leaves the water.',
  },
  {
    id: 'moss-within', no: '02', name: 'Moss Within', family: 'Green Woody',
    img: ASSET + 'moss-within.avif', gallery: [ASSET + 'moss-within.avif', ASSET + 'moss-within-box.avif'], stone: 'Moss Agate',
    accord: ['Vetiver', 'Oakmoss', 'Cedarwood'],
    notes: {
      top: ['Galbanum', 'Violet Leaf'],
      heart: ['Oakmoss Absolute', 'Vetiver Bourbon'],
      base: ['Cedarwood Atlas', 'Vetiver Root', 'Patchouli'],
    },
    vol: '100 ml · 3.38 FL OZ · Eau de Parfum',
    desc: 'The interior of an ancient forest. Vetiver roots pressed deep into earth, surrounded by the green mineral depth of oakmoss. What grows inside a stone.',
    story: 'Moss Within is the cool dark heart of a forest. Vetiver pressed into wet earth, wrapped in the mineral green of oakmoss — the quiet, growing thing that lives inside the rock.',
  },
  {
    id: 'salted-dawn', no: '03', name: 'Salted Dawn', family: 'Citrus Marine',
    img: ASSET + 'salted-dawn.avif', gallery: [ASSET + 'salted-dawn.avif', ASSET + 'salted-dawn-box.avif'], stone: 'Grey Sea Flint',
    accord: ['Ambergris', 'Sea Fennel', 'Neroli'],
    notes: {
      top: ['Neroli Bigarade', 'Sea Salt Accord'],
      heart: ['Sea Fennel Absolute', 'Marine Mineral'],
      base: ['Ambergris Tincture', 'White Musk', 'Driftwood'],
    },
    vol: '100 ml · 3.38 FL OZ · Eau de Parfum',
    desc: 'Before the world wakes. Salt-bitten air over grey water, lifted by the bitter sweetness of neroli. A silence that smells like becoming.',
    story: 'Salted Dawn is the cold hour before sunrise — mineral salt suspended over grey water, the bitter brightness of neroli cutting through. It smells of a coastline no one has reached yet.',
  },
  {
    id: 'noir-pilgrim', no: '04', name: 'Noir Pilgrim', family: 'Woody Oriental',
    img: ASSET + 'noir-pilgrim.avif', gallery: [ASSET + 'noir-pilgrim.avif', ASSET + 'noir-pilgrim-box.avif'], stone: 'Smoked Obsidian',
    accord: ['Oud', 'Labdanum', 'Black Pepper'],
    notes: {
      top: ['Black Pepper CO₂', 'Saffron'],
      heart: ['Oud Resinoid', 'Dark Rose'],
      base: ['Labdanum Absolute', 'Leather', 'Patchouli'],
    },
    vol: '100 ml · 3.38 FL OZ · Eau de Parfum',
    desc: 'Pilgrimage through resin and smoke. Deep oud anchored by labdanum’s dark amber, sharpened by a single crack of black pepper. A journey with no fixed destination.',
    story: 'Noir Pilgrim is movement through smoke. Resinous oud is grounded by labdanum and leather, then split open by a single crack of black pepper — a long road walked at night, with no fixed end.',
  },
];

/* Extension lines. Hand Cream still mirrors a parent fragrance (visuals pending).
   Lip Balm / Home Fragrance are now their own products with real photography. */
const EXTENSIONS = [
  /* ── Hand Cream — brushed silver tube + winder key, own scents (grey bg → fit:cover) ── */
  { id: 'hand-pale-meridian', cat: 'Hand Cream', name: 'Pale Meridian', family: 'Citrus Woody', sub: 'Perfumed Hand Cream · No. 01', vol: '75 ml', price: 35, fit: 'cover',
    img: ASSET + 'hand-pale-meridian.avif', gallery: [ASSET + 'hand-pale-meridian.avif', ASSET + 'hand-pale-meridian-box.avif'],
    accord: ['Citrus', 'Vetiver', 'White Wood'],
    desc: 'No. 01 — a pale, weightless cream. Bright citrus over vetiver and white wood, drawn into the skin like light at the height of day.' },
  { id: 'hand-fig-ruin', cat: 'Hand Cream', name: 'Fig & Ruin', family: 'Green Fig', sub: 'Perfumed Hand Cream · No. 02', vol: '75 ml', price: 35, fit: 'cover',
    img: ASSET + 'hand-fig-ruin.avif', gallery: [ASSET + 'hand-fig-ruin.avif', ASSET + 'hand-fig-ruin-box.avif'],
    accord: ['Fig', 'Bitter Orange', 'Moss'],
    desc: 'No. 02 — green fig and bitter orange over damp moss. A richer cream, the scent of a garden left quietly to ruin.' },

  /* ── Lip Balm — The Shades (silver stick, photographed on grey → fit:cover) ── */
  { id: 'lip-bare', cat: 'Lip Balm', name: 'Bare', family: 'Clear', sub: 'Tinted Lip Balm', vol: '6 g', price: 25, fit: 'cover',
    img: ASSET + 'lip-bare.avif', gallery: [ASSET + 'lip-bare.avif', ASSET + 'lip-bare-bag.avif'], accord: ['Clear Finish', 'Weightless Care'],
    desc: 'The bare end of the range — a clear, weightless balm. The lips, only softer.' },
  { id: 'lip-nude', cat: 'Lip Balm', name: 'Nude', family: 'Nude', sub: 'Tinted Lip Balm', vol: '6 g', price: 25, fit: 'cover',
    img: ASSET + 'lip-nude.avif', gallery: [ASSET + 'lip-nude.avif', ASSET + 'lip-nude-bag.avif'], accord: ['Soft Nude', 'Satin Finish'],
    desc: 'A sheer nude wash with a satin finish — quiet colour, lasting comfort.' },
  { id: 'lip-noir', cat: 'Lip Balm', name: 'Noir', family: 'Deep', sub: 'Tinted Lip Balm', vol: '6 g', price: 25, fit: 'cover',
    img: ASSET + 'lip-noir.avif', gallery: [ASSET + 'lip-noir.avif', ASSET + 'lip-noir-bag.avif'], accord: ['Sheer Depth', 'Satin Finish'],
    desc: 'The deepest of the three — a sheer, smoke-tinted balm that settles into a worn-in stain.' },

  /* ── Home Fragrance — candles (475 g) + a lava room diffuser ── */
  { id: 'candle-white-veil', cat: 'Home Fragrance', name: 'White Veil', family: 'Clean Musk', sub: 'Scented Candle · No. 01', vol: '475 g', price: 70, fit: 'cover',
    img: ASSET + 'candle-white-veil.avif', gallery: [ASSET + 'candle-white-veil.avif', ASSET + 'candle-white-veil-top.avif', ASSET + 'candle-white-veil-box.avif'],
    accord: ['White Musk', 'Powdered Iris', 'Soft Woods'],
    desc: 'No. 01 — a clean, enveloping white. Musk and powdered iris over soft woods, like light filtered through linen.' },
  { id: 'candle-dusk-in-calabria', cat: 'Home Fragrance', name: 'Dusk in Calabria', family: 'Citrus Amber', sub: 'Scented Candle · No. 02', vol: '475 g', price: 70, fit: 'cover',
    img: ASSET + 'candle-dusk-in-calabria.avif', gallery: [ASSET + 'candle-dusk-in-calabria.avif', ASSET + 'candle-dusk-in-calabria-top.avif', ASSET + 'candle-dusk-in-calabria-box.avif'],
    accord: ['Calabrian Bergamot', 'Mandarin', 'Low Amber'],
    desc: 'No. 02 — the sun going down over a citrus coast. Calabrian bergamot and mandarin warmed by a slow, low amber.' },
  { id: 'room-fragrance', cat: 'Home Fragrance', name: 'Room Fragrance', family: 'Lava Diffuser', sub: 'Lava Diffuser & Oil', vol: 'Fragrance Oil 10 mL · Stone Vessel', price: 145, fit: 'cover',
    img: ASSET + 'room-fragrance.avif', gallery: [ASSET + 'room-fragrance.avif', ASSET + 'room-fragrance-box.avif'], accord: ['Porous Lava Stone', 'Fragrance Oil'],
    desc: 'A cast vessel of porous lava stone and a 10 mL fragrance oil — a few drops, and the room holds the scent. No flame.' },
];

/* Concept retail prices (GBP £), by category — fallback when a product has no explicit price. */
const PRICE = { 'Fragrance': 145, 'Hand Cream': 35, 'Lip Balm': 25, 'Home Fragrance': 70 };

/* ---- Build the flat PRODUCTS map every page reads from ---- */
const PRODUCTS = {};
FRAGRANCES.forEach((f) => {
  PRODUCTS[f.id] = {
    cat: 'Fragrance', name: f.name, sub: `No. ${f.no} · ${f.family}`,
    family: f.family, stone: f.stone, img: f.img, gallery: f.gallery || null, fit: 'cover', price: PRICE['Fragrance'],
    notes: f.notes, accord: f.accord, vol: f.vol, desc: f.desc, story: f.story,
  };
});
EXTENSIONS.forEach((e) => {
  const par = e.parent ? PRODUCTS[e.parent] : null;
  PRODUCTS[e.id] = {
    cat: e.cat,
    name: e.name || (par ? par.name : ''),
    sub: e.sub,
    parent: e.parent,
    family: e.family || (par ? par.family : ''),
    accord: e.accord,
    price: e.price != null ? e.price : PRICE[e.cat],
    notes: { top: e.accord, heart: [], base: [] },
    img: e.img || null,
    gallery: e.gallery || null,
    fit: e.fit || 'blend',
    soon: !!e.soon,
    vol: e.vol,
    desc: e.soon ? e.desc + ' Visual and packaging in development.' : e.desc,
  };
});

/* Discovery Set — the four fragrances as 11 mL travel sprays (real boxed photo, white bg). */
PRODUCTS['discovery-set'] = {
  cat: 'Fragrance', name: 'Discovery Set', sub: 'Four 11 mL Travel Sprays',
  // img = preview-bar/thumbnail shot (mega menu, bag); gallery = the PDP "info" page shot.
  // fit:'cover' (full-bleed, like lip/candle) — the box photo's grey studio bg (~#efeff1) is NOT pure
  // white, so 'blend'+multiply exposed a faint rectangle edge; 'cover' fills the slide seamlessly.
  family: 'The Set', img: ASSET + 'discovery-set-preview.avif', gallery: [ASSET + 'discovery-set.avif'], fit: 'cover', price: 50,
  accord: FRAGRANCES.map((f) => f.name),
  notes: { top: [], heart: [], base: [] },
  vol: '4 × 11 mL · Eau de Parfum',
  desc: 'The whole house in miniature — Dusk Isle, Moss Within, Noir Pilgrim and Salted Dawn in four 11 mL travel sprays. The simplest way into KAXNiOR, and the way to find the stone that is yours.',
};

/* Cache-bust every product-image URL. The dev server (python http.server) sends no cache
   headers, so a re-exported photo keeps its filename and the browser shows the STALE cached
   copy. Bump IMG_V whenever any image in website/img/ is replaced, and all <img> refetch. */
const IMG_V = '34';
(function () {
  const v = (s) => (s && s.indexOf('.avif') > -1 && s.indexOf('?') < 0) ? s + '?v=' + IMG_V : s;
  FRAGRANCES.forEach((f) => { f.img = v(f.img); });
  Object.values(PRODUCTS).forEach((p) => { p.img = v(p.img); if (p.gallery) p.gallery = p.gallery.map(v); });
})();

/* Format a price for display. */
function money(n) { return '£' + Number(n).toFixed(0); }

/* ---- Nav categories (TAMBURINS split) ---- */
const CATEGORIES = [
  { label: 'Fragrance',      head: 'Fragrance — 04 Eaux de Parfum + Discovery Set',  ids: [...FRAGRANCES.map((f) => f.id), '|', 'discovery-set'] },
  { label: 'Hand Cream',     head: 'Hand Cream — 02 Perfumed · 75 ml',                ids: ['hand-pale-meridian', 'hand-fig-ruin'] },
  { label: 'Lip Balm',       head: 'Lip Balm — 03 Shades · Tinted Care',             ids: ['lip-bare', 'lip-nude', 'lip-noir'] },
  { label: 'Home Fragrance', head: 'Home Fragrance — 02 Candles · 475 g + Room',     ids: ['candle-white-veil', 'candle-dusk-in-calabria', '|', 'room-fragrance'] },
];

/* Card sub-label for the mega-menu (family for real products, "Coming Soon" for pending). */
function cardSub(id) {
  const p = PRODUCTS[id];
  return p.soon ? 'Coming Soon' : p.family;
}
