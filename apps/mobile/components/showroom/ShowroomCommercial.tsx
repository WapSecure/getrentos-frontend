import { StyleSheet, View } from 'react-native';
import { Card, SectionHeader, Text, useTheme } from '@sureground/ui-native';
import {
  commercialSections,
  type CommercialDetails,
  type CommercialRow,
  type ShowroomMarket,
} from '@sureground/shared/showroom';

function Rows({ rows }: { rows: CommercialRow[] }) {
  const { colors, spacing } = useTheme();
  return (
    <Card padding="none">
      {rows.map((row, i) => (
        <View
          key={row.key}
          accessible
          accessibilityLabel={[`${row.label}: ${row.value}`, row.hint].filter(Boolean).join('. ')}
          style={{
            gap: 2,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            borderTopWidth: i ? StyleSheet.hairlineWidth : 0,
            borderTopColor: colors.border,
          }}
        >
          <Text variant="caption" color="mutedForeground">
            {row.label}
          </Text>
          <Text variant="callout" style={{ fontWeight: '600' }}>
            {row.value}
          </Text>
          {row.hint ? (
            <Text variant="caption" color="mutedForeground">
              {row.hint}
            </Text>
          ) : null}
        </View>
      ))}
    </Card>
  );
}

/**
 * The commercial journey, as on the web showroom: the lease first, then the space, then what it
 * takes to run a business there. Every line is the lister's own statement, VAT included: it is shown
 * as stated and never worked out. A section with nothing stated is left out.
 */
export function ShowroomCommercial({
  commercial,
  market,
}: {
  commercial: CommercialDetails;
  market: ShowroomMarket;
}) {
  const { spacing } = useTheme();
  const { lease, space, running } = commercialSections(commercial, market);
  const sections = [
    { title: 'Lease and terms', rows: lease },
    { title: 'The space', rows: space },
    { title: 'Running the business', rows: running },
  ].filter((s) => s.rows.length > 0);
  if (!sections.length) return null;
  return (
    <>
      {sections.map((s) => (
        <View key={s.title} style={{ gap: spacing.sm }}>
          <SectionHeader title={s.title} />
          <Rows rows={s.rows} />
        </View>
      ))}
    </>
  );
}
