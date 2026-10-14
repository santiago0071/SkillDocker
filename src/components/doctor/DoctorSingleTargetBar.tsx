import React from 'react';
import { UploadCloud, FileCode, Check, Copy, Download, Loader2, RotateCcw } from 'lucide-react';
import { SkillMeta } from '../../types/index.ts';
import { Language } from '../../i18n/index.ts';

interface DoctorSingleTargetBarProps {
  lang: Language;
  selectedSkillId: string;
  onSelectSkillId: (id: string) => void;
  uploadedSkills: SkillMeta[];
  skills: SkillMeta[];
  activeSkill: SkillMeta | undefined;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isCopied: boolean;
  onCopyContent: (content: string) => void;
  onDownloadSkill: (name: string, content: string, defaultFileName?: string) => void;
  isDiagnosing: boolean;
  isOptimizing: boolean;
  onRunDiagnosis: () => void;
}

export const DoctorSingleTargetBar: React.FC<DoctorSingleTargetBarProps> = ({
  lang,
  selectedSkillId,
  onSelectSkillId,
  uploadedSkills,
  skills,
  activeSkill,
  fileInputRef,
  onFileInputChange,
  isCopied,
  onCopyContent,
  onDownloadSkill,
  isDiagnosing,
  isOptimizing,
  onRunDiagnosis,
}) => {
  return (
    <div className="px-5 py-2.5 bg-[#10121e] border-b border-gray-800/80 flex items-center justify-between flex-wrap gap-2.5">
      <div className="flex items-center space-x-2 text-xs min-w-0">
        <span className="text-gray-400 font-medium whitespace-nowrap">
          {lang === 'zh' ? '诊断技能目标:' : 'Target:'}
        </span>
        <select
          value={selectedSkillId}
          onChange={(e) => {
            if (e.target.value === '__upload_action__') {
              fileInputRef.current?.click();
              return;
            }
            onSelectSkillId(e.target.value);
          }}
          className="bg-gray-900 text-gray-100 text-xs px-2.5 py-1.5 rounded-xl border border-gray-700/80 focus:border-indigo-500 focus:outline-none cursor-pointer max-w-[220px] font-mono font-semibold truncate"
        >
          <option value="__upload_action__" className="text-purple-400 font-bold">
            ➕ {lang === 'zh' ? '上传本地文件进行检查...' : 'Upload local file...'}
          </option>
          {uploadedSkills.length > 0 && (
            <optgroup label={lang === 'zh' ? '📁 本地上传文件' : '📁 Uploaded Files'}>
              {uploadedSkills.map((s) => (
                <option key={s.id} value={s.id}>
                  📄 {s.uploadedFileName || s.name} (本地上传)
                </option>
              ))}
            </optgroup>
          )}
          {skills.length > 0 && (
            <optgroup label={lang === 'zh' ? '🤖 现存 Agent 技能' : '🤖 Existing Agent Skills'}>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.ecosystem === 'claude'
                    ? `🟠 Claude · ${s.name}`
                    : s.ecosystem === 'codex'
                    ? `🟢 Codex · ${s.name}`
                    : `🟣 Gemini · ${s.name}`}
                </option>
              ))}
            </optgroup>
          )}
        </select>

        {/* Hidden native file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt,.cursorrules,.json,.yaml,.yml"
          onChange={onFileInputChange}
          className="hidden"
        />

        {/* Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-md shadow-purple-900/40 flex-shrink-0"
          title={lang === 'zh' ? '上传本地文件进行检查 (.md, .cursorrules 等)' : 'Upload local file to inspect'}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>{lang === 'zh' ? '上传本地文件' : 'Upload File'}</span>
        </button>

        {/* Active Uploaded File Indicator Tag in Toolbar */}
        {activeSkill?.uploadedFileName && (
          <span
            className="px-2.5 py-1 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-mono font-semibold flex items-center space-x-1.5 truncate max-w-[200px]"
            title={`当前文件: ${activeSkill.uploadedFileName}`}
          >
            <FileCode className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span className="truncate">{activeSkill.uploadedFileName}</span>
          </span>
        )}
      </div>

      <div className="flex items-center space-x-1.5">
        {activeSkill?.rawContent && (
          <>
            <button
              type="button"
              onClick={() => onCopyContent(activeSkill.rawContent || '')}
              className="px-2.5 py-1.5 rounded-xl bg-gray-800/90 hover:bg-gray-700 text-gray-300 text-xs font-medium flex items-center space-x-1 transition cursor-pointer"
              title={lang === 'zh' ? '复制当前技能内容' : 'Copy skill content'}
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
              <span>{isCopied ? (lang === 'zh' ? '已复制' : 'Copied') : (lang === 'zh' ? '复制' : 'Copy')}</span>
            </button>
            <button
              type="button"
              onClick={() => onDownloadSkill(activeSkill.name, activeSkill.rawContent || '', activeSkill.uploadedFileName)}
              className="px-2.5 py-1.5 rounded-xl bg-gray-800/90 hover:bg-gray-700 text-gray-300 text-xs font-medium flex items-center space-x-1 transition cursor-pointer"
              title={lang === 'zh' ? '下载当前技能为 .md 文件' : 'Download skill as .md'}
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>{lang === 'zh' ? '下载' : 'Download'}</span>
            </button>
          </>
        )}

        <button
          onClick={onRunDiagnosis}
          disabled={isDiagnosing || isOptimizing}
          className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow-sm disabled:opacity-40"
        >
          {isDiagnosing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
          )}
          <span>{lang === 'zh' ? '重新体检' : 'Re-diagnose'}</span>
        </button>
      </div>
    </div>
  );
};
