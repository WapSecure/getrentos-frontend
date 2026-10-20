'use client';

import { Trash2, BookmarkPlus, X } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  IconButton,
} from '@getrentos/ui';

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
  onMoveToWishlist: (wishlistId: string) => void;
}

export const BulkActions = ({
  selectedCount,
  pageCount,
  wishlists,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onMoveToWishlist,
}: BulkActionsProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-max max-w-[calc(100vw-2rem)]">
      <div className="bg-card rounded-xl shadow-2xl border border-border p-2 sm:p-3 flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-sm font-medium text-foreground">{selectedCount} selected</span>
        <div className="w-px h-6 bg-border" aria-hidden="true" />
        <Button variant="ghost" size="sm" onClick={onSelectAll}>
          Select page ({pageCount})
        </Button>
        <div className="w-px h-6 bg-border" aria-hidden="true" />
        <IconButton
          size="sm"
          variant="danger"
          label="Delete selected"
          onClick={onDeleteSelected}
          icon={<Trash2 />}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton size="sm" label="Move to wishlist" icon={<BookmarkPlus />} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-48">
            {wishlists.length === 0 ? (
              <DropdownMenuLabel>No wishlists yet</DropdownMenuLabel>
            ) : (
              wishlists.map((wishlist) => (
                <DropdownMenuItem key={wishlist.id} onSelect={() => onMoveToWishlist(wishlist.id)}>
                  {wishlist.name}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="w-px h-6 bg-border" aria-hidden="true" />
        <IconButton size="sm" label="Clear selection" onClick={onClearSelection} icon={<X />} />
      </div>
    </div>
  );
};
