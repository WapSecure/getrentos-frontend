/** Languages GetRentos can answer in. pcm is Nigerian Pidgin. */
export type ReplyLanguage = 'en' | 'pcm' | 'yo' | 'ha' | 'ig';

export const REPLY_LANGUAGES: { value: ReplyLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'pcm', label: 'Pidgin' },
  { value: 'yo', label: 'Yorùbá' },
  { value: 'ha', label: 'Hausa' },
  { value: 'ig', label: 'Igbo' },
];

export const languageLabel = (code: ReplyLanguage) =>
  REPLY_LANGUAGES.find((l) => l.value === code)?.label ?? 'English';

const KEY = 'getrentos.replyLanguage';

/** The language this browser last chose. A convenience only: falls back to English. */
export function savedReplyLanguage(): ReplyLanguage {
  try {
    const v = typeof window === 'undefined' ? null : window.localStorage.getItem(KEY);
    return REPLY_LANGUAGES.some((l) => l.value === v) ? (v as ReplyLanguage) : 'en';
  } catch {
    return 'en';
  }
}

export function saveReplyLanguage(code: ReplyLanguage) {
  try {
    window.localStorage.setItem(KEY, code);
  } catch {
    /* private window or blocked storage: the choice just is not remembered */
  }
}
