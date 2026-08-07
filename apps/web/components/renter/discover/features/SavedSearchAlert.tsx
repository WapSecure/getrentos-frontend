'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SavedSearch {
  id: string;
  name: string;
  filters: unknown;
  createdAt: string;
}

interface SavedSearchAlertProps {
  currentFilters: unknown;
  onSave: (name: string, filters: unknown) => void;
}

export const SavedSearchAlert = ({ currentFilters, onSave }: SavedSearchAlertProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('saved_searches');
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSavedSearches(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    if (!searchName.trim()) return;

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName,
      filters: currentFilters,
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);
    localStorage.setItem('saved_searches', JSON.stringify(updated));
    setSearchName('');
    setIsOpen(false);
    setShowAlert(true);
    onSave(searchName, currentFilters);

    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleDelete = (id: string) => {
    const updated = savedSearches.filter((s) => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('saved_searches', JSON.stringify(updated));
  };

  const handleApplySearch = (filters: unknown) => {
    // Apply saved filters to parent component
    console.log('Applying saved filters:', filters);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm text-[#c4a747] hover:text-[#a88d3a] transition-colors"
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
            className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-[#1a2a2f] rounded-xl shadow-lg border border-gray-200 dark:border-white/10 z-50"
          >
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Save this search</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Get notified when new properties match your criteria
              </p>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="e.g., 2-bed in Ikeja under ₦200k"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747] mb-3"
              />
              <Button size="sm" fullWidth onClick={handleSave} disabled={!searchName.trim()}>
                <Save className="w-3 h-3 mr-1" />
                Save Search
              </Button>
            </div>

            {savedSearches.length > 0 && (
              <div className="border-t border-gray-200 dark:border-white/10 p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your saved searches
                </h4>
                <div className="space-y-2">
                  {savedSearches.map((search) => (
                    <div key={search.id} className="flex items-center justify-between text-sm">
                      <button
                        onClick={() => handleApplySearch(search.filters)}
                        className="text-gray-600 dark:text-gray-400 hover:text-[#c4a747] text-left flex-1"
                      >
                        {search.name}
                      </button>
                      <button
                        onClick={() => handleDelete(search.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Alert */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg"
          >
            <Check className="w-4 h-4" />
            Search saved! We&apos;ll notify you about new matches.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
