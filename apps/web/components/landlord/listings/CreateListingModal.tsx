'use client';

import { useState, useMemo } from 'react';
import { DoorOpen, X, Zap } from 'lucide-react';
import {
  Button,
  Checkbox,
  CurrencyInput,
  DatePicker,
  EmptyState,
  Field,
  IconButton,
  Input,
  RadioGroup,
  Select,
} from '@getrentos/ui';
import type { Listing, RentPeriod, Unit } from '@/types/landlord';
import { VerificationRequiredNotice } from '@/components/shared/verification/VerificationRequiredNotice';
import { ROUTES } from '@/lib/constants/auth';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacantUnits: Unit[];
  onPublish: (listing: Omit<Listing, 'id' | 'status' | 'createdAt'>) => void;
  submitError?: unknown;
  isSubmitting?: boolean;
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
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [availabilityDate, setAvailabilityDate] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [allowPets, setAllowPets] = useState(false);
  const [furnished, setFurnished] = useState(false);
  const [shortLetEnabled, setShortLetEnabled] = useState(false);

  const selectedUnit = useMemo(
    () => vacantUnits.find((u) => u.id === unitId),
    [vacantUnits, unitId]
  );

  const handleUnitChange = (id: string) => {
    setUnitId(id);
    const unit = vacantUnits.find((u) => u.id === id);
    // The unit already carries its asking rent, so the advert starts from it
    // rather than asking the landlord to type the same figure again.
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

  const isValid = selectedUnit && listingTitle.trim() && Number(askingRent) > 0 && availabilityDate;

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
      amenities,
      availabilityDate,
      allowPets,
      furnished,
      shortLetEnabled,
    });
  };

  return (
    isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-listing-title"
          className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl"
        >
          <div className="p-4 border-b border-border flex justify-between items-center gap-3 shrink-0">
            <div className="min-w-0">
              <h3 id="create-listing-title" className="font-semibold text-foreground">
                Publish listing
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Make a vacant unit available for rent
              </p>
            </div>
            <IconButton
              label="Close publish listing form"
              size="sm"
              icon={<X />}
              onClick={handleClose}
              disabled={isSubmitting}
            />
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

                <Field label="Listing Title" required>
                  <Input
                    type="text"
                    value={listingTitle}
                    onChange={(e) => setListingTitle(e.target.value)}
                  />
                </Field>

                <Field
                  label="Rent Period"
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
                    label={rentPeriod === 'year' ? 'Annual Rent (₦)' : 'Monthly Rent (₦)'}
                    required
                  >
                    <CurrencyInput
                      prefix="₦"
                      value={askingRent}
                      onValueChange={(v) => setAskingRent(v === 0 ? '' : String(v))}
                    />
                  </Field>
                  <Field label="Security Deposit">
                    <CurrencyInput
                      prefix="₦"
                      value={securityDeposit}
                      onValueChange={(v) => setSecurityDeposit(v === 0 ? '' : String(v))}
                      placeholder="Optional"
                    />
                  </Field>
                </div>

                {rentPeriod === 'year' && (
                  <div className="p-3 rounded-lg bg-accent border border-primary/20">
                    <Checkbox
                      checked={allowsMonthlyPayment}
                      onCheckedChange={setAllowsMonthlyPayment}
                      label={
                        <span className="flex items-center gap-1.5 font-medium">
                          <Zap className="w-3.5 h-3.5 text-primary" />
                          Allow monthly installments via GetRentos Flex
                        </span>
                      }
                      description="GetRentos pays you the full year upfront; the tenant repays us monthly. Leave unchecked to require the full year from the tenant directly."
                    />
                  </div>
                )}

                <Field label="Availability Date" required>
                  <DatePicker value={availabilityDate} onChange={setAvailabilityDate} />
                </Field>

                <div>
                  <p className="block text-sm font-medium text-foreground mb-1.5">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {amenityOptions.map((amenity) => (
                      <button
                        key={amenity}
                        type="button"
                        aria-pressed={amenities.includes(amenity)}
                        onClick={() => toggleAmenity(amenity)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                          amenities.includes(amenity)
                            ? 'bg-accent border-primary text-primary'
                            : 'border-border text-muted-foreground hover:border-muted-foreground/40'
                        }`}
                      >
                        {amenity}
                      </button>
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
              </>
            )}
          </div>

          {vacantUnits.length > 0 && (
            <div className="p-4 border-t border-border space-y-3 shrink-0">
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
        </div>
      </div>
    )
  );
};
