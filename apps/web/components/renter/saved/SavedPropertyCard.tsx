'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Bed,
  Bath,
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
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  type BadgeVariant,
} from '@getrentos/ui';
import { buildRoute } from '@/lib/constants/auth';
import { renterService, type SavedListingItem, type Wishlist } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { pluralize } from '@/lib/format';
import { AddNoteModal } from './AddNoteModal';
import { SharePropertyModal } from './SharePropertyModal';
import { PropertyPhoto } from '@/components/renter/shared/PropertyPhoto';

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
  const router = useRouter();
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

  const formatPrice = () => {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${formatter.format(property.price)}${
      property.period === 'month' ? '/mo' : property.period === 'year' ? '/yr' : '/wk'
    }`;
  };

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
        return { label: 'Under Review', variant: 'info' };
      case 'approved':
        return { label: 'Approved!', variant: 'success' };
      case 'rejected':
        return { label: 'Not Selected', variant: 'danger' };
      default:
        return null;
    }
  };

  const statusConfig = property.applicationStatus
    ? getStatusConfig(property.applicationStatus)
    : null;

  const selectButton = onSelect && (
    <button
      type="button"
      role="checkbox"
      aria-checked={!!isSelected}
      aria-label={`Select ${property.title}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className="absolute top-2 left-2 z-20 p-1 bg-card/90 rounded-full hover:bg-card transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30"
    >
      {isSelected ? (
        <CheckSquare className="w-4 h-4 text-primary" aria-hidden="true" />
      ) : (
        <Square className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
      )}
    </button>
  );

  const actionsMenu = (includeNote: boolean) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton
          variant="outline"
          size="sm"
          label={`More actions for ${property.title}`}
          icon={<MoreHorizontal />}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {includeNote && (
          <DropdownMenuItem onSelect={() => setShowNoteModal(true)}>
            <BookmarkPlus className="w-3 h-3" aria-hidden="true" />
            Add Note
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => setShowShareModal(true)}>
          <ExternalLink className="w-3 h-3" aria-hidden="true" />
          Share Property
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
      <SharePropertyModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        property={property}
      />
    </>
  );

  // List View
  if (viewMode === 'list') {
    return (
      <>
        <Card hover>
          <div className="flex flex-col sm:flex-row">
            <PropertyPhoto
              src={property.image}
              alt={property.title}
              className="w-full sm:w-48 h-40 shrink-0"
            >
              {selectButton}

              {statusConfig && (
                <Badge variant={statusConfig.variant} className="absolute bottom-2 left-2 z-10">
                  {statusConfig.label}
                </Badge>
              )}
            </PropertyPhoto>

            <div className="min-w-0 flex-1 p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                    {property.title}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span className="text-xs">{property.location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{formatPrice()}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 fill-primary text-primary" />
                    <span className="text-xs text-muted-foreground">{property.rating}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Bed className="w-3 h-3" />
                  <span>{pluralize(property.bedrooms, 'bed')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bath className="w-3 h-3" />
                  <span>{pluralize(property.bathrooms, 'bath')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Square className="w-3 h-3" />
                  <span>{property.size} sqm</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Saved {formatTimeAgo(property.savedAt)}</span>
                </div>
              </div>

              {note && (
                <div className="mt-2 flex items-start gap-1.5 p-2 bg-secondary/60 rounded-lg text-xs text-muted-foreground">
                  <StickyNote className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0">{note}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => router.push(buildRoute.renterPropertyDetail(property.id))}
                >
                  View Details
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowNoteModal(true)}>
                  Add Note
                </Button>
                {actionsMenu(false)}
              </div>
            </div>
          </div>
        </Card>
        {modals}
      </>
    );
  }

  return (
    <>
      <Card hover className="group relative">
        <PropertyPhoto src={property.image} alt={property.title} className="h-48">
          {selectButton}

          <IconButton
            size="sm"
            label="Remove from saved"
            onClick={() => onRemove(property.id)}
            className="absolute top-2 right-2 z-10 rounded-full bg-card/90 hover:bg-card"
            icon={<Heart className="text-destructive fill-destructive" />}
          />

          <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-lg text-sm font-bold z-10">
            {formatPrice()}
          </div>

          {statusConfig && (
            <Badge
              variant={statusConfig.variant}
              className={`absolute top-2 z-10 ${onSelect ? 'left-11' : 'left-2'}`}
            >
              {statusConfig.label}
            </Badge>
          )}
        </PropertyPhoto>

        <div className="p-4">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {property.title}
          </h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3" />
            <span className="text-xs line-clamp-1">{property.location}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Bed className="w-3 h-3" />
              <span>{pluralize(property.bedrooms, 'bed')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="w-3 h-3" />
              <span>{pluralize(property.bathrooms, 'bath')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Square className="w-3 h-3" />
              <span>{property.size} sqm</span>
            </div>
          </div>

          {note && (
            <div className="mt-2 flex items-start gap-1.5 p-2 bg-secondary/60 rounded-lg text-xs text-muted-foreground">
              <StickyNote className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 line-clamp-2">{note}</span>
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="primary"
              onClick={() => router.push(buildRoute.renterPropertyDetail(property.id))}
              className="flex-1"
            >
              View Details
            </Button>
            {actionsMenu(true)}
          </div>
        </div>
      </Card>
      {modals}
    </>
  );
};
