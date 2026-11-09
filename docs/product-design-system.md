# Sureground interface direction

Apple's [typography](https://developer.apple.com/design/human-interface-guidelines/typography),
[layout](https://developer.apple.com/design/human-interface-guidelines/layout), and
[materials](https://developer.apple.com/design/human-interface-guidelines/materials)
guidance inform this system. Sureground retains its name, mark, and property workflows.
Use platform conventions where they help people complete a task; the website does
not need to imitate an operating system.

## Foundations

- Neutral canvas, opaque working surfaces, one blue action color. Status colors
  communicate a state, rather than distinguishing arbitrary dashboard categories.
- System fonts: the platform's installed UI font, without bundling Apple's fonts.
  Native body text starts at 17 with platform text scaling. Browser body text is
  16; dense controls and tables use 13–14 with adequate line height.
- A page has one clear title, a short useful description, and one primary action.
  Use `PageHeader`, including on dashboards; avoid boxed promotional banners and
  all-caps category pills on working screens.
- Cards use 20px corners, controls 12px, dialogs 28px. Use the shared components
  and spacing scale instead of introducing competing treatments.
- Shadows explain elevation. Cards stay subtle; menus and dialogs sit above them.
  Translucency belongs to navigation, with opaque fallbacks for reduced
  transparency, increased contrast, and browsers without backdrop filtering.
- Default browser buttons and inputs have at least 44px height. Compact sizes
  remain available for dense contexts; native buttons retain 44–56px targets.
- Every control needs a keyboard path, visible focus, and a useful accessible
  name. Reduced motion must also cover JavaScript animations, not only CSS.

## Icons

Sureground draws its own icons (`packages/icons`, `@sureground/icons` on web and
`@sureground/icons/native` on mobile). Lucide is no longer used and lint rejects it.

- 24px grid, 1.75 stroke, round caps. One tinted body per icon (16% of the icon
  colour), so an icon takes the colour of whatever it sits on.
- Signature details: arrows trail a pixel and a dash (data on the move); container
  circles are live rings with a gap and diamond at the upper right; box shapes have
  their top-right corner cut at 45 degrees; small live details are square pixels.
- Names match the Lucide names screens already used (`ArrowRight`, `ShieldCheck`,
  `CheckCircle2`, ...). The component type is `SgIcon` (props `SgIconProps`).
- Props: `size`, `color`, `strokeWidth`, `absoluteStrokeWidth`, `fill` (a colour
  paints the body solid, e.g. a saved heart), `tint` (body opacity).
- A branch that still imports Lucide after rebasing runs `pnpm icons:migrate`;
  `pnpm icons:check` fails while any Lucide import is left.
- A missing icon is drawn in the same style and added to the set; do not pull in
  another icon library. The set is naira-only: there are no dollar icons; use
  `NairaSign` (web and native) for the naira mark.

## Shared source and checks

`packages/tokens/src/index.ts` owns both palettes and corner sizes. `pnpm tokens:sync`
generates `packages/ui/src/styles/theme.css`; `pnpm tokens:check` detects drift.
Check in both files. Web and backoffice import the same UI stylesheet; native uses
the tokens through its theme provider. Do not edit the generated stylesheet by hand.

The native contrast suite checks text and filled action pairs in both themes:

```sh
pnpm tokens:check
pnpm --filter mobile test:ci --runTestsByPath __tests__/theme-contrast.test.ts
pnpm test:e2e:design
```

The design browser suite runs actual protected layouts against isolated read-only
API fixtures, using separate local ports. It covers the portfolio dashboard,
empty portfolio, property cards, action menu, add-property dialog, and backoffice
user table at desktop and phone sizes in both themes. Screenshots and accessibility
reports live under `test-results/design-system`. These checks complement the
integrated visual QA suite; fixtures do not prove backend persistence or payments.

## Adoption and remaining screen reviews

Shared colors, system typography, radii, buttons, forms, cards, tables, empty states,
menus, and dialogs reach all consumers. Shared persona navigation and backoffice
navigation have the same selection treatment; portal top bars share one material.
Renter page headers and the backoffice user directory use the common hierarchy.
The landlord dashboard and property card provide complete composition examples.

This is the shared foundation and first screen group, not a claim that every
bespoke page or native device layout has had a visual review. Continue the same
review through these groups, preserving all existing permissions and save guards:

1. Marketplace search, listing details, saved properties, and enquiries.
2. Applications, leases, handover, rent payments, receipts, and disputes.
3. Owner, buyer, realtor, and agency dashboards and detail workflows.
4. Estate, resident, gate, and agent field workflows.
5. Backoffice queues, reviews, finance, access management, and reporting.
6. Native screens on iOS and Android, including large text and the keyboard.

For each group check populated, loading, empty, error, menu, and dialog states at
390px and desktop widths, in both themes. Review screenshots by eye as well as
running automated checks. Prefer clear content and helpful next actions over
decorative panels or invented metrics.

## Cross-check log

### 2026-11-03 — heading hierarchy on the landlord dashboard

`0a7f4832` promoted the activity feed from `h3` to `h2` but left quick actions at
`h3`, so three sibling cards in one grid announced two `h2`s and an `h3`.
`LandlordQuickActions` now passes `<CardTitle as="h2">`; `CardTitle` already
supported the `as` prop, so nothing new was needed in the primitive. Live outline:

```
h1  Good morning, <name>
h2  Rent collection
h2  Recent activity
h2  Quick actions
```

Two open items this pass did not cover:

- **Landlord mobile menu overlaps the navbar.** `LandlordNavbar` renders its
  panel as a sibling with `fixed top-16`, but below `md` the bar grows to ~133px
  for the mobile search row, so the open menu covers it by 69px. The fix is to
  render the panel inside `<nav>` as `absolute top-full` (a sticky element is a
  positioned ancestor) rather than hard-coding a taller `top-*`.
- **Theme toggle is off-token.** The navbar toggle still uses
  `bg-gray-200 dark:bg-white/10` instead of a token pair.

For the record, so it is not regressed: the dark palette is `#000` / `#1c1c1e` /
`#2c2c2e`. A revision in between used `#111113` as the canvas, which sits between
Apple's first two rungs and leaves cards only ~11 steps above the page — the whole
surface reads flat. Keep the canvas at system background.

### 2026-11-03 — renter section headings skipped a level

Four renter routes had no `h2` anywhere in the main region: their section titles
were `CardTitle` (defaults to `h3`) or hand-rolled `<h3>` sitting directly under
the page `h1`, so the outline went `h1 → h3` on every one of them.
`/renter/dashboard` and the landlord pages were fine because they already had
real `h2`s.

Promoted the page-level section titles to `h2`, and demoted the item headings
that sit inside them so nothing skips:

- **applications** — Status summary
- **payments** — Payment History, Receipts Gallery, Upcoming Payments, Payment
  Methods, AutoPay, Payment Analytics
- **saved** — Wishlists, Saved Searches, Recommendations (recommendation item
  titles are `h3` now)
- **maintenance** — Maintenance Requests, Quick Report, Maintenance Analytics,
  Maintenance Checklist, Scheduled Maintenance, Emergency Contacts (emergency
  contact names and maintenance card titles are `h3` now)

Only the tag changed; every `className` is untouched, so there is no visual
difference. Each of the 17 components touched is imported by exactly one of
these four pages, so nothing else inherits the new level.

When adding a section to a page, mirror the page's own level: page-level sections
are `h2`, anything inside one is `h3`. `CardTitle` takes `as="h2"` for this.
