import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SkillMeta, LiveDirective } from '../../types/index.ts';
import { AiConfig, UniversalAiClient } from '../../core/aiClient.ts';
import { Language } from '../../i18n/index.ts';
import { SurgicalInjector } from '../../core/injector.ts';
import { saveSkillContent, revokeRuleNative, readSkillContent } from '../../core/clientBridge.ts';
import { SkillParser } from '../../core/parser.ts';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { EditorViewMode, PolishType } from './editorModalTypes.ts';

interface UseSkillEditorParams {
  skill: SkillMeta | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: (updatedMeta: SkillMeta) => void;
  aiConfig: AiConfig;
  lang?: Language;
  liveDirectives?: LiveDirective[];
}

export function useSkillEditor({
  skill,
  isOpen,
  onClose,
  onSaveSuccess,
  aiConfig,
  lang = 'zh',
  liveDirectives = [],
}: UseSkillEditorParams) {
  const [viewMode, setViewMode] = useState<EditorViewMode>('split');
  const [isMaximized, setIsMaximized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishMenuOpen, setPolishMenuOpen] = useState(false);
  const [isShuttleOpen, setIsShuttleOpen] = useState(false);

  // Skill state
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [originalBody, setOriginalBody] = useState('');
  const [frontmatterText, setFrontmatterText] = useState('');
  const [originalFm, setOriginalFm] = useState('');

  // Structured Frontmatter fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('custom');
  const [version, setVersion] = useState('1.0.0');
  const [showRawFm, setShowRawFm] = useState(false);
  const [isConsolidatedRulesExpanded, setIsConsolidatedRulesExpanded] = useState(false);

  // Status & Feedback
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedPath, setCopiedPath] = useState(false);

  // Resizable split ratio between Markdown Editor and Preview (default 50%)
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  const handleSplitResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const rawPct = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(Math.max(rawPct, 20), 80);
      setSplitRatio(clamped);
    };

    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // Fetch full skill content when opened
  useEffect(() => {
    if (!isOpen || !skill?.rawPath) return;

    let isMounted = true;
    setLoading(true);

    // 1. Instant sync pre-population if skill already has content in memory
    const cachedContent = skill.rawContent || '';
    if (cachedContent.trim()) {
      const initialParsed = SkillParser.parse(cachedContent, skill.name, skill.rawPath);
      setBodyMarkdown(initialParsed.bodyText || '');
      setOriginalBody(initialParsed.bodyText || '');
      setFrontmatterText(initialParsed.frontmatterText || '');
      setOriginalFm(initialParsed.frontmatterText || '');
      setName(initialParsed.meta?.name || skill.name || '');
      setDescription(initialParsed.meta?.description || skill.description || '');
      setCategory(initialParsed.meta?.category || skill.category || 'custom');
      setVersion(initialParsed.meta?.version || skill.version || '1.0.0');
      setIsDirty(false);
    } else if (skill.bodyText || skill.frontmatterText) {
      setBodyMarkdown(skill.bodyText || '');
      setOriginalBody(skill.bodyText || '');
      setFrontmatterText(skill.frontmatterText || '');
      setOriginalFm(skill.frontmatterText || '');
      setName(skill.name || '');
      setDescription(skill.description || '');
      setCategory(skill.category || 'custom');
      setVersion(skill.version || '1.0.0');
      setIsDirty(false);
    }

    // 2. Read full content directly from filesystem via native Tauri clientBridge
    const loadContent = async () => {
      try {
        const rawContent = await readSkillContent(skill.rawPath);

        if (isMounted && rawContent && rawContent.trim()) {
          const parsed = SkillParser.parse(rawContent, skill.name, skill.rawPath);
          setBodyMarkdown(parsed.bodyText || '');
          setOriginalBody(parsed.bodyText || '');
          setFrontmatterText(parsed.frontmatterText || '');
          setOriginalFm(parsed.frontmatterText || '');

          setName(parsed.meta?.name || skill.name || '');
          setDescription(parsed.meta?.description || skill.description || '');
          setCategory(parsed.meta?.category || skill.category || 'custom');
          setVersion(parsed.meta?.version || skill.version || '1.0.0');
          setIsDirty(false);
        }
      } catch (err) {
        console.warn('Native readSkillContent failed:', err);
        if (isMounted && !skill.bodyText && !skill.rawContent) {
          showToast(lang === 'zh' ? '无法读取技能详细内容，处于草稿模式' : 'Failed to read skill content, running in draft mode', 'error');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, [isOpen, skill, showToast, lang]);

  // Track unsaved changes
  useEffect(() => {
    const contentChanged = bodyMarkdown !== originalBody || frontmatterText !== originalFm;
    setIsDirty(contentChanged);
  }, [bodyMarkdown, frontmatterText, originalBody, originalFm]);

  // Synchronize structured frontmatter to frontmatterText
  const updateFrontmatterField = (field: 'name' | 'desc' | 'cat' | 'ver', val: string) => {
    let nextName = name;
    let nextDesc = description;
    let nextCat = category;
    let nextVer = version;

    if (field === 'name') {
      nextName = val;
      setName(val);
    } else if (field === 'desc') {
      nextDesc = val;
      setDescription(val);
    } else if (field === 'cat') {
      nextCat = val;
      setCategory(val);
    } else if (field === 'ver') {
      nextVer = val;
      setVersion(val);
    }

    const lines: string[] = [];
    lines.push(`name: ${nextName}`);
    lines.push(`description: ${nextDesc}`);
    lines.push(`category: ${nextCat}`);
    lines.push(`version: ${nextVer}`);

    setFrontmatterText(lines.join('\n'));
    setIsDirty(true);
  };

  // Real-time Markdown HTML generation
  const renderedHtml = useMemo(() => {
    try {
      const rawHtml = marked.parse(bodyMarkdown || (lang === 'zh' ? '*暂无正文内容*' : '*No content yet*'), { async: false }) as string;
      return DOMPurify.sanitize(rawHtml);
    } catch {
      return '<p class="text-red-400">Markdown rendering error</p>';
    }
  }, [bodyMarkdown, lang]);

  // Copy skill absolute path
  const handleCopyPath = () => {
    if (!skill?.rawPath) return;
    navigator.clipboard.writeText(skill.rawPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  // Save to Disk with Shadow Backup
  const handleSave = async () => {
    if (!skill?.rawPath || isSaving) return;

    setIsSaving(true);
    try {
      const fullContent = frontmatterText?.trim()
        ? `---\n${frontmatterText.trim()}\n---\n\n${bodyMarkdown.trim()}\n`
        : bodyMarkdown;
      const res = await saveSkillContent(skill.rawPath, fullContent);

      if (res.success) {
        setOriginalBody(bodyMarkdown);
        setOriginalFm(frontmatterText);
        setIsDirty(false);
        showToast(
          lang === 'zh'
            ? '✓ 已安全落盘！已自动生成快照备份 (.bak)'
            : '✓ Saved to disk! Automatic snapshot backup created (.bak)',
          'success'
        );
        const parsed = SkillParser.parse(fullContent, skill.name, skill.rawPath);
        if (onSaveSuccess && parsed.meta) {
          onSaveSuccess(parsed.meta);
        }
      } else {
        showToast(`Save failed: ${res.error || 'Unknown error'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Network error: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut: Ctrl + S / Cmd + S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape' && isOpen) {
        if (!isDirty || window.confirm(lang === 'zh' ? '当前有未保存的更改，确认关闭吗？' : 'Unsaved changes exist. Exit anyway?')) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty, bodyMarkdown, frontmatterText, lang, onClose, handleSave]);

  // AI Polish & Enhance
  const handleAiPolish = async (type: PolishType) => {
    setPolishMenuOpen(false);
    if (!skill) return;

    setIsPolishing(true);
    showToast(lang === 'zh' ? `✨ 正在调用 ${aiConfig.activeProvider.toUpperCase()} 润色强化中...` : `✨ Invoking ${aiConfig.activeProvider.toUpperCase()} to polish skill...`, 'info');

    try {
      const polished = await UniversalAiClient.polishSkill(
        bodyMarkdown,
        skill.name,
        aiConfig,
        type
      );

      if (polished && polished.trim()) {
        setBodyMarkdown(polished.trim());
        setIsDirty(true);
        showToast(lang === 'zh' ? '✓ AI 润色完成！已无缝更新至编辑器' : '✓ AI polish completed! Updated in editor', 'success');
      } else {
        showToast(lang === 'zh' ? 'AI 未能返回内容，保持原样' : 'AI returned empty response, unchanged', 'error');
      }
    } catch (err: any) {
      showToast(`AI polish error: ${err.message}`, 'error');
    } finally {
      setIsPolishing(false);
    }
  };

  // Revert changes
  const handleRevert = () => {
    if (window.confirm(lang === 'zh' ? '确认放弃当前未保存的修改并回滚至打开时的状态吗？' : 'Discard all unsaved changes and revert to original?')) {
      setBodyMarkdown(originalBody);
      setFrontmatterText(originalFm);
      setIsDirty(false);
      showToast(lang === 'zh' ? '已重置回原始版本' : 'Reverted to original version', 'info');
    }
  };

  // Permanently consolidated rules extraction
  const consolidatedRules = useMemo(() => {
    return SurgicalInjector.extractConsolidatedRules(bodyMarkdown);
  }, [bodyMarkdown]);

  // Active temporary directives targeting this skill
  const activeDirectivesForSkill = useMemo(() => {
    if (!skill || !liveDirectives) return [];
    return liveDirectives.filter((d) => d.targetSkillId === skill.id || d.targetSkillName === skill.name);
  }, [skill, liveDirectives]);

  // One-click Revoke for permanently committed rules
  const handleRevokeRule = async (ruleText: string) => {
    if (!skill?.rawPath) return;

    try {
      const res = await revokeRuleNative(skill.rawPath, ruleText);
      if (res.success) {
        const newBody = SurgicalInjector.revokeRule(bodyMarkdown, ruleText);
        setBodyMarkdown(newBody);
        setOriginalBody(newBody);
        setIsDirty(false);
        showToast(
          lang === 'zh'
            ? `✓ 已成功撤回该规则，原文件已自动生成备份 (.bak)`
            : `✓ Rule revoked successfully, shadow backup created (.bak)`,
          'success'
        );
        if (onSaveSuccess && skill) {
          onSaveSuccess({
            ...skill,
            description,
          });
        }
      } else {
        showToast(res.message || (lang === 'zh' ? '撤销失败' : 'Revoke failed'), 'error');
      }
    } catch (_err: any) {
      showToast(lang === 'zh' ? '撤销失败' : 'Revoke failed', 'error');
    }
  };

  return {
    viewMode,
    setViewMode,
    isMaximized,
    setIsMaximized,
    loading,
    isSaving,
    isPolishing,
    polishMenuOpen,
    setPolishMenuOpen,
    isShuttleOpen,
    setIsShuttleOpen,
    bodyMarkdown,
    setBodyMarkdown,
    frontmatterText,
    setFrontmatterText,
    name,
    description,
    category,
    version,
    showRawFm,
    setShowRawFm,
    isConsolidatedRulesExpanded,
    setIsConsolidatedRulesExpanded,
    isDirty,
    toast,
    setToast,
    copiedPath,
    splitRatio,
    setSplitRatio,
    splitContainerRef,
    handleSplitResizeStart,
    updateFrontmatterField,
    handleCopyPath,
    handleSave,
    handleAiPolish,
    handleRevert,
    handleRevokeRule,
    consolidatedRules,
    activeDirectivesForSkill,
    renderedHtml,
  };
}
