import type {
  LibraryAuditSkillInput,
  LibraryNameCollision,
  LibraryDescriptionOverlap,
  LibraryTokenWarning,
  LibraryAuditReport,
} from './types.ts';
import { estimateTokens } from './linter.ts';

export function auditLibrary(skills: LibraryAuditSkillInput[]): LibraryAuditReport {
  const list = Array.isArray(skills) ? skills : [];
  const totalSkills = list.length;
  const activeSkills = list.filter((s) => s.enabled !== false).length;

  // 1. 同名冲突检测 (Name Collision)
  const nameMap = new Map<string, LibraryAuditSkillInput[]>();
  for (const skill of list) {
    const norm = (skill.name || '').trim().toLowerCase();
    if (!norm) continue;
    const group = nameMap.get(norm) || [];
    group.push(skill);
    nameMap.set(norm, group);
  }

  const nameCollisions: LibraryNameCollision[] = [];
  for (const [normName, items] of nameMap.entries()) {
    if (items.length > 1) {
      nameCollisions.push({
        name: normName,
        count: items.length,
        skillIds: items.map((i) => i.id || i.name),
        paths: items.map((i) => i.rawPath || i.path || '').filter(Boolean),
      });
    }
  }

  // 2. 描述 Token 开销统计与超标警告
  let totalColdStartTokens = 0;
  const tokenWarnings: LibraryTokenWarning[] = [];

  for (const skill of list) {
    const desc = (skill.description || '').trim();
    const tokens = estimateTokens(`${skill.name}: ${desc}`);
    totalColdStartTokens += tokens;

    if (tokens > 150) {
      tokenWarnings.push({
        skillName: skill.name,
        descriptionTokens: tokens,
        recommendationZh: `Description 当前消耗 ${tokens} tokens，超过 150 tokens 推荐上限，建议精简以降低冷启动开销。`,
        recommendationEn: `Description consumes ${tokens} tokens, exceeding recommended 150 token budget.`,
      });
    }
  }

  const averageColdStartTokens = totalSkills > 0 ? Math.round(totalColdStartTokens / totalSkills) : 0;

  // 3. 触发描述重叠检测 (Jaccard Similarity)
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'this', 'that', 'from', 'as', 'when', 'how', 'use',
    '的', '了', '和', '与', '及', '在', '对', '将', '由', '向', '从', '关于', '进行', '使用', '可以', '通过', '处理',
  ]);

  const tokenizeDesc = (desc: string): Set<string> => {
    const words = desc
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !stopWords.has(w));
    return new Set(words);
  };

  const descriptionOverlaps: LibraryDescriptionOverlap[] = [];

  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const sA = list[i];
      const sB = list[j];
      const descA = (sA.description || '').trim();
      const descB = (sB.description || '').trim();
      if (!descA || !descB) continue;

      const tokensA = tokenizeDesc(descA);
      const tokensB = tokenizeDesc(descB);

      if (tokensA.size === 0 || tokensB.size === 0) continue;

      const intersection: string[] = [];
      for (const t of tokensA) {
        if (tokensB.has(t)) {
          intersection.push(t);
        }
      }

      const unionSize = new Set([...tokensA, ...tokensB]).size;
      const similarity = unionSize > 0 ? Math.round((intersection.length / unionSize) * 100) / 100 : 0;

      if (similarity >= 0.4 && intersection.length >= 2) {
        descriptionOverlaps.push({
          skillA: sA.name,
          skillB: sB.name,
          similarity,
          overlappingKeywords: intersection.slice(0, 8),
          warningZh: `技能 [${sA.name}] 与 [${sB.name}] 的触发说明重叠度为 ${Math.round(similarity * 100)}%，共享关键词 [${intersection.slice(0, 5).join(', ')}]，可能导致智能体选择决策混淆。`,
          warningEn: `Skills [${sA.name}] and [${sB.name}] have ${Math.round(similarity * 100)}% trigger overlap, which may cause router ambiguity.`,
        });
      }
    }
  }

  // 4. 汇总健康评级
  let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
  let summaryZh = '技能库整体状态优良，未发现重名冲突或明显描述冲突。';
  let summaryEn = 'Skill library is healthy with no name collisions or description ambiguities.';

  if (nameCollisions.length > 0) {
    overallStatus = 'critical';
    summaryZh = `发现 ${nameCollisions.length} 处同名冲突，存在技能相互覆盖风险，请优先重命名！`;
    summaryEn = `Found ${nameCollisions.length} name collision(s) with overwrite risks.`;
  } else if (descriptionOverlaps.length > 0 || tokenWarnings.length > 0) {
    overallStatus = 'warning';
    const partsZh: string[] = [];
    const partsEn: string[] = [];
    if (descriptionOverlaps.length > 0) {
      partsZh.push(`${descriptionOverlaps.length} 组触发描述高度重叠`);
      partsEn.push(`${descriptionOverlaps.length} trigger overlap(s)`);
    }
    if (tokenWarnings.length > 0) {
      partsZh.push(`${tokenWarnings.length} 个技能 Description 偏长`);
      partsEn.push(`${tokenWarnings.length} lengthy description(s)`);
    }
    summaryZh = `发现 ${partsZh.join('，')}，建议优化以提升智能体命中率并节省 Token。`;
    summaryEn = `Found ${partsEn.join(', ')}. Recommend fine-tuning for better routing.`;
  }

  return {
    totalSkills,
    activeSkills,
    totalColdStartTokens,
    averageColdStartTokens,
    nameCollisions,
    descriptionOverlaps,
    tokenWarnings,
    overallStatus,
    summaryZh,
    summaryEn,
    auditedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
  };
}
