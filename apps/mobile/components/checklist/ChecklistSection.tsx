import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Card, Progress, Text, useTheme } from '@getrentos/ui-native';
import type { MoveInChecklistItem } from '@/lib/api/renter';

interface Props {
  title: string;
  items: MoveInChecklistItem[];
  onToggle: (key: string) => void;
  pendingKey?: string;
}

export function ChecklistSection({ title, items, onToggle, pendingKey }: Props) {
  const { colors, spacing, radius } = useTheme();
  const done = items.filter((i) => i.completed).length;

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="heading">{title}</Text>
        <Text variant="caption" color="mutedForeground">
          {done}/{items.length}
        </Text>
      </View>
      <Progress value={items.length ? done / items.length : 0} />
      <Card elevated padding="none">
        {items.map((item, i) => (
          <Pressable
            key={item.key}
            onPress={() => onToggle(item.key)}
            disabled={pendingKey === item.key}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: spacing.md,
              padding: spacing.lg,
              borderTopWidth: i > 0 ? 1 : 0,
              borderTopColor: colors.border,
              opacity: pendingKey === item.key ? 0.6 : 1,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: radius.sm,
                borderWidth: 1.5,
                borderColor: item.completed ? colors.primary : colors.border,
                backgroundColor: item.completed ? colors.primary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 1,
              }}
            >
              {item.completed ? <Check size={14} color={colors.primaryForeground} /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                variant="bodyStrong"
                style={
                  item.completed
                    ? { textDecorationLine: 'line-through', color: colors.mutedForeground }
                    : undefined
                }
              >
                {item.title}
                {item.required ? '' : '  ·  optional'}
              </Text>
              <Text variant="caption" color="mutedForeground">
                {item.description}
              </Text>
            </View>
          </Pressable>
        ))}
      </Card>
    </View>
  );
}
