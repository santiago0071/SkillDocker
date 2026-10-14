import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { EcosystemTarget } from '../types/index.ts';
import { UniversalAiClient } from '../core/aiClient.ts';
import { translations } from '../i18n/index.ts';
import { SkillCrossCompiler, CompiledSkillResult } from '../core/crossCompiler.ts';
import { SkillDoctor, HealthReport } from '../core/skillDoctor.ts';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

import {
  SkillForgeModalProps,
  ForgedHistoryItem,
  ModularLegoConfig,
} from './forge/types.ts';
import {
  DEFAULT_LEGO_CONFIG,
  PROVIDERS_MENU,
} from './forge/constants.ts';
import { useForgeHistory } from './forge/useForgeHistory.ts';
import { useForgeOperations } from './forge/useForgeOperations.ts';
import { ForgeHeader } from './forge/ForgeHeader.tsx';
import { ForgeHistoryDrawer } from './forge/ForgeHistoryDrawer.tsx';
import { ForgePromptCard } from './forge/ForgePromptCard.tsx';
import { ForgeLegoBuilder } from './forge/ForgeLegoBuilder.tsx';
import { ForgeRevealedTopBar } from './forge/ForgeRevealedTopBar.tsx';
import { ForgeRevealedEditor } from './forge/ForgeRevealedEditor.tsx';
import { ForgeAiFallbackModal } from './forge/ForgeAiFallbackModal.tsx';

// Re-exports for backwards compatibility
export type { ForgedHistoryItem, ModularLegoConfig, SkillForgeModalProps } from './forge/types.ts';
export { PROVIDERS_MENU, LEGO_PRESETS } from './forge/constants.ts';

