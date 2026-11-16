# Diaspora guide briefs: UK, US and Canada readers

Status: **draft briefs, not for publishing.** Each guide needs legal (Nigeria) and, where marked, home-country tax or regulatory review before any copy is written. Diaspora is off in production until the compliance items clear (`content-strategy.md`).

These briefs extend the existing guide `/resources/buying-from-abroad`; they do not replace it. Each country guide is published only if it says something the general guide cannot. If counsel's answers turn out to be the same for all three countries, we publish one section in the general guide instead of three thin pages.

## Rules for all three

- **Product claims come from the product.** Steps, fees, protection and limits are reused from `components/diaspora/public/content.ts` (JOURNEY, CHECKED, LIMITS, PROTECTION_DOES, PROTECTION_DOES_NOT, RISKS, FEE_POINTS, MONEY_POINTS, REFUND_POINTS). We don't paraphrase them into stronger claims.
- **No advice.** We don't give tax, legal, immigration or investment advice. We don't mention returns, yields, capital growth or "best areas to invest".
- **Overseas rules go through counsel.** Anything about the reader's home country (tax reporting, sending money, sanctions, inheritance) appears only as a reviewed statement with a named source and a review date, or as "ask your adviser".
- **Naira only.** Prices stay in naira, and we don't convert to pounds or dollars. Sending money is described as a process, never as a rate.
- **Format.** British English, sentence case, no em dashes, no "AI" wording. Article JSON-LD via `articleJsonLd`, plus a BreadcrumbList. No dates in the schema until there is a real review date.

## Brief 1: buying property in Nigeria from the UK

- **Reader (hypothesis):** a Nigerian-born professional in the UK, often in London, Manchester or Birmingham. They are buying for family or for later return, and are wary after hearing about a relative being defrauded.
- **Queries to target:** "buy property in Nigeria from UK", "buying land in Nigeria from abroad UK", "how to buy house in Lagos from London". We validate the volumes in Search Console after launch, and don't quote numbers before then.
- **Job of the page:** explain what the reader can do remotely and what needs someone on the ground, and show where Sureground fits.
- **Outline:**
  1. What you can do from the UK and what needs someone in Nigeria (from JOURNEY).
  2. Checking the property before you pay (CHECKED, LIMITS).
  3. Paying: how Payment Protection holds money, and what it does not cover.
  4. Signing documents from abroad. Legal review is needed; see the questions below.
  5. After purchase: managing the property (link to `/home-management`).
  6. Risks to weigh (RISKS, verbatim).
  7. FAQs, reused from the existing diaspora FAQ.
- **Questions for counsel (Nigeria):** the power-of-attorney requirements when the donor is in the UK, including whether a UK notary is enough, any legalisation steps, and stamping in Nigeria. Whether Governor's Consent timelines differ for a buyer abroad.
- **Questions for counsel (UK):** whether anything at all about UK tax reporting of overseas property can be said, or only "speak to a UK tax adviser". Any FCA financial-promotion risk in the page's wording.
- **Internal links:** `/diaspora`, `/diaspora/transparency`, `/resources/buying-from-abroad`, `/resources/property-checks`, `/resources/payment-protection`, `/land`.

## Brief 2: buying property in Nigeria from the US

- **Reader (hypothesis):** a Nigerian-American, often in Houston, Atlanta, Maryland or New York. They are more likely to be buying a house for parents, or land.
- **Queries to target:** "buy property in Nigeria from USA", "buy land in Nigeria from America", "Nigerian diaspora real estate USA".
- **Job of the page:** the same as the UK guide, with a different focus. Hypothesis to check against support tags before writing: land and title risk matters most to this audience, so it would come first.
- **Outline:** as for the UK, but with land checks (`/land`, the dossier) before homes, and a section on a relative inspecting for you (the "Can a relative or my lawyer help?" FAQ).
- **Questions for counsel (Nigeria):** the same power-of-attorney questions as the UK guide, for a US notary, including the apostille route. Whether family members can sign on the buyer's behalf, and what that needs.
- **Questions for counsel (US):** whether we may say anything about US reporting of foreign assets, or only "speak to a US tax adviser". Whether OFAC or sanctions screening needs mentioning, given our payment providers.
- **Internal links:** as for the UK guide, plus `/land/market`.

## Brief 3: buying property in Nigeria from Canada

- **Reader (hypothesis, to check with support and Search Console data):** a newer migrant, often in Toronto, Calgary or Ottawa, who left within the last ten years. They often plan a phased build or are buying an off-plan unit.
- **Queries to target:** "buy property in Nigeria from Canada", "buying off-plan in Lagos from abroad".
- **Job of the page:** cover off-plan buying from abroad (`/developments`), including what checks we make on a development and what they cannot promise about completion.
- **Outline:** as for the UK, with an off-plan section. That section draws only on the showroom's existing checked-development copy and LIMITS, and makes no claim about completion dates.
- **Questions for counsel (Nigeria):** off-plan purchase protections. Whether the developer's title and approvals can be described as "checked", and how far that word reaches.
- **Questions for counsel (Canada):** whether we may say anything about Canadian reporting of foreign property, or only "speak to a Canadian tax adviser".
- **Internal links:** as for the UK guide, plus `/developments`.

## Before any of these ships

1. Counsel answers the questions above, in writing, with a review date.
2. We check support tags and Search Console data to confirm each country page has a distinct job. If not, we merge it into the general guide.
3. The copy is written and reviewed against this brief and the rules above.
4. The page is added to `components/resources/guides.ts` with `requiresDiaspora: true`, so it stays hidden while Diaspora is off.
5. Before merging, we run axe, check that the title is 60 characters or fewer, and check og:image and JSON-LD on the page.
