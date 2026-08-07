'use client';

import { useState } from 'react';
import { BellRing, AlertOctagon, FileText, CalendarClock } from 'lucide-react';

interface AutomationToggle {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
}

const initialToggles: AutomationToggle[] = [
  {
    id: 'rent_reminders',
    label: 'Send Rent Reminders',
    description: 'Automatically remind tenants a few days before rent is due',
    icon: BellRing,
    enabled: true,
  },
  {
    id: 'overdue_alerts',
    label: 'Send Overdue Alerts',
    description: 'Notify tenants and yourself when a payment becomes overdue',
    icon: AlertOctagon,
    enabled: true,
  },
  {
    id: 'auto_invoices',
    label: 'Auto-Generate Invoices',
    description: 'Create a rent invoice automatically each billing cycle',
    icon: FileText,
    enabled: false,
  },
  {
    id: 'lease_expiry',
    label: 'Lease Expiry Alerts',
    description: 'Get notified 60 days before a lease is set to expire',
    icon: CalendarClock,
    enabled: true,
  },
];

export const AutomationSettings = () => {
  const [toggles, setToggles] = useState(initialToggles);

  const toggle = (id: string) => {
    setToggles((prev) => prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Automation & Reminders
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Let GetRentos handle routine communication with your tenants
      </p>

      <div className="space-y-3">
        {toggles.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 flex-shrink-0">
                <item.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggle(item.id)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                item.enabled ? 'bg-[#c4a747]' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.enabled ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
