/* KAXNiOR's original 145-frame sequence, without 145 resident decoded images.
   Coarse keyframes stay available for fast scroll/reversal. Only the current
   neighbourhood is decoded at full cadence; compressed blobs are cheap to keep.
   The network and decoder queues are separately bounded and pause off-screen. */
(function (root) {
  'use strict';
  class StoneFrames {
    constructor({ count = 145, url, reduced = false, onChange = () => {},
      fetchFrame = (src, options) => fetch(src, options), decodeFrame = null }) {
      this.count = count;
      this.url = url;
      this.onChange = onChange;
      this.fetchFrame = fetchFrame;
      this.decodeFrame = decodeFrame || StoneFrames.decode;
      this.reduced = reduced;
      this.keyframes = new Set(reduced ? [count - 1] : Array.from({ length: Math.ceil(count / 8) }, (_, i) => i * 8));
      this.keyframes.add(count - 1);
      this.blobs = new Map();
      this.cache = new Map();
      this.failed = new Set();
      this.fetching = new Set();
      this.decoding = new Set();
      this.controllers = new Set();
      this.target = reduced ? count - 1 : 0;
      this.active = true;
      this.engaged = false;
      this.destroyed = false;
      this.maxDecoded = 32;
      this.peakDecoded = 0;
      this.pumpTimer = null;
    }
    static async decode(blob) {
      if (typeof createImageBitmap === 'function') {
        try { return await createImageBitmap(blob); } catch (_) { /* older WebKit fallback */ }
      }
      const image = new Image();
      image.decoding = 'async';
      const src = URL.createObjectURL(blob);
      try {
        const loaded = new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
        image.src = src;
        await loaded;
        if (image.decode) await image.decode();
        return image;
      } finally { URL.revokeObjectURL(src); }
    }
    status() {
      const ready = [...this.keyframes].filter(i => this.cache.has(i)).length;
      const failed = [...this.keyframes].filter(i => this.failed.has(i)).length;
      return { ready, failed, total: this.keyframes.size, complete: ready + failed === this.keyframes.size,
        decoded: this.cache.size, peakDecoded: this.peakDecoded, fetched: this.blobs.size };
    }
    setTarget(index) {
      const next = Math.max(0, Math.min(this.count - 1, Math.round(index)));
      if (next === this.target) return;
      this.engaged = true;
      this.target = next;
      this.schedule();
    }
    setActive(active) {
      this.active = active;
      if (active) this.schedule();
    }
    start() { this.schedule(); }
    schedule() {
      if (this.destroyed || !this.active || this.pumpTimer !== null) return;
      // Yield between completions, even when all files are already in HTTP cache.
      this.pumpTimer = setTimeout(() => { this.pumpTimer = null; this.pump(); }, 0);
    }
    priorities() {
      const near = this.reduced ? [this.count - 1] : Array.from({ length: 15 }, (_, i) => this.target + i - 7)
        .filter(i => i >= 0 && i < this.count).sort((a, b) => Math.abs(a - this.target) - Math.abs(b - this.target));
      const keys = [...this.keyframes].sort((a, b) => {
        // Both endpoints first, then provide even coverage over the whole spin.
        const rank = i => (i === 0 || i === this.count - 1) ? -1000 : Math.abs(i - this.target);
        return rank(a) - rank(b);
      });
      return [...new Set([this.target, ...keys, ...near])].slice(0, this.maxDecoded);
    }
    pump() {
      if (this.destroyed || !this.active) return;
      const important = this.priorities();
      // Download the full compressed sequence only after interaction starts.
      const fetchOrder = this.engaged && !this.reduced
        ? [...new Set([...important, ...Array.from({ length: this.count }, (_, i) => i)])] : important.filter(i => this.keyframes.has(i));
      for (const i of fetchOrder) {
        if (this.fetching.size >= 4) break;
        if (!this.blobs.has(i) && !this.fetching.has(i) && !this.failed.has(i)) this.load(i);
      }
      for (const i of important) {
        if (this.decoding.size >= 2) break;
        if (this.blobs.has(i) && !this.cache.has(i) && !this.decoding.has(i) && !this.failed.has(i)) this.decode(i);
      }
    }
    async load(i) {
      this.fetching.add(i);
      const controller = new AbortController();
      this.controllers.add(controller);
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await this.fetchFrame(this.url(i), { signal: controller.signal });
        if (!response.ok) throw new Error('Frame unavailable');
        const blob = await response.blob();
        if (!this.destroyed) this.blobs.set(i, blob);
      } catch (_) { if (!this.destroyed) this.failed.add(i); }
      finally {
        clearTimeout(timeout);
        this.fetching.delete(i);
        this.controllers.delete(controller);
        if (!this.destroyed) { this.onChange(); this.schedule(); }
      }
    }
    async decode(i) {
      this.decoding.add(i);
      try {
        const bitmap = await this.decodeFrame(this.blobs.get(i));
        if (this.destroyed) { if (bitmap.close) bitmap.close(); return; }
        // Make room before inserting: never retain more than 32 decoded frames.
        if (this.cache.size >= this.maxDecoded) {
          const candidates = [...this.cache.keys()].filter(j => !this.keyframes.has(j) && j !== this.target)
            .sort((a, b) => Math.abs(b - this.target) - Math.abs(a - this.target));
          this.release(candidates[0]);
        }
        this.cache.set(i, bitmap);
        this.peakDecoded = Math.max(this.peakDecoded, this.cache.size);
      } catch (_) { if (!this.destroyed) this.failed.add(i); }
      finally {
        this.decoding.delete(i);
        if (!this.destroyed) { this.onChange(); this.schedule(); }
      }
    }
    nearest(index) {
      if (this.cache.has(index)) return { index, image: this.cache.get(index) };
      let nearest = -1, distance = Infinity;
      for (const i of this.cache.keys()) {
        if (Math.abs(i - index) < distance) { nearest = i; distance = Math.abs(i - index); }
      }
      return nearest < 0 ? null : { index: nearest, image: this.cache.get(nearest) };
    }
    release(i) {
      const image = this.cache.get(i);
      if (image && image.close) image.close();
      this.cache.delete(i);
    }
    destroy() {
      this.destroyed = true;
      clearTimeout(this.pumpTimer);
      for (const controller of this.controllers) controller.abort();
      for (const i of this.cache.keys()) this.release(i);
      this.blobs.clear();
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = StoneFrames;
  else root.KXStoneFrames = StoneFrames;
})(typeof window !== 'undefined' ? window : globalThis);
