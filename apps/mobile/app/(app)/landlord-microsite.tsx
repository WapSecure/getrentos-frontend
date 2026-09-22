import { useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ChevronLeft, Globe, ImageIcon } from 'lucide-react-native';
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

export default function LandlordMicrosite() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const query = useQuery({ queryKey: qk.landlord.microsite, queryFn: landlordApi.microsite });

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
          accessibilityLabel="Go back"
          hitSlop={10}
        >
          <ChevronLeft size={26} color={colors.foreground} />
        </Pressable>
        <Text variant="title" style={{ flex: 1 }}>
          Microsite
        </Text>
        {query.data ? (
          <Badge
            label={query.data.enabled ? 'Live' : 'Off'}
            tone={query.data.enabled ? 'success' : 'neutral'}
          />
        ) : null}
      </View>

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
      <View
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
      </View>

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
