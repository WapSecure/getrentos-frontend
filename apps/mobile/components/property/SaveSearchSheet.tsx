import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { savedSearchesApi } from '@/lib/api/savedSearches';
import type { ListingFilters } from '@/lib/api/properties';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  filters: ListingFilters;
}

export function SaveSearchSheet({ open, onClose, filters }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Save this search">
      {/* Remount on each open so the name field always starts blank. */}
      <SaveSearchForm key={open ? 'open' : 'closed'} onClose={onClose} filters={filters} />
    </Sheet>
  );
}

function SaveSearchForm({ onClose, filters }: Omit<Props, 'open'>) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      savedSearchesApi.create({
        name: name.trim(),
        location: filters.location,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        bedrooms: filters.bedrooms,
        bathrooms: filters.bathrooms,
        propertyType: filters.propertyType,
        verifiedOnly: filters.verifiedOnly,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.savedSearches });
      toast.show('Search saved — we’ll alert you to new matches.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not save this search.', 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        We&apos;ll keep this filter set handy and let you know when new homes match it.
      </Text>
      <TextField
        label="Name"
        placeholder="e.g. Lekki 2-bed under 300k"
        value={name}
        onChangeText={setName}
        returnKeyType="done"
      />
      <Button
        label="Save search"
        loading={mutation.isPending}
        disabled={!name.trim()}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
