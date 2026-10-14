import React from 'react';
import {
  UploadCloud,
  FileUp,
  FileCode,
  Check,
  Copy,
  Download,
  Loader2,
} from 'lucide-react';
import { SkillMeta, DiagnosticReport, OptimizationResult } from '../../types/index.ts';
import { AiConfig } from '../../core/aiClient.ts';
import { TriggerBenchmarkResult } from '../../core/doctor.ts';
import { Language } from '../../i18n/index.ts';
import { DoctorOptimizationPreview } from './DoctorOptimizationPreview.tsx';
import { DoctorDiagnosisReportView } from './DoctorDiagnosisReportView.tsx';

interface DoctorSingleViewProps {
  lang: Language;
  allSkills: SkillMeta[];
  activeSkill: SkillMeta | undefined;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isCopied: boolean;
  onCopyContent: (content: string) => void;
  onDownloadSkill: (name: string, content: string, defaultFileName?: string) => void;
  isDiagnosing: boolean;
  report: DiagnosticReport | null;
  showOptimizationView: boolean;
  optimizationResult: OptimizationResult | null;
  isApplyingOptimization: boolean;
  onCloseOptimizationPreview: () => void;
  onApplyOptimization: () => void;
  aiConfig: AiConfig;
  isOptimizing: boolean;
  isRemedying: boolean;
  onTriggerOptimization: () => void;
  onApplyRemedy: () => void;
  isTestingTriggers: boolean;
  triggerBenchmarkResult: TriggerBenchmarkResult | null;
  onRunTriggerBenchmark: () => void;
}

export const DoctorSingleView: React.FC<DoctorSingleViewProps> = ({
  lang,
  allSkills,
  activeSkill,
  fileInputRef,
  isCopied,
  onCopyContent,
  onDownloadSkill,
  isDiagnosing,
  report,
  showOptimizationView,
  optimizationResult,
  isApplyingOptimization,
  onCloseOptimizationPreview,
  onApplyOptimization,
  aiConfig,
  isOptimizing,
  isRemedying,
  onTriggerOptimization,
  onApplyRemedy,
  isTestingTriggers,
  triggerBenchmarkResult,
  onRunTriggerBenchmark,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {allSkills.length === 0 ? (
        <div className="py-20 px-6 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-800 rounded-3xl bg-gray-900/30 my-6">
          <div className="p-4 rounded-2xl bg-purple-500/15 border border-purple-500/30 mb-4">
            <UploadCloud className="w-10 h-10 text-purple-400 animate-pulse" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {lang === 'zh' ? '拖拽或上传本地文件开始体检' : 'Upload or Drag a File to Audit'}
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mb-5 leading-relaxed">
            {lang === 'zh'
              ? '尚未在系统目录发现技能。您可以直接拖入或上传任意 .md、.cursorrules、CLAUDE.md 等文件进行 0ms 规则体检与大模型深度诊断。'
              : 'No skills found in system paths. Drag and drop or upload any .md, .cursorrules or prompt file to audit instantly.'}
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-purple-900/50 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{lang === 'zh' ? '选择本地文件' : 'Select Local File'}</span>
          </button>
        </div>
      ) : (
        <>
          {/* 🎯 Active Target File Banner */}
          {activeSkill && (
            <div className="doctor-file-banner bg-[#121526] rounded-2xl p-3.5 border border-indigo-500/30 shadow-md flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
                  {activeSkill.uploadedFileName ? (
                    <FileUp className="w-4 h-4 text-purple-400" />
                  ) : (
                    <FileCode className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span
                      className="text-xs font-bold text-white font-mono truncate max-w-[320px]"
                      title={activeSkill.uploadedFileName || activeSkill.name}
                    >
                      {activeSkill.uploadedFileName || activeSkill.name}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold flex-shrink-0 border ${
                        activeSkill.uploadedFileName
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : activeSkill.ecosystem === 'claude'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : activeSkill.ecosystem === 'codex'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      }`}
                    >
                      {activeSkill.uploadedFileName
                        ? (lang === 'zh' ? '📁 本地上传文件' : '📁 Uploaded File')
                        : `🤖 ${(activeSkill.ecosystem || '系统').toUpperCase()} 技能`}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 flex items-center space-x-3 mt-1 font-mono">
                    <span>
                      {lang === 'zh' ? '字符数: ' : 'Chars: '}
                      <b className="text-gray-200">{(activeSkill.rawContent || '').length}</b>
                    </span>
                    <span>·</span>
                    <span>
                      {lang === 'zh' ? '行数: ' : 'Lines: '}
                      <b className="text-gray-200">{(activeSkill.rawContent || '').split('\n').length}</b>
                    </span>
                    {activeSkill.rawPath ? (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-[200px]" title={activeSkill.rawPath}>
                          {activeSkill.rawPath}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>·</span>
                        <span className="text-purple-300/80">
                          {lang === 'zh' ? '内存临时载入 · 支持体检与导出' : 'In-memory · Ready to audit & export'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onCopyContent(activeSkill.rawContent || '')}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-800/90 hover:bg-gray-700 text-gray-300 text-xs font-medium flex items-center space-x-1 transition cursor-pointer"
                  title={lang === 'zh' ? '复制当前文件内容' : 'Copy file content'}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                  <span>{isCopied ? (lang === 'zh' ? '已复制' : 'Copied') : (lang === 'zh' ? '复制' : 'Copy')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDownloadSkill(activeSkill.name, activeSkill.rawContent || '', activeSkill.uploadedFileName)}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-800/90 hover:bg-gray-700 text-gray-300 text-xs font-medium flex items-center space-x-1 transition cursor-pointer"
                  title={lang === 'zh' ? '下载当前文件' : 'Download file'}
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>{lang === 'zh' ? '下载' : 'Download'}</span>
                </button>
              </div>
            </div>
          )}

          {isDiagnosing && !report ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-xs text-gray-400 text-center">
                {lang === 'zh'
                  ? `Skill Doctor 正在执行深度体检与编写质量研判...`
                  : 'Auditing skill quality and AST redlines...'}
              </p>
            </div>
          ) : showOptimizationView && optimizationResult ? (
            <DoctorOptimizationPreview
              lang={lang}
              optimizationResult={optimizationResult}
              activeSkill={activeSkill}
              isApplyingOptimization={isApplyingOptimization}
              onClosePreview={onCloseOptimizationPreview}
              onCopyContent={onCopyContent}
              onDownloadSkill={onDownloadSkill}
              onApplyOptimization={onApplyOptimization}
            />
          ) : report ? (
            <DoctorDiagnosisReportView
              lang={lang}
              report={report}
              aiConfig={aiConfig}
              activeSkill={activeSkill}
              isOptimizing={isOptimizing}
              isRemedying={isRemedying}
              onTriggerOptimization={onTriggerOptimization}
              onApplyRemedy={onApplyRemedy}
              isTestingTriggers={isTestingTriggers}
              triggerBenchmarkResult={triggerBenchmarkResult}
              onRunTriggerBenchmark={onRunTriggerBenchmark}
            />
          ) : null}
        </>
      )}
    </div>
  );
};
