# EYARA Aviation — immersive landing page

A desktop-first, scroll-directed landing page for EYARA Aviation (Dubai): private charter, cargo charter, ACMI leasing, aircraft management and aviation concierge.

Typography is a single family, Inter Tight (variable), with no italics: large display sizes use tight tracking and colour for emphasis.

Built with Vite + React, GSAP ScrollTrigger (every scroll animation is scrubbed, so it plays identically forwards and backwards), Lenis for gentle wheel smoothing, and Three.js for one thing only: the real-time cloud volume in the hero.

## Run it

Requires Node 18 or newer.

```bash
npm install
```

```bash
npm run dev
```

Open http://127.0.0.1:5173. For a production build:

```bash
npm run build
```

```bash
npm run preview
```

The `dist/` folder is a static site and can be hosted anywhere (Vercel, Netlify, S3, any web server).

### Preview switches

- `?reduced` shows the reduced-motion version (the same as a visitor with "reduce motion" turned on in their OS).
- `?nowebgl` shows the fallback used when WebGL is unavailable.

## What is on the page

| # | Section | File |
| --- | --- | --- |
| 01 | Cinematic hero: cabin window → through the glass → open sky → cloud bank → steel-blue high-altitude jet approach → night | `src/components/Hero.jsx` |
| 02 | Approach: hangar backdrop, short headline, three principles | `src/components/Approach.jsx` |
| 03 | Aviation Solutions (pinned, five services) | `src/components/Solutions.jsx` |
| 04 | Global Perspective (Dubai, coordinates, live Dubai time) | `src/components/Perspective.jsx` |
| 05 | Enquire (service chips + form) | `src/components/Enquire.jsx` |

The hero timeline is documented at the top of `Hero.jsx` (0–100 units of scroll). Styles are in `src/styles.css`; colours and fonts are CSS variables at the top.

## Replacing placeholder content

**Photography.** Every image in `public/assets/` is a free Unsplash placeholder (sources in `ASSETS.md`). To swap one, keep the file name and roughly the same aspect ratio, or change the path in the component.

| To replace | File | Notes |
| --- | --- | --- |
| Cabin window | `cabin.webp` | Needs a transparent window opening. The dolly zooms into the glass centre, set by `transform-origin` on `.cabin` and the `.window-bloom` box in `styles.css`. Easiest is to rerun `scripts/prepare_assets.py` with a new photo and adjust the glass shape numbers in `cabin()`. |
| Hero sky | `sky-day.webp` | Any wide above-the-clouds photo. |
| Hero jet | `jet.webp` + `dusk-plate.webp` | A transparent cut-out aircraft and a clean background plate. The jet's position on the plate is set in `.jet` (left/top/width %) in `styles.css`. |
| Approach backdrop | `approach.webp` | Any dark hangar or cabin photo; the left third should be dark so the headline reads. Focus via `object-position` on `.ap-frame img`. |
| Services | `svc-*.webp` | Landscape, about 3:2, 1800px wide. Crop focus via `pos` in `SERVICES` (`Solutions.jsx`). |
| Global | `global.webp` | Landscape, dark upper half keeps the type readable. |

To rebuild the processed layers from new originals: `pip install pillow numpy scipy`, put the source JPGs in a folder with the names listed at the top of `scripts/prepare_assets.py`, then run `python scripts/prepare_assets.py <folder>`.

**Wordmark.** "EYARA" in the nav and footer is a typographic placeholder (`.wordmark`, `.footer-mark`). Replace with the official logo SVG when available.

**Copy.** All text is in the components. It describes services only; there are no fleet claims, statistics, destinations or partner names. Please keep it that way unless EYARA verifies a fact.

**Enquiry form.** The form validates and shows a confirmation, but it does not send anywhere until you set an endpoint. Copy `.env.example` to `.env` and set `VITE_ENQUIRY_ENDPOINT` to a URL that accepts a JSON POST (for example a Formspree, Basin or your own API route). Fields: `name`, `company`, `email`, `phone`, `message`, `services[]`.

## Accessibility and fallbacks

- Reduced motion: no smooth scrolling, no scroll-linked movement; the hero becomes three still frames and services become a simple list.
- No WebGL: the hero uses CSS cloud layers instead of the Three.js cloud field.
- Keyboard: skip link, visible focus states, real buttons for service navigation and chips.

## Performance notes

- The first frame needs only `cabin.webp` (260 KB) and `sky-day.webp` (150 KB), both preloaded.
- Three.js is loaded on demand after the first frame (about 130 KB gzipped). The clouds drift continuously only while the hero is on screen and the tab is visible; the loop stops everywhere else. Pixel ratio is capped at 1.5. Drift speed is `userData.speed` in `src/lib/CloudField.js`.
- No continuous render loops or particle systems; all other motion is CSS transforms, opacity and clip-path driven by GSAP.

Scope of this round: desktop at 1920×1080, 1440×900 and 1366×768. Mobile layouts are not built yet.
