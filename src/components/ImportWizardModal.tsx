import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Language } from '../i18n/index.ts';
import { SkillMeta } from '../types/index.ts';
import {
  discoverRuleSources,
  listAuthorizedWorkspaces,
  pickAndRegisterWorkspaceNative,
  createSkillNative,
} from '../core/clientBridge.ts';
import {
  RuleSource,
  ParsedSource,
  ImportMode,
  PlannedSkill,
  TOOL_LABELS,
  parseSource,
  analyzeSections,
  buildImportPlan,
  summarize,
} from '../core/ruleImporter.ts';
import {
  X,
  FolderSearch,
  FolderPlus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Layers,
  FileText,
  Download,
  Loader2,
} from 'lucide-react';

export const IMPORT_WIZARD_SEEN_KEY = 'skilldock_import_wizard_seen';

type Step = 'scan' | 'review' | 'importing' | 'done';
type TargetHub = 'agents' | 'claude' | 'antigravity' | 'codex';

const HUB_OPTIONS: { value: TargetHub; label: string; path: string }[] = [
  { value: 'agents', label: 'Universal hub', path: '~/.agents/skills' },
  { value: 'claude', label: 'Claude Code', path: '~/.claude/skills' },
  { value: 'antigravity', label: 'Antigravity', path: '~/.gemini/config/skills' },
  { value: 'codex', label: 'Codex', path: '~/.codex/skills' },
];

interface ImportResult {
  name: string;
  ok: boolean;
  error?: string;
}

interface ImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
  existingSkills: SkillMeta[];
  lang?: Language;
}

