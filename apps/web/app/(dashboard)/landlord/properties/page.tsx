'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Building2 } from 'lucide-react';
import { LandlordNavbar } from '@/components/landlord/navigation/LandlordNavbar';
import { LandlordSidebar } from '@/components/landlord/dashboard/LandlordSidebar';
import { PropertyCard } from '@/components/landlord/properties/PropertyCard';
import { AddPropertyModal } from '@/components/landlord/properties/AddPropertyModal';
import { EditPropertyModal } from '@/components/landlord/properties/EditPropertyModal';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { Property } from '@/types/landlord';

const mockProperties: Property[] = [
  {
    id: 'prop_001',
    name: 'Sunrise Apartments',
    type: 'apartment',
    address: '14 Adeola Odeku Street',
    city: 'Victoria Island',
    state: 'Lagos',
    country: 'Nigeria',
    coverImage: '',
    verificationStatus: 'verified',
    totalUnits: 8,
    occupiedUnits: 6,
    monthlyRevenue: 2_850_000,
    createdAt: '2024-11-02T00:00:00.000Z',
  },
  {
    id: 'prop_002',
    name: 'Palm Court Residences',
    type: 'duplex',
    address: '22 Admiralty Way',
    city: 'Lekki',
    state: 'Lagos',
    country: 'Nigeria',
    coverImage: '',
    verificationStatus: 'verified',
    totalUnits: 4,
    occupiedUnits: 3,
    monthlyRevenue: 1_620_000,
    createdAt: '2025-01-15T00:00:00.000Z',
  },
  {
    id: 'prop_003',
    name: 'Modern Downtown Loft',
    type: 'shared_apartment',
    address: '5 Ikeja GRA',
    city: 'Ikeja',
    state: 'Lagos',
    country: 'Nigeria',
    coverImage: '',
    verificationStatus: 'pending',
    totalUnits: 3,
    occupiedUnits: 1,
    monthlyRevenue: 450_000,
    createdAt: '2025-04-20T00:00:00.000Z',
  },
];

type VerificationFilter = 'all' | Property['verificationStatus'];

export default function LandlordPropertiesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<VerificationFilter>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
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
        if (parsedUser.role && parsedUser.role !== 'landlord') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }
      setProperties(mockProperties);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handlePublish = (
    data: Omit<Property, 'id' | 'occupiedUnits' | 'monthlyRevenue' | 'createdAt'>
  ) => {
    const newProperty: Property = {
      ...data,
      id: `prop_${Date.now()}`,
      occupiedUnits: 0,
      monthlyRevenue: 0,
      createdAt: new Date().toISOString(),
    };
    setProperties((prev) => [newProperty, ...prev]);
  };

  const handleEditSave = (
    id: string,
    updates: Pick<Property, 'name' | 'type' | 'address' | 'city' | 'state' | 'totalUnits'>
  ) => {
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleToggleArchive = (id: string) => {
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, archived: !p.archived } : p)));
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
    { value: 'pending', label: 'Pending' },
    { value: 'unverified', label: 'Unverified' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <LandlordNavbar user={user} />

      <div className="flex">
        <LandlordSidebar />

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
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-lg w-fit">
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
                    ? 'Add your first property to start managing units, tenants, and rent collection.'
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
                  <PropertyCard
                    key={property.id}
                    property={property}
                    delay={index * 0.05}
                    onClick={() => router.push(`/landlord/units?property=${property.id}`)}
                    onEdit={() => setEditingProperty(property)}
                    onToggleArchive={() => handleToggleArchive(property.id)}
                    onDelete={() => setDeletingPropertyId(property.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

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
    </div>
  );
}
