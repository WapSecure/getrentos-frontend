import { Fragment, type ReactNode } from 'react';
import { View } from 'react-native';
import { Divider, Text, useTheme } from '@sureground/ui-native';

export interface Fact {
  label: string;
  /** Text, or a badge. Rows with no value are left out. */
  value: ReactNode;
  hint?: string;
}

/** Label and value rows, the native form of the web's DescriptionList "rows" layout. */
export function FactList({ facts }: { facts: Fact[] }) {
  const { spacing } = useTheme();
  const shown = facts.filter((f) => f.value !== null && f.value !== undefined && f.value !== '');
  return (
    <View style={{ gap: spacing.sm }}>
      {shown.map((fact, index) => (
        <Fragment key={fact.label}>
          {index > 0 ? <Divider /> : null}
          <View style={{ gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
                {fact.label}
              </Text>
              {typeof fact.value === 'string' || typeof fact.value === 'number' ? (
                <Text variant="callout" style={{ flexShrink: 1, textAlign: 'right' }}>
                  {fact.value}
                </Text>
              ) : (
                fact.value
              )}
            </View>
            {fact.hint ? (
              <Text variant="caption" color="mutedForeground">
                {fact.hint}
              </Text>
            ) : null}
          </View>
        </Fragment>
      ))}
    </View>
  );
}
