import { AlertTriangle, CircleDashed, ShieldCheck } from 'lucide-react';
import { formatDate } from '@/lib/format';
import {
  LAND_TRUST_SOURCE_LABELS,
  type LandNotVerifiedItem,
  type LandTrustLabel,
} from '@/types/land';

/**
 * What GetRentos checked on a parcel, one scoped label per claim (what, by
 * whom, when), followed by what was not checked. Deliberately no single
 * "Verified" tick: a buyer sees the gaps alongside the passes.
 */
export const TrustLabelsList = ({
  labels,
  notVerified,
  compact = false,
}: {
  labels?: LandTrustLabel[];
  notVerified?: LandNotVerifiedItem[];
  compact?: boolean;
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
                  {formatDate(label.checkedAt)} · by{' '}
                  {label.checkedBy
                    .map((source) => LAND_TRUST_SOURCE_LABELS[source] ?? source)
                    .join(' and ')}
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

      <p className="text-xs text-muted-foreground">
        These are checks GetRentos coordinated on the evidence available on the dates shown. They
        are not a government guarantee of title; have your own lawyer confirm before you pay.
      </p>
    </div>
  );
};
