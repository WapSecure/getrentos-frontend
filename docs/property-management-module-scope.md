# Property Management Module — Comprehensive Scope

**Status:** Draft for decision · **Owner:** Product + Eng · **Date:** 2026-10-10
**Companion to:** `property-management-company-scope.md` (the PMC / GetRentos Managed engagement layer)

> This document scopes the **full property-management product**, not just the manager-appointment layer already built. It is the case for turning what we have — a strong engagement + trust-accounting spine — into a complete module that wins three markets at once. Build-status flags reflect a code review of the current repo; anything marked 🟡 should be re-validated before estimation.

---

## 1. Thesis: three editions of one engine

Property management is not one product. It is one **engine** — property ⇄ owner ⇄ manager, money held in trust, work ordered against units, statements rendered — packaged for three buyers:

| Edition                      | Who                     | Manages                                   | Buys because                                                                             |
| ---------------------------- | ----------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Self-Manage**              | Landlord                | Their _own_ units                         | Replace spreadsheets + WhatsApp; collect rent, handle maintenance, see the numbers       |
| **Agency (Professional PM)** | Letting/managing agency | _Other people's_ portfolios under mandate | Run many owners' books with trust accounting, owner reporting, commissions — compliantly |
| **GetRentos Managed**        | GetRentos itself        | Clients' properties as manager-of-record  | Hands-off management with a published fee card + SLA                                     |

The three share **>80% of the surface**. The differences are packaging, who-sees-what, who-gets-paid, and a few workflows (owner approvals, commissions, multi-owner ops). We have already built the hardest, most defensible part — the mandate/authority/trust spine. The opportunity is to complete the **operational toolkit** on top and package the **Agency edition**, which is today the least-built and highest-margin market.

**Why this matters commercially:** the engagement spine is a moat (client-money segregation, two-person controls, authority capabilities, reconciliation). Competitors sell the toolkit; few in this market sell the toolkit _with_ compliant trust accounting and a platform-as-manager option. That is a wedge into both DIY landlords (volume) and agencies (margin + stickiness).

---

## 2. What exists today (build-vs-gap map)

Legend: ✅ built / deep · 🟡 partial · ⛔ gap

### The spine — ✅ strong (built, much of it this session)

- **Mandate / engagement layer** (`property-management`): mandates, **authority capabilities** (LIST / MANAGE / TRANSACT), **servicing tiers** (Collect 5% / Collect+Maintain 8% / Full 10%), published **fee card** + **SLA**, owner self-serve **opt-in**, ops **activation**, **reassign manager**, **suspend/resume**, **request → approve termination** (two-person maker/checker), **delivery partners** (hand-off), **vetted-firm directory + real-data ranking**.
- **Trust / client-money accounting** (`trust`, `client-money`): segregated client accounts, **daily reconciliation**, **release approval** (above-threshold two-person), **payouts** (Paystack), **owner statements** (gross / fee / VAT / WHT / net) with **email + PDF** and **line-item disputes**, closing statement auto-generated on both termination paths.
- **Backoffice ops** for GetRentos Managed: activation queue (bulk activate/reject, saved views, search), active-engagements (bulk reassign / pause / resume / request-end), termination-requests approval queue, **nav queue-count badge**, notice-position context.
- **Owner lifecycle notifications**: activated / suspended / resumed / manager-changed / ended (in-app + email), owner-exempt, best-effort.

### The toolkit — mixed

