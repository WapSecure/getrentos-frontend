'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Trash2, Camera, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type {
  AgentTask,
  PropertyInspection,
  InspectionRoomEntry,
  RoomCondition,
} from '@/types/agent';

interface NewInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: AgentTask[];
  defaultTaskId?: string;
  onSubmit: (inspection: Omit<PropertyInspection, 'id' | 'syncStatus'>) => void;
}

const conditionOptions: RoomCondition[] = ['excellent', 'good', 'fair', 'poor'];

const emptyRoom: InspectionRoomEntry = { room: '', condition: 'good', notes: '', photoCount: 0 };

export const NewInspectionModal = ({
  isOpen,
  onClose,
  tasks,
  defaultTaskId,
  onSubmit,
}: NewInspectionModalProps) => {
  const [taskId, setTaskId] = useState(defaultTaskId || '');
  const [clientName, setClientName] = useState('');
  const [rooms, setRooms] = useState<InspectionRoomEntry[]>([{ ...emptyRoom }]);

  const selectedTask = tasks.find((t) => t.id === taskId);

  const handleClose = () => {
    setTaskId(defaultTaskId || '');
    setClientName('');
    setRooms([{ ...emptyRoom }]);
    onClose();
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
      rooms,
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
                <select
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select an inspection task</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} — {t.propertyAddress}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Client Name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={selectedTask?.assignedBy || 'Client name'}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                        <input
                          type="text"
                          value={room.room}
                          onChange={(e) => updateRoom(index, 'room', e.target.value)}
                          placeholder="e.g. Living Room"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <select
                          value={room.condition}
                          onChange={(e) =>
                            updateRoom(index, 'condition', e.target.value as RoomCondition)
                          }
                          className="px-2 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {conditionOptions.map((c) => (
                            <option key={c} value={c}>
                              {c.charAt(0).toUpperCase() + c.slice(1)}
                            </option>
                          ))}
                        </select>
                        {rooms.length > 1 && (
                          <button
                            onClick={() => removeRoom(index)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={room.notes}
                        onChange={(e) => updateRoom(index, 'notes', e.target.value)}
                        placeholder="Notes (optional)"
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => updateRoom(index, 'photoCount', room.photoCount + 1)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {room.photoCount > 0
                          ? `${room.photoCount} photo(s) attached — add more`
                          : 'Attach photo'}
                      </button>
                    </div>
                  ))}
                </div>
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
