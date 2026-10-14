import React from 'react';
import {
  SkillPackInspection,
  ImportPackSummary,
} from '../../types/index.ts';
import { Language } from '../../i18n/index.ts';
import {
  Upload,
  FileArchive,
  FolderSync,
} from 'lucide-react';
import {
  getImportSkillKey,
  resolveDefaultTarget,
} from './vaultUtils.ts';

interface VaultImportTabProps {
  lang: Language;
  inspection: SkillPackInspection | null;
  isInspecting: boolean;
  isImporting: boolean;
  selectedImportKeys: Set<string>;
  targetEcosystems: Record<string, string>;
  overwriteFlags: Record<string, boolean>;
  importSummary: ImportPackSummary | null;
  onInspectPack: () => void;
  onToggleImportKey: (key: string) => void;
  onSelectAllImport: () => void;
  onSelectNoneImport: () => void;
  onChangeTargetEcosystem: (key: string, eco: string) => void;
  onChangeOverwriteFlag: (key: string, overwrite: boolean) => void;
  onConfirmImport: () => void;
}

export const VaultImportTab: React.FC<VaultImportTabProps> = ({
  lang,
  inspection,
  isInspecting,
  isImporting,
  selectedImportKeys,
  targetEcosystems,
  overwriteFlags,
  importSummary,
  onInspectPack,
  onToggleImportKey,
  onSelectAllImport,
  onSelectNoneImport,
  onChangeTargetEcosystem,
  onChangeOverwriteFlag,
  onConfirmImport,
}) => {
  if (!inspection) {
    return (
      <div className="p-8 border border-dashed border-gray-700 rounded-2xl text-center space-y-3 bg-gray-900/30">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
          <FileArchive className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-200">
            {lang === 'zh'
              ? '选择技能备份包 (.skillpack / .zip)'
              : 'Select Skill Backup File (.skillpack / .zip)'}
          </h4>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            {lang === 'zh'
              ? '解压前自动校验 SHA-256、格式版本与 Zip Slip 路径防御，安全有保障。'
              : 'Validates SHA-256, version compatibility and Zip Slip defenses before unpacking.'}
          </p>
        </div>
        <button
          onClick={onInspectPack}
          disabled={isInspecting}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          <span>
            {isInspecting
              ? lang === 'zh'
                ? '正在分析包内容...'
                : 'Inspecting...'
              : lang === 'zh'
              ? '打开并检测技能包'
              : 'Open and Inspect Pack'}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-200">
            {lang === 'zh' ? '备份包清单预览' : 'Pack Manifest Preview'}
          </span>
          <button
            onClick={onInspectPack}
            className="text-[11px] text-emerald-400 hover:underline flex items-center space-x-1"
          >
            <FolderSync className="w-3 h-3" />
            <span>{lang === 'zh' ? '重新选择' : 'Change File'}</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 pt-1">
          <div>
            {lang === 'zh' ? '技能数量: ' : 'Skills: '}
            <span className="text-gray-200 font-mono">{inspection.total_skills}</span>
          </div>
          <div>
            {lang === 'zh' ? '文件总数: ' : 'Files: '}
            <span className="text-gray-200 font-mono">{inspection.total_files}</span>
          </div>
          <div>
            {lang === 'zh' ? '备份版本: ' : 'Format: '}
            <span className="text-gray-200 font-mono">v{inspection.format_version}</span>
          </div>
          <div>
            {lang === 'zh' ? '导出时间: ' : 'Exported: '}
            <span className="text-gray-200 font-mono">{inspection.exported_at}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs px-1">
        <span className="text-gray-300 font-medium">
          {lang === 'zh' ? '选择要导入的技能与目标生态：' : 'Select skills and target ecosystem:'}
        </span>
        <div className="space-x-2">
          <button onClick={onSelectAllImport} className="text-[11px] text-emerald-400 hover:underline">
            {lang === 'zh' ? '全选' : 'All'}
          </button>
          <span className="text-gray-600">|</span>
          <button onClick={onSelectNoneImport} className="text-[11px] text-gray-400 hover:underline">
            {lang === 'zh' ? '清空' : 'None'}
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto p-1 border border-gray-800 rounded-xl bg-gray-950/40">
        {inspection.skills.map((skill) => {
          const key = getImportSkillKey(skill);
          const checked = selectedImportKeys.has(key);
          const eco = targetEcosystems[key] || resolveDefaultTarget(skill.source, skill.ecosystem);
          const overwrite = !!overwriteFlags[key];
          return (
            <div
              key={key}
              className="p-2.5 rounded-lg bg-gray-900/40 border border-gray-800/80 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleImportKey(key)}
                    className="rounded border-gray-700 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="font-semibold text-gray-200">{skill.directoryName || skill.name}</span>
                  <span className="text-[10px] text-gray-400 font-mono">({skill.source || 'claude-user'})</span>
                </label>
                <span className="text-[10px] text-gray-400">
                  {skill.files.length} {lang === 'zh' ? '个文件' : 'files'}
                </span>
              </div>

              {checked && (
                <div className="flex items-center justify-between pl-6 pt-1 border-t border-gray-800/50">
                  <div className="flex items-center space-x-1.5 text-[11px]">
                    <span className="text-gray-400">{lang === 'zh' ? '目标生态:' : 'Target:'}</span>
                    <select
                      value={eco}
                      onChange={(e) => onChangeTargetEcosystem(key, e.target.value)}
                      className="bg-gray-800 text-gray-200 rounded px-2 py-0.5 border border-gray-700 text-[11px]"
                    >
                      <option value="claude-user">Claude Code (~/.claude/skills)</option>
                      <option value="antigravity-user">Antigravity (~/.gemini/config/skills)</option>
                      <option value="gemini-cli-user">Gemini CLI (~/.gemini/skills)</option>
                      <option value="antigravity-cli-user">Antigravity CLI (~/.gemini/antigravity-cli/skills)</option>
                      <option value="agents-user">Agent Skills (~/.agents/skills)</option>
                      <option value="codex-legacy">Codex Legacy (~/.codex/skills)</option>
                      <option value="antigravity-legacy">Antigravity Legacy (~/.gemini/antigravity/skills)</option>
                    </select>
                    {(skill.source === 'codex-legacy' || skill.source === 'antigravity-legacy') && (
                      <span className="text-[10px] text-amber-400/90 ml-1">
                        {lang === 'zh' ? '（已默认迁移至新版，可改选旧版）' : '(Defaulted to modern dir)'}
                      </span>
                    )}
                  </div>

                  <label className="flex items-center space-x-1 text-[11px] text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overwrite}
                      onChange={(e) => onChangeOverwriteFlag(key, e.target.checked)}
                      className="rounded border-gray-700 text-emerald-500 focus:ring-0"
                    />
                    <span>{lang === 'zh' ? '同名时覆盖' : 'Overwrite'}</span>
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={onConfirmImport}
        disabled={isImporting || selectedImportKeys.size === 0}
        className="w-full flex items-center justify-center p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs transition space-x-2"
      >
        <Upload className="w-4 h-4" />
        <span>
          {isImporting
            ? lang === 'zh'
              ? '正在解压并恢复技能...'
              : 'Importing...'
            : lang === 'zh'
            ? `确认导入已选 (${selectedImportKeys.size}) 项技能`
            : `Import Selected (${selectedImportKeys.size}) Skills`}
        </span>
      </button>

      {importSummary && (
        <div className="p-3 rounded-lg bg-gray-900 border border-gray-800 text-xs space-y-1">
          <div className="font-semibold text-gray-200">
            {lang === 'zh' ? '导入结果明细' : 'Import Details'}
          </div>
          <div className="text-[11px] text-gray-400">
            {lang === 'zh'
              ? `成功: ${importSummary.imported} | 跳过: ${importSummary.skipped} | 失败: ${importSummary.failed}`
              : `Imported: ${importSummary.imported} | Skipped: ${importSummary.skipped} | Failed: ${importSummary.failed}`}
          </div>
        </div>
      )}
    </div>
  );
};
