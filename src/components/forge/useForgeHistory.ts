import { useState, useMemo, useCallback, useRef } from 'react';
import { ForgedHistoryItem } from './types.ts';

export function useForgeHistory(prompt: string, generatedSource: 'llm' | 'template', showToast: (msg: string, type: 'success' | 'error' | 'info') => void, lang: string) {
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(true);
  const [historySearch, setHistorySearch] = useState('');
  const [historyItems, setHistoryItems] = useState<ForgedHistoryItem[]>(() => {
    try {
      const raw = localStorage.getItem('skilldocker_forged_history');
      if (raw) {
        const parsed: ForgedHistoryItem[] = JSON.parse(raw);
        const realForged = parsed.filter((item) => {
          if (item.prompt && item.prompt.trim()) return true;
          const isAutoSeededPlaceholder = item.markdown?.includes(`针对 [${item.name}] 的专属工程作业技能与规则规范。`);
          return !isAutoSeededPlaceholder && Boolean(item.prompt);
        });
        localStorage.setItem('skilldocker_forged_history', JSON.stringify(realForged));
        return realForged;
      }
    } catch (_e) {}
    return [];
  });

  const [historyDrawerWidth, setHistoryDrawerWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('skilldocker_forge_history_width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 220 && val <= 560) return val;
      }
    } catch {}
    return 320;
  });
  const [isDraggingHistory, setIsDraggingHistory] = useState(false);
  const isResizingHistory = useRef(false);
  const forgeBodyRef = useRef<HTMLDivElement>(null);

  const handleHistoryResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingHistory.current = true;
    setIsDraggingHistory(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingHistory.current) return;
      const leftOffset = forgeBodyRef.current?.getBoundingClientRect().left || 0;
      const newWidth = Math.min(Math.max(moveEvent.clientX - leftOffset, 220), 560);
      setHistoryDrawerWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizingHistory.current = false;
      setIsDraggingHistory(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setHistoryDrawerWidth((latest) => {
        try {
          localStorage.setItem('skilldocker_forge_history_width', String(latest));
        } catch {}
        return latest;
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  const handleHistoryReset = useCallback(() => {
    setHistoryDrawerWidth(320);
    try {
      localStorage.setItem('skilldocker_forge_history_width', '320');
    } catch {}
  }, []);

  const saveToHistory = useCallback(
    (item: {
      name: string;
      category: string;
      description: string;
      markdown: string;
      doctorScore?: number;
      gradeLabel?: string;
      prompt?: string;
      source?: 'llm' | 'template';
    }) => {
      try {
        const newItem: ForgedHistoryItem = {
          id: `${item.name}-${Date.now()}`,
          name: item.name,
          category: item.category,
          description: item.description,
          markdown: item.markdown,
          timestamp: Date.now(),
          doctorScore: item.doctorScore || 95,
          gradeLabel: item.gradeLabel || '合规',
          prompt: item.prompt || prompt.trim(),
          source: item.source || generatedSource,
        };
        setHistoryItems((prev) => {
          const filtered = prev.filter((p) => p.name !== item.name);
          const updated = [newItem, ...filtered].slice(0, 50);
          localStorage.setItem('skilldocker_forged_history', JSON.stringify(updated));
          return updated;
        });
      } catch (e) {
        console.error('Failed to save history', e);
      }
    },
    [prompt, generatedSource]
  );

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryItems((prev) => {
      const updated = prev.filter((x) => x.id !== id);
      localStorage.setItem('skilldocker_forged_history', JSON.stringify(updated));
      return updated;
    });
    showToast(lang === 'zh' ? '已从历史记录中移除' : 'Removed from history', 'info');
  };

  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return historyItems;
    const q = historySearch.toLowerCase();
    return historyItems.filter(
      (h) => h.name.toLowerCase().includes(q) || h.description.toLowerCase().includes(q)
    );
  }, [historyItems, historySearch]);

  return {
    isHistoryDrawerOpen,
    setIsHistoryDrawerOpen,
    historySearch,
    setHistorySearch,
    historyItems,
    setHistoryItems,
    historyDrawerWidth,
    isDraggingHistory,
    forgeBodyRef,
    handleHistoryResizeStart,
    handleHistoryReset,
    saveToHistory,
    handleDeleteHistoryItem,
    filteredHistory,
  };
}
