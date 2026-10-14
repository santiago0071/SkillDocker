import React from 'react';
import { WorkspaceState, SkillMeta } from '../../types/index.ts';
import { AiConfig } from '../../core/aiClient.ts';
import { Language } from '../../i18n/index.ts';
import { VaultDrawer } from '../VaultDrawer.tsx';
import { SkillEditorModal } from '../SkillEditorModal.tsx';
import { SettingsModal } from '../SettingsModal.tsx';
import { SkillForgeModal } from '../SkillForgeModal.tsx';
import { SkillDoctorModal } from '../SkillDoctorModal.tsx';
import { ShortcutsModal } from '../ShortcutsModal.tsx';
import { SkillShuttleModal } from '../SkillShuttleModal.tsx';
import { RookieGuideModal } from '../RookieGuideModal.tsx';
import type { ActiveView } from './types.ts';

interface DockModalsProps {
  isVaultOpen: boolean;
  setIsVaultOpen: (open: boolean) => void;
  workspace: WorkspaceState;
  onImportSkillsFromPack: (pack: any) => void;
  lang: Language;
  editingSkill: SkillMeta | null;
  setEditingSkill: (skill: SkillMeta | null) => void;
  onSkillUpdated?: (updatedSkill: SkillMeta) => void;
  aiConfig: AiConfig;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  onSaveAiConfig: (newConfig: AiConfig) => void;
  isForgeOpen: boolean;
  setIsForgeOpen: (open: boolean) => void;
  setDoctorTargetSkillId: (id?: string) => void;
  setIsDoctorOpen: (open: boolean) => void;
  setRecentlySavedSkillName: (name: string | null) => void;
  setActiveView: (view: ActiveView) => void;
  setIsSkillsMatrixExpanded: (expanded: boolean) => void;
  onRefresh: () => void;
  isDoctorOpen: boolean;
  doctorTargetSkillId?: string;
  isShortcutsHelpOpen: boolean;
  setIsShortcutsHelpOpen: (open: boolean) => void;
  shuttleSkill: SkillMeta | null;
  setShuttleSkill: (skill: SkillMeta | null) => void;
  isGuideOpen: boolean;
  setIsGuideOpen: (open: boolean) => void;
}

export const DockModals: React.FC<DockModalsProps> = ({
  isVaultOpen,
  setIsVaultOpen,
  workspace,
  onImportSkillsFromPack,
  lang,
  editingSkill,
  setEditingSkill,
  onSkillUpdated,
  aiConfig,
  isSettingsOpen,
  setIsSettingsOpen,
  onSaveAiConfig,
  isForgeOpen,
  setIsForgeOpen,
  setDoctorTargetSkillId,
  setIsDoctorOpen,
  setRecentlySavedSkillName,
  setActiveView,
  setIsSkillsMatrixExpanded,
  onRefresh,
  isDoctorOpen,
  doctorTargetSkillId,
  isShortcutsHelpOpen,
  setIsShortcutsHelpOpen,
  shuttleSkill,
  setShuttleSkill,
  isGuideOpen,
  setIsGuideOpen,
}) => {
  return (
    <>
      {/* Portable Vault Drawer */}
      <VaultDrawer
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        skills={workspace.activeSkills}
        onImportSkills={onImportSkillsFromPack}
        lang={lang}
      />

      {/* Reader-Friendly Typora/Notion Grade Markdown Editor Modal */}
      <SkillEditorModal
        skill={editingSkill}
        isOpen={Boolean(editingSkill)}
        onClose={() => setEditingSkill(null)}
        onSaveSuccess={(updatedMeta) => {
          if (onSkillUpdated) {
            onSkillUpdated(updatedMeta);
          }
        }}
        aiConfig={aiConfig}
        lang={lang}
        liveDirectives={workspace.liveDirectives}
        allSkills={workspace.activeSkills}
      />

      {/* BYOK Multi-Model Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={aiConfig}
        onSaveConfig={onSaveAiConfig}
        lang={lang}
      />

      {/* Skill Forge Studio Modal */}
      <SkillForgeModal
        isOpen={isForgeOpen}
        onClose={() => setIsForgeOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDoctor={(skillId) => {
          setIsForgeOpen(false);
          if (skillId) setDoctorTargetSkillId(skillId);
          setIsDoctorOpen(true);
        }}
        onSkillCreated={(newSkill) => {
          if (onSkillUpdated) {
            onSkillUpdated(newSkill);
          }
          setRecentlySavedSkillName(newSkill.name);
          setActiveView('all-skills');
          setIsSkillsMatrixExpanded(true);
          onRefresh();
        }}
        aiConfig={aiConfig}
        onSaveAiConfig={onSaveAiConfig}
        existingSkills={workspace.activeSkills}
        lang={lang}
      />

      {/* Skill Doctor Modal */}
      <SkillDoctorModal
        isOpen={isDoctorOpen}
        onClose={() => setIsDoctorOpen(false)}
        skills={workspace.activeSkills}
        initialSkillId={doctorTargetSkillId}
        aiConfig={aiConfig}
        lang={lang}
        onSkillRemedied={onSkillUpdated}
      />

      {/* Keyboard Shortcuts HUD Modal */}
      <ShortcutsModal
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
        lang={lang}
      />

      {/* Ecosystem Shuttle Modal */}
      <SkillShuttleModal
        skill={shuttleSkill}
        isOpen={Boolean(shuttleSkill)}
        onClose={() => setShuttleSkill(null)}
        lang={lang}
      />

      {/* 30s Rookie Guide Modal */}
      <RookieGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        lang={lang}
      />
    </>
  );
};
