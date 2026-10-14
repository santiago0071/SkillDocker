import React from 'react';
import { WorkspaceState, SkillMeta } from '../../types/index.ts';
import { Language } from '../../i18n/index.ts';
import { ShieldCheck, Terminal, Cpu, Zap } from 'lucide-react';
import { SkillAssetPageView } from './SkillAssetPageView.tsx';
import type { ActiveView } from './types.ts';

interface DockCategoryRouterProps {
  activeView: ActiveView;
  getSkillsForCategory: (cat: 'all' | 'safety' | 'workflow' | 'architecture' | 'custom') => SkillMeta[];
  getEcosystemTabsForCategory: (cat: 'all' | 'safety' | 'workflow' | 'architecture' | 'custom') => Array<{ id: string; label: string; count: number }>;
  activeEcosystemFilter: 'all' | 'antigravity' | 'claude' | 'codex' | 'agents';
  setActiveEcosystemFilter: (filter: 'all' | 'antigravity' | 'claude' | 'codex' | 'agents') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  skillDisplayMode: 'cards' | 'compact';
  handleToggleSkillDisplayMode: (mode: 'cards' | 'compact') => void;
  setActiveView: (view: ActiveView) => void;
  setIsForgeOpen: (open: boolean) => void;
  onToggleSkill: (id: string) => void;
  setEditingSkill: (skill: SkillMeta | null) => void;
  setDoctorTargetSkillId: (id?: string) => void;
  setIsDoctorOpen: (open: boolean) => void;
  setShuttleSkill: (skill: SkillMeta | null) => void;
  lang: Language;
  workspace: WorkspaceState;
  recentlySavedSkillName: string | null;
  t: Record<string, string>;
}

