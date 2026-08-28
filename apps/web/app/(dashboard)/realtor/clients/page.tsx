'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Users } from 'lucide-react';
import { ClientCard } from '@/components/realtor/clients/ClientCard';
import { AddClientModal } from '@/components/realtor/clients/AddClientModal';
import { Button, Pagination, Toast, type ToastVariant } from '@getrentos/ui';
import type { ClientRole } from '@/types/realtor';
import { ROUTES } from '@/lib/constants/auth';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { mapRealtorClient, realtorService } from '@/services/realtorService';

type RoleFilter = 'all' | ClientRole;

const PAGE_SIZE = 10;

export default function RealtorClientsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<RoleFilter>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const queryClient = useQueryClient();
  const clientRole =
    filter === 'owner' ? 'PROPERTY_OWNER' : filter === 'landlord' ? 'LANDLORD' : undefined;
  const { data, isLoading } = useQuery({
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
  });
  const clients = data?.items ?? [];
  const total = data?.total ?? 0;
  const inviteClient = useMutation({
    mutationFn: (email: string) => unwrap(realtorService.inviteClient(email)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.clients });
      setPage(1);
      setIsAddModalOpen(false);
      setToast({ message: 'Client invitation sent.', variant: 'success' });
    },
    onError: (error) => {
      setToast({
        message: error.message || 'Unable to add this client. Please try again.',
        variant: 'error',
      });
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
        <Button variant="primary" className="gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setFilter(option.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                filter === option.value
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-sm text-muted-foreground">
          Loading clients…
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {total === 0 ? 'No clients yet' : 'No clients match your filters'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {total === 0
              ? 'Add an owner or landlord client to start representing their properties.'
              : 'Try adjusting your search or filter.'}
          </p>
          {total === 0 && (
            <Button variant="primary" className="mt-6" onClick={() => setIsAddModalOpen(true)}>
              Add Your First Client
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((client, index) => (
            <ClientCard
              key={client.id}
              client={client}
              delay={index * 0.05}
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

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
