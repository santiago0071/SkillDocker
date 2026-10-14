import { isTauri, invoke } from '@tauri-apps/api/core';
import { SkillMeta, LiveDirective, ConsolidatedRule, EcosystemTarget } from '../types/index.ts';
import { SurgicalInjector } from './injector.ts';
import { SkillCrossCompiler } from './crossCompiler.ts';
import type { RuleSource } from './ruleImporter.ts';

export interface ScanSkillsResponse {
  success: boolean;
  skills: SkillMeta[];
  liveDirectives?: LiveDirective[];
  consolidatedRules?: ConsolidatedRule[];
  error?: string;
}

/**
 * Universal scan across all multi-ecosystem hubs via Native Tauri Rust IPC
 */
export async function scanSkills(): Promise<ScanSkillsResponse> {
  if (isTauri()) {
    try {
      const result = await invoke<ScanSkillsResponse>('scan_all_skills');
      if (result && result.success && Array.isArray(result.skills)) {
        const extractedDirectives: LiveDirective[] = [];
        const consolidatedRulesList: ConsolidatedRule[] = [];
        const seenDirectiveContents = new Set<string>();

        for (const skill of result.skills) {
          const raw = skill.rawContent || '';
          if (!raw) continue;

          // Extract live in-flight directives
          const dirs = SurgicalInjector.extract(raw);
          for (const d of dirs) {
            const key = d.content.trim();
            if (!seenDirectiveContents.has(key)) {
              seenDirectiveContents.add(key);
              extractedDirectives.push(d);
            }
          }

          // Extract permanently consolidated rules
          const rules = SurgicalInjector.extractConsolidatedRules(raw);
          for (const r of rules) {
            consolidatedRulesList.push({
              id: `rule-${skill.id}-${r.text.slice(0, 16)}`,
              skillId: skill.id,
              skillName: skill.name,
              skillPath: skill.rawPath,
              ecosystem: skill.ecosystem,
              priority: (r.priority.toLowerCase() as any) || 'normal',
              content: r.text,
              fullLine: r.fullLine,
            });
          }
        }

        return {
          success: true,
          skills: result.skills,
          liveDirectives: extractedDirectives,
          consolidatedRules: consolidatedRulesList,
        };
      }
    } catch (err: any) {
      console.error('Native Tauri scan_all_skills failed:', err);
      return { success: false, skills: [], error: err?.toString() };
    }
  }

  return { success: false, skills: [], error: 'Desktop native client required' };
}

/**
 * Read raw content of a SKILL.md via Native Rust IPC (enforcing path whitelist)
 */
export async function readSkillContent(rawPath: string): Promise<string> {
  if (isTauri()) {
    try {
      return await invoke<string>('read_skill_file', { path: rawPath });
    } catch (err) {
      console.error('Native Tauri read_skill_file failed:', err);
      throw err;
    }
  }
  return '';
}

/**
 * Save raw content to a SKILL.md with automatic shadow backup and LRU rotation
 */
export async function saveSkillContent(rawPath: string, content: string): Promise<{ success: boolean; error?: string }> {
  if (isTauri()) {
    try {
      await invoke('save_skill_file', { path: rawPath, content });
      return { success: true };
    } catch (err: any) {
      console.error('Native Tauri save_skill_file failed:', err);
      return { success: false, error: err?.toString() || 'Save failed' };
    }
  }
  return { success: false, error: 'Desktop native client required' };
}

/**
 * Rollback skill file to previous shadow backup via Native Rust IPC
 */
export async function rollbackSkillContent(rawPath: string): Promise<{ success: boolean; content?: string; error?: string }> {
  if (isTauri()) {
    try {
      const restored = await invoke<string>('rollback_skill_file', { path: rawPath });
      return { success: true, content: restored };
    } catch (err: any) {
      console.error('Native Tauri rollback_skill_file failed:', err);
      return { success: false, error: err?.toString() || 'Rollback failed' };
    }
  }
  return { success: false, error: 'Desktop native client required' };
}

