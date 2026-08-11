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
      className="bg-card rounded-xl border border-border overflow-hidden mt-6"
    >
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Home Management</h2>
            <p className="text-sm text-muted-foreground">Track utilities and guest access</p>
          </div>
          <Button variant="ghost" size="sm">
            Manage
          </Button>
        </div>
      </div>

      <div className="p-4">
        {/* Utilities Section */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Utilities</h3>
          <div className="space-y-3">
            {utilities.map((utility) => (
              <div
                key={utility.id}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent">
                    <utility.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{utility.name}</p>
                    <p className="text-xs text-gray-500">Usage: {utility.usage}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
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
        <div className="pt-3 border-t border-border">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-foreground">Guest Access</h3>
            <Button size="sm" variant="ghost" className="text-xs">
              Add Guest
            </Button>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <Key className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Temporary Access Code</p>
                <p className="text-xs text-gray-500">Expires: Sep 15, 2024</p>
              </div>
            </div>
            <button className="text-xs text-primary hover:text-primary-hover">Generate</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
