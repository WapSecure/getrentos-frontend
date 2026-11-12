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

WCAG 2.2 AA target. Automated: axe in CI on marketing pages at 390px and in dark mode (`marketing-a11y`), and the app's accessibility tests in `pnpm --filter mobile test:ci` (below). Manual: VoiceOver/TalkBack pass on sign-in, search, listing, apply/offer and payment before each release (see `deployment-and-rollback.md` checklist).

### App accessibility tests

`apps/mobile/__tests__/helpers/a11y.tsx` checks a rendered screen the way a screen reader and a thumb meet it. The `a11y-*.test.tsx` files apply it to the `@sureground/ui-native` primitives, every role's tab bar, sign-in, onboarding, Detty December, the landlord home's quick actions and cards, and the renter maintenance cards with their confirm and rating actions.

`expectAccessiblePressables(root)` finds every element with an `onPress` that a screen reader can reach and fails, naming each control, when one:

- has no `accessibilityRole`;
- has no accessible name (an `accessibilityLabel`, or text inside it). Icon-only buttons therefore need a label;
- is disabled but does not set `accessibilityState.disabled`;
- sits inside an `accessible` container, which screen readers focus as a single element, so the control can never be reached;
- has a fixed height or width under 44pt, counting `hitSlop`. Sizes set by content or flex are not measured.

`expectLabelledTextInputs(root)` fails on a reachable `TextInput` with no label. `auditPressables(root, { minTarget })` returns the problems instead of throwing; pass `minTarget: false` to skip the size check.

```tsx
import { screen } from '@testing-library/react-native';
import { expectAccessiblePressables, renderWithTheme, type HostElement } from './helpers/a11y';

it('every control has a role and a name', async () => {
  await renderWithTheme(<MyScreen />); // theme and toast providers, like the root layout
  const pressables = expectAccessiblePressables(screen.container as HostElement);
  expect(pressables).toHaveLength(4); // also catches a control that vanished
});
```

Screens render in isolation: `jest.setup.js` swaps Reanimated, worklets and safe-area insets for Jest stand-ins. Mock a screen's data layer (`expo-router`, API modules, `FlashList`) in its test file; see `a11y-renter-maintenance.test.tsx`. When the helper fails, fix the component (add the label, role or `hitSlop`) instead of loosening the test. Add a screen to this suite when it gains new controls.

## Known gaps

- App filter chips stay pill-shaped by design; revisit if the brand moves fully square.
- App accessibility tests cover the screens listed above, not every screen; they cannot check focus order or contrast as drawn on screen, so the manual VoiceOver/TalkBack pass still covers those (token contrast is tested in `theme-contrast.test.ts`).
