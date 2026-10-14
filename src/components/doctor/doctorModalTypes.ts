import { SkillMeta } from '../../types/index.ts';
import { AiConfig } from '../../core/aiClient.ts';
import { Language } from '../../i18n/index.ts';
import {
  LibraryConsultationSkillInput,
  LibraryConsultationPayloadEstimate,
} from '../../core/doctor.ts';

export interface SkillDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  skills: SkillMeta[];
  initialSkillId?: string;
  aiConfig: AiConfig;
  lang: Language;
  onSkillRemedied?: (updatedSkill: SkillMeta) => void;
}

export type DoctorMode = 'heuristic' | 'ai';
export type DoctorTab = 'single' | 'library';
export type LibraryCategoryFilter = 'all' | 'conflicts' | 'routing' | 'tokens' | 'highlights';

export interface ConsultationConfirmState {
  estimate: LibraryConsultationPayloadEstimate;
  preparedSkills: LibraryConsultationSkillInput[];
}
