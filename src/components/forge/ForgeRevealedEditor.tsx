import React from 'react';
import { Copy, Eye, Columns, Code } from 'lucide-react';
import { EcosystemTarget } from '../../types/index.ts';

export interface ForgeRevealedEditorProps {
  lang: 'zh' | 'en';
  isFineTuning: boolean;
  skillName: string;
  setSkillName: (name: string) => void;
  skillCategory: string;
  setSkillCategory: (category: string) => void;
  skillVersion: string;
  setSkillVersion: (version: string) => void;
  skillDescription: string;
  setSkillDescription: (desc: string) => void;
  deployEcosystem: 'antigravity' | 'claude' | 'codex' | 'agents' | 'all';
  setDeployEcosystem: (eco: 'antigravity' | 'claude' | 'codex' | 'agents' | 'all') => void;
  activeFormatTarget: EcosystemTarget;
  setActiveFormatTarget: (target: EcosystemTarget) => void;
  handleCopyCurrentCompiled: () => void;
  viewMode: 'reader' | 'split' | 'editor';
  setViewMode: (mode: 'reader' | 'split' | 'editor') => void;
  forgeSplitContainerRef: React.RefObject<HTMLDivElement | null>;
  forgeSplitRatio: number;
  skillBodyMarkdown: string;
  setSkillBodyMarkdown: (md: string) => void;
  currentCompiled: { fileName: string; compiledContent: string };
  handleForgeSplitResizeStart: (e: React.MouseEvent) => void;
  handleForgeSplitReset: () => void;
  renderedHtml: string;
}

