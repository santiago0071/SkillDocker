import React from 'react';
import { translations } from '../i18n/index.ts';
import { SkillShuttleModal } from './SkillShuttleModal';
import { SkillEditorModalProps } from './editor/editorModalTypes.ts';
import { useSkillEditor } from './editor/useSkillEditor.ts';
import { EditorHeader } from './editor/EditorHeader.tsx';
import { EditorToolbar } from './editor/EditorToolbar.tsx';
import { EditorFrontmatterBar } from './editor/EditorFrontmatterBar.tsx';
import { EditorConsolidatedRulesBanner } from './editor/EditorConsolidatedRulesBanner.tsx';
import { EditorCanvas } from './editor/EditorCanvas.tsx';
import { isReadOnlySkill, getReadOnlyNotice } from '../core/skillBadges.ts';

export type { SkillEditorModalProps };

export const SkillEditorModal: React.FC<SkillEditorModalProps> = ({
  skill,
  isOpen,
  onClose,
  onSaveSuccess,
  aiConfig,
  lang = 'zh',
  liveDirectives = [],
  allSkills,
}) => {
  const editor = useSkillEditor({
    skill,
    isOpen,
    onClose,
    onSaveSuccess,
    aiConfig,
    lang,
    liveDirectives,
  });

  const t = translations[lang];

  if (!isOpen || !skill) return null;

  const isReadOnly = isReadOnlySkill(skill);
  const readOnlyNotice = getReadOnlyNotice(skill, lang);

  const handleClose = () => {
    if (!editor.isDirty || window.confirm(lang === 'zh' ? '当前有未保存的修改，确认退出吗？' : 'Unsaved changes exist. Exit anyway?')) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-200 ${
        editor.isMaximized ? 'p-0' : 'p-2 sm:p-4'
      }`}
    >
      <div
        className={`w-full bg-[#0f1118] border border-gray-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden transition-all duration-150 ${
          editor.isMaximized ? 'h-full max-w-none rounded-none border-none' : 'max-w-6xl h-[94vh] rounded-2xl'
        }`}
      >
        {/* Row 1: Header Top Bar */}
        <EditorHeader
          name={editor.name}
          skill={skill}
          category={editor.category}
          isDirty={editor.isDirty}
          copiedPath={editor.copiedPath}
          isMaximized={editor.isMaximized}
          lang={lang}
          t={t}
          onCopyPath={editor.handleCopyPath}
          onToggleMaximize={() => editor.setIsMaximized(!editor.isMaximized)}
          onClose={handleClose}
          allSkills={allSkills}
          isReadOnly={isReadOnly}
          readOnlyNotice={readOnlyNotice}
        />

        {/* Row 2: Toolbar Bar */}
        <EditorToolbar
          viewMode={editor.viewMode}
          onSelectViewMode={editor.setViewMode}
          onOpenShuttle={() => editor.setIsShuttleOpen(true)}
          polishMenuOpen={editor.polishMenuOpen}
          onTogglePolishMenu={() => editor.setPolishMenuOpen(!editor.polishMenuOpen)}
          isPolishing={editor.isPolishing}
          onAiPolish={editor.handleAiPolish}
          isDirty={editor.isDirty}
          onRevert={editor.handleRevert}
          isSaving={editor.isSaving}
          onSave={editor.handleSave}
          lang={lang}
          t={t}
          readOnly={isReadOnly}
          readOnlyNotice={readOnlyNotice}
        />

        {/* Structured Frontmatter Bar */}
        <EditorFrontmatterBar
          name={editor.name}
          category={editor.category}
          version={editor.version}
          description={editor.description}
          showRawFm={editor.showRawFm}
          frontmatterText={editor.frontmatterText}
          onUpdateField={editor.updateFrontmatterField}
          onToggleRawFm={() => editor.setShowRawFm(!editor.showRawFm)}
          onRawFmChange={(text) => {
            editor.setFrontmatterText(text);
          }}
          t={t}
          readOnly={isReadOnly}
        />

        {/* Active In-flight Directives & Consolidated Rules Banner */}
        <EditorConsolidatedRulesBanner
          activeDirectivesForSkill={editor.activeDirectivesForSkill}
          consolidatedRules={editor.consolidatedRules}
          isConsolidatedRulesExpanded={editor.isConsolidatedRulesExpanded}
          onToggleExpand={() => editor.setIsConsolidatedRulesExpanded(!editor.isConsolidatedRulesExpanded)}
          onRevokeRule={editor.handleRevokeRule}
          lang={lang}
          t={t}
        />

        {/* Toast Notification */}
        {editor.toast && (
          <div
            className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
              editor.toast.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
                : editor.toast.type === 'error'
                ? 'bg-red-950/60 border-red-800/60 text-red-300'
                : 'bg-indigo-950/60 border-indigo-800/60 text-indigo-300'
            }`}
          >
            <span>{editor.toast.message}</span>
            <button onClick={() => editor.setToast(null)} className="text-gray-400 hover:text-white ml-2 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Main Body Canvas */}
        <EditorCanvas
          loading={editor.loading}
          viewMode={editor.viewMode}
          splitRatio={editor.splitRatio}
          splitContainerRef={editor.splitContainerRef}
          onSplitResizeStart={editor.handleSplitResizeStart}
          onResetSplitRatio={() => editor.setSplitRatio(50)}
          bodyMarkdown={editor.bodyMarkdown}
          onBodyMarkdownChange={(val) => editor.setBodyMarkdown(val)}
          renderedHtml={editor.renderedHtml}
          lang={lang}
          t={t}
          readOnly={isReadOnly}
        />

        {/* Footer Bar */}
        <div className="flex items-center justify-between px-5 py-2 bg-[#0b0d14] border-t border-gray-800 text-[11px] text-gray-500 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="px-1.5 py-0.5 rounded bg-gray-800/80 text-gray-400 font-mono border border-gray-700/60">
              {t.hotkeySaveHint}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-gray-800/80 text-gray-400 font-mono border border-gray-700/60">
              {t.hotkeyEscHint}
            </span>
            <span>·</span>
            <span>{t.backupNotice}</span>
          </div>

          <div className="flex items-center space-x-3">
            <span>
              {t.activeEngine}{' '}
              <strong className="text-gray-300 font-mono uppercase">{aiConfig.activeProvider}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Standalone Live Ecosystem Shuttle Modal */}
      <SkillShuttleModal
        skill={skill ? { ...skill, name: editor.name, description: editor.description, category: editor.category as any, version: editor.version, bodyText: editor.bodyMarkdown } : null}
        isOpen={editor.isShuttleOpen}
        onClose={() => editor.setIsShuttleOpen(false)}
        lang={lang}
      />
    </div>
  );
};
