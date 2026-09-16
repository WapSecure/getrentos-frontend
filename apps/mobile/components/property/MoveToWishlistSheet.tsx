import { Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react-native';
import { Divider, Text, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { wishlistsApi } from '@/lib/api/wishlists';
import { savedListingsApi } from '@/lib/api/properties';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  savedListingId: string | null;
  currentWishlistId: string | null;
}

export function MoveToWishlistSheet({ open, onClose, savedListingId, currentWishlistId }: Props) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const query = useQuery({
    queryKey: qk.renter.wishlists,
    queryFn: wishlistsApi.list,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (wishlistId: string | null) =>
      savedListingsApi.setWishlist(savedListingId!, wishlistId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.listings.saved });
      qc.invalidateQueries({ queryKey: qk.renter.wishlists });
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not move this home.', 'error'),
  });

  return (
    <Sheet open={open} onClose={onClose} title="Move to wishlist">
      <View style={{ gap: spacing.xs }}>
        <OptionRow
          label="No wishlist"
          selected={currentWishlistId === null}
          onPress={() => mutation.mutate(null)}
          disabled={mutation.isPending}
        />
        {(query.data ?? []).map((w, i) => (
          <View key={w.id}>
            {i === 0 ? <Divider style={{ marginVertical: spacing.xs }} /> : null}
            <OptionRow
              label={w.name}
              selected={currentWishlistId === w.id}
              onPress={() => mutation.mutate(w.id)}
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
      style={{
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
