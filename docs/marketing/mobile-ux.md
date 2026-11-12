# Mobile UX specification

Covers the mobile web (Next.js, phone widths) and the Sureground app (Expo / React Native, `apps/mobile`). Both use the same tokens from `packages/tokens`.

## Visual language

| Element | Rule                                                                                                                                                           | Source                                                                               |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Colour  | Pure ink accent (`#20232B` light / `#F1EFE9` dark), warm paper background (`#F8F7F5` / `#111216`). Blue only for information, green only for verified/success. | `packages/tokens/src/index.ts`                                                       |
| Type    | Newsreader serif for display and screen titles; Manrope for everything else; tracked uppercase labels for eyebrows.                                            | web: `app/layout.tsx`; app: `lib/theme/fonts.ts`, ui-native `Text` `display`/`title` |
| Shape   | Sharp corners (radius 2–6px) on cards, buttons, inputs; full radius only for avatars, toggles and filter chips.                                                | tokens `radius`                                                                      |
| Icons   | Custom `@sureground/icons` set only.                                                                                                                           | `packages/icons`                                                                     |

## Layout and navigation

- **Web, < 768px:** top bar with logo, menu button opens a full-screen dialog (focus trap, Escape, scroll lock). No horizontal page scroll at 390px — enforced in CI by the `marketing-a11y` job.
- **App:** role-based bottom tabs (e.g. landlord: Home, Properties, Tenants, Messages, Account). Signed-out users land on the marketplace with a persistent "Join free" bar.
- Touch targets ≥ 44×44pt; primary action reachable with one thumb (bottom of screen on forms).

## Interaction rules

- **Icon-only actions** must have an accessible label, a tooltip on web, and a confirmation step when they change data (resolve, delete, release money, etc.). See `docs/product-design-system.md`.
- Forms: one column, labels above fields, inline errors, keyboard type matched to the field (numeric for money, email for email).
- Money is always shown in naira with the period (`/mo`, `/yr`); never round in a way that changes meaning.
- Loading: skeletons sized like the final content (no layout shift); empty states say what is true ("No verified land matches these filters") and offer a next step.
- Respect reduced motion; animations are decorative only.

## Trust and honesty on small screens

- Verification status is shown on every listing card ("Verified", "Verifying"); never imply a check that hasn't happened.
- Onboarding copy describes what the marketplace shows, not what we hope it shows (PR #175).
- Claims about Payment Protection always include what it does not cover, within one tap.

## Accessibility

WCAG 2.2 AA target. Automated: axe in CI on marketing pages at 390px and in dark mode (`marketing-a11y`). Manual: VoiceOver/TalkBack pass on sign-in, search, listing, apply/offer and payment before each release (see `deployment-and-rollback.md` checklist).

## Known gaps

- App filter chips stay pill-shaped by design; revisit if the brand moves fully square.
- App has no automated accessibility audit yet (React Native: consider `@testing-library/react-native` a11y queries in `test:ci`).