- **Portfolio & relationship** — ✅ properties, units, **PropertyAuthority** capability model, **Organization/AGENCY** model (members: OWNER / STAFF / ACCOUNTANT).
- **Leasing & tenant lifecycle** — 🟡 listings, viewing requests, offers, applications, **tenant screening** (applicant docs + credit-check seam), leases + **renewal check**, tenants. ⛔ **move-in / move-out condition flows**, structured renewals/rent-review proposals.
- **Rent & payments** — ✅ invoicing/schedules, Paystack, **Flex** financing, arrears tracking + **reminders/overdue automations**. ⛔ **automated late fees**, autopay, a collections escalation ladder beyond reminders.
- **Maintenance** — ✅ requests/work orders, **vendor dispatch + ratings + visits + performance**, **SLA/breach** (`home-management`), ✅ **preventive/scheduled maintenance** (plans auto-raise work orders on their cadence, shipped 2026-10-11). ⛔ **inspections** (condition reports, routine inspections with photos — today only a _document category_).
- **Financials & reporting** — ✅ expenses, income, **portfolio analytics** (NOI / cap rate / yield), owner statements, ✅ **budgets vs actuals** (per property/category/period target vs expense + work-order actuals, shipped 2026-10-11). 🟡 exports; ⛔ **report library** (rent roll, arrears report, per-owner P&L, tax packs).
- **Owner experience** — ✅ owner statements, managed page (now shows portfolio manager + delivery partner). 🟡 owner approvals = only the client-money release threshold + TRANSACT gate; ⛔ **owner-facing "approve this expense / maintenance over cap / lease terms" workflow**, ⛔ **owner onboarding flow**.
- **Compliance & legal** — ✅ statutory **notices**, **legal cases** (+ costs to owner). ⛔ **deposit protection** (deposit is a field, no lifecycle), ✅ **client-money protection** (reconciliation + segregation enforced; firm scheme-adherence attestations shipped 2026-10-10), ⛔ document-retention policy, agency licensing/registration.
- **Agency operations (multi-owner)** — 🟡 the AGENCY org holds mandates + has members/roles. ⛔ **agency-wide dashboards across many owners**, ✅ **client (owner) CRM + invite/claim onboarding** (shipped 2026-10-10/11), ✅ **letting/renewal commission charging + payout settlement** (shipped 2026-10-10), ✅ **per-agent commission split** (attribution + tracking, shipped 2026-10-11; on-platform per-agent payout intentionally out of scope), ✅ per-owner trust-accounting views (shipped 2026-10-10) + ✅ protection attestations. **This was the biggest underbuilt market — now built.**
- **Disbursements / reserves** — ✅ payout on statement issue. ✅ **recurring/scheduled owner disbursements** + ✅ **reserve/float per owner** (shipped 2026-10-11; daily cron sweeps `balance − reserve` on a weekly/fortnightly/monthly cadence, below-threshold auto-pays via the shared payout rail, at/above-threshold is HELD + owner notified for manual two-person approval; v1 covers GetRentos-held money (`organizationId = null`); owner self-serve via Financials → Auto Payouts).
- **Communications & automation** — ✅ messaging, notifications, email dispatcher, some automations (reminders/overdue/lease-expiry), ✅ **bulk comms/templates** + ✅ **automation rules engine** (scheduled recurring tenant broadcasts, shipped 2026-10-11). ⛔ event-triggered rules generalizing the fixed financial automations (follow-up).
- **Field / mobile** — ✅ mobile portal parity for dashboards, ✅ **field inspection on-site capture with real evidence photos** (native Expo + web agent portal, shipped 2026-10-11). ⛔ **field maintenance tooling** (agent updating work orders — needs a new agent↔work-order scoping primitive; follow-up).

**Net:** the engagement + money spine is ~done and defensible. The **operational toolkit is ~60% there for a self-managing landlord, ~30% there for a professional agency.**

---

## 3. The comprehensive module — functional areas

Each area is shared across editions unless noted. Status is the _starting point_, not the target.

