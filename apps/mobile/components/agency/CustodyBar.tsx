import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ArrowLeftRight, Briefcase, Check } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  FormAlert,
  PressableScale,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { useCustody } from '@/lib/agency/custody';
import {
  grantsNothing,
  hasEnded,
  isLive,
  MANDATE_STATUS,
  noticeSummary,
  type Mandate,
} from '@/lib/api/agency';
import { Sheet } from '@/components/Sheet';

/**
 * Whose property the manager is acting on, stated on every agency screen, with
 * the switch beside it. Choosing comes before changing anything.
 */
export function CustodyBar() {
  const { colors, spacing } = useTheme();
  const { mandates, selected, loading, error, reload } = useCustody();
  const [switching, setSwitching] = useState(false);

  if (loading) return <Skeleton height={72} />;
  if (error && mandates.length === 0) {
    return (
      <View style={{ gap: spacing.sm }}>
        <FormAlert
          tone="error"
          message={`We could not load your clients (${error}). Do not act on a property until this list is back, because you cannot tell whose it is.`}
        />
        <Button label="Try again" size="sm" variant="secondary" onPress={reload} />
      </View>
    );
  }
  if (mandates.length === 0) {
    return (
      <Card style={{ gap: 4 }}>
        <Text variant="bodyStrong">No client engagements yet.</Text>
        <Text variant="caption" color="mutedForeground">
          Engagements appear here once an owner appoints your firm.
        </Text>
      </Card>
    );
  }

  return (
    <>
      <PressableScale
        onPress={() => setSwitching(true)}
        accessibilityRole="button"
        accessibilityLabel={
          selected
            ? `Managing for ${selected.ownerName ?? 'the owner'}, ${selected.propertyTitle ?? 'property'}. Switch client`
            : 'No client selected. Choose a client'
        }
      >
        <Card
          padding={spacing.md}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            borderWidth: selected ? 0 : 1,
            borderColor: colors.warning,
          }}
        >
          <Briefcase size={18} color={selected ? colors.primary : colors.warning} />
          <View style={{ flex: 1, gap: 2 }}>
            {selected ? (
              <>
                <Text variant="caption" color="mutedForeground">
                  Managing for
                </Text>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {selected.ownerName ?? 'Owner'} · {selected.propertyTitle ?? 'Property'}
                </Text>
                <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                  {noticeSummary(selected)}
                </Text>
                <SelectedBadges m={selected} />
              </>
            ) : (
              <>
                <Text variant="bodyStrong">No client selected</Text>
                <Text variant="caption" color="mutedForeground">
                  Choose who you are acting for before you change anything.
                </Text>
              </>
            )}
          </View>
          <ArrowLeftRight size={18} color={colors.mutedForeground} />
        </Card>
      </PressableScale>
      <Sheet open={switching} onClose={() => setSwitching(false)} title="Switch client">
        <ClientPicker onDone={() => setSwitching(false)} />
      </Sheet>
    </>
  );
}

function SelectedBadges({ m }: { m: Mandate }) {
  const { spacing } = useTheme();
  const badges: { label: string; tone: 'neutral' | 'warning' | 'info' | 'danger' }[] = [];
  if (hasEnded(m)) badges.push({ label: 'View only', tone: 'neutral' });
  else if (!isLive(m))
    badges.push({
      label: MANDATE_STATUS[m.status].label,
      tone: MANDATE_STATUS[m.status].tone === 'danger' ? 'danger' : 'warning',
    });
  if (grantsNothing(m))
    badges.push({ label: 'This mandate grants no access yet', tone: 'warning' });
  if (!badges.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2 }}>
      {badges.map((b) => (
        <Badge key={b.label} label={b.label} tone={b.tone} />
      ))}
    </View>
  );
}

/** Every engagement, live ones first, with why a non-live one can't be acted under. */
export function ClientPicker({ onDone }: { onDone: () => void }) {
  const { colors, spacing } = useTheme();
  const { mandates, selected, select } = useCustody();
  const ordered = [...mandates].sort(
    (a, b) =>
      Number(isLive(b)) - Number(isLive(a)) || (a.ownerName ?? '').localeCompare(b.ownerName ?? '')
  );
  const notLive = mandates.filter((m) => !isLive(m)).length;
  return (
    <View style={{ gap: spacing.md, maxHeight: 560 }}>
      {notLive > 0 ? (
        <Text variant="caption" color="mutedForeground">
          {notLive} not live: you can look at them, but not act under them.
        </Text>
      ) : null}
      <ScrollView contentContainerStyle={{ gap: spacing.sm }}>
        {ordered.map((m) => {
          const live = isLive(m);
          const active = selected?.id === m.id;
          return (
            <PressableScale
              key={m.id}
              onPress={() => {
                select(m.id);
                onDone();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${m.propertyTitle ?? 'Property'}, ${m.ownerName ?? 'owner'}`}
            >
              <Card
                padding={spacing.md}
                style={{
                  flexDirection: 'row',
                  gap: spacing.sm,
                  alignItems: 'center',
                  borderWidth: active ? 1.5 : 0,
                  borderColor: colors.primary,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="callout" style={{ fontWeight: '600' }} numberOfLines={1}>
                    {m.propertyTitle ?? 'Property'}
                  </Text>
                  <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                    {m.ownerName ?? 'Owner'} · {noticeSummary(m)}
                  </Text>
                  {!live ? (
                    <Text variant="caption" style={{ color: colors.warning }}>
                      {hasEnded(m)
                        ? 'View only'
                        : `${MANDATE_STATUS[m.status].label}: you cannot act under this one yet`}
                    </Text>
                  ) : null}
                </View>
                {active ? <Check size={18} color={colors.primary} /> : null}
              </Card>
            </PressableScale>
          );
        })}
      </ScrollView>
      {selected ? (
        <Button
          label="Clear selection"
          variant="ghost"
          onPress={() => {
            select(null);
            onDone();
          }}
        />
      ) : null}
    </View>
  );
}
