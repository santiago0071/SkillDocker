import React from 'react';
import { WorkspaceState } from '../../types/index.ts';
import { Language } from '../../i18n/index.ts';
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  GripVertical,
  Layers,
  ShieldCheck,
  Terminal,
  Cpu,
  Zap,
  Lock,
} from 'lucide-react';
import type { ActiveView } from './types.ts';
import type { ActiveDragState } from './useDockSidebar.ts';
import { DockSidebarWorkbenches } from './DockSidebarWorkbenches.tsx';

interface DockSidebarProps {
  sidebarWidth: number;
  isSkillsHubExpanded: boolean;
  toggleSkillsHub: () => void;
  isWorkbenchesExpanded: boolean;
  toggleWorkbenches: () => void;
  hubOrder: string[];
  wbOrder: string[];
  DEFAULT_HUB_ORDER: string[];
  DEFAULT_WB_ORDER: string[];
  handleResetSidebarOrder: () => void;
  activeDrag: ActiveDragState | null;
  getItemDragStyle: (itemId: string, itemIndex: number, group: 'hub' | 'wb') => React.CSSProperties;
  handlePointerDown: (e: React.PointerEvent, id: string, group: 'hub' | 'wb') => void;
  isDragClickPrevented: () => boolean;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  moveHubItem: (id: string, direction: 'up' | 'down') => void;
  moveWbItem: (id: string, direction: 'up' | 'down') => void;
  globalCounts: {
    all: number;
    safety: number;
    workflow: number;
    architecture: number;
    custom: number;
  };
  workspace: WorkspaceState;
  t: Record<string, string>;
  lang: Language;
  setIsForgeOpen: (open: boolean) => void;
  setIsDoctorOpen: (open: boolean) => void;
  setDoctorTargetSkillId: (id?: string) => void;
  setIsGuideOpen: (open: boolean) => void;
}

