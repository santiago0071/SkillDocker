export interface ContentPreservationResult {
  isValid: boolean;
  missingHeadings: string[];
  missingCodeBlocks: string[];
  reason?: string;
}

export function extractHeadings(markdown: string): string[] {
  const lines = (markdown || '').split(/\r?\n/);
  const headings: string[] = [];
  for (const line of lines) {
    const match = line.match(/^#{1,6}\s+(.+)$/);
    if (match) {
      headings.push(match[1].trim());
    }
  }
  return headings;
}

export function extractCodeBlocks(markdown: string): string[] {
  const codeBlockRegex = /```[\w-]*\r?\n([\s\S]*?)```/g;
  const blocks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = codeBlockRegex.exec(markdown || '')) !== null) {
    const blockContent = m[1].trim();
    if (blockContent) {
      blocks.push(blockContent);
    }
  }
  return blocks;
}

export function validateContentPreservation(
  original: string,
  updated: string
): ContentPreservationResult {
  const origHeadings = extractHeadings(original);
  const updatedHeadings = new Set(extractHeadings(updated));
  const missingHeadings = origHeadings.filter((h) => !updatedHeadings.has(h));

  const origBlocks = extractCodeBlocks(original);
  const updatedNorm = (updated || '').replace(/\r\n/g, '\n');
  const missingCodeBlocks = origBlocks.filter((b) => {
    const bNorm = b.replace(/\r\n/g, '\n');
    return !updatedNorm.includes(bNorm);
  });

  if (missingHeadings.length > 0) {
    return {
      isValid: false,
      missingHeadings,
      missingCodeBlocks,
      reason: `原始标题丢失: ${missingHeadings.slice(0, 3).join(', ')}${missingHeadings.length > 3 ? ' 等' : ''}`,
    };
  }

  if (missingCodeBlocks.length > 0) {
    return {
      isValid: false,
      missingHeadings,
      missingCodeBlocks,
      reason: `检测到 ${missingCodeBlocks.length} 个原始代码块在新内容中丢失`,
    };
  }

  return {
    isValid: true,
    missingHeadings: [],
    missingCodeBlocks: [],
  };
}

export function generateDiffSummary(original: string, updated: string): string[] {
  const origLines = (original || '').split(/\r?\n/);
  const updatedLines = (updated || '').split(/\r?\n/);

  const origSet = new Set(origLines);
  const updatedSet = new Set(updatedLines);

  const addedLines = updatedLines.filter((l) => !origSet.has(l) && l.trim().length > 0);
  const removedLines = origLines.filter((l) => !updatedSet.has(l) && l.trim().length > 0);

  const summary: string[] = [];
  summary.push(`变更统计：新增 ${addedLines.length} 行，移除 ${removedLines.length} 行`);

  const pres = validateContentPreservation(original, updated);
  if (pres.isValid) {
    summary.push(`内容完整性：原文档所有标题与代码块均 100% 完整保留`);
  } else {
    summary.push(`内容完整性警告：${pres.reason}`);
  }

  const origHasFM = /^---\r?\n[\s\S]*?\r?\n---/.test(original);
  const updatedHasFM = /^---\r?\n[\s\S]*?\r?\n---/.test(updated);
  if (!origHasFM && updatedHasFM) {
    summary.push(`元数据增强：规范化补充标准 YAML Frontmatter`);
  } else if (origHasFM && updatedHasFM) {
    summary.push(`元数据增强：优化 Frontmatter 触发时机与描述字段`);
  }

  return summary;
}
