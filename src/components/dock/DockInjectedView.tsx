import React from 'react';
import { WorkspaceState, SkillMeta, LiveDirective, ConsolidatedRule } from '../../types/index.ts';
import { AiConfig } from '../../core/aiClient.ts';
import { Language } from '../../i18n/index.ts';
import { Zap, ArrowLeft } from 'lucide-react';
import { LiveInjector } from '../LiveInjector.tsx';
import type { ActiveView } from './types.ts';

interface DockInjectedViewProps {
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
}

export const DockInjectedView: React.FC<DockInjectedViewProps> = ({
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
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div data-injected-banner="true" className="p-5 rounded-2xl bg-gradient-to-r from-[#121324] via-[#161226] to-[#0e1622] border border-amber-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl border flex-shrink-0 bg-amber-500/15 text-amber-300 border-amber-500/30">
            <Zap className="w-6 h-6 text-amber-400 fill-amber-400/20" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-base font-extrabold text-white tracking-tight">
                {lang === 'zh' ? '⚡ 已注入的技能与指令' : 'Injected Skills & Directives'}
              </h2>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/30">
                {lang === 'zh'
                  ? `${workspace.liveDirectives.length} 条临时指令 · ${workspace.consolidatedRules?.length || 0} 条规则已存入技能`
                  : `${workspace.liveDirectives.length} Live · ${workspace.consolidatedRules?.length || 0} Saved to Skills`}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              {lang === 'zh'
                ? '管理所有注入的指令以及它们归属的技能 · 可随时撤销指令，或直接点击技能卡片进入编辑'
                : 'Manage all injected directives and their associated skills with real-time controls.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveView('all-skills')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 border border-white/[0.08] text-xs font-medium transition cursor-pointer self-start md:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-gray-400" />
          <span>{lang === 'zh' ? '返回技能大厅' : 'Back to Matrix'}</span>
        </button>
      </div>

      {/* Full Hub LiveInjector */}
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
        compact={false}
        onOpenSkillEditor={(skillToOpen) => setEditingSkill(skillToOpen)}
      />
    </div>
  );
};
