# Sureground Diaspora Invest: assessment, requirements and plan

Status: **M0 (discovery and architecture), awaiting owner decisions** · Started 2026-11-11

This is the working document for the Diaspora Invest programme. It records what the code already
does (checked in the code, not taken from older docs), what is missing, the decisions only the
business can make, and the order of work. Nothing here claims that an integration, verification,
safeguard or regulatory approval is live unless the code and a test show it.

Sources for the assessment: a read of `getrentos-backend` (dev at `e81357e8`), this repository
(dev at `e6489fa1`), and the existing product, trust, payments, security and property-management
documents listed in section 11.

---

## 1. Positioning

**Invest back home, with evidence.** A verified, transparent and professionally managed way for
Nigerians abroad, and other eligible investors, to find, buy, own and manage property in Nigeria
without being there.

Every screen must answer five questions, and answer them from records rather than badges:

| Question                     | What answers it in the product                                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Is this property genuine?    | Ownership proof, title and survey checks, physical inspection, each with who checked it, when, what was reviewed and what is still open |
| Is my money protected?       | Sureground Payment Protection held against named milestones, released only on evidence and the investor's approval                      |
| Who is accountable?          | Named, accredited professionals with a stated scope on every case                                                                       |
| What happens after purchase? | Sureground Managed: tenants, rent, maintenance within the owner's limits, inspections, statements                                       |
| Can I see what is happening? | The investor workspace: timeline, documents, money, approvals, activity, all from the same records staff see                            |

Sureground is the accountable infrastructure, not a promise of returns. No screen, email or
assistant reply may guarantee a return, a title, a price or a regulatory outcome.

**Name and structure.** The property-management scope already names **Sureground Managed** as
the diaspora beachhead (`docs/property-management-module-scope.md` §S1, §S4). Diaspora Invest is
the umbrella over three offerings, so Managed keeps its name:

1. **Verified Acquisition**: remote sourcing, independent legal and physical checks, transaction
   coordination, transfer support.
2. **Sureground Managed**: already partly built (intake, mandate, statements, spend approvals).
3. **Investor workspace** (the "command centre"): one view over purchases and managed properties.

---

## 2. What already exists (verified in code)

More is built than the brief assumes, but most of the remote-buyer machinery lives in the
**land** module. Built-home sales have a thinner flow.

### 2.1 Backend (`getrentos-backend`)