export const DockSidebar: React.FC<DockSidebarProps> = ({
  sidebarWidth,
  isSkillsHubExpanded,
  toggleSkillsHub,
  isWorkbenchesExpanded,
  toggleWorkbenches,
  hubOrder,
  wbOrder,
  DEFAULT_HUB_ORDER,
  DEFAULT_WB_ORDER,
  handleResetSidebarOrder,
  activeDrag,
  getItemDragStyle,
  handlePointerDown,
  isDragClickPrevented,
  activeView,
  setActiveView,
  moveHubItem,
  moveWbItem,
  globalCounts,
  workspace,
  t,
  lang,
  setIsForgeOpen,
  setIsDoctorOpen,
  setDoctorTargetSkillId,
  setIsGuideOpen,
}) => {
  return (
    <aside
      style={{ width: `${sidebarWidth}px` }}
      className="bg-[#0b0d16] border-r border-white/[0.06] flex flex-col justify-between p-3 flex-shrink-0 overflow-y-auto overflow-x-hidden relative"
    >
      <div className="space-y-5">
        {/* Group 1: 技能资产大厅 (独立页面) - 可伸缩收纳与自由拖拽排序 */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <button
              type="button"
              onClick={toggleSkillsHub}
              className="flex-1 flex items-center justify-between px-1 py-1 rounded-lg hover:bg-white/[0.04] transition group cursor-pointer text-left select-none"
              title={isSkillsHubExpanded ? (lang === 'zh' ? '点击折叠收纳技能资产列表' : 'Collapse Skill Hubs') : (lang === 'zh' ? '点击展开技能资产列表' : 'Expand Skill Hubs')}
            >
              <div className="flex items-center space-x-1.5 min-w-0">
                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-transform duration-200 ${isSkillsHubExpanded ? '' : '-rotate-90'}`} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 group-hover:text-gray-200 whitespace-nowrap transition-colors">
                  {lang === 'zh' ? '技能资产大厅' : 'Skill Asset Hubs'}
                </span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 whitespace-nowrap flex-shrink-0">
                {globalCounts.all} 项
              </span>
            </button>
            {(JSON.stringify(hubOrder) !== JSON.stringify(DEFAULT_HUB_ORDER) || JSON.stringify(wbOrder) !== JSON.stringify(DEFAULT_WB_ORDER)) && (
              <button
                type="button"
                onClick={handleResetSidebarOrder}
                className="p-1 rounded text-gray-500 hover:text-indigo-300 hover:bg-white/[0.06] transition cursor-pointer ml-1"
                title={lang === 'zh' ? '恢复默认导航排序' : 'Reset default navigation order'}
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {isSkillsHubExpanded && (
            <nav className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
              {hubOrder.map((itemId, idx) => {
                const itemDefs: Record<string, { label: string; icon: any; count: number }> = {
                  'all-skills': { label: lang === 'zh' ? '全部技能大厅' : 'All Skills Matrix', icon: Layers, count: globalCounts.all },
                  'safety': { label: t.catSafety, icon: ShieldCheck, count: globalCounts.safety },
                  'workflow': { label: t.catWorkflow, icon: Terminal, count: globalCounts.workflow },
                  'architecture': { label: t.catArch, icon: Cpu, count: globalCounts.architecture },
                  'custom': { label: t.catCustom, icon: Zap, count: globalCounts.custom },
                };
                const def = itemDefs[itemId];
                if (!def) return null;
                const Icon = def.icon;
                const isActive = activeView === itemId;
                const isDragging = activeDrag?.id === itemId;

                return (
                  <div
                    key={itemId}
                    data-drag-id={itemId}
                    data-drag-group="hub"
                    role="button"
                    tabIndex={0}
                    style={getItemDragStyle(itemId, idx, 'hub')}
                    onClick={() => {
                      if (isDragClickPrevented()) return;
                      setActiveView(itemId as ActiveView);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveView(itemId as ActiveView);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer select-none group border ${
                      isDragging
                        ? 'bg-indigo-500/20 border-indigo-400'
                        : isActive
                        ? 'bg-indigo-600/25 text-white border-indigo-500/50 shadow-md shadow-indigo-600/20'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border-transparent'
                    }`}
                  >
                    <div className={`flex items-center space-x-2 min-w-0 truncate ${activeDrag ? 'pointer-events-none' : ''}`}>
                      <div
                        onPointerDown={(e) => handlePointerDown(e, itemId, 'hub')}
                        className="p-1 -ml-1 rounded hover:bg-white/10 text-gray-500 group-hover:text-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
                        title={lang === 'zh' ? '按住上下拖动排序' : 'Drag to reorder'}
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                      <span className="truncate">{def.label}</span>
                    </div>
                    <div className={`flex items-center space-x-1.5 flex-shrink-0 ${activeDrag ? 'pointer-events-none' : ''}`}>
                      <div className="hidden group-hover:flex items-center space-x-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveHubItem(itemId, 'up');
                          }}
                          className="p-1 rounded bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white disabled:opacity-20 cursor-pointer transition"
                          title={lang === 'zh' ? '向上移动' : 'Move up'}
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === hubOrder.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveHubItem(itemId, 'down');
                          }}
                          className="p-1 rounded bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white disabled:opacity-20 cursor-pointer transition"
                          title={lang === 'zh' ? '向下移动' : 'Move down'}
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border whitespace-nowrap flex-shrink-0 ${
                        isActive
                          ? 'bg-indigo-900/50 text-indigo-300 border-indigo-500/40'
                          : 'bg-gray-900 border-gray-800 text-gray-500'
                      }`}>
                        {def.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </nav>
          )}
        </div>

        {/* Group 2: 会话管控与专属工作台 - 可伸缩收纳与自由拖拽排序 */}
        <DockSidebarWorkbenches
          isWorkbenchesExpanded={isWorkbenchesExpanded}
          toggleWorkbenches={toggleWorkbenches}
          wbOrder={wbOrder}
          activeDrag={activeDrag}
          getItemDragStyle={getItemDragStyle}
          handlePointerDown={handlePointerDown}
          isDragClickPrevented={isDragClickPrevented}
          activeView={activeView}
          setActiveView={setActiveView}
          moveWbItem={moveWbItem}
          workspace={workspace}
          t={t}
          lang={lang}
          setIsForgeOpen={setIsForgeOpen}
          setIsDoctorOpen={setIsDoctorOpen}
          setDoctorTargetSkillId={setDoctorTargetSkillId}
          setIsGuideOpen={setIsGuideOpen}
        />
      </div>

      {/* Bottom Sidebar: System Health Status Card */}
      <div className="p-3 rounded-xl bg-[#0f121d] border border-white/[0.06] space-y-2 sidebar-health-card">
        <div className="flex items-center space-x-2 text-xs text-gray-300 font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span className="health-title">{t.systemHealth}</span>
        </div>
        <p className="text-[10px] text-gray-500 leading-relaxed font-mono truncate health-path" title={workspace.currentPath}>
          {t.storagePath} ~/.gemini/config/skills
        </p>
      </div>
    </aside>
  );
};
