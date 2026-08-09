'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Building2 } from 'lucide-react';
import { OwnerNavbar } from '@/components/owner/navigation/OwnerNavbar';
import { OwnerSidebar } from '@/components/owner/dashboard/OwnerSidebar';
import { OwnerPropertyCard } from '@/components/owner/properties/OwnerPropertyCard';
import { AddOwnerPropertyModal } from '@/components/owner/properties/AddOwnerPropertyModal';
import { OwnerVerificationStatusModal } from '@/components/owner/properties/OwnerVerificationStatusModal';
import { EditOwnerPropertyModal } from '@/components/owner/properties/EditOwnerPropertyModal';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { OwnerProperty, OwnershipVerificationStatus } from '@/types/owner';

const mockProperties: OwnerProperty[] = [
  {
    id: 'oprop_001',
    name: 'Ocean View Towers',
    propertyType: 'Apartment',
    address: '3 Bar Beach Way',
    city: 'Victoria Island',
    state: 'Lagos',
    country: 'Nigeria',
    ownerName: 'Adaeze Okafor',
    verificationStatus: 'verified',
    estimatedValue: 145_000_000,
    purchasePrice: 118_000_000,
    purchaseDate: '2022-03-10T00:00:00.000Z',
    hasActiveSaleListing: true,
    createdAt: '2022-03-10T00:00:00.000Z',
  },
  {
    id: 'oprop_002',
    name: 'Palm Court Villa',
    propertyType: 'Duplex',
    address: '18 Chevron Drive',
    city: 'Lekki',
    state: 'Lagos',
    country: 'Nigeria',
    ownerName: 'Adaeze Okafor',
    verificationStatus: 'verified',
    estimatedValue: 92_000_000,
    purchasePrice: 76_000_000,
    purchaseDate: '2021-09-01T00:00:00.000Z',
    hasActiveSaleListing: true,
    createdAt: '2021-09-01T00:00:00.000Z',
  },
  {
    id: 'oprop_003',
    name: 'Lekki Waterfront Duplex',
    propertyType: 'Duplex',
    address: '7 Freedom Way',
    city: 'Lekki',
    state: 'Lagos',
    country: 'Nigeria',
    ownerName: 'Adaeze Okafor',
    verificationStatus: 'pending_review',
    estimatedValue: 71_500_000,
    purchasePrice: 71_500_000,
    purchaseDate: '2025-06-15T00:00:00.000Z',
    hasActiveSaleListing: false,
    createdAt: '2025-06-15T00:00:00.000Z',
  },
  {
    id: 'oprop_004',
    name: 'Ikoyi Heritage House',
    propertyType: 'Bungalow',
    address: '11 Bourdillon Road',
    city: 'Ikoyi',
    state: 'Lagos',
    country: 'Nigeria',
    ownerName: 'Adaeze Okafor',
    verificationStatus: 'rejected',
    rejectionReason:
      'Uploaded title deed image is illegible. Please resubmit a clearer scan or certified copy.',
    estimatedValue: 210_000_000,
    purchasePrice: 175_000_000,
    purchaseDate: '2020-02-20T00:00:00.000Z',
    hasActiveSaleListing: false,
    createdAt: '2020-02-20T00:00:00.000Z',
  },
];

type VerificationFilter = 'all' | OwnershipVerificationStatus;

export default function OwnerPropertiesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState<OwnerProperty[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<VerificationFilter>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statusModalProperty, setStatusModalProperty] = useState<OwnerProperty | null>(null);
  const [editingProperty, setEditingProperty] = useState<OwnerProperty | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.role && parsedUser.role !== 'owner') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }
      setProperties(mockProperties);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleSubmit = (
    data: Omit<OwnerProperty, 'id' | 'hasActiveSaleListing' | 'createdAt' | 'verificationStatus'>
  ) => {
    const newProperty: OwnerProperty = {
      ...data,
      id: `oprop_${Date.now()}`,
      verificationStatus: 'pending_review',
      hasActiveSaleListing: false,
      createdAt: new Date().toISOString(),
    };
    setProperties((prev) => [newProperty, ...prev]);
  };

  const handleResubmit = (propertyId: string) => {
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId
          ? { ...p, verificationStatus: 'pending_review', rejectionReason: undefined }
          : p
      )
    );
    setStatusModalProperty(null);
  };

  const handleEditSave = (
    id: string,
    updates: Pick<
      OwnerProperty,
      'name' | 'propertyType' | 'address' | 'city' | 'state' | 'estimatedValue'
    >
  ) => {
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleDelete = (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || p.verificationStatus === filter;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filterOptions: { value: VerificationFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'verified', label: 'Verified' },
    { value: 'pending_review', label: 'Pending' },
    { value: 'needs_clarification', label: 'Needs Info' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <OwnerNavbar user={user} />

      <div className="flex">
        <OwnerSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Properties</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {properties.length} propert{properties.length === 1 ? 'y' : 'ies'} in your
                  portfolio
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
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or city..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-lg w-fit overflow-x-auto">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      filter === option.value
                        ? 'bg-white dark:bg-[#1a2a2f] text-[#c4a747] shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredProperties.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {properties.length === 0
                    ? 'No properties yet'
                    : 'No properties match your filters'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  {properties.length === 0
                    ? 'Add your first property to verify ownership and unlock sale listings and investment tracking.'
                    : 'Try adjusting your search or filter.'}
                </p>
                {properties.length === 0 && (
                  <Button
                    variant="primary"
                    className="mt-6"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    Add Your First Property
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProperties.map((property, index) => (
                  <OwnerPropertyCard
                    key={property.id}
                    property={property}
                    delay={index * 0.05}
                    onClick={() => setStatusModalProperty(property)}
                    onEdit={() => setEditingProperty(property)}
                    onDelete={() => setDeletingPropertyId(property.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <AddOwnerPropertyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <OwnerVerificationStatusModal
        property={statusModalProperty}
        onClose={() => setStatusModalProperty(null)}
        onResubmit={handleResubmit}
      />

      <EditOwnerPropertyModal
        property={editingProperty}
        onClose={() => setEditingProperty(null)}
        onSave={handleEditSave}
      />

      <ConfirmDialog
        open={!!deletingPropertyId}
        onOpenChange={(open) => !open && setDeletingPropertyId(null)}
        title="Delete this property?"
        description="This will permanently remove the property and any associated sale listings. This cannot be undone."
        onConfirm={() => deletingPropertyId && handleDelete(deletingPropertyId)}
      />
    </div>
  );
}
