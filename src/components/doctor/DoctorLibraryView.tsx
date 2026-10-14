import React from 'react';
import {
  Globe,
  Loader2,
  Sparkles,
  AlertTriangle,
  Lock,
  ExternalLink,
  Key,
} from 'lucide-react';
import { SkillMeta } from '../../types/index.ts';
import { AiConfig, UniversalAiClient } from '../../core/aiClient.ts';
import {
  LibraryAuditReport,
  LibraryConsultationReport,
} from '../../core/doctor.ts';
import { Language } from '../../i18n/index.ts';
import { LibraryCategoryFilter } from './doctorModalTypes.ts';
import { DoctorLibraryReportDetails } from './DoctorLibraryReportDetails.tsx';
import {
  useProGateStatus,
  openProCheckout,
  openLicenseSettings,
} from '../../pro-api/index.ts';

interface DoctorLibraryViewProps {
  lang: Language;
  allSkills: SkillMeta[];
  aiConfig: AiConfig;
  isConsultingLibrary: boolean;
  onRequestLibraryConsultation: () => void;
  libraryStaticAudit: LibraryAuditReport | null;
  libraryReport: LibraryConsultationReport | null;
  libraryCategoryFilter: LibraryCategoryFilter;
  onSetCategoryFilter: (filter: LibraryCategoryFilter) => void;
}

