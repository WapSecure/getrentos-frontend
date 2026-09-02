'use client';

import { Badge, Button } from '@getrentos/ui';
import type { Poll } from '@/types/estate';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

interface PollCardProps {
  poll: Poll;
  onClose?: () => void;
  onVote?: (optionId: string) => void;
  isUpdating?: boolean;
}

export const PollCard = ({ poll, onClose, onVote, isUpdating }: PollCardProps) => {
  const canVote = !!onVote && poll.status === 'open' && !poll.myVote;

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold text-foreground">{poll.question}</p>
        <Badge variant={poll.status === 'open' ? 'success' : 'neutral'}>
          {poll.status === 'open' ? 'Open' : 'Closed'}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {poll.totalVotes} vote{poll.totalVotes === 1 ? '' : 's'} · Opened{' '}
        {formatDate(poll.createdAt)}
      </p>

      <div className="mt-3 space-y-2">
        {poll.options.map((option) => {
          const pct =
            poll.totalVotes > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0;
          const isMine = poll.myVote === option.id;
          return (
            <div key={option.id}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className={isMine ? 'font-medium text-primary' : 'text-foreground'}>
                  {option.label}
                  {isMine ? ' (your vote)' : ''}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {option.voteCount} · {pct}%
                </span>
              </div>
              {canVote ? (
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  className="mt-1"
                  disabled={isUpdating}
                  onClick={() => onVote(option.id)}
                >
                  Vote
                </Button>
              ) : (
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-1">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {onClose && poll.status === 'open' && (
        <Button variant="ghost" size="sm" className="mt-3" disabled={isUpdating} onClick={onClose}>
          Close Poll
        </Button>
      )}
    </div>
  );
};
