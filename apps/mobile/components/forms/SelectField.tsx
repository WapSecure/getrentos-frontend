import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Check, ChevronDown, Search } from 'lucide-react-native';
import { Text, TextField, useTheme } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';

export type SelectOption = { value: string; label: string };

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  error,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}) {
  const { colors, spacing, radius } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? options.filter((option) => option.label.toLowerCase().includes(query)) : options;
  }, [options, search]);

  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="callout" color="mutedForeground" style={{ fontWeight: '600' }}>
        {label}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${selected?.label ?? placeholder}`}
        accessibilityState={{ disabled, expanded: open }}
        style={{
          minHeight: 54,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: error ? colors.destructive : colors.border,
          backgroundColor: colors.secondary,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Text color={selected ? 'foreground' : 'mutedForeground'} style={{ flex: 1 }}>
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={18} color={colors.mutedForeground} />
      </Pressable>
      {error ? (
        <Text variant="caption" color="destructive">
          {error}
        </Text>
      ) : null}
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={`Select ${label.toLowerCase()}`}
        snapPoints={['75%']}
      >
        <View style={{ gap: spacing.md }}>
          <TextField
            accessibilityLabel={`Search ${label.toLowerCase()}`}
            placeholder={`Search ${label.toLowerCase()}`}
            value={search}
            onChangeText={setSearch}
            leftIcon={<Search size={17} color={colors.mutedForeground} />}
          />
          {filtered.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                onChange(option.value);
                setSearch('');
                setOpen(false);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: option.value === value }}
              style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
            >
              <Text style={{ flex: 1 }}>{option.label}</Text>
              {option.value === value ? <Check size={18} color={colors.primary} /> : null}
            </Pressable>
          ))}
          {filtered.length === 0 ? <Text color="mutedForeground">No options found.</Text> : null}
        </View>
      </Sheet>
    </View>
  );
}