1. **Onboarding** — owner onboarding, property/unit onboarding, mandate creation + e-sign, opening balances. _(⛔ owner onboarding)_
2. **Portfolio & relationship** — properties, units, ownership, mandates, authority capabilities, delivery partners. _(✅)_
3. **Leasing & vacancy** — marketing/listing, enquiries, viewings, applications, screening, lease + e-sign, deposits taken. _(🟡)_
4. **Tenancy operations** — move-in (condition report), ongoing tenancy, renewals/rent reviews, move-out (condition + deductions), deposit return. _(⛔ move-in/out, deposit lifecycle)_
5. **Rent & receivables** — schedules, invoicing, online payment, autopay, **late fees**, arrears ladder, receipts, Flex. _(🟡 — late fees/autopay/ladder are gaps)_
6. **Maintenance & inspections** — requests, triage, vendor dispatch, SLA, scheduling, approvals/caps, **preventive plans**, **inspections** (routine + move-in/out, photo evidence). _(✅ preventive plans auto-generate work orders, shipped 2026-10-11; ⛔ inspections condition reports)_
7. **Trust accounting & disbursements** — segregated client money, reconciliation, owner statements (fee/VAT/WHT), **owner payouts incl. scheduled/recurring**, **reserves/float**. _(✅ core; ✅ scheduling/reserves shipped 2026-10-11)_
8. **Owner experience & approvals** — owner portal, statements, documents, **approval workflow** (expense/maintenance over cap, lease terms, major works). _(🟡)_
9. **Financials, budgets & reporting** — P&L/NOI, **budgets vs actuals**, **report library + exports**, tax packs. _(✅ budgets vs actuals shipped 2026-10-11; P&L/NOI ✅; ⛔ full report library/tax packs)_
10. **Compliance & legal** — notices, legal cases, **deposit protection**, **client-money protection**, retention, agency licensing. _(🟡/⛔)_
11. **Agency operations** — multi-owner dashboards, **client CRM**, **commissions** (letting/renewal), **agent payouts**, team roles, white-label/microsite. _(⛔)_
12. **Communications & automation** — messaging, notifications, templates/bulk, **rules engine**. _(✅ bulk comms + templates + scheduled rules engine shipped 2026-10-11; ⛔ event-triggered rules a follow-up)_
13. **Field & mobile** — on-site inspections/maintenance, offline capture. _(⛔)_
14. **Packaging & monetization** — editions, plans, fee models, partner splits. _(🟡)_

---

## 4. Gaps to close (prioritized)

> **Delivery status (updated 2026-10-10):** Phase B (operational completeness) is COMPLETE — all five P0 items shipped. Next up: Phase C (Agency edition).

**P0 — operational completeness (serves all three editions, unblocks credibility):**

