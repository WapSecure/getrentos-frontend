'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import type { RealtorClient, RealtorListing, ListingCategory } from '@/types/realtor';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: RealtorClient[];
  onSubmit: (listing: Omit<RealtorListing, 'id' | 'createdAt'>) => void;
}

const propertyTypes = ['Apartment', 'Duplex', 'Bungalow', 'Terrace', 'Land', 'Commercial'];

export const CreateListingModal = ({
  isOpen,
  onClose,
  clients,
  onSubmit,
}: CreateListingModalProps) => {
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ListingCategory>('sale');
  const [propertyType, setPropertyType] = useState('Apartment');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Lagos');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');

  const selectedClient = clients.find((c) => c.id === clientId);

  const handleClose = () => {
    setClientId('');
    setTitle('');
    setCategory('sale');
    setPropertyType('Apartment');
    setPrice('');
    setCity('');
    setState('Lagos');
    setBedrooms('');
    setBathrooms('');
    onClose();
  };

  const handleSubmit = (status: RealtorListing['status']) => {
    if (!selectedClient) return;
    onSubmit({
      clientId: selectedClient.id,
      clientName: selectedClient.clientName,
      title,
      category,
      propertyType,
      price: Number(price) || 0,
      city,
      state,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      status,
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
              <h3 className="font-semibold text-foreground">Add Listing</h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {clients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Add a client first before creating a listing on their behalf.
                </p>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Client <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={clientId}
                      onValueChange={setClientId}
                      placeholder="Select a client"
                      options={clients.map((client) => ({ value: client.id, label: `${client.clientName} (${client.role === 'owner' ? 'Owner' : 'Landlord'})` }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Category
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['sale', 'rental'] as ListingCategory[]).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setCategory(option)}
                          className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                            category === option
                              ? 'border-primary bg-accent text-primary'
                              : 'border-border text-muted-foreground'
                          }`}
                        >
                          {option === 'sale' ? 'For Sale' : 'For Rent'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Listing Title <span className="text-red-500">*</span>
                    </label>
                    <LegacyInput
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Elegant 4-Bed Duplex in Lekki"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Property Type
                    </label>
                    <Select
                      value={propertyType}
                      onValueChange={setPropertyType}
                      options={propertyTypes.map((propertyTypeOption) => ({ value: propertyTypeOption, label: propertyTypeOption }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {category === 'sale' ? 'Asking Price (₦)' : 'Annual Rent (₦)'}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <LegacyInput
                      type="number"
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">City</label>
                      <LegacyInput
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        State
                      </label>
                      <LegacyInput
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Bedrooms
                      </label>
                      <LegacyInput
                        type="number"
                        min={0}
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Bathrooms
                      </label>
                      <LegacyInput
                        type="number"
                        min={0}
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {clients.length > 0 && (
              <div className="p-4 border-t border-border flex gap-3 shrink-0">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleSubmit('draft')}
                  disabled={!clientId || !title || !price}
                >
                  Save Draft
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 gap-1.5"
                  onClick={() => handleSubmit('pending_approval')}
                  disabled={!clientId || !title || !price}
                >
                  <Check className="w-3.5 h-3.5" />
                  Submit for Approval
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
