'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Save } from 'lucide-react';
import { Button, IconButton, Input, useOptimisticMutation, useToast } from '@getrentos/ui';
import { renterService, type SavedSearch } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

export interface DiscoverFiltersState {
  location: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  propertyType: string;
  verifiedOnly: boolean;
  search: string;
}

interface SavedSearchAlertProps {
  currentFilters: DiscoverFiltersState;
  onApplyFilters?: (filters: DiscoverFiltersState) => void;
}

export const SavedSearchAlert = ({ currentFilters, onApplyFilters }: SavedSearchAlertProps) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const toast = useToast();

  const { data: savedSearches = [] } = useQuery({
    queryKey: renterKeys.savedSearches,
    queryFn: () => unwrap(renterService.listSavedSearches()),
  });

  const saveMutation = useMutation({
    mutationFn: (data: { name: string; filters: DiscoverFiltersState }) => {
      const f = data.filters;
      return unwrap(
        renterService.createSavedSearch({
          name: data.name,
          location: f.location || undefined,
          minPrice: f.minPrice ? Number(f.minPrice) : undefined,
          maxPrice: f.maxPrice ? Number(f.maxPrice) : undefined,
          bedrooms: f.bedrooms ? Number(f.bedrooms) : undefined,
          bathrooms: f.bathrooms ? Number(f.bathrooms) : undefined,
          propertyType: f.propertyType || undefined,
          verifiedOnly: f.verifiedOnly || undefined,
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.savedSearches });
      setSearchName('');
      setIsOpen(false);
      toast.success("Search saved! We'll notify you about new matches.");
    },
  });

  const deleteMutation = useOptimisticMutation({
    mutationFn: (id: string) => unwrap(renterService.deleteSavedSearch(id)),
    patches: (id) => [
      {
        queryKey: renterKeys.savedSearches,
        update: (old) =>
          Array.isArray(old) ? (old as SavedSearch[]).filter((search) => search.id !== id) : old,
      },
    ],
    invalidate: [renterKeys.savedSearches],
    errorMessage: 'That saved search could not be deleted. Please try again.',
  });

  const handleSave = () => {
    if (!searchName.trim()) return;
    saveMutation.mutate({ name: searchName.trim(), filters: currentFilters });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleApplySearch = (search: SavedSearch) => {
    if (onApplyFilters && search.filters) {
      const f = search.filters as {
        location?: string;
        minPrice?: number;
        maxPrice?: number;
        bedrooms?: number;
        bathrooms?: number;
        propertyType?: string;
        verifiedOnly?: boolean;
      };
      onApplyFilters({
        location: f.location ?? '',
        minPrice: f.minPrice ? String(f.minPrice) : '',
        maxPrice: f.maxPrice ? String(f.maxPrice) : '',
        bedrooms: f.bedrooms ? String(f.bedrooms) : '',
        bathrooms: f.bathrooms ? String(f.bathrooms) : '',
        propertyType: f.propertyType ?? '',
        verifiedOnly: f.verifiedOnly ?? false,
        search: '',
      });
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex items-center gap-1 text-sm text-primary hover:text-primary-hover transition-colors"
      >
        <Bell className="w-4 h-4" />
        Save this search
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-card rounded-xl shadow-lg border border-border z-50"
          >
            <div className="p-4">
              <h3 className="font-semibold text-foreground mb-2">Save this search</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Get notified when new properties match your criteria
              </p>
              <Input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                aria-label="Search name"
                placeholder="e.g., 2-bed in Ikeja under ₦200k"
                className="mb-3"
              />
              <Button
                size="sm"
                fullWidth
                onClick={handleSave}
                disabled={!searchName.trim()}
                isLoading={saveMutation.isPending}
                icon={<Save className="w-3 h-3" />}
              >
                Save Search
              </Button>
            </div>

            {savedSearches.length > 0 && (
              <div className="border-t border-border p-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Your saved searches</h4>
                <div className="space-y-2">
                  {savedSearches.map((search) => (
                    <div
                      key={search.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <button
                        type="button"
                        onClick={() => handleApplySearch(search)}
                        className="min-w-0 text-muted-foreground hover:text-primary text-left flex-1"
                      >
                        {search.name}
                      </button>
                      <IconButton
                        label={`Delete saved search ${search.name}`}
                        icon={<X />}
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(search.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
