import type { DiagnosticReport } from '../../types/index.ts';
import { SKILL_DOCTOR_SYSTEM_PROMPT } from '../doctorProtocol.ts';
import { lint } from './linter.ts';
import { executeAiOptimizer } from '../../pro-api/index.ts';

export async function diagnoseAi(
  skillName: string,
  rawContent: string,
  callAiProvider: (prompt: string, sysPrompt: string) => Promise<string>
): Promise<DiagnosticReport> {
  if (rawContent && rawContent.length > 256 * 1024) {
    throw new Error('技能内容超过上限 (256KB)，已拒绝体检。请拆分为模块化子技能。');
  }

  try {
    const prompt = `请对以下名为 [${skillName}] 的 Agent 技能文件（SKILL.md）进行全面深度体检审计，研判其写作质量与指令清晰度，并开具具体补充建议：

\`\`\`markdown
${rawContent}
\`\`\`

请依据 5 维标准输出合规体检报告 JSON。`;

    const aiRes = await callAiProvider(prompt, SKILL_DOCTOR_SYSTEM_PROMPT);
    const jsonMatch = /\{[\s\S]*\}/.exec(aiRes);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (typeof parsed.totalScore === 'number' && parsed.dimensionScores) {
        return {
          skillName,
          totalScore: parsed.totalScore,
          grade: parsed.grade || (parsed.totalScore >= 90 ? '优秀' : parsed.totalScore >= 75 ? '良好' : '存在隐患'),
          dimensionScores: parsed.dimensionScores,
          qualityReview: parsed.qualityReview || 'AI 深度研判完成，技能已评估。',
          supplementSuggestions: Array.isArray(parsed.supplementSuggestions) ? parsed.supplementSuggestions : [],
          issues: Array.isArray(parsed.issues) ? parsed.issues : [],
          prescription: parsed.prescription || 'AI 临床诊断完成。',
          remedyPatch: parsed.remedyPatch || '',
          diagnosedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
          source: 'ai',
        };
      }
    }
  } catch (err) {
    console.warn('AI Clinical Audit failed, falling back to local heuristic:', err);
  }

  return lint(rawContent, { skillName });
}

export async function optimizeAi(
  skillName: string,
  rawContent: string,
  report: DiagnosticReport | null,
  callAiProvider?: (prompt: string, sysPrompt: string) => Promise<string>
): Promise<{ optimizedContent: string; summaryOfChanges: string[]; supplements: string[] }> {
  return executeAiOptimizer(skillName, rawContent, report, callAiProvider);
}

export function applyRemedy(rawContent: string, remedyPatch: string): string {
  if (!remedyPatch || !remedyPatch.trim()) return rawContent;
  const cleanContent = rawContent.trimEnd();

  if (cleanContent.includes('## 🛡️ Skill Doctor 临床补强防线')) {
    return cleanContent;
  }

  return `${cleanContent}\n\n${remedyPatch.trim()}\n`;
}

export function reinforceSkill(markdown: string): {
  reinforcedMarkdown: string;
  addedSections: string[];
} {
  let result = markdown;
  const addedSections: string[] = [];

  if (!result.trimStart().startsWith('---')) {
    const header = `---\nname: skill-reinforced\ndescription: 经 Skill Doctor 规范化加固的标准 Agent 技能。\n---\n\n`;
    result = header + result;
    addedSections.push('标准 YAML Frontmatter 元数据');
  }

  return {
    reinforcedMarkdown: result,
    addedSections,
  };
}
