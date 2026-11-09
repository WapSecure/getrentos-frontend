# Navigation and sidebar redesign: implementation report

Brief: "World-class enterprise navigation and sidebar transformation" (2026-11-07).
Work by Codex (2026-11-07 to 08) and Claude sessions (2026-11-09). Everything listed
here is on `dev`. Results are from runs in the VS Code browser bridge against the
local web app (`localhost:3000`) and API (`localhost:4000`), unless marked otherwise.
Nothing here has been through CI: GitHub Actions is blocked by account billing.

## 1. Audit of the navigation before the redesign

What made the sidebar feel busy, found by reading every role's sidebar, top bar
and account menu and by opening them in the browser:

| #   | Problem                                                     | Where                                                                                                                                                                                       | Evidence                                                                                                                                                                         |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Too many first-level items                                  | Landlord (34), owner (29), estate (26)                                                                                                                                                      | Every item shown, all at the same level                                                                                                                                          |
| 2   | Groups that did not match their labels                      | Owner, estate, agent, realtor, buyer                                                                                                                                                        | Groups were positional slices of one list; owner "Communication" held Approvals and Documents; estate code carried comments warning that every insert shifts the groups after it |
| 3   | Groups mixing unrelated jobs                                | Landlord "Finance and compliance" (activity, questions, documents, Managed); owner "Sales and investment" (selling plus home management, vendors, inspections, deposits)                    | Group contents                                                                                                                                                                   |
| 4   | Same destination in two or three places                     | Account menus repeated sidebar pages (landlord/owner Properties, realtor Clients, agent Tasks, buyer Saved, estate Households); tablet-only top-bar links repeated Dashboard and Properties | Route audit of sidebar, top bar and account menu per role                                                                                                                        |
| 5   | Duplicate icons for different pages                         | Landlord (Approvals/Verification, Listings/Automations), owner (Transactions/Approvals/Verification, Trust profile/Billing, Properties/Estate requests), estate (Incidents/Emergency)       | Icon audit                                                                                                                                                                       |
| 6   | Unnecessary scrolling                                       | Desktop rows were 44px (touch size) on a mouse-only sidebar                                                                                                                                 | Landlord sidebar fully expanded: 2,177px                                                                                                                                         |
| 7   | No way to reach most pages on tablets                       | Every role, 640 to 1023px                                                                                                                                                                   | At 820px the top bar overflowed and pushed the menu button off screen; the sidebar is desktop-only and the bottom bar was phone-only                                             |
| 8   | Phone bar dropped Messages                                  | Landlord, owner, renter, agent                                                                                                                                                              | Bar took the first five primary links; Messages was sixth. The native app has Messages on every role's tab bar                                                                   |
| 9   | Workflows reachable only through the sidebar                | Lettings and sales pipelines                                                                                                                                                                | No way to step Listings → Viewings → Applications → Offers without the sidebar                                                                                                   |
| 10  | Inconsistent "back" on detail pages                         | Agency, land conveyance, handover                                                                                                                                                           | Each page had its own arrow link, or none                                                                                                                                        |
| 11  | Drawer not dismissible by keyboard                          | All roles                                                                                                                                                                                   | Escape did nothing; focus did not return to the menu button; the page showed through underneath                                                                                  |
| 12  | Pages without a heading                                     | Landlord Automations and estate Microsite upgrade screens; renter Trust score tab                                                                                                           | No h1 for screen readers                                                                                                                                                         |
| 13  | Long labels cut off                                         | Pidgin (`pcm`)                                                                                                                                                                              | "Make GetRentos manage am" needs 187px of 180px                                                                                                                                  |
| 14  | Animations ignored reduced motion                           | Menu drawer and other Framer Motion animations                                                                                                                                              | The CSS reduced-motion rule does not reach JavaScript animations                                                                                                                 |
| 15  | Eight near-copies of the top bar (fixed for five, 39b895cd) | All web roles                                                                                                                                                                               | Same logo, search, bell, account menu and drawer code in each role                                                                                                               |

"Before" screenshots were not saved at the start. See section 4.

## 2. Route and role matrix

