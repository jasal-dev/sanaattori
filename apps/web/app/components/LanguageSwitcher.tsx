'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale, type Locale } from '../context/LocaleContext';

const languages = [
  { code: 'en' as Locale, name: 'English', flag: '🇬🇧', ariaLabel: 'Switch to English' },
  { code: 'fi' as Locale, name: 'Suomi', flag: '🇫🇮', ariaLabel: 'Vaihda suomeksi' },
  { code: 'sv' as Locale, name: 'Svenska', flag: '🇸🇪', ariaLabel: 'Byt till svenska' },
  { code: 'de' as Locale, name: 'Deutsch', flag: '🇩🇪', ariaLabel: 'Auf Deutsch umschalten' },
];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-1"
        aria-label="Change language"
      >
        <span className="text-2xl">{currentLanguage.flag}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-300 dark:border-gray-600 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                locale === lang.code ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
              aria-label={lang.ariaLabel}
            >
              <span className="text-xl" aria-hidden="true">{lang.flag}</span>
              <span className="text-sm font-medium">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
