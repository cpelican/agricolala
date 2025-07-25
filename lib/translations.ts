'use client';

import { usePathname } from 'next/navigation';
import { appLanguages, defaultLocale, type Locale } from './server-translations';
import { useState, useEffect } from 'react';

export function useTranslations() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const [translations, setTranslations] = useState<any>(null);
  
  useEffect(() => {
    import(`../locales/${locale}.json`)
      .then((module) => setTranslations(module.default))
      .catch(() => {
        // Fallback to English if import fails
        import('../locales/en.json')
          .then((module) => setTranslations(module.default));
      });
  }, [locale]);
  
  const t = (key: string): string => {
    if (!translations) return key;
    return key.split('.').reduce((obj, k) => obj?.[k], translations) || key;
  };
  
  const getArray = (key: string): string[] => {
    if (!translations) return [];
    const value = key.split('.').reduce((obj, k) => obj?.[k], translations);
    return Array.isArray(value) ? value : [];
  };
  
  const getDiseaseTranslation = (diseaseName: string): string => {
    const name = diseaseName.toLowerCase();
    return t(`diseases.${name}`) || diseaseName;
  };
  
  const getSubstanceTranslation = (substanceName: string): string => {
    const name = substanceName.toLowerCase();
    return t(`substances.${name}`) || substanceName;
  };
  
  return { t, getArray, locale, getDiseaseTranslation, getSubstanceTranslation };
}


export const getLocaleFromPathname = (pathname: string) => {
  return pathname.startsWith('/it') ? appLanguages.it : appLanguages.en;
};

export const getLocaleFromBrowser = (): Locale => {
  const browserLang = navigator.language || navigator.languages?.find(lang => lang in appLanguages) || defaultLocale;

  return browserLang in appLanguages ? appLanguages[browserLang as Locale] : defaultLocale;
};