import { useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Power } from '@sureground/icons/native';
import { formatLitres, generatorServiceLabel } from '@sureground/shared';
import {
  Button,
  Card,
  DetailSkeleton,
  FormAlert,
  NumberField,
  QueryState,
  SwitchRow,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { homeUtilitiesApi } from '@/lib/api/homeUtilities';
import { errorMessage } from '@/lib/api/client';
import { formatDate, formatNaira } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';

/** One generator: log the hour meter where it stands, then see where the service is. */
export default function GeneratorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [hourMeter, setHourMeter] = useState('');
  const [meterReset, setMeterReset] = useState(false);
  const generators = useQuery({
    queryKey: qk.homeCare.generators('all'),
    queryFn: () => homeUtilitiesApi.generators(),
  });
  const generator = generators.data?.find((g) => g.id === id);
  const readings = useQuery({
    queryKey: qk.homeCare.readings(id),
    queryFn: () => homeUtilitiesApi.readings(id),
    enabled: !!id,
  });
  const latest = generator?.service.latestReading;

  const log = useMutation({
    mutationFn: () =>
      homeUtilitiesApi.logHours(id, {
        readAt: new Date().toISOString(),
        hourMeter: Number(hourMeter),
        meterReset: meterReset || undefined,
      }),
    onSuccess: (result) => {
      void haptics.success();
      setHourMeter('');
      setMeterReset(false);
      void qc.invalidateQueries({ queryKey: qk.homeCare.utilities });
      toast.show(`Hours logged. ${generatorServiceLabel(result.service)}.`, 'success');
    },
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={generators.isRefetching}
            onRefresh={() => {
              void generators.refetch();
              void readings.refetch();
            }}
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
          eyebrow="Generator"
          title={generator?.name ?? 'Generator'}
          subtitle={generator?.property.title}
          onBack={() => goBack()}
        />
        <QueryState
          query={generators}
          skeleton={<DetailSkeleton />}
          isEmpty={!!generators.data && !generator}
          empty={{
            icon: <Power size={34} color={colors.mutedForeground} />,
            title: 'Generator not found',
            description: 'It may have been removed, or it is on a home you no longer manage.',
          }}
        >
          {generator ? (
            <>
              <Card elevated style={{ gap: spacing.xs }}>
                <Text variant="bodyStrong">{generatorServiceLabel(generator.service)}</Text>
                <Text variant="caption" color="mutedForeground">
                  {latest
                    ? `Last reading ${latest.hourMeter} hours on ${formatDate(latest.readAt, 'medium')}`
                    : 'No reading yet'}
                </Text>
                {generator.lastFuel ? (
                  <Text variant="caption" color="mutedForeground">
                    Last fuel {formatDate(generator.lastFuel.occurredAt, 'medium')}
                    {generator.lastFuel.litres
                      ? `, ${formatLitres(generator.lastFuel.litres)}`
                      : ''}
                    {`, ${formatNaira(generator.lastFuel.amount)}`}
                  </Text>
                ) : null}
              </Card>

              <View style={{ gap: spacing.md }}>
                <Text variant="heading" headingLevel={2}>
                  Log hours
                </Text>
                <NumberField
                  label="Hour meter"
                  hint={latest ? `Last reading ${latest.hourMeter}` : 'The number on the generator'}
                  unit="hours"
                  decimals={1}
                  value={hourMeter}
                  onValueChange={setHourMeter}
                  required
                />
                <SwitchRow
                  label="Meter was reset or replaced"
                  description="Only if the number went back to zero."
                  value={meterReset}
                  onValueChange={setMeterReset}
                />
                {log.error ? (
                  <FormAlert
                    message={errorMessage(log.error, 'This reading could not be saved.')}
                  />
                ) : null}
                <Button
                  label="Log hours"
                  disabled={hourMeter === ''}
                  loading={log.isPending}
                  onPress={() => log.mutate()}
                />
                <Button
                  label="Log fuel for this generator"
                  variant="outline"
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/home-care/log-fuel',
                      params: {
                        kind: 'FUEL',
                        propertyId: generator.property.id,
                        generatorId: generator.id,
                      },
                    })
                  }
                />
              </View>

              <View style={{ gap: spacing.sm }}>
                <Text variant="heading" headingLevel={2}>
                  Recent readings
                </Text>
                {(readings.data?.items ?? []).length ? (
                  readings.data!.items.map((reading) => (
                    <View
                      key={reading.id}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        gap: spacing.md,
                      }}
                    >
                      <Text
                        variant="callout"
                        style={{
                          textDecorationLine: reading.voidedAt ? 'line-through' : 'none',
                          color: reading.voidedAt ? colors.mutedForeground : colors.foreground,
                        }}
                      >
                        {reading.hourMeter} hours{reading.meterReset ? ' (reset)' : ''}
                      </Text>
                      <Text variant="callout" color="mutedForeground">
                        {formatDate(reading.readAt, 'medium')}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text variant="callout" color="mutedForeground">
                    No readings yet.
                  </Text>
                )}
              </View>
            </>
          ) : null}
        </QueryState>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
