import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Check,
  MapPin,
  Phone,
  Mail,
  CalendarClock,
  FileCheck2,
} from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  applicationsApi,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
} from '@/lib/api/applications';
import { ApiError } from '@/lib/api/client';
import { track } from '@/lib/analytics';

export default function ApplicationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [withdrawing, setWithdrawing] = useState(false);

  const query = useQuery({
    queryKey: qk.renter.applications,
    queryFn: () => applicationsApi.list(1, 50),
  });
  const app = query.data?.items.find((a) => a.id === id);

  const withdrawMutation = useMutation({
    mutationFn: () => applicationsApi.withdraw(id),
    onMutate: () => setWithdrawing(true),
    onSuccess: () => {
      track('application_withdrawn', { id });
      qc.invalidateQueries({ queryKey: qk.renter.applications });
      qc.invalidateQueries({ queryKey: qk.renter.dashboardStats });
      toast.show('Application withdrawn.', 'success');
    },
    onError: (err) => {
      toast.show(err instanceof ApiError ? err.message : 'Could not withdraw. Try again.', 'error');
    },
    onSettled: () => setWithdrawing(false),
  });

  const confirmWithdraw = () => {
    Alert.alert('Withdraw application?', 'The landlord will no longer be able to review it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Withdraw', style: 'destructive', onPress: () => withdrawMutation.mutate() },
    ]);
  };

  const canWithdraw = app && (app.status === 'pending' || app.status === 'under_review');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + (canWithdraw ? 100 : 40) }}
      >
        <View style={{ height: 160, backgroundColor: colors.secondary }}>
          {app?.image ? (
            <Image source={{ uri: app.image }} contentFit="cover" style={StyleSheet.absoluteFill} />
          ) : null}
        </View>

        <View style={{ padding: spacing.xl, gap: spacing.lg }}>
          {query.isError ? (
            <ErrorState onRetry={() => query.refetch()} />
          ) : !query.data ? (
            <View style={{ gap: spacing.md }}>
              <Skeleton height={24} width="60%" />
              <Skeleton height={80} />
            </View>
          ) : !app ? (
            <Text variant="body" color="mutedForeground">
              This application could not be found.
            </Text>
          ) : (
            <>
              <View style={{ gap: 6 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Price amount={app.price} period={app.period} variant="title" />
                  <Badge
                    label={APPLICATION_STATUS_LABEL[app.status]}
                    tone={APPLICATION_STATUS_TONE[app.status]}
                  />
                </View>
                <Text variant="heading">{app.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MapPin size={13} color={colors.mutedForeground} />
                  <Text variant="callout" color="mutedForeground">
                    {app.address}
                  </Text>
                </View>
              </View>

              <Card elevated padding="none">
                <View style={{ padding: spacing.lg, gap: spacing.md }}>
                  {app.timeline.map((step, i) => (
                    <View key={step.stage} style={{ flexDirection: 'row', gap: spacing.md }}>
                      <View style={{ alignItems: 'center', width: 22 }}>
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 1.5,
                            borderColor: step.completed ? colors.primary : colors.border,
                            backgroundColor: step.completed ? colors.primary : 'transparent',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {step.completed ? (
                            <Check size={11} color={colors.primaryForeground} strokeWidth={3} />
                          ) : null}
                        </View>
                        {i < app.timeline.length - 1 ? (
                          <View
                            style={{
                              flex: 1,
                              width: 2,
                              backgroundColor: colors.border,
                              marginVertical: 2,
                            }}
                          />
                        ) : null}
                      </View>
                      <View
                        style={{
                          flex: 1,
                          paddingBottom: i < app.timeline.length - 1 ? spacing.md : 0,
                        }}
                      >
                        <Text
                          variant="bodyStrong"
                          style={{
                            color: step.completed ? colors.foreground : colors.mutedForeground,
                          }}
                        >
                          {step.stage}
                        </Text>
                        <Text variant="caption" color="mutedForeground">
                          {step.date}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </Card>

              <View style={{ flexDirection: 'row', gap: spacing.xl }}>
                {app.moveInDate ? (
                  <Detail
                    icon={<CalendarClock size={15} color={colors.foreground} />}
                    label="Move-in"
                    value={app.moveInDate}
                  />
                ) : null}
                {app.leaseTerm ? (
                  <Detail
                    icon={<FileCheck2 size={15} color={colors.foreground} />}
                    label="Lease term"
                    value={app.leaseTerm}
                  />
                ) : null}
              </View>

              {app.documents?.length ? (
                <View style={{ gap: spacing.sm }}>
                  <Text variant="bodyStrong">Documents</Text>
                  {app.documents.map((doc) => (
                    <View
                      key={doc.name}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: spacing.md,
                        borderRadius: radius.md,
                        backgroundColor: colors.secondary,
                      }}
                    >
                      <Text variant="callout">{doc.name}</Text>
                      <Text
                        variant="caption"
                        style={{
                          color: doc.uploaded ? colors.success : colors.mutedForeground,
                          fontWeight: '600',
                        }}
                      >
                        {doc.uploaded ? 'Ready' : doc.required ? 'Required' : 'Optional'}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {app.applicationNotes ? (
                <View style={{ gap: spacing.sm }}>
                  <Text variant="bodyStrong">Your note to the landlord</Text>
                  <Text variant="body" color="mutedForeground">
                    {app.applicationNotes}
                  </Text>
                </View>
              ) : null}

              <View style={{ gap: spacing.sm }}>
                <Text variant="bodyStrong">Landlord</Text>
                <Text variant="body">{app.landlord.name}</Text>
                {app.landlord.phone ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Phone size={13} color={colors.mutedForeground} />
                    <Text variant="callout" color="mutedForeground">
                      {app.landlord.phone}
                    </Text>
                  </View>
                ) : null}
                {app.landlord.email ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Mail size={13} color={colors.mutedForeground} />
                    <Text variant="callout" color="mutedForeground">
                      {app.landlord.email}
                    </Text>
                  </View>
                ) : null}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={[styles.back, { top: insets.top + 8 }]}
      >
        <ChevronLeft size={22} color="#fff" />
      </Pressable>

      {canWithdraw ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.md,
            backgroundColor: colors.background,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
          }}
        >
          <Button
            label="Withdraw application"
            variant="outline"
            loading={withdrawing}
            onPress={confirmWithdraw}
          />
        </View>
      ) : null}
    </View>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {icon}
      <View>
        <Text variant="caption" color="mutedForeground">
          {label}
        </Text>
        <Text variant="callout" style={{ fontWeight: '600' }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    position: 'absolute',
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(9,32,66,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
