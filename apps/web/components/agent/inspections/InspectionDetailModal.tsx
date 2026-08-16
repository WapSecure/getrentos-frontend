'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, Camera, RefreshCw } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { formatDate } from '@/lib/format';
import type { PropertyInspection, RoomCondition } from '@/types/agent';

const conditionConfig: Record<RoomCondition, string> = {
  excellent: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  good: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  fair: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  poor: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
};

interface InspectionDetailModalProps {
  inspection: PropertyInspection | null;
  onClose: () => void;
  onSync: (inspectionId: string) => void;
}

export const InspectionDetailModal = ({
  inspection,
  onClose,
  onSync,
}: InspectionDetailModalProps) => {
  if (!inspection) return null;

  return (
    <AnimatePresence>
      {inspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-semibold text-foreground">{inspection.propertyAddress}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {inspection.clientName} · {formatDate(inspection.scheduledDate)}
                </p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {inspection.rooms.map((room, index) => (
                <div key={index} className="p-3 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{room.room}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${conditionConfig[room.condition]}`}
                    >
                      {room.condition.charAt(0).toUpperCase() + room.condition.slice(1)}
                    </span>
                  </div>
                  {room.notes && <p className="text-xs text-muted-foreground mt-1">{room.notes}</p>}
                  {room.photoCount > 0 && (
                    <p className="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
                      <Camera className="w-3 h-3" />
                      {room.photoCount} photo{room.photoCount === 1 ? '' : 's'}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border flex gap-3 shrink-0">
              <Button variant="ghost" className="flex-1" onClick={onClose}>
                Close
              </Button>
              {inspection.syncStatus !== 'synced' && (
                <Button
                  variant="primary"
                  className="flex-1 gap-1.5"
                  onClick={() => onSync(inspection.id)}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync Now
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
