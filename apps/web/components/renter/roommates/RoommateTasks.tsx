'use client';

import { LegacyInput } from '@getrentos/ui';

import { LegacySelect } from '@getrentos/ui';

import { FormEvent, useId, useState } from 'react';
import { Clipboard, Circle, Plus, ChevronDown, ChevronUp, LoaderCircle } from 'lucide-react';
import { Button } from '@getrentos/ui';

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
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const panelId = useId();
  const taskInputId = useId();

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
    setFeedback(null);
    try {
      await onAddTask(selectedRoommate, newTask.trim());
      setNewTask('');
      setSelectedRoommate(null);
      setFeedback({ type: 'success', message: 'Task assigned successfully.' });
    } catch {
      setFeedback({ type: 'error', message: 'We could not assign the task. Please try again.' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleCompleteTask = async (roommateId: string, task: string) => {
    const taskKey = `${roommateId}:${task}`;
    setCompletingTask(taskKey);
    setFeedback(null);
    try {
      await onCompleteTask(roommateId, task);
      setFeedback({ type: 'success', message: 'Task marked as complete.' });
    } catch {
      setFeedback({ type: 'error', message: 'We could not complete the task. Please try again.' });
    } finally {
      setCompletingTask(null);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
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
            <p className="text-xs text-gray-500">{allTasks.length} active tasks</p>
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
            <label htmlFor={taskInputId} className="sr-only">
              Task description
            </label>
            <LegacyInput
              id={taskInputId}
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="New task..."
              maxLength={120}
              disabled={isAdding}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <LegacySelect
              aria-label="Assign task to roommate"
              value={selectedRoommate || ''}
              onChange={(e) => setSelectedRoommate(e.target.value)}
              disabled={isAdding}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Assign to</option>
              {roommates.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </LegacySelect>
            <Button
              type="submit"
              size="sm"
              disabled={!newTask.trim() || !selectedRoommate || isAdding}
              aria-label={isAdding ? 'Assigning task' : 'Assign task'}
            >
              {isAdding ? (
                <LoaderCircle className="w-3 h-3 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="w-3 h-3" aria-hidden="true" />
              )}
            </Button>
          </form>

          {feedback && (
            <p
              role={feedback.type === 'error' ? 'alert' : 'status'}
              className={
                feedback.type === 'error' ? 'text-xs text-destructive' : 'text-xs text-primary'
              }
            >
              {feedback.message}
            </p>
          )}

          {/* Task List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allTasks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No tasks assigned</p>
            ) : (
              allTasks.map((item) => {
                const taskKey = `${item.roommateId}:${item.task}`;
                const isCompleting = completingTask === taskKey;
                return (
                  <div
                    key={taskKey}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary"
                  >
                    <button
                      type="button"
                      onClick={() => handleCompleteTask(item.roommateId, item.task)}
                      disabled={isCompleting}
                      aria-label={`Mark “${item.task}” for ${item.roommateName} as complete`}
                      className="shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait"
                    >
                      {isCompleting ? (
                        <LoaderCircle
                          className="w-4 h-4 animate-spin text-primary"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle
                          className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                    <span className="text-sm text-foreground flex-1">{item.task}</span>
                    <span className="text-xs text-gray-500">{item.roommateName}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
