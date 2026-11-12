'use client';

import { Vote } from '@sureground/icons';
import { Badge, Button } from '@sureground/ui';
import { EstateRow, RowAvatar } from '@/components/estate/shared/EstateListSection';
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
  const isOpen = poll.status === 'open';

  return (
    <EstateRow
      align="start"
      leading={<RowAvatar icon={Vote} tone={isOpen ? 'primary' : 'neutral'} />}
      title={
        <>
          <p className="text-sm font-semibold text-foreground">{poll.question}</p>
          <Badge variant={isOpen ? 'success' : 'neutral'}>{isOpen ? 'Open' : 'Closed'}</Badge>
        </>
      }
      meta={
        <p className="tabular-nums">
          {poll.totalVotes} vote{poll.totalVotes === 1 ? '' : 's'} · Opened{' '}
          {formatDate(poll.createdAt)}
        </p>
      }
      actions={
        onClose && isOpen ? (
          <Button variant="outline" size="sm" disabled={isUpdating} onClick={onClose}>
            Close poll
          </Button>
        ) : undefined
      }
    >
      <div className="mt-3 max-w-xl space-y-3">
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
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
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
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </EstateRow>
  );
};