Every link in each role's sidebar was opened at its own URL. Each check passed only if the
page loaded at that URL, exactly one sidebar link was current and was that page, the
link's group was open, the page had one h1, and there were no console errors (Next.js
dev overlay messages excluded).

| Role           | Account             | Sidebar pages | Result       |
| -------------- | ------------------- | ------------: | ------------ |
| Landlord       | seed-landlord       |            34 | All pass     |
| Property owner | seed-owner          |            29 | All pass     |
| Renter         | seed-renter         |            16 | All pass     |
| Realtor        | seed-realtor        |            16 | All pass     |
| Field agent    | aisha.suleiman.test |            14 | All pass     |
| Buyer          | seed-buyer          |            15 | All pass     |
| Estate manager | qa-audit-estate     |            26 | All pass     |
| **Total**      |                     |       **150** | **All pass** |

The run found and fixed:

- Verification pages returned 500 for every role: `@smileid/web-sdk` was declared but not installed. Fixed with `pnpm install --frozen-lockfile`; no code change.
- Three pages had no heading (section 7).

Some runs failed for test-harness reasons: the browser panel lost focus, or one request
failed in the CORS workaround. Every affected page was re-run until it gave a clean result.

Backoffice: not in the matrix. Seed admin accounts cannot sign in without two-factor
set up (security programme), so the backoffice sidebar and icon rail have not been opened
in a browser.

## 3. Information architecture

One shared structure for every role (`createRoleNavigation` in
`apps/web/components/shared/dashboard/GroupedSidebar.tsx`):

1. **Workspace identity:** the workspace name at the top (for example "Property management" or the estate name).
2. **Primary:** six destinations, always visible and never folded.
3. **Contextual:** the rest, in groups named after the job, folded until opened. The group holding the current page is always open, and the open/closed state is remembered per workspace.
4. **Utility:** "Account and preferences" at the foot (settings, billing, verification, own stays).
5. **Account menu** (top bar): profile, role switching, security, help and sign out only. No product pages.

Groups are picked by route (`pick(...)`) in owner, estate, realtor and buyer, so a group
cannot drift from its label when items are added. Agent and renter still use list slices;
their labels match their contents.

| Role        | Primary                                                                     | Contextual groups                                                                            |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Landlord    | Dashboard, Properties, Tenants, Payments, Maintenance, Messages             | Lettings · Tenancies · Money and records · Team and partners · Grow                          |
| Owner       | Dashboard, Properties, Sale listings, Offers, Transactions, Messages        | Selling · Land · Short stays · Property care · Money and records · Managers and partners     |
| Renter      | Dashboard, Find a home, Your tenancy, Payments, Maintenance, Messages       | Unchanged                                                                                    |
| Realtor     | Dashboard, Listings, Clients, Leads, Offers, Messages                       | Clients and listings · Deals and commissions · Messages and documents · Professional profile |
| Field agent | Dashboard, Tasks, Inspections, Verifications, Work orders, Messages         | Field operations · Messages and documents · Trust and account                                |
| Buyer       | Dashboard, Discover, Saved, Offers, Transactions, Messages                  | Find property · Buying · Messages and documents · Trust and account                          |
| Estate      | Dashboard, Households, Visitor passes, Expected today, Incidents, Emergency | Marketplace · Residents · Gate and visitors · Safety · Community · Administration            |

No route was removed, and every link is still reachable; per-role counts were checked by
script after each regroup.

**Phone and tablet (under 1024px):** a bottom bar with the first four primary pages plus
Messages, matching every role's tab bar in the native app, and a menu button opening the
full navigation in a drawer. **Desktop:** the sidebar, which folds to a 72px icon rail
holding the primary pages plus the current page when it is deeper; names show on hover
and focus.

**Contextual navigation:**

- Pipeline tabs (`SectionNav`) on landlord lettings (Listings, Viewing requests, Applications, Offers, Leads) and owner selling (Sale listings, Buyer leads, Viewings, Offers, Transactions).
- Tabbed hubs (`HubTabs`) for pages merged into one (payments, maintenance, financials and others).
- Breadcrumbs on detail pages.

A search box or command palette was not added. With six primary pages and the existing
global search, there is no evidence it is needed.

