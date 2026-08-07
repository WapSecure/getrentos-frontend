'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Wrench, Droplets, Wifi, Shield, Plus, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ReportData {
  title: string;
  category: string;
  priority: string;
  description: string;
}

interface QuickReportProps {
  onQuickReport: (data: ReportData) => void;
}

const quickOptions = [
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

  const handleQuickReport = (option: (typeof quickOptions)[0]) => {
    const data: ReportData = {
      title: option.label,
      category: option.category,
      priority: 'high',
      description: option.description,
    };
    onQuickReport(data);
    setSelected(option.id);
    setTimeout(() => setSelected(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-[#c4a747]" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Quick Report</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Report common issues in one click
        </p>
      </div>

      <div className="p-4 space-y-2">
        {quickOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleQuickReport(option)}
              disabled={isSelected}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'hover:bg-gray-50 dark:hover:bg-white/5 border-transparent'
              } border`}
            >
              <div
                className={`p-2 rounded-lg ${
                  isSelected ? 'bg-green-100 dark:bg-green-900/40' : 'bg-gray-100 dark:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-green-600' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{option.label}</p>
                <p className="text-xs text-gray-500">{option.description}</p>
              </div>
              {isSelected ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
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
