import React, { useState, useEffect, useRef } from 'react';
import type { SkillMeta } from '../types/index.ts';
import { translations } from '../i18n/index.ts';

import type { ActiveView, DockOverlayProps } from './dock/types.ts';
import { useDockSidebar, DEFAULT_HUB_ORDER, DEFAULT_WB_ORDER } from './dock/useDockSidebar.ts';
import { useDockShortcuts } from './dock/useDockShortcuts.ts';
import { DockHeader } from './dock/DockHeader.tsx';
import { RetroMenuBar } from './dock/RetroMenuBar.tsx';
import { DockSidebar } from './dock/DockSidebar.tsx';
import { DockCockpitView } from './dock/DockCockpitView.tsx';
import { DockCategoryRouter } from './dock/DockCategoryRouter.tsx';
import { DockInjectedView } from './dock/DockInjectedView.tsx';
import { DockFooter } from './dock/DockFooter.tsx';
import { DockModals } from './dock/DockModals.tsx';

export type { ActiveView };

export const DockOverlay: React.FC<DockOverlayProps> = ({
  workspace,
  onToggleSkill,
  onInjectDirective,
  onRemoveDirective,
  onClearAllDirectives,
  onRefresh,
  onImportSkillsFromPack,
  onAssimilateDirective,
  onRevertRuleToLive,
  onDeleteRule,
  onSkillUpdated,
  aiConfig,
  onSaveAiConfig,
  lang,
  onToggleLang,
  theme = 'dark',
  onToggleTheme,
  onSelectTheme,
  onOpenImportWizard,
}) => {
  const [activeView, setActiveView] = useState<ActiveView>('all-skills');
  const [activeEcosystemFilter, setActiveEcosystemFilter] = useState<'all' | 'antigravity' | 'claude' | 'codex' | 'agents'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Skill View Mode: 'cards' vs 'compact'
  const [skillDisplayMode, setSkillDisplayMode] = useState<'cards' | 'compact'>(() => {
    try {
      const saved = localStorage.getItem('skilldocker_view_mode');
      if (saved === 'cards' || saved === 'compact') return saved;
    } catch (_) {}
    return 'cards';
  });

  const handleToggleSkillDisplayMode = (mode: 'cards' | 'compact') => {
    setSkillDisplayMode(mode);
    try {
      localStorage.setItem('skilldocker_view_mode', mode);
    } catch (_) {}
  };

  // Modals & Drawers state
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillMeta | null>(null);
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [isDoctorOpen, setIsDoctorOpen] = useState(false);
  const [doctorTargetSkillId, setDoctorTargetSkillId] = useState<string | undefined>(undefined);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSkillsMatrixExpanded, setIsSkillsMatrixExpanded] = useState(true);
  const [shuttleSkill, setShuttleSkill] = useState<SkillMeta | null>(null);
  const [recentlySavedSkillName, setRecentlySavedSkillName] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Retro Clock Timer for Windows 95 Taskbar
  const [currentTimeStr, setCurrentTimeStr] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTimeStr(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOpenSettings = () => {
      setIsSettingsOpen(true);
      setTimeout(() => {
        const el = document.getElementById('settings-pro-license-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 60);
    };
    window.addEventListener('skilldock:open-settings', handleOpenSettings);
    return () => window.removeEventListener('skilldock:open-settings', handleOpenSettings);
  }, []);

  // Workspace Inspector Popover State
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(e.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }
    };
    if (isWorkspaceMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isWorkspaceMenuOpen]);

  // Retro Windows 98 Menu Bar State
  const [activeRetroMenu, setActiveRetroMenu] = useState<'file' | 'edit' | 'view' | 'tools' | 'help' | null>(null);

  useEffect(() => {
    if (!activeRetroMenu) return;
    const handleCloseRetroMenu = () => setActiveRetroMenu(null);
    window.addEventListener('click', handleCloseRetroMenu);
    return () => window.removeEventListener('click', handleCloseRetroMenu);
  }, [activeRetroMenu]);

  // Sidebar drag, expand, resize hooks
  const {
    isSkillsHubExpanded,
    toggleSkillsHub,
    isWorkbenchesExpanded,
    toggleWorkbenches,
    hubOrder,
    wbOrder,
    activeDrag,
    handlePointerDown,
    getItemDragStyle,
    handleResetSidebarOrder,
    moveHubItem,
    moveWbItem,
    isDragClickPrevented,
    sidebarWidth,
    isDraggingSidebar,
    handleSidebarResizeStart,
    handleSidebarReset,
  } = useDockSidebar();

  // Keyboard Shortcuts Hook
  useDockShortcuts({
    activeView,
    setActiveView,
    setIsShortcutsHelpOpen,
    setIsDoctorOpen,
    setIsForgeOpen,
    setIsVaultOpen,
    setIsSettingsOpen,
    isGuideOpen,
    setIsGuideOpen,
    isDoctorOpen,
    isForgeOpen,
    isVaultOpen,
    isSettingsOpen,
    isShortcutsHelpOpen,
    searchQuery,
    setSearchQuery,
    searchInputRef,
  });

  const t = translations[lang];

  // Global counts across all skills
  const globalCounts = {
    all: workspace.activeSkills.length,
    safety: workspace.activeSkills.filter((s) => s.category === 'safety').length,
    workflow: workspace.activeSkills.filter((s) => s.category === 'workflow').length,
    architecture: workspace.activeSkills.filter((s) => s.category === 'architecture').length,
    custom: workspace.activeSkills.filter((s) => s.category === 'custom' || !s.category).length,
  };

  // Helper to get skills for a specific category page
  const getSkillsForCategory = (cat: 'all' | 'safety' | 'workflow' | 'architecture' | 'custom') => {
    return workspace.activeSkills.filter((s) => {
      const matchCat =
        cat === 'all'
          ? true
          : cat === 'custom'
          ? s.category === 'custom' || !s.category
          : s.category === cat;
      if (!matchCat) return false;

      const matchEco =
        activeEcosystemFilter === 'all' ? true : s.ecosystem === activeEcosystemFilter;
      if (!matchEco) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      }
      return true;
    });
  };

  // Helper to get ecosystem tabs strictly reflecting counts in this specific category page
  const getEcosystemTabsForCategory = (cat: 'all' | 'safety' | 'workflow' | 'architecture' | 'custom') => {
    const categorySkills = workspace.activeSkills.filter((s) =>
      cat === 'all'
        ? true
        : cat === 'custom'
        ? s.category === 'custom' || !s.category
        : s.category === cat
    );

    return [
      { id: 'all', label: lang === 'zh' ? '🌐 全部生态' : '🌐 All Ecosystems', count: categorySkills.length },
      { id: 'antigravity', label: '🟣 Antigravity (Gemini)', count: categorySkills.filter((s) => s.ecosystem === 'antigravity').length },
      { id: 'claude', label: '🟠 Claude Code', count: categorySkills.filter((s) => s.ecosystem === 'claude').length },
      { id: 'codex', label: '🟢 OpenAI Codex', count: categorySkills.filter((s) => s.ecosystem === 'codex').length },
      { id: 'agents', label: '🔵 Open Agents', count: categorySkills.filter((s) => s.ecosystem === 'agents').length },
    ];
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#08090f] text-gray-100 select-none overflow-hidden font-sans">
      {/* 1. Desktop Top Navigation Bar (Studio Titlebar) */}
      <DockHeader
        theme={theme}
        workspace={workspace}
        lang={lang}
        onToggleLang={onToggleLang}
        onToggleTheme={onToggleTheme}
        onSelectTheme={onSelectTheme}
        onOpenImportWizard={onOpenImportWizard}
        onRefresh={onRefresh}
        isWorkspaceMenuOpen={isWorkspaceMenuOpen}
        setIsWorkspaceMenuOpen={setIsWorkspaceMenuOpen}
        workspaceMenuRef={workspaceMenuRef}
        setActiveRetroMenu={setActiveRetroMenu}
        setActiveEcosystemFilter={setActiveEcosystemFilter}
        setActiveView={setActiveView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchInputRef={searchInputRef}
        setIsShortcutsHelpOpen={setIsShortcutsHelpOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        setIsVaultOpen={setIsVaultOpen}
        aiConfig={aiConfig}
        t={t}
      />

      {/* 1.5. Authentic Windows 98 Menu Bar */}
      {theme === 'retro-win95' && (
        <RetroMenuBar
          activeRetroMenu={activeRetroMenu}
          setActiveRetroMenu={setActiveRetroMenu}
          setIsWorkspaceMenuOpen={setIsWorkspaceMenuOpen}
          setIsForgeOpen={setIsForgeOpen}
          setIsVaultOpen={setIsVaultOpen}
          setIsDoctorOpen={setIsDoctorOpen}
          setIsSettingsOpen={setIsSettingsOpen}
          setIsShortcutsHelpOpen={setIsShortcutsHelpOpen}
          setIsGuideOpen={setIsGuideOpen}
          setIsSkillsMatrixExpanded={setIsSkillsMatrixExpanded}
          isSkillsMatrixExpanded={isSkillsMatrixExpanded}
          skillDisplayMode={skillDisplayMode}
          handleToggleSkillDisplayMode={handleToggleSkillDisplayMode}
          onClearAllDirectives={onClearAllDirectives}
          handleResetSidebarOrder={handleResetSidebarOrder}
          onRefresh={onRefresh}
          onSelectTheme={onSelectTheme}
          onOpenImportWizard={onOpenImportWizard}
        />
      )}

      {/* 2. Studio Body: Left Sidebar + Resizer + Center Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        <DockSidebar
          sidebarWidth={sidebarWidth}
          isSkillsHubExpanded={isSkillsHubExpanded}
          toggleSkillsHub={toggleSkillsHub}
          isWorkbenchesExpanded={isWorkbenchesExpanded}
          toggleWorkbenches={toggleWorkbenches}
          hubOrder={hubOrder}
          wbOrder={wbOrder}
          DEFAULT_HUB_ORDER={DEFAULT_HUB_ORDER}
          DEFAULT_WB_ORDER={DEFAULT_WB_ORDER}
          handleResetSidebarOrder={handleResetSidebarOrder}
          activeDrag={activeDrag}
          getItemDragStyle={getItemDragStyle}
          handlePointerDown={handlePointerDown}
          isDragClickPrevented={isDragClickPrevented}
          activeView={activeView}
          setActiveView={setActiveView}
          moveHubItem={moveHubItem}
          moveWbItem={moveWbItem}
          globalCounts={globalCounts}
          workspace={workspace}
          t={t}
          lang={lang}
          setIsForgeOpen={setIsForgeOpen}
          setIsDoctorOpen={setIsDoctorOpen}
          setDoctorTargetSkillId={setDoctorTargetSkillId}
          setIsGuideOpen={setIsGuideOpen}
        />

        {/* Draggable Vertical Split Resizer */}
        <div
          onMouseDown={handleSidebarResizeStart}
          onDoubleClick={handleSidebarReset}
          className={`resizer-bar-vertical ${isDraggingSidebar ? 'is-dragging' : ''}`}
          title={
            lang === 'zh'
              ? '↔ 按住左右拖拽调整侧边栏宽度 (双击恢复默认)'
              : '↔ Drag to resize sidebar width (Double click to reset)'
          }
        />

        {/* Center Main Stage */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#08090f]">
          {/* VIEW 1: 主控制大厅 */}
          {(activeView === 'all-skills' || activeView === 'cockpit') && (
            <DockCockpitView
              workspace={workspace}
              onInjectDirective={onInjectDirective}
              onRemoveDirective={onRemoveDirective}
              onClearAllDirectives={onClearAllDirectives}
              onAssimilateDirective={onAssimilateDirective}
              onRevertRuleToLive={onRevertRuleToLive}
              onDeleteRule={onDeleteRule}
              aiConfig={aiConfig}
              lang={lang}
              setActiveView={setActiveView}
              setEditingSkill={setEditingSkill}
              allSkills={getSkillsForCategory('all')}
              ecosystemTabs={getEcosystemTabsForCategory('all')}
              activeEcosystemFilter={activeEcosystemFilter}
              setActiveEcosystemFilter={setActiveEcosystemFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              skillDisplayMode={skillDisplayMode}
              handleToggleSkillDisplayMode={handleToggleSkillDisplayMode}
              isSkillsMatrixExpanded={isSkillsMatrixExpanded}
              setIsSkillsMatrixExpanded={setIsSkillsMatrixExpanded}
              setIsForgeOpen={setIsForgeOpen}
              recentlySavedSkillName={recentlySavedSkillName}
              setRecentlySavedSkillName={setRecentlySavedSkillName}
              onToggleSkill={onToggleSkill}
              setDoctorTargetSkillId={setDoctorTargetSkillId}
              setIsDoctorOpen={setIsDoctorOpen}
              setShuttleSkill={setShuttleSkill}
              t={t}
            />
          )}

          {/* VIEW 2-5: 专属分类专区 (安全防御, 自动化工作流, 系统架构, 自定义) */}
          <DockCategoryRouter
            activeView={activeView}
            getSkillsForCategory={getSkillsForCategory}
            getEcosystemTabsForCategory={getEcosystemTabsForCategory}
            activeEcosystemFilter={activeEcosystemFilter}
            setActiveEcosystemFilter={setActiveEcosystemFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            skillDisplayMode={skillDisplayMode}
            handleToggleSkillDisplayMode={handleToggleSkillDisplayMode}
            setActiveView={setActiveView}
            setIsForgeOpen={setIsForgeOpen}
            onToggleSkill={onToggleSkill}
            setEditingSkill={setEditingSkill}
            setDoctorTargetSkillId={setDoctorTargetSkillId}
            setIsDoctorOpen={setIsDoctorOpen}
            setShuttleSkill={setShuttleSkill}
            lang={lang}
            workspace={workspace}
            recentlySavedSkillName={recentlySavedSkillName}
            t={t}
          />

          {/* VIEW 6: 已注入资产库与规约矩阵专区 */}
          {activeView === 'injected' && (
            <DockInjectedView
              workspace={workspace}
              onInjectDirective={onInjectDirective}
              onRemoveDirective={onRemoveDirective}
              onClearAllDirectives={onClearAllDirectives}
              onAssimilateDirective={onAssimilateDirective}
              onRevertRuleToLive={onRevertRuleToLive}
              onDeleteRule={onDeleteRule}
              aiConfig={aiConfig}
              lang={lang}
              setActiveView={setActiveView}
              setEditingSkill={setEditingSkill}
            />
          )}
        </main>
      </div>

      {/* 3. Bottom Desktop Status Bar */}
      <DockFooter
        theme={theme === 'retro-win95' ? 'retro-win95' : 'modern'}
        lang={lang}
        workspace={workspace}
        activeEcosystemFilter={activeEcosystemFilter}
        aiConfig={aiConfig}
        currentTimeStr={currentTimeStr}
      />

      {/* Modals & Drawers */}
      <DockModals
        isVaultOpen={isVaultOpen}
        setIsVaultOpen={setIsVaultOpen}
        workspace={workspace}
        onImportSkillsFromPack={onImportSkillsFromPack}
        lang={lang}
        editingSkill={editingSkill}
        setEditingSkill={setEditingSkill}
        onSkillUpdated={onSkillUpdated}
        aiConfig={aiConfig}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        onSaveAiConfig={onSaveAiConfig}
        isForgeOpen={isForgeOpen}
        setIsForgeOpen={setIsForgeOpen}
        setDoctorTargetSkillId={setDoctorTargetSkillId}
        setIsDoctorOpen={setIsDoctorOpen}
        setRecentlySavedSkillName={setRecentlySavedSkillName}
        setActiveView={setActiveView}
        setIsSkillsMatrixExpanded={setIsSkillsMatrixExpanded}
        onRefresh={onRefresh}
        isDoctorOpen={isDoctorOpen}
        doctorTargetSkillId={doctorTargetSkillId}
        isShortcutsHelpOpen={isShortcutsHelpOpen}
        setIsShortcutsHelpOpen={setIsShortcutsHelpOpen}
        shuttleSkill={shuttleSkill}
        setShuttleSkill={setShuttleSkill}
        isGuideOpen={isGuideOpen}
        setIsGuideOpen={setIsGuideOpen}
      />
    </div>
  );
};
