import { useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banknote, ChevronLeft } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Divider,
  ErrorState,
  Skeleton,
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
          Settings
        </Text>
      </View>

      {profile.isError ? (
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
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

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
      <TextField label="Full name" value={fullName} onChangeText={setFullName} />
      <TextField
        label="Phone"
        placeholder="+234 801 234 5678"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <TextField
        label="Company (optional)"
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

  const keys = Object.keys(AUTOMATION_LABEL) as (keyof AutomationSettings)[];

  return (
    <Card padding="none">
      {keys.map((k, i) => (
        <View key={k}>
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
              <Text variant="bodyStrong">{AUTOMATION_LABEL[k]}</Text>
              <Text variant="caption" color="mutedForeground">
                {AUTOMATION_DESCRIPTION[k]}
              </Text>
            </View>
            <Switch
              value={state[k]}
              onValueChange={(v) => {
                const previous = state;
                const next = { ...state, [k]: v };
                setState(next);
                save.mutate({ next, previous });
              }}
              accessibilityLabel={AUTOMATION_LABEL[k]}
            />
          </View>
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
    mutationFn: (next: LandlordNotificationPreference[]) =>
      landlordApi.updateNotificationPreferences(next),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.landlord.notificationPreferences }),
    onError: (e) => {
      setPrefs(initial);
      toast.show(e instanceof ApiError ? e.message : 'Could not save that preference.', 'error');
    },
  });

  const set = (id: string, channel: 'email' | 'push', value: boolean) => {
    const next = prefs.map((p) => (p.id === id ? { ...p, [channel]: value } : p));
    setPrefs(next);
    save.mutate(next);
  };

  return (
    <Card padding="none">
      {prefs.map((p, i) => (
        <View key={p.id}>
          {i > 0 ? <Divider /> : null}
          <View style={{ padding: spacing.lg, gap: spacing.sm }}>
            <Text variant="bodyStrong">{NOTIFICATION_CATEGORY_LABEL[p.id] ?? p.id}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.xl }}>
              <Channel
                label="Email"
                value={p.email}
                onChange={(v) => set(p.id, 'email', v)}
                category={NOTIFICATION_CATEGORY_LABEL[p.id] ?? p.id}
              />
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
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={`${category} ${label}`} />
    </View>
  );
}
