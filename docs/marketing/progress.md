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

## M4 — SEO foundation ✅

- Canonicals, noindex for auth and filtered views, sitemap, RealEstateListing / Accommodation / BreadcrumbList / FAQPage JSON-LD (#157, #167, #189).
- robots.txt no longer blocks `/agents`, `/estates` and the new segment pages via prefix rules (#189).

## M5 — Content and location SEO ✅ (first pass)

- Area pages backed by live inventory only (#185).
- Resources hub built from reviewed copy (#186).
- Strategy: `content-strategy.md`.

## M6 — Performance and accessibility 🟡

- Done: lighter JS on every page, no layout shift on Pricing, parallel homepage data with timeouts, unused font removed (#192); axe gate in CI (#188); zero axe violations on 12 public pages in manual run.
- In progress: server-rendered first page for `/shortlets` and `/land`; real-user Web Vitals reporting.
- Decision: the CSP nonce keeps all pages dynamic. Kept for security (a weaker policy on public pages would expose session refresh to injected script). See `performance-report.md`.

## M7 — Testing and launch readiness 🟡

- Done: deployment/rollback, SEO monitoring, analytics plan, decision log (#190); mobile search privacy fix (#191).
- In progress: agent-sync and design e2e suites, which had been failing unseen (#193, #195).
- Open: branch protection on `dev`, hosting/deploy automation, Privacy Policy disclosure of anonymous measurement (legal review), legal sign-off on Diaspora and guide copy before Diaspora goes live in production.

## Product fixes made along the way

- Icon-only actions that changed data without label or confirmation, app-wide (#164).
- Owner and buyer cards no longer say "Refunded" when nothing was paid (#171, #181).
- Mobile onboarding claims aligned with what the marketplace shows (#175).
