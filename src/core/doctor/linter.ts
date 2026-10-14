import YAML from 'yaml';
import type { DiagnosticReport } from '../../types/index.ts';
import type {
  HealthItem,
  HealthReport,
  LintOptions,
  LintReport,
  YamlValidationResult,
} from './types.ts';
import { evaluateL1Rules } from './rulesL1.ts';
import { evaluateL2Rules } from './rulesL2.ts';

export function estimateTokens(text: string): number {
  if (!text) return 0;
  const cjkMatches = text.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;
  const nonCjkText = text.replace(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g, ' ');
  const englishWords = nonCjkText.trim().split(/\s+/).filter(Boolean).length;
  return Math.ceil(cjkCount * 1.3 + englishWords * 1.35);
}

export function lint(rawContent: string, options?: LintOptions): LintReport {
  const text = rawContent || '';
  const charCount = text.length;
  const lines = text.split(/\r?\n/);
  const lineCount = lines.length;
  const tokens = estimateTokens(text);

  const cleaned = text.replace(/^\uFEFF/, '').trimStart();
  const hasOpeningDash = cleaned.startsWith('---');
  const fmMatch = /^---\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)(?:\r?\n|$)([\s\S]*)$/.exec(cleaned);

  let parsedFields: Record<string, any> = {};
  let bodyRaw = text;
  let yamlValid = false;
  let yamlParseError: Error | null = null;
  const yamlErrors: string[] = [];
  const yamlWarnings: string[] = [];

  if (hasOpeningDash && fmMatch) {
    const frontmatterRaw = fmMatch[1];
    bodyRaw = fmMatch[2];
    try {
      const parsed = YAML.parse(frontmatterRaw);
      if (parsed && typeof parsed === 'object') {
        parsedFields = parsed as Record<string, any>;
        yamlValid = true;
      } else {
        throw new Error('Frontmatter 内容未解析为键值对象映射');
      }
    } catch (err: any) {
      yamlParseError = err;
    }
  }

  const l1Res = evaluateL1Rules({
    text,
    cleaned,
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
  });

  const l2Res = evaluateL2Rules({
    text,
    trimmedBody: l1Res.trimmedBody,
    rawDesc: l1Res.rawDesc,
    tokens,
    hasSevereRepetition: l1Res.hasSevereRepetition,
    yamlWarnings,
  });

  const allIssues = [...l1Res.issues, ...l2Res.issues];
  const allLintIssues = [...l1Res.lintIssues, ...l2Res.lintIssues];

  const totalStructureDeduction = l1Res.structureDeduction + l2Res.structureDeduction;
  const totalPortabilityDeduction = l1Res.portabilityDeduction + l2Res.portabilityDeduction;
  const totalSafetyDeduction = l1Res.safetyDeduction + l2Res.safetyDeduction;
  const totalRedlineDeduction = l1Res.redlineDeduction + l2Res.redlineDeduction;
  const totalFreshnessDeduction = l1Res.freshnessDeduction + l2Res.freshnessDeduction;

  const dimStructure = Math.max(0, 20 - totalStructureDeduction);
  const dimPortability = Math.max(0, 20 - totalPortabilityDeduction);
  const dimSafety = Math.max(0, 20 - totalSafetyDeduction);
  const dimRedline = Math.max(0, 20 - totalRedlineDeduction);
  const dimFreshness = Math.max(0, 20 - totalFreshnessDeduction);

  let totalScore = !l1Res.passedL1
    ? Math.max(0, Math.min(45, 50 - allLintIssues.filter((i) => i.severity === 'critical').length * 15))
    : Math.min(100, Math.max(0, dimStructure + dimPortability + dimSafety + dimRedline + dimFreshness));

  if (l1Res.isDescUnqualified) {
    totalScore = Math.min(totalScore, 60);
  }

  const criticalIssues = allLintIssues.filter((i) => i.severity === 'critical');
  const warningIssues = allLintIssues.filter((i) => i.severity === 'warning');

  let grade: HealthReport['grade'];
  let gradeLabel: string;
  let gradeLabelEn: string;
  let gradeBadgeClass: string;

  if (!l1Res.passedL1 || criticalIssues.length > 0) {
    grade = 'incomplete';
    gradeLabel = '不合规';
    gradeLabelEn = 'Non-Compliant';
    gradeBadgeClass = 'bg-red-500/10 text-red-400 border-red-500/30';
  } else if (warningIssues.length === 0) {
    grade = 'compliant';
    gradeLabel = '合规 (0 项问题)';
    gradeLabelEn = 'Compliant (0 Issues)';
    gradeBadgeClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
  } else {
    grade = 'basic';
    gradeLabel = `待改进 (${warningIssues.length} 项建议)`;
    gradeLabelEn = `Needs Improvement (${warningIssues.length} Suggestions)`;
    gradeBadgeClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  }

  const items: HealthItem[] = [
    {
      id: 'yaml_frontmatter',
      title: 'YAML Frontmatter 格式合规',
      titleEn: 'YAML Frontmatter Spec',
      shortLabelZh: 'YAML 标头',
      shortLabelEn: 'Frontmatter',
      score: hasOpeningDash && fmMatch && yamlValid ? 20 : 0,
      maxScore: 20,
      passed: Boolean(hasOpeningDash && fmMatch && yamlValid),
      detail: yamlValid ? '包含合规闭合的 YAML Frontmatter 元数据' : 'Frontmatter 缺失、未闭合或存在 YAML 语法错误',
      detailEn: yamlValid ? 'Valid YAML frontmatter metadata' : 'Missing, unclosed or invalid YAML frontmatter',
    },
    {
      id: 'name_spec',
      title: '技能代号规范 (name)',
      titleEn: 'Skill Name Specification',
      shortLabelZh: '代号规范',
      shortLabelEn: 'Name Spec',
      score: l1Res.rawName && !/[A-Z\s]/.test(l1Res.rawName) && l1Res.rawName.length <= 64 ? 20 : 0,
      maxScore: 20,
      passed: Boolean(l1Res.rawName && !/[A-Z\s]/.test(l1Res.rawName) && l1Res.rawName.length <= 64),
      detail: l1Res.rawName ? `代号为 "${l1Res.rawName}"，符合长度与小写连字符规范` : '缺少 name 字段或格式不符合 kebab-case',
      detailEn: l1Res.rawName ? `Name is "${l1Res.rawName}", adheres to kebab-case` : 'Missing name or non-kebab-case format',
    },
    {
      id: 'desc_spec',
      title: '路由描述完备 (description)',
      titleEn: 'Description & Scope',
      shortLabelZh: '路由描述',
      shortLabelEn: 'Description',
      score: l1Res.rawDesc && l1Res.rawDesc.length <= 1024 ? 20 : 0,
      maxScore: 20,
      passed: Boolean(l1Res.rawDesc && l1Res.rawDesc.length <= 1024),
      detail: l1Res.rawDesc ? `已声明功能与触发说明 (${l1Res.rawDesc.length} 字符)` : '缺少 description 描述，Agent 无法在路由阶段识别',
      detailEn: l1Res.rawDesc ? `Provided trigger scope (${l1Res.rawDesc.length} chars)` : 'Missing description',
    },
    {
      id: 'body_instructions',
      title: '执行指令完备性 (Markdown Body)',
      titleEn: 'Actionable Instructions',
      shortLabelZh: '执行指令',
      shortLabelEn: 'Instructions',
      score: l1Res.trimmedBody && !l1Res.hasSevereRepetition ? 20 : 0,
      maxScore: 20,
      passed: Boolean(l1Res.trimmedBody && !l1Res.hasSevereRepetition),
      detail: l1Res.trimmedBody && !l1Res.hasSevereRepetition ? '具备具体的 Markdown 操作指导指令' : '正文为空或检测到严重词汇重复堆砌',
      detailEn: l1Res.trimmedBody && !l1Res.hasSevereRepetition ? 'Actionable instructions provided' : 'Empty body or severe word repetition',
    },
    {
      id: 'progressive_disclosure',
      title: '渐进式披露控制 (<= 500 行)',
      titleEn: 'Progressive Disclosure',
      shortLabelZh: '上下文控制',
      shortLabelEn: 'Context Scope',
      score: lineCount <= 500 ? 20 : 10,
      maxScore: 20,
      passed: lineCount <= 500,
      detail: lineCount <= 500 ? `正文行数为 ${lineCount} 行，符合精简上下文原则` : `正文超过 500 行 (${lineCount} 行)，建议将辅助文件拆分至 references/`,
      detailEn: lineCount <= 500 ? `File is ${lineCount} lines, within 500-line limit` : `File is ${lineCount} lines (> 500 lines)`,
    },
  ];

  const effectiveSkillName = l1Res.rawName || options?.skillName || 'skill';
  const prescription = l1Res.passedL1
    ? `技能 [${effectiveSkillName}] 完全符合 Agent Skills 官方 L1 规范，可安全跨平台加载与调度。`
    : `技能 [${effectiveSkillName}] 存在 ${criticalIssues.length} 项 L1 规范阻断性错误，请修复后重试。`;

  return {
    score: totalScore,
    totalScore,
    grade,
    gradeLabel,
    gradeLabelEn,
    gradeBadgeClass,
    skillName: effectiveSkillName,
    tokens,
    charCount,
    lineCount,
    yamlValidation: {
      valid: yamlValid && yamlErrors.length === 0,
      errors: yamlErrors,
      warnings: yamlWarnings,
      fields: parsedFields,
    },
    issues: allIssues,
    lintIssues: allLintIssues,
    items,
    diagnostics: l1Res.diagnostics,
    dimensionScores: {
      structure: dimStructure,
      redline: dimRedline,
      safety: dimSafety,
      portability: dimPortability,
      freshness: dimFreshness,
    },
    prescription,
    remedyPatch: '',
    supplementSuggestions: l1Res.supplementSuggestions,
    qualityReview: l1Res.passedL1
      ? '已通过 Agent Skills 官方 L1 静态规范核验，结构严谨，具备跨生态兼容性。'
      : '未能通过 Agent Skills 官方 L1 静态规范核验，请根据清单修复必填元数据与语法错误。',
    diagnosedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
    source: 'heuristic',
  };
}

export function validateYaml(markdown: string): YamlValidationResult {
  const report = lint(markdown);
  return report.yamlValidation;
}

export function diagnose(markdown: string, fallbackMeta?: { name?: string; description?: string }): LintReport {
  return lint(markdown, { fallbackMeta });
}

export function diagnoseHeuristic(skillName: string, rawContent: string): DiagnosticReport {
  return lint(rawContent, { skillName });
}
