import { WorkspaceState, SkillMeta, LiveDirective, ConsolidatedRule } from '../../types/index.ts';
import { AiConfig } from '../../core/aiClient.ts';
import { Language } from '../../i18n/index.ts';

export type ActiveView =
  | 'all-skills'
  | 'safety'
  | 'workflow'
  | 'architecture'
  | 'custom'
  | 'cockpit'
  | 'injected';

export interface DockOverlayProps {
  workspace: WorkspaceState;
  onToggleSkill: (id: string) => void;
  onInjectDirective: (directive: Omit<LiveDirective, 'id' | 'timestamp'>, targetSkillId?: string) => void;
  onRemoveDirective: (id: string, content?: string) => void;
  onClearAllDirectives: () => void;
  onRefresh: () => void;
  onImportSkillsFromPack: (pack: any) => void;
  onAssimilateDirective: (directive: LiveDirective, targetSkillId?: string) => void;
  onRevertRuleToLive?: (rule: ConsolidatedRule) => void;
  onDeleteRule?: (rule: ConsolidatedRule) => void;
  onSkillUpdated?: (updatedSkill: SkillMeta) => void;
  aiConfig: AiConfig;
  onSaveAiConfig: (newConfig: AiConfig) => void;
  lang: Language;
  onToggleLang: () => void;
  theme?: 'dark' | 'light' | 'retro-win95';
  onToggleTheme?: () => void;
  onSelectTheme?: (theme: 'dark' | 'light' | 'retro-win95') => void;
  onOpenImportWizard?: () => void;
}
