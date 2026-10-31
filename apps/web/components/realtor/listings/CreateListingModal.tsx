'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import {
  Button,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  Input,
  RadioGroup,
  useSessionExpiryDraft,
} from '@getrentos/ui';
import type { ListingCategory } from '@/types/realtor';
import { PaginatedSelect } from '@/components/ui/PaginatedSelect';
import { VerificationRequiredNotice } from '@/components/shared/verification/VerificationRequiredNotice';
import { unwrap } from '@/lib/apiHelpers';
import { ROUTES } from '@/lib/constants/auth';
import { realtorKeys } from '@/lib/queryKeys';
import {
  realtorService,
  type RealtorAssignedPropertyApi,
  type RealtorClientApi,
} from '@/services/realtorService';

/** sessionStorage key for a listing being written when the session ran out. */
export const REALTOR_CREATE_LISTING_DRAFT_KEY = 'realtor-create-listing';

interface RealtorListingDraft {
  clientId: string;
  propertyId: string;
  client: RealtorClientApi | null;
  property: RealtorAssignedPropertyApi | null;
  title: string;
  category: ListingCategory;
  price: string;
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
  onSubmit: (listing: CreateRealtorListingInput) => void;
  /** Caught error from the parent's create mutation: renders a trust upsell when it's a verification/tier gate. */
  error?: unknown;
  isSubmitting?: boolean;
}

const SELECTOR_PAGE_SIZE = 10;

export const CreateListingModal = ({
  isOpen,
  onClose,
  onSubmit,
  error,
  isSubmitting = false,
}: CreateListingModalProps) => {
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
    placeholderData: keepPreviousData,
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
    placeholderData: keepPreviousData,
  });
  const properties = propertiesPage?.items ?? [];
  const selectedProperty =
    (selectedPropertyState?.id === propertyId ? selectedPropertyState : null) ??
    properties.find((property) => property.id === propertyId) ??
    null;

  // If the session ends while the realtor is writing, keep the listing so it is
  // waiting after they sign back in.
  const draftRestored = useSessionExpiryDraft<RealtorListingDraft>(
    REALTOR_CREATE_LISTING_DRAFT_KEY,
    () =>
      clientId || title || price
        ? {
            clientId,
            propertyId,
            client: selectedClient,
            property: selectedProperty,
            title,
            category,
            price,
          }
        : null,
    (draft) => {
      setClientId(draft.clientId);
      setPropertyId(draft.propertyId);
      setSelectedClientState(draft.client);
      setSelectedPropertyState(draft.property);
      setTitle(draft.title);
      setCategory(draft.category);
      setPrice(draft.price);
    },
    isOpen
  );

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
    // Do NOT close here: keep the modal open on failure so a trust/tier gate can
    // surface its upsell notice. The parent closes us on success (isOpen=false).
    onSubmit({
      propertyId,
      title,
      category,
      price: Number(price) || 0,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-lg sm:p-0">
        <div className="p-4 pr-12 border-b border-border shrink-0">
          <DialogTitle className="font-semibold text-foreground">Add Listing</DialogTitle>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <Field label="Client" required>
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
          </Field>

          <Field label="Assigned property" required>
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
          </Field>

          <Field label="Category">
            <RadioGroup
              value={category}
              onValueChange={setCategory}
              options={[
                { value: 'sale', label: 'For Sale' },
                { value: 'rental', label: 'For Rent' },
              ]}
              variant="card"
              columns={2}
            />
          </Field>

          <Field label="Listing Title" required>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Elegant 4-Bed Duplex in Lekki"
            />
          </Field>

          <Field label={category === 'sale' ? 'Asking Price (₦)' : 'Annual Rent (₦)'} required>
            <CurrencyInput
              prefix="₦"
              min={0}
              value={price}
              onValueChange={(v) => setPrice(v === 0 ? '' : String(v))}
            />
          </Field>
        </div>

        {((clientsPage?.total ?? 0) > 0 || isClientsLoading || !!error) && (
          <div className="p-4 border-t border-border space-y-3 shrink-0">
            {draftRestored && !error && (
              <p role="status" className="text-xs text-muted-foreground">
                We kept the listing you were writing when your session ended. Check it and submit it
                again.
              </p>
            )}
            {error ? (
              <VerificationRequiredNotice
                error={error}
                href={ROUTES.REALTOR_LISTINGS}
                verificationHref={ROUTES.REALTOR_VERIFICATION}
              />
            ) : null}
            <div className="flex justify-end">
              <Button
                variant="primary"
                icon={<Check className="w-3.5 h-3.5" />}
                onClick={handleSubmit}
                isLoading={isSubmitting}
                loadingText="Creating…"
                disabled={!selectedClient || !selectedProperty || !title || !(Number(price) >= 1)}
              >
                Create draft
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
