# Keyword and content strategy

How Sureground's public pages map to what people search for, and the rules for adding content. No search volumes are quoted here: none have been measured yet. Once Search Console has 28+ days of data (see `seo-monitoring.md`), replace the intent notes below with real query data.

## Principles

- **One page per intent.** Each search intent has one canonical page. Filtered search views (`/rent?q=…`, any query string) are `noindex`; the canonical page is the unfiltered one.
- **Inventory before pages.** Location pages exist only where live listings back them (`/areas/[slug]` needs at least 3 live rent + sale listings, otherwise 404 + noindex). No thin or templated area guides.
- **Claims come from the product.** Every feature statement must match what the code does today. Legal, title, payment-protection and investment wording is reused from reviewed copy (`components/diaspora/public/content.ts`) or goes through legal review first.
- **Naira, British English, sentence case**, no "AI" wording, no invented statistics, testimonials or ratings.

## Intent map

| Intent cluster  | Typical phrasing (illustrative, not measured)              | Canonical page                                                | Status                                                |
| --------------- | ---------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| Rent a home     | "flats for rent in Lagos", "2 bedroom apartment Lekki"     | `/rent` (search), `/renters` (how renting works)              | Live                                                  |
| Buy a home      | "houses for sale in Lagos", "buy apartment Ikoyi"          | `/buy`, `/buyers`                                             | Live                                                  |
| Buy land        | "land for sale Lekki", "C of O land Lagos"                 | `/land`, `/buyers#land`                                       | Live (land marketplace behind availability flag)      |
| Short stays     | "shortlet apartments Victoria Island"                      | `/shortlets`                                                  | Live                                                  |
| Area intent     | "property in Lekki", "homes in Yaba"                       | `/areas/[slug]`                                               | Live where inventory ≥ 3                              |
| Let a property  | "how to rent out my apartment", "tenant screening Nigeria" | `/landlords`                                                  | Live                                                  |
| Sell a property | "sell my house Lagos"                                      | `/sell`                                                       | Live                                                  |
| Manage property | "property management software Nigeria"                     | `/home-management`                                            | Live                                                  |
| Realtors        | "list properties as an agent"                              | `/agents`                                                     | Live                                                  |
| Diaspora buyers | "buy property in Nigeria from abroad"                      | `/diaspora`, `/resources/buying-from-abroad`                  | Built; off in production until compliance items clear |
| Safety / trust  | "how to verify land title Nigeria", "avoid property scams" | `/resources/property-checks`, `/resources/payment-protection` | Live                                                  |
| Brand           | "Sureground", "Sureground pricing"                         | `/`, `/pricing`, `/about`                                     | Live                                                  |

## Content backlog (in priority order)

1. **Guides that answer safety questions** (highest trust value, low legal risk when drawn from reviewed copy): renting safely (deposits, receipts, inspections), what to check before paying for land, how a protected deposit is released. Each needs: product owner check of every claim, legal review where it touches title, money or rights, and a "not advice" note.
2. **Area pages** grow automatically with inventory; the only work is adding areas to `components/home/areas.ts` as they get listings.
3. **Estate and developer pages** (`/estates`) — already data-driven; improve their metadata and structured data once real estates are listed.
4. **Not planned:** price indices or "average rent" pages until there is enough listing data to be statistically honest; investment-return content (regulatory risk; see diaspora compliance register).

## Editorial process

1. Draft from product behaviour (link the code or screen that proves each claim).
2. Product review; legal review for money, title, data or regulatory topics.
3. Add to `components/resources/guides.ts` (or a page), with canonical, BreadcrumbList JSON-LD and a sitemap entry.
4. Recheck every 6 months or when the product changes; remove content that is no longer true.

## Measuring it

Use Search Console queries and pages, plus the first-party funnel events (`analytics-plan.md`): organic landing page → search → listing view → enquiry/application/offer. Rankings can't be guaranteed; judge content by qualified visits and completed actions, not positions.
