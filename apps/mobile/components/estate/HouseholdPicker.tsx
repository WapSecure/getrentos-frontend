import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Check, Search } from 'lucide-react-native';
import { Skeleton, Text, TextField, useTheme } from '@getrentos/ui-native';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { estateManagerApi, type Household } from '@/lib/api/estateManager';
import { qk } from '@/lib/query/keys';

/** Find one active household by unit or name. Shows the choice once made. */
export function HouseholdPicker({
  estateId,
  value,
  onChange,
  label = 'Household',
}: {
  estateId: string;
  value: Household | null;
  onChange: (h: Household | null) => void;
  label?: string;
}) {
  const { colors, spacing, radius } = useTheme();
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(search.trim(), 300);
  const query = useQuery({
    queryKey: qk.estateManager.households(estateId, term, 'ACTIVE'),
    queryFn: () =>
      estateManagerApi.households(estateId, { status: 'ACTIVE', search: term || undefined }),
    enabled: !!estateId && !value,
  });

  if (value) {
    return (
      <View style={{ gap: spacing.xs }}>
        <Text variant="bodyStrong">{label}</Text>
        <Pressable
          onPress={() => onChange(null)}
          accessibilityRole="button"
          accessibilityLabel={`${value.unitLabel}, ${value.residentName}. Change household`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.md,
            borderRadius: radius.md,
            backgroundColor: colors.accent,
          }}
        >
          <Check size={16} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="callout" style={{ fontWeight: '700' }} numberOfLines={1}>
              {value.unitLabel}
            </Text>
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {value.residentName}
            </Text>
          </View>
          <Text variant="caption" color="primary" style={{ fontWeight: '700' }}>
            Change
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <TextField
        label={label}
        placeholder="Search unit or name"
        leftIcon={<Search size={16} color={colors.mutedForeground} />}
        autoCapitalize="none"
        value={search}
        onChangeText={setSearch}
      />
      {query.isPending ? (
        <Skeleton height={96} radius={radius.md} />
      ) : !query.data?.items.length ? (
        <Text variant="callout" color="mutedForeground">
          {term ? 'No active household matches.' : 'No active households yet.'}
        </Text>
      ) : (
        <View>
          {query.data.items.slice(0, 6).map((h) => (
            <Pressable
              key={h.id}
              onPress={() => onChange(h)}
              accessibilityRole="button"
              accessibilityLabel={`${h.unitLabel}, ${h.residentName}`}
              style={({ pressed }) => ({
                minHeight: 48,
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text variant="callout" style={{ fontWeight: '600' }} numberOfLines={1}>
                {h.unitLabel}
              </Text>
              <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                {h.residentName}
              </Text>
            </Pressable>
          ))}
          {query.data.total > 6 ? (
            <Text variant="caption" color="mutedForeground">
              Showing 6 of {query.data.total.toLocaleString('en-NG')}. Type to narrow it down.
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}
