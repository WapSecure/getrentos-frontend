'use client';

import { useState } from 'react';
import { CalendarRange, Repeat } from 'lucide-react';
import { Badge, type BadgeVariant, Card, EmptyState, ListSkeleton, Switch } from '@getrentos/ui';
import type { AuthorisationDwellReport } from '@/types/estate';

interface AuthorisationDwellPanelProps {
  report?: AuthorisationDwellReport;
  isLoading: boolean;
}

const statusTone: Record<string, BadgeVariant> = {
  ACTIVE: 'success',
  REVOKED: 'danger',
  EXPIRED: 'neutral',
};

/**
 * How long each standing authorisation's visits actually ran.
 *
 * The number an estate reviews: E2 tells them how often somebody came, and this
 * tells them how long they stayed. "We authorised a cleaner for Tuesdays,
 * 08:00–17:00, and they are admitted for nine hours" is the sentence this screen
 * exists to make visible, and neither half of it is visible from the other.
 *
 * `summaryLabel` is composed server-side and printed as-is, so the console, the
 * report and anything else that reads this cannot end up disagreeing about the
 * same authorisation.
 *
 * The counts that matter are shown ALOUD rather than folded into the average:
 * visits that never ended, and visits past the authorised end. An average over
 * completed visits is silent about both, which is exactly why an estate that only
 * looked at an average would never notice either.
 */
export const AuthorisationDwellPanel = ({ report, isLoading }: AuthorisationDwellPanelProps) => {
  const [showOnlyUsed, setShowOnlyUsed] = useState(false);

  if (isLoading) {
    return <ListSkeleton variant="cards" rows={3} />;
  }

  const authorisations = report?.authorisations ?? [];

  if (!report || authorisations.length === 0) {
    return (
      <EmptyState
        icon={Repeat}
        title="No standing authorisations yet"
        description="Authorise a cleaner, a driver or a contractor on the Regular visitors page, and their visits are measured here afterwards."
      />
    );
  }

  const visible = showOnlyUsed ? authorisations.filter((row) => row.visits > 0) : authorisations;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <CalendarRange className="w-4 h-4" />
          {new Date(report.from).toLocaleDateString()} to {new Date(report.to).toLocaleDateString()}
        </p>
        <Switch
          checked={showOnlyUsed}
          onCheckedChange={setShowOnlyUsed}
          label="Only authorisations that were used"
          className="self-start"
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Nobody has been admitted on an authorisation in this period."
          size="compact"
        />
      ) : (
        <div className="space-y-3">
          {visible.map((row) => (
            <Card key={row.contractorPassId} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground">{row.name}</p>
                    <Badge variant={statusTone[row.status] ?? 'neutral'}>{row.statusLabel}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {[row.company, row.trade].filter(Boolean).join(' · ') || 'No firm recorded'}
                    {row.householdLabel ? ` · ${row.householdLabel}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{row.scheduleLabel}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left sm:text-right shrink-0">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{row.visits}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.visits === 1 ? 'visit' : 'visits'}
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {row.averageMinutes === null ? '—' : formatMinutes(row.averageMinutes)}
                    </p>
                    <p className="text-xs text-muted-foreground">on average</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {row.longestMinutes === null ? '—' : formatMinutes(row.longestMinutes)}
                    </p>
                    <p className="text-xs text-muted-foreground">longest</p>
                  </div>
                  <div>
                    <p
                      className={`text-lg font-semibold ${
                        row.overstays > 0 ? 'text-destructive' : 'text-muted-foreground'
                      }`}
                    >
                      {row.overstays}
                    </p>
                    <p className="text-xs text-muted-foreground">past the end</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-3">{row.summaryLabel}</p>

              {/* Named separately from the average, because an average over
                  completed visits cannot see either of these. */}
              {row.openVisits > 0 && (
                <p className="text-xs text-warning mt-1">
                  {row.openVisits === 1
                    ? 'One visit was never logged out, so it has no finished duration to average.'
                    : `${row.openVisits} visits were never logged out, so they have no finished duration to average.`}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Averages cover the visits that finished. A visit still open has no duration yet, and
        counting its elapsed time so far would make the average fall the longer somebody stays
        inside.
      </p>
    </div>
  );
};

/**
 * Minutes as a person reads them.
 *
 * The API sends the two durations as plain numbers and words every SENTENCE
 * itself, so this has to render them the same way the sentence beneath them does
 *: otherwise one card reads "4h 30m on average" and then "longest 5h" in a
 * different idiom two lines apart. It mirrors the server's `describeDuration`,
 * which is why it is "1h 30m" rather than the "1 hr 30 min" the home-management
 * SLA panel uses for a different feature's figures.
 */
function formatMinutes(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
