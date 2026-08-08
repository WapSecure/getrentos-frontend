'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
            className="bg-white dark:bg-[#1a2a2f] rounded-xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center flex-shrink-0">
              <h3 className="font-semibold text-gray-900 dark:text-white">Add Listing</h3>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {clients.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                  Add a client first before creating a listing on their behalf.
                </p>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Client <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                    >
                      <option value="">Select a client</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.clientName} ({c.role === 'owner' ? 'Owner' : 'Landlord'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                              ? 'border-[#c4a747] bg-[#c4a747]/10 text-[#c4a747]'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {option === 'sale' ? 'For Sale' : 'For Rent'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Listing Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Elegant 4-Bed Duplex in Lekki"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Property Type
                    </label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                    >
                      {propertyTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {category === 'sale' ? 'Asking Price (₦)' : 'Annual Rent (₦)'}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bedrooms
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bathrooms
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {clients.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-white/10 flex gap-3 flex-shrink-0">
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
