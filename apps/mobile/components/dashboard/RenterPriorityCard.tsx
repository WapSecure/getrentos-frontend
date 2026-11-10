import { View } from 'react-native';
import { router } from 'expo-router';
import {
  AlertCircle,
  CalendarClock,
  FileCheck2,
  Repeat,
  Upload,
  Wallet,
  type SgIcon,
} from '@sureground/icons/native';
import { Button, Card, Text, useTheme } from '@sureground/ui-native';
import { formatDate, formatNaira } from '@/lib/format';
import type { Payment, PaymentsSummary } from '@/lib/api/payments';
import type { RenterApplication } from '@/lib/api/applications';
import type { RenewalOffer } from '@/lib/api/lease';

export interface RenterPriorityInput {
  summary?: PaymentsSummary;
  payments: Payment[];
  renewalOffer?: RenewalOffer | null;
  applications: RenterApplication[];
  upcomingViewings: number;
}

export interface RenterPriority {
  key: string;
  tone: 'urgent' | 'normal';
  Icon: SgIcon;
  eyebrow: string;
  title: string;
  detail: string;
  action: string;
  href: string;
}

/** The single most useful next step for a renter, most urgent first. */
export function pickRenterPriority(i: RenterPriorityInput): RenterPriority | null {
  const s = i.summary;
  if (s && s.openCount > 0 && s.amountOwedNaira > 0) {
    const overdue = s.overdueCount > 0;
    return {
      key: 'pay',
      tone: overdue ? 'urgent' : 'normal',
      Icon: Wallet,
      eyebrow: overdue ? 'Overdue' : 'Rent due',
      title: `${formatNaira(s.amountOwedNaira)} to pay`,
      detail: s.nextDueDate
        ? `${overdue ? 'Was due' : 'Due'} ${formatDate(s.nextDueDate, 'short')}`
        : 'Pay through Sureground so your money is protected.',
      action: 'Pay now',
      href: '/(app)/payments',
    };
  }

  const stalled = i.payments.find((p) => p.status === 'processing' && !p.resumeCheckout);
  if (stalled) {
    return {
      key: 'stalled',
      tone: 'normal',
      Icon: AlertCircle,
      eyebrow: 'Payment',
      title: "A payment didn't finish",
      detail: `${formatNaira(stalled.amount)} for ${stalled.description.replace(/^Rent\s*[—-]\s*/, '')}. We check the first attempt before you pay again.`,
      action: 'Check payment',
      href: '/(app)/payments',
    };
  }

  if (i.renewalOffer?.status === 'pending') {
    return {
      key: 'renewal',
      tone: 'normal',
      Icon: Repeat,
      eyebrow: 'Lease renewal',
      title: 'Your landlord offered a renewal',
      detail: `${formatNaira(i.renewalOffer.newRentAmount)} a year, ending ${formatDate(i.renewalOffer.newEndDate, 'short')}.`,
      action: 'Review offer',
      href: '/(app)/lease',
    };
  }

  const open = i.applications.filter((a) => a.status === 'pending' || a.status === 'under_review');
  const needsDocs = open
    .map((a) => ({
      a,
      missing: (a.documents ?? []).filter((d) => d.required && !d.uploaded).length,
    }))
    .find((x) => x.missing > 0);
  if (needsDocs) {
    return {
      key: 'docs',
      tone: 'normal',
      Icon: Upload,
      eyebrow: 'Application',
      title: `${needsDocs.missing === 1 ? '1 document' : `${needsDocs.missing} documents`} still needed`,
      detail: `For ${needsDocs.a.title}. The landlord can't decide until they're in.`,
      action: 'Upload',
      href: `/(app)/application/${needsDocs.a.id}`,
    };
  }

  if (i.upcomingViewings > 0) {
    return {
      key: 'viewing',
      tone: 'normal',
      Icon: CalendarClock,
      eyebrow: 'Viewing',
      title:
        i.upcomingViewings === 1
          ? 'You have a viewing coming up'
          : `You have ${i.upcomingViewings} viewings coming up`,
      detail: 'See the time and address, or reschedule.',
      action: 'See viewings',
      href: '/(app)/viewings',
    };
  }

  const first = open[0];
  if (first) {
    return {
      key: 'application',
      tone: 'normal',
      Icon: FileCheck2,
      eyebrow: 'Application',
      title: first.title,
      detail:
        first.status === 'under_review'
          ? 'The landlord is reviewing it.'
          : 'Sent. Waiting for the landlord to review.',
      action: 'Open',
      href: `/(app)/application/${first.id}`,
    };
  }
  return null;
}

export function RenterPriorityCard({ priority }: { priority: RenterPriority }) {
  const { colors, spacing, radius } = useTheme();
  const accent = priority.tone === 'urgent' ? colors.destructive : colors.primary;
  const { Icon } = priority;
  const go = () => router.push(priority.href as never);

  // One action button, not a pressable card around it: a button inside a button breaks web and screen readers.
  return (
    <Card elevated>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: accent + '1f',
          }}
        >
          <Icon size={20} color={accent} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text variant="caption" style={{ color: accent, fontWeight: '700', letterSpacing: 0.6 }}>
            {priority.eyebrow.toUpperCase()}
          </Text>
          <Text variant="bodyStrong" numberOfLines={2}>
            {priority.title}
          </Text>
          <Text variant="caption" color="mutedForeground" numberOfLines={3}>
            {priority.detail}
          </Text>
        </View>
      </View>
      <View style={{ marginTop: spacing.md }}>
        <Button
          label={priority.action}
          size="sm"
          variant={priority.tone === 'urgent' ? 'primary' : 'secondary'}
          onPress={go}
          accessibilityLabel={`${priority.action}: ${priority.title}`}
        />
      </View>
    </Card>
  );
}
