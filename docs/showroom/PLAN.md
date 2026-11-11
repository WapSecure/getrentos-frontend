# Property showroom: assessment, architecture and first milestone

This plan rests on the [audit](AUDIT.md). Section 21 of the brief asks for it before any major code change, so the work stops here for approval.

Decisions already made by the product owner (2026-11-10):

- **Phase 1:** the showroom page plus the data behind it.
- **Enquiries:** sign-in stays required.
- **Visual style:** stay inside the design system. Sections 9 and 13 of the brief are met through real media, layout and restrained motion, not a new visual language.

## 1. The customer experience today

**What works**

- The public listing pages are server-rendered, quick to first paint and indexable, with Offer JSON-LD.
- Shortlets already have the strongest journey: photos, video and 360 tabs, house rules, utilities, a public price quote and booking.
- Land has real substance: parcel boundary, title, assurance tier, comparables and dossiers.
- Trust is honest. The listing check computes its facts in code and the AI only words them, and verified badges follow backend status (5b6acb09).

**What a customer actually meets on `/rent/[id]`, `/buy/[id]` and `/land/[id]`**

- **Gallery:** one cover photo and four thumbnails. No fullscreen, zoom, swipe or captions, and no video or tour even when one exists.
- **Facts:** a flat list. The rental deposit, lease length, furnished and pets are stored but never sent to the page.
- **Neighbourhood, trust and listing check:** all built, but shown only to signed-in renters on a second, different detail page.
- **Costs:** the rent alone. There is no way to see the total cost of moving in.
- **Next steps:**
  - Rent gives "Enquire", which sends you to sign in. Sale and land give "Make an offer".
  - There is no share and no viewing request on the public page.
  - The signed-in "compare" button only shows a toast.
- **Phone users:** full-size original photos download over mobile data.

**Verdict:** the parts of a showroom exist but are scattered over two pages, three apps and eight cards. The public page, where every journey starts, shows the least.

## 2. The ten highest-impact opportunities

| #   | Opportunity                                                                                                                                      | Classification                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| 1   | One showroom page for every listing type, built from shared parts                                                                                | Existing, needs improvement          |
| 2   | Fullscreen media viewer: keyboard, swipe, zoom, captions, video and 360                                                                          | New and feasible now                 |
| 3   | Show the stored facts the public page drops (deposit, lease, furnished, pets, availability, property type)                                       | Depends on backend (small, additive) |
| 4   | True rental cost: service charge, agency, legal and caution fees, and the total to move in                                                       | Depends on backend (new fields)      |
| 5   | Neighbourhood, trust chain and listing check on the public page                                                                                  | Existing and reusable                |
| 6   | Context-specific next steps: viewing and apply for rent, inspection and offer for sale, booking for shortlets; share (WhatsApp) and real compare | Mostly existing, needs improvement   |
| 7   | One listing card with variants, replacing 8                                                                                                      | Existing, needs improvement          |
| 8   | Media captured with meaning: room tags, captions, order, tour links for rent and sale, and later floor plans                                     | Depends on backend, then forms       |
| 9   | Responsive images: resized versions, a CDN and blur placeholders, for phones on mobile data                                                      | Depends on infrastructure            |
| 10  | Funnel tracking from card impression to enquiry, to prove any of this works                                                                      | Depends on backend (new endpoint)    |

**Later:**

- map-area search and a public map
- floor plans
- commercial and off-plan pages
- grounded property Q&A
- 3D, only when real scan data exists

Classified as future enhancements or dependent on providers.

## 3. Future customer journey

1. **Discover:** a card shows the real photo, price with its unit, area, key facts, freshness and a verified badge only when the backend says so. Save, compare and share are one tap.
2. **Arrive:** a hero with the best photo, title, location, price and availability, plus one primary action for the listing type.
3. **Explore:** "Show all photos" opens the media viewer, grouped by room once tags are captured. Video and the 360 tour sit beside the photos, never faked.
4. **Understand:** facts, then a cost breakdown (rent and fees to total move-in; asking price and fees; nightly quote to total), then neighbourhood places, travel times and walkability with their source named.
5. **Trust:** the trust chain, the listing check, and media dates such as "Filmed on site, Oct 2026". Unverified and estimated data are labelled as such.
6. **Act:** a sticky phone bar with the primary action:
   - rent: request viewing, then apply
   - sale: request inspection, then make offer
   - land: request site tour, then offer
   - shortlet: check dates, then book

   Sign-in happens inline and returns to the same step.

7. **Return:** saved listings, compare (up to 4, real), recently viewed and saved-search alerts.

## 4. Target architecture

The showroom is a product capability, not a page.

