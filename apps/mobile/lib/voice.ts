import { useEffect, useMemo, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import { languageLabel, type ReplyLanguage } from './replyLanguage';

/**
 * Voice in and out on the phone, using the device's own speech services only:
 * nothing is recorded or sent to GetRentos or any other provider by this code.
 * Speech-to-text needs a development or store build; in Expo Go the module is
 * absent, so voice input reports itself unavailable instead of crashing.
 */

type RecognitionModule = typeof import('expo-speech-recognition');

let recognition: RecognitionModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  recognition = require('expo-speech-recognition') as RecognitionModule;
} catch {
  recognition = null;
}

/** Nigerian locales for each reply language; Pidgin is recognised as Nigerian English. */
export const SPEECH_LOCALE: Record<ReplyLanguage, string> = {
  en: 'en-NG',
  pcm: 'en-NG',
  yo: 'yo-NG',
  ha: 'ha-NG',
  ig: 'ig-NG',
};

function errorText(code: string, language: ReplyLanguage): string {
  switch (code) {
    case 'language-not-supported':
      return `Speaking in ${languageLabel(language)} is not supported on this phone yet. Try English, or type.`;
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Allow the microphone and speech recognition for GetRentos in Settings to speak your question.';
    case 'no-speech':
    case 'speech-timeout':
      return 'Didn’t catch that. Tap the mic and try again.';
    case 'network':
      return 'Voice input needs a connection on this phone. Try again, or type.';
    default:
      return 'Voice input stopped. Try again, or type.';
  }
}

/**
 * Speak a question instead of typing it. `onText` receives the words as they
 * are recognised, so the person sees and can fix them before sending.
 */
export function useVoiceInput(language: ReplyLanguage, onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onTextRef = useRef(onText);
  const languageRef = useRef(language);
  useEffect(() => {
    onTextRef.current = onText;
    languageRef.current = language;
  });

  const available = useMemo(() => {
    try {
      return !!recognition && recognition.ExpoSpeechRecognitionModule.isRecognitionAvailable();
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!recognition || !available) return;
    const m = recognition.ExpoSpeechRecognitionModule;
    const subs = [
      m.addListener('result', (e) => onTextRef.current(e.results[0]?.transcript ?? '')),
      m.addListener('end', () => setListening(false)),
      m.addListener('error', (e) => {
        setListening(false);
        if (e.error !== 'aborted') setError(errorText(e.error, languageRef.current));
      }),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [available]);

  const start = async () => {
    if (!recognition) return;
    setError(null);
    const m = recognition.ExpoSpeechRecognitionModule;
    const permission = await m.requestPermissionsAsync();
    if (!permission.granted) {
      setError(errorText('not-allowed', language));
      return;
    }
    setListening(true);
    m.start({ lang: SPEECH_LOCALE[language], interimResults: true, continuous: false });
  };

  const stop = () => recognition?.ExpoSpeechRecognitionModule.stop();

  return { available, listening, error, start, stop };
}

/**
 * Read an answer aloud with the phone's voices. English and Pidgin use a
 * Nigerian English voice; Yoruba, Hausa and Igbo only when the phone has one.
 */
export function useReadAloud() {
  const [voices, setVoices] = useState<Speech.Voice[]>([]);
  const [speaking, setSpeaking] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    void Speech.getAvailableVoicesAsync()
      .then((v) => live && setVoices(v))
      .catch(() => undefined);
    return () => {
      live = false;
      void Speech.stop();
    };
  }, []);

  const canRead = (language: ReplyLanguage) =>
    language === 'en' ||
    language === 'pcm' ||
    voices.some((v) => v.language.toLowerCase().startsWith(language));

  const toggle = (id: number, text: string, language: ReplyLanguage) => {
    void Speech.stop();
    if (speaking === id) {
      setSpeaking(null);
      return;
    }
    setSpeaking(id);
    Speech.speak(text, {
      language: SPEECH_LOCALE[language],
      onDone: () => setSpeaking(null),
      onStopped: () => setSpeaking(null),
      onError: () => setSpeaking(null),
    });
  };

  return { canRead, speaking, toggle };
}

// Number words only: homophones such as "to" and "for" would turn ordinary words into digits.
const DIGIT_WORDS: Record<string, string> = {
  zero: '0',
  oh: '0',
  nought: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
};

/**
 * The digits in what someone said, for a PIN read out at the gate:
 * "four oh nine, double two one" → "409221". Words and figures both count.
 */
export function digitsFromSpeech(text: string): string {
  const out: string[] = [];
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const repeat = t === 'double' ? 2 : t === 'triple' ? 3 : 1;
    const word = repeat > 1 ? tokens[++i] : t;
    if (!word) break;
    const digits = /^\d+$/.test(word) ? word : DIGIT_WORDS[word];
    if (digits) out.push(digits.repeat(repeat));
  }
  return out.join('');
}

/** Say a short line now, interrupting anything already being read. */
export function speakNow(text: string, language: ReplyLanguage = 'en') {
  void Speech.stop();
  Speech.speak(text, { language: SPEECH_LOCALE[language] });
}
