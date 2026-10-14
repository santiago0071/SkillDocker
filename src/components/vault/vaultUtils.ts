import { SkillMeta, ManifestSkillEntry } from '../../types/index.ts';
import { Language } from '../../i18n/index.ts';

export function getSkillSourceId(s: SkillMeta): string {
  if (s.sourceId) return s.sourceId;
  const p = s.rawPath.replace(/\\/g, '/').toLowerCase();
  if (p.includes('/skills/synced/') || p.includes('/skills/synced')) return 'claude-synced';
  if (p.includes('/.claude/skills')) return 'claude-user';
  if (p.includes('/.gemini/config/skills')) return 'antigravity-user';
  if (p.includes('/.gemini/antigravity-cli/skills')) return 'antigravity-cli-user';
  if (p.includes('/.gemini/antigravity/skills')) return 'antigravity-legacy';
  if (p.includes('/.gemini/skills')) return 'gemini-cli-user';
  if (p.includes('/.agents/skills')) return 'agents-user';
  if (p.includes('/.codex/skills')) return 'codex-legacy';
  const match = p.match(/\/([^/]+)\/\.agent[s]?\/skills/);
  if (match) return `workspace-${match[1]}`;
  return s.ecosystem ? `${s.ecosystem}-user` : 'claude-user';
}

export function getSkillDirName(s: SkillMeta): string {
  const parts = s.rawPath.replace(/\\/g, '/').split('/');
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return s.name;
}

export const SOURCE_META: Record<string, { labelZh: string; labelEn: string; noteZh?: string; noteEn?: string }> = {
  'claude-user': {
    labelZh: 'Claude Code 用户目录 (claude-user)',
    labelEn: 'Claude Code User Directory (claude-user)',
  },
  'claude-synced': {
    labelZh: 'Claude Code 同步目录 (claude-synced)',
    labelEn: 'Claude Code Synced Directory (claude-synced)',
    noteZh: '来自网页同步，新电脑登录后自动拉取',
    noteEn: 'Synced from web; automatically pulled on sign-in',
  },
  'gemini-cli-user': {
    labelZh: 'Gemini CLI (gemini-cli-user)',
    labelEn: 'Gemini CLI (gemini-cli-user)',
  },
  'antigravity-user': {
    labelZh: 'Antigravity 全局 (antigravity-user)',
    labelEn: 'Antigravity Global (antigravity-user)',
  },
  'antigravity-legacy': {
    labelZh: 'Antigravity 旧版 (antigravity-legacy)',
    labelEn: 'Antigravity Legacy (antigravity-legacy)',
  },
  'antigravity-cli-user': {
    labelZh: 'Antigravity CLI (antigravity-cli-user)',
    labelEn: 'Antigravity CLI (antigravity-cli-user)',
  },
  'agents-user': {
    labelZh: 'Agent Skills 规范目录 (agents-user)',
    labelEn: 'Agent Skills Standard Directory (agents-user)',
  },
  'codex-legacy': {
    labelZh: 'Codex 旧版 (codex-legacy)',
    labelEn: 'Codex Legacy (codex-legacy)',
  },
};

export function getSourceInfo(sourceId: string, lang: Language) {
  if (SOURCE_META[sourceId]) {
    return {
      label: lang === 'zh' ? SOURCE_META[sourceId].labelZh : SOURCE_META[sourceId].labelEn,
      note: lang === 'zh' ? SOURCE_META[sourceId].noteZh : SOURCE_META[sourceId].noteEn,
    };
  }
  if (sourceId.startsWith('workspace-')) {
    const wsName = sourceId.replace('workspace-', '');
    return {
      label: lang === 'zh' ? `工作区项目 (${wsName})` : `Workspace (${wsName})`,
    };
  }
  return { label: sourceId };
}

export function getImportSkillKey(skill: ManifestSkillEntry): string {
  const src = skill.source || skill.ecosystem || 'unknown';
  const dir = skill.directoryName || skill.name;
  return `${src}:${dir}`;
}

export function resolveDefaultTarget(source?: string, ecosystem?: string): string {
  const src = source || ecosystem || 'claude-user';
  if (src === 'codex-legacy' || src === 'codex') return 'agents-user';
  if (src === 'antigravity-legacy') return 'antigravity-user';
  return src;
}
