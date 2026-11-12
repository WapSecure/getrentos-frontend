# Deployment and rollback

Deliverable 18 of the marketing redesign brief. Written on 2026-11-12 against `origin/dev` at `d2ddc451`. Sources: `.github/workflows/*`, `apps/mobile/eas.json`, `apps/mobile/app.json`, the backend's `.github/workflows/ci.yml`, `Dockerfile` and `.env.example` (variable names only), and the GitHub API for this repository.

## 1. Branches and protection

| Fact                                | Detail                                                                                                                 |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Default branch                      | `dev`. All feature PRs target it, and PRs are merged with merge commits ("Merge pull request #N").                     |
| `main`                              | The workflows trigger on pushes to `main`, but there is no `main` branch on the remote.                                |
| Branch protection                   | `dev` is **not protected** (GitHub API returns "Branch not protected"), so no status check is required before merging. |
| Releases and tags                   | None.                                                                                                                  |
| GitHub deployments and environments | None recorded.                                                                                                         |

## 2. CI gates

### Frontend release gate (`.github/workflows/frontend-release-gate.yml`)

Runs on every pull request and on pushes to `dev` and `main`. `concurrency: frontend-release-${{ github.ref }}` with `cancel-in-progress: true` cancels an older run on the same ref when a newer one starts.

| Job          | Timeout | Steps                                                                                                                                                                                                                                                                                                                                    |
| ------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `verify`     | 30 min  | `pnpm install --frozen-lockfile`; build `@sureground/shared`; `tokens:check`; `icons:check`; type-check web, back office, mobile and mobile tests; `audit:ui-controls`; lint web, back office and mobile with `--max-warnings=0`; mobile `test:ci`; shared tests; web `test:unit`; build web and back office; Expo web export of mobile. |
| `agent-sync` | 15 min  | Install Playwright Chromium, then `test:e2e:agent-sync` and `test:e2e:design`.                                                                                                                                                                                                                                                           |

### Mobile quality (`.github/workflows/mobile-quality.yml`)

Runs on PRs and `dev` pushes that touch `apps/mobile`, `packages/ui-native`, `packages/tokens`, `packages/shared` or the lockfile. Job `quality`: `pnpm quality:mobile` and an Expo web export.

### security (`.github/workflows/security.yml`)

Runs on PRs, pushes to `dev`/`main` and every Monday at 04:00 UTC.

| Job            | Blocking?                      | What                                                                                                               |
| -------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `secrets`      | Yes                            | gitleaks v8.21.2 over the full history.                                                                            |
| `dependencies` | No (`continue-on-error: true`) | `pnpm audit --prod --audit-level=high`. The file notes 1 critical and 47 high transitive advisories on 2026-11-06. |
| `codeql`       | Yes                            | CodeQL for JavaScript/TypeScript, no build.                                                                        |

### Backend (`getrentos-backend/.github/workflows/ci.yml`, for reference)

Job `verify` applies migrations (`prisma migrate deploy`), checks the migrated database matches `schema.prisma`, runs unit and end-to-end tests, then builds a Docker image. It does not push or deploy the image.

## 3. How each app ships