export const ImportWizardModal: React.FC<ImportWizardModalProps> = ({
  isOpen,
  onClose,
  onImported,
  existingSkills,
  lang = 'zh',
}) => {
  const zh = lang === 'zh';
  const [step, setStep] = useState<Step>('scan');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<string[]>([]);
  const [parsed, setParsed] = useState<ParsedSource[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<ImportMode>('file');
  const [hub, setHub] = useState<TargetHub>('agents');
  const [results, setResults] = useState<ImportResult[]>([]);
  const [progress, setProgress] = useState(0);

  const runScan = useCallback(async () => {
    setScanning(true);
    setScanError(null);
    const [wsList, res] = await Promise.all([listAuthorizedWorkspaces(), discoverRuleSources()]);
    setWorkspaces(wsList);
    if (!res.success) {
      setScanError(res.error || 'Scan failed');
      setParsed([]);
    } else {
      const nextParsed = res.sources.map((s: RuleSource) => parseSource(s)).filter((p) => p.sections.length > 0);
      setParsed(nextParsed);
      setSelected(new Set(nextParsed.map((p) => p.source.path)));
    }
    setScanning(false);
    setStep('review');
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setStep('scan');
    setResults([]);
    setProgress(0);
    runScan();
  }, [isOpen, runScan]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 'importing') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, step]);

  const analysis = useMemo(
    () => analyzeSections(parsed, existingSkills.map((s) => s.bodyText || s.rawContent || '').filter(Boolean)),
    [parsed, existingSkills]
  );
  const stats = useMemo(() => summarize(parsed, analysis, selected), [parsed, analysis, selected]);
  const plan: PlannedSkill[] = useMemo(
    () => buildImportPlan(parsed, analysis, mode, selected, existingSkills.map((s) => s.name)),
    [parsed, analysis, mode, selected, existingSkills]
  );

  if (!isOpen) return null;

  const toggleSource = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleImport = async () => {
    setStep('importing');
    const out: ImportResult[] = [];
    for (let i = 0; i < plan.length; i++) {
      const item = plan[i];
      const res = await createSkillNative({
        name: item.name,
        category: 'custom',
        description: item.description,
        bodyText: item.bodyText,
        ecosystem: hub,
      });
      out.push({ name: item.name, ok: res.success, error: res.error });
      setProgress(i + 1);
    }
    setResults(out);
    setStep('done');
    try {
      localStorage.setItem(IMPORT_WIZARD_SEEN_KEY, '1');
    } catch {
      // ignore
    }
    onImported();
  };

  const handleClose = () => {
    try {
      localStorage.setItem(IMPORT_WIZARD_SEEN_KEY, '1');
    } catch {
      // ignore
    }
    onClose();
  };

  const duplicateCount = (p: ParsedSource) =>
    p.sections.filter((s) => (analysis.groups.get(s.hash)?.length || 0) > 1 || analysis.existingHashes.has(s.hash))
      .length;

  const hubInfo = HUB_OPTIONS.find((h) => h.value === hub)!;
  const okCount = results.filter((r) => r.ok).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-[#0d101a] border border-indigo-500/30 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#12152a] via-[#181536] to-[#14122d] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex-shrink-0">
              <FolderSearch className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-white tracking-tight truncate">
                {zh ? '导入现有规则' : 'Import Existing Rules'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {zh
                  ? '找出散落在各个 AI 工具里的规则文件，去重后合并进技能库。原文件不会被修改。'
                  : 'Find rule files scattered across your AI tools, dedupe them, and merge them into your skill library. Original files are never modified.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={step === 'importing'}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 flex-shrink-0"
            aria-label={zh ? '关闭' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Global Skills Status */}
          {(step === 'scan' || step === 'review') && existingSkills.length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="truncate">
                  {zh
                    ? `已自动识别并载入 ${existingSkills.length} 个全局技能（Claude / Gemini / Antigravity）`
                    : `Automatically detected and loaded ${existingSkills.length} global skills`}
                </span>
              </div>
              <span className="text-[10px] text-emerald-400/80 uppercase font-semibold tracking-wider flex-shrink-0 ml-2">
                {zh ? '技能库就绪' : 'Ready'}
              </span>
            </div>
          )}

          {/* Workspaces */}
          {(step === 'scan' || step === 'review') && (
            <section className="space-y-2">
              <div className="text-[11px] font-bold text-gray-300 uppercase tracking-wide">
                {zh ? '扫描范围' : 'Scan scope'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-gray-300 font-mono">~ (home)</span>
                {workspaces.map((w) => (
                  <span key={w} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-gray-300 font-mono truncate max-w-[260px]" title={w}>
                    {w}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const picked = await pickAndRegisterWorkspaceNative();
                    if (picked) await runScan();
                  }}
                  disabled={scanning}
                  className="px-3 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 hover:bg-indigo-500/30 disabled:opacity-40 flex items-center space-x-1.5 cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>{zh ? '选择文件夹并扫描' : 'Pick folder & scan'}</span>
                </button>
                <button
                  onClick={runScan}
                  disabled={scanning}
                  className="px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 disabled:opacity-40 cursor-pointer"
                  title={zh ? '重新扫描' : 'Rescan'}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </section>
          )}

          {scanning && (
            <div className="flex items-center justify-center py-10 text-gray-400 space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{zh ? '正在扫描规则文件…' : 'Scanning for rule files…'}</span>
            </div>
          )}

          {!scanning && step === 'review' && scanError && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{scanError}</span>
            </div>
          )}

          {!scanning && step === 'review' && !scanError && parsed.length === 0 && (
            <div className="py-6 text-center text-gray-400 space-y-2">
              <div className="text-sm font-semibold text-gray-200">
                {existingSkills.length > 0
                  ? (zh ? '全局技能库已就绪，是否补充项目规则？' : 'Global skills ready. Need extra project rules?')
                  : (zh ? '未检测到项目规则文件' : 'No rule files found')}
              </div>
              <div className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                {zh
                  ? '当前扫描范围内未发现额外的项目规则文件。如您在具体工程中写过 CLAUDE.md、AGENTS.md 或 .cursorrules，可点击上方【选择文件夹并扫描】补充导入；若无需补充，直接进入技能库即可。'
                  : 'No extra project rule files found in current scan scope. If you have custom CLAUDE.md, AGENTS.md, or .cursorrules in project folders, pick them above to import; otherwise continue to library.'}
              </div>
            </div>
          )}

          {!scanning && step === 'review' && parsed.length > 0 && (
            <>
              {/* Summary */}
              <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: zh ? '规则章节' : 'Sections', value: stats.total, cls: 'text-gray-200' },
                  { label: zh ? '将导入' : 'To import', value: stats.unique, cls: 'text-emerald-300' },
                  { label: zh ? '跨文件重复' : 'Duplicates', value: stats.duplicates, cls: 'text-amber-300' },
                  { label: zh ? '技能库已有' : 'Already in library', value: stats.alreadyInLibrary, cls: 'text-gray-400' },
                ].map((c) => (
                  <div key={c.label} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className={`text-lg font-extrabold ${c.cls}`}>{c.value}</div>
                    <div className="text-[10px] text-gray-500">{c.label}</div>
                  </div>
                ))}
              </section>

              {/* Sources */}
              <section className="space-y-1.5">
                <div className="text-[11px] font-bold text-gray-300 uppercase tracking-wide">
                  {zh ? `找到 ${parsed.length} 个规则文件` : `Found ${parsed.length} rule files`}
                </div>
                {parsed.map((p) => {
                  const dup = duplicateCount(p);
                  const checked = selected.has(p.source.path);
                  return (
                    <label
                      key={p.source.path}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        checked ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/[0.02] border-white/10 opacity-60'
                      }`}
                    >
                      <input type="checkbox" checked={checked} onChange={() => toggleSource(p.source.path)} className="accent-indigo-500" />
                      <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-gray-200 truncate" title={p.source.path}>
                          {p.source.relativePath}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">
                          {TOOL_LABELS[p.source.tool] || p.source.tool} ·{' '}
                          {p.source.scope === 'global' ? (zh ? '全局' : 'global') : p.source.workspace}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400 text-[10px]">
                          {p.sections.length} {zh ? '节' : 'sec'}
                        </span>
                        {dup > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] flex items-center gap-1">
                            <Copy className="w-2.5 h-2.5" />
                            {dup}
                          </span>
                        )}
                        {p.source.truncated && (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 text-[10px]" title={zh ? '文件超过 512KB，只读取了前 512KB' : 'File over 512KB; only the first 512KB was read'}>
                            {zh ? '已截断' : 'truncated'}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </section>

              {/* Options */}
              <section className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-gray-300 uppercase tracking-wide">{zh ? '拆分方式' : 'Split mode'}</div>
                  <div className="flex gap-1.5">
                    {([
                      { v: 'file', icon: <FileText className="w-3.5 h-3.5" />, zh: '每个文件一个技能', en: 'One skill per file' },
                      { v: 'section', icon: <Layers className="w-3.5 h-3.5" />, zh: '每个章节一个技能', en: 'One skill per section' },
                    ] as const).map((o) => (
                      <button
                        key={o.v}
                        onClick={() => setMode(o.v)}
                        className={`flex-1 px-2.5 py-2 rounded-lg border flex items-center justify-center gap-1.5 ${
                          mode === o.v ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {o.icon}
                        <span>{zh ? o.zh : o.en}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-gray-300 uppercase tracking-wide">{zh ? '导入到' : 'Import into'}</div>
                  <select
                    value={hub}
                    onChange={(e) => setHub(e.target.value as TargetHub)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-gray-200 outline-none focus:border-indigo-500/60"
                  >
                    {HUB_OPTIONS.map((h) => (
                      <option key={h.value} value={h.value}>
                        {h.label} ({h.path})
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              {/* Plan preview */}
              <section className="space-y-1.5">
                <div className="text-[11px] font-bold text-gray-300 uppercase tracking-wide">
                  {zh ? `将创建 ${plan.length} 个技能` : `Will create ${plan.length} skills`}
                </div>
                {plan.length === 0 ? (
                  <div className="text-gray-500">
                    {zh ? '所选文件里的规则都已经在技能库中了。' : 'Every rule in the selected files is already in your library.'}
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-white/10 divide-y divide-white/5">
                    {plan.map((item) => (
                      <div key={item.name} className="px-3 py-1.5 flex items-center gap-2">
                        <span className="font-mono text-emerald-300 truncate">{item.name}</span>
                        <span className="text-gray-500 truncate flex-1">{item.description}</span>
                        <span className="text-gray-600 text-[10px] flex-shrink-0">
                          {item.sectionCount} {zh ? '节' : 'sec'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {step === 'importing' && (
            <div className="py-10 flex flex-col items-center gap-3 text-gray-300">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <div>
                {zh ? '正在导入' : 'Importing'} {progress}/{plan.length}
              </div>
              <div className="w-64 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all" style={{ width: `${plan.length ? (progress / plan.length) * 100 : 0}%` }} />
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  {zh
                    ? `已导入 ${okCount}/${results.length} 个技能到 ${hubInfo.path}。原规则文件未做任何修改。`
                    : `Imported ${okCount}/${results.length} skills into ${hubInfo.path}. Your original rule files were not modified.`}
                </span>
              </div>
              {results.some((r) => !r.ok) && (
                <div className="rounded-lg border border-red-800/50 divide-y divide-red-900/40">
                  {results
                    .filter((r) => !r.ok)
                    .map((r) => (
                      <div key={r.name} className="px-3 py-1.5 text-red-300">
                        <span className="font-mono">{r.name}</span>: {r.error}
                      </div>
                    ))}
                </div>
              )}
              <div className="text-gray-500">
                {zh
                  ? '下一步：在任意技能上点击 🚀，把它一键转译到其他工具。'
                  : 'Next: click 🚀 on any skill to compile it for your other tools.'}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-white/[0.08] flex items-center justify-between gap-2">
          <button
            onClick={handleClose}
            disabled={step === 'importing'}
            className={`px-3 py-2 rounded-lg text-xs transition-colors disabled:opacity-30 ${
              step === 'review' && plan.length === 0 && existingSkills.length > 0
                ? 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 font-medium'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {step === 'done'
              ? (zh ? '完成' : 'Done')
              : step === 'review' && plan.length === 0 && existingSkills.length > 0
              ? (zh ? `直接进入技能库 (${existingSkills.length} 个技能已就绪)` : `Enter Library (${existingSkills.length} ready)`)
              : (zh ? '稍后再说' : 'Maybe later')}
          </button>
          {step === 'review' && (
            <button
              onClick={handleImport}
              disabled={plan.length === 0 || scanning}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500/80 to-cyan-500/80 hover:from-emerald-500 hover:to-cyan-500 text-white disabled:opacity-40 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{zh ? `导入 ${plan.length} 个技能` : `Import ${plan.length} skills`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
