import { useEffect, MutableRefObject } from 'react';
import { LiveDirective, SkillMeta } from '../types/index.ts';
import { Language } from '../i18n/index.ts';

interface UseGlobalShortcutsProps {
  lastClearedDirectivesRef: MutableRefObject<LiveDirective[] | null>;
  handleUndoRestoreDirectives: () => Promise<void>;
  activeSkills: SkillMeta[];
  lang: Language;
}

export function useGlobalShortcuts({
  lastClearedDirectivesRef,
  handleUndoRestoreDirectives,
  activeSkills,
  lang,
}: UseGlobalShortcutsProps) {
  // Root capture listener to intercept Windows Alt + Space system menu clash (SC_KEYMENU)
  useEffect(() => {
    const handleInterceptAltSpace = (e: KeyboardEvent) => {
      if (e.altKey && (e.code === 'Space' || e.key === ' ')) {
        // Stop Windows OS / WebView2 from opening the window system menu or activating the menu bar
        e.preventDefault();
        e.stopPropagation();
        const input = document.getElementById('live-directive-input') as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.select();
        }
      }
    };
    window.addEventListener('keydown', handleInterceptAltSpace, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleInterceptAltSpace, { capture: true });
    };
  }, []);

  // Global Ctrl + Z Keyboard Shortcut for Directive Undo
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        const activeEl = document.activeElement;
        const tagName = activeEl?.tagName?.toLowerCase();
        const isInput =
          tagName === 'input' ||
          tagName === 'textarea' ||
          (activeEl as HTMLElement)?.isContentEditable;

        if (isInput) {
          // Inside text inputs, let native browser undo handle typing
          return;
        }

        if (lastClearedDirectivesRef.current && lastClearedDirectivesRef.current.length > 0) {
          e.preventDefault();
          handleUndoRestoreDirectives();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [activeSkills, lang, lastClearedDirectivesRef, handleUndoRestoreDirectives]);
}
