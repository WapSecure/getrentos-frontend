'use client';

import { Check } from '@sureground/icons';
import { Card } from '@sureground/ui';
import type { MusterTally } from '@/types/estate';

interface MusterTallyStripProps {
  tally: MusterTally;
  /** Shown verbatim: it is what residents were sent. */
  tallyLabel: string;
}

// Counted server-side and rendered as given, never re-added, so every surface prints the same figures.
export const MusterTallyStrip = ({ tally, tallyLabel }: MusterTallyStripProps) => {
  const tiles = [
    { label: 'Accounted for', value: tally.accountedFor, tone: 'text-success' },
    { label: 'Not on site', value: tally.notOnSite, tone: 'text-foreground' },
    {
      label: 'Needs help',
      value: tally.needsHelp,
      tone: tally.needsHelp > 0 ? 'text-destructive' : 'text-muted-foreground',
    },
    { label: 'Still unaccounted for', value: tally.unaccounted, tone: 'text-warning' },
  ];

  return (
    <Card className="p-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label}>
            <p className={`text-2xl font-bold ${tile.tone}`}>{tile.value}</p>
            <p className="text-xs text-muted-foreground">{tile.label}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground mt-4">{tallyLabel}</p>

      {tally.settled && (
        <p className="text-sm text-success mt-2 flex items-center gap-1.5">
          <Check className="w-4 h-4" />
          Every name on the roll has an answer.
        </p>
      )}
    </Card>
  );
};
