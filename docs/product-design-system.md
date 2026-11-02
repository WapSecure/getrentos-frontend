# GetRentos interface direction

Apple's [typography](https://developer.apple.com/design/human-interface-guidelines/typography),
[layout](https://developer.apple.com/design/human-interface-guidelines/layout), and
[materials](https://developer.apple.com/design/human-interface-guidelines/materials)
guidance inform this system. GetRentos retains its name, mark, and property workflows.
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
