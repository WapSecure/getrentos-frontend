'use client';

import { useState } from 'react';
import { Trash2, Share2, BookmarkPlus, X } from 'lucide-react';

interface BulkActionsWishlist {
  id: string;
  name: string;
}

interface BulkActionsProps {
  selectedCount: number;
  pageCount: number;
  wishlists: BulkActionsWishlist[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onShareSelected: () => void;
  onMoveToWishlist: (wishlistId: string) => void;
}

export const BulkActions = ({
  selectedCount,
  pageCount,
  wishlists,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onShareSelected,
  onMoveToWishlist,
}: BulkActionsProps) => {
  const [showWishlistMenu, setShowWishlistMenu] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-card rounded-xl shadow-2xl border border-border p-3 flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">{selectedCount} selected</span>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
        <button
          onClick={onSelectAll}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Select page ({pageCount})
        </button>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
        <button
          onClick={onDeleteSelected}
          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
          title="Delete selected"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={onShareSelected}
          className="p-1.5 rounded-lg hover:bg-secondary text-gray-500 transition-colors"
          title="Share selected"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowWishlistMenu(!showWishlistMenu)}
            className="p-1.5 rounded-lg hover:bg-secondary text-gray-500 transition-colors"
            title="Move to wishlist"
          >
            <BookmarkPlus className="w-4 h-4" />
          </button>
          {showWishlistMenu && (
            <div className="absolute bottom-full mb-2 right-0 bg-card rounded-lg shadow-lg border border-border p-2 min-w-40">
              {wishlists.length === 0 ? (
                <p className="px-3 py-1.5 text-xs text-gray-400">No wishlists yet</p>
              ) : (
                wishlists.map((wishlist) => (
                  <button
                    key={wishlist.id}
                    onClick={() => {
                      onMoveToWishlist(wishlist.id);
                      setShowWishlistMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary rounded-lg"
                  >
                    {wishlist.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
        <button
          onClick={onClearSelection}
          className="p-1.5 rounded-lg hover:bg-secondary text-gray-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
