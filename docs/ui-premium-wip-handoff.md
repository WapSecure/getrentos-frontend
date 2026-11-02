# Premium-UI work in progress — handoff

**Last touched:** 2026-11-02
**Branch:** `dev` (HEAD `849682a22`, level with `origin/dev`)
**State:** uncommitted, 38 files, **`tsc` clean in both apps, `eslint` clean**

This file exists because the in-progress premium-UI pass was written from a **stale base** and had
silently deleted committed feature surfaces. Those have been restored. Read this before continuing.

---

## 1. What was wrong

The working tree had been rewritten from content that predates the current `dev`. Files the pass
touched lost everything committed since its base. Diagnostic signature:

```bash
# does the working tree match an OLD commit's version of this file?
git diff --quiet <old-commit> -- <file>   # exit 0 == working tree is that old content
```

Examples found:

| File                                              | Working tree equalled             |
| ------------------------------------------------- | --------------------------------- |
| `landlord/navigation/LandlordNavbar.tsx`          | byte-identical to pre-`4fe78d59`  |
| `landlord/navigation/LandlordProfileDropdown.tsx` | byte-identical to pre-`4fe78d59`  |
| `packages/shared/src/auth/constants.ts`           | `2f4e78aa` content minus one line |

`4fe78d59 fix(web): property managers can sign in…` is 45 commits behind `HEAD`; `2f4e78aa` is 90.

The compiler caught only part of it — 75 type errors in the web app and 5 in the backoffice, all of
them _consumers_ of the deleted symbols, none of them in the restyled files themselves.

Deleted surfaces that were restored (all present at `HEAD`, absent from the tree):

- `landlordService` — rent schedules (`startRentSchedule`, `updateRentSchedule`,
  `setRentSchedulePaused`, `issueNextRentInvoice`, `refundTenantCredit`, `getRentSchedule`,
  `getRentAccount`), `triageMaintenance`, `getPortfolioBriefing`
- `types/landlord.ts` — `RentSchedule`, `RentScheduleItem`, `RentPayment.amountPaid/lines/periodStart/periodEnd`
- `lib/queryKeys.ts` — `portfolioBriefing`, `consentRequests`, `authority`, `inspectorJobs`,
  `watchJobs`, `watches`, `watch`, `watchTerms`, `watchOptions`, `securityOverview`, `passkeys`
- `constants.ts` — `ROLES.MANAGER`, `BACKEND_ROLE_TO_ID.PROPERTY_MANAGER`, `ROUTES.AGENCY_DASHBOARD`,
  `AGENT_HOME_MANAGEMENT`, `LANDLORD_ACTIVITY/QUERIES`, `OWNER_ACTIVITY/QUERIES`, and
  `INVITED_ROLE_PRECEDENCE` (the GATEMAN supremacy rule in `resolvePrimaryRoleId`)
- `mandateService` — `hasEnded`, `endedOn`, `noticeEndsAt`, `MANDATE_SCOPE_CHIP`
- `Badge` — `BadgeVariant` had been cut from 7 variants to 5 (`primary` and `purple` dropped)
- `AdminSidebar` (backoffice) — **41 admin nav links → 18**, and `hasRouteAccess` deleted
- `CreateListingModal` / `AddPropertyModal` — the `useSessionExpiryDraft` session-recovery feature
  and its exported draft keys
- `LeaseCard` — the `onOpenSchedule` prop **and** the "Billing" action button

## 2. What was done

**Restored from `HEAD`** (12 files; verified deletion-only, no genuine additions lost):

```
apps/web/lib/queryKeys.ts
apps/web/services/landlordService.ts
apps/web/types/estate.ts
apps/web/lib/i18n/translations.ts
apps/web/types/landlord.ts
apps/web/services/mandateService.ts
packages/shared/src/auth/constants.ts
packages/ui/src/Badge.tsx
apps/web/components/landlord/listings/CreateListingModal.tsx
apps/web/components/landlord/properties/AddPropertyModal.tsx
apps/backoffice/components/admin/dashboard/AdminSidebar.tsx
apps/backoffice/lib/queryKeys.ts
```

**`LeaseCard.tsx`** — the restyle was kept; the `onOpenSchedule` prop, the `CalendarClock` import and
the "Billing" button were re-added on top of it.

**Pre-existing bug fixed** — `estateService.listVisitorPasses` now declares `search?: string`. The
gateman verify page was passing it and `EstatePageQuery` (`{page, pageSize}`) never had it, so this
failed at `HEAD` too.

**Lint (pre-existing at `HEAD`)** — lucide `Receipt` draws a dollar sign and the repo bans it.
Swapped for `ReceiptText` in `LandlordActivityFeed`, `ExpensesPanel`, `LegalCaseDetail`,
`ChargeUnitModal`.

## 3. What to redo on the correct base

The restyle of these three was reverted to `HEAD` because it dropped real features. The agent's
versions are kept at `/tmp/codex-wip/` (ephemeral) and in `/tmp/codex-wip-backup.patch` (the whole
original diff, 7,250 lines):

- `landlord/listings/CreateListingModal.tsx` → re-apply the visual work **on top of** `HEAD`, keeping
  `role="dialog"`, `aria-modal`, `aria-labelledby`, the labelled heading, `type="button"`, the close
  button's `aria-label` and touch target, the `isSubmitting` guard, and `useSessionExpiryDraft`.
- `landlord/properties/AddPropertyModal.tsx` → same, keeping `ADD_PROPERTY_DRAFT_KEY`.
- `backoffice/.../AdminSidebar.tsx` → re-apply the new grouped styling on top of `HEAD`'s 41 nav
  items and `hasRouteAccess`. Do not slice a truncated `navItems`.

Everything else in the 38-file set is the restyle and should be kept as-is.

## 4. Verification

```bash
cd apps/web        && npx tsc --noEmit   # expect 0
cd apps/backoffice && npx tsc --noEmit   # expect 0
pnpm validate:dev-sync                   # currently FAILS: tree is dirty (expected)
```

Runtime smoke test (renter persona, all clean, no console errors): `/renter/dashboard`,
`/renter/maintenance`, `/renter/saved`, `/renter/roommates`, `/renter/messages`.

## 5. Resuming correctly

`docs/worktree-safety.md` already prescribes the right process and it was not followed — this work
was done **in the primary checkout**:

```bash
pnpm preflight:feature    # stops unless you are in a clean linked worktree at origin/dev
```

The primary checkout currently fails `validate:dev-sync` because it is dirty. Before continuing,
either commit this work to a branch so it is recoverable, or move it into a linked worktree created
at `origin/dev` and re-apply it there. **Do not keep editing in the primary checkout.**

Before restoring or rewriting any file, check whether it matches an older commit:

```bash
git log --oneline -1 -S '<symbol>' -- <file>    # who introduced the symbol
git diff --quiet <seen-commit> -- <file>        # is my base actually current?
```
