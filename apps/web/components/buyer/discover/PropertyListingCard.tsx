'use client';

import { motion } from 'framer-motion';
import { MapPin, BedDouble, Bath, Ruler, Heart, ShieldCheck, Building2 } from 'lucide-react';
import { Badge, Button, IconButton } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import type { BuyerPropertyListing } from '@/types/buyer';

interface PropertyListingCardProps {
  listing: BuyerPropertyListing;
  isSaved: boolean;
  onToggleSave: () => void;
  onViewDetails: () => void;
  delay?: number;
}

export const PropertyListingCard = ({
  listing,
  isSaved,
  onToggleSave,
  onViewDetails,
  delay = 0,
}: PropertyListingCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={onViewDetails}
    >
      <div className="relative h-44 bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <Building2 className="w-12 h-12 text-muted-foreground" />
        </div>
        {listing.ownerVerified && (
          <Badge
            variant="success"
            icon={<ShieldCheck className="w-3 h-3" />}
            className="absolute top-3 left-3"
          >
            Verified Owner
          </Badge>
        )}
        <IconButton
          label={isSaved ? 'Remove from saved' : 'Save property'}
          aria-pressed={isSaved}
          size="sm"
          icon={
            <Heart className={isSaved ? 'text-destructive fill-destructive' : 'text-foreground'} />
          }
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm hover:bg-card"
        />
        <div className="absolute bottom-3 left-3 bg-primary text-primary-foreground px-2.5 py-1 rounded-lg text-sm font-bold">
          {formatCurrency(listing.askingPrice, { compact: true })}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate">{listing.title}</h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <MapPin className="w-3 h-3" />
          {listing.city}, {listing.state}
        </p>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
          {listing.bedrooms !== undefined && (
            <span className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" />
              {listing.bedrooms}
            </span>
          )}
          {listing.bathrooms !== undefined && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />
              {listing.bathrooms}
            </span>
          )}
          {listing.propertySize !== undefined && (
            <span className="flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5" />
              {listing.propertySize} sqm
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          fullWidth
          className="mt-4"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
        >
          View Details
        </Button>
      </div>
    </motion.div>
  );
};
