# Marketing redesign: decision log

Architecture and content decisions for the marketing redesign, reconstructed from PRs #157 to #186 on `dev` (state on 2026-11-12). Each entry gives the context, the decision, its consequences and the PRs. "Accepted" means merged to `dev`; "Proposed" means the PR is still open.

PR links: `https://github.com/WapSecure/getrentos-frontend/pull/<n>`.

| #   | Decision                                                                           | Status   | PRs                                |
| --- | ---------------------------------------------------------------------------------- | -------- | ---------------------------------- |
| D1  | Brik design tokens: sharp corners, ink accent, Newsreader and Manrope              | Accepted | #158, #173                         |
| D2  | A shared marketing component library                                               | Accepted | #159, #173, #178, #179             |
| D3  | Escape all JSON-LD                                                                 | Accepted | #157                               |
| D4  | Canonical and noindex policy                                                       | Accepted | #157, #167                         |
| D5  | Structured data only for what the page shows                                       | Accepted | #167                               |
| D6  | Area pages only with at least 3 live listings                                      | Proposed | #185                               |
| D7  | Resources guides reuse already-reviewed copy                                       | Proposed | #186                               |
| D8  | Icon-only actions need a label, a tooltip and, if they change data, a confirmation | Accepted | #164                               |
| D9  | Honest-copy rule                                                                   | Accepted | #159, #166, #170, #175, #179, #181 |
| D10 | Closed services are hidden, not advertised                                         | Accepted | #159, #178, #186                   |
| D11 | One impression rule on web and mobile                                              | Accepted | #182                               |

---

## D1. Brik design tokens

**Context.** The marketing redesign needed one visual language across the website, back office and mobile app. The direction was approved on 2026-11-12: Brik first, sharp corners, ink accent.

**Decision.**

- All changes go through the shared tokens in `packages/tokens/src/index.ts`, synced to `theme.css` (`pnpm tokens:sync`; CI runs `tokens:check`).
- Light theme: paper `#f8f7f5` canvas, white cards, slate ink `#20232b` for text and primary. Dark: `#111216` canvas with light-ink primary.
- Blue only for `info`; verified and success use green.
- Radii: 2px controls, 4px cards and panels, 6px dialogs and sheets.
- Type: Newsreader for page titles, `h1` and display text; Manrope for the interface. Mobile loads Newsreader 400 through `@expo-google-fonts/newsreader` and falls back to the UI face until it loads.
- Primary button is flat ink; outline is a hairline ink border.
- Brand assets (logos, badges, app icon, splash, OG image, theme colour) move to ink. Trust-score badges keep their tier colours, because there colour shows a level.

**Consequences.**

- Every text pair was checked for WCAG AA (muted text 6.0:1 on the canvas).
- Changing a token changes all three apps at once; a revert of #158 does the same.
- The back office now loads web fonts, which it did not before.
- The mobile serif had not been seen on a device when #173 merged.

**PRs.** #158, #173.

## D2. Marketing component library

**Context.** Several landing pages were to be rebuilt in the same style, and the older sections (Hero, FeaturedProperty with a fake example card, Features, Roles and others) used heavily rounded cards, pills and blue accents.

**Decision.** Build reusable server-friendly components in `apps/web/components/marketing/`: `Container`, `SectionIntro`, `CtaLink`, `ArrowLink`, `PhotoFrame`, `FeatureRow`, `ListingTile`, `ClosingBand`, later `LandingHero`, `StepList`, `FaqList`. The homepage is server-rendered; only the search box and navigation are client components. Stock photos (Unsplash licence, sources in `assets/photos/README.md`) are stand-ins and are never used to illustrate a listing.

**Consequences.**

- `/`, `/home-management`, `/diaspora` and `/pricing` share one structure: serif hero, ruled lists, ink closing band.
- The old sections and `components/sections/primitives.tsx` and `CTA.tsx` were deleted.
- New landing pages should use these components rather than add new ones.
- Search on the homepage routes to the existing marketplace search with `?q=`, so no new search logic was added.

**PRs.** #159, #173, #178, #179.