| Capability                      | What exists                                                                                                                                                                                                                                                                                                                                                                   | Diaspora fit                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Sale listings, offers, viewings | `Listing` (SALE), `Offer`/`CounterOffer`, `BuyerViewing` with `VIDEO` mode, Daily video calls                                                                                                                                                                                                                                                                                 | Usable; no investor framing                                                    |
| Built-home purchase money       | `Transaction` with `EscrowStatus` (DEPOSIT_PENDING → FUNDS_HELD → … → RELEASED/REFUNDED/FROZEN/DISPUTED); only the deposit (default 10%) is protected                                                                                                                                                                                                                         | Partial: no milestones after the deposit                                       |
| Land purchase                   | `LandPurchase` instalments, conveyance milestones (`LandMilestoneKey` CONTRACT_OF_SALE … GOVERNORS_CONSENT) each releasing a share (`releaseBps`) of protected money, closing conditions, title perfection, refunds                                                                                                                                                           | Strong; this is the model to generalise                                        |
| Remote-buyer controls           | `LandRepresentative` (VIEW / CO_APPROVE / ATTEND; family, lawyer, friend, agent; max 5), `LandCoApproval` two-person rule with a 48h switch-off delay, `LandSiteTour` storing `buyerTimeZone`                                                                                                                                                                                 | Land only                                                                      |
| Identity                        | Trust module: tiers 0–5, policy v1 (phone, NIN, selfie, liveness, face match, bank), review cases, appeals, consent, retention                                                                                                                                                                                                                                                | Nigerian identity only                                                         |
| AML                             | Dojah PEP/sanctions/adverse media; any hit goes to manual review; KYB for businesses; payout AML flags                                                                                                                                                                                                                                                                        | Screening hard-codes `country: 'NG'`                                           |
| Ownership and title             | `OwnershipProof` (must be APPROVED), `PropertyAuthority`, listing publication gate (IDENTITY, TIER, OWNERSHIP, PROPERTY_VERIFICATION, ADDRESS, LAND_DILIGENCE, FRAUD_SIGNAL); land: diligence with checks, encumbrances, title events, boundary versions, seller authority, fraud signals, assurance tiers                                                                    | Strong for land; built homes rely on ownership proof plus staff review         |
| Professionals                   | `LandProfessional` (surveyor, lawyer, valuer, inspector; regulator, licence and insurance expiry; accreditation states), `RealtorLicense`, `ProfessionalStanding`                                                                                                                                                                                                             | Land only; no conveyancer for built homes                                      |
| Inspection evidence             | Land Watch inspections (GPS within 100 m, capture time, file hash, offline limit, clock-skew check); managed field visits with GPS check-in; Mux video with "filmed on site"; 360 links from allowed hosts                                                                                                                                                                    | Strong for land and managed; agent inspection photos carry no location         |
| Money                           | Paystack (collections and payouts), Monnify (collections); double-entry journal; client-money ledger with reconciliation; refunds, payout runs, approvals, tier limits, cooldowns; step-up (PIN, WebAuthn, TOTP); four-eyes `MoneyApproval` at ₦5m+                                                                                                                           | NGN only, enforced: non-NGN charges are refused (`payment-webhook.service.ts`) |
| Property management             | `ManagedIntake`, `ManagementMandate` (scopes, servicing tiers, power of attorney, e-sign), `OwnerSpendApproval` above `maintenanceApprovalCap`, `OwnerStatement` (fees, VAT, WHT), statement line disputes, disbursement schedules, `OwnerQuery` with response deadline, activity feed, managed P&L, vendors and invoices, rent schedules, arrears, budgets, automation rules | Strong; this is Sureground Managed                                             |
| Documents                       | Encrypted storage, file hashes, evidence keys; e-sign for leases, mandates and estate records                                                                                                                                                                                                                                                                                 | No sale-contract signing; property documents not versioned                     |
| Disputes and fraud              | `Dispute` (incl. ESCROW, SALE), `LandDispute`, statement and payment disputes, fraud alerts, risk decisions                                                                                                                                                                                                                                                                   | Usable                                                                         |
| Back office                     | 19 staff roles with permissions; `requireSecondOfficer`; `MoneyApproval`; audit log with severity                                                                                                                                                                                                                                                                             | Usable                                                                         |
| Assistants                      | ~30 capabilities behind a gateway with kill switches, budgets, usage records, human review, output guards                                                                                                                                                                                                                                                                     | Usable with the controls in §8                                                 |
| Time                            | Africa/Lagos everywhere; only land site tours store the user's time zone                                                                                                                                                                                                                                                                                                      | Gap                                                                            |

Searches for investor, nationality, residence, FX, exchange rate, USD/GBP and source of funds
find nothing in application code.

### 2.2 Web, back office and mobile (this repository)

| Area        | What exists                                                                                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Roles       | Buyer, owner, landlord, renter, realtor, agent, estate, agency, resident, gateman; typed navigation per role in `apps/web/lib/navigation/roles/*`                                                                  |
| Buyer       | Discover, saved, viewings, offers, protected transactions, documents; land hub with purchases, milestone timeline, payment plan, inspections, tours, representatives (`components/land/buyer/*`)                   |
| Owner       | Properties, listings, offers, transactions, Pro investment analytics, managed properties, approvals, vendors, inspections, documents, activity                                                                     |
| Managed     | Intake on the landlord side (`SuregroundManagedView`), managed properties on the owner side (`ManagedPropertiesView`), statements under landlord financials, spend approvals shared                                |
| Public      | Landing page sections, Buy/Rent/Land marketplaces, showroom (media viewer, 360, video, trust aside, neighbourhood), pricing, home management, legal pages. No standalone how-it-works, trust explainer or FAQ page |
| Trust UI    | Verification centre, tiers, trust profile, check lists, land assurance wording (`packages/shared/src/utils/landTrust.ts`)                                                                                          |
| Payments UI | `paymentCopy.ts` (Payment Protection wording, web and mobile), pay dialog, receipts, step-up, payouts                                                                                                              |
| Back office | ~100 admin pages incl. verifications, trust cases, managed intakes and mandates, escrow, client money, payout runs, land diligence case panels, audit logs                                                         |
| Mobile      | Buyer and owner tab layouts plus stack screens for land purchase, representatives, offers, transactions, managed, approvals                                                                                        |
| Formats     | Naira only (`formatCurrency` is `en-NG`/`NGN`); dates `en-GB`; Lagos time; English and Pidgin                                                                                                                      |

