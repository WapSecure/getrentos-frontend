import { View } from 'react-native';
import { router } from 'expo-router';
import { AlertCircle, Bell, CheckCircle2, Clock, type SgIcon } from '@sureground/icons/native';
import { Badge, Button, Card, Divider, EmptyState, Text, useTheme } from '@sureground/ui-native';
import type { AttentionItem } from '@sureground/shared';
import { asHref } from '@/components/purchases/purchaseHref';

export interface AttentionListItem extends AttentionItem {
  /** Replaces the severity glyph with one that says what the item is (a deposit, a tour). */
  icon?: SgIcon;
  /** When it is due, already formatted (Lagos time beside the viewer's own). */
  due?: string;
}

const SEVERITY_LABEL = { urgent: 'Urgent', soon: 'Due soon', info: 'For information' } as const;

/**
 * "Needs your attention": one row per thing waiting, each with what it is, when it is due and a
 * single action. The same rows and order as the web list.
 */
export function AttentionList({
  items,
  title = 'Needs your attention',
  empty,
}: {
  items: readonly AttentionListItem[];
  title?: string;
  /** Shown when nothing is waiting; without it the card is not drawn at all. */
  empty?: { title: string; description?: string };
}) {
  const { colors, spacing, radius } = useTheme();
  if (!items.length && !empty) return null;
  const urgent = items.filter((item) => item.severity === 'urgent').length;
  const tone = {
    urgent: { icon: AlertCircle, color: colors.destructive },
    soon: { icon: Clock, color: colors.warning },
    info: { icon: Bell, color: colors.mutedForeground },
  } as const;

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="subheading" accessibilityRole="header" style={{ flex: 1 }}>
          {title}
        </Text>
        {items.length ? (
          <Badge
            label={urgent ? `${urgent} urgent` : `${items.length} open`}
            tone={urgent ? 'danger' : 'neutral'}
          />
        ) : null}
      </View>
      {items.length === 0 && empty ? (
        <EmptyState
          size="compact"
          icon={<CheckCircle2 size={28} color={colors.success} />}
          title={empty.title}
          description={empty.description}
        />
      ) : (
        items.map((item, index) => {
          const t = tone[item.severity];
          const Icon = item.icon ?? t.icon;
          return (
            <View key={item.key} style={{ gap: spacing.md }}>
              {index > 0 ? <Divider /> : null}
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: radius.md,
                    backgroundColor: colors.secondary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={18} color={t.color} />
                </View>
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <Text
                    variant="callout"
                    style={{ fontWeight: '600' }}
                    accessibilityLabel={`${SEVERITY_LABEL[item.severity]}: ${item.title}`}
                  >
                    {item.title}
                  </Text>
                  {item.detail ? (
                    <Text variant="caption" color="mutedForeground">
                      {item.detail}
                    </Text>
                  ) : null}
                  {item.due ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                      <Clock size={13} color={colors.mutedForeground} />
                      <Text
                        variant="caption"
                        color="mutedForeground"
                        style={{ flex: 1, fontVariant: ['tabular-nums'] }}
                      >
                        {item.due}
                      </Text>
                    </View>
                  ) : null}
                  <Button
                    label={item.link.label}
                    size="sm"
                    variant={item.severity === 'urgent' ? 'primary' : 'outline'}
                    onPress={() => router.push(asHref(item.link.path))}
                    style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}
                  />
                </View>
              </View>
            </View>
          );
        })
      )}
    </Card>
  );
}
