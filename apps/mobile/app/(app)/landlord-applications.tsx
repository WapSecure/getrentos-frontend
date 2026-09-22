import { useState } from 'react';
import { Alert, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Briefcase, Check, ChevronLeft, FileText, ShieldCheck, X } from 'lucide-react-native';
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  landlordApi,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  type ApplicationStatus,
  type LandlordApplication,
} from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';

/** Statuses that still await the landlord's decision. */
const OPEN_STATUSES: ApplicationStatus[] = ['pending', 'under_review'];

export default function LandlordApplications() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: qk.landlord.applications(),
    queryFn: () => landlordApi.applications(),
  });

  const decide = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      landlordApi.setApplicationStatus(id, status),
    onMutate: ({ id }) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: (_d, { status }) => {
      qc.invalidateQueries({ queryKey: ['landlord', 'applications'] });
      qc.invalidateQueries({ queryKey: qk.landlord.dashboardStats });
      toast.show(
        status === 'approved' ? 'Application approved.' : 'Application rejected.',
        'success'
      );
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not update that application.', 'error'),
  });

  const confirm = (a: LandlordApplication, status: ApplicationStatus) =>
    Alert.alert(
      status === 'approved' ? 'Approve application?' : 'Reject application?',
      status === 'approved'
        ? `${a.applicantName} will be able to sign a lease for ${a.propertyName}.`
        : `${a.applicantName} will be told their application was not successful.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: status === 'approved' ? 'Approve' : 'Reject',
          style: status === 'approved' ? 'default' : 'destructive',
          onPress: () => decide.mutate({ id: a.id, status }),
        },
      ]
    );

  const items = query.data?.items ?? [];
  const open = items.filter((a) => OPEN_STATUSES.includes(a.status)).length;

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
        <View style={{ flex: 1 }}>
          <Text variant="title">Applications</Text>
          {query.data ? (
            <Text variant="caption" color="mutedForeground">
              {open > 0 ? `${open} awaiting your decision` : 'Nothing awaiting a decision'}
            </Text>
          ) : null}
        </View>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={150} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(a) => a.id}
          renderItem={({ item }: { item: LandlordApplication }) => (
            <ApplicationCard
              application={item}
              busy={busyId === item.id}
              onApprove={() => confirm(item, 'approved')}
              onReject={() => confirm(item, 'rejected')}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<FileText size={32} color={colors.mutedForeground} />}
              title="No applications"
              description="Applications for your listings show up here with the applicant's income and trust score."
            />
          }
        />
      )}
    </View>
  );
}

function ApplicationCard({
  application: a,
  busy,
  onApprove,
  onReject,
}: {
  application: LandlordApplication;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const decidable = OPEN_STATUSES.includes(a.status);

  return (
    <Card padding={spacing.lg} style={{ marginBottom: spacing.sm }}>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Avatar name={a.applicantName} size={44} />
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
                {a.applicantName}
              </Text>
              {a.verificationStatus === 'verified' ? (
                <ShieldCheck size={13} color={colors.success} />
              ) : null}
              <View style={{ flex: 1 }} />
              <Badge
                label={APPLICATION_STATUS_LABEL[a.status]}
                tone={APPLICATION_STATUS_TONE[a.status]}
              />
            </View>
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {a.propertyName}
              {a.unitName ? ` · ${a.unitName}` : ''}
            </Text>
            <Text variant="caption" color="mutedForeground">
              Applied {formatDate(a.applicationDate, 'short')}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
            padding: spacing.md,
            borderRadius: radius.md,
            backgroundColor: colors.secondary,
          }}
        >
          <Detail label="Income">
            <Price amount={a.monthlyIncome} period="month" variant="caption" compact />
          </Detail>
          <Detail label="Employment">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Briefcase size={11} color={colors.mutedForeground} />
              <Text variant="caption">{a.employmentStatus}</Text>
            </View>
          </Detail>
          <Detail label="Trust">
            <Text variant="caption">{a.trustScore}</Text>
          </Detail>
        </View>

        {decidable ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable
              onPress={onReject}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`Reject ${a.applicantName}`}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: spacing.md,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: busy ? 0.5 : 1,
              }}
            >
              <X size={15} color={colors.destructive} />
              <Text variant="caption" color="destructive" style={{ fontWeight: '600' }}>
                Reject
              </Text>
            </Pressable>

            <Pressable
              onPress={onApprove}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`Approve ${a.applicantName}`}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: spacing.md,
                borderRadius: radius.md,
                backgroundColor: colors.primary,
                opacity: busy ? 0.5 : 1,
              }}
            >
              <Check size={15} color={colors.primaryForeground} />
              <Text
                variant="caption"
                style={{ color: colors.primaryForeground, fontWeight: '600' }}
              >
                Approve
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text variant="caption" color="mutedForeground" style={{ fontSize: 10 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}
