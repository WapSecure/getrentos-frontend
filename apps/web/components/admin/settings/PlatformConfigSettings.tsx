'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface RoleRequirement {
  role: string;
  requiresVerification: boolean;
}

const initialRoleRequirements: RoleRequirement[] = [
  { role: 'Landlord', requiresVerification: true },
  { role: 'Property Owner', requiresVerification: true },
  { role: 'Realtor', requiresVerification: true },
  { role: 'Agent', requiresVerification: true },
  { role: 'Renter', requiresVerification: false },
  { role: 'Buyer', requiresVerification: false },
];

export const PlatformConfigSettings = () => {
  const [minTrustScore, setMinTrustScore] = useState(60);
  const [escrowHoldDays, setEscrowHoldDays] = useState(3);
  const [autoFlagFraud, setAutoFlagFraud] = useState(true);
  const [roleRequirements, setRoleRequirements] = useState(initialRoleRequirements);

  const toggleRole = (role: string) => {
    setRoleRequirements((prev) =>
      prev.map((r) =>
        r.role === role ? { ...r, requiresVerification: !r.requiresVerification } : r
      )
    );
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Platform Configuration
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Default thresholds and role verification rules applied platform-wide
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Minimum Trust Score for Auto-Approval
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={minTrustScore}
            onChange={(e) => setMinTrustScore(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Escrow Verification Hold Period (days)
          </label>
          <input
            type="number"
            min={0}
            max={30}
            value={escrowHoldDays}
            onChange={(e) => setEscrowHoldDays(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Auto-flag suspicious activity for review
          </span>
          <button
            onClick={() => setAutoFlagFraud((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              autoFlagFraud ? 'bg-[#c4a747]' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoFlagFraud ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Roles Requiring Manual Verification
          </p>
          <div className="space-y-2">
            {roleRequirements.map((r) => (
              <div
                key={r.role}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">{r.role}</span>
                <button
                  onClick={() => toggleRole(r.role)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    r.requiresVerification ? 'bg-[#c4a747]' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${r.requiresVerification ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button variant="primary" className="mt-6">
        Save Configuration
      </Button>
    </div>
  );
};
