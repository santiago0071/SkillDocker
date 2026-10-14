import { useState, useMemo, useRef } from 'react';
import { LiveDirective, SkillMeta, EcosystemTarget } from '../../types/index.ts';
import { AiConfig } from '../../core/aiClient.ts';
import { AiService } from '../../core/aiService.ts';
import { Language } from '../../i18n/index.ts';
import { TargetScope } from './injectorTypes.ts';

interface UseLiveInjectorProps {
  onInject: (directive: Omit<LiveDirective, 'id' | 'timestamp'>, targetSkillId?: string) => void;
  onAssimilateDirective: (directive: LiveDirective, targetSkillId?: string) => void;
  skills?: SkillMeta[];
  aiConfig?: AiConfig;
  lang?: Language;
}

export function useLiveInjector({
  onInject,
  onAssimilateDirective,
  skills = [],
  aiConfig,
  lang = 'zh',
}: UseLiveInjectorProps) {
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<LiveDirective['priority']>('normal');
  const [isExpanding, setIsExpanding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Target Scope: universal (broadcast) vs specific ecosystems
  const [targetScope, setTargetScope] = useState<TargetScope>('universal');
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [isQueueExpanded, setIsQueueExpanded] = useState(true);
  const [isRulesExpanded, setIsRulesExpanded] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Confirmation & AI smart route modal state
  const [pendingCommit, setPendingCommit] = useState<{
    content: string;
    priority: LiveDirective['priority'];
    originalDirective?: LiveDirective;
  } | null>(null);

  const [isRouting, setIsRouting] = useState(false);
  const [routeReason, setRouteReason] = useState<string>('');

  // Filter skills based on chosen targetScope
  const filteredSkills = useMemo(() => {
    if (targetScope === 'universal') return [];
    if (targetScope === 'all') return skills;
    return skills.filter((s) => s.ecosystem === targetScope);
  }, [skills, targetScope]);

  // Ecosystem skill counts
  const ecoCounts = useMemo(() => {
    return {
      antigravity: skills.filter((s) => s.ecosystem === 'antigravity').length,
      claude: skills.filter((s) => s.ecosystem === 'claude').length,
      codex: skills.filter((s) => s.ecosystem === 'codex').length,
      agents: skills.filter((s) => s.ecosystem === 'agents').length,
      all: skills.length,
    };
  }, [skills]);

  // Active target identifier
  const activeTargetId = useMemo(() => {
    if (targetScope === 'universal') return 'universal';
    if (selectedSkillId && filteredSkills.some((s) => s.id === selectedSkillId)) {
      return selectedSkillId;
    }
    return filteredSkills.length > 0 ? filteredSkills[0].id : '';
  }, [targetScope, selectedSkillId, filteredSkills]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim()) return;

    if (targetScope === 'universal') {
      onInject(
        {
          content: content.trim(),
          priority,
          ephemeral: true,
          targetEcosystem: 'universal',
          targetSkillId: 'universal',
          targetSkillName: lang === 'zh' ? '全生态通用广播' : 'Universal Broadcast',
        },
        'universal'
      );
    } else {
      const chosenSkill = skills.find((s) => s.id === activeTargetId);
      onInject(
        {
          content: content.trim(),
          priority,
          ephemeral: true,
          targetEcosystem: chosenSkill?.ecosystem || (targetScope !== 'all' ? (targetScope as EcosystemTarget) : undefined),
          targetSkillId: activeTargetId,
          targetSkillName: chosenSkill?.name,
        },
        activeTargetId || undefined
      );
    }

    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // AI 智能扩充与编译
  const handleAiExpand = async () => {
    if (!content.trim() || isExpanding) return;

    setIsExpanding(true);
    try {
      const res = await AiService.expandDirective(content.trim(), aiConfig);
      if (res.expandedText) {
        setContent(res.expandedText);
      }
    } catch (err) {
      console.warn('AI expand failed, using fallback structuring', err);
    } finally {
      setIsExpanding(false);
    }
  };

  // AI 智能推荐目标生态与技能
  const handleAiRoute = async () => {
    if (!content.trim() || isRouting || !skills || skills.length === 0) return;

    setIsRouting(true);
    try {
      const res = await AiService.routeSkill(content.trim(), skills, aiConfig);
      if (res.recommendedSkillId) {
        const matched = skills.find((s) => s.id === res.recommendedSkillId);
        if (matched) {
          if (matched.ecosystem) {
            setTargetScope(matched.ecosystem as TargetScope);
          }
          setSelectedSkillId(matched.id);
          const badgePrefix =
            res.source === 'llm'
              ? lang === 'zh'
                ? '✨ 大模型研判'
                : '✨ AI Match'
              : lang === 'zh'
              ? '🎯 拓扑匹配'
              : '🎯 Topology';
          setRouteReason(
            `${badgePrefix} [${matched.ecosystem?.toUpperCase() || 'GEMINI'}] · ${matched.name}`
          );
        }
      }
    } catch (err) {
      console.warn('AI skill route failed:', err);
    } finally {
      setIsRouting(false);
    }
  };

  const handleCommitConfirm = async (chosenSkillId: string, finalContent: string, chosenPriority: LiveDirective['priority']) => {
    if (pendingCommit?.originalDirective) {
      await onAssimilateDirective(
        {
          ...pendingCommit.originalDirective,
          content: finalContent,
          priority: chosenPriority,
        },
        chosenSkillId
      );
    } else {
      await onInject(
        {
          content: finalContent,
          priority: chosenPriority,
          ephemeral: false,
        },
        chosenSkillId
      );
      setContent('');
    }
    setPendingCommit(null);
  };

  return {
    content,
    setContent,
    priority,
    setPriority,
    isExpanding,
    inputRef,
    targetScope,
    setTargetScope,
    selectedSkillId,
    setSelectedSkillId,
    isQueueExpanded,
    setIsQueueExpanded,
    isRulesExpanded,
    setIsRulesExpanded,
    showClearConfirm,
    setShowClearConfirm,
    pendingCommit,
    setPendingCommit,
    isRouting,
    routeReason,
    setRouteReason,
    filteredSkills,
    ecoCounts,
    activeTargetId,
    handleSubmit,
    handleKeyDown,
    handleAiExpand,
    handleAiRoute,
    handleCommitConfirm,
  };
}
