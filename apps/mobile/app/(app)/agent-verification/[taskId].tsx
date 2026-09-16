import { useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Button, Card, Chip, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { agentApi, type AgentVerificationSubjectType } from '@/lib/api/agent';
import { ApiError } from '@/lib/api/client';

const SUBJECT_TYPES: { value: AgentVerificationSubjectType; label: string }[] = [
  { value: 'TENANT', label: 'Tenant' },
  { value: 'BUYER', label: 'Buyer' },
  { value: 'PROPERTY', label: 'Property' },
];

export default function SubmitVerification() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const [subjectName, setSubjectName] = useState('');
  const [subjectType, setSubjectType] = useState<AgentVerificationSubjectType>('TENANT');
  const [idVerified, setIdVerified] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      agentApi.submitVerification({
        taskId,
        subjectName: subjectName.trim(),
        subjectType,
        idVerified,
        addressConfirmed,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent', 'tasks'] });
      qc.invalidateQueries({ queryKey: qk.agent.dashboard });
      qc.invalidateQueries({ queryKey: ['agent', 'verifications'] });
      qc.invalidateQueries({ queryKey: qk.agent.sync });
      toast.show('Verification submitted.', 'success');
      router.back();
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not submit this verification.',
        'error'
      ),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="title">Submit verification</Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <TextField
          label="Subject's full name"
          placeholder="e.g. Amaka Obi"
          value={subjectName}
          onChangeText={setSubjectName}
        />

        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">Subject type</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {SUBJECT_TYPES.map((t) => (
              <Chip
                key={t.value}
                label={t.label}
                selected={subjectType === t.value}
                onPress={() => setSubjectType(t.value)}
              />
            ))}
          </View>
        </View>

        <Card elevated>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text variant="bodyStrong">ID verified</Text>
            <Switch
              value={idVerified}
              onValueChange={setIdVerified}
              trackColor={{ true: colors.primary, false: colors.secondary }}
              thumbColor={colors.card}
            />
          </View>
        </Card>

        <Card elevated>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text variant="bodyStrong">Address confirmed</Text>
            <Switch
              value={addressConfirmed}
              onValueChange={setAddressConfirmed}
              trackColor={{ true: colors.primary, false: colors.secondary }}
              thumbColor={colors.card}
            />
          </View>
        </Card>

        <TextField
          label="Notes (optional)"
          placeholder="e.g. NIN matched, utility bill confirmed address"
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
        />

        <Button
          label="Submit verification"
          loading={mutation.isPending}
          disabled={!subjectName.trim()}
          onPress={() => mutation.mutate()}
        />
      </ScrollView>
    </View>
  );
}
