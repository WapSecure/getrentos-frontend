'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, Camera, UserCheck } from 'lucide-react';
import { Button } from '@getrentos/ui';
import type { RenterInspection, RenterRoomCondition } from '@/types/renter';

const conditionConfig: Record<RenterRoomCondition, string> = {
  excellent: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  good: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  fair: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  poor: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
};

const typeLabels: Record<RenterInspection['type'], string> = {
  move_in: 'Move-in inspection',
  move_out: 'Move-out inspection',
  periodic: 'Periodic inspection',
  other: 'Inspection',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

interface InspectionAcknowledgeModalProps {
  inspection: RenterInspection | null;
  onClose: () => void;
  onAcknowledge: (id: string) => void;
  isAcknowledging?: boolean;
}

export const InspectionAcknowledgeModal = ({
  inspection,
  onClose,
  onAcknowledge,
  isAcknowledging,
}: InspectionAcknowledgeModalProps) => {
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
                <h3 className="font-semibold text-foreground">{typeLabels[inspection.type]}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {inspection.propertyAddress} · {formatDate(inspection.scheduledDate)}
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
                  {!!room.photoCount && (
                    <p className="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
                      <Camera className="w-3 h-3" />
                      {room.photoCount} photo{room.photoCount === 1 ? '' : 's'}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border shrink-0">
              {inspection.acknowledgedAt ? (
                <p className="flex items-center justify-center gap-1.5 text-sm text-success">
                  <UserCheck className="w-4 h-4" />
                  Acknowledged {formatDate(inspection.acknowledgedAt)}
                </p>
              ) : (
                <>
                  <Button
                    variant="primary"
                    fullWidth
                    className="gap-1.5"
                    onClick={() => onAcknowledge(inspection.id)}
                    disabled={isAcknowledging}
                  >
                    <UserCheck className="w-4 h-4" />
                    {isAcknowledging ? 'Saving…' : 'Confirm I reviewed this record'}
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground text-center">
                    Acknowledging confirms you reviewed the recorded room conditions. It does not
                    waive your right to dispute any item.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
