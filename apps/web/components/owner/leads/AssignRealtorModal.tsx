'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { X, UserPlus, Check, Loader2, Users } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { getInitials } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { ownerService } from '@/services/ownerService';
import { ownerKeys } from '@/lib/queryKeys';
import type { BuyerLead } from '@/types/owner';

interface AssignRealtorModalProps {
  lead: BuyerLead | null;
  onClose: () => void;
  onAssign: (leadId: string, realtorName: string) => void;
}

export const AssignRealtorModal = ({ lead, onClose, onAssign }: AssignRealtorModalProps) => {
  const [selectedId, setSelectedId] = useState('');
  const [assigned, setAssigned] = useState(false);
  const { data: realtors = [], isLoading } = useQuery({
    queryKey: ownerKeys.realtors,
    queryFn: () => unwrap(ownerService.getRealtors()),
  });

  if (!lead) return null;

  const handleClose = () => {
    setSelectedId('');
    setAssigned(false);
    onClose();
  };

  const selectedRealtor = realtors.find((r) => r.id === selectedId);

  const handleAssign = () => {
    if (!selectedRealtor) return;
    onAssign(lead.id, selectedRealtor.name);
    setAssigned(true);
  };

  return (
    <AnimatePresence>
      {lead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-sm w-full overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">Assign Realtor</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lead.buyerName} · {lead.propertyName}
                </p>
              </div>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {assigned ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                    <Check className="w-7 h-7 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm text-foreground">
                    {selectedRealtor?.name} has been assigned to this lead.
                  </p>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading realtors…
                </div>
              ) : realtors.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-secondary flex items-center justify-center">
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-foreground">No verified realtors yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Realtors appear here once their identity is verified.
                  </p>
                </div>
              ) : (
                realtors.map((realtor) => (
                  <button
                    key={realtor.id}
                    onClick={() => setSelectedId(realtor.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      selectedId === realtor.id
                        ? 'border-primary bg-accent'
                        : 'border-border hover:bg-secondary'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-xs shrink-0">
                      {getInitials(realtor.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{realtor.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{realtor.speciality}</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              {assigned ? (
                <Button variant="primary" className="w-full" onClick={handleClose}>
                  Done
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={handleClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 gap-2"
                    onClick={handleAssign}
                    disabled={!selectedId}
                  >
                    <UserPlus className="w-4 h-4" />
                    Assign
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
