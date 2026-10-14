import { SkillMeta, LiveDirective } from '../../types/index.ts';
import { AiConfig } from '../../core/aiClient.ts';
import { Language } from '../../i18n/index.ts';

export interface DiffPreviewData {
  title: string;
  skillName: string;
  originalContent: string;
  newContent: string;
  summaryOfChanges?: string[];
  onConfirmDiff: () => Promise<void>;
}

export interface CommitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  directive?: { content: string; priority: LiveDirective['priority'] } | null;
  skills?: SkillMeta[];
  defaultSkillId?: string;
  aiConfig?: AiConfig;
  lang?: Language;
  onConfirm?: (targetSkillId: string, finalContent: string, priority: LiveDirective['priority']) => Promise<void>;
  diffPreview?: DiffPreviewData | null;
}
