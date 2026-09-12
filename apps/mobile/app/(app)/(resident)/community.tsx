import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  CalendarCheck,
  ChevronRight,
  Contact,
  KeyRound,
  Landmark,
  Package,
  TriangleAlert,
  Vote,
} from 'lucide-react-native';
import { Card, Divider, Screen, Text, useTheme } from '@getrentos/ui-native';

const ROWS = [
  {
    href: '/(app)/visitor-passes',
    label: 'Visitor Passes',
    description: 'Issue a gate pass for your guests',
    icon: KeyRound,
  },
  {
    href: '/(app)/amenities',
    label: 'Amenities',
    description: 'Book shared facilities in your estate',
    icon: CalendarCheck,
  },
  {
    href: '/(app)/violations',
    label: 'Violations',
    description: 'Warnings reported against your household',
    icon: TriangleAlert,
  },
  {
    href: '/(app)/deliveries',
    label: 'Deliveries',
    description: 'Track packages at the gate',
    icon: Package,
  },
  {
    href: '/(app)/directory',
    label: 'Directory',
    description: 'Browse and opt into the neighbor directory',
    icon: Contact,
  },
  { href: '/(app)/polls', label: 'Polls', description: 'Vote on estate decisions', icon: Vote },
  {
    href: '/(app)/committee',
    label: 'Committee',
    description: 'See who sits on the estate committee',
    icon: Landmark,
  },
] as const;

export default function ResidentCommunity() {
  const { colors, spacing } = useTheme();

  return (
    <Screen>
      <Text variant="title">Community</Text>

      <Card padding="none">
        {ROWS.map((row, i) => (
          <View key={row.href}>
            <Pressable
              onPress={() => router.push(row.href)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.lg,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <row.icon size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{row.label}</Text>
                <Text variant="caption" color="mutedForeground">
                  {row.description}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.mutedForeground} />
            </Pressable>
            {i < ROWS.length - 1 ? <Divider /> : null}
          </View>
        ))}
      </Card>
    </Screen>
  );
}
