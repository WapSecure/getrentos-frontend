'use client';

import { useEffect, useRef, useState } from 'react';
import { languageLabel, type ReplyLanguage } from '@/lib/replyLanguage';

/**
 * Voice in and out in the browser, using the browser's own speech services.
 * GetRentos never receives audio: the browser turns speech into text (Chrome
 * does this with Google's service) and the person sends the text themselves.
 */

/** Nigerian locales for each reply language; Pidgin is recognised as Nigerian English. */
export const SPEECH_LOCALE: Record<ReplyLanguage, string> = {
  en: 'en-NG',
  pcm: 'en-NG',
  yo: 'yo-NG',
  ha: 'ha-NG',
  ig: 'ig-NG',
};

interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function errorText(code: string, language: ReplyLanguage): string {
  switch (code) {
    case 'language-not-supported':
      return `Speaking in ${languageLabel(language)} is not supported in this browser yet. Try English, or type.`;
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Allow microphone access for this site to speak your question.';
    case 'no-speech':
      return 'Didn’t catch that. Press the mic and try again.';
    case 'network':
      return 'Voice input needs a connection. Try again, or type.';
    default:
      return 'Voice input stopped. Try again, or type.';
  }
}

/** Speak a question; the words land in the box as they are recognised, to check before sending. */
export function useVoiceInput(language: ReplyLanguage, onText: (text: string) => void) {
  const [available] = useState(() => recognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = useRef<Recognition | null>(null);

  useEffect(() => () => current.current?.abort(), []);

  const start = () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    setError(null);
    const r = new Ctor();
    r.lang = SPEECH_LOCALE[language];
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => {
      const text = Array.from(e.results)
        .map((alt) => alt[0]?.transcript ?? '')
        .join('');
      onText(text);
    };
    r.onend = () => setListening(false);
    r.onerror = (e) => {
      setListening(false);
      if (e.error !== 'aborted') setError(errorText(e.error, language));
    };
    current.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      setError(errorText('unknown', language));
    }
  };

  const stop = () => current.current?.stop();

  return { available, listening, error, start, stop };
}

/**
 * Read an answer aloud with the browser's voices. English and Pidgin use any
 * English voice; Yoruba, Hausa and Igbo only when the browser has one.
 */
export function useReadAloud() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener('voiceschanged', load);
    const timer = window.setTimeout(load, 0);
    return () => {
      window.clearTimeout(timer);
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      window.speechSynthesis.cancel();
    };
  }, []);

  const voiceFor = (language: ReplyLanguage) => {
    const locale = SPEECH_LOCALE[language].toLowerCase();
    const prefix = language === 'pcm' ? 'en' : language;
    return (
      voices.find((v) => v.lang.toLowerCase() === locale) ??
      voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ??
      null
    );
  };

  const canRead = (language: ReplyLanguage) => voiceFor(language) !== null;

  const toggle = (id: number, text: string, language: ReplyLanguage) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    if (speaking === id) {
      setSpeaking(null);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    const voice = voiceFor(language);
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    }
    u.onend = () => setSpeaking(null);
    u.onerror = () => setSpeaking(null);
    setSpeaking(id);
    synth.speak(u);
  };

  return { canRead, speaking, toggle };
}

/** Say a short line now in the browser, interrupting anything already being read. */
export function speakNow(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = SPEECH_LOCALE.en;
  window.speechSynthesis.speak(u);
}
