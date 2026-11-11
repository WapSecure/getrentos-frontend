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
