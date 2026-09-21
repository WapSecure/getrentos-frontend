'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { translations, type Language, type TranslationKey } from './translations';

const STORAGE_KEY = 'getrentos_language';
/** Mirrored to a cookie too, so other tabs and the API can see the choice. */
export const LANGUAGE_COOKIE_KEY = 'getrentos_language';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};

export const LanguageProvider = ({
  children,
  initialLanguage = 'en',
}: {
  children: ReactNode;
  /** Language to start in. The app root leaves it at English; see the effect below. */
  initialLanguage?: Language;
}) => {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  // The server renders in English (it must not read the cookie, or every page
  // becomes uncacheable), so a saved preference is restored here, right after the
  // first paint. Only a visitor who chose Pidgin sees the difference.
  useEffect(() => {
    if (initialLanguage !== 'en') return;
    const fromCookie = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith(`${LANGUAGE_COOKIE_KEY}=`))
      ?.split('=')[1];
    const stored = localStorage.getItem(STORAGE_KEY) ?? fromCookie;
    if (stored === 'pcm') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguageState('pcm');
    }
  }, [initialLanguage]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.cookie = `${LANGUAGE_COOKIE_KEY}=${next}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  }, []);

  const t = useCallback((key: TranslationKey) => translations[language][key], [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
