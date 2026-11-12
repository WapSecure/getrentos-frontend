# M8 plan: floor plans, commercial and off-plan (2026-11-11)

This is groundwork for showroom milestone M8 (see [PLAN.md](PLAN.md)). It was written from backend `dev` @ `09473963`. Nothing here is built yet.

## What exists today

| Area                      | In the data                                                                                                                               | Gap                                                                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Floor plans               | Photos can be tagged `floor_plan` (M2 room tags in `Property.mediaDetails` / `Listing.mediaDetails`), so floor plans exist only as images | No levels, room names or sizes, no link from a room on the plan to its photos, no "measured or estimated" flag                                                    |
| Commercial                | `PropertyType.COMMERCIAL`, `ManagedPropertyClass.COMMERCIAL`; rentals already carry service charge, agency and legal fees (M2)            | No permitted use, floor area by floor, fit-out condition, parking, power (grid hours, generator, solar), loading, lease structure (term, rent review, escalation) |
| Off-plan and developments | Land layouts (`LandLayout`) and land conveyance milestones only                                                                           | No development, developer, construction stage, expected completion, approvals, progress media or payment plan                                                     |

## Proposed scope, in order of value and size

### M8a: floor plans, using the data we have (small, no migration)

- A "Floor plans" tab in the media viewer and mosaic, on web and mobile, showing every photo tagged `floor_plan`, with its caption as the level name ("Ground floor", "First floor").
- Level arrows when there is more than one plan.
- Listers already tag a photo "Floor plan" in the photo editor, so this needs no new capture.
- Not interactive. Nothing claims dimensions.

### M8b: structured floor plans (medium, migration)

- An optional `FloorPlan` per level: level name, plan image key, and rooms (name, optional width × length in metres, optional link to a photo key).
- Every measurement carries `measured` or `estimated`, shown on the page. A "Verified measurements" label only appears when a staff check is recorded.
- Viewer: tapping a room on the plan opens its photos.

### M8c: commercial listings (medium, migration)

- `CommercialDetails` on a listing:
  - permitted use (shop, office, warehouse, mixed)
  - lettable area (m²)
  - fit-out condition (shell, semi-fitted, fitted)
  - parking spaces
  - power (public supply hours stated by the lister, generator, solar)
  - loading access
  - lease term options
  - rent review and escalation
- A commercial journey on the showroom page: lease structure first, operational facts, then inspection and enquiry. The landlord and agency listing forms gain these fields.

### M8d: off-plan and developments (large, migrations and policy)

- A `Development` with:
  - verified developer (a business verification, not self-declared)
  - location, stage (planned, approved, under construction, completed)
  - expected completion
  - approvals with their documents
  - unit types
  - a progress gallery with capture dates
  - a payment plan (instalments)
- Units are listings linked to the development.
- Payments for off-plan purchases would need escrow-style milestone release, which is the payments programme's decision, not the showroom's.

## Decisions needed from the product owner

1. **Order:** I recommend M8a now (no data change), then M8c (commercial), then M8b, and M8d last, because it carries legal and payment risk.
2. **Floor-plan measurements:** do listers' measurements count as "estimated" until staff check them, or do we never show sizes without a check?
3. **Commercial fields:** confirm the list above, and whether commercial lets use the same fees model as residential (service charge, agency, legal).
4. **Off-plan:**
   - Will Sureground hold off-plan purchase money and release it against construction milestones (the same model as land milestones), or only list developments and leave payment to the developer?
   - Which developer verification is required before a development can go live?
5. **3D tours:** still only from real scan data (Matterport or similar embeds), never generated from photos.

## Decided (product owner, 2026-11-11, on the recommendations)

1. **Order:**
   - M8a: a floor-plans tab from photos already tagged, right after M7.
   - M8c: commercial listings.
   - M8b: structured floor plans.
   - M8d: off-plan, last.
