import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import { Button, RadioGroup, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import {
  LAND_WATCH_JOB_KIND_LABELS,
  LAND_WATCH_JOB_PAYMENT_NOTE,
  type LandWatchJobKind,
} from '@getrentos/shared';
import { qk } from '@/lib/query/keys';
import { landWatchApi } from '@/lib/api/landWatch';
import { ApiError } from '@/lib/api/client';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { haptics } from '@/lib/haptics';
import { goBack } from '@/lib/goBack';

const KINDS: { value: LandWatchJobKind; description: string }[] = [
  { value: 'FENCING', description: 'A new fence or wall, or repairs to one' },
  { value: 'CLEARING', description: 'Bush clearing, debris or dumped waste' },
  { value: 'SECURITY', description: 'A guard or regular patrols' },
  { value: 'BEACON_REPLACEMENT', description: 'Missing or moved boundary beacons' },
  { value: 'SURVEY', description: 'A surveyor to measure or re-establish the land' },
  { value: 'OTHER', description: 'Anything else the land needs' },
];
const MIN = 10;
const MAX = 2000;

/** Ask GetRentos to find vendors for work on a Managed watch. */
export default function LandWatchJobNew() {
  const { watchId } = useLocalSearchParams<{ watchId: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [kind, setKind] = useState<LandWatchJobKind | null>(null);
  const [description, setDescription] = useState('');
  const trimmed = description.trim();

  const submit = useMutation({
    mutationFn: () => landWatchApi.requestJob(watchId, { kind: kind!, description: trimmed }),
    onSuccess: (job) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.landWatchJobs(watchId) });
      qc.invalidateQueries({ queryKey: qk.landWatch(watchId) });
      qc.invalidateQueries({ queryKey: qk.landWatches, exact: true });
      toast.show('Sent. We’ll post vendors’ quotes here.', 'success');
      router.replace({
        pathname: '/(app)/land-watch-job/[id]',
        params: { id: job.id, watchId },
      });
    },
    onError: (e) => {
      void haptics.error();
      toast.show(
        e instanceof ApiError ? e.message : 'Not sent. Check your connection and try again.',
        'error'
      );
    },
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.xl,
        }}
      >
        <DetailHeader
          eyebrow="Land Watch"
          title="Ask for work"
          subtitle="We find vendors and post their quotes for you to choose"
          onBack={() => goBack()}
        />

        <RadioGroup
          label="What needs doing"
          variant="card"
          value={kind}
          onChange={(next) => {
            void haptics.tap();
            setKind(next);
          }}
          options={KINDS.map((k) => ({
            value: k.value,
            label: LAND_WATCH_JOB_KIND_LABELS[k.value],
            description: k.description,
          }))}
        />

        <TextField
          label="Describe the work"
          value={description}
          onChangeText={setDescription}
          placeholder="Where on the land, how much, and anything a vendor should know."
          multiline
          required
          maxLength={MAX}
          showCount
          containerStyle={{ minHeight: 130 }}
          hint={trimmed.length < MIN ? `At least ${MIN} characters` : undefined}
        />

        <View style={{ gap: spacing.sm }}>
          <Button
            label="Ask for quotes"
            size="lg"
            icon={<Send size={18} color={colors.primaryForeground} />}
            loading={submit.isPending}
            loadingLabel="Sending…"
            disabled={!kind || trimmed.length < MIN || submit.isPending}
            onPress={() => submit.mutate()}
          />
          <Text variant="caption" color="mutedForeground" center>
            {LAND_WATCH_JOB_PAYMENT_NOTE}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
