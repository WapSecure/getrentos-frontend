import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Globe } from '@sureground/icons/native';
import { identityHeadline } from '@sureground/shared';
import { Badge, Divider, PressableScale, Text, useTheme } from '@sureground/ui-native';
import { investorApi } from '@/lib/api/investor';
import { qk } from '@/lib/query/keys';
import { useDiasporaAvailability } from '@/hooks/useDiasporaAvailability';
import { useForeignIdentityStatus } from '@/hooks/useForeignIdentityStatus';

/**
 * The way to the identity checks for investing from abroad, on the trust screens. Shown only
 * while Diaspora Invest is on and the person has an investor profile.
 */
export function IdentityAbroadEntry() {
  const { colors, spacing } = useTheme();
  const { enabled } = useDiasporaAvailability();
  const profile = useQuery({
    queryKey: qk.investor.profile,
    queryFn: investorApi.profile,
    enabled,
    retry: false,
  });
  const hasProfile = enabled && Boolean(profile.data);
  const identity = useForeignIdentityStatus(hasProfile);
  if (!hasProfile) return null;
  const headline = identityHeadline(identity.data);

  return (
    <>
      <Divider />
      <PressableScale
        onPress={() => router.push('/(app)/invest-identity')}
        accessibilityRole="button"
        accessibilityLabel={`Identity abroad${headline ? `, ${headline.label}` : ''}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          minHeight: 44,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}
      >
        <Globe size={18} color={colors.mutedForeground} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="callout" style={{ fontWeight: '600' }}>
            Identity abroad
          </Text>
          <Text variant="caption" color="mutedForeground">
            For investing from abroad
          </Text>
        </View>
        {headline ? <Badge label={headline.label} tone={headline.tone} /> : null}
        <ChevronRight size={18} color={colors.mutedForeground} />
      </PressableScale>
    </>
  );
}
