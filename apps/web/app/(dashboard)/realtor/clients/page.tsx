'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import { ClientCard } from '@/components/realtor/clients/ClientCard';
import { AddClientModal } from '@/components/realtor/clients/AddClientModal';
import {
  Button,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  Pagination,
  SearchInput,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
} from '@getrentos/ui';
import type { ClientRole } from '@/types/realtor';
import { ROUTES } from '@/lib/constants/auth';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { mapRealtorClient, realtorService } from '@/services/realtorService';
import { usePlanGateModal } from '@/hooks/usePlanGateModal';
import { UpgradeToProModal } from '@/components/shared/subscription/UpgradeToProModal';

type RoleFilter = 'all' | ClientRole;

const PAGE_SIZE = 10;

export default function RealtorClientsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<RoleFilter>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();
  const planGate = usePlanGateModal();
  const clientRole =
    filter === 'owner' ? 'PROPERTY_OWNER' : filter === 'landlord' ? 'LANDLORD' : undefined;
  const clientsQuery = useQuery({
    queryKey: [
      ...realtorKeys.clients,
      { page, pageSize: PAGE_SIZE, search: searchQuery.trim() || undefined, role: clientRole },
    ],
    queryFn: async () => {
      const result = await unwrap(
        realtorService.listClients({
          page,
          pageSize: PAGE_SIZE,
          search: searchQuery.trim() || undefined,
          role: clientRole,
        })
      );
      return { ...result, items: result.items.map(mapRealtorClient) };
    },
    placeholderData: keepPreviousData,
  });
  const { data, isLoading } = clientsQuery;
  const clients = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasActiveFilters = Boolean(searchQuery.trim() || filter !== 'all');
  const inviteClient = useMutation({
    mutationFn: (email: string) => unwrap(realtorService.inviteClient(email)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.clients });
      setPage(1);
      setIsAddModalOpen(false);
      toast.success('Client invitation sent.');
    },
    onError: (error) => {
      if (planGate.handleError(error)) {
        setIsAddModalOpen(false);
        return;
      }
      toast.error(error.message || 'Unable to add this client. Please try again.');
    },
  });

  const handleAddClient = (email: string) => {
    inviteClient.mutate(email);
  };

  const filterOptions: { value: RoleFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'owner', label: 'Owners' },
    { value: 'landlord', label: 'Landlords' },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-1">
            {total} client{total === 1 ? '' : 's'} you represent
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Client
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput
          value={searchQuery}
          onValueChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          placeholder="Search clients..."
          label="Search clients"
          className="flex-1 max-w-sm"
        />
        <Tabs
          value={filter}
          onValueChange={(value) => {
            setFilter(value as RoleFilter);
            setPage(1);
          }}
        >
          <TabsList className="max-w-full">
            {filterOptions.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <ListSkeleton variant="cards" rows={3} label="Loading clients" />
      ) : clientsQuery.isError && !data ? (
        <PageErrorState
          title="Clients are unavailable"
          description="We could not load the people you represent. Please try again."
          onRetry={() => void clientsQuery.refetch()}
          isRetrying={clientsQuery.isFetching}
        />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasActiveFilters ? 'No clients match your filters' : 'No clients yet'}
          description={
            hasActiveFilters
              ? 'Clear the current filters to return to all clients.'
              : 'Add an owner or landlord client to start representing their properties.'
          }
          action={
            !hasActiveFilters ? (
              <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                Add your first client
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onMessage={() => router.push(`${ROUTES.REALTOR_MESSAGES}?client=${client.id}`)}
            />
          ))}
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        submitError={inviteClient.error}
        onSubmit={handleAddClient}
        isSubmitting={inviteClient.isPending}
        error={inviteClient.isError ? inviteClient.error.message : null}
      />

      <UpgradeToProModal
        isOpen={planGate.isOpen}
        onClose={planGate.close}
        reason={planGate.reason}
      />
    </>
  );
}
