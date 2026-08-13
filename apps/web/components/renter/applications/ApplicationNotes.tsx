'use client';

import { Textarea } from '@/components/ui/Textarea';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface ApplicationNotesProps {
  applicationId: string;
  notes: Note[];
  onAddNote: (content: string) => void;
  onDeleteNote: (id: string) => void;
  onEditNote: (id: string, content: string) => void;
}

export const ApplicationNotes = ({
  applicationId,
  notes,
  onAddNote,
  onDeleteNote,
  onEditNote,
}: ApplicationNotesProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [editContent, setEditContent] = useState('');

  const handleAddNote = () => {
    if (!content.trim()) return;
    onAddNote(content);
    setContent('');
    setIsAdding(false);
  };

  const handleEditNote = (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note) {
      setEditContent(note.content);
      setEditingId(id);
    }
  };

  const handleSaveEdit = (id: string) => {
    if (!editContent.trim()) return;
    onEditNote(id, editContent);
    setEditingId(null);
    setEditContent('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-foreground">Notes</h4>
        <Button size="sm" variant="ghost" onClick={() => setIsAdding(true)} className="gap-1">
          <Plus className="w-3 h-3" />
          Add Note
        </Button>
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-border"
        >
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add your notes about this application..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={handleAddNote} disabled={!content.trim()}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Notes List */}
      <div className="space-y-2">
        {notes.length === 0 && !isAdding && (
          <p className="text-sm text-gray-500 text-center py-4">No notes yet</p>
        )}

        {notes.map((note) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-border"
          >
            {editingId === note.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSaveEdit(note.id)}
                    disabled={!editContent.trim()}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-foreground">{note.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(note.createdAt)}</span>
                    {note.updatedAt !== note.createdAt && (
                      <span className="text-gray-400">(edited)</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditNote(note.id)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <Edit2 className="w-3 h-3 text-gray-500" />
                    </button>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
