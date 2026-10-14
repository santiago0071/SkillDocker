import YAML from 'yaml';
import type { SkillMeta } from '../types/index.ts';

export interface ParsedSkillDocument {
  meta: SkillMeta;
  frontmatterText: string;
  bodyText: string;
  hasFrontmatter: boolean;
}

/**
 * Non-destructive parser for SKILL.md documents.
 * Extracts frontmatter safely using YAML 1.2 parser while preserving markdown body.
 */
export class SkillParser {
  private static FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)(?:\r?\n|$)([\s\S]*)$/;

  /**
   * Parse a raw SKILL.md file string into metadata and content body.
   */
  public static parse(rawContent: string, fallbackId: string, filePath: string): ParsedSkillDocument {
    const trimmed = (rawContent || '').replace(/^\uFEFF/, '').trimStart();
    const match = this.FRONTMATTER_REGEX.exec(trimmed);

    if (!match) {
      return {
        meta: {
          id: fallbackId,
          name: fallbackId,
          description: rawContent.slice(0, 100).replace(/\n/g, ' ') + '...',
          enabled: true,
          rawPath: filePath,
        },
        frontmatterText: '',
        bodyText: rawContent,
        hasFrontmatter: false,
      };
    }

    const [, frontmatterRaw, bodyRaw] = match;
    let parsedAttributes: Record<string, unknown>;

    try {
      const parsed = YAML.parse(frontmatterRaw);
      if (parsed && typeof parsed === 'object') {
        parsedAttributes = parsed as Record<string, unknown>;
      } else {
        parsedAttributes = this.parseSimpleYaml(frontmatterRaw);
      }
    } catch {
      parsedAttributes = this.parseSimpleYaml(frontmatterRaw);
    }

    const id = (parsedAttributes.id as string) || (parsedAttributes.name as string) || fallbackId;
    const name = (parsedAttributes.name as string) || id;
    const description = (parsedAttributes.description as string) || '';
    const version = (parsedAttributes.version as string) || '1.0.0';
    const category = this.inferCategory(name, description, parsedAttributes.category as any);

    return {
      meta: {
        id,
        name,
        description,
        enabled: true,
        version,
        category,
        rawPath: filePath,
      },
      frontmatterText: frontmatterRaw,
      bodyText: bodyRaw,
      hasFrontmatter: true,
    };
  }

  /**
   * Intelligently infer skill category based on name, description, and keywords.
   */
  private static inferCategory(
    name: string,
    desc: string,
    explicit?: string
  ): 'safety' | 'workflow' | 'architecture' | 'custom' {
    if (explicit && ['safety', 'workflow', 'architecture', 'custom'].includes(explicit)) {
      return explicit as any;
    }
    const text = `${name} ${desc}`.toLowerCase();
    if (
      text.includes('guard') ||
      text.includes('safety') ||
      text.includes('security') ||
      text.includes('prevention') ||
      text.includes('auditor') ||
      text.includes('loss') ||
      text.includes('cert')
    ) {
      return 'safety';
    }
    if (
      text.includes('workflow') ||
      text.includes('pipeline') ||
      text.includes('migrate') ||
      text.includes('writing') ||
      text.includes('planning') ||
      text.includes('protocol') ||
      text.includes('composer') ||
      text.includes('dbt') ||
      text.includes('airflow')
    ) {
      return 'workflow';
    }
    if (
      text.includes('sdk') ||
      text.includes('framework') ||
      text.includes('architecture') ||
      text.includes('api') ||
      text.includes('cloudflare') ||
      text.includes('firebase') ||
      text.includes('engine') ||
      text.includes('storage') ||
      text.includes('sql') ||
      text.includes('bigquery') ||
      text.includes('spark')
    ) {
      return 'architecture';
    }
    return 'custom';
  }

  /**
   * Safe, lightweight parser for standard key-value YAML frontmatter.
   */
  private static parseSimpleYaml(yamlStr: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const lines = yamlStr.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const colonIdx = trimmed.indexOf(':');
      if (colonIdx > 0) {
        const key = trimmed.slice(0, colonIdx).trim();
        let val = trimmed.slice(colonIdx + 1).trim();

        // Strip quotes if any
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }

        result[key] = val;
      }
    }

    return result;
  }
}
