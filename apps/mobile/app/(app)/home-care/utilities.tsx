import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  ClipboardCheck,
  Droplets,
  Gauge,
  Power,
  Zap,
  type SgIcon,
} from '@sureground/icons/native';
import {
  PURCHASE_KIND_LABELS,
  formatKwh,
  formatLitres,
  generatorServiceLabel,
  type GeneratorServiceState,
  type UtilityPurchaseKind,
} from '@sureground/shared';
import { Card, Chip, ListSkeleton, Price, QueryState, Text, useTheme } from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { homeUtilitiesApi } from '@/lib/api/homeUtilities';
import { formatDate } from '@/lib/format';
import { useMyHomes } from '@/hooks/useMyHomes';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { StatusPill, type Tone } from '@/components/host/HostUI';
import { goBack } from '@/lib/goBack';

const SERVICE_TONE: Record<GeneratorServiceState, { label: string; tone: Tone }> = {
  DUE: { label: 'Service due', tone: 'danger' },
  DUE_SOON: { label: 'Due soon', tone: 'warning' },
  OK: { label: 'On track', tone: 'success' },
  NO_BASELINE: { label: 'No service recorded', tone: 'neutral' },
  NOT_SCHEDULED: { label: 'No interval set', tone: 'neutral' },
};

/** On-site capture first: the quick actions sit at the top, one tap from the camera. */
export default function Utilities() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const homes = useMyHomes();
  const [propertyId, setPropertyId] = useState('');
  const generators = useQuery({
    queryKey: qk.homeCare.generators(propertyId || 'all'),
    queryFn: () => homeUtilitiesApi.generators(propertyId || undefined),
  });
  const recent = useQuery({
    queryKey: qk.homeCare.purchases(propertyId || 'all', 'all'),
    queryFn: () => homeUtilitiesApi.purchases({ propertyId: propertyId || undefined }),
  });

  const capture = (kind: UtilityPurchaseKind) =>
    router.push({
      pathname: '/(app)/home-care/log-fuel',
      params: { kind, ...(propertyId ? { propertyId } : {}) },
    });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={generators.isRefetching}
          onRefresh={() => {
            void generators.refetch();
            void recent.refetch();
          }}
          tintColor={colors.mutedForeground}
        />
      }
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.xl,
      }}
    >
      <DetailHeader
        eyebrow="Home care"
        title="Power and water"
        subtitle="Fuel, hours, tokens, supply and water tests"
        onBack={() => goBack()}
      />

      {(homes.data?.length ?? 0) > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          <Chip label="All homes" selected={!propertyId} onPress={() => setPropertyId('')} />
          {(homes.data ?? []).map((home) => (
            <Chip
              key={home.id}
              label={home.name}
              selected={propertyId === home.id}
              onPress={() => setPropertyId(home.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <Text variant="heading" headingLevel={2}>
          Record now
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Action Icon={Power} label="Log fuel" onPress={() => capture('FUEL')} />
          <Action Icon={Zap} label="Token or bill" onPress={() => capture('ELECTRICITY_TOKEN')} />
          <Action Icon={Droplets} label="Tanker water" onPress={() => capture('WATER_TANKER')} />
          <Action
            Icon={Gauge}
            label="Grid supply"
            onPress={() => router.push('/(app)/home-care/meters')}
          />
          <Action
            Icon={ClipboardCheck}
            label="Water test"
            onPress={() => router.push('/(app)/home-care/water')}
          />
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <Text variant="heading" headingLevel={2}>
          Generators
        </Text>
        <QueryState
          query={generators}
          skeleton={<ListSkeleton variant="card" rows={2} height={96} />}
          isEmpty={!generators.data?.length}
          empty={{
            icon: <Power size={34} color={colors.mutedForeground} />,
            title: 'No generators yet',
            description:
              'Add the generator under Assets and choose Generator. Its hours and fuel then show here.',
          }}
        >
          {(generators.data ?? []).map((generator) => {
            const tone = SERVICE_TONE[generator.service.state];
            const latest = generator.service.latestReading;
            return (
              <Pressable
                key={generator.id}
                accessibilityRole="button"
                accessibilityLabel={`${generator.name}. ${tone.label}. Log hours`}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/home-care/generator/[id]',
                    params: { id: generator.id },
                  })
                }
              >
                {({ pressed }) => (
                  <Card elevated style={{ gap: spacing.sm, opacity: pressed ? 0.92 : 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyStrong">{generator.name}</Text>
                        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                          {generator.property.title}
                          {latest ? ` · ${latest.hourMeter} hours` : ' · No reading yet'}
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.mutedForeground} />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <StatusPill label={tone.label} tone={tone.tone} />
                      <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
                        {generatorServiceLabel(generator.service)}
                      </Text>
                    </View>
                  </Card>
                )}
              </Pressable>
            );
          })}
        </QueryState>
      </View>

      <View style={{ gap: spacing.md }}>
        <Text variant="heading" headingLevel={2}>
          Recently recorded
        </Text>
        <QueryState
          query={recent}
          skeleton={<ListSkeleton rows={3} />}
          isEmpty={!recent.data?.items.length}
          empty={{
            icon: <Zap size={34} color={colors.mutedForeground} />,
            title: 'Nothing recorded yet',
            description: 'Fuel, tokens and tanker deliveries appear here once logged.',
          }}
        >
          {(recent.data?.items ?? []).slice(0, 6).map((purchase) => {
            const quantity =
              purchase.quantity === null
                ? ''
                : purchase.kind === 'ELECTRICITY_TOKEN'
                  ? formatKwh(purchase.quantity)
                  : formatLitres(purchase.quantity);
            return (
              <View
                key={purchase.id}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="callout" style={{ fontWeight: '600' }}>
                    {PURCHASE_KIND_LABELS[purchase.kind]}
                    {quantity ? `, ${quantity}` : ''}
                  </Text>
                  <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                    {formatDate(purchase.occurredAt, 'medium')} · {purchase.property.title}
                  </Text>
                </View>
                <Price amount={purchase.amount} variant="bodyStrong" />
              </View>
            );
          })}
        </QueryState>
      </View>
    </ScrollView>
  );
}

function Action({ Icon, label, onPress }: { Icon: SgIcon; label: string; onPress: () => void }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: '48%',
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        minHeight: 56,
        borderRadius: radius.lg,
        backgroundColor: pressed ? colors.secondary : colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      })}
    >
      <Icon size={20} color={colors.primary} />
      <Text variant="bodyStrong">{label}</Text>
    </Pressable>
  );
}
