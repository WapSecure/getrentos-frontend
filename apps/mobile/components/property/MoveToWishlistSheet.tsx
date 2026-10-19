import { Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react-native';
import { Divider, Text, useTheme } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { wishlistsApi, type Wishlist } from '@/lib/api/wishlists';
import { savedListingsApi, type Paginated, type SavedProperty } from '@/lib/api/properties';
import { useOptimisticMutation } from '@/lib/query/optimistic';

interface Props {
  open: boolean;
  onClose: () => void;
  savedListingId: string | null;
  currentWishlistId: string | null;
}

export function MoveToWishlistSheet({ open, onClose, savedListingId, currentWishlistId }: Props) {
  const { spacing } = useTheme();
  const query = useQuery({
    queryKey: qk.renter.wishlists,
    queryFn: wishlistsApi.list,
    enabled: open,
  });

  // Filing a home is organisational, so it moves at once and the sheet closes;
  // a refusal puts it back and says so.
  const retag = (old: unknown, wishlistId: string | null) => {
    const page = old as Paginated<SavedProperty>;
    return {
      ...page,
      items: page.items.map((item) =>
        item.savedListingId === savedListingId ? { ...item, wishlistId } : item
      ),
    };
  };
  const mutation = useOptimisticMutation({
    mutationFn: (wishlistId: string | null) =>
      savedListingsApi.setWishlist(savedListingId!, wishlistId),
    patches: (wishlistId) => [
      { queryKey: qk.listings.saved, update: (old) => retag(old, wishlistId) },
      { queryKey: qk.listings.savedByWishlist(undefined), update: (old) => retag(old, wishlistId) },
      ...(currentWishlistId && currentWishlistId !== wishlistId
        ? [
            {
              // It leaves the wishlist it was filed under.
              queryKey: qk.listings.savedByWishlist(currentWishlistId),
              update: (old: unknown) => {
                const page = old as Paginated<SavedProperty>;
                return {
                  ...page,
                  items: page.items.filter((item) => item.savedListingId !== savedListingId),
                };
              },
            },
          ]
        : []),
      {
        queryKey: qk.renter.wishlists,
        update: (old) =>
          wishlistId === currentWishlistId
            ? old
            : (old as Wishlist[]).map((w) =>
                w.id === wishlistId
                  ? { ...w, count: w.count + 1 }
                  : w.id === currentWishlistId
                    ? { ...w, count: Math.max(0, w.count - 1) }
                    : w
              ),
      },
    ],
    invalidate: [qk.listings.saved],
    errorMessage: 'Could not move this home.',
  });
  const move = (wishlistId: string | null) => {
    mutation.mutate(wishlistId);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Move to wishlist">
      <View style={{ gap: spacing.xs }}>
        <OptionRow
          label="No wishlist"
          selected={currentWishlistId === null}
          onPress={() => move(null)}
          disabled={mutation.isPending}
        />
        {(query.data ?? []).map((w, i) => (
          <View key={w.id}>
            {i === 0 ? <Divider style={{ marginVertical: spacing.xs }} /> : null}
            <OptionRow
              label={w.name}
              selected={currentWishlistId === w.id}
              onPress={() => move(w.id)}
              disabled={mutation.isPending}
            />
          </View>
        ))}
      </View>
    </Sheet>
  );
}

function OptionRow({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled: boolean;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      style={{
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text variant="callout">{label}</Text>
      {selected ? <Check size={17} color={colors.primary} /> : null}
    </Pressable>
  );
}
