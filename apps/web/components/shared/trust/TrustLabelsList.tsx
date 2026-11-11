import { AlertTriangle, CircleDashed, ShieldCheck } from '@sureground/icons';
import { formatDate } from '@/lib/format';
import { checkedByText, type LandNotVerifiedItem, type LandTrustLabel } from '@sureground/shared';

/** A land trust label, or any other dated check with a scope (a listing's verification summary). */
type TrustCheck = Omit<LandTrustLabel, 'kind'> & { kind: string };

// Deliberately no single "Verified" tick: a buyer sees the gaps alongside the passes.
export const TrustLabelsList = ({
  labels,
  notVerified,
  compact = false,
  footnote = true,
}: {
  labels?: TrustCheck[];
  notVerified?: LandNotVerifiedItem[];
  compact?: boolean;
  /** Off only where the caller already shows what the checks do not cover. */
  footnote?: boolean;
}) => {
  const passed = labels ?? [];
  const missing = notVerified ?? [];
  if (passed.length === 0 && missing.length === 0) return null;

  return (
    <div className="space-y-3">
      {passed.length > 0 && (
        <ul className="space-y-2.5">
          {passed.map((label) => (
            <li key={label.kind} className="flex gap-2 text-sm">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
              <div className="min-w-0">
                <p className="font-medium text-foreground">{label.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(label.checkedAt)} · by {checkedByText(label.checkedBy)}
                </p>
                {!compact && (
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                    {label.scope.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {missing.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Not verified
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {missing.map((item) => (
              <li key={item.key} className="flex gap-2 text-sm text-muted-foreground">
                {item.status === 'FLAGGED' ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                ) : (
                  <CircleDashed className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                )}
                <span>
                  {item.label}
                  {item.status === 'FLAGGED' ? ' (issue found)' : ' (not checked)'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {footnote && (
        <p className="text-xs text-muted-foreground">
          These are checks Sureground coordinated on the evidence available on the dates shown. They
          are not a government guarantee of title; have your own lawyer confirm before you pay.
        </p>
      )}
    </div>
  );
};
