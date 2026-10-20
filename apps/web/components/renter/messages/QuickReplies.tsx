'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Zap, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { Button, Card, Field, IconButton, Input } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

interface QuickRepliesProps {
  onSelectReply: (reply: string) => void;
}

export const QuickReplies = ({ onSelectReply }: QuickRepliesProps) => {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [shortcut, setShortcut] = useState('');
  const [response, setResponse] = useState('');

  const { data: replies = [] } = useQuery({
    queryKey: renterKeys.quickReplies,
    queryFn: () => unwrap(renterService.listQuickReplies()),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: renterKeys.quickReplies });

  const addMutation = useMutation({
    mutationFn: (data: { shortcut: string; response: string }) =>
      unwrap(renterService.createQuickReply(data)),
    onSuccess: () => {
      invalidate();
      setShortcut('');
      setResponse('');
      setIsAdding(false);
    },
  });

  const handleAdd = () => {
    if (!shortcut.trim() || !response.trim()) return;
    addMutation.mutate({ shortcut: shortcut.trim(), response: response.trim() });
  };

  return (
    <Card>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="w-full p-3 flex items-center justify-between hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Quick Replies</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="p-3 pt-0 space-y-2">
          {replies.length === 0 && !isAdding && (
            <p className="text-xs text-muted-foreground px-1">
              No quick replies yet. Add one to speed up your replies.
            </p>
          )}
          {replies.map((reply) => (
            <button
              key={reply.id}
              type="button"
              onClick={() => onSelectReply(reply.response)}
              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              {reply.response}
            </button>
          ))}
          {isAdding && (
            <div className="space-y-2 p-2 rounded-lg bg-secondary/60 border border-border">
              <Field label="Shortcut" required>
                <Input
                  type="text"
                  value={shortcut}
                  onChange={(e) => setShortcut(e.target.value)}
                  placeholder="Shortcut (e.g. /viewing)"
                />
              </Field>
              <Field label="Reply text" required>
                <Input
                  type="text"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Reply text"
                />
              </Field>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!shortcut.trim() || !response.trim()}
                  isLoading={addMutation.isPending}
                >
                  Save
                </Button>
                <IconButton
                  size="sm"
                  label="Cancel"
                  icon={<X />}
                  onClick={() => setIsAdding(false)}
                />
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            icon={<Plus className="w-3 h-3" />}
            onClick={() => setIsAdding(!isAdding)}
          >
            Add Custom Reply
          </Button>
        </div>
      )}
    </Card>
  );
};
