import type { DiagnosticIssue } from '../../types/index.ts';
import type { HealthReport, LintIssue, LintOptions } from './types.ts';
import { evaluateL1NameRules } from './rulesL1Name.ts';
import { evaluateL1BodyRules } from './rulesL1Body.ts';

export interface L1Context {
  text: string;
  cleaned: string;
  hasOpeningDash: boolean;
  fmMatch: RegExpExecArray | null;
  parsedFields: Record<string, any>;
  yamlValid: boolean;
  yamlParseError?: Error | null;
  yamlErrors: string[];
  yamlWarnings: string[];
  bodyRaw: string;
  options?: LintOptions;
  lineCount: number;
}

export interface L1Result {
  passedL1: boolean;
  structureDeduction: number;
  portabilityDeduction: number;
  safetyDeduction: number;
  redlineDeduction: number;
  freshnessDeduction: number;
  issues: DiagnosticIssue[];
  lintIssues: LintIssue[];
  diagnostics: HealthReport['diagnostics'];
  supplementSuggestions: string[];
  rawName: string | undefined;
  rawDesc: string | undefined;
  trimmedBody: string;
  hasSevereRepetition: boolean;
  isDescUnqualified: boolean;
}

export function evaluateL1Rules(ctx: L1Context): L1Result {
  const {
    hasOpeningDash,
    fmMatch,
    parsedFields,
    yamlValid,
    yamlParseError,
    yamlErrors,
    yamlWarnings,
    bodyRaw,
    options,
    lineCount,
  } = ctx;

  const issues: DiagnosticIssue[] = [];
  const lintIssues: LintIssue[] = [];
  const diagnostics: HealthReport['diagnostics'] = [];
  const supplementSuggestions: string[] = [];

  let passedL1 = true;
  let structureDeduction = 0;
  let portabilityDeduction = 0;
  let safetyDeduction = 0;
  const redlineDeduction = 0;
  const freshnessDeduction = 0;

  // -------------------------------------------------------------
  // 1. YAML Frontmatter Delimiter Check
  // -------------------------------------------------------------
  if (!hasOpeningDash) {
    passedL1 = false;
    structureDeduction += 20;
    const msg = '缺少标准 YAML Frontmatter 元数据标头（未以 --- 开头）';
    yamlErrors.push(msg);
    lintIssues.push({
      ruleId: 'L1-YAML-DELIMITER',
      severity: 'critical',
      level: 'L1',
      title: '缺少 YAML Frontmatter',
      titleEn: 'Missing YAML Frontmatter',
      message: msg,
      messageEn: 'SKILL.md must start with --- frontmatter delimiter (https://agentskills.io/specification)',
      officialSourceUrl: 'https://agentskills.io/specification',
      accessedDate: '2026-10-09',
      dimension: 'structure',
    });
    issues.push({
      type: 'critical',
      dimension: 'structure',
      title: '缺少标准 YAML Frontmatter',
      description: '文档未以三连字符 (---) 包裹元数据标头。根据 Agent Skills 规范，Agent 宿主环境无法识别该技能。',
      ruleId: 'L1-YAML-DELIMITER',
      sourceUrl: 'https://agentskills.io/specification',
      level: 'L1',
    });
    diagnostics.push({
      type: 'error',
      message: 'L1 规范错误: 必须在文档首行声明 --- YAML Frontmatter 分界线。',
      messageEn: 'L1 Spec Error: Must declare --- YAML Frontmatter delimiter at line 1.',
    });
    supplementSuggestions.push('补充标准 YAML Frontmatter 元数据标头（含 name, description）');
  } else if (!fmMatch) {
    passedL1 = false;
    structureDeduction += 20;
    const msg = 'YAML Frontmatter 未正确闭合（缺少闭合 --- 分界线）';
    yamlErrors.push(msg);
    lintIssues.push({
      ruleId: 'L1-YAML-DELIMITER',
      severity: 'critical',
      level: 'L1',
      title: 'Frontmatter 未闭合',
      titleEn: 'Unclosed YAML Frontmatter',
      message: msg,
      messageEn: 'YAML Frontmatter missing closing --- delimiter on its own line (https://agentskills.io/specification)',
      officialSourceUrl: 'https://agentskills.io/specification',
      accessedDate: '2026-10-09',
      dimension: 'structure',
    });
    issues.push({
      type: 'critical',
      dimension: 'structure',
      title: 'Frontmatter 未正确闭合',
      description: '未找到闭合三连字符 (---)，导致 Agent 无法正确切分元数据与正文。',
      ruleId: 'L1-YAML-DELIMITER',
      sourceUrl: 'https://agentskills.io/specification',
      level: 'L1',
    });
    diagnostics.push({
      type: 'error',
      message: 'L1 规范错误: Frontmatter 未闭合，请在元数据下方独立一行添加 ---。',
      messageEn: 'L1 Spec Error: Unclosed frontmatter. Add --- on its own line.',
    });
  } else if (!yamlValid) {
    passedL1 = false;
    structureDeduction += 20;
    const msg = `YAML 语法解析错误: ${yamlParseError?.message || '非法 YAML'}`;
    yamlErrors.push(msg);
    lintIssues.push({
      ruleId: 'L1-YAML-SYNTAX',
      severity: 'critical',
      level: 'L1',
      title: 'YAML 语法解析错误',
      titleEn: 'YAML Syntax Error',
      message: msg,
      messageEn: `Failed to parse YAML frontmatter: ${yamlParseError?.message || 'Invalid syntax'} (https://agentskills.io/specification)`,
      officialSourceUrl: 'https://agentskills.io/specification',
      accessedDate: '2026-10-09',
      dimension: 'structure',
    });
    issues.push({
      type: 'critical',
      dimension: 'structure',
      title: 'YAML 语法不合法',
      description: `Frontmatter 存在 YAML 语法错误：${yamlParseError?.message || '解析失败'}。`,
      ruleId: 'L1-YAML-SYNTAX',
      sourceUrl: 'https://agentskills.io/specification',
      level: 'L1',
    });
    diagnostics.push({
      type: 'error',
      message: `L1 规范错误: YAML 语法错误 (${yamlParseError?.message || '格式异常'})。`,
      messageEn: `L1 Spec Error: YAML syntax error: ${yamlParseError?.message}`,
    });
  }

  // -------------------------------------------------------------
  // 2. 字段 name 存在性与命名规范
  // -------------------------------------------------------------
  const nameRes = evaluateL1NameRules(parsedFields, options, yamlErrors);
  if (!nameRes.passed) {
    passedL1 = false;
  }
  structureDeduction += nameRes.structureDeduction;
  portabilityDeduction += nameRes.portabilityDeduction;
  issues.push(...nameRes.issues);
  lintIssues.push(...nameRes.lintIssues);
  diagnostics.push(...nameRes.diagnostics);
  supplementSuggestions.push(...nameRes.supplementSuggestions);

  // -------------------------------------------------------------
  // 3 & 4 & 5. description, body, and repetition checks
  // -------------------------------------------------------------
  const bodyRes = evaluateL1BodyRules(
    parsedFields,
    bodyRaw,
    lineCount,
    options,
    yamlWarnings,
    yamlErrors
  );
  if (!bodyRes.passed) {
    passedL1 = false;
  }
  structureDeduction += bodyRes.structureDeduction;
  safetyDeduction += bodyRes.safetyDeduction;
  issues.push(...bodyRes.issues);
  lintIssues.push(...bodyRes.lintIssues);
  diagnostics.push(...bodyRes.diagnostics);
  supplementSuggestions.push(...bodyRes.supplementSuggestions);

  return {
    passedL1,
    structureDeduction,
    portabilityDeduction,
    safetyDeduction,
    redlineDeduction,
    freshnessDeduction,
    issues,
    lintIssues,
    diagnostics,
    supplementSuggestions,
    rawName: nameRes.rawName,
    rawDesc: bodyRes.rawDesc,
    trimmedBody: bodyRes.trimmedBody,
    hasSevereRepetition: bodyRes.hasSevereRepetition,
    isDescUnqualified: bodyRes.isDescUnqualified,
  };
}
