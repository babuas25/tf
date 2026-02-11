# Font preload warning

## What the warning means

You may see in the browser console:

```text
The resource https://.../_next/static/media/<id>.woff2 was preloaded using link preload
but not used within a few seconds from the window's load event. Please make sure it has
an appropriate `as` value and it is preloaded intentionally.
```

- **Preload**: The app (via Next.js / `geist`) adds `<link rel="preload" as="font" href="...">` so the browser fetches the font with high priority.
- **“Not used within a few seconds”**: The browser didn’t use that font for any text painted in the first few seconds after load.

So the warning means: we asked for an early download of the font, but the browser didn’t actually use it in that initial window. That can waste a bit of bandwidth and trigger this console message.

## Which fonts trigger it

In this project:

1. **`Geist_Variable-*.woff2`** – Geist Sans from `geist/font/sans`, used as the main UI font (e.g. on `<body>`).
2. **`e2334d715941921e-*.woff2`** – Poppins from `next/font/google`, used only via the `--font-poppins` CSS variable in specific components (e.g. buttons, headings), not for the first screen of body text.

So:

- **Geist** is used everywhere, but timing can be such that the first paint uses a fallback and the font is “used” only after layout/CSS is fully applied → warning possible.
- **Poppins** is not used for initial body text, so preloading it is unnecessary and more likely to trigger the warning.

## What we did

- **Poppins**: In `src/app/layout.tsx`, Poppins is configured with `preload: false` so Next.js does not add a preload link. The font still loads when a component first uses `--font-poppins`; we only avoid preloading it.
- **Geist**: The `geist` package does not expose a `preload` option. If the warning still appears for Geist, it is a known quirk: the font is used site‑wide; the browser’s “used within a few seconds” check can still fire due to load order or hydration. It does not indicate a functional bug.

## If you want to reduce or remove the warning

- **Poppins**: Already handled with `preload: false`.
- **Geist**: Options are limited without changing how the font is loaded (e.g. switching to a different loader or accepting the warning). Keeping the font on `<body>` (or `<html>`) and ensuring critical text is in the initial HTML helps the browser “use” it sooner; beyond that, the warning is often benign and can be ignored in development and production.
