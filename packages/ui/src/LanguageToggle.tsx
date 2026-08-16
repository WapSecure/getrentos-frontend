'use client';

import { Globe, Check } from 'lucide-react';
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
          className="relative h-10 px-3 rounded-full bg-gray-200 dark:bg-white/10 backdrop-blur-sm border border-gray-300 dark:border-white/20 hover:bg-gray-300 dark:hover:bg-white/20 transition-all duration-200 flex items-center gap-1.5"
          aria-label={ariaLabel}
        >
          <Globe className="w-4 h-4 text-gray-900 dark:text-white" />
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
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
