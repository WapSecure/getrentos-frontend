# Operational persistence audit

## Agent device uploads

The Sync Center previously marked records as synced in component state, without
an upload. Its background uploader also deleted device records after any
resolved service call, even when `safeCall` returned `success: false`.

The automatic uploader and Sync Center now use `agentQueueSync.ts`. They inspect
the API response before removing the corresponding localStorage or IndexedDB
entry, retain failed records and files, and serialize uploads within the app
instance. The Sync Center displays the actual device queue separately from
records retrieved from the server. A server draft or unchecked identity is not
an unsent device record.

`pnpm test:e2e:agent-sync` exercises the browser storage and real frontend service
calls against controlled API responses. Seven scenarios cover rejected
inspection, verification and text-message uploads, rejected documents and
messages with files, persistence after reload, manual retry, server draft
display, and overlapping reconnect/manual retries. This does not establish
server idempotency after an ambiguous network failure or across multiple tabs.

## Source paths checked

- Agent property assignment calls `assignClientProperty`; the backend checks
  the active relationship and property owner, then upserts an
  `AgentPropertyAssignment` and writes an audit record.
- Realtor property assignment calls `assignProperty`; the backend checks the
  relationship and property authority, then upserts a
  `RealtorPropertyAssignment`.
- Owner viewing confirmation calls the backend confirmation action, which
  validates the viewing's current state and future time before persisting its
  status and notification.
- Renter household task handlers use `mutateAsync` and unwrap service responses
  before reporting completion.

These are source checks. They do not replace authenticated integration tests of
each complete journey.

## Remaining sweep

Continue tracing settings, document sharing, exports, and other operational
actions through request failures and reloads. Review Agent capture failure
handling separately: some forms currently queue every rejected write rather
than only network failures. The device queue also predates per-user ownership
tags; account switching and cross-tab replay need a separate review before
claiming complete offline delivery guarantees.
