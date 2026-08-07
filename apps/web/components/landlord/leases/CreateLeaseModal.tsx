'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Lease, Unit } from '@/types/landlord';

interface CreateLeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacantUnits: Unit[];
  onSave: (lease: Omit<Lease, 'id' | 'status' | 'createdAt'>, sendImmediately: boolean) => void;
}

export const CreateLeaseModal = ({
  isOpen,
  onClose,
  vacantUnits,
  onSave,
}: CreateLeaseModalProps) => {
  const [unitId, setUnitId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [leaseStart, setLeaseStart] = useState('');
  const [leaseEnd, setLeaseEnd] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');

  const selectedUnit = useMemo(
    () => vacantUnits.find((u) => u.id === unitId),
    [vacantUnits, unitId]
  );

  const handleUnitChange = (id: string) => {
    setUnitId(id);
    const unit = vacantUnits.find((u) => u.id === id);
    if (unit && !rentAmount) setRentAmount(String(unit.monthlyRent));
  };

  const reset = () => {
    setUnitId('');
    setTenantName('');
    setLeaseStart('');
    setLeaseEnd('');
    setRentAmount('');
    setSecurityDeposit('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isValid =
    selectedUnit && tenantName.trim() && leaseStart && leaseEnd && Number(rentAmount) > 0;

  const buildLease = (): Omit<Lease, 'id' | 'status' | 'createdAt'> | null => {
    if (!selectedUnit || !isValid) return null;
    return {
      tenantId: `tenant_${Date.now()}`,
      tenantName: tenantName.trim(),
      propertyId: selectedUnit.propertyId,
      propertyName: selectedUnit.propertyName,
      unitId: selectedUnit.id,
      unitName: selectedUnit.unitName,
      leaseStart,
      leaseEnd,
      rentAmount: Number(rentAmount),
      securityDeposit: securityDeposit ? Number(securityDeposit) : undefined,
    };
  };

  const handleSave = (sendImmediately: boolean) => {
    const lease = buildLease();
    if (!lease) return;
    onSave(lease, sendImmediately);
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
            className="bg-white dark:bg-[#1a2a2f] rounded-xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Create Lease</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Draft a new lease agreement
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {vacantUnits.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  No vacant units available. Mark a unit vacant or add a property first.
                </p>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={unitId}
                      onChange={(e) => handleUnitChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                    >
                      <option value="">Select a vacant unit</option>
                      {vacantUnits.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.propertyName} — {u.unitName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tenant Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      placeholder="Full legal name"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Lease Start <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={leaseStart}
                        onChange={(e) => setLeaseStart(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Lease End <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={leaseEnd}
                        onChange={(e) => setLeaseEnd(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Rent Amount (₦) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={rentAmount}
                        onChange={(e) => setRentAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Deposit (₦)
                      </label>
                      <input
                        type="number"
                        value={securityDeposit}
                        onChange={(e) => setSecurityDeposit(e.target.value)}
                        placeholder="Optional"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {vacantUnits.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-white/10 flex gap-3 flex-shrink-0">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => handleSave(false)}
                  disabled={!isValid}
                >
                  Save Draft
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => handleSave(true)}
                  disabled={!isValid}
                >
                  Send Lease
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