export const SkillForgeModal: React.FC<SkillForgeModalProps> = ({
  isOpen,
  onClose,
  onSkillCreated,
  onOpenSettings,
  onOpenDoctor,
  aiConfig,
  onSaveAiConfig,
  lang = 'zh',
}) => {
  // Mode: AI-driven vs Manual LEGO blocks
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');

  // Stage: 'input' (Zen / Minimalist) vs 'revealed' (Output preview & deploy)
  const [stage, setStage] = useState<'input' | 'revealed'>('input');

  // AI Prompt & State
  const [prompt, setPrompt] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Model Quick Switcher State
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  // Save to Global Hub Success Info
  const [saveSuccessInfo, setSaveSuccessInfo] = useState<{
    skillName: string;
    filePath: string;
    ecosystem: string;
    time: number;
  } | null>(null);

  const t = translations[lang];

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Generated Skill Blueprint Fields
  const [skillName, setSkillName] = useState('custom-guard-skill');
  const [skillCategory, setSkillCategory] = useState<string>('workflow');
  const [skillDescription, setSkillDescription] = useState('');
  const [skillBodyMarkdown, setSkillBodyMarkdown] = useState('');
  const [skillVersion, setSkillVersion] = useState('1.0.0');
  const [deployEcosystem, setDeployEcosystem] = useState<'antigravity' | 'claude' | 'codex' | 'agents' | 'all'>('antigravity');
  const [generatedSource, setGeneratedSource] = useState<'llm' | 'template'>('template');

  // Manual Mode LEGO state
  const [legoConfig, setLegoConfig] = useState<ModularLegoConfig>(DEFAULT_LEGO_CONFIG);
  const [customRequirement, setCustomRequirement] = useState('');

  // History Drawer & persistence
  const {
    isHistoryDrawerOpen,
    setIsHistoryDrawerOpen,
    historySearch,
    setHistorySearch,
    historyItems,
    setHistoryItems,
    historyDrawerWidth,
    isDraggingHistory,
    forgeBodyRef,
    handleHistoryResizeStart,
    handleHistoryReset,
    saveToHistory,
    handleDeleteHistoryItem,
    filteredHistory,
  } = useForgeHistory(prompt, generatedSource, showToast, lang);

  // Active Cross-Ecosystem Format Tab Preview
  const [activeFormatTarget, setActiveFormatTarget] = useState<EcosystemTarget>('antigravity');
  const [isFineTuning, setIsFineTuning] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'reader' | 'editor'>('reader');

  // Close model menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };
    if (isModelMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModelMenuOpen]);

  const handleNewSession = () => {
    setPrompt('');
    setSkillName('custom-agent-skill');
    setSkillCategory('workflow');
    setSkillDescription('');
    setSkillBodyMarkdown('');
    setSaveSuccessInfo(null);
    setGeneratedSource('llm');
    setStage('input');
    showToast(lang === 'zh' ? '已开启全新技能构想会话' : 'New session started', 'info');
  };

  const currentModelInfo = useMemo(() => {
    const p = PROVIDERS_MENU.find((x) => x.id === aiConfig.activeProvider);
    if (!p) {
      return {
        id: aiConfig.activeProvider,
        name: (aiConfig.activeProvider || '').toUpperCase(),
        model: (aiConfig as any).customModel || 'custom',
        icon: '⚙️',
      };
    }
    const providerObj = (aiConfig as unknown as Record<string, any>)[p.id];
    const currentModel = providerObj?.model || p.defaultModel;
    return {
      id: p.id,
      name: p.label,
      model: currentModel,
      icon: p.icon,
    };
  }, [aiConfig]);

  const handleSelectProvider = (providerId: string) => {
    if (onSaveAiConfig) {
      onSaveAiConfig({
        ...aiConfig,
        activeProvider: providerId as any,
      });
      showToast(
        lang === 'zh'
          ? `✓ 已切换驱动模型为 [${providerId.toUpperCase()}]`
          : `✓ Switched active provider to [${providerId.toUpperCase()}]`,
        'success'
      );
    }
    setIsModelMenuOpen(false);
  };

  const handleLoadHistoryItem = (item: ForgedHistoryItem) => {
    setSkillName(item.name);
    setSkillCategory(item.category || 'workflow');
    setSkillDescription(item.description || '');
    setSkillBodyMarkdown(item.markdown);
    if (item.prompt) {
      setPrompt(item.prompt);
    }
    setGeneratedSource(item.source || 'template');
    setSaveSuccessInfo(null);
    setStage('revealed');
    showToast(
      lang === 'zh'
        ? `✓ 已载入历史技能 [${item.name}] 到工作台，可直接微调或跨生态导出！`
        : `✓ Loaded [${item.name}] into workspace!`,
      'success'
    );
  };

  const hasValidApiKey = useMemo(() => {
    if (!aiConfig || !aiConfig.activeProvider) return false;
    return UniversalAiClient.hasApiKey(aiConfig);
  }, [aiConfig]);

  const doctorReport: HealthReport = useMemo(() => {
    return SkillDoctor.lint(skillBodyMarkdown, {
      fallbackMeta: {
        name: skillName,
        description: skillDescription,
      },
    });
  }, [skillBodyMarkdown, skillName, skillDescription]);

  const currentCompiled: CompiledSkillResult = useMemo(() => {
    return SkillCrossCompiler.compile(
      {
        name: skillName,
        description: skillDescription,
        category: skillCategory,
        version: skillVersion,
        bodyMarkdown: skillBodyMarkdown,
      },
      activeFormatTarget
    );
  }, [skillName, skillDescription, skillCategory, skillVersion, skillBodyMarkdown, activeFormatTarget]);

  const renderedHtml = useMemo(() => {
    try {
      const contentToRender =
        activeFormatTarget === 'antigravity'
          ? skillBodyMarkdown || ''
          : currentCompiled.compiledContent || '';
      const rawHtml = marked.parse(contentToRender, { async: false }) as string;
      return DOMPurify.sanitize(rawHtml);
    } catch {
      return '<p class="text-red-400">Markdown rendering error</p>';
    }
  }, [skillBodyMarkdown, activeFormatTarget, currentCompiled]);

  // Operations and action handlers
  const {
    isGenerating,
    isDeploying,
    isDeployingToWorkspace,
    forgeSplitRatio,
    forgeSplitContainerRef,
    handleForgeSplitResizeStart,
    handleForgeSplitReset,
    aiFallbackDialog,
    setAiFallbackDialog,
    handleAiForge,
    handleFallbackToTemplate,
    handleAssembleManualSkill,
    handleDeployToWorkspace,
    handleDeployGlobal,
    handleCopyCurrentCompiled,
  } = useForgeOperations({
    prompt,
    setPrompt,
    skillName,
    setSkillName,
    skillCategory,
    setSkillCategory,
    skillDescription,
    setSkillDescription,
    skillBodyMarkdown,
    setSkillBodyMarkdown,
    skillVersion,
    deployEcosystem,
    setGeneratedSource,
    setStage,
    setSaveSuccessInfo,
    saveToHistory,
    legoConfig,
    customRequirement,
    aiConfig,
    hasValidApiKey,
    currentCompiled,
    onSkillCreated,
    showToast,
    lang,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div data-forge-modal="true" className="relative w-full max-w-7xl h-[92vh] bg-[#090b14] border border-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden font-sans forge-modal-window">
        {/* Top Header */}
        <ForgeHeader
          t={t}
          lang={lang}
          isHistoryDrawerOpen={isHistoryDrawerOpen}
          setIsHistoryDrawerOpen={setIsHistoryDrawerOpen}
          historyItemsCount={historyItems.length}
          mode={mode}
          setMode={setMode}
          stage={stage}
          setSkillBodyMarkdown={setSkillBodyMarkdown}
          onClose={onClose}
        />

        {/* Modal Body Container with History Drawer + Center Workspace */}
        <div ref={forgeBodyRef} className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* History Drawer */}
          {isHistoryDrawerOpen && (
            <ForgeHistoryDrawer
              historyDrawerWidth={historyDrawerWidth}
              historyItems={historyItems}
              filteredHistory={filteredHistory}
              historySearch={historySearch}
              setHistorySearch={setHistorySearch}
              stage={stage}
              skillName={skillName}
              lang={lang}
              setIsHistoryDrawerOpen={setIsHistoryDrawerOpen}
              handleNewSession={handleNewSession}
              handleLoadHistoryItem={handleLoadHistoryItem}
              handleDeleteHistoryItem={handleDeleteHistoryItem}
              setHistoryItems={setHistoryItems}
              showToast={showToast}
            />
          )}

          {/* Resizer bar between history drawer and workspace */}
          {isHistoryDrawerOpen && (
            <div
              onMouseDown={handleHistoryResizeStart}
              onDoubleClick={handleHistoryReset}
              className={`resizer-bar-vertical ${isDraggingHistory ? 'is-dragging' : ''}`}
              title={
                lang === 'zh'
                  ? '↔ 拖拽调整历史会话栏宽度 (双击恢复默认)'
                  : '↔ Drag to resize history drawer width (Double click to reset)'
              }
            />
          )}

          {/* Left/Center Workspace (Input or Revealed stage) */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            {stage === 'input' && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 overflow-y-auto">
                {mode === 'ai' && (
                  <ForgePromptCard
                    lang={lang}
                    t={t}
                    prompt={prompt}
                    setPrompt={setPrompt}
                    isGenerating={isGenerating}
                    handleAiForge={handleAiForge}
                    aiConfig={aiConfig}
                    handleSelectProvider={handleSelectProvider}
                    isModelMenuOpen={isModelMenuOpen}
                    setIsModelMenuOpen={setIsModelMenuOpen}
                    modelMenuRef={modelMenuRef}
                    currentModelInfo={currentModelInfo}
                    hasValidApiKey={hasValidApiKey}
                    onOpenSettings={onOpenSettings}
                    setMode={setMode}
                  />
                )}

                {mode === 'manual' && (
                  <ForgeLegoBuilder
                    lang={lang}
                    legoConfig={legoConfig}
                    setLegoConfig={setLegoConfig}
                    customRequirement={customRequirement}
                    setCustomRequirement={setCustomRequirement}
                    handleAssembleManualSkill={handleAssembleManualSkill}
                    showToast={showToast}
                  />
                )}
              </div>
            )}

            {stage === 'revealed' && (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                <ForgeRevealedTopBar
                  lang={lang}
                  t={t}
                  skillName={skillName}
                  skillCategory={skillCategory}
                  skillVersion={skillVersion}
                  doctorReport={doctorReport}
                  generatedSource={generatedSource}
                  aiConfig={aiConfig}
                  isFineTuning={isFineTuning}
                  setIsFineTuning={setIsFineTuning}
                  setStage={setStage}
                  handleDeployToWorkspace={handleDeployToWorkspace}
                  isDeployingToWorkspace={isDeployingToWorkspace}
                  activeFormatTarget={activeFormatTarget}
                  handleDeployGlobal={handleDeployGlobal}
                  isDeploying={isDeploying}
                  saveSuccessInfo={saveSuccessInfo}
                  setSaveSuccessInfo={setSaveSuccessInfo}
                  onOpenSettings={onOpenSettings}
                  onOpenDoctor={onOpenDoctor}
                  onClose={onClose}
                  showToast={showToast}
                />

                <ForgeRevealedEditor
                  lang={lang}
                  isFineTuning={isFineTuning}
                  skillName={skillName}
                  setSkillName={setSkillName}
                  skillCategory={skillCategory}
                  setSkillCategory={setSkillCategory}
                  skillVersion={skillVersion}
                  setSkillVersion={setSkillVersion}
                  skillDescription={skillDescription}
                  setSkillDescription={setSkillDescription}
                  deployEcosystem={deployEcosystem}
                  setDeployEcosystem={setDeployEcosystem}
                  activeFormatTarget={activeFormatTarget}
                  setActiveFormatTarget={setActiveFormatTarget}
                  handleCopyCurrentCompiled={handleCopyCurrentCompiled}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  forgeSplitContainerRef={forgeSplitContainerRef}
                  forgeSplitRatio={forgeSplitRatio}
                  skillBodyMarkdown={skillBodyMarkdown}
                  setSkillBodyMarkdown={setSkillBodyMarkdown}
                  currentCompiled={currentCompiled}
                  handleForgeSplitResizeStart={handleForgeSplitResizeStart}
                  handleForgeSplitReset={handleForgeSplitReset}
                  renderedHtml={renderedHtml}
                />
              </div>
            )}
          </div>
        </div>

        {/* Toast Feedback */}
        {toast && (
          <div
            className={`px-4 py-2.5 text-xs flex items-center justify-between border-t flex-shrink-0 animate-in slide-in-from-bottom-2 duration-150 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200 shadow-lg'
                : toast.type === 'error'
                ? 'bg-red-950/90 border-red-800 text-red-200 shadow-lg'
                : 'bg-purple-950/90 border-purple-800 text-purple-200 shadow-lg'
            }`}
          >
            <div className="flex items-center space-x-2">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : toast.type === 'error' ? (
                <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white ml-3 p-1">
              ✕
            </button>
          </div>
        )}

        {/* AI Fallback Dialog Modal */}
        <ForgeAiFallbackModal
          lang={lang}
          aiFallbackDialog={aiFallbackDialog}
          setAiFallbackDialog={setAiFallbackDialog}
          handleFallbackToTemplate={handleFallbackToTemplate}
          onOpenSettings={onOpenSettings}
        />
      </div>
    </div>
  );
};
