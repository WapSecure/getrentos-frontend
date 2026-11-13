import { useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Zap } from '@sureground/icons/native';
import {
  METER_SCOPE_LABELS,
  METER_TYPE_LABELS,
  bandCheck,
  discoLabel,
  maskMeterNumber,
  type ElectricityMeter,
} from '@sureground/shared';
import {
  Button,
  Card,
  Chip,
  DateField,
  FormAlert,
  ListSkeleton,
  NumberField,
  QueryState,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { homeUtilitiesApi, lagosToday } from '@/lib/api/homeUtilities';
import { errorMessage } from '@/lib/api/client';
import { haptics } from '@/lib/haptics';
import { useMyHomes } from '@/hooks/useMyHomes';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { Sheet } from '@/components/Sheet';
import { goBack } from '@/lib/goBack';

/** Meters (last 4 digits only) and the day's grid supply, logged from site. */
export default function Meters() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const homes = useMyHomes();
  const [propertyId, setPropertyId] = useState('');
  const [logging, setLogging] = useState<ElectricityMeter | null>(null);
  const meters = useQuery({
    queryKey: qk.homeCare.meters(propertyId || 'all'),
    queryFn: () => homeUtilitiesApi.meters(propertyId || undefined),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={meters.isRefetching}
            onRefresh={() => void meters.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow="Power and water"
          title="Electricity meters"
          subtitle="Log hours of grid supply to compare with the band"
          onBack={() => goBack()}
        />
        {(homes.data?.length ?? 0) > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            <Chip label="All homes" selected={!propertyId} onPress={() => setPropertyId('')} />
            {(homes.data ?? []).map((h) => (
              <Chip
                key={h.id}
                label={h.name}
                selected={propertyId === h.id}
                onPress={() => setPropertyId(h.id)}
              />
            ))}
          </ScrollView>
        ) : null}
        <QueryState
          query={meters}
          skeleton={<ListSkeleton variant="card" rows={2} height={110} />}
          isEmpty={!meters.data?.length}
          empty={{
            icon: <Zap size={34} color={colors.mutedForeground} />,
            title: 'No meters yet',
            description: 'The owner or managing agency adds meters from the web.',
          }}
        >
          {(meters.data ?? []).map((meter) => {
            const check = bandCheck(meter.supplyLast30Days?.averageHours, meter.tariffBand);
            return (
              <Card key={meter.id} elevated style={{ gap: spacing.sm }}>
                <Text variant="bodyStrong">
                  {meter.label || meter.unit?.name || METER_SCOPE_LABELS[meter.scope]}
                </Text>
                <Text variant="caption" color="mutedForeground">
                  {[
                    meter.property?.title,
                    discoLabel(meter.disco, meter.discoOther),
                    METER_TYPE_LABELS[meter.meterType],
                    meter.tariffBand ? `Band ${meter.tariffBand}` : null,
                    maskMeterNumber(meter.meterNumberLast4),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                <Text
                  variant="caption"
                  style={{
                    color: check.status === 'BELOW' ? colors.warning : colors.mutedForeground,
                  }}
                >
                  Last 30 days: {check.message}
                </Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button
                    label="Log supply"
                    size="sm"
                    onPress={() => setLogging(meter)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    label={meter.meterType === 'PREPAID' ? 'Record token' : 'Record bill'}
                    size="sm"
                    variant="outline"
                    style={{ flex: 1 }}
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/home-care/log-fuel',
                        params: {
                          kind:
                            meter.meterType === 'PREPAID'
                              ? 'ELECTRICITY_TOKEN'
                              : 'ELECTRICITY_BILL',
                          propertyId: meter.propertyId,
                          meterId: meter.id,
                        },
                      })
                    }
                  />
                </View>
              </Card>
            );
          })}
        </QueryState>
      </ScrollView>
      <Sheet open={!!logging} onClose={() => setLogging(null)} title="Log grid supply">
        {logging ? <LogSupply meter={logging} onDone={() => setLogging(null)} /> : null}
      </Sheet>
    </View>
  );
}

function LogSupply({ meter, onDone }: { meter: ElectricityMeter; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [day, setDay] = useState(lagosToday());
  const [hours, setHours] = useState('');
  const value = hours === '' ? NaN : Number(hours);
  const valid = Number.isFinite(value) && value >= 0 && value <= 24;
  const save = useMutation({
    mutationFn: () =>
      homeUtilitiesApi.logSupply(meter.id, { day, hoursSupplied: Math.round(value * 10) / 10 }),
    onSuccess: () => {
      void haptics.success();
      void qc.invalidateQueries({ queryKey: qk.homeCare.utilities });
      toast.show('Supply logged.', 'success');
      onDone();
    },
  });
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        <DateField label="Day" value={day} onChange={setDay} max={lagosToday()} />
        <NumberField
          label="Hours of grid supply"
          hint="0 to 24"
          unit="hours"
          decimals={1}
          value={hours}
          onValueChange={setHours}
          required
        />
        {hours !== '' && !valid ? <FormAlert message="Enter a number from 0 to 24." /> : null}
        {save.error ? <FormAlert message={errorMessage(save.error, 'Could not log it.')} /> : null}
        <Button
          label="Log supply"
          disabled={!valid}
          loading={save.isPending}
          onPress={() => save.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
