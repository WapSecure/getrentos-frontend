# Property discovery and showroom: audit (2026-11-10)

This audit comes before any change, as section 2 of the brief asks. It covers getrentosFE (web, mobile, backoffice, packages) and getrentos-backend at dev `5b6acb09`.

## What exists today

| Area                       | Web                                                                                                                                                 | Mobile                                                                         | Backend                                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Browse rent / buy          | `/rent`, `/buy`: `market/PublicMarketBrowser.tsx`. Server-rendered, filters, sort, compare up to 3                                                  | `(renter)/discover`, `(buyer)/discover`, list or map                           | `GET /rentals`, `GET /marketplace/listings`. Text location only                                          |
| Browse shortlets           | `/shortlets`: `shortlet/ShortletMarketplaceBrowser.tsx`                                                                                             | `shortlets.tsx`                                                                | `GET /shortlets`. Dates, guests, amenities, power, pets                                                  |
| Browse land                | `/land`: `land/LandMarketplaceBrowser.tsx`. Layouts, market insights                                                                                | `land.tsx`                                                                     | `GET /land`, layouts, comparables, insights                                                              |
| Logged-in renter discovery | `/renter/discover`: plain-language search, map, compare drawer, recommendations, recently viewed, saved-search alerts                               | partial                                                                        | `POST /renter/listings/search/parse` (AI, falls back to rules), recommendations (rules), saved searches  |
| Detail: rent / sale / land | `market/PublicListingPage.tsx`. Cover plus 4 thumbnails, facts, amenities, price aside, similar listings, sticky call to action                     | `property/[id]`, `buyer-listing/[id]`, `land-listing/[id]`, `(market)/listing` | `GET /rentals/:id`, `/marketplace/listings/:id`, `/land/listings/:id`                                    |
| Detail: rent, logged in    | `/renter/properties/[id]`. Geo insights, commute, neighbourhood compare, listing check, affordability, trust chain, reviews, apply, viewing         | yes                                                                            | renter endpoints                                                                                         |
| Detail: shortlet           | `shortlet/ShortletListingDetail.tsx`. Photos / video / 360 tabs, house rules, utilities, reviews, fees, booking                                     | `shortlet/[id]`                                                                | availability and quote are public; booking needs sign-in                                                 |
| Video                      | `<video>` and YouTube/Vimeo through `videoSource()`                                                                                                 | expo-video                                                                     | Mux HLS with poster, "Filmed on site" proof                                                              |
| 360 tours                  | iframe through `tourSource()` (Matterport, Kuula, CloudPano, Theasys, Momento360), shortlets only                                                   | same                                                                           | `ShortletListing.tourUrl` only                                                                           |
| Maps and neighbourhood     | Leaflet with Mapbox tiles. `PropertyMap`, `GeoInsightsPanel` (amenities within 2 km, travel times, walkability), parcel boundaries                  | WebView map                                                                    | `geo-insights` from OpenStreetMap or Google, cached 7 days; approximate location for unverified listings |
| Trust                      | `TrustChainBadge`, verified badges, `ListingCheckCard` (signed in), land assurance tiers                                                            | `ListingCheckCard`, `FilmedOnSite`                                             | trust chain, listing check (code decides, AI only words it), land due diligence                          |
| Conversion                 | enquire, apply, viewing (in person or video), offer, book, save, compare                                                                            | same plus native share                                                         | every enquiry, viewing, application, offer and booking needs sign-in                                     |
| Design system              | `@sureground/ui` (Card, Dialog, PageHeader…), framer-motion with global `MotionConfig reducedMotion="user"`, Manrope, token radius and shadow scale | `ui-native` PropertyCard, PressableScale                                       |                                                                                                          |

## Gaps that matter for the brief

**Facts the showroom needs but the data doesn't hold**

- **Rental fees:** no service charge, agency, legal or caution fee anywhere. A true "total move-in cost" (6.1) is impossible until these fields exist.
- **Photo details:** no caption, room tag, sort field, focal point or size. Media cannot be grouped into "Kitchen, Bedrooms…" (5.2) without capture.
- **Floor plans:** none anywhere, capture or display (5.4).
- **Tour links:** a 360 tour link exists for shortlets only. Rentals and sales have none (5.3).
- **Commercial:** no permitted use, fit-out, parking or lease structure (6.4). "Commercial" is only a property type.
- **Off-plan developments:** no model. Land layouts with plots and payment plans are the closest thing (6.5).
- **Floor area:** `Property.size` has no unit, and units have no area at all.

**Facts held but not shown**

- The public rental endpoint drops deposit, minimum lease, furnished, pets, available-until and property type. They are stored.
- Geo insights, the listing check and the trust chain are shown only to signed-in renters, though the sales geo endpoint is already public.

**Discovery**

- No map-area or radius search. Location is a text match on city and state.
- The public `/rent` and `/buy` pages have no map at all.
- No "similar listings" endpoint except land comparables. `SimilarProperties` fetches 100 listings and filters them in the browser.

**Conversion**

- No enquiry without an account.
- No share button on web detail pages.
- The compare button on `/renter/properties/[id]` only shows a toast.

**Media display**

- No lightbox, fullscreen, zoom or swipe on web; galleries are thumbnail switchers.
- On mobile the gallery is horizontal paging only.
- No blur placeholders. Images use plain `<img>` because storage links are signed and expire after 15 minutes.
- No CDN and no resized versions, so phones download full-size originals.

**Measurement**

- Rental and sale views, saves and enquiries are not tracked. `viewCount` only rises for land.
- No conversion baseline exists to show the redesign worked.

## Duplication to fold in, not add to

- **8 listing cards** with no shared base, including two different components named `ListingCard`.
- **4 save systems**, one per audience, each with its own endpoint.
- **3 compare features:** the public dialog, `DiscoverCompareDrawer`, and the toast-only button.
- **2 rent detail pages** (public and signed in) with different features.
- **2 near-identical `RecentlyViewed` components.**
- **Large files:** `HostShortletWorkspace` 1,282 lines, `ShortletListingDetail` 786, `PublicMarketBrowser` 618.

## 3D and WebGL

There is no source material: no 360 photos, scans or floor plans are captured anywhere except shortlet tour links. Adding Three.js or React Three Fiber now would show ordinary photos as fake 3D, which the brief rules out (5.3). Recommended:

- Embed the tour providers we already allow, for every listing type.
- Revisit WebGL only once listings actually carry 360 or scan data.

## Tests and constraints

- **Unit tests:** apps/web has none.
- **Playwright:** covers `/`, `/rent`, `/buy` and `/renter/discover` visually. No detail page or shortlet/land page is covered.
- **CI:** blocked by GitHub billing.
- **Feature gates:** there is no general feature-flag system. `LAND_MODE`, plan gates and `EstateFeatureGate` are the existing ones.
- **Design rules:**
  - Apple-HIG design system, brand through tokens only, no AI look.
  - Reuse `@sureground/ui`.
  - New tables use `DataTable`.
