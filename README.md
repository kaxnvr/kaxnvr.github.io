# KAXNiOR — kaxnvr.github.io

Public site for **KAXNiOR**, a sensory fragrance house. Static site hosted on GitHub Pages.

**Live:** https://kaxnvr.github.io/fragrance/

## Structure
- `fragrance/` — the site (all pages, styles, scripts, images, and the stone-intro frame sequence)
- `fragrance/index.html` — homepage (the stone-intro scroll experience)
- `index.html` (repo root) — redirects `/` → `/fragrance/`
- `404.html` — site-wide custom not-found page
- `.nojekyll` — serve files as-is (no Jekyll processing)

## Local preview
The stone intro scrubs a video/frame sequence and needs HTTP Range support, so serve over HTTP (don't open with `file://`):

```bash
python3 -m http.server 8000
# then open http://localhost:8000/fragrance/
```

All internal paths are absolute under `/fragrance/`, so the site is served from the domain root.
