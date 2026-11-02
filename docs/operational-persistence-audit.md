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
calls against controlled API responses. The scenarios cover rejected
inspection, verification and text-message uploads, rejected documents and
messages with files, persistence after reload, manual retry, server draft
display, and overlapping reconnect/manual retries.

New text and file records include the capturing agent's account ID. Queue reads
and replay are restricted to that account. An identity change before replay or
an authentication retry stops the upload. Legacy records without an owner are
kept on the device, excluded from replay, and flagged for account review.

Capture forms queue connection failures; server rejections preserve the draft
and show an error. Document uploads now unwrap the service response inside the
mutation, allowing the failure path to run. A local save is identified as
waiting for upload. Failed inspection-photo deletion leaves the photo visible.

Where the browser supports Web Locks, replay is serialized across tabs as well
as within an app instance. Without Web Locks, serialization is within one app
instance. Neither case establishes server idempotency after an ambiguous
network failure. A server idempotency key remains separate work.

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
actions through request failures and reloads. Legacy unowned records need
ownership review before any recovery upload. Complete offline delivery also
needs server idempotency and a browser compatibility review for storage and
cross-tab locking.