## 4. Before and after

| Measure                                        | Before                                             | After                          | How measured                |
| ---------------------------------------------- | -------------------------------------------------- | ------------------------------ | --------------------------- |
| Landlord first-level items visible             | 34                                                 | 6 + 5 group headings + account | Count in rendered sidebar   |
| Landlord sidebar, all groups open              | 2,177px                                            | 1,897px                        | `scrollHeight`, 1440px wide |
| Desktop row height                             | 44px                                               | 36px (44px on touch)           | `getBoundingClientRect`     |
| Pages per account menu that repeat the sidebar | 1 (landlord, owner, realtor, agent, buyer, estate) | 0                              | Route audit                 |
| Tablet (820px) access to all pages             | None                                               | Bottom bar + menu              | Landlord, in browser        |
| Messages in phone bar                          | Missing for 4 roles                                | All roles that have it         | Code and browser            |

Screenshots: before-and-after captures are pending. The "before" set needs a worktree at
`994aa79c^`. Both sets should be taken after the Sureground rename and the new text
sizes (`1bc27cbd`), or they would show an out-of-date look.

## 5. What changed and why

| Commit             | Change                                                                                                                                             | Why it helps                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 994aa79c (Codex)   | Primary / contextual / utility structure for every role                                                                                            | Fewer things to scan; the current section opens itself                                                           |
| 886a0810 (Codex)   | Phone bottom bar                                                                                                                                   | Main pages one tap away on phones                                                                                |
| 0e0dc9ec (Codex)   | Accessible hub tabs; shared `Breadcrumbs`                                                                                                          | Keyboard arrow keys work in tabs; one breadcrumb style                                                           |
| 9d173f93           | Desktop icon rail, remembered per browser                                                                                                          | More room for content without losing the main pages                                                              |
| 6629b643           | Landlord regroup by job; 36px rows; account menus without product pages; tablets get bar + drawer; full-height drawer with Escape and focus return | Clear grouping; less scrolling; one place per destination; tablets usable; keyboard users can dismiss the menu   |
| c2f7406e           | Owner regroup, picked by route; distinct icons; "Messages and documents" label for agent, realtor, buyer                                           | Groups say what they hold and cannot drift                                                                       |
| cede40cf           | Breadcrumbs on agency, conveyance and handover detail pages                                                                                        | Same way back everywhere                                                                                         |
| 03784452           | Pipeline tabs; phone bar keeps Messages                                                                                                            | Step through a pipeline without the sidebar; parity with the native app                                          |
| 69c39ebd, 6fb8d2c2 | Headings on Automations, estate Microsite, renter Trust score                                                                                      | Every page has a name for screen readers                                                                         |
| 78dda860           | Estate regroup, picked by route; 9-item group split                                                                                                | Gate work separate from residents                                                                                |
| 47890df8           | Reduced motion for Framer animations; long labels wrap                                                                                             | Respects the system setting; Pidgin labels readable                                                              |
| 223995f0           | Realtor and buyer follow their priorities                                                                                                          | Messages on both phone bars; commissions and professional verification easy to find for realtors                 |
| 39b895cd           | Landlord, owner, realtor, agent and buyer top bars become thin wrappers over one `WorkspaceNavbar` (705 lines to 434)                              | One place for search, drawer and menu behaviour, so roles cannot drift apart; duplicate Escape listeners removed |

## 6. Responsive validation

- **Desktop at 1440px:** sidebar expanded, all groups open, icon rail on, then off again. Checked in the browser for landlord, owner, estate, realtor and agent.
- **Phone at 390px:** bottom bar and drawer for landlord. Checked in the browser.
- **Tablet at 820px:** landlord checked in the browser (bar, menu button, drawer, Escape, no overflow). Owner, realtor, agent and buyer share the same top bar and shell code. Renter and estate have their own top bars and were reviewed in code only: the bridge would not render below about 1025px wide later in the session.
- **Not tested:** orientation change, safe-area insets on a real device, and browser back while the drawer is open.

## 7. Accessibility results (target WCAG 2.2 AA)

