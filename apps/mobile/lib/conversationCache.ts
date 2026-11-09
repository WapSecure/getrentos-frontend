import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { qk } from './query/keys';
import type { Conversation } from './api/messages';
import type { Paginated } from './api/properties';

export type ConversationPages = InfiniteData<Paginated<Conversation>, number>;

export function patchConversation(qc: QueryClient, updated: Conversation) {
  qc.setQueryData<Conversation>(qk.renter.conversation(updated.id), updated);
  qc.setQueryData<ConversationPages>(qk.renter.conversations, (old) =>
    old
      ? {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            items: p.items.map((c) => (c.id === updated.id ? updated : c)),
          })),
        }
      : old
  );
}

export function updateInboxConversation(
  qc: QueryClient,
  id: string,
  change: (c: Conversation) => Conversation
) {
  qc.setQueryData<ConversationPages>(qk.renter.conversations, (old) =>
    old
      ? {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            items: p.items.map((c) => (c.id === id ? change(c) : c)),
          })),
        }
      : old
  );
}
