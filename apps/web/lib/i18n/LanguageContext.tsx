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
/** Also mirrored to a cookie so the server can localize on first paint (no flash). */
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
  /** Server-rendered language from the `getrentos_language` cookie. */
  initialLanguage?: Language;
}) => {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  // When the server had no cookie (first visit / SSR miss), honour any
  // previously saved client-side preference without a visible flash.
  useEffect(() => {
    if (initialLanguage !== 'en') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'pcm') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguageState(stored);
    }
  }, [initialLanguage]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    localStorage.setItem(STORAGE_KEY, next);
    // Persist for SSR so the next page load is localized on first paint.
    document.cookie = `${LANGUAGE_COOKIE_KEY}=${next}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  }, []);

  const t = useCallback((key: TranslationKey) => translations[language][key], [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
