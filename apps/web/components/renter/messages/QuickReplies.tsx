'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Zap, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { Button } from '@getrentos/ui';
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
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-secondary transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Quick Replies</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </div>

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
              onClick={() => onSelectReply(reply.response)}
              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              {reply.response}
            </button>
          ))}
          {isAdding && (
            <div className="space-y-2 p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-border">
              <LegacyInput
                type="text"
                value={shortcut}
                onChange={(e) => setShortcut(e.target.value)}
                placeholder="Shortcut (e.g. /viewing)"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <LegacyInput
                type="text"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Reply text"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!shortcut.trim() || !response.trim()}
                >
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            className="gap-1"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus className="w-3 h-3" />
            Add Custom Reply
          </Button>
        </div>
      )}
    </div>
  );
};
