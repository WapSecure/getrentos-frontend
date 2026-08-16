'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, BellOff, Trash2, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { renterService, type SavedSearch } from '@/services/renterService';
import { ROUTES } from '@/lib/constants/auth';

export const SavedSearchesList = () => {
  const router = useRouter();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await renterService.listSavedSearches();
      if (res.success && res.data) setSavedSearches(res.data);
    };
    load();
  }, []);

  const toggleAlerts = async (id: string) => {
    const res = await renterService.toggleSavedSearchAlerts(id);
    if (res.success && res.data) {
      const updated = res.data;
      setSavedSearches((prev) => prev.map((s) => (s.id === id ? updated : s)));
    }
  };

  const deleteSearch = async (id: string) => {
    const res = await renterService.deleteSavedSearch(id);
    if (res.success) {
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    }
  };

  if (savedSearches.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Saved Searches</h3>
          <p className="text-xs text-gray-500">Get notified for new matches</p>
        </div>
        <div className="p-8 text-center">
          <Search className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No saved searches yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Save a search from the Discover page to get alerts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-foreground">Saved Searches</h3>
            <p className="text-xs text-gray-500">{savedSearches.length} active searches</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1"
            onClick={() => router.push(ROUTES.RENTER_DISCOVER)}
          >
            <Search className="w-3 h-3" />
            New Search
          </Button>
        </div>
      </div>

      <div className="divide-y divide-border">
        {savedSearches.map((search) => (
          <div key={search.id} className="p-3">
            <button
              onClick={() => setExpandedId(expandedId === search.id ? null : search.id)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <Search className="w-3 h-3 text-gray-400" />
                  <span className="text-sm font-medium text-foreground">{search.name}</span>
                  {search.newMatches > 0 && (
                    <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-600 text-xs rounded-full">
                      {search.newMatches} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    Last run: {new Date(search.lastRun).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === search.id ? 'rotate-90' : ''}`}
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
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4 text-xs text-gray-500">
                        {search.filters.location && <span>📍 {search.filters.location}</span>}
                        {search.filters.bedrooms && <span>🛏️ {search.filters.bedrooms} beds</span>}
                        {search.filters.maxPrice && (
                          <span>💰 Up to ₦{search.filters.maxPrice.toLocaleString()}</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleAlerts(search.id)}
                          className={`p-1 rounded ${search.alertsEnabled ? 'text-green-600' : 'text-gray-400'}`}
                          title={search.alertsEnabled ? 'Disable alerts' : 'Enable alerts'}
                        >
                          {search.alertsEnabled ? (
                            <Bell className="w-3 h-3" />
                          ) : (
                            <BellOff className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteSearch(search.id)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      fullWidth
                      className="gap-1"
                      onClick={() => router.push(ROUTES.RENTER_DISCOVER)}
                    >
                      <Search className="w-3 h-3" />
                      Run Search Again
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};
