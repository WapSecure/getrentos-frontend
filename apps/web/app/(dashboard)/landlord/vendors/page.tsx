'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, HardHat, Search } from 'lucide-react';
import { LandlordNavbar } from '@/components/landlord/navigation/LandlordNavbar';
import { LandlordSidebar } from '@/components/landlord/dashboard/LandlordSidebar';
import { VendorCard } from '@/components/landlord/vendors/VendorCard';
import { AddVendorModal } from '@/components/landlord/vendors/AddVendorModal';
import { Button } from '@/components/ui/Button';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { Vendor } from '@/types/landlord';

const mockVendors: Vendor[] = [
  {
    id: 'vendor_001',
    name: 'AquaFlow Plumbers',
    serviceType: 'Plumbing',
    phone: '+234 803 555 1122',
    rating: 4.8,
    jobsCompleted: 34,
  },
  {
    id: 'vendor_002',
    name: 'CoolFix HVAC Services',
    serviceType: 'Appliances / HVAC',
    phone: '+234 805 555 3344',
    rating: 4.6,
    jobsCompleted: 21,
  },
  {
    id: 'vendor_003',
    name: 'SecureLine Systems',
    serviceType: 'Security',
    phone: '+234 812 555 5566',
    rating: 4.9,
    jobsCompleted: 15,
  },
  {
    id: 'vendor_004',
    name: 'NetSpeed ISP',
    serviceType: 'Internet',
    phone: '+234 701 555 7788',
    rating: 4.3,
    jobsCompleted: 40,
  },
];

export default function LandlordVendorsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
      setVendors(mockVendors);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleAddVendor = (data: Omit<Vendor, 'id' | 'rating' | 'jobsCompleted'>) => {
    const newVendor: Vendor = { ...data, id: `vendor_${Date.now()}`, rating: 0, jobsCompleted: 0 };
    setVendors((prev) => [newVendor, ...prev]);
  };

  const handleRemoveVendor = (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <LandlordNavbar user={user} />

      <div className="flex">
        <LandlordSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendors</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {vendors.length} vendor{vendors.length === 1 ? '' : 's'} in your directory
                </p>
              </div>
              <Button variant="primary" className="gap-2" onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Vendor
              </Button>
            </div>

            <div className="relative max-w-sm mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendors..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
              />
            </div>

            {filteredVendors.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <HardHat className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No vendors found</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredVendors.map((vendor, index) => (
                  <VendorCard
                    key={vendor.id}
                    vendor={vendor}
                    delay={index * 0.05}
                    onRemove={handleRemoveVendor}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <AddVendorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddVendor}
      />
    </div>
  );
}
