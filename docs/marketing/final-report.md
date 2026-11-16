# Marketing website brief: final report

Date: 14 November 2026. Scope: the "Sureground world-class marketing website, landing pages, UX and competitive SEO transformation" brief, milestones M0 to M7. Detail per milestone is in `progress.md`, and each decision is in `decisions.md`.

## Summary

The public site has been rebuilt end to end. That covers a new design system, homepage, navigation, eleven segment landing pages, a guides hub, location pages backed by live listings, structured data, a single crawl policy, and accessibility and performance gates in CI.

Every claim on the public pages was checked against what the product does today. Where the product could not back a claim, the claim was removed rather than softened.

Nothing has been deployed to production. Production deploy, legal sign-off and a few account settings are listed under "Needs the owner".

## What shipped

| Milestone | Outcome | Main PRs |
|---|---|---|
| M0 Discovery | Codebase, SEO and competitor audit. Fixed JSON-LD escaping and an inherited canonical found in the audit. | #157 |
| M1 Creative direction | Design tokens, type pairing and brand assets. Brand blue restored on calls to action. | #158, #173, #233 |
| M2 Homepage and navigation | Homepage with hero search and area suggestions, audience-led navigation (decision D13), footer. | #159, D13 |
| M3 Segment pages | Sell, Agents, About, Home management, Diaspora, Pricing, Landlords, Renters, Buyers, Detty December, Estates, legal pages and the Diaspora transparency centre. Every short-stay promise was checked against the backend. | #159, #173, #178, #179, #189, #206, #207 |
| M4 SEO foundation | Canonicals, noindex for private and filtered screens, sitemap, listing, breadcrumb, FAQ and item-list structured data, and one crawl policy for all four markets (D12). | #157, #167, #189, #274 |
| M5 Content and location SEO | Area pages only where at least 3 listings are live (D6). Guides built from reviewed copy, with Article and breadcrumb structured data. | #185, #186, #279 |
| M6 Performance and accessibility | Less JavaScript on every page, server-rendered first page on all market pages, real-user Core Web Vitals beacon, axe gate in CI, semantic colour tokens. | #188, #192, #200, #201, #202 |
| M7 Launch readiness | Deployment and rollback plan, SEO monitoring, analytics plan without personal data, release gate repaired, after-screenshots, share images and titles on every page. | #190, #193, #195, #199, #201, #277, #279 |

## Final launch check (14 November 2026)

Every URL in the sitemap was requested from the local build: 33 URLs, covering the static pages, guides, and sample rent, sale, short-stay and development listings.

| Check | Result |
|---|---|
| HTTP status | 33 of 33 return 200 |
| One H1 per page | 33 of 33 |
| Canonical URL | 33 of 33 |
| Share image (og:image) | 33 of 33 |
| Indexable (no stray noindex) | 33 of 33 |
| Title within 60 characters | 32 of 33 → fixed in #283 (long listing titles now drop the location, then trim) |
| Description within 155 characters | 24 of 33 → fixed in #283 (8 static pages rewritten with the same claims; listing descriptions trimmed at a word) |
| Honest fallback text | Listing and short-stay fallbacks claimed "verified" for every listing → fixed in #283 |
| Structured data | Organization, WebSite and SearchAction on the homepage; ItemList on market pages; listing, offer and breadcrumb data on listings; FAQPage on the Landlords, Renters and Buyers pages; Article and breadcrumb data on guides |
| Accessibility | The `marketing-a11y` axe job (390 px and dark mode) passes in CI. A keyboard pass found no skip link on public pages, so one was added (#281). Menus open, close with Escape and return focus. |
| Speed (local dev server, indicative only) | Homepage LCP measured at 884 ms on desktop and 552 ms on mobile emulation. A production Lighthouse run is still needed (see below). |

Screenshots of every page, before and after, desktop and phone, are in `docs/marketing/screenshots/`.

## Rules followed throughout

- **No invented proof.** There are no reviews, user counts, ratings, awards or press logos, because none exist yet.
- **Claims from the product.** Payment Protection, verification and payout wording is the same everywhere and matches the code.
- **No investment promises.** Diaspora copy says "We never promise returns".
- **No ranking guarantees.** `seo-monitoring.md` sets out what to measure, not what will happen.
- **No thin pages.** Area pages appear only with live inventory, and country guides wait for legal answers.
- **House style.** Naira only, British English, no em dashes, and no "AI" wording on user-facing pages.

## Needs the owner

1. **Legal review** of the Diaspora pages, the transparency centre, the guides and the Privacy Policy analytics section. Diaspora stays switched off in production until this is done.
2. **Counsel's answers** to the questions in `diaspora-guide-briefs.md` before any UK, US or Canada guide is written.
3. **Security decision on page caching.** The per-request security nonce makes every page render dynamically, which is the biggest remaining speed lever (`performance-report.md`, item 1).
4. **Production deploy**, plus branch protection on `dev` and deploy automation (`deployment-and-rollback.md`).
5. **A Lighthouse run on staging or production** (mobile, slow 4G) for `/`, `/pricing`, `/rent`, `/shortlets` and one listing, to confirm the local measurements.
6. **Account settings:**
   - Register "Sureground" as the Termii SMS sender ID.
   - Enable the Google Maps Distance Matrix and Places APIs, for accurate commute figures on listings.
7. **Search Console:** verify the domain and submit the sitemap after launch. Then track the queries in `seo-monitoring.md`.

## Deliberately not done

- **Area pages for Abuja, Port Harcourt and Ibadan.** They will appear automatically once each area has 3 live listings (D6).
- **Price indices, "average rent" pages and investment-return content.** There isn't enough data yet to be honest, and returns content carries regulatory risk.
- **Copying competitors' layouts or text.** The benchmark in `competitor-benchmark.md` informed structure only.
