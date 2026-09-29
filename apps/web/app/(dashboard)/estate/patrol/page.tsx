'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { tierAtLeast } from '@getrentos/shared';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { EstateFeatureGate } from '@/components/estate/shared/EstateFeatureGate';
import { CheckpointRegister } from '@/components/estate/patrol/CheckpointRegister';
import { RoutePlanner } from '@/components/estate/patrol/RoutePlanner';
import { RoundReport } from '@/components/estate/patrol/RoundReport';

const TABS = [
  { value: 'report', label: 'Did it happen' },
  { value: 'routes', label: 'Rounds' },
  { value: 'checkpoints', label: 'Checkpoints' },
] as const;

type Tab = (typeof TABS)[number]['value'];

/**
 * Patrols: whether the rounds an estate set up actually happen.
 *
 * ENTERPRISE, and the gate is on the OFFICE, never on the guard. The reason is
 * in the programme doc: an estate without this makes a slower decision, where an
 * estate without the watchlist admits somebody it banned. But scanning is not
 * gated even here — a guard standing at a checkpoint at 02:00 is the wrong
 * person to hear about a billing state, and refusing the scan would lose the
 * patrol record over it. The API enforces exactly that split, and this page only
 * decides which half of it to render.
 *
 * Three tabs rather than one long page because they are three different jobs
 * done at three different times: reading last night, setting up tonight, and
 * dealing with a code that has gone missing. The report is first because it is
 * the one anybody opens without being asked to.
 */
export default function EstatePatrolPage() {
  const router = useRouter();
  const { estate, isLoading: isEstateLoading } = useSelectedEstate();
  const [tab, setTab] = useState<Tab>('report');

  /**
   * Whether it is worth asking the API at all.
   *
   * A known shortfall is not worth three guaranteed 403s on every visit — and in
   * a browser console they are three red errors that make a real one harder to
   * find. An UNKNOWN tier is not a shortfall: the rule everywhere in this
   * codebase is that an absent plan fails open, so it still asks and lets the
   * API be the authority.
   */
  const entitled = !estate?.planTier || tierAtLeast(estate.planTier, 'ENTERPRISE');

  const reportQuery = useQuery({
    queryKey: estateKeys.patrolReport(estate!.id),
    queryFn: () => unwrap(estateService.getPatrolReport(estate!.id, {})),
    enabled: !!estate && entitled,
  });

  if (isEstateLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }

  if (!estate) {
    router.replace(ROUTES.ESTATE_SETUP);
    return null;
  }

  return (
    <EstateFeatureGate feature="Patrols" error={reportQuery.error}>
      <>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Patrols</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Checkpoints on the ground, the rounds that walk them, and every night one was due.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={tab === item.value}
              onClick={() => setTab(item.value)}
              className={`min-h-10 rounded-xl border px-4 text-sm transition-colors ${
                tab === item.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:border-foreground/20'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'report' && <RoundReport estateId={estate.id} />}
        {tab === 'routes' && <RoutePlanner estateId={estate.id} />}
        {tab === 'checkpoints' && <CheckpointRegister estateId={estate.id} />}
      </>
    </EstateFeatureGate>
  );
}
