import React from 'react';
import { SkillMeta } from '../types/index.ts';
import { Language, translations } from '../i18n/index.ts';
import { ShieldCheck, Cpu, Sparkles, Terminal, ArrowRight, Stethoscope, Rocket, Lock, AlertCircle } from 'lucide-react';
import {
  formatReadByTool,
  getReadByBadgeStyle,
  isLegacySkill,
  isReadOnlySkill,
  getReadOnlyNotice,
  getLegacyNotice,
} from '../core/skillBadges.ts';

interface SkillPillProps {
  skill: SkillMeta;
  onToggle: (id: string) => void;
  onInspect: (skill: SkillMeta) => void;
  onDiagnose?: (skill: SkillMeta) => void;
  onShuttle?: (skill: SkillMeta) => void;
  lang?: Language;
  injectedCount?: number;
  isHighlighted?: boolean;
  variant?: 'cards' | 'compact';
}

export const SkillPill: React.FC<SkillPillProps> = ({
  skill,
  onToggle,
  onInspect,
  onDiagnose,
  onShuttle,
  lang = 'zh',
  injectedCount = 0,
  isHighlighted = false,
  variant = 'cards',
}) => {
  const t = translations[lang];

  const getCategoryConfig = (category?: string) => {
    switch (category) {
      case 'safety':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
          badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          label: lang === 'zh' ? '安全防御' : 'Safety',
        };
      case 'workflow':
        return {
          icon: <Terminal className="w-4 h-4 text-blue-400" />,
          badgeClass: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
          label: lang === 'zh' ? '自动化流' : 'Workflow',
        };
      case 'marketing':
        return {
          icon: <Sparkles className="w-4 h-4 text-purple-400" />,
          badgeClass: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
          label: lang === 'zh' ? '营销传播' : 'Marketing',
        };
      case 'architecture':
        return {
          icon: <Cpu className="w-4 h-4 text-cyan-400" />,
          badgeClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
          label: lang === 'zh' ? '架构规范' : 'Architecture',
        };
      default:
        return {
          icon: <Cpu className="w-4 h-4 text-emerald-400" />,
          badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          label: lang === 'zh' ? '自定义技能' : 'Custom',
        };
    }
  };

  const cat = getCategoryConfig(skill.category);

  const getEcosystemGlow = (eco?: string) => {
    switch (eco) {
      case 'claude':
        return 'glow-claude';
      case 'codex':
        return 'glow-codex';
      case 'agents':
        return 'glow-agents';
      case 'antigravity':
      default:
        return 'glow-gemini';
    }
  };

  if (variant === 'compact') {
    return (
      <div
        data-skill-compact="true"
        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl border transition-all duration-150 glass-card ${getEcosystemGlow(skill.ecosystem)} ${
          isHighlighted
            ? 'bg-[#0e1f18]/95 border-emerald-400 ring-2 ring-emerald-400/60 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
            : skill.enabled
            ? 'bg-[#111422]/90 border-white/[0.08] hover:border-white/[0.18]'
            : 'bg-[#0e1019]/60 border-white/[0.04] opacity-60 hover:opacity-90'
        }`}
      >
        {/* Left: Toggle + Icon + Name + Badges + Snippet */}
        <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-3">
          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => onToggle(skill.id)}
            className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 flex items-center flex-shrink-0 cursor-pointer ${
              skill.enabled ? 'bg-indigo-600' : 'bg-gray-800'
            }`}
            title={skill.enabled ? (lang === 'zh' ? '点击禁用治理' : 'Disable') : (lang === 'zh' ? '点击激活治理' : 'Enable')}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 shadow-sm ${
                skill.enabled ? 'translate-x-3' : 'translate-x-0'
              }`}
            />
          </button>

          {/* Icon */}
          <div className="p-1 rounded-lg bg-gray-900/80 border border-gray-800 text-gray-300 flex-shrink-0">
            {cat.icon}
          </div>

          {/* Name & Saved Tag */}
          <div className="flex items-center space-x-2 min-w-0">
            <span
              onClick={() => onInspect(skill)}
              className="font-semibold text-xs text-gray-100 truncate cursor-pointer hover:text-indigo-300 transition"
              title={skill.name}
            >
              {skill.name}
            </span>
            {isHighlighted && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 flex-shrink-0">
                ✨ {lang === 'zh' ? '已存' : 'Saved'}
              </span>
            )}
          </div>

          {/* Ecosystem Badge */}
          {skill.ecosystem && (
            <span
              className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold whitespace-nowrap flex-shrink-0 hidden sm:inline-block ${
                skill.ecosystem === 'claude'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : skill.ecosystem === 'codex'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : skill.ecosystem === 'agents'
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
              }`}
            >
              {skill.ecosystem === 'claude'
                ? 'Claude'
                : skill.ecosystem === 'codex'
                ? 'Codex'
                : skill.ecosystem === 'agents'
                ? 'Agents'
                : 'Gemini'}
            </span>
          )}

          {/* Category Badge */}
          <span
            className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-medium whitespace-nowrap flex-shrink-0 hidden md:inline-block ${cat.badgeClass}`}
          >
            {cat.label}
          </span>

          {/* ReadBy Badges */}
          {skill.readBy && skill.readBy.length > 0 && (
            <div className="hidden sm:flex items-center space-x-1 flex-shrink-0">
              {skill.readBy.map((tool) => (
                <span
                  key={tool}
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold whitespace-nowrap ${getReadByBadgeStyle(tool)}`}
                  title={`Read by: ${formatReadByTool(tool)}`}
                >
                  {formatReadByTool(tool)}
                </span>
              ))}
            </div>
          )}

          {/* ReadOnly Lock */}
          {isReadOnlySkill(skill) && (
            <span
              className="flex items-center space-x-1 text-[9px] font-mono px-1.5 py-0.2 rounded border font-medium bg-red-500/15 text-red-300 border-red-500/30 flex-shrink-0 cursor-help"
              title={getReadOnlyNotice(skill, lang)}
            >
              <Lock className="w-2.5 h-2.5 text-red-400" />
              <span>{lang === 'zh' ? '只读' : 'Read-only'}</span>
            </span>
          )}

          {/* Legacy Badge */}
          {isLegacySkill(skill) && (
            <span
              className="flex items-center space-x-1 text-[9px] font-mono px-1.5 py-0.2 rounded border font-medium bg-amber-500/15 text-amber-300 border-amber-500/30 flex-shrink-0 hidden lg:inline-flex"
              title={getLegacyNotice(lang)}
            >
              <AlertCircle className="w-2.5 h-2.5 text-amber-400" />
              <span>{getLegacyNotice(lang)}</span>
            </span>
          )}

          {/* Injected Rules Badge */}
          {injectedCount > 0 && (
            <span
              className="text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold whitespace-nowrap flex-shrink-0 bg-amber-500/20 text-amber-300 border-amber-500/40"
              title={lang === 'zh' ? `包含 ${injectedCount} 条生效指令` : `${injectedCount} directives`}
            >
              ⚡ {injectedCount}
            </span>
          )}

          {/* Truncated Description */}
          <span className="text-[11px] text-gray-400 truncate hidden lg:inline-block max-w-[280px]">
            {skill.description || (lang === 'zh' ? '未提供描述' : 'No description')}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          {onShuttle && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShuttle(skill);
              }}
              className="p-1 rounded-lg text-cyan-400 hover:text-cyan-200 hover:bg-cyan-500/20 transition cursor-pointer"
              title={lang === 'zh' ? '🚀 生态穿梭' : 'Ecosystem Shuttle'}
            >
              <Rocket className="w-3.5 h-3.5" />
            </button>
          )}

          {onDiagnose && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDiagnose(skill);
              }}
              className="p-1 rounded-lg text-purple-400 hover:text-purple-200 hover:bg-purple-500/20 transition cursor-pointer"
              title={lang === 'zh' ? '🩺 Skills Doctor' : 'Skills Doctor'}
            >
              <Stethoscope className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onInspect(skill)}
            className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-100 text-[11px] font-medium transition cursor-pointer"
          >
            <span>{t.openStudio}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex flex-col justify-between p-4 rounded-2xl border transition-all duration-300 glass-card ${getEcosystemGlow(skill.ecosystem)} ${
        isHighlighted
          ? 'bg-[#0e1f18]/95 border-emerald-400 ring-2 ring-emerald-400/60 shadow-[0_0_30px_rgba(52,211,153,0.35)]'
          : skill.enabled
          ? 'bg-[#111422]/90 border-white/[0.08]'
          : 'bg-[#0e1019]/60 border-white/[0.04] opacity-60 hover:opacity-90'
      }`}
    >
      <div>
        {/* Header: Icon, Name, Version, Toggle */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className={`p-2 rounded-xl border flex-shrink-0 group-hover:scale-105 transition-transform ${
              isHighlighted ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : 'bg-gray-900/80 border-gray-800'
            }`}>
              {cat.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h4
                  onClick={() => onInspect(skill)}
                  className="font-semibold text-xs text-gray-100 truncate cursor-pointer hover:text-indigo-300 transition"
                >
                  {skill.name}
                </h4>
                {isHighlighted && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 flex items-center gap-1 shadow-sm flex-shrink-0 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {lang === 'zh' ? '✨ 刚刚保存' : '✨ Saved'}
                  </span>
                )}
              </div>
              <div className="flex items-center flex-wrap gap-1 mt-1">
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-medium whitespace-nowrap flex-shrink-0 ${cat.badgeClass}`}
                >
                  {cat.label}
                </span>
                {skill.ecosystem && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold whitespace-nowrap flex-shrink-0 ${
                      skill.ecosystem === 'claude'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : skill.ecosystem === 'codex'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : skill.ecosystem === 'agents'
                        ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    }`}
                  >
                    {skill.ecosystem === 'claude'
                      ? '🟠 Claude'
                      : skill.ecosystem === 'codex'
                      ? '🟢 Codex'
                      : skill.ecosystem === 'agents'
                      ? '🔵 Agents'
                      : '🟣 Gemini'}
                  </span>
                )}
                {/* ReadBy Badges */}
                {skill.readBy && skill.readBy.length > 0 && (
                  skill.readBy.map((tool) => (
                    <span
                      key={tool}
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold whitespace-nowrap flex-shrink-0 ${getReadByBadgeStyle(tool)}`}
                      title={`Read by: ${formatReadByTool(tool)}`}
                    >
                      {formatReadByTool(tool)}
                    </span>
                  ))
                )}
                {/* ReadOnly Lock */}
                {isReadOnlySkill(skill) && (
                  <span
                    className="flex items-center space-x-1 text-[9px] font-mono px-1.5 py-0.5 rounded border font-medium bg-red-500/15 text-red-300 border-red-500/30 whitespace-nowrap flex-shrink-0 cursor-help"
                    title={getReadOnlyNotice(skill, lang)}
                  >
                    <Lock className="w-2.5 h-2.5 text-red-400" />
                    <span>{lang === 'zh' ? '只读' : 'Read-only'}</span>
                  </span>
                )}
                {/* Legacy Notice */}
                {isLegacySkill(skill) && (
                  <span
                    className="flex items-center space-x-1 text-[9px] font-mono px-1.5 py-0.5 rounded border font-medium bg-amber-500/15 text-amber-300 border-amber-500/30 whitespace-nowrap flex-shrink-0"
                    title={getLegacyNotice(lang)}
                  >
                    <AlertCircle className="w-2.5 h-2.5 text-amber-400" />
                    <span>{getLegacyNotice(lang)}</span>
                  </span>
                )}
                {skill.version && (
                  <span className="text-[9px] text-gray-500 font-mono whitespace-nowrap flex-shrink-0">
                    v{skill.version}
                  </span>
                )}
                {injectedCount > 0 && (
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold whitespace-nowrap flex-shrink-0 bg-amber-500/20 text-amber-300 border-amber-500/40"
                    title={lang === 'zh' ? `该技能包含 ${injectedCount} 条已注入指令或规则` : `${injectedCount} injected items`}
                  >
                    ⚡ {injectedCount} {lang === 'zh' ? '条指令' : 'Injected'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => onToggle(skill.id)}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 flex items-center flex-shrink-0 ${
              skill.enabled ? 'bg-indigo-600' : 'bg-gray-800'
            }`}
            title={skill.enabled ? (lang === 'zh' ? '点击禁用治理' : 'Disable') : (lang === 'zh' ? '点击激活治理' : 'Enable')}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm ${
                skill.enabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Description preview */}
        <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed mb-3">
          {skill.description || (lang === 'zh' ? '未提供详细技能描述。' : 'No description provided.')}
        </p>
      </div>

      {/* Footer: Open Studio Button & Path */}
      <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.05] text-[10px]">
        <span className="text-gray-500 font-mono truncate max-w-[140px]" title={skill.rawPath}>
          {skill.rawPath ? skill.rawPath.split(/[\\/]/).pop() : 'SKILL.md'}
        </span>

        <div className="flex items-center space-x-1.5">
          {onShuttle && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShuttle(skill);
              }}
              className="p-1.5 rounded-lg text-cyan-400 hover:text-cyan-200 hover:bg-cyan-500/20 active:scale-95 transition-all cursor-pointer"
              title={lang === 'zh' ? '🚀 生态穿梭：转译为 Cursor / Claude / DeepSeek' : 'Ecosystem Shuttle'}
            >
              <Rocket className="w-3.5 h-3.5" />
            </button>
          )}

          {onDiagnose && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDiagnose(skill);
              }}
              className="p-1.5 rounded-lg text-purple-400 hover:text-purple-200 hover:bg-purple-500/20 active:scale-95 transition-all cursor-pointer"
              title={lang === 'zh' ? '🩺 Skills Doctor' : 'Skills Doctor'}
            >
              <Stethoscope className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onInspect(skill)}
            className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-100 font-medium active:scale-95 transition-all group-hover:translate-x-0.5 cursor-pointer"
          >
            <span>{t.openStudio}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
