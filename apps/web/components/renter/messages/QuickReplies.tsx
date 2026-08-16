'use client';

import { useState } from 'react';
import { Zap, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Button } from '@getrentos/ui';

interface QuickRepliesProps {
  onSelectReply: (reply: string) => void;
}

const quickReplies = [
  "Hi, I'm interested in this property. Can I schedule a viewing?",
  "What's the availability for viewing this week?",
  'Is the property still available?',
  "I've submitted my application. Any updates?",
  'Thank you for getting back to me!',
  "I'll confirm and get back to you.",
];

export const QuickReplies = ({ onSelectReply }: QuickRepliesProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

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
          {quickReplies.map((reply, index) => (
            <button
              key={index}
              onClick={() => onSelectReply(reply)}
              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              {reply}
            </button>
          ))}
          <Button variant="ghost" size="sm" fullWidth className="gap-1">
            <Plus className="w-3 h-3" />
            Add Custom Reply
          </Button>
        </div>
      )}
    </div>
  );
};
