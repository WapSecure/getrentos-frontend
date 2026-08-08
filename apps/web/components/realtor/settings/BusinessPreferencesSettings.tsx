'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const serviceAreaOptions = ['Victoria Island', 'Lekki', 'Ikoyi', 'Ikeja', 'Surulere', 'Yaba'];

export const BusinessPreferencesSettings = () => {
  const [defaultCommissionRate, setDefaultCommissionRate] = useState('5');
  const [serviceAreas, setServiceAreas] = useState<string[]>(['Lekki', 'Victoria Island']);
  const [autoNotifyClients, setAutoNotifyClients] = useState(true);

  const toggleArea = (area: string) => {
    setServiceAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Business Preferences
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Defaults used across your listings and deals
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Default Commission Rate (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={defaultCommissionRate}
            onChange={(e) => setDefaultCommissionRate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Service Areas
          </label>
          <div className="flex flex-wrap gap-2">
            {serviceAreaOptions.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => toggleArea(area)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  serviceAreas.includes(area)
                    ? 'border-[#c4a747] bg-[#c4a747]/10 text-[#c4a747]'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
          <div className="flex items-start gap-3">
            <Bell className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Auto-notify clients of new leads
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Send your client a heads-up whenever a new lead comes in on their listing
              </p>
            </div>
          </div>
          <Toggle checked={autoNotifyClients} onChange={() => setAutoNotifyClients((v) => !v)} />
        </label>
      </div>

      <Button variant="primary" className="mt-6">
        Save Preferences
      </Button>
    </div>
  );
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
      checked ? 'bg-[#c4a747]' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);
