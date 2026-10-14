import { SkillMeta } from '../types/index.ts';

/**
 * Format raw tool identifiers into human-readable display names
 */
export const formatReadByTool = (tool: string): string => {
  const lower = tool.toLowerCase().trim();
  switch (lower) {
    case 'claude-code':
    case 'claude':
      return 'Claude Code';
    case 'codex':
      return 'Codex';
    case 'gemini-cli':
      return 'Gemini CLI';
    case 'antigravity':
      return 'Antigravity';
    case 'antigravity-cli':
      return 'Antigravity CLI';
    default:
      return tool;
  }
};

/**
 * Get consistent badge styling for readBy tools using existing Tailwind classes
 */
export const getReadByBadgeStyle = (tool: string): string => {
  const lower = tool.toLowerCase().trim();
  if (lower.includes('claude')) {
    return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  }
  if (lower.includes('codex')) {
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  }
  if (lower.includes('gemini')) {
    return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
  }
  if (lower.includes('antigravity')) {
    return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  }
  return 'bg-gray-800 text-gray-300 border-gray-700';
};

export const isLegacySkill = (skill?: SkillMeta | null): boolean => {
  if (!skill) return false;
  return Boolean(skill.legacy || skill.isLegacy);
};

export const isReadOnlySkill = (skill?: SkillMeta | null): boolean => {
  if (!skill) return false;
  return Boolean(skill.readOnly);
};

export const getReadOnlyNotice = (skill?: SkillMeta | null, lang: string = 'zh'): string => {
  if (skill?.readOnlyNotice) {
    return skill.readOnlyNotice;
  }
  return lang === 'zh'
    ? '该技能为只读（例如由远程云端同步），禁止在本地编辑、优化或回滚'
    : 'This skill is read-only (e.g. synced from cloud) and cannot be edited, optimized, or reverted';
};

export const getLegacyNotice = (lang: string = 'zh'): string => {
  return lang === 'zh' ? '旧目录，官方文档未列出' : 'Legacy directory, not in official docs';
};
