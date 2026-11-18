'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ListSkeleton, PageErrorState, PageHeader } from '@sureground/ui';
import {
  NoOfficeMessages,
  OfficeConversation,
} from '@/components/estate/messages/OfficeConversation';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';

export default function ResidentMessagesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: estateResidentKeys.officeMessages,
    queryFn: () => unwrap(estateResidentService.getOfficeMessages()),
    refetchInterval: 30_000,
  });

  const handleSend = async (body: string) => {
    const response = await estateResidentService.sendOfficeMessage(body);
    if (!response.success) return false;
    await queryClient.invalidateQueries({ queryKey: estateResidentKeys.officeMessages });
    return true;
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        title="Estate office"
        description={`Message the ${data?.estateName || 'estate'} office. Replies appear here and in your notifications.`}
      />

      {isError && !data ? (
        <PageErrorState
          title="Couldn’t load your messages"
          error={error}
          onRetry={() => void refetch()}
          isRetrying={isFetching}
          headingLevel="h2"
        />
      ) : isLoading || !data ? (
        <ListSkeleton rows={3} />
      ) : (
        <OfficeConversation
          title={data.estateName ? `${data.estateName} office` : 'Estate office'}
          subtitle="Your household’s conversation with the office"
          messages={data.messages}
          viewer="resident"
          onSend={handleSend}
          placeholder="Write to the estate office..."
          emptyState={
            <NoOfficeMessages
              title="Ask the estate office anything"
              description="Send a message about your dues, a violation, visitor passes or anything else. The office will reply here."
            />
          }
        />
      )}
    </div>
  );
}
