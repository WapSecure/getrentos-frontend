import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ChevronDown, Lock, XCircle } from 'lucide-react-native';
import { Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { landlordApi } from '@/lib/api/landlord';

/**
 * The applicant's record from past tenancies. Fetched only when opened — it
 * is one request per applicant, and most landlords never expand most rows.
 * Respects the applicant's choice: when they have not shared, say so plainly
 * rather than showing empty fields that read as bad news.
 */
export function TenancyStandingPanel({ applicationId }: { applicationId: string }) {
  const { colors, spacing } = useTheme();
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ['landlord', 'applications', applicationId, 'tenancy-standing'],
    queryFn: () => landlordApi.tenancyStanding(applicationId),
    enabled: open,
  });
  const s = query.data;

  return (
    <View style={{ gap: spacing.sm }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
      >
        <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
          Tenancy standing
        </Text>
        <ChevronDown
          size={13}
          color={colors.primary}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {!open ? null : query.isLoading ? (
        <Skeleton height={48} />
      ) : !s?.shared ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Lock size={13} color={colors.mutedForeground} />
          <Text variant="caption" color="mutedForeground">
            Not shared by the applicant.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 4 }}>
          <Text variant="caption" color="mutedForeground">
            Trust score {s.trustScore ?? '—'} · {s.signedLeaseCount ?? 0} signed lease
            {s.signedLeaseCount === 1 ? '' : 's'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            <Check label="Identity" ok={s.identityVerified} />
            <Check label="Email" ok={s.emailVerified} />
            <Check label="Phone" ok={s.phoneVerified} />
          </View>
        </View>
      )}
    </View>
  );
}

function Check({ label, ok }: { label: string; ok?: boolean }) {
  const { colors } = useTheme();
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon size={13} color={ok ? colors.success : colors.mutedForeground} />
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
    </View>
  );
}
