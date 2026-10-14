import React, { useState, useEffect, useMemo } from 'react';
import { SkillMeta, LiveDirective } from '../../types/index.ts';
import { AiConfig } from '../../core/aiClient.ts';
import { AiService } from '../../core/aiService.ts';
import { Language } from '../../i18n/index.ts';
import {
  Sparkles,
  Check,
  X,
  Target,
  Loader2,
  BookmarkPlus,
  ShieldCheck,
  Terminal,
  Cpu,
  Zap,
} from 'lucide-react';

interface DirectiveCommitModalViewProps {
  directive: { content: string; priority: LiveDirective['priority'] };
  skills: SkillMeta[];
  defaultSkillId?: string;
  aiConfig?: AiConfig;
  lang: Language;
  onConfirm?: (targetSkillId: string, finalContent: string, priority: LiveDirective['priority']) => Promise<void>;
  onClose: () => void;
}

export const DirectiveCommitModalView: React.FC<DirectiveCommitModalViewProps> = ({
  directive,
  skills,
  defaultSkillId,
  aiConfig,
  lang,
  onConfirm,
  onClose,
}) => {
  const [targetSkillId, setTargetSkillId] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [priority, setPriority] = useState<LiveDirective['priority']>('normal');
  const [ecoFilter, setEcoFilter] = useState<'all' | 'antigravity' | 'claude' | 'codex'>('all');

  const filteredSkills = useMemo(() => {
    if (ecoFilter === 'all') return skills;
    return skills.filter((s) => s.ecosystem === ecoFilter);
  }, [skills, ecoFilter]);

  // Recommendation state
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [recommendationInfo, setRecommendationInfo] = useState<{
    skillId: string;
    skillName: string;
    reason: string;
    isAiConfigured: boolean;
    source: 'llm' | 'heuristic' | 'default';
    activeProvider?: string;
  } | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);

  // Initialize and trigger analysis when modal opens
  useEffect(() => {
    setContent(directive.content);
    setPriority(directive.priority || 'normal');

    const initialSkillId = defaultSkillId || (skills.length > 0 ? skills[0].id : '');
    setTargetSkillId(initialSkillId);
    setRecommendationInfo(null);

    let isCancelled = false;
    const analyzeTarget = async () => {
      setIsAiAnalyzing(true);
      try {
        const data = await AiService.routeSkill(directive.content, skills, aiConfig);
        if (!isCancelled && data.recommendedSkillId) {
          const recSkill = skills.find((s) => s.id === data.recommendedSkillId);
          if (recSkill) {
            setRecommendationInfo({
              skillId: recSkill.id,
              skillName: recSkill.name,
              reason: data.reason || (lang === 'zh' ? '语义分析匹配' : 'Semantic match'),
              isAiConfigured: Boolean(data.isAiConfigured),
              source: data.source || 'default',
              activeProvider: data.activeProvider,
            });
            // Automatically select recommendation
            setTargetSkillId(recSkill.id);
          }
        }
      } catch (err) {
        console.warn('Routing in confirm modal failed:', err);
      } finally {
        if (!isCancelled) setIsAiAnalyzing(false);
      }
    };

    analyzeTarget();

    return () => {
      isCancelled = true;
    };
  }, [directive, defaultSkillId, skills, aiConfig, lang]);

  const selectedSkill = skills.find((s) => s.id === targetSkillId) || skills[0];

  const handleConfirm = async () => {
    if (!targetSkillId || !content.trim() || isCommitting) return;

    setIsCommitting(true);
    try {
      if (onConfirm) {
        await onConfirm(targetSkillId, content.trim(), priority);
      }
      onClose();
    } finally {
      setIsCommitting(false);
    }
  };

  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case 'safety':
        return <ShieldCheck className="w-3.5 h-3.5 text-red-400" />;
      case 'workflow':
        return <Terminal className="w-3.5 h-3.5 text-amber-400" />;
      case 'architecture':
        return <Cpu className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <Zap className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div data-commit-modal="true" className="w-full max-w-xl bg-[#0f111a] border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#141624] border-b border-gray-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <BookmarkPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-100">
                {lang === 'zh' ? '正式存入 Skill 确认与智能分发' : 'Commit to Skill & Smart Routing'}
              </h3>
              <p className="text-[11px] text-gray-400">
                {lang === 'zh'
                  ? '将临时指令永久保存至本地技能的正文规则中'
                  : 'Permanently consolidate directive into target skill SOP'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Directive content edit & preview */}
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">
              {lang === 'zh' ? '拟存入的规则条目内容 (可在此微调)：' : 'Directive Content (Adjust if needed):'}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full bg-[#131522] border border-gray-700 rounded-xl p-3 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 leading-relaxed font-sans"
            />
          </div>

          {/* AI vs Local Recommendation Banner */}
          <div
            className={`p-3.5 rounded-xl border space-y-2.5 transition-all ${
              recommendationInfo?.source === 'llm'
                ? 'bg-gradient-to-r from-purple-950/50 to-indigo-950/50 border-purple-500/40'
                : 'bg-gradient-to-r from-[#121422] to-[#161828] border-indigo-500/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1.5 text-xs font-bold">
                {recommendationInfo?.source === 'llm' ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-purple-300">
                      {lang === 'zh'
                        ? `AI 大模型深度语义推荐 (${recommendationInfo.activeProvider?.toUpperCase()})`
                        : `AI LLM Semantic Recommendation (${recommendationInfo.activeProvider?.toUpperCase()})`}
                    </span>
                  </>
                ) : (
                  <>
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-indigo-300">
                      {lang === 'zh'
                        ? (recommendationInfo?.isAiConfigured ? '本地规则拓扑推荐 (AI 降级兜底)' : '本地规则拓扑推荐 (未配置 AI 凭证)')
                        : (recommendationInfo?.isAiConfigured ? 'Local Heuristic Match (AI Fallback)' : 'Local Heuristic Match (No AI Configured)')}
                    </span>
                  </>
                )}
              </span>

              {isAiAnalyzing ? (
                <span className="flex items-center space-x-1 text-[11px] text-indigo-400 animate-pulse font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>{lang === 'zh' ? '正在分析...' : 'Analyzing...'}</span>
                </span>
              ) : !recommendationInfo?.isAiConfigured ? (
                <span className="text-[10px] text-amber-400/90 font-mono bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">
                  {lang === 'zh' ? '离线规则兜底' : 'Local Heuristic'}
                </span>
              ) : (
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  {lang === 'zh' ? '大模型实时研判' : 'LLM Verified'}
                </span>
              )}
            </div>

            {recommendationInfo ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-300 flex items-center space-x-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lang === 'zh' ? '推荐存入：' : 'Recommended: '}</span>
                    <span className="font-mono bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-500/40 text-indigo-200">
                      {recommendationInfo.skillName}
                    </span>
                  </span>
                  {targetSkillId !== recommendationInfo.skillId && (
                    <button
                      type="button"
                      onClick={() => setTargetSkillId(recommendationInfo.skillId)}
                      className="text-[10px] text-indigo-300 hover:text-white underline font-medium cursor-pointer"
                    >
                      {lang === 'zh' ? '应用此推荐' : 'Apply recommendation'}
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-gray-300 leading-relaxed bg-[#0c0d16]/80 p-2 rounded-lg border border-white/[0.06] font-mono">
                  💡 {recommendationInfo.reason}
                </p>

                {!recommendationInfo.isAiConfigured && (
                  <p className="text-[10px] text-gray-400 leading-normal pt-1.5 border-t border-gray-800">
                    {lang === 'zh'
                      ? '⚠️ 提示：你尚未在顶部 [AI 配置] 中配置 API Key。当前仅由本地关键词拓扑进行离线兜底匹配；在顶部配置 Gemini / DeepSeek 密钥后，即可解锁 2026 前沿大模型全语义精读分发。'
                      : '⚠️ Notice: You have not configured an API key in [AI Settings]. This recommendation is deduced locally by keyword heuristics.'}
                  </p>
                )}
              </div>
            ) : !isAiAnalyzing ? (
              <p className="text-[11px] text-gray-400">
                {lang === 'zh'
                  ? '已就绪，当前可从下方菜单自由选择目标技能。'
                  : 'Ready. Choose target skill from the dropdown below.'}
              </p>
            ) : null}
          </div>

          {/* Target Skill Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300 flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                <span>{lang === 'zh' ? '选择最终存入的目标技能：' : 'Target Skill:'}</span>
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {lang === 'zh' ? `共 ${filteredSkills.length} 个候选技能` : `${filteredSkills.length} skills`}
              </span>
            </div>

            {/* Ecosystem Filter Pills */}
            <div className="flex items-center space-x-1 flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setEcoFilter('all')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition cursor-pointer ${
                  ecoFilter === 'all'
                    ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50'
                    : 'bg-gray-900/60 text-gray-400 hover:text-gray-200 border-gray-800'
                }`}
              >
                全部 ({skills.length})
              </button>
              <button
                type="button"
                onClick={() => setEcoFilter('antigravity')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition cursor-pointer ${
                  ecoFilter === 'antigravity'
                    ? 'bg-purple-600/30 text-purple-200 border-purple-500/50'
                    : 'bg-gray-900/60 text-gray-400 hover:text-gray-200 border-gray-800'
                }`}
              >
                🟣 Antigravity ({skills.filter((s) => s.ecosystem === 'antigravity').length})
              </button>
              <button
                type="button"
                onClick={() => setEcoFilter('claude')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition cursor-pointer ${
                  ecoFilter === 'claude'
                    ? 'bg-amber-600/30 text-amber-200 border-amber-500/50'
                    : 'bg-gray-900/60 text-gray-400 hover:text-gray-200 border-gray-800'
                }`}
              >
                🟠 Claude ({skills.filter((s) => s.ecosystem === 'claude').length})
              </button>
              <button
                type="button"
                onClick={() => setEcoFilter('codex')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition cursor-pointer ${
                  ecoFilter === 'codex'
                    ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/50'
                    : 'bg-gray-900/60 text-gray-400 hover:text-gray-200 border-gray-800'
                }`}
              >
                🟢 Codex ({skills.filter((s) => s.ecosystem === 'codex').length})
              </button>
            </div>

            <select
              value={targetSkillId}
              onChange={(e) => setTargetSkillId(e.target.value)}
              className="w-full bg-[#131522] border border-gray-700 rounded-xl p-2.5 text-xs text-gray-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {filteredSkills.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.ecosystem?.toUpperCase() || 'GEMINI'}] {s.name} ({s.category || 'custom'}) — {s.description.slice(0, 45)}...
                </option>
              ))}
            </select>

            {/* Selected skill details preview */}
            {selectedSkill && (
              <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 text-[11px] text-gray-400 space-y-1">
                <div className="flex items-center justify-between text-gray-300 font-medium">
                  <span className="flex items-center space-x-1.5">
                    {getCategoryIcon(selectedSkill.category)}
                    <span className="text-indigo-300 font-bold">{selectedSkill.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-800 border border-gray-700 text-gray-400">
                      {selectedSkill.ecosystem?.toUpperCase() || 'GEMINI'}
                    </span>
                  </span>
                  <span className="text-[10px] font-mono text-gray-500 truncate max-w-[200px]">
                    {selectedSkill.rawPath}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">
                  {selectedSkill.description}
                </p>
              </div>
            )}
          </div>

          {/* Target Markdown Appended Preview */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase text-gray-500 block">
              {lang === 'zh' ? '📄 目标文件追加写入预览 (Atomic Append):' : '📄 File Append Preview:'}
            </span>
            <div className="p-2.5 rounded-xl bg-[#090a12] border border-gray-800 text-[11px] font-mono text-emerald-400/90 leading-relaxed">
              <span className="text-gray-500">## 📌 核心准则与保存规则 (Consolidated Rules)</span>
              <br />
              <span>
                - **[{priority.toUpperCase()}]** {content || '...'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#141624] border-t border-gray-800">
          <span className="text-[10px] text-gray-500">
            {lang === 'zh'
              ? '🛡️ 自动生成时间戳快照 (.bak) 随时可一键撤回'
              : '🛡️ Auto shadow backup with instant undo'}
          </span>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isCommitting}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
            >
              {lang === 'zh' ? '取消' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isCommitting || !content.trim()}
              className="px-4 py-1.5 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              {isCommitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BookmarkPlus className="w-3.5 h-3.5" />
              )}
              <span>
                {isCommitting
                  ? lang === 'zh'
                    ? '正在落盘...'
                    : 'Committing...'
                  : lang === 'zh'
                  ? '🧬 确认正式存入并落盘'
                  : '🧬 Confirm Commit to Skill'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
