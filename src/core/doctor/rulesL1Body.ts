import type { DiagnosticIssue } from '../../types/index.ts';
import type { HealthReport, LintIssue, LintOptions } from './types.ts';

export interface L1BodyResult {
  rawDesc: string | undefined;
  trimmedBody: string;
  passed: boolean;
  structureDeduction: number;
  safetyDeduction: number;
  issues: DiagnosticIssue[];
  lintIssues: LintIssue[];
  diagnostics: HealthReport['diagnostics'];
  supplementSuggestions: string[];
  hasSevereRepetition: boolean;
  isDescUnqualified: boolean;
}

export function evaluateL1BodyRules(
  parsedFields: Record<string, any>,
  bodyRaw: string,
  lineCount: number,
  options?: LintOptions,
  yamlWarnings: string[] = [],
  yamlErrors: string[] = []
): L1BodyResult {
  const issues: DiagnosticIssue[] = [];
  const lintIssues: LintIssue[] = [];
  const diagnostics: HealthReport['diagnostics'] = [];
  const supplementSuggestions: string[] = [];

  let passed = true;
  let structureDeduction = 0;
  let safetyDeduction = 0;

  // -------------------------------------------------------------
  // 3. 字段 description 存在性与长度规范
  // -------------------------------------------------------------
  const rawDesc = typeof parsedFields.description === 'string'
    ? parsedFields.description.trim()
    : options?.fallbackMeta?.description?.trim();

  if (!rawDesc) {
    passed = false;
    structureDeduction += 15;
    const msg = 'Frontmatter 缺少必填字段: description（触发时机与功能简述）';
    yamlErrors.push(msg);
    lintIssues.push({
      ruleId: 'L1-DESC-REQUIRED',
      severity: 'critical',
      level: 'L1',
      title: '缺少必填字段: description',
      titleEn: 'Missing Required Field: description',
      message: msg,
      messageEn: 'The description field is required in frontmatter (https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills)',
      officialSourceUrl: 'https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills',
      accessedDate: '2026-10-09',
      dimension: 'structure',
    });
    issues.push({
      type: 'critical',
      dimension: 'structure',
      title: '缺少必填字段: description',
      description: 'Agent 在冷启动阶段仅向上下文载入所有技能的 name 与 description，缺少 description 将导致模型完全无法调度该技能。',
      ruleId: 'L1-DESC-REQUIRED',
      sourceUrl: 'https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills',
      level: 'L1',
    });
    diagnostics.push({
      type: 'error',
      message: 'L1 规范错误: 必须包含 description 字段以指导 Agent 路由激活。',
      messageEn: 'L1 Spec Error: description is required for agent routing.',
    });
    supplementSuggestions.push('补充 description 字段，阐述功能作用与激活时机 (When to use)');
  } else {
    if (rawDesc.length > 1024) {
      const msg = `description 长度超过建议的 1024 字符上限 (${rawDesc.length} > 1024 字符)`;
      yamlWarnings.push(msg);
      lintIssues.push({
        ruleId: 'L1-DESC-LENGTH',
        severity: 'warning',
        level: 'L1',
        title: 'description 长度超限建议',
        titleEn: 'Description exceeds recommended length',
        message: msg,
        messageEn: 'Description exceeds recommended 1024 character limit, bloats discovery tokens (https://agentskills.io/specification)',
        officialSourceUrl: 'https://agentskills.io/specification',
        accessedDate: '2026-10-09',
        dimension: 'structure',
      });
      issues.push({
        type: 'warning',
        dimension: 'structure',
        title: 'description 过长',
        description: msg,
        ruleId: 'L1-DESC-LENGTH',
        sourceUrl: 'https://agentskills.io/specification',
        level: 'L1',
      });
    }

    const descEnglishWords = (rawDesc.match(/[a-zA-Z0-9_-]+/g) || []).length;
    const descChineseChars = (rawDesc.match(/[\u4e00-\u9fa5]/g) || []).length;
    const descWordCount = descEnglishWords + descChineseChars;
    const isDescTooShort = descWordCount < 5;
    const isDescPlaceholder = /^(todo|tbd|placeholder|sample|example|test|desc|description|a skill|skill description|untitled|pending|待补充|测试|暂无描述|待完善|占位符)$/i.test(rawDesc.trim()) ||
      /^(a skill for|a generic skill|just a skill|sample skill)$/i.test(rawDesc.trim());

    if (isDescTooShort || isDescPlaceholder) {
      passed = false;
      structureDeduction += 15;
      const msg = `description 信息量不足（少于 5 个词或属于占位符 "${rawDesc.trim()}"），无法支持智能体路由`;
      yamlWarnings.push(msg);
      lintIssues.push({
        ruleId: 'L1-DESC-SUBSTANCE',
        severity: 'critical',
        level: 'L1',
        title: 'description 信息量不足',
        titleEn: 'Insufficient Description Substance',
        message: msg,
        messageEn: 'Description lacks substance (fewer than 5 words or placeholder). Description is the sole basis for trigger routing (https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills)',
        officialSourceUrl: 'https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills',
        accessedDate: '2026-10-09',
        dimension: 'structure',
      });
      issues.push({
        type: 'critical',
        dimension: 'structure',
        title: 'description 信息量不足',
        description: msg,
        ruleId: 'L1-DESC-SUBSTANCE',
        sourceUrl: 'https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills',
        level: 'L1',
      });
      diagnostics.push({
        type: 'error',
        message: `L1 规范错误: ${msg}`,
        messageEn: 'L1 Spec Error: Description lacks substance for trigger routing.',
      });
      supplementSuggestions.push('扩展 description 描述，说明具体功能与适用场景（不少于 5 个词，避免占位符）');
    }

    const hasXmlTags = /<[^>]+>/.test(rawDesc);
    if (hasXmlTags) {
      passed = false;
      structureDeduction += 15;
      const msg = 'description 中禁止包含 XML 标签，必须为纯文本以防 Prompt 注入与解析歧义';
      yamlErrors.push(msg);
      lintIssues.push({
        ruleId: 'L1-DESC-XML-TAGS',
        severity: 'critical',
        level: 'L1',
        title: 'description 包含 XML 标签',
        titleEn: 'XML Tags Forbidden in Description',
        message: msg,
        messageEn: 'Descriptions cannot contain XML tags or markdown formatting (https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills)',
        officialSourceUrl: 'https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills',
        accessedDate: '2026-10-09',
        dimension: 'structure',
      });
      issues.push({
        type: 'critical',
        dimension: 'structure',
        title: 'description 包含 XML 标签',
        description: msg,
        ruleId: 'L1-DESC-XML-TAGS',
        sourceUrl: 'https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills',
        level: 'L1',
      });
      diagnostics.push({
        type: 'error',
        message: `L1 规范错误: ${msg}`,
        messageEn: 'L1 Spec Error: Descriptions cannot contain XML tags.',
      });
    }
  }

  const isDescUnqualified = !rawDesc ||
    Boolean(rawDesc && /<[^>]+>/.test(rawDesc)) ||
    ((rawDesc.match(/[a-zA-Z0-9_-]+/g) || []).length + (rawDesc.match(/[\u4e00-\u9fa5]/g) || []).length < 5) ||
    /^(todo|tbd|placeholder|sample|example|test|desc|description|a skill|skill description|untitled|pending|待补充|测试|暂无描述|待完善|占位符)$/i.test(rawDesc.trim()) ||
    /^(a skill for|a generic skill|just a skill|sample skill)$/i.test(rawDesc.trim());

  // -------------------------------------------------------------
  // 4. 正文非空与渐进式披露行数检查
  // -------------------------------------------------------------
  const trimmedBody = bodyRaw.trim();
  if (!trimmedBody) {
    passed = false;
    safetyDeduction += 15;
    const msg = 'SKILL.md 缺少 Markdown 正文指令，Agent 激活后无具体执行指南';
    lintIssues.push({
      ruleId: 'L1-BODY-REQUIRED',
      severity: 'critical',
      level: 'L1',
      title: '正文指令为空',
      titleEn: 'Empty Markdown Body',
      message: msg,
      messageEn: 'SKILL.md must provide actionable instructions in markdown body (https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills)',
      officialSourceUrl: 'https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills',
      accessedDate: '2026-10-09',
      dimension: 'safety',
    });
    issues.push({
      type: 'critical',
      dimension: 'safety',
      title: '正文指令为空',
      description: msg,
      ruleId: 'L1-BODY-REQUIRED',
      sourceUrl: 'https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills',
      level: 'L1',
    });
    diagnostics.push({
      type: 'error',
      message: 'L1 规范错误: 正文无有效指令内容。',
      messageEn: 'L1 Spec Error: SKILL.md body is empty.',
    });
    supplementSuggestions.push('补充 Markdown 正文执行步骤与指南');
  }

  if (lineCount > 500) {
    structureDeduction += 10;
    const msg = `正文总行数 (${lineCount} 行) 超过 Anthropic 官方建议的 500 行上限`;
    lintIssues.push({
      ruleId: 'L1-PROGRESSIVE-DISCLOSURE-LINES',
      severity: 'warning',
      level: 'L1',
      title: '文档超过 500 行',
      titleEn: 'Document exceeds 500 lines',
      message: msg,
      messageEn: 'Anthropic recommends keeping root SKILL.md under 500 lines using progressive disclosure (https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills)',
      officialSourceUrl: 'https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills',
      accessedDate: '2026-10-09',
      dimension: 'structure',
    });
    issues.push({
      type: 'warning',
      dimension: 'structure',
      title: '文档超过 500 行（渐进式披露建议）',
      description: 'Anthropic 官方最佳实践规范建议：单体 SKILL.md 应控制在 500 行以内。若内容庞大，应将详细参考文档拆分至 references/，辅助脚本放入 scripts/。',
      ruleId: 'L1-PROGRESSIVE-DISCLOSURE-LINES',
      sourceUrl: 'https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills',
      level: 'L1',
    });
    diagnostics.push({
      type: 'warning',
      message: '渐进式披露建议: 文档超过 500 行，建议拆分至 references/ 或 scripts/。',
      messageEn: 'Progressive disclosure recommendation: Document exceeds 500 lines.',
    });
  }

  // -------------------------------------------------------------
  // 5. 内容实质性检测 (Substance Check) - SkillDocker 启发式规则
  // -------------------------------------------------------------
  const bodyWords = trimmedBody
    .toLowerCase()
    .replace(/[#*`_~>\-+=|\\[\]().,:;!?'"“”‘’/]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const totalWords = bodyWords.length;
  const uniqueWords = new Set(bodyWords);
  const uniqueRatio = totalWords > 0 ? uniqueWords.size / totalWords : 0;
  const hasSevereRepetition = totalWords >= 15 && (
    (totalWords < 150 && uniqueRatio < 0.35) ||
    (totalWords >= 150 && totalWords < 600 && uniqueRatio < 0.25) ||
    (totalWords >= 600 && uniqueRatio < 0.15)
  );

  if (hasSevereRepetition) {
    passed = false;
    safetyDeduction += 20;
    structureDeduction += 15;
    const msg = '检测到去重后词汇占比过低（大量重复堆砌），缺乏实质业务逻辑 (SkillDocker 启发式规则)';
    lintIssues.push({
      ruleId: 'L1-CONTENT-SUBSTANCE',
      severity: 'critical',
      level: 'L1',
      title: '词汇严重重复堆砌 (SkillDocker 启发式规则)',
      titleEn: 'Severe Word Repetition (SkillDocker Heuristic)',
      message: msg,
      messageEn: 'Severe repetitive keyword stuffing detected (SkillDocker Heuristic)',
      dimension: 'safety',
    });
    issues.push({
      type: 'critical',
      dimension: 'safety',
      title: '词汇严重重复堆砌 (SkillDocker 启发式规则)',
      description: msg,
      ruleId: 'L1-CONTENT-SUBSTANCE',
      level: 'L1',
    });
    diagnostics.push({
      type: 'error',
      message: `内容实质性错误: ${msg}`,
      messageEn: 'Substance error: Severe repetitive keyword stuffing detected (SkillDocker Heuristic).',
    });
  }

  return {
    rawDesc,
    trimmedBody,
    passed,
    structureDeduction,
    safetyDeduction,
    issues,
    lintIssues,
    diagnostics,
    supplementSuggestions,
    hasSevereRepetition,
    isDescUnqualified,
  };
}
