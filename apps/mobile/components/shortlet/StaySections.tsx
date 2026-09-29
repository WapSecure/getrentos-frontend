import { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  BadgeCheck,
  Cake,
  Check,
  CigaretteOff,
  ClipboardCheck,
  Droplets,
  HelpCircle,
  PawPrint,
  Scale,
  Wifi,
  X,
  Zap,
} from 'lucide-react-native';
import { Avatar, Button, Card, Chip, Divider, Price, Text, useTheme } from '@getrentos/ui-native';
import type { ShortletListing } from '@/lib/api/shortlets';
import {
  CONDITION_LABEL,
  discountPhrases,
  internetSummary,
  nightsLabel,
  powerSummary,
  ruleAnswer,
  seasonRange,
  waterSummary,
  type RuleAnswer,
} from '@/lib/stays';
import { formatDate } from '@/lib/format';
import { InfoRow, Section } from './StayUI';

/* ---------------------------------- host ---------------------------------- */

export function HostBlock({
  listing,
  onMessage,
}: {
  listing: ShortletListing;
  onMessage: () => void;
}) {
  const { colors, spacing } = useTheme();
  const cancels = listing.hostCancellations12m ?? 0;
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Avatar name={listing.hostName} size={48} />
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text variant="subheading" numberOfLines={1} style={{ flexShrink: 1 }}>
              Hosted by {listing.hostName.split(/\s+/)[0]}
            </Text>
            {listing.hostVerified ? (
              <BadgeCheck size={17} color={colors.primary} accessibilityLabel="Verified host" />
            ) : null}
          </View>
          <Text
            variant="callout"
            style={{ color: cancels > 0 ? colors.warning : colors.mutedForeground }}
          >
            {listing.hostCancellations12m == null
              ? listing.hostVerified
                ? 'Identity verified by GetRentos'
                : 'New to hosting on GetRentos'
              : cancels === 0
                ? 'No cancelled stays in the last year'
                : `Cancelled ${cancels} confirmed ${cancels === 1 ? 'stay' : 'stays'} in the last year`}
          </Text>
        </View>
      </View>
      <Button label="Message the host" variant="outline" onPress={onMessage} />
    </View>
  );
}

/* ------------------------------- essentials ------------------------------- */

export function EssentialsBlock({ listing }: { listing: ShortletListing }) {
  const { spacing } = useTheme();
  const power = powerSummary(listing);
  const water = waterSummary(listing);
  const internet = internetSummary(listing);
  return (
    <Section title="Power, water & internet" caption="What the host says you can count on.">
      <Card elevated style={{ gap: spacing.lg }}>
        <InfoRow
          icon={Zap}
          title="Power"
          detail={power ?? 'Not stated by the host'}
          muted={!power}
        />
        <InfoRow
          icon={Droplets}
          title="Water"
          detail={water ?? 'Not stated by the host'}
          muted={!water}
        />
        <InfoRow
          icon={Wifi}
          title="Internet"
          detail={internet ?? 'Not stated by the host'}
          muted={!internet}
        />
      </Card>
    </Section>
  );
}

/* ------------------------------- house rules ------------------------------ */

function RuleRow({
  label,
  icon,
  answer,
}: {
  label: string;
  icon: typeof PawPrint;
  answer: RuleAnswer;
}) {
  const { colors } = useTheme();
  const Mark = answer === 'yes' ? Check : answer === 'no' ? X : HelpCircle;
  const word = answer === 'yes' ? 'Allowed' : answer === 'no' ? 'Not allowed' : 'Ask the host';
  return (
    <InfoRow
      icon={icon}
      title={label}
      detail={word}
      muted={answer === 'unknown'}
      trailing={
        <Mark
          size={18}
          color={
            answer === 'yes'
              ? colors.success
              : answer === 'no'
                ? colors.destructive
                : colors.mutedForeground
          }
        />
      }
    />
  );
}

