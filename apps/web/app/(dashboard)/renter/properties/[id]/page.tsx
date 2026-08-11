'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Square,
  Star,
  Shield,
  Heart,
  GitCompare,
  Calendar,
  Check,
  Search,
  Zap,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Toast, ToastVariant } from '@/components/ui/Toast';
import { VirtualTourViewerModal } from '@/components/renter/discover/features/VirtualTourViewerModal';
import { PropertyGallery } from '@/components/renter/property-detail/PropertyGallery';
import { PropertyLandlordCard } from '@/components/renter/property-detail/PropertyLandlordCard';
import { PropertyReviews } from '@/components/renter/property-detail/PropertyReviews';
import { SimilarProperties } from '@/components/renter/property-detail/SimilarProperties';
import { getPropertyById, trackRecentlyViewed } from '@/lib/mockProperties';
import { formatPrice } from '@/types/renter';
import type { TourModalMode } from '@/types/virtual-tour';

const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const property = useMemo(() => getPropertyById(params.id), [params.id]);

  const [isSaved, setIsSaved] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourMode, setTourMode] = useState<TourModalMode>('tour');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  useEffect(() => {
    if (!property) return;
    trackRecentlyViewed(property);

    const saved = localStorage.getItem('renter_saved_properties');
    const savedIds: string[] = saved ? JSON.parse(saved) : [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSaved(savedIds.includes(property.id));
  }, [property]);

  const showToast = (message: string, variant: ToastVariant) => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 3000);
  };

  if (!property) {
    return (
      <EmptyState
        icon={Search}
        title="Property not found"
        description="This listing may have been removed or the link is incorrect."
        action={
          <Button variant="primary" onClick={() => router.push('/renter/discover')}>
            Back to Discover
          </Button>
        }
      />
    );
  }

  const handleToggleSave = () => {
    const saved = localStorage.getItem('renter_saved_properties');
    let savedIds: string[] = saved ? JSON.parse(saved) : [];

    if (savedIds.includes(property.id)) {
      savedIds = savedIds.filter((id) => id !== property.id);
      showToast('Property removed from saved', 'info');
    } else {
      savedIds.push(property.id);
      showToast('Property saved successfully!', 'success');
    }

    localStorage.setItem('renter_saved_properties', JSON.stringify(savedIds));
    setIsSaved(!isSaved);
  };

  const handleCompare = () => {
    showToast('Added to comparison — open Discover to view your comparison list', 'info');
  };

  const openTour = (mode: TourModalMode) => {
    setTourMode(mode);
    setTourOpen(true);
  };

  return (
    <>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}

      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PropertyGallery
            hasVirtualTour={property.hasVirtualTour || false}
            onOpenTour={() => openTour('tour')}
          />

          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-foreground">{property.title}</h1>
                  {property.verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                      <Shield className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{property.location}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(property.price, property.period)}
                </p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span className="text-sm text-foreground">{property.rating}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Bed className="w-4 h-4" />
                <span>
                  {property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bath className="w-4 h-4" />
                <span>
                  {property.bathrooms} {property.bathrooms === 1 ? 'bath' : 'baths'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Square className="w-4 h-4" />
                <span>{property.size} sqft</span>
              </div>
              {property.availableFrom && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Available {property.availableFrom}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => router.push(`/renter/properties/${property.id}/apply`)}
              >
                Apply Now
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => openTour('booking')}>
                <Calendar className="w-4 h-4" />
                Schedule Viewing
              </Button>
              <Button variant="outline" className="px-3" onClick={handleToggleSave}>
                <Heart
                  className={`w-4 h-4 ${isSaved ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`}
                />
              </Button>
              <Button variant="outline" className="px-3" onClick={handleCompare}>
                <GitCompare className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {property.description && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">About this property</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {property.description}
              </p>
            </div>
          )}

          {property.amenities && property.amenities.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {property.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {property.reviews && <PropertyReviews reviews={property.reviews} />}

          <SimilarProperties currentId={property.id} />
        </div>

        <div className="space-y-6">
          <PropertyLandlordCard property={property} />

          {property.additionalFees && property.additionalFees.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Cost Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rent ({property.period}ly)</span>
                  <span className="text-foreground font-medium">
                    {formatPrice(property.price, property.period)}
                  </span>
                </div>
                {property.additionalFees.map((fee) => (
                  <div key={fee.label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{fee.label}</span>
                    <span className="text-foreground font-medium">
                      {nairaFormatter.format(fee.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {property.period === 'year' && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Payment Options</h3>
              {property.allowsMonthlyPayment ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                      This landlord accepts monthly installments via{' '}
                      <span className="text-foreground font-medium">GetRentos Flex</span> — we pay
                      the full year upfront, you repay us monthly.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    className="gap-2"
                    onClick={() => router.push('/renter/financing')}
                  >
                    <Zap className="w-4 h-4" />
                    See Monthly Payment Plans
                  </Button>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-sm">
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    This landlord requires the full year&apos;s rent upfront — monthly installments
                    aren&apos;t available for this property.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {tourOpen && (
        <VirtualTourViewerModal
          propertyTitle={property.title}
          initialMode={tourMode}
          onClose={() => setTourOpen(false)}
        />
      )}
    </>
  );
}
