'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowRight,
  MessageCircleQuestion,
  Mic,
  SendHorizontal,
  Square,
  Volume2,
} from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  IconButton,
  Select,
  Textarea,
} from '@sureground/ui';
import type { AssistantLink, AssistantReply, AssistantTurn } from '@/types/assistant';
import {
  REPLY_LANGUAGES,
  languageLabel,
  saveReplyLanguage,
  savedReplyLanguage,
  type ReplyLanguage,
} from '@/lib/replyLanguage';
import { useReadAloud, useVoiceInput } from '@/lib/voice';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface ChatMessage extends AssistantTurn {
  links?: AssistantLink[];
  suggestions?: string[];
  /** The language an answer is in, for reading it aloud. */
  language?: ReplyLanguage;
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

/** "Ask Sureground": read-only answers from the user's own account, opened from the navbar. */
export const AssistantChat = ({ ask: askFn, starters, scope, placeholder }: AssistantChatProps) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Answers follow the app's language unless the person picked another one here.
  const { language: appLanguage } = useLanguage();
  const [override, setOverride] = useState<ReplyLanguage | null>(savedReplyLanguage);
  const language = override ?? appLanguage;
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
          language: reply.language ?? 'en',
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

  // Spoken words land in the box, so the person can check them before sending.
  const voice = useVoiceInput(language, setDraft);
  const readAloud = useReadAloud();

  const lastIndex = messages.length - 1;

  return (
    <>
      <IconButton
        label="Ask Sureground"
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
              Ask Sureground
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              {scope} Answers come from your account, and nothing is changed for you.
            </DialogDescription>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span aria-hidden="true">Reply in</span>
              <Select
                value={language}
                onValueChange={(value) => {
                  const next = value as ReplyLanguage;
                  setOverride(next);
                  saveReplyLanguage(next);
                }}
                options={REPLY_LANGUAGES.map((l) => ({ value: l.value, label: l.label }))}
                ariaLabel="Reply language"
                controlSize="sm"
                searchable={false}
                className="w-32"
              />
            </div>
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
                  {readAloud.canRead(m.language ?? 'en') && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="gap-1"
                      onClick={() => readAloud.toggle(i, m.content, m.language ?? 'en')}
                    >
                      {readAloud.speaking === i ? (
                        <Square className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {readAloud.speaking === i ? 'Stop reading' : 'Read aloud'}
                    </Button>
                  )}
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

          {(voice.error || voice.listening) && (
            <p
              role="status"
              className={`border-t border-border px-4 pt-3 text-xs ${voice.error ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {voice.error ??
                `Listening in ${languageLabel(language)}… press the square when you finish.`}
            </p>
          )}
          <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-border p-4">
            {voice.available && (
              <IconButton
                type="button"
                variant={voice.listening ? 'primary' : 'ghost'}
                label={voice.listening ? 'Stop listening' : 'Speak your question'}
                icon={voice.listening ? <Square /> : <Mic />}
                onClick={() => (voice.listening ? voice.stop() : voice.start())}
                disabled={ask.isPending}
              />
            )}
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
