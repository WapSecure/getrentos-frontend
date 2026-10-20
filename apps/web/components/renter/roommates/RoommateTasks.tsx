'use client';

import { FormEvent, useId, useState } from 'react';
import { Clipboard, Circle, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, EmptyState, IconButton, Input, Select, useToast } from '@getrentos/ui';

interface Roommate {
  id: string;
  name: string;
  responsibilities: string[];
}

interface RoommateTasksProps {
  roommates: Roommate[];
  onAddTask: (roommateId: string, task: string) => Promise<void>;
  onCompleteTask: (roommateId: string, task: string) => Promise<void>;
}

export const RoommateTasks = ({ roommates, onAddTask, onCompleteTask }: RoommateTasksProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [selectedRoommate, setSelectedRoommate] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const toast = useToast();
  const panelId = useId();

  const allTasks = roommates.flatMap((r) =>
    r.responsibilities.map((task) => ({
      roommateId: r.id,
      roommateName: r.name,
      task,
    }))
  );

  const handleAddTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newTask.trim() || !selectedRoommate) return;
    setIsAdding(true);
    try {
      await onAddTask(selectedRoommate, newTask.trim());
      setNewTask('');
      setSelectedRoommate(null);
      toast.success('Task assigned successfully.');
    } catch {
      toast.error('We could not assign the task. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleCompleteTask = async (roommateId: string, task: string) => {
    const taskKey = `${roommateId}:${task}`;
    setCompletingTask(taskKey);
    try {
      await onCompleteTask(roommateId, task);
      toast.success('Task marked as complete.');
    } catch {
      toast.error('We could not complete the task. Please try again.');
    } finally {
      setCompletingTask(null);
    }
  };

  return (
    <Card>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clipboard className="w-4 h-4 text-primary" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Roommate Tasks</h3>
            <p className="text-xs text-muted-foreground">{allTasks.length} active tasks</p>
          </div>
        </div>
        <span className="rounded-md p-1" aria-hidden="true">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {isExpanded && (
        <div id={panelId} className="p-4 pt-0 space-y-3">
          {/* Add Task */}
          <form
            className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
            onSubmit={handleAddTask}
          >
            <Input
              type="text"
              aria-label="Task description"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="New task..."
              maxLength={120}
              disabled={isAdding}
            />
            <Select
              ariaLabel="Assign task to roommate"
              value={selectedRoommate || ''}
              onValueChange={setSelectedRoommate}
              disabled={isAdding}
              placeholder="Assign to"
              options={roommates.map((r) => ({ value: r.id, label: r.name }))}
            />
            <IconButton
              type="submit"
              variant="secondary"
              label="Assign task"
              disabled={!newTask.trim() || !selectedRoommate}
              isLoading={isAdding}
              icon={<Plus />}
            />
          </form>

          {/* Task List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allTasks.length === 0 ? (
              <EmptyState icon={Clipboard} title="No tasks assigned" size="compact" bare />
            ) : (
              allTasks.map((item) => {
                const taskKey = `${item.roommateId}:${item.task}`;
                const isCompleting = completingTask === taskKey;
                return (
                  <div
                    key={taskKey}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary"
                  >
                    <IconButton
                      size="sm"
                      onClick={() => handleCompleteTask(item.roommateId, item.task)}
                      isLoading={isCompleting}
                      label={`Mark “${item.task}” for ${item.roommateName} as complete`}
                      className="shrink-0"
                      icon={<Circle />}
                    />
                    <span className="min-w-0 text-sm text-foreground flex-1">{item.task}</span>
                    <span className="text-xs text-muted-foreground">{item.roommateName}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
