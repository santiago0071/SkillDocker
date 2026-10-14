import React from 'react';
import { SkillMeta, ConsolidatedRule } from '../../types/index.ts';
import { Language } from '../../i18n/index.ts';
import { BookmarkCheck, ChevronDown, RotateCcw, Trash2 } from 'lucide-react';

interface InjectorConsolidatedRulesProps {
  consolidatedRules: ConsolidatedRule[];
  skills: SkillMeta[];
  isRulesExpanded: boolean;
  setIsRulesExpanded: (expanded: boolean) => void;
  onRevertRuleToLive?: (rule: ConsolidatedRule) => void;
  onDeleteRule?: (rule: ConsolidatedRule) => void;
  onOpenSkillEditor?: (skill: SkillMeta) => void;
  lang: Language;
}

export const InjectorConsolidatedRules: React.FC<InjectorConsolidatedRulesProps> = ({
  consolidatedRules,
  skills,
  isRulesExpanded,
  setIsRulesExpanded,
  onRevertRuleToLive,
  onDeleteRule,
  onOpenSkillEditor,
  lang,
}) => {
  if (!consolidatedRules || consolidatedRules.length === 0) return null;

  return (
    <div className="bg-[#12141c]/90 rounded-2xl p-3 sm:p-3.5 border border-indigo-900/40 space-y-2.5 transition-all live-rules-container">
      <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium select-none">
        <button
          type="button"
          onClick={() => setIsRulesExpanded(!isRulesExpanded)}
          className="flex items-center space-x-2 text-left hover:text-white transition cursor-pointer group"
        >
          <BookmarkCheck className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span className="font-semibold text-indigo-300">
            {lang === 'zh'
              ? `📌 已存入技能的规则 (${consolidatedRules.length})`
              : `📌 Rules Saved to Skills (${consolidatedRules.length})`}
          </span>
          <span className="text-[10px] text-gray-500 hidden sm:inline">
            · {lang === 'zh' ? '已写入对应技能文件，点击技能名称可直接打开编辑' : 'Saved to skills, click skill to edit'}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-indigo-400 transition-transform duration-200 ${
              isRulesExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {isRulesExpanded && (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {consolidatedRules.map((rule) => {
            const matchedSkill = skills.find((s) => s.id === rule.skillId || s.name === rule.skillName);
            const eco = rule.ecosystem || matchedSkill?.ecosystem || 'antigravity';

            return (
              <div
                key={rule.id}
                className="flex items-start justify-between p-2.5 rounded-xl bg-gray-900/50 border border-gray-800/80 text-xs gap-3 group hover:border-indigo-500/40 transition live-rule-item"
              >
                <div className="flex items-start space-x-2 min-w-0 flex-1">
                  {/* Priority Badge */}
                  <span
                    className={`mt-0.5 text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0 whitespace-nowrap live-rule-priority ${
                      rule.priority === 'critical'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : rule.priority === 'high'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    }`}
                  >
                    {lang === 'zh'
                      ? (rule.priority === 'critical' ? '红线' : rule.priority === 'high' ? '优先' : '普通')
                      : rule.priority.toUpperCase()}
                  </span>

                  {/* Ecosystem / Skill Pill - Clickable to open editor */}
                  <button
                    type="button"
                    onClick={() => matchedSkill && onOpenSkillEditor?.(matchedSkill)}
                    className={`flex items-center space-x-1 bg-gray-800/80 px-1.5 py-0.5 rounded text-[10px] font-mono border border-gray-700/60 flex-shrink-0 transition live-rule-skill-btn ${
                      matchedSkill ? 'hover:border-indigo-400 hover:bg-indigo-950/40 hover:text-indigo-200 cursor-pointer' : 'cursor-default'
                    }`}
                    title={matchedSkill ? (lang === 'zh' ? `点击直接打开编辑 ${rule.skillName}` : `Open editor for ${rule.skillName}`) : undefined}
                  >
                    <span>{eco === 'claude' ? '🟠 Claude' : eco === 'codex' ? '🟢 Codex' : eco === 'agents' ? '🔵 Agents' : '🟣 Gemini'}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-200 font-semibold">{rule.skillName}</span>
                  </button>

                  {/* Content */}
                  <p className="text-gray-200 text-[11px] leading-relaxed break-words overflow-hidden min-w-0 flex-1 live-rule-content">
                    {rule.content}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  {/* 恢复为临时干预 */}
                  {onRevertRuleToLive && (
                    <button
                      onClick={() => onRevertRuleToLive(rule)}
                      className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[10px] font-medium flex items-center space-x-1 border border-amber-500/30 transition cursor-pointer live-rule-action-btn"
                      title={lang === 'zh' ? '从技能中移出，转为当前会话临时指令' : 'Revert back to in-flight directives'}
                    >
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      <span>{lang === 'zh' ? '转为临时' : 'Revert'}</span>
                    </button>
                  )}

                  {/* 彻底删除 */}
                  {onDeleteRule && (
                    <button
                      onClick={() => onDeleteRule(rule)}
                      className="p-1 text-gray-500 hover:text-red-400 transition rounded-lg hover:bg-gray-800 cursor-pointer live-rule-action-btn"
                      title={lang === 'zh' ? '从技能中彻底删除此规则' : 'Delete permanently'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
