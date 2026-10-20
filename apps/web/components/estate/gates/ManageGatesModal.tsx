'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DoorOpen, Trash2 } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  EmptyState,
  Field,
  IconButton,
  Input,
  ListSkeleton,
} from '@getrentos/ui';
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
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="sm">
        <DialogTitle className="text-lg font-semibold text-foreground">Manage Gates</DialogTitle>

        <div className="mt-4">
          {isLoading ? (
            <ListSkeleton rows={2} label="Loading gates" />
          ) : !gates || gates.length === 0 ? (
            <EmptyState
              icon={DoorOpen}
              size="compact"
              title="No gates configured yet"
              description="Add one below if this estate has more than one entrance."
            />
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border">
              {gates.map((gate) => (
                <div key={gate.id} className="p-3 flex items-center justify-between gap-3">
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

        <div className="mt-6 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Gate name" required>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Main Gate"
              />
            </Field>
            <Field label="Location" optionalLabel="(optional)">
              <Input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Admiralty Way"
              />
            </Field>
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
      </DialogContent>
    </Dialog>
  );
};
