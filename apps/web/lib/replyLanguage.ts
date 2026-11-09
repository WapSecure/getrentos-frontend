import { languageLabels, type Language } from '@/lib/i18n/translations';

export type ReplyLanguage = Language | 'yo' | 'ha' | 'ig';

export const REPLY_LANGUAGES: { value: ReplyLanguage; label: string }[] = [
  { value: 'en', label: languageLabels.en },
  { value: 'pcm', label: languageLabels.pcm },
  { value: 'yo', label: 'Yorùbá' },
  { value: 'ha', label: 'Hausa' },
  { value: 'ig', label: 'Igbo' },
];

export const languageLabel = (code: ReplyLanguage) =>
  REPLY_LANGUAGES.find((l) => l.value === code)?.label ?? languageLabels.en;

const KEY = 'sureground.replyLanguage';

export function savedReplyLanguage(): ReplyLanguage | null {
  try {
    const v = typeof window === 'undefined' ? null : window.localStorage.getItem(KEY);
    return REPLY_LANGUAGES.some((l) => l.value === v) ? (v as ReplyLanguage) : null;
  } catch {
    return null;
  }
}

export function saveReplyLanguage(code: ReplyLanguage) {
  try {
    window.localStorage.setItem(KEY, code);
  } catch {
    /* private window or blocked storage: the choice just is not remembered */
  }
}
