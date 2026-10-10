import { Linking, View } from 'react-native';
import { BadgeCheck, Home, Mail, MessageCircle, Phone } from 'lucide-react-native';
import { Card, IconButton, Price, Text, useTheme } from '@getrentos/ui-native';
import { StatusPill } from '@/components/host/HostUI';
import {
  LEAD_MARKET,
  isLeadClosed,
  leadStageLabel,
  type EstateLead,
} from '@/lib/api/estateMarketplace';
import { whatsappLink } from '@/lib/api/realtor';
import { formatDate } from '@/lib/format';

/** One enquiry: who, about which property, how far it has got, and how to reach them. */
export function LeadCard({ lead: l }: { lead: EstateLead }) {
  const { colors, spacing } = useTheme();
  const market = LEAD_MARKET[l.market] ?? { label: l.market, tone: 'neutral' as const };
  const stage = leadStageLabel(l.stage);
  const wa = whatsappLink(l.phone);
  const closed = isLeadClosed(l.stage);
  return (
    <Card elevated style={{ gap: spacing.sm, opacity: closed ? 0.75 : 1 }}>
      <View
        accessible
        accessibilityLabel={`${l.leadName}${l.verified ? ', verified' : ''}. ${market.label}, ${l.propertyName}. ${stage}${l.offerAmount != null ? `, offer ${Math.round(l.offerAmount).toLocaleString('en-NG')} naira` : ''}. ${formatDate(l.inquiryDate, 'short')}`}
        style={{ gap: spacing.xs }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
              {l.leadName}
            </Text>
            {l.verified ? <BadgeCheck size={15} color={colors.success} /> : null}
          </View>
          <StatusPill label={market.label} tone={market.tone} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Home size={13} color={colors.mutedForeground} />
          <Text variant="caption" color="mutedForeground" numberOfLines={1} style={{ flex: 1 }}>
            {l.propertyName}
            {l.ownerName ? ` · owner ${l.ownerName}` : ''}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="callout" style={{ flex: 1, fontWeight: '600' }}>
            {stage}
          </Text>
          {l.offerAmount != null ? <Price amount={l.offerAmount} variant="callout" /> : null}
        </View>
        <Text variant="caption" color="mutedForeground">
          {formatDate(l.inquiryDate, 'short')}
          {l.verified ? ' · verified' : ' · not verified'} · trust score {l.trustScore}
          {l.listedByEstate ? '' : ' · listed by the owner'}
        </Text>
      </View>
      {l.phone || l.email ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {l.phone ? (
            <IconButton
              accessibilityLabel={`Call ${l.leadName}`}
              icon={<Phone size={18} color={colors.primary} />}
              onPress={() => Linking.openURL(`tel:${l.phone}`)}
            />
          ) : null}
          {wa ? (
            <IconButton
              accessibilityLabel={`Message ${l.leadName} on WhatsApp`}
              icon={<MessageCircle size={18} color={colors.primary} />}
              onPress={() => Linking.openURL(wa)}
            />
          ) : null}
          {l.email ? (
            <IconButton
              accessibilityLabel={`Email ${l.leadName}`}
              icon={<Mail size={18} color={colors.primary} />}
              onPress={() => Linking.openURL(`mailto:${l.email}`)}
            />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
