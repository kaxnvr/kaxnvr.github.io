/* KAXNiOR's original 145-frame sequence, without 145 resident decoded images.
   Coarse keyframes stay available for fast scroll/reversal. Only the current
   neighbourhood is decoded at full cadence; compressed blobs are cheap to keep.
   The network and decoder queues are separately bounded and pause off-screen. */
(function (root) {
  'use strict';
  class StoneFrames {
    constructor({ count = 145, url, reduced = false, onChange = () => {},
      fetchFrame = (src, options) => fetch(src, options), decodeFrame = null,
      fetchTimeout = 12000, decodeTimeout = 12000 }) {
      this.count = count;
      this.url = url;
      this.onChange = onChange;
      this.fetchFrame = fetchFrame;
      this.decodeFrame = decodeFrame || StoneFrames.decode;
      this.fetchTimeout = fetchTimeout;
      this.decodeTimeout = decodeTimeout;
      this.reduced = reduced;
      this.keyframes = new Set(reduced ? [count - 1] : Array.from({ length: Math.ceil(count / 8) }, (_, i) => i * 8));
      this.keyframes.add(count - 1);
      this.blobs = new Map();
      this.cache = new Map();
      this.failed = new Set();
      this.retrying = new Set();
      this.fetching = new Set();
      this.decoding = new Set();
      this.controllers = new Set();
      this.target = reduced ? count - 1 : 0;
      this.direction = 1;
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
    // Prepare away from the visible canvas. A failed decode/draw leaves the last
    // valid picture untouched, including transparent pixels around the stone.
    static present(context, buffer, image) {
      const back = buffer.getContext('2d');
      try {
        back.clearRect(0, 0, buffer.width, buffer.height);
        back.drawImage(image, 0, 0);
      } catch (_) { return false; }
      context.save();
      try {
        context.globalCompositeOperation = 'copy';
        context.drawImage(buffer, 0, 0);
        return true;
      } catch (_) { return false; }
      finally { context.restore(); }
    }
    status() {
      const ready = [...this.keyframes].filter(i => this.cache.has(i)).length;
      const failed = [...this.keyframes].filter(i => this.failed.has(i)).length;
      return { ready, failed, total: this.keyframes.size, complete: ready === this.keyframes.size,
        settled: ready + failed === this.keyframes.size, fetching: this.fetching.size, decoding: this.decoding.size,
        decoded: this.cache.size, peakDecoded: this.peakDecoded, fetched: this.blobs.size,
        bufferTotal: this.reduced ? 1 : this.count, bufferFailed: this.failed.size,
        bufferReady: this.blobs.size === (this.reduced ? 1 : this.count) && this.failed.size === 0 };
    }
    get(index) { return this.cache.has(index) ? { index, image: this.cache.get(index) } : null; }
    reject(index) { this.release(index); this.failed.add(index); this.onChange(); this.schedule(); }
    retry() {
      if (this.destroyed) return;
      // Manual retry only. Refetch failed blobs too: a corrupt response must not
      // be decoded repeatedly, and successful frames remain available meanwhile.
      for (const i of this.failed) { this.blobs.delete(i); this.retrying.add(i); }
      this.failed.clear();
      this.onChange();
      this.schedule();
    }
    setTarget(index) {
      const next = Math.max(0, Math.min(this.count - 1, Math.round(index)));
      if (next === this.target) return;
      this.direction = next > this.target ? 1 : -1;
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
      // Reserve the same 19 keyframes, then spend only the remaining slots on
      // the direction of travel. Prepare the opening neighbours before scrolling
      // starts, instead of making the first gesture wait for fresh requests.
      const offsets = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, -1, -2, -3];
      const near = this.reduced ? [this.count - 1] : offsets.map(offset => this.target + offset * this.direction)
        .filter(i => i >= 0 && i < this.count);
      const keys = [...this.keyframes].sort((a, b) => {
        // Both endpoints first, then provide even coverage over the whole spin.
        const rank = i => (i === 0 || i === this.count - 1) ? -1000 : Math.abs(i - this.target);
        return rank(a) - rank(b);
      });
      const local = near.filter(i => !this.keyframes.has(i)).slice(0, this.maxDecoded - keys.length);
      // Nearby decodes/fetches precede distant keys; keys remain in the desired
      // set so the protected cache and decode queue agree on the 32-slot budget.
      return [...new Set([this.target, ...local, ...keys])];
    }
    pump() {
      if (this.destroyed || !this.active) return;
      const important = this.priorities();
      // Buffer the small compressed sequence before rotation is allowed. Decoded
      // images remain bounded to 32; reduced motion still needs only its last frame.
      const fetchOrder = !this.reduced
        ? [...new Set([...important, ...Array.from({ length: this.count }, (_, i) => i)])] : important;
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
      let timeout;
      try {
        const request = (async () => {
          const response = await this.fetchFrame(this.url(i), {
            signal: controller.signal, cache: this.retrying.has(i) ? 'reload' : 'default',
          });
          if (!response.ok) throw new Error('Frame unavailable');
          return response.blob();
        })();
        const blob = await Promise.race([request, new Promise((_, reject) => {
          timeout = setTimeout(() => { controller.abort(); reject(new Error('Frame request timed out')); }, this.fetchTimeout);
        })]);
        if (!this.destroyed) this.blobs.set(i, blob);
      } catch (_) { if (!this.destroyed) this.failed.add(i); }
      finally {
        clearTimeout(timeout);
        this.fetching.delete(i);
        this.retrying.delete(i);
        this.controllers.delete(controller);
        if (!this.destroyed) { this.onChange(); this.schedule(); }
      }
    }
    async decode(i) {
      this.decoding.add(i);
      let timeout, expired = false;
      try {
        const decoding = Promise.resolve().then(() => this.decodeFrame(this.blobs.get(i)));
        // createImageBitmap cannot be cancelled. Close a late result after a
        // timeout instead of admitting it into a retried generation's cache.
        decoding.then(bitmap => { if (expired && bitmap && bitmap.close) bitmap.close(); }, () => {});
        const bitmap = await Promise.race([decoding, new Promise((_, reject) => {
          timeout = setTimeout(() => { expired = true; reject(new Error('Frame decode timed out')); }, this.decodeTimeout);
        })]);
        if (this.destroyed) { if (bitmap.close) bitmap.close(); return; }
        const wanted = new Set(this.priorities());
        // A direction change can obsolete work already inside createImageBitmap.
        // Do not let that late result evict the newly prepared forward window.
        if (!wanted.has(i)) { if (bitmap.close) bitmap.close(); return; }
        // Make room before inserting: never retain more than 32 decoded frames.
        if (this.cache.size >= this.maxDecoded) {
          const candidates = [...this.cache.keys()].filter(j => !this.keyframes.has(j) && j !== this.target)
            .sort((a, b) => Number(wanted.has(a)) - Number(wanted.has(b))
              || Math.abs(b - this.target) - Math.abs(a - this.target));
          this.release(candidates[0]);
        }
        this.cache.set(i, bitmap);
        this.peakDecoded = Math.max(this.peakDecoded, this.cache.size);
      } catch (_) { if (!this.destroyed) this.failed.add(i); }
      finally {
        clearTimeout(timeout);
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
