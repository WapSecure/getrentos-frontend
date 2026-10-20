'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DocumentUpload,
  Field,
  Input,
  Select,
} from '@getrentos/ui';
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
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="md">
        <DialogTitle className="text-lg font-semibold text-foreground">Log Vehicle</DialogTitle>

        <div className="mt-5 space-y-4">
          <Field label="Plate number" required>
            <Input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              placeholder="ABC123XY"
              inputClassName="uppercase"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Description" optionalLabel="(optional)">
              <Input
                type="text"
                value={vehicleDescription}
                onChange={(e) => setVehicleDescription(e.target.value)}
                placeholder="e.g. Black Camry"
              />
            </Field>
            <Field label="Driver" optionalLabel="(optional)">
              <Input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Tunde"
              />
            </Field>
          </div>

          <Field label="Purpose">
            <Select value={purpose} onValueChange={setPurpose} options={purposeOptions} />
          </Field>

          {gateOptions.length > 0 && (
            <Field label="Gate">
              <Select
                value={gateId}
                onValueChange={setGateId}
                options={[{ value: '', label: 'Not specified' }, ...gateOptions]}
              />
            </Field>
          )}

          <Field label="Photo" optionalLabel="(optional)">
            <DocumentUpload
              value={photo ? [{ id: 'photo', file: photo }] : []}
              onChange={(items) => setPhoto(items[0]?.file ?? null)}
              accept="image/*"
              multiple={false}
              label=""
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!canSubmit}
            isLoading={isSubmitting}
            loadingText="Logging…"
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
            Log Vehicle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
