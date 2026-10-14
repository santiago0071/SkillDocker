import { useState, useEffect } from 'react';

export type AppTheme = 'dark' | 'light' | 'retro-win95';

export function useAppTheme() {
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const savedTheme = localStorage.getItem('skilldocker_theme');
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'retro-win95') return savedTheme;
    } catch {}
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-retro-win95');
    if (theme === 'retro-win95') {
      document.documentElement.classList.add('theme-retro-win95');
    } else if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.add('theme-dark');
    }
  }, [theme]);

  const handleSelectTheme = (nextTheme: AppTheme) => {
    setTheme(nextTheme);
    try {
      localStorage.setItem('skilldocker_theme', nextTheme);
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  };

  const handleToggleTheme = () => {
    const cycle: Record<AppTheme, AppTheme> = {
      dark: 'light',
      light: 'retro-win95',
      'retro-win95': 'dark',
    };
    handleSelectTheme(cycle[theme] || 'dark');
  };

  return {
    theme,
    handleSelectTheme,
    handleToggleTheme,
  };
}