1. ✅ **Inspections** _(shipped 2026-10-10)_ — move-in / move-out condition reports + routine inspections with photos; feeds deposit deductions and maintenance. _(highest-impact single gap)_
2. ✅ **Deposit lifecycle** _(shipped 2026-10-10)_ — take, hold (protected), deduct at move-out, return; ties to inspections + compliance.
3. ✅ **Automated late fees + arrears ladder** _(shipped 2026-10-10)_ — real receivables management, not just reminders. _(A full configurable rules engine remains P2 #14.)_
4. ✅ **Owner approvals workflow** _(shipped 2026-10-10)_ — owner signs off manager spend above a per-mandate cap (new maker/checker approval + owner inbox + cap control). _(Expenses shipped first; maintenance-work-order spend approval shipped 2026-10-10 as part of the home-management PropertyAuthority rewire.)_
5. ✅ **Reporting & exports** _(shipped 2026-10-10)_ — rent roll, per-property P&L (date range), arrears, statement history; CSV exports (+ existing per-statement PDF).

**P1 — the Agency edition (the margin market) — ✅ SHIPPED:** 6. ✅ **Multi-owner agency dashboards** _(shipped 2026-10-10: /agency/owners groups mandates by client; plus the manager home-management workspace at /agency/home-management shipped 2026-10-11)_. 7. ✅ **Client (owner) CRM + onboarding** for agencies _(CRM shipped 2026-10-10: /agency/owners/[id] contact card, stage, notes; invite/claim onboarding shipped 2026-10-11: AgencyOwnerInvite + email + public /agency-invite/claim page reusing signup/login)_. 8. ✅ **Commissions** — letting (10%) / renewal (5%) _(shipped 2026-10-10: auto-earned on managed let/renewal, per-firm rate card, /agency/commissions ledger, and payout settlement — the firm claims earned commissions into a Paystack batch payout with history; per-agent commission split (attribution + tracking) shipped 2026-10-11)_. 9. ✅ **Agency trust-accounting compliance** _(shipped 2026-10-10: per-owner client-money ledger on the client page + client-money-protection attestations register, surfaced on the owner's money view)_.

**P2 — scale & depth:** 10. ✅ **Scheduled owner disbursements + reserves/float** _(shipped 2026-10-11)_. 11. ✅ **Preventive/scheduled maintenance** _(shipped 2026-10-11)_. 12. ✅ **Budgets vs actuals** _(shipped 2026-10-11)_. 13. 🟡 **Field/mobile inspection + maintenance app** _(inspection photo capture shipped 2026-10-11; field-maintenance a follow-up)_. 14. ✅ **Automation rules engine + bulk comms/templates** _(shipped 2026-10-11)_. 15. ✅ **GetRentos Managed partner commercials** — partner fee-split _(shipped 2026-10-11; partner payout settlement a follow-up)_.

---

## 5. Phased delivery

- **Phase A — Spine (DONE):** mandates, authority, servicing tiers, trust accounting, owner statements, GetRentos Managed ops, owner lifecycle notifications.
- **Phase B — Operational completeness (P0) — DONE (2026-10-10):** ✅ inspections, ✅ deposit lifecycle (both portals), ✅ late fees + arrears ladder, ✅ owner approvals, ✅ reporting/exports. _Outcome delivered: a credible self-manage + managed product._
- **Phase C — Agency edition (P1) — SHIPPED (2026-10-10):** ✅ multi-owner dashboards, ✅ client CRM (invite/claim onboarding left), ✅ commissions (letting/renewal earning + rate card + ledger + **Paystack payout settlement** shipped 2026-10-10: the firm claims earned commissions into a batch payout to its own account, with step-up + trust-tier hardening on the payout account/withdraw added 2026-10-11), ✅ per-owner trust views + ✅ protection attestations, ✅ home-management PropertyAuthority rewire (managers operate assets/work-orders/vendors/quotes/invoices for managed properties; money = TRANSACT) + ✅ maintenance-spend owner approval (over-cap manager spend routed to the owner), ✅ owner invite/claim onboarding (shipped 2026-10-11), ✅ manager-facing home-management UI in the agency portal (shipped 2026-10-11: /agency/home-management reuses the home-management workspace for managed properties), ✅ per-agent commission split (attribution + tracking, shipped 2026-10-11). **Phase C fully shipped.** On-platform per-agent payout (splitting the firm's payout into N per-agent transfers) is intentionally out of scope. _Outcome delivered: a credible professional-agency edition._
- **Phase D — Scale & depth (P2):** ✅ scheduled disbursements + reserves (shipped 2026-10-11: owner self-serve standing instruction in Financials → Auto Payouts; daily cron, below-threshold auto-pays, at/above-threshold HELD for manual approval; v1 GetRentos-held money only); ✅ preventive maintenance (shipped 2026-10-11: a daily scheduler auto-raises a work order when a plan falls due, advances the cycle, assigns the plan's vendor, dedupes against an open prior job, and links the work order back to the plan); ✅ budgets vs actuals (shipped 2026-10-11: a Budget model — property × optional category × period — + a service summing expenses and un-linked resolved work-order costs into the current period's actual/variance/utilisation; Financials → Budgets tab); ✅ automation rules engine + bulk comms/templates (shipped 2026-10-11: landlord Automations area — bulk tenant broadcast to an audience (all / by property / in arrears) with {{merge_field}} templates, fanned out as notifications→email; + a configurable AutomationRule that broadcasts on a recurring cadence via a daily cron; scoped to scheduled broadcasts, event-triggered rules a follow-up); 🟡 field/mobile (shipped 2026-10-11: real evidence photos on the agent on-site inspection capture — AgentInspectionPhoto + agent-scoped multipart upload/signed read, wired into both the native Expo field app and the web agent portal; field-maintenance — an agent updating work orders — is a follow-up needing a new agent↔work-order scoping primitive); ✅ partner commercials (shipped 2026-10-11: a per-delivery-partner fee-split config + an immutable split record cut when an owner statement is issued — the manager's gross fee split into partner vs platform shares, snapshotted + idempotent; ops configures + reviews in backoffice; partner payout settlement a follow-up reusing the partner's agency payout rails). **Phase D (P2) complete** — two follow-ups remain (field-maintenance, event-triggered rules, partner payout).

Each phase ships in the established build→verify-live→commit slices, behind plan gating where it's a paid capability.

---

## 6. Monetization across editions

| Edition               | Model                                                | Notes                                                                                                             |
| --------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Self-Manage**       | Free / **Pro** SaaS (exists)                         | Gate advanced: analytics, automations, reporting, microsite.                                                      |
| **Agency**            | Per-unit SaaS **or** platform % + SaaS               | Stickiest revenue; trust accounting + compliance are the lock-in. Agent-seat pricing optional.                    |
| **GetRentos Managed** | Servicing fee **5/8/10%** + letting 10% / renewal 5% | Fee card built; letting/renewal **commission charging built (2026-10-10)**; **partner fee-split still to build.** |

Cross-sell path: DIY landlord → outgrows self-manage → **GetRentos Managed** or **appoint a vetted agency** (both already modeled). The directory + ranking makes the agency marketplace a funnel.

---

## 7. Compliance & risk (Nigeria context)

- **Client-money protection** — segregation + reconciliation exist; formalize a protection-scheme posture + attestations before marketing the Agency edition (agencies holding others' money is regulated/scrutinized).
- **Deposit protection** — no deposit lifecycle today; needed for tenancy credibility and dispute defensibility.
- **Agency licensing/registration** — capture + verify agency credentials (ties to the existing ProfessionalStanding/verification system).
- **Fees never silently netted** — existing principle; every deduction is a statement line. Keep this as commissions/partner-splits are added.
- **Data/retention** — document-retention policy for leases, notices, inspections, statements.

---

## 8. Open decisions (need product/business calls)

1. **Agency pricing** — per-unit SaaS vs % vs hybrid; agent-seat pricing.
2. **Partner commercials** (GetRentos Managed hand-off) — ✅ partner's cut of the fee now on-platform (shipped 2026-10-11); partner payout settlement still a follow-up.
3. **Deposit protection** — in-house held vs third-party scheme.
4. **Credit-check provider + who pays** (already flagged open in tenant screening).
5. **Coverage model** for "no local presence" → when to auto-suggest a delivery partner vs decline.
6. **Owner-approval caps** — defaults and who sets them (owner vs agency vs GetRentos).
7. **Scope of the Agency MVP** — smallest set that lets a real agency run a book on us (recommend: multi-owner dashboard + client CRM + commissions + per-owner statements).

---

## 9. Recommendation

The spine is done and is the hard part. **Prioritize Phase B (operational completeness) to make the product credible for self-manage + managed, then Phase C (Agency edition) to open the margin market.** The Agency edition is the single biggest untapped opportunity and is mostly _assembly_ on top of the engine we already have, not net-new infrastructure. Partner commercials and field/mobile are real but can follow.

---

# Part II — Strategy to dominate the market

> Part I is **what we build**. Part II is **how we win the market**. Feature parity gets us _in the game_; domination comes from segmentation, a sharp wedge, network effects, and NG-native rails — not a longer feature list.

## S1. Segments & beachhead (land → expand)

| Segment                        | Size signal                                                           | Pain / willingness-to-pay                                                     | Our play                                                                                       |
| ------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Diaspora / absentee owners** | Millions of Nigerians abroad with property at home; remittance-linked | **Highest** — can't self-manage, don't trust local agents, will pay a premium | **GetRentos Managed** (beachhead) — remote onboarding, protected money, English-language trust |
| **Professional agencies**      | Fragmented, mostly on spreadsheets/WhatsApp                           | High — need trust accounting + owner reporting to scale & stay compliant      | **Agency edition** — margin + supplies the marketplace                                         |
| **Self-managing landlords**    | Large, long tail                                                      | Low ARPU, high volume                                                         | **Self-Manage** (Free/Pro) — top of funnel, upsell to Managed/agency                           |
| **Developers / estates**       | Bulk units, new builds                                                | Medium — lettings + service charges at scale                                  | Estate module + bulk onboarding (later)                                                        |
| **Institutional / REIT-like**  | Emerging                                                              | High rigor                                                                    | Much later                                                                                     |

**Beachhead: diaspora-owner _Managed_ + agencies, in parallel.** Diaspora owners are the segment that most needs what only we offer (hands-off + money protection) and pay the most; they showcase the trust spine. Agencies supply ranked managers and bring their owner books. Self-manage is the free funnel beneath both. Land there, expand down-market and into estates.

## S2. Competitive positioning

- **Reference set:** local NG proptech (rent-collection / listing / management startups — mostly single-feature) and global benchmarks (AppFolio, Buildium, DoorLoop, Yardi, Hemlane). _(A real competitive scan is an action item — names here are the category, not a verified audit.)_
- **Where most local tools stop:** rent collection + listings. Few offer **compliant trust accounting**, fewer offer **platform-as-manager**, essentially none offer a **vetted-manager marketplace**.
- **Positioning:** _"The trust rail for Nigerian property management — the one place an owner can self-manage, hire a vetted manager, or have GetRentos manage it, with their money protected and their records portable."_
- **Must-reach parity (don't lose on):** payments UX, maintenance, reporting, mobile.
- **Win on:** trust (held funds + protected deposits + dispute adjudication), the three-editions optionality, and NG-native rails below.

## S3. The flywheel & network effects (why it compounds)

- **Two-sided marketplace:** more owners → more mandates → more agencies join → better, _ranked_ supply → more owners choose us. The vetted-firm directory + real-data ranking (already built) is the engine.
- **Trust rail = system of record:** client money, statements, and history accrue switching cost; leaving means abandoning the record.
- **Data network effects:** rent benchmarks, tenant-quality signals, and agency performance ranking improve matching and pricing — and are hard to replicate without the volume.
- **Portability as a feature, not a leak:** "your history stays with you" earns trust _and_ raises switching cost once the history is deep.

## S4. NG-native wedges (how we win _here_ specifically)

1. **Dedicated virtual accounts per tenant/lease** (Paystack/Flutterwave) → **automatic reconciliation**, no "I already sent it" disputes. One of the highest-leverage, most defensible NG wedges — build early.
2. **Diaspora product**: remote owner onboarding, Managed-by-default, remittance-friendly payouts, status visibility from abroad.
3. **WhatsApp as a first-class channel** (rent nudges, maintenance updates, approvals) — not generic in-app messaging. It's where Nigerians actually are.
4. **Trust deficit as the wedge**: "Held by GetRentos," protected deposits, ranked managers, line-item dispute adjudication — directly answers the #1 reason owners distrust agents.
5. **Cash / annual-rent realities**: Flex installments (built) + flexible schedules address how NG rent actually flows.
6. **Service charges & estate levies** via the Estate module — captures the managed-community money layer.

## S5. Modern / AI wedges

- **AI**: arrears-risk scoring + collections prioritization, maintenance auto-triage + vendor suggestion, listing/description generation, owner-statement anomaly detection, owner/tenant copilots.
- **Open API + integrations**: become the **rail others build on** — accounting/GL export for agencies, banks, insurers, utilities, screening bureaus. Ecosystem = durability.

## S6. Monetization depth (pricing power from many lines)

Beyond the per-edition table in Part I: **managed take-rate** (5/8/10%), **agency SaaS** (per-unit/seat), **payment float / virtual-account fees**, **Flex financing margin**, **marketplace commission** on agency appointments, and **premium add-ons** (insurance, screening, rent benchmarking). Multiple revenue lines → resilience and room to undercut single-line competitors on the headline fee.

## S7. North star & KPIs

- **North star:** **Units Under Management (UUM)** and **GMV through the trust rail**.
- **KPIs:** UUM; GMV; agencies onboarded + their retention; managed-engagement count; owner net revenue retention; arrears rate; time-to-reconcile; dispute rate; NPS (owner / tenant / agency).
- **Define "dominate":** e.g. **#1 by UUM in target metros (Lagos/Abuja/PH) and the default rail for professionally-managed units** within the plan horizon — set the number with the business.

## S8. Execution & regulatory risk (the moat _and_ the threat)

- **Client money at scale** is both the deepest moat and the biggest risk: protection-scheme posture, audits, segregation, and (likely) licensing must be invested in early, not bolted on. Get this right and it's very hard to catch us; get it wrong and it's existential.
- **Ops scaling** for GetRentos Managed (portfolio-manager capacity), support, and field coverage gate how fast Managed can grow.
- **Sequencing realism:** Part I's "mostly assembly" is true for the _engine_; the GTM, trust/regulatory, and supply (agency onboarding) work is its own lift.

## S9. The path to dominance (revised recommendation)

1. **Phase B** (operational completeness) to be credible — in parallel with:
2. **Virtual-account reconciliation + WhatsApp + the diaspora Managed product** as the NG wedges that differentiate from day one.
3. **Phase C — the Agency edition** to light the marketplace flywheel (supply of ranked managers).
4. Then **AI + open API** to become the rail, and **estates/developers** to expand.
5. Steer by **UUM / GMV**, and treat **client-money compliance** as a first-class workstream throughout.

Feature parity makes us competitive. **The wedge (trust + virtual accounts + WhatsApp), the marketplace flywheel, and the diaspora beachhead are what make us the default — i.e., dominant.**
