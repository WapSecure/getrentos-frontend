'use client';

import { RedirectToEstateSetup } from '@/components/estate/shared/RedirectToEstateSetup';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tierAtLeast } from '@sureground/shared';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { EstateFeatureGate } from '@/components/estate/shared/EstateFeatureGate';
import { CheckpointRegister } from '@/components/estate/patrol/CheckpointRegister';
import { RoutePlanner } from '@/components/estate/patrol/RoutePlanner';
import { RoundReport } from '@/components/estate/patrol/RoundReport';
import { CardSkeleton, Tabs, TabsContent, TabsList, TabsTrigger, PageHeader } from '@sureground/ui';

const TABS = [
  { value: 'report', label: 'Did it happen' },
  { value: 'routes', label: 'Rounds' },
  { value: 'checkpoints', label: 'Checkpoints' },
] as const;

type Tab = (typeof TABS)[number]['value'];

export default function EstatePatrolPage() {
  const { estate, isLoading: isEstateLoading } = useSelectedEstate();
  const [tab, setTab] = useState<Tab>('report');

  // Skip the API on a known shortfall; an unknown tier still asks, since an absent plan fails open.
  const entitled = !estate?.planTier || tierAtLeast(estate.planTier, 'ENTERPRISE');

  // `?? ''` rather than `!`: the hooks run before the `!estate` guard; `enabled` stops the request.
  const reportQuery = useQuery({
    queryKey: estateKeys.patrolReport(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.getPatrolReport(estate!.id, {})),
    enabled: !!estate && entitled,
  });

  if (isEstateLoading) {
    return <CardSkeleton />;
  }

  if (!estate) return <RedirectToEstateSetup />;

  return (
    <EstateFeatureGate feature="Patrols" error={reportQuery.error}>
      <>
        <PageHeader
          title="Patrols"
          description="Checkpoints on the ground, the rounds that walk them, and every night one was due."
        />

        <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
          <TabsList className="mb-6 max-w-full">
            {TABS.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="report">
            <RoundReport estateId={estate.id} />
          </TabsContent>
          <TabsContent value="routes">
            <RoutePlanner estateId={estate.id} />
          </TabsContent>
          <TabsContent value="checkpoints">
            <CheckpointRegister estateId={estate.id} />
          </TabsContent>
        </Tabs>
      </>
    </EstateFeatureGate>
  );
}
