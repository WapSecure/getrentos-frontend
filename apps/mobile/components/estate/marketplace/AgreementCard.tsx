import { View } from 'react-native';
import { Unlink } from 'lucide-react-native';
import { Card, IconButton, Text, useTheme } from '@getrentos/ui-native';
import { StatusPill } from '@/components/host/HostUI';
import { AGREEMENT_STATUS, type MarketingAgreement } from '@/lib/api/estateMarketplace';
import { formatDate } from '@/lib/format';

/** A property in the estate, and whether its owner lets the estate advertise it. */
export function AgreementCard({
  agreement: a,
  onRemove,
  removing,
}: {
  agreement: MarketingAgreement;
  onRemove: () => void;
  removing?: boolean;
}) {
  const { colors, spacing } = useTheme();
  const s = AGREEMENT_STATUS[a.status] ?? { label: a.status, tone: 'neutral' as const };
  const where = [a.propertyAddress, a.propertyCity].filter(Boolean).join(', ');
  const listings = `${a.estateListingCount} ${a.estateListingCount === 1 ? 'listing' : 'listings'}`;
  return (
    <Card elevated style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View
          accessible
          accessibilityLabel={`${a.propertyTitle}, ${where}. ${s.label}. ${listings}${a.ownerName ? `. Owner ${a.ownerName}` : ''}`}
          style={{ flex: 1, gap: 3 }}
        >
          <Text variant="bodyStrong" numberOfLines={1}>
            {a.propertyTitle}
          </Text>
          <Text variant="caption" color="mutedForeground" numberOfLines={1}>
            {where}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <StatusPill label={s.label} tone={s.tone} />
            <Text variant="caption" color="mutedForeground" numberOfLines={1} style={{ flex: 1 }}>
              {listings}
              {a.ownerName ? ` · ${a.ownerName}` : ''}
            </Text>
          </View>
        </View>
        <IconButton
          accessibilityLabel={`Remove ${a.propertyTitle} from the estate`}
          disabled={removing}
          icon={<Unlink size={18} color={colors.mutedForeground} />}
          onPress={onRemove}
        />
      </View>
      {a.status === 'PENDING' ? (
        <Text variant="caption" color="mutedForeground">
          Asked {formatDate(a.createdAt, 'short')}. You can list it once the owner agrees in their
          app.
        </Text>
      ) : null}
      {a.status === 'ACTIVE' && a.expiresAt ? (
        <Text variant="caption" color="mutedForeground">
          Permission runs until {formatDate(a.expiresAt, 'short')}.
        </Text>
      ) : null}
      {(a.status === 'DECLINED' || a.status === 'REVOKED') && a.decisionNote ? (
        <Text variant="caption" color="mutedForeground">
          {a.status === 'DECLINED' ? 'Owner’s reason' : 'Withdrawn because'}: {a.decisionNote}
        </Text>
      ) : null}
    </Card>
  );
}
