# Browser and visual QA checks

## Agent offline upload regression

Run `pnpm test:e2e:agent-sync` to check the device queue without a backend or
seeded accounts. The runner starts an isolated web server on port 43120 and
intercepts API requests in the test browser. It checks that rejected inspection,
verification, message, and document uploads survive reloads, preserve file
contents, and leave the queue only after a successful API response. It also
checks that reconnect and manual retry do not submit the same queued item twice.
Additional cases cover account switching, legacy records without owner IDs,
replay across tabs, and capture forms preserving rejected drafts while queuing
connection failures for the original agent.

## Integrated browser checks

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

## Security flows

`tests/browser/security-flows.web.spec.ts` walks the security features end to end against a running local stack, on desktop web only:

- A sign-in from a new device emails the owner and shows in Recent sign-ins.
- Changing the sign-in email needs the PIN (a wrong one is refused) and a code sent to the new address. The test changes it back afterwards.
- Changing the payout bank account without step-up is refused (`STEP_UP_REQUIRED`).
- The trust page shows real statuses and what isn't offered yet.
- Staff see the new-device decision in Risk decisions.

Besides the role accounts above, it reads `E2E_LANDLORD_PIN`, `E2E_API_URL`, `E2E_MAILHOG_URL` (emailed codes and alerts are read from MailHog) and, for the staff check, `E2E_ADMIN_TOTP_SECRET`. A test whose settings are missing is skipped. Seeded test accounts only; no real personal data.

```sh
npx playwright test tests/browser/security-flows.web.spec.ts --project=web-desktop
```

## Visual QA campaign

The dedicated visual configuration reviews web and backoffice at 390×844,
768×1024, 1440×900, 1920×1080, and desktop dark mode. Every route produces a
full-page PNG and JSON audit in the report. Checks cover horizontal overflow,
broken images, console/page errors, failed requests, HTTP 5xx responses, and
serious or critical WCAG 2.1 A/AA violations.

```sh
pnpm test:e2e:visual
pnpm test:e2e:visual:report
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
