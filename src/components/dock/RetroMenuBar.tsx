import React from 'react';

interface RetroMenuBarProps {
  activeRetroMenu: 'file' | 'edit' | 'view' | 'tools' | 'help' | null;
  setActiveRetroMenu: React.Dispatch<React.SetStateAction<'file' | 'edit' | 'view' | 'tools' | 'help' | null>>;
  setIsWorkspaceMenuOpen: (open: boolean) => void;
  setIsForgeOpen: (open: boolean) => void;
  setIsVaultOpen: (open: boolean) => void;
  setIsDoctorOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsShortcutsHelpOpen: (open: boolean) => void;
  setIsGuideOpen: (open: boolean) => void;
  setIsSkillsMatrixExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isSkillsMatrixExpanded: boolean;
  skillDisplayMode: 'cards' | 'compact';
  handleToggleSkillDisplayMode: (mode: 'cards' | 'compact') => void;
  onClearAllDirectives: () => void;
  handleResetSidebarOrder: () => void;
  onRefresh: () => void;
  onSelectTheme?: (theme: 'dark' | 'light' | 'retro-win95') => void;
  onOpenImportWizard?: () => void;
}

export const RetroMenuBar: React.FC<RetroMenuBarProps> = ({
  activeRetroMenu,
  setActiveRetroMenu,
  setIsWorkspaceMenuOpen,
  setIsForgeOpen,
  setIsVaultOpen,
  setIsDoctorOpen,
  setIsSettingsOpen,
  setIsShortcutsHelpOpen,
  setIsGuideOpen,
  setIsSkillsMatrixExpanded,
  isSkillsMatrixExpanded,
  skillDisplayMode,
  handleToggleSkillDisplayMode,
  onClearAllDirectives,
  handleResetSidebarOrder,
  onRefresh,
  onSelectTheme,
  onOpenImportWizard,
}) => {
  return (
    <div className="h-6 px-2 bg-[#c0c0c0] border-b border-b-[#808080] shadow-[inset_0_1px_0_#ffffff] flex items-center space-x-0.5 text-xs text-black select-none z-30 flex-shrink-0 relative font-sans">
      {/* File Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsWorkspaceMenuOpen(false);
            setActiveRetroMenu((prev) => (prev === 'file' ? null : 'file'));
          }}
          className={`px-2 py-0.5 rounded-none text-xs font-sans cursor-pointer transition-none ${
            activeRetroMenu === 'file'
              ? 'bg-[#000080] text-white shadow-[inset_1px_1px_0_#000000]'
              : 'hover:bg-[#000080] hover:text-white text-black'
          }`}
        >
          文件(<span className="underline">F</span>)
        </button>
        {activeRetroMenu === 'file' && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-full mt-0.5 w-48 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] shadow-[2px_2px_0px_#000000] z-50 py-1 text-xs text-black font-sans"
          >
            <div
              onClick={() => { setIsForgeOpen(true); setActiveRetroMenu(null); }}
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer flex justify-between"
            >
              <span>新建技能...</span>
              <span className="text-[10px] opacity-70">Ctrl+N</span>
            </div>
            <div
              onClick={() => { setIsVaultOpen(true); setActiveRetroMenu(null); }}
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer flex justify-between"
            >
              <span>本地技能备份...</span>
              <span className="text-[10px] opacity-70">Ctrl+I</span>
            </div>
            {onOpenImportWizard && (
              <div
                onClick={() => { onOpenImportWizard(); setActiveRetroMenu(null); }}
                className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer flex justify-between"
              >
                <span>导入现有规则...</span>
              </div>
            )}
            <div className="border-t border-[#808080] border-b border-b-[#ffffff] my-1" />
            <div
              onClick={() => { onRefresh(); setActiveRetroMenu(null); }}
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer flex justify-between"
            >
              <span>重新扫描本地资产</span>
              <span className="text-[10px] opacity-70">F5</span>
            </div>
          </div>
        )}
      </div>

      {/* Edit Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsWorkspaceMenuOpen(false);
            setActiveRetroMenu((prev) => (prev === 'edit' ? null : 'edit'));
          }}
          className={`px-2 py-0.5 rounded-none text-xs font-sans cursor-pointer transition-none ${
            activeRetroMenu === 'edit'
              ? 'bg-[#000080] text-white shadow-[inset_1px_1px_0_#000000]'
              : 'hover:bg-[#000080] hover:text-white text-black'
          }`}
        >
          编辑(<span className="underline">E</span>)
        </button>
        {activeRetroMenu === 'edit' && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-full mt-0.5 w-44 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] shadow-[2px_2px_0px_#000000] z-50 py-1 text-xs text-black font-sans"
          >
            <div
              onClick={() => { onClearAllDirectives(); setActiveRetroMenu(null); }}
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            >
              清空全部实时干预
            </div>
            <div
              onClick={() => { handleResetSidebarOrder(); setActiveRetroMenu(null); }}
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            >
              恢复默认侧边栏排序
            </div>
          </div>
        )}
      </div>

      {/* View Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsWorkspaceMenuOpen(false);
            setActiveRetroMenu((prev) => (prev === 'view' ? null : 'view'));
          }}
          className={`px-2 py-0.5 rounded-none text-xs font-sans cursor-pointer transition-none ${
            activeRetroMenu === 'view'
              ? 'bg-[#000080] text-white shadow-[inset_1px_1px_0_#000000]'
              : 'hover:bg-[#000080] hover:text-white text-black'
          }`}
        >
          查看(<span className="underline">V</span>)
        </button>
        {activeRetroMenu === 'view' && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-full mt-0.5 w-52 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] shadow-[2px_2px_0px_#000000] z-50 py-1 text-xs text-black font-sans"
          >
            <div
              onClick={() => { onSelectTheme?.('dark'); setActiveRetroMenu(null); }}
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            >
              🌙 深色模式 (暗夜黑曜石)
            </div>
            <div
              onClick={() => { onSelectTheme?.('light'); setActiveRetroMenu(null); }}
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            >
              ☀️ 浅色模式 (银白微风)
            </div>
            <div
              onClick={() => { onSelectTheme?.('retro-win95'); setActiveRetroMenu(null); }}
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer font-bold"
            >
              ✓ 💾 Windows 98 复古模式
            </div>
            <div className="border-t border-[#808080] border-b border-b-[#ffffff] my-1" />
            <div
              onClick={() => { handleToggleSkillDisplayMode('cards'); setActiveRetroMenu(null); }}
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer flex items-center justify-between"
            >
              <span>🗂️ 舒适大图标 (Cards)</span>
              {skillDisplayMode === 'cards' && <span className="font-bold">✓</span>}
            </div>
            <div
              onClick={() => { handleToggleSkillDisplayMode('compact'); setActiveRetroMenu(null); }}
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer flex items-center justify-between"
            >
              <span>📋 详细信息列表 (Details)</span>
              {skillDisplayMode === 'compact' && <span className="font-bold">✓</span>}
            </div>
            <div className="border-t border-[#808080] border-b border-b-[#ffffff] my-1" />
            <div
              onClick={() => { setIsSkillsMatrixExpanded((prev) => !prev); setActiveRetroMenu(null); }}
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            >
              {isSkillsMatrixExpanded ? '收起技能矩阵' : '展开技能矩阵'}
            </div>
          </div>
        )}
      </div>

      {/* Tools Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsWorkspaceMenuOpen(false);
            setActiveRetroMenu((prev) => (prev === 'tools' ? null : 'tools'));
          }}
          className={`px-2 py-0.5 rounded-none text-xs font-sans cursor-pointer transition-none ${
            activeRetroMenu === 'tools'
              ? 'bg-[#000080] text-white shadow-[inset_1px_1px_0_#000000]'
              : 'hover:bg-[#000080] hover:text-white text-black'
          }`}
        >
          工具(<span className="underline">T</span>)
        </button>
        {activeRetroMenu === 'tools' && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-full mt-0.5 w-52 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] shadow-[2px_2px_0px_#000000] z-50 py-1 text-xs text-black font-sans"
          >
            <div
              onClick={() => { setIsDoctorOpen(true); setActiveRetroMenu(null); }}
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            >
              Skills Doctor 诊断与修复
            </div>
            <div
              onClick={() => { setIsSettingsOpen(true); setActiveRetroMenu(null); }}
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            >
              BYOK 自定义大模型配置...
            </div>
          </div>
        )}
      </div>

      {/* Help Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsWorkspaceMenuOpen(false);
            setActiveRetroMenu((prev) => (prev === 'help' ? null : 'help'));
          }}
          className={`px-2 py-0.5 rounded-none text-xs font-sans cursor-pointer transition-none ${
            activeRetroMenu === 'help'
              ? 'bg-[#000080] text-white shadow-[inset_1px_1px_0_#000000]'
              : 'hover:bg-[#000080] hover:text-white text-black'
          }`}
        >
          帮助(<span className="underline">H</span>)
        </button>
        {activeRetroMenu === 'help' && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-full mt-0.5 w-56 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] shadow-[2px_2px_0px_#000000] z-50 py-1 text-xs text-black font-sans"
          >
            <div
              onClick={() => { setIsShortcutsHelpOpen(true); setActiveRetroMenu(null); }}
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer flex justify-between"
            >
              <span>键盘快捷键指南</span>
              <span className="text-[10px] opacity-70">F1</span>
            </div>
            <div
              onClick={() => { setIsGuideOpen(true); setActiveRetroMenu(null); }}
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer"
            >
              新手快速上手指引
            </div>
            <div className="border-t border-[#808080] border-b border-b-[#ffffff] my-1" />
            <div
              onClick={() => {
                alert('SkillDocker 98 Second Edition\n版本: 4.10.2222 A (Active Desktop)\n\n自主智能体本地技能资产控制台\n支持 Antigravity, Claude Code, Codex, Agents SDK 全生态矩阵。\n\n版权所有 (C) 1998-2026 SkillDocker Corporation');
                setActiveRetroMenu(null);
              }}
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer font-semibold"
            >
              关于 SkillDocker 98 SE...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
