import { useState, useRef, useEffect } from 'react';
import { WorkspaceState, SkillMeta, LiveDirective, ConsolidatedRule } from '../types/index.ts';
import { Language, translations } from '../i18n/index.ts';
import {
  scanSkills,
  injectDirectivesNative,
  assimilateDirectiveNative,
  revokeRuleNative,
  revertRuleToLiveNative,
  removeDirectiveNative,
  clearAllDirectivesNative,
  restoreDirectivesNative,
} from '../core/clientBridge.ts';
import { migrateKeysToKeyring } from '../core/aiClient.ts';
import { BannerState } from '../components/app/AppBanner.tsx';
import { IMPORT_WIZARD_SEEN_KEY } from '../components/ImportWizardModal';
import { isTauri } from '@tauri-apps/api/core';

export function useWorkspaceDirectives(lang: Language) {
  const [workspace, setWorkspace] = useState<WorkspaceState>({
    currentPath: '.',
    workspaceName: 'SkillDocker',
    ecosystem: 'antigravity',
    activeSkills: [],
    liveDirectives: [],
    consolidatedRules: [],
  });

  // Undo snapshot for cleared or removed directives
  const lastClearedDirectivesRef = useRef<LiveDirective[] | null>(null);
  const undoTimeoutRef = useRef<any>(null);

  const [banner, setBanner] = useState<BannerState | null>({
    message: '正在同步本地技能资产...',
  });

  const showBanner = (message: string, onUndo?: () => Promise<void>, undoLabel?: string) => {
    setBanner({ message, onUndo, undoLabel });
  };

  const t = translations[lang];

  // Fetch real skills from disk via native Tauri IPC or bridge on mount
  const fetchLocalSkills = async () => {
    try {
      showBanner(
        lang === 'zh'
          ? '正在扫描跨生态本地技能库 (~/.gemini, ~/.claude, ~/.codex)...'
          : 'Scanning cross-ecosystem local skills (~/.gemini, ~/.claude, ~/.codex)...'
      );
      const data = await scanSkills();

      if (data && data.success && Array.isArray(data.skills) && data.skills.length > 0) {
        setWorkspace((prev) => ({
          ...prev,
          activeSkills: data.skills,
          liveDirectives:
            Array.isArray(data.liveDirectives) ? data.liveDirectives : prev.liveDirectives,
          consolidatedRules:
            Array.isArray(data.consolidatedRules) ? data.consolidatedRules : [],
        }));
        showBanner(
          t.statusSynced
            .replace('{count}', String(data.skills.length))
            .replace('{dirs}', String(data.liveDirectives?.length || 0))
        );
      } else {
        showBanner(t.emptySkills);
      }
    } catch (err: any) {
      console.warn('Bridge not available or network error', err);
      showBanner(t.statusOffline);
    }
  };

  useEffect(() => {
    migrateKeysToKeyring();
    fetchLocalSkills();
  }, [lang]);

  const handleToggleSkill = (id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      activeSkills: prev.activeSkills.map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      ),
    }));
  };

  // 临时注入或正式存入skill
  const handleInjectDirective = async (
    directiveData: Omit<LiveDirective, 'id' | 'timestamp'>,
    targetSkillId?: string
  ) => {
    const newDirective: LiveDirective = {
      ...directiveData,
      id: `dir-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
    };

    const isUniversal =
      !targetSkillId ||
      targetSkillId === 'universal' ||
      directiveData.targetEcosystem === 'universal';

    const targetSkill = !isUniversal && targetSkillId
      ? workspace.activeSkills.find((s) => s.id === targetSkillId)
      : workspace.activeSkills.find((s) => s.enabled);

    // 模式 A：正式存入skill 模式（永久追加写入正式规则）
    if (!newDirective.ephemeral && targetSkill && targetSkill.rawPath) {
      try {
        const result = await assimilateDirectiveNative(
          targetSkill.rawPath,
          newDirective,
          workspace.liveDirectives
        );
        if (result.success) {
          const ruleContent = newDirective.content;
          showBanner(
            lang === 'zh'
              ? `🧬 已将指令【正式存入skill】至 [${(targetSkill.ecosystem || 'GEMINI').toUpperCase()}] · [${targetSkill.name}]！`
              : `🧬 Directive committed to [${targetSkill.name}]!`,
            async () => {
              try {
                const revokeData = await revokeRuleNative(targetSkill.rawPath, ruleContent);
                if (revokeData.success) {
                  showBanner(
                    lang === 'zh'
                      ? `✓ 已成功秒级撤回刚才写入 [${targetSkill.name}] 的规则！`
                      : `✓ Successfully revoked rule from [${targetSkill.name}]!`
                  );
                }
              } catch (err) {
                console.warn('Revoke failed:', err);
              }
            },
            lang === 'zh' ? '↩️ 撤回存入' : '↩️ Undo'
          );
        }
      } catch (err) {
        console.warn('Commit to skill failed:', err);
      }
      return;
    }

    // 模式 B：临时干预模式（会话级热注入）
    const updatedDirectives = [newDirective, ...workspace.liveDirectives];
    setWorkspace((prev) => ({
      ...prev,
      liveDirectives: updatedDirectives,
    }));

    // Determine target skills to write to disk
    const targetSkillsToInject: SkillMeta[] = isUniversal
      ? ([
          workspace.activeSkills.find((s) => s.ecosystem === 'antigravity' && s.enabled) ||
            workspace.activeSkills.find((s) => s.ecosystem === 'antigravity'),
          workspace.activeSkills.find((s) => s.ecosystem === 'claude' && s.enabled) ||
            workspace.activeSkills.find((s) => s.ecosystem === 'claude'),
          workspace.activeSkills.find((s) => s.ecosystem === 'codex' && s.enabled) ||
            workspace.activeSkills.find((s) => s.ecosystem === 'codex'),
        ].filter(Boolean) as SkillMeta[])
      : (targetSkill ? [targetSkill] : []);

    if (targetSkillsToInject.length > 0) {
      try {
        const paths = targetSkillsToInject.map((ts) => ts.rawPath).filter(Boolean);
        await injectDirectivesNative(paths, updatedDirectives);

        const bannerMsg = isUniversal
          ? (lang === 'zh'
              ? `⚡ 全生态通用干预生效：已向 Claude, Antigravity, Codex 全生态智能体同步广播热守护。`
              : `⚡ Universal directive active: Broadcast to Claude, Antigravity, and Codex.`)
          : (lang === 'zh'
              ? `⚡ 临时干预生效：已注入至 [${(targetSkill?.ecosystem || 'GEMINI').toUpperCase()}] · [${targetSkill?.name}]，随时可一键撤销。`
              : `⚡ In-flight directive injected into [${targetSkill?.name}], 1-click rollback available.`);

        showBanner(
          bannerMsg,
          async () => {
            handleRemoveDirective(newDirective.id);
            try {
              const remaining = workspace.liveDirectives.filter((d) => d.id !== newDirective.id);
              await injectDirectivesNative(paths, remaining);
              showBanner(lang === 'zh' ? '✓ 已撤回该临时干预指令' : '✓ In-flight directive reverted');
            } catch (e) {
              console.warn('Revert failed:', e);
            }
          },
          lang === 'zh' ? '↩️ 撤回干预' : '↩️ Revert'
        );
      } catch (err) {
        console.warn('Real write failed:', err);
      }
    }
  };

  // 从临时空中干预队列中【一键正式存入skill】
  const handleAssimilateDirective = async (directive: LiveDirective, targetSkillId?: string) => {
    const targetSkill = targetSkillId
      ? workspace.activeSkills.find((s) => s.id === targetSkillId)
      : workspace.activeSkills.find((s) => s.enabled);

    if (!targetSkill || !targetSkill.rawPath) {
      alert(lang === 'zh' ? '请先选择并激活一个目标技能！' : 'Please activate a target skill first!');
      return;
    }

    const remaining = workspace.liveDirectives.filter((d) => d.id !== directive.id);

    try {
      const result = await assimilateDirectiveNative(
        targetSkill.rawPath,
        directive,
        remaining
      );

      if (result.success) {
        const newConsolidatedRule: ConsolidatedRule = {
          id: `rule-${targetSkill.id}-${directive.content.slice(0, 16)}`,
          skillId: targetSkill.id,
          skillName: targetSkill.name,
          skillPath: targetSkill.rawPath,
          ecosystem: targetSkill.ecosystem,
          priority: directive.priority,
          content: directive.content,
        };
        setWorkspace((prev) => ({
          ...prev,
          liveDirectives: remaining,
          consolidatedRules: [newConsolidatedRule, ...(prev.consolidatedRules || [])],
        }));
        showBanner(
          lang === 'zh'
            ? `🧬 成功：已将该指令【正式存入skill】至 [${targetSkill.name}]！`
            : `🧬 Successfully committed directive to [${targetSkill.name}]!`,
          async () => {
            try {
              const revertData = await revertRuleToLiveNative(
                targetSkill.rawPath,
                directive.content,
                directive.priority
              );
              if (revertData.success) {
                setWorkspace((prev) => ({
                  ...prev,
                  liveDirectives: [revertData.restoredDirective || directive, ...prev.liveDirectives],
                  consolidatedRules:
                    prev.consolidatedRules?.filter(
                      (r) => r.content.trim() !== directive.content.trim()
                    ) || [],
                }));
                showBanner(
                  lang === 'zh'
                    ? `✓ 已撤回存入 [${targetSkill.name}]，指令已恢复至临时干预 Skills 队列并成功落盘！`
                    : `✓ Revoked from [${targetSkill.name}] and restored to live directives queue on disk!`
                );
              }
            } catch (err) {
              console.warn('Undo failed:', err);
            }
          },
          lang === 'zh' ? '↩️ 撤回存入' : '↩️ Undo'
        );
      }
    } catch (err) {
      console.warn('Commit to skill failed:', err);
    }
  };

  const handleRevertRuleToLive = async (rule: ConsolidatedRule) => {
    try {
      const data = await revertRuleToLiveNative(
        rule.skillPath,
        rule.content,
        rule.priority
      );
      if (data.success) {
        setWorkspace((prev) => ({
          ...prev,
          consolidatedRules: prev.consolidatedRules?.filter((r) => r.id !== rule.id) || [],
          liveDirectives: data.restoredDirective ? [data.restoredDirective, ...prev.liveDirectives] : prev.liveDirectives,
        }));
        showBanner(
          lang === 'zh'
            ? `✓ 规则已从技能本体移出，并成功恢复至临时指令队列！`
            : `✓ Rule reverted from skill and restored to live directives queue!`
        );
      }
    } catch (err) {
      console.warn('Revert rule to live failed:', err);
    }
  };

  const handleDeleteRule = async (rule: ConsolidatedRule) => {
    try {
      const data = await revokeRuleNative(rule.skillPath, rule.content);
      if (data.success) {
        setWorkspace((prev) => ({
          ...prev,
          consolidatedRules: prev.consolidatedRules?.filter((r) => r.id !== rule.id) || [],
        }));
        showBanner(
          lang === 'zh'
            ? `✓ 已彻底从技能正文中删除该规则`
            : `✓ Rule permanently revoked from skill document`
        );
      }
    } catch (err) {
      console.warn('Delete rule failed:', err);
    }
  };

  const handleUndoRestoreDirectives = async () => {
    const toRestore = lastClearedDirectivesRef.current;
    if (!toRestore || toRestore.length === 0) return;

    try {
      const success = await restoreDirectivesNative(toRestore, workspace.activeSkills);
      if (success) {
        setWorkspace((prev) => {
          const existingIds = new Set(prev.liveDirectives.map((d) => d.id));
          const toAdd = toRestore.filter((d) => !existingIds.has(d.id));
          return {
            ...prev,
            liveDirectives: [...toAdd, ...prev.liveDirectives],
          };
        });

        lastClearedDirectivesRef.current = null;
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

        showBanner(
          lang === 'zh'
            ? `✓ 已成功恢复 ${toRestore.length} 条临时指令并重新在全生态生效！`
            : `✓ Successfully restored ${toRestore.length} directives across all ecosystems!`
        );
      } else {
        showBanner(
          lang === 'zh'
            ? '⚠️ 恢复临时指令失败，请检查文件写入权限'
            : '⚠️ Failed to restore directives, check file permissions'
        );
      }
    } catch (err) {
      console.warn('Failed to restore directives:', err);
    }
  };

  const handleRemoveDirective = async (id: string, directiveContent?: string) => {
    const target = workspace.liveDirectives.find((d) => d.id === id);
    if (!target) return;
    const contentToRemove = directiveContent || target.content || '';

    // Save single directive snapshot for undo
    lastClearedDirectivesRef.current = [target];
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      lastClearedDirectivesRef.current = null;
    }, 30000);

    // Optimistically remove from state
    setWorkspace((prev) => ({
      ...prev,
      liveDirectives: prev.liveDirectives.filter((d) => d.id !== id),
    }));

    try {
      const success = await removeDirectiveNative(id, contentToRemove, workspace.activeSkills);
      if (success) {
        showBanner(
          lang === 'zh'
            ? `✓ 临时指令已移除。按 Ctrl+Z 或点击右侧按钮可恢复。`
            : `✓ Directive removed. Press Ctrl+Z or click button to restore.`,
          handleUndoRestoreDirectives,
          lang === 'zh' ? '↩️ 撤回删除 (Ctrl+Z)' : '↩️ Restore (Ctrl+Z)'
        );
      }
    } catch (err) {
      console.warn('Remove directive failed:', err);
    }
  };

  const handleClearAllDirectives = async () => {
    if (workspace.liveDirectives.length === 0) return;

    const previousDirectives = [...workspace.liveDirectives];
    lastClearedDirectivesRef.current = previousDirectives;

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      lastClearedDirectivesRef.current = null;
    }, 30000);

    setWorkspace((prev) => ({
      ...prev,
      liveDirectives: [],
    }));

    try {
      const success = await clearAllDirectivesNative(workspace.activeSkills);
      if (success) {
        showBanner(
          lang === 'zh'
            ? `✓ 已清空 ${previousDirectives.length} 条临时指令。按 Ctrl+Z 或点击右侧按钮可随时恢复。`
            : `✓ Cleared ${previousDirectives.length} directives. Press Ctrl+Z or click button to restore.`,
          handleUndoRestoreDirectives,
          lang === 'zh' ? '↩️ 恢复清空 (Ctrl+Z)' : '↩️ Restore (Ctrl+Z)'
        );
      }
    } catch (err) {
      console.warn('Clear all directives failed:', err);
    }
  };

  const handleRefresh = () => {
    fetchLocalSkills();
  };

  // First-run import wizard: pull in existing CLAUDE.md / AGENTS.md / .cursorrules once
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  useEffect(() => {
    if (!isTauri()) return;
    try {
      if (!localStorage.getItem(IMPORT_WIZARD_SEEN_KEY)) setIsImportWizardOpen(true);
    } catch {
      // storage unavailable: skip auto-open
    }
  }, []);

  // Skill Editor save callback: seamlessly updates active skill in list
  const handleSkillUpdated = (updatedSkill: SkillMeta) => {
    setWorkspace((prev) => ({
      ...prev,
      activeSkills: prev.activeSkills.map((s) =>
        s.rawPath === updatedSkill.rawPath || s.id === updatedSkill.id
          ? { ...s, ...updatedSkill }
          : s
      ),
    }));
    showBanner(
      lang === 'zh'
        ? `✓ 技能 [${updatedSkill.name}] 已完成磁盘保存与视图同步`
        : `✓ Skill [${updatedSkill.name}] saved to disk and synced in view`
    );
  };

  return {
    workspace,
    banner,
    setBanner,
    showBanner,
    lastClearedDirectivesRef,
    fetchLocalSkills,
    handleToggleSkill,
    handleInjectDirective,
    handleAssimilateDirective,
    handleRevertRuleToLive,
    handleDeleteRule,
    handleUndoRestoreDirectives,
    handleRemoveDirective,
    handleClearAllDirectives,
    handleRefresh,
    isImportWizardOpen,
    setIsImportWizardOpen,
    handleSkillUpdated,
  };
}
