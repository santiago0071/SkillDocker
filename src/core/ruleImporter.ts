/**
 * Rule Importer (首次导入向导引擎)
 * 把散落在各工具里的规则文件（CLAUDE.md / AGENTS.md / .cursorrules / .mdc ...）
 * 拆成章节、跨文件去重，并生成可直接写入技能库的导入计划。纯函数，无 IO。
 */

import { SurgicalInjector } from './injector.ts';

export type RuleTool = 'claude' | 'codex' | 'gemini' | 'cursor' | 'windsurf' | 'copilot';

export interface RuleSource {
  path: string;
  tool: RuleTool;
  scope: 'global' | 'workspace';
  workspace?: string | null;
  relativePath: string;
  sizeBytes: number;
  content: string;
  truncated: boolean;
}

export interface RuleSection {
  id: string;
  sourcePath: string;
  heading: string | null;
  body: string;
  hash: string;
}

export interface ParsedSource {
  source: RuleSource;
  description: string | null;
  sections: RuleSection[];
}

export interface SectionAnalysis {
  /** hash -> all sections sharing that content, in discovery order */
  groups: Map<string, RuleSection[]>;
  /** hashes already present in the existing skill library */
  existingHashes: Set<string>;
}

export type ImportMode = 'file' | 'section';

export interface PlannedSkill {
  name: string;
  description: string;
  bodyText: string;
  sourcePaths: string[];
  sectionCount: number;
}

export const TOOL_LABELS: Record<RuleTool, string> = {
  claude: 'Claude Code',
  codex: 'Codex / AGENTS.md',
  gemini: 'Gemini / Antigravity',
  cursor: 'Cursor',
  windsurf: 'Windsurf',
  copilot: 'GitHub Copilot',
};

const MANAGED_BLOCK_RE = new RegExp(
  `${escapeRegExp(SurgicalInjector.TAG_START)}[\\s\\S]*?${escapeRegExp(SurgicalInjector.TAG_END)}`,
  'g'
);

const PROVENANCE_RE = /<!-- imported by SkillDocker from: [^\n]*? -->\n*/g;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Small, stable, non-cryptographic hash (FNV-1a 32-bit) for dedupe keys. */
function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Normalizes rule text so trivially different copies (whitespace, bullets, case) collide. */
export function normalizeForHash(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim().replace(/^([-*+]|\d+[.)])\s+/, '').trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .replace(/[ \t]+/g, ' ')
    .toLowerCase();
}

export function hashSection(text: string): string {
  return fnv1a(normalizeForHash(text));
}

