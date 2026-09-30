'use client';

import { Bell, MessageCircle } from 'lucide-react';
import { RenterPageHeader } from '../shared/RenterPageHeader';

interface MessagesHeaderProps {
  unreadCount: number;
}

export const MessagesHeader = ({ unreadCount }: MessagesHeaderProps) => {
  return (
    <RenterPageHeader
      eyebrow="Communication"
      icon={MessageCircle}
      title="Messages"
      description="Keep conversations with property owners and agents organised in one secure place."
      actions={
        <div className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background/70 px-3">
          <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="text-sm font-medium text-foreground">{unreadCount}</span>
          <span className="text-xs text-muted-foreground">unread</span>
        </div>
      }
    />
  );
};
