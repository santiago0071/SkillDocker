import { z } from 'zod';
import type { DiagnosticReport, EcosystemTarget } from '../../types/index.ts';

export const OptimizationOutputSchema = z.object({
  optimizedContent: z.string().min(1, 'Optimized content cannot be empty'),
  summaryOfChanges: z.array(z.string()).default([]),
  supplements: z.array(z.string()).default([]),
});

export type OptimizationOutput = z.infer<typeof OptimizationOutputSchema>;

export interface YamlValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fields: Record<string, any>;
}

export interface HealthItem {
  id: string;
  title: string;
  titleEn: string;
  shortLabelZh: string;
  shortLabelEn: string;
  score: number;
  maxScore: number;
  passed: boolean;
  detail: string;
  detailEn: string;
}

export interface HealthReport {
  score: number; // 0 - 100
  grade: 'defensive' | 'compliant' | 'basic' | 'incomplete' | '优秀' | '良好' | '存在隐患' | '极度危险' | '不合规' | '合规' | '待改进' | string;
  gradeLabel?: string;
  gradeLabelEn?: string;
  gradeBadgeClass?: string;
  items: HealthItem[];
  tokens: number;
  charCount: number;
  lineCount: number;
  yamlValidation: YamlValidationResult;
  diagnostics: Array<{
    type: 'error' | 'warning' | 'tip';
    message: string;
    messageEn?: string;
  }>;
}

export interface LintIssue {
  ruleId: string;
  severity: 'critical' | 'warning' | 'info';
  level: 'L1' | 'L2';
  title: string;
  titleEn: string;
  message: string;
  messageEn: string;
  officialSourceUrl?: string;
  accessedDate?: string; // YYYY-MM-DD
  dimension: 'structure' | 'redline' | 'safety' | 'portability' | 'freshness';
}

export interface LintOptions {
  skillName?: string;
  filePath?: string;
  dirName?: string;
  expectedDirName?: string;
  targetEcosystem?: EcosystemTarget;
  fallbackMeta?: {
    name?: string;
    description?: string;
  };
}

export const TriggerTestCaseSchema = z.object({
  id: z.string(),
  query: z.string(),
  shouldTrigger: z.boolean(),
  selectedSkill: z.string().optional(),
  actualTriggered: z.boolean(),
  reason: z.string().optional(),
});

export const TriggerBenchmarkQueriesSchema = z.object({
  queries: z.array(
    z.object({
      id: z.string().optional(),
      query: z.string().min(1),
      shouldTrigger: z.boolean(),
    })
  ).min(1),
});

export const TriggerBenchmarkDecisionsSchema = z.object({
  decisions: z.array(
    z.object({
      id: z.string(),
      selectedSkill: z.string(),
      reason: z.string().optional(),
    })
  ).min(1),
});

export const TriggerBenchmarkOutputSchema = z.object({
  testCases: z.array(TriggerTestCaseSchema).min(1),
});

export interface TriggerTestCase {
  id: string;
  query: string;
  shouldTrigger: boolean;
  actualTriggered: boolean;
  selectedSkill?: string;
  reason?: string;
}

export interface TriggerBenchmarkResult {
  skillName: string;
  totalTests: number;
  positiveTests: number;
  negativeTests: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  testCases: TriggerTestCase[];
  source: 'ai' | 'deterministic';
}

export interface TriggerBenchmarkOptions {
  testCaseCount?: number;
  callAiProvider?: (prompt: string, sysPrompt?: string) => Promise<string>;
}

export interface LibraryAuditSkillInput {
  id?: string;
  name: string;
  description?: string;
  path?: string;
  rawPath?: string;
  enabled?: boolean;
}

export interface LibraryNameCollision {
  name: string;
  count: number;
  skillIds: string[];
  paths: string[];
}

export interface LibraryDescriptionOverlap {
  skillA: string;
  skillB: string;
  similarity: number; // 0.0 - 1.0
  overlappingKeywords: string[];
  warningZh: string;
  warningEn: string;
}

export interface LibraryTokenWarning {
  skillName: string;
  descriptionTokens: number;
  recommendationZh: string;
  recommendationEn: string;
}

export interface LibraryAuditReport {
  totalSkills: number;
  activeSkills: number;
  totalColdStartTokens: number;
  averageColdStartTokens: number;
  nameCollisions: LibraryNameCollision[];
  descriptionOverlaps: LibraryDescriptionOverlap[];
  tokenWarnings: LibraryTokenWarning[];
  overallStatus: 'healthy' | 'warning' | 'critical';
  summaryZh: string;
  summaryEn: string;
  auditedAt: string;
}

export interface LintReport extends HealthReport, DiagnosticReport {
  lintIssues: LintIssue[];
}

export const LibraryConflictItemSchema = z.object({
  skillA: z.string(),
  skillB: z.string(),
  conflictType: z.string().default('behavioral_deadlock'),
  severity: z.enum(['critical', 'warning', 'info']).default('warning'),
  description: z.string(),
  reconciliationSuggestion: z.string(),
});

export const LibraryTokenEfficiencyIssueSchema = z.object({
  skillName: z.string(),
  estimatedTokens: z.number().optional(),
  issue: z.string(),
  suggestion: z.string(),
});

export const LibraryConsultationOutputSchema = z.object({
  overallHealthScore: z.number().min(0).max(100),
  overallStatus: z.enum(['healthy', 'warning', 'critical']),
  executiveSummary: z.string(),
  conflicts: z.array(LibraryConflictItemSchema).default([]),
  routingAmbiguities: z.array(LibraryConflictItemSchema).default([]),
  tokenEfficiencyIssues: z.array(LibraryTokenEfficiencyIssueSchema).default([]),
  positiveHighlights: z.array(z.string()).default([]),
});

export type LibraryConflictItem = z.infer<typeof LibraryConflictItemSchema>;
export type LibraryTokenEfficiencyIssue = z.infer<typeof LibraryTokenEfficiencyIssueSchema>;
export type LibraryConsultationOutput = z.infer<typeof LibraryConsultationOutputSchema>;

export interface LibraryConsultationSkillInput {
  id?: string;
  name: string;
  description?: string;
  content?: string;
  path?: string;
  rawPath?: string;
  enabled?: boolean;
}

export interface LibraryConsultationReport extends LibraryConsultationOutput {
  totalAudited: number;
  auditedAt: string;
  source: 'ai';
}

export interface LibraryConsultationPayloadEstimate {
  totalEstimatedTokens: number;
  skillList: Array<{
    name: string;
    tokens: number;
  }>;
}
