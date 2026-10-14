/**
 * SkillDocker Cross-Compiler Engine (跨生态转译引擎)
 * “一次锻造，全生态通行 (Forge Once, Run Everywhere)”
 */

import type { EcosystemTarget } from '../types/index.ts';

export interface CompiledSkillResult {
  target: EcosystemTarget;
  fileName: string;
  compiledContent: string;
  recommendedPath: string; // e.g. ~/.claude/skills/<name>/SKILL.md or .cursorrules
  badge: string;
}

export class SkillCrossCompiler {
  /**
   * 将通用技能转译为指定生态的原生规范格式
   */
  static compile(
    skill: {
      name: string;
      description: string;
      category?: string;
      version?: string;
      bodyMarkdown: string;
    },
    target: EcosystemTarget
  ): CompiledSkillResult {
    const cleanName = (skill.name || 'custom-skill').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const desc = (skill.description || '').trim();
    const cat = skill.category || 'custom';
    const ver = skill.version || '1.0.0';
    const body = (skill.bodyMarkdown || '').trim();

    switch (target) {
      case 'antigravity': {
        const frontmatter = `name: ${cleanName}\ndescription: ${desc}\ncategory: ${cat}\nversion: ${ver}`;
        return {
          target: 'antigravity',
          fileName: 'SKILL.md',
          recommendedPath: `~/.gemini/config/skills/${cleanName}/SKILL.md`,
          badge: '🟣 Google Antigravity',
          compiledContent: `---\n${frontmatter}\n---\n\n${body}\n`,
        };
      }

      case 'claude': {
        // Claude Code supports ~/.claude/skills/<name>/SKILL.md with frontmatter or CLAUDE.md blocks
        const frontmatter = `name: ${cleanName}\ndescription: ${desc}`;
        return {
          target: 'claude',
          fileName: 'SKILL.md',
          recommendedPath: `~/.claude/skills/${cleanName}/SKILL.md`,
          badge: '🟠 Claude Code',
          compiledContent: `---\n${frontmatter}\n---\n\n${body}\n`,
        };
      }

      case 'codex': {
        // OpenAI Codex CLI / System skills
        const frontmatter = `name: ${cleanName}\ndescription: ${desc}`;
        return {
          target: 'codex',
          fileName: 'SKILL.md',
          recommendedPath: `~/.agents/skills/${cleanName}/SKILL.md`,
          badge: '🟢 OpenAI Codex',
          compiledContent: `---\n${frontmatter}\n---\n\n# OpenAI Codex 核心规约: ${cleanName}\n\n${body}\n`,
        };
      }

      case 'deepseek': {
        // DeepSeek Coding Prompt / DEEPSEEK.md
        return {
          target: 'deepseek',
          fileName: 'DEEPSEEK.md',
          recommendedPath: `./DEEPSEEK.md`,
          badge: '🐋 DeepSeek R1/V3',
          compiledContent: `# DeepSeek AI Agent 专属执行规约 (${cleanName})\n> 触发边界: ${desc}\n\n${body}\n`,
        };
      }

      case 'cursor': {
        // Cursor Rules .cursor/rules/<name>.mdc format
        const frontmatter = `description: ${desc}\nglobs: *\nalwaysApply: true`;
        return {
          target: 'cursor',
          fileName: `${cleanName}.mdc`,
          recommendedPath: `.cursor/rules/${cleanName}.mdc`,
          badge: '🎯 Cursor Rules',
          compiledContent: `---\n${frontmatter}\n---\n\n# Cursor 治理规约: ${cleanName}\n\n${body}\n`,
        };
      }

      case 'agents':
      default: {
        // Universal Agents SDK
        const frontmatter = `name: ${cleanName}\ndescription: ${desc}\ncategory: ${cat}`;
        return {
          target: 'agents',
          fileName: 'SKILL.md',
          recommendedPath: `~/.agents/skills/${cleanName}/SKILL.md`,
          badge: '🔵 Open Agents SDK',
          compiledContent: `---\n${frontmatter}\n---\n\n${body}\n`,
        };
      }
    }
  }

  /**
   * 一键全生态批量编译
   */
  static compileAll(skill: {
    name: string;
    description: string;
    category?: string;
    version?: string;
    bodyMarkdown: string;
  }): Record<EcosystemTarget, CompiledSkillResult> {
    return {
      antigravity: this.compile(skill, 'antigravity'),
      claude: this.compile(skill, 'claude'),
      codex: this.compile(skill, 'codex'),
      deepseek: this.compile(skill, 'deepseek'),
      cursor: this.compile(skill, 'cursor'),
      agents: this.compile(skill, 'agents'),
    };
  }

  /**
   * 获取部署到指定项目工作区时的绝对/相对路径与文件名
   */
  static getWorkspaceDeployPath(root: string, skillName: string, target: EcosystemTarget): string {
    const cleanName = (skillName || 'custom-skill').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const normalizedRoot = root.replace(/\\/g, '/').replace(/\/+$/, '');
    switch (target) {
      case 'antigravity':
        return `${normalizedRoot}/.gemini/skills/${cleanName}/SKILL.md`;
      case 'cursor':
        return `${normalizedRoot}/.cursorrules`;
      case 'claude':
        return `${normalizedRoot}/CLAUDE.md`;
      case 'codex':
        return `${normalizedRoot}/.agents/skills/${cleanName}/SKILL.md`;
      case 'deepseek':
        return `${normalizedRoot}/DEEPSEEK.md`;
      default:
        return `${normalizedRoot}/SKILL.md`;
    }
  }
}