export function RulesBlock({ listing }: { listing: ShortletListing }) {
  const { spacing } = useTheme();
  const [more, setMore] = useState(false);
  const rules = listing.houseRules?.trim();
  return (
    <Section title="House rules">
      <Card elevated style={{ gap: spacing.lg }}>
        <RuleRow label="Pets" icon={PawPrint} answer={ruleAnswer(listing.petsAllowed)} />
        <RuleRow label="Smoking" icon={CigaretteOff} answer={ruleAnswer(listing.smokingAllowed)} />
        <RuleRow label="Parties & events" icon={Cake} answer={ruleAnswer(listing.partiesAllowed)} />
        {rules ? (
          <>
            <Divider />
            <Text variant="body" color="mutedForeground" numberOfLines={more ? undefined : 4}>
              {rules}
            </Text>
            {rules.length > 180 ? (
              <Pressable onPress={() => setMore((m) => !m)} accessibilityRole="button" hitSlop={8}>
                <Text variant="callout" color="primary" style={{ fontWeight: '700' }}>
                  {more ? 'Show less' : 'Read all rules'}
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
      </Card>
    </Section>
  );
}

/* --------------------------------- pricing -------------------------------- */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Text variant="body" color="mutedForeground" style={{ flex: 1 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

export function PricingBlock({ listing }: { listing: ShortletListing }) {
  const { colors, spacing, radius } = useTheme();
  const discounts = discountPhrases(listing);
  const seasons = listing.seasons ?? [];
  return (
    <Section title="Prices" caption="The total for your dates includes all of this.">
      <Card elevated style={{ gap: spacing.md }}>
        <Row label={listing.pricingMode === 'PER_NIGHT' ? 'Nightly rate' : 'Price per stay'}>
          <Price amount={listing.nightlyRate} variant="bodyStrong" />
        </Row>
        {listing.cleaningFee ? (
          <Row label="Cleaning fee (once)">
            <Price amount={listing.cleaningFee} variant="bodyStrong" />
          </Row>
        ) : null}
        {listing.deposit ? (
          <Row label="Refundable deposit">
            <Price amount={listing.deposit} variant="bodyStrong" />
          </Row>
        ) : null}
        {listing.taxPct ? (
          <Row label={listing.taxName ?? 'Tax'}>
            <Text variant="bodyStrong">{listing.taxPct}%</Text>
          </Row>
        ) : null}
        {discounts.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {discounts.map((d) => (
              <Chip key={d} label={d} size="sm" />
            ))}
          </View>
        ) : null}
        {listing.advanceNoticeDays ? (
          <Text variant="caption" color="mutedForeground">
            Book at least {listing.advanceNoticeDays}{' '}
            {listing.advanceNoticeDays === 1 ? 'day' : 'days'} ahead.
          </Text>
        ) : null}
      </Card>

      {seasons.length ? (
        <View style={{ gap: spacing.sm }}>
          {seasons.map((s) => (
            <View
              key={s.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.md,
                borderRadius: radius.lg,
                backgroundColor: colors.warningSubtle,
              }}
            >
              <View style={{ flex: 1, gap: 1 }}>
                <Text variant="bodyStrong">{s.name}</Text>
                <Text variant="caption" color="mutedForeground">
                  {seasonRange(s.startDate, s.endDate)}
                  {s.minNights ? ` · minimum ${nightsLabel(s.minNights)}` : ''}
                </Text>
              </View>
              {s.nightlyRate ? (
                <View style={{ alignItems: 'flex-end' }}>
                  <Price amount={s.nightlyRate} variant="bodyStrong" />
                  <Text variant="caption" color="mutedForeground">
                    a night
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </Section>
  );
}

export function FairPriceNote({ listing }: { listing: ShortletListing }) {
  const { colors, spacing, radius } = useTheme();
  const f = listing.fairPrice;
  if (!f) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.lg,
        backgroundColor: colors.successSubtle,
      }}
    >
      <Scale size={20} color={colors.success} style={{ marginTop: 1 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong">Fair price</Text>
        <Text variant="callout" style={{ color: colors.foreground }}>
          {f.bedrooms}-bedroom stays in {f.city} typically go for ₦
          {f.typicalNightly.toLocaleString('en-NG')} a night ({f.comparables} stays on GetRentos).
          This one is at or below that.
        </Text>
      </View>
    </View>
  );
}

/* ------------------------------- inspection ------------------------------- */

export function InspectionBlock({ listing }: { listing: ShortletListing }) {
  const { colors, spacing } = useTheme();
  const i = listing.inspection;
  if (!i) return null;
  const tone = (c: keyof typeof CONDITION_LABEL) =>
    c === 'excellent' || c === 'good' ? colors.success : colors.warning;
  return (
    <Section
      title="Inspected"
      caption={`A licensed agent, ${i.agentName}, went through this home on ${formatDate(i.inspectedAt)}.`}
    >
      <Card elevated style={{ gap: spacing.md }}>
        <InfoRow
          icon={ClipboardCheck}
          title={`Overall: ${CONDITION_LABEL[i.condition]}`}
          detail={`${i.rooms.length} ${i.rooms.length === 1 ? 'room' : 'rooms'} rated`}
        />
        <Divider />
        {i.rooms.map((r) => (
          <View
            key={r.room}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text variant="body">{r.room}</Text>
            <Text variant="callout" style={{ color: tone(r.condition), fontWeight: '700' }}>
              {CONDITION_LABEL[r.condition]}
            </Text>
          </View>
        ))}
        <Text variant="caption" color="mutedForeground">
          The host arranged this inspection. GetRentos checked the agent&apos;s licence and
          identity, and only shows inspections from the last 12 months with no room rated poor.
        </Text>
      </Card>
    </Section>
  );
}