export const ForgeRevealedEditor: React.FC<ForgeRevealedEditorProps> = ({
  lang,
  isFineTuning,
  skillName,
  setSkillName,
  skillCategory,
  setSkillCategory,
  skillVersion,
  setSkillVersion,
  skillDescription,
  setSkillDescription,
  deployEcosystem,
  setDeployEcosystem,
  activeFormatTarget,
  setActiveFormatTarget,
  handleCopyCurrentCompiled,
  viewMode,
  setViewMode,
  forgeSplitContainerRef,
  forgeSplitRatio,
  skillBodyMarkdown,
  setSkillBodyMarkdown,
  currentCompiled,
  handleForgeSplitResizeStart,
  handleForgeSplitReset,
  renderedHtml,
}) => {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Optional Fine-tuning Drawer on Left if toggled */}
      {isFineTuning && (
        <div className="w-80 bg-[#0d0f19] border-r border-gray-800 p-4 overflow-y-auto space-y-3 flex-shrink-0 animate-in slide-in-from-left-2 duration-150">
          <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
            {lang === 'zh' ? '✏️ 微调元数据' : 'Fine-tune Metadata'}
          </span>

          <div>
            <label className="text-[10px] text-gray-400 font-mono block mb-1">NAME</label>
            <input
              type="text"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              className="w-full bg-[#08090f] border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-indigo-300 font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-400 block mb-1">CATEGORY</label>
            <select
              value={skillCategory}
              onChange={(e) => setSkillCategory(e.target.value)}
              className="w-full bg-[#08090f] border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-gray-200 capitalize focus:outline-none focus:border-purple-500"
            >
              <option value="safety">{lang === 'zh' ? 'Safety (安全)' : 'Safety'}</option>
              <option value="workflow">{lang === 'zh' ? 'Workflow (工作流)' : 'Workflow'}</option>
              <option value="architecture">{lang === 'zh' ? 'Architecture (架构)' : 'Architecture'}</option>
              <option value="custom">{lang === 'zh' ? 'Custom (定制)' : 'Custom'}</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 font-mono block mb-1">VERSION</label>
            <input
              type="text"
              value={skillVersion}
              onChange={(e) => setSkillVersion(e.target.value)}
              className="w-full bg-[#08090f] border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-emerald-300 font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-400 block mb-1">
              {lang === 'zh' ? 'DESCRIPTION (触发边界)' : 'DESCRIPTION (Trigger & Scope)'}
            </label>
            <textarea
              value={skillDescription}
              onChange={(e) => setSkillDescription(e.target.value)}
              rows={4}
              className="w-full bg-[#08090f] border border-gray-700 rounded-lg p-2 text-xs text-gray-200 leading-relaxed focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="pt-2">
            <span className="text-[10px] text-gray-400 block mb-1">
              {lang === 'zh' ? '全局挂载目标生态' : 'Global Hub Ecosystem'}
            </span>
            <select
              value={deployEcosystem}
              onChange={(e) => setDeployEcosystem(e.target.value as any)}
              className="w-full bg-[#08090f] border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-purple-200 focus:outline-none focus:border-purple-500"
            >
              <option value="antigravity">🟣 Google Antigravity</option>
              <option value="claude">🟠 Claude Code</option>
              <option value="codex">🟢 OpenAI Codex</option>
              <option value="agents">🔵 Open Agents</option>
              <option value="all">{lang === 'zh' ? '🌐 一键全生态同步部署' : '🌐 Universal All-Ecosystem Deploy'}</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Document Viewer & Cross-Ecosystem Tabs */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#090b12]">
        {/* Sub-header: Cross-Ecosystem Switcher Tabs & View Modes */}
        <div className="px-5 py-2 bg-[#0d0f19] border-b border-gray-800/80 flex items-center justify-between text-xs flex-wrap gap-2">
          {/* Format Switching Tabs */}
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className="text-[11px] text-gray-400 font-medium mr-1 flex items-center space-x-1">
              <span>{lang === 'zh' ? '🚀 目标转译预览:' : '🚀 Target Format Preview:'}</span>
            </span>

            <button
              type="button"
              onClick={() => setActiveFormatTarget('antigravity')}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-1 border ${
                activeFormatTarget === 'antigravity'
                  ? 'bg-purple-600/20 text-purple-200 border-purple-500/50 shadow-sm'
                  : 'bg-gray-900/60 text-gray-400 hover:text-gray-200 border-gray-800'
              }`}
            >
              <span>🟣 SKILL.md (Antigravity)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFormatTarget('claude')}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-1 border ${
                activeFormatTarget === 'claude'
                  ? 'bg-amber-600/20 text-amber-200 border-amber-500/50 shadow-sm'
                  : 'bg-gray-900/60 text-gray-400 hover:text-gray-200 border-gray-800'
              }`}
            >
              <span>🟠 CLAUDE.md (Claude Code)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFormatTarget('cursor')}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-1 border ${
                activeFormatTarget === 'cursor'
                  ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500/50 shadow-sm'
                  : 'bg-gray-900/60 text-gray-400 hover:text-gray-200 border-gray-800'
              }`}
            >
              <span>🪟 .cursorrules (Cursor)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFormatTarget('codex')}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-1 border ${
                activeFormatTarget === 'codex'
                  ? 'bg-emerald-600/20 text-emerald-200 border-emerald-500/50 shadow-sm'
                  : 'bg-gray-900/60 text-gray-400 hover:text-gray-200 border-gray-800'
              }`}
            >
              <span>🟢 Codex</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFormatTarget('deepseek')}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer flex items-center space-x-1 border ${
                activeFormatTarget === 'deepseek'
                  ? 'bg-blue-600/20 text-blue-200 border-blue-500/50 shadow-sm'
                  : 'bg-gray-900/60 text-gray-400 hover:text-gray-200 border-gray-800'
              }`}
            >
              <span>🐋 DeepSeek</span>
            </button>

            {/* Copy Active Format */}
            <button
              type="button"
              onClick={handleCopyCurrentCompiled}
              className="ml-1 p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition cursor-pointer"
              title={lang === 'zh' ? '复制当前转译格式到剪贴板' : 'Copy active format to clipboard'}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* View Modes */}
          <div className="flex items-center bg-gray-900 p-0.5 rounded-xl border border-gray-800">
            <button
              type="button"
              onClick={() => setViewMode('reader')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'reader' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>{lang === 'zh' ? '沉浸阅读' : 'Reader'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'split' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Columns className="w-3 h-3" />
              <span>{lang === 'zh' ? '双栏对照' : 'Split'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'editor' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>{lang === 'zh' ? '源码编辑' : 'Source'}</span>
            </button>
          </div>
        </div>

        {/* Content Panes */}
        <div ref={forgeSplitContainerRef} className="flex-1 flex overflow-hidden">
          {/* Markdown Source */}
          {(viewMode === 'editor' || viewMode === 'split') && (
            <div
              style={viewMode === 'split' ? { width: `${forgeSplitRatio}%` } : undefined}
              className={`flex flex-col h-full ${viewMode === 'split' ? '' : 'flex-1'}`}
            >
              <div className="px-4 py-1.5 bg-[#0a0c16] border-b border-gray-800/60 text-[10px] text-gray-400 font-mono flex items-center justify-between">
                <span>{activeFormatTarget === 'antigravity' ? (lang === 'zh' ? 'SKILL.md (标准正文)' : 'SKILL.md (Standard Body)') : currentCompiled.fileName}</span>
                <span className="text-gray-500">
                  {activeFormatTarget === 'antigravity' ? (lang === 'zh' ? '可直接在此编辑修正' : 'Directly editable') : (lang === 'zh' ? '已转译原生格式' : 'Compiled format')}
                </span>
              </div>
              <textarea
                value={
                  activeFormatTarget === 'antigravity'
                    ? skillBodyMarkdown
                    : currentCompiled.compiledContent
                }
                onChange={(e) => {
                  if (activeFormatTarget === 'antigravity') {
                    setSkillBodyMarkdown(e.target.value);
                  }
                }}
                readOnly={activeFormatTarget !== 'antigravity'}
                className="flex-1 p-5 bg-transparent text-gray-200 font-mono text-xs leading-relaxed resize-none focus:outline-none selection:bg-purple-500/30"
              />
            </div>
          )}

          {/* Resizable Divider between Source & Preview in Split Mode */}
          {viewMode === 'split' && (
            <div
              onMouseDown={handleForgeSplitResizeStart}
              onDoubleClick={handleForgeSplitReset}
              className="resizer-bar-vertical"
              title={
                lang === 'zh'
                  ? '↔ 拖拽调整双栏比例 (双击恢复 50:50)'
                  : '↔ Drag to adjust split ratio (Double click to reset)'
              }
            />
          )}

          {/* Rendered Preview */}
          {(viewMode === 'reader' || viewMode === 'split') && (
            <div
              style={viewMode === 'split' ? { width: `${100 - forgeSplitRatio}%` } : undefined}
              className={`overflow-y-auto p-6 sm:p-8 bg-[#07090f]/60 prose prose-invert prose-indigo max-w-none text-xs leading-relaxed ${viewMode === 'split' ? '' : 'flex-1'}`}
            >
              <div
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
                className="space-y-3"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
