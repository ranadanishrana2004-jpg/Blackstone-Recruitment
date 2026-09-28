# Client brand direction

The client supplied three JPEG references on 26 September 2026. They show an interlocking BS monogram, the wordmark **Blackstone UK Recruitment**, a black / cream identity, serif headings and sans-serif body text. The readable cream colour in the reference is `#F5EFE7`.

The user separately requested gold. Gold remains a restrained interface accent; the supplied wordmark remains monochrome. The UK wording is preserved in the client-approved logo. The user subsequently expanded the platform to worldwide recruitment: 249 countries and territories, independently selected salary currencies and worldwide interview time zones. Country availability describes platform capability, not a claim of staffed offices or vacancies in every country.

The refined light theme uses ivory backgrounds, white cards, charcoal typography and restrained brass accents. `public/premium.css` covers the public website, forms, job cards and dashboards; the existing dark theme is retained.

The attached pages are visual references, not actual vector/transparent production assets. Several captions and filenames in the reference sheets are visibly garbled. They are not transcribed into the website, treated as source code or taken as instructions to contact anyone or create stationery.

For the preview, `assets/client-brand-reference.jpeg` is the unmodified supplied asset, displayed through a CSS crop of its clear top logo (`brand.css`). No stretching or rotation is applied. Dark contexts use an inverted monochrome treatment. A proper transparent SVG/PNG of the approved logo should replace this reference treatment before final brand production. No purported master vector has been fabricated.

The text-only asset bundle pictured in the reference is not itself an asset bundle. Business cards, letterheads and LinkedIn banners have not been created or implied to exist.

## Desktop motion reference

The user supplied https://g7properties.co.uk/ as a motion reference. Its password-protected desktop home and About pages were inspected with the supplied preview access. Observed elements include a black/gold branded loading screen, animated navigation underlines and a fading side drawer. No source assets or credentials have been incorporated into Blackstone.

Blackstone's own motion is implemented in `public/motion.js` and `public/motion.css`: a one-second full-screen Blackstone logo interlude with soft logo zoom, a gold shimmer and border entrance on public and workspace page changes, staggered headings and scroll entrances, image settling and animated hover details. Repeated actions on the same page do not trigger a full page transition. The branded interlude works at all viewport sizes without the View Transitions API and is skipped for reduced motion. Additional scroll entrances start at 1024 px and fall back when IntersectionObserver is unavailable. Existing mobile layout is preserved. The supplied OGG has not been transcribed; these changes follow the written request and inspected website.
