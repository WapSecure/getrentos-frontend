'use client';

import { motion } from 'framer-motion';
import { ClipboardCheck, CloudOff, Cloud, Camera, UserCheck } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { PropertyInspection, RoomCondition, InspectionType } from '@/types/agent';

const conditionConfig: Record<RoomCondition, { label: string; className: string }> = {
  excellent: {
    label: 'Excellent',
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  good: {
    label: 'Good',
    className: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  },
  fair: {
    label: 'Fair',
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  poor: { label: 'Poor', className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20' },
};

const typeConfig: Record<InspectionType, string> = {
  move_in: 'Move-in',
  move_out: 'Move-out',
  periodic: 'Periodic',
  other: 'Other',
};

interface InspectionCardProps {
  inspection: PropertyInspection;
  onClick: () => void;
  delay?: number;
}

export const InspectionCard = ({ inspection, onClick, delay = 0 }: InspectionCardProps) => {
  const totalPhotos = inspection.rooms.reduce((sum, r) => sum + r.photoCount, 0);
  const condition = inspection.overallCondition
    ? conditionConfig[inspection.overallCondition]
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
      className="bg-card rounded-2xl border border-border p-4 cursor-pointer hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-accent shrink-0">
            <ClipboardCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{inspection.propertyAddress}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {typeConfig[inspection.type]} · {inspection.clientName}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
            inspection.syncStatus === 'synced'
              ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
              : inspection.syncStatus === 'pending'
                ? 'text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20'
                : 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
          }`}
        >
          {inspection.syncStatus === 'synced' ? (
            <Cloud className="w-3 h-3" />
          ) : (
            <CloudOff className="w-3 h-3" />
          )}
          {inspection.syncStatus === 'synced'
            ? 'Synced'
            : inspection.syncStatus === 'pending'
              ? 'Pending Sync'
              : 'Sync Failed'}
        </span>
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <span>{inspection.rooms.length} rooms checked</span>
        <span className="flex items-center gap-1">
          <Camera className="w-3.5 h-3.5" />
          {totalPhotos} photos
        </span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <p className="text-xs text-gray-400">{formatDate(inspection.scheduledDate)}</p>
        <div className="flex items-center gap-2">
          {inspection.acknowledgedAt && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20">
              <UserCheck className="w-3 h-3" />
              Tenant signed off
            </span>
          )}
          {condition && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${condition.className}`}>
              {condition.label}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
