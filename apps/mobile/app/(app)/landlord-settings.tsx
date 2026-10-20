import { useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banknote, Camera } from 'lucide-react-native';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  ErrorState,
  Skeleton,
  SwitchRow,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  landlordApi,
  AUTOMATION_DESCRIPTION,
  AUTOMATION_LABEL,
  NOTIFICATION_CATEGORY_LABEL,
  type AutomationSettings,
  type LandlordNotificationPreference,
  type LandlordProfile,
} from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { pickImage } from '@/lib/filePicker';
import { Image } from 'expo-image';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { categorySendsEmail } from '@getrentos/shared';
import { goBack } from '@/lib/goBack';

export default function LandlordSettings() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const profile = useQuery({ queryKey: qk.landlord.profile, queryFn: landlordApi.profile });
  const payout = useQuery({ queryKey: qk.landlord.payout, queryFn: landlordApi.payoutAccount });
  const automation = useQuery({
    queryKey: qk.landlord.automation,
    queryFn: landlordApi.automation,
  });
  const prefs = useQuery({
    queryKey: qk.landlord.notificationPreferences,
    queryFn: landlordApi.notificationPreferences,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Landlord workspace"
        title="Settings"
        subtitle="Profile, payout and portfolio automation"
        onBack={() => goBack()}
      />

      {profile.isError && !profile.data ? (
        <ErrorState onRetry={() => profile.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
            gap: spacing.lg,
          }}
        >
          <Section title="Profile">
            {profile.isLoading ? (
              <Skeleton height={130} radius={radius.lg} />
            ) : profile.data ? (
              <ProfileForm initial={profile.data} />
            ) : null}
          </Section>

          <Section title="Payout account">
            {payout.isLoading ? (
              <Skeleton height={96} radius={radius.lg} />
            ) : payout.data ? (
              <Card padding={spacing.lg}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: radius.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.secondary,
                    }}
                  >
                    <Banknote size={17} color={colors.foreground} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <Text variant="bodyStrong">{payout.data.bankName || 'No bank set'}</Text>
                      {payout.data.verified ? (
                        <Badge label="Verified" tone="success" />
                      ) : (
                        <Badge label="Unverified" tone="warning" />
                      )}
                    </View>
                    <Text variant="caption" color="mutedForeground">
                      {payout.data.accountNumber || 'Add an account to receive payouts'}
                      {payout.data.accountName ? ` · ${payout.data.accountName}` : ''}
                    </Text>
                  </View>
                </View>
              </Card>
            ) : null}
          </Section>

          <Section title="Automation">
            {automation.isLoading ? (
              <Skeleton height={190} radius={radius.lg} />
            ) : automation.data ? (
              <AutomationCard initial={automation.data} />
            ) : null}
          </Section>

          <Section title="Notifications">
            {prefs.isLoading ? (
              <Skeleton height={190} radius={radius.lg} />
            ) : prefs.data ? (
              <PreferencesCard initial={prefs.data} />
            ) : null}
          </Section>
        </ScrollView>
      )}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="label" color="mutedForeground" uppercase>
        {title}
      </Text>
      {children}
    </View>
  );
}

