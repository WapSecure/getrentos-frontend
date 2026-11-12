import { Pressable, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Paperclip } from '@sureground/icons/native';
import { Divider, Price, Text, useTheme } from '@sureground/ui-native';
import type { DepositClaim } from '@/lib/api/depositEnd';

/** The claimed deductions with their evidence, read-only. Shown to the landlord and the tenant. */
export function ClaimItems({ claim }: { claim: DepositClaim }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
      }}
    >
      {claim.items.map((item, i) => (
        <View key={item.id}>
          {i > 0 ? <Divider /> : null}
          <View style={{ padding: spacing.md, gap: spacing.xs }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
              <Text variant="callout" style={{ flex: 1 }}>
                {item.reason}
              </Text>
              <Price amount={item.amount} variant="bodyStrong" />
            </View>
            {item.evidence.map((file) => (
              <Pressable
                key={file.url}
                accessibilityRole="link"
                accessibilityLabel={`Open ${file.name}`}
                onPress={() => void WebBrowser.openBrowserAsync(file.url).catch(() => undefined)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
                hitSlop={6}
              >
                <Paperclip size={14} color={colors.primary} />
                <Text
                  variant="caption"
                  style={{ color: colors.primary, flex: 1 }}
                  numberOfLines={1}
                >
                  {file.name}
                </Text>
              </Pressable>
            ))}
            {item.inspectionId ? (
              <Text variant="caption" color="mutedForeground">
                Backed by the move-out inspection
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
