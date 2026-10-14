import React from 'react';
import { LiveDirective, SkillMeta } from '../../types/index.ts';
import { Language, translations } from '../../i18n/index.ts';
import { ChevronDown, Trash2, AlertTriangle, BookmarkPlus } from 'lucide-react';

interface InjectorActiveQueueProps {
  directives: LiveDirective[];
  skills: SkillMeta[];
  isQueueExpanded: boolean;
  setIsQueueExpanded: (expanded: boolean) => void;
  showClearConfirm: boolean;
  setShowClearConfirm: (show: boolean | ((prev: boolean) => boolean)) => void;
  onClearAll: () => void;
  onRemoveDirective: (id: string, content?: string) => void;
  onOpenSkillEditor?: (skill: SkillMeta) => void;
  setPendingCommit: (commit: {
    content: string;
    priority: LiveDirective['priority'];
    originalDirective?: LiveDirective;
  } | null) => void;
  lang: Language;
}

export const InjectorActiveQueue: React.FC<InjectorActiveQueueProps> = ({
  directives,
  skills,
  isQueueExpanded,
  setIsQueueExpanded,
  showClearConfirm,
  setShowClearConfirm,
  onClearAll,
  onRemoveDirective,
  onOpenSkillEditor,
  setPendingCommit,
  lang,
}) => {
  const t = translations[lang];

  if (directives.length === 0) return null;

  return (
    <div className="bg-[#12141c]/90 rounded-2xl p-3 sm:p-3.5 border border-gray-800 space-y-2.5 transition-all live-directives-container">
      <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium select-none">
        {/* Clickable Header for Collapsing */}
        <button
          type="button"
          onClick={() => setIsQueueExpanded(!isQueueExpanded)}
          className="flex items-center space-x-2 text-left hover:text-white transition cursor-pointer group"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
          <span className="font-semibold text-emerald-400">
            {t.activeDirectives} ({directives.length})
          </span>
          <span className="text-[10px] text-gray-500 hidden sm:inline">
            · {lang === 'zh' ? '仅在当前会话生效，可撤销或存入技能' : 'Active in current session'}
          </span>
          <span className="text-[10px] text-indigo-400/80 ml-1">
            {isQueueExpanded ? (lang === 'zh' ? '收起' : 'Collapse') : (lang === 'zh' ? '展开查看' : 'Expand')}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-indigo-400 transition-transform duration-200 ${
              isQueueExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        <button
          type="button"
          onClick={() => {
            if (directives.length > 0) {
              setShowClearConfirm((prev) => !prev);
            }
          }}
          disabled={directives.length === 0}
          className={`flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-lg transition ${
            directives.length === 0
              ? 'text-gray-600 opacity-40 cursor-not-allowed'
              : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer'
          }`}
          title={t.clearAllDirectives}
        >
          <Trash2 className="w-3 h-3" />
          <span>{t.clearAllDirectives}</span>
        </button>
      </div>

      {/* Secondary Confirmation Card */}
      {showClearConfirm && directives.length > 0 && (
        <div className="p-3 my-2 rounded-xl bg-red-950/40 border border-red-500/30 text-xs animate-in fade-in slide-in-from-top-1 shadow-lg">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center space-x-1.5 text-red-300 font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>
                {lang === 'zh'
                  ? `⚠️ 确定清空当前全部 ${directives.length} 条临时指令？`
                  : `⚠️ Clear all ${directives.length} temporary directives?`}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mb-2.5 leading-relaxed">
            {t.clearConfirmDesc}
          </p>
          <div className="flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] transition cursor-pointer"
            >
              {t.cancelBtn}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowClearConfirm(false);
                onClearAll();
              }}
              className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-[11px] transition flex items-center space-x-1 shadow-sm cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>{t.confirmClearBtn}</span>
            </button>
          </div>
        </div>
      )}

      {/* Collapsible List of Active Directives */}
      {isQueueExpanded && (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {directives.map((dir) => {
            const isUniversal = dir.targetEcosystem === 'universal' || dir.targetSkillId === 'universal';
            const matchedSkill = skills.find((s) => s.id === dir.targetSkillId);
            const eco = dir.targetEcosystem || matchedSkill?.ecosystem || 'antigravity';

            return (
              <div
                key={dir.id}
                className="flex items-start justify-between p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 text-xs gap-3 group hover:border-gray-700 transition live-directive-item"
              >
                {/* Text Content Area: Defensive Word Breaking & Target Badge */}
                <div className="flex items-start space-x-2 min-w-0 flex-1">
                  {/* Priority Badge */}
                  <span
                    className={`mt-0.5 text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0 whitespace-nowrap live-directive-priority ${
                      dir.priority === 'critical'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : dir.priority === 'high'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {lang === 'zh'
                      ? (dir.priority === 'critical' ? '红线' : dir.priority === 'high' ? '优先' : '普通')
                      : dir.priority.toUpperCase()}
                  </span>

                  {/* Ecosystem Target Badge */}
                  {isUniversal ? (
                    <span className="mt-0.5 text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border bg-purple-500/20 text-purple-300 border-purple-500/40 whitespace-nowrap flex-shrink-0 live-directive-skill-btn">
                      {lang === 'zh' ? '🌐 全生态通用' : '🌐 Universal'}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => matchedSkill && onOpenSkillEditor?.(matchedSkill)}
                      className={`mt-0.5 text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap flex-shrink-0 transition live-directive-skill-btn ${
                        matchedSkill ? 'hover:underline cursor-pointer' : 'cursor-default'
                      } ${
                        eco === 'claude'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : eco === 'codex'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : eco === 'agents'
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                      }`}
                      title={matchedSkill ? (lang === 'zh' ? `点击直接打开编辑 ${matchedSkill.name}` : `Open editor for ${matchedSkill.name}`) : undefined}
                    >
                      {eco === 'claude'
                        ? `🟠 Claude · ${dir.targetSkillName || matchedSkill?.name || 'Skill'}`
                        : eco === 'codex'
                        ? `🟢 Codex · ${dir.targetSkillName || matchedSkill?.name || 'Skill'}`
                        : eco === 'agents'
                        ? `🔵 Agents · ${dir.targetSkillName || matchedSkill?.name || 'Skill'}`
                        : `🟣 Gemini · ${dir.targetSkillName || matchedSkill?.name || 'Skill'}`}
                    </button>
                  )}

                  <p className="text-gray-200 text-[11px] leading-relaxed break-words overflow-hidden min-w-0 flex-1 live-directive-content">
                    {dir.content}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  {/* 正式存入skill 按钮 */}
                  <button
                    onClick={() =>
                      setPendingCommit({
                        content: dir.content,
                        priority: dir.priority,
                        originalDirective: dir,
                      })
                    }
                    className="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 text-[10px] font-medium flex items-center space-x-1 border border-indigo-500/40 transition cursor-pointer live-directive-action-btn"
                    title={t.commitToSkillTooltip}
                  >
                    <BookmarkPlus className="w-3 h-3 text-indigo-300" />
                    <span>{t.commitToSkillBtn}</span>
                  </button>

                  <button
                    onClick={() => onRemoveDirective(dir.id, dir.content)}
                    className="p-1 text-gray-500 hover:text-red-400 transition rounded-lg hover:bg-gray-800 cursor-pointer live-directive-action-btn"
                    title={t.rollbackTooltip}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
