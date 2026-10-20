'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CalendarClock } from 'lucide-react';
import {
  Button,
  DatePicker,
  Field,
  IconButton,
  RadioGroup,
  Textarea,
  TimePicker,
} from '@getrentos/ui';
import type { BuyerPropertyListing } from '@/types/buyer';
import { PaginatedSelect } from '@/components/ui/PaginatedSelect';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import { buyerService } from '@/services/buyerService';
import { videoCallAvailabilityQuery, videoCallService } from '@/services/videoCallService';

interface RequestViewingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPropertyId?: string;
  onSubmit: (
    propertyId: string,
    date: string,
    time: string,
    notes: string,
    mode: 'IN_PERSON' | 'VIDEO'
  ) => Promise<boolean>;
}

const LISTING_PAGE_SIZE = 10;

export const RequestViewingModal = ({
  isOpen,
  onClose,
  defaultPropertyId,
  onSubmit,
}: RequestViewingModalProps) => {
  const [propertyId, setPropertyId] = useState(defaultPropertyId || '');
  const [listingSearch, setListingSearch] = useState('');
  const [listingPage, setListingPage] = useState(1);
  const [selectedListingState, setSelectedListingState] = useState<BuyerPropertyListing | null>(
    null
  );
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState<'IN_PERSON' | 'VIDEO'>('IN_PERSON');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Video viewings are offered only once the call service is set up.
  const { data: videoCalls } = useQuery({
    ...videoCallAvailabilityQuery,
    queryFn: () => unwrap(videoCallService.availability()),
    enabled: isOpen,
  });
  const canVideo = videoCalls?.available === true;

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

  const handleClose = () => {
    setPropertyId(defaultPropertyId || '');
    setListingSearch('');
    setListingPage(1);
    setSelectedListingState(null);
    setDate('');
    setTime('');
    setNotes('');
    setMode('IN_PERSON');
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedListing) return;
    setIsSubmitting(true);
    setSubmitError(null);
    const submitted = await onSubmit(propertyId, date, time, notes, canVideo ? mode : 'IN_PERSON');
    setIsSubmitting(false);
    if (!submitted) {
      setSubmitError('Your viewing request could not be submitted. Your details are unchanged.');
      return;
    }
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Request Viewing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-sm w-full overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Request Viewing</h3>
              <IconButton
                label="Close viewing request"
                size="sm"
                icon={<X />}
                onClick={handleClose}
                disabled={isSubmitting}
              />
            </div>

            <div className="p-4 space-y-4">
              <Field label="Property" required>
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

              <Field label="Date">
                <DatePicker value={date} onChange={setDate} />
              </Field>

              <Field label="Time">
                <TimePicker value={time} onChange={setTime} />
              </Field>

              {canVideo && (
                <Field
                  label="How would you like to view it?"
                  hint={
                    mode === 'VIDEO'
                      ? 'The owner walks you through it on a video call once they confirm. Join it from your viewing requests.'
                      : undefined
                  }
                >
                  <RadioGroup
                    value={mode}
                    onValueChange={setMode}
                    variant="card"
                    columns={2}
                    options={[
                      { value: 'IN_PERSON', label: 'Visit in person' },
                      { value: 'VIDEO', label: 'Live video call' },
                    ]}
                  />
                </Field>
              )}

              <Field label="Notes" optionalLabel="(optional)">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Anything the owner should know"
                />
              </Field>
            </div>

            <div className="p-4 border-t border-border flex flex-wrap gap-3">
              {submitError && <p className="w-full text-sm text-destructive">{submitError}</p>}
              <Button
                variant="ghost"
                onClick={handleClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                icon={<CalendarClock className="w-4 h-4" />}
                onClick={() => void handleSubmit()}
                disabled={!selectedListing || !date || !time || isSubmitting}
                isLoading={isSubmitting}
              >
                Request
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
