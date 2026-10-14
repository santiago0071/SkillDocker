import type { DiagnosticIssue } from '../../types/index.ts';
import type { HealthReport, LintIssue, LintOptions } from './types.ts';

export interface L1NameResult {
  rawName: string | undefined;
  passed: boolean;
  portabilityDeduction: number;
  structureDeduction: number;
  issues: DiagnosticIssue[];
  lintIssues: LintIssue[];
  diagnostics: HealthReport['diagnostics'];
  supplementSuggestions: string[];
}

export function evaluateL1NameRules(
  parsedFields: Record<string, any>,
  options?: LintOptions,
  yamlErrors: string[] = []
): L1NameResult {
  const issues: DiagnosticIssue[] = [];
  const lintIssues: LintIssue[] = [];
  const diagnostics: HealthReport['diagnostics'] = [];
  const supplementSuggestions: string[] = [];

  let passed = true;
  let portabilityDeduction = 0;
  let structureDeduction = 0;

  const rawName = (parsedFields.name as string | undefined)?.trim() || options?.fallbackMeta?.name?.trim() || options?.skillName?.trim();

  if (!rawName) {
    passed = false;
    structureDeduction += 15;
    portabilityDeduction += 15;
    const msg = 'Frontmatter 缺少必填字段: name（技能唯一标识）';
    yamlErrors.push(msg);
    lintIssues.push({
      ruleId: 'L1-NAME-REQUIRED',
      severity: 'critical',
      level: 'L1',
      title: '缺少必填字段: name',
      titleEn: 'Missing Required Field: name',
      message: msg,
      messageEn: 'The name field is required in frontmatter (https://agentskills.io/specification)',
      officialSourceUrl: 'https://agentskills.io/specification',
      accessedDate: '2026-10-09',
      dimension: 'structure',
    });
    issues.push({
      type: 'critical',
      dimension: 'structure',
      title: '缺少必填字段: name',
      description: '未声明 name 字段。Agent Skills 规范规定 name 为技能在调度索引中的唯一 ID。',
      ruleId: 'L1-NAME-REQUIRED',
      sourceUrl: 'https://agentskills.io/specification',
      level: 'L1',
    });
    diagnostics.push({
      type: 'error',
      message: 'L1 规范错误: 缺少必填字段 name。',
      messageEn: 'L1 Spec Error: Missing required name field in frontmatter.',
    });
    supplementSuggestions.push('在 Frontmatter 中增加 name 字段（1-64 字符，小写字母、数字及中划线）');
  } else {
    if (rawName.length > 64) {
      passed = false;
      portabilityDeduction += 15;
      const msg = `name 长度超过 64 字符上限 (${rawName.length} > 64)`;
      yamlErrors.push(msg);
      lintIssues.push({
        ruleId: 'L1-NAME-LENGTH',
        severity: 'critical',
        level: 'L1',
        title: 'name 长度超限',
        titleEn: 'Skill name too long',
        message: msg,
        messageEn: 'Skill name must be between 1 and 64 characters (https://agentskills.io/specification)',
        officialSourceUrl: 'https://agentskills.io/specification',
        accessedDate: '2026-10-09',
        dimension: 'portability',
      });
      issues.push({
        type: 'critical',
        dimension: 'portability',
        title: '技能名称长度超限',
        description: msg,
        ruleId: 'L1-NAME-LENGTH',
        sourceUrl: 'https://agentskills.io/specification',
        level: 'L1',
      });
    }

    const hasUppercase = /[A-Z]/.test(rawName);
    const hasWhitespace = /\s/.test(rawName);
    const hasUnderscore = /_/.test(rawName);
    const validKebabCase = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(rawName);

    if (hasUppercase) {
      passed = false;
      portabilityDeduction += 15;
      const msg = `name 包含大写字母 (${rawName})，违反 kebab-case 小写规范`;
      yamlErrors.push(msg);
      lintIssues.push({
        ruleId: 'L1-NAME-FORMAT',
        severity: 'critical',
        level: 'L1',
        title: 'name 包含大写字母',
        titleEn: 'Skill name contains uppercase',
        message: msg,
        messageEn: 'Skill name must be lowercase kebab-case (https://agentskills.io/specification)',
        officialSourceUrl: 'https://agentskills.io/specification',
        accessedDate: '2026-10-09',
        dimension: 'portability',
      });
      issues.push({
        type: 'critical',
        dimension: 'portability',
        title: '技能名称包含大写字母',
        description: `name 必须全小写（当前为 "${rawName}"），请改为全小写中划线格式。`,
        ruleId: 'L1-NAME-FORMAT',
        sourceUrl: 'https://agentskills.io/specification',
        level: 'L1',
      });
    }

    if (hasWhitespace) {
      passed = false;
      portabilityDeduction += 15;
      const msg = `name 包含空格 (${rawName})，技能标识必须为连续无空格字符`;
      yamlErrors.push(msg);
      lintIssues.push({
        ruleId: 'L1-NAME-FORMAT',
        severity: 'critical',
        level: 'L1',
        title: 'name 包含空格',
        titleEn: 'Skill name contains whitespace',
        message: msg,
        messageEn: 'Skill name must not contain whitespace (https://agentskills.io/specification)',
        officialSourceUrl: 'https://agentskills.io/specification',
        accessedDate: '2026-10-09',
        dimension: 'portability',
      });
      issues.push({
        type: 'critical',
        dimension: 'portability',
        title: '技能名称包含空格',
        description: msg,
        ruleId: 'L1-NAME-FORMAT',
        sourceUrl: 'https://agentskills.io/specification',
        level: 'L1',
      });
    }

    if (hasUnderscore) {
      passed = false;
      portabilityDeduction += 15;
      const msg = `name 包含下划线 (_) ("${rawName}")。根据 Agent Skills 开放标准，下划线在所有平台均为非法格式，必须使用中划线 (-)`;
      yamlErrors.push(msg);
      lintIssues.push({
        ruleId: 'L1-NAME-FORMAT',
        severity: 'critical',
        level: 'L1',
        title: 'name 包含非法下划线',
        titleEn: 'Underscore Forbidden Across All Platforms',
        message: msg,
        messageEn: 'Skill names must only contain lowercase alphanumeric characters and single hyphens. Underscores are not permitted in any Agent Skills ecosystem (https://agentskills.io/specification)',
        officialSourceUrl: 'https://agentskills.io/specification',
        accessedDate: '2026-10-09',
        dimension: 'portability',
      });
      issues.push({
        type: 'critical',
        dimension: 'portability',
        title: '技能名称包含非法下划线',
        description: msg,
        ruleId: 'L1-NAME-FORMAT',
        sourceUrl: 'https://agentskills.io/specification',
        level: 'L1',
      });
      diagnostics.push({
        type: 'error',
        message: `L1 规范错误: ${msg}`,
        messageEn: 'L1 Spec Error: Underscores are forbidden in skill names across all platforms.',
      });
    }

    const hasLeadingHyphen = /^-/.test(rawName);
    const hasTrailingHyphen = /-$/.test(rawName);
    const hasConsecutiveHyphens = /--/.test(rawName);
    if (hasLeadingHyphen || hasTrailingHyphen || hasConsecutiveHyphens) {
      passed = false;
      portabilityDeduction += 15;
      const msg = hasLeadingHyphen
        ? `name 不能以短横线开头 ("${rawName}")`
        : hasTrailingHyphen
        ? `name 不能以短横线结尾 ("${rawName}")`
        : `name 不能包含连续短横线 ("${rawName}")`;
      yamlErrors.push(msg);
      lintIssues.push({
        ruleId: 'L1-NAME-HYPHEN-SPEC',
        severity: 'critical',
        level: 'L1',
        title: 'name 短横线格式不合规',
        titleEn: 'Invalid Hyphen Placement in Skill Name',
        message: msg,
        messageEn: 'Skill names must not start or end with a hyphen, and must not contain consecutive hyphens (https://agentskills.io/specification)',
        officialSourceUrl: 'https://agentskills.io/specification',
        accessedDate: '2026-10-09',
        dimension: 'portability',
      });
      issues.push({
        type: 'critical',
        dimension: 'portability',
        title: '技能名称短横线规范错误',
        description: msg,
        ruleId: 'L1-NAME-HYPHEN-SPEC',
        sourceUrl: 'https://agentskills.io/specification',
        level: 'L1',
      });
      diagnostics.push({
        type: 'error',
        message: `L1 规范错误: ${msg}`,
        messageEn: 'L1 Spec Error: Skill names must not start or end with a hyphen or contain consecutive hyphens.',
      });
    }

    const targetDir = options?.dirName || options?.expectedDirName;
    if (targetDir && rawName && targetDir.trim() !== rawName.trim()) {
      passed = false;
      portabilityDeduction += 15;
      const msg = `技能名称 "${rawName}" 必须与所在目录名 "${targetDir.trim()}" 保持完全一致`;
      yamlErrors.push(msg);
      lintIssues.push({
        ruleId: 'L1-NAME-DIR-MATCH',
        severity: 'critical',
        level: 'L1',
        title: 'name 与目录名不匹配',
        titleEn: 'Skill Name Does Not Match Directory Name',
        message: msg,
        messageEn: 'The directory name must match the skill name (https://agentskills.io/specification)',
        officialSourceUrl: 'https://agentskills.io/specification',
        accessedDate: '2026-10-09',
        dimension: 'portability',
      });
      issues.push({
        type: 'critical',
        dimension: 'portability',
        title: '技能名称与目录名不匹配',
        description: msg,
        ruleId: 'L1-NAME-DIR-MATCH',
        sourceUrl: 'https://agentskills.io/specification',
        level: 'L1',
      });
      diagnostics.push({
        type: 'error',
        message: `L1 规范错误: ${msg}`,
        messageEn: 'L1 Spec Error: The directory name must match the skill name.',
      });
    }

    const hasReservedAnthropicWords = /(?:^|-)(?:anthropic|claude)(?:-|$)/i.test(rawName) || /anthropic|claude/i.test(rawName);
    if (hasReservedAnthropicWords) {
      passed = false;
      portabilityDeduction += 15;
      const msg = `name 包含 Anthropic 平台保留字 ("anthropic" 或 "claude") ("${rawName}")`;
      yamlErrors.push(msg);
      lintIssues.push({
        ruleId: 'L1-NAME-RESERVED-WORD',
        severity: 'critical',
        level: 'L1',
        title: 'name 包含保留字 (Anthropic 平台规则)',
        titleEn: 'Skill Name Contains Reserved Words (Anthropic Rule)',
        message: msg,
        messageEn: "Skill names cannot contain 'anthropic' or 'claude' (https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills)",
        officialSourceUrl: 'https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills',
        accessedDate: '2026-10-09',
        dimension: 'portability',
      });
      issues.push({
        type: 'critical',
        dimension: 'portability',
        title: 'name 包含 Anthropic 保留字',
        description: msg,
        ruleId: 'L1-NAME-RESERVED-WORD',
        sourceUrl: 'https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills',
        level: 'L1',
      });
      diagnostics.push({
        type: 'error',
        message: `L1 规范错误: ${msg}`,
        messageEn: "L1 Spec Error: Skill names cannot contain reserved words 'anthropic' or 'claude'.",
      });
    }

    if (!hasUppercase && !hasWhitespace && !hasUnderscore && !hasLeadingHyphen && !hasTrailingHyphen && !hasConsecutiveHyphens && !validKebabCase) {
      passed = false;
      portabilityDeduction += 10;
      const msg = `name 格式不符合 kebab-case 规范 (${rawName})，不能以连字符开头或结尾`;
      yamlErrors.push(msg);
      lintIssues.push({
        ruleId: 'L1-NAME-FORMAT',
        severity: 'critical',
        level: 'L1',
        title: 'name 格式非法',
        titleEn: 'Invalid kebab-case format',
        message: msg,
        messageEn: 'Skill name must match ^[a-z0-9]+(-[a-z0-9]+)*$ (https://agentskills.io/specification)',
        officialSourceUrl: 'https://agentskills.io/specification',
        accessedDate: '2026-10-09',
        dimension: 'portability',
      });
    }
  }

  return {
    rawName,
    passed,
    portabilityDeduction,
    structureDeduction,
    issues,
    lintIssues,
    diagnostics,
    supplementSuggestions,
  };
}
