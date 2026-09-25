'use client';

import { useState, useEffect } from 'react';
import { BellRing, AlertOctagon, FileText, CalendarClock, CalendarDays } from 'lucide-react';
import { NumberInput } from '@getrentos/ui';
import { landlordService, type LandlordAutomationSettings } from '@/services/landlordService';
import { UpgradeToProModal } from '@/components/shared/subscription/UpgradeToProModal';
import type { PlanGateReason } from '@/lib/planGate';

/** The switches, as opposed to the numeric policy that sits below them. */
type AutomationToggleKey = 'rentReminders' | 'overdueAlerts' | 'autoInvoices' | 'leaseExpiry';

interface AutomationToggle {
  id: AutomationToggleKey;
  label: string;
  description: string;
  icon: React.ElementType;
  /** No automation behind this yet — shown, but not switchable, so it never promises what won't happen. */
  comingSoon?: boolean;
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
    comingSoon: true,
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
  graceDays: 5,
};

/** Mirrors MAX_RENT_GRACE_DAYS on the API, which rejects anything larger. */
const MAX_GRACE_DAYS = 90;

export const AutomationSettings = () => {
  const [settings, setSettings] = useState<LandlordAutomationSettings>(DEFAULT_SETTINGS);
  const [graceDays, setGraceDays] = useState(DEFAULT_SETTINGS.graceDays);
  const [upgradeReason, setUpgradeReason] = useState<PlanGateReason | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const response = await landlordService.getAutomationSettings();
      if (response.success && response.data) {
        setSettings(response.data);
        setGraceDays(response.data.graceDays);
      }
    };

    fetchSettings();
  }, []);

  const toggle = async (id: AutomationToggleKey) => {
    const previous = settings;
    const next = { ...settings, [id]: !settings[id] };
    setSettings(next);
    const response = await landlordService.updateAutomationSettings(next);
    if (!response.success) {
      setSettings(previous);
      if (response.planGateReason) setUpgradeReason(response.planGateReason);
    }
  };

  /**
   * Saved on blur rather than per keystroke: the endpoint takes the whole
   * settings object, and "3" on the way to "30" is not a window anyone chose.
   */
  const saveGraceDays = async (value: number) => {
    if (value === settings.graceDays) return;
    // Out of range: leave the field alone so the warning beside it can explain
    // why, rather than sending a request the API will reject.
    if (value < 0 || value > MAX_GRACE_DAYS) return;
    const previous = settings;
    const next = { ...settings, graceDays: value };
    setSettings(next);
    const response = await landlordService.updateAutomationSettings(next);
    if (response.success && response.data) {
      setSettings(response.data);
      setGraceDays(response.data.graceDays);
      return;
    }
    // Put the field back where it was, so it never shows a value we did not store.
    setSettings(previous);
    setGraceDays(previous.graceDays);
    if (response.planGateReason) setUpgradeReason(response.planGateReason);
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
                <p className="text-sm font-medium text-foreground">
                  {item.label}
                  {item.comingSoon && (
                    <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      Coming soon
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={item.comingSoon ? false : settings[item.id]}
              aria-label={item.label}
              disabled={item.comingSoon}
              onClick={() => toggle(item.id)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 disabled:cursor-not-allowed disabled:opacity-50 ${
                settings[item.id] && !item.comingSoon
                  ? 'bg-primary'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[item.id] && !item.comingSoon ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg border border-border">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-secondary shrink-0">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Grace period before rent counts as late
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {graceDays === 0
                ? 'Rent is flagged overdue the moment its due date passes.'
                : `Rent may run ${graceDays} day${graceDays === 1 ? '' : 's'} past its due date before it is flagged overdue and alerts go out.`}
            </p>
            <div className="mt-3 w-40">
              <NumberInput
                id="graceDays"
                min={0}
                max={MAX_GRACE_DAYS}
                value={graceDays}
                // NumberInput hands back the digit string; keep the state numeric
                // so the saved payload satisfies the API's integer validation.
                onValueChange={(value) => setGraceDays(Number(value) || 0)}
                onBlur={() => void saveGraceDays(graceDays)}
                placeholder="e.g. 5"
              />
            </div>
            {graceDays > MAX_GRACE_DAYS && (
              <p className="text-xs text-destructive mt-1">
                {MAX_GRACE_DAYS} days is the maximum — beyond that rent would never be flagged.
              </p>
            )}
          </div>
        </div>
      </div>

      <UpgradeToProModal
        isOpen={upgradeReason !== null}
        onClose={() => setUpgradeReason(null)}
        reason={upgradeReason ?? undefined}
      />
    </div>
  );
};
