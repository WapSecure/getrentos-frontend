import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Camera } from 'lucide-react-native';
import {
  Avatar,
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
import { realtorApi, type RealtorProfile } from '@/lib/api/realtor';
import { ApiError } from '@/lib/api/client';
import { pickImage } from '@/lib/filePicker';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

export default function RealtorProfileScreen() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const query = useQuery({ queryKey: qk.realtor.profile, queryFn: realtorApi.profile });

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
          subtitle="How clients and buyers see you"
          onBack={() => router.back()}
        />
        {query.isError && !query.data ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : !query.data ? (
          <Skeleton height={280} radius={radius.lg} />
        ) : (
          <ProfileForm initial={query.data} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ProfileForm({ initial }: { initial: RealtorProfile }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [fullName, setFullName] = useState(initial.fullName);
  const [companyName, setCompanyName] = useState(initial.companyName ?? '');
  const [phone, setPhone] = useState(initial.phone ?? '');
  const changed =
    fullName.trim() !== initial.fullName ||
    companyName.trim() !== (initial.companyName ?? '') ||
    phone.trim() !== (initial.phone ?? '');

  const save = useMutation({
    mutationFn: () =>
      realtorApi.updateProfile({
        fullName: fullName.trim(),
        email: initial.email,
        companyName: companyName.trim() || undefined,
        phone: phone.trim(),
      }),
    onSuccess: (saved) => {
      qc.setQueryData(qk.realtor.profile, saved);
      qc.invalidateQueries({ queryKey: qk.auth.me });
      qc.invalidateQueries({ queryKey: qk.security });
      toast.show('Profile saved.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not save your profile.', 'error'),
  });

  const avatar = useMutation({
    mutationFn: async () => {
      const file = await pickImage();
      return file ? realtorApi.uploadAvatar(file) : null;
    },
    onSuccess: (saved) => {
      if (!saved) return;
      qc.setQueryData(qk.realtor.profile, saved);
      toast.show('Photo updated.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not update your photo.', 'error'),
  });
  const photo = initial.avatarUrl;

  return (
    <>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Pressable
          onPress={() => avatar.mutate()}
          disabled={avatar.isPending}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          accessibilityState={{ disabled: avatar.isPending, busy: avatar.isPending }}
          style={{ opacity: avatar.isPending ? 0.6 : 1 }}
        >
          {photo ? (
            <Image
              source={{ uri: photo }}
              contentFit="cover"
              cachePolicy="memory-disk"
              accessible={false}
              style={{ width: 84, height: 84, borderRadius: 42 }}
            />
          ) : (
            <Avatar name={fullName} size={84} />
          )}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: colors.background,
            }}
          >
            <Camera size={13} color={colors.primaryForeground} />
          </View>
        </Pressable>
        <Text variant="caption" color="mutedForeground">
          {avatar.isPending ? 'Uploading…' : 'Tap to change photo'}
        </Text>
      </View>
      <Card elevated style={{ gap: spacing.md }}>
        <TextField
          label="Full name"
          value={fullName}
          onChangeText={setFullName}
          autoComplete="name"
          textContentType="name"
        />
        <TextField
          label="Agency (optional)"
          value={companyName}
          onChangeText={setCompanyName}
          textContentType="organizationName"
          hint="Shown to clients alongside your name"
        />
        <TextField
          label="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          hint={
            phone.trim() !== (initial.phone ?? '')
              ? 'You’ll verify the new number again.'
              : undefined
          }
        />
      </Card>
      <Card elevated style={{ gap: spacing.xs }}>
        <Text variant="caption" color="mutedForeground">
          Sign-in email
        </Text>
        <Text variant="bodyStrong">{initial.email || '—'}</Text>
        <Text
          variant="caption"
          color="primary"
          style={{ fontWeight: '700' }}
          onPress={() => router.push('/(app)/security-settings')}
          accessibilityRole="link"
        >
          Change it in Security
        </Text>
      </Card>
      <Button
        label="Save profile"
        disabled={!changed || fullName.trim().length < 2}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
    </>
  );
}