/**
 * Inject in-flight directives into skill files natively
 */
export async function injectDirectivesNative(
  targetSkillPaths: string[],
  directives: LiveDirective[]
): Promise<boolean> {
  if (isTauri()) {
    try {
      await Promise.all(
        targetSkillPaths.map(async (path) => {
          const raw = await readSkillContent(path);
          const modified = SurgicalInjector.inject(raw, directives);
          await saveSkillContent(path, modified);
        })
      );
      return true;
    } catch (err) {
      console.error('Failed to inject directives natively:', err);
      return false;
    }
  }
  return false;
}

/**
 * Assimilate a directive permanently into a skill's formal SOP natively
 */
export async function assimilateDirectiveNative(
  skillPath: string,
  directive: LiveDirective,
  remainingDirectives: LiveDirective[]
): Promise<{ success: boolean; message?: string }> {
  if (isTauri()) {
    try {
      const raw = await readSkillContent(skillPath);
      const modified = SurgicalInjector.assimilate(raw, directive, remainingDirectives);
      await saveSkillContent(skillPath, modified);
      return { success: true, message: '已正式存入技能' };
    } catch (err: any) {
      console.error('Failed to assimilate directive natively:', err);
      return { success: false, message: err?.toString() || '存入失败' };
    }
  }
  return { success: false, message: '仅支持桌面原生模式' };
}

/**
 * Revoke a permanently consolidated rule from a skill's SOP natively
 */
export async function revokeRuleNative(
  skillPath: string,
  ruleText: string
): Promise<{ success: boolean; message?: string }> {
  if (isTauri()) {
    try {
      const raw = await readSkillContent(skillPath);
      const modified = SurgicalInjector.revokeRule(raw, ruleText);
      await saveSkillContent(skillPath, modified);
      return { success: true };
    } catch (err: any) {
      console.error('Failed to revoke rule natively:', err);
      return { success: false, message: err?.toString() || '撤销失败' };
    }
  }
  return { success: false, message: '仅支持桌面原生模式' };
}

/**
 * Revert a consolidated rule back to in-flight directives natively
 */
