# SEO monitoring after launch

Deliverable 19 of the marketing redesign brief. Written on 2026-11-12 against `origin/dev` at `d2ddc451`. Rules in section 2 are read from the code; anything marked **Proposed** does not exist yet.

**Rankings cannot be guaranteed.** Search engines decide what to index and how to rank it. This plan makes sure the site is crawlable, accurate and fast, and that we notice quickly when something breaks. It does not promise positions, traffic or timelines.

## 1. Setup (one-off)

| Task                  | Detail                                                                                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google Search Console | Add a **Domain** property for the production domain (DNS TXT record), so `www` and `https` variants are covered. Submit `https://<domain>/sitemap.xml`.                          |
| Bing Webmaster Tools  | Import the property from Search Console, or verify by DNS. Submit the same sitemap. Bing also feeds DuckDuckGo and others.                                                       |
| Access                | At least two owners, using company accounts, not personal ones.                                                                                                                  |
| Site URL              | `NEXT_PUBLIC_SITE_URL` must be the production origin. `lib/site.ts` falls back to `https://getsureground.io`, and every canonical, sitemap URL and JSON-LD URL is built from it. |
| Baseline              | Export Search Console Performance and Pages reports on launch day, so later comparisons have a starting point. We have no baseline today.                                        |

## 2. Indexing policy (as implemented)

### Sitemap (`apps/web/app/sitemap.ts`)

- Rebuilt at most hourly (`revalidate = 3600`).
- Static pages: `/`, `/rent`, `/buy`, `/shortlets`, `/estates`, `/land`, `/home-management`, `/sell`, `/agents`, `/about`, `/pricing`, `/privacy`, `/terms`, `/cookies`.
- `/diaspora` and the diaspora transparency page only when `GET /investor/availability` says the service is on.
- Published listings from the public API (`/rentals`, `/marketplace/listings`, `/land`, `/shortlets`): up to 10 pages of 100 per market, so at most 1,000 listings per market. Each uses the canonical slug path from `lib/listingSlug.ts` (for example `/buy/3-bedroom-duplex-in-lekki-<uuid>`) and its `updatedAt` or `publishedAt`.
- If the API is unreachable, the sitemap still publishes the static pages and drops the listings.
- Open PRs add to this: #185 adds `/areas/<slug>` only for areas with at least 3 live rent and sale listings; #186 adds `/resources` and its available guides.

### robots.txt (`apps/web/app/robots.ts`)

Allows `/` and disallows `/dashboard`, `/renter`, `/landlord`, `/owner`, `/buyer`, `/realtor`, `/agent`, `/estate`, `/gateman`, `/resident`, `/admin`, `/oauth`, `/magic-link`, `/shortlets?` and `/land?`. Points to the sitemap.

### Page-level rules

