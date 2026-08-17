'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { Button, CurrencyInput, DatePicker, Select } from '@getrentos/ui';
import type { Listing, RentPeriod, Unit } from '@/types/landlord';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacantUnits: Unit[];
  onPublish: (listing: Omit<Listing, 'id' | 'status' | 'createdAt'>) => void;
}

const amenityOptions = ['Parking', 'Swimming Pool', 'Security', '24/7 Power', 'Gym', 'Elevator'];

export const CreateListingModal = ({
  isOpen,
  onClose,
  vacantUnits,
  onPublish,
}: CreateListingModalProps) => {
  const [unitId, setUnitId] = useState('');
  const [listingTitle, setListingTitle] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
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
    if (unit && !monthlyRent) setMonthlyRent(String(unit.monthlyRent));
    if (unit && !listingTitle) setListingTitle(`${unit.propertyName} — ${unit.unitName}`);
  };

  const reset = () => {
    setUnitId('');
    setListingTitle('');
    setMonthlyRent('');
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
    reset();
    onClose();
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const isValid =
    selectedUnit && listingTitle.trim() && Number(monthlyRent) > 0 && availabilityDate;

  const handlePublish = () => {
    if (!selectedUnit || !isValid) return;
    onPublish({
      unitId: selectedUnit.id,
      propertyId: selectedUnit.propertyId,
      propertyName: selectedUnit.propertyName,
      unitName: selectedUnit.unitName,
      listingTitle: listingTitle.trim(),
      monthlyRent: Number(monthlyRent),
      rentPeriod,
      allowsMonthlyPayment: rentPeriod === 'year' ? allowsMonthlyPayment : false,
      securityDeposit: securityDeposit ? Number(securityDeposit) : undefined,
      amenities,
      availabilityDate,
      allowPets,
      furnished,
      shortLetEnabled,
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
            className="bg-card rounded-xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-semibold text-foreground">Publish Listing</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Make a vacant unit available for rent
                </p>
              </div>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {vacantUnits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No vacant units available to list. Add a property or mark a unit vacant first.
                </p>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={unitId}
                      onValueChange={handleUnitChange}
                      placeholder="Select a vacant unit"
                      options={vacantUnits.map((unit) => ({
                        value: unit.id,
                        label: `${unit.propertyName} — ${unit.unitName}`,
                      }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Listing Title <span className="text-red-500">*</span>
                    </label>
                    <LegacyInput
                      type="text"
                      value={listingTitle}
                      onChange={(e) => setListingTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Rent Period <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      {(['year', 'month'] as RentPeriod[]).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setRentPeriod(p)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            rentPeriod === p
                              ? 'bg-accent border-primary text-primary'
                              : 'border-border text-muted-foreground hover:border-gray-300'
                          }`}
                        >
                          {p === 'year' ? 'Yearly (recommended)' : 'Monthly'}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Most Nigerian landlords let tenants a full year upfront. Choose monthly only
                      for short-let or month-to-month arrangements.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        {rentPeriod === 'year' ? 'Annual Rent (₦)' : 'Monthly Rent (₦)'}{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <CurrencyInput
                        prefix="₦"
                        value={monthlyRent}
                        onValueChange={(v) => setMonthlyRent(v === 0 ? '' : String(v))}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Security Deposit (₦)
                      </label>
                      <CurrencyInput
                        prefix="₦"
                        value={securityDeposit}
                        onValueChange={(v) => setSecurityDeposit(v === 0 ? '' : String(v))}
                        placeholder="Optional"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {rentPeriod === 'year' && (
                    <label className="flex items-start gap-2 text-sm text-foreground p-3 rounded-lg bg-accent border border-primary/20">
                      <LegacyInput
                        type="checkbox"
                        checked={allowsMonthlyPayment}
                        onChange={(e) => setAllowsMonthlyPayment(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                      />
                      <span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Zap className="w-3.5 h-3.5 text-primary" />
                          Allow monthly installments via GetRentos Flex
                        </span>
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          GetRentos pays you the full year upfront; the tenant repays us monthly.
                          Leave unchecked to require the full year from the tenant directly.
                        </span>
                      </span>
                    </label>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Availability Date <span className="text-red-500">*</span>
                    </label>
                    <DatePicker value={availabilityDate} onChange={setAvailabilityDate} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Amenities
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {amenityOptions.map((amenity) => (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => toggleAmenity(amenity)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                            amenities.includes(amenity)
                              ? 'bg-accent border-primary text-primary'
                              : 'border-border text-muted-foreground hover:border-gray-300'
                          }`}
                        >
                          {amenity}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <LegacyInput
                        type="checkbox"
                        checked={allowPets}
                        onChange={(e) => setAllowPets(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                      />
                      Allow pets
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <LegacyInput
                        type="checkbox"
                        checked={furnished}
                        onChange={(e) => setFurnished(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                      />
                      Furnished
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <LegacyInput
                        type="checkbox"
                        checked={shortLetEnabled}
                        onChange={(e) => setShortLetEnabled(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                      />
                      Short-let enabled
                    </label>
                  </div>
                </>
              )}
            </div>

            {vacantUnits.length > 0 && (
              <div className="p-4 border-t border-border flex gap-3 shrink-0">
                <Button variant="primary" fullWidth onClick={handlePublish} disabled={!isValid}>
                  Publish Listing
                </Button>
                <Button variant="ghost" fullWidth onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