---

## 3. Gaps for diaspora investors

| #   | Gap                                                                                                                                                              | Effect                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| G1  | No investor profile: no country of residence, nationality, time zone or display preferences on `User`                                                            | Cannot tailor onboarding, eligibility, times or reporting                                 |
| G2  | Identity checks work only for Nigerian NIN/BVN; the international provider adapter (Smile) is a stub; passports go to manual review; no proof of foreign address | Many diaspora investors, and all foreigners, cannot reach the tiers needed to make offers |
| G3  | No source-of-funds or source-of-wealth step; enhanced due diligence is only "manual review on AML hit"                                                           | Cannot meet higher-value investor expectations or likely AML duties                       |
| G4  | Naira-only display and NGN-only collections; Nigerian-bank-only payouts                                                                                          | No indicative GBP/USD figures; no foreign-card or remittance funding; no payout abroad    |
| G5  | Remote-buyer controls (representatives, two-person approval, site tours) are land-only                                                                           | Built-home buyers abroad lack the controls land buyers have                               |
| G6  | Built-home purchases protect only the deposit; no conveyance milestones                                                                                          | No milestone-based release for houses and flats                                           |
| G7  | Accredited lawyers, surveyors and valuers exist only for land                                                                                                    | No independent legal review for built-home purchases                                      |
| G8  | No investor workspace joining purchases and managed properties                                                                                                   | The investor must move between buyer, owner and landlord areas                            |
| G9  | Lagos time everywhere                                                                                                                                            | Confusing schedules and reminders for investors abroad                                    |
| G10 | No public diaspora page, how-it-works, transparency centre or FAQ                                                                                                | Weak first impression for the target customer                                             |
| G11 | No buyer-side power of attorney outside land                                                                                                                     | Cannot delegate signing or attendance for house purchases                                 |
| G12 | No e-signing of sale contracts; property documents not versioned                                                                                                 | Paper signing from abroad; weaker evidence trail                                          |
| G13 | Agent inspection photos carry no location                                                                                                                        | Weaker inspection evidence outside land and managed visits                                |

---

## 4. Constraints the product must respect

These come from decisions already recorded; changing any of them is an owner decision.

1. **Users never see "escrow".** They see "Sureground Payment Protection"; staff screens may say
   escrow (`docs/qa/requirements-catalogue.md`, REQ-ADMIN-07; defects DEF-117, DEF-137).
2. **No new product adds money to the pooled balance** until payments decision D-1 is done:
   separate client-money account, provider approval and a Nigerian counsel opinion
   (`docs/payments/README.md`, `decisions.md`). Sureground is not a bank.
3. **"Released" is not "paid"**; a database figure is not a bank balance.
4. **Gating order**: verified person → authorised for this property → property is real → money is
   protected (`docs/trust-system-strategy.md`). Ownership proof must be APPROVED; land diligence
   VERIFIED, not CONDITIONAL.
5. **Money limits**: step-up on releases; maker-checker at ₦1m+ (managed releases) and ₦5m+ (admin
   money moves); tier payout limits (C16).
6. **No invented figures**: no fabricated stats, returns or "bank-grade" claims (REQ-NFR-08,
   REQ-MONEY-05); badges only from backend status; media only if real.
7. **Naira only** (REQ-MONEY-01; icon set; roadmap "Multi-currency: Naira only, by design").
8. **Lagos business dates** (REQ-MONEY-07).
9. **Wording**: sentence case; no "AI" in user-facing copy; British spelling ("instalment").
10. **Design system**: `@sureground/ui` / `ui-native` components and tokens only; no hand-built
    duplicates; custom icon set.
11. **Open legal questions** (`docs/security/nigerian-compliance-questions.md`): NDPA cross-border
    transfers (Q5), NIN/BVN via aggregators (Q10–11), AML/DNFBP status (Q12).

Constraints 7 and 8 conflict with the brief (currency views, investor time zones). They need the
decisions in section 9.

---

## 5. Personas

