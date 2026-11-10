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
- **Found, not yet fixed: expired photo links on cached pages.**
  - Listing pages are cached for 60 seconds, and Next serves a stale copy once while it refreshes.
  - Photo URLs are signed for 15 minutes.
  - So the first visitor after more than 15 minutes without traffic gets dead photo links until they reload.
  - Proposed fix:
    - sign public listing photos for longer (for example 2 hours);
    - cap how stale a cached page may be (Next `expireTime`) below that, so an older copy is rebuilt rather than served.
