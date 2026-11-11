'use client';

import { useState, useMemo } from 'react';
import { DoorOpen, Zap } from '@sureground/icons';
import {
  Button,
  Checkbox,
  CurrencyInput,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  RadioGroup,
  Select,
  ToggleChip,
  useSessionExpiryDraft,
} from '@sureground/ui';
import { isCommercialType, type Listing, type RentPeriod, type Unit } from '@/types/landlord';
import { VerificationRequiredNotice } from '@/components/shared/verification/VerificationRequiredNotice';
import { ROUTES } from '@/lib/constants/auth';
import { DraftAssist, SelfCheckPanel } from './ListingAssist';
import { useFlexAvailability } from '@/hooks/useFlexAvailability';
import {
  EMPTY_FEES,
  feesToPayload,
  ListingFeeFields,
  type ListingFeeValues,
} from './ListingFeeFields';
import {
  CommercialDetailsFields,
  EMPTY_COMMERCIAL,
  commercialError,
  commercialToCreatePayload,
  type CommercialValues,
} from './CommercialDetailsFields';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacantUnits: Unit[];
  onPublish: (listing: Omit<Listing, 'id' | 'status' | 'createdAt'>) => void;
  submitError?: unknown;
  isSubmitting?: boolean;
}

export const CREATE_LISTING_DRAFT_KEY = 'landlord-create-listing';

interface ListingDraft {
  unitId: string;
  listingTitle: string;
  askingRent: string;
  rentPeriod: RentPeriod;
  allowsMonthlyPayment: boolean;
  securityDeposit: string;
  fees?: ListingFeeValues;
  commercial?: CommercialValues;
  availabilityDate: string;
  amenities: string[];
  allowPets: boolean;
  furnished: boolean;
  shortLetEnabled: boolean;
}

const amenityOptions = ['Parking', 'Swimming Pool', 'Security', '24/7 Power', 'Gym', 'Elevator'];