| Pages                                                                                                       | Rule                                                                                                                                                                                                                                                                    | Where                              |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Site default                                                                                                | `index, follow`, large image previews. No default canonical (removed in #157, because it made every page claim to be the homepage).                                                                                                                                     | `app/layout.tsx`                   |
| `/rent`, `/buy`, `/shortlets`, `/land` with any non-empty query parameter                                   | `noindex, follow`; the canonical stays the unfiltered page.                                                                                                                                                                                                             | each `page.tsx` `generateMetadata` |
| Sign-in, sign-up, reset, role selection (`(auth)` group)                                                    | `noindex, follow`; not in the sitemap.                                                                                                                                                                                                                                  | `app/(auth)/layout.tsx`            |
| Land consents, inspections, watch, reviews; `/representing`                                                 | `noindex, nofollow`.                                                                                                                                                                                                                                                    | their `layout.tsx`                 |
| Missing listing, short stay, development, collection, estate microsite (`/e/*`), landing microsite (`/l/*`) | `noindex` and a 404. For `/e/*` and `/l/*` the noindex matters because the page may already have sent a 200.                                                                                                                                                            | each page's `generateMetadata`     |
| Pages with their own canonical                                                                              | `/`, `/rent`, `/buy`, `/land`, `/shortlets`, `/estates`, `/sell`, `/agents`, `/about`, `/privacy`, `/terms`, `/pricing`, `/diaspora`, `/home-management`, `/developments`, land layouts and market pages, every listing page (its slug path), `/l/<slug>`, `/e/<slug>`. |                                    |

### Structured data

All JSON-LD goes through `components/seo/JsonLd.tsx`, which serialises with `lib/jsonLd.ts` (`<`, `>`, `&`, U+2028 and U+2029 escaped, so user text cannot close the script tag).

| Page                                                                                                             | Types                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Homepage                                                                                                         | `Organization` with `ContactPoint`; `WebSite` with a `SearchAction` to `/rent?q=`                                                                                                                                                                        |
| Rent, sale and land listings (`components/market/PublicListingPage.tsx`, `components/showroom/ShowroomPage.tsx`) | `RealEstateListing` built by `lib/structuredData.ts` `listingJsonLd`: an `Accommodation` (or a `Place` for land) with `PostalAddress`, rooms, floor size and amenities, and an `Offer` with a per-month or per-year `UnitPriceSpecification` for rentals |
| Short stays (`app/shortlets/[id]/page.tsx`)                                                                      | `Accommodation` with area-level address only, occupancy, nightly `Offer`; `AggregateRating` only when real reviews exist                                                                                                                                 |
| Listing pages on the showroom layout (`ShowroomPage.tsx`, on unless `SHOWROOM_ENABLED=off`) and short-stay pages | `BreadcrumbList` matching the visible breadcrumbs. The older `PublicListingPage.tsx` emits the listing only, so breadcrumbs disappear if the showroom kill switch is used.                                                                               |

## 3. Issue to fix before submitting the sitemap

robots.txt rules match by **prefix**. Two disallow rules therefore also block public pages that are in the sitemap:

| Rule                | Also blocks                 | In sitemap                  |
| ------------------- | --------------------------- | --------------------------- |
| `Disallow: /estate` | `/estates`                  | yes, priority 0.8           |
| `Disallow: /agent`  | `/agents`, `/agency-invite` | `/agents` yes, priority 0.6 |

Search Console will report these as "Submitted URL blocked by robots.txt". **Proposed fix:** change the rules to `/estate/` and `/agent/`, and add `/agency/` explicitly: the signed-in agency dashboard (`app/(dashboard)/agency`) is currently kept out only because `/agent` happens to prefix it. Then check with the robots.txt report in Search Console.

## 4. Core Web Vitals

Nothing measures Core Web Vitals in production today (no `useReportWebVitals`, no RUM tool). Sources available:

| Source                                 | What it gives                                                                                                             | Status                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Search Console, Core Web Vitals report | Field data (Chrome UX Report) by URL group, mobile and desktop. Needs enough traffic before it shows anything.            | Available after setup |
| PageSpeed Insights                     | Field data where available, plus a lab run.                                                                               | Available             |
| Own RUM                                | `useReportWebVitals` in the root layout sending a `web_vital` event through `lib/analytics.ts` (see `analytics-plan.md`). | **Proposed**          |

Thresholds to watch (Google's "good" limits, 75th percentile): LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1. Pages to watch first: `/`, `/rent`, `/buy`, a listing page, `/land`. The homepage hero photo is the only priority image (#159), so it is the likely LCP element.

Things in the code that affect these numbers: the root layout reads the CSP nonce header, which makes every page dynamically rendered; public API data is revalidated every 60 seconds (`PUBLIC_REVALIDATE`).

## 5. Routine checks

### Weekly (about 30 minutes)

- [ ] Search Console **Pages**: new "Not indexed" reasons, especially "Blocked by robots.txt", "Duplicate, Google chose different canonical", "Soft 404" and "Server error (5xx)".
- [ ] **Sitemaps**: last read date is recent; discovered URL count roughly matches live listings plus static pages.
- [ ] Fetch `/sitemap.xml`: listing URLs are present (an empty listing section means the API call failed).
- [ ] **Enhancements**: no new errors on breadcrumbs or other detected structured data.
- [ ] **Performance**: clicks and impressions for brand queries ("sureground") and for the main pages; note big changes, don't chase small ones.
- [ ] Bing Webmaster **Site scan** or **URL inspection** on two listing pages.
- [ ] Spot-check one filtered URL (`/rent?q=Lekki`) still returns `noindex`, and one unknown path returns 404.

### Monthly

- [ ] Core Web Vitals report: any URL group moved to "Needs improvement" or "Poor".
- [ ] Rich Results Test on one rent, one sale, one land and one short-stay listing.
- [ ] Top 20 landing pages by clicks; check titles and descriptions still match the page.
- [ ] Listings per market against the sitemap's 1,000-per-market cap; plan sitemap index files before any market reaches it.
- [ ] Check that pages behind `DIASPORA_INVEST_ENABLED` match its current state (in the sitemap only when on).
- [ ] Export the Performance report and keep it with the launch baseline.

## 6. Alert thresholds (Proposed)

Search Console emails owners about new issue types on its own. On top of that:

| Signal                             | Threshold                                         | First action                                                      |
| ---------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| Indexed pages                      | drop of more than 20% week on week                | Check robots.txt, recent `noindex` changes and 5xx errors.        |
| "Server error (5xx)" or "Soft 404" | any new URLs                                      | Check the API (listing pages and the sitemap depend on it).       |
| Sitemap listing URLs               | zero, or down more than 30% day on day            | Check `NEXT_PUBLIC_API_URL` and the public list endpoints.        |
| Core Web Vitals                    | any key URL group leaving "Good"                  | Compare with recent merges; check the hero image and new scripts. |
| Organic clicks                     | down more than 30% week on week, outside holidays | Check the above first; then compare queries and pages.            |
| Manual action or security issue    | any                                               | Escalate the same day.                                            |

Organic traffic varies week to week. Treat these thresholds as prompts to look, not as proof that something is wrong.
