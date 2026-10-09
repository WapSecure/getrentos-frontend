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
- **Maintenance** — ✅ requests/work orders, **vendor dispatch + ratings + visits + performance**, **SLA/breach** (`home-management`). ⛔ **inspections** (condition reports, routine inspections with photos — today only a _document category_), ⛔ **preventive/scheduled maintenance**.
- **Financials & reporting** — ✅ expenses, income, **portfolio analytics** (NOI / cap rate / yield), owner statements. 🟡 exports; ⛔ **report library** (rent roll, arrears report, per-owner P&L, tax packs), ⛔ **budgets vs actuals**.
- **Owner experience** — ✅ owner statements, managed page (now shows portfolio manager + delivery partner). 🟡 owner approvals = only the client-money release threshold + TRANSACT gate; ⛔ **owner-facing "approve this expense / maintenance over cap / lease terms" workflow**, ⛔ **owner onboarding flow**.
- **Compliance & legal** — ✅ statutory **notices**, **legal cases** (+ costs to owner). ⛔ **deposit protection** (deposit is a field, no lifecycle), 🟡 **client-money protection** (reconciliation exists; formal scheme adherence/attestations unclear), ⛔ document-retention policy, agency licensing/registration.
- **Agency operations (multi-owner)** — 🟡 the AGENCY org holds mandates + has members/roles. ⛔ **agency-wide dashboards across many owners**, ⛔ **client (owner) CRM/onboarding**, ⛔ **letting/renewal commission charging**, ⛔ **agent commission/payout**, ⛔ per-owner trust-accounting views. **This is the biggest underbuilt market.**
- **Disbursements / reserves** — 🟡 payout on statement issue. ⛔ **recurring/scheduled owner disbursements**, ⛔ **reserve/float per owner**.
- **Communications & automation** — ✅ messaging, notifications, email dispatcher, some automations (reminders/overdue/lease-expiry). ⛔ **rules engine** (configurable workflows), bulk comms/templates.
- **Field / mobile** — 🟡 mobile portal parity for dashboards. ⛔ **field inspection/maintenance tooling** (on-site capture).

**Net:** the engagement + money spine is ~done and defensible. The **operational toolkit is ~60% there for a self-managing landlord, ~30% there for a professional agency.**

---

## 3. The comprehensive module — functional areas

Each area is shared across editions unless noted. Status is the _starting point_, not the target.

1. **Onboarding** — owner onboarding, property/unit onboarding, mandate creation + e-sign, opening balances. _(⛔ owner onboarding)_
2. **Portfolio & relationship** — properties, units, ownership, mandates, authority capabilities, delivery partners. _(✅)_
3. **Leasing & vacancy** — marketing/listing, enquiries, viewings, applications, screening, lease + e-sign, deposits taken. _(🟡)_
4. **Tenancy operations** — move-in (condition report), ongoing tenancy, renewals/rent reviews, move-out (condition + deductions), deposit return. _(⛔ move-in/out, deposit lifecycle)_
5. **Rent & receivables** — schedules, invoicing, online payment, autopay, **late fees**, arrears ladder, receipts, Flex. _(🟡 — late fees/autopay/ladder are gaps)_
6. **Maintenance & inspections** — requests, triage, vendor dispatch, SLA, scheduling, approvals/caps, **preventive plans**, **inspections** (routine + move-in/out, photo evidence). _(⛔ inspections + preventive)_
7. **Trust accounting & disbursements** — segregated client money, reconciliation, owner statements (fee/VAT/WHT), **owner payouts incl. scheduled/recurring**, **reserves/float**. _(✅ core; ⛔ scheduling/reserves)_
8. **Owner experience & approvals** — owner portal, statements, documents, **approval workflow** (expense/maintenance over cap, lease terms, major works). _(🟡)_
9. **Financials, budgets & reporting** — P&L/NOI, **budgets vs actuals**, **report library + exports**, tax packs. _(🟡/⛔)_
10. **Compliance & legal** — notices, legal cases, **deposit protection**, **client-money protection**, retention, agency licensing. _(🟡/⛔)_
11. **Agency operations** — multi-owner dashboards, **client CRM**, **commissions** (letting/renewal), **agent payouts**, team roles, white-label/microsite. _(⛔)_
12. **Communications & automation** — messaging, notifications, templates/bulk, **rules engine**. _(🟡)_
13. **Field & mobile** — on-site inspections/maintenance, offline capture. _(⛔)_
14. **Packaging & monetization** — editions, plans, fee models, partner splits. _(🟡)_