export async function revertRuleToLiveNative(
  skillPath: string,
  ruleText: string,
  priority?: string
): Promise<{ success: boolean; restoredDirective?: LiveDirective }> {
  if (isTauri()) {
    try {
      const raw = await readSkillContent(skillPath);
      const withoutRule = SurgicalInjector.revokeRule(raw, ruleText);
      const existingDirectives = SurgicalInjector.extract(withoutRule);

      const restoredDirective: LiveDirective = {
        id: `dir-revert-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        content: ruleText.trim(),
        ephemeral: true,
        priority: (priority as any) || 'normal',
      };

      const finalContent = SurgicalInjector.inject(withoutRule, [restoredDirective, ...existingDirectives]);
      await saveSkillContent(skillPath, finalContent);
      return { success: true, restoredDirective };
    } catch (err) {
      console.error('Failed to revert rule to live natively:', err);
      return { success: false };
    }
  }
  return { success: false };
}

/**
 * Remove a specific in-flight directive from all matching skills natively
 */
export async function removeDirectiveNative(
  directiveId: string,
  content: string,
  skills: SkillMeta[]
): Promise<boolean> {
  const targetContent = (content || '').trim();

  if (isTauri()) {
    try {
      for (const skill of skills) {
        if (!skill.rawPath) continue;
        const raw = await readSkillContent(skill.rawPath);
        if (!raw.includes(SurgicalInjector.TAG_START)) continue;

        const currentDirectives = SurgicalInjector.extract(raw);
        const hasMatch = currentDirectives.some(
          (d) => (targetContent && d.content.trim() === targetContent) || (directiveId && d.id === directiveId)
        );

        if (hasMatch) {
          const remaining = currentDirectives.filter(
            (d) => !((targetContent && d.content.trim() === targetContent) || (directiveId && d.id === directiveId))
          );
          const newContent = remaining.length === 0
            ? SurgicalInjector.remove(raw)
            : SurgicalInjector.inject(raw, remaining);
          await saveSkillContent(skill.rawPath, newContent);
        }
      }
      return true;
    } catch (err) {
      console.error('Failed to remove directive natively:', err);
      return false;
    }
  }
  return false;
}

/**
 * Clear all in-flight directives across all skill files natively
 */
export async function clearAllDirectivesNative(skills: SkillMeta[]): Promise<boolean> {
  if (isTauri()) {
    try {
      for (const skill of skills) {
        if (!skill.rawPath) continue;
        const raw = await readSkillContent(skill.rawPath);
        if (raw.includes(SurgicalInjector.TAG_START)) {
          const cleaned = SurgicalInjector.remove(raw);
          await saveSkillContent(skill.rawPath, cleaned);
        }
      }
      return true;
    } catch (err) {
      console.error('Failed to clear all directives natively:', err);
      return false;
    }
  }
  return false;
}

/**
 * Restore in-flight directives across matching skill files natively (Undo clear/remove)
 */
export async function restoreDirectivesNative(
  directives: LiveDirective[],
  skills: SkillMeta[]
): Promise<boolean> {
  if (isTauri()) {
    try {
      const universalSkills = [
        skills.find((s) => s.ecosystem === 'antigravity' && s.enabled) ||
          skills.find((s) => s.ecosystem === 'antigravity'),
        skills.find((s) => s.ecosystem === 'claude' && s.enabled) ||
          skills.find((s) => s.ecosystem === 'claude'),
        skills.find((s) => s.ecosystem === 'codex' && s.enabled) ||
          skills.find((s) => s.ecosystem === 'codex'),
      ].filter(Boolean) as SkillMeta[];

      const pathToDirectives = new Map<string, LiveDirective[]>();

      for (const dir of directives) {
        const isUniversal =
          !dir.targetSkillId ||
          dir.targetSkillId === 'universal' ||
          dir.targetEcosystem === 'universal';

        if (isUniversal) {
          for (const s of universalSkills) {
            if (!s.rawPath) continue;
            const list = pathToDirectives.get(s.rawPath) || [];
            if (!list.some((x) => x.id === dir.id)) list.push(dir);
            pathToDirectives.set(s.rawPath, list);
          }
        } else {
          const matched = skills.find(
            (s) => s.id === dir.targetSkillId || s.name === dir.targetSkillName
          );
          if (matched?.rawPath) {
            const list = pathToDirectives.get(matched.rawPath) || [];
            if (!list.some((x) => x.id === dir.id)) list.push(dir);
            pathToDirectives.set(matched.rawPath, list);
          }
        }
      }

      // If no specific paths matched, fallback to all universal skills
      if (pathToDirectives.size === 0 && universalSkills.length > 0) {
        for (const s of universalSkills) {
          if (s.rawPath) pathToDirectives.set(s.rawPath, [...directives]);
        }
      }

      for (const [path, dirs] of pathToDirectives.entries()) {
        const raw = await readSkillContent(path);
        const modified = SurgicalInjector.inject(raw, dirs);
        await saveSkillContent(path, modified);
      }
      return true;
    } catch (err) {
      console.error('Failed to restore directives natively:', err);
      return false;
    }
  }
  return false;
}

/**
 * Create brand new skill natively on disk across ecosystems
 */
export async function createSkillNative(params: {
  name: string;
  category: string;
  description: string;
  version?: string;
  bodyText: string;
  ecosystem?: string;
  overwrite?: boolean;
}): Promise<{ success: boolean; skill?: SkillMeta; error?: string; alreadyExists?: boolean }> {
  if (isTauri()) {
    try {
      const skill = await invoke<SkillMeta>('create_new_skill', {
        name: params.name,
        category: params.category,
        description: params.description,
        version: params.version,
        bodyText: params.bodyText,
        ecosystem: params.ecosystem,
        overwrite: params.overwrite ?? false,
      });
      return { success: true, skill };
    } catch (err: any) {
      console.warn('Native Tauri create_new_skill failed:', err);
      const errMsg = err?.toString() || 'Creation failed';
      const alreadyExists = errMsg.toLowerCase().includes('already exists');
      return { success: false, error: errMsg, alreadyExists };
    }
  }
  return { success: false, error: 'Desktop native client required' };
}

/**
 * Pops up OS native folder picker dialog and registers picked directory as authorized workspace
 */
export async function pickAndRegisterWorkspaceNative(): Promise<string | null> {
  if (isTauri()) {
    try {
      const res = await invoke<string | null>('pick_and_register_workspace');
      return res;
    } catch (err: any) {
      console.warn('Failed to pick workspace folder:', err);
      return null;
    }
  }
  return null;
}

/**
 * 1-Click Deploy compiled skill to active project workspace
 */
export async function deployToWorkspaceNative(
  skill: { name: string; description: string; category?: string; version?: string; bodyMarkdown: string },
  target: EcosystemTarget,
  workspaceDir?: string
): Promise<{ success: boolean; fileName: string; badge: string; filePath?: string; error?: string }> {
  const compiled = SkillCrossCompiler.compile(skill, target);
  const root = workspaceDir || '.';
  const targetPath = SkillCrossCompiler.getWorkspaceDeployPath(root, skill.name, target);
  const deployedFileName = targetPath.split('/').pop() || compiled.fileName;

  const saveRes = await saveSkillContent(targetPath, compiled.compiledContent);
  if (saveRes.success) {
    return {
      success: true,
      fileName: deployedFileName,
      badge: compiled.badge,
      filePath: targetPath,
    };
  }
  return {
    success: false,
    fileName: deployedFileName,
    badge: compiled.badge,
    error: saveRes.error || 'Failed to save',
  };
}

/**
 * Opens the specified directory path in the OS native file explorer (Windows Explorer / Finder)
 */
export async function openWorkspaceInExplorerNative(path?: string): Promise<{ success: boolean; error?: string }> {
  if (isTauri()) {
    try {
      await invoke('open_workspace_in_explorer', { path });
      return { success: true };
    } catch (err: any) {
      console.error('Failed to open explorer:', err);
      return { success: false, error: err?.toString() };
    }
  }
  return { success: false, error: 'Desktop native client required' };
}

/**
 * Authorized Workspace management via Native Rust IPC
 */

export async function listAuthorizedWorkspaces(): Promise<string[]> {
  if (isTauri()) {
    try {
      return await invoke<string[]>('list_workspaces');
    } catch (err) {
      console.error('Failed to list workspaces:', err);
    }
  }
  return [];
}

export async function removeAuthorizedWorkspace(path: string): Promise<string[]> {
  if (isTauri()) {
    try {
      return await invoke<string[]>('remove_workspace', { path });
    } catch (err) {
      console.error('Failed to remove workspace:', err);
    }
  }
  return [];
}


/**
 * Read-only discovery of existing rule files (CLAUDE.md / AGENTS.md / .cursorrules / .mdc ...)
 * in the home directory and authorized workspaces, for the import wizard.
 */
export async function discoverRuleSources(): Promise<{ success: boolean; sources: RuleSource[]; error?: string }> {
  if (isTauri()) {
    try {
      const sources = await invoke<RuleSource[]>('discover_rule_sources');
      return { success: true, sources };
    } catch (err: any) {
      console.error('Failed to discover rule sources:', err);
      return { success: false, sources: [], error: err?.toString() || 'Discovery failed' };
    }
  }
  return { success: false, sources: [], error: 'Desktop native client required' };
}
