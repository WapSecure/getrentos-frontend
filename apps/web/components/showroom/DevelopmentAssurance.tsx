import { BadgeCheck, Info, Wallet } from '@sureground/icons';
import {
  DEVELOPMENT_NOT_CHECKED,
  DEVELOPMENT_PAYMENT_COPY,
  type ShowroomDevelopment,
} from '@sureground/shared/showroom';
import { ShowroomSection as Section } from './ShowroomSection';

const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

/** What Sureground staff checked before this development went live, and what nobody checked. */
export function DevelopmentChecks({ development }: { development: ShowroomDevelopment }) {
  return (
    <Section id="checks" title="What we checked">
      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
        A Sureground staff member made these four checks before this development went live. A
        development is not shown until all four pass.
      </p>
      <ul className="mt-4 space-y-3 text-sm">
        {development.checks.map((check) => (
          <li
            key={check.kind}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
          >
            <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
            <div>
              <p className="font-medium text-foreground">{check.label}</p>
              <p className="mt-1 text-muted-foreground">{check.detail}</p>
              <p className="mt-1 text-xs text-muted-foreground">Checked {day(check.checkedAt)}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-4 text-sm">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          What we did not check
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
          {DEVELOPMENT_NOT_CHECKED.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/** Said plainly, near the top of the price information: the developer takes the money, not Sureground. */
export function DevelopmentPaymentNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="rounded-xl border border-border bg-secondary/40 p-4 text-sm"
      role="note"
      aria-label={DEVELOPMENT_PAYMENT_COPY.title}
    >
      <p className="flex items-center gap-2 font-medium text-foreground">
        <Wallet className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        {DEVELOPMENT_PAYMENT_COPY.title}
      </p>
      <p className="mt-1.5 text-muted-foreground">{DEVELOPMENT_PAYMENT_COPY.lead}</p>
      {!compact && (
        <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
          {DEVELOPMENT_PAYMENT_COPY.points.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
