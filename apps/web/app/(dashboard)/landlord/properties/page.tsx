'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Building2 } from 'lucide-react';
import { PropertyCard } from '@/components/landlord/properties/PropertyCard';
import { AddPropertyModal } from '@/components/landlord/properties/AddPropertyModal';
import { EditPropertyModal } from '@/components/landlord/properties/EditPropertyModal';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import type { Property } from '@/types/landlord';
import { ROUTES } from '@/lib/constants/auth';

type VerificationFilter = 'all' | Property['verificationStatus'];

export default function LandlordPropertiesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(q);
    }
  }, [searchParams]);
  const [filter, setFilter] = useState<VerificationFilter>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);

  const { data: properties = [] } = useQuery({
    queryKey: landlordKeys.properties,
    queryFn: () => unwrap(landlordService.listProperties()),
  });

  const invalidateProperties = () =>
    queryClient.invalidateQueries({ queryKey: landlordKeys.properties });

  const publishMutation = useMutation({
    mutationFn: (data: Omit<Property, 'id' | 'occupiedUnits' | 'monthlyRevenue' | 'createdAt'>) => {
      const { name, type, address, city, state, country, description, totalUnits } = data;
      return unwrap(
        landlordService.createProperty({
          name,
          type,
          address,
          city,
          state,
          country,
          description,
          totalUnits,
        })
      );
    },
    onSuccess: invalidateProperties,
  });

  const editMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Pick<Property, 'name' | 'type' | 'address' | 'city' | 'state' | 'totalUnits'>;
    }) => unwrap(landlordService.updateProperty(id, updates)),
    onSuccess: invalidateProperties,
  });

  const toggleArchiveMutation = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.toggleArchiveProperty(id)),
    onSuccess: invalidateProperties,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.deleteProperty(id)),
    onSuccess: invalidateProperties,
  });

  const handlePublish = (
    data: Omit<Property, 'id' | 'occupiedUnits' | 'monthlyRevenue' | 'createdAt'>
  ) => publishMutation.mutate(data);

  const handleEditSave = (
    id: string,
    updates: Pick<Property, 'name' | 'type' | 'address' | 'city' | 'state' | 'totalUnits'>
  ) => editMutation.mutate({ id, updates });

  const handleToggleArchive = (id: string) => toggleArchiveMutation.mutate(id);

  const handleDelete = (id: string) => deleteMutation.mutate(id);

  const filteredProperties = useMemo(
    () =>
      properties.filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.city.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || p.verificationStatus === filter;
        return matchesSearch && matchesFilter;
      }),
    [properties, searchQuery, filter]
  );

  const filterOptions: { value: VerificationFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'verified', label: 'Verified' },
    { value: 'pending', label: 'Pending' },
    { value: 'unverified', label: 'Unverified' },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Properties</h1>
          <p className="text-muted-foreground mt-1">
            {properties.length} propert{properties.length === 1 ? 'y' : 'ies'} in your portfolio
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Property
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or city..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
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

      {filteredProperties.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {properties.length === 0 ? 'No properties yet' : 'No properties match your filters'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {properties.length === 0
              ? 'Add your first property to start managing units, tenants, and rent collection.'
              : 'Try adjusting your search or filter.'}
          </p>
          {properties.length === 0 && (
            <Button variant="primary" className="mt-6" onClick={() => setIsAddModalOpen(true)}>
              Add Your First Property
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProperties.map((property, index) => (
            <PropertyCard
              key={property.id}
              property={property}
              delay={index * 0.05}
              onClick={() => router.push(`${ROUTES.LANDLORD_UNITS}?property=${property.id}`)}
              onEdit={() => setEditingProperty(property)}
              onToggleArchive={() => handleToggleArchive(property.id)}
              onDelete={() => setDeletingPropertyId(property.id)}
            />
          ))}
        </div>
      )}

      <AddPropertyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPublish={handlePublish}
      />

      <EditPropertyModal
        property={editingProperty}
        onClose={() => setEditingProperty(null)}
        onSave={handleEditSave}
      />

      <ConfirmDialog
        open={!!deletingPropertyId}
        onOpenChange={(open) => !open && setDeletingPropertyId(null)}
        title="Delete this property?"
        description="This will permanently remove the property and all of its unit records. This cannot be undone."
        onConfirm={() => deletingPropertyId && handleDelete(deletingPropertyId)}
      />
    </>
  );
}
