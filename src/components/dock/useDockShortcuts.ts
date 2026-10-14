import { useEffect } from 'react';
import type { ActiveView } from './types.ts';

interface UseDockShortcutsProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  setIsShortcutsHelpOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDoctorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsForgeOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsVaultOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isGuideOpen: boolean;
  setIsGuideOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDoctorOpen: boolean;
  isForgeOpen: boolean;
  isVaultOpen: boolean;
  isSettingsOpen: boolean;
  isShortcutsHelpOpen: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export function useDockShortcuts({
  activeView,
  setActiveView,
  setIsShortcutsHelpOpen,
  setIsDoctorOpen,
  setIsForgeOpen,
  setIsVaultOpen,
  setIsSettingsOpen,
  isGuideOpen,
  setIsGuideOpen,
  isDoctorOpen,
  isForgeOpen,
  isVaultOpen,
  isSettingsOpen,
  isShortcutsHelpOpen,
  searchQuery,
  setSearchQuery,
  searchInputRef,
}: UseDockShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA';

      // 0. Alt+Space or Ctrl+J: Jump & Focus Live Directive Injector input!
      if (
        (e.altKey && (e.code === 'Space' || e.key === ' ')) ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j')
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (activeView !== 'all-skills' && activeView !== 'cockpit') {
          setActiveView('all-skills');
        }
        setTimeout(() => {
          const input = document.getElementById('live-directive-input') as HTMLInputElement | null;
          if (input) {
            input.focus();
            input.select();
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 50);
        return;
      }

      // F1: Classic Windows standard for Help / Shortcuts modal
      if (e.key === 'F1') {
        e.preventDefault();
        setIsShortcutsHelpOpen((prev) => !prev);
        return;
      }

      // 1. Ctrl+K or Cmd+K: Focus search input
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // 2. / key when not inside an input: Focus search input
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // 3. Quick View Switchers: Alt+1 ~ Alt+5, Alt+C
      if (e.altKey && !isInput) {
        if (e.key === '1') { e.preventDefault(); setActiveView('all-skills'); return; }
        if (e.key === '2') { e.preventDefault(); setActiveView('safety'); return; }
        if (e.key === '3') { e.preventDefault(); setActiveView('workflow'); return; }
        if (e.key === '4') { e.preventDefault(); setActiveView('architecture'); return; }
        if (e.key === '5') { e.preventDefault(); setActiveView('custom'); return; }
        if (e.key === '6' || e.key.toLowerCase() === 'i') { e.preventDefault(); setActiveView('injected'); return; }
        if (e.key.toLowerCase() === 'c') { e.preventDefault(); setActiveView('cockpit'); return; }
      }

      // 4. Alt+D: Toggle Skills Doctor
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsDoctorOpen((prev) => !prev);
        return;
      }

      // 5. Alt+F: Toggle Skill Forge
      if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsForgeOpen((prev) => !prev);
        return;
      }

      // 6. Alt+V: Toggle Portable Vault
      if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setIsVaultOpen((prev) => !prev);
        return;
      }

      // 7. Escape: Close open drawers / modals or clear search
      if (e.key === 'Escape') {
        if (isGuideOpen) {
          setIsGuideOpen(false);
          return;
        }
        if (isShortcutsHelpOpen) {
          setIsShortcutsHelpOpen(false);
          return;
        }
        if (isDoctorOpen) {
          setIsDoctorOpen(false);
          return;
        }
        if (isForgeOpen) {
          setIsForgeOpen(false);
          return;
        }
        if (isVaultOpen) {
          setIsVaultOpen(false);
          return;
        }
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return;
        }
        if (searchQuery) {
          setSearchQuery('');
          searchInputRef.current?.blur();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeView,
    setActiveView,
    isDoctorOpen,
    isForgeOpen,
    isVaultOpen,
    isSettingsOpen,
    isShortcutsHelpOpen,
    isGuideOpen,
    setIsDoctorOpen,
    setIsForgeOpen,
    setIsVaultOpen,
    setIsSettingsOpen,
    setIsShortcutsHelpOpen,
    setIsGuideOpen,
    searchQuery,
    setSearchQuery,
    searchInputRef,
  ]);
}
