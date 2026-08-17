'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button, CurrencyInput, Select } from '@getrentos/ui';
import type { RealtorClient, ListingCategory } from '@/types/realtor';

export interface RealtorClientProperty {
  id: string;
  clientId: string;
  title: string;
}

export interface CreateRealtorListingInput {
  propertyId: string;
  title: string;
  category: ListingCategory;
  price: number;
}

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: RealtorClient[];
  properties: RealtorClientProperty[];
  onSubmit: (listing: CreateRealtorListingInput) => void;
}

export const CreateListingModal = ({
  isOpen,
  onClose,
  clients,
  properties,
  onSubmit,
}: CreateListingModalProps) => {
  const [clientId, setClientId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ListingCategory>('sale');
  const [price, setPrice] = useState('');

  const selectedClient = clients.find((c) => c.id === clientId);

  const handleClose = () => {
    setClientId('');
    setPropertyId('');
    setTitle('');
    setCategory('sale');
    setPrice('');
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedClient) return;
    onSubmit({
      propertyId,
      title,
      category,
      price: Number(price) || 0,
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
                      onValueChange={(value) => {
                        setClientId(value);
                        setPropertyId('');
                      }}
                      placeholder="Select a client"
                      options={clients.map((client) => ({
                        value: client.id,
                        label: `${client.clientName} (${client.role === 'owner' ? 'Owner' : 'Landlord'})`,
                      }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Assigned property <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={propertyId}
                      onValueChange={setPropertyId}
                      placeholder={
                        clientId ? 'Select an assigned property' : 'Select a client first'
                      }
                      disabled={!clientId}
                      options={properties
                        .filter((property) => property.clientId === clientId)
                        .map((property) => ({ value: property.id, label: property.title }))}
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
                      {category === 'sale' ? 'Asking Price (₦)' : 'Annual Rent (₦)'}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <CurrencyInput
                      prefix="₦"
                      min={0}
                      value={price}
                      onValueChange={(v) => setPrice(v === 0 ? '' : String(v))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              )}
            </div>

            {clients.length > 0 && (
              <div className="p-4 border-t border-border flex justify-end shrink-0">
                <Button
                  variant="primary"
                  className="gap-1.5"
                  onClick={handleSubmit}
                  disabled={!clientId || !propertyId || !title || !(Number(price) >= 1)}
                >
                  <Check className="w-3.5 h-3.5" />
                  Create draft
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
