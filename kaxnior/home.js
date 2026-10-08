  /* ONE continuous page built on the six-panel avif strip.
     — The strip is the old showcase, verbatim: same sizes, same card, same
       arrow + drag behaviour, gated on the card's own visibility (`cardShown`)
       rather than `landed`, so it's usable the moment it appears.
     — The intro: the 145-frame stone rotation is drawn on a canvas riding
       INSIDE panel 2 (stoneless main-2.avif), scrubbed by scroll 0→60%; then a
       camera-rect dolly 60→100% pulls from a tight stone close-up out to
       IDENTITY — which IS the strip's normal presentation. One group, one shot.
     Camera math: interpolate {cx, cy, w} and derive the transform — never lerp
     scale/translate directly (the bottle would dip and rise on an arc). */
  (() => {
    const ASSET  = '/kaxnior/assets/stone-intro/';
    const FRAMES = 145;                 // 0 = back … 144 = front (the resting stone)

    const heroSection = document.getElementById('hero');
    const stage   = document.getElementById('hero-stage');
    const cam     = document.getElementById('hero-cam');
    const track   = document.getElementById('showcase-track');
    const panels  = [...track.querySelectorAll('.sc-panel')];
    const cv      = document.getElementById('hero-stone');
    const ctx     = cv.getContext('2d');
    const card    = document.getElementById('hero-card');
    const frost   = document.getElementById('hero-frost');
    const introEl = document.getElementById('hero-intro');
    const titleEl = document.getElementById('sc-title');
    const shopEl  = document.getElementById('sc-shop');
    const nextBtn = document.getElementById('sc-next');
    const scrollWrap = document.querySelector('.hero-scroll-wrap');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Panel/card sizing is CSS-ONLY now (2026-07-16). The old JS-owned inline
       `--panel-w` px write was itself the rotation bug: iOS fires resize events on
       an unreliable schedule around a rotate, so the inline value written from the
       OLD orientation's innerWidth/innerHeight overrode the stylesheet's fresh
       media-query value indefinitely — panels froze at the previous orientation's
       geometry ("squeezed" photos) until a manual refresh. Plain media queries +
       literal vw/vh + aspect-ratio re-resolve atomically with the viewport, no JS
       events involved — the same reason TAMBURINS-style sites survive rotation. */

    /* ================ the strip — the old showcase, verbatim ================
       Panels 0 & 5 are empty buffers so the first/last product can sit dead-
       centre. The arrow advances; dragging tracks the pointer 1:1 and the card
       follows whichever panel is CURRENTLY nearest the stage centre; releasing
       snaps to that product. */
    const items = [
      { panel: 1, label: 'Fragrance',      id: 'dusk-isle' },
      { panel: 2, label: 'Lip Balm',       id: 'lip-bare' },
      { panel: 3, label: 'Home Fragrance', id: 'candle-white-veil' },
      { panel: 4, label: 'Hand Cream',     id: 'hand-pale-meridian' },
    ];
    let cur = 0, currentTx = 0, landed = false, cardShown = false;

    // Read geometry only at layout boundaries, never after a drag transform.
    let stripGeo;
    function syncStripGeometry() {
      stripGeo = {
        width: stage.clientWidth,
        minTx: Math.min(0, stage.clientWidth - track.scrollWidth),
        cardHalf: card.offsetWidth / 2,
        centers: items.map(it => panels[it.panel].offsetLeft + panels[it.panel].offsetWidth / 2),
      };
    }
    syncStripGeometry();
    function clampTx(tx) {
      return Math.max(stripGeo.minTx, Math.min(0, tx));
    }
    function positionCard(tx) {
      let nearestIdx = 0, nearestDist = Infinity;
      stripGeo.centers.forEach((center, idx) => {
        const dist = Math.abs(center + tx - stripGeo.width / 2);
        if (dist < nearestDist) { nearestDist = dist; nearestIdx = idx; }
      });
      const center = stripGeo.centers[nearestIdx] + tx;
      const half = stripGeo.cardHalf;
      card.style.left = Math.max(half + 12, Math.min(stripGeo.width - half - 12, center)) + 'px';
      return nearestIdx;
    }
    function setTrack(tx, smooth) {
      tx = Math.round(clampTx(tx) * devicePixelRatio) / devicePixelRatio;
      currentTx = tx;
      track.style.transition = smooth ? '' : 'none';
      card.style.transition = smooth ? '' : 'opacity 0.5s ease';
      track.style.transform = 'translateX(' + tx + 'px)';
      return positionCard(tx);
    }
    function show(idx, smooth) {
      cur = (idx + items.length) % items.length;
      const it = items[cur];
      const tx = stripGeo.width / 2 - stripGeo.centers[cur];
      setTrack(tx, smooth);
      titleEl.textContent = it.label;
      shopEl.href = '/kaxnior/scent.html?cat=' + encodeURIComponent(it.label);
    }
    // open with panel 2 (Fragrance) centred — this is ALSO the rest layout the
    // intro camera zooms into, so it must be asserted before the first update.
    const open = () => { syncStripGeometry(); show(cur, false); };
    open();
    requestAnimationFrame(open);
    window.addEventListener('load', open);
    nextBtn.addEventListener('click', () => { if (cardShown) show(cur + 1, true); });

    /* ---- rotation / resize: PRESERVE the intro progress p ----
       p = scrollY / (heroH − innerH), and heroH is 400vh — so a rotate keeps the
       absolute scrollY but changes the mapping, dumping the user at a different
       point of the animation (mid-dolly wall = the "broken layout" on iPad).

       iPadOS traps this must survive:
       · Safari IGNORES programmatic window scrolls while the rotate animation runs
         (~0.5s) — so a remap must be VERIFIED, and the new dims only adopted as
         trusted once the scroll actually landed; otherwise the next scroll event
         would adopt the WRONG p as truth and every retry would restore the bug.
       · resize/orientationchange timing is unreliable (multiple, early, or late) —
         so a polling watchdog converges regardless of which events fire when.
       · toolbar show/hide breathes innerHeight by <150px while the user scrolls —
         that must NOT trigger a remap (it would fight the user's scroll). */
    let lastP = 0, lastW = innerWidth, lastH = innerHeight;   // trusted state (see update())
    function relayout(){
      // panel/card sizing is pure CSS (media queries re-resolve on their own);
      // this only re-centres the strip and remaps scroll to preserve progress p
      const max = Math.max(1, heroSection.offsetHeight - innerHeight);
      if (lastP < 1){
        const target = Math.round(lastP * max);
        window.scrollTo(0, target);
        // adopt the new dims ONLY once the remap verifiably landed; if Safari ate
        // the scroll (mid-rotation), dims stay untrusted and the watchdog retries
        if (Math.abs((window.scrollY || document.scrollingElement.scrollTop) - target) < 3){
          lastW = innerWidth; lastH = innerHeight;
        }
      } else { lastW = innerWidth; lastH = innerHeight; }  // past the hero: leave scroll alone
      geoSync();
      show(cur, false);
      update();
    }
    // ONE gate for events AND the watchdog — so the iOS toolbar resize EVENT gets
    // the same "don't fight the user's scroll" threshold as the polling path:
    // width change or big height change (rotation/split-screen) → full relayout,
    // retried until the remap sticks; small height-only drift (toolbar) → adopt
    // silently with NO scroll remap.
    function checkViewport(){
      if (innerWidth !== lastW || Math.abs(innerHeight - lastH) > 150) relayout();
      else if (innerHeight !== lastH) { lastH = innerHeight; geoSync(); show(cur, false); update(); }
    }
    // Observe actual CSS box changes, with a bounded Safari rotation retry.
    // The old forever-running 120ms interval woke an otherwise idle page.
    let viewportTimer = null, viewportRetries = 0;
    function queueViewportCheck() {
      viewportRetries = 12;
      if (viewportTimer !== null) return;
      const tick = () => {
        viewportTimer = null;
        checkViewport();
        if (--viewportRetries > 0 && !document.hidden) viewportTimer = setTimeout(tick, 120);
      };
      viewportTimer = setTimeout(tick, 0);
    }
    window.addEventListener('resize', queueViewportCheck);
    window.addEventListener('orientationchange', queueViewportCheck);
    if (screen.orientation && screen.orientation.addEventListener)
      screen.orientation.addEventListener('change', queueViewportCheck);
    if (window.visualViewport) visualViewport.addEventListener('resize', queueViewportCheck);
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(queueViewportCheck).observe(stage);

    /* ---- drag / swipe (old behaviour, blocked until card is shown) ---- */
    let dragging = false, dragStartX = 0, dragStartTx = 0, dragX = 0, dragRAF = 0, dragPointer = null;
    track.style.touchAction = 'pan-y';
    function onDown(e) {
      if (!cardShown || !e.isPrimary || e.button !== 0) return;
      // A single style read at pointer-down lets an interrupted arrow animation
      // continue from the displayed position instead of jumping to its target.
      const transform = getComputedStyle(track).transform;
      if (transform !== 'none') currentTx = new DOMMatrixReadOnly(transform).m41;
      dragging = true;
      dragPointer = e.pointerId;
      dragStartX = dragX = e.clientX;
      dragStartTx = currentTx;
      track.classList.add('is-dragging');
      setTrack(currentTx, false);
      track.setPointerCapture(e.pointerId);
    }
    function renderDrag() {
      dragRAF = 0;
      if (!dragging) return;
      const nearestIdx = setTrack(dragStartTx + dragX - dragStartX, false);
      if (items[nearestIdx].label !== titleEl.textContent) {
        titleEl.textContent = items[nearestIdx].label;
        shopEl.href = '/kaxnior/scent.html?cat=' + encodeURIComponent(items[nearestIdx].label);
      }
    }
    function onMove(e) {
      if (!dragging || e.pointerId !== dragPointer) return;
      dragX = e.clientX;
      if (!dragRAF) dragRAF = requestAnimationFrame(renderDrag);
    }
    function onUp(e) {
      if (!dragging || (e && e.pointerId !== dragPointer)) return;
      if (dragRAF) cancelAnimationFrame(dragRAF);
      renderDrag();
      dragging = false;
      track.classList.remove('is-dragging');
      if (track.hasPointerCapture(dragPointer)) track.releasePointerCapture(dragPointer);
      dragPointer = null;
      show(positionCard(currentTx), true);
    }
    track.addEventListener('pointerdown', onDown);
    track.addEventListener('pointermove', onMove);
    track.addEventListener('pointerup', onUp);
    track.addEventListener('pointercancel', onUp);
    track.addEventListener('lostpointercapture', onUp);

    /* ================ the stone intro ================
       Phase map leaves a landed DWELL at the end so the strip holds before the
       page scrolls on: rotate 0→0.42, dolly 0.42→0.72, then p 0.72→1.0 is landed
       (camera identity, interactions live). The card fades in at CARD_ON, during
       the dolly's settle (eased camera is ~79% home by then); the arrow/drag
       become usable the moment the card is shown, not at landed (0.72). */
    const SCRUB_END   = 0.42;   // frames 0→144 map linearly onto p 0→0.42
    const DOLLY_START = 0.42;
    const DOLLY_END   = 0.72;   // dolly reaches identity here; ≥ this = landed dwell
    const CARD_ON     = 0.62;   // card fades in here (before landing, 0.5s CSS fade)
    const dollyEase = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; // easeInOutCubic
    const lerp = (a,b,t) => a+(b-a)*t;

    /* ---------- bounded asynchronous frame pipeline ----------
       No scratch-canvas decoding and no document scroll lock. Keep 19 original
       keyframes plus the immediate scrub neighbourhood (32 decoded frames max).
       The status is actual keyframe readiness, not an artificial timed splash. */
    let ready = reduced, loaderDismissed = false;
    const loader = document.getElementById('hero-loading');
    const loaderLabel = document.getElementById('hero-loading-label');
    const loaderProgress = document.getElementById('hero-loading-progress');
    let loaderTimer;
    const sequence = new KXStoneFrames({
      count: FRAMES, reduced,
      url: i => ASSET + 'stone_webp_v2/stone_' + String(i).padStart(4, '0') + '.webp',
      onChange() {
        const status = sequence.status();
        ready = status.ready > 0 || status.complete;
        loaderProgress.max = status.total;
        loaderProgress.value = status.ready;
        loaderLabel.textContent = status.failed ? 'Motion is taking longer' : 'Preparing the stone';
        if (status.complete) { clearTimeout(loaderTimer); loader.hidden = true; }
        onScroll();
      },
    });
    loaderTimer = setTimeout(() => {
      if (!sequence.status().complete && !loaderDismissed) loader.hidden = false;
    }, 350);
    document.getElementById('hero-loading-skip').addEventListener('click', () => {
      loaderDismissed = true;
      loader.hidden = true;
      window.scrollTo({ top: (HERO_H - innerHeight) * DOLLY_END, behavior: reduced ? 'auto' : 'smooth' });
    });

    /* ---------- camera rects (rest-layout stage px) ----------
       All panels are native 2400 now; #hero-shelf is BOTTOM-aligned. Geometry as
       fractions of the displayed 1792×2389 window. LABEL_Y = KAXNiOR logo top
       (image y958 in the 2400 crop → window 0.399); the act-1 crop bottom parks
       just above it. STONE_W sizes the close-up.
       Cached, not read fresh per scroll tick: stage/panel/shelf dims only change
       on resize, but update() runs on every 'scroll' event and also WRITES several
       styles each call — so a live clientWidth/offsetWidth/offsetTop read here was
       forcing a synchronous reflow on every single scroll tick (classic layout
       thrash). geoSync() refreshes the cache once at init and again from
       relayout(); the scroll hot path now touches zero layout-forcing reads. */
    const heroShelf = document.getElementById('hero-shelf');
    const STONE_W = 0.329;
    const LABEL_Y = 0.390;   // act-1 crop bottom. Logo text top measured y957 (frac .3987);
                             // parking the bottom exactly there (.399) still rendered a sliver
                             // of the logo (rounding), so back off ~20 image px — logo just hidden.

    let VW = 0, VH = 0, HERO_H = 0, camStart = null, camEnd = null;
    function geoSync(){
      // Act-1: a moderate, clean close-up — the stone is FILL of the viewport
      // width (small enough to stay crisp), the crop bottom just above the KAXNiOR
      // logo so the neck reads. Centred on the viewport x (== endRect x) → ZERO
      // horizontal drift through the dolly. The shelf is vertically centred in the
      // stage now, so panel-local y needs the shelf's top offset; spill above the
      // photo reads as wall (cam-bg + feathered panel top).
      syncStripGeometry();
      VW = stage.clientWidth; VH = stage.clientHeight;
      HERO_H = heroSection.offsetHeight;
      const pw = panels[1].offsetWidth, ph = panels[1].offsetHeight;
      const shelfTop = heroShelf.offsetTop;
      const sw = STONE_W * pw;
      const bottomY = shelfTop + LABEL_Y * ph;              // crop bottom = above logo
      const FILL = VW > VH ? 0.26 : 0.46;                   // stone = this frac of viewport width
      const w0 = sw / FILL, h0 = w0 * VH / VW;
      camStart = { cx: VW / 2, cy: bottomY - h0 / 2, w: w0 };
      // the dolly's destination IS the strip's normal presentation: identity
      camEnd = { cx: VW / 2, cy: VH / 2, w: VW };
    }
    geoSync();

    function applyRect(R){
      const S = VW / R.w;
      const h = R.w * VH / VW;
      const tx = -(R.cx - R.w/2) * S;
      const ty = -(R.cy - h/2) * S;
      cam.style.transform = `translate(${tx}px,${ty}px) scale(${S})`;
    }

    /* ---------- scrub + hand-off ---------- */
    let drawn = -1, frostGone = false, introGone = false, cueState = null;

    function update(){
      const max = Math.max(1, HERO_H - innerHeight);
      const p = reduced ? 1 : Math.min(1, Math.max(0, scrollY / max));

      /* only trust p as "where the user is" while the viewport is stable — the
         readings that race in during a rotate (old scrollY / new max) must not
         overwrite the progress that relayout() is about to restore */
      if (innerWidth === lastW && innerHeight === lastH) lastP = p;

      /* frosted glass rides the rotation: fully covering at p=0, fully lifted
         (its own 145vh incl. the 45vh feather) exactly at SCRUB_END. Hidden once
         gone so the backdrop blur stops costing GPU; scrolling back re-shows it. */
      /* frost lifts with the rotation, gone exactly at SCRUB_END. Once gone, skip
         the writes entirely — during the LATER dolly phase p never revisits this
         range, so without the guard this was 2 no-op style writes every single
         coalesced scroll frame for the whole 0.42→0.72 dolly. */
      if (frost){
        const lift = reduced ? 1 : Math.min(1, p / SCRUB_END);
        const goneNow = lift >= 1;
        if (!goneNow || !frostGone){
          frost.style.transform = 'translate3d(0,' + (-lift * 104) + 'vh,0)';
          frost.style.visibility = goneNow ? 'hidden' : 'visible';
        }
        frostGone = goneNow;
      }

      /* title card: a quick, raw scroll-scrub dismiss over the FIRST 10% of the
         scroll, gone long before the reveal is meaningfully under way. Same
         no-op-write guard as frost above once fully dismissed. */
      if (introEl){
        const gone = reduced ? 1 : Math.min(1, p / 0.10);
        const goneNow = gone >= 1;
        if (!goneNow || !introGone){
          introEl.style.opacity = String(1 - gone);
          introEl.style.transform = 'translateY(' + (-gone * 22) + 'px)';
          introEl.style.visibility = goneNow ? 'hidden' : 'visible';
          introEl.style.pointerEvents = gone > 0.02 ? 'none' : 'auto';
        }
        introGone = goneNow;
      }

      /* scroll cue: visible through the whole title phase; only two states, so
         only write on an actual transition instead of every frame. */
      if (scrollWrap){
        const cueOn = p < 0.22 && ready;
        if (cueOn !== cueState){
          scrollWrap.style.opacity = cueOn ? 1 : 0;
          scrollWrap.style.pointerEvents = cueOn ? 'auto' : 'none';
          cueState = cueOn;
        }
      }

      const want = Math.round(Math.min(1, p / SCRUB_END) * (FRAMES - 1));
      sequence.setTarget(want);
      const frame = sequence.nearest(want);
      if (frame && frame.index !== drawn) {
        ctx.clearRect(0, 0, cv.width, cv.height);
        ctx.drawImage(frame.image, 0, 0);
        drawn = frame.index;
      }

      const isEnd = reduced || p >= DOLLY_END;

      if (!isEnd){
        /* the intro owns the camera; re-entering it snaps the strip back to
           panel 2 so the zoom always targets the bottle */
        if (cur !== 0) show(0, false);
        const a = camStart, b = camEnd;
        const d = dollyEase(Math.min(1, Math.max(0, (p - DOLLY_START) / (DOLLY_END - DOLLY_START))));
        applyRect({cx: lerp(a.cx, b.cx, d), cy: lerp(a.cy, b.cy, d), w: lerp(a.w, b.w, d)});
      } else {
        cam.style.transform = 'none';   // identity — the strip as it always was
      }

      /* p=1 hand-off: nothing to swap — the resting stone IS frame 144 on the
         canvas, riding inside panel 2. Fully reversible. */
      if (isEnd !== landed) landed = isEnd;

      /* card reveal is decoupled from landing: it fades in at CARD_ON, while the
         camera is still settling — reversible on scroll-back */
      const cardOn = reduced || p >= CARD_ON;
      if (card && cardOn !== cardShown){
        cardShown = cardOn;
        card.classList.toggle('on', cardOn);
      }

    }

    /* ---- scroll cue click: play the intro (smooth-scroll to the landed frame) ---- */
    if (scrollWrap) scrollWrap.addEventListener('click', () => {
      window.scrollTo({ top: heroSection.offsetHeight - innerHeight, behavior: 'smooth' });
    });

    // rAF-coalesce: Safari/trackpad momentum can fire many 'scroll' events between
    // two paints — running the canvas draw + style writes on EVERY one is wasted
    // work the display can't even show. Collapse bursts to one update() per frame.
    let scrollQueued = false;
    function onScroll(){
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(() => { scrollQueued = false; update(); });
    }
    addEventListener('scroll', onScroll, {passive:true});
    addEventListener('load', update);
    let heroVisible = true;
    const syncActivity = () => sequence.setActive(heroVisible && !document.hidden);
    document.addEventListener('visibilitychange', syncActivity);
    if (typeof IntersectionObserver !== 'undefined') new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      syncActivity();
    }).observe(heroSection);
    addEventListener('pagehide', event => {
      if (!event.persisted) sequence.destroy();
    });
    addEventListener('pageshow', event => {
      if (event.persisted) { geoSync(); show(cur, false); syncActivity(); update(); }
    });
    sequence.start();
    update();
  })();
