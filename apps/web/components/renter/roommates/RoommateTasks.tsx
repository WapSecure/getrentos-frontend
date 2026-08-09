'use client';

import { useState } from 'react';
import { Clipboard, Circle, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Roommate {
  id: string;
  name: string;
  responsibilities: string[];
}

interface RoommateTasksProps {
  roommates: Roommate[];
  onCompleteTask: (roommateId: string, task: string) => void;
}

export const RoommateTasks = ({ roommates, onCompleteTask }: RoommateTasksProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [selectedRoommate, setSelectedRoommate] = useState<string | null>(null);

  const allTasks = roommates.flatMap((r) =>
    r.responsibilities.map((task) => ({
      roommateId: r.id,
      roommateName: r.name,
      task,
    }))
  );

  const handleAddTask = () => {
    if (!newTask.trim() || !selectedRoommate) return;
    // In production, this would add the task to the roommate
    console.log('Add task:', newTask, 'to', selectedRoommate);
    setNewTask('');
    setSelectedRoommate(null);
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Clipboard className="w-4 h-4 text-primary" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Roommate Tasks</h3>
            <p className="text-xs text-gray-500">{allTasks.length} active tasks</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="p-1 h-auto">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          {/* Add Task */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="New task..."
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={selectedRoommate || ''}
              onChange={(e) => setSelectedRoommate(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Assign to</option>
              {roommates.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              onClick={handleAddTask}
              disabled={!newTask.trim() || !selectedRoommate}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Task List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allTasks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No tasks assigned</p>
            ) : (
              allTasks.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary"
                >
                  <button
                    onClick={() => onCompleteTask(item.roommateId, item.task)}
                    className="shrink-0"
                  >
                    <Circle className="w-4 h-4 text-gray-400 hover:text-green-500 transition-colors" />
                  </button>
                  <span className="text-sm text-foreground flex-1">{item.task}</span>
                  <span className="text-xs text-gray-500">{item.roommateName}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
