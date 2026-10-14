import React from 'react';
import { Sparkles, Check, Copy, Download, Loader2, Zap } from 'lucide-react';
import { OptimizationResult, SkillMeta } from '../../types/index.ts';
import { Language } from '../../i18n/index.ts';

interface DoctorOptimizationPreviewProps {
  lang: Language;
  optimizationResult: OptimizationResult;
  activeSkill: SkillMeta | undefined;
  isApplyingOptimization: boolean;
  onClosePreview: () => void;
  onCopyContent: (content: string) => void;
  onDownloadSkill: (name: string, content: string, defaultFileName?: string) => void;
  onApplyOptimization: () => void;
}

export const DoctorOptimizationPreview: React.FC<DoctorOptimizationPreviewProps> = ({
  lang,
  optimizationResult,
  activeSkill,
  isApplyingOptimization,
  onClosePreview,
  onCopyContent,
  onDownloadSkill,
  onApplyOptimization,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-2 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">
            {lang === 'zh' ? 'AI 深度补充扩充 & 完善版本预览' : 'Optimized & Supplemented Preview'}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClosePreview}
          className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-lg bg-gray-800/80 cursor-pointer"
        >
          {lang === 'zh' ? '返回报告' : 'Back'}
        </button>
      </div>

      {/* Highlights of changes */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/40 space-y-2">
        <div className="text-xs font-bold text-purple-200 flex items-center space-x-1.5">
          <Check className="w-3.5 h-3.5 text-purple-400" />
          <span>{lang === 'zh' ? '✨ AI 优化与扩充亮点' : 'Enhancements Summary'}</span>
        </div>
        <ul className="text-xs text-purple-300 space-y-1 pl-4 list-disc">
          {optimizationResult.summaryOfChanges.map((change, i) => (
            <li key={i}>{change}</li>
          ))}
        </ul>
      </div>

      {/* Code Preview */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{lang === 'zh' ? '优化后 SKILL.md 完整内容预览' : 'Optimized Markdown Preview'}</span>
          <span className="font-mono text-[10px] text-gray-500">
            {optimizationResult.optimizedContent.length} chars
          </span>
        </div>
        <pre className="p-3.5 rounded-2xl bg-[#090b12] border border-gray-800 text-[11px] font-mono text-gray-300 max-h-[380px] overflow-y-auto leading-relaxed whitespace-pre-wrap select-text">
          {optimizationResult.optimizedContent}
        </pre>
      </div>

      {/* Apply / Cancel Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-800">
        <span className="text-[10px] text-gray-500 font-mono">
          {lang === 'zh' ? '🛡️ 采纳前将自动生成 .bak 阴影备份' : 'Auto .bak backup'}
        </span>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onCopyContent(optimizationResult.optimizedContent)}
            className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition cursor-pointer flex items-center space-x-1"
            title={lang === 'zh' ? '复制优化后内容' : 'Copy optimized content'}
          >
            <Copy className="w-3.5 h-3.5 text-gray-400" />
            <span>{lang === 'zh' ? '复制内容' : 'Copy'}</span>
          </button>
          <button
            type="button"
            onClick={() => onDownloadSkill(activeSkill?.name || 'optimized-skill', optimizationResult.optimizedContent, activeSkill?.uploadedFileName)}
            className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition cursor-pointer flex items-center space-x-1"
            title={lang === 'zh' ? '下载优化后文件' : 'Download optimized file'}
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>{lang === 'zh' ? '下载文件' : 'Download'}</span>
          </button>
          <button
            type="button"
            onClick={onClosePreview}
            className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition cursor-pointer"
          >
            {lang === 'zh' ? '放弃修改' : 'Discard'}
          </button>
          <button
            type="button"
            onClick={onApplyOptimization}
            disabled={isApplyingOptimization}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-900/40 flex items-center space-x-1.5 disabled:opacity-40"
          >
            {isApplyingOptimization ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            )}
            <span>{lang === 'zh' ? '🚀 采纳并一键更新技能文件' : 'Adopt & Apply Optimization'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
