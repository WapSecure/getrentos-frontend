'use client';

import { Clock, MapPin, Siren } from 'lucide-react';
import { EmptyState } from '@getrentos/ui';
import type { OnSiteBoard as OnSiteBoardData } from '@/types/estate';

interface OnSiteBoardProps {
  board?: OnSiteBoardData;
  isLoading: boolean;
}

/**
 * Who the estate believes is still inside.
 *
 * Every sentence here is composed server-side and printed verbatim —
 * `insideLabel`, `expectationLabel`, `tally.label`. That is deliberate: the two
 * sentences carry the distinction this screen turns on (an elapsed time the
 * estate said nothing about, versus a visit past a window it wrote down), and the
 * office's own notification uses the same words. A client that rebuilt them would
 * be free to describe the same visit differently from the alert about it.
 *
 * So there is no duration formatter on this page. The only numbers rendered
 * directly are the two counts, which need no formatting to be readable.
 */
export const OnSiteBoard = ({ board, isLoading }: OnSiteBoardProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-20 animate-pulse rounded-2xl bg-secondary" />
        ))}
      </div>
    );
  }

  if (!board || board.entries.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="Nobody is recorded as still inside"
        description="Every visitor the gate admitted has been logged out. This board is the other half of “who is inside?” — the console knows who went in, and this knows who never came back out."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-2xl font-bold text-foreground">{board.tally.open}</p>
            <p className="text-xs text-muted-foreground">Recorded as inside</p>
          </div>
          <div>
            <p
              className={`text-2xl font-bold ${
                board.tally.overstaying > 0 ? 'text-destructive' : 'text-muted-foreground'
              }`}
            >
              {board.tally.overstaying}
            </p>
            <p className="text-xs text-muted-foreground">Past the authorised end</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">{board.tally.label}</p>
        {/* The rule, stated on the screen that shows its results. An alert whose
            threshold is invisible to the reader is one they cannot calibrate. */}
        <p className="text-xs text-muted-foreground mt-2">
          The office is told once about a visit that runs more than {board.graceMinutes} minutes
          past the end the estate authorised, and only where the estate stated an end — a standing
          authorisation&rsquo;s hours. A visit with no stated end is shown here and nobody is
          notified about it.
        </p>
      </div>

      <div className="space-y-3">
        {board.entries.map((entry) => (
          <div
            key={entry.passId}
            className={`rounded-2xl border p-4 ${
              entry.overstaying ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-card'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {entry.overstaying && <Siren className="w-4 h-4 text-destructive" />}
                  <p className="font-medium text-foreground">{entry.visitorName}</p>
                  <span className="text-xs font-medium text-muted-foreground">
                    {entry.sourceLabel}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {entry.unitLabel}
                  {entry.gateName ? ` · in through ${entry.gateName}` : ''}
                </p>
                {entry.authorisationName && (
                  <p className="text-xs text-muted-foreground mt-1">
                    On {entry.authorisationName}&rsquo;s authorisation
                  </p>
                )}
              </div>

              <div className="text-left sm:text-right shrink-0">
                <p
                  className={`text-sm ${entry.overstaying ? 'text-destructive' : 'text-foreground'}`}
                >
                  {entry.insideLabel}
                </p>
                <p className="text-xs text-muted-foreground">{entry.expectationLabel}</p>
                {entry.reportedAt && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Office told {new Date(entry.reportedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Counted at {new Date(board.asOf).toLocaleString()}. A visit leaves this board when the gate
        logs the exit — so if somebody has left and is still listed, what is missing is the exit,
        not the person.
      </p>
    </div>
  );
};