| Persona                                | Wants                                                  | Main worry                                        | First release?                                          |
| -------------------------------------- | ------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------- |
| A. First-time diaspora buyer           | A home in Nigeria, bought safely from abroad           | Fraud, fake title, family or agent misuse         | Yes                                                     |
| B. Buy-to-let investor                 | Rental income with honest reporting                    | Rent not collected or not passed on, hidden costs | Yes                                                     |
| C. Land and development investor       | Land or off-plan with title checks and build oversight | Abandoned projects, competing claims              | Land: yes (exists). Off-plan: later                     |
| D. Portfolio investor                  | Several properties, one view, delegated control        | Visibility, control, reporting                    | Partly (workspace)                                      |
| E. Overseas owner of existing property | Professional management of a home they already own     | Caretaker or relatives mismanaging                | Yes (Managed)                                           |
| F. Eligible non-Nigerian investor      | Exposure to Nigerian property                          | Legal eligibility, consents, tax                  | **No**: needs legal opinion and foreign identity checks |

---

## 6. Requirements (MVP and later)

Requirement IDs use the `DIA-` prefix. **MVP** = first release. **Blocked** = needs a decision
or approval in section 9 first.

### 6.1 Discovery and onboarding

| ID     | Requirement                                                                                                                                                                                                                    | Release                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| DIA-01 | Public Diaspora Invest page: offer, how it works, what is checked and by whom, what Payment Protection does and does not cover, Managed service, fees, risks, FAQ, book a consultation. No invented statistics or case studies | MVP                                            |
| DIA-02 | Transparency centre page: Sureground's role, third-party responsibilities, fees and referral arrangements, verification limits, refund rules, complaints, privacy, conflicts of interest                                       | MVP (copy needs legal review before launch)    |
| DIA-03 | Investor profile: country of residence, nationality, time zone, intended use, budget band, property types, horizon, ownership structure. Collected only where needed; retention per trust policy                               | MVP                                            |
| DIA-04 | Times shown in the viewer's time zone next to Lagos time for viewings, tours, calls and deadlines; business dates stay Lagos                                                                                                   | MVP (needs D2)                                 |
| DIA-05 | Indicative amounts in GBP/USD/EUR/CAD next to the naira figure, with rate source, timestamp and "indicative only"                                                                                                              | **Blocked (D1)**                               |
| DIA-06 | Identity verification by passport or foreign ID, with liveness, through a production provider                                                                                                                                  | **Blocked (D3)**                               |
| DIA-07 | Source of funds and source of wealth above a value threshold, with staff review                                                                                                                                                | MVP for capture and review; threshold needs D4 |
| DIA-08 | Risk acknowledgement before the first offer or purchase, versioned and stored                                                                                                                                                  | MVP                                            |

### 6.2 Verified acquisition

| ID     | Requirement                                                                                                                                                                                                                                                   | Release                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| DIA-10 | "Investment eligible" listings: a listing gets the designation only when publication-gate checks pass **and** the diligence case for its category is complete and current                                                                                     | MVP                                          |
| DIA-11 | Verification statuses shown to investors: Submitted, Under review, Evidence verified, Conditionally approved, Investment eligible, Rejected, Verification expired, each with scope, date, reviewer, documents reviewed, open issues, limits and re-check date | MVP (built homes need DIA-14)                |
| DIA-12 | Representatives and two-person approval for built-home purchases, generalised from land (`LandRepresentative`, `LandCoApproval`)                                                                                                                              | MVP                                          |
| DIA-13 | Remote inspections for built homes: booked video tours in both time zones, recorded with consent, inspection report with geotagged, timestamped evidence                                                                                                      | MVP (reuse land tours, managed field visits) |
| DIA-14 | Accredited professionals for built homes (lawyer, surveyor, valuer, inspector), generalised from `LandProfessional`                                                                                                                                           | MVP                                          |
| DIA-15 | Transaction workspace: stages, milestones (expected, reported, verified, completed), pending actions, assigned professionals, documents, money status, delays, escalation, full history                                                                       | MVP                                          |
| DIA-16 | Three separate statuses on every purchase: operational stage, money settlement, legal completion. A paid milestone never shows as "legally acquired"                                                                                                          | MVP                                          |
| DIA-17 | Milestone-based Payment Protection for built homes (beyond the deposit)                                                                                                                                                                                       | **Blocked (D-1 payments)**                   |
| DIA-18 | E-signing of sale contracts and deeds; versioned property documents                                                                                                                                                                                           | Later (needs legal check on e-signed deeds)  |
| DIA-19 | Investment analysis on each eligible listing: costs, fees, duties, yields, cash flow, three scenarios, with each figure labelled verified / third-party estimate / your assumption, and methodology plus timestamps                                           | MVP for naira; currency view blocked (D1)    |

