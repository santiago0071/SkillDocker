import { SkillMeta, LiveDirective } from '../../types/index.ts';
import { AiConfig } from '../../core/aiClient.ts';
import { Language } from '../../i18n/index.ts';

export interface SkillEditorModalProps {
  skill: SkillMeta | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: (updatedMeta: SkillMeta) => void;
  aiConfig: AiConfig;
  lang?: Language;
  liveDirectives?: LiveDirective[];
  allSkills?: SkillMeta[];
}

export type EditorViewMode = 'reader' | 'split' | 'editor';
export type PolishType = 'polish' | 'rules' | 'format';
