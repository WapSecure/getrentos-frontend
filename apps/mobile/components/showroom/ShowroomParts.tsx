import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bath, BedDouble, Ruler } from '@sureground/icons/native';
import { Card, Price, SectionHeader, Text, useTheme } from '@sureground/ui-native';
import type { ShowroomCosts, ShowroomFact, ShowroomListing } from '@sureground/shared/showroom';

/** Beds, baths and floor area in one divided row, as on the web showroom. */
export function KeyFactsRow({
  bedrooms,
  bathrooms,
  size,
}: Pick<ShowroomListing, 'bedrooms' | 'bathrooms' | 'size'>) {
  const { colors, spacing } = useTheme();
  // Falsy on purpose: "0 bed" reads as a claim, not missing data.
  const facts = [
    bedrooms ? { icon: BedDouble, label: `${bedrooms} bed${bedrooms === 1 ? '' : 's'}` } : null,
    bathrooms ? { icon: Bath, label: `${bathrooms} bath${bathrooms === 1 ? '' : 's'}` } : null,
    size ? { icon: Ruler, label: `${size} m²` } : null,
  ].filter((f): f is NonNullable<typeof f> => !!f);
  if (!facts.length) return null;
  return (
    <View
      accessible
      accessibilityLabel={`Key facts: ${facts.map((f) => f.label).join(', ')}`}
      style={{ flexDirection: 'row', alignItems: 'center' }}
    >
      {facts.map(({ icon: Icon, label }, i) => (
        <View
          key={label}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingLeft: i ? spacing.lg : 0,
            paddingRight: spacing.lg,
            borderLeftWidth: i ? StyleSheet.hairlineWidth : 0,
            borderLeftColor: colors.border,
          }}
        >
          <Icon size={16} color={colors.mutedForeground} />
          <Text variant="callout">{label}</Text>
        </View>
      ))}
    </View>
  );
}

function Row({
  label,
  children,
  strong,
}: {
  label: string;
  children: ReactNode;
  strong?: boolean;
}) {
  const { spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: spacing.lg,
      }}
    >
      <Text
        variant="callout"
        color={strong ? 'foreground' : 'mutedForeground'}
        style={strong ? { fontWeight: '600' } : undefined}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

/** The listing's stated facts, from the shared mapper, in the same order as the web page. */
export function ShowroomFacts({
  facts,
  title = 'Details',
}: {
  facts: ShowroomFact[];
  title?: string;
}) {
  const { colors, spacing } = useTheme();
  if (!facts.length) return null;
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeader title={title} />
      <Card padding="none">
        {facts.map((f, i) => (
          <View
            key={f.label}
            accessible
            accessibilityLabel={`${f.label}: ${f.value}`}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: spacing.lg,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderTopWidth: i ? StyleSheet.hairlineWidth : 0,
              borderTopColor: colors.border,
            }}
          >
            <Text variant="callout" color="mutedForeground">
              {f.label}
            </Text>
            <Text
              variant="callout"
              style={{ fontWeight: '600', flexShrink: 1, textAlign: 'right' }}
            >
              {f.value}
            </Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

const list = (items: string[]) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

/** Price lines, the stated total and the fees the listing leaves out, as on the web page. */
export function ShowroomCostsCard({
  market,
  costs,
  price,
  priceUnit,
  footer,
  vatStated = false,
}: {
  market: ShowroomListing['market'];
  costs: ShowroomCosts;
  price: number;
  priceUnit?: ShowroomListing['priceUnit'];
  /** The landlord states a VAT rate or whether VAT is included: say it is never added here. */
  vatStated?: boolean;
  /** A next step that belongs with the price, such as Apply or Make an offer. */
  footer?: ReactNode;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeader title={market === 'rent' ? 'What you pay to move in' : 'What you pay'} />
      <Card style={{ gap: spacing.sm }}>
        {costs.lines.map((line) => (
          <Row key={line.label} label={line.label}>
            <Price amount={line.amount} variant="callout" />
          </Row>
        ))}
        {costs.total && costs.lines.length > 1 ? (
          <View
            style={{
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.border,
              paddingTop: spacing.sm,
            }}
          >
            <Row label={costs.total.label} strong>
              <Price amount={costs.total.amount} variant="bodyStrong" />
            </Row>
          </View>
        ) : null}
        {market === 'rent' && priceUnit === 'year' ? (
          <Text variant="caption" color="mutedForeground">
            Rent is about ₦{Math.round(price / 12).toLocaleString('en-NG')} a month.
          </Text>
        ) : null}
        {vatStated ? (
          // VAT is never added to these amounts; the landlord's own statement is shown once, under the lease.
          <Text
            variant="caption"
            color="mutedForeground"
            style={{
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.border,
              paddingTop: spacing.sm,
            }}
          >
            Sureground does not add VAT to these amounts. The VAT the landlord states is under Lease
            and terms.
          </Text>
        ) : null}
        {costs.notStated.length ? (
          <Text
            variant="caption"
            color="mutedForeground"
            style={{
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.border,
              paddingTop: spacing.sm,
            }}
          >
            Not stated in this listing: {list(costs.notStated).toLowerCase()}. Ask for the full
            breakdown before you pay.
          </Text>
        ) : null}
        {footer ? <View style={{ gap: spacing.sm, paddingTop: spacing.xs }}>{footer}</View> : null}
      </Card>
    </View>
  );
}

/** The sticky phone bar: the price and one primary action for the listing type. */
export function ShowroomPriceBar({
  price,
  period,
  caption,
  action,
  leading,
}: {
  price: number;
  period?: 'month' | 'year' | 'night' | 'total';
  /** A short line under the price, such as an offer in progress. */
  caption?: ReactNode;
  /** The one primary button. */
  action: ReactNode;
  /** Small icon actions before the price, such as save. */
  leading?: ReactNode;
}) {
  const { colors, spacing, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: insets.bottom + spacing.md,
        backgroundColor: colors.card,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
        ...shadows.lg,
      }}
    >
      {leading}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Price amount={price} period={period} variant="subheading" />
        {caption}
      </View>
      {action}
    </View>
  );
}
