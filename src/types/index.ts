export type EcosystemTarget = 'antigravity' | 'claude' | 'codex' | 'deepseek' | 'agents' | 'cursor';

export interface SkillMeta {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  version?: string;
  category?: 'safety' | 'workflow' | 'marketing' | 'architecture' | 'custom';
  tags?: string[];
  rawPath: string; // Absolute path to directory or file
  ecosystem?: EcosystemTarget;
  sourceDir?: string;
  legacy?: boolean;
  isLegacy?: boolean;
  readOnly?: boolean;
  readOnlyNotice?: string;
  readBy?: string[];
  rawContent?: string;
  frontmatterText?: string;
  bodyText?: string;
  hasFrontmatter?: boolean;
  uploadedFileName?: string;
  sourceId?: string;
}

export interface LiveDirective {
  id: string;
  timestamp: string; // ISO string
  content: string;
  ephemeral: boolean; // if true, only active for current session
  priority: 'normal' | 'high' | 'critical';
  targetEcosystem?: EcosystemTarget | 'universal';
  targetSkillId?: string;
  targetSkillName?: string;
}

export interface ExcludedFileEntry {
  path: string;
  reason: string;
}

export interface FailedSkillEntry {
  path: string;
  reason: string;
}

export interface SourceExportStats {
  source: string;
  skillsCount: number;
  filesCount: number;
  totalBytes: number;
}

export interface ExportPackSummary {
  outputPath: string;
  formatVersion: string;
  exportedAt: string;
  totalSkills: number;
  totalFiles: number;
  totalBytes: number;
  bySource: SourceExportStats[];
  excludedFiles: ExcludedFileEntry[];
  failedSkills: FailedSkillEntry[];
  verified: boolean;
}

export interface ManifestFileEntry {
  path: string;
  sha256: string;
  size: number;
}

export interface ManifestSkillEntry {
  source?: string;
  directoryName?: string;
  name: string;
  description: string;
  nameNonConforming?: boolean;
  ecosystem?: string;
  sourceDir?: string;
  source_dir?: string;
  contentHash?: string;
  files: ManifestFileEntry[];
}

export interface SkillPackInspection {
  pack_path: string;
  format_version: string;
  exported_at: string;
  app_version: string;
  total_skills: number;
  total_files: number;
  total_bytes: number;
  skills: ManifestSkillEntry[];
}

export interface ImportTargetOption {
  skillName: string;
  targetEcosystem: string;
  overwrite: boolean;
  skill_name?: string;
  target_ecosystem?: string;
}

export interface ImportSkillResult {
  name: string;
  status: string;
  message: string;
}

export interface ImportPackSummary {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  results: ImportSkillResult[];
}

export interface ConsolidatedRule {
  id: string;
  skillId: string;
  skillName: string;
  skillPath: string;
  ecosystem?: EcosystemTarget;
  priority: 'normal' | 'high' | 'critical';
  content: string;
  fullLine?: string;
}

export interface DiagnosticIssue {
  type: 'critical' | 'warning' | 'info' | 'passed';
  title: string;
  description: string;
  dimension: 'structure' | 'redline' | 'safety' | 'portability' | 'freshness';
  ruleId?: string;
  sourceUrl?: string;
  level?: 'L1' | 'L2';
}

export interface DiagnosticReport {
  skillName: string;
  skillPath?: string;
  totalScore: number;
  grade: '优秀' | '良好' | '存在隐患' | '极度危险' | 'defensive' | 'compliant' | 'basic' | 'incomplete' | string;
  gradeLabel?: string;
  gradeLabelEn?: string;
  dimensionScores: {
    structure: number;
    redline: number;
    safety: number;
    portability: number;
    freshness: number;
  };
  issues: DiagnosticIssue[];
  prescription: string;
  remedyPatch?: string;
  qualityReview?: string;
  supplementSuggestions?: string[];
  diagnosedAt: string;
  source: 'heuristic' | 'ai';
}

export interface OptimizationResult {
  optimizedContent: string;
  summaryOfChanges: string[];
  supplements?: string[];
}

export interface WorkspaceState {
  currentPath: string;
  workspaceName: string;
  ecosystem: EcosystemTarget;
  activeSkills: SkillMeta[];
  liveDirectives: LiveDirective[];
  consolidatedRules?: ConsolidatedRule[];
}

/**
 * SkillDocker Commercial & Pro Architecture Specifications
 */
export type LicenseTier = 'community' | 'pro' | 'enterprise';

export type ProFeatureFlag =
  | 'live_mirroring'          // Real-time bi-directional IDE/Editor file syncing
  | 'team_vault_sync'         // Encrypted cloud vault roaming & team skill shares
  | 'semantic_doctor_autofix' // Autonomous LLM semantic patch generation
  | 'unlimited_byok_routing'; // High-throughput multi-model load-balanced routing

export interface ProLicenseState {
  tier: LicenseTier;
  isActive: boolean;
  licenseKey?: string;
  expiresAt?: string;
  enabledFeatures: ProFeatureFlag[];
}