| App                             | What the repo defines                                                                                                                                                                                                                                                                                                                                           | What it does not define                                                                                                                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web (`apps/web`, Next.js 16)    | Build: `pnpm --filter web build`. Runtime settings read from the environment: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BACKOFFICE_URL`, `NEXT_PUBLIC_CSP_ENFORCE`, `CSP_REPORT_URI`, `CSP_MEDIA_ORIGINS`, `SHOWROOM_ENABLED`, support contact variables.                                                                                     | No hosting config (`vercel.json`, Dockerfile or similar) and no deploy workflow. `.gitignore` ignores `.vercel`, which suggests Vercel's Git integration, but this must be confirmed with whoever owns the hosting account. |
| Back office (`apps/backoffice`) | Build: `pnpm --filter backoffice build`.                                                                                                                                                                                                                                                                                                                        | Same gap as web.                                                                                                                                                                                                            |
| Mobile (`apps/mobile`, Expo)    | `eas.json` profiles: `development`, `device-test`, `preview` (staging API, channel `preview`), `production` (production API, channel `production`, `autoIncrement`). `app.json`: `runtimeVersion.policy = appVersion`, updates checked on load. `hooks/useOverTheAirUpdates.ts` downloads an update at most every 30 minutes and applies it on the next launch. | No EAS build or update workflow in CI; builds and updates are run by hand.                                                                                                                                                  |
| API (separate repo)             | Dockerfile (`node dist/main.js`).                                                                                                                                                                                                                                                                                                                               | No deploy step in CI; migrations are not run by the container's `CMD`.                                                                                                                                                      |

## 4. Launch flags

These are read from the environment, so changing one needs a config change and, for the API, a restart or redeploy. Values are never shown here.

| Flag                          | Where      | Effect                                                                                                                                                                                                                                                                                       | Default     |
| ----------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `DIASPORA_INVEST_ENABLED`     | API        | Investor area on or off. `GET /investor/availability` reports it; the web hides `/diaspora`, the homepage Diaspora section, the sitemap entries and (with #186) the diaspora guide when it is off. Web caches the check for 60 seconds (`PUBLIC_REVALIDATE`); the sitemap for up to an hour. | `false`     |
| `FLEX_NEW_PLANS_ENABLED`      | API        | New Flex plans paused unless `true`; existing plans keep working.                                                                                                                                                                                                                            | unset (off) |
| `NOTIFICATION_EMAILS_ENABLED` | API        | Starts emailing users important notifications.                                                                                                                                                                                                                                               | `false`     |
| `PAYMENTS_SIMULATED`          | API        | Must never be true in production.                                                                                                                                                                                                                                                            | –           |
| `FACEMATCH_DEV_AUTOAPPROVE`   | API        | Development only; never in production.                                                                                                                                                                                                                                                       | –           |
| `SHOWROOM_ENABLED`            | Web server | `off` brings back the old listing page without a rebuild (read per render, `lib/showroom.ts`).                                                                                                                                                                                               | on          |
| `NEXT_PUBLIC_CSP_ENFORCE`     | Web build  | `true` enforces the CSP; otherwise it is Report-Only. Inlined at build time, so changing it needs a rebuild.                                                                                                                                                                                 | off         |

The marketing redesign itself (#158, #159, #170, #173, #178, #179) has **no flag**. Rolling it back means reverting code.

## 5. Release checklist for the marketing redesign

Before merging the last redesign PR:

- [ ] `verify` is green on the PR. Do not treat a cancelled `agent-sync` as a pass (see section 7).
- [ ] Run `pnpm test:e2e:design` and `pnpm test:e2e:agent-sync` once on a machine that can, and attach the result to the PR.
- [ ] `security / secrets` and `codeql` are green.
- [ ] Copy check: every claim on `/`, `/home-management`, `/diaspora`, `/pricing`, auth pages and (when merged) `/areas/*` and `/resources/*` is backed by the product (see `decisions.md`, honest-copy rule).
- [ ] `NEXT_PUBLIC_SITE_URL` is set to the production origin in the web host; otherwise canonicals, the sitemap and JSON-LD fall back to `https://getsureground.io`.
- [ ] `NEXT_PUBLIC_API_URL` points at the production API (the sitemap and homepage "Recently listed" fetch from it on the server).
- [ ] `DIASPORA_INVEST_ENABLED` on production matches the launch decision.
- [ ] Fix the `robots.ts` prefix issue in `seo-monitoring.md` section 3 before submitting the sitemap.
- [ ] Record the merge commit SHA on `dev` and the web host's current production deployment id, so the rollback target is known.

After deploying:

- [ ] `/`, `/rent`, `/buy`, `/land`, `/shortlets`, `/pricing`, `/home-management`, `/sell`, `/agents`, `/login`, `/signup` return 200; an unknown path returns 404.
- [ ] `/robots.txt` and `/sitemap.xml` load, and the sitemap has listing URLs (an empty listing section means the API call failed at build or revalidate time).
- [ ] View source on a listing page: one `RealEstateListing` and one `BreadcrumbList` block, with no raw `<` inside the JSON.
- [ ] Back office Listing funnel shows events arriving for today.
- [ ] Mobile: if a store build or EAS update ships with this release, confirm the channel and runtime version.

## 6. Rollback

Pick the fastest step that fixes the problem.

| Problem                                                       | Step                                                                                                                                                                                                                                                                         | Time to effect                                              |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| A launched service misbehaves (Diaspora Invest, Flex, emails) | Set the API flag to off and restart the API.                                                                                                                                                                                                                                 | API restart; web pages within 60 s, sitemap within an hour. |
| New listing page is broken                                    | Set `SHOWROOM_ENABLED=off` on the web host.                                                                                                                                                                                                                                  | Next render.                                                |
| A web or back office deploy is broken                         | Promote the previous production deployment in the hosting dashboard (instant rollback, no rebuild).                                                                                                                                                                          | Minutes. Needs the host confirmed (section 3).              |
| A merged PR is wrong                                          | `git revert -m 1 <merge-sha>` on a branch, open a PR to `dev`, merge when `verify` passes. The host then redeploys.                                                                                                                                                          | One CI run (about 7 minutes for `verify`).                  |
| Several redesign PRs need undoing                             | Revert the merge commits newest first. Redesign merges on `dev`: #179 `d32c209f`, #178 `cdcfe442`, #173 `e58162e8`, #170 `135bfcfd`, #159 `789a3052`, #167 `298d4a60`, #164 `b42a8cc9`, #158 `a0299ea1`, #157 `d1044a42`. Keep #157 (a security fix) unless it is the cause. | One CI run.                                                 |
| A mobile OTA update is broken                                 | Republish the previous update group to the `production` channel with EAS Update, or roll back to the embedded build.                                                                                                                                                         | Next app launch.                                            |
| A mobile store build is broken                                | Ship a fixed build; store builds cannot be withdrawn from devices.                                                                                                                                                                                                           | Store review.                                               |

Notes:

- A revert of a revert is needed to re-land the change later.
- The API runs migrations separately from the container start. Check whether a release includes a migration before redeploying an older API image; marketing PRs in this repo do not.
- Reverting #158 (tokens) changes every app at once, including the back office and mobile.

## 7. Known risks

| Risk                             | Detail                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent-sync` never finishes      | Of the 30 most recent "Frontend release gate" runs checked on 2026-11-12, all 25 completed runs ended with `agent-sync` cancelled, on `dev` and on feature branches alike, including 16 where `verify` passed. In run 43235778349 on `dev`, `verify` passed and `agent-sync` was cancelled 12 minutes in, during `test:e2e:agent-sync`; `test:e2e:design` was skipped. The design e2e suite is therefore not running in CI. |
| Concurrency cancels `dev` runs   | Rapid merges to `dev` cancel the previous run, so most merge commits on `dev` have no completed check.                                                                                                                                                                                                                                                                                                                      |
| No required checks               | `dev` is unprotected, so a PR can merge with a red or missing `verify`.                                                                                                                                                                                                                                                                                                                                                     |
| No `main`                        | The workflows expect a `main` branch for production but none exists, so it is unclear which commit production runs.                                                                                                                                                                                                                                                                                                         |
| Hosting not in code              | Web and back office hosting, and the production environment variables, are not described in this repository.                                                                                                                                                                                                                                                                                                                |
| No deploy or rollback automation | No deploy workflow, no tags, no GitHub deployments. Rollback depends on the hosting dashboard and manual reverts.                                                                                                                                                                                                                                                                                                           |
| No web error tracking            | Web and back office have no Sentry or similar, so a client error after launch is only seen if someone reports it.                                                                                                                                                                                                                                                                                                           |
| Dependency audit not blocking    | `dependencies` has `continue-on-error: true`.                                                                                                                                                                                                                                                                                                                                                                               |
| CSP is Report-Only by default    | Unless the web is built with `NEXT_PUBLIC_CSP_ENFORCE=true`.                                                                                                                                                                                                                                                                                                                                                                |
| Redesign has no flag             | Only a revert or a hosting rollback undoes it.                                                                                                                                                                                                                                                                                                                                                                              |

## 8. Proposed improvements

1. Protect `dev`: require `verify`, `secrets` and `codeql`.
2. Fix or split `agent-sync` so it completes; make `design` its own job.
3. Create `main` (or document that production deploys from `dev`), and tag each production release.
4. Commit the hosting config, or a short `docs/hosting.md` naming the host, project and environment variables.
5. Add a client error tracker to web and back office.