/** Strips YAML frontmatter, returning the `description:` value (used by .mdc rules) if present. */
function stripFrontmatter(content: string): { body: string; description: string | null } {
  if (!content.startsWith('---\n')) return { body: content, description: null };
  const end = content.indexOf('\n---', 4);
  if (end === -1) return { body: content, description: null };
  const fm = content.slice(4, end);
  const afterFence = content.indexOf('\n', end + 4);
  const body = afterFence === -1 ? '' : content.slice(afterFence + 1);
  const m = fm.match(/^description:\s*(.*)$/m);
  const description = m ? m[1].trim().replace(/^["']|["']$/g, '').trim() : null;
  return { body, description: description || null };
}

/**
 * Splits a rule file into sections at `## ` headings (ignoring headings inside code fences).
 * Text before the first `##` (minus a lone `# Title`) becomes a heading-less section.
 */
export function parseSource(source: RuleSource): ParsedSource {
  const normalized = source.content
    .replace(/\r\n/g, '\n')
    .replace(MANAGED_BLOCK_RE, '')
    .replace(PROVENANCE_RE, '');
  const { body, description } = stripFrontmatter(normalized);

  const chunks: { heading: string | null; lines: string[] }[] = [{ heading: null, lines: [] }];
  let inFence = false;
  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const h2 = !inFence ? line.match(/^##\s+(.+?)\s*#*\s*$/) : null;
    if (h2) {
      chunks.push({ heading: h2[1].trim(), lines: [] });
    } else {
      chunks[chunks.length - 1].lines.push(line);
    }
  }

  const sections: RuleSection[] = [];
  chunks.forEach((chunk, idx) => {
    let text = chunk.lines.join('\n').trim();
    if (chunk.heading === null) {
      // The file's H1 title is not a rule; skills get their own name.
      text = text.replace(/^#\s+.+$/m, '').trim();
    }
    if (!text) return;
    sections.push({
      id: `${source.path}#${idx}`,
      sourcePath: source.path,
      heading: chunk.heading,
      body: text,
      hash: hashSection(text),
    });
  });

  return { source, description, sections };
}

/** Groups identical sections across sources and flags those already in the skill library. */
export function analyzeSections(parsed: ParsedSource[], existingBodies: string[]): SectionAnalysis {
  const groups = new Map<string, RuleSection[]>();
  for (const p of parsed) {
    for (const s of p.sections) {
      const list = groups.get(s.hash);
      if (list) list.push(s);
      else groups.set(s.hash, [s]);
    }
  }

  const existingHashes = new Set<string>();
  for (const body of existingBodies) {
    const pseudo: RuleSource = {
      path: '__existing__',
      tool: 'claude',
      scope: 'global',
      relativePath: '',
      sizeBytes: 0,
      content: body,
      truncated: false,
    };
    for (const s of parseSource(pseudo).sections) existingHashes.add(s.hash);
    existingHashes.add(hashSection(body));
  }

  return { groups, existingHashes };
}

export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/\.(md|mdc)$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '');
  return slug;
}

function workspaceName(source: RuleSource): string {
  if (source.scope === 'global' || !source.workspace) return 'global';
  const parts = source.workspace.replace(/[\\/]+$/, '').split(/[\\/]/);
  return parts[parts.length - 1] || 'workspace';
}

/** Default skill name for a whole source file, e.g. `myapp-claude-md`, `myapp-cursor-testing`. */
export function defaultNameForSource(source: RuleSource): string {
  const ws = slugify(workspaceName(source)) || 'workspace';
  const fileName = source.relativePath.split('/').pop() || source.tool;
  const isGenericFile = /^(claude|claude\.local|agents|gemini|global_rules|copilot-instructions)\.md$|^\.(cursorrules|windsurfrules)$/i.test(
    fileName
  );
  const fileSlug = isGenericFile ? slugify(fileName.replace(/^\./, '')) : `${source.tool}-${slugify(fileName)}`;
  return `${ws}-${fileSlug || source.tool}`;
}

function uniqueName(base: string, taken: Set<string>): string {
  const root = base || 'imported-rule';
  let name = root;
  for (let i = 2; taken.has(name.toLowerCase()); i++) name = `${root}-${i}`;
  taken.add(name.toLowerCase());
  return name;
}

function firstMeaningfulLine(text: string): string | null {
  for (const raw of text.split('\n')) {
    const line = raw.replace(/^#+\s*|^([-*+]|\d+[.)])\s+|[*_`>]/g, '').trim();
    if (line.length >= 8) return line.length > 120 ? `${line.slice(0, 117)}...` : line;
  }
  return null;
}

/** Descriptions are written unquoted into YAML frontmatter, so keep them to one safe plain scalar. */
export function sanitizeDescription(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/:(\s|$)/g, ' -$1')
    .replace(/\s#/g, ' ')
    .replace(/^[\s\-?:,[\]{}#&*!|>'"%@`]+/, '')
    .replace(/["']/g, '')
    .trim()
    .slice(0, 200);
}

function renderSection(s: RuleSection): string {
  return s.heading ? `## ${s.heading}\n\n${s.body}` : s.body;
}

/**
 * Builds the skills to create. Each unique section is emitted once (first occurrence wins);
 * sections the library already has are skipped. `selectedPaths` limits which sources participate.
 */
export function buildImportPlan(
  parsed: ParsedSource[],
  analysis: SectionAnalysis,
  mode: ImportMode,
  selectedPaths: Set<string>,
  existingNames: string[]
): PlannedSkill[] {
  const taken = new Set(existingNames.map((n) => n.toLowerCase()));
  const emitted = new Set<string>();
  const plan: PlannedSkill[] = [];

  for (const p of parsed) {
    if (!selectedPaths.has(p.source.path)) continue;
    const fresh = p.sections.filter((s) => {
      if (analysis.existingHashes.has(s.hash) || emitted.has(s.hash)) return false;
      emitted.add(s.hash);
      return true;
    });
    if (fresh.length === 0) continue;

    const provenance = `<!-- imported by SkillDocker from: ${p.source.relativePath}${
      p.source.scope === 'workspace' ? ` (${workspaceName(p.source)})` : ''
    } -->`;

    if (mode === 'file') {
      const bodyText = `${provenance}\n\n${fresh.map(renderSection).join('\n\n')}`;
      plan.push({
        name: uniqueName(defaultNameForSource(p.source), taken),
        description: sanitizeDescription(
          p.description || firstMeaningfulLine(fresh[0].body) || `Rules imported from ${p.source.relativePath}`
        ),
        bodyText,
        sourcePaths: [p.source.path],
        sectionCount: fresh.length,
      });
    } else {
      const base = defaultNameForSource(p.source);
      const singleSection = p.sections.length === 1;
      for (const s of fresh) {
        const suffix = singleSection ? '' : s.heading ? slugify(s.heading) || 'section' : 'general';
        plan.push({
          name: uniqueName((suffix ? `${base}-${suffix}` : base).slice(0, 64), taken),
          description: sanitizeDescription(
            s.heading ||
              (s.heading === null ? p.description : null) ||
              firstMeaningfulLine(s.body) ||
              `Rules imported from ${p.source.relativePath}`
          ),
          bodyText: `${provenance}\n\n${renderSection(s)}`,
          sourcePaths: [p.source.path],
          sectionCount: 1,
        });
      }
    }
  }

  return plan;
}

/** Summary numbers for the wizard header. */
export function summarize(parsed: ParsedSource[], analysis: SectionAnalysis, selectedPaths: Set<string>) {
  let total = 0;
  const seen = new Set<string>();
  let duplicates = 0;
  let alreadyInLibrary = 0;
  for (const p of parsed) {
    if (!selectedPaths.has(p.source.path)) continue;
    for (const s of p.sections) {
      total++;
      if (analysis.existingHashes.has(s.hash)) alreadyInLibrary++;
      else if (seen.has(s.hash)) duplicates++;
      seen.add(s.hash);
    }
  }
  return { total, duplicates, alreadyInLibrary, unique: total - duplicates - alreadyInLibrary };
}
