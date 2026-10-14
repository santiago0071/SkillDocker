import React from 'react';
import {
  SkillMeta,
  ExportPackSummary,
} from '../../types/index.ts';
import { Language } from '../../i18n/index.ts';
import {
  Archive,
  Download,
  ShieldCheck,
  AlertTriangle,
  FileWarning,
} from 'lucide-react';
import {
  getSkillDirName,
  getSourceInfo,
} from './vaultUtils.ts';

interface VaultExportTabProps {
  skills: SkillMeta[];
  lang: Language;
  selectedExportKeys: Set<string>;
  onToggleKey: (key: string) => void;
  onToggleGroupAll: (groupSourceId: string, groupSkills: SkillMeta[]) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  exportSummary: ExportPackSummary | null;
  isExporting: 'pack' | 'folder' | null;
  onExport: (mode: 'pack' | 'folder') => void;
  groupedSkills: Record<string, SkillMeta[]>;
}

export const VaultExportTab: React.FC<VaultExportTabProps> = ({
  skills,
  lang,
  selectedExportKeys,
  onToggleKey,
  onToggleGroupAll,
  onSelectAll,
  onSelectNone,
  exportSummary,
  isExporting,
  onExport,
  groupedSkills,
}) => {
  return (
    <>
      {/* Summary box */}
      <div className="vault-summary-box flex items-center justify-between p-3 rounded-xl bg-gray-900/60 border border-gray-800/80">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-medium text-gray-200">
            {lang === 'zh' ? '选择要导出的本地技能' : 'Select Local Skills to Backup'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={onSelectAll} className="text-[11px] text-indigo-400 hover:underline">
            {lang === 'zh' ? '全选' : 'All'}
          </button>
          <span className="text-gray-600">|</span>
          <button onClick={onSelectNone} className="text-[11px] text-gray-400 hover:underline">
            {lang === 'zh' ? '清空' : 'None'}
          </button>
          <span className="vault-badge text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30 ml-2">
            {selectedExportKeys.size}/{skills.length}
          </span>
        </div>
      </div>

      {/* Grouped Skills Checkbox List */}
      <div className="space-y-3 max-h-60 overflow-y-auto p-1 border border-gray-800/80 rounded-xl bg-gray-950/40">
        {skills.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500">
            {lang === 'zh' ? '当前没有可用技能' : 'No active skills found'}
          </div>
        ) : (
          Object.entries(groupedSkills).map(([srcId, groupList]) => {
            const info = getSourceInfo(srcId, lang);
            const selectedCount = groupList.filter((s) =>
              selectedExportKeys.has(`${srcId}:${getSkillDirName(s)}`)
            ).length;
            return (
              <div key={srcId} className="space-y-1.5 p-2 rounded-lg bg-gray-900/30 border border-gray-800/50">
                {/* Group Header */}
                <div className="flex items-center justify-between text-xs pb-1 border-b border-gray-800/40">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-200">{info.label}</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      ({selectedCount}/{groupList.length})
                    </span>
                  </div>
                  <button
                    onClick={() => onToggleGroupAll(srcId, groupList)}
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    {selectedCount === groupList.length
                      ? lang === 'zh'
                        ? '取消全组'
                        : 'Deselect'
                      : lang === 'zh'
                      ? '全选本组'
                      : 'Select All'}
                  </button>
                </div>
                {info.note && (
                  <div className="text-[11px] text-amber-400/90 bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                    💡 {info.note}
                  </div>
                )}
                {/* Group Skill Items */}
                <div className="space-y-1 pl-1">
                  {groupList.map((s) => {
                    const dir = getSkillDirName(s);
                    const key = `${srcId}:${dir}`;
                    const isChecked = selectedExportKeys.has(key);
                    return (
                      <label
                        key={key}
                        className="flex items-center justify-between p-1.5 rounded bg-gray-900/40 hover:bg-gray-800/60 border border-gray-800/40 cursor-pointer transition text-xs"
                      >
                        <div className="flex items-center space-x-2 overflow-hidden pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => onToggleKey(key)}
                            className="rounded border-gray-700 text-indigo-500 focus:ring-0 cursor-pointer"
                          />
                          <div className="truncate">
                            <span className="font-semibold text-gray-200 block truncate">{s.name}</span>
                            <span className="text-[10px] text-gray-400 block truncate">
                              {s.description || s.rawPath}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 shrink-0">{dir}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Export Detailed Summary */}
      {exportSummary && (
        <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/50 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-indigo-200">
              {lang === 'zh' ? '导出完成摘要' : 'Export Summary'}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium">
              ✓ {lang === 'zh' ? 'SHA-256 完整性已验证' : 'SHA-256 Verified'}
            </span>
          </div>
          <div className="text-[11px] text-gray-400 break-all">
            <span className="text-gray-300 font-medium">
              {lang === 'zh' ? '目标路径: ' : 'Path: '}
            </span>
            {exportSummary.outputPath}
          </div>
          {exportSummary.bySource && exportSummary.bySource.length > 0 && (
            <div className="space-y-0.5 pt-1 border-t border-indigo-800/40 text-[11px]">
              {exportSummary.bySource.map((bs) => (
                <div key={bs.source} className="flex justify-between text-gray-300">
                  <span>{bs.source}</span>
                  <span className="font-mono text-gray-400">
                    {bs.skillsCount} 技能 / {bs.filesCount} 文件
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Excluded files list */}
          {exportSummary.excludedFiles && exportSummary.excludedFiles.length > 0 && (
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 space-y-1 mt-1">
              <div className="font-semibold flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>
                  {lang === 'zh'
                    ? `跳过文件 (${exportSummary.excludedFiles.length} 个)`
                    : `Skipped files (${exportSummary.excludedFiles.length})`}
                </span>
              </div>
              <div className="max-h-20 overflow-y-auto space-y-0.5 font-mono text-[10px] text-gray-300">
                {exportSummary.excludedFiles.map((ef, idx) => (
                  <div key={idx} className="truncate" title={ef.reason}>
                    {ef.path} - <span className="text-amber-400">{ef.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed skills list */}
          {exportSummary.failedSkills && exportSummary.failedSkills.length > 0 && (
            <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-200 space-y-1 mt-1">
              <div className="font-semibold flex items-center space-x-1">
                <FileWarning className="w-3 h-3" />
                <span>
                  {lang === 'zh'
                    ? `读取失败技能 (${exportSummary.failedSkills.length} 个)`
                    : `Failed skills (${exportSummary.failedSkills.length})`}
                </span>
              </div>
              <div className="max-h-20 overflow-y-auto space-y-0.5 font-mono text-[10px] text-gray-300">
                {exportSummary.failedSkills.map((fs, idx) => (
                  <div key={idx} className="truncate" title={fs.reason}>
                    {fs.path} - <span className="text-rose-400">{fs.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Two Export Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={() => onExport('pack')}
          disabled={isExporting !== null || selectedExportKeys.size === 0}
          className="vault-action-btn flex items-center justify-center p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs transition space-x-1.5"
        >
          <Archive className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {isExporting === 'pack'
              ? lang === 'zh'
                ? '正在打包 ZIP...'
                : 'Packing...'
              : lang === 'zh'
              ? `导出为 ZIP 备份包 (${selectedExportKeys.size})`
              : `Export as ZIP (${selectedExportKeys.size})`}
          </span>
        </button>
        <button
          onClick={() => onExport('folder')}
          disabled={isExporting !== null || selectedExportKeys.size === 0}
          className="vault-action-btn flex items-center justify-center p-2.5 rounded-xl bg-indigo-700/80 hover:bg-indigo-600/80 border border-indigo-500/30 disabled:opacity-50 text-white font-medium text-xs transition space-x-1.5"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {isExporting === 'folder'
              ? lang === 'zh'
                ? '正在导出文件夹...'
                : 'Exporting...'
              : lang === 'zh'
              ? `导出为普通文件夹 (${selectedExportKeys.size})`
              : `Export Folder (${selectedExportKeys.size})`}
          </span>
        </button>
      </div>
    </>
  );
};
