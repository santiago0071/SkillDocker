import type { DiagnosticReport } from '../../types/index.ts';
import type {
  LintOptions,
  LintReport,
  YamlValidationResult,
  TriggerBenchmarkResult,
  TriggerBenchmarkOptions,
  LibraryAuditSkillInput,
  LibraryAuditReport,
  LibraryConsultationSkillInput,
  LibraryConsultationPayloadEstimate,
  LibraryConsultationReport,
} from './types.ts';
import {
  lint,
  estimateTokens,
  validateYaml,
  diagnose,
  diagnoseHeuristic,
} from './linter.ts';
import {
  diagnoseAi,
  optimizeAi,
  applyRemedy,
  reinforceSkill,
} from './optimizer.ts';
import { runTriggerBenchmark } from './l3TriggerBenchmark.ts';
import { auditLibrary } from './l4LibraryAudit.ts';
import {
  estimateLibraryConsultationPayload,
  consultLibraryAi,
} from './consultation.ts';

export class SkillDoctorEngine {
  public static lint(rawContent: string, options?: LintOptions): LintReport {
    return lint(rawContent, options);
  }

  public static estimateTokens(text: string): number {
    return estimateTokens(text);
  }

  public static validateYaml(markdown: string): YamlValidationResult {
    return validateYaml(markdown);
  }

  public static diagnose(markdown: string, fallbackMeta?: { name?: string; description?: string }): LintReport {
    return diagnose(markdown, fallbackMeta);
  }

  public static diagnoseHeuristic(skillName: string, rawContent: string): DiagnosticReport {
    return diagnoseHeuristic(skillName, rawContent);
  }

  public static async diagnoseAi(
    skillName: string,
    rawContent: string,
    callAiProvider: (prompt: string, sysPrompt: string) => Promise<string>
  ): Promise<DiagnosticReport> {
    return diagnoseAi(skillName, rawContent, callAiProvider);
  }

  public static async optimizeAi(
    skillName: string,
    rawContent: string,
    report: DiagnosticReport | null,
    callAiProvider?: (prompt: string, sysPrompt: string) => Promise<string>
  ): Promise<{ optimizedContent: string; summaryOfChanges: string[]; supplements: string[] }> {
    return optimizeAi(skillName, rawContent, report, callAiProvider);
  }

  public static applyRemedy(rawContent: string, remedyPatch: string): string {
    return applyRemedy(rawContent, remedyPatch);
  }

  public static reinforceSkill(markdown: string): {
    reinforcedMarkdown: string;
    addedSections: string[];
  } {
    return reinforceSkill(markdown);
  }

  public static async runTriggerBenchmark(
    targetSkillInput: { name: string; description: string; bodyMarkdown?: string } | string,
    allSkillsInput?: Array<{ name: string; description: string }>,
    optionsOrCallback?: TriggerBenchmarkOptions | ((prompt: string, sysPrompt?: string) => Promise<string>)
  ): Promise<TriggerBenchmarkResult> {
    return runTriggerBenchmark(targetSkillInput, allSkillsInput, optionsOrCallback);
  }

  public static auditLibrary(skills: LibraryAuditSkillInput[]): LibraryAuditReport {
    return auditLibrary(skills);
  }

  public static estimateLibraryConsultationPayload(
    skills: LibraryConsultationSkillInput[]
  ): LibraryConsultationPayloadEstimate {
    return estimateLibraryConsultationPayload(skills);
  }

  public static async consultLibraryAi(
    skills: LibraryConsultationSkillInput[],
    callAiProvider: (prompt: string, sysPrompt?: string) => Promise<string>
  ): Promise<LibraryConsultationReport> {
    return consultLibraryAi(skills, callAiProvider);
  }
}

export const SkillDoctor = SkillDoctorEngine;
