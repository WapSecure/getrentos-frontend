# Accessibility audit

Consolidated WCAG 2.2 AA audit for the Sureground website and app, on `dev` as of 12 Nov 2026 (after #217). It brings together what is tested automatically, what was found and fixed by hand during the redesign, what is still not covered, and a manual screen-reader script anyone can run. Target: WCAG 2.2 level AA.

## 1. Automated checks

### Web: `marketing-a11y` CI job

| Item       | Detail                                                                                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Where      | `.github/workflows/frontend-release-gate.yml`, job `marketing-a11y` (#188). Runs on every PR to `dev`.                                                                                                          |
| What runs  | `playwright test --config=playwright.visual.config.ts --project=web-mobile --project=web-dark --grep @marketing`, which calls `auditVisualPage()` in `tests/browser/helpers/visualQa.ts` for each route.        |
| Routes     | `marketingWebRoutes` in `tests/browser/helpers/visualRoutes.ts`: `/`, `/sell`, `/agents`, `/about`, `/home-management`, `/pricing`, `/resources`, `/detty-december`, `/estates`, `/terms`, `/login`, `/signup`. |
| Viewports  | `web-mobile`: 390 × 844, light. `web-dark`: 1440 × 900, dark colour scheme.                                                                                                                                     |
| Rules      | axe-core via `@axe-core/playwright` with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`. Fails on **serious** or **critical** violations.                                                          |
| Also fails | Horizontal overflow over 2px (reflow at 390px), broken images, console errors, uncaught page errors, failed requests and 5xx responses (API calls are ignored, because CI runs with `E2E_API_OFFLINE=1`).       |
| Evidence   | A full-page screenshot and `<page>.audit.json` per route, uploaded as `marketing-a11y-report` when the job fails.                                                                                               |

The full public list (`publicWebRoutes`) adds `/rent`, `/buy`, `/land` and `/shortlets`; these run in the local visual QA suite, not in this CI job.

### Web: other gates

- `pnpm audit:ui-controls` (`scripts/ui-control-audit.mjs`, in the `verify` job): fails when new raw `input`, `select` or `textarea` elements appear in web or back office outside the shared, labelled form components, against `config/ui-control-baseline.json`.
- ESLint with `--max-warnings=0` on web, back office and mobile.
- Shared `Tooltip`, `IconButton` and `IconLink` in `packages/ui` require a label for icon-only controls (#164).

### App: Jest accessibility suites

| Item     | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Where    | `apps/mobile/__tests__/a11y-*.test.tsx`, run by `pnpm --filter mobile test:ci` in the release gate (#215).                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Helper   | `apps/mobile/__tests__/helpers/a11y.tsx`. `expectAccessiblePressables()` fails any reachable pressable with no role, no accessible name, a hidden disabled state, a position inside an `accessible` group (unreachable), or a fixed size under 44pt including `hitSlop`. `expectLabelledTextInputs()` fails unlabelled inputs.                                                                                                                                                                                                          |
| Suites   | `a11y-primitives` (Button, IconButton, TextField, Chip, checkbox/switch/radio, LinkButton, SegmentedControl, pressable and listing cards, plus negative cases for the helper); `a11y-tab-bars` (every role's tabs named, with icons and size); `a11y-sign-in` (password and magic-link forms); `a11y-onboarding`; `a11y-detty-december` (week chips report selection); `a11y-landlord-home` (quick actions, cards, money toggle); `a11y-renter-maintenance` (card actions, confirmation on cancel, star rating as a named radio group). |
| Contrast | `apps/mobile/__tests__/theme-contrast.test.ts` checks the semantic token pairs in light and dark. Token pairs were also checked for AA when the Brik tokens landed (muted text 6.0:1 on the canvas, #158).                                                                                                                                                                                                                                                                                                                              |

### Results on current `dev`

All of the above pass on `dev`: the Frontend release gate (including `marketing-a11y` and the mobile `test:ci` step) succeeded on commit `ab6f7687` on 12 Nov 2026; the run for `10859a95` (#217) was still in progress when this was written. A manual axe run (WCAG 2.0–2.2 A/AA, dark, desktop) on `/`, `/sell`, `/agents`, `/about`, `/home-management`, `/pricing`, `/diaspora`, `/resources`, `/rent`, `/buy`, `/land` and `/shortlets` reported zero violations (#188).

## 2. Manual findings fixed during the project

| PR   | Finding                                                                                                                                                                                                                    | WCAG                               | Fix                                                                                                                                                                                                   |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #164 | Icon-only actions changed data with no label, tooltip or confirmation (a check icon resolved a maintenance request at once; a template icon sent a message silently). Native `title` tooltips were not keyboard-reachable. | 1.1.1, 2.4.6, 3.3.4, 4.1.2, 1.4.13 | Shared `Tooltip` (hover and focus, Escape, hoverable); confirmations naming the item and whether it can be undone; visible text labels on high-stakes actions; specific labels on reversible toggles. |
| #195 | Back office on phones: the wordmark widened the top bar so the profile chevron covered the **Open navigation menu** button, and taps missed it.                                                                            | 1.4.10, 2.5.8                      | Below `sm` the top bar shows only the mark.                                                                                                                                                           |
| #211 | A visitor whose session had ended was moved from a public page (for example `/sell`) to sign-in with an expiry toast: an unexpected change of context.                                                                     | 3.2.1, 3.2.2                       | Only signed-in areas redirect; public pages drop the ended session and stay put.                                                                                                                      |
| #215 | App **PortfolioCard**: the show/hide money toggle sat inside an `accessible` group, so screen readers could never focus it.                                                                                                | 2.1.1, 4.1.2                       | Toggle moved beside the group.                                                                                                                                                                        |
| #215 | App **Button / IconButton**: a caller's `accessibilityState` replaced the component's own disabled, selected or busy state.                                                                                                | 4.1.2                              | States are merged.                                                                                                                                                                                    |
| #215 | App **LinkButton**: inline links (sign-in Terms and Privacy, "Retry loading") had a 32pt hit area.                                                                                                                         | 2.5.8 (and the 44pt house rule)    | Vertical `hitSlop` brings them to 44pt.                                                                                                                                                               |

Related changes that help accessibility: semantic colour tokens everywhere, so state is not carried by a raw colour (#202); no layout shift on Pricing and lighter JS (#192); sentence case and plain-language labels (#212, #213, #214); the mobile web menu as a modal dialog with focus trap, Escape and focus return (#159).

## 3. Known limits

- **No manual VoiceOver or TalkBack pass yet.** The script in section 4 has not been run end to end on a device. It is part of the pre-release checklist in `deployment-and-rollback.md`.
- **Contrast as rendered.** Tokens are tested, but neither axe nor the Jest suites see text over photos, gradients, the ink closing band in every state, or the app as drawn on screen. Check these by eye and with a contrast picker.
- **Focus order and focus visibility.** axe does not test the order of focus or whether the focus ring is visible on every control. The Jest helper cannot see focus order at all.
- **Coverage.** CI audits 12 marketing routes. Not in the CI list: `/landlords`, `/renters`, `/buyers`, `/diaspora`, `/areas/*`, `/resources/*`, listing pages, the market pages (`/rent`, `/buy`, `/land`, `/shortlets`, local only) and signed-in workspaces (persona routes run only in the local visual suite). The app suites cover the screens listed above, not every screen.
- **Severity threshold.** CI blocks on serious and critical only; moderate and minor axe findings are recorded in the audit JSON but do not fail.
- **Dark mode is checked at desktop width only**; 390px is checked in light mode only.
- **Skip link.** Signed-in workspaces have a skip-to-main link; public pages rely on the `main` and `nav` landmarks instead.
- **Third-party payment pages** (card checkout) are outside our code and not audited.
- **Motion.** `prefers-reduced-motion` is honoured in `globals.css`; the app relies on the OS setting through Reanimated and has not been checked by hand.

## 4. Manual screen-reader script

Run before each release on one iPhone (VoiceOver, latest iOS, Safari and the app) and one Android phone (TalkBack, Chrome and the app). Use a test account per role on staging. Turn the screen reader on before opening the site or app. Record pass or fail per step, with a screen recording of any failure.

**Gestures.** VoiceOver: swipe right/left to move, double-tap to activate, rotor (two-finger twist) for headings and links. TalkBack: swipe right/left, double-tap, reading controls (swipe up then down) for headings and links.

**General expectations for every screen.** The page or screen title is announced first. Each control is announced with a name and a role ("Sign in, button"). Nothing is announced twice or skipped. No focus lands on hidden content. Errors are announced when they appear. Nothing moves the reader away without an action.

### 4.1 Sign in

| Step                                      | Expected result                                                                                                                              |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Open `/login` (web) or the Sign in screen | Heading announced. Email and password fields announced with their visible labels and "required".                                             |
| Move to the password reveal control       | Named (for example "Show password"), role button, state changes are announced after activation.                                              |
| Submit with an empty or wrong password    | The error is announced without moving focus off the form; the field in error says what is wrong.                                             |
| Switch to the magic-link option           | The new form is labelled; the send control is named.                                                                                         |
| Activate Terms and Privacy links          | Each is a link with a clear name; easy to activate (44pt target in the app).                                                                 |
| Sign in successfully                      | Announces the role's home screen. If a two-factor or identity step appears, its title and code field are announced and the field is focused. |

### 4.2 Search

| Step                                       | Expected result                                                                                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web: open the menu on a phone              | "Menu, button, collapsed"; after activation "expanded", and focus moves into the menu. Swiping stays inside the menu. Close returns focus.                          |
| Homepage search: type an area              | The field has a name. Suggestions are announced and can be chosen; choosing one runs the search.                                                                    |
| Results page (`/rent` or app Discover)     | A heading for the results; each listing card read as one item with title, price with period (for example "per month"), area and status ("Verified" or "Verifying"). |
| Filters and chips                          | Each filter is named; selected chips say "selected". Applying filters announces the new result count or updates the heading.                                        |
| Save (heart) and compare toggles on a card | Reachable separately from the card, named ("Save …", "Compare …"), state announced.                                                                                 |
| No results                                 | The empty message is read and offers a next step.                                                                                                                   |

### 4.3 Listing page

| Step                                      | Expected result                                                                                                                        |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Open a listing                            | Title as heading, then price and period, area, verification status. Breadcrumbs read as links (web).                                   |
| Photo gallery                             | Images have useful descriptions or are announced as listing photos with a position ("Photo 2 of 8"); next/previous controls are named. |
| Facts, amenities, floor plan              | Headings separate the sections; room markers on the floor plan are announced with their number and room name.                          |
| Ask a question / contact / book a viewing | Each action is a named button; any sheet or dialog announces its title and traps focus until closed.                                   |

### 4.4 Apply (rent) or make an offer (buy)

| Step                                    | Expected result                                                                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Start an application or offer           | The form's heading is announced; each field has a visible label read aloud; money fields open a numeric keyboard.                      |
| Leave a required field empty and submit | Focus stays in the form; the error is announced and tied to the field.                                                                 |
| Review step                             | The summary is readable in order (amount, period, property).                                                                           |
| Submit                                  | A confirmation is announced (toast or new screen). The application or offer appears on the Applications or Offers tab with its status. |

### 4.5 Pay a deposit

| Step                                      | Expected result                                                                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open the deposit or payment screen        | Amount in naira, what it is for, and how Payment Protection releases it are all read; the "what it does not cover" text is reachable within one swipe or tap. |
| Identity step-up (if prompted)            | The sheet's title is announced, focus moves into it, and the code or biometric prompt is named. Cancel is reachable.                                          |
| Choose a payment method                   | Each method is a named radio or button with its selected state.                                                                                               |
| Continue to checkout                      | The hand-off to the payment provider is announced. (The provider's page itself is outside our audit.)                                                         |
| Return (`/payments/return` or app screen) | The result (paid, pending or failed) is announced as text, not by colour alone, with a next step.                                                             |

### 4.6 Report maintenance

| Step                               | Expected result                                                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Open Report maintenance (renter)   | Heading announced; category, description and photo controls labelled.                                           |
| Add a photo                        | The add-photo control is named; upload progress, cancel and retry are announced.                                |
| Submit                             | Confirmation announced; the request appears in the list with its status.                                        |
| On a request card: cancel          | A confirmation asks first, names the request and says whether it can be undone; both choices are clearly named. |
| Rate a completed job               | Stars read as a radio group ("1 star … 5 stars"), each 44pt, and the rating asks before submitting.             |
| Landlord side: resolve or escalate | Visible text buttons ("Mark resolved", "Escalate"), each with a confirmation.                                   |

### Recording results

Log each run in the release ticket: date, device and OS, screen-reader version, app build or web commit, pass or fail per step, and links to recordings. File each failure as a bug with the WCAG criterion, the step, what was announced and what was expected.
