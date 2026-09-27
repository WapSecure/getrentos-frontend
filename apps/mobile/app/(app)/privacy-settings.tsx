import { useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Globe, Lock, Users } from 'lucide-react-native';
import {
  Button,
  Card,
  Divider,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  preferencesApi,
  DEFAULT_PRIVACY,
  type PrivacyPreferences,
  type ProfileVisibility,
} from '@/lib/api/preferences';
import { ApiError } from '@/lib/api/client';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

const VISIBILITY: { id: ProfileVisibility; label: string; icon: typeof Globe }[] = [
  { id: 'public', label: 'Public', icon: Globe },
  { id: 'private', label: 'Private', icon: Lock },
  { id: 'contacts', label: 'Contacts', icon: Users },
];

const TOGGLES: { key: keyof PrivacyPreferences; title: string; description: string }[] = [
  { key: 'showEmail', title: 'Show email', description: 'Landlords you apply to can see it' },
  { key: 'showPhone', title: 'Show phone', description: 'Landlords you apply to can call you' },
  { key: 'showActivity', title: 'Show activity', description: 'Recently viewed and saved homes' },
  { key: 'allowMessages', title: 'Allow messages', description: 'Let landlords start a chat' },
  { key: 'shareData', title: 'Share usage data', description: 'Helps us improve recommendations' },
];

export default function PrivacySettings() {
  const { colors, spacing, radius } = useTheme();
  const query = useQuery({ queryKey: qk.renter.preferences, queryFn: preferencesApi.get });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Your data"
        title="Privacy"
        subtitle="Control visibility and information sharing"
        onBack={() => router.back()}
      />

      {query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={140} radius={radius.lg} />
          ))}
        </View>
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        /* Mounted only once the stored bag has arrived, so the form can seed its
           own state from props instead of syncing it in an effect. */
        <PrivacyForm
          initialPrivacy={{ ...DEFAULT_PRIVACY, ...(query.data?.privacy ?? {}) }}
          initialShareTenancyStanding={query.data?.shareTenancyStanding === true}
        />
      )}
    </View>
  );
}

function PrivacyForm({
  initialPrivacy,
  initialShareTenancyStanding,
}: {
  initialPrivacy: PrivacyPreferences;
  initialShareTenancyStanding: boolean;
}) {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const [privacy, setPrivacy] = useState<PrivacyPreferences>(initialPrivacy);
  const [shareTenancyStanding, setShareTenancyStanding] = useState(initialShareTenancyStanding);

  const save = useMutation({
    mutationFn: () => preferencesApi.update({ privacy }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.preferences });
      toast.show('Privacy settings saved.', 'success');
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not save those settings.', 'error'),
  });

  const saveTenancyStanding = useMutation({
    mutationFn: (value: boolean) => preferencesApi.update({ shareTenancyStanding: value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.renter.preferences }),
    onError: (e, value) => {
      setShareTenancyStanding(!value); // put the switch back where it was
      toast.show(e instanceof ApiError ? e.message : 'Could not update that.', 'error');
    },
  });

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.lg,
      }}
    >
      <View style={{ gap: spacing.sm }}>
        <Text variant="label" color="mutedForeground" uppercase>
          Profile visibility
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {VISIBILITY.map((v) => {
            const selected = privacy.profileVisibility === v.id;
            const Icon = v.icon;
            return (
              <Pressable
                key={v.id}
                onPress={() => setPrivacy((p) => ({ ...p, profileVisibility: v.id }))}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: spacing.lg,
                  borderRadius: radius.lg,
                  borderWidth: 1.5,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary + '14' : 'transparent',
                }}
              >
                <Icon size={19} color={selected ? colors.primary : colors.mutedForeground} />
                <Text
                  variant="caption"
                  style={{
                    fontWeight: '600',
                    color: selected ? colors.primary : colors.mutedForeground,
                  }}
                >
                  {v.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" color="mutedForeground" uppercase>
          What others can see
        </Text>
        <Card padding="none">
          {TOGGLES.map((t, i) => (
            <View key={t.key}>
              {i > 0 ? <Divider /> : null}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.lg,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{t.title}</Text>
                  <Text variant="caption" color="mutedForeground">
                    {t.description}
                  </Text>
                </View>
                <Switch
                  value={privacy[t.key] === true}
                  onValueChange={(value) => setPrivacy((p) => ({ ...p, [t.key]: value }))}
                  accessibilityLabel={t.title}
                />
              </View>
            </View>
          ))}
        </Card>
      </View>

      <Button
        label="Save privacy settings"
        loading={save.isPending}
        onPress={() => save.mutate()}
      />

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" color="mutedForeground" uppercase>
          Tenancy standing
        </Text>
        <Card padding={spacing.lg}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Share with future landlords</Text>
              <Text variant="caption" color="mutedForeground">
                Lets a new landlord see your payment record, which can strengthen an application.
              </Text>
            </View>
            <Switch
              value={shareTenancyStanding}
              onValueChange={(value) => {
                setShareTenancyStanding(value);
                saveTenancyStanding.mutate(value);
              }}
              accessibilityLabel="Share tenancy standing with future landlords"
            />
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}
