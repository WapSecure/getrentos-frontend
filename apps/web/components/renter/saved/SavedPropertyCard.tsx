'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Heart,
  Star,
  Home,
  Trash2,
  BookmarkPlus,
  Clock,
  TrendingDown,
  ExternalLink,
  MoreHorizontal,
  CheckSquare,
  Bell,
  BellOff,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Property } from '@/types/renter';
import { AddNoteModal } from './AddNoteModal';
import { SharePropertyModal } from './SharePropertyModal';
import { PriceHistoryChart } from './PriceHistoryChart';

interface SavedPropertyCardProps {
  property: Property;
  viewMode: 'grid' | 'list';
  onRemove: (id: string) => void;
  onMoveToWishlist: (propertyId: string, wishlistId: string) => void;
  wishlists: { id: string; name: string; propertyIds: string[] }[];
  isSelected?: boolean;
  onSelect?: () => void;
}

interface ApplicationStatus {
  propertyId: string;
  status: 'not_applied' | 'pending' | 'under_review' | 'approved' | 'rejected';
  appliedDate?: string;
}

export const SavedPropertyCard = ({
  property,
  viewMode,
  onRemove,
  onMoveToWishlist,
  wishlists,
  isSelected,
  onSelect,
}: SavedPropertyCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [note, setNote] = useState('');
  const [hasPriceDrop, setHasPriceDrop] = useState(false);
  const [priceAlertEnabled, setPriceAlertEnabled] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null);

  useEffect(() => {
    const savedNote = localStorage.getItem(`note_${property.id}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedNote) setNote(savedNote);

    // Mock price drop detection
    setHasPriceDrop(property.id === '5');

    // Mock application status (in production, fetch from API)
    const mockStatus: ApplicationStatus = {
      propertyId: property.id,
      status: property.id === '1' ? 'under_review' : 'not_applied',
      appliedDate: property.id === '1' ? '2024-06-10' : undefined,
    };
    setApplicationStatus(mockStatus);
  }, [property.id]);

  const formatPrice = () => {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${formatter.format(property.price)}${property.period === 'month' ? '/mo' : property.period === 'year' ? '/yr' : '/wk'}`;
  };

  const handleSaveNote = (newNote: string) => {
    setNote(newNote);
    localStorage.setItem(`note_${property.id}`, newNote);
  };

  const handleMoveToWishlist = (wishlistId: string) => {
    onMoveToWishlist(property.id, wishlistId);
    setShowMenu(false);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
          icon: '⏳',
        };
      case 'under_review':
        return {
          label: 'Under Review',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
          icon: '🔍',
        };
      case 'approved':
        return {
          label: 'Approved!',
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
          icon: '✅',
        };
      case 'rejected':
        return {
          label: 'Not Selected',
          color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
          icon: '❌',
        };
      default:
        return null;
    }
  };

  const statusConfig =
    applicationStatus && applicationStatus.status !== 'not_applied'
      ? getStatusConfig(applicationStatus.status)
      : null;

  // List View
  if (viewMode === 'list') {
    return (
      <>
        <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-48 h-40 bg-linear-to-br from-secondary to-muted shrink-0">
              <div className="absolute inset-0 flex items-center justify-center">
                <Home className="w-8 h-8 text-gray-400" />
              </div>

              {onSelect && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                  }}
                  className="absolute top-2 left-2 z-20 p-1 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white transition-colors"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              )}

              {hasPriceDrop && (
                <div className="absolute top-2 left-10 flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                  <TrendingDown className="w-3 h-3" />
                  Price Drop
                </div>
              )}

              {statusConfig && (
                <div
                  className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color} z-10`}
                >
                  <span className="mr-1">{statusConfig.icon}</span>
                  {statusConfig.label}
                </div>
              )}
            </div>

            <div className="flex-1 p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
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
                  <span>{property.bedrooms} beds</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bath className="w-3 h-3" />
                  <span>{property.bathrooms} baths</span>
                </div>
                <div className="flex items-center gap-1">
                  <Square className="w-3 h-3" />
                  <span>{property.size} sqft</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Saved 2 days ago</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setPriceAlertEnabled(!priceAlertEnabled)}
                  className={`flex items-center gap-1 text-xs ${priceAlertEnabled ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {priceAlertEnabled ? (
                    <Bell className="w-3 h-3" />
                  ) : (
                    <BellOff className="w-3 h-3" />
                  )}
                  {priceAlertEnabled ? 'Price alerts on' : 'Alerts off'}
                </button>
              </div>

              {note && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-xs text-muted-foreground">
                  📝 {note}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => (window.location.href = `/renter/properties/${property.id}`)}
                >
                  View Details
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowNoteModal(true)}>
                  Add Note
                </Button>
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 rounded-lg border border-border hover:bg-secondary"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-56 bg-card rounded-lg shadow-lg border border-border z-10"
                      >
                        <button
                          onClick={() => {
                            setShowShareModal(true);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Share Property
                        </button>
                        <button
                          onClick={() => {
                            setShowPriceHistory(true);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary"
                        >
                          <TrendingUp className="w-3 h-3" />
                          Price History
                        </button>
                        <div className="border-t border-border my-1" />
                        <div className="px-2 py-1">
                          <p className="text-xs text-gray-500 px-2 py-1">Move to wishlist</p>
                          {wishlists.map((list) => (
                            <button
                              key={list.id}
                              onClick={() => handleMoveToWishlist(list.id)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary"
                            >
                              <BookmarkPlus className="w-3 h-3" />
                              {list.name}
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-border my-1" />
                        <button
                          onClick={() => {
                            onRemove(property.id);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

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
        <PriceHistoryChart
          isOpen={showPriceHistory}
          onClose={() => setShowPriceHistory(false)}
          propertyId={property.id}
          propertyTitle={property.title}
        />
      </>
    );
  }

  return (
    <>
      <div className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300 relative">
        <div className="relative h-48 bg-linear-to-br from-secondary to-muted">
          <div className="absolute inset-0 flex items-center justify-center">
            <Home className="w-12 h-12 text-gray-400 dark:text-gray-600" />
          </div>

          {onSelect && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="absolute top-2 left-2 z-20 p-1 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white transition-colors"
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-primary" />
              ) : (
                <Square className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}

          {hasPriceDrop && (
            <div className="absolute top-2 left-10 flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full z-10">
              <TrendingDown className="w-3 h-3" />
              Price Drop
            </div>
          )}

          <button
            onClick={() => onRemove(property.id)}
            className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white transition-colors z-10"
            title="Remove from saved"
          >
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          </button>

          <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-lg text-sm font-bold z-10">
            {formatPrice()}
          </div>

          {priceAlertEnabled && (
            <div className="absolute bottom-2 right-2 z-10">
              <Bell className="w-3 h-3 text-white drop-shadow-sm" />
            </div>
          )}

          {statusConfig && (
            <div
              className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color} z-10`}
              style={{ left: onSelect ? '44px' : '8px' }}
            >
              <span className="mr-1">{statusConfig.icon}</span>
              {statusConfig.label}
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {property.title}
          </h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3" />
            <span className="text-xs line-clamp-1">{property.location}</span>
          </div>

          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Bed className="w-3 h-3" />
              <span>{property.bedrooms} beds</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="w-3 h-3" />
              <span>{property.bathrooms} baths</span>
            </div>
            <div className="flex items-center gap-1">
              <Square className="w-3 h-3" />
              <span>{property.size} sqft</span>
            </div>
          </div>

          {note && (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-xs text-muted-foreground line-clamp-2">
              📝 {note}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="primary"
              onClick={() => (window.location.href = `/renter/properties/${property.id}`)}
              className="flex-1"
            >
              View Details
            </Button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg border border-border hover:bg-secondary"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-card rounded-lg shadow-lg border border-border z-10"
                  >
                    <button
                      onClick={() => {
                        setShowNoteModal(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary"
                    >
                      <BookmarkPlus className="w-3 h-3" />
                      Add Note
                    </button>
                    <button
                      onClick={() => {
                        setShowShareModal(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Share Property
                    </button>
                    <button
                      onClick={() => {
                        setShowPriceHistory(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary"
                    >
                      <TrendingUp className="w-3 h-3" />
                      Price History
                    </button>
                    <div className="border-t border-border my-1" />
                    <div className="px-2 py-1">
                      <p className="text-xs text-gray-500 px-2 py-1">Move to wishlist</p>
                      {wishlists.map((list) => (
                        <button
                          key={list.id}
                          onClick={() => handleMoveToWishlist(list.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary"
                        >
                          <BookmarkPlus className="w-3 h-3" />
                          {list.name}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => {
                        onRemove(property.id);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

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
      <PriceHistoryChart
        isOpen={showPriceHistory}
        onClose={() => setShowPriceHistory(false)}
        propertyId={property.id}
        propertyTitle={property.title}
      />
    </>
  );
};
