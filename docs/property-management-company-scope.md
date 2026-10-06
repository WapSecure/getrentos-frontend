# Property Management Company (PMC) — Enterprise Scope

**Status:** Scope for review · **Date:** 2026-09-30
**Goal:** Let a property-management firm (or GetRentos itself) take over the running of a
landlord's property — including rent collection, maintenance, compliance and legal
proceedings — while the landlord keeps ownership, visibility and control.

---

## 0. The headline finding (read this first)

**Most of this already exists in the backend, and it is half-wired.** Before designing
anything new we must finish what is there, because building beside it will create two
competing systems of record.

What exists today:

| Capability                                           | Where it lives                                                                                                                                                                                                                                                                                                              | State                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Delegation of authority over someone else's property | `PropertyAuthority` + `src/shared/property-authority/*`                                                                                                                                                                                                                                                                     | **Built.** Relationships include `PROPERTY_MANAGER`, `POWER_OF_ATTORNEY`, `AGENT`, `CO_OWNER`, `BENEFICIAL_OWNER`, `LEGAL_OWNER`; capabilities `LIST / MANAGE / TRANSACT`; statuses `PENDING → ACTIVE → REJECTED / REVOKED / EXPIRED`; methods `request`, `approve`, `reject`, `revoke`, `effectiveFor`, `accessFor`, `authorizeFor`, `managedPropertyIds`, `managedProperties`; plus an expiry sweeper |
| A management firm as an entity                       | `Organization` (`type = AGENCY`) + `OrganizationMember` (`OWNER / STAFF / ACCOUNTANT`, per-member `permissions` JSON)                                                                                                                                                                                                       | **Modelled, barely surfaced.** `Organization` is referenced in 21 files, but almost all of that is `ESTATE` usage, not agency                                                                                                                                                                                                                                                                           |
| Management fees                                      | `ManagementFeeConfig` (`type = PERCENTAGE \| FLAT`, org-level or property-level) + `landlord/management-fee-config`                                                                                                                                                                                                         | **One service only**                                                                                                                                                                                                                                                                                                                                                                                    |
| Owner statements & settlement                        | `OwnerStatement` (+ `OwnerStatementLineItem`) with `grossIncome / totalExpenses / managementFee / netPayout`, `DRAFT → ISSUED`, payout `PENDING / PAID / FAILED`, `transferRef`; `landlord/owner-statements`; also an estate variant                                                                                        | **Built for landlord, needs the agency case**                                                                                                                                                                                                                                                                                                                                                           |
| A landlord/PM back office                            | `src/modules/landlord/*` — **24 controllers**: portfolio, properties, units, leases, payments, arrears, financials, expenses, maintenance, vendors, tenants, applications, viewing-requests, listings, leads, offers, documents, messages, reviews, settings, dashboard, evictions, management-fee-config, owner-statements | **Built and broad**                                                                                                                                                                                                                                                                                                                                                                                     |
| Eviction / legal                                     | `EvictionCase` (`DRAFT → ISSUED → FILED → RESOLVED / WITHDRAWN`), `src/shared/eviction/*`, `landlord/evictions`, admin exposure                                                                                                                                                                                             | **Built, eviction-only**                                                                                                                                                                                                                                                                                                                                                                                |
| Service delivery (maintenance ops)                   | `src/modules/home-management/*` — work orders, vendor quotes, vendor invoices, units, SLA, timeline                                                                                                                                                                                                                         | **Built**                                                                                                                                                                                                                                                                                                                                                                                               |
| Trust/verification for the role                      | `TrustSubjectType` already contains `PROPERTY_MANAGER`                                                                                                                                                                                                                                                                      | **Enum only**                                                                                                                                                                                                                                                                                                                                                                                           |
| Backoffice oversight                                 | `admin/property-authorities`, `admin/estates`, `admin/rentals`                                                                                                                                                                                                                                                              | **Built**                                                                                                                                                                                                                                                                                                                                                                                               |

**What is genuinely missing:**

1. **No `PROPERTY_MANAGER` user role.** `RoleType` has `ESTATE_MANAGER` (gated-community manager) but nothing for a managing agent. A firm's staff cannot sign in to a portfolio workspace.
2. **Delegation is enforced in only a few places.** Verified honouring authority:
   `landlord-listings`, `landlord-units`, `landlord-viewing-requests`, `landlord-lead-nudges`.
   `landlord-properties` is still **owner-first** (`ownerId: landlordId` for count, create, update, media, delete). The other ~19 landlord services have not been audited. **Any read or write that scopes by `ownerId` alone is a security hole the moment a manager exists** — they would see nothing, or worse, everything.
3. **No agency workspace.** The `/landlord/*` UI is a single-owner experience. There is no client switcher, no portfolio-of-portfolios, no org/team management UI.
4. **No client-money model.** Grep for `trustAccount | clientAccount | clientMoney` returns **zero**. Statements exist; segregated client funds, ledger and reconciliation do not.
5. **No engagement/agreement artefact.** There is no management-agreement document tying an owner to a firm (fees, term, scope, termination) — `EstatePropertyAgreement` is estate-specific. `POWER_OF_ATTORNEY` is only a _label_ on an authority row, with no document behind it.
6. **GetRentos-as-manager** has no representation at all (no platform-agency organisation, no servicing product).
7. **Legal work stops at eviction** — no rent recovery, no court/case tracking, no lawyer/advocate record, no costs tracking.

---

## 1. Actors and roles (Nigerian market reality)

| Actor                             | Description                                                          | New/changed                                                             |
| --------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Owner / Landlord**              | Absolute owner; can self-manage or appoint a manager                 | exists (`LANDLORD`, `PROPERTY_OWNER`)                                   |
| **Co-owner / family**             | Siblings, spouses, family land; often one collects, all own          | `CO_OWNER` exists as relationship — needs UI + split rules              |
| **Beneficial owner**              | Holds beneficial interest (trust, diaspora nominee, deceased estate) | `BENEFICIAL_OWNER` exists as relationship                               |
| **PMC owner/principal**           | Owns the management firm (organization `ownerId`)                    | `Organization.type = AGENCY` + `OrganizationMemberRole.OWNER`           |
| **PMC staff / portfolio officer** | Manages assigned properties day to day                               | **needs `PROPERTY_MANAGER` role + assignment**                          |
| **PMC accountant**                | Builds statements, reconciles, releases owner funds                  | `OrganizationMemberRole.ACCOUNTANT` exists; **needs capability wiring** |
| **Caretaker / overseer**          | On-site; collects cash, reports faults, shows units                  | **new limited actor** (mobile-first, low-trust)                         |
| **Vendor / artisan**              | Plumber, electrician, cleaner, security                              | `Vendor` exists                                                         |
| **Lawyer / advocate**             | Handles recovery, eviction, court                                    | **new**                                                                 |
| **Tenant / resident**             | Occupies under a lease                                               | exists                                                                  |
| **Buyer / renter**                | Prospective                                                          | exists                                                                  |
| **GetRentos (as manager)**        | The platform itself as managing agent                                | **new servicing mode**                                                  |
| **GetRentos ops**                 | Backoffice: approve mandates, adjudicate, audit                      | exists                                                                  |

**Two operator modes must both work:**

