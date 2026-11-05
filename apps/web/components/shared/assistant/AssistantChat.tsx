'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, MessageCircleQuestion, SendHorizontal } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  IconButton,
  Textarea,
} from '@getrentos/ui';
import type { AssistantLink, AssistantReply, AssistantTurn } from '@/types/assistant';
import {
  REPLY_LANGUAGES,
  languageLabel,
  saveReplyLanguage,
  savedReplyLanguage,
  type ReplyLanguage,
} from '@/lib/replyLanguage';

interface ChatMessage extends AssistantTurn {
  links?: AssistantLink[];
  suggestions?: string[];
  /** Set when the answer could not be given in the language asked for. */
  fellBackFrom?: ReplyLanguage;
}

const MAX_QUESTION = 500;
const HISTORY_TURNS = 6;

export interface AssistantChatProps {
  /** Sends a question with the recent turns; resolves to the reply or throws. */
  ask: (
    question: string,
    history: AssistantTurn[],
    language: ReplyLanguage
  ) => Promise<AssistantReply>;
  starters: string[];
  /** What the assistant covers, shown under the title. */
  scope: string;
  placeholder: string;
}

/** "Ask GetRentos": read-only answers from the user's own account, opened from the navbar. */
export const AssistantChat = ({ ask: askFn, starters, scope, placeholder }: AssistantChatProps) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [language, setLanguage] = useState<ReplyLanguage>(savedReplyLanguage);
  const logRef = useRef<HTMLDivElement>(null);

  const ask = useMutation({
    mutationFn: ({ question, history }: { question: string; history: AssistantTurn[] }) =>
      askFn(question, history, language),
    onSuccess: (reply) =>
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply.answer,
          links: reply.links,
          suggestions: reply.suggestions,
          fellBackFrom:
            reply.requestedLanguage && reply.language !== reply.requestedLanguage
              ? reply.requestedLanguage
              : undefined,
        },
      ]),
  });

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, ask.isPending]);

  const send = (text: string) => {
    const question = text.trim().slice(0, MAX_QUESTION);
    if (!question || ask.isPending) return;
    const history = messages.slice(-HISTORY_TURNS).map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setDraft('');
    ask.mutate({ question, history });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    send(draft);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send(draft);
    }
  };

  const lastIndex = messages.length - 1;

  return (
    <>
      <IconButton
        label="Ask GetRentos"
        icon={<MessageCircleQuestion />}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          size="lg"
          padded={false}
          closeOnOutsideClick={false}
          className="flex flex-col"
        >
          <div className="border-b border-border p-5 pr-12">
            <DialogTitle className="text-base font-semibold text-foreground">
              Ask GetRentos
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              {scope} Answers come from your account, and nothing is changed for you.
            </DialogDescription>
            <label className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
              Reply in
              <select
                value={language}
                onChange={(e) => {
                  const next = e.target.value as ReplyLanguage;
                  setLanguage(next);
                  saveReplyLanguage(next);
                }}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {REPLY_LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-label="Conversation"
            className="flex max-h-[55vh] min-h-[16rem] flex-col gap-3 overflow-y-auto p-5"
          >
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Try one of these:</p>
                <div className="flex flex-wrap gap-2">
                  {starters.map((s) => (
                    <Button key={s} variant="outline" size="sm" onClick={() => send(s)}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) =>
              m.role === 'user' ? (
                <p
                  key={i}
                  className="max-w-[85%] self-end whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                >
                  {m.content}
                </p>
              ) : (
                <div key={i} className="max-w-[90%] space-y-2 self-start">
                  <p className="whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-secondary px-3.5 py-2 text-sm text-foreground">
                    {m.content}
                  </p>
                  {m.fellBackFrom && (
                    <p className="text-xs text-muted-foreground">
                      Answered in English: replies in {languageLabel(m.fellBackFrom)} are not
                      available right now.
                    </p>
                  )}
                  {!!m.links?.length && (
                    <div className="flex flex-wrap gap-2">
                      {m.links.map((link) => (
                        <Link
                          key={link.path}
                          href={link.path}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-primary hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {link.label}
                          <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        </Link>
                      ))}
                    </div>
                  )}
                  {i === lastIndex && !ask.isPending && !!m.suggestions?.length && (
                    <div className="flex flex-wrap gap-2">
                      {m.suggestions.map((s) => (
                        <Button key={s} variant="ghost" size="xs" onClick={() => send(s)}>
                          {s}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}

            {ask.isPending && (
              <p className="self-start rounded-2xl bg-secondary px-3.5 py-2 text-sm text-muted-foreground">
                Looking that up…
              </p>
            )}
            {ask.isError && !ask.isPending && (
              <p role="alert" className="self-start text-sm text-destructive">
                That didn&apos;t go through. Please try again.
              </p>
            )}
          </div>

          <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-border p-4">
            <Textarea
              aria-label="Your question"
              placeholder={placeholder}
              rows={2}
              maxLength={MAX_QUESTION}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              className="min-h-0 flex-1 resize-none"
            />
            <IconButton
              type="submit"
              variant="primary"
              label="Send"
              icon={<SendHorizontal />}
              disabled={!draft.trim() || ask.isPending}
            />
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
