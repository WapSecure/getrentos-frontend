'use client';

import { ShieldCheck } from 'lucide-react';
import { Card } from '@getrentos/ui';
import type { TrustStage } from '@/types/trust-score';

/** Accent colour per stage, low → high. */
const STAGE_ACCENT: Record<string, string> = {
  NEW: 'text-muted-foreground',
  BUILDING: 'text-warning',
  ESTABLISHED: 'text-primary',
  TRUSTED: 'text-primary',
  HIGHLY_TRUSTED: 'text-success',
};

/**
 * Wording-first trust representation: the STAGE ("Established") is the headline,
 * with the 0–100 score kept small and secondary. A traditional user reads where
 * they stand instead of decoding a bare number.
 */
export const TrustStageBanner = ({ stage, total }: { stage: TrustStage; total: number }) => {
  const accent = STAGE_ACCENT[stage.id] ?? 'text-primary';

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <div className="inline-flex p-2.5 rounded-xl bg-accent shrink-0">
          <ShieldCheck className={`w-5 h-5 ${accent}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Your trust standing
          </p>
          <h2 className={`text-2xl font-bold ${accent} tracking-tight`}>{stage.label}</h2>
          <p className="text-sm text-muted-foreground mt-1">{stage.blurb}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">Score</p>
          <p className="text-lg font-semibold text-foreground">
            {total}
            <span className="text-xs font-normal text-muted-foreground">/100</span>
          </p>
        </div>
      </div>
    </Card>
  );
};