export const DockCategoryRouter: React.FC<DockCategoryRouterProps> = ({
  activeView,
  getSkillsForCategory,
  getEcosystemTabsForCategory,
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
  if (activeView === 'safety') {
    return (
      <SkillAssetPageView
        viewKey="safety"
        title={lang === 'zh' ? '安全防御规则专区' : 'Safety & Security Hub'}
        icon={<ShieldCheck className="w-5 h-5" />}
        desc={
          lang === 'zh'
            ? '企业级多智能体安全护栏 · 涵盖操作防回滚、核心文件防误删、安全规则审计与凭证安全'
            : 'Enterprise guardrails: accidental loss prevention, audit rules, multi-agent guards.'
        }
        badgeText="100% 物理隔离守护"
        accentBorder="border-amber-500/20"
        accentBadge="bg-amber-500/15 text-amber-300 border-amber-500/30"
        accentTabActive="bg-amber-600 shadow-amber-600/30"
        accentTabBadge="bg-amber-700/80 text-white"
        accentIconBg="bg-amber-500/10 text-amber-400 border-amber-500/20"
        skills={getSkillsForCategory('safety')}
        ecoTabs={getEcosystemTabsForCategory('safety')}
        activeEcosystemFilter={activeEcosystemFilter}
        setActiveEcosystemFilter={setActiveEcosystemFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        skillDisplayMode={skillDisplayMode}
        handleToggleSkillDisplayMode={handleToggleSkillDisplayMode}
        setActiveView={setActiveView}
        setIsForgeOpen={setIsForgeOpen}
        onToggleSkill={onToggleSkill}
        setEditingSkill={setEditingSkill}
        setDoctorTargetSkillId={setDoctorTargetSkillId}
        setIsDoctorOpen={setIsDoctorOpen}
        setShuttleSkill={setShuttleSkill}
        lang={lang}
        workspace={workspace}
        recentlySavedSkillName={recentlySavedSkillName}
        t={t}
      />
    );
  }

  if (activeView === 'workflow') {
    return (
      <SkillAssetPageView
        viewKey="workflow"
        title={lang === 'zh' ? '自动化工作流专区' : 'Workflows & Automation Hub'}
        icon={<Terminal className="w-5 h-5" />}
        desc={
          lang === 'zh'
            ? '自动化流程编排、ETL 数据流水线、跨生态任务迁移与智能体执行规划'
            : 'Automated workflow pipelines, ETL orchestrations, migrations, and plan protocols.'
        }
        badgeText="流水线引擎就绪"
        accentBorder="border-blue-500/20"
        accentBadge="bg-blue-500/15 text-blue-300 border-blue-500/30"
        accentTabActive="bg-blue-600 shadow-blue-600/30"
        accentTabBadge="bg-blue-700/80 text-white"
        accentIconBg="bg-blue-500/10 text-blue-400 border-blue-500/20"
        skills={getSkillsForCategory('workflow')}
        ecoTabs={getEcosystemTabsForCategory('workflow')}
        activeEcosystemFilter={activeEcosystemFilter}
        setActiveEcosystemFilter={setActiveEcosystemFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        skillDisplayMode={skillDisplayMode}
        handleToggleSkillDisplayMode={handleToggleSkillDisplayMode}
        setActiveView={setActiveView}
        setIsForgeOpen={setIsForgeOpen}
        onToggleSkill={onToggleSkill}
        setEditingSkill={setEditingSkill}
        setDoctorTargetSkillId={setDoctorTargetSkillId}
        setIsDoctorOpen={setIsDoctorOpen}
        setShuttleSkill={setShuttleSkill}
        lang={lang}
        workspace={workspace}
        recentlySavedSkillName={recentlySavedSkillName}
        t={t}
      />
    );
  }

  if (activeView === 'architecture') {
    return (
      <SkillAssetPageView
        viewKey="architecture"
        title={lang === 'zh' ? '系统架构规范专区' : 'Architecture & SDKs Hub'}
        icon={<Cpu className="w-5 h-5" />}
        desc={
          lang === 'zh'
            ? '云平台治理 (Cloudflare, Firebase, GCP)、SDK 开发规范与数据库架构准则'
            : 'Cloud engineering standards (Cloudflare, Firebase, GCP), SDK best practices, and data architecture.'
        }
        badgeText="架构标准对齐"
        accentBorder="border-cyan-500/20"
        accentBadge="bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
        accentTabActive="bg-cyan-600 shadow-cyan-600/30"
        accentTabBadge="bg-cyan-700/80 text-white"
        accentIconBg="bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
        skills={getSkillsForCategory('architecture')}
        ecoTabs={getEcosystemTabsForCategory('architecture')}
        activeEcosystemFilter={activeEcosystemFilter}
        setActiveEcosystemFilter={setActiveEcosystemFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        skillDisplayMode={skillDisplayMode}
        handleToggleSkillDisplayMode={handleToggleSkillDisplayMode}
        setActiveView={setActiveView}
        setIsForgeOpen={setIsForgeOpen}
        onToggleSkill={onToggleSkill}
        setEditingSkill={setEditingSkill}
        setDoctorTargetSkillId={setDoctorTargetSkillId}
        setIsDoctorOpen={setIsDoctorOpen}
        setShuttleSkill={setShuttleSkill}
        lang={lang}
        workspace={workspace}
        recentlySavedSkillName={recentlySavedSkillName}
        t={t}
      />
    );
  }

  if (activeView === 'custom') {
    return (
      <SkillAssetPageView
        viewKey="custom"
        title={lang === 'zh' ? '自定义专有技能专区' : 'Custom & Specialized Skills'}
        icon={<Zap className="w-5 h-5" />}
        desc={
          lang === 'zh'
            ? '本地自建技能与个性化智能体能力扩展 · 支持 Studio 随时在线锻造'
            : 'Locally forged private skills and domain-specific agent specializations.'
        }
        badgeText="私有扩展就绪"
        accentBorder="border-purple-500/20"
        accentBadge="bg-purple-500/15 text-purple-300 border-purple-500/30"
        accentTabActive="bg-purple-600 shadow-purple-600/30"
        accentTabBadge="bg-purple-700/80 text-white"
        accentIconBg="bg-purple-500/10 text-purple-400 border-purple-500/20"
        skills={getSkillsForCategory('custom')}
        ecoTabs={getEcosystemTabsForCategory('custom')}
        activeEcosystemFilter={activeEcosystemFilter}
        setActiveEcosystemFilter={setActiveEcosystemFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        skillDisplayMode={skillDisplayMode}
        handleToggleSkillDisplayMode={handleToggleSkillDisplayMode}
        setActiveView={setActiveView}
        setIsForgeOpen={setIsForgeOpen}
        onToggleSkill={onToggleSkill}
        setEditingSkill={setEditingSkill}
        setDoctorTargetSkillId={setDoctorTargetSkillId}
        setIsDoctorOpen={setIsDoctorOpen}
        setShuttleSkill={setShuttleSkill}
        lang={lang}
        workspace={workspace}
        recentlySavedSkillName={recentlySavedSkillName}
        t={t}
      />
    );
  }

  return null;
};