| Check                     | Result                                                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Landmarks and names       | Sidebar, phone bar, drawer and pipeline tabs are `nav` elements with labels                                                |
| `aria-current`            | Exactly one current link on all 150 matrix pages                                                                           |
| `aria-expanded`           | On every group heading; Enter and Space toggle it (keyboard test)                                                          |
| Skip link                 | First Tab stop; visible when focused; moves focus to `<main>`                                                              |
| Keyboard order (landlord) | 13 sidebar stops: 6 primary, 6 group headings, Collapse. Links in folded groups are skipped                                |
| Focus visible             | Every stop has a ring, except the Next.js dev overlay                                                                      |
| Escape and focus return   | Escape closes the drawer (tested). Focus return is implemented but was not confirmed in the bridge                         |
| Headings                  | Fixed on three pages; one h1 on all 150 matrix pages                                                                       |
| Reduced motion            | CSS animations already respected it; Framer animations now do (`MotionConfig`). Not observed in the browser                |
| Touch targets             | Rows 44px on touch screens; bar items 56px tall                                                                            |
| Contrast                  | Token pairs measured AA in an earlier audit (2026-11-05); text colours changed since (`1bc27cbd`) and were not re-measured |
| Screen reader             | **Not tested** with VoiceOver or NVDA                                                                                      |

## 8. Functional and security regression results

| Check                                                           | Result                                                                           |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Deep links, 150 pages, 7 roles                                  | Pass                                                                             |
| Back, forward, reload, query string (estate)                    | Correct link stays current                                                       |
| Another role's page typed into the URL (estate manager tried 7) | Redirected to the user's own home; nothing from the other role shown             |
| Another role's API with a renter token                          | 403 on landlord, owner, buyer, realtor, agent and admin; 200 on the renter's own |
| Group open/closed state after reload                            | Kept (browser test in `tests/browser/design-system.spec.ts`, not run in CI yet)  |
| Role switching, workspace switching                             | **Not tested**                                                                   |
| Dark mode                                                       | Seen working throughout; not systematically compared                             |
| Long labels (Pidgin)                                            | One overflow found and fixed (wraps to two lines); not yet seen in the browser   |

## 9. Files changed (since `994aa79c^`)

31 files in the navigation scope: 1,343 lines added, 343 removed. The main ones:

- `apps/web/components/shared/dashboard/GroupedSidebar.tsx`: structure, rail, phone bar, drawer behaviour.
- `apps/web/components/shared/navigation/{SectionNav,WorkflowNavs,HubTabs,AccountMenu}.tsx`
- `apps/web/components/*/dashboard/*Sidebar.tsx`: every role.
- `apps/web/components/*/navigation/*Navbar.tsx` and `*ProfileDropdown.tsx`
- `packages/ui/src/{Breadcrumbs,SidebarRailToggle}.tsx`, `packages/ui/src/hooks/useSidebarRail.ts`, `packages/ui/src/styles/index.css`, `packages/ui/src/providers/QueryProvider.tsx`
- `apps/backoffice/components/admin/dashboard/AdminSidebar.tsx` (Codex).
- Pages: the ten pipeline pages; detail views using breadcrumbs; Automations, estate Microsite and renter Trust score headings.

## 10. Remaining issues and recommendations

1. **Backoffice:** sign in with a two-factor-enabled admin, then review the sidebar and icon rail against the brief's administrator priorities.
2. **Screenshots:** take before-and-after screenshots once the Sureground rename lands.
3. **Not tested yet:**
   - tablet top bars for renter and estate
   - orientation change
   - role and workspace switching
   - screen readers (VoiceOver on Safari, NVDA on Chrome)
   - contrast after the new text colours
4. **Top bars:** five of eight top bars now share `WorkspaceNavbar` (39b895cd). Renter (form search, inline links, language toggle), estate (switcher, no search) and resident keep their own layouts on purpose. The shared top bar has not been opened in the browser yet.
5. **Agent and renter groups:** they still use list slices. Moving them to `pick(...)` would protect them from drift.
6. **Pipeline tabs:** add them elsewhere only where a real sequence exists, such as landlord tenancies (Leases → Inspections → Deposits → Notices).
7. **CI:** none of this has been through CI; run the browser tests once GitHub billing is fixed.
