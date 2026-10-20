'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  BellOff,
  Trash2,
  Clock,
  ChevronRight,
  MapPin,
  Bed,
  Wallet,
} from 'lucide-react';
import { Badge, Button, Card, EmptyState, IconButton, useToast } from '@getrentos/ui';
import { renterService, type SavedSearch } from '@/services/renterService';
import { ROUTES } from '@/lib/constants/auth';

export const SavedSearchesList = () => {
  const router = useRouter();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      const res = await renterService.listSavedSearches();
      if (res.success && res.data) setSavedSearches(res.data);
    };
    load();
  }, []);

  const toggleAlerts = async (id: string) => {
    const flip = (prev: SavedSearch[]) =>
      prev.map((s) => (s.id === id ? { ...s, alertsEnabled: !s.alertsEnabled } : s));
    setSavedSearches(flip);
    const res = await renterService.toggleSavedSearchAlerts(id);
    if (res.success && res.data) {
      const updated = res.data;
      setSavedSearches((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } else {
      setSavedSearches(flip);
      toast.error('Search alerts did not update. Please try again.');
    }
  };

  const deleteSearch = async (id: string) => {
    const res = await renterService.deleteSavedSearch(id);
    if (res.success) {
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const runSearch = (search: SavedSearch) => {
    const params = new URLSearchParams();
    if (search.filters.location) params.set('location', search.filters.location);
    if (search.filters.bedrooms) params.set('bedrooms', String(search.filters.bedrooms));
    if (search.filters.maxPrice) params.set('maxPrice', String(search.filters.maxPrice));
    if (search.filters.propertyType) params.set('propertyType', search.filters.propertyType);
    if (search.filters.verifiedOnly) params.set('verifiedOnly', 'true');
    const query = params.toString();
    router.push(query ? `${ROUTES.RENTER_DISCOVER}?${query}` : ROUTES.RENTER_DISCOVER);
  };

  const header = (
    <div className="p-4 border-b border-border">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground">Saved Searches</h3>
          <p className="text-xs text-muted-foreground">
            {savedSearches.length === 0
              ? 'Get notified for new matches'
              : `${savedSearches.length} active searches`}
          </p>
        </div>
        {savedSearches.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            icon={<Search className="w-3 h-3" />}
            href={ROUTES.RENTER_DISCOVER}
          >
            New Search
          </Button>
        )}
      </div>
    </div>
  );

  if (savedSearches.length === 0) {
    return (
      <Card>
        {header}
        <EmptyState
          icon={Search}
          title="No saved searches yet"
          description="Save a search from the Discover page to get alerts"
          size="compact"
          bare
        />
      </Card>
    );
  }

  return (
    <Card>
      {header}

      <div className="divide-y divide-border">
        {savedSearches.map((search) => (
          <div key={search.id} className="p-3">
            <button
              type="button"
              aria-expanded={expandedId === search.id}
              onClick={() => setExpandedId(expandedId === search.id ? null : search.id)}
              className="w-full flex items-center justify-between gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20"
            >
              <div className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <Search className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground">{search.name}</span>
                  {search.newMatches > 0 && (
                    <Badge variant="success">{search.newMatches} new</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                  <span className="text-xs text-muted-foreground">
                    Last run: {new Date(search.lastRun).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <ChevronRight
                aria-hidden="true"
                className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${expandedId === search.id ? 'rotate-90' : ''}`}
              />
            </button>

            <AnimatePresence>
              {expandedId === search.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-border"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {search.filters.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" aria-hidden="true" />
                            {search.filters.location}
                          </span>
                        )}
                        {search.filters.bedrooms && (
                          <span className="inline-flex items-center gap-1">
                            <Bed className="w-3 h-3" aria-hidden="true" />
                            {search.filters.bedrooms} beds
                          </span>
                        )}
                        {search.filters.maxPrice && (
                          <span className="inline-flex items-center gap-1">
                            <Wallet className="w-3 h-3" aria-hidden="true" />
                            Up to ₦{search.filters.maxPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <IconButton
                          size="sm"
                          label={search.alertsEnabled ? 'Disable alerts' : 'Enable alerts'}
                          aria-pressed={search.alertsEnabled}
                          onClick={() => toggleAlerts(search.id)}
                          className={search.alertsEnabled ? 'text-success' : undefined}
                          icon={search.alertsEnabled ? <Bell /> : <BellOff />}
                        />
                        <IconButton
                          size="sm"
                          variant="danger"
                          label={`Delete saved search ${search.name}`}
                          onClick={() => deleteSearch(search.id)}
                          icon={<Trash2 />}
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      fullWidth
                      icon={<Search className="w-3 h-3" />}
                      onClick={() => runSearch(search)}
                    >
                      Run Search Again
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </Card>
  );
};
