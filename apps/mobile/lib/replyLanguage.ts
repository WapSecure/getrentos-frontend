import AsyncStorage from '@react-native-async-storage/async-storage';

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

/** The language this device last chose for answers; English when none. */
export async function loadReplyLanguage(): Promise<ReplyLanguage> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return REPLY_LANGUAGES.some((l) => l.value === v) ? (v as ReplyLanguage) : 'en';
  } catch {
    return 'en';
  }
}

export async function saveReplyLanguage(code: ReplyLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, code);
  } catch {
    /* not remembered; the choice still applies to this chat */
  }
}
