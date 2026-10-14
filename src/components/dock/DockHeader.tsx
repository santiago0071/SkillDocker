import React from 'react';
import { WorkspaceState } from '../../types/index.ts';
import { AiConfig } from '../../core/aiClient.ts';
import { Language } from '../../i18n/index.ts';
import {
  FolderGit2,
  Archive,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Keyboard,
  ChevronDown,
  Moon,
  Sun,
  Monitor,
  FolderInput,
} from 'lucide-react';
import { WorkspaceInspectorPopover } from './WorkspaceInspectorPopover.tsx';
import type { ActiveView } from './types.ts';

interface DockHeaderProps {
  theme?: 'dark' | 'light' | 'retro-win95';
  workspace: WorkspaceState;
  lang: Language;
  onToggleLang: () => void;
  onToggleTheme?: () => void;
  onSelectTheme?: (theme: 'dark' | 'light' | 'retro-win95') => void;
  onOpenImportWizard?: () => void;
  onRefresh: () => void;
  isWorkspaceMenuOpen: boolean;
  setIsWorkspaceMenuOpen: (open: boolean) => void;
  workspaceMenuRef: React.RefObject<HTMLDivElement | null>;
  setActiveRetroMenu: (menu: any) => void;
  setActiveEcosystemFilter: (filter: 'all' | 'antigravity' | 'claude' | 'codex' | 'agents') => void;
  setActiveView: (view: ActiveView) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  setIsShortcutsHelpOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsVaultOpen: (open: boolean) => void;
  aiConfig: AiConfig;
  t: Record<string, string>;
}

