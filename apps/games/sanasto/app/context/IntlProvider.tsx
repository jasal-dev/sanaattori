'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode, useEffect, useState } from 'react';
import { useLocale, type Locale } from './LocaleContext';

type Messages = Record<string, any>;

export function IntlProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const [messages, setMessages] = useState<Messages | null>(null);

  useEffect(() => {
    // Load messages for the current locale
    async function loadMessages() {
      try {
        const msgs = await import(`../../messages/${locale}.json`);
        setMessages(msgs.default);
      } catch (error) {
        console.error('Failed to load messages for locale:', locale, error);
        // Fallback to English
        const msgs = await import(`../../messages/en.json`);
        setMessages(msgs.default);
      }
    }
    loadMessages();
  }, [locale]);

  if (!messages) {
    return null; // Or a loading spinner
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
