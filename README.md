# KAXNiOR — kaxnvr.github.io

Public site for **KAXNiOR**, a sensory fragrance house. Static site hosted on GitHub Pages.

**Live:** https://kaxnvr.github.io/kaxnior/

## Structure
- `kaxnior/` — the site (all pages, styles, scripts, images, and the stone-intro frame sequence)
- `kaxnior/index.html` — homepage (the stone-intro scroll experience)
- `index.html` (repo root) — redirects `/` → `/kaxnior/`
- `404.html` — site-wide custom not-found page
- `.nojekyll` — serve files as-is (no Jekyll processing)

## Local preview
The stone intro scrubs a WebP frame sequence. Serve the repository root over HTTP (don't open with `file://`):

```bash
python3 -m http.server 8000
# then open http://localhost:8000/kaxnior/
```

All internal paths are absolute under `/kaxnior/`, so the site is served from the domain root.

Old `/kaxnior-fragrance/` page links redirect to `/kaxnior/`, preserving query parameters and URL fragments.
