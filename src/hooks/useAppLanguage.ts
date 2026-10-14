import { useState } from 'react';
import { Language } from '../i18n/index.ts';

export function useAppLanguage() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const savedLang = localStorage.getItem('skilldocker_lang_v2');
      if (savedLang === 'en' || savedLang === 'zh') return savedLang;
    } catch {
      // fallback
    }
    return 'zh';
  });

  const handleToggleLang = () => {
    const nextLang: Language = lang === 'zh' ? 'en' : 'zh';
    setLang(nextLang);
    try {
      localStorage.setItem('skilldocker_lang_v2', nextLang);
    } catch (e) {
      console.warn('Failed to save language preference', e);
    }
  };

  return {
    lang,
    setLang,
    handleToggleLang,
  };
}
