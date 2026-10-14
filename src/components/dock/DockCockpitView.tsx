import React from 'react';
import { WorkspaceState, SkillMeta, LiveDirective, ConsolidatedRule } from '../../types/index.ts';
import { AiConfig } from '../../core/aiClient.ts';
import { Language } from '../../i18n/index.ts';
import {
  Layers,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  Flame,
  CheckCircle2,
  X,
  Search,
} from 'lucide-react';
import { LiveInjector } from '../LiveInjector.tsx';
import { SkillPill } from '../SkillPill.tsx';
import type { ActiveView } from './types.ts';

interface DockCockpitViewProps {
  workspace: WorkspaceState;
  onInjectDirective: (directive: Omit<LiveDirective, 'id' | 'timestamp'>, targetSkillId?: string) => void;
  onRemoveDirective: (id: string, content?: string) => void;
  onClearAllDirectives: () => void;
  onAssimilateDirective: (directive: LiveDirective, targetSkillId?: string) => void;
  onRevertRuleToLive?: (rule: ConsolidatedRule) => void;
  onDeleteRule?: (rule: ConsolidatedRule) => void;
  aiConfig: AiConfig;
  lang: Language;
  setActiveView: (view: ActiveView) => void;
  setEditingSkill: (skill: SkillMeta | null) => void;
  allSkills: SkillMeta[];
  ecosystemTabs: Array<{ id: string; label: string; count: number }>;
  activeEcosystemFilter: string;
  setActiveEcosystemFilter: (filter: any) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  skillDisplayMode: 'cards' | 'compact';
  handleToggleSkillDisplayMode: (mode: 'cards' | 'compact') => void;
  isSkillsMatrixExpanded: boolean;
  setIsSkillsMatrixExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  setIsForgeOpen: (open: boolean) => void;
  recentlySavedSkillName: string | null;
  setRecentlySavedSkillName: (name: string | null) => void;
  onToggleSkill: (id: string) => void;
  setDoctorTargetSkillId: (id?: string) => void;
  setIsDoctorOpen: (open: boolean) => void;
  setShuttleSkill: (skill: SkillMeta | null) => void;
  t: Record<string, string>;
}

