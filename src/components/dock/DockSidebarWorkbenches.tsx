import React from 'react';
import { WorkspaceState } from '../../types/index.ts';
import { Language } from '../../i18n/index.ts';
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Terminal,
  Flame,
  Stethoscope,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import type { ActiveView } from './types.ts';
import type { ActiveDragState } from './useDockSidebar.ts';

interface DockSidebarWorkbenchesProps {
  isWorkbenchesExpanded: boolean;
  toggleWorkbenches: () => void;
  wbOrder: string[];
  activeDrag: ActiveDragState | null;
  getItemDragStyle: (itemId: string, itemIndex: number, group: 'hub' | 'wb') => React.CSSProperties;
  handlePointerDown: (e: React.PointerEvent, id: string, group: 'hub' | 'wb') => void;
  isDragClickPrevented: () => boolean;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  moveWbItem: (id: string, direction: 'up' | 'down') => void;
  workspace: WorkspaceState;
  t: Record<string, string>;
  lang: Language;
  setIsForgeOpen: (open: boolean) => void;
  setIsDoctorOpen: (open: boolean) => void;
  setDoctorTargetSkillId: (id?: string) => void;
  setIsGuideOpen: (open: boolean) => void;
}

export const DockSidebarWorkbenches: React.FC<DockSidebarWorkbenchesProps> = ({
  isWorkbenchesExpanded,
  toggleWorkbenches,
  wbOrder,
  activeDrag,
  getItemDragStyle,
  handlePointerDown,
  isDragClickPrevented,
  activeView,
  setActiveView,
  moveWbItem,
  workspace,
  t,
  lang,
  setIsForgeOpen,
  setIsDoctorOpen,
  setDoctorTargetSkillId,
  setIsGuideOpen,
}) => {
  return (
    <div>
      <button
        type="button"
        onClick={toggleWorkbenches}
        className="w-full flex items-center justify-between mb-2 px-2 py-1 rounded-lg hover:bg-white/[0.04] transition group cursor-pointer text-left select-none"
        title={isWorkbenchesExpanded ? (lang === 'zh' ? '点击折叠收纳工坊工具' : 'Collapse Workbenches') : (lang === 'zh' ? '点击展开工坊工具' : 'Expand Workbenches')}
      >
        <div className="flex items-center space-x-1.5 min-w-0">
          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-transform duration-200 ${isWorkbenchesExpanded ? '' : '-rotate-90'}`} />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 group-hover:text-gray-200 whitespace-nowrap transition-colors">
            {lang === 'zh' ? '会话管控与专属工坊' : 'Steering & Workbenches'}
          </span>
        </div>
      </button>
      {isWorkbenchesExpanded && (
        <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {wbOrder.map((itemId, idx) => {
            const isDragging = activeDrag?.id === itemId;

            if (itemId === 'injected') {
              return (
                <div
                  key="injected"
                  data-drag-id="injected"
                  data-drag-group="wb"
                  role="button"
                  tabIndex={0}
                  style={getItemDragStyle('injected', idx, 'wb')}
                  onClick={() => {
                    if (isDragClickPrevented()) return;
                    setActiveView('injected');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveView('injected');
                    }
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer select-none group border injected-workbench-btn ${
                    isDragging
                      ? 'bg-emerald-500/20 border-emerald-400'
                      : activeView === 'injected'
                      ? 'bg-emerald-600/25 text-white border-emerald-500/50 shadow-md shadow-emerald-600/20'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border-transparent'
                  }`}
                >
                  <div className={`flex items-center space-x-2 min-w-0 truncate ${activeDrag ? 'pointer-events-none' : ''}`}>
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'injected', 'wb')}
                      className="p-1 -ml-1 rounded hover:bg-white/10 text-gray-500 group-hover:text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
                      title={lang === 'zh' ? '按住上下拖动排序' : 'Drag to reorder'}
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                    <Terminal className={`w-4 h-4 flex-shrink-0 ${activeView === 'injected' ? 'text-emerald-400' : 'text-gray-500'}`} />
                    <span className="truncate injected-btn-title">{t.injectedViewTitle || (lang === 'zh' ? '已注入技能与指令' : 'Injected Skills & Directives')}</span>
                  </div>
                  <div className={`flex items-center space-x-1.5 flex-shrink-0 ${activeDrag ? 'pointer-events-none' : ''}`}>
                    <div className="hidden group-hover:flex items-center space-x-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveWbItem('injected', 'up');
                        }}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white disabled:opacity-20 cursor-pointer transition"
                        title={lang === 'zh' ? '向上移动' : 'Move up'}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === wbOrder.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveWbItem('injected', 'down');
                        }}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white disabled:opacity-20 cursor-pointer transition"
                        title={lang === 'zh' ? '向下移动' : 'Move down'}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                    {workspace.liveDirectives.length > 0 && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap flex-shrink-0" title={lang === 'zh' ? '当前生效的临时指令' : 'Live directives'}>
                        {workspace.liveDirectives.length} 临时
                      </span>
                    )}
                    {(workspace.consolidatedRules?.length || 0) > 0 && (
                      <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/15 px-1.5 py-0.5 rounded border border-indigo-500/30 whitespace-nowrap flex-shrink-0" title={lang === 'zh' ? '已存入技能的规则' : 'Saved rules'}>
                        {workspace.consolidatedRules?.length} 已存
                      </span>
                    )}
                    {workspace.liveDirectives.length === 0 && (!workspace.consolidatedRules || workspace.consolidatedRules.length === 0) && (
                      <span className="text-[10px] font-mono text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800 whitespace-nowrap flex-shrink-0">
                        0
                      </span>
                    )}
                  </div>
                </div>
              );
            }

            if (itemId === 'forge') {
              return (
                <div
                  key="forge"
                  data-drag-id="forge"
                  data-drag-group="wb"
                  role="button"
                  tabIndex={0}
                  style={getItemDragStyle('forge', idx, 'wb')}
                  onClick={() => {
                    if (isDragClickPrevented()) return;
                    setIsForgeOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsForgeOpen(true);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-xs font-semibold select-none group border transition-colors cursor-pointer forge-workbench-btn ${
                    isDragging
                      ? 'bg-purple-500/25 border-purple-400'
                      : 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-200'
                  }`}
                >
                  <div className={`flex items-center space-x-2 min-w-0 truncate ${activeDrag ? 'pointer-events-none' : ''}`}>
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'forge', 'wb')}
                      className="p-1 -ml-1 rounded hover:bg-white/10 text-purple-600 group-hover:text-purple-300 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
                      title={lang === 'zh' ? '按住上下拖动排序' : 'Drag to reorder'}
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                    <Flame className="w-4 h-4 text-purple-400 flex-shrink-0 forge-icon" />
                    <span className="truncate forge-btn-title">{t.forgeBtn}</span>
                  </div>
                  <div className={`flex items-center space-x-1 flex-shrink-0 ${activeDrag ? 'pointer-events-none' : ''}`}>
                    <div className="hidden group-hover:flex items-center space-x-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveWbItem('forge', 'up');
                        }}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 text-purple-300 hover:text-white disabled:opacity-20 cursor-pointer transition"
                        title={lang === 'zh' ? '向上移动' : 'Move up'}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === wbOrder.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveWbItem('forge', 'down');
                        }}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 text-purple-300 hover:text-white disabled:opacity-20 cursor-pointer transition"
                        title={lang === 'zh' ? '向下移动' : 'Move down'}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-[10px] text-purple-400 font-mono font-bold whitespace-nowrap flex-shrink-0 forge-btn-badge">Studio</span>
                  </div>
                </div>
              );
            }

            if (itemId === 'doctor') {
              return (
                <div
                  key="doctor"
                  data-drag-id="doctor"
                  data-drag-group="wb"
                  role="button"
                  tabIndex={0}
                  style={getItemDragStyle('doctor', idx, 'wb')}
                  onClick={() => {
                    if (isDragClickPrevented()) return;
                    setDoctorTargetSkillId(workspace.activeSkills[0]?.id);
                    setIsDoctorOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDoctorTargetSkillId(workspace.activeSkills[0]?.id);
                      setIsDoctorOpen(true);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-xs font-semibold select-none group border transition-colors cursor-pointer doctor-workbench-btn ${
                    isDragging
                      ? 'bg-emerald-500/25 border-emerald-400'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-200'
                  }`}
                  title={lang === 'zh' ? 'Skills Doctor：优化完善与补充扩充' : 'Skills Doctor'}
                >
                  <div className={`flex items-center space-x-2 min-w-0 truncate ${activeDrag ? 'pointer-events-none' : ''}`}>
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'doctor', 'wb')}
                      className="p-1 -ml-1 rounded hover:bg-white/10 text-emerald-600 group-hover:text-emerald-300 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
                      title={lang === 'zh' ? '按住上下拖动排序' : 'Drag to reorder'}
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                    <Stethoscope className="w-4 h-4 text-emerald-400 flex-shrink-0 doctor-icon" />
                    <span className="truncate doctor-btn-title">{lang === 'zh' ? 'Skills 医生' : 'Skills Doctor'}</span>
                  </div>
                  <div className={`flex items-center space-x-1 flex-shrink-0 ${activeDrag ? 'pointer-events-none' : ''}`}>
                    <div className="hidden group-hover:flex items-center space-x-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveWbItem('doctor', 'up');
                        }}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 text-emerald-300 hover:text-white disabled:opacity-20 cursor-pointer transition"
                        title={lang === 'zh' ? '向上移动' : 'Move up'}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === wbOrder.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveWbItem('doctor', 'down');
                        }}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 text-emerald-300 hover:text-white disabled:opacity-20 cursor-pointer transition"
                        title={lang === 'zh' ? '向下移动' : 'Move down'}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold whitespace-nowrap flex-shrink-0 doctor-btn-badge">PRO</span>
                  </div>
                </div>
              );
            }

            if (itemId === 'guide') {
              return (
                <div
                  key="guide"
                  data-drag-id="guide"
                  data-drag-group="wb"
                  role="button"
                  tabIndex={0}
                  style={getItemDragStyle('guide', idx, 'wb')}
                  onClick={() => {
                    if (isDragClickPrevented()) return;
                    setIsGuideOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsGuideOpen(true);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold select-none group border transition-colors cursor-pointer guide-workbench-card ${
                    isDragging
                      ? 'bg-amber-500/25 border-amber-400'
                      : 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 hover:from-amber-500/25 hover:to-orange-500/15 border-amber-500/30 hover:border-amber-500/50 text-amber-200 shadow-sm hover:shadow-amber-500/10'
                  }`}
                  title={t.rookieGuideTooltip}
                >
                  <div className={`flex items-center space-x-2 min-w-0 truncate ${activeDrag ? 'pointer-events-none' : ''}`}>
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'guide', 'wb')}
                      className="p-1 -ml-1 rounded hover:bg-white/10 text-amber-600 group-hover:text-amber-300 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
                      title={lang === 'zh' ? '按住上下拖动排序' : 'Drag to reorder'}
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 group-hover:scale-105 transition-transform flex-shrink-0 guide-icon-box">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400 animate-pulse guide-icon" />
                    </div>
                    <div className="text-left min-w-0 truncate">
                      <div className="font-bold text-amber-300 truncate guide-title">
                        {lang === 'zh' ? '💡 新手通关学院' : '💡 Rookie Academy'}
                      </div>
                      <div className="text-[10px] text-amber-400/70 font-normal truncate guide-subtitle">
                        {lang === 'zh' ? '速通 · 剧本 · 避坑' : 'Guide · Playbooks · FAQ'}
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-1 flex-shrink-0 ${activeDrag ? 'pointer-events-none' : ''}`}>
                    <div className="hidden group-hover:flex items-center space-x-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveWbItem('guide', 'up');
                        }}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 text-amber-300 hover:text-white disabled:opacity-20 cursor-pointer transition"
                        title={lang === 'zh' ? '向上移动' : 'Move up'}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === wbOrder.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveWbItem('guide', 'down');
                        }}
                        className="p-1 rounded bg-white/5 hover:bg-white/15 text-amber-300 hover:text-white disabled:opacity-20 cursor-pointer transition"
                        title={lang === 'zh' ? '向下移动' : 'Move down'}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400/80 group-hover:translate-x-0.5 transition-transform flex-shrink-0 guide-arrow" />
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
};