## D3. JSON-LD is always escaped

**Context.** `JsonLd` wrote `JSON.stringify` output straight into a script tag. Listing titles and descriptions are user content, so a `</script>` in a description could inject markup, and the CSP is Report-Only by default.

**Decision.** All structured data goes through `components/seo/JsonLd.tsx`, which uses `serializeJsonLd` in `lib/jsonLd.ts` to escape `<`, `>`, `&`, U+2028 and U+2029. Unit tests in `lib/jsonLd.test.ts`.

**Consequences.** No page may write JSON-LD with its own `dangerouslySetInnerHTML`. Reverting #157 reopens the injection.

**PRs.** #157.

## D4. Canonical and noindex policy

**Context.** The root layout set `alternates.canonical: '/'`, so every page without its own canonical told search engines it was a copy of the homepage. Query-string views of the marketplaces could multiply into thin duplicate pages. The root `loading.tsx` made every `notFound()` return a 200.

**Decision.**

- No default canonical in the root layout; each public page sets its own.
- `/rent`, `/buy`, `/shortlets` and `/land` with any query parameter are `noindex, follow`, keeping the unfiltered canonical.
- `(auth)` pages are `noindex, follow` and out of the sitemap.
- Missing listings and microsites are `noindex` and 404. The root `loading.tsx` was removed so 404s are real; the dashboard keeps its own.
- The WebSite `SearchAction` targets `/rent?q=`, because robots.txt disallows `/shortlets?`.
- `/land` renders on the server (its availability gate gets initial data from the layout), so crawlers see its content.

**Consequences.** Filtered views cannot rank on their own; area landing pages (D6) are the planned way to target area searches. Every new public page needs an explicit canonical. Details are in `seo-monitoring.md`.

**PRs.** #157, #167.

## D5. Structured data only for what the page shows

**Context.** Listing pages emitted a bare `Offer`. Richer schema helps search engines, but invented ratings or dates would be misleading and against search engine guidelines.

**Decision.** `lib/structuredData.ts` emits a `RealEstateListing` (an `Accommodation`, or a `Place` for land) with only the facts on the page. Short stays show the area, never the street address (released after booking), and include a rating only when real reviews exist and are shown. `BreadcrumbList` matches visible breadcrumbs.

**Consequences.** Rich results may be limited where data is thin. That is accepted.

**PRs.** #167.

## D6. Area pages only with at least 3 live listings (Proposed)

**Context.** Area pages can target searches like "flats to rent in Lekki", but a page with no listings and generic copy is a thin page and makes claims we cannot back.

**Decision.** `/areas/[slug]` publishes only when the area has at least `MIN_AREA_LISTINGS` (3) live rent and sale listings from the API. Below that it 404s with `noindex` and is left out of the sitemap. Copy is generated from live counts only, with no area descriptions or price claims. If the API is unreachable the page throws an error (retry) instead of 404ing, so an outage cannot deindex areas.

**Consequences.** Few area pages will exist at first (on the dev API only Lekki qualified). Pages appear and disappear as inventory changes, so Search Console will show some 404s for areas that dropped below the threshold; that is expected.

**PRs.** #185 (open).

## D7. Resources guides reuse reviewed copy (Proposed)

**Context.** Guides help search and trust, but new legal, title or investment claims would need a fresh legal review before launch.

**Decision.** `/resources` guides are assembled only from copy already reviewed for the Diaspora Invest page (`components/diaspora/public/content.ts`). Each carries a "general information, not legal, tax or investment advice" note. `guides.ts` states that any new guide needs the same review. The diaspora guide is hidden and 404s while the service is off.

**Consequences.** The launch set is small (three guides). Adding a guide is a content-review task, not just a code change.

**PRs.** #186 (open).

## D8. Icon-only actions need a label, a tooltip and a confirmation

**Context.** A user clicked an unexplained check icon on a maintenance card and the request was resolved immediately, with no label, tooltip or confirmation. An audit found the same pattern across the apps, including a template icon that sent a message silently.

**Decision.**

