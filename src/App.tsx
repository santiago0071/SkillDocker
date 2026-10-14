import React from 'react';
import { DockOverlay } from './components/DockOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ImportWizardModal } from './components/ImportWizardModal';
import { AppBanner } from './components/app/AppBanner.tsx';
import { useAppLanguage } from './hooks/useAppLanguage.ts';
import { useAppTheme } from './hooks/useAppTheme.ts';
import { useAppAiConfig } from './hooks/useAppAiConfig.ts';
import { useWorkspaceDirectives } from './hooks/useWorkspaceDirectives.ts';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts.ts';

export const App: React.FC = () => {
  const { lang, handleToggleLang } = useAppLanguage();
  const { theme, handleSelectTheme, handleToggleTheme } = useAppTheme();

  const {
    workspace,
    banner,
    setBanner,
    showBanner,
    lastClearedDirectivesRef,
    fetchLocalSkills,
    handleToggleSkill,
    handleInjectDirective,
    handleAssimilateDirective,
    handleRevertRuleToLive,
    handleDeleteRule,
    handleUndoRestoreDirectives,
    handleRemoveDirective,
    handleClearAllDirectives,
    handleRefresh,
    isImportWizardOpen,
    setIsImportWizardOpen,
    handleSkillUpdated,
  } = useWorkspaceDirectives(lang);

  const { aiConfig, handleSaveAiConfig } = useAppAiConfig(lang, showBanner);

  useGlobalShortcuts({
    lastClearedDirectivesRef,
    handleUndoRestoreDirectives,
    activeSkills: workspace.activeSkills,
    lang,
  });

  return (
    <div className={`w-screen h-screen flex flex-col overflow-hidden select-none font-sans relative ${theme === 'light' ? 'theme-light bg-[#f6f8fb] text-slate-800' : 'theme-dark bg-[#08090f] text-gray-100'}`}>
      <AppBanner banner={banner} onClose={() => setBanner(null)} lang={lang} />

      <ErrorBoundary fallbackTitle="控制台面板遇到渲染异常">
        <DockOverlay
          workspace={workspace}
          onToggleSkill={handleToggleSkill}
          onInjectDirective={handleInjectDirective}
          onRemoveDirective={handleRemoveDirective}
          onClearAllDirectives={handleClearAllDirectives}
          onRefresh={handleRefresh}
          onImportSkillsFromPack={fetchLocalSkills}
          onAssimilateDirective={handleAssimilateDirective}
          onRevertRuleToLive={handleRevertRuleToLive}
          onDeleteRule={handleDeleteRule}
          onSkillUpdated={handleSkillUpdated}
          aiConfig={aiConfig}
          onSaveAiConfig={handleSaveAiConfig}
          lang={lang}
          onToggleLang={handleToggleLang}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onSelectTheme={handleSelectTheme}
          onOpenImportWizard={() => setIsImportWizardOpen(true)}
        />
      </ErrorBoundary>

      <ImportWizardModal
        isOpen={isImportWizardOpen}
        onClose={() => setIsImportWizardOpen(false)}
        onImported={fetchLocalSkills}
        existingSkills={workspace.activeSkills}
        lang={lang}
      />
    </div>
  );
};

export default App;