```
packages/shared/src/showroom/        property information model + mappers (web and mobile)
  types.ts                           ShowroomListing, MediaItem, CostLine, Fact, TrustSummary
  fromRental.ts fromSale.ts fromLand.ts fromShortlet.ts
packages/ui/src/                     design-system primitives (web), flat like the rest of the package
  MediaViewer.tsx                    fullscreen viewer on our Dialog: keys, swipe, zoom, captions
  MediaMosaic.tsx                    hero grid: 1 large + 4, "Show all n"
  VideoPlayer.tsx                    poster first; hls.js loaded on play, native HLS only without MSE (iPhone)
  TourEmbed.tsx                      the 360 iframe now inside ShortletListingDetail, made shared
apps/web/components/showroom/        composition (server first, client islands only where needed)
  ShowroomPage.tsx                   picks sections per listing type
  ShowroomHero.tsx ShowroomFacts.tsx ShowroomCosts.tsx ShowroomTrust.tsx
  ShowroomNeighbourhood.tsx          reuses maps/GeoInsightsPanel + PropertyMap
  ShowroomActions.tsx                reuses ListingCallToAction, SaveListingButton; adds Share
packages/ui-native (later)           MediaViewer for mobile on the same MediaItem contract
```

**Rules:**

- **Model and mappers:** in `@sureground/shared`. Web and mobile stop mapping the same responses twice (today `apps/web/lib/publicListingDetail.ts` and `apps/mobile/lib/api/publicMarket.ts`).
- **Primitives:** in `@sureground/ui`, so landlord previews, realtor tools and the backoffice reuse them.
- **Composition:** in `apps/web/components/showroom`. URLs (`/rent/[id]`, `/buy/[id]`, `/land/[id]`, `/shortlets/[id]`) and metadata stay exactly the same.
- **Rendering:** the page stays a server component. The viewer, video, map and actions load as client islands; hls.js loads only when a video plays.
- **Rollout:** the repo has no feature-flag system. `SHOWROOM_ENABLED=on` (server-only, read per render, so no rebuild) switches each route from `PublicListingPage` to `ShowroomPage`, so we can compare and roll back.