function ProfileForm({ initial }: { initial: LandlordProfile }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const uploadAvatar = useMutation({
    mutationFn: async () => {
      const file = await pickImage();
      if (!file) return null;
      return landlordApi.uploadAvatar(file);
    },
    onSuccess: (result) => {
      if (!result) return; // the picker was dismissed
      qc.invalidateQueries({ queryKey: qk.landlord.profile });
      toast.show('Photo updated.', 'success');
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not upload that photo.', 'error'),
  });

  const [fullName, setFullName] = useState(initial.fullName);
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [companyName, setCompanyName] = useState(initial.companyName ?? '');

  const save = useMutation({
    mutationFn: () =>
      landlordApi.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        companyName: companyName.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.landlord.profile });
      toast.show('Profile saved.', 'success');
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not save your profile.', 'error'),
  });

  return (
    <View style={{ gap: spacing.md }}>
      <Pressable
        onPress={() => uploadAvatar.mutate()}
        disabled={uploadAvatar.isPending}
        accessibilityRole="button"
        accessibilityLabel="Change your photo"
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            overflow: 'hidden',
            backgroundColor: colors.secondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {initial.avatarUrl ? (
            <Image
              source={{ uri: initial.avatarUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={initial.avatarUrl}
              accessible={false}
            />
          ) : (
            <Avatar name={initial.fullName} size={64} />
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Camera size={15} color={colors.primary} />
          <Text variant="callout" color="primary" style={{ fontWeight: '600' }}>
            {uploadAvatar.isPending ? 'Uploading…' : 'Change photo'}
          </Text>
        </View>
      </Pressable>

      <TextField label="Full name" required value={fullName} onChangeText={setFullName} />
      <TextField
        label="Phone"
        placeholder="+234 801 234 5678"
        keyboardType="phone-pad"
        value={phone}
        // Digits only, with an optional leading +.
        onChangeText={(v) => setPhone(v.replace(/(?!^\+)\D/g, ''))}
      />
      <TextField
        label="Company"
        optional
        placeholder="e.g. Adeyemi Properties"
        value={companyName}
        onChangeText={setCompanyName}
      />
      <Button
        label="Save profile"
        loading={save.isPending}
        disabled={!fullName.trim()}
        onPress={() => save.mutate()}
      />
    </View>
  );
}

function AutomationCard({ initial }: { initial: AutomationSettings }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [state, setState] = useState(initial);

  const save = useMutation({
    // Carry the pre-change state so a failure can put the switch back exactly
    // where it was, rather than guessing at what to undo.
    mutationFn: ({ next }: { next: AutomationSettings; previous: AutomationSettings }) =>
      landlordApi.updateAutomation(next),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.landlord.automation }),
    onError: (e, { previous }) => {
      setState(previous);
      toast.show(e instanceof ApiError ? e.message : 'Could not save that setting.', 'error');
    },
  });

  // Automatic invoice generation is not live yet, so it must not be offered
  // as a setting that appears to save but has no operational effect.
  const keys: (keyof AutomationSettings)[] = ['rentReminders', 'overdueAlerts', 'leaseExpiry'];

  return (
    <Card padding="none">
      {keys.map((k, i) => (
        <View key={k}>
          {i > 0 ? <Divider /> : null}
          <SwitchRow
            label={AUTOMATION_LABEL[k]}
            description={AUTOMATION_DESCRIPTION[k]}
            value={state[k]}
            onValueChange={(v) => {
              const previous = state;
              const next = { ...state, [k]: v };
              setState(next);
              save.mutate({ next, previous });
            }}
            style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}
          />
        </View>
      ))}
    </Card>
  );
}

function PreferencesCard({ initial }: { initial: LandlordNotificationPreference[] }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [prefs, setPrefs] = useState(initial);

  const save = useMutation({
    // Carries the pre-change list so a failure undoes only this toggle.
    mutationFn: ({ next }: { next: LandlordNotificationPreference[]; previous: typeof prefs }) =>
      landlordApi.updateNotificationPreferences(next),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.landlord.notificationPreferences }),
    onError: (e, { previous }) => {
      setPrefs(previous);
      toast.show(e instanceof ApiError ? e.message : 'Could not save that preference.', 'error');
    },
  });

  const set = (id: string, channel: 'email' | 'push', value: boolean) => {
    const next = prefs.map((p) => (p.id === id ? { ...p, [channel]: value } : p));
    setPrefs(next);
    save.mutate({ next, previous: prefs });
  };

  return (
    <Card padding="none">
      {prefs.map((p, i) => (
        <View key={p.id}>
          {i > 0 ? <Divider /> : null}
          <View style={{ padding: spacing.lg, gap: spacing.sm }}>
            <Text variant="bodyStrong">{NOTIFICATION_CATEGORY_LABEL[p.id] ?? p.id}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.xl }}>
              {categorySendsEmail(p.id) ? (
                <Channel
                  label="Email"
                  value={p.email}
                  onChange={(v) => set(p.id, 'email', v)}
                  category={NOTIFICATION_CATEGORY_LABEL[p.id] ?? p.id}
                />
              ) : null}
              <Channel
                label="Push"
                value={p.push}
                onChange={(v) => set(p.id, 'push', v)}
                category={NOTIFICATION_CATEGORY_LABEL[p.id] ?? p.id}
              />
            </View>
          </View>
        </View>
      ))}
    </Card>
  );
}

function Channel({
  label,
  value,
  onChange,
  category,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  category: string;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
      {/* Two channels share a row, so this stays a bare switch with a full spoken label. */}
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={`${category} ${label}`}
        trackColor={{ true: colors.primary, false: colors.border }}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}
