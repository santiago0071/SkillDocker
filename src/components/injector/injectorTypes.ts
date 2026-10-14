import { LiveDirective, SkillMeta, ConsolidatedRule } from '../../types/index.ts';
import { AiConfig } from '../../core/aiClient.ts';
import { Language } from '../../i18n/index.ts';

export type TargetScope = 'universal' | 'antigravity' | 'claude' | 'codex' | 'agents' | 'all';

export interface LiveInjectorProps {
  onInject: (directive: Omit<LiveDirective, 'id' | 'timestamp'>, targetSkillId?: string) => void;
  directives: LiveDirective[];
  onRemoveDirective: (id: string, content?: string) => void;
  onClearAll: () => void;
  onAssimilateDirective: (directive: LiveDirective, targetSkillId?: string) => void;
  consolidatedRules?: ConsolidatedRule[];
  onRevertRuleToLive?: (rule: ConsolidatedRule) => void;
  onDeleteRule?: (rule: ConsolidatedRule) => void;
  aiConfig?: AiConfig;
  lang?: Language;
  skills?: SkillMeta[];
  compact?: boolean;
  onNavigateToHub?: () => void;
  onOpenSkillEditor?: (skill: SkillMeta) => void;
}
