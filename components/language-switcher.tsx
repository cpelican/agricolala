'use client';

import { appLanguages, getLocaleFromPathname } from '@/lib/server-translations';
import { useRouter, usePathname } from 'next/navigation';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  

  const currentLocale = getLocaleFromPathname(pathname);
  
  const changeLanguage = async (newLocale: string) => {
    try {
      console.info('changeLanguage', newLocale);
      
      const newPath = pathname.replace(/^\/(en|it)/, `/${newLocale}`);
      router.push(newPath);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      console.error('Error updating locale');
      // Still navigate even if database update fails
      const newPath = pathname.replace(/^\/(en|it)/, `/${newLocale}`);
      router.push(newPath);
    }
  };
  
  return (
    <select 
      value={currentLocale} 
      onChange={(e) => changeLanguage(e.target.value)}
      className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
    >
      <option value={appLanguages.en}>English</option>
      <option value={appLanguages.it}>Italiano</option>
    </select>
  );
} 