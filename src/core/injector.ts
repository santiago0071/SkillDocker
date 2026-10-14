import type { LiveDirective } from '../types/index.ts';

export interface ShadowSnapshot {
  timestamp: number;
  filePath: string;
  originalContent: string;
  modifiedContent: string;
}

/**
 * Surgical Hot-Injector for AI Agent Context Files (SkillDocker Engine).
 * Supports dual modes:
 * 1. In-flight Steering (空中加油模式: Session managed block, zero Git pollution, rollbackable)
 * 2. Seamless Assimilation (完美融入模式: Permanently solidifies directives into core SOP body)
 */
export class SurgicalInjector {
  public static TAG_START = '<!-- SKILLDOCK_MANAGED_START: live-directives -->';
  public static TAG_END = '<!-- SKILLDOCK_MANAGED_END: live-directives -->';
  public static PERMANENT_SECTION_HEADER = '## 📌 从SkillDocker已正式注入进本文档的历史Skills指令列表';
  public static LEGACY_PERMANENT_SECTION_HEADER = '## 📌 核心准则与固化规约 (Consolidated Rules)';

  /**
   * Inject or update live directives into content using bounded anchor comments (空中加油).
   */
  public static inject(content: string, directives: LiveDirective[]): string {
    if (!directives || directives.length === 0) {
      return this.remove(content);
    }
    const blockContent = this.formatDirectiveBlock(directives);
    const startIndex = content.indexOf(this.TAG_START);
    const endIndex = content.indexOf(this.TAG_END);

    if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
      const before = content.slice(0, startIndex);
      const after = content.slice(endIndex + this.TAG_END.length);
      return before + blockContent + after;
    }