### 6.3 Managed property

| ID     | Requirement                                                                                                                                                                                | Release                          |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| DIA-20 | One Managed area for investors, joining intake, mandate, statements, approvals, maintenance and activity (today split between owner and landlord)                                          | MVP                              |
| DIA-21 | Spending limits by band: routine within the mandate, owner approval, explicit authorisation, emergency authority. Builds on `maintenanceApprovalCap` / `OwnerSpendApproval`                | MVP                              |
| DIA-22 | Every maintenance job shows problem, timestamped photos, contractor, quote, approvals, completion evidence, invoice, payment, owner feedback; duplicate-invoice and vendor-change controls | MVP (mostly exists; check gaps)  |
| DIA-23 | Monthly and on-demand owner statements that reconcile to the ledger                                                                                                                        | Exists; surface in the workspace |
| DIA-24 | Payouts to a foreign bank account                                                                                                                                                          | **Blocked (D1, D5)**             |

### 6.4 Investor workspace

| ID     | Requirement                                                                                                                        | Release                                     |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| DIA-30 | Portfolio overview: properties, acquisition cost, rent received, occupancy, expenses; valuation only with a stated method and date | MVP (no valuation until a method is agreed) |
| DIA-31 | Sections: My investments, Purchases, Property care, Money and statements, Documents, Messages and support, Risk and actions        | MVP                                         |
| DIA-32 | Alerts in the investor's time zone; reporting preferences                                                                          | MVP (needs D2)                              |
| DIA-33 | Web first; mobile parity after                                                                                                     | MVP web, mobile next                        |

### 6.5 Trust, governance and operations

| ID     | Requirement                                                                                                                                                                                                                                                                      | Release                                                                 |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| DIA-40 | Separation of duties enforced on the server: sellers cannot verify their own title; agents cannot mark listings legally verified; payment initiators cannot approve their own releases; managers cannot approve their own exceptional spend; evidence cannot be silently altered | MVP (much exists; audit and fill gaps)                                  |
| DIA-41 | Back-office Diaspora operations: investor onboarding review, source-of-funds review, eligibility, diligence coordination, professional assignment, milestone tracking, deadlines, escalation, four-eyes                                                                          | MVP                                                                     |
| DIA-42 | Disputes using the existing dispute model, with response deadlines and appeal                                                                                                                                                                                                    | Exists; link from the workspace                                         |
| DIA-43 | Assistants: shortlist, explain assumptions, summarise statements and documents for reviewers; never certify title, approve eligibility, release money, invent evidence or promise returns                                                                                        | Later                                                                   |
| DIA-44 | Pooled, fractional or return-linked products                                                                                                                                                                                                                                     | **Out of scope** pending a separate securities assessment (SEC Nigeria) |

---

## 7. Architecture

### 7.1 Principles

- **Extend, don't fork.** New models only where nothing exists. Generalise land-only features
  (representatives, co-approval, professionals, milestones) so built homes use the same rules,
  rather than copying them.
- **One investor, many roles.** No new "investor" account type. Diaspora Invest is a profile and a
  workspace on top of the buyer and owner roles the user already has, so permissions and data stay
  where they are.
- **Server-enforced.** Every money, approval and status change is checked on the server; the web
  only reflects it.
- **Three statuses, never merged**: operational stage, money settlement, legal completion.

### 7.2 Domains

| Domain                           | Builds on                                                           | New                                                                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Investor profile and eligibility | `User`, trust tiers, consent, retention                             | `InvestorProfile` (residence, nationality, time zone, preferences, objectives, ownership structure), `InvestorDeclaration` (risk acknowledgement, versioned), `SourceOfFundsCase` |
| Investment opportunity           | `Listing`, publication gate, showroom                               | Eligibility flag and verification summary derived from existing checks (no duplicate status store)                                                                                |
| Property verification            | `OwnershipProof`, land diligence, address checks                    | A diligence case for built homes on the land case pattern (checks, documents, reviewers, decision)                                                                                |
| Professional services            | `LandProfessional`                                                  | Generalise to property-type-neutral accreditation                                                                                                                                 |
| Acquisition                      | `Offer`, `Transaction`, land conveyance                             | Milestone plan for built homes; generalised representatives and co-approval                                                                                                       |
| Money and settlement             | Journal, client money, Payment Protection, step-up, `MoneyApproval` | No new money holding until D-1; FX quote records only if D1 allows                                                                                                                |
| Managed property                 | Mandate, intake, statements, spend approvals, vendors               | Spending bands; investor-facing views                                                                                                                                             |
| Portfolio                        | Owner analytics, managed P&L                                        | Read model joining purchases and managed properties                                                                                                                               |
| Documents and evidence           | Storage, hashes, evidence keys                                      | Document versions                                                                                                                                                                 |
| Audit and governance             | `AuditLog`, second-officer checks                                   | Diaspora-specific events                                                                                                                                                          |

