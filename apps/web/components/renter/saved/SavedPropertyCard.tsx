'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Square,
  Heart,
  Star,
  Trash2,
  BookmarkPlus,
  Clock,
  ExternalLink,
  MoreHorizontal,
  CheckSquare,
  StickyNote,
} from '@sureground/icons';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  ListingCard,
  ListingCardAction,
  type BadgeVariant,
} from '@sureground/ui';
import { buildRoute } from '@/lib/constants/auth';
import { renterService, type SavedListingItem, type Wishlist } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { AddNoteModal } from './AddNoteModal';
import { ShareDialog } from '@/components/shared/share/ShareDialog';

interface SavedPropertyCardProps {
  property: SavedListingItem;
  viewMode: 'grid' | 'list';
  onRemove: (id: string) => void;
  onMoveToWishlist: (propertyId: string, wishlistId: string) => void;
  wishlists: Wishlist[];
  isSelected?: boolean;
  onSelect?: () => void;
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const diffHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) === 1 ? '' : 's'} ago`;
};

export const SavedPropertyCard = ({
  property,
  viewMode,
  onRemove,
  onMoveToWishlist,
  wishlists,
  isSelected,
  onSelect,
}: SavedPropertyCardProps) => {
  const queryClient = useQueryClient();
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [note, setNote] = useState(property.note ?? '');

  const noteMutation = useMutation({
    mutationFn: (newNote: string) =>
      unwrap(renterService.setSavedListingNote(property.savedListingId, newNote || null)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.savedListings });
    },
  });

  const handleSaveNote = async (newNote: string) => {
    try {
      await noteMutation.mutateAsync(newNote);
      setNote(newNote);
      return true;
    } catch {
      return false;
    }
  };

  const handleMoveToWishlist = (wishlistId: string) => {
    onMoveToWishlist(property.id, wishlistId);
  };

  const getStatusConfig = (status: string): { label: string; variant: BadgeVariant } | null => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', variant: 'warning' };
      case 'under_review':
        return { label: 'Under review', variant: 'info' };
      case 'approved':
        return { label: 'Approved!', variant: 'success' };
      case 'rejected':
        return { label: 'Not selected', variant: 'danger' };
      default:
        return null;
    }
  };

  const statusConfig = property.applicationStatus
    ? getStatusConfig(property.applicationStatus)
    : null;

  const actionsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton
          variant="outline"
          className="h-11 w-11 sm:h-10 sm:w-10"
          label={`More actions for ${property.title}`}
          icon={<MoreHorizontal />}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={() => setShowShareModal(true)}>
          <ExternalLink className="w-3 h-3" aria-hidden="true" />
          Share property
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Move to wishlist
        </DropdownMenuLabel>
        {wishlists.map((list) => (
          <DropdownMenuItem key={list.id} onSelect={() => handleMoveToWishlist(list.id)}>
            <BookmarkPlus className="w-3 h-3" aria-hidden="true" />
            {list.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onRemove(property.id)} className="text-destructive">
          <Trash2 className="w-3 h-3" aria-hidden="true" />
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const modals = (
    <>
      <AddNoteModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onSave={handleSaveNote}
        initialNote={note}
        propertyTitle={property.title}
      />
      <ShareDialog
        open={showShareModal}
        onOpenChange={setShowShareModal}
        title={property.title}
        path={`/renter/properties/${property.id}`}
      />
    </>
  );

  return (
    <>
      <ListingCard
        variant={viewMode === 'list' ? 'compact' : 'grid'}
        href={buildRoute.renterPropertyDetail(property.id)}
        title={property.title}
        location={property.location}
        price={property.price}
        priceUnit={property.period}
        image={property.image}
        imageAlt={property.title}
        selected={isSelected}
        status={statusConfig?.label}
        statusVariant={statusConfig?.variant}
        facts={{ beds: property.bedrooms, baths: property.bathrooms, size: property.size }}
        actions={
          <>
            {onSelect && (
              <ListingCardAction
                role="checkbox"
                aria-checked={!!isSelected}
                label={`Select ${property.title}`}
                onClick={onSelect}
                icon={isSelected ? <CheckSquare className="text-primary" /> : <Square />}
              />
            )}
            <ListingCardAction
              label={`Remove ${property.title} from saved`}
              aria-pressed
              onClick={() => onRemove(property.id)}
              icon={<Heart fill="currentColor" />}
            />
          </>
        }
        meta={
          <div className="space-y-2">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Saved {formatTimeAgo(property.savedAt).toLowerCase()}
              </span>
              {property.rating > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
                  <span className="data-value text-foreground">{property.rating}</span>
                  <span className="sr-only">rating</span>
                </span>
              )}
            </p>
            {note && (
              <p className="flex items-start gap-1.5 rounded-lg bg-secondary/60 p-2">
                <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 line-clamp-2">{note}</span>
              </p>
            )}
          </div>
        }
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<BookmarkPlus className="h-4 w-4" aria-hidden="true" />}
              onClick={() => setShowNoteModal(true)}
            >
              {note ? 'Edit note' : 'Add note'}
            </Button>
            {actionsMenu}
          </div>
        }
      />
      {modals}
    </>
  );
};
