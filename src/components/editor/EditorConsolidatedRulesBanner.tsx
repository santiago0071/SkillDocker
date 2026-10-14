import React from 'react';
import { ChevronDown, Info, RotateCcw } from 'lucide-react';
import { LiveDirective } from '../../types/index.ts';
import { Language, translations } from '../../i18n/index.ts';

interface EditorConsolidatedRulesBannerProps {
  activeDirectivesForSkill: LiveDirective[];
  consolidatedRules: Array<{ text: string; priority: string }>;
  isConsolidatedRulesExpanded: boolean;
  onToggleExpand: () => void;
  onRevokeRule: (ruleText: string) => void;
  lang: Language;
  t: (typeof translations)[Language];
}

export const EditorConsolidatedRulesBanner: React.FC<EditorConsolidatedRulesBannerProps> = ({
  activeDirectivesForSkill,
  consolidatedRules,
  isConsolidatedRulesExpanded,
  onToggleExpand,
  onRevokeRule,
  lang,
  t,
}) => {
  return (
    <>
      {/* Active In-flight Directives targeting this skill */}
      {activeDirectivesForSkill.length > 0 && (
        <div className="mx-5 my-1.5 px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
            <span className="font-semibold text-emerald-400">
              {lang === 'zh'
                ? `⚡ 当前会话有 ${activeDirectivesForSkill.length} 条临时指令正作用于本技能`
                : `⚡ ${activeDirectivesForSkill.length} live directives active for this skill`}
            </span>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">
            {lang === 'zh' ? '仅当前会话临时生效 · 可在侧边栏存入技能' : 'Session-only'}
          </span>
        </div>
      )}

      {/* Consolidated Rules Banner / Management Panel - Collapsible & Default to Collapsed */}
      {consolidatedRules.length > 0 && (
        <div className="mx-5 my-1.5 rounded-xl bg-indigo-950/30 border border-indigo-500/25 overflow-hidden flex-shrink-0 transition-all">
          {/* Header / Toggle Button */}
          <button
            type="button"
            onClick={onToggleExpand}
            className="w-full px-3.5 py-1.5 flex items-center justify-between text-xs text-indigo-300 hover:bg-indigo-900/20 transition cursor-pointer select-none"
          >
            <div className="flex items-center space-x-2">
              <span className="flex items-center space-x-1.5 font-semibold">
                <span>📌 {t.consolidatedRulesTitle}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-900/80 border border-indigo-700/60 text-indigo-200">
                  {consolidatedRules.length}
                </span>
              </span>
              <span className="text-[10px] text-gray-500 hidden sm:inline">
                · {lang === 'zh' ? '支持单条一键撤回' : '1-click revoke supported'}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-gray-400">
              <span className="text-[10px] text-indigo-400/80">
                {isConsolidatedRulesExpanded
                  ? lang === 'zh'
                    ? '收起'
                    : 'Collapse'
                  : lang === 'zh'
                  ? '展开查看/撤回'
                  : 'Expand to view/revoke'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-indigo-400 transition-transform duration-200 ${
                  isConsolidatedRulesExpanded ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {/* Expandable Body */}
          {isConsolidatedRulesExpanded && (
            <div className="px-3.5 pb-2.5 pt-1.5 border-t border-indigo-900/40 space-y-2 max-h-56 overflow-y-auto pr-1 animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Contextual notice explaining these rules were injected via SkillDocker */}
              <div className="p-2.5 rounded-lg bg-indigo-950/70 border border-indigo-500/30 text-[11px] text-indigo-200/90 leading-relaxed flex items-start space-x-2">
                <Info className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                <span className="flex-1">{t.consolidatedRulesNotice}</span>
              </div>

              <div className="space-y-1.5">
                {consolidatedRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between p-2 rounded-lg bg-[#111320] border border-indigo-500/20 text-xs gap-3 group hover:border-indigo-500/40 transition"
                  >
                    <div className="flex items-start space-x-2 min-w-0 flex-1">
                      <span className="mt-0.5 text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex-shrink-0">
                        {rule.priority}
                      </span>
                      <p className="text-gray-200 text-xs leading-relaxed break-words flex-1">
                        {rule.text}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRevokeRule(rule.text)}
                      className="flex items-center space-x-1 px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-medium transition flex-shrink-0 cursor-pointer"
                      title={lang === 'zh' ? '从本技能中删除该规则' : 'Revoke rule from this skill'}
                    >
                      <RotateCcw className="w-3 h-3 text-red-400" />
                      <span>{t.revokeRuleBtn}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