### 7.3 States

```
Purchase (operational):   INTERESTED → ELIGIBILITY_CHECKED → RESERVED → DILIGENCE_AGREED
                          → DILIGENCE_IN_PROGRESS → FINDINGS_SHARED → CONTRACT_PREPARED
                          → AUTHORISED → COMPLETING → HANDED_OVER → ONBOARDED_TO_MANAGED
                          (any) → PAUSED | CANCELLED
Money (per milestone):    NOT_DUE → REQUESTED → RECEIVED → PROTECTED → RELEASE_REQUESTED
                          → RELEASED → PAID_OUT | REFUNDED | FROZEN
Legal completion:         NOT_STARTED → CONTRACT_SIGNED → CONSENT_APPLIED → CONSENT_GRANTED
                          → REGISTERED → PERFECTED   (land already has most of this)
Verification (listing):   SUBMITTED → UNDER_REVIEW → EVIDENCE_VERIFIED → CONDITIONALLY_APPROVED
                          → INVESTMENT_ELIGIBLE | REJECTED; any → EXPIRED on the re-check date
```

---

## 8. Controls that are not optional

- Assistants never certify title, approve eligibility, release money, fabricate evidence or
  guarantee returns; their figures are labelled and reviewable; existing governance (kill switches,
  budgets, human review, output guards) applies.
- No mock payment or verification success stands in for a real one. Sandbox providers stay
  labelled sandbox.
- A document upload never implies title. A paid milestone never implies legal completion.
- Investor data isolation is tested (one investor cannot read another's purchase, documents or
  statements).

---

## 9. Decisions needed from the business

