# Six Senses Ibiza — The Beauty of Being

An independent luxury hospitality portfolio concept by Filip Nedelkoski. **Not affiliated with, commissioned by, or endorsed by Six Senses.**

## Experience

A bright architectural and editorial redesign built around **“The Beauty of Being.”** A full-screen Mediterranean villa photograph moves into a framed composition through a reversible GSAP ScrollTrigger sequence, revealing oversized typography and a second photograph. Ivory sections, expressive serif typography, natural materials and generous spacing carry the story through the sanctuary, accommodation, wellness, dining, island experiences and sustainability.

The five-category suite explorer combines an accommodation directory, animated photography, expandable verified details, a next-room preview and a full-screen viewer. A separate expanding terrace composition introduces indoor–outdoor living. Three selectable experiences and a six-image horizontal photo journal complete the galleries. Keyboard navigation, touch swipes and reduced-motion preferences are supported; the shared photo viewer includes Escape and focus restoration.

The desktop Hero uses Photo 1 and the mobile Hero uses Photo 2, supplied by the portfolio owner. These are delivered as responsive WebP without enlarging the originals. Other photography is locally served under the [Pexels License](https://www.pexels.com/license/). Accommodation, spa, dining and other resort photographs are illustrative; Ibiza destination images are not automatically identified as Cala Xarraca. Credits and actual source locations appear at `/six-senses-ibiza/credits/` and in `public/asset-manifest.json`. The typographic presentation and sun artwork are original concept assets.

Resort facts were checked against the official Six Senses website on **22 October 2026**. Suite areas explicitly include terraces. Private Residences is a collection with varying occupancy and dimensions. No prices, testimonials, awards or live availability are fabricated.

## Stack

Astro, TypeScript, Tailwind CSS 4, React, GSAP and ScrollTrigger. Cormorant Garamond and DM Sans are self-hosted via Fontsource under the SIL Open Font License; license files are included in `public/fonts/`.

## Local development

Requires Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open `http://localhost:4321/six-senses-ibiza/`.

```sh
npm run check
npm run build
npm run verify
npm run preview
```

The production output is `dist/`. Astro uses site `https://nedelkoskifilip6.github.io`, base `/six-senses-ibiza` and trailing slashes. Local assets and the credits route use this project path. The lockfile pins resolved package versions. `npm run verify` checks built resource paths and internal links.

For a development-only automated WCAG A/AA accessibility audit, append `?audit=1` to the local URL and inspect the `ACCESSIBILITY_AUDIT` console entry. This audit dependency and execution path are excluded from production.

## GitHub Pages deployment

Intended independent repository: `nedelkoskifilip6/six-senses-ibiza`.

Target URL: `https://nedelkoskifilip6.github.io/six-senses-ibiza/`.

The committed `.github/workflows/deploy.yml` installs dependencies with Node.js 24, checks and builds the project, verifies the built links, and deploys `dist/` on pushes to `main` or manual dispatch. Configure **Settings → Pages → Build and deployment → Source** as **GitHub Actions**.

Use the independent repository and workflow. Create the repository only if absent; never overwrite another project. After publishing, verify the live homepage, `/six-senses-ibiza/credits/`, an image and a JavaScript asset, then check navigation, galleries, the reservation demonstration and scroll behavior on desktop and mobile.

**Release verification:** A successful local build alone does not confirm publication. Check the GitHub Actions deployment and the live target URL before treating a release as published.

## Reservation demonstration

The clearly labeled planning demonstration validates future dates and room capacity, then displays a local summary. It stores no data, submits no booking, does not query availability and shows no rates. Its continuation link opens the [official Six Senses Ibiza accommodations and booking page](https://www.sixsenses.com/en/hotels-resorts/europe/spain/ibiza/accommodation/). Visitors must re-enter their preferences there.

## Project structure

- `src/pages/index.astro` — complete editorial experience
- `src/pages/credits.astro` — image credits, sources and project disclosure
- `src/scripts/main.ts` — motion, navigation, experiences, gallery events and booking demonstration
- `src/components/StayGallery.tsx` — React suite explorer and accommodation details
- `src/components/PhotoLightbox.tsx` — accessible shared native-dialog viewer
- `src/data/content.ts` — verified accommodation details
- `src/styles/global.css` — visual system and responsive art direction
- `src/styles/stay-gallery.css` — suite explorer layout and interactions
- `public/images/` — responsive optimized photography
- `public/asset-manifest.json` — licensing and source provenance
- `.github/workflows/deploy.yml` — independent GitHub Pages workflow

To regenerate WebP assets, place the licensed originals at the manifest’s `file` paths and run `npm run optimize-images`. Original downloads are excluded from the repository to avoid duplicating the optimized assets.
