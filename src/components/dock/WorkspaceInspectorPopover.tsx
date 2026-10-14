import React from 'react';
import { WorkspaceState } from '../../types/index.ts';
import { Language } from '../../i18n/index.ts';
import { openWorkspaceInExplorerNative } from '../../core/clientBridge.ts';
import { FolderGit2, FolderOpen, RefreshCw, X } from 'lucide-react';
import type { ActiveView } from './types.ts';

interface WorkspaceInspectorPopoverProps {
  workspace: WorkspaceState;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onRefresh: () => void;
  setActiveEcosystemFilter: (eco: 'all' | 'antigravity' | 'claude' | 'codex' | 'agents') => void;
  setActiveView: (view: ActiveView) => void;
}

export const WorkspaceInspectorPopover: React.FC<WorkspaceInspectorPopoverProps> = ({
  workspace,
  isOpen,
  onClose,
  lang,
  onRefresh,
  setActiveEcosystemFilter,
  setActiveView,
}) => {
  if (!isOpen) return null;

  return (
    <div
      data-workspace-popover="true"
      className="workspace-popover absolute left-0 mt-2 w-80 rounded-2xl glass-panel p-4 shadow-2xl border border-indigo-500/30 z-50 animate-in fade-in zoom-in-95 duration-150 text-left"
    >
      {/* Header: Workspace info */}
      <div className="workspace-popover-header flex items-start justify-between pb-3 border-b border-white/[0.08]">
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center space-x-1.5">
            <FolderGit2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <h4 className="text-xs font-bold text-gray-100 truncate">
              {workspace.workspaceName}
            </h4>
          </div>
          <p
            className="text-[11px] text-gray-400 font-mono truncate mt-0.5"
            title={workspace.currentPath || '.'}
          >
            {workspace.currentPath || './'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Action: Open Workspace in Windows Explorer */}
      <div className="py-2.5">
        <button
          type="button"
          onClick={async () => {
            await openWorkspaceInExplorerNative(workspace.currentPath);
          }}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition cursor-pointer shadow-sm"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>{lang === 'zh' ? '在系统文件资源管理器中打开' : 'Open in File Explorer'}</span>
        </button>
      </div>

      {/* Multi-Ecosystem Radar Distribution */}
      <div className="pt-2 border-t border-white/[0.08]">
        <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium mb-2">
          <span className="radar-title">{lang === 'zh' ? '全生态技能资产分布' : 'Ecosystem Asset Radar'}</span>
          <span className="radar-count-total font-mono text-indigo-400 font-semibold">
            {workspace.activeSkills.length} Total
          </span>
        </div>

        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveEcosystemFilter('antigravity');
              setActiveView('all-skills');
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-purple-950/20 hover:bg-purple-900/30 border border-purple-500/20 text-xs transition cursor-pointer text-left"
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm">🟣</span>
              <span className="text-gray-200">Antigravity (Gemini)</span>
            </div>
            <span className="font-mono text-purple-300 font-semibold">
              {workspace.activeSkills.filter((s) => s.ecosystem === 'antigravity').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveEcosystemFilter('claude');
              setActiveView('all-skills');
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-orange-950/20 hover:bg-orange-900/30 border border-orange-500/20 text-xs transition cursor-pointer text-left"
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm">🟠</span>
              <span className="text-gray-200">Claude Code</span>
            </div>
            <span className="font-mono text-orange-300 font-semibold">
              {workspace.activeSkills.filter((s) => s.ecosystem === 'claude').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveEcosystemFilter('codex');
              setActiveView('all-skills');
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-500/20 text-xs transition cursor-pointer text-left"
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm">🟢</span>
              <span className="text-gray-200">OpenAI Codex</span>
            </div>
            <span className="font-mono text-emerald-300 font-semibold">
              {workspace.activeSkills.filter((s) => s.ecosystem === 'codex').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveEcosystemFilter('agents');
              setActiveView('all-skills');
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-blue-950/20 hover:bg-blue-900/30 border border-blue-500/20 text-xs transition cursor-pointer text-left"
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm">🔵</span>
              <span className="text-gray-200">Open Agents</span>
            </div>
            <span className="font-mono text-blue-300 font-semibold">
              {workspace.activeSkills.filter((s) => s.ecosystem === 'agents').length}
            </span>
          </button>
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            onRefresh();
            onClose();
          }}
          className="flex items-center space-x-1.5 text-xs text-gray-400 hover:text-indigo-300 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{lang === 'zh' ? '重新扫描全生态资产' : 'Rescan All Assets'}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveEcosystemFilter('all');
            setActiveView('all-skills');
            onClose();
          }}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
        >
          {lang === 'zh' ? '查看全部' : 'View All'}
        </button>
      </div>
    </div>
  );
};