- **Mode A — Owner self-manages** (today's behaviour, must not regress).
- **Mode B — Owner appoints a manager** (PMC _or_ GetRentos). Every landlord capability must work identically, but on someone else's asset, under a mandate, with the owner retaining read access and money visibility.

---

## 2. Domain model: ownership ≠ custody

The single most important principle. Today the code conflates the two: `ownerId` is both
"who owns this" and "who may act on this".

```
Ownership  (Property.ownerId)      → who holds title. Legally constant. Never borrowed.
Custody    (mandate)               → who operates it now, under what fee, until when.
Authority  (PropertyAuthority)     → per-person capability: LIST / MANAGE / TRANSACT.
CustodyOrg (Organization AGENCY)   → the firm; authority rows attach to its members.
```

**Proposed model additions**

| Model                                      | Purpose                                                                        | Key fields                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ManagementMandate`                        | The engagement between owner and manager (firm or GetRentos)                   | `propertyId`, `managerOrganizationId?`, `managerIsGetRentos Bool`, `ownerId`, `scope` (enum set: RENT, MAINTENANCE, LISTINGS, LEGAL, COMPLIANCE, FINANCE), `feeConfigId`, `startAt`, `endAt?`, `noticePeriodDays`, `status` (`DRAFT/PENDING_OWNER/PENDING_OPS/ACTIVE/SUSPENDED/TERMINATED/EXPIRED`), `signedByOwnerAt`, `signedByManagerAt`, `documentId`, `terminationReason`, `handoverAt` |
| `MandateDocument` / reuse documents module | The signed agreement + POA + inventory                                         | links `ManagementMandate`, `POWER_OF_ATTORNEY` authority, `PropertyDocument`                                                                                                                                                                                                                                                                                                                 |
| `ClientMoneyLedgerEntry`                   | Segregated ledger per owner per property (rent in, expenses out, fees, payout) | `ownerId`, `propertyId?`, `organizationId?`, `kind` (`RENT_RECEIVED/EXPENSE/ FEE/OWNER_PAYOUT/ADJUSTMENT/REFUND`), `amount`, `currency`, `refModel/refId`, `balanceAfter`, `statementId?`                                                                                                                                                                                                    |
| `LegalCase`                                | Beyond eviction: recovery, injunction, title dispute, court tracking           | `propertyId`, `tenantId?`, `kind`, `court`, `suitNumber`, `status`, `advocateId?`, `filedAt`, `nextHearingAt`, `costs`, `outcome`                                                                                                                                                                                                                                                            |
| `PropertyInspection`                       | Move-in/out + periodic condition reports (deposit disputes live or die here)   | `propertyId`, `unitId`, `kind` (`MOVE_IN/MOVE_OUT/PERIODIC`), `report`, `media[]`, `signedByTenantAt`                                                                                                                                                                                                                                                                                        |
| `CashCollection`                           | Caretaker cash receipts pending reconciliation (very common in Lagos)          | `propertyId`, `collectedById`, `tenantId`, `amount`, `receivedAt`, `depositedAt?`, `status`                                                                                                                                                                                                                                                                                                  |

**Reuse, don't rebuild:** `ManagementFeeConfig` (fees), `OwnerStatement` (reporting/payout),
`EvictionCase` (fold into `LegalCase` or keep and generalise), `Organization`,
`OrganizationMember`, `PropertyAuthority`, `Expense`, `RentPayment`, `Due`.

---

## 3. Capability & permission model

Replace the current all-or-nothing manager with an explicit matrix. Capabilities extend
today's `LIST | MANAGE | TRANSACT`.

| Capability | Meaning                                                  | Examples                                                                     |
| ---------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `LIST`     | Advertise, show, negotiate                               | publish listing, viewings, applications, offers                              |
| `MANAGE`   | Operate the asset                                        | tenants, leases (create/renew), maintenance, vendors, documents, inspections |
| `TRANSACT` | Move money                                               | record rent, create expenses, request payouts, charge fees                   |
| `COLLECT`  | Receive money on behalf of owner (cash/transfer capture) | caretaker scope                                                              |
| `LEGAL`    | Instruct proceedings                                     | file eviction, recovery, engage lawyer                                       |
| `FINANCE`  | Statements, reconciliations, approve payouts             | accountant scope — **never combined with `TRANSACT`** by default             |
| `SETTLE`   | Release owner funds (maker/checker)                      | second approver                                                              |

**Rules**

- Capabilities are granted **per property** (or per portfolio) with **expiry** — `PropertyAuthority.expiresAt` already supports this.
- **Maker–checker on money**: whoever creates an expense/payout cannot be the sole approver above a threshold (mirrors the existing escrow/finance-approver pattern).
- **Owner always retains**: read on everything, ability to revoke, to see statements, and to receive payouts. A mandate cannot lock an owner out.
- **`TRANSACT` implies an audit trail**, every action attributed to the acting human **and** the mandate (`actorId` + `onBehalfOfMandateId`) — mandatory, not optional.
- Deny-by-default: a new landlord endpoint that forgets authority checks must fail closed. Recommend a shared decorator/guard (e.g. `@RequiresPropertyCapability('MANAGE')`) plus a lint/test that asserts every `propertyId`-bearing route is guarded.

---

## 4. End-to-end engagement lifecycle

```
1. DISCOVER      Owner finds a firm (directory / invite) or opts into GetRentos Managed
2. EVALUATE      Firm profile: trust tier, track record, managed count, fees, reviews
3. ENGAGE        Owner and firm agree scope + fees -> ManagementMandate (DRAFT)
4. VERIFY        Firm KYC (CAC, ESVARBON/NIESV, insurance), owner KYC (NIN/BVN/title)
5. MANDATE       POA + agreement signed; authority rows created; status ACTIVE
6. ONBOARD       Inventory + condition report, keys, documents, utility meters, photos
7. GO LIVE       Listing/tenancy setup, rent schedule, fees applied
8. OPERATE       Rent collection, arrears, maintenance, vendors, inspections, comms
9. REPORT        Periodic OwnerStatement (gross -> expenses -> fee -> net -> payout)
10. SETTLE       Owned funds released to owner (maker/checker), receipted
11. ESCALATE     Arrears -> recovery -> legal case; owner approves costs
12. REVIEW       Renew mandate, adjust fees, change scope
13. TERMINATE    Notice, final statement, handover pack, revoke authorities
```

**Handover is a first-class flow** — Nigerian PM churn is high and handover is where data
and money get lost: handover pack (leases, tenants, balances, deposits held, open work
orders, keys, documents), final statement, arrears ownership, active legal cases, and
authority revoke with a dated audit record.

---

## 5. Functional scope (epics)

### E1 — Organisation & team (firm workspace)

Create/claim an `Organization` of type `AGENCY`; CAC number, logo, address, service areas,
registration evidence. Invite members (`OWNER/STAFF/ACCOUNTANT`) with per-member
`permissions`; suspend/remove; role templates (Principal, Portfolio Officer, Accountant,
Caretaker). Org profile page (public-facing directory listing), trust badge, insurance and
certifications with expiry. **Client switcher** so a staff member sees only assigned owners.

### E2 — Mandate & onboarding

Request/accept mandate (or invited by owner); scope selection; fee schedule
(`ManagementFeeConfig` PERCENTAGE/FLAT, min/max, per-property override); term, notice
period, renewal; e-sign or upload of signed agreement + POA; inventory & condition report
with media; utility meter readings; key register; opening balances (arrears, deposits held,
prepayments); go-live checklist with completion gates. Status machine with owner and ops
approval.

### E3 — Portfolio & custody

"Properties I manage" distinct from "properties I own", with a visible custody banner
("Managing on behalf of X · mandate ends 31 Jan 2027 · fee 10%"). Portfolio filters by
owner, city, occupancy, arrears, mandate end. Per-property custody timeline (every action
attributed to actor + mandate). Bulk operations for large firms.

### E4 — Rent, collections & arrears

Rent schedule per lease (frequency, anniversary, escalation); record payments (bank
transfer, cash via caretaker, card, USSD); part payments and allocation; receipts;
automated reminders (before due, on due, escalating after); arrears ageing buckets
(0-30/31-60/61-90/90+); payment plans; late fees/interest where lawful; **cash collection
register with deposit reconciliation** (caretaker → firm account → owner ledger);
overpayment/credit balance; multi-tenant units; service-charge and levy collection
distinct from rent.

### E5 — Expenses, vendors & procurement

Expense capture with receipt image and category; expense approval thresholds; allocate to
property/unit/owner; vendor directory with KYC, rates, ratings, bank details; request
quotes → compare → award (extend `WorkOrderVendorQuote`); vendor invoices with 3-way match
(quote ↔ invoice ↔ work order); vendor payments and payout accounts; who bears the cost
(owner vs tenant vs shared) as an explicit decision; capital vs operating expense.

### E6 — Maintenance & service delivery

Tenant/owner raises request → triage → assign → work order → vendor quote → approval
(owner if above threshold) → completion evidence → invoice → posted to statement. SLA
targets and breach reporting (`home-management-sla` exists). Preventive plans
(`PreventiveMaintenancePlan`, `HomeAsset`) and asset register with warranty/history.
Emergency protocol and after-hours routing.

### E7 — Tenancy lifecycle

Applications + screening (references, employment, guarantor); tenancy agreement generation
(templates per state — Lagos Tenancy Law and state variations); stamping/registration
tracking; move-in inspection & deposit; renewals (`LeaseRenewalOffer`) with escalation;
rent review; notices; termination (`LeaseTerminationRequest`) and notice-period compliance;
move-out inspection and deposit reconciliation; unit availability and re-let pipeline.

### E8 — Legal & proceedings (the reason many owners hire a manager)

Arrears escalation ladder with evidence capture (reminders → notice to quit → notice of
owner's intention to recover possession → tribunal/court). Generate and track statutory
notices with correct notice periods per state. **Power of Attorney** as a real document
(names the firm, the property, the powers, expiry). `LegalCase` for recovery, injunction,
title dispute; court, suit number, hearing calendar, adjournments; advocate/lawyer record
with fee agreements; costs and disbursements tracked to the owner's account; outcomes and
enforcement (bailiff, police assistance); eviction (existing `EvictionCase`) folded in;
limitation periods and document retention. Owner approval gates for instructing counsel
and for spending.

### E9 — Owner statements & settlement (client money)

Periodic statements per owner: opening balance, rent received, expenses by category (with
receipts), management fee, other income, net position, closing balance, payouts made.
`OwnerStatement` + line items already fit — extend for per-property breakdown and
attachment of source documents. **Funds segregation**: client money must be identifiable
per owner (a `ClientMoneyLedger` + reconciliation), with a stated policy (in Nigeria,
mixing client money with operating funds is a commercial risk and a trust issue; the app
should make it visible and reconcilable even if the e-wallet is a single account).
Maker/checker release, payout to owner's verified bank account, receipts, failed-payout
handling (`OwnerStatementPayoutStatus.FAILED` exists), owner-disputed line items, and
year-end summary for tax.

### E10 — Fees & commissions

`ManagementFeeConfig` at org or property level; PERCENTAGE or FLAT; per-collection vs
monthly retainer vs hybrid; letting/tenancy-renewal commission (often 10% new let,
5% renewal); lease renewal and rent-review uplift sharing; markup on maintenance; VAT and
WHT treatment on management fees; minimum fee floors; fee on arrears recovered; fee
pro-ration on mid-month mandate start/end; fee disputes and credits. **Fees must never be
silently netted** — every deduction appears as a line on the statement.

### E11 — GetRentos as manager (the alternative)

A distinct servicing product beside third-party firms:

- Owner opts into **GetRentos Managed** (plan-gated as today's home-management is, but
  positioned as full management).
- Represented as a mandate with `managerIsGetRentos = true` (no `Organization` needed, or a
  reserved platform org) so **every downstream feature is identical** — no forked logic.
- Pricing tiers by service level (Collect-only / Collect+Maintain / Full incl. legal),
  published fee card, self-serve sign-up, ops-assigned portfolio manager, and SLA against
  GetRentos rather than a partner.
- Where GetRentos has no local presence, partner hand-off with the same mandate model.
- Clear positioning in-product: "Hire a vetted manager" vs "Let GetRentos manage it".

### E12 — Trust, compliance & risk

PMC onboarding: CAC registration, tax ID, professional body membership
(ESVARBON/NIESV or state agency registration e.g. LASRERA), professional indemnity
insurance, physical address, references. Owner-side: title document, NIN/BVN, proof of
ownership (`PropertyAuthority` proof already modelled). Trust tier for firms
(`TrustSubjectType.PROPERTY_MANAGER` exists) with public rating from completed mandates.
Fraud controls: manager cannot add themselves as owner, cannot change owner bank details,
cannot list a property without an ACTIVE mandate, cannot withdraw client money to their own
account, cannot edit statements after issue (credit notes instead). Watchlist/incident
patterns (estate module has them) reused for flagged firms. Data protection (NDPR):
consent for sharing owner/tenant data with the firm, retention on mandate end.

### E13 — Communications

Owner ↔ manager thread per property; manager ↔ tenant; broadcast to all tenants (rent
reminder, water shutdown, AGM); caretaker field reporting; templates and escalation;
in-app + email + SMS + WhatsApp where available; all messages attached to the property
timeline. Owner sees every message (no hidden side channels) — this is a trust feature.

### E14 — Reporting & analytics

Owner: net yield per property, occupancy, arrears trend, expense breakdown, capital
history, statement archive. Manager: portfolio performance, vacant units, ageing arrears,
SLA compliance, vendor spend, fee revenue, manager ranking, mandate churn, collection rate.
GetRentos: verified-manager league, managed AUM, complaints, fee revenue, mandate funnel.
Export (CSV/PDF) and scheduled email delivery of statements.

### E15 — Backoffice / ops

Approve or reject mandate requests; verify firms; adjudicate owner↔manager disputes;
suspend a firm (freeze their mandates and payouts); audit trail viewer; authority register
(`admin/property-authorities` exists — extend); statement oversight; legal case oversight;
regulatory reporting. Ops must be able to **take over a mandate** if a firm collapses
(ownership continuity) — an important Nigerian scenario.

---

## 6. Nigerian market scenarios (coverage checklist)

**Ownership structures**

1. Single individual owner, self-occupying part, letting the rest.
2. Diaspora owner (UK/US/Canada) — never visits; needs reports, statements, and someone
   trusted on the ground; timezone-aware comms; may want proceeds in NGN or remitted.
3. Family/compound ownership — several co-owners, one collects; **split statements** and
   per-owner shares; disagreement between co-owners.
4. Deceased owner / probate — letters of administration, executor as manager.
5. Beneficial/nominee arrangements (a relative holds title, another benefits).
6. Company-owned property (staff housing, investment co).
7. Owner lives abroad, caretaker collects cash, no records.
8. Owner has a manager _and_ an agent — dual mandates with different scopes.
9. Property co-owned with a sitting tenant's relative (informal).
10. Trust/estate with multiple properties and one trustee.

**Portfolio shapes** 11. Single-property owner hiring a firm (fee sensitivity — must be cheap to serve). 12. Small landlord with 3–10 units across one compound. 13. Large firm with hundreds of units and a staff hierarchy. 14. Shortlet-only portfolio (already supported) vs long-let vs mixed. 15. Commercial (shop/office) with service charge and CAM recovery. 16. Estate/community with common areas, levies, and a residents' association. 17. Mixed estate: some developer-retained units under management.

**Tenancy & rent realities** 18. Rent paid annually in advance (very common) — statement must smooth it monthly, not
spike the month it lands. 19. Rent paid monthly/quarterly; part payments; "I'll pay next week" patterns. 20. Tenant pays rent to caretaker in cash with no receipt, then disputes it. 21. Tenant defaults; owner refuses to fund eviction; firm must decide and document. 22. Tenant absconds — unit re-entry, belongings, documentation. 23. Illegal occupant / squatter after lease expiry; change of locks. 24. Tenancy agreement never stamped/registered. 25. Statutory notice periods mis-served, invalidating a case. 26. Rent control / tribunal jurisdiction (Lagos: tenancy tribunal; states differ). 27. Service charge / levy arrears mixing with rent arrears. 28. Rent advance financed (rent-finance product exists) — who repays, who is landlord. 29. Subletting without consent. 30. Tenant improvements and compensation claims at exit. 31. Security deposit held by the _previous_ manager at handover. 32. Utilities in arrears (IKEDC/EKEDC, water) discovered at handover.

**Legal & disputes** 33. Rent recovery action; judgment; enforcement. 34. Eviction (already modelled) at each stage: notice, tribunal, order, bailiff. 35. Title dispute where a third party claims the land — owner needs the firm's help. 36. Government acquisition/demolition notice affecting the property. 37. Insurance claim after fire/flood — manager as claimant. 38. Manager refuses/withholds funds; owner demands statements (adjudication). 39. Manager resigns mid-tenancy; urgent handover with a tenant in arrears. 40. Firm goes bankrupt/absconds — GetRentos intervenes, owner data must survive.

**Money & fees** 41. Per-collection fee vs monthly retainer vs hybrid; percentage on gross vs net. 42. Letting commission on a new tenant, renewal commission on retention. 43. Maintenance markup disclosed vs hidden (must be disclosed). 44. Expense incurred above the owner's approval threshold without consent. 45. Owner pays for a capital improvement — amortisation across statements. 46. Fees on recovered arrears (contingency) — a common Nigerian incentive. 47. VAT (7.5%) and WHT (10% company / 5% individual) on management fees. 48. Multi-currency owner (diaspora) receiving into a Nigerian account. 49. Refund of tenant deposit from a pooled account — who holds it, who pays interest. 50. Failed payout (wrong account, name mismatch) and retry.

**Compliance & risk** 51. Unregistered "agent" posing as a management firm (fraud) — verification gate. 52. Manager collects rent and never remits (the top reason owners distrust managers). 53. Manager lets to themselves/family on favourable terms. 54. Manager shares tenant data externally (NDPR). 55. Estate/state agency enforcement (LASRERA-type registration, signage, receipts). 56. Insurance lapse on a managed building. 57. Fire/gas safety and statutory inspections (Lagos building control). 58. Arson/illegal structure notices. 59. Tax obligations on rental income (owner's TIN, withholding on rent for corporate tenants). 60. Money laundering red flags on large cash collections.

---

## 7. Money architecture (client money safety)

Principles, in order of importance:

1. **Every naira is attributable to an owner and a property.** The `ClientMoneyLedgerEntry`
   above is the backbone — signed, append-only, with `balanceAfter`, referencing the
   originating model. Statements are derived from it, never hand-typed.
2. **Fees are line items, never silent deductions.** Owners see a fee line with its
   `ManagementFeeConfig` basis.
3. **Maker–checker on release.** Above a configurable threshold, two humans approve.
4. **Statements are immutable once issued** — corrections are credit/debit notes that
   appear on the next statement.
5. **Reconciliation is a first-class daily job** — bank/PSP balance vs sum of owner
   balances; a drift report must exist and alert ops.
6. **Owner withdrawal of consent** → mandate terminates, authorities revoke, and any
   accrued balance is still owed and payable (data and money cannot be held hostage).
7. Reuse existing rails: `Transaction`/escrow lifecycle, `Payout`/`PayoutAccount` pattern
   (claim-then-pay, exactly as the shortlet payout service does), `OwnerStatement` payout
   statuses, `EstatePayoutAccount` as a precedent for an org-level payout account.

---

## 8. UX/UI direction (premium)

**Positioning:** the product should feel like private banking for property, not an admin panel.

- **Context is always visible.** A persistent custody bar: _"Managing for Emeka Chukwu ·
  Lekki Phase 1 · mandate ends 31 Jan 2027"_, with a client switcher. A manager must never
  be unsure whose money/property they are touching.
- **Two homes, one codebase:** _My properties_ vs _Managed properties_, visually distinct
  (different accent, explicit "on behalf of" chip).
- **Owner trust surface:** an owner dashboard that answers "what did my manager do this
  month, what did it cost, what is my balance" in one screen, with a statement they can
  forward without editing.
- **Money moments get ceremony:** releasing owner funds, approving an above-threshold
  expense, serving a legal notice — full-screen confirm with a plain-language summary and
  an explicit irreversible-action warning (same discipline as the Guest Promise decision
  dialog and the dispute resolve action).
- **Timeline is the spine** of every property: every listing, message, payment, expense,
  inspection, notice and legal step on one chronological rail, filterable, each entry
  stamped with the acting person and mandate.
- **Mobile-first for the field:** caretaker/overseer capture (photo a fault, record cash,
  meter reading, inspection checklist) with offline tolerance, mirroring the existing
  agent offline-queue pattern.
- **Progressive disclosure:** a single-property owner sees a simple view; a 300-unit firm
  gets bulk actions, saved views, keyboard shortcuts and CSV export.
- **Empty and error states that teach** — every screen explains the next required step
  (e.g. "No statement yet — statements are issued on the 1st; this mandate started 12 Sep
  so your first statement covers 12–30 Sep").
- **Accessibility & localisation:** Naira-first formatting, right-sized touch targets,
  plain English (avoid legal jargon where possible), read receipts on notices.

---

## 9. Delivery plan

**Phase 0 — Safety first (no new features).**
Audit every landlord/owner/home-management route for authority scoping; make delegation
fail-closed; add `PROPERTY_MANAGER` to `RoleType` and a basic agency sign-in; add tests
(falsified) asserting a manager can act on an authorised property and **cannot** on an
unauthorised one. _This phase must ship before any agency UI, because today's owner-first
scoping is a latent data-exposure bug._

**Phase 1 — Organisation & mandate.** Org management, member invites, mandate model +
signing, POA document, authority creation with expiry, agency workspace shell with client
switcher, custody bar, backoffice mandate approval.

**Phase 2 — Operations on behalf.** Finish authority enforcement across the whole landlord
surface; custody-aware listings, leases, tenants, maintenance, vendors, documents;
timeline; audit attribution (`actorId` + mandate).

**Phase 3 — Money & statements.** `ClientMoneyLedgerEntry`, fee engine
(PERCENTAGE/FLAT + commissions + VAT/WHT), statement generation with line items and source
documents, owner payout with maker/checker, reconciliation job, disputes on line items.
_3a–3d shipped, and the first visible frontend slice shipped on top of them (see 9e–9g);
3e (reconciliation) and 3f (maker/checker payout + line disputes) remain. The recurring
lesson so far: 3e is the control that makes pooled client money safe, so it should not be
deferred behind further surface work._

**Phase 4 — Legal & proceedings.** Notices with correct periods, POA-backed actions,
`LegalCase` + advocate + costs, eviction generalisation, owner approval gates, enforcement
tracking.

**Phase 5 — GetRentos Managed.** Servicing tiers, published fee card, self-serve sign-up,
platform-as-manager mandate, ops portfolio assignment, SLA, positioning in-product.

**Phase 6 — Scale & polish.** Bulk ops, saved views, exports, scheduled statement emails,
firm analytics, ranking/league, mobile field app hardening, offline.

Cross-cutting from Phase 0: audit log on every custody action, notifications to both
parties, and tests at every step (falsified — verify the guard by deliberately removing it
and confirming the test fails).

---

## 9a. Phase 0 — shipped (2026-09-30)

**1. The audit.** All 30 landlord services were classified by how they scope access.
The result corrected an assumption worth recording, because it changes the risk model:

- **14 services already honour `PropertyAuthority`** (`authorizeFor` on single resources,
  `managedPropertyIds` to widen lists). A previous session began this migration.
- **5 services were owner-only** — `dashboard` (10 owner predicates), `financials` (7),
  `owner-statements` (6), `tenants`, `portfolio-analytics`.
- **11 services had no scoping predicate at all** (the worrying bucket).

**The correction:** owner-only scoping is _fail-closed_, not leaky. `{ property: { ownerId:
actorId } }` returns nothing for a manager (they own nothing) — an empty screen, not
exposure. And the unscoped bucket turned out to guard explicitly — `landlord-vendors` and
`landlord-documents` throw when `resource.landlordId !== actorId`; `landlord-leads` scopes
in SQL. **No data leak is created by admitting a manager.** The remaining work on those
services is therefore _functional_ (make them grant-aware), not a hole to plug — which is
why it belongs in Phase 2 alongside the org-level design decisions they need (org-level
vendor pools, statements carrying `organizationId`).

**2. Hard blocker removed.** `@Roles(RoleType.LANDLORD)` gated **22 of 23** landlord
controllers, so a manager received 403 on every route — making the existing authority
support unreachable. Replaced with a canonical set:

```ts
// src/shared/constants/roles.constants.ts
export const PROPERTY_CONTROLLER_ROLES = [
  RoleType.LANDLORD,
  RoleType.PROPERTY_OWNER,
  RoleType.PROPERTY_MANAGER,
];
```

Applied to all 23 controllers. **Membership is not permission** — which properties the
caller may touch is still decided per property by `PropertyAuthorityService`, and the
documented semantic is "fails closed".

**3. `PROPERTY_MANAGER` role added**, with its own migration
(`20260930150000_add_property_manager_role`) per the repo's one-enum-value-per-file rule.
Adding it deliberately broke `STAFF_ROLE_LEVELS: Record<RoleType, …>` at compile time;
the answer is `undefined` — a manager is an outside party with no internal seniority,
and their powers come from a grant, not the staff hierarchy.

**4. A latent scalability bug fixed.** `managedPropertyIds` inherited `take: 100` from the
UI-list helper `activeClaimsFor`. That is a _permission_ query: an agency with 300
properties would have been silently locked out of everything past its hundredth, and it
would have looked like missing data rather than a refusal. Now uncapped (selecting only
the id).

**5. One scope, defined once** — `src/shared/property-authority/property-authority.scope.ts`:

```ts
where: {
  property: await controlledPropertyScope(this.authorities, actorId);
}
```

Returns `{ OR: [{ ownerId }, { id: { in: managedIds } }] }`, works at any nesting depth,
and **fails closed** — an actor with no grants can only match what they own. 5 tests
assert exactly that, including that a no-grant manager cannot reach anyone else's
property and that 250 mandates are not truncated. Falsified: making the scope blanket
(`{}`) fails all 5.

**Verified:** build green; full suite **228 suites / 2806 tests** passing (+5).

**Not done in Phase 0 (deliberate):** the 5 owner-only services still return empty for a
manager, because making them grant-aware properly needs the org-level decisions
(Phase 1/2). Also outstanding: a `@RequiresPropertyCapability` guard so a _new_ route
cannot forget to scope — until that exists, every new landlord endpoint is a manual
review item.

---

## 9b. Phase 1 — shipped (2026-10-03)

Backend commit `072eeb5`. **The record the whole feature hangs off.** Much of the
property-management machinery already existed (`PropertyAuthority`, expiry, document
uploads, fee configs) but was half-wired: authority rows could be granted, were never
scoped to an engagement, and were never revoked when one ended. There was no object
answering "who manages this property, to do what, from when to when, and who signed for
it". That object is now `ManagementMandate`.

**1. The model.** `ManagementMandate` (migration `20260930160000_add_management_mandates`):
`propertyId`, `ownerId`, `managerOrganizationId?`, `managerIsGetRentos`, `managerUserId?`,
`scope[]`, `feeConfigId?`, `startAt?`/`endAt?`, `noticePeriodDays`, `status`, agreement +
PoA document ids, `signedByOwnerAt`/`signedByManagerAt`, submitted/decided/activated/
notice/terminated/handover stamps and actors, `terminationReason`. Indexed on property,
owner, org, manager, status. The migration only touches long-existing tables, so the
earlier-than-`origin/dev` timestamp is safe.

**2. Scope → capability, with an invariant.** `mandate-capabilities.ts` maps each
`MandateScope` to the three capabilities and unions them, enforcing _manage or transact
implies list_ — a manager who can act on a property must be able to see it.

| Scope       | canList | canManage | canTransact |
| ----------- | ------- | --------- | ----------- |
| LISTINGS    | ✅      | —         | —           |
| RENT        | ✅      | ✅        | ✅          |
| MAINTENANCE | ✅      | ✅        | ✅          |
| LEGAL       | ✅      | ✅        | —           |
| COMPLIANCE  | ✅      | ✅        | —           |
| **FINANCE** | —       | —         | —           |

**FINANCE deliberately grants nothing.** `canList` would let a finance-only mandate
publish listings through the publication gate, so finance is modelled as an _entitlement
to be extended_ (it belongs to statements and payouts, Phase 3) rather than a capability
today. This is an under-grant on purpose and is documented at the table. An exhaustive
2⁶ = 64-subset test pins every combination, so a typo in the table cannot pass.

**3. Lifecycle, and the property that matters most.** `DRAFT → PENDING_OWNER` (submit) →
`PENDING_OPS` (**both** parties sign) → `ACTIVE` (ops verification), plus
`suspend`/`resume`, `serveNotice`, `terminate`, `completeHandover`, and an hourly
`expireOverdue` sweep (distributed 55-minute lease). **One signature never advances a
mandate** — a manager cannot self-activate, and an owner cannot bind a firm without the
firm's signature. Verified live, not just asserted in a unit test.

**4. Activation provisions, ending revokes — scoped.** On `ACTIVE`, authority rows are
written for every member of the manager organisation (excluding staff accounts, excluding
the owner). On suspend/terminate/expire they are **revoked, zeroing all three
capabilities rather than deleting the row**, so the audit trail keeps showing who could do
what. The write is scoped by the mandate reference, so termination revokes that mandate's
grants and does not touch an agency's unrelated grants on other properties.

**5. Three identity rules, each with a reason.**

- **The owner is never provisioned.** They already hold authority by owning the property;
  a revocable grant could be mistaken for a removed owner, and revoking it would revoke
  nothing.
- **GetRentos staff accounts are excluded** (an org's `ACCOUNTANT` is not provisioned),
  keeping separation of duties between the firm's own books and a client's property.
- **Managers owe notice; staff do not.** A non-staff manager ending early must serve the
  notice period or pass `force` with a ≥10-character reason. Staff end mandates on
  documentation, with the parties already notified. _See finding (b)._

**6. Expiry is enforced at read time.** Authorization never depends on the cron having
fired — an expired mandate stops granting access the moment it lapses, and the sweep only
tidies state.

**Verified.** Build green; Phase 1 adds **68 tests** (13 capability + 55 service), full
suite **245 suites / 3186 tests** green. Six core guarantees were falsified one at a time
— activation stops provisioning, revocation stops zeroing, managers stop owing notice,
the owner gets provisioned, one signature reaches ops, revocation ignores the mandate
reference — and each break was caught (68/68 baseline and restored).

Live against the running API: full funnel `DRAFT → PENDING_OWNER → PENDING_OWNER → PENDING_OPS
→ ACTIVE` (proving one signature does not advance it); org `OWNER` and `STAFF` both
provisioned `list/manage/transact = true` while the owner and the org's `ACCOUNTANT` are
not; the manager sees the mandated property and **not** the control property the same
actor holds no grant on; no notice → _"Serve 30 days' notice before ending this mandate…"_,
stub reason → validation error, force + reason → `TERMINATED`; after termination both
grants read `REVOKED` with all capabilities false; an unrelated hand-granted authority on
another property **survives** that termination untouched; an expired grant disappears from
the manager's list while its row still reads `ACTIVE`; audit trail reads
`CREATED, SUBMITTED, SIGNED ×2, ACTIVATED, TERMINATED`. Fixture restored afterwards.

**Two specs on `dev` were already broken** before this work and are repaired here:
`home-management-work-order-lookup.spec.ts` asserted a literal role list that Phase 0
changed, and `admin-rent-finance.service.spec.ts` was missing the `RenterPaymentsService`
the finance commit added to the constructor. Both failed to _compile_ on `dev`.

### Findings from Phase 1

**(a) `property-authority.scope.ts` is dead code.** `controlledPropertyScope` /
`controlledUnitScope` have **zero consumers** — the real gate is
`authorizeFor(propertyId, userId, 'LIST'|'MANAGE'|'TRANSACT')`, with the owner passing via
`accessFor`'s `property.ownerId === userId` shortcut. Phase 0's "one scope, defined once"
is therefore unused; the behaviour it was written to guarantee is provided elsewhere.
Either wire it into the 5 owner-only services or delete it — leaving it implies a
protection that isn't in the path.

**(b) Staff can end a GetRentos-as-manager mandate instantly.** In `terminate()`,
`managerEndingEarly = isManagerSide && !isOwner && !isStaff`, so the notice rule does not
apply to staff. For a third-party agency manager this is correct; for a mandate where
GetRentos _is_ the manager it means any staff member can end the client's engagement with
no notice and no second approver. That is a **policy decision, not a bug to fix quietly** —
it needs a maker/checker gate or an explicit carve-out. Flagged, not changed.

**(c) `ManagedPropertyDto.mandateId` is not a mandate id.** It carries the
`PropertyAuthority` **grant** id (`mandateId: claim.id`), consistent with the pre-existing
vocabulary in which a grant _is_ the mandate. Introducing a real `ManagementMandate` makes
the name ambiguous, and it matters because revocation currently matches the grant by
parsing the note string `Management mandate <id>`. **Recommendation for Phase 2:** add
`PropertyAuthority.managementMandateId` as a real FK — it gives the UI a genuine mandate
link, replaces note-string matching with an indexed lookup, and lets revocation be exact.
Safe to change now: the frontend uses `mandateId` only as a React list key.

**(d) `landlord-leads.service.ts` interpolates `${landlordId}` into raw SQL.** The value is
JWT-sourced so it is not injectable today, but it is fragile and should be a parameter.

**Carried into Phase 2:** the 5 owner-only services still return empty for a manager;
no `@RequiresPropertyCapability` guard yet, so a new landlord route is still a manual
review item; mandate grants are not FK-linked to their mandate (finding c).

---

## 9c. Phase 2 — the mandate hardened (2026-10-03)

Backend commit `d3e6796`. Two of the four Phase 2 workstreams are done; the other two
are listed at the end of this section rather than left implied.

**1. A grant now records the mandate that wrote it** (finding c closed).
`PropertyAuthority.managementMandateId` is a real FK with an index, and revocation keys
off it instead of matching the note string `Management mandate <uuid>`. A note is written
for humans; editing one would have silently stopped the match and left a terminated
mandate's access live. The migration backfills from the note but adopts **only notes that
resolve to a mandate that still exists** — a hand-written note that merely looks similar is
left null rather than claimed by a mandate that never wrote it. The backfill was tested
directly against the database with one matching note and three non-matching ones, because
an off-by-one in the `substring` would have reported success while adopting nothing.

**2. No single staff account ends a client engagement** (raised in Phase 1, decided).
`terminate()` used to exempt staff from the manager's notice rule. Staff now raise a
request and a **different** staff member approves it. The ask is its own record,
following `LeaseTerminationRequest`'s precedent, so while it is open the mandate keeps
running and keeps its authority — a withdrawn request leaves nothing to undo, and no
`PENDING_TERMINATION` status had to be added to the state machine.

The notice rule is applied on approval **only when GetRentos is the manager**, because
there the notice period is our own commitment to the owner and skipping it needs `force`
plus a reason of its own, exactly as it would for any other manager. For a third-party
firm, ops may still end it at once: that is the collapsed-firm case the old bypass existed
for, and the notice there is the firm's obligation, not ours. Owners are unaffected — and
a direct termination closes any open request, so ops is never shown a decision about an
engagement that is already over.

**3. `@RequiresPropertyCapability`, and why it could not be applied as planned.**
The guard is built and registered in the global chain: it resolves the property, asks
`authorizeFor`, fails closed when a declared route's property id is missing, and
deliberately does **not** fall back to a generic `:id`.

**The finding that shaped it:** writing the coverage test revealed that **no landlord
route uses `:propertyId` at all**. The API is uniformly `:id`-keyed, and `:id` means a
different entity on nearly every controller — a listing, a lease, a maintenance request,
an eviction case. Of ~44 parameterised routes on the landlord surface, **exactly three
carry a property id** (`landlord/properties`). For the rest the property is only knowable
_after_ the entity has been loaded, so a pre-handler guard cannot cover them and the
service must make the call, as it does today.

So the guard is a mechanism for property-keyed routes and for new ones, not a blanket
solution. To stop the surface drifting, the coverage test instead forces an explicit
**classification per controller**, discovered by walking the controllers themselves:
`PROPERTY_KEYED` (its parameterised routes must declare, guard enforces) or
`SCOPES_IN_SERVICE` (with the reason, read out of the service, for where the check
actually lives). A new controller fails the build until someone classifies it, and a
classification for a deleted controller fails as stale. The map doubles as the Phase 2
work list: 12 controllers resolve their entity and call `authorizeFor`, 4 are owner-only,
2 guard with an explicit `landlordId` comparison, 4 scope by the caller's own account or
SQL, and 1 is property-keyed.

Verified: build green; full suite **251 suites / 3261 tests**. Six guarantees falsified
one at a time — the maker/checker comparison, the staff guard on `terminate()`, id-keyed
revocation, the notice rule binding us as manager, a missing route declaration, and an
unclassified controller — each caught by the test written for it.

Also verified live against the running API (which also proves the new global guard
resolves at boot — a DI failure there would take the process down, and no unit test boots
the app). A mandate on a real property provisioned with `managementMandateId` set on both
grants; a staff account raised a request and the mandate stayed `ACTIVE` with its
authority untouched; approving one's own request was refused 403; the ops queue named the
human who asked; a second staff account approved it, ending the mandate and leaving both
grants `REVOKED` with every capability cleared; and the guard refused a landlord holding
no grant on a property-keyed route with `PROPERTY_AUTHORITY_REQUIRED` while letting the
owner through on their own property. The fixture, including a temporary second staff
account, was removed afterwards.

**Still to do in Phase 2:** nothing outstanding — mandate attribution, the last item, landed
in 9d. The open question Phase 2 raised is recorded as decision 12.

---

## 9d. Phase 2 continued — reporting made grant-aware (2026-10-04)

Backend commit `bb3f415` (the grant-aware services landed in `553c95d`).

**1. Four reporting services now see a managed portfolio.** `dashboard`,
`financials`, `tenants` and `portfolio-analytics` all scoped with
`property: { ownerId: actorId }`. For an owner that is exact; for a manager it matched
nothing, so the dashboard of a portfolio someone was hired to run read as **zero
properties, zero units and zero rent** — indistinguishable from having none, and the
exact numbers a manager would be held to. All four now use `controlledPropertyScope`,
which closes Phase 1 finding (a) by giving that helper its first real consumers. Each
service computes the scope once per method rather than once per query.

**2. The fifth was left alone, deliberately.** `owner-statements` is not a read path:
it _generates_, _issues_ and _pays out_ the owner's settlement. Making it grant-aware
would hand any manager holding `TRANSACT` the ability to produce and settle the owner's
money, which is the client-money boundary Phase 1 explicitly deferred — `FINANCE`
grants nothing yet for exactly this reason. The four services above are read-only
reporting on properties a manager operates; this one is the settlement step. Reading an
operational ledger and paying an owner out are different acts, so they get different
answers. **This needs a decision** (see 10.12).

**3. The owner surface is classified.** The coverage test now walks both
`modules/landlord` and `modules/owner` — 36 controllers — keyed by **controller class**
rather than file, because `owner.controllers.ts` holds twelve controllers with genuinely
different answers in one file. Both property-keyed controllers declare capabilities on
their parameterised routes, so the guard enforces them in the pipeline.

Two things worth recording from doing it:

- **`requireOwned` is misleadingly named.** It does not require ownership; it calls
  `authorizeFor(..., 'MANAGE')`. So a manager holding `canManage` can already update
  _and archive_ a property they manage — including removing it from the owner's
  portfolio. That is a policy question the name disguised (see 10.12).
- **I annotated a route wrongly and the discipline caught it.** I had marked
  `GET /owner/properties/:id` as `LIST` on the theory that seeing a property you
  advertise is a listing-level act. The service gates it at `MANAGE`, so the declaration
  advertised a level the route does not accept. Corrected — a declaration that
  over-states what a route requires is worse than no declaration, because it invites
  someone to delete the real check.

**4. Owner-only routes are now expressible.** `POST /owner/properties/:id/convert-to-rental`
requires _ownership_, not a capability: the service refuses unless the caller owns the
property, because the route grants the `LANDLORD` role to the caller. No capability
implies that, so a `MANAGE` annotation would have been a false claim. The classification
gains an explicit per-handler exemption carrying a reason, and a test requires every
exemption to state a reason and to match a route that actually exists — so a stale
exemption cannot silently widen the hole it was written to document. Falsified by
misspelling the handler, which was caught both as an undeclared route and as a
nonexistent exemption.

**5. Audit attribution — shipped.** An owner could see that a firm acted but not on what
grounds, so every action by a firm with access looked the same as an action by someone
who simply had it — the question an owner with a dispute actually asks.

`AuditLog.mandateId` is a real column with an index and a foreign key, not a key inside
`newValues`: _"everything this firm did under this mandate"_ is a question someone will
ask, and a JSON blob answers it with a sequential scan. `ON DELETE SET NULL`, because
deleting a mandate must not erase the history of what was done under it. **No backfill** —
the mandate was not recorded when those rows were written, and inferring one from whichever
grant is live today would invent an attribution the original action never had.

Resolution lives in `AuditService`, which takes the property the action touched and asks a
new `mandateIdFor(propertyId, actorId)` on the authority service. Threading the rule through
forty-odd call sites would have been forty-odd chances to derive it differently, and the
authority service already owns "who may act for this property". Callers that know the
mandate pass it and skip the lookup; the mandate service does that for its own lifecycle
events. Attribution is deliberately **not** an authorisation check — any live grant means
the person acted under that mandate, whichever capability the action needed — and a
hand-granted authority is reported as having no mandate rather than borrowing one. A lookup
that fails leaves the entry unattributed instead of failing the action: the action already
happened.

**Thirty of the forty-three call sites on the landlord and owner surface are attributed.**
The other thirteen are not, each recorded in the code with its reason: vendors belong to the
caller's own agency pool rather than a property; bulk actions span properties; media is
staged before it is attached to anything; settings touch the caller's own account; owner
statements are owner-level documents on owner-only routes. An entry that borrows a mandate
it has no claim to is worse than one that admits it has none, because it reads as evidence.

Verified: build green; full suite **257 suites / 3408 tests** after rebasing over twelve
commits from other work; four guarantees falsified one at a time (the property requirement,
the fail-soft catch, explicit attribution, and the filter refusing hand-granted authorities),
each caught by its own test; and live — a manager's edit on a property they run records the
mandate, the owner's edit on their own property records none, and querying by mandate returns
the whole history naming the humans who acted.

_Operational note for the next live run:_ the first attempt reported a null mandate because
the process answering on the port was six hours older than the build. `dist` had the change;
the listener did not. Check the serving process's start time against the build, not just that
the port answers.

---

## 9e. Phase 3a–3c — the ledger and the fee engine (2026-10-05)

Phase 3 is the money phase, and it is being built in three slices: the ledger itself, the
wiring that keeps it filled, and the engine that decides what a fee is. All three are
shipped. 3d (statements derived from the ledger), 3e (the daily reconciliation and drift
alert) and 3f (maker–checker release, disputes on line items) remain.

### 3a — `ClientMoneyLedgerEntry`, the backbone principle 1 asks for

We have been holding other people's money — rent collected on an owner's behalf, dues
collected for an estate — with no record of it beyond the statements derived from it. A
statement is a document about a period, not a balance: it cannot answer "how much of this
money are we holding right now", and two overlapping ones cannot be reconciled against a
bank account at all.

`ClientMoneyAccount` is a running balance per owner and per party holding the money;
`ClientMoneyLedgerEntry` is signed, append-only, carries `balanceAfter`, and points at the
model it came from so a statement line is never hand-typed.

**The balance cannot drift from the history that produced it.** `balanceAfter` is computed
from the account row _while holding a `FOR UPDATE` lock on it_, inside the transaction that
writes the entry. Reading the balance and writing it back would let two simultaneous
movements both read the same starting figure and both write the same result — one movement
lost, and both rows still plausible. Removing the lock and restoring it changed nothing
visible except the tests: the arithmetic it protects has to be reasoned about, which is why
it is falsified rather than assumed.

**Append-only is enforced by having nothing to enforce.** There is no update and no delete on
the service, and a test asserts the surface has none. A correction is an `ADJUSTMENT` that
shows up on the next statement, which is also what an owner wants to see rather than a figure
that silently changed.

### 3b — movements are derived, not reported

Money already moves through the platform in a dozen places and none of them knew about the
ledger. Rather than thread a ledger write through every one, `ClientMoneyRecorderService`
reads what the platform already records and asks which of it has no entry yet. Releasing rent
escrow has a scheduled job, an admin endpoint and a webhook; a due can be paid from three
controllers. Instrumenting all of them would mean a payment path that quietly stops
recording the day somebody adds a seventh, so instead the sweep covers every path including
ones written later, and cannot be forgotten. It is idempotent by construction and runs on
the same hourly schedule that already owns every time-based money transition.

Two decisions shape it. **Money is credited when it arrives, not when we statement it**: rent
credits on `escrowStatus = RELEASED`, dues on `status = PAID`, and a deposit is the tenant's
money held for them rather than income — the same lines the statements already draw. That is
what makes the drift alert in 3e mean anything, because the ledger tracks the pool rather
than the paperwork. And **one movement per source event**, enforced by a partial unique index
on `(accountId, entryType, sourceType, sourceId)`: a payout webhook delivered twice, or the
sweep re-reading everything, cannot credit the same rent twice.

### 3c — the fee engine, and what an engagement actually costs

A fee was one number. It is now a basis (gross, or net of expenses), a schedule, a floor, a
disclosed maintenance markup, and the two taxes that sit on a management fee here. Four
decisions were confirmed before any of it was built, because each changes the arithmetic and
none is recoverable from the code afterwards:

- **VAT charges the owner; WHT does not.** VAT is added on top of the fee and held for the
  tax authority, so it is charged but never part of `grossFee` — a report of fees earned that
  included a tax we merely collect would overstate our revenue. WHT is withheld from the
  manager's remuneration and remitted on their behalf, so it is disclosed and charged to
  nobody. It is shown as `whtAmount` rather than a line item, because a line item on a
  statement is something the owner is charged.
- **A retainer is owed in a period that collected nothing.** A per-collection fee does not
  exist in a month with no collection; a retainer does, because an empty month still cost a
  visit. A statement is therefore no longer skipped when a property collected nothing and
  spent nothing — the fee _is_ the line, and a payout that goes negative is the owner owing
  the platform, surfaced rather than absorbed.
- **A markup is its own line**, so `totalExpenses` still matches the invoices behind it. A
  markup hidden inside an expense is the complaint that makes owners distrust managers.
- **The floor is not pro-rated.** Pro-rating it would weaken it precisely in a short period,
  where the fixed cost of serving the property has not gone away. The retainer, by contrast,
  _is_ pro-rated to the window a mandate covered: charging a full month for a mandate that
  began on the 16th is not a fee, it is a windfall.

Precedence is mandate → property → organisation. `ManagementMandate.feeConfigId` — a field
Phase 1 built for exactly this — wins, because a mandate is the agreement and letting a later
ad-hoc config row outrank an agreed rate would charge an owner something other than what they
signed for.

**One statement, several movements.** `ClientMoneyLedgerEntry.sourceDetail` names which part
of a source produced an entry and joins the idempotency key. Without it a statement's fee,
markup and VAT would share a key and only the first would ever be recorded — the VAT owed to
FIRS could not be derived from the ledger at all. Computing fees now lives in one place,
`shared/fees`, and both the landlord and estate statement services take it from there; the
estate's statements had no fee at all before this. `computeFee` is deleted rather than left
beside it, so nothing can quietly go on charging the old way.

### The upgrade hazard this uncovered, and why it is written down

Adding a _discriminator_ to an idempotency key is not additive. A statement whose fee was
recorded before itemisation exists has an **empty** `sourceDetail`, so the new lookup cannot
see it and records the service fee a second time. The owner is charged twice, both rows are
individually correct, and the balance still agrees with the sum of the entries — nothing
downstream notices.

Found by running the new code against a database the old code had already written to. It
could not have been found by a unit test, which is the argument for the live pass. Two
defences, both now in place: a backfill migration that names those rows for what they always
were, guarded so it cannot collide with an already-named row and be rejected by the index;
and the lookup additionally accepting an unnamed fee as the service fee, so a deploy that
runs the application before its migrations cannot double-charge either.

The general rule, for the next time a key gains a part: **ask what the rows written before it
look like.** `sourceDetail` is `NOT NULL DEFAULT ''` and deliberately not nullable — Postgres
treats NULLs as _distinct_ in a unique index, so a null there would switch the idempotency
guarantee off for every entry that used it.

Verified: build green; full suite **261 suites / 3513 tests**; the fee engine's guarantees
falsified one at a time (tax folded into the fee, WHT charged to the owner, the floor
resurrecting a per-collection fee, the retainer not pro-rated, the floor pro-rated, an
omitted config field silently reset, the mandate's agreed rate losing precedence, the
zero-amount filter removed, and the never-negative guarantee), each caught by its own test;
and live — a ₦200,000 rent payment and a ₦150,000 expense, with a 10%-of-gross fee, a 10%
markup, 7.5% VAT and 10% WHT, produce a service fee of ₦20,000, a markup of ₦15,000, VAT of
₦2,625 and a payout of ₦12,375; each on its own statement line with its basis named, the WHT
disclosed and charged to nobody, and the ledger carrying the three parts separately so the
VAT owed to FIRS is readable on its own. Across a full statement cycle the owner's
client-money balance lands on exactly zero, with the stored balance equal to the sum of the
entries on every account, and running the sweep a second time writes nothing.

---

## 9f. Phase 3d — a statement is a view of the ledger (2026-10-05)

Principle 1 says statements are derived from the ledger, never hand-typed. Phase 3a–3c
made the _amounts_ agree with the ledger, but the agreement lived in the code: both the
statement and the ledger were computed from the same rent and expense rows, so nothing in
the data connected a line to the movement behind it. A statement could not be checked
against the ledger, only believed.

**Every line is now a ledger entry, rendered.** `OwnerStatementLineItem` carries
`ledgerEntryId` and the source document behind the movement (`sourceType`, `sourceId`,
`sourceDetail`), plus `propertyId`. Those are denormalised on purpose: a line has to stay
readable after the payment or expense it came from has been deleted, and an owner reading
an old statement is precisely when that matters.

**Generation materialises, then reads back.** It claims the period's sources, writes the
ledger entries for exactly those sources inside its own transaction, and then builds its
lines and totals by reading the entries out. `netPayout` is literally the sum of the
movements; the other totals are that sum filtered by entry type and part. A statement can
therefore no longer state a figure the ledger does not hold.

Two consequences worth noting. A statement no longer waits for the hourly sweep to know
what it is worth — the movements exist before it does, and materialising is idempotent, so
a charge the sweep finds later is a no-op. And the statement's id is minted up front,
because a fee is sourced to the statement that produced it and the statement cannot exist
before the charges it is made of have been written.

**WHT is the one figure not read back, and that is the point.** It is withheld from the
manager's remuneration rather than taken from the owner, so no movement exists for it.
Manufacturing one to make the derivation uniform would put a number on the owner's ledger
that nobody took from them. It is disclosed, charged to nobody, and the code says so.

### A real bug, found by running it rather than by testing it

The first live statement came back with the expense **missing** while the markup on it had
been charged. The owner would have been paid for a bill the platform had already settled —
₦60,000 too much on a ₦300,000 statement, from a statement that agreed with its own
arithmetic and looked entirely plausible.

The recorder derived an expense's holder from `expense.ownerStatement`. But a statement
materialises its expenses _before_ it claims them, because the claim is a foreign key to a
statement that does not exist yet. So the lookup found nothing, the expense was skipped,
and the markup — computed from the expense total the generation loop already had — was
charged anyway. The holder is now passed in by the caller, the only party that knows it at
that point.

The unit tests had missed it because the fake recorder was more forgiving than the real
one: it appended whatever it was asked to and ignored the holder it was handed, so the fake
could not express the precondition the real one had. The fake now uses the holder, and the
regression test is on the recorder rather than the statement: given a holder and an
_unclaimed_ expense, it must still write the debit.

This is the second defect this phase found only live, after the double-charged fee in 3c,
and both were the same shape — a precondition the tests could not express. The unit suite is
what makes a change safe; it is not what tells you the change is right.

Verified: build green; full suite **261 suites / 3525 tests**; the derivation falsified one
guarantee at a time (a line that cites nothing, movements left to the sweep, a fallback that
invents totals when the ledger cannot be read, a total taken from the source row, and the
unclaimed-expense skip), each caught by its own test; and live — a ₦300,000 rent payment and
a ₦60,000 expense produce a ₦30,000 fee, a ₦6,000 markup, ₦2,700 VAT and a payout of
₦201,300, with five lines each citing its own ledger entry and source, the sum of the lines
equal to `netPayout` to the naira, and every account's stored balance equal to the sum of
its entries.

_Also repaired a spec another commit left uncompilable (`landlord-applications.service.spec.ts`
called a five-argument constructor with four), which meant a whole suite reported nothing
and the suite count was short by ten tests._

---

## 9g. The visible slice, and the four defects using it found (2026-10-06)

Phases 0–3d were almost entirely backend. A ledger, a recorder, a fee engine and a statement
derivation that no owner could open is a specification with tests, not a product, so this
pass built the smallest frontend that makes the money work real: an agency workspace to say
_who you are acting for_, the engagement list, a statement breakdown that traces each line
back to the ledger, and a detail page for one engagement.

Everything was then used rather than inspected, which found four defects. All four were the
same mistake wearing different clothes: **a screen or a fake deciding something it did not
have the standing to decide.**

### The four

1. **A statement charged a markup on an expense it did not show.** Phase 3d. Found by
   opening the statement, not by the suite — see the section above for the mechanism.

2. **`Pause` and `Record handover` were offered to actors the API refuses.** The list gated
   its buttons on `status` alone. But whether a caller may pause an engagement is a
   _property right_ — the owner's or the platform's, never the manager's, since a manager who
   could pause could suspend their own notice period — and handover is only legal once a
   mandate has actually ended. So every manager was shown two buttons that could only fail:
   **403** from `suspend`, **409** from `handover`. The API was right in both cases; the
   screen was guessing.

3. **Every `Details` link 404'd**, because the route it pointed at had never been written.
   Caught by clicking it.

4. **`Sent to the owner` rendered the creation date.** No timestamp is kept for that step, so
   the timeline was showing a date that meant something else. Caught by reading the page
   against the record rather than against itself.

### The fix for 2, and why it is a backend change

The tempting fix is to derive the rule in the component — `ownerId === currentUser.id || isStaff(roles)`.
That is exactly what this codebase already warns against in `mandate-capabilities.ts`: a rule
stated twice is a rule that will disagree with itself, and the way it disagrees is by showing
a button that fails. It is also the _same_ mistake as defect 2, just moved.

So the API now answers the question. `mandate-viewer-permissions.ts` holds each action's two
axes — who may do it, and which statuses it is legal in — and is read twice: by the guard
that refuses, and by the DTO the UI renders from. `ACTION_STATUSES` is passed to
`requireStatus` at every call site, so the status half is one definition too.

`toDto` is now async and takes the caller, because one of the facts — "is this caller on the
manager's side" — costs a membership lookup. The three read paths that took no actor
(`listForOwner`, `listForProperty`, `listPendingVerification`) now take one. `getById` still
answers **404** rather than 403 to a caller with no stake, so "not yours" and "not there"
remain indistinguishable.

This is a refactor of the enforcement, not a description beside it: every authority guard in
the service now calls the same predicate the DTO does. `assertStaff` is gone.

**The evidence that it is one rule and not two:** falsifying the table — letting a manager
pause their own engagement — fails exactly three tests: the new table test, the _pre-existing_
end-to-end guard test, and the new DTO test. If the guards and the DTO were two
implementations that merely agreed today, breaking one would have failed one.

Live, on one ACTIVE mandate, the two viewers now get opposite answers out of the same row:

| viewer         | canSuspend | canServeNotice | canTerminate | canConfirmHandover |
| -------------- | ---------- | -------------- | ------------ | ------------------ |
| owner          | ✅         | ❌             | ✅           | ❌ _not ended_     |
| manager (firm) | ❌         | ✅             | ✅           | ❌ _not ended_     |

and the manager's screen now shows exactly `Serve notice` and `End engagement`.

### What was built

- `services/mandateService.ts` — the whole 18-route lifecycle, typed, plus `isLive`,
  `grantsNothing` and `noticeSummary`.
- `CustodyProvider` / `CustodyBar` — _which client am I acting for_, kept at the layout so it
  cannot disagree between pages. The choice lives in `localStorage`, which is outside React,
  so it is read with `useSyncExternalStore` rather than copied into state and kept in step by
  an effect. A stored client the manager no longer holds is _derived_ away, not cleared in an
  effect, so the stale id cannot be acted on by the render that discovers it. One live
  engagement is adopted rather than asked about; several are a decision and are left open.
- `MandateListView` / `MandateDetailView` — sharing one set of action buttons, one reason
  prompt and one mutation, so the two cannot offer different things.
- `StatementBreakdown` — the statement ladder for both landlord and estate, with every line
  expandable to the ledger entry and source document behind it. Used by opening it: the rent
  line traced to a `RentPayment` entry and the fee line to an `OwnerStatement`/`SERVICE_FEE`
  entry, both confirmed against `ClientMoneyLedgerEntry` in the database. WHT is disclosed
  separately, because it is withheld from the _manager's_ fee and is not a deduction from the
  owner's payout — a distinction that is invisible unless the statement says so.

### The pattern worth keeping

Defects 1 and 2 are the same sentence twice: _a fake that is more forgiving than the real
collaborator cannot express the real precondition, and a screen that re-derives a rule it was
not given cannot express the real authority._ Both were found by running the thing against
reality, not by reading it. The unit suite is what makes a change safe; it is still not what
tells you the change is right.

Verified: backend build green, **262 suites / 3548 tests** with one pre-existing unrelated
failure (`workers/notification`, a Prisma mock — confirmed present without these changes);
frontend typecheck and lint clean; and live on port 3002 against the seeded fixture, as both
the owner and the manager.

---

## 10. Open decisions (need product/legal sign-off)

1. **Fee defaults**: is GetRentos publishing standard rates (e.g. 10% of rent collected,
   10% letting / 5% renewal), or leaving price to the market? Publishing constrains firms
   but hugely increases owner trust.
2. ~~Is GetRentos a manager of record?~~ **DECIDED — YES (2026-09-30).** GetRentos will
   act as managing agent, which means accepting the duties that come with it: state-level
   registration where required, a written client-money policy, complaints handling, and
   legal review of our standard management agreement and power of attorney **before** the
   first live mandate. Engineering consequence: the platform-as-manager must be a mandate
   with `managerIsGetRentos = true` that reuses every third-party-manager code path —
   no forked logic, no special casing.
3. ~~Client money~~ **DECIDED (2026-09-30): pooled account + per-owner ledger + daily
   drift alert, documented as policy.** Funds are not segregated per owner at the bank;
   the ledger is the system of record and a daily reconciliation alerts ops on any drift.
   Because this is a policy commitment it must be written down and visible to owners —
   implemented is not the same as disclosed.
4. **Who holds tenant deposits** — owner, manager, or GetRentos as escrow?
5. **Capability model**: do we ship the full `COLLECT/FINANCE/SETTLE/LEGAL` set in Phase 2
   or start with `LIST/MANAGE/TRANSACT`? **Partially answered (Phase 1):** shipped the
   three capabilities (`canList`/`canManage`/`canTransact`) with a scope→capability map and
   `FINANCE` intentionally granting nothing. The question that remains is when finance
   becomes a real capability rather than an entitlement.
6. **Multi-manager per property**: allowed (agent + manager + lawyer) or one mandate at a
   time? The schema (`unique(propertyId,userId,relationship)`) permits several people.
7. **Co-owner statements**: does one statement split to several owners by share, or does
   each co-owner get their own mandate and statement?
8. **Disintermediation**: may an owner and manager take the relationship off-platform after
   introduction? Affects both fee model and enforcement.
9. **Data on termination**: what exactly does a firm keep after losing a mandate (audit
   retention vs tenant privacy)?
10. **Role naming**: `PROPERTY_MANAGER` vs reusing `ESTATE_MANAGER` — recommend a new role;
    `ESTATE_MANAGER` already means a gated-community manager and conflating them will
    confuse permissions. **DECIDED (Phase 0):** shipped a new `PROPERTY_MANAGER` role.
11. **Who may end a mandate early** (raised by Phase 1, finding b): today any GetRentos
    staff member can `terminate()` a mandate where GetRentos is the manager — no notice,
    no second approver. For a third-party firm that is correct. For _our own_ engagement
    with a client it means one person can end the relationship unilaterally. Decide:
    maker/checker, ops escalation, or accept it explicitly. **DECIDED — maker/checker.**
    Shipped in Phase 2: staff raise a request and a different staff member approves it,
    and when GetRentos is the manager the agreed notice binds us too. Applied to all
    staff-initiated terminations rather than only GetRentos-as-manager, so the rule is
    "no one person ends a client engagement" and not a special case to remember.
12. **What may a manager write, not just read?** (raised by Phase 2). Reading a managed
    property is settled. Writing is not, and the current answers disagree:
    - `updateProperty` and `archiveProperty` gate on `MANAGE`, so a manager holding
      `canManage` can **edit — and archive — a property they manage**, where archiving
      removes it from the owner's portfolio. The gate is honest but the name
      (`requireOwned`) hid it, so nobody chose it explicitly.
    - `convertToRental` is owner-only, because it grants the `LANDLORD` role to the
      caller.
    - `owner-statements` (generate, issue, pay out) is owner-only for now, because that
      is the client-money boundary and `FINANCE` grants nothing yet.
      Decide the line: is archiving an owner-level act that a manager should have to ask
      for, and does a `RENT` mandate include producing the owner's statement, or does that
      wait for the Phase 3 ledger and maker/checker?
13. **What a fee is, and who bears each part of it** (raised and settled by Phase 3c).
    Four questions, each of which changes the arithmetic and none of which is recoverable
    from the code afterwards, so all four were confirmed before the engine was written.
    **DECIDED (2026-10-05):**
    - **VAT charges the owner; WHT does not.** VAT is added on top of the fee and held for
      the tax authority, so it is charged but stays out of `grossFee` — a report of fees
      earned that included a tax we merely collect would overstate our revenue. WHT comes
      out of the manager's remuneration and is remitted on their behalf, so it is disclosed
      on the statement (`whtAmount`) and charged to nobody. It is deliberately _not_ a
      statement line item, because a line item is something the owner is charged.
    - **A retainer is owed in a period that collected nothing**, and the resulting negative
      payout is surfaced as the owner owing the platform rather than absorbed. A
      per-collection fee still only exists in a period that collected something.
    - **A maintenance markup is its own line**, never folded into the expense, so
      `totalExpenses` keeps matching the invoices behind it.
    - **The floor is not pro-rated; the retainer is.** Pro-rating the floor would weaken it
      exactly in a short period, where the fixed cost has not gone away; pro-rating the
      retainer stops a mandate that began mid-month being charged a whole month.
14. **Who may read and write the ledger, not just the statement?** (raised by Phase 3a).
    The ledger and the owner statements are owner-only today, because `FINANCE` grants
    nothing yet and Phase 2 made that explicit. But a manager who collected the rent is the
    person who has to account for it, and a reconciliation an ops team cannot see is not a
    reconciliation. Decide alongside 3f, when maker–checker on release gives `FINANCE`
    something concrete to gate.

---

## 11. Risks

| Risk                                                               | Impact                                                                                               | Mitigation                                                                                    |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Owner-first scoping left in place                                  | A manager sees or mutates an unauthorised property; owner data exposure                              | Phase 0 fail-closed audit + tests before any agency UI                                        |
| Two systems of record (build beside `PropertyAuthority`)           | Divergent permissions, unexplainable behaviour                                                       | Extend existing models only                                                                   |
| Money opacity (fees, expenses)                                     | The exact distrust that kills Nigerian PM relationships                                              | Ledger + line-item fees + immutable issued statements                                         |
| Manager abandons portfolio                                         | Tenants and owners stranded                                                                          | Ops takeover flow; data survives mandate termination                                          |
| Enabling GetRentos-as-manager without compliance work              | Regulatory and client-money exposure                                                                 | Treat as a business decision (decision #2) with legal review                                  |
| Notification noise / duplicates                                    | Already observed on dispute resolution (4 notifications for 1 event) — must not repeat at this scale | Single canonical notification path per event; audit before adding new ones                    |
| Schema sprawl                                                      | 173 models already; adding more without pruning                                                      | Reuse `OwnerStatement`, `Expense`, `Due`, `Vendor`, `WorkOrder`; add only the 6 models listed |
| Feature gating confusion (Pro plan vs full management)             | Owners misread what they bought                                                                      | Distinct product names, capability-based entitlements rather than a single "Pro" flag         |
| `controlledPropertyScope` shipped but unused (Phase 1 finding a)   | Implies a protection that is not in the request path                                                 | Wire it into the 5 owner-only services in Phase 2, or delete it                               |
| Revocation matches grants by the `note` string (Phase 1 finding c) | A note edit silently stops revocation, leaving live access                                           | `PropertyAuthority.managementMandateId` FK (Phase 2); indexed lookup instead of parsing       |
