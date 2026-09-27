import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { ownerApi, type OwnerProfile } from '@/lib/api/owner';
import { ApiError } from '@/lib/api/client';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

export default function OwnerProfileScreen() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const query = useQuery({ queryKey: qk.owner.profile, queryFn: ownerApi.profile });

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
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow="Account"
          title="Profile"
          subtitle="How buyers and realtors see you"
          onBack={() => router.back()}
        />
        {query.isError && !query.data ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : !query.data ? (
          <Skeleton height={320} radius={radius.lg} />
        ) : (
          <ProfileForm initial={query.data} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ProfileForm({ initial }: { initial: OwnerProfile }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [legalName, setLegalName] = useState(initial.legalName);
  const [companyName, setCompanyName] = useState(initial.companyName ?? '');
  const [phone, setPhone] = useState(initial.phone ?? '');

  const changed =
    legalName.trim() !== initial.legalName ||
    companyName.trim() !== (initial.companyName ?? '') ||
    phone.trim() !== (initial.phone ?? '');
  const phoneChanged = phone.trim() !== (initial.phone ?? '');

  const save = useMutation({
    mutationFn: () =>
      ownerApi.updateProfile({
        legalName: legalName.trim(),
        companyName: companyName.trim(),
        phone: phone.trim(),
      }),
    onSuccess: (saved) => {
      qc.setQueryData(qk.owner.profile, saved);
      qc.invalidateQueries({ queryKey: qk.security });
      toast.show('Profile saved.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not save your profile.', 'error'),
  });

  return (
    <>
      <Card elevated style={{ gap: spacing.md }}>
        <TextField
          label="Full name"
          value={legalName}
          onChangeText={setLegalName}
          autoComplete="name"
          textContentType="name"
        />
        <TextField
          label="Company (optional)"
          value={companyName}
          onChangeText={setCompanyName}
          textContentType="organizationName"
        />
        <View style={{ gap: spacing.xs }}>
          <TextField
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />
          {phoneChanged && initial.phoneVerified ? (
            <Text variant="caption" color="mutedForeground">
              You’ll need to verify the new number again.
            </Text>
          ) : null}
        </View>
      </Card>

      <Card elevated style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
            Sign-in email
          </Text>
          {initial.phone && !initial.phoneVerified ? (
            <Badge label="Phone not verified" tone="warning" />
          ) : null}
        </View>
        <Text variant="bodyStrong">{initial.email || '—'}</Text>
        <Text variant="caption" color="mutedForeground">
          Contact support to change the email you sign in with.
        </Text>
      </Card>

      <Button
        label="Save profile"
        disabled={!changed || !legalName.trim()}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
      {initial.phone && !initial.phoneVerified ? (
        <Button
          label="Verify your phone"
          variant="secondary"
          onPress={() => router.push('/(app)/security-settings')}
        />
      ) : null}
    </>
  );
}