| ID  | Decision                                                                                                                                   | Why it matters                                                                                | Blocks                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | -------------------------------- |
| D1  | May we show **indicative** foreign-currency figures (GBP/USD/EUR/CAD) next to naira, given the naira-only rule? If yes, which rate source? | REQ-MONEY-01 forbids it today; the brief wants it                                             | DIA-05, currency views in DIA-19 |
| D2  | May times show in the investor's own time zone next to Lagos time? (Business dates stay Lagos.)                                            | REQ-MONEY-07 and Lagos-only notifications                                                     | DIA-04, DIA-32                   |
| D3  | Production identity provider for passports and foreign IDs (Smile, QoreID, Prembly), and who pays per check                                | The Smile adapter is a stub; foreigners and many diaspora users cannot verify                 | DIA-06; persona F                |
| D4  | Source-of-funds threshold and which documents count                                                                                        | Needs a compliance owner                                                                      | DIA-07 threshold                 |
| D5  | Foreign payouts and foreign-currency collections: which licensed partner (IMTO, bank, payment provider)?                                   | Paystack payouts are Nigerian banks only; non-NGN charges are refused                         | DIA-24, foreign funding          |
| D6  | Payments D-1 (separate client-money account, counsel opinion, provider approval)                                                           | Already open; no new product may add to the pool                                              | DIA-17                           |
| D7  | Fee card for Verified Acquisition (diligence fee, coordination fee, who pays professionals)                                                | Must be shown before commitment                                                               | DIA-01, DIA-15                   |
| D8  | Eligibility of non-Nigerian buyers (state Governor's consent, ownership structures, tax)                                                   | Needs a written legal opinion                                                                 | Persona F                        |
| D9  | Marketing to UK/US/Canada residents: financial-promotion rules                                                                             | Positioning as property services, not investments, likely avoids them, but needs confirmation | DIA-01 copy                      |
| D10 | Is "Diaspora Invest" the public name, with Sureground Managed as one of its offerings?                                                     | Avoids two competing names                                                                    | DIA-01                           |

### Compliance register (launch-blocking unless marked)

| Item                                | Jurisdiction                        | Needs                                                   | Blocks launch of                                 |
| ----------------------------------- | ----------------------------------- | ------------------------------------------------------- | ------------------------------------------------ |
| Client money and protected payments | Nigeria (CBN)                       | Counsel opinion, licensed partner (D-1, D6)             | Milestone protection for built homes             |
| AML status (DNFBP/SCUML)            | Nigeria                             | Answer to Q12                                           | Source-of-funds policy; whole programme at scale |
| Cross-border data transfers         | Nigeria (NDPA)                      | Answer to Q5                                            | Foreign identity provider, foreign processors    |
| Foreign ownership and consents      | Nigeria (Land Use Act, state rules) | Legal opinion per state                                 | Persona F                                        |
| Financial promotions abroad         | UK (FCA), US, Canada                | Confirmation that property services are not investments | Diaspora page copy                               |
| Pooled or fractional products       | Nigeria (SEC)                       | Separate assessment                                     | Not planned                                      |
| E-signed sale contracts and deeds   | Nigeria                             | Legal check                                             | DIA-18                                           |

---

## 10. Roadmap

Each milestone ships behind a feature flag and only what is not blocked.

| Milestone                        | Scope                                                                                                                                                                                                                                        | Blocked parts                                |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **M0 Discovery** (this document) | Assessment, requirements, architecture, decisions                                                                                                                                                                                            | —                                            |
| **M1 Diaspora experience**       | DIA-01 page and FAQ; DIA-02 transparency centre (draft copy); DIA-03 investor profile (backend model, API, onboarding steps); DIA-08 risk acknowledgement; DIA-30/31 investor workspace shell reading existing buyer, owner and managed data | Currency (D1), own time zone (D2)            |
| **M2 Property trust**            | DIA-10/11 eligibility and verification summary; DIA-14 professionals generalised; DIA-13 remote inspections for built homes; geotagged agent photos (G13)                                                                                    | Foreign identity (D3)                        |
| **M3 Acquisition**               | DIA-12 representatives and co-approval for built homes; DIA-15/16 transaction workspace with three statuses; built-home milestone plan (tracking only)                                                                                       | Milestone money (D-1/D6); e-signing (DIA-18) |
| **M4 Managed**                   | DIA-20 one Managed area; DIA-21 spending bands; DIA-22 gaps                                                                                                                                                                                  | Foreign payouts (D5)                         |
| **M5 Investor intelligence**     | DIA-19 analysis in naira; portfolio figures; statements in the workspace                                                                                                                                                                     | Currency views (D1); valuation method        |
| **M6 Operations**                | DIA-41 back-office Diaspora queue, deadlines, escalation; DIA-40 separation-of-duties audit                                                                                                                                                  | —                                            |
| **M7 Production readiness**      | Security review, data-isolation and privilege tests, accessibility, partner checks, pilot                                                                                                                                                    | All D items that remain open                 |

**Realistic MVP**: M1 + M2 + M3 tracking + M4, for personas A, B and E, buying with naira and
existing Payment Protection for deposits, with representatives and two-person approval for built
homes, and Managed after handover. Foreign identity, currency views, foreign payouts and
milestone money follow the decisions above.

### KPIs

Qualified registrations, onboarding completion, verification time, diligence turnaround, offer
to completion conversion, payment exceptions, complaints and dispute resolution time, Managed
enrolment, rent collection rate, occupancy, maintenance response and resolution time, statement
timeliness, repeat investment. None is optimised at the expense of investor protection.

---

## 11. Sources

- Backend: `src/modules/{land,buyer,owner,trust,property-management,payment,ai}`,
  `src/shared/{trust-gate,journal,client-money,step-up,money-approval,audit,time}`,
  `prisma/schema.prisma`
- Backend docs: `docs/product/` (BRD, PRD, roadmap), `docs/trust-system-strategy.md`,
  `docs/trust-redesign/`, `docs/payments/{README.md,decisions.md}`,
  `docs/security/{gap-register.md,milestones.md,nigerian-compliance-questions.md}`,
  `docs/qa/requirements-catalogue.md`
- This repository: `docs/property-management-module-scope.md`,
  `docs/property-management-company-scope.md`, `docs/showroom/PLAN.md`,
  `docs/product-design-system.md`, `docs/navigation/README.md`

## 12. Progress log

| Date       | Milestone | What changed                                                     | Evidence      |
| ---------- | --------- | ---------------------------------------------------------------- | ------------- |
| 2026-11-11 | M0        | Assessment, requirements, architecture and decision list written | This document |
