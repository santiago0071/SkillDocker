import React from 'react';
import { CommitConfirmModal } from './CommitConfirmModal';
import { TargetScope, LiveInjectorProps } from './injector/injectorTypes.ts';
import { useLiveInjector } from './injector/useLiveInjector.ts';
import { InjectorScopeBar } from './injector/InjectorScopeBar.tsx';
import { InjectorForm } from './injector/InjectorForm.tsx';
import { InjectorActiveQueue } from './injector/InjectorActiveQueue.tsx';
import { InjectorConsolidatedRules } from './injector/InjectorConsolidatedRules.tsx';

export type { TargetScope, LiveInjectorProps };

export const LiveInjector: React.FC<LiveInjectorProps> = ({
  onInject,
  directives,
  onRemoveDirective,
  onClearAll,
  onAssimilateDirective,
  consolidatedRules = [],
  onRevertRuleToLive,
  onDeleteRule,
  aiConfig,
  lang = 'zh',
  skills = [],
  compact = false,
  onNavigateToHub,
  onOpenSkillEditor,
}) => {
  const {
    content,
    setContent,
    priority,
    setPriority,
    isExpanding,
    inputRef,
    targetScope,
    setTargetScope,
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
  } = useLiveInjector({
    onInject,
    onAssimilateDirective,
    skills,
    aiConfig,
    lang,
  });

  return (
    <div data-live-injector="true" className="space-y-3 min-w-0">
      {/* 1. Target Ecosystem Dimension Selector Bar */}
      <InjectorScopeBar
        lang={lang}
        targetScope={targetScope}
        setTargetScope={setTargetScope}
        ecoCounts={ecoCounts}
      />

      {/* 2. Input Field Form - Raycast Compact Ergonomics */}
      <InjectorForm
        content={content}
        setContent={setContent}
        priority={priority}
        setPriority={setPriority}
        targetScope={targetScope}
        activeTargetId={activeTargetId}
        setSelectedSkillId={setSelectedSkillId}
        filteredSkills={filteredSkills}
        skills={skills}
        inputRef={inputRef}
        isExpanding={isExpanding}
        isRouting={isRouting}
        routeReason={routeReason}
        setRouteReason={setRouteReason}
        handleSubmit={handleSubmit}
        handleKeyDown={handleKeyDown}
        handleAiExpand={handleAiExpand}
        handleAiRoute={handleAiRoute}
        lang={lang}
      />

      {/* Compact Mode: Sleek Status Banner with quick navigation to Hub */}
      {compact && (directives.length > 0 || (consolidatedRules && consolidatedRules.length > 0)) && (
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#121422] to-indigo-950/40 border border-emerald-500/20 text-xs">
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-gray-300 font-medium text-xs">
              {lang === 'zh'
                ? `⚡ 当前有 ${directives.length} 条临时指令生效中 · ${consolidatedRules.length} 条规则已存入技能`
                : `Active Guard: ${directives.length} live directives · ${consolidatedRules.length} saved rules`}
            </span>
          </div>
          {onNavigateToHub && (
            <button
              type="button"
              onClick={onNavigateToHub}
              className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline cursor-pointer flex-shrink-0"
            >
              <span>{lang === 'zh' ? '查看已注入的技能 →' : 'View Injected Skills →'}</span>
            </button>
          )}
        </div>
      )}

      {/* Full Mode: Active Injected Directives Queue */}
      {!compact && (
        <InjectorActiveQueue
          directives={directives}
          skills={skills}
          isQueueExpanded={isQueueExpanded}
          setIsQueueExpanded={setIsQueueExpanded}
          showClearConfirm={showClearConfirm}
          setShowClearConfirm={setShowClearConfirm}
          onClearAll={onClearAll}
          onRemoveDirective={onRemoveDirective}
          onOpenSkillEditor={onOpenSkillEditor}
          setPendingCommit={setPendingCommit}
          lang={lang}
        />
      )}

      {/* Full Mode: Permanently Consolidated Rules Section (已正式融入进技能正文的规约库) */}
      {!compact && (
        <InjectorConsolidatedRules
          consolidatedRules={consolidatedRules}
          skills={skills}
          isRulesExpanded={isRulesExpanded}
          setIsRulesExpanded={setIsRulesExpanded}
          onRevertRuleToLive={onRevertRuleToLive}
          onDeleteRule={onDeleteRule}
          onOpenSkillEditor={onOpenSkillEditor}
          lang={lang}
        />
      )}

      {/* Full Mode: Empty state when both directives and consolidated rules are 0 */}
      {!compact && directives.length === 0 && (!consolidatedRules || consolidatedRules.length === 0) && (
        <div className="p-8 text-center bg-gray-900/30 rounded-2xl border border-gray-800/80 text-gray-400 text-xs space-y-2">
          <div className="text-3xl mb-1">⚡</div>
          <p className="text-gray-300 font-semibold text-sm">
            {lang === 'zh' ? '暂无已注入的指令或规则' : 'No Active Directives or Saved Rules'}
          </p>
          <p className="text-gray-500 text-xs max-w-md mx-auto">
            {lang === 'zh'
              ? '您可以在上方输入框随时注入新指令，或将临时指令一键保存到技能中。'
              : 'You can inject live directives above to steer active sessions, or save them permanently into skills.'}
          </p>
        </div>
      )}

      {/* Confirmation & Multi-Ecosystem Commit Modal */}
      <CommitConfirmModal
        isOpen={Boolean(pendingCommit)}
        onClose={() => setPendingCommit(null)}
        directive={pendingCommit}
        skills={skills}
        defaultSkillId={activeTargetId !== 'universal' ? activeTargetId : undefined}
        aiConfig={aiConfig || ({} as any)}
        lang={lang}
        onConfirm={handleCommitConfirm}
      />
    </div>
  );
};
