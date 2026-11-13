'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Wrench,
  Droplets,
  Wifi,
  Shield,
  Power,
  Waves,
  Plus,
  ChevronRight,
  CheckCircle,
  type SgIcon,
} from '@sureground/icons';
import { Button } from '@sureground/ui';
import type { CreateMaintenanceRequestInput, MaintenanceCategory } from '@/types/maintenance';

interface QuickReportProps {
  onQuickReport: (data: CreateMaintenanceRequestInput) => Promise<boolean>;
  onCustomReport: () => void;
}

const quickOptions: {
  id: string;
  icon: SgIcon;
  label: string;
  category: MaintenanceCategory;
  description: string;
}[] = [
  {
    id: 'leaking_faucet',
    icon: Droplets,
    label: 'Leaking tap',
    category: 'plumbing',
    description: 'Water leaking from a tap or pipe',
  },
  {
    id: 'no_water',
    icon: Waves,
    label: 'No water',
    category: 'water_borehole',
    description: 'Taps are dry, or the pump or borehole has stopped',
  },
  {
    id: 'generator_fault',
    icon: Power,
    label: 'Generator or inverter fault',
    category: 'generator_power',
    description: 'Backup power is not working',
  },
  {
    id: 'power_outage',
    icon: Zap,
    label: 'Power outage',
    category: 'electrical',
    description: 'No electricity in some or all rooms',
  },
  {
    id: 'internet_down',
    icon: Wifi,
    label: 'Internet down',
    category: 'internet',
    description: 'No internet connection',
  },
  {
    id: 'security_issue',
    icon: Shield,
    label: 'Security issue',
    category: 'security',
    description: 'Lock, alarm, or security concern',
  },
];

export const QuickReport = ({ onQuickReport, onCustomReport }: QuickReportProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [pendingOptionId, setPendingOptionId] = useState<string | null>(null);

  const handleQuickReport = async (option: (typeof quickOptions)[0]) => {
    if (pendingOptionId) return;

    const data: CreateMaintenanceRequestInput = {
      title: option.label,
      category: option.category,
      priority: 'high',
      description: option.description,
    };

    setPendingOptionId(option.id);
    try {
      const wasSubmitted = await onQuickReport(data);
      if (wasSubmitted) {
        setSelected(option.id);
        window.setTimeout(() => setSelected(null), 2000);
      }
    } finally {
      setPendingOptionId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Quick report</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Report common issues in one click</p>
      </div>

      <div className="p-4 space-y-2">
        {quickOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.id;
          const isPending = pendingOptionId === option.id;

          return (
            <button
              type="button"
              key={option.id}
              onClick={() => handleQuickReport(option)}
              disabled={isSelected || Boolean(pendingOptionId)}
              aria-busy={isPending}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-success-subtle border-success/20'
                  : 'hover:bg-secondary border-transparent disabled:cursor-not-allowed disabled:opacity-60'
              } border`}
            >
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-success/10' : 'bg-secondary'}`}>
                <Icon
                  className={`w-4 h-4 ${isSelected ? 'text-success' : 'text-muted-foreground'}`}
                />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
              {isSelected ? (
                <CheckCircle className="w-4 h-4 text-success" />
              ) : isPending ? (
                <span className="text-xs font-medium text-muted-foreground">Sending…</span>
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          );
        })}

        <Button variant="ghost" size="sm" fullWidth className="gap-1 mt-2" onClick={onCustomReport}>
          <Plus className="w-3 h-3" />
          Custom report
        </Button>
      </div>
    </motion.div>
  );
};
