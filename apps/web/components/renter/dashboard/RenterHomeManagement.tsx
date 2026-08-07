'use client';

import { motion } from 'framer-motion';
import {
  Zap,
  Droplets,
  Thermometer,
  Wifi,
  Key,
  Users,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Utility {
  id: string;
  name: string;
  icon: React.ElementType;
  usage: string;
  status: 'normal' | 'high' | 'low';
  dueDate?: string;
  amount?: number;
}

const utilities: Utility[] = [
  {
    id: '1',
    name: 'Electricity',
    icon: Zap,
    usage: '342 kWh',
    status: 'normal',
    dueDate: '2024-09-05',
    amount: 25000,
  },
  {
    id: '2',
    name: 'Water',
    icon: Droplets,
    usage: '12 m³',
    status: 'normal',
    dueDate: '2024-08-28',
    amount: 5000,
  },
  {
    id: '3',
    name: 'Internet',
    icon: Wifi,
    usage: 'Unlimited',
    status: 'normal',
    dueDate: '2024-09-01',
    amount: 15000,
  },
];

export const RenterHomeManagement = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden mt-6"
    >
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Home Management</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track utilities and guest access
            </p>
          </div>
          <Button variant="ghost" size="sm">
            Manage
          </Button>
        </div>
      </div>

      <div className="p-4">
        {/* Utilities Section */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Utilities</h3>
          <div className="space-y-3">
            {utilities.map((utility) => (
              <div
                key={utility.id}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#c4a747]/10">
                    <utility.icon className="w-4 h-4 text-[#c4a747]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {utility.name}
                    </p>
                    <p className="text-xs text-gray-500">Usage: {utility.usage}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {utility.amount
                      ? new Intl.NumberFormat('en-NG', {
                          style: 'currency',
                          currency: 'NGN',
                        }).format(utility.amount)
                      : 'Included'}
                  </p>
                  {utility.dueDate && (
                    <p className="text-xs text-gray-500">
                      Due{' '}
                      {new Date(utility.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Guest Access Section */}
        <div className="pt-3 border-t border-gray-200 dark:border-white/10">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Guest Access</h3>
            <Button size="sm" variant="ghost" className="text-xs">
              Add Guest
            </Button>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <Key className="w-4 h-4 text-[#c4a747]" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Temporary Access Code
                </p>
                <p className="text-xs text-gray-500">Expires: Sep 15, 2024</p>
              </div>
            </div>
            <button className="text-xs text-[#c4a747] hover:text-[#a88d3a]">Generate</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
