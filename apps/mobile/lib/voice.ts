import { useEffect, useMemo, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import { languageLabel, type ReplyLanguage } from './replyLanguage';

/**
 * Voice in and out on the phone, using the device's own speech services only:
 * nothing is recorded or sent to Sureground or any other provider by this code.
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
      return 'Allow the microphone and speech recognition for Sureground in Settings to speak your question.';
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

/** Say a short line now, interrupting anything already being read. */
export function speakNow(text: string, language: ReplyLanguage = 'en') {
  void Speech.stop();
  Speech.speak(text, { language: SPEECH_LOCALE[language] });
}
