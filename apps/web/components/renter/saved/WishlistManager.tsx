'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, FolderPlus, Trash2, Pencil, Check, Bookmark } from 'lucide-react';
import { Button, Card, IconButton, Input, useOptimisticMutation, useToast } from '@getrentos/ui';
import { renterService, type Wishlist } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

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
  const toast = useToast();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: renterKeys.wishlists });

  const createMutation = useMutation({
    mutationFn: (name: string) => unwrap(renterService.createWishlist(name)),
    onSuccess: () => {
      invalidate();
      setNewWishlistName('');
      setIsCreating(false);
      toast.success('Wishlist created');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to create wishlist'),
  });

  const renameMutation = useOptimisticMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      unwrap(renterService.renameWishlist(id, name)),
    patches: ({ id, name }) => [
      {
        queryKey: renterKeys.wishlists,
        update: (old) => (old as Wishlist[]).map((w) => (w.id === id ? { ...w, name } : w)),
      },
    ],
    errorMessage: 'Failed to rename wishlist',
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.deleteWishlist(id)),
    onSuccess: () => {
      invalidate();
      if (selectedWishlist !== 'all') setSelectedWishlist('all');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to delete wishlist'),
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
    setEditingId(null);
    setEditName('');
  };

  const totalProperties = wishlists.reduce((sum, w) => sum + w.count, 0);

  return (
    <Card>
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground">Wishlists</h3>
            <p className="text-xs text-muted-foreground">Organize your saved properties</p>
          </div>
          <IconButton
            size="sm"
            label="Create wishlist"
            onClick={() => setIsCreating(true)}
            icon={<Plus />}
          />
        </div>
      </div>

      <div className="p-2">
        <button
          type="button"
          aria-pressed={selectedWishlist === 'all'}
          onClick={() => setSelectedWishlist('all')}
          className={`w-full flex min-w-0 items-center justify-between gap-2 p-3 rounded-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 ${
            selectedWishlist === 'all' ? 'bg-accent text-primary' : 'hover:bg-secondary'
          }`}
        >
          <span className="flex items-center gap-2">
            <FolderPlus className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-medium">All Properties</span>
          </span>
          <span className="text-xs text-muted-foreground">{totalProperties}</span>
        </button>

        {wishlists.map((wishlist) => (
          <div key={wishlist.id} className="relative">
            {editingId === wishlist.id ? (
              <div className="p-2 flex items-center gap-2">
                <Input
                  type="text"
                  aria-label="Wishlist name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  controlSize="sm"
                  className="min-w-0 flex-1"
                  autoFocus
                />
                <IconButton
                  size="sm"
                  variant="secondary"
                  label="Save wishlist name"
                  onClick={handleSaveEdit}
                  icon={<Check className="text-success" />}
                />
                <IconButton
                  size="sm"
                  label="Cancel renaming"
                  onClick={() => setEditingId(null)}
                  icon={<X />}
                />
              </div>
            ) : (
              <div className="group flex items-center gap-1">
                <button
                  type="button"
                  aria-pressed={selectedWishlist === wishlist.id}
                  onClick={() => setSelectedWishlist(wishlist.id)}
                  className={`flex min-w-0 flex-1 items-center justify-between gap-2 p-3 rounded-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 ${
                    selectedWishlist === wishlist.id
                      ? 'bg-accent text-primary'
                      : 'hover:bg-secondary'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Bookmark className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate text-sm">{wishlist.name}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{wishlist.count}</span>
                </button>
                <div className="flex gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
                  <IconButton
                    size="sm"
                    label={`Rename ${wishlist.name}`}
                    onClick={() => handleEditWishlist(wishlist.id)}
                    icon={<Pencil />}
                  />
                  <IconButton
                    size="sm"
                    variant="danger"
                    label={`Delete ${wishlist.name}`}
                    onClick={() => handleDeleteWishlist(wishlist.id)}
                    isLoading={deleteMutation.isPending && deleteMutation.variables === wishlist.id}
                    icon={<Trash2 />}
                  />
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
              className="mt-2 p-2 border-t border-border space-y-2"
            >
              <Input
                type="text"
                aria-label="Wishlist name"
                value={newWishlistName}
                onChange={(e) => setNewWishlistName(e.target.value)}
                placeholder="Wishlist name"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateWishlist}
                  disabled={!newWishlistName.trim()}
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
    </Card>
  );
};
