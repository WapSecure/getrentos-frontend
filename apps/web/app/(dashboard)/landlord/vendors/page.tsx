'use client';

import { useState, useEffect } from 'react';
import { Plus, HardHat, Search } from 'lucide-react';
import { VendorCard } from '@/components/landlord/vendors/VendorCard';
import { AddVendorModal } from '@/components/landlord/vendors/AddVendorModal';
import { Button } from '@/components/ui/Button';
import { landlordService } from '@/services/landlordService';
import type { Vendor } from '@/types/landlord';

export default function LandlordVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const fetchVendors = async () => {
      const response = await landlordService.listVendors();
      if (response.success && response.data) setVendors(response.data);
    };

    fetchVendors();
  }, []);

  const handleAddVendor = async (data: Omit<Vendor, 'id' | 'rating' | 'jobsCompleted'>) => {
    const response = await landlordService.addVendor(data);
    if (response.success && response.data) {
      setVendors((prev) => [response.data!, ...prev]);
    }
  };

  const handleRemoveVendor = async (id: string) => {
    const response = await landlordService.removeVendor(id);
    if (response.success) {
      setVendors((prev) => prev.filter((v) => v.id !== id));
    }
  };

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendors</h1>
          <p className="text-muted-foreground mt-1">
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
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {filteredVendors.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <HardHat className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No vendors found</p>
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

      <AddVendorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddVendor}
      />
    </>
  );
}