export const DockCockpitView: React.FC<DockCockpitViewProps> = ({
  workspace,
  onInjectDirective,
  onRemoveDirective,
  onClearAllDirectives,
  onAssimilateDirective,
  onRevertRuleToLive,
  onDeleteRule,
  aiConfig,
  lang,
  setActiveView,
  setEditingSkill,
  allSkills,
  ecosystemTabs,
  activeEcosystemFilter,
  setActiveEcosystemFilter,
  searchQuery,
  setSearchQuery,
  skillDisplayMode,
  handleToggleSkillDisplayMode,
  isSkillsMatrixExpanded,
  setIsSkillsMatrixExpanded,
  setIsForgeOpen,
  recentlySavedSkillName,
  setRecentlySavedSkillName,
  onToggleSkill,
  setDoctorTargetSkillId,
  setIsDoctorOpen,
  setShuttleSkill,
  t,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Section 1: 临时干预 Skills 快速控制条 (Top, Compact Mode) */}
      <div id="live-steering-cockpit">
        <LiveInjector
          onInject={onInjectDirective}
          directives={workspace.liveDirectives}
          onRemoveDirective={onRemoveDirective}
          onClearAll={onClearAllDirectives}
          onAssimilateDirective={onAssimilateDirective}
          consolidatedRules={workspace.consolidatedRules || []}
          onRevertRuleToLive={onRevertRuleToLive}
          onDeleteRule={onDeleteRule}
          aiConfig={aiConfig}
          lang={lang}
          skills={workspace.activeSkills}
          compact={true}
          onNavigateToHub={() => setActiveView('injected')}
          onOpenSkillEditor={(skillToOpen) => setEditingSkill(skillToOpen)}
        />
      </div>

      {/* Section 2: 全生态技能资产总览矩阵 (Bottom, directly following Cockpit) */}
      <div className="space-y-4 pt-2">
        {/* Matrix Header Banner */}
        <div data-matrix-banner="true" className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0e111d] via-[#121324] to-[#161224] border border-indigo-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl border flex-shrink-0 bg-indigo-500/15 text-indigo-300 border-indigo-500/30">
                <Layers className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2.5 flex-wrap">
                  <h2 className="text-base font-extrabold text-white tracking-tight">
                    {lang === 'zh' ? '全生态技能资产矩阵' : 'All Skill Assets Matrix'}
                  </h2>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                    {lang === 'zh'
                      ? `${allSkills.length} 项技能已挂载`
                      : `${allSkills.length} Skills Mounted`}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  {lang === 'zh'
                    ? '多智能体本地技能总览 · 支持全生态筛选、实时搜索过滤、双击编辑与 Skills Doctor 诊断'
                    : 'Comprehensive skill repository across all ecosystems with real-time sync.'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action, View Mode & Collapse Toggle */}
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            {/* View Mode Toggle (Cards vs Compact) */}
            <div className="flex items-center p-0.5 rounded-xl bg-gray-900/80 border border-white/[0.08] flex-shrink-0">
              <button
                type="button"
                onClick={() => handleToggleSkillDisplayMode('cards')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  skillDisplayMode === 'cards'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                title={lang === 'zh' ? '舒适卡片视图' : 'Card View'}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleToggleSkillDisplayMode('compact')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  skillDisplayMode === 'compact'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                title={lang === 'zh' ? '紧凑列表视图' : 'Compact List View'}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsSkillsMatrixExpanded((prev) => !prev)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gray-900/90 hover:bg-gray-800 text-gray-300 border border-white/[0.08] text-xs font-medium transition cursor-pointer"
              title={
                isSkillsMatrixExpanded
                  ? (lang === 'zh' ? '收起技能列表，纯享清爽干预驾驶舱' : 'Collapse Skills Matrix')
                  : (lang === 'zh' ? '展开技能资产列表' : 'Expand Skills Matrix')
              }
            >
              {isSkillsMatrixExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{lang === 'zh' ? '收起技能列表' : 'Collapse Matrix'}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{lang === 'zh' ? '展开技能列表' : 'Expand Matrix'}</span>
                </>
              )}
            </button>

            <div className="hidden sm:flex px-3 py-1.5 rounded-xl bg-gray-900/80 border border-white/[0.08] text-xs text-gray-300 items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{lang === 'zh' ? '全库已就绪' : 'All Ready'}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsForgeOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '+ 锻造新技能' : '+ Forge New Skill'}</span>
            </button>
          </div>
        </div>

        {/* Skills Matrix Content */}
        {isSkillsMatrixExpanded && (
          <>
            {/* Recently Saved Skill Top Banner */}
            {recentlySavedSkillName && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-[#0e2219] to-[#0a1813] border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between shadow-xl shadow-emerald-950/40 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-white">
                      {lang === 'zh' ? '🎉 新技能已成功写入本地全局库：' : '🎉 New skill saved to global library: '}
                    </span>
                    <span className="font-mono text-emerald-300 font-bold mx-1">
                      [{recentlySavedSkillName}]
                    </span>
                    <span className="text-emerald-400/80 hidden sm:inline">
                      {lang === 'zh' ? '已在下方技能矩阵中高亮呈现，可随时点击卡片查看与诊断。' : 'Highlighted in matrix below.'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRecentlySavedSkillName(null)}
                  className="p-1 rounded-lg text-emerald-400/60 hover:text-emerald-200 hover:bg-emerald-900/40 transition ml-2 cursor-pointer flex-shrink-0"
                  title={lang === 'zh' ? '关闭提示' : 'Dismiss'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Multi-Ecosystem Filter Tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none pt-1">
              {ecosystemTabs.map((tab) => {
                const isActive = activeEcosystemFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveEcosystemFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 shadow-indigo-600/30 text-white shadow-md'
                        : 'bg-gray-900/60 hover:bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        isActive ? 'bg-indigo-700/80 text-white' : 'bg-gray-800 text-gray-500'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Feedback Bar */}
            {searchQuery && (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-300">
                <div className="flex items-center space-x-2">
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                  <span>
                    {lang === 'zh'
                      ? `搜索词: "${searchQuery}" · 共 ${allSkills.length} 项匹配`
                      : `Query: "${searchQuery}" · ${allSkills.length} matches`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                >
                  {lang === 'zh' ? '清除搜索' : 'Clear'}
                </button>
              </div>
            )}

            {/* Responsive Grid or Compact Rows */}
            <div className={skillDisplayMode === 'cards' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-6' : 'flex flex-col space-y-1.5 pb-6'}>
              {allSkills.length > 0 ? (
                allSkills.map((skill) => {
                  const skillDirectives = workspace.liveDirectives.filter((d) => d.targetSkillId === skill.id || d.targetSkillName === skill.name).length;
                  const skillRules = (workspace.consolidatedRules || []).filter((r) => r.skillId === skill.id || r.skillName === skill.name).length;
                  return (
                    <SkillPill
                      key={skill.id}
                      skill={skill}
                      variant={skillDisplayMode}
                      onToggle={onToggleSkill}
                      onInspect={(s) => setEditingSkill(s)}
                      onDiagnose={(s) => {
                        setDoctorTargetSkillId(s.id);
                        setIsDoctorOpen(true);
                      }}
                      onShuttle={(s) => setShuttleSkill(s)}
                      lang={lang}
                      injectedCount={skillDirectives + skillRules}
                      isHighlighted={recentlySavedSkillName === skill.name || recentlySavedSkillName === skill.id}
                    />
                  );
                })
              ) : (
                <div data-retro-empty="true" className="col-span-full text-center py-16 px-4 text-gray-400 text-xs bg-gray-900/25 rounded-2xl border border-gray-800/80 space-y-3">
                  <div className="text-3xl mb-1">🔍</div>
                  <p className="text-gray-300 font-semibold text-sm">{t.emptySkills}</p>
                  <p className="text-gray-500 text-xs">
                    {lang === 'zh'
                      ? `在当前选中的 [${activeEcosystemFilter === 'all' ? '全部生态' : activeEcosystemFilter.toUpperCase()}] 中暂无技能`
                      : `No skills in [${activeEcosystemFilter === 'all' ? 'All Ecosystems' : activeEcosystemFilter.toUpperCase()}]`}
                  </p>
                  <div className="flex items-center justify-center space-x-2 pt-2">
                    {activeEcosystemFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setActiveEcosystemFilter('all')}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-medium transition cursor-pointer"
                      >
                        {lang === 'zh' ? '查看全部生态技能' : 'View All Ecosystems'}
                      </button>
                    )}
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="px-3.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition cursor-pointer"
                      >
                        {lang === 'zh' ? '清除搜索词' : 'Clear Search'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
