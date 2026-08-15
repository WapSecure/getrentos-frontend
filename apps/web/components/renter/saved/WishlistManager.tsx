'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, FolderPlus, Trash2, MoreHorizontal, Check, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { renterService, type Wishlist } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { Toast, ToastVariant } from '@/components/ui/Toast';

interface WishlistManagerProps {
  wishlists: Wishlist[];
  selectedWishlist: string;
  setSelectedWishlist: (id: string) => void;
}

export const WishlistManager = ({
  wishlists,
  selectedWishlist,
  setSelectedWishlist,
}: WishlistManagerProps) => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: renterKeys.wishlists });

  const createMutation = useMutation({
    mutationFn: (name: string) => unwrap(renterService.createWishlist(name)),
    onSuccess: () => {
      invalidate();
      setNewWishlistName('');
      setIsCreating(false);
      setToast({ message: 'Wishlist created', variant: 'success' });
    },
    onError: (err: Error) =>
      setToast({ message: err.message || 'Failed to create wishlist', variant: 'error' }),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      unwrap(renterService.renameWishlist(id, name)),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      setEditName('');
    },
    onError: (err: Error) =>
      setToast({ message: err.message || 'Failed to rename wishlist', variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.deleteWishlist(id)),
    onSuccess: () => {
      invalidate();
      if (selectedWishlist !== 'all') setSelectedWishlist('all');
    },
    onError: (err: Error) =>
      setToast({ message: err.message || 'Failed to delete wishlist', variant: 'error' }),
  });

  const handleCreateWishlist = () => {
    if (!newWishlistName.trim()) return;
    createMutation.mutate(newWishlistName.trim());
  };

  const handleDeleteWishlist = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleEditWishlist = (id: string) => {
    const wishlist = wishlists.find((w) => w.id === id);
    if (wishlist) {
      setEditName(wishlist.name);
      setEditingId(id);
    }
  };

  const handleSaveEdit = () => {
    if (!editName.trim() || !editingId) return;
    renameMutation.mutate({ id: editingId, name: editName.trim() });
  };

  const totalProperties = wishlists.reduce((sum, w) => sum + w.count, 0);

  return (
    <>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-foreground">Wishlists</h3>
              <p className="text-xs text-gray-500">Organize your saved properties</p>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-2">
          <div
            onClick={() => setSelectedWishlist('all')}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
              selectedWishlist === 'all' ? 'bg-accent text-primary' : 'hover:bg-secondary'
            }`}
          >
            <div className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4" />
              <span className="text-sm font-medium">All Properties</span>
            </div>
            <span className="text-xs text-gray-500">{totalProperties}</span>
          </div>

          {wishlists.map((wishlist) => (
            <div key={wishlist.id} className="relative">
              {editingId === wishlist.id ? (
                <div className="p-2 flex gap-2">
                  <LegacyInput
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveEdit}
                    className="p-1 rounded-lg bg-green-500 text-white"
                  >
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
                      ? 'bg-accent text-primary'
                      : 'hover:bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4" />
                    <span className="text-sm">{wishlist.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{wishlist.count}</span>
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

          <AnimatePresence>
            {isCreating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 p-2 border-t border-border"
              >
                <LegacyInput
                  type="text"
                  value={newWishlistName}
                  onChange={(e) => setNewWishlistName(e.target.value)}
                  placeholder="Wishlist name"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreateWishlist}
                    disabled={!newWishlistName.trim() || createMutation.isPending}
                    isLoading={createMutation.isPending}
                  >
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
    </>
  );
};
