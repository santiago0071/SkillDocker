import React, { useState } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import {
  SkillMeta,
  SkillPackInspection,
  ImportTargetOption,
  ImportPackSummary,
  ExportPackSummary,
} from '../types/index.ts';
import { Language, translations } from '../i18n/index.ts';
import {
  Archive,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  getSkillSourceId,
  getSkillDirName,
  getImportSkillKey,
  resolveDefaultTarget,
} from './vault/vaultUtils.ts';
import { VaultExportTab } from './vault/VaultExportTab.tsx';
import { VaultImportTab } from './vault/VaultImportTab.tsx';

interface VaultDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  skills: SkillMeta[];
  onImportSkills?: (pack?: any) => void | Promise<void>;
  lang?: Language;
}

export const VaultDrawer: React.FC<VaultDrawerProps> = ({
  isOpen,
  onClose,
  skills,
  onImportSkills,
  lang = 'zh',
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

  // Export selection state with composite key `${sourceId}:${dirName}`
  const [selectedExportKeys, setSelectedExportKeys] = useState<Set<string>>(() => {
    const set = new Set<string>();
    for (const s of skills) {
      const src = getSkillSourceId(s);
      if (src !== 'claude-synced') {
        const dir = getSkillDirName(s);
        set.add(`${src}:${dir}`);
      }
    }
    return set;
  });
  const [isExporting, setIsExporting] = useState<'pack' | 'folder' | null>(null);
  const [exportSummary, setExportSummary] = useState<ExportPackSummary | null>(null);

  // Import state with composite key `${sourceId}:${dirName}`
  const [isInspecting, setIsInspecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [inspection, setInspection] = useState<SkillPackInspection | null>(null);
  const [selectedImportKeys, setSelectedImportKeys] = useState<Set<string>>(new Set());
  const [targetEcosystems, setTargetEcosystems] = useState<Record<string, string>>({});
  const [overwriteFlags, setOverwriteFlags] = useState<Record<string, boolean>>({});
  const [importSummary, setImportSummary] = useState<ImportPackSummary | null>(null);

  // Feedback banners
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const groupedSkills = React.useMemo(() => {
    const groups: Record<string, SkillMeta[]> = {};
    for (const s of skills) {
      const src = getSkillSourceId(s);
      if (!groups[src]) groups[src] = [];
      groups[src].push(s);
    }
    return groups;
  }, [skills]);

  if (!isOpen) return null;

  const toggleKey = (key: string) => {
    setSelectedExportKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroupAll = (groupSourceId: string, groupSkills: SkillMeta[]) => {
    setSelectedExportKeys((prev) => {
      const next = new Set(prev);
      const allSelected = groupSkills.every((s) => next.has(`${groupSourceId}:${getSkillDirName(s)}`));
      for (const s of groupSkills) {
        const k = `${groupSourceId}:${getSkillDirName(s)}`;
        if (allSelected) {
          next.delete(k);
        } else {
          next.add(k);
        }
      }
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set<string>();
    for (const s of skills) {
      all.add(`${getSkillSourceId(s)}:${getSkillDirName(s)}`);
    }
    setSelectedExportKeys(all);
  };

  const selectNone = () => {
    setSelectedExportKeys(new Set());
  };

  const handleExport = async (mode: 'pack' | 'folder') => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setExportSummary(null);

    const chosenSkills = skills.filter((s) =>
      selectedExportKeys.has(`${getSkillSourceId(s)}:${getSkillDirName(s)}`)
    );
    if (chosenSkills.length === 0) {
      setErrorMessage(lang === 'zh' ? '请至少勾选一项要导出的技能' : 'Please select at least one skill to export');
      return;
    }
    if (!isTauri()) {
      setErrorMessage(lang === 'zh' ? '导出功能仅在桌面端可用' : 'Export is only supported in desktop mode');
      return;
    }

    setIsExporting(mode);
    try {
      const cmd = mode === 'pack' ? 'export_skill_pack' : 'export_skill_folder';
      const summary = await invoke<ExportPackSummary | null>(cmd, {
        skillPaths: chosenSkills.map((s) => s.rawPath),
      });
      if (summary) {
        setExportSummary(summary);
        setSuccessMessage(
          lang === 'zh'
            ? `✓ 成功导出！共包含 ${summary.totalSkills} 项技能 (${summary.totalFiles} 个文件)。SHA-256 完整性自动校验通过。`
            : `✓ Export succeeded! ${summary.totalSkills} skills (${summary.totalFiles} files). Automated SHA-256 verified.`
        );
      }
    } catch (err: any) {
      setErrorMessage(lang === 'zh' ? `导出失败: ${err?.message || err}` : `Export failed: ${err?.message || err}`);
    } finally {
      setIsExporting(null);
    }
  };

  const handleInspectPack = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setImportSummary(null);
    if (!isTauri()) {
      setErrorMessage(lang === 'zh' ? '导入功能仅在桌面端可用' : 'Import is only supported in desktop mode');
      return;
    }

    setIsInspecting(true);
    try {
      const insp = await invoke<SkillPackInspection | null>('inspect_skill_pack', { packPath: null });
      if (insp) {
        setInspection(insp);
        const keys = insp.skills.map(getImportSkillKey);
        setSelectedImportKeys(new Set(keys));
        const defaultEcos: Record<string, string> = {};
        const defaultOverwrites: Record<string, boolean> = {};
        for (const s of insp.skills) {
          const k = getImportSkillKey(s);
          defaultEcos[k] = resolveDefaultTarget(s.source, s.ecosystem);
          defaultOverwrites[k] = false;
        }
        setTargetEcosystems(defaultEcos);
        setOverwriteFlags(defaultOverwrites);
        setSuccessMessage(
          lang === 'zh'
            ? `已读取技能包：发现 ${insp.total_skills} 项技能 (${insp.total_files} 个文件)`
            : `Inspected pack: found ${insp.total_skills} skills (${insp.total_files} files)`
        );
      }
    } catch (err: any) {
      setErrorMessage(lang === 'zh' ? `检测技能包失败: ${err?.message || err}` : `Failed to inspect skill pack: ${err?.message || err}`);
    } finally {
      setIsInspecting(false);
    }
  };

  const toggleImportKey = (key: string) => {
    setSelectedImportKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleConfirmImport = async () => {
    if (!inspection) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setImportSummary(null);

    if (selectedImportKeys.size === 0) {
      setErrorMessage(lang === 'zh' ? '请至少勾选一项要导入的技能' : 'Please select at least one skill to import');
      return;
    }

    const chosenSkills = inspection.skills.filter((s) => selectedImportKeys.has(getImportSkillKey(s)));
    const targets: ImportTargetOption[] = chosenSkills.map((s) => {
      const k = getImportSkillKey(s);
      return {
        skillName: k,
        targetEcosystem: targetEcosystems[k] || resolveDefaultTarget(s.source, s.ecosystem),
        overwrite: !!overwriteFlags[k],
      };
    });

    setIsImporting(true);
    try {
      const summary = await invoke<ImportPackSummary>('import_skill_pack', {
        selectedSkills: chosenSkills.map(getImportSkillKey),
        targets,
      });

      setImportSummary(summary);
      if (summary.failed > 0) {
        setErrorMessage(
          lang === 'zh'
            ? `导入完成（有失败项）：成功 ${summary.imported} 项，跳过 ${summary.skipped} 项，失败 ${summary.failed} 项`
            : `Import completed with issues: ${summary.imported} imported, ${summary.skipped} skipped, ${summary.failed} failed`
        );
      } else {
        setSuccessMessage(
          lang === 'zh'
            ? `✓ 导入成功！已导入 ${summary.imported} 项技能${summary.skipped > 0 ? `，跳过 ${summary.skipped} 项已存在技能` : ''}`
            : `✓ Import succeeded: ${summary.imported} imported, ${summary.skipped} skipped`
        );
      }

      if (onImportSkills) await onImportSkills();
    } catch (err: any) {
      setErrorMessage(lang === 'zh' ? `导入失败: ${err?.message || err}` : `Import failed: ${err?.message || err}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div data-vault-modal="true" className="w-full max-w-xl bg-[#141722] border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#161926]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-100">{t.vaultTitle}</h3>
              <p className="text-[11px] text-gray-400">{t.vaultSubtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-gray-800 bg-gray-900/50 px-4 pt-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium border-b-2 transition ${
              activeTab === 'export' ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '导出技能包' : 'Export Skill Pack'}</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium border-b-2 transition ${
              activeTab === 'import' ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '导入技能包' : 'Import Skill Pack'}</span>
          </button>
        </div>

        {/* Feedback Banners */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-4 mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start space-x-2 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'export' ? (
            <VaultExportTab
              skills={skills}
              lang={lang}
              selectedExportKeys={selectedExportKeys}
              onToggleKey={toggleKey}
              onToggleGroupAll={toggleGroupAll}
              onSelectAll={selectAll}
              onSelectNone={selectNone}
              exportSummary={exportSummary}
              isExporting={isExporting}
              onExport={handleExport}
              groupedSkills={groupedSkills}
            />
          ) : (
            <VaultImportTab
              lang={lang}
              inspection={inspection}
              isInspecting={isInspecting}
              isImporting={isImporting}
              selectedImportKeys={selectedImportKeys}
              targetEcosystems={targetEcosystems}
              overwriteFlags={overwriteFlags}
              importSummary={importSummary}
              onInspectPack={handleInspectPack}
              onToggleImportKey={toggleImportKey}
              onSelectAllImport={() => setSelectedImportKeys(new Set(inspection?.skills.map(getImportSkillKey) || []))}
              onSelectNoneImport={() => setSelectedImportKeys(new Set())}
              onChangeTargetEcosystem={(k, eco) => setTargetEcosystems({ ...targetEcosystems, [k]: eco })}
              onChangeOverwriteFlag={(k, ow) => setOverwriteFlags({ ...overwriteFlags, [k]: ow })}
              onConfirmImport={handleConfirmImport}
            />
          )}
        </div>

        {/* Footer */}
        <div className="vault-footer p-3 bg-gray-950/60 border-t border-gray-800/80 text-center">
          <p className="text-[10px] text-gray-400">
            🔒 {lang === 'zh' ? '所有技能 100% 留存在您的本地电脑中，备份与导入完全离线，绝不上传到任何第三方云端。' : '100% Local-First. Stored safely on your machine without cloud dependencies.'}
          </p>
        </div>
      </div>
    </div>
  );
};
