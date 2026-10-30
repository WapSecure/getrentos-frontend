'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import {
  Alert,
  Button,
  Checkbox,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  RadioGroup,
  Textarea,
} from '@getrentos/ui';
import type { BuyerPropertyListing, FinancingType, BuyerOffer } from '@/types/buyer';
import { PaginatedSelect } from '@/components/ui/PaginatedSelect';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import { buyerService } from '@/services/buyerService';
import { isLandPropertyType } from '@/lib/propertyTypes';
import { landKeys } from '@/lib/queryKeys';
import { landService } from '@/services/landService';
import { TrustLabelsList } from '@/components/land/market/TrustLabelsList';
import { formatCurrency } from '@/lib/format';

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPropertyId?: string;
  onSubmit: (offer: Omit<BuyerOffer, 'id' | 'status' | 'submittedAt'>) => Promise<boolean>;
}

const financingOptions: { value: FinancingType; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'installment', label: 'Installment' },
];
const LISTING_PAGE_SIZE = 10;
/** Matches the backend default when the buyer leaves the deposit blank. */
const DEFAULT_DEPOSIT_RATE = 0.1;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [acceptedRisks, setAcceptedRisks] = useState(false);

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
    placeholderData: keepPreviousData,
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

  // Land: the buyer must accept what was not verified on the parcel (US-03).
  const isLand = isLandPropertyType(selectedListing?.propertyType);
  const landListing = useQuery({
    queryKey: [...landKeys.publicListing(selectedListing?.id ?? '')],
    queryFn: () => unwrap(landService.getPublicListing(selectedListing!.id)),
    enabled: isOpen && isLand && Boolean(selectedListing),
    retry: false,
  });
  const notVerified = isLand ? (landListing.data?.diligence?.notVerified ?? []) : [];
  const needsAcceptance =
    isLand && (landListing.isLoading || (notVerified.length > 0 && !acceptedRisks));

  const amount = Number(offerAmount) || 0;
  const deposit = depositAmount ? Number(depositAmount) : Math.round(amount * DEFAULT_DEPOSIT_RATE);
  const asking = selectedListing?.askingPrice ?? 0;
  const depositError =
    amount > 0 && depositAmount && Number(depositAmount) > amount
      ? 'The deposit cannot be more than your offer.'
      : undefined;
  const amountHint =
    amount > 0 && asking > 0
      ? amount > asking * 1.5
        ? `That is well above the ${formatCurrency(asking)} asking price. Check the amount before you send it.`
        : amount < asking * 0.5
          ? `That is less than half the ${formatCurrency(asking)} asking price, so the seller may decline it.`
          : undefined
      : undefined;
  const missing = !propertyId
    ? 'Choose a property to make an offer on.'
    : !offerAmount
      ? 'Enter your offer amount.'
      : needsAcceptance && !landListing.isLoading
        ? 'Accept what was not verified on this land to continue.'
        : undefined;

  const handleClose = () => {
    setAcceptedRisks(false);
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

  const handleSubmit = async () => {
    if (!selectedListing) return;
    setIsSubmitting(true);
    setSubmitError(null);
    const submitted = await onSubmit({
      propertyId: selectedListing.id,
      propertyTitle: selectedListing.title,
      ownerName: selectedListing.ownerName,
      offerAmount: Number(offerAmount) || 0,
      askingPrice: selectedListing.askingPrice,
      financingType,
      depositAmount: depositAmount ? Number(depositAmount) : undefined,
      message: message || undefined,
      ...(isLand ? { acknowledgedNotVerified: notVerified.map((item) => item.key) } : {}),
    });
    setIsSubmitting(false);
    if (!submitted) {
      setSubmitError('Your offer could not be submitted. Your details are unchanged.');
      return;
    }
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && !isSubmitting && handleClose()}>
      <DialogContent size="sm" padded={false} className="flex flex-col overflow-hidden">
        <div className="p-4 pr-12 border-b border-border shrink-0">
          <DialogTitle className="font-semibold text-foreground">Make an Offer</DialogTitle>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          <Field
            label="Property"
            required
            hint={
              selectedListing
                ? `Asking price: ₦${selectedListing.askingPrice.toLocaleString()}`
                : undefined
            }
          >
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
          </Field>

          <Field label="Offer Amount" required hint={amountHint}>
            <CurrencyInput
              prefix="₦"
              min={0}
              value={offerAmount}
              onValueChange={(v) => setOfferAmount(v === 0 ? '' : String(v))}
            />
          </Field>

          <Field label="Financing Type">
            <RadioGroup
              value={financingType}
              onValueChange={setFinancingType}
              options={financingOptions}
              orientation="horizontal"
            />
          </Field>

          <Field
            label="Deposit Amount"
            optionalLabel="(optional)"
            error={depositError}
            hint={
              amount > 0
                ? depositAmount
                  ? `You pay ${formatCurrency(deposit)} into GetRentos Payment Protection once the seller accepts.`
                  : `Left blank, the deposit is 10% of your offer: ${formatCurrency(deposit)}, held by GetRentos once the seller accepts.`
                : 'Left blank, the deposit is 10% of your offer.'
            }
          >
            <CurrencyInput
              prefix="₦"
              min={0}
              value={depositAmount}
              onValueChange={(v) => setDepositAmount(v === 0 ? '' : String(v))}
            />
          </Field>

          <Field label="Message to Owner" optionalLabel="(optional)">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="e.g. Pre-approved and ready to close quickly"
            />
          </Field>
        </div>

        {isLand && notVerified.length > 0 && (
          <Alert variant="warning" title="What was not verified on this land" className="mx-4 mb-3">
            <div className="mt-2">
              <TrustLabelsList notVerified={notVerified} />
            </div>
            <Checkbox
              className="mt-2"
              checked={acceptedRisks}
              onCheckedChange={setAcceptedRisks}
              label="I have read what was not verified and accept it before offering."
            />
          </Alert>
        )}

        <div className="p-4 border-t border-border flex flex-wrap gap-3 shrink-0">
          {selectedListing?.acceptingOffers === false && (
            <p role="alert" className="w-full text-sm text-destructive">
              This property is already under offer and is no longer accepting new offers.
            </p>
          )}
          {missing && !submitError && (
            <p className="w-full text-xs text-muted-foreground">{missing}</p>
          )}
          {submitError && (
            <p role="alert" className="w-full text-sm text-destructive">
              {submitError}
            </p>
          )}
          <Button variant="ghost" onClick={handleClose} className="flex-1" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            icon={<Send className="w-3.5 h-3.5" />}
            onClick={() => void handleSubmit()}
            disabled={
              !propertyId ||
              !offerAmount ||
              !!depositError ||
              needsAcceptance ||
              isSubmitting ||
              selectedListing?.acceptingOffers === false
            }
            isLoading={isSubmitting}
          >
            Submit Offer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
