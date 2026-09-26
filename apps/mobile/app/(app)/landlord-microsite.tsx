import { useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Camera, Globe, ImageIcon } from 'lucide-react-native';
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
import { landlordApi, type MicrositeSettings } from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { pickImage } from '@/lib/filePicker';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

export default function LandlordMicrosite() {
  const { colors, spacing, radius } = useTheme();
  const query = useQuery({ queryKey: qk.landlord.microsite, queryFn: landlordApi.microsite });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Public presence"
        title="Microsite"
        subtitle="Your branded property portfolio page"
        onBack={() => router.back()}
        accessory={
          query.data ? (
            <Badge
              label={query.data.enabled ? 'Live' : 'Off'}
              tone={query.data.enabled ? 'success' : 'neutral'}
            />
          ) : null
        }
      />

      {query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={140} radius={radius.lg} />
          ))}
        </View>
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.data ? (
        /* Mounted only once settings arrive, so the form seeds from props. */
        <MicrositeForm initial={query.data} />
      ) : null}
    </View>
  );
}

function MicrositeForm({ initial }: { initial: MicrositeSettings }) {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const [slug, setSlug] = useState(initial.slug);
  const [bio, setBio] = useState(initial.bio ?? '');
  const [enabled, setEnabled] = useState(initial.enabled);

  const uploadBanner = useMutation({
    mutationFn: async () => {
      const file = await pickImage();
      if (!file) return null;
      return landlordApi.uploadMicrositeBanner(file);
    },
    onSuccess: (result) => {
      if (!result) return; // the picker was dismissed
      qc.invalidateQueries({ queryKey: qk.landlord.microsite });
      toast.show('Banner updated.', 'success');
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not upload that banner.', 'error'),
  });

  const save = useMutation({
    mutationFn: (patch: { slug?: string; bio?: string; enabled?: boolean }) =>
      landlordApi.updateMicrosite(patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.landlord.microsite });
      toast.show('Microsite updated.', 'success');
    },
    onError: (e, patch) => {
      // Put the switch back if it was the thing that failed.
      if (patch.enabled !== undefined) setEnabled(!patch.enabled);
      toast.show(e instanceof ApiError ? e.message : 'Could not update the microsite.', 'error');
    },
  });

  // The API only accepts lowercase words joined by single hyphens.
  const slugValid = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.lg,
      }}
    >
      <Pressable
        onPress={() => uploadBanner.mutate()}
        disabled={uploadBanner.isPending}
        accessibilityRole="button"
        accessibilityLabel={initial.bannerUrl ? 'Change the banner' : 'Add a banner'}
        style={{
          height: 140,
          borderRadius: radius.lg,
          overflow: 'hidden',
          backgroundColor: colors.secondary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {initial.bannerUrl ? (
          <Image
            source={{ uri: initial.bannerUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <ImageIcon size={24} color={colors.mutedForeground} />
            <Text variant="caption" color="mutedForeground">
              No banner yet
            </Text>
          </View>
        )}

        {/* Always offer the swap, even over an existing banner. */}
        <View
          style={{
            position: 'absolute',
            bottom: spacing.sm,
            right: spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: spacing.md,
            paddingVertical: 6,
            borderRadius: radius.full,
            backgroundColor: colors.scrim,
          }}
        >
          <Camera size={13} color="#fff" />
          <Text variant="caption" style={{ color: '#fff', fontWeight: '600' }}>
            {uploadBanner.isPending ? 'Uploading…' : initial.bannerUrl ? 'Change' : 'Add'}
          </Text>
        </View>
      </Pressable>

      <Card padding={spacing.lg}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Globe size={19} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Public microsite</Text>
            <Text variant="caption" color="mutedForeground">
              A shareable page listing everything you have available.
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={(v) => {
              setEnabled(v);
              save.mutate({ enabled: v });
            }}
            accessibilityLabel="Publish microsite"
          />
        </View>
      </Card>

      <TextField
        label="Address"
        placeholder="your-name"
        autoCapitalize="none"
        value={slug}
        onChangeText={setSlug}
        error={slug && !slugValid ? 'Lowercase words joined by hyphens' : null}
        hint={`getrentos.com/${slug || 'your-name'}`}
      />

      <TextField
        label="Bio (optional)"
        placeholder="A line about you for people browsing your page"
        multiline
        numberOfLines={3}
        maxLength={500}
        value={bio}
        onChangeText={setBio}
      />

      <Button
        label="Save changes"
        loading={save.isPending}
        disabled={!slugValid}
        onPress={() => save.mutate({ slug, bio: bio.trim() || undefined })}
      />
    </ScrollView>
  );
}
