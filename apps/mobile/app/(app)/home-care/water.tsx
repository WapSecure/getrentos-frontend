import { useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, ClipboardCheck, Paperclip, Plus } from '@sureground/icons/native';
import {
  WATER_TEST_RESULT_LABELS,
  WATER_UTILITY_KINDS,
  type WaterTestResult,
} from '@sureground/shared';
import {
  Button,
  Card,
  Chip,
  DateField,
  FormAlert,
  IconButton,
  ListSkeleton,
  QueryState,
  SwitchRow,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { dayToInstant, homeUtilitiesApi, lagosToday } from '@/lib/api/homeUtilities';
import { homeCareApi } from '@/lib/api/homeCare';
import { errorMessage } from '@/lib/api/client';
import type { PickedFile } from '@/lib/api/documents';
import { capturePhoto, pickDocument } from '@/lib/filePicker';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useMyHomes } from '@/hooks/useMyHomes';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { Sheet } from '@/components/Sheet';
import { StatusPill, type Tone } from '@/components/host/HostUI';
import { goBack } from '@/lib/goBack';

const RESULT_TONE: Record<WaterTestResult, Tone> = {
  PASS: 'success',
  FAIL: 'danger',
  INCONCLUSIVE: 'warning',
};

export default function WaterTests() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [adding, setAdding] = useState(false);
  const tests = useQuery({
    queryKey: qk.homeCare.waterTests('all'),
    queryFn: () => homeUtilitiesApi.waterTests(),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={tests.isRefetching}
            onRefresh={() => void tests.refetch()}
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
          title="Water tests"
          subtitle="Lab results for boreholes and tanks"
          onBack={() => goBack()}
          accessory={
            <IconButton
              accessibilityLabel="Record a water test"
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => setAdding(true)}
            />
          }
        />
        <QueryState
          query={tests}
          skeleton={<ListSkeleton variant="card" rows={3} height={90} />}
          isEmpty={!tests.data?.items.length}
          empty={{
            icon: <ClipboardCheck size={34} color={colors.mutedForeground} />,
            title: 'No water tests yet',
            description:
              'Record each lab test of the borehole or tank water, with a photo of the report.',
            action: <Button label="Record a water test" onPress={() => setAdding(true)} />,
          }}
        >
          {(tests.data?.items ?? []).map((test) => (
            <Card
              key={test.id}
              elevated
              style={{ gap: spacing.xs, opacity: test.voidedAt ? 0.6 : 1 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  {test.asset?.name ?? test.property.title}
                </Text>
                <StatusPill
                  label={test.voidedAt ? 'Voided' : WATER_TEST_RESULT_LABELS[test.result]}
                  tone={test.voidedAt ? 'neutral' : RESULT_TONE[test.result]}
                />
              </View>
              <Text variant="caption" color="mutedForeground">
                {formatDate(test.sampledAt, 'medium')} · {test.labName}
                {test.asset ? ` · ${test.property.title}` : ''}
              </Text>
            </Card>
          ))}
        </QueryState>
      </ScrollView>
      <Sheet open={adding} onClose={() => setAdding(false)} title="Record a water test">
        {adding ? <AddTest onDone={() => setAdding(false)} /> : null}
      </Sheet>
    </View>
  );
}

function AddTest({ onDone }: { onDone: () => void }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const homes = useMyHomes();
  const [propertyId, setPropertyId] = useState(homes.data?.length === 1 ? homes.data[0].id : '');
  const [assetId, setAssetId] = useState('');
  const [day, setDay] = useState(lagosToday());
  const [lab, setLab] = useState('');
  const [result, setResult] = useState<WaterTestResult>('PASS');
  const [ph, setPh] = useState('');
  const [coliforms, setColiforms] = useState('');
  const [shared, setShared] = useState(false);
  const [report, setReport] = useState<PickedFile | null>(null);
  const sources = useQuery({
    queryKey: [...qk.homeCare.assets(propertyId || 'none'), 'water'],
    queryFn: async () => {
      const pages = await Promise.all(
        WATER_UTILITY_KINDS.map((kind) => homeCareApi.assets(propertyId, undefined, kind))
      );
      return pages.flatMap((page) => page.items);
    },
    enabled: !!propertyId,
  });
  const save = useMutation({
    mutationFn: async () => {
      const parameters: Record<string, string | number> = {};
      if (ph.trim() && Number.isFinite(Number(ph))) parameters.pH = Number(ph);
      if (coliforms.trim()) parameters.coliforms = coliforms.trim();
      const test = await homeUtilitiesApi.recordWaterTest({
        propertyId,
        assetId: assetId || undefined,
        sampledAt: dayToInstant(day),
        labName: lab.trim(),
        result,
        parameters: Object.keys(parameters).length ? parameters : undefined,
        sharedWithResidents: shared,
      });
      if (report) {
        try {
          await homeUtilitiesApi.attachLabReport(test.id, report);
        } catch {
          toast.show('Saved, but the lab report did not upload.', 'error');
        }
      }
      return test;
    },
    onSuccess: (test) => {
      void haptics.success();
      void qc.invalidateQueries({ queryKey: qk.homeCare.utilities });
      toast.show(
        test.result === 'FAIL'
          ? 'Failed test recorded. The owner and agency have been told.'
          : 'Water test recorded.',
        'success'
      );
      onDone();
    },
  });
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {(homes.data ?? []).map((h) => (
            <Chip
              key={h.id}
              label={h.name}
              size="sm"
              selected={propertyId === h.id}
              onPress={() => {
                setPropertyId(h.id);
                setAssetId('');
              }}
            />
          ))}
        </View>
        {sources.data?.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {sources.data.map((asset) => (
              <Chip
                key={asset.id}
                label={asset.name}
                size="sm"
                selected={assetId === asset.id}
                onPress={() => setAssetId(assetId === asset.id ? '' : asset.id)}
              />
            ))}
          </View>
        ) : null}
        <DateField label="Sampled on" value={day} onChange={setDay} max={lagosToday()} />
        <TextField label="Laboratory" value={lab} onChangeText={setLab} required />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {(Object.keys(WATER_TEST_RESULT_LABELS) as WaterTestResult[]).map((value) => (
            <Chip
              key={value}
              label={WATER_TEST_RESULT_LABELS[value]}
              selected={result === value}
              onPress={() => setResult(value)}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <TextField
              label="pH"
              keyboardType="decimal-pad"
              value={ph}
              onChangeText={setPh}
              optional
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="Coliforms" value={coliforms} onChangeText={setColiforms} optional />
          </View>
        </View>
        <SwitchRow
          label="Share the result with residents"
          description="The lab report itself is never shared."
          value={shared}
          onValueChange={setShared}
        />
        {report ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Paperclip size={16} color={colors.mutedForeground} />
            <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
              {report.name}
            </Text>
            <Button label="Remove" variant="ghost" size="sm" onPress={() => setReport(null)} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Photo of report"
              variant="outline"
              size="sm"
              icon={<Camera size={16} color={colors.foreground} />}
              onPress={async () => setReport((await capturePhoto()) ?? null)}
              style={{ flex: 1 }}
            />
            <Button
              label="Choose file"
              variant="outline"
              size="sm"
              onPress={async () => setReport((await pickDocument()) ?? null)}
              style={{ flex: 1 }}
            />
          </View>
        )}
        {save.error ? (
          <FormAlert message={errorMessage(save.error, 'Could not save the test.')} />
        ) : null}
        <Button
          label="Save test"
          disabled={!propertyId || lab.trim().length < 2}
          loading={save.isPending}
          onPress={() => save.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
