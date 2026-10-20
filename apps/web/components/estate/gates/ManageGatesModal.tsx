'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, X } from 'lucide-react';
import { Button, IconButton, Input, ListSkeleton } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';

interface ManageGatesModalProps {
  isOpen: boolean;
  estateId: string;
  onClose: () => void;
}

/**
 * Compact add/list/delete surface for an estate's gates, reachable from both
 * estate/vehicles and estate/deliveries: small enough that it doesn't
 * warrant a dedicated route.
 */
export const ManageGatesModal = ({ isOpen, estateId, onClose }: ManageGatesModalProps) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  const { data: gates, isLoading } = useQuery({
    queryKey: estateKeys.gates(estateId),
    queryFn: () => unwrap(estateService.listGates(estateId)),
    enabled: isOpen && !!estateId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: estateKeys.gates(estateId) });

  const createGate = useMutation({
    mutationFn: () =>
      unwrap(
        estateService.createGate(estateId, {
          name: name.trim(),
          location: location.trim() || undefined,
        })
      ),
    onSuccess: () => {
      setName('');
      setLocation('');
      invalidate();
    },
  });

  const deleteGate = useMutation({
    mutationFn: (gateId: string) => unwrap(estateService.deleteGate(estateId, gateId)),
    onSuccess: () => invalidate(),
  });

  const handleClose = () => {
    setName('');
    setLocation('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-sm w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-foreground">Manage Gates</h3>
              <IconButton label="Close" icon={<X />} size="sm" onClick={handleClose} />
            </div>

            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <ListSkeleton rows={2} label="Loading gates" className="rounded-none border-0" />
              ) : !gates || gates.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">
                  No gates configured yet. Add one below if this estate has more than one entrance.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {gates.map((gate) => (
                    <div key={gate.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{gate.name}</p>
                        {gate.location && (
                          <p className="text-xs text-muted-foreground truncate">{gate.location}</p>
                        )}
                      </div>
                      <IconButton
                        label={`Delete ${gate.name}`}
                        icon={<Trash2 />}
                        variant="danger"
                        size="sm"
                        onClick={() => deleteGate.mutate(gate.id)}
                        disabled={deleteGate.isPending}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border space-y-3 shrink-0">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Gate name (e.g. Main Gate)"
                  aria-label="Gate name"
                />
                <Input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location (optional)"
                  aria-label="Location"
                />
              </div>
              <Button
                variant="primary"
                fullWidth
                disabled={!name.trim()}
                isLoading={createGate.isPending}
                loadingText="Adding…"
                onClick={() => createGate.mutate()}
              >
                Add Gate
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
