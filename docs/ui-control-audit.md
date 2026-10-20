# UI control exception audit

This audit keeps the shared-component migration moving forward without mislabelling current debt as approved design.

## Policy

- Product-facing text, number, date, choice and multiline controls should use `@getrentos/ui` primitives.
- Raw browser inputs are acceptable only when they are an implementation bridge hidden behind a shared visible control, such as a file picker, or when they are encapsulated inside a specialized shared control such as `OtpInput`.
- A specialized native control outside the shared package requires a path-specific rationale in the audit script. The current payment-plan radio is retained because its rich label includes an interactive terms disclosure; replacing it with the button-based shared radio would produce invalid nested controls.
- Existing visible raw controls are recorded as `migration-backlog`, not permanent exceptions.
- The release gate permits removing baseline entries but rejects new controls, increased duplicate counts, or changed raw markup.
- Refreshing the baseline is a reviewed policy action, not a routine fix for a failing check.

## Commands

```bash
pnpm audit:ui-controls
pnpm audit:ui-controls:update
```

The first command is enforced in the frontend release gate. The update command rescans the source and rewrites `config/ui-control-baseline.json`; use it only after reviewing and documenting an essential exception.

## Migration order

1. Revenue and reconciliation controls in backoffice.
2. Application, payment and payout controls on web.
3. Operational forms and administrative decisions.
4. Low-risk preferences and filters.

Hidden native file inputs should remain only when the visible trigger, label, validation and pending state are provided by the shared kit.

## Current result

The reviewed baseline has no visible-control migration backlog. Its remaining entries are browser integration points (primarily hidden file inputs), the shared OTP implementation, and the documented payment-plan selector specialization. CI rejects any new or changed raw control until it is replaced or explicitly reviewed.