2. **Floor-plan sizes:** listers' measurements are shown labelled "Estimated". After a staff check, the label reads "Measured, checked by Sureground". Sizes are never shown without one of the two labels.
3. **Commercial:** the field list above stands. Commercial lets use the residential fee lines (service charge, agency, legal) plus a VAT line. The VAT line shows only what the landlord states and is never computed by Sureground.
4. **Off-plan:**
   - First step: list developments only. Payment stays with the developer, and the page says so plainly, along with what was and was not checked.
   - Later step: Sureground holds the money and releases it against construction milestones, as with land. This needs the legal opinion and the client-money trustee question (D-1) answered first.
   - A development goes live only after staff check:
     - the developer's CAC registration, through the existing business verification
     - the directors' identities
     - the title to the site (C of O or Governor's consent, the same checks as a land listing)
     - the building plan approval (in Lagos, the LASPPPA permit)

## M8a status (2026-11-11)

Built on the web and in the mobile app from photos already tagged "Floor plan". No data change, no migration.

**Shared (`@sureground/shared/showroom`):**

- `floorPlanLevels(media)`: every photo tagged `floor_plan`, in order, named by its caption exactly as the lister wrote it ("Ground floor"). Without a caption: "Floor plan", or "Floor plan 1", "Floor plan 2" when there are several. Captions are never parsed, so numbers in one are shown as written.
- `heroPhotos(media)`: photos for a hero or mosaic, with floor plans after every other photo. A plan leads only when the listing has nothing else.
- The listing's `images` (share and search image) use the same order, so a plan is never the preview either. The viewer keeps the lister's order.

**Web:**

- **Mosaic:** the cover and first tiles come from photos that are not plans. A plan that does reach a tile, or the phone strip, is shown whole on white. The room shortcuts under the mosaic show "Floor plans" whenever a plan exists, even if it is the only tagged room.
- **Showroom page:** a "Floor plan" or "Floor plans (n)" button next to the key facts opens the viewer on the first plan. The viewer is shared with the mosaic through a small client context (`ShowroomGallery`).
- **Viewer:**
  - The room rail (wide screens) has a "Floor plans" entry; narrower screens get a "Floor plans" button in the header.
  - A plan sits on a white stage with `contain` fit; zoom, pinch and pan work as on photos.
  - With more than one plan, level chips with previous and next level arrows sit over the plan.
  - The level name replaces the room name on the plan, and thumbnails of plans are not cropped.

**Mobile:**

- **Hero:** plans come after the other photos, show whole on white, and are named by level. A "Floor plans" pill opens the viewer on the first plan.
- **Viewer:** the "Floor plans" room chip shows whenever a plan exists. Plan pages are white with `contain` fit and keep pinch and double-tap zoom. More than one plan adds level chips with previous and next arrows, and plan thumbnails are not cropped.

**Honesty:** no dimensions or measurements anywhere; a plan is only an image.

**Analytics:** no new event names. Opening floor plans (shortcut, rail, chip, header button or hero pill) sends `media_category_select` with room `floor_plan`, and `gallery_open` when it opens the viewer. Moving between levels sends nothing.

**Checks:** `tsc --noEmit` clean in apps/web, apps/mobile, packages/ui and packages/shared; eslint clean on changed files; shared tests 32 pass after merging `dev` (3 new: levels and captions as written, fallback names, the cover never a plan); `audit:ui-controls` and `tokens:check` pass. Not checked in a browser or on a device.

**Demo data:** no seed listing has a photo tagged `floor_plan`, and none was added to the shared database. A browser check needs one listing with one or two floor-plan photos (for example captioned "Ground floor" and "First floor"), tagged in the landlord or owner photo editor.

**Card covers (backend #167, merged):** rent, sale, land, shortlet and microsite cards skip a cover tagged `floor_plan` while the listing has another photo, so collections and similar listings do too. A plan is the cover only when every photo is a plan.

**Browser check (2026-11-11):** passed. Two test plans ("Ground floor", "First floor") were put on the seed Ikoyi house for the check and then removed; Ikoyi is back as it was. No seed listing keeps a floor plan.

**Follow-up (web viewer):** the level chips sit over the top edge of the plan and partly cover the drawing's own title. Add top padding to the stage when a plan has level chips.

## M8d decisions (product owner, 2026-11-12, on the recommendations)

Step one ("list developments only") is built: backend #200, web and backoffice #169. Checked in the browser with a labelled test development, "Palm Court Residences (test)", by "QA Fixture Agency Ltd (test)": four staff checks passed with step-up, put live, public page shown.

1. **No separate developer business type for now.** A developer signs up through the existing firm onboarding, because the CAC business check is the same. Revisit when developer-only features arrive (milestone-held payments), and then add a "Property developer" type to the firm profile rather than a new onboarding.
2. **Directors' identities stay a staff check** (each director's ID against the person named and the CAC record), with no automated check per director in this step. Add an automated NIN check per director once the identity provider is wired for third parties; until then the public page says only that staff checked them.
3. **Title and permit numbers stay off the public page.** The page says what was checked and when; the documents and numbers stay private, because published numbers help forgers and do not help buyers without a registry search of their own.
4. **The developer's own sales contact stays for step one**, since Sureground is not a party to the sale. Follow-up: a signed-in "Ask the developer" enquiry (the same sign-in rule as other enquiries, decided 2026-11-10), so enquiries are recorded and a developer who never answers can be followed up.

Follow-ups: mobile pages, developments in search, sitemap and main navigation, linking units to real listings, development photos on the CDN, the enquiry above, and the automated director check above.

## Mobile parity for M8c and M8d step one (2026-11-12)

**Commercial (M8c):** the form model (`commercialForm.ts`) and the page rows (`commercialRows.ts`) moved from apps/web/lib into `@sureground/shared/showroom`, so the web and the app use the same fields, limits, payloads and messages; the web's `lib/commercialDetails.ts` and `lib/commercialShowroom.ts` now re-export them.

- Listing forms: the landlord "List a unit" sheet, the owner "List for sale" sheet and the realtor new-listing screen add the optional commercial block when the property type is COMMERCIAL. Landlord listings, the owner's property page and the realtor listing actions add "Add commercial details" or "Edit commercial details" on commercial listings (PATCH `/…/listings/:id/commercial`, null clears a field).
- Listing screens: the public market listing, the renter listing and the buyer listing show "Lease and terms", "The space" and "Running the business" before the description. VAT is shown only as stated; the costs card says Sureground does not add VAT to these amounts.

**Developments (M8d step one):** a "Developments" tab on the signed-out market home lists live developments, and `/(market)/development/[id]` shows one, with the shared mapper and copy from `developments.ts`: hero and viewer, "Four staff checks passed", stage and expected completion as the developer states them, unit types, "How payment works", instalments as stated, dated progress photos, approvals "Checked by Sureground on <date>", "What we checked" and "What we did not check", and the developer's sales phone and email (tap to call or email). No enquiry button yet ("Ask the developer" is a separate branch).

**Not done:** `/developments` links are not claimed as app links, so a shared link opens the website; signed-in users do not reach the market tab (as for the other public markets).
