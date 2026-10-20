import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPinned, ShieldCheck } from 'lucide-react-native';
import {
  Button,
  Checkbox,
  EmptyState,
  ErrorState,
  ListSkeleton,
  RadioGroup,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { LAND_WATCH_TIER_LABELS, type LandWatchTier } from '@getrentos/shared';
import { qk } from '@/lib/query/keys';
import { landWatchApi } from '@/lib/api/landWatch';
import { ApiError } from '@/lib/api/client';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { haptics } from '@/lib/haptics';
import { goBack } from '@/lib/goBack';

const TIERS: LandWatchTier[] = ['ESSENTIAL', 'PROTECTED', 'MANAGED'];

/** Option values carry the kind, since a parcel and a plot can share nothing else. */
const optionValue = (o: { kind: string; propertyId: string | null; landPlotId: string | null }) =>
  o.kind === 'PLOT' ? `plot:${o.landPlotId}` : `parcel:${o.propertyId}`;

/** Put a parcel the owner holds, or a plot they bought, under Land Watch. */
export default function LandWatchNew() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const qc = useQueryClient();
  const options = useQuery({ queryKey: qk.landWatchOptions, queryFn: landWatchApi.options });
  const terms = useQuery({ queryKey: qk.landWatchTerms, queryFn: landWatchApi.terms });
  const [target, setTarget] = useState<string | null>(null);
  const [tier, setTier] = useState<LandWatchTier>('PROTECTED');
  const [accepted, setAccepted] = useState(false);

  const subscribe = useMutation({
    mutationFn: () => {
      const [kind, id] = target!.split(':');
      return landWatchApi.subscribe(
        kind === 'plot' ? { landPlotId: id, tier } : { propertyId: id, tier }
      );
    },
    onSuccess: (watch) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.landWatches });
      qc.invalidateQueries({ queryKey: qk.landWatchOptions });
      toast.show('Land Watch started.', 'success');
      router.replace({ pathname: '/(app)/land-watch-detail/[id]', params: { id: watch.id } });
    },
    onError: (e) => {
      void haptics.error();
      toast.show(
        e instanceof ApiError ? e.message : 'Not started. Check your connection and try again.',
        'error'
      );
    },
  });

  const available = (options.data ?? []).filter((o) => !o.watchId);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.xl,
        }}
      >
        <DetailHeader
          eyebrow="Land Watch"
          title="Watch land"
          subtitle="Inspections, alerts and reminders for land you own"
          onBack={() => goBack()}
        />

        {options.isError && !options.data ? (
          <ErrorState onRetry={() => options.refetch()} />
        ) : options.isPending ? (
          <ListSkeleton rows={3} variant="card" height={72} />
        ) : !available.length ? (
          <EmptyState
            icon={<MapPinned size={34} color={colors.mutedForeground} />}
            title={options.data.length ? 'All your land is watched' : 'No land to watch yet'}
            description={
              options.data.length
                ? 'Every parcel and plot you hold is already under Land Watch.'
                : 'Land you list as its owner, or a plot you buy on GetRentos, can be watched here.'
            }
          />
        ) : (
          <>
            <RadioGroup
              label="Which land"
              variant="card"
              value={target}
              onChange={(next) => {
                void haptics.tap();
                setTarget(next);
              }}
              options={available.map((o) => ({
                value: optionValue(o),
                label: o.label,
                description: o.kind === 'PLOT' ? 'A plot you bought' : o.place || 'Land you own',
              }))}
            />

            <RadioGroup
              label="Level"
              variant="card"
              value={tier}
              onChange={(next) => {
                void haptics.tap();
                setTier(next);
              }}
              options={TIERS.map((t) => ({
                value: t,
                label: LAND_WATCH_TIER_LABELS[t].label,
                description: LAND_WATCH_TIER_LABELS[t].description,
              }))}
            />

            {terms.data ? (
              <View
                style={{
                  gap: spacing.sm,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  backgroundColor: colors.secondary,
                }}
              >
                <Checkbox checked={accepted} onChange={setAccepted} label={terms.data.disclaimer} />
              </View>
            ) : null}

            <Text variant="caption" color="mutedForeground">
              {tier === 'ESSENTIAL'
                ? 'Your documents and payment reminders are kept in one place.'
                : 'The first inspection is booked as soon as you start.'}
            </Text>

            <Button
              label="Start watching"
              icon={<ShieldCheck size={18} color={colors.primaryForeground} />}
              fullWidth
              loading={subscribe.isPending}
              loadingLabel="Starting…"
              disabled={!target || !accepted || !terms.data}
              onPress={() => subscribe.mutate()}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}
