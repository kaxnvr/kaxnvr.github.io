/* ===== KAXNiOR shared site chrome =====
   Renders the nav (desktop mega-menu + mobile drawer) and footer into any page
   that provides <nav id="site-nav"> and <footer id="site-footer">.
   Also wires: scroll state, mega hover grace period, mobile toggle, scroll reveals.
   Requires data.js (PRODUCTS, CATEGORIES, cardSub) loaded first. */
(function () {
  const PAGE = document.body.dataset.page || '';

  /* ---------- deterrent only: block right-click "Save Image As" on photos.
     CSS handles the iOS long-press sheet; this covers desktop's context menu,
     which CSS pointer-events:none doesn't reach once the event already fired. */
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('img, picture, canvas')) e.preventDefault();
  });
  document.addEventListener('dragstart', (e) => {
    if (e.target.closest('img, picture, canvas')) e.preventDefault();
  });

  /* ---------- SEO: Organization structured data (every page) ---------- */
  (function () {
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Brand',
      name: 'KAXNiOR',
      slogan: 'Scent, sealed in stone.',
      description: 'A sensory fragrance house. Scent shaped by nature, sealed in stone — four eaux de parfum, each crowned by a unique raw-stone stopper.',
      logo: '/kaxnior-fragrance/logo-dark.avif',
    });
    document.head.appendChild(ld);
  })();

  /* ---------- NAV ---------- */
  // Discovery Set is shot on its OWN studio backdrop (not the site's default light grey) —
  // feather that backdrop colour outward around its thumb (CSS halo on .mega-thumb.bg-*)
  // so the photo doesn't end on a mismatched hard edge.
  const MEGA_THUMB_BG = { 'discovery-set': 'bg-discovery-set' };
  // Small-display contexts (mega menu, bag, scent cards) load the 800px-wide
  // proportional copies in img/thumb/ — same framing, ~10x lighter than the
  // 2400px masters, which stay reserved for the PDP gallery.
  const thumbSrc = (src) => src.replace('/img/', '/img/thumb/');
  window.KX_THUMB = thumbSrc;
  function megaCard(id) {
    const p = PRODUCTS[id];
    // Eager (not lazy): mega thumbs live in a visibility:hidden panel, where native
    // lazy-loading won't fire on hover. They're small (~75KB) and cached across pages.
    let thumb;
    if (p && p.img) {
      const cls = p.fit === 'cover' ? 'cover' : 'lit';
      const bg = MEGA_THUMB_BG[id] ? ` ${MEGA_THUMB_BG[id]}` : '';
      thumb = `<div class="mega-thumb ${cls}${bg}"><img src="${thumbSrc(p.img)}" alt="${p.name}" decoding="async"></div>`;
    } else {
      thumb = `<div class="mega-thumb ph"><div class="ph-icon">+</div><span class="ph-label">Visual Pending</span></div>`;
    }
    return `<a class="mega-card" href="/kaxnior-fragrance/product.html?id=${id}">${thumb}`
      + `<span class="mega-label">${p.name}</span><span class="mega-sub">${cardSub(id)}</span></a>`;
  }

  function megaItem(cat) {
    const cards = cat.ids.map((id) => (id === '|' ? '<div class="mega-div"></div>' : megaCard(id))).join('');
    return `<li class="has-menu"><a href="#">${cat.label}</a>`
      + `<div class="mega"><div class="mega-head">${cat.head}</div>`
      + `<div class="mega-row">${cards}</div>`
      + `<a class="mega-more" href="${scentHref(cat.label)}">Explore ${cat.label} by scent →</a>`
      + `</div></li>`;
  }

  const secondary = [
    { label: 'Journal', href: '/kaxnior-fragrance/journal.html', key: 'journal' },
    { label: 'About', href: '/kaxnior-fragrance/about.html', key: 'about' },
    { label: 'Store', href: '/kaxnior-fragrance/store.html', key: 'store' },
  ];

  // Per-category "by scent" library link (surfaced inside the shop, not the top nav)
  const scentHref = (label) => `/kaxnior-fragrance/scent.html?cat=${encodeURIComponent(label)}`;

  const navInner = `
    <a href="/kaxnior-fragrance/index.html" class="nav-logo"><img src="/kaxnior-fragrance/logo-dark.avif" alt="KAXNiOR"></a>
    <ul class="nav-menu">
      ${CATEGORIES.map(megaItem).join('')}
      <li class="nav-spacer"></li>
      <li class="sep"></li>
      ${secondary.map((s) => `<li><a href="${s.href}" class="${PAGE === s.key ? 'active' : 'muted'}">${s.label}</a></li>`).join('')}
    </ul>
    <div class="nav-actions">
      <button class="nav-bag" aria-label="Open bag">Bag<span class="bag-count"></span></button>
      <button class="nav-burger" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-drawer"><span></span><span></span></button>
    </div>`;

  const navEl = document.getElementById('site-nav');
  if (navEl) navEl.innerHTML = navInner;

  /* Skip link + main landmark (keyboard a11y) */
  const mainEl = document.querySelector('main');
  if (mainEl && !mainEl.id) mainEl.id = 'main-content';
  if (mainEl) {
    const skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#' + mainEl.id;
    skip.textContent = 'Skip to content';
    document.body.insertBefore(skip, document.body.firstChild);
  }

  /* ---------- MOBILE DRAWER ---------- */
  const drawer = document.createElement('div');
  drawer.className = 'mobile-drawer';
  drawer.id = 'mobile-drawer';
  drawer.setAttribute('aria-hidden', 'true');
  drawer.innerHTML = `
    <div class="md-inner">
      ${CATEGORIES.map((cat, i) => `
        <div class="md-group">
          <button class="md-cat" data-acc="${i}" aria-expanded="false">${cat.label}<span class="md-plus">+</span></button>
          <div class="md-panel" id="md-panel-${i}">
            ${cat.ids.filter((id) => id !== '|').map((id) => `<a href="/kaxnior-fragrance/product.html?id=${id}">${PRODUCTS[id].name}<em>${cardSub(id)}</em></a>`).join('')}
            <a class="md-more" href="${scentHref(cat.label)}">Explore by scent →</a>
          </div>
        </div>`).join('')}
      <div class="md-group md-secondary">
        ${secondary.map((s) => `<a href="${s.href}">${s.label}</a>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(drawer);

  // Mobile drawer: tap a category to expand/collapse its products (accordion)
  drawer.querySelectorAll('.md-cat').forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      drawer.querySelectorAll('.md-cat').forEach((b) => { b.setAttribute('aria-expanded', 'false'); b.nextElementSibling.style.maxHeight = null; });
      if (!open) { btn.setAttribute('aria-expanded', 'true'); const panel = btn.nextElementSibling; panel.style.maxHeight = panel.scrollHeight + 'px'; }
    });
  });

  /* ---------- FOOTER ---------- */
  const footerInner = `
    <div class="footer-top">
      <div class="footer-logo">
        <img src="/kaxnior-fragrance/logo-dark.avif" alt="KAXNiOR">
        <p class="footer-tag">A sensory fragrance house. Scent shaped by nature, sealed in stone.</p>
      </div>
      <div class="footer-col"><h4>Shop</h4><ul>
        ${CATEGORIES.map((c) => `<li><a href="/kaxnior-fragrance/scent.html?cat=${encodeURIComponent(c.label)}">${c.label}</a></li>`).join('')}
      </ul></div>
      <div class="footer-col"><h4>House</h4><ul>
        <li><a href="/kaxnior-fragrance/about.html">About</a></li>
        <li><a href="/kaxnior-fragrance/journal.html">Journal</a></li>
        <li><a href="/kaxnior-fragrance/store.html">Stores</a></li>
      </ul></div>
      <div class="footer-col"><h4>Connect</h4><ul>
        <li><a href="https://www.instagram.com/kaxnior-fragrance/" target="_blank" rel="noopener">Instagram</a></li>
        <li><a href="https://x.com/KAXNiOR" target="_blank" rel="noopener">X</a></li>
      </ul></div>
    </div>
    <div class="footer-bottom">
      <span class="footer-copy">© 2026 KAXNiOR. All rights reserved.</span>
      <span class="footer-copy">Seoul · Portfolio Concept</span>
    </div>`;
  const footEl = document.getElementById('site-footer');
  if (footEl) footEl.innerHTML = footerInner;

  /* ---------- INTERACTIONS ---------- */
  const nav = navEl;

  // Scroll → solid glass nav. Pages that opt in with data-nav="solid" stay solid.
  if (nav && nav.dataset.nav !== 'solid') {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mega-menu: JS hover with grace period so the cursor can slide nav → cards.
  document.querySelectorAll('.has-menu').forEach((li) => {
    let t;
    li.addEventListener('mouseenter', () => { clearTimeout(t); li.classList.add('is-open'); });
    li.addEventListener('mouseleave', () => { t = setTimeout(() => li.classList.remove('is-open'), 160); });
  });

  // Mobile drawer toggle
  const burger = document.querySelector('.nav-burger');
  if (burger) {
    const setOpen = (open) => {
      document.body.classList.toggle('drawer-open', open);
      burger.classList.toggle('is-x', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      drawer.setAttribute('aria-hidden', String(!open));
    };
    burger.addEventListener('click', () => setOpen(!document.body.classList.contains('drawer-open')));
    drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    drawer.addEventListener('click', (e) => { if (e.target === drawer) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  // Scroll reveals
  function initReveals() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || !els.length) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
  }
  if (document.readyState !== 'loading') initReveals();
  else document.addEventListener('DOMContentLoaded', initReveals);

  /* ---------- BAG (cart) — localStorage, slide-in drawer, cross-page ---------- */
  const BAG_KEY = 'kx_bag';
  const getBag = () => { try { return JSON.parse(localStorage.getItem(BAG_KEY)) || []; } catch (e) { return []; } };
  const saveBag = (b) => localStorage.setItem(BAG_KEY, JSON.stringify(b));

  const bagDrawer = document.createElement('aside');
  bagDrawer.className = 'bag-drawer';
  bagDrawer.setAttribute('aria-hidden', 'true');
  bagDrawer.innerHTML = `
    <div class="bag-head"><span>Your Bag</span><button class="bag-close" aria-label="Close bag">×</button></div>
    <div class="bag-items"></div>
    <div class="bag-foot">
      <div class="bag-subtotal"><span class="bs-label">Subtotal</span><span class="bag-total">$0</span></div>
      <a class="btn-solid bag-checkout" href="#">Checkout</a>
      <p class="bag-note">Concept store — checkout is not enabled.</p>
    </div>`;
  const bagOverlay = document.createElement('div');
  bagOverlay.className = 'bag-overlay';
  document.body.appendChild(bagOverlay);
  document.body.appendChild(bagDrawer);

  const bagItemsEl = bagDrawer.querySelector('.bag-items');
  const bagTotalEl = bagDrawer.querySelector('.bag-total');
  const bagCountEls = () => document.querySelectorAll('.bag-count');

  function bagCount() { return getBag().reduce((n, i) => n + i.qty, 0); }
  function bagTotal() { return getBag().reduce((s, i) => s + (PRODUCTS[i.id] ? PRODUCTS[i.id].price * i.qty : 0), 0); }

  function renderCount() {
    const n = bagCount();
    bagCountEls().forEach((el) => { el.textContent = n ? ` (${n})` : ''; });
  }

  function renderBag() {
    const bag = getBag();
    if (!bag.length) {
      bagItemsEl.innerHTML = '<p class="bag-empty">Your bag is empty.</p>';
    } else {
      bagItemsEl.innerHTML = bag.map((i) => {
        const p = PRODUCTS[i.id]; if (!p) return '';
        const thumb = p.img
          ? `<div class="bag-thumb ${p.fit === 'cover' ? 'cover' : ''}"><img src="${thumbSrc(p.img)}" alt="${p.name}"></div>`
          : `<div class="bag-thumb ph">+</div>`;
        return `<div class="bag-item" data-id="${i.id}">
          ${thumb}
          <div class="bag-info">
            <div class="bi-name">${p.name}</div>
            <div class="bi-sub">${p.cat} · ${p.vol ? p.vol.split('·')[0].trim() : ''}</div>
            <div class="bag-qty"><button data-act="dec" aria-label="Decrease">−</button><span>${i.qty}</span><button data-act="inc" aria-label="Increase">+</button></div>
          </div>
          <div class="bag-right">
            <span class="bag-price">${money(p.price * i.qty)}</span>
            <button class="bag-remove" data-act="rm">Remove</button>
          </div>
        </div>`;
      }).join('');
    }
    bagTotalEl.textContent = money(bagTotal());
    const checkout = bagDrawer.querySelector('.bag-checkout');
    checkout.classList.toggle('disabled', !bag.length);
    renderCount();
  }

  function openBag() { document.body.classList.add('bag-open'); bagDrawer.setAttribute('aria-hidden', 'false'); renderBag(); }
  function closeBag() { document.body.classList.remove('bag-open'); bagDrawer.setAttribute('aria-hidden', 'true'); }

  function addToBag(id) {
    if (!PRODUCTS[id]) return;
    const bag = getBag();
    const found = bag.find((i) => i.id === id);
    if (found) found.qty += 1; else bag.push({ id, qty: 1 });
    saveBag(bag);
    renderBag();
    openBag();
  }
  function changeQty(id, delta) {
    let bag = getBag();
    const it = bag.find((i) => i.id === id);
    if (!it) return;
    it.qty += delta;
    if (it.qty <= 0) bag = bag.filter((i) => i.id !== id);
    saveBag(bag);
    renderBag();
  }
  function removeItem(id) { saveBag(getBag().filter((i) => i.id !== id)); renderBag(); }

  // Wire nav bag buttons (there may be one), overlay, close, esc
  document.querySelectorAll('.nav-bag').forEach((b) => b.addEventListener('click', openBag));
  bagOverlay.addEventListener('click', closeBag);
  bagDrawer.querySelector('.bag-close').addEventListener('click', closeBag);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeBag(); });

  // Delegate qty/remove inside the drawer
  bagItemsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]'); if (!btn) return;
    const row = e.target.closest('.bag-item'); if (!row) return;
    const id = row.dataset.id;
    const act = btn.dataset.act;
    if (act === 'inc') changeQty(id, 1);
    else if (act === 'dec') changeQty(id, -1);
    else if (act === 'rm') removeItem(id);
  });

  // Delegate "Add to Bag" buttons anywhere (PDP etc.)
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (!add) return;
    e.preventDefault();
    addToBag(add.dataset.add);
    add.classList.add('added');
    const orig = add.textContent;
    add.textContent = 'Added ✓';
    setTimeout(() => { add.classList.remove('added'); add.textContent = orig; }, 1400);
  });

  // Expose for inline use if needed
  window.KX = { addToBag, openBag };

  renderCount();
})();
