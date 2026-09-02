'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, DocumentUpload, LegacyInput, Select } from '@getrentos/ui';
import type { Gate } from '@/types/estate';

const purposeOptions = [
  { value: 'VISITOR', label: 'Visitor' },
  { value: 'RESIDENT', label: 'Resident' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'OTHER', label: 'Other' },
];

interface LogVehicleModalProps {
  isOpen: boolean;
  gates?: Gate[];
  onClose: () => void;
  onSubmit: (data: {
    plateNumber: string;
    vehicleDescription?: string;
    driverName?: string;
    purpose?: 'VISITOR' | 'RESIDENT' | 'DELIVERY' | 'STAFF' | 'OTHER';
    gateId?: string;
    photo?: File;
  }) => void;
  isSubmitting?: boolean;
}

export const LogVehicleModal = ({
  isOpen,
  gates,
  onClose,
  onSubmit,
  isSubmitting,
}: LogVehicleModalProps) => {
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleDescription, setVehicleDescription] = useState('');
  const [driverName, setDriverName] = useState('');
  const [purpose, setPurpose] = useState('VISITOR');
  const [gateId, setGateId] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const gateOptions = (gates ?? []).map((gate) => ({ value: gate.id, label: gate.name }));

  const handleClose = () => {
    setPlateNumber('');
    setVehicleDescription('');
    setDriverName('');
    setPurpose('VISITOR');
    setGateId('');
    setPhoto(null);
    onClose();
  };

  const canSubmit = plateNumber.trim().length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-foreground">Log Vehicle</h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Plate number
                </label>
                <LegacyInput
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  placeholder="ABC123XY"
                  className="uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <LegacyInput
                    type="text"
                    value={vehicleDescription}
                    onChange={(e) => setVehicleDescription(e.target.value)}
                    placeholder="e.g. Black Camry"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Driver <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <LegacyInput
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Tunde"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Purpose</label>
                <Select value={purpose} onValueChange={setPurpose} options={purposeOptions} />
              </div>

              {gateOptions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Gate</label>
                  <Select
                    value={gateId}
                    onValueChange={setGateId}
                    options={[{ value: '', label: 'Not specified' }, ...gateOptions]}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Photo <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <DocumentUpload
                  value={photo ? [{ id: 'photo', file: photo }] : []}
                  onChange={(items) => setPhoto(items[0]?.file ?? null)}
                  accept="image/*"
                  multiple={false}
                  label=""
                />
              </div>
            </div>

            <div className="p-4 border-t border-border flex gap-3 shrink-0">
              <Button variant="ghost" fullWidth onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={!canSubmit || isSubmitting}
                onClick={() =>
                  onSubmit({
                    plateNumber: plateNumber.trim(),
                    vehicleDescription: vehicleDescription.trim() || undefined,
                    driverName: driverName.trim() || undefined,
                    purpose: purpose as 'VISITOR' | 'RESIDENT' | 'DELIVERY' | 'STAFF' | 'OTHER',
                    gateId: gateId || undefined,
                    photo: photo ?? undefined,
                  })
                }
              >
                {isSubmitting ? 'Logging…' : 'Log Vehicle'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
