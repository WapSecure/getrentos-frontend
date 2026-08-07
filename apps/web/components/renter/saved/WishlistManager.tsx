'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, FolderPlus, Trash2, MoreHorizontal, Check, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Wishlist {
  id: string;
  name: string;
  propertyIds: string[];
}

interface WishlistManagerProps {
  wishlists: Wishlist[];
  setWishlists: (wishlists: Wishlist[]) => void;
  selectedWishlist: string;
  setSelectedWishlist: (id: string) => void;
}

export const WishlistManager = ({
  wishlists,
  setWishlists,
  selectedWishlist,
  setSelectedWishlist,
}: WishlistManagerProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreateWishlist = () => {
    if (!newWishlistName.trim()) return;
    const newWishlist = {
      id: Date.now().toString(),
      name: newWishlistName,
      propertyIds: [],
    };
    setWishlists([...wishlists, newWishlist]);
    setNewWishlistName('');
    setIsCreating(false);
  };

  const handleDeleteWishlist = (id: string) => {
    const updated = wishlists.filter((w) => w.id !== id);
    setWishlists(updated);
    if (selectedWishlist === id) {
      setSelectedWishlist('all');
    }
  };

  const handleEditWishlist = (id: string) => {
    const wishlist = wishlists.find((w) => w.id === id);
    if (wishlist) {
      setEditName(wishlist.name);
      setEditingId(id);
    }
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) return;
    const updated = wishlists.map((w) => (w.id === editingId ? { ...w, name: editName } : w));
    setWishlists(updated);
    setEditingId(null);
    setEditName('');
  };

  const totalProperties = wishlists.reduce((sum, w) => sum + w.propertyIds.length, 0);

  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Wishlists</h3>
            <p className="text-xs text-gray-500">Organize your saved properties</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-2">
        {/* All Properties Option - using div with onClick instead of button */}
        <div
          onClick={() => setSelectedWishlist('all')}
          className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
            selectedWishlist === 'all'
              ? 'bg-[#c4a747]/10 text-[#c4a747]'
              : 'hover:bg-gray-50 dark:hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2">
            <FolderPlus className="w-4 h-4" />
            <span className="text-sm font-medium">All Properties</span>
          </div>
          <span className="text-xs text-gray-500">{totalProperties}</span>
        </div>

        {/* Individual Wishlists */}
        {wishlists.map((wishlist) => (
          <div key={wishlist.id} className="relative">
            {editingId === wishlist.id ? (
              <div className="p-2 flex gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                  autoFocus
                />
                <button onClick={handleSaveEdit} className="p-1 rounded-lg bg-green-500 text-white">
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-1 rounded-lg bg-gray-500 text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => setSelectedWishlist(wishlist.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer group ${
                  selectedWishlist === wishlist.id
                    ? 'bg-[#c4a747]/10 text-[#c4a747]'
                    : 'hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4" />
                  <span className="text-sm">{wishlist.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{wishlist.propertyIds.length}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditWishlist(wishlist.id);
                      }}
                      className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWishlist(wishlist.id);
                      }}
                      className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Create Wishlist Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 p-2 border-t border-gray-200 dark:border-white/10"
            >
              <input
                type="text"
                value={newWishlistName}
                onChange={(e) => setNewWishlistName(e.target.value)}
                placeholder="Wishlist name"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] focus:outline-none focus:ring-2 focus:ring-[#c4a747] mb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateWishlist} disabled={!newWishlistName.trim()}>
                  Create
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
