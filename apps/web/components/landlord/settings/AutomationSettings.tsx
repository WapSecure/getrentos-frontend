'use client';

import { useState, useEffect } from 'react';
import { BellRing, AlertOctagon, FileText, CalendarClock } from 'lucide-react';
import { landlordService, type LandlordAutomationSettings } from '@/services/landlordService';

interface AutomationToggle {
  id: keyof LandlordAutomationSettings;
  label: string;
  description: string;
  icon: React.ElementType;
}

const TOGGLE_META: AutomationToggle[] = [
  {
    id: 'rentReminders',
    label: 'Send Rent Reminders',
    description: 'Automatically remind tenants a few days before rent is due',
    icon: BellRing,
  },
  {
    id: 'overdueAlerts',
    label: 'Send Overdue Alerts',
    description: 'Notify tenants and yourself when a payment becomes overdue',
    icon: AlertOctagon,
  },
  {
    id: 'autoInvoices',
    label: 'Auto-Generate Invoices',
    description: 'Create a rent invoice automatically each billing cycle',
    icon: FileText,
  },
  {
    id: 'leaseExpiry',
    label: 'Lease Expiry Alerts',
    description: 'Get notified 60 days before a lease is set to expire',
    icon: CalendarClock,
  },
];

const DEFAULT_SETTINGS: LandlordAutomationSettings = {
  rentReminders: true,
  overdueAlerts: true,
  autoInvoices: false,
  leaseExpiry: true,
};

export const AutomationSettings = () => {
  const [settings, setSettings] = useState<LandlordAutomationSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const fetchSettings = async () => {
      const response = await landlordService.getAutomationSettings();
      if (response.success && response.data) setSettings(response.data);
    };

    fetchSettings();
  }, []);

  const toggle = (id: keyof LandlordAutomationSettings) => {
    const next = { ...settings, [id]: !settings[id] };
    setSettings(next);
    landlordService.updateAutomationSettings(next);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Automation & Reminders</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Let GetRentos handle routine communication with your tenants
      </p>

      <div className="space-y-3">
        {TOGGLE_META.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-secondary shrink-0">
                <item.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
            </div>
            <button
              onClick={() => toggle(item.id)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                settings[item.id] ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[item.id] ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