- A shared `Tooltip` in `packages/ui/src/Tooltip.tsx` (hover and keyboard focus, Escape to dismiss, portal-rendered). `IconButton` and `IconLink` use it instead of `title`.
- Actions that change data ask first, naming the item and whether it can be undone. On mobile this uses `Alert.alert`.
- High-stakes actions get a visible text label (Approve, Reject, Mark resolved, Cancel viewing and others).
- Reversible toggles (pin, archive, mark read, favourite, save) keep their icons, with specific labels and tooltips.

**Consequences.** New icon-only controls must follow this; CI runs `pnpm audit:ui-controls` against `config/ui-control-baseline.json`.

**PRs.** #164.

## D9. Honest-copy rule

**Context.** The redesign demo found claims the product cannot show: "Every property and user is verified", "Your funds are always secure", "24/7 Support", "Bank-grade security", "world-class property team", an always-on "VAT included", a mock "portfolio health" panel and an invented trust score in mobile onboarding.

**Decision.** Marketing and product copy states only what the product does and can show. In practice:

- Trust claims reuse the same four facts as the homepage (identity checks before high-stakes actions, Payment Protection release rules, documents reviewed before a property is marked verified, one account for every role).
- Prices and tax wording follow the API (`pricing.vatInclusive`), not fixed text.
- Illustrations are labelled _Example_; stock photos never stand in for listings.
- Listings still being checked are described as Verifying, not verified.
- Figures shown to owners are only recorded figures; a status says Cancelled, not Refunded, when nothing was paid.

**Consequences.** Copy changes need checking against the product, not just proofreading. Some pages are plainer than a typical property site. This rule also limits analytics claims (see `analytics-plan.md`, which quotes no baselines).

**PRs.** #159, #166, #170, #173, #175, #179, #181.

## D10. Closed services are hidden, not advertised

**Context.** Diaspora Invest is off unless the API's `DIASPORA_INVEST_ENABLED` is true. Advertising a closed service would break D9.

**Decision.** `lib/diasporaAvailability.ts` asks `GET /investor/availability`; a failure counts as off. When off, `/diaspora` 404s, the homepage Diaspora section is not rendered, the pages are left out of the sitemap and (with #186) the diaspora guide is hidden.

**Consequences.** Turning the service on or off is a backend config change, with web pages following within 60 seconds and the sitemap within an hour (see `deployment-and-rollback.md`).

**PRs.** #159, #178, #186.

## D11. One impression rule on web and mobile

**Context.** Web counted a card as seen as soon as half was on screen; mobile waited 250 ms. The two funnels could not be compared.

**Decision.** Both use `CARD_IMPRESSION_RULE` in `packages/shared/src/showroom/events.ts`: at least half the card on screen for one continuous second, once per page or screen visit.

**Consequences.** Impression counts drop from the merge date because quick scroll-pasts no longer count. Compare funnels only from 2026-11-12 onwards.

**PRs.** #182.

## D12. Crawl policy for market pages: noindex, not robots blocks

**Date:** 13 Nov 2026 · **Status:** Accepted

- Unfiltered `/rent`, `/buy`, `/shortlets`, `/land` are indexable with a self canonical.
- Any query string (filters, sort, search text, `page`) gives `noindex, follow` and the unfiltered canonical. Pagination stays out of the index on purpose: the server renders only the first page, so `?page=2` would serve page 1's listings in its initial HTML. Individual listings reach search engines through `sitemap.xml`.
- robots.txt no longer blocks `/shortlets?` and `/land?`. A crawler can only obey `noindex` on a page it may fetch, and a blocked URL can still be indexed from links without its content. All four markets now follow one rule.
- Private return and invitation screens (`/payments`, `/billing`, `/agency-invite`, `/auth`, `/representing`) are blocked in robots.txt and carry `noindex, nofollow`.
- Benchmark support: Property Finder blocks filter-parameter combinations but leaves listing and community URLs crawlable (see `competitor-benchmark.md` §7).
- Revisit if server-rendered pagination is added: then `?page=N` can become indexable with a self canonical.