export const DockHeader: React.FC<DockHeaderProps> = ({
  theme = 'dark',
  workspace,
  lang,
  onToggleLang,
  onToggleTheme,
  onSelectTheme,
  onOpenImportWizard,
  onRefresh,
  isWorkspaceMenuOpen,
  setIsWorkspaceMenuOpen,
  workspaceMenuRef,
  setActiveRetroMenu,
  setActiveEcosystemFilter,
  setActiveView,
  searchQuery,
  setSearchQuery,
  searchInputRef,
  setIsShortcutsHelpOpen,
  setIsSettingsOpen,
  setIsVaultOpen,
  aiConfig,
  t,
}) => {
  return (
    <header className={`h-14 px-5 bg-[#0e111a]/95 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between flex-shrink-0 relative ${isWorkspaceMenuOpen ? 'z-50' : 'z-40'}`}>
      {/* Left: Brand, Ecosystem & Workspace */}
      <div className="flex items-center space-x-2.5 min-w-0 flex-shrink-0">
        {theme === 'retro-win95' ? (
          <div className="brand-title-win95 flex items-center space-x-2 select-none">
            {/* Classic Windows 4-color Pixel Flag */}
            <div className="grid grid-cols-2 gap-[1.5px] w-5 h-5 p-[1.5px] bg-black border border-[#808080] shadow-[1px_1px_0px_#ffffff] rotate-[-5deg]">
              <div className="bg-[#e81123]" />
              <div className="bg-[#00a4ef]" />
              <div className="bg-[#7fba00]" />
              <div className="bg-[#ffb900]" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-extrabold text-base tracking-tight text-white font-sans" style={{ textShadow: '1px 1px 0 #000000' }}>
                SkillDocker 98
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-[#000080] text-white border border-[#ffffff] shadow-[1px_1px_0_#000000]" title="Microsoft Windows 98 Second Edition (Active Desktop)">
                Second Edition
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="text-xl">🛸</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-extrabold text-base tracking-tight brand-title-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                SkillDocker
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 brand-badge-pro">
                Studio Pro
              </span>
            </div>
          </div>
        )}

        <div className="h-4 w-[1px] bg-slate-300 dark:bg-white/[0.1] hidden sm:block header-divider" />

        {/* Active Ecosystem & Workspace Interactive Pill + Popover Inspector */}
        <div className="relative hidden sm:block flex-shrink-0" ref={workspaceMenuRef as any}>
          <button
            type="button"
            onClick={() => {
              setActiveRetroMenu(null);
              setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen);
            }}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs transition cursor-pointer border ${
              isWorkspaceMenuOpen
                ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-sm shadow-indigo-500/20'
                : 'bg-gray-900/80 border-white/[0.08] text-gray-300 hover:border-indigo-500/40 hover:text-white'
            }`}
            title={
              lang === 'zh'
                ? `当前工作区: ${workspace.workspaceName} (点击展开全生态雷达与路径详情)`
                : `Current Workspace: ${workspace.workspaceName} (Click to inspect ecosystem radar & path)`
            }
          >
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span className="font-semibold text-gray-200 truncate max-w-[100px]">
              {workspace.workspaceName}
            </span>
            <span className="text-[10px] text-indigo-300 font-mono bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20 whitespace-nowrap">
              {lang === 'zh' ? `${workspace.activeSkills.length}项` : `${workspace.activeSkills.length}`}
            </span>
            <ChevronDown
              className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                isWorkspaceMenuOpen ? 'rotate-180 text-indigo-400' : ''
              }`}
            />
          </button>

          <WorkspaceInspectorPopover
            workspace={workspace}
            isOpen={isWorkspaceMenuOpen}
            onClose={() => setIsWorkspaceMenuOpen(false)}
            lang={lang}
            onRefresh={onRefresh}
            setActiveEcosystemFilter={setActiveEcosystemFilter}
            setActiveView={setActiveView}
          />
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 min-w-[160px] max-w-sm mx-2.5">
        <div className="relative flex items-center w-full">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef as any}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'zh' ? '搜索全生态技能 (Ctrl+K)...' : 'Search skills (Ctrl+K)...'}
            className="w-full pl-8 pr-14 py-1 bg-[#121522] border border-white/[0.08] rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
          />
          <div className="absolute right-2 flex items-center space-x-1 pointer-events-none">
            <kbd className="px-1.5 py-0.2 text-[9px] font-mono font-semibold bg-gray-800 text-gray-400 border border-gray-700 rounded shadow-inner">
              Ctrl K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Actions (AI Model, Vault, Shortcuts, Settings, Language, Refresh) */}
      <div className="flex items-center space-x-1.5 flex-shrink-0">
        {/* Shortcuts HUD */}
        <button
          type="button"
          onClick={() => setIsShortcutsHelpOpen(true)}
          className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent hover:border-gray-700 transition cursor-pointer"
          title={lang === 'zh' ? '快捷键指南 (F1)' : 'Keyboard Shortcuts (F1)'}
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>

        {/* Active BYOK Model Pill */}
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 border border-purple-500/30 text-xs font-medium transition cursor-pointer"
          title={lang === 'zh' ? '点击配置大模型与凭证 (BYOK)' : 'Configure AI Models & Credentials (BYOK)'}
        >
          <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
          <span className="font-mono text-[10px] uppercase font-bold text-purple-300">
            {aiConfig.activeProvider}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
        </button>

        {/* Backup Button: Renamed to "备份" */}
        <button
          type="button"
          onClick={() => setIsVaultOpen(true)}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition cursor-pointer"
          title={lang === 'zh' ? '本地技能备份与快照存储 (Alt+V)' : 'Local Skills Backup (Alt+V)'}
        >
          <Archive className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{t.vaultBtn}</span>
        </button>

        {/* Settings Modal */}
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent hover:border-gray-700 transition cursor-pointer"
          title={t.settingsBtn}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Segmented Language Switcher: [ 中文 | EN ] */}
        <div className="flex items-center bg-gray-900/90 border border-white/[0.08] rounded-xl p-0.5 text-xs select-none">
          <button
            type="button"
            onClick={() => { if (lang !== 'zh') onToggleLang(); }}
            className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              lang === 'zh'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="切换为中文界面"
          >
            中文
          </button>
          <button
            type="button"
            onClick={() => { if (lang !== 'en') onToggleLang(); }}
            className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold font-mono transition cursor-pointer ${
              lang === 'en'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Switch to English"
          >
            EN
          </button>
        </div>

        {/* Segmented Theme Switcher: [ 🌙 深色 | ☀️ 浅色 | 💾 Win95 ] */}
        <div className="flex items-center bg-gray-900/90 border border-white/[0.08] rounded-xl p-0.5 text-xs select-none theme-switcher-container">
          <button
            type="button"
            data-theme-btn="dark"
            onClick={() => {
              if (onSelectTheme) onSelectTheme('dark');
              else if (theme !== 'dark') onToggleTheme?.();
            }}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              theme === 'dark'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title={lang === 'zh' ? '切换为深色模式 (暗夜黑曜石)' : 'Switch to Dark Mode'}
          >
            <Moon className="w-3 h-3" />
            <span>{lang === 'zh' ? '深色' : 'Dark'}</span>
          </button>
          <button
            type="button"
            data-theme-btn="light"
            onClick={() => {
              if (onSelectTheme) onSelectTheme('light');
              else if (theme !== 'light') onToggleTheme?.();
            }}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              theme === 'light'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title={lang === 'zh' ? '切换为浅色模式 (银白微风)' : 'Switch to Light Mode'}
          >
            <Sun className="w-3 h-3" />
            <span>{lang === 'zh' ? '浅色' : 'Light'}</span>
          </button>
          <button
            type="button"
            data-theme-btn="retro-win95"
            onClick={() => {
              if (onSelectTheme) onSelectTheme('retro-win95');
              else if (theme !== 'retro-win95') onToggleTheme?.();
            }}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              theme === 'retro-win95'
                ? 'bg-teal-700 text-white shadow-sm border border-teal-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title={lang === 'zh' ? '切换为 Windows 98 复古模式 (千禧经典 1998 SE)' : 'Switch to Windows 98 Retro Mode'}
          >
            <Monitor className="w-3 h-3 text-teal-300" />
            <span>Win98</span>
          </button>
        </div>

        {/* Import existing rules (CLAUDE.md / AGENTS.md / .cursorrules ...) */}
        {onOpenImportWizard && (
          <button
            type="button"
            onClick={onOpenImportWizard}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent hover:border-gray-700 transition cursor-pointer"
            title={lang === 'zh' ? '导入现有规则（CLAUDE.md / AGENTS.md / .cursorrules …）' : 'Import existing rules (CLAUDE.md / AGENTS.md / .cursorrules …)'}
          >
            <FolderInput className="w-4 h-4" />
          </button>
        )}

        {/* Refresh Disk */}
        <button
          type="button"
          onClick={onRefresh}
          className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent hover:border-gray-700 transition cursor-pointer"
          title={t.refreshBtn}
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Authentic Win98 Window Controls [ _ | □ | ✕ ] */}
        {theme === 'retro-win95' && (
          <div className="flex items-center space-x-1 ml-1 select-none">
            <button
              type="button"
              onClick={async () => {
                try {
                  const { getCurrentWindow } = await import('@tauri-apps/api/window');
                  await getCurrentWindow().minimize();
                } catch (e) {
                  console.warn('Minimize not supported in web mode', e);
                }
              }}
              className="w-5 h-5 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] shadow-[1px_1px_0_#000000] active:border-t-[#808080] active:border-l-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff] flex items-center justify-center font-bold text-[10px] text-black cursor-pointer leading-none"
              title="最小化"
            >
              _
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const { getCurrentWindow } = await import('@tauri-apps/api/window');
                  await getCurrentWindow().toggleMaximize();
                } catch (e) {
                  console.warn('Maximize not supported in web mode', e);
                }
              }}
              className="w-5 h-5 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] shadow-[1px_1px_0_#000000] active:border-t-[#808080] active:border-l-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff] flex items-center justify-center font-bold text-[9px] text-black cursor-pointer leading-none"
              title="最大化 / 还原"
            >
              □
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const { getCurrentWindow } = await import('@tauri-apps/api/window');
                  await getCurrentWindow().close();
                } catch (e) {
                  console.warn('Close not supported in web mode', e);
                }
              }}
              className="w-5 h-5 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] shadow-[1px_1px_0_#000000] active:border-t-[#808080] active:border-l-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff] flex items-center justify-center font-bold text-[10px] text-black cursor-pointer leading-none"
              title="关闭"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
