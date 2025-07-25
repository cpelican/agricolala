import { type NextRequest } from 'next/server';

export const appLanguages = {
  en: 'en',
  it: 'it',
} as const;


export const languageIsLocale = (language: string | undefined): language is Locale => {
  if (!language) return false;
  return language in appLanguages;
};

export type Locale = (typeof appLanguages)[keyof typeof appLanguages];

export const defaultLocale = appLanguages.en;

export const getLocaleFromPathname = (pathname: string) => {
  return pathname.startsWith('/it') ? appLanguages.it : appLanguages.en;
};

export const getLocaleFromRequest = (request: NextRequest): Locale => {
  const acceptLanguage = request.headers.get('accept-language') || '';
  return acceptLanguage.includes('it') ? appLanguages.it : appLanguages.en;
};
