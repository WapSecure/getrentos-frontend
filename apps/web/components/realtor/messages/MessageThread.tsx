'use client';

import { useState } from 'react';
import { Send, Paperclip, MessageCircle, Check, CheckCheck } from 'lucide-react';
import { getInitials } from '@/lib/format';
import { format } from 'date-fns';

export interface ThreadMessage {
  id: string;
  senderId: 'realtor' | 'contact';
  text: string;
  timestamp: string;
  read: boolean;
}

interface MessageThreadProps {
  contactName: string;
  contactRole: string;
  messages: ThreadMessage[];
  onSend: (text: string) => void;
}

export const MessageThread = ({
  contactName,
  contactRole,
  messages,
  onSend,
}: MessageThreadProps) => {
  const [draft, setDraft] = useState('');

  const handleSend = () => {
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft('');
  };

  return (
    <div className="flex-1 bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#c4a747] to-[#e8d5a3] flex items-center justify-center text-[#0a1a1f] font-semibold text-xs">
          {getInitials(contactName)}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{contactName}</p>
          <p className="text-xs text-gray-400">{contactRole}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <MessageCircle className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-400">No messages yet — say hello</p>
          </div>
        ) : (
          messages.map((message) => {
            const isRealtor = message.senderId === 'realtor';
            return (
              <div
                key={message.id}
                className={`flex ${isRealtor ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-3.5 py-2 ${
                    isRealtor
                      ? 'bg-[#c4a747] text-[#0a1a1f] rounded-br-sm'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <div
                    className={`flex items-center gap-1 mt-1 ${isRealtor ? 'justify-end' : 'justify-start'}`}
                  >
                    <span
                      className={`text-[10px] ${isRealtor ? 'text-[#0a1a1f]/60' : 'text-gray-400'}`}
                    >
                      {format(new Date(message.timestamp), 'h:mm a')}
                    </span>
                    {isRealtor &&
                      (message.read ? (
                        <CheckCheck className="w-3 h-3 text-[#0a1a1f]/60" />
                      ) : (
                        <Check className="w-3 h-3 text-[#0a1a1f]/60" />
                      ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-white/10 flex items-center gap-2">
        <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 flex-shrink-0">
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim()}
          className="p-2 rounded-lg bg-[#c4a747] text-[#0a1a1f] hover:bg-[#a88d3a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
