'use client';

import { Check } from 'lucide-react';
import type { MusterTally } from '@/types/estate';

interface MusterTallyStripProps {
  tally: MusterTally;
  /** The sentence the API composed. Shown verbatim — it is what residents were sent. */
  tallyLabel: string;
}

/**
 * The numbers at the top of a roll call.
 *
 * Counted server-side and rendered as given, never re-added here: the console,
 * the resident app and the notification people were sent all have to print the
 * same figures, and three independent sums of the same roll is three chances to
 * disagree at the one moment somebody is relying on them.
 *
 * Zeros are shown as tiles — "0 needing help" is worth knowing. The *sentence*
 * beneath is the API's, and it deliberately skips empty buckets, so the two
 * never contradict each other: one is a table, the other is a claim.
 */
export const MusterTallyStrip = ({ tally, tallyLabel }: MusterTallyStripProps) => {
  const tiles = [
    { label: 'Accounted for', value: tally.accountedFor, tone: 'text-emerald-600' },
    { label: 'Not on site', value: tally.notOnSite, tone: 'text-foreground' },
    {
      label: 'Needs help',
      value: tally.needsHelp,
      // The only number on this screen that asks for something to be done.
      tone: tally.needsHelp > 0 ? 'text-destructive' : 'text-muted-foreground',
    },
    { label: 'Still unaccounted for', value: tally.unaccounted, tone: 'text-amber-600' },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
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
        <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1.5">
          <Check className="w-4 h-4" />
          Every name on the roll has an answer.
        </p>
      )}
    </div>
  );
};
