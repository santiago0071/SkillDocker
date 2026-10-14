import React, { RefObject } from 'react';
import { LiveDirective, SkillMeta } from '../../types/index.ts';
import { Language, translations } from '../../i18n/index.ts';
import { Zap, Sparkles, Loader2, Target, Info, Globe } from 'lucide-react';
import { TargetScope } from './injectorTypes.ts';

interface InjectorFormProps {
  content: string;
  setContent: (val: string) => void;
  priority: LiveDirective['priority'];
  setPriority: (p: LiveDirective['priority']) => void;
  targetScope: TargetScope;
  activeTargetId: string;
  setSelectedSkillId: (id: string) => void;
  filteredSkills: SkillMeta[];
  skills: SkillMeta[];
  inputRef: RefObject<HTMLInputElement | null>;
  isExpanding: boolean;
  isRouting: boolean;
  routeReason: string;
  setRouteReason: (r: string) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleAiExpand: () => void;
  handleAiRoute: () => void;
  lang: Language;
}

export const InjectorForm: React.FC<InjectorFormProps> = ({
  content,
  setContent,
  priority,
  setPriority,
  targetScope,
  activeTargetId,
  setSelectedSkillId,
  filteredSkills,
  skills,
  inputRef,
  isExpanding,
  isRouting,
  routeReason,
  setRouteReason,
  handleSubmit,
  handleKeyDown,
  handleAiExpand,
  handleAiRoute,
  lang,
}) => {
  const t = translations[lang];

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card rounded-2xl p-3.5 space-y-2.5 focus-within:border-indigo-500/70 focus-within:ring-1 focus-within:ring-indigo-500/40 transition-all shadow-xl live-form"
    >
      {/* Row 1: Explicit Input Box with Visible Border Coil & Focus Glow */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="relative flex items-center space-x-2.5 bg-[#0a0c14] border-2 border-indigo-500/50 hover:border-indigo-500/80 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/30 rounded-xl px-3.5 py-2.5 transition-all shadow-inner group cursor-text live-input-box"
      >
        <div className="text-indigo-400 flex-shrink-0 group-focus-within:text-indigo-300">
          <Zap className="w-4 h-4 animate-pulse" />
        </div>

        <input
          ref={inputRef}
          id="live-directive-input"
          type="text"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (routeReason) setRouteReason('');
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            targetScope === 'universal'
              ? (lang === 'zh' ? '输入全生态通用指令（例如：禁止删除任何生产文件，或必须先做类型自检）' : 'Enter universal directive...')
              : targetScope === 'claude'
              ? (lang === 'zh' ? '输入针对 Claude Code 的指令...' : 'Enter directive for Claude Code...')
              : targetScope === 'codex'
              ? (lang === 'zh' ? '输入针对 OpenAI Codex 的指令...' : 'Enter directive for Codex...')
              : t.inputPlaceholder
          }
          className="w-full bg-transparent text-xs sm:text-sm text-gray-100 placeholder-gray-400 focus:outline-none font-medium select-text live-input-field"
        />

        {content && (
          <button
            type="button"
            onClick={() => setContent('')}
            className="text-gray-500 hover:text-gray-300 text-xs px-1.5 py-0.5 rounded hover:bg-gray-800 transition cursor-pointer"
            title="清空"
          >
            ✕
          </button>
        )}
      </div>

      {/* Row 2: Control Toolbar */}
      <div className="flex items-center justify-between pt-1.5 border-t border-gray-800/80 text-[11px] flex-wrap gap-2 live-toolbar-row">
        {/* Left: AI Expand & Route actions */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleAiExpand}
            disabled={!content.trim() || isExpanding}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 disabled:opacity-30 disabled:hover:bg-indigo-500/10 transition cursor-pointer live-ai-btn"
            title={t.aiExpandBtn}
          >
            {isExpanding ? (
              <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
            ) : (
              <Sparkles className="w-3 h-3 text-indigo-400" />
            )}
            <span className="text-[10px] font-medium">{t.aiExpandBtn}</span>
          </button>

          {/* AI Smart Route Button */}
          <button
            type="button"
            onClick={handleAiRoute}
            disabled={!content.trim() || isRouting || !skills || skills.length === 0}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 disabled:opacity-30 disabled:hover:bg-purple-500/10 transition cursor-pointer live-ai-btn"
            title={t.aiRouteBtn}
          >
            {isRouting ? (
              <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
            ) : (
              <Target className="w-3 h-3 text-purple-400" />
            )}
            <span className="text-[10px] font-medium">{t.aiRouteBtn}</span>
          </button>

          {routeReason && (
            <span className="text-[10px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-500/30 truncate max-w-[260px]" title={routeReason}>
              💡 {routeReason}
            </span>
          )}
        </div>

        {/* Right: Target Scope & Specific Skill Selector, Priority, Submit */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Target Skill Selector (or Universal Tag) */}
          {targetScope === 'universal' ? (
            <div
              className="flex items-center space-x-1.5 bg-purple-950/50 px-2.5 py-1 rounded-xl border border-purple-500/40 text-[10px] text-purple-200 live-universal-tag"
              title={lang === 'zh' ? '该指令将同时向当前所有 AI 共同生效' : 'Applies to all active AI agents simultaneously'}
            >
              <Globe className="w-3 h-3 text-purple-400 flex-shrink-0" />
              <span className="font-semibold whitespace-nowrap">{lang === 'zh' ? '🌐 应用于全部 AI' : '🌐 Universal (All Agents)'}</span>
            </div>
          ) : filteredSkills.length > 0 ? (
            <div
              className="flex items-center space-x-1.5 bg-gray-800/90 px-2 py-0.5 rounded-xl border border-gray-700 text-[10px] live-skill-select-container"
              title="选择具体要作用的技能"
            >
              <Target className="w-3 h-3 text-indigo-400 flex-shrink-0" />
              <select
                value={activeTargetId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
                className="bg-transparent text-[10px] text-indigo-200 focus:outline-none cursor-pointer max-w-[150px] truncate font-mono live-skill-select"
              >
                {filteredSkills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.ecosystem === 'claude'
                      ? `🟠 Claude · ${s.name}`
                      : s.ecosystem === 'codex'
                      ? `🟢 Codex · ${s.name}`
                      : s.ecosystem === 'agents'
                      ? `🔵 Agents · ${s.name}`
                      : `🟣 Gemini · ${s.name}`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className="text-[10px] text-gray-500 font-mono">该生态暂无技能</span>
          )}

          {/* Priority Selector */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="bg-gray-800 text-[10px] text-gray-300 rounded-xl px-2 py-1 border border-gray-700 focus:outline-none cursor-pointer font-medium live-priority-select"
          >
            <option value="normal">{lang === 'zh' ? '普通' : 'Normal'}</option>
            <option value="high">{lang === 'zh' ? '高优先级' : 'High Priority'}</option>
            <option value="critical">{lang === 'zh' ? '绝对红线 (最高优先级)' : 'Critical / Strict Ban'}</option>
          </select>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!content.trim()}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/50 hover:border-amber-400 text-amber-200 disabled:opacity-30 disabled:hover:from-amber-500/20 text-[11px] font-semibold rounded-xl transition-all active:scale-95 flex items-center space-x-1.5 shadow-md shadow-amber-950/20 whitespace-nowrap cursor-pointer live-submit-btn"
            title={`${t.injectTempSkillBtn} (Enter)`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30 flex-shrink-0" />
            <span>{t.injectTempSkillBtn}</span>
          </button>
        </div>
      </div>

      {/* Row 3: Sub-label explanation */}
      <div className="pt-1.5 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-400 select-none live-hint-row">
        <div className="flex items-center space-x-1.5">
          <Info className="w-3 h-3 text-amber-400/80 flex-shrink-0" />
          <span className="leading-tight">
            {targetScope === 'universal'
              ? (lang === 'zh'
                  ? '全生态通用指令：即时对当前全部 AI 生效，随时可一键撤销或永久保存到技能中。'
                  : 'Universal directive: Broadcasts live across active agents, can be revoked or saved to skills anytime.')
              : (lang === 'zh'
                  ? `针对 ${targetScope.toUpperCase()} 生态：仅对选中的 AI 即时生效，不影响其他 AI。`
                  : `Targeting ${targetScope.toUpperCase()}: Session-only, isolated from other ecosystems.`)}
          </span>
        </div>
        <span className="font-mono text-gray-500 hidden sm:inline">Ctrl + Enter</span>
      </div>
    </form>
  );
};
