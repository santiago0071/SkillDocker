import React, { useState, useMemo } from 'react';
import { SkillMeta, EcosystemTarget } from '../types/index.ts';
import { Language } from '../i18n/index.ts';
import { SkillCrossCompiler, CompiledSkillResult } from '../core/crossCompiler.ts';
import { saveSkillContent } from '../core/clientBridge.ts';
import {
  X,
  Rocket,
  Copy,
  Check,
  FileCode,
  Download,
} from 'lucide-react';

interface SkillShuttleModalProps {
  skill: SkillMeta | null;
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
}

const TARGETS: { id: EcosystemTarget; label: string; icon: string; desc: string }[] = [
  { id: 'cursor', label: 'Cursor Rules', icon: '🎯', desc: '.cursor/rules/<name>.mdc 专属规范' },
  { id: 'claude', label: 'Claude Code', icon: '🟠', desc: '~/.claude/skills/ 与 CLAUDE.md 规范' },
  { id: 'antigravity', label: 'Antigravity', icon: '🟣', desc: 'Google Gemini SKILL.md 官方规范' },
  { id: 'codex', label: 'OpenAI Codex', icon: '🟢', desc: '~/.codex/skills/ 核心技能规范' },
  { id: 'deepseek', label: 'DeepSeek', icon: '🐋', desc: './DEEPSEEK.md 极客实战规范' },
  { id: 'agents', label: 'Open Agents', icon: '🔵', desc: 'Universal Multi-Agent 标准' },
];

export const SkillShuttleModal: React.FC<SkillShuttleModalProps> = ({
  skill,
  isOpen,
  onClose,
  lang = 'zh',
}) => {
  const [activeTarget, setActiveTarget] = useState<EcosystemTarget>('cursor');
  const [copied, setCopied] = useState(false);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);

  const compiled: CompiledSkillResult | null = useMemo(() => {
    if (!skill) return null;
    return SkillCrossCompiler.compile(
      {
        name: skill.name,
        description: skill.description,
        category: skill.category,
        version: skill.version,
        bodyMarkdown: skill.bodyText || skill.rawContent || skill.description,
      },
      activeTarget
    );
  }, [skill, activeTarget]);

  if (!isOpen || !skill || !compiled) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(compiled.compiledContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportOrSave = async () => {
    try {
      // 1. Try native Tauri save if path is provided
      if (skill.rawPath) {
        // Compute target file path based on workspace or current directory
        const savePath = compiled.recommendedPath.replace(/^~\//, '');
        const res = await saveSkillContent(savePath, compiled.compiledContent);
        if (res.success) {
          setSavedStatus(lang === 'zh' ? `✓ 已就地导出至 ${compiled.fileName}` : `✓ Exported to ${compiled.fileName}`);
          setTimeout(() => setSavedStatus(null), 3000);
          return;
        }
      }

      // 2. Fallback to browser blob download
      const blob = new Blob([compiled.compiledContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = compiled.fileName;
      a.click();
      URL.revokeObjectURL(url);
      setSavedStatus(lang === 'zh' ? `✓ 已下载 ${compiled.fileName}` : `✓ Downloaded ${compiled.fileName}`);
      setTimeout(() => setSavedStatus(null), 3000);
    } catch (e: any) {
      console.warn('Export failed', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-[#0d101a] border border-indigo-500/30 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* 1. Header Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#12152a] via-[#181536] to-[#14122d] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30">
              <Rocket className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  {lang === 'zh' ? '🚀 跨生态穿梭机 (Ecosystem Shuttle)' : '🚀 Ecosystem Shuttle Engine'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  AST 智能对齐
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {lang === 'zh'
                  ? `就地将【${skill.name}】转译适配为各大主流 Agent 规范文件`
                  : `Transpile [${skill.name}] directly for any target agent ecosystem.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Target Ecosystem Selector Tabs */}
        <div className="p-4 bg-[#0a0c14] border-b border-white/[0.06] flex items-center space-x-2 overflow-x-auto scrollbar-none">
          {TARGETS.map((t) => {
            const isActive = activeTarget === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTarget(t.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/50'
                    : 'bg-gray-900/80 hover:bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-800'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. Compilation Meta & Path Bar */}
        <div className="px-5 py-3 bg-[#0f121d] border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-gray-300">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-white">{compiled.badge}</span>
            <span className="text-gray-500">➔</span>
            <span className="font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {compiled.recommendedPath}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {savedStatus && (
              <span className="text-emerald-400 font-semibold text-xs animate-in fade-in">
                {savedStatus}
              </span>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (lang === 'zh' ? '已复制！' : 'Copied!') : (lang === 'zh' ? '一键复制' : 'Copy Content')}</span>
            </button>

            <button
              type="button"
              onClick={handleExportOrSave}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '导出/生成文件' : 'Export File'}</span>
            </button>
          </div>
        </div>

        {/* 4. Transpiled Content Preview (Code View) */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#08090f] font-mono text-xs text-gray-300 leading-relaxed">
          <pre className="p-4 rounded-xl bg-[#0c0e17] border border-white/[0.06] overflow-x-auto select-text whitespace-pre-wrap">
            {compiled.compiledContent}
          </pre>
        </div>

        {/* 5. Pro Feature Teaser Footer */}
        <div className="p-3 bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-gray-900 border-t border-purple-500/20 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
              PRO
            </span>
            <span>
              {lang === 'zh'
                ? '双向热镜像同步 (Live Bi-Directional Mirroring)：支持在 Cursor 中直接保存，毫秒级无感同步回 SkillDocker'
                : 'Live Bi-Directional Mirroring: Save in Cursor, auto-sync back to SkillDocker seamlessly.'}
            </span>
          </div>

          <span className="text-[10px] text-purple-400 font-mono">
            {lang === 'zh' ? '内测预留中' : 'Beta Reserved'}
          </span>
        </div>
      </div>
    </div>
  );
};
