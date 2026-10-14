import React from 'react';
import { WorkspaceState, SkillMeta } from '../../types/index.ts';
import { Language } from '../../i18n/index.ts';
import { SkillPill } from '../SkillPill';
import {
  ArrowLeft,
  LayoutGrid,
  List,
  Flame,
  Search,
} from 'lucide-react';
import type { ActiveView } from './types.ts';

interface SkillAssetPageViewProps {
  viewKey: 'all-skills' | 'safety' | 'workflow' | 'architecture' | 'custom';
  title: string;
  icon: React.ReactNode;
  desc: string;
  badgeText: string;
  accentBorder: string;
  accentBadge: string;
  accentTabActive: string;
  accentTabBadge: string;
  accentIconBg: string;
  skills: SkillMeta[];
  ecoTabs: Array<{ id: string; label: string; count: number }>;
  activeEcosystemFilter: 'all' | 'antigravity' | 'claude' | 'codex' | 'agents';
  setActiveEcosystemFilter: (eco: any) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  skillDisplayMode: 'cards' | 'compact';
  handleToggleSkillDisplayMode: (mode: 'cards' | 'compact') => void;
  setActiveView: (view: ActiveView) => void;
  setIsForgeOpen: (open: boolean) => void;
  onToggleSkill: (id: string) => void;
  setEditingSkill: (s: SkillMeta) => void;
  setDoctorTargetSkillId: (id?: string) => void;
  setIsDoctorOpen: (open: boolean) => void;
  setShuttleSkill: (s: SkillMeta) => void;
  lang: Language;
  workspace: WorkspaceState;
  recentlySavedSkillName: string | null;
  t: Record<string, string>;
}

export const SkillAssetPageView: React.FC<SkillAssetPageViewProps> = ({
  viewKey,
  title,
  icon,
  desc,
  badgeText,
  accentBorder,
  accentBadge,
  accentTabActive,
  accentTabBadge,
  accentIconBg,
  skills,
  ecoTabs,
  activeEcosystemFilter,
  setActiveEcosystemFilter,
  searchQuery,
  setSearchQuery,
  skillDisplayMode,
  handleToggleSkillDisplayMode,
  setActiveView,
  setIsForgeOpen,
  onToggleSkill,
  setEditingSkill,
  setDoctorTargetSkillId,
  setIsDoctorOpen,
  setShuttleSkill,
  lang,
  workspace,
  recentlySavedSkillName,
  t,
}) => {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Page Header & Purpose Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0e111d] via-[#121324] to-[#161224] border ${accentBorder} shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border flex-shrink-0 ${accentIconBg}`}>
              {icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  {title}
                </h2>
                <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border ${accentBadge}`}>
                  {lang === 'zh' ? `${skills.length} 项资产` : `${skills.length} Assets`}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                {desc}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Badges / Quick Action / Return Home */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveView('all-skills')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gray-900/90 hover:bg-gray-800 text-gray-200 border border-white/[0.1] text-xs font-semibold shadow transition cursor-pointer"
            title={lang === 'zh' ? '返回主控制大厅 (全部技能与干预控制舱)' : 'Return to Main Hall'}
          >
            <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
            <span>{lang === 'zh' ? '返回主控制大厅' : 'Back to Hub'}</span>
          </button>

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

          {badgeText && (
            <div className="hidden sm:flex px-3 py-1.5 rounded-xl bg-gray-900/80 border border-white/[0.08] text-xs text-gray-300 items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{badgeText}</span>
            </div>
          )}
          {viewKey === 'custom' && (
            <button
              type="button"
              onClick={() => setIsForgeOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '+ 锻造新技能' : '+ Forge New Skill'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Multi-Ecosystem Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none pt-1">
        {ecoTabs.map((tab) => {
          const isActive = activeEcosystemFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveEcosystemFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                isActive
                  ? `${accentTabActive} text-white shadow-md`
                  : 'bg-gray-900/60 hover:bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isActive ? accentTabBadge : 'bg-gray-800 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Search Feedback Bar */}
      {searchQuery && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-300">
          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <span>
              {lang === 'zh'
                ? `搜索词: "${searchQuery}" · 共 ${skills.length} 项匹配`
                : `Query: "${searchQuery}" · ${skills.length} matches`}
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

      {/* 4. Responsive Grid or Compact Rows */}
      <div className={skillDisplayMode === 'cards' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-6' : 'flex flex-col space-y-1.5 pb-6'}>
        {skills.length > 0 ? (
          skills.map((skill) => {
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
              在当前选中的 [{activeEcosystemFilter === 'all' ? '全部生态' : activeEcosystemFilter.toUpperCase()}] 中暂无该分类技能
            </p>
            <div className="flex items-center justify-center space-x-2 pt-2">
              {activeEcosystemFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setActiveEcosystemFilter('all')}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-medium transition cursor-pointer"
                >
                  查看全部生态的该类技能
                </button>
              )}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition cursor-pointer"
                >
                  清除搜索词
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