**Media contract** (added to public detail responses next to today's fields, so nothing breaks):

```ts
interface MediaItem {
  id: string;
  kind: 'image' | 'video' | 'tour';
  url: string; // signed or public URL; never a storage key or credential
  posterUrl?: string;
  width?: number;
  height?: number; // filled once processing exists
  durationSeconds?: number;
  alt?: string;
  caption?: string;
  room?:
    | 'living'
    | 'bedroom'
    | 'bathroom'
    | 'kitchen'
    | 'exterior'
    | 'amenity'
    | 'floor_plan'
    | 'neighbourhood'
    | 'other';
  order: number;
  capturedAt?: string;
  filmedOnSite?: boolean;
  source?: 'owner' | 'agent' | 'inspection' | 'render';
  tourHost?: string; // for kind 'tour', from the existing allow-list
}
```

## 5. Delivery roadmap

| Milestone                                          | Contents                                                                                                                                                                   | Depends on                      |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **M1 Showroom foundation**                         | Shared model; media viewer, mosaic, video and tour primitives; showroom page for rent, sale and land behind the flag; hidden rental facts and `media[]` exposed (additive) | Small backend PR, no migration  |
| M2 Real costs and media meaning                    | Fee fields and total move-in cost; tour link for rent and sale; room tag, caption and order on photos; capture in the landlord, owner and estate forms with reorder        | Migration (backup first), forms |
| M3 One card, real compare                          | Unified `ListingCard` (editorial, compact, map, shortlet, development variants) across the 8 places; compare fixed; share                                                  | M1 model                        |
| M4 Measurement                                     | Event endpoint and schema (impression to offer), no personal data; dashboard baseline                                                                                      | Backend endpoint                |
| M5 Shortlets and mobile                            | Shortlet detail on the showroom parts; mobile viewer on `ui-native`; mobile uses the shared mappers                                                                        | M1 to M3                        |
| M6 Discovery                                       | Public map with map-area search; similar listings on the server; collections                                                                                               | Backend geo query               |
| M7 Media infrastructure                            | Resized versions and WebP/AVIF, CDN, dimensions, blur placeholders, upload progress                                                                                        | Infrastructure decision         |
| M8 Floor plans, commercial, off-plan, grounded Q&A | As data and providers allow                                                                                                                                                | Data model and providers        |

Every milestone ends with browser checks in the VS Code bridge (rent, sale, land fixtures; phone, tablet and desktop; keyboard; reduced motion; dark mode; missing and broken media) and a measured performance comparison against today's page.

## 6. First milestone (M1): exact files

**Backend** (`getrentos-backend`, branch `feat/showroom-m1`; additive, no migration):

- `src/modules/renter/dto/public-rental-listing.dto.ts` and the service mapping the public rental: add `securityDeposit`, `minimumLeaseMonths`, `furnished`, `petsAllowed`, `availableFrom`, `availableUntil`, `propertyType`.
- Public detail responses for rent (`public-rentals.controller.ts`), sale (`marketplace.controller.ts`) and land (`public-land.controller.ts`): add `media: MediaItem[]`, built from the existing cover and gallery keys, the Mux stream with poster, and filmed-on-site. Old fields stay.
- One shared builder: `src/shared/media/public-media.ts`, with a spec.

**Frontend:**

- New: `packages/shared/src/showroom/{types,fromRental,fromSale,fromLand,index}.ts`, plus `*.test.ts` run with `node --test` (no new test dependency).
- New: `packages/ui/src/{MediaViewer,MediaMosaic,VideoPlayer,TourEmbed}.tsx`, exported from `packages/ui/src/index.ts`.
- New: `apps/web/components/showroom/{ShowroomPage,ShowroomHero,ShowroomFacts,ShowroomCosts,ShowroomTrust,ShowroomNeighbourhood,ShowroomActions}.tsx`.
- Changed:
  - `apps/web/lib/publicListingDetail.ts`: fetch only; mapping moves to shared.
  - `apps/web/app/{rent,buy,land}/[id]/page.tsx`: flag switch.
  - `apps/web/components/shortlet/ShortletListingDetail.tsx`: uses `TourEmbed`.
- New dependency: `hls.js` in `packages/ui`, loaded on play only. Our Mux stream is not playable in Chrome or Android browsers without it.
- Tests:
  - `tests/browser/showroom/` (fixture API plus check scripts; see M1 status) with fixtures for rent, sale and land: full media, one photo, no photos, a broken image URL, 40 photos, video, tour.
  - Keyboard and focus checks in the viewer.
  - Run singly, not the full suite.

**Acceptance for M1:**

- **Unchanged:** existing URLs, metadata and JSON-LD.
- **Viewer:** works by mouse, touch and keyboard; Escape returns focus; reduced motion is respected.
- **Facts:** the rent page shows the stored deposit, lease and availability.
- **Honest media:** no video or tour section appears without real media; nothing is labelled verified without backend status.
- **Phones:** the hero image is the LCP element and has its dimensions set; CLS ≤ 0.1, measured in the bridge at a 390px width.

## 7. Decisions needed from the product owner

1. **Fee fields (M2):** store service charge, agency, legal and caution fees as naira amounts set by the landlord, or as percentages of rent (agency and legal fees are often 10% each)? I recommend naira amounts, with percentage helpers in the form, so the page never shows a computed guess as a fact.
2. **Media infrastructure (M7):** add a CDN with an image resizer (for example CloudFront with an image handler, or imgproxy beside our S3-compatible bucket), or generate fixed sizes at upload? This needs an infrastructure owner.
3. **hls.js** as one new web dependency (about 60 KB, loaded only on play), so listing videos play in Chrome and Android browsers.
4. **Analytics (M4):** our own event endpoint, or an existing product-analytics service?
5. **Flag rollout:** turn the showroom on for everyone once M1 passes, or run an A/B split once M4 tracking exists?

## M1 status (2026-11-10)

Built and checked in the browser; behind `SHOWROOM_ENABLED=on`, off by default.

**Frontend:**

- Shared listing model and mappers in `@sureground/shared/showroom`. 9 unit tests (`pnpm --filter @sureground/shared test`).
- `MediaViewer`, `MediaMosaic`, `VideoPlayer` and `TourEmbed` in `@sureground/ui`, plus `Dialog size="full"`.
- Showroom page for rent, sale and land, which adds:
  - share, WhatsApp first
  - the stored facts, and costs with the fees the listing doesn't state
  - neighbourhood from the public endpoint, now on rent and sale
  - a plain "what has been checked" section
- Shortlets use the shared player and tour embed.

**Backend:** PR #129 (additive, no migration). Specs pass; `tsc -p tsconfig.build.json` is clean. Not merged.

**Checks** (`tests/browser/showroom/`):

- Fixture API on :4300 serving `fx-*` listings and proxying everything else. `check.mjs` passes 37/37:
  - viewer keys, swipe, zoom, grid, focus trap and return
  - broken, empty, 40-photo and older-API listings
  - sale and land
  - phone layout: no sideways scroll, CLS ≤ 0.1, 44px controls
- `video-chrome.mjs` plays the HLS stream in Google Chrome.

**Found while testing:**

- **Chrome:** it reports native HLS support, but playback stalled at 0:00, so hls.js comes first.
- **VS Code's built-in browser:** it has no H.264, VP9 or AV1 decoder. The player says the browser can't play the video, not "check your connection".
- **Thumbnails:** the strip downloads full-size photos, so it loads only the 9 nearest until resized images exist (M7).

**Not done in M1:**

- Mobile app (M5).
- Room grouping and captions: need data, M2.
- Playwright wiring into CI (billing).
- Screen-reader pass.

## Reference designs (2026-11-10)

The product owner added reference images. We take their structure; the palette and type stay ours: no cream or terracotta, no serif display, per the no-AI-look rule.

| Idea                                                                                              | Milestone                        |
| ------------------------------------------------------------------------------------------------- | -------------------------------- |
| Full-bleed viewer with room rail, control bar, thumbnail strip                                    | M1 (room rail shows once tagged) |
| Swipe the hero on phones with a "3 / 8" counter                                                   | M1                               |
| Key facts in one divided row                                                                      | M1                               |
| Sticky price with one primary action on phones                                                    | M1 (existing bar)                |
| Room name over the photo, media tabs (exterior, amenities…)                                       | M2 (needs room tags)             |
| Listing grid: status badge, title and price on one line, facts line, result count, one filter bar | M3 (single ListingCard)          |
| Map-first search with price pins and a drawn area                                                 | M6                               |
| Floor plan beside the photos with level arrows                                                    | M2 capture, M8 display           |
| Labelled callouts on a photo                                                                      | Later; needs lister annotations  |
| Like and view counts                                                                              | Only after M4 measures them      |
| "3D tour" call to action                                                                          | M8, real scan data only          |

## M2 and M3 status (2026-11-10)

**M2, real costs and media meaning:**

- **Done for landlords:**
  - Backend #132 adds service charge, agency and legal fees on listings (naira), a 360 tour link and per-photo room and caption on properties. The migration was applied after a backup.
  - On the web, the landlord publish form and a Fees dialog take the fees; `PropertyPhotoEditor` handles rooms, captions, order, cover and the tour link.
  - Checked end to end on the seed landlord's Ikoyi house: the public page shows the fees, totals, room shortcuts, the room names over photos and the 360 tour.
- **In progress:** the same for owners and estate managers. Their backend endpoints don't accept the fields yet.

**M3, one card:** done, frontend #105. One `ListingCard` (grid, compact, map) now serves rent, buy, shortlets, land, microsites, estate storefronts, renter Discover and Saved, buyer pages and similar listings. The renter compare button now really adds to the comparison.

**Follow-ups done:**

- One trust signal per card: the trust pill, with no extra tick.
- Repeated place names collapse ("Lagos, Lagos" shows as "Lagos").

## Rollout and measurement (2026-11-10)

- **Showroom:** on for everyone. `SHOWROOM_ENABLED=off` brings back the old page without a rebuild.
- **M2 for owners and estates:**
  - Owners: backend #133 plus the owner editor. Checked live: rooms, caption and tour show on `/buy`.
  - Estates: backend #135 stores details on the listing (`Listing.mediaDetails`), so a landlord or owner save can't wipe them, plus the estate media panel. Not checked live, because no seeded estate listing has an owner agreement.
- **M4, our own analytics (backend #134):**
  - **Intake:** `POST /analytics/events` takes 16 allow-listed event names. It stores no user id, IP or user agent, and drops unknown fields such as `email`.
  - **Report:** `GET /admin/analytics/showroom-funnel` (`reports.view`) gives session funnels and media engagement by market, plus outcomes from existing records.
  - **Retention:** nightly, 400 days.
  - **Web:** `lib/analytics.ts` batches events and sends a `text/plain` beacon when the page is hidden. It skips sending under Do Not Track.
  - **Checked live:** a test journey showed up in the funnel report.
- **Next:**
  - a funnel page in the backoffice
  - instrument shortlets, land and Discover cards
  - M7 media infrastructure

## Real photos, resized copies and shortlets (2026-11-10)

- **Photos:** every visible listing in local dev now has real housing photos: 57 CC0 or public-domain images, each checked by eye, attached through the app as each listing's own owner, with rooms tagged. The sources are in the agent's `housing/manifest.json`.
- **M7 resized copies (backend #136):** WebP at 320, 960 and 1600px, made on upload. A backfill run made copies for the remaining 30 of 72 photos, with 0 failures. Pages pick the copy that fits: 960px on desktop cards and tiles, 320px on viewer thumbnails.
- **Shortlets:** on the showroom media. Backend #137 sends their `media` list, using the shared `shortletMedia()`.
- **Estate photo panel:** checked live on Journey Gardens Estate. Rooms and captions load back and save (200).
  - The estate listing itself can't be published until the estate manager's identity is verified (`IDENTITY_REQUIRED`).
- **Fixed: expired photo links on cached pages** (frontend 933e5ae1, backend PR #138 merged).
  - Listing pages are cached for 60 seconds, and Next serves a stale copy once while it refreshes.
  - Photo URLs are signed for 15 minutes.
  - So the first visitor after more than 15 minutes without traffic gets dead photo links until they reload.
  - The fix:
    - public listing photos are signed for longer (backend #138);
    - cached pages can no longer outlive their photo links (frontend 933e5ae1).

## M5 status (2026-11-11)

Shortlets were already on the showroom parts on the web. This milestone brings the showroom to the mobile app.

**Done:**

- **Shared mappers on mobile.** The signed-out listing screen, signed-in rent, sale, land and shortlet screens now build their facts, fees, move-in total, media, rooms and captions with `fromRental`, `fromSale`, `fromLand` and `shortletMedia`. The app and the web now show the same facts and costs.
  - Sale: `/buyer/listings/:id` sends no media list, verified flag or offer status, so the screen also reads the public `/marketplace/listings/:id`.
  - Land facts gained block, frontage and depth in the shared mapper, so the web shows them too.
- **Mobile media viewer** (`apps/mobile/components/showroom/MediaViewer.tsx`):
  - full screen, swipe between items
  - a counter of photos only ("3 / 7"), matching the hero; a video or tour page shows "Video tour" or "360 tour" instead
  - arrow keys page through on Expo web
  - pinch and double-tap zoom (gesture handler and Reanimated, already in the app)
  - room chips once photos are tagged, room name and caption under the photo, thumbnail strip
  - video and 360 tour pages only when the listing has them; nothing loads until the viewer taps play or start
  - reduced motion respected
- **Phone hero** (`ShowroomHero`): swipeable, with a counter, the room name on the photo, and Video and 360 tour pills only for real media.
- **Place names:** repeated ones collapse ("Lagos, Lagos" shows as "Lagos") with the shared `tidyPlace`, as on the web.
- **Key facts** in one divided row; **costs card** with stated fees, the move-in total and the fees not stated.
- **Sticky price bar with one primary action:** rent: request viewing; sale: request inspection; land: request inspection (or add a buyer account); shortlet: check dates or book. Apply (rent) and make an offer (sale, land) sit with the costs.
- **Resized copies:** 960px in the hero, a copy matching the screen's pixel width (up to 1600px) in the viewer, 320px for thumbnails. The original is used when there are none.
- **Analytics:** `lib/showroomAnalytics.ts` sends the same anonymous events to `POST /analytics/events` (session id per app launch, no token, flushed when the app goes to the background): detail view, gallery open, room select, video start and complete, tour start, save, share, viewing or inspection start, apply (`inquiry_start`), offer start, booking start. The surface is `app_listing` or `app_sticky_bar`.

**Checked how:**

- `tsc --noEmit` in apps/mobile and packages/shared; eslint on every changed file.
- Shared tests: 13 pass (`pnpm --filter @sureground/shared test`). Mobile: `public-market.test.ts` (new detail-mapping cases) and `routing.test.tsx`, 2 suites pass.
- Expo web on :8082 against the local API: the bundle builds; `POST /analytics/events` with a mobile-shaped event returns 202 from that origin.
- **Not checked visually by the agent** (no browser allowed). To check in the VS Code browser: `http://localhost:8082/listing/rent/40ae2516-1a25-4383-add2-c48186b90b5d` (Ikoyi house: rooms, captions, resized copies, fees, a 360 tour).

**Not done:**

- On a device: pinch zoom, swipe, the video player and the tour in the viewer have not been tried on iOS or Android.
- `property_impression` and `property_card_click` on the mobile Discover, market and shortlet lists.
- The viewer lives in the app, not `ui-native`, because it needs the gesture handler, expo-video and WebView, which `ui-native` does not depend on. It can move once `ui-native` takes those as peers.
- Owner and host listing previews still use the old `PropertyGallery`.

**For a product decision:**

- Rent's one primary action is now "Request viewing"; "Apply to rent" moved from the bar to the costs card. Sale and land put "Request inspection" in the bar and "Make an offer" with the costs. Signed-out buttons now read "Request viewing" / "Request inspection" (both sign in first), where the web says "Sign in to enquire" / "Sign in to make an offer".

## M6 status (2026-11-11)

**Map-area search (backend, additive, no migration):**

- `GET /rentals`, `/marketplace/listings`, `/shortlets` and `/land` take an optional map area: `minLat`, `minLng`, `maxLat`, `maxLng`.
  - All four bounds or none. Out-of-range values are clamped to the world; a box whose minimum isn't below its maximum gets a 400.
  - Listings without coordinates are left out of area results.
  - **Privacy:** an area matches on the point the map shows, not the stored one. Unverified rentals, sales and land show a point blurred by 250 to 500 m, and shortlets are always blurred. Matching on the real point would let someone shrink the box until a listing drops out and so find its door.
  - Plain range filters on the existing `Float` columns, padded by the 500 m blur, then checked in code against the shown point. At most 500 candidates per request; zooming in shows the rest.
- The public list responses already carried `latitude`, `longitude` and `locationPrecision` wherever the location is public. Nothing new is exposed.

**Similar listings (backend):**

- `GET /rentals/:id/similar`, `/marketplace/listings/:id/similar`, `/shortlets/:id/similar` and `/land/listings/:id/similar`, with `limit` from 1 to 12 (default 6).
- **Rules:**
  - Same market, in the same city or within 15 km.
  - Price within 2 times either way (`SIMILAR_PRICE_FACTOR`; 1.6 until the 2026-11-11 decision): rent per year, sale and land on the asking price, shortlets on the nightly rate.
  - At most one bedroom apart.
  - Land matches land.
- Best match first: distance rounded to the kilometre, then price, then bedrooms.
- They replace the browser-side guesses: `SimilarListings` asked the list endpoint with a ±30% price filter, and the renter `SimilarProperties` fetched 100 listings.

**Web:**

- `/rent`, `/buy`, `/shortlets` and `/land` have a Grid / Map switch.
  - **Map view:**
    - map-variant `ListingCard`s beside the map (below it on phones), with price pins;
    - pins for approximate locations are dashed, and selecting one draws the 600 m area;
    - after the map is moved, a "Search this area" button appears; the searched box is drawn and can be cleared.
  - Hovering or focusing a card highlights its pin. Choosing a pin selects and scrolls to its card.
- **URL state:** filters, sort, page, view, map area and the selected pin live in the URL (`?view=map&area=…&selected=…`), so a search can be shared or reloaded.
- **Loading:** Leaflet loads only when the map view opens (`next/dynamic`). The list renders first and stays usable if the map is slow or fails.
- **Similar listings:** detail pages for rent, sale, land and shortlets (new on land and shortlets) and the signed-in renter page all use the new endpoints.
- **Analytics:** `property_impression` and `property_card_click` fire with surfaces `{market}_map` and `{market}_similar`. No new event names.

**Checks:**

- Backend: 77 specs across `map-area`, `similar-listings`, `map-area-browse` and the existing browse specs, plus the touched service specs. `tsc -p tsconfig.build.json` is clean.
  - 2 failures in `shortlet.service.spec` (availability) also fail on `origin/dev` without this change.
- Web: `tsc` and eslint are clean on the changed files; `audit:ui-controls` and `tokens:check` pass. Not yet checked in the browser.

**Not done:**

- **Freehand drawn areas:** built after the 2026-11-11 decision approved leaflet-draw; see below.
- **Mobile:** belongs to M5.

### Collections: a product decision (decided and built 2026-11-11, see below)

There is no data source for curated collections; the only related field is `Listing.isFeatured`, an admin flag on rentals with no title or grouping. So nothing was invented. Building collections needs these decisions:

1. **Who curates:**
   - Sureground staff in the backoffice (needs a permission such as `collections.manage`), or
   - estates, agencies and realtors for their own stock, or both.
   - Staff curation across owners needs a rule on consent and fair placement.
2. **Data model, a proposal:**
   - `Collection` (id, slug, title, description, cover media, market, curator type and id, status draft/published/archived, `publishedAt`, optional `startsAt` and `endsAt`)
   - `CollectionItem` (collectionId, listingId, position, note, addedBy, addedAt)
   - Items show only while the listing is still public. A rule-based collection (for example "verified 2-beds in Yaba under ₦3M") could store a saved filter instead of items.
3. **Honesty rules:**
   - a collection never implies verification or a ranking the backend didn't make;
   - sponsored placement, if ever allowed, is labelled.
4. **Where they show:** the market landing pages, estate storefronts, and a `/collections/[slug]` page with its own metadata.

## Owner decisions and what was built (2026-11-11)

Three decisions from the product owner, built on `feat/showroom-collections` in both repos.

### 1. Similar listings: a wider price band

- The price band is now **2 times either way**, up from 1.6. It is the named constant `SIMILAR_PRICE_FACTOR` in `src/shared/listings/similar-listings.ts`.
- Unchanged: within 15 km or the same city, at most one bedroom apart, land matches land.
- The spec now tests the edges at 2x (₦1.5M and ₦6M around ₦3M in; ₦1.4M and ₦6.1M out).

### 2. Drawn search areas (leaflet-draw approved)

**Backend (additive, no migration):**

- `GET /rentals`, `/marketplace/listings`, `/shortlets` and `/land` take an optional `polygon`: flat `lat,lng,lat,lng,...` pairs.
  - 3 to 50 points. A repeated closing point and consecutive duplicates are dropped; coordinates are clamped to the world.
  - Refused with a 400: anything that is not a plain number (no exponents, words or empty parts), an odd count, more than 50 points, a shape with no size (all points on one line), text over 2,000 characters.
  - No self-intersection check, as decided.
  - **Any of the four bounds together with `polygon` is a 400.**
- **Matching:** the database prefilter is the polygon's bounding box padded by the 500 m blur. Then a point-in-polygon check runs on the same displayed (blurred) point M6 uses, so drawing a tight shape cannot reveal an unverified listing's door.

**Web:**

- `leaflet-draw@1.0.4` with `@types/leaflet-draw@1.0.13`, pinned. It is imported inside `DiscoveryMap`, which only loads through `next/dynamic` when the map view opens, so it is never in the first bundle.
- The map has **Draw area** (polygon), **Draw box** (rectangle) and, while an area is searched, **Clear area**. While drawing, a hint and **Cancel drawing** show. Our buttons replace leaflet-draw's own toolbar.
- The shape stays in the URL: `area=` holds four numbers for a box or six or more (`lat,lng` pairs, 5 decimals) for a drawn shape. A shape with more than 50 corners is thinned evenly before it is sent.
- The drawn shape is drawn back on the map, dashed like the M6 box.
- Keyboard users keep **Search this area**; drawing itself needs a pointer.
- `showArea` is off: leaflet-draw 1.0.4 throws while measuring area on Leaflet 1.9.

### 3. Collections: both curator types

**Data model** (migration `prisma/migrations/20261111180000_showroom_collections/migration.sql`, hand-written, additive, **not run**):

- `Collection`: slug (fixed at creation), title, description, market (`RENT`, `SALE`, `SHORTLET`, `LAND`), `curatorType` (`STAFF`, `ESTATE`, `AGENCY`, `REALTOR`) and `curatorId`, status (draft, published, archived), `sponsored`, `coverListingId`, `publishedAt`, optional `startsAt` and `endsAt`, `createdById`.
- `CollectionItem`: position, note, `addedBy`, `addedAt`; unique per collection and listing; removed with its listing.
- **Cover:** a chosen item's photo rather than an uploaded image, so there is no new upload path and the photo link is signed like any card's. With no choice, the first item still public is the cover.

**Who curates:**

- **Staff**, in the backoffice, across all owners, behind the new permission **`collections.manage`** (Super admin and Backoffice admin have it).
- **Estates, agencies and realtors**, from their own stock only. Checked on the server every time items are saved:
  - estate: listings on properties in the estate (`Property.estateId`, set only once the owner agreed to the estate marketing it, so the same set the storefront shows);
  - agency: properties the firm holds, or holds an active mandate over whose scope includes listing (not `FINANCE`);
  - realtor: properties they own or hold a live `canList` grant for.
  - Staff editing someone else's collection are held to that curator's stock too.
- Every item must also be in the collection's market ("sale" means buildings; land is its own market).

**Honesty rules, enforced on the server:**

- Titles, descriptions and notes may not claim a check or a ranking: "verified", "vetted", "certified", "guaranteed", "best", "top 10", "#1", "ranked" and similar are refused with a reason. Each card still shows its own verification flag from the backend.
- Public lists are newest first only, never ranked.
- `sponsored` can only be set by staff, and only on a Sureground collection. Staff can clear it on anyone's.
- Wherever a collection shows (strip tile, collection page and its title metadata, dashboards), a sponsored one carries **Sponsored**.
- Items show only while their listing is still public (the same predicate each market's browse uses). A collection with nothing left to show is hidden, and its page is a 404.

**Endpoints:**

- Public:
  - `GET /collections?market=rent|sale|shortlet|land&estate=<storefront slug>&limit=1..12`: published and inside the optional window.
  - `GET /collections/:slug`: the collection with its still-public items, each as the market's own public card.
- Staff (`collections.manage`): `/admin/collections`, with `GET`, `POST`, `GET :id`, `PATCH :id`, `PUT :id/items`, `POST :id/publish`, `POST :id/archive` and `GET candidates?market=&search=`.
- Curators, the same shape:
  - estate: `/estates/:estateId/collections` (estate managers of that estate);
  - agency: `/agency/collections` (owner, staff, portfolio manager and leasing agent seats);
  - realtor: `/realtor/collections` (realtor role).
- Every change is audit-logged (`COLLECTION_CREATED`, `_UPDATED`, `_ITEMS_SET`, `_PUBLISHED`, `_ARCHIVED`).

**Web:**

- `/collections/[slug]`: its own title, description, canonical URL and Open Graph image. M3 `ListingCard`s in the curator's order, with the curator's note on each, who picked it, the Sponsored label, and a line that a collection is not a ranking or a check.
- A collections strip on `/rent`, `/buy`, `/shortlets` and `/land` below the heading, shown only when published collections exist (hidden when the browse is scoped to an estate).
- Estate storefronts (`/e/[slug]`) show the estate's own collections.
- Curator editor (a list plus an editor: details, add from own live listings, reorder with up and down buttons, notes, cover, publish, archive):
  - estate: `/estate/collections` (sidebar);
  - agency: `/agency/collections` (link in the agency bar);
  - realtor: `/realtor/collections` (sidebar).
- Backoffice: `/admin/showroom-collections` (sidebar, `collections.manage`), the same editor plus the Sponsored switch and the curator of each collection.
- **Analytics:** `property_impression` and `property_card_click` with surface `{market}_collection`. No new event names.

**Product decisions still open:**

- **Consent for staff curation across owners:** staff can feature any public listing. The plan asked for a rule on consent and fair placement; none is enforced beyond the listing being public.
- **Realtor display name:** a realtor's collections show their company name, or their legal name when they have none.
- **The honesty word list** is deliberately strict ("best" and "inspected" are refused); loosen it if curators find it in the way.
- **Rule-based collections** (a saved filter instead of items) are not built.
- **Sponsored:** there is no billing or contract record behind the flag; it is a label only.

**Checks:**

- Backend: see the PR for spec counts; `tsc -p tsconfig.build.json` and eslint on changed files are clean. The app wiring spec resolves every provider (run with `PAYMENTS_SIMULATED=true`, as there is no `.env` in a worktree).
- Web and backoffice: `tsc` and eslint clean on changed files; `audit:ui-controls` and `tokens:check` pass. Not yet checked in a browser, including drawing on a touch screen.


## M7 status (2026-11-11)

M7 is built: resized copies (earlier, backend #136), the CDN, blurred placeholders with photo sizes, and upload progress.

**CDN (backend #151):** listing photos and their resized copies are served from `PUBLIC_MEDIA_CDN_URL` on public listing responses only. Everything else keeps signed links. The boundary is `src/shared/media/public-media-cdn.ts`.

**Blurred placeholders and sizes (backend, on `feat/showroom-m7-placeholders`):**

- When the resized copies are made, a 16px blurred WebP is made too and stored as a `data:` URI on `ImageVariantSet.placeholder`. A typical one is about 130 characters; anything over 1 KB is dropped.
- Migration `prisma/migrations/20261111200000_image_variant_placeholder/migration.sql`: one nullable column, hand-written, additive, **not run**. Deploy it before the code: until it exists, photo lookups fail softly and pages fall back to the original photos.
- The API sends (all optional):
  - on each image in `media`: `width`, `height` (already there) and the new `placeholder`;
  - on rent, sale, land and shortlet list cards: `imagePreview { width, height, placeholder? }` for the cover.
- `npm run media:backfill-variants` now also fills placeholders. Photos with all their copies but no placeholder only get the placeholder; their copies are not rewritten. Re-running is safe. Use `--dry-run` first to see the counts.

**Web:**

- `ProgressiveImg` in `@sureground/ui` shows the placeholder behind a photo and fades the photo in once it loads. No fade with reduced motion. The server HTML keeps the photo visible, so nothing depends on JavaScript.
- Used on listing cards (rent, buy, land, shortlets, similar, collections), the mosaic and phone strip, and viewer thumbnails. The full-screen viewer draws the placeholder where the photo will sit. Unloaded phone slides and thumbnails show it too.
- Cards use the cover's real size for the image's `width` and `height`; their box stays 4:3.
- Land and shortlet browse cards now also use the resized copies (`srcset`); they were missing them.
- Only an inline base64 image is accepted as a placeholder (`placeholderOf`). Without one, or with an older API, every image renders exactly as before.

**Mobile:** expo-image `placeholder` on the showroom hero, the viewer and its thumbnails. The hero's fade now respects reduced motion.

**Upload progress (web):**

- Landlord and owner photo editors (`PropertyPhotoEditor`) upload each photo as soon as it is added, instead of all at once on Save. Each photo shows a bar with its percent and Cancel; then "Processing" until the server answers.
- A failed photo shows "Upload failed" with the reason, Retry and Remove. The others carry on. Save waits until every photo is in.
- Estate listing photos (`ListingMediaPanel`) send one photo per request, in turn, with a row per file: progress, Cancel, and Retry when one fails. One at a time because the server checks the 12-photo limit before it adds.
- Uploads go over XHR (`authUpload` in `@sureground/shared`) for progress events. The API contract is unchanged; uploads are multipart posts to the API, not presigned URLs.

**Follow-ups:**

- Mobile listing photo upload (landlord property screen) sends one photo at a time over fetch, with no progress. Adding it needs an XHR upload in the mobile client.
- Video tour uploads still show only a spinner.
- Photos closed without saving after uploading are left to the backend's clean-up of unattached uploads, as before.

**Checks:** backend: the media specs and the rent, sale, land and shortlet service specs pass (227 tests) after merging `dev`; `tsc -p tsconfig.build.json` and eslint on changed files clean. Web: `tsc` clean in web and mobile, eslint clean on changed files, shared tests 25 pass, `audit:ui-controls` and `tokens:check` pass. Not yet checked in a browser.
