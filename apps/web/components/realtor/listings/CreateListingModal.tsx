'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button, CurrencyInput } from '@getrentos/ui';
import type { ListingCategory } from '@/types/realtor';
import { PaginatedSelect } from '@/components/ui/PaginatedSelect';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import {
  realtorService,
  type RealtorAssignedPropertyApi,
  type RealtorClientApi,
} from '@/services/realtorService';

export interface CreateRealtorListingInput {
  propertyId: string;
  title: string;
  category: ListingCategory;
  price: number;
}

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (listing: CreateRealtorListingInput) => void;
}

const SELECTOR_PAGE_SIZE = 10;

export const CreateListingModal = ({ isOpen, onClose, onSubmit }: CreateListingModalProps) => {
  const [clientId, setClientId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [clientPage, setClientPage] = useState(1);
  const [propertySearch, setPropertySearch] = useState('');
  const [propertyPage, setPropertyPage] = useState(1);
  const [selectedClientState, setSelectedClientState] = useState<RealtorClientApi | null>(null);
  const [selectedPropertyState, setSelectedPropertyState] =
    useState<RealtorAssignedPropertyApi | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ListingCategory>('sale');
  const [price, setPrice] = useState('');

  const { data: clientsPage, isLoading: isClientsLoading } = useQuery({
    queryKey: [
      ...realtorKeys.clients,
      {
        status: 'ACTIVE',
        search: clientSearch.trim() || undefined,
        page: clientPage,
        pageSize: SELECTOR_PAGE_SIZE,
      },
    ],
    queryFn: () =>
      unwrap(
        realtorService.listClients({
          status: 'ACTIVE',
          search: clientSearch.trim() || undefined,
          page: clientPage,
          pageSize: SELECTOR_PAGE_SIZE,
        })
      ),
    enabled: isOpen,
  });
  const clients = clientsPage?.items ?? [];
  const selectedClient =
    (selectedClientState?.id === clientId ? selectedClientState : null) ??
    clients.find((client) => client.id === clientId) ??
    null;
  const { data: propertiesPage, isLoading: isPropertiesLoading } = useQuery({
    queryKey: [
      ...realtorKeys.assignableProperties(clientId),
      {
        search: propertySearch.trim() || undefined,
        page: propertyPage,
        pageSize: SELECTOR_PAGE_SIZE,
      },
    ],
    queryFn: () =>
      unwrap(
        realtorService.listAssignedProperties(clientId, {
          search: propertySearch.trim() || undefined,
          page: propertyPage,
          pageSize: SELECTOR_PAGE_SIZE,
        })
      ),
    enabled: isOpen && !!clientId,
  });
  const properties = propertiesPage?.items ?? [];
  const selectedProperty =
    (selectedPropertyState?.id === propertyId ? selectedPropertyState : null) ??
    properties.find((property) => property.id === propertyId) ??
    null;

  const clientLabel = (client: RealtorClientApi) => {
    const role = client.client.roles.some(({ role: userRole }) => userRole === 'LANDLORD')
      ? 'Landlord'
      : 'Owner';
    return `${client.client.legalName || client.client.email} (${role})`;
  };

  const handleClose = () => {
    setClientId('');
    setPropertyId('');
    setClientSearch('');
    setClientPage(1);
    setPropertySearch('');
    setPropertyPage(1);
    setSelectedClientState(null);
    setSelectedPropertyState(null);
    setTitle('');
    setCategory('sale');
    setPrice('');
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedClient || !selectedProperty) return;
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
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <PaginatedSelect
                    value={clientId}
                    onValueChange={(value) => {
                      setClientId(value);
                      setSelectedClientState(clients.find((client) => client.id === value) ?? null);
                      setPropertyId('');
                      setSelectedPropertyState(null);
                      setPropertySearch('');
                      setPropertyPage(1);
                    }}
                    items={clients}
                    selectedItem={selectedClient}
                    getItemValue={(client) => client.id}
                    getItemLabel={clientLabel}
                    search={clientSearch}
                    onSearchChange={(value) => {
                      setClientSearch(value);
                      setClientPage(1);
                    }}
                    searchPlaceholder="Search approved clients"
                    page={clientPage}
                    pageSize={SELECTOR_PAGE_SIZE}
                    total={clientsPage?.total ?? 0}
                    onPageChange={setClientPage}
                    placeholder="Select a client"
                    emptyMessage="No active clients match this search."
                    isLoading={isClientsLoading}
                    ariaLabel="client"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Assigned property <span className="text-red-500">*</span>
                  </label>
                  <PaginatedSelect
                    value={propertyId}
                    onValueChange={(value) => {
                      setPropertyId(value);
                      setSelectedPropertyState(
                        properties.find((property) => property.id === value) ?? null
                      );
                    }}
                    items={properties}
                    selectedItem={selectedProperty}
                    getItemValue={(property) => property.id}
                    getItemLabel={(property) => `${property.title} · ${property.city}`}
                    search={propertySearch}
                    onSearchChange={(value) => {
                      setPropertySearch(value);
                      setPropertyPage(1);
                    }}
                    searchPlaceholder="Search assigned properties"
                    page={propertyPage}
                    pageSize={SELECTOR_PAGE_SIZE}
                    total={propertiesPage?.total ?? 0}
                    onPageChange={setPropertyPage}
                    placeholder={clientId ? 'Select an assigned property' : 'Select a client first'}
                    disabled={!clientId}
                    emptyMessage="No assigned properties match this search."
                    isLoading={isPropertiesLoading}
                    ariaLabel="assigned property"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Category</label>
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
            </div>

            {((clientsPage?.total ?? 0) > 0 || isClientsLoading) && (
              <div className="p-4 border-t border-border flex justify-end shrink-0">
                <Button
                  variant="primary"
                  className="gap-1.5"
                  onClick={handleSubmit}
                  disabled={!selectedClient || !selectedProperty || !title || !(Number(price) >= 1)}
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
