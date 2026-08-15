'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Wrench,
  Droplets,
  Wifi,
  Shield,
  Plus,
  ChevronRight,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { CreateMaintenanceRequestInput, MaintenanceCategory } from '@/types/maintenance';

interface QuickReportProps {
  onQuickReport: (data: CreateMaintenanceRequestInput) => Promise<boolean>;
}

const quickOptions: {
  id: string;
  icon: LucideIcon;
  label: string;
  category: MaintenanceCategory;
  description: string;
}[] = [
  {
    id: 'leaking_faucet',
    icon: Droplets,
    label: 'Leaking Faucet',
    category: 'plumbing',
    description: 'Water leaking from faucet or pipe',
  },
  {
    id: 'power_outage',
    icon: Zap,
    label: 'Power Outage',
    category: 'electrical',
    description: 'No electricity in some or all rooms',
  },
  {
    id: 'internet_down',
    icon: Wifi,
    label: 'Internet Down',
    category: 'internet',
    description: 'No internet connection',
  },
  {
    id: 'security_issue',
    icon: Shield,
    label: 'Security Issue',
    category: 'security',
    description: 'Lock, alarm, or security concern',
  },
];

export const QuickReport = ({ onQuickReport }: QuickReportProps) => {
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
          <h3 className="font-semibold text-foreground">Quick Report</h3>
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
              key={option.id}
              onClick={() => handleQuickReport(option)}
              disabled={isSelected || Boolean(pendingOptionId)}
              aria-busy={isPending}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'hover:bg-secondary border-transparent disabled:cursor-not-allowed disabled:opacity-60'
              } border`}
            >
              <div
                className={`p-2 rounded-lg ${
                  isSelected ? 'bg-green-100 dark:bg-green-900/40' : 'bg-secondary'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-green-600' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{option.label}</p>
                <p className="text-xs text-gray-500">{option.description}</p>
              </div>
              {isSelected ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : isPending ? (
                <span className="text-xs font-medium text-muted-foreground">Sending…</span>
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
          );
        })}

        <Button variant="ghost" size="sm" fullWidth className="gap-1 mt-2">
          <Plus className="w-3 h-3" />
          Custom Report
        </Button>
      </div>
    </motion.div>
  );
};