export const DoctorLibraryView: React.FC<DoctorLibraryViewProps> = ({
  lang,
  allSkills,
  aiConfig,
  isConsultingLibrary,
  onRequestLibraryConsultation,
  libraryStaticAudit,
  libraryReport,
  libraryCategoryFilter,
  onSetCategoryFilter,
}) => {
  const libraryGate = useProGateStatus('libraryConsultation');

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {/* Library Top Action Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-[#121524] border border-purple-500/30 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Globe className="w-4 h-4 text-purple-400" />
                <span>{lang === 'zh' ? '技能库 AI 全景体检与会诊' : 'Library AI Panoramic Consultation'}</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                {allSkills.length} {lang === 'zh' ? '个技能' : 'Skills'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {lang === 'zh'
                ? '跨技能行为死锁、触发词意图争抢、规范排异与冷启动 Token 综合深度审查'
                : 'Cross-skill deadlocks, routing collisions, stylistic dissonance & startup token audit'}
            </p>
          </div>

          {libraryGate === 'loading' ? (
            <button
              type="button"
              disabled
              className="px-4 py-2 rounded-xl bg-gray-800 text-gray-400 border border-gray-700 text-xs font-medium cursor-not-allowed flex items-center space-x-1.5"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{lang === 'zh' ? '正在核验授权...' : 'Verifying...'}</span>
            </button>
          ) : libraryGate === 'locked' ? (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={openLicenseSettings}
                disabled={isConsultingLibrary}
                className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer hover:bg-amber-500/20"
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
              onClick={onRequestLibraryConsultation}
              disabled={isConsultingLibrary}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-purple-900/40 cursor-pointer disabled:opacity-50"
            >
              {isConsultingLibrary ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                  <span>{lang === 'zh' ? '大模型 5 维会诊中...' : 'Consulting AI...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>{lang === 'zh' ? '开始 AI 全景会诊' : 'Start AI Consultation'}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* API Key warning if not configured */}
        {!UniversalAiClient.hasApiKey(aiConfig) && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>
              {lang === 'zh'
                ? '注意：技能库全景会诊需要大模型跨技能逻辑深度审查，请先在右上角配置 AI 服务密钥（支持 Gemini / DeepSeek / Claude / OpenAI / 自定义端点）。'
                : 'Note: Library consultation requires an AI API Key. Please configure your API key in the top right.'}
            </span>
          </div>
        )}
      </div>

      {/* Static Baseline Metrics Bar */}
      {libraryStaticAudit && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 flex flex-col">
            <span className="text-[10px] text-gray-500">{lang === 'zh' ? '冷启动 Token 总量' : 'Total Startup Tokens'}</span>
            <span className="text-sm font-bold font-mono text-gray-200 mt-0.5">{libraryStaticAudit.totalColdStartTokens}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 flex flex-col">
            <span className="text-[10px] text-gray-500">{lang === 'zh' ? '平均单技能 Token' : 'Avg Startup Tokens'}</span>
            <span className="text-sm font-bold font-mono text-gray-200 mt-0.5">{libraryStaticAudit.averageColdStartTokens}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 flex flex-col">
            <span className="text-[10px] text-gray-500">{lang === 'zh' ? '重名冲突风险' : 'Name Collisions'}</span>
            <span className={`text-sm font-bold font-mono mt-0.5 ${libraryStaticAudit.nameCollisions.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {libraryStaticAudit.nameCollisions.length}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 flex flex-col">
            <span className="text-[10px] text-gray-500">{lang === 'zh' ? '静态词元重叠' : 'Lexical Overlaps'}</span>
            <span className={`text-sm font-bold font-mono mt-0.5 ${libraryStaticAudit.descriptionOverlaps.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {libraryStaticAudit.descriptionOverlaps.length}
            </span>
          </div>
        </div>
      )}

      {/* AI Report Render */}
      {libraryReport ? (
        <div className="space-y-4">
          {/* Health Score & Executive Summary Card */}
          <div className="p-4 rounded-2xl bg-[#121526] border border-gray-800/80 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800/60 flex-wrap gap-2">
              <div className="flex items-center space-x-2.5">
                <div className={`px-3 py-1 rounded-xl text-base font-black font-mono border ${
                  libraryReport.overallStatus === 'healthy'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : libraryReport.overallStatus === 'warning'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {libraryReport.overallHealthScore} / 100
                </div>
                <div>
                  <span className="text-xs font-bold text-white">
                    {libraryReport.overallStatus === 'healthy'
                      ? (lang === 'zh' ? '🟢 技能库协调一致 (Healthy)' : '🟢 Healthy')
                      : libraryReport.overallStatus === 'warning'
                      ? (lang === 'zh' ? '🟡 存在指令冲突或争抢 (Warning)' : '🟡 Warning')
                      : (lang === 'zh' ? '🔴 存在严重死锁互斥 (Critical)' : '🔴 Critical')}
                  </span>
                  <div className="text-[10px] text-gray-400">
                    {lang === 'zh' ? `体检时间: ${libraryReport.auditedAt} · 覆盖 ${libraryReport.totalAudited} 个技能` : `Audited: ${libraryReport.auditedAt}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-[11px] font-mono">
                <span className={`px-2 py-0.5 rounded-lg border ${
                  libraryReport.conflicts.length > 0
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-gray-800 text-gray-400 border-gray-700'
                }`}>
                  死锁: {libraryReport.conflicts.length}
                </span>
                <span className={`px-2 py-0.5 rounded-lg border ${
                  libraryReport.routingAmbiguities.length > 0
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-gray-800 text-gray-400 border-gray-700'
                }`}>
                  争抢: {libraryReport.routingAmbiguities.length}
                </span>
              </div>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-gray-900/80 border border-gray-800 text-xs text-gray-300 leading-relaxed">
              <span className="font-bold text-indigo-400 mr-1.5">{lang === 'zh' ? '【专家综合诊断】' : '【Summary】'}</span>
              {libraryReport.executiveSummary}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1.5 text-xs overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => onSetCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                libraryCategoryFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-gray-200'
              }`}
            >
              {lang === 'zh' ? '全部' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => onSetCategoryFilter('conflicts')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                libraryCategoryFilter === 'conflicts'
                  ? 'bg-rose-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>{lang === 'zh' ? '指令死锁' : 'Deadlocks'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/30">
                {libraryReport.conflicts.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onSetCategoryFilter('routing')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                libraryCategoryFilter === 'routing'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>{lang === 'zh' ? '路由争抢' : 'Routing'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/30">
                {libraryReport.routingAmbiguities.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onSetCategoryFilter('tokens')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                libraryCategoryFilter === 'tokens'
                  ? 'bg-sky-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>{lang === 'zh' ? 'Token 优化' : 'Tokens'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/30">
                {libraryReport.tokenEfficiencyIssues.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onSetCategoryFilter('highlights')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                libraryCategoryFilter === 'highlights'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>{lang === 'zh' ? '架构亮点' : 'Highlights'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/30">
                {libraryReport.positiveHighlights.length}
              </span>
            </button>
          </div>

          <DoctorLibraryReportDetails
            lang={lang}
            libraryReport={libraryReport}
            libraryCategoryFilter={libraryCategoryFilter}
          />
        </div>
      ) : (
        /* Initial Empty State Guide */
        <div className="py-12 px-6 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-800 rounded-3xl bg-gray-900/20">
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 mb-4">
            <Globe className="w-8 h-8 text-purple-400" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1.5">
            {lang === 'zh' ? '准备进行技能库 AI 全景会诊' : 'Ready for Library AI Consultation'}
          </h4>
          <p className="text-xs text-gray-400 max-w-md leading-relaxed mb-5">
            {lang === 'zh'
              ? '综合体检将由真实大模型对当前技能库的全部活跃技能进行 5 大审查维度（行为死锁、路由争抢、文风排异、环境互斥、Token 预算）的交叉诊断，杜绝硬编码预设带来的误判。'
              : 'AI will perform cross-skill diagnosis across behavioral deadlocks, routing ambiguity, stylistic dissonance, env collision, and token budget.'}
          </p>
          {libraryGate === 'loading' ? (
            <button
              type="button"
              disabled
              className="px-5 py-2.5 rounded-xl bg-gray-800 text-gray-400 text-xs font-medium cursor-not-allowed flex items-center space-x-2"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{lang === 'zh' ? '正在核验授权...' : 'Verifying...'}</span>
            </button>
          ) : libraryGate === 'locked' ? (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={openLicenseSettings}
                disabled={isConsultingLibrary}
                className="px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold transition flex items-center space-x-2 cursor-pointer hover:bg-amber-500/20"
                title={lang === 'zh' ? '需要 Pro 授权，点击前往设置输入密钥' : 'Pro license required'}
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>{lang === 'zh' ? '🔒 需要 Pro 授权' : '🔒 Pro License Required'}</span>
              </button>
              <button
                type="button"
                onClick={() => void openProCheckout()}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-purple-900/40"
                title={lang === 'zh' ? '打开购买授权页面' : 'Open Checkout Page'}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-0.5" />
                <span>{lang === 'zh' ? '获取授权' : 'Buy Pro'}</span>
              </button>
              <button
                type="button"
                onClick={openLicenseSettings}
                className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer"
                title={lang === 'zh' ? '前往设置输入密钥' : 'Go to Settings'}
              >
                <Key className="w-3.5 h-3.5 mr-0.5 text-amber-400" />
                <span>{lang === 'zh' ? '输入密钥' : 'Enter Key'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onRequestLibraryConsultation}
              disabled={isConsultingLibrary}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-purple-900/50 cursor-pointer disabled:opacity-50"
            >
              {isConsultingLibrary ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                  <span>{lang === 'zh' ? '正在由大模型深度研判全库...' : 'Consulting...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>{lang === 'zh' ? '立即开始 AI 全景会诊' : 'Start Consultation Now'}</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