export const CreateListingModal = ({
  isOpen,
  onClose,
  vacantUnits,
  onPublish,
  submitError = null,
  isSubmitting = false,
}: CreateListingModalProps) => {
  const [unitId, setUnitId] = useState('');
  const [listingTitle, setListingTitle] = useState('');
  const [askingRent, setAskingRent] = useState('');
  const [rentPeriod, setRentPeriod] = useState<RentPeriod>('year');
  const [allowsMonthlyPayment, setAllowsMonthlyPayment] = useState(false);
  const { newPlansOpen: flexOpen } = useFlexAvailability();
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [fees, setFees] = useState<ListingFeeValues>(EMPTY_FEES);
  const [commercial, setCommercial] = useState<CommercialValues>(EMPTY_COMMERCIAL);
  const [availabilityDate, setAvailabilityDate] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [allowPets, setAllowPets] = useState(false);
  const [furnished, setFurnished] = useState(false);
  const [shortLetEnabled, setShortLetEnabled] = useState(false);

  const draftRestored = useSessionExpiryDraft<ListingDraft>(
    CREATE_LISTING_DRAFT_KEY,
    () =>
      unitId || listingTitle || askingRent || securityDeposit || availabilityDate
        ? {
            unitId,
            listingTitle,
            askingRent,
            rentPeriod,
            allowsMonthlyPayment,
            securityDeposit,
            fees,
            commercial,
            availabilityDate,
            amenities,
            allowPets,
            furnished,
            shortLetEnabled,
          }
        : null,
    (draft) => {
      setUnitId(draft.unitId);
      setListingTitle(draft.listingTitle);
      setAskingRent(draft.askingRent);
      setRentPeriod(draft.rentPeriod);
      setAllowsMonthlyPayment(draft.allowsMonthlyPayment);
      setSecurityDeposit(draft.securityDeposit);
      setFees(draft.fees ?? EMPTY_FEES);
      setCommercial(draft.commercial ?? EMPTY_COMMERCIAL);
      setAvailabilityDate(draft.availabilityDate);
      setAmenities(draft.amenities ?? []);
      setAllowPets(draft.allowPets);
      setFurnished(draft.furnished);
      setShortLetEnabled(draft.shortLetEnabled);
    },
    isOpen
  );

  const selectedUnit = useMemo(
    () => vacantUnits.find((u) => u.id === unitId),
    [vacantUnits, unitId]
  );

  const handleUnitChange = (id: string) => {
    setUnitId(id);
    const unit = vacantUnits.find((u) => u.id === id);
    if (unit && !askingRent && unit.askingRent !== undefined) {
      setAskingRent(String(unit.askingRent));
    }
    if (unit?.askingRentPeriod) setRentPeriod(unit.askingRentPeriod);
    if (unit && !listingTitle) setListingTitle(`${unit.propertyName}: ${unit.unitName}`);
  };

  const reset = () => {
    setUnitId('');
    setListingTitle('');
    setAskingRent('');
    setRentPeriod('year');
    setAllowsMonthlyPayment(false);
    setSecurityDeposit('');
    setFees(EMPTY_FEES);
    setCommercial(EMPTY_COMMERCIAL);
    setAvailabilityDate('');
    setAmenities([]);
    setAllowPets(false);
    setFurnished(false);
    setShortLetEnabled(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const isCommercial = isCommercialType(selectedUnit?.propertyType);
  const commercialProblem = isCommercial ? commercialError(commercial) : null;
  const isValid =
    selectedUnit &&
    listingTitle.trim() &&
    Number(askingRent) > 0 &&
    availabilityDate &&
    !commercialProblem;

  const handlePublish = () => {
    if (!selectedUnit || !isValid) return;
    onPublish({
      unitId: selectedUnit.id,
      propertyId: selectedUnit.propertyId,
      propertyName: selectedUnit.propertyName,
      unitName: selectedUnit.unitName,
      listingTitle: listingTitle.trim(),
      askingRent: Number(askingRent),
      rentPeriod,
      allowsMonthlyPayment: rentPeriod === 'year' ? allowsMonthlyPayment : false,
      securityDeposit: securityDeposit ? Number(securityDeposit) : undefined,
      ...feesToPayload(fees),
      // Sent only for a commercial unit: the API refuses the block on any other type.
      commercial: isCommercial ? commercialToCreatePayload(commercial) : undefined,
      amenities,
      availabilityDate,
      allowPets,
      furnished,
      shortLetEnabled,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent padded={false} className="flex flex-col sm:max-w-lg">
        <div className="p-4 pr-12 border-b border-border flex justify-between items-center gap-3 shrink-0">
          <div className="min-w-0">
            <DialogTitle className="font-semibold text-foreground">Publish listing</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Make a vacant unit available for rent
            </DialogDescription>
          </div>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {vacantUnits.length === 0 ? (
            <EmptyState
              icon={DoorOpen}
              title="No vacant units available to list"
              description="Add a property or mark a unit vacant first."
              size="compact"
              bare
            />
          ) : (
            <>
              <Field label="Unit" required>
                <Select
                  value={unitId}
                  onValueChange={handleUnitChange}
                  placeholder="Select a vacant unit"
                  options={vacantUnits.map((unit) => ({
                    value: unit.id,
                    label: `${unit.propertyName}: ${unit.unitName}`,
                  }))}
                />
              </Field>

              {unitId && (
                <DraftAssist
                  // A different unit is a different listing: start fresh.
                  key={unitId}
                  unitId={unitId}
                  onApply={(d) => {
                    setListingTitle(d.title);
                    setAmenities((prev) => [...new Set([...prev, ...d.amenities])]);
                  }}
                />
              )}

              <Field label="Listing title" required>
                <Input
                  type="text"
                  value={listingTitle}
                  onChange={(e) => setListingTitle(e.target.value)}
                />
              </Field>

              <Field
                label="Rent period"
                required
                hint="Most Nigerian landlords let tenants a full year upfront. Choose monthly only for short-let or month-to-month arrangements."
              >
                <RadioGroup
                  variant="card"
                  orientation="horizontal"
                  columns={2}
                  value={rentPeriod}
                  onValueChange={(p) => setRentPeriod(p as RentPeriod)}
                  options={[
                    { value: 'year', label: 'Yearly (recommended)' },
                    { value: 'month', label: 'Monthly' },
                  ]}
                />
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label={rentPeriod === 'year' ? 'Annual rent (₦)' : 'Monthly rent (₦)'}
                  required
                >
                  <CurrencyInput
                    prefix="₦"
                    value={askingRent}
                    onValueChange={(v) => setAskingRent(v === 0 ? '' : String(v))}
                  />
                </Field>
                <Field label="Security deposit">
                  <CurrencyInput
                    prefix="₦"
                    value={securityDeposit}
                    onValueChange={(v) => setSecurityDeposit(v === 0 ? '' : String(v))}
                    placeholder="Optional"
                  />
                </Field>
              </div>

              <ListingFeeFields
                value={fees}
                onChange={setFees}
                annualRent={
                  Number(askingRent) > 0
                    ? Number(askingRent) * (rentPeriod === 'month' ? 12 : 1)
                    : undefined
                }
              />

              {isCommercial && (
                <>
                  <CommercialDetailsFields value={commercial} onChange={setCommercial} />
                  {commercialProblem && (
                    <p role="alert" className="text-xs text-destructive">
                      {commercialProblem}
                    </p>
                  )}
                </>
              )}

              {rentPeriod === 'year' && (
                <div className="p-3 rounded-lg bg-accent border border-primary/20">
                  <Checkbox
                    checked={allowsMonthlyPayment}
                    onCheckedChange={setAllowsMonthlyPayment}
                    label={
                      <span className="flex items-center gap-1.5 font-medium">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        Allow monthly instalments via Sureground Flex
                      </span>
                    }
                    description={
                      flexOpen
                        ? 'Sureground pays you the full year upfront; the tenant repays us monthly. Leave unchecked to require the full year from the tenant directly.'
                        : "Sureground Flex isn't taking new plans right now. You can opt in now; renters can use it for this home once Flex reopens."
                    }
                  />
                </div>
              )}

              <Field label="Availability date" required>
                <DatePicker value={availabilityDate} onChange={setAvailabilityDate} />
              </Field>

              <div>
                <p className="block text-sm font-medium text-foreground mb-1.5">Amenities</p>
                <div role="group" aria-label="Amenities" className="flex flex-wrap gap-2">
                  {amenityOptions.map((amenity) => (
                    <ToggleChip
                      key={amenity}
                      size="sm"
                      pressed={amenities.includes(amenity)}
                      onPressedChange={() => toggleAmenity(amenity)}
                    >
                      {amenity}
                    </ToggleChip>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Checkbox checked={allowPets} onCheckedChange={setAllowPets} label="Allow pets" />
                <Checkbox checked={furnished} onCheckedChange={setFurnished} label="Furnished" />
                <Checkbox
                  checked={shortLetEnabled}
                  onCheckedChange={setShortLetEnabled}
                  label="Short-let enabled"
                />
              </div>

              {unitId && (
                <SelfCheckPanel
                  unitId={unitId}
                  listingTitle={listingTitle}
                  askingRent={Number(askingRent) || 0}
                  rentPeriod={rentPeriod}
                />
              )}
            </>
          )}
        </div>

        {vacantUnits.length > 0 && (
          <div className="p-4 border-t border-border space-y-3 shrink-0">
            {draftRestored && (
              <p role="status" className="text-xs text-muted-foreground">
                We kept the listing you were writing when your session ended. Check it and publish
                it again.
              </p>
            )}
            <VerificationRequiredNotice
              error={submitError}
              href={ROUTES.LANDLORD_PROPERTIES}
              verificationHref={ROUTES.LANDLORD_VERIFICATION}
            />
            <div className="flex gap-3">
              <Button
                variant="primary"
                fullWidth
                onClick={handlePublish}
                disabled={!isValid}
                isLoading={isSubmitting}
                loadingText="Publishing…"
              >
                Publish listing
              </Button>
              <Button variant="ghost" fullWidth onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
