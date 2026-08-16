'use client';

import { useRouter } from 'next/navigation';
import { Mail, Phone, Clock, Star, Shield, MessageCircle } from 'lucide-react';
import { Button } from '@getrentos/ui';
import type { Property } from '@/types/renter';
import { ROUTES } from '@/lib/constants/auth';

interface PropertyLandlordCardProps {
  property: Property;
}

export const PropertyLandlordCard = ({ property }: PropertyLandlordCardProps) => {
  const router = useRouter();
  const name = property.landlordName || 'GetRentos Landlord';

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Landlord</h3>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-white font-semibold shrink-0">
          {name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-foreground truncate">{name}</p>
            {property.landlordVerified && <Shield className="w-4 h-4 text-green-500 shrink-0" />}
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Star className="w-3 h-3 fill-primary text-primary" />
            <span>
              {property.landlordRating ?? property.rating} ({property.landlordReviews ?? 0} reviews)
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        {property.landlordEmail && (
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{property.landlordEmail}</span>
          </div>
        )}
        {property.landlordPhone && (
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span>{property.landlordPhone}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>{property.landlordResponseRate ?? 90}% response rate</span>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        fullWidth
        className="gap-2 mt-4"
        onClick={() => router.push(ROUTES.RENTER_MESSAGES)}
      >
        <MessageCircle className="w-4 h-4" />
        Message Landlord
      </Button>
    </div>
  );
};
