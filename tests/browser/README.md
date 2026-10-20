# Browser and visual QA checks

The suite starts the web app on port 3000 and backoffice on port 3001, reusing
either server when it is already running. The API and seeded PostgreSQL/Redis
environment must be running separately for authenticated checks.

Credentials are read from the environment and are never stored in the repo:

```sh
export E2E_PASSWORD='shared-local-test-password'
export E2E_RENTER_EMAIL='renter-account@example.test'
export E2E_LANDLORD_EMAIL='landlord-account@example.test'
export E2E_OWNER_EMAIL='owner-account@example.test'
export E2E_REALTOR_EMAIL='realtor-account@example.test'
export E2E_ADMIN_EMAIL='admin-account@example.test'
pnpm test:e2e
```

Use `E2E_<ROLE>_PASSWORD` when accounts do not share a password. Override
`E2E_WEB_URL` or `E2E_BACKOFFICE_URL` to run against an already deployed test
environment. Missing role credentials skip only that role's protected checks;
the public login checks still run.

## Visual QA campaign

The dedicated visual configuration reviews web and backoffice at 390×844,
768×1024, 1440×900, 1920×1080, and desktop dark mode. Every route produces a
full-page PNG and JSON audit in the report. Checks cover horizontal overflow,
broken images, console/page errors, failed requests, HTTP 5xx responses, and
serious or critical WCAG 2.1 A/AA violations.

```sh
pnpm test:e2e:visual
pnpm test:e2e:report
```

Protected coverage also accepts `E2E_BUYER_EMAIL`, `E2E_AGENT_EMAIL`,
`E2E_PROPERTY_MANAGER_EMAIL`, `E2E_ESTATE_EMAIL`, `E2E_RESIDENT_EMAIL`, and
`E2E_GATEMAN_EMAIL`. Each may have `E2E_<ROLE>_PASSWORD`, otherwise the shared
`E2E_PASSWORD` is used.

Use `--project=web-mobile` to focus on one surface and viewport. The runner
reuses existing servers by default. To validate an isolated worktree, set
`E2E_REUSE_EXISTING_SERVER=0` and give unused ports in `E2E_WEB_URL` and
`E2E_BACKOFFICE_URL`.

Screenshots are evidence by default. Once a reviewer approves a stable seeded
environment, create baselines with `pnpm test:e2e:visual:update` and enforce
them with `pnpm test:e2e:visual:compare`. Review diffs before updating them.
