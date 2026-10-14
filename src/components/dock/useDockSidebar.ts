import React, { useState, useRef, useCallback } from 'react';

export const DEFAULT_HUB_ORDER = ['all-skills', 'safety', 'workflow', 'architecture', 'custom'];
export const DEFAULT_WB_ORDER = ['injected', 'forge', 'doctor', 'guide'];

export interface ActiveDragState {
  id: string;
  group: 'hub' | 'wb';
  startY: number;
  currentDeltaY: number;
  initialIndex: number;
  currentIndex: number;
  itemHeight: number;
}

export function useDockSidebar() {
  // Collapsible Left Sidebar Groups
  const [isSkillsHubExpanded, setIsSkillsHubExpanded] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem('skilldocker_sidebar_skills_expanded');
      if (val !== null) return val === 'true';
    } catch {}
    return true;
  });

  const [isWorkbenchesExpanded, setIsWorkbenchesExpanded] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem('skilldocker_sidebar_workbenches_expanded');
      if (val !== null) return val === 'true';
    } catch {}
    return true;
  });

  const toggleSkillsHub = () => {
    setIsSkillsHubExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('skilldocker_sidebar_skills_expanded', String(next));
      } catch {}
      return next;
    });
  };

  const toggleWorkbenches = () => {
    setIsWorkbenchesExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('skilldocker_sidebar_workbenches_expanded', String(next));
      } catch {}
      return next;
    });
  };

  // Drag-and-Drop Reordering
  const [hubOrder, setHubOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('skilldocker_sidebar_hub_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_HUB_ORDER;
  });

  const [wbOrder, setWbOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('skilldocker_sidebar_wb_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_WB_ORDER;
  });

  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  const activeDragRef = useRef<ActiveDragState | null>(null);
  const justFinishedDragRef = useRef(false);

  const isDragClickPrevented = () => !!activeDragRef.current || justFinishedDragRef.current;

  const handlePointerDown = (e: React.PointerEvent, id: string, group: 'hub' | 'wb') => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const targetEl = (e.currentTarget as HTMLElement).closest(`[data-drag-id="${id}"]`) as HTMLElement;
    const itemHeight = targetEl ? targetEl.getBoundingClientRect().height + 4 : 46;
    const currentList = group === 'hub' ? hubOrder : wbOrder;
    const initialIndex = currentList.indexOf(id);
    if (initialIndex === -1) return;

    const startY = e.clientY;
    const initialDragState: ActiveDragState = {
      id,
      group,
      startY,
      currentDeltaY: 0,
      initialIndex,
      currentIndex: initialIndex,
      itemHeight,
    };

    activeDragRef.current = initialDragState;
    setActiveDrag(initialDragState);

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    let rafId: number | null = null;

    const onPointerMove = (moveEvt: PointerEvent) => {
      if (!activeDragRef.current) return;
      const deltaY = moveEvt.clientY - startY;
      const list = activeDragRef.current.group === 'hub' ? hubOrder : wbOrder;
      const initIdx = activeDragRef.current.initialIndex;
      const h = activeDragRef.current.itemHeight;

      const offsetSteps = Math.round(deltaY / h);
      const newIdx = Math.max(0, Math.min(list.length - 1, initIdx + offsetSteps));

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!activeDragRef.current) return;
        const updated: ActiveDragState = {
          ...activeDragRef.current,
          currentDeltaY: deltaY,
          currentIndex: newIdx,
        };
        activeDragRef.current = updated;
        setActiveDrag(updated);
      });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (rafId) cancelAnimationFrame(rafId);

      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      const finalState = activeDragRef.current;
      if (finalState && Math.abs(finalState.currentDeltaY) > 4) {
        justFinishedDragRef.current = true;
        setTimeout(() => {
          justFinishedDragRef.current = false;
        }, 120);
      }

      if (finalState && finalState.currentIndex !== finalState.initialIndex) {
        const { group: grp, initialIndex: fromIdx, currentIndex: toIdx } = finalState;

        if (grp === 'hub') {
          setHubOrder((prev) => {
            const next = [...prev];
            const [removed] = next.splice(fromIdx, 1);
            next.splice(toIdx, 0, removed);
            try {
              localStorage.setItem('skilldocker_sidebar_hub_order', JSON.stringify(next));
            } catch {}
            return next;
          });
        } else {
          setWbOrder((prev) => {
            const next = [...prev];
            const [removed] = next.splice(fromIdx, 1);
            next.splice(toIdx, 0, removed);
            try {
              localStorage.setItem('skilldocker_sidebar_wb_order', JSON.stringify(next));
            } catch {}
            return next;
          });
        }
      }

      activeDragRef.current = null;
      setActiveDrag(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const getItemDragStyle = (itemId: string, itemIndex: number, group: 'hub' | 'wb'): React.CSSProperties => {
    if (!activeDrag || activeDrag.group !== group) {
      return { transition: 'transform 200ms cubic-bezier(0.2, 0, 0, 1)' };
    }

    if (activeDrag.id === itemId) {
      return {
        transform: `translateY(${activeDrag.currentDeltaY}px) scale(1.025)`,
        zIndex: 50,
        boxShadow: '0 20px 35px -5px rgba(0, 0, 0, 0.7), 0 0 0 1.5px rgba(99, 102, 241, 0.6), 0 0 25px rgba(99, 102, 241, 0.3)',
        cursor: 'grabbing',
        position: 'relative',
        opacity: 0.98,
        transition: 'none',
      };
    }

    const { initialIndex, currentIndex, itemHeight } = activeDrag;

    let shiftY = 0;
    if (initialIndex < currentIndex) {
      if (itemIndex > initialIndex && itemIndex <= currentIndex) {
        shiftY = -itemHeight;
      }
    } else if (initialIndex > currentIndex) {
      if (itemIndex >= currentIndex && itemIndex < initialIndex) {
        shiftY = itemHeight;
      }
    }

    return {
      transform: `translateY(${shiftY}px)`,
      transition: 'transform 220ms cubic-bezier(0.2, 0, 0, 1)',
      position: 'relative',
      zIndex: 1,
    };
  };

  const handleResetSidebarOrder = () => {
    setHubOrder(DEFAULT_HUB_ORDER);
    setWbOrder(DEFAULT_WB_ORDER);
    try {
      localStorage.removeItem('skilldocker_sidebar_hub_order');
      localStorage.removeItem('skilldocker_sidebar_wb_order');
    } catch {}
  };

  const moveHubItem = (id: string, direction: 'up' | 'down') => {
    setHubOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      try {
        localStorage.setItem('skilldocker_sidebar_hub_order', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const moveWbItem = (id: string, direction: 'up' | 'down') => {
    setWbOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      try {
        localStorage.setItem('skilldocker_sidebar_wb_order', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Sidebar width resize
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('skilldocker_sidebar_width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 180 && val <= 460) return val;
      }
    } catch {}
    return 256;
  });
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const isResizingSidebar = useRef(false);

  const handleSidebarResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingSidebar.current = true;
    setIsDraggingSidebar(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingSidebar.current) return;
      const newWidth = Math.min(Math.max(moveEvent.clientX, 190), 460);
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizingSidebar.current = false;
      setIsDraggingSidebar(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setSidebarWidth((latest) => {
        try {
          localStorage.setItem('skilldocker_sidebar_width', String(latest));
        } catch {}
        return latest;
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  const handleSidebarReset = useCallback(() => {
    setSidebarWidth(256);
    try {
      localStorage.setItem('skilldocker_sidebar_width', '256');
    } catch {}
  }, []);

  return {
    isSkillsHubExpanded,
    toggleSkillsHub,
    isWorkbenchesExpanded,
    toggleWorkbenches,
    hubOrder,
    wbOrder,
    activeDrag,
    handlePointerDown,
    getItemDragStyle,
    handleResetSidebarOrder,
    moveHubItem,
    moveWbItem,
    isDragClickPrevented,
    sidebarWidth,
    isDraggingSidebar,
    handleSidebarResizeStart,
    handleSidebarReset,
  };
}