---

## 4. Gaps to close (prioritized)

**P0 — operational completeness (serves all three editions, unblocks credibility):**

1. **Inspections** — move-in / move-out condition reports + routine inspections with photos; feeds deposit deductions and maintenance. _(highest-impact single gap)_
2. **Deposit lifecycle** — take, hold (protected), deduct at move-out, return; ties to inspections + compliance.
3. **Automated late fees + arrears ladder** — real receivables management, not just reminders.
4. **Owner approvals workflow** — owner signs off expenses/maintenance over a cap and lease terms (reuses the TRANSACT/threshold gate, adds an owner-facing step).
5. **Reporting & exports** — rent roll, arrears, per-owner P&L, statement history; CSV/PDF.

**P1 — the Agency edition (the margin market):** 6. **Multi-owner agency dashboards** + per-owner portfolio views. 7. **Client (owner) CRM + onboarding** for agencies. 8. **Commissions** — letting (10%) / renewal (5%) charging + **agent commission/payout**. 9. **Agency trust-accounting compliance** — per-owner ledgers, protection-scheme attestations.

**P2 — scale & depth:** 10. **Scheduled owner disbursements + reserves/float.** 11. **Preventive/scheduled maintenance.** 12. **Budgets vs actuals.** 13. **Field/mobile inspection + maintenance app.** 14. **Automation rules engine** + bulk comms/templates. 15. **GetRentos Managed partner commercials** (deferred from the PMC stream — partner fee-split).

---

## 5. Phased delivery

- **Phase A — Spine (DONE):** mandates, authority, servicing tiers, trust accounting, owner statements, GetRentos Managed ops, owner lifecycle notifications.
- **Phase B — Operational completeness (P0):** inspections, deposit lifecycle, late fees + arrears ladder, owner approvals, reporting/exports. _Outcome: a credible self-manage + managed product._
- **Phase C — Agency edition (P1):** multi-owner dashboards, client CRM + onboarding, commissions + agent payouts, per-owner trust views + protection attestations. _Outcome: sell to professional agencies._
- **Phase D — Scale & depth (P2):** scheduled disbursements + reserves, preventive maintenance, budgets, field/mobile, rules engine, partner commercials.

Each phase ships in the established build→verify-live→commit slices, behind plan gating where it's a paid capability.

---

## 6. Monetization across editions

| Edition               | Model                                                | Notes                                                                                          |
| --------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Self-Manage**       | Free / **Pro** SaaS (exists)                         | Gate advanced: analytics, automations, reporting, microsite.                                   |
| **Agency**            | Per-unit SaaS **or** platform % + SaaS               | Stickiest revenue; trust accounting + compliance are the lock-in. Agent-seat pricing optional. |
| **GetRentos Managed** | Servicing fee **5/8/10%** + letting 10% / renewal 5% | Fee card built; **commission charging + partner fee-split still to build.**                    |

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
2. **Partner commercials** (GetRentos Managed hand-off) — partner's cut of the fee, and whether the owner sees the split (deferred in the PMC stream).
3. **Deposit protection** — in-house held vs third-party scheme.
4. **Credit-check provider + who pays** (already flagged open in tenant screening).
5. **Coverage model** for "no local presence" → when to auto-suggest a delivery partner vs decline.
6. **Owner-approval caps** — defaults and who sets them (owner vs agency vs GetRentos).
7. **Scope of the Agency MVP** — smallest set that lets a real agency run a book on us (recommend: multi-owner dashboard + client CRM + commissions + per-owner statements).

---

## 9. Recommendation

The spine is done and is the hard part. **Prioritize Phase B (operational completeness) to make the product credible for self-manage + managed, then Phase C (Agency edition) to open the margin market.** The Agency edition is the single biggest untapped opportunity and is mostly _assembly_ on top of the engine we already have, not net-new infrastructure. Partner commercials and field/mobile are real but can follow.
