import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  Zap,
  Shield,
  Stethoscope,
  PlusCircle,
  ShieldCheck,
  FileText,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ExternalLink,
  Key,
} from 'lucide-react';
import { DiagnosticReport, SkillMeta } from '../../types/index.ts';
import { isReadOnlySkill, getReadOnlyNotice } from '../../core/skillBadges.ts';
import { AiConfig } from '../../core/aiClient.ts';
import { TriggerBenchmarkResult } from '../../core/doctor.ts';
import { Language } from '../../i18n/index.ts';
import {
  isProFeatureAvailable,
  useProGateStatus,
  openProCheckout,
  openLicenseSettings,
} from '../../pro-api/index.ts';
import { DoctorTriggerBenchmark } from './DoctorTriggerBenchmark.tsx';

interface DoctorDiagnosisReportViewProps {
  lang: Language;
  report: DiagnosticReport;
  aiConfig: AiConfig;
  activeSkill: SkillMeta | undefined;
  isOptimizing: boolean;
  isRemedying: boolean;
  onTriggerOptimization: () => void;
  onApplyRemedy: () => void;
  isTestingTriggers: boolean;
  triggerBenchmarkResult: TriggerBenchmarkResult | null;
  onRunTriggerBenchmark: () => void;
}

export const DoctorDiagnosisReportView: React.FC<DoctorDiagnosisReportViewProps> = ({
  lang,
  report,
  aiConfig,
  activeSkill,
  isOptimizing,
  isRemedying,
  onTriggerOptimization,
  onApplyRemedy,
  isTestingTriggers,
  triggerBenchmarkResult,
  onRunTriggerBenchmark,
}) => {
  const [showPatchPreview, setShowPatchPreview] = useState(false);

  const hasCriticalL1 = Boolean(
    report?.issues?.some((i) => i.type === 'critical' || i.level === 'L1') ||
    report?.grade === 'incomplete' ||
    report?.grade === '不合规' ||
    report?.grade === '极度危险'
  );
  const warningCount = report?.issues?.filter((i) => i.type === 'warning' || i.level === 'L2').length || 0;

  const isAiOptimizerAvailable = isProFeatureAvailable('aiOptimizer');
  const optimizerGate = useProGateStatus('aiOptimizer');

  const scoreColor =
    !report
      ? 'text-gray-400'
      : hasCriticalL1
      ? 'text-rose-500'
      : warningCount === 0
      ? 'text-emerald-400'
      : 'text-amber-400';

  const badgeBg =
    !report
      ? 'bg-gray-800 text-gray-300'
      : hasCriticalL1
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
      : warningCount === 0
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      : 'bg-amber-500/20 text-amber-300 border-amber-500/40';

  return (
    <>
      {/* ✨ HERO CARD: AI 技能完善与智能扩充 (AI Skill Optimization & Enrichment) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-emerald-950/50 border border-purple-500/40 shadow-xl space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 mt-0.5">
              <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-xs font-bold text-white tracking-wide">
                  {lang === 'zh' ? '✨ AI 技能完善与智能扩充' : 'AI Skill Optimizer & Expander'}
                </h4>
                {optimizerGate === 'locked' ? (
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border bg-amber-500/20 text-amber-300 border-amber-500/30 flex items-center space-x-1">
                    <Lock className="w-2.5 h-2.5 mr-0.5" />
                    {lang === 'zh' ? '需要 Pro 授权' : 'Pro Locked'}
                  </span>
                ) : optimizerGate === 'loading' ? (
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border bg-gray-800 text-gray-400 border-gray-700">
                    ...
                  </span>
                ) : (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border ${
                    isAiOptimizerAvailable
                      ? 'bg-purple-500/30 text-purple-200 border-purple-500/40'
                      : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}>
                    {isAiOptimizerAvailable ? 'Core' : 'Community'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                {lang === 'zh'
                  ? '针对该技能的编写薄弱点，由 AI 自动规范 Frontmatter 触发边界、精准补充负向红线与生产安全防线，让技能更完备！'
                  : 'Auto-supplement missing redlines, frontmatter triggers & safety checks with AI.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/[0.08]">
          <div className="flex items-center space-x-2">
            {optimizerGate === 'loading' ? (
              <button
                type="button"
                disabled
                className="px-4 py-2 rounded-xl bg-gray-800 text-gray-400 border border-gray-700 text-xs font-medium cursor-not-allowed flex items-center space-x-1.5"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{lang === 'zh' ? '正在核验授权...' : 'Verifying...'}</span>
              </button>
            ) : optimizerGate === 'locked' ? (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={openLicenseSettings}
                  disabled={isOptimizing || isRemedying || isReadOnlySkill(activeSkill)}
                  className="px-4 py-2 rounded-xl text-amber-300 bg-amber-500/10 border border-amber-500/30 text-xs font-bold transition flex items-center space-x-2 cursor-pointer hover:bg-amber-500/20"
                  title={lang === 'zh' ? '需要 Pro 授权，点击前往设置输入密钥' : 'Pro license required'}
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'zh' ? '🔒 需要 Pro 授权' : '🔒 Pro License Required'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void openProCheckout()}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-md shadow-purple-900/40"
                  title={lang === 'zh' ? '打开购买授权页面' : 'Open Checkout Page'}
                >
                  <ExternalLink className="w-3 h-3 mr-0.5" />
                  <span>{lang === 'zh' ? '获取授权' : 'Buy Pro'}</span>
                </button>
                <button
                  type="button"
                  onClick={openLicenseSettings}
                  className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-medium transition flex items-center space-x-1 cursor-pointer"
                  title={lang === 'zh' ? '前往设置输入密钥' : 'Go to Settings'}
                >
                  <Key className="w-3 h-3 mr-0.5 text-amber-400" />
                  <span>{lang === 'zh' ? '输入密钥' : 'Enter Key'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onTriggerOptimization}
                disabled={isOptimizing || isRemedying || isReadOnlySkill(activeSkill) || !isAiOptimizerAvailable}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition flex items-center space-x-2 ${
                  !isAiOptimizerAvailable
                    ? 'bg-gray-800 text-gray-400 border border-gray-700 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 cursor-pointer shadow-lg shadow-purple-900/50 disabled:opacity-40'
                }`}
                title={
                  isReadOnlySkill(activeSkill)
                    ? getReadOnlyNotice(activeSkill, lang)
                    : !isAiOptimizerAvailable
                    ? (lang === 'zh' ? '此版本不包含该功能（Pro 专属功能）' : 'Feature not included in this edition.')
                    : lang === 'zh'
                    ? '由 AI 深度扩充与完善当前技能'
                    : 'Optimize with AI'
                }
              >
                {isOptimizing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : !isAiOptimizerAvailable ? (
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                ) : isReadOnlySkill(activeSkill) ? (
                  <Lock className="w-3.5 h-3.5 text-red-300" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                )}
                <span>
                  {isReadOnlySkill(activeSkill)
                    ? lang === 'zh'
                      ? '🔒 只读技能（禁止优化）'
                      : '🔒 Read-only (Cannot optimize)'
                    : !isAiOptimizerAvailable
                    ? lang === 'zh'
                      ? '🔒 此版本不包含该功能'
                      : '🔒 Feature not included in this edition'
                    : lang === 'zh'
                    ? '🚀 立即由 AI 深度补充扩充 & 完善技能'
                    : 'Optimize & Expand Skill with AI'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onApplyRemedy}
              disabled={isRemedying || isOptimizing || isReadOnlySkill(activeSkill)}
              className="px-3 py-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-gray-700/60 text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 disabled:opacity-40"
              title={
                isReadOnlySkill(activeSkill)
                  ? getReadOnlyNotice(activeSkill, lang)
                  : lang === 'zh'
                  ? '快速追加 3 条核心安全防线'
                  : 'Patch only'
              }
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'zh' ? '仅追加补丁' : 'Patch Only'}</span>
            </button>
          </div>

          <span className="text-[10px] text-gray-400 font-mono flex items-center space-x-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'zh' ? '写前自动创建 .bak 备份' : 'Auto .bak backup'}</span>
          </span>
        </div>
      </div>

      {/* Row 2: AI 编写质量研判 (AI Quality Review) */}
      <div className="doctor-review-card bg-[#101426] rounded-2xl p-4 border border-indigo-500/30 space-y-2.5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Stethoscope className="w-4 h-4 text-emerald-400" />
            <h4 className="doctor-review-title text-xs font-bold text-indigo-200">
              {lang === 'zh' ? '🩺 AI 编写质量深度研判' : 'AI Quality Assessment'}
            </h4>
          </div>
          <span className="doctor-review-badge text-[10px] text-purple-300 font-mono px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
            {report.source.toUpperCase()} Engine
          </span>
        </div>

        <p className="doctor-review-content text-xs text-gray-300 leading-relaxed bg-[#0a0d18] p-3 rounded-xl border border-white/[0.04]">
          {report.qualityReview || '该技能在核心逻辑与技术流程上有良好阐述，具备落地指引性。'}
        </p>

        {/* Supplement Suggestions */}
        {report.supplementSuggestions && report.supplementSuggestions.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-bold text-gray-400 flex items-center space-x-1">
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'zh' ? '💡 建议补充扩充的内容：' : 'Suggested Supplements:'}</span>
            </div>
            <div className="space-y-1">
              {report.supplementSuggestions.map((sug, i) => (
                <div key={i} className="text-xs text-gray-300 flex items-start space-x-2">
                  <span className="text-emerald-400 mt-0.5 font-bold">›</span>
                  <span className="leading-snug">{sug}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Row 3: Score & 5-Dimension Radar Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Score Card */}
        <div className="doctor-score-card bg-[#121524]/90 rounded-2xl p-4 border border-gray-800 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="doctor-score-title text-[10px] text-gray-400 uppercase tracking-widest font-mono font-bold mb-1">
            {lang === 'zh' ? '综合健康指数' : 'Health Score'}
          </div>
          <div className={`doctor-score-val text-4xl font-black font-mono tracking-tight my-1 ${scoreColor}`}>
            {report.totalScore}
            <span className="text-base text-gray-500 font-normal"> / 100</span>
          </div>
          <div className={`doctor-score-grade px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeBg}`}>
            {hasCriticalL1
              ? (lang === 'zh' ? '不合规' : 'Non-Compliant')
              : warningCount === 0
              ? (lang === 'zh' ? '合规 (0 项问题)' : 'Compliant (0 Issues)')
              : (lang === 'zh' ? `待改进 (${warningCount} 项建议)` : `Needs Improvement (${warningCount} Suggestions)`)}
          </div>
          <span className="doctor-score-sub text-[10px] text-gray-500 mt-2 font-mono">
            {report.source === 'ai' ? '🤖 AI 深度分析' : '⚡ 0ms 启发式扫描'}
          </span>
        </div>

        {/* 5-Dimension Progress Bars */}
        <div className="doctor-matrix-card sm:col-span-2 bg-[#121524]/90 rounded-2xl p-4 border border-gray-800 flex flex-col justify-between space-y-1.5">
          <div className="text-xs font-bold text-gray-200 mb-0.5 flex items-center justify-between">
            <span className="doctor-matrix-title">{lang === 'zh' ? '📊 五维质量评分量化表' : '5-Dimension Matrix'}</span>
            <span className="doctor-matrix-max text-[10px] text-gray-400 font-mono">满分 20 分/维</span>
          </div>

          {/* 1. Structure */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-[11px]">
              <span className="doctor-dim-label text-gray-300 font-medium">1. 结构完备性 (Structure)</span>
              <span className="doctor-dim-val font-mono text-gray-400 font-semibold">{report.dimensionScores.structure} / 20</span>
            </div>
            <div className="doctor-progress-track h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
              <div
                className="doctor-progress-fill h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${(report.dimensionScores.structure / 20) * 100}%` }}
              />
            </div>
          </div>

          {/* 2. Redline */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-[11px]">
              <span className="doctor-dim-label text-gray-300 font-medium">{lang === 'zh' ? '2. 红线规则防线 (Redlines)' : '2. Redlines'}</span>
              <span className="doctor-dim-val font-mono text-gray-400 font-semibold">{report.dimensionScores.redline} / 20</span>
            </div>
            <div className="doctor-progress-track h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`doctor-progress-fill h-full rounded-full transition-all duration-300 ${
                  report.dimensionScores.redline < 12 ? 'bg-amber-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${(report.dimensionScores.redline / 20) * 100}%` }}
              />
            </div>
          </div>

          {/* 3. Safety */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-[11px]">
              <span className="doctor-dim-label text-gray-300 font-medium">3. 生产安全防护 (Safety)</span>
              <span className="doctor-dim-val font-mono text-gray-400 font-semibold">{report.dimensionScores.safety} / 20</span>
            </div>
            <div className="doctor-progress-track h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
              <div
                className="doctor-progress-fill h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${(report.dimensionScores.safety / 20) * 100}%` }}
              />
            </div>
          </div>

          {/* 4. Portability */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-[11px]">
              <span className="doctor-dim-label text-gray-300 font-medium">4. 跨生态兼容性 (Portability)</span>
              <span className="doctor-dim-val font-mono text-gray-400 font-semibold">{report.dimensionScores.portability} / 20</span>
            </div>
            <div className="doctor-progress-track h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
              <div
                className="doctor-progress-fill h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${(report.dimensionScores.portability / 20) * 100}%` }}
              />
            </div>
          </div>

          {/* 5. Freshness */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-[11px]">
              <span className="doctor-dim-label text-gray-300 font-medium">5. 事实时效防幻觉 (Freshness)</span>
              <span className="doctor-dim-val font-mono text-gray-400 font-semibold">{report.dimensionScores.freshness} / 20</span>
            </div>
            <div className="doctor-progress-track h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
              <div
                className="doctor-progress-fill h-full bg-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${(report.dimensionScores.freshness / 20) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Issues Breakdown List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="doctor-issues-title text-xs font-bold text-gray-300 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>{lang === 'zh' ? `📋 规则与质量检查清单 (${report.issues.length} 项)` : `Diagnostic Findings (${report.issues.length})`}</span>
          </h4>
          {report.remedyPatch && (
            <button
              type="button"
              onClick={() => setShowPatchPreview(!showPatchPreview)}
              className="text-[11px] text-gray-400 hover:text-gray-200 flex items-center space-x-1 cursor-pointer"
            >
              <FileText className="w-3 h-3" />
              <span>{showPatchPreview ? (lang === 'zh' ? '隐藏分析' : 'Hide Analysis') : (lang === 'zh' ? '查看分析' : 'View Analysis')}</span>
            </button>
          )}
        </div>

        {showPatchPreview && report.remedyPatch && (
          <div className="bg-[#0c0e17] rounded-xl p-3 border border-indigo-900/50 text-[11px] font-mono text-indigo-200 leading-relaxed overflow-x-auto whitespace-pre-wrap animate-in fade-in">
            <div className="text-[10px] text-indigo-400 font-bold mb-1.5 flex items-center space-x-1">
              <FileText className="w-3 h-3" />
              <span>{lang === 'zh' ? '💡 针对薄弱项推荐的规约优化与防护补丁：' : 'Recommended Optimization Patch:'}</span>
            </div>
            {report.remedyPatch}
          </div>
        )}

        <div className="space-y-1.5">
          {report.issues.map((issue, idx) => (
            <div
              key={idx}
              className="doctor-issue-item p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 flex items-start space-x-2.5 group hover:border-gray-700 transition"
            >
              <div className="mt-0.5 flex-shrink-0">
                {issue.type === 'critical' ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                ) : issue.type === 'warning' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span
                    className={`doctor-issue-badge text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded ${
                      issue.type === 'critical'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : issue.type === 'warning'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {issue.type}
                  </span>
                  <span className="doctor-issue-name text-xs font-bold text-gray-200 truncate">{issue.title}</span>
                  <span className="doctor-issue-dim text-[10px] text-gray-500 font-mono ml-auto">
                    [{issue.dimension}]
                  </span>
                </div>
                <p className="doctor-issue-desc text-[11px] text-gray-400 mt-0.5 leading-relaxed">{issue.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 5: L3 触发命中率测试 (Trigger Benchmark) */}
      <DoctorTriggerBenchmark
        lang={lang}
        aiConfig={aiConfig}
        activeSkill={activeSkill}
        isTestingTriggers={isTestingTriggers}
        triggerBenchmarkResult={triggerBenchmarkResult}
        onRunTriggerBenchmark={onRunTriggerBenchmark}
      />
    </>
  );
};
