import { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
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
  preferencesApi,
  DEFAULT_WHATSAPP_TOPICS,
  WHATSAPP_TOPIC_LABEL,
  type WhatsAppPreferences,
} from '@/lib/api/preferences';
import { ApiError } from '@/lib/api/client';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

export default function WhatsAppSettings() {
  const { colors, spacing, radius } = useTheme();
  const query = useQuery({ queryKey: qk.renter.preferences, queryFn: preferencesApi.get });
  const saved = query.data?.whatsapp;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Communication"
        title="WhatsApp"
        subtitle="Manage important updates outside the app"
        onBack={() => router.back()}
        accessory={saved?.connected ? <Badge label="Connected" tone="success" /> : null}
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
        <WhatsAppForm
          initial={{
            connected: saved?.connected === true,
            phone: saved?.phone ?? '',
            preferences: { ...DEFAULT_WHATSAPP_TOPICS, ...(saved?.preferences ?? {}) },
          }}
        />
      )}
    </View>
  );
}

function WhatsAppForm({ initial }: { initial: WhatsAppPreferences }) {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const [state, setState] = useState<WhatsAppPreferences>(initial);

  const save = useMutation({
    mutationFn: (next: WhatsAppPreferences) => preferencesApi.update({ whatsapp: next }),
    onSuccess: (_data, next) => {
      qc.invalidateQueries({ queryKey: qk.renter.preferences });
      toast.show(next.connected ? 'WhatsApp updates on.' : 'WhatsApp updates off.', 'success');
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not save those settings.', 'error'),
  });

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.lg,
      }}
    >
      <Card padding={spacing.lg}>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.success + '1f',
            }}
          >
            <MessageCircle size={19} color={colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Get updates on WhatsApp</Text>
            <Text variant="caption" color="mutedForeground">
              Rent reminders and landlord messages reach you without opening the app — useful when
              data is tight.
            </Text>
          </View>
        </View>
      </Card>

      <TextField
        label="WhatsApp number"
        placeholder="+234 801 234 5678"
        keyboardType="phone-pad"
        value={state.phone}
        onChangeText={(phone) => setState((s) => ({ ...s, phone }))}
      />

      <View style={{ gap: spacing.sm }}>
        <Text variant="label" color="mutedForeground" uppercase>
          Send me
        </Text>
        <Card padding="none">
          {WHATSAPP_TOPIC_LABEL.map((topic, i) => (
            <View key={topic.id}>
              {i > 0 ? <Divider /> : null}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.lg,
                }}
              >
                <Text variant="callout" style={{ flex: 1 }}>
                  {topic.label}
                </Text>
                <Switch
                  value={state.preferences[topic.id] === true}
                  onValueChange={(value) =>
                    setState((s) => ({
                      ...s,
                      preferences: { ...s.preferences, [topic.id]: value },
                    }))
                  }
                  accessibilityLabel={topic.label}
                />
              </View>
            </View>
          ))}
        </Card>
      </View>

      <Button
        label={state.connected ? 'Save changes' : 'Turn on WhatsApp updates'}
        loading={save.isPending}
        disabled={!state.phone.trim()}
        onPress={() => save.mutate({ ...state, connected: true })}
      />

      {state.connected ? (
        <Button
          label="Turn off WhatsApp updates"
          variant="ghost"
          loading={save.isPending}
          onPress={() => save.mutate({ ...state, connected: false })}
        />
      ) : null}
    </ScrollView>
  );
}
