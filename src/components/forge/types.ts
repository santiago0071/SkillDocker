import { SkillMeta } from '../../types/index.ts';
import { AiConfig } from '../../core/aiClient.ts';
import { Language } from '../../i18n/index.ts';

export interface SkillForgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkillCreated: (newSkill: SkillMeta) => void;
  onOpenSettings?: () => void;
  onOpenDoctor?: (skillId?: string) => void;
  aiConfig: AiConfig;
  onSaveAiConfig?: (newConfig: AiConfig) => void;
  existingSkills?: SkillMeta[];
  lang?: Language;
}

export interface ForgedHistoryItem {
  id: string;
  name: string;
  category: string;
  description: string;
  markdown: string;
  timestamp: number;
  doctorScore?: number;
  gradeLabel?: string;
  prompt?: string;
  source?: 'llm' | 'template';
}

export interface ModularLegoConfig {
  name: string;
  category: string;
  techStack: {
    reactTs: boolean;
    pythonAsync: boolean;
    rustSystems: boolean;
    tailwindCss: boolean;
    generalClean: boolean;
  };
  safety: {
    surgicalDiff: boolean;
    zeroDataLoss: boolean;
    authorIntent: boolean;
    secretsIsolation: boolean;
  };
  workflow: {
    planFirst: boolean;
    diffAudit: boolean;
    noAutoGitCommit: boolean;
  };
  scopeTriggers: boolean;
  verificationChecklist: boolean;
  rollbackSop: boolean;
}

export interface ProviderMenuItem {
  id: string;
  label: string;
  modelKey: string;
  defaultModel: string;
  icon: string;
}