    const frontmatterMatch = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(content);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[0];
      const rest = content.slice(frontmatter.length);
      return frontmatter + '\n' + blockContent + '\n' + rest;
    }

    return blockContent + '\n\n' + content;
  }

  /**
   * Safely strip the managed block entirely (for Rollback / Session Cleanup).
   */
  public static remove(content: string): string {
    const startIndex = content.indexOf(this.TAG_START);
    const endIndex = content.indexOf(this.TAG_END);

    if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
      const before = content.slice(0, startIndex).trimEnd();
      const after = content.slice(endIndex + this.TAG_END.length).trimStart();
      return before + (after ? '\n\n' + after : '');
    }

    return content;
  }

  /**
   * Extract existing live directives from the managed comment block in the file.
   */
  public static extract(content: string): LiveDirective[] {
    const startIndex = content.indexOf(this.TAG_START);
    const endIndex = content.indexOf(this.TAG_END);

    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      return [];
    }

    const blockText = content.slice(startIndex, endIndex);
    const lines = blockText.split(/\r?\n/);
    const directives: LiveDirective[] = [];

    const lineRegex = /^-\s*\*\*\[(.*?)\]\s*\[(.*?)\]\*\*:\s*(.*)$/;

    for (const line of lines) {
      const match = lineRegex.exec(line.trim());
      if (match) {
        const [, priorityRaw, timestamp, text] = match;
        const priority: LiveDirective['priority'] = priorityRaw.includes('CRITICAL')
          ? 'critical'
          : priorityRaw.includes('HIGH')
          ? 'high'
          : 'normal';

        directives.push({
          id: `dir-disk-${timestamp.replace(/[^a-zA-Z0-9]/g, '')}-${directives.length}`,
          timestamp,
          content: text.trim(),
          ephemeral: true,
          priority,
        });
      }
    }

    return directives;
  }

  /**
   * Seamless Assimilation (完美融入模式):
   * Permanently embeds a directive into the document's formal SOP structure,
   * and removes it from the temporary managed comment block.
   */
  public static assimilate(content: string, directive: LiveDirective, remainingDirectives: LiveDirective[]): string {
    // 1. Update or clean up the temporary managed block
    let updatedContent = this.inject(content, remainingDirectives);
    if (remainingDirectives.length === 0) {
      updatedContent = this.remove(updatedContent);
    }

    const ruleEntry = `- **[${directive.priority.toUpperCase()}]** ${directive.content}`;

    // 2. Check if permanent section already exists (supporting both current and legacy headers)
    let sectionHeader = this.PERMANENT_SECTION_HEADER;
    let sectionIndex = updatedContent.indexOf(this.PERMANENT_SECTION_HEADER);
    if (sectionIndex === -1) {
      sectionIndex = updatedContent.indexOf(this.LEGACY_PERMANENT_SECTION_HEADER);
      if (sectionIndex !== -1) {
        sectionHeader = this.LEGACY_PERMANENT_SECTION_HEADER;
      }
    }

    if (sectionIndex !== -1) {
      // Find end of section header line (or guidance notice line right below it)
      const afterHeader = updatedContent.slice(sectionIndex + sectionHeader.length);
      const noticeMatch = /^\r?\n> [^\r\n]*/.exec(afterHeader);
      const insertOffset = sectionIndex + sectionHeader.length + (noticeMatch ? noticeMatch[0].length : 0);

      const before = updatedContent.slice(0, insertOffset);
      const after = updatedContent.slice(insertOffset);
      return before + '\n' + ruleEntry + after;
    }

    // 3. Append new permanent section at the end of the document
    return (
      updatedContent.trimEnd() +
      '\n\n' +
      this.PERMANENT_SECTION_HEADER +
      '\n> *以下为用户在实战中通过 SkillDocker 正式注入本文档的沉淀规约，已成为该技能的永久治理标准：*\n' +
      ruleEntry +
      '\n'
    );
  }

  /**
   * Revoke a committed rule from the permanent SOP block in SKILL.md.
   */
  public static revokeRule(content: string, ruleKeywordOrText: string): string {
    let targetHeader = this.PERMANENT_SECTION_HEADER;
    let sectionIndex = content.indexOf(this.PERMANENT_SECTION_HEADER);
    if (sectionIndex === -1) {
      sectionIndex = content.indexOf(this.LEGACY_PERMANENT_SECTION_HEADER);
      if (sectionIndex !== -1) {
        targetHeader = this.LEGACY_PERMANENT_SECTION_HEADER;
      }
    }
    if (sectionIndex === -1) return content;

    const before = content.slice(0, sectionIndex);
    const sectionAndAfter = content.slice(sectionIndex);

    const lines = sectionAndAfter.split(/\r?\n/);
    const remainingLines: string[] = [];
    let isInsideSection = false;
    let removed = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(targetHeader)) {
        isInsideSection = true;
        remainingLines.push(line);
        continue;
      }

      if (isInsideSection && line.startsWith('## ') && !line.includes(targetHeader)) {
        isInsideSection = false;
      }

      if (isInsideSection && !removed && line.includes(ruleKeywordOrText.trim())) {
        removed = true;
        continue;
      }

      remainingLines.push(line);
    }

    // Check if any rule lines remain under targetHeader
    const headerIdx = remainingLines.findIndex((l) => l.includes(targetHeader));
    if (headerIdx !== -1) {
      let hasRulesBelow = false;
      for (let i = headerIdx + 1; i < remainingLines.length; i++) {
        const l = remainingLines[i].trim();
        if (l.startsWith('## ')) break;
        if (l.startsWith('- **[')) {
          hasRulesBelow = true;
          break;
        }
      }
      if (!hasRulesBelow) {
        // Also remove optional notice block right below header if no rules left
        if (remainingLines[headerIdx + 1]?.trim().startsWith('> *')) {
          remainingLines.splice(headerIdx, 2);
        } else {
          remainingLines.splice(headerIdx, 1);
        }
      }
    }

    return (before + remainingLines.join('\n')).trimEnd() + '\n';
  }

  /**
   * Extract all permanently consolidated rules from a skill document.
   */
  public static extractConsolidatedRules(content: string): Array<{ priority: string; text: string; fullLine: string }> {
    let targetHeader = this.PERMANENT_SECTION_HEADER;
    let sectionIndex = content.indexOf(this.PERMANENT_SECTION_HEADER);
    if (sectionIndex === -1) {
      sectionIndex = content.indexOf(this.LEGACY_PERMANENT_SECTION_HEADER);
      if (sectionIndex !== -1) {
        targetHeader = this.LEGACY_PERMANENT_SECTION_HEADER;
      }
    }
    if (sectionIndex === -1) return [];

    const sectionAndAfter = content.slice(sectionIndex + targetHeader.length);
    const lines = sectionAndAfter.split(/\r?\n/);
    const rules: Array<{ priority: string; text: string; fullLine: string }> = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('## ')) break;
      const match = /^-\s*\*\*\[(.*?)\]\*\*\s*(.*)$/.exec(trimmed);
      if (match) {
        rules.push({
          priority: match[1],
          text: match[2].trim(),
          fullLine: trimmed,
        });
      }
    }
    return rules;
  }

  /**
   * Format live directives into a clean, markdown block with warning comments.
   */
  private static formatDirectiveBlock(directives: LiveDirective[]): string {
    if (directives.length === 0) {
      return '';
    }

    const items = directives.map((d) => {
      const badge = d.priority === 'critical' ? '🔴 CRITICAL' : d.priority === 'high' ? '🟡 HIGH' : '🟢 NORMAL';
      return `- **[${badge}] [${d.timestamp}]**: ${d.content}`;
    });

    return [
      this.TAG_START,
      '### ⚡ SkillDocker 临时空中干预规约（会话级动态上下文 · 随时可撤回）',
      '> *注入临时skills可直接指导正在进行开发的agent与未来agent规划，可随时一键转为正式skills文档。*',
      ...items,
      this.TAG_END,
    ].join('\n');
  }
}
