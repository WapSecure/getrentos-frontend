'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Trash2, Camera, Check } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { Input } from '@getrentos/ui';
import { Select } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { agentService } from '@/services/agentService';
import type {
  AgentTask,
  InspectionPhoto,
  PropertyInspection,
  InspectionRoomEntry,
  InspectionType,
  RoomCondition,
} from '@/types/agent';

interface NewInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: AgentTask[];
  defaultTaskId?: string;
  onSubmit: (inspection: Omit<PropertyInspection, 'id' | 'syncStatus' | 'acknowledgedAt'>) => void;
}

const conditionOptions: RoomCondition[] = ['excellent', 'good', 'fair', 'poor'];

const inspectionTypeOptions: { value: InspectionType; label: string }[] = [
  { value: 'move_in', label: 'Move-in' },
  { value: 'move_out', label: 'Move-out' },
  { value: 'periodic', label: 'Periodic' },
  { value: 'other', label: 'Other' },
];

const emptyRoom: InspectionRoomEntry = { room: '', condition: 'good', notes: '', photoCount: 0 };

export const NewInspectionModal = ({
  isOpen,
  onClose,
  tasks,
  defaultTaskId,
  onSubmit,
}: NewInspectionModalProps) => {
  const [taskId, setTaskId] = useState(defaultTaskId || '');
  const [type, setType] = useState<InspectionType>('periodic');
  const [clientName, setClientName] = useState('');
  const [rooms, setRooms] = useState<InspectionRoomEntry[]>([{ ...emptyRoom }]);
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [uploadingRoom, setUploadingRoom] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const selectedTask = tasks.find((t) => t.id === taskId);

  const handleClose = () => {
    setTaskId(defaultTaskId || '');
    setType('periodic');
    setClientName('');
    setRooms([{ ...emptyRoom }]);
    setPhotos([]);
    setUploadingRoom(null);
    setPhotoError(null);
    onClose();
  };

  const uploadPhoto = async (roomName: string, file: File | undefined) => {
    setPhotoError(null);
    if (!file) return;
    if (!taskId) {
      setPhotoError('Pick the inspection task first.');
      return;
    }
    if (!roomName.trim()) {
      setPhotoError('Name the room before adding its photos.');
      return;
    }
    setUploadingRoom(roomName);
    try {
      const photo = await unwrap(agentService.addInspectionPhoto(taskId, file, roomName.trim()));
      setPhotos((prev) => [...prev, photo]);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not upload that photo.');
    } finally {
      setUploadingRoom(null);
    }
  };

  const removePhoto = async (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    try {
      await unwrap(agentService.removeInspectionPhoto(photoId));
    } catch {
      /* best effort — the row is already gone from view */
    }
  };

  const updateRoom = <K extends keyof InspectionRoomEntry>(
    index: number,
    key: K,
    value: InspectionRoomEntry[K]
  ) => {
    setRooms((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  };

  const addRoom = () => setRooms((prev) => [...prev, { ...emptyRoom }]);
  const removeRoom = (index: number) => setRooms((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = () => {
    if (!selectedTask) return;
    onSubmit({
      taskId: selectedTask.id,
      propertyAddress: selectedTask.propertyAddress,
      clientName: clientName || selectedTask.assignedBy,
      scheduledDate: new Date().toISOString(),
      status: 'completed',
      type,
      rooms: rooms.map((r) => ({
        ...r,
        photoCount: photos.filter((p) => p.room === r.room.trim()).length,
      })),
      overallCondition:
        rooms.find((r) => r.condition === 'poor')?.condition ||
        rooms.find((r) => r.condition === 'fair')?.condition ||
        'good',
    });
    handleClose();
  };

  const canSubmit = taskId && rooms.every((r) => r.room.trim());

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-foreground">New Inspection</h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Task <span className="text-red-500">*</span>
                </label>
                <Select
                  value={taskId}
                  onValueChange={setTaskId}
                  placeholder="Select an inspection task"
                  options={tasks.map((task) => ({
                    value: task.id,
                    label: `${task.title}: ${task.propertyAddress}`,
                  }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Inspection Type <span className="text-red-500">*</span>
                </label>
                <Select
                  value={type}
                  onValueChange={(value) => setType(value as InspectionType)}
                  options={inspectionTypeOptions}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Client Name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={selectedTask?.assignedBy || 'Client name'}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">Rooms</label>
                  <Button variant="ghost" size="xs" className="gap-1" onClick={addRoom}>
                    <Plus className="w-3 h-3" />
                    Add Room
                  </Button>
                </div>
                <div className="space-y-3">
                  {rooms.map((room, index) => (
                    <div key={index} className="p-3 rounded-lg border border-border space-y-2">
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={room.room}
                          onChange={(e) => updateRoom(index, 'room', e.target.value)}
                          placeholder="e.g. Living Room"
                          className="flex-1"
                          inputClassName="py-1.5"
                        />
                        <Select
                          value={room.condition}
                          onValueChange={(value) =>
                            updateRoom(index, 'condition', value as RoomCondition)
                          }
                          options={conditionOptions.map((condition) => ({
                            value: condition,
                            label: condition.charAt(0).toUpperCase() + condition.slice(1),
                          }))}
                          className="min-h-9 w-32"
                        />
                        {rooms.length > 1 && (
                          <button
                            onClick={() => removeRoom(index)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <Input
                        type="text"
                        value={room.notes}
                        onChange={(e) => updateRoom(index, 'notes', e.target.value)}
                        placeholder="Notes (optional)"
                        inputClassName="py-1.5"
                      />
                      {(() => {
                        const roomPhotos = photos.filter(
                          (p) => p.room === room.room.trim() && room.room.trim()
                        );
                        return (
                          <div className="space-y-2">
                            {roomPhotos.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {roomPhotos.map((photo) => (
                                  <div key={photo.id} className="relative h-14 w-14">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={photo.url}
                                      alt={photo.name}
                                      className="h-14 w-14 rounded-md object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removePhoto(photo.id)}
                                      className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-white"
                                      aria-label="Remove photo"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <label className="flex w-fit cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-primary">
                              <Camera className="h-3.5 w-3.5" />
                              {uploadingRoom === room.room && room.room
                                ? 'Uploading…'
                                : roomPhotos.length > 0
                                  ? 'Add another photo'
                                  : 'Attach photo'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={!taskId || !room.room.trim() || uploadingRoom !== null}
                                onChange={(e) => {
                                  void uploadPhoto(room.room, e.target.files?.[0]);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
                {photoError && <p className="mt-2 text-xs text-destructive">{photoError}</p>}
              </div>
            </div>

            <div className="p-4 border-t border-border shrink-0">
              <Button
                variant="primary"
                fullWidth
                className="gap-1.5"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                <Check className="w-4 h-4" />
                Save Inspection
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
