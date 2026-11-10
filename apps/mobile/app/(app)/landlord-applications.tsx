import { useState } from 'react';
import { Alert, RefreshControl, View } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Briefcase, Check, FileText, ShieldCheck, X } from '@sureground/icons/native';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Price,
  QueryState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  landlordApi,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_TONE,
  type ApplicationStatus,
  type LandlordApplication,
} from '@/lib/api/landlord';
import { errorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { TenancyStandingPanel } from '@/components/landlord/TenancyStandingPanel';
import { ApplicantSummaryPanel } from '@/components/landlord/ApplicantSummaryPanel';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';

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
  const awaiting = useQuery({
    queryKey: [...qk.landlord.applications(), 'awaiting-count'],
    queryFn: landlordApi.awaitingApplicationCount,
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
    onError: (e) => toast.show(errorMessage(e, 'Could not update that application.'), 'error'),
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
  // From the server, so applications beyond the first page still count.
  const open = awaiting.data ?? items.filter((a) => OPEN_STATUSES.includes(a.status)).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <DetailHeader
          eyebrow="Leasing"
          title="Applications"
          subtitle={
            query.data
              ? open > 0
                ? `${open} awaiting your decision`
                : 'Nothing awaiting a decision'
              : 'Review prospective tenants'
          }
          onBack={() => goBack()}
        />
      </View>

      <QueryState
        query={query}
        skeleton={
          <View style={{ gap: spacing.sm }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={150} radius={radius.lg} />
            ))}
          </View>
        }
        style={{ paddingHorizontal: spacing.xl }}
      >
        <FlashList
          data={items}
          keyExtractor={(a) => a.id}
          renderItem={({ item }: { item: LandlordApplication }) => (
            <ApplicationCard
              application={item}
              deciding={busyId === item.id ? (decide.variables?.status ?? null) : null}
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
              onRefresh={() => void query.refetch()}
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
      </QueryState>
    </View>
  );
}

function ApplicationCard({
  application: a,
  deciding,
  onApprove,
  onReject,
}: {
  application: LandlordApplication;
  deciding: ApplicationStatus | null;
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
            gap: spacing.sm,
            padding: spacing.md,
            borderRadius: radius.md,
            backgroundColor: colors.secondary,
          }}
        >
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Detail label="Income">
              <Price amount={a.monthlyIncome} period="month" variant="caption" compact />
            </Detail>
            <Detail label="Trust">
              {/* 0 only means no rental history yet; a bare 0 reads as a red flag. */}
              <Text variant="caption">{a.trustScore > 0 ? a.trustScore : 'New to Sureground'}</Text>
            </Detail>
          </View>
          {/* Full width: in a third of the card, "Self-employed — Consultant" broke over three lines. */}
          <Detail label="Employment">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Briefcase size={12} color={colors.mutedForeground} />
              <Text variant="caption" style={{ flex: 1 }}>
                {employmentLabel(a.employmentStatus)}
              </Text>
            </View>
          </Detail>
        </View>

        <TenancyStandingPanel applicationId={a.id} />
        <ApplicantSummaryPanel applicationId={a.id} />

        {decidable ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Reject"
              variant="outline"
              size="sm"
              fullWidth={false}
              onPress={onReject}
              disabled={deciding !== null}
              loading={deciding === 'rejected'}
              accessibilityLabel={`Reject ${a.applicantName}`}
              icon={<X size={15} color={colors.destructive} />}
              style={{ flex: 1 }}
            />
            <Button
              label="Approve"
              size="sm"
              fullWidth={false}
              onPress={onApprove}
              disabled={deciding !== null}
              loading={deciding === 'approved'}
              accessibilityLabel={`Approve ${a.applicantName}`}
              icon={<Check size={15} color={colors.primaryForeground} />}
              style={{ flex: 1 }}
            />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
      {children}
    </View>
  );
}

// Known status words only, so an employer written in capitals ("IBM contractor") stays as written.
const EMPLOYMENT_ENUM =
  /^(EMPLOYED|SELF_EMPLOYED|UNEMPLOYED|FULL_TIME|PART_TIME|CONTRACT|STUDENT|RETIRED)\b/;

/** The status part sometimes arrives as a raw enum ("EMPLOYED — Zenith Bank"); show it in sentence case. */
function employmentLabel(value: string): string {
  return value.replace(EMPLOYMENT_ENUM, (word) => {
    const spaced = word.replace(/_/g, ' ').toLowerCase();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  });
}
