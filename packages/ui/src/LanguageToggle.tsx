'use client';

import { Globe, Check } from '@sureground/icons';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './DropdownMenu';

interface LanguageOption {
  value: string;
  label: string;
}

interface LanguageToggleProps {
  language: string;
  languages: LanguageOption[];
  onLanguageChange: (language: string) => void;
  ariaLabel?: string;
}

export const LanguageToggle = ({
  language,
  languages,
  onLanguageChange,
  ariaLabel = 'Switch language',
}: LanguageToggleProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative h-10 px-3 rounded-full border border-border bg-card hover:bg-secondary transition-all duration-200 flex items-center gap-1.5"
          aria-label={`${language.toUpperCase()} ${ariaLabel}`}
        >
          <Globe className="h-4 w-4 text-foreground" />
          <span className="text-xs font-semibold text-foreground">
            {language.toUpperCase()}
          </span>
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40">
        {languages.map((lang) => (
          <DropdownMenuItem key={lang.value} onClick={() => onLanguageChange(lang.value)}>
            <span className="flex-1">{lang.label}</span>
            {lang.value === language && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
