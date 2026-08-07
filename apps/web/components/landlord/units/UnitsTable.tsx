'use client';

import { useState } from 'react';
import { Bed, Bath, UserPlus, DoorClosed, MoreVertical } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import type { Unit, UnitOccupancyStatus } from '@/types/landlord';

const statusConfig: Record<UnitOccupancyStatus, { label: string; className: string }> = {
  occupied: {
    label: 'Occupied',
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  vacant: {
    label: 'Vacant',
    className: 'text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
  },
  notice_given: {
    label: 'Notice Given',
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
};

interface UnitsTableProps {
  units: Unit[];
  onMarkVacant: (unitId: string) => void;
  onAssignTenant: (unitId: string, tenantName: string) => void;
}

export const UnitsTable = ({ units, onMarkVacant, onAssignTenant }: UnitsTableProps) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [assigningUnitId, setAssigningUnitId] = useState<string | null>(null);
  const [tenantNameInput, setTenantNameInput] = useState('');

  const handleAssignSubmit = (unitId: string) => {
    if (!tenantNameInput.trim()) return;
    onAssignTenant(unitId, tenantNameInput.trim());
    setAssigningUnitId(null);
    setTenantNameInput('');
  };

  if (units.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
        <DoorClosed className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No units found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-white/10 text-left">
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Unit</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Property</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Details</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Rent</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Tenant</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {units.map((unit) => {
              const status = statusConfig[unit.occupancyStatus];
              return (
                <tr
                  key={unit.id}
                  className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {unit.unitName}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {unit.propertyName}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5" />
                      {unit.bedrooms}
                    </span>
                    <span className="inline-flex items-center gap-1 ml-3">
                      <Bath className="w-3.5 h-3.5" />
                      {unit.bathrooms}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium whitespace-nowrap">
                    {formatCurrency(unit.monthlyRent, { compact: true })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {unit.tenantName || '—'}
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === unit.id ? null : unit.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>

                    {openMenuId === unit.id && (
                      <div className="absolute right-4 top-10 z-20 w-44 bg-white dark:bg-[#0f1f24] rounded-lg shadow-lg border border-gray-200 dark:border-white/10 py-1">
                        {unit.occupancyStatus === 'vacant' ? (
                          <button
                            onClick={() => {
                              setAssigningUnitId(unit.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Assign Tenant
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onMarkVacant(unit.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                          >
                            <DoorClosed className="w-3.5 h-3.5" />
                            Mark Vacant
                          </button>
                        )}
                      </div>
                    )}

                    {assigningUnitId === unit.id && (
                      <div className="absolute right-4 top-10 z-30 w-56 bg-white dark:bg-[#0f1f24] rounded-lg shadow-lg border border-gray-200 dark:border-white/10 p-3">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Tenant name
                        </label>
                        <input
                          type="text"
                          autoFocus
                          value={tenantNameInput}
                          onChange={(e) => setTenantNameInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAssignSubmit(unit.id)}
                          placeholder="e.g. Adaeze Okafor"
                          className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleAssignSubmit(unit.id)}
                            className="flex-1 text-xs font-medium text-[#0a1a1f] bg-[#c4a747] rounded-md py-1.5 hover:bg-[#a88d3a]"
                          >
                            Assign
                          </button>
                          <button
                            onClick={() => {
                              setAssigningUnitId(null);
                              setTenantNameInput('');
                            }}
                            className="flex-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 rounded-md py-1.5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
