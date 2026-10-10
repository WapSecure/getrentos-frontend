import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react-native';
import { Button, FormAlert, Text, useTheme, type useToast } from '@getrentos/ui-native';
import { errorText } from '@/components/estate/EstateUI';
import { marketplaceKeys, planGate, type EstateListing } from '@/lib/api/estateMarketplace';
import type { Paginated } from '@/lib/api/properties';

type Toast = ReturnType<typeof useToast>;

/**
 * A failed write, said the right way: a plan refusal offers the plans (it's
 * not something the manager did wrong), anything else is a toast.
 */
export function reportError(e: unknown, fallback: string, toast: Toast) {
  const gate = planGate(e);
  if (gate) {
    Alert.alert(
      gate === 'limit' ? 'You’ve reached your plan’s limit' : 'Not on your plan',
      errorText(e, 'Upgrade your plan to do this.'),
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'See plans', onPress: () => router.push('/(app)/billing') },
      ]
    );
    return;
  }
  toast.show(errorText(e, fallback), 'error');
}

/** A form's error, with a way to the plans when the plan is what refused it. */
export function MarketplaceFormError({ error, fallback }: { error: unknown; fallback: string }) {
  const { spacing } = useTheme();
  if (!error) return null;
  const gate = planGate(error);
  if (!gate) return <FormAlert message={errorText(error, fallback)} />;
  return (
    <View style={{ gap: spacing.sm }}>
      <FormAlert
        tone="warning"
        title={gate === 'limit' ? 'Plan limit reached' : 'Not on your plan'}
        message={errorText(error, 'Upgrade your plan to do this.')}
      />
      <Button label="See plans" variant="secondary" onPress={() => router.push('/(app)/billing')} />
    </View>
  );
}

/** The Free plan's marketplace caps, said once and up front rather than at the moment of refusal. */
export function FreePlanNote() {
  const { colors, spacing, radius } = useTheme();
  return (
    <Pressable
      onPress={() => router.push('/(app)/billing')}
      accessibilityRole="button"
      accessibilityLabel="Free plan: up to 10 properties and 3 live listings. See plans"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: colors.accent,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Sparkles size={18} color={colors.primary} />
      <Text variant="caption" style={{ flex: 1 }}>
        The Free plan markets up to 10 properties with 3 listings live at once. Pro lifts both
        limits.
      </Text>
      <Text variant="caption" color="primary" style={{ fontWeight: '700' }}>
        See plans
      </Text>
    </Pressable>
  );
}

/**
 * Put a listing the server just returned into the cached pages, so a sheet
 * showing it updates at once instead of after the refetch.
 */
export function patchListing(qc: QueryClient, estateId: string, listing: EstateListing) {
  qc.setQueryData<InfiniteData<Paginated<EstateListing>>>(
    marketplaceKeys.listings(estateId),
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((p) => ({
          ...p,
          items: p.items.map((l) => (l.id === listing.id ? listing : l)),
        })),
      }
  );
}
