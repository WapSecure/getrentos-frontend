'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Button, CurrencyInput, Textarea } from '@getrentos/ui';
import type { BuyerPropertyListing, FinancingType, BuyerOffer } from '@/types/buyer';
import { PaginatedSelect } from '@/components/ui/PaginatedSelect';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import { buyerService } from '@/services/buyerService';

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPropertyId?: string;
  onSubmit: (offer: Omit<BuyerOffer, 'id' | 'status' | 'submittedAt'>) => void;
}

const financingOptions: { value: FinancingType; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'installment', label: 'Installment' },
];
const LISTING_PAGE_SIZE = 10;

export const MakeOfferModal = ({
  isOpen,
  onClose,
  defaultPropertyId,
  onSubmit,
}: MakeOfferModalProps) => {
  const [propertyId, setPropertyId] = useState(defaultPropertyId || '');
  const [listingSearch, setListingSearch] = useState('');
  const [listingPage, setListingPage] = useState(1);
  const [selectedListingState, setSelectedListingState] = useState<BuyerPropertyListing | null>(
    null
  );
  const [offerAmount, setOfferAmount] = useState('');
  const [financingType, setFinancingType] = useState<FinancingType>('cash');
  const [depositAmount, setDepositAmount] = useState('');
  const [message, setMessage] = useState('');

  const { data: listingsPage, isLoading: isListingsLoading } = useQuery({
    queryKey: [
      ...buyerKeys.listings,
      { search: listingSearch.trim() || undefined, page: listingPage, pageSize: LISTING_PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        buyerService.discover({
          search: listingSearch.trim() || undefined,
          page: listingPage,
          pageSize: LISTING_PAGE_SIZE,
        })
      ),
    enabled: isOpen,
  });
  const { data: defaultListing } = useQuery({
    queryKey: [...buyerKeys.listings, 'detail', defaultPropertyId],
    queryFn: () => unwrap(buyerService.getListing(defaultPropertyId as string)),
    enabled: isOpen && !!defaultPropertyId,
  });
  const listings = listingsPage?.items ?? [];
  const selectedListing =
    (selectedListingState?.id === propertyId ? selectedListingState : null) ??
    listings.find((listing) => listing.id === propertyId) ??
    (defaultListing?.id === propertyId ? defaultListing : undefined);

  const handleClose = () => {
    setPropertyId(defaultPropertyId || '');
    setListingSearch('');
    setListingPage(1);
    setSelectedListingState(null);
    setOfferAmount('');
    setFinancingType('cash');
    setDepositAmount('');
    setMessage('');
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedListing) return;
    onSubmit({
      propertyId: selectedListing.id,
      propertyTitle: selectedListing.title,
      ownerName: selectedListing.ownerName,
      offerAmount: Number(offerAmount) || 0,
      askingPrice: selectedListing.askingPrice,
      financingType,
      depositAmount: depositAmount ? Number(depositAmount) : undefined,
      message: message || undefined,
    });
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-sm w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-foreground">Make an Offer</h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Property <span className="text-red-500">*</span>
                </label>
                <PaginatedSelect
                  value={propertyId}
                  onValueChange={(value) => {
                    setPropertyId(value);
                    setSelectedListingState(
                      listings.find((listing) => listing.id === value) ??
                        (defaultListing?.id === value ? defaultListing : null)
                    );
                  }}
                  items={listings}
                  selectedItem={selectedListing}
                  getItemValue={(listing) => listing.id}
                  getItemLabel={(listing) => listing.title}
                  search={listingSearch}
                  onSearchChange={(value) => {
                    setListingSearch(value);
                    setListingPage(1);
                  }}
                  searchPlaceholder="Search available properties"
                  page={listingPage}
                  pageSize={LISTING_PAGE_SIZE}
                  total={listingsPage?.total ?? 0}
                  onPageChange={setListingPage}
                  placeholder="Select a property"
                  emptyMessage="No available properties match this search."
                  isLoading={isListingsLoading}
                  ariaLabel="property"
                />
                {selectedListing && (
                  <p className="text-xs text-gray-400 mt-1">
                    Asking price: ₦{selectedListing.askingPrice.toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Offer Amount (₦) <span className="text-red-500">*</span>
                </label>
                <CurrencyInput
                  prefix="₦"
                  min={0}
                  value={offerAmount}
                  onValueChange={(v) => setOfferAmount(v === 0 ? '' : String(v))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Financing Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {financingOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFinancingType(option.value)}
                      className={`px-2 py-2 rounded-lg border text-sm transition-colors ${
                        financingType === option.value
                          ? 'border-primary bg-accent text-primary'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Deposit Amount (₦) <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <CurrencyInput
                  prefix="₦"
                  min={0}
                  value={depositAmount}
                  onValueChange={(v) => setDepositAmount(v === 0 ? '' : String(v))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Message to Owner <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  placeholder="e.g. Pre-approved and ready to close quickly"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border flex gap-3 shrink-0">
              <Button variant="ghost" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 gap-1.5"
                onClick={handleSubmit}
                disabled={!propertyId || !offerAmount}
              >
                <Send className="w-3.5 h-3.5" />
                Submit Offer
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
