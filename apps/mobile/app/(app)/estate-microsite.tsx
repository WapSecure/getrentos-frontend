import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Switch,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, ExternalLink, Globe, ImageIcon, Share2 } from 'lucide-react-native';
import {
  Button,
  Card,
  ErrorState,
  FormAlert,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { errorText } from '@/components/estate/EstateUI';
import { StatusPill, isUpgradeError } from '@/components/host/HostUI';
import { ProUpsell } from '@/components/estate/governance/ProUpsell';
import { useEstate } from '@/hooks/useEstate';
import { env } from '@/lib/env';
import { isFreeEstate } from '@/lib/api/estateManager';
import {
  MICROSITE_BIO_MAX,
  MICROSITE_SLUG_MAX,
  estateGovernanceApi,
  governanceKeys,
  isValidSlug,
  micrositeUrl,
  normaliseSlug,
  type MicrositeSettings,
} from '@/lib/api/estateGovernance';
import { pickPhoto } from '@/lib/filePicker';
import { haptics } from '@/lib/haptics';

/**
 * The estate's public page on the website: one link to share with residents
 * and people thinking of moving in. Pro. The page itself is built on the
 * website; here the manager sets what it says, its banner, its address and
 * whether it is live.
 */
export default function EstateMicrosite() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { estate, estateId } = useEstate();
  const free = isFreeEstate(estate);

  const query = useQuery({
    queryKey: governanceKeys.microsite(estateId),
    queryFn: () => estateGovernanceApi.microsite(estateId),
    enabled: !!estateId && !free,
    retry: (n, e) => !isUpgradeError(e) && n < 2,
  });
  const locked = free || isUpgradeError(query.error);
  const live = query.data?.enabled;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={
          locked ? undefined : (
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          )
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow={estate?.name ?? 'Public page'}
          title="Microsite"
          subtitle="The estate’s page on the web"
          onBack={() => router.back()}
          accessory={
            query.data ? (
              <StatusPill label={live ? 'Live' : 'Draft'} tone={live ? 'success' : 'neutral'} />
            ) : null
          }
        />
        {locked ? (
          <ProUpsell
            title="The estate microsite is part of Pro"
            description="A public page showing off the estate, with one link to share."
            perks={[
              'Your own link, e.g. getrentos.com/e/your-estate',
              'A banner and a few words about life in the estate',
              'Homes for rent or sale in the estate, listed on it',
            ]}
          />
        ) : query.isError && !query.data ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : !query.data ? (
          <>
            <Skeleton height={150} radius={radius.lg} />
            <Skeleton height={72} radius={radius.lg} />
            <Skeleton height={160} radius={radius.lg} />
          </>
        ) : (
          /* Mounted once settings arrive, so the form seeds from them. */
          <MicrositeForm key={estateId} estateId={estateId} initial={query.data} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MicrositeForm({ estateId, initial }: { estateId: string; initial: MicrositeSettings }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [saved, setSaved] = useState(initial);
  const [slug, setSlug] = useState(initial.slug);
  const [bio, setBio] = useState(initial.bio ?? '');
  const [enabled, setEnabled] = useState(initial.enabled);

  const keep = (next: MicrositeSettings) => {
    setSaved(next);
    qc.setQueryData(governanceKeys.microsite(estateId), next);
  };

  const banner = useMutation({
    mutationFn: async () => {
      const file = await pickPhoto();
      return file ? estateGovernanceApi.uploadMicrositeBanner(estateId, file) : null;
    },
    onSuccess: (next) => {
      if (!next) return; // the picker was dismissed
      void haptics.success();
      keep(next);
      toast.show('Banner updated.', 'success');
    },
    onError: (e) => toast.show(errorText(e, 'Could not upload that banner.'), 'error'),
  });

  const publish = useMutation({
    mutationFn: (next: boolean) => estateGovernanceApi.updateMicrosite(estateId, { enabled: next }),
    onSuccess: (next) => {
      void haptics.success();
      keep(next);
      toast.show(next.enabled ? 'Your page is live.' : 'Your page is hidden.', 'success');
    },
    onError: (e, next) => {
      setEnabled(!next);
      toast.show(errorText(e, 'Could not change that.'), 'error');
    },
  });

  const save = useMutation({
    mutationFn: () => estateGovernanceApi.updateMicrosite(estateId, { slug, bio: bio.trim() }),
    onSuccess: (next) => {
      void haptics.success();
      keep(next);
      setSlug(next.slug);
      setBio(next.bio ?? '');
      toast.show('Saved.', 'success');
    },
  });

  const slugOk = isValidSlug(slug);
  const dirty = slug !== saved.slug || bio.trim() !== (saved.bio ?? '').trim();
  const link = micrositeUrl(env.webUrl, saved.slug);

  return (
    <View style={{ gap: spacing.lg }}>
      <Pressable
        onPress={() => banner.mutate()}
        disabled={banner.isPending}
        accessibilityRole="button"
        accessibilityLabel={saved.bannerUrl ? 'Change the banner photo' : 'Add a banner photo'}
        style={{
          height: 150,
          borderRadius: radius.lg,
          overflow: 'hidden',
          backgroundColor: colors.secondary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {saved.bannerUrl ? (
          <Image
            source={{ uri: saved.bannerUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={saved.bannerUrl}
            accessible={false}
          />
        ) : (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <ImageIcon size={24} color={colors.mutedForeground} />
            <Text variant="caption" color="mutedForeground">
              No banner yet · a wide photo of the estate works best
            </Text>
          </View>
        )}
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
          <Camera size={13} color={colors.primaryForeground} />
          <Text variant="caption" style={{ color: colors.primaryForeground, fontWeight: '600' }}>
            {banner.isPending ? 'Uploading…' : saved.bannerUrl ? 'Change' : 'Add'}
          </Text>
        </View>
      </Pressable>

      <Card elevated style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Globe size={20} color={enabled ? colors.success : colors.mutedForeground} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">Publish the page</Text>
          <Text variant="caption" color="mutedForeground">
            {enabled ? 'Live: anyone with the link can see it' : 'Draft: hidden from the public'}
          </Text>
        </View>
        <Switch
          value={enabled}
          disabled={publish.isPending}
          onValueChange={(v) => {
            setEnabled(v);
            publish.mutate(v);
          }}
          accessibilityLabel="Publish the microsite"
        />
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
          {link}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              label="Share link"
              variant="secondary"
              icon={<Share2 size={16} color={colors.foreground} />}
              onPress={() => Share.share({ message: link, url: link }).catch(() => undefined)}
            />
          </View>
          {saved.enabled ? (
            <View style={{ flex: 1 }}>
              <Button
                label="View page"
                variant="outline"
                icon={<ExternalLink size={16} color={colors.foreground} />}
                onPress={() => WebBrowser.openBrowserAsync(link)}
              />
            </View>
          ) : null}
        </View>
        {!saved.enabled ? (
          <Text variant="caption" color="mutedForeground">
            The link won’t open until you publish the page.
          </Text>
        ) : null}
      </View>

      <TextField
        label="Link"
        value={slug}
        onChangeText={(v) => setSlug(normaliseSlug(v))}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={MICROSITE_SLUG_MAX}
        placeholder="your-estate-name"
        error={slug && !slugOk ? 'Lowercase letters and numbers, joined by single hyphens.' : null}
        hint={
          slug !== saved.slug && slugOk
            ? 'Once saved, the old link stops working.'
            : `${env.webUrl.replace(/^https?:\/\//, '')}/e/${slug || 'your-estate-name'}`
        }
      />
      <TextField
        label="About the estate"
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={MICROSITE_BIO_MAX}
        placeholder="What it’s like to live here: security, amenities, the community…"
        hint={`${bio.length} / ${MICROSITE_BIO_MAX}`}
      />
      {save.error ? (
        <FormAlert message={errorText(save.error, 'Could not save these changes.')} />
      ) : null}
      <Button
        label="Save changes"
        disabled={!dirty || !slugOk}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
