# Browser revenue checks

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
