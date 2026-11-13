import { createElement, type ComponentProps } from 'react';
import { View } from 'react-native';
import {
  Droplets,
  Gauge,
  Hammer,
  Home,
  Lock,
  Palette,
  PawPrint,
  Power,
  Route,
  Tag,
  Waves,
  Wifi,
  Wrench,
  Zap,
} from '@sureground/icons/native';
import {
  MAINTENANCE_CATEGORY_GROUPS,
  MAINTENANCE_CATEGORY_LABELS,
  maintenanceCategoryIconName,
  type MaintenanceCategoryIconName,
} from '@sureground/shared';
import { Chip, Text, useTheme } from '@sureground/ui-native';

/** The shared icon names mapped to the native icon components. */
const ICONS: Record<MaintenanceCategoryIconName, typeof Wrench> = {
  Droplets,
  Gauge,
  Hammer,
  Home,
  Lock,
  Palette,
  PawPrint,
  Power,
  Route,
  Tag,
  Waves,
  Wifi,
  Wrench,
  Zap,
};

/** Decorative category icon; the category name always sits next to it. */
export function MaintenanceCategoryIcon({
  category,
  ...props
}: { category: string | null | undefined } & ComponentProps<typeof Wrench>) {
  return createElement(ICONS[maintenanceCategoryIconName(category)], props);
}

/**
 * Grouped category chips with icons. `lowercase` returns the renter routes' lowercase codes;
 * otherwise the UPPERCASE home-management codes. Chip names stay the plain labels.
 */
export function CategoryPicker<T extends string>({
  value,
  onChange,
  lowercase = false,
  size = 'sm',
}: {
  value: T | null | undefined;
  onChange: (value: T) => void;
  lowercase?: boolean;
  size?: 'sm' | 'md';
}) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {MAINTENANCE_CATEGORY_GROUPS.map((group) => (
        <View key={group.id} style={{ gap: spacing.xs }}>
          <Text variant="caption" color="mutedForeground">
            {group.label}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {group.categories.map((code) => {
              const key = (lowercase ? code.toLowerCase() : code) as T;
              const selected = value === key;
              return (
                <Chip
                  key={code}
                  size={size}
                  label={MAINTENANCE_CATEGORY_LABELS[code]}
                  selected={selected}
                  leadingIcon={
                    <MaintenanceCategoryIcon
                      category={code}
                      size={14}
                      color={selected ? colors.primary : colors.mutedForeground}
                    />
                  }
                  onPress={() => onChange(key)}
                />
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
