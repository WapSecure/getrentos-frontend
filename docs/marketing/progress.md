# Redesign progress checklist

Status of the marketing redesign and launch-readiness brief, by milestone. PR numbers refer to `WapSecure/getrentos-frontend` unless marked.

## M0 — Discovery ✅

- Codebase, marketing and SEO audit; Brik / TapReady reference review (`docs/brand/references`).
- Findings drove #157 (JSON-LD escaping, inherited canonical) and the honest-copy rule.

## M1 — Creative direction ✅

- Brik design tokens: warm paper, pure ink accent, sharp corners, Newsreader + Manrope (#158).
- Ink brand assets, app icons, mobile serif titles (#173).

## M2 — Homepage, navigation, search, footer ✅

- Homepage, hero search with area suggestions, navigation with mobile dialog, footer (#159).

## M3 — Segment landing pages ✅

- `/sell`, `/agents`, `/about` (#159); `/home-management` (#173); `/diaspora` (#178); `/pricing` (#179); `/landlords`, `/renters`, `/buyers` (#189); honest auth panels (#170).
- `/detty-december`, `/estates`, legal pages and the Diaspora transparency centre restyled, with every short-stay promise checked against the backend (#206, #207). `/developments` waits for #180.

## M4 — SEO foundation ✅

- Canonicals, noindex for auth and filtered views, sitemap, RealEstateListing / Accommodation / BreadcrumbList / FAQPage JSON-LD (#157, #167, #189).
- robots.txt no longer blocks `/agents`, `/estates` and the new segment pages via prefix rules (#189).

## M5 — Content and location SEO ✅ (first pass)

- Area pages backed by live inventory only (#185).
- Resources hub built from reviewed copy (#186).
- Strategy: `content-strategy.md`.

## M6 — Performance and accessibility ✅

- Lighter JS on every page, no layout shift on Pricing, parallel homepage data with timeouts, unused font removed (#192).
- `/shortlets` and `/land` render their first page on the server; ItemList JSON-LD on all four market pages (#200).
- Real-user Core Web Vitals reported through the first-party analytics beacon, 50% of sessions (#201).
- axe gate in CI on marketing pages at 390px and dark mode (#188); zero axe violations on 12 public pages in a manual run.
- Semantic colour tokens everywhere on web, back office and shared UI (#202).
- Decision: the CSP nonce keeps all pages dynamic. Kept for security (a weaker policy on public pages would expose session refresh to injected script). See `performance-report.md`.

## M7 — Testing and launch readiness 🟡

- Done: deployment/rollback, SEO monitoring, analytics plan, decision log (#190); content strategy, mobile UX spec (#199); after screenshots (#204).
- Done: the whole release gate now runs and passes: agent-sync (23 tests) and design e2e (104 tests) had been failing unseen since the in-memory session change (#193, #195).
- Done: funnel analytics (search, sign-up, submissions, checkout, payments, first-touch UTM) without PII (#201); Privacy Policy section added, **needs legal review**.
- Waiting: backend #211 (analytics event allow-list) — backend CI blocked by a GitHub billing failure; local specs queued behind the memory gate.
- Open, needs an admin: branch protection on `dev`, hosting/deploy automation, legal sign-off on Diaspora, guide and Privacy Policy copy before Diaspora goes live in production.

## Product fixes made along the way

- Icon-only actions that changed data without label or confirmation, app-wide (#164).
- Owner and buyer cards no longer say "Refunded" when nothing was paid (#171, #181).
- Mobile onboarding claims aligned with what the marketplace shows (#175).
- Short-stay payout wording matches the payout rules across web and app (#207); owner sales count no longer calls every sale protected (#203).
- Mobile search no longer sends typed text to Sentry (#191); back-office top bar no longer covers the menu button on phones (#195).
