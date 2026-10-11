import { useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SegmentedControl, useTheme } from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { EnterpriseUpsell } from '@/components/estate/gate/GateUI';
import { PatrolCheckpoints } from '@/components/estate/gate/PatrolCheckpoints';
import { PatrolReport } from '@/components/estate/gate/PatrolReport';
import { PatrolRoutes } from '@/components/estate/gate/PatrolRoutes';
import { useEstate } from '@/hooks/useEstate';
import {
  estateGateApi,
  gateKeys,
  lacksTier,
  planRefusal,
  retryUnlessPlanGate,
} from '@/lib/api/estateGate';

type Tab = 'report' | 'routes' | 'checkpoints';

const UPSELL_POINTS = [
  'Checkpoints with codes your guards scan on their rounds',
  'Rounds on a schedule, with a time limit',
  'Told when a round wasn’t walked, and which points were missed',
];

/**
 * Patrols (Enterprise): whether the rounds the estate set up actually happen.
 * Only the office's side is gated; guards can always scan a checkpoint.
 * Three jobs at three different times, so three tabs: reading last night,
 * setting up rounds, and looking after the checkpoint codes.
 */
export default function EstatePatrol() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { estate, estateId } = useEstate();
  const [tab, setTab] = useState<Tab>('report');
  const [refreshing, setRefreshing] = useState(false);
  const locked = lacksTier(estate?.planTier);

  // Every patrol endpoint shares one plan check, so the checkpoint register (which
  // the Rounds and Checkpoints tabs read anyway) tells us whether to show the upsell.
  const probe = useQuery({
    queryKey: gateKeys.checkpoints(estateId),
    queryFn: () => estateGateApi.patrolCheckpoints(estateId),
    enabled: !!estateId && !locked,
    retry: retryUnlessPlanGate,
  });
  const refusal = planRefusal(probe.error);
  const gated = locked || !!refusal;

  const refresh = async () => {
    if (gated) return;
    setRefreshing(true);
    try {
      await qc.invalidateQueries({ queryKey: ['estate-manager', estateId, 'gate', 'patrol'] });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={colors.mutedForeground}
        />
      }
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.lg,
      }}
    >
      <DetailHeader
        eyebrow={estate?.name ?? 'Gate'}
        title="Patrols"
        subtitle="Checkpoints, the rounds that walk them, and whether they happened"
        onBack={() => router.back()}
      />
      {gated ? (
        <EnterpriseUpsell
          feature="Patrols"
          points={UPSELL_POINTS}
          current={refusal?.current ?? estate?.planTier}
          estateName={estate?.name}
        />
      ) : (
        <>
          <SegmentedControl
            accessibilityLabel="Patrol section"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'report', label: 'Did it happen' },
              { value: 'routes', label: 'Rounds' },
              { value: 'checkpoints', label: 'Checkpoints' },
            ]}
          />
          {tab === 'report' ? <PatrolReport estateId={estateId} /> : null}
          {tab === 'routes' ? <PatrolRoutes estateId={estateId} /> : null}
          {tab === 'checkpoints' ? <PatrolCheckpoints estateId={estateId} /> : null}
        </>
      )}
    </ScrollView>
  );
}
