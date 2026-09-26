import { useRef, useState } from 'react';
import { Pressable, ScrollView, View, type TextInput } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera } from 'lucide-react-native';
import {
  Avatar,
  Button,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Image } from 'expo-image';
import { qk } from '@/lib/query/keys';
import { profileApi, type RenterProfile } from '@/lib/api/profile';
import { pickImage } from '@/lib/filePicker';
import { ApiError } from '@/lib/api/client';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

export default function EditProfile() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const query = useQuery({ queryKey: qk.renter.profile, queryFn: profileApi.get });

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
        <DetailHeader
          eyebrow="Your account"
          title="Edit profile"
          subtitle="Photo, contact details and personal bio"
          onBack={() => router.back()}
          style={{ flex: 1 }}
        />
      </View>

      {!query.data ? (
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <Skeleton height={80} width={80} radius={40} />
          <Skeleton height={44} />
          <Skeleton height={44} />
        </View>
      ) : (
        <ProfileForm profile={query.data} />
      )}
    </View>
  );
}

function ProfileForm({ profile }: { profile: RenterProfile }) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [location, setLocation] = useState(profile.location ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');

  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const locationRef = useRef<TextInput>(null);

  const saveMutation = useMutation({
    mutationFn: () =>
      profileApi.update({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        bio: bio.trim() || undefined,
      }),
    onSuccess: (updated) => {
      qc.setQueryData(qk.renter.profile, updated);
      toast.show('Profile updated.', 'success');
      router.back();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not update your profile.', 'error'),
  });

  const avatarMutation = useMutation({
    mutationFn: async () => {
      const file = await pickImage();
      if (!file) return null;
      return profileApi.uploadAvatar(file);
    },
    onSuccess: (updated) => {
      if (updated) qc.setQueryData(qk.renter.profile, updated);
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not update your photo.', 'error'),
  });

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.lg,
      }}
    >
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Pressable onPress={() => avatarMutation.mutate()} disabled={avatarMutation.isPending}>
          {profile.avatarUrl ? (
            <Image
              source={{ uri: profile.avatarUrl }}
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
          {avatarMutation.isPending ? 'Uploading…' : 'Tap to change photo'}
        </Text>
      </View>

      <TextField
        label="Full name"
        value={fullName}
        onChangeText={setFullName}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <TextField
        ref={emailRef}
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
      />
      <TextField
        ref={phoneRef}
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        returnKeyType="next"
        onSubmitEditing={() => locationRef.current?.focus()}
      />
      <TextField
        ref={locationRef}
        label="Location"
        placeholder="e.g. Lagos, Nigeria"
        value={location}
        onChangeText={setLocation}
      />
      <TextField
        label="Bio"
        placeholder="A short note landlords will see"
        multiline
        numberOfLines={3}
        value={bio}
        onChangeText={setBio}
      />

      <Button
        label="Save changes"
        loading={saveMutation.isPending}
        onPress={() => saveMutation.mutate()}
      />
    </ScrollView>
  );
}
