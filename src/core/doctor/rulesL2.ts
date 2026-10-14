import type { DiagnosticIssue } from '../../types/index.ts';
import type { LintIssue } from './types.ts';

export interface L2Context {
  text: string;
  trimmedBody: string;
  rawDesc: string | undefined;
  tokens: number;
  hasSevereRepetition: boolean;
  yamlWarnings: string[];
}

export interface L2Result {
  structureDeduction: number;
  portabilityDeduction: number;
  safetyDeduction: number;
  redlineDeduction: number;
  freshnessDeduction: number;
  issues: DiagnosticIssue[];
  lintIssues: LintIssue[];
}

export function evaluateL2Rules(ctx: L2Context): L2Result {
  const {
    text,
    trimmedBody,
    rawDesc,
    tokens,
    hasSevereRepetition,
    yamlWarnings,
  } = ctx;

  const issues: DiagnosticIssue[] = [];
  const lintIssues: LintIssue[] = [];

  let structureDeduction = 0;
  let portabilityDeduction = 0;
  let safetyDeduction = 0;
  let redlineDeduction = 0;
  let freshnessDeduction = 0;

  // -------------------------------------------------------------
  // L2-0. 检查是否包含实质可执行内容 (代码块、步骤清单、命令调用、文件引用/链接)
  // 降级为 L2 建议，不限制总分、不判不合规；只有 3 句话的纯文字指令型技能，应当判为合规
  // -------------------------------------------------------------
  const hasCodeBlocks = /```[\s\S]*?```/.test(trimmedBody);
  const hasStepList = /^\s*(?:\d+[.)]|[-*+]\s+\[[\sxX]\]|step\s+\d+|步骤\s*\d+)[\s\S]/im.test(trimmedBody) ||
    (trimmedBody.match(/^\s*(?:\d+[.)]|[-*+])\s+\S+/gm) || []).length >= 2;
  const hasCommands = /`[^`\n]{3,}`/.test(trimmedBody) || /^\s*(?:\$|bash|sh|npm|npx|cargo|git|python|node|docker|curl|pnpm|yarn)\s+/im.test(trimmedBody);
  const hasFileReferences = /(?:scripts\/|references\/|docs\/|assets\/|\[.+?\]\(.+?\)|(?:\.\/|\/)[a-zA-Z0-9_./-]+)/i.test(trimmedBody);
  const nonHeadingText = trimmedBody.replace(/^#+\s+.*$/gm, '').replace(/[\s\-_*`]/g, '');

  const hasActionableContent = hasCodeBlocks || hasStepList || hasCommands || hasFileReferences;
  if (!hasActionableContent && nonHeadingText.length < 40 && !hasSevereRepetition) {
    const msg = '正文内容较为简短且未包含代码块、步骤清单或命令调用，建议补充具体执行指令或示例以提升智能体稳定性 (SkillDocker 启发式规则)';
    lintIssues.push({
      ruleId: 'L2-CONTENT-ACTIONABLE',
      severity: 'warning',
      level: 'L2',
      title: '建议丰富可执行内容 (SkillDocker 启发式规则)',
      titleEn: 'Actionable Content Suggestion (SkillDocker Heuristic)',
      message: msg,
      messageEn: 'Content is brief without code blocks, lists, or commands. Consider adding concrete execution steps (SkillDocker Heuristic)',
      dimension: 'structure',
    });
    issues.push({
      type: 'warning',
      dimension: 'structure',
      title: '建议丰富可执行内容 (SkillDocker 启发式规则)',
      description: msg,
      ruleId: 'L2-CONTENT-ACTIONABLE',
      level: 'L2',
    });
  }

  // -------------------------------------------------------------
  // L2-1. description 的“什么时候用”触发说明检查
  // 官方依据: https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills (查阅日期: 2026-10-09)
  // -------------------------------------------------------------
  if (rawDesc) {
    // 明确收紧的触发句式：只认明确触发句式（排除单独出现的 when，以及 for + 动名词）
    const validTriggerPatterns = [
      /\buse\s+(?:this\s+)?when\b/i,
      /\bwhen\s+to\s+use\b/i,
      /\bwhen\s+(?:the\s+user|working\s+with|handling|dealing\s+with|building|creating|debugging|testing|editing|generating|asked\s+to|manipulating)\b/i,
      /\bwhenever\s+(?:the\s+user|working\s+with|handling|dealing\s+with|faced\s+with|executing)\b/i,
      /\b(?:triggers?|triggered)\s+(?:when|on|if)\b/i,
      /\bapplicable\s+(?:when|for\s+scenarios|to\s+scenarios)\b/i,
      /当(?:用户|开发人员|开发者|在|面对|需要|执行|遇到|处理).*(?:时|场景|情况)/,
      /当.*(?:时|时机)使用/,
      /适用于.*(?:场景|情况)/,
      /用于.*(?:时|时机)/,
      /在.*(?:时|场景|情况下)使用/,
      /(?:何时使用|触发时机|激活时机)/,
    ];
    const hasTrigger = validTriggerPatterns.some((pattern) => pattern.test(rawDesc));
    if (!hasTrigger) {
      structureDeduction += 3;
      const msg = 'description 未明确说明何时使用 (When to use)，建议补充触发时机与适用场景以增强 Agent 路由精准度。';
      yamlWarnings.push(msg);
      lintIssues.push({
        ruleId: 'L2-DESC-TRIGGER-SCOPE',
        severity: 'warning',
        level: 'L2',
        title: 'description 建议明确触发场景',
        titleEn: 'Description should include triggers & scope',
        message: msg,
        messageEn: 'Anthropic recommends describing when to use the skill in description (https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills)',
        officialSourceUrl: 'https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills',
        accessedDate: '2026-10-09',
        dimension: 'structure',
      });
      issues.push({
        type: 'warning',
        dimension: 'structure',
        title: 'description 触发场景补充建议',
        description: msg,
        ruleId: 'L2-DESC-TRIGGER-SCOPE',
        sourceUrl: 'https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills',
        level: 'L2',
      });
    }

    // L2-1b. description 人称规范检测 (第一人称或第二人称给出 L2 警告)
    const hasPronouns = /\b(i|me|my|mine|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves)\b/i.test(rawDesc) ||
      /(我|我们|俺|你|您|你们)/.test(rawDesc);
    if (hasPronouns) {
      structureDeduction += 3;
      const msg = 'description 建议使用第三人称客观陈述/祈使句，避免使用第一人称 (I, we, 我) 或第二人称 (you, 你, 您)';
      yamlWarnings.push(msg);
      lintIssues.push({
        ruleId: 'L2-DESC-PRONOUNS',
        severity: 'warning',
        level: 'L2',
        title: 'description 建议使用第三人称',
        titleEn: 'Avoid First/Second Person Pronouns in Description',
        message: msg,
        messageEn: 'Write descriptions in third person. Avoid first-person or second-person pronouns (https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills)',
        officialSourceUrl: 'https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills',
        accessedDate: '2026-10-09',
        dimension: 'structure',
      });
      issues.push({
        type: 'warning',
        dimension: 'structure',
        title: 'description 人称建议',
        description: msg,
        ruleId: 'L2-DESC-PRONOUNS',
        sourceUrl: 'https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills',
        level: 'L2',
      });
    }
  }

  // -------------------------------------------------------------
  // L2-2. Token 开销估算与上下文控制 (SkillDocker 启发式规则)
  // -------------------------------------------------------------
  if (tokens > 5000) {
    structureDeduction += 4;
    const msg = `技能预估消耗约 ${tokens} Tokens，偏重型技能建议拆分辅助文档以降低上下文常驻开销 (SkillDocker 启发式规则)`;
    lintIssues.push({
      ruleId: 'L2-TOKEN-EFFICIENCY',
      severity: 'warning',
      level: 'L2',
      title: 'Token 消耗偏高 (SkillDocker 启发式规则)',
      titleEn: 'High Token footprint (SkillDocker Heuristic)',
      message: msg,
      messageEn: `Estimated ~${tokens} tokens. Consider progressive disclosure to reduce context consumption (SkillDocker Heuristic)`,
      dimension: 'structure',
    });
    issues.push({
      type: 'warning',
      dimension: 'structure',
      title: 'Token 消耗偏高预警 (SkillDocker 启发式规则)',
      description: msg,
      ruleId: 'L2-TOKEN-EFFICIENCY',
      level: 'L2',
    });
  }

  // -------------------------------------------------------------
  // L2-3. 时效性写法检测 (SkillDocker 启发式规则)
  // -------------------------------------------------------------
  const temporalRegex = /\b(201\d|202[0-4])\b|(?:截止到?目前|as of (?:201\d|202[0-4]))/i;
  const temporalMatch = temporalRegex.exec(text);
  if (temporalMatch) {
    freshnessDeduction += 3;
    const msg = `检测到时效性或绝对年份表述 ("${temporalMatch[0]}")，建议使用相对规则或依赖动态环境命令，防范知识过时幻觉 (SkillDocker 启发式规则)。`;
    lintIssues.push({
      ruleId: 'L2-TEMPORAL-FRESHNESS',
      severity: 'warning',
      level: 'L2',
      title: '时效性表述提示 (SkillDocker 启发式规则)',
      titleEn: 'Temporal freshness notice (SkillDocker Heuristic)',
      message: msg,
      messageEn: 'Avoid hardcoded historical years or obsolescent references; prefer dynamic queries (SkillDocker Heuristic)',
      dimension: 'freshness',
    });
    issues.push({
      type: 'warning',
      dimension: 'freshness',
      title: '时效性表述提示 (SkillDocker 启发式规则)',
      description: msg,
      ruleId: 'L2-TEMPORAL-FRESHNESS',
      level: 'L2',
    });
  }

  // -------------------------------------------------------------
  // L2-4. 路径规范检查 (严禁硬编码本地绝对盘符或绝对主目录)
  // 官方依据: https://agentskills.io/specification (查阅日期: 2026-10-09)
  // -------------------------------------------------------------
  const absolutePathRegex = /(?:[a-zA-Z]:[\\/]|(?:\/Users\/|\/home\/)[\w.-]+)/;
  const pathMatch = absolutePathRegex.exec(text);
  if (pathMatch) {
    portabilityDeduction += 4;
    const msg = `检测到本地绝对路径 ("${pathMatch[0]}")，Agent Skills 规范要求使用相对路径 (如 scripts/ 或 references/) 以保持跨环境可移植性。`;
    lintIssues.push({
      ruleId: 'L2-PATH-SPEC',
      severity: 'warning',
      level: 'L2',
      title: '检测到本地绝对路径',
      titleEn: 'Hardcoded absolute path detected',
      message: msg,
      messageEn: 'Use relative paths instead of hardcoded host paths for portability (https://agentskills.io/specification)',
      officialSourceUrl: 'https://agentskills.io/specification',
      accessedDate: '2026-10-09',
      dimension: 'portability',
    });
    issues.push({
      type: 'warning',
      dimension: 'portability',
      title: '路径规范建议',
      description: msg,
      ruleId: 'L2-PATH-SPEC',
      sourceUrl: 'https://agentskills.io/specification',
      level: 'L2',
    });
  }

  // -------------------------------------------------------------
  // L2-5. 破坏性命令上下文边界安全检查 (SkillDocker 启发式规则)
  // -------------------------------------------------------------
  const codeBlocksMatches = text.match(/```[\s\S]*?```|`[^`\n]+`/g) || [];
  const codeBlocksContent = codeBlocksMatches.join('\n');
  const destructiveCmdRegex = /\b(rm\s+-[a-z]*r[a-z]*f|rm\s+-[a-z]*f[a-z]*r|DROP\s+(?:DATABASE|TABLE|SCHEMA)|TRUNCATE(?:\s+TABLE)?|git\s+reset\s+--hard|git\s+push\s+--(?:force|delete)|mkfs(?:\.[a-z0-9]+)?|dd\s+if=)\b/i;
  const destructiveMatch = destructiveCmdRegex.exec(codeBlocksContent);

  if (destructiveMatch) {
    const hasSafetyPrecautions = /\b(backup|confirm|dry-run|prompt|warn|verify|diff|pre-flight|核对|确认|备份|预检|二次确认)\b/i.test(text);
    if (!hasSafetyPrecautions) {
      safetyDeduction += 5;
      redlineDeduction += 5;
      const msg = `代码块中包含破坏性命令 ("${destructiveMatch[0]}")，但未包含二次确认、干跑 (dry-run) 或数据备份安全防护措施 (SkillDocker 启发式规则)。`;
      lintIssues.push({
        ruleId: 'L2-DESTRUCTIVE-SAFETY',
        severity: 'warning',
        level: 'L2',
        title: '高危破坏性命令缺乏安全确认 (SkillDocker 启发式规则)',
        titleEn: 'Destructive command lacks safety precautions (SkillDocker Heuristic)',
        message: msg,
        messageEn: `Destructive command detected ("${destructiveMatch[0]}"). Add confirmation prompts, backups, or dry-run steps (SkillDocker Heuristic)`,
        dimension: 'safety',
      });
      issues.push({
        type: 'warning',
        dimension: 'safety',
        title: '破坏性操作防护建议 (SkillDocker 启发式规则)',
        description: msg,
        ruleId: 'L2-DESTRUCTIVE-SAFETY',
        level: 'L2',
      });
    }
  }

  return {
    structureDeduction,
    portabilityDeduction,
    safetyDeduction,
    redlineDeduction,
    freshnessDeduction,
    issues,
    lintIssues,
  };
}
