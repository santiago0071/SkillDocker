import React from 'react';
import {
  ChevronDown,
  Settings,
  Check,
  Sparkles,
  Loader2,
  KeyRound,
} from 'lucide-react';
import { AiConfig, UniversalAiClient } from '../../core/aiClient';
import { PROVIDERS_MENU, getInspirationPills } from './constants';

export interface ForgePromptCardProps {
  lang: 'zh' | 'en';
  t: Record<string, string>;
  prompt: string;
  setPrompt: (value: string) => void;
  isGenerating: boolean;
  handleAiForge: () => void;
  aiConfig: AiConfig;
  handleSelectProvider: (providerId: string) => void;
  isModelMenuOpen: boolean;
  setIsModelMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  modelMenuRef: React.RefObject<HTMLDivElement | null>;
  currentModelInfo: { icon: string; name: string; model: string };
  hasValidApiKey: boolean;
  onOpenSettings?: () => void;
  setMode: (mode: 'ai' | 'manual') => void;
}

export const ForgePromptCard: React.FC<ForgePromptCardProps> = ({
  lang,
  t,
  prompt,
  setPrompt,
  isGenerating,
  handleAiForge,
  aiConfig,
  handleSelectProvider,
  isModelMenuOpen,
  setIsModelMenuOpen,
  modelMenuRef,
  currentModelInfo,
  hasValidApiKey,
  onOpenSettings,
  setMode,
}) => {
  const inspirationPills = getInspirationPills(lang);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full max-w-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
      <div className="space-y-2">
        {/* Interactive Model Switcher & BYOK Trigger */}
        <div className="relative inline-block text-left" ref={modelMenuRef}>
          <div className="inline-flex items-center gap-2 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => setIsModelMenuOpen((prev) => !prev)}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 hover:border-purple-400 text-purple-200 text-xs font-medium shadow-lg shadow-purple-950/40 transition cursor-pointer group"
              title={lang === 'zh' ? '点击切换当前驱动大模型' : 'Click to switch active model provider'}
            >
              <span className="text-sm">{currentModelInfo.icon}</span>
              <span className="font-semibold text-white tracking-wide">
                {currentModelInfo.name}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                {currentModelInfo.model}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-purple-300 transition-transform duration-200 ${
                  isModelMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="px-3 py-1.5 rounded-full bg-gray-900/80 hover:bg-gray-800 border border-gray-700/80 hover:border-purple-500/40 text-gray-300 hover:text-white text-xs font-medium transition cursor-pointer flex items-center space-x-1.5"
                title={lang === 'zh' ? '前往 BYOK 配置密钥与端点' : 'Open BYOK Key Settings'}
              >
                <Settings className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-300" />
                <span>{lang === 'zh' ? '⚙️ BYOK 密钥' : '⚙️ BYOK Keys'}</span>
              </button>
            )}
          </div>

          {/* Popover Menu */}
          {isModelMenuOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 bg-[#121424] border border-purple-500/40 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl">
              <div className="px-2.5 py-1.5 border-b border-gray-800/80 flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-300">
                  {lang === 'zh' ? '⚡ 选择当前架构师模型' : '⚡ Select Architect Model'}
                </span>
                <span className="text-[10px] font-mono text-purple-400">
                  {PROVIDERS_MENU.length} {lang === 'zh' ? '可选' : 'providers'}
                </span>
              </div>

              <div className="py-1 max-h-64 overflow-y-auto space-y-1">
                {PROVIDERS_MENU.map((p) => {
                  const isActive = aiConfig.activeProvider === p.id;
                  const providerObj = (aiConfig as unknown as Record<string, any>)[p.id];
                  const currentM = providerObj?.model || p.defaultModel;
                  const hasKey = UniversalAiClient.hasProviderKey(p.id as any, aiConfig);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProvider(p.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between text-xs transition cursor-pointer ${
                        isActive
                          ? 'bg-purple-600/30 border border-purple-500/50 text-white'
                          : 'hover:bg-gray-800/60 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="text-base flex-shrink-0">{p.icon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold truncate">{p.label}</span>
                            {hasKey && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {lang === 'zh' ? '已配Key' : 'Key Set'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-gray-400 block truncate">
                            {currentM}
                          </span>
                        </div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-purple-400 flex-shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>

              {onOpenSettings && (
                <div className="pt-1.5 mt-1 border-t border-gray-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModelMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full text-center px-2 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 text-[11px] font-semibold border border-purple-500/30 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>{lang === 'zh' ? '⚙️ 管理全部 API Key 与自定义端点' : '⚙️ Manage API Keys & Endpoints'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight forge-hero-title">
          {t.forgeAiHeroTitle}
        </h1>
        <p className="text-xs text-gray-400 max-w-lg mx-auto leading-relaxed forge-hero-subtitle">
          {t.forgeAiHeroSub}
        </p>
      </div>

      {/* Ecosystem Shuttle Compatibility Badge */}
      <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-blue-950/40 border border-indigo-500/25 flex flex-wrap items-center justify-between gap-2 text-xs forge-compat-banner">
        <div className="flex items-center space-x-2 text-indigo-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 animate-pulse" />
          <span>{lang === 'zh' ? '⚡ 跨生态转译引擎就绪：一次锻造，全生态通行' : '⚡ Cross-Compiler Ready: Forge Once, Run Everywhere'}</span>
        </div>
        <div className="flex items-center space-x-1.5 flex-wrap font-mono text-[10px]">
          <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20">🟣 Antigravity</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">🟠 Claude Code</span>
          <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/20">🎯 Cursor Rules</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">🟢 Codex</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border-blue-500/20">🐋 DeepSeek</span>
        </div>
      </div>

      {/* Big Focused Input Card */}
      <div className="bg-[#121422] border border-purple-500/40 rounded-2xl p-3.5 shadow-2xl focus-within:ring-2 focus-within:ring-purple-500/50 transition-all text-left forge-prompt-card">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAiForge();
            }
          }}
          rows={3}
          autoFocus
          placeholder={t.forgeAiPromptPlaceholder}
          className="w-full bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none resize-none leading-relaxed forge-prompt-textarea"
        />

        <div className="mt-2 pt-2 border-t border-gray-800/80 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 forge-prompt-hint">
            {lang === 'zh' ? '敲击 Enter 立即构想' : 'Press Enter to craft'}
          </span>

          <button
            type="button"
            onClick={handleAiForge}
            disabled={!prompt.trim() || isGenerating}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 cursor-pointer forge-submit-btn"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isGenerating ? (lang === 'zh' ? '构思中...' : 'Crafting...') : (lang === 'zh' ? '✨ 开始智能创造' : 'Craft Skill')}</span>
          </button>
        </div>
      </div>

      {/* No-Key Warm Reminder */}
      {!hasValidApiKey && (
        <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left shadow-lg backdrop-blur-sm forge-warning-banner">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 flex-shrink-0">
              <KeyRound className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-amber-200 block text-xs tracking-wide forge-warning-title">
                {lang === 'zh' ? '当前尚未配置大模型 API Key' : 'No AI Model API Key Configured'}
              </span>
              <span className="text-[11px] text-amber-300/80 block mt-0.5 truncate sm:whitespace-normal forge-warning-desc">
                {lang === 'zh'
                  ? '配置后即可调用真实大模型构想技能与规则约束，或切换为免 AI 12-积木搭建模式'
                  : 'Configure key to use real AI models, or switch to manual 12-block builder'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center space-x-1.5 forge-warning-btn"
              >
                <Settings className="w-3.5 h-3.5 text-black" />
                <span>{lang === 'zh' ? '⚙️ 配置 API Key' : 'Configure API Key'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setMode('manual')}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30 transition cursor-pointer whitespace-nowrap forge-warning-alt-btn"
            >
              {lang === 'zh' ? '切换为积木模式 →' : 'Switch to LEGO →'}
            </button>
          </div>
        </div>
      )}

      {/* Inspiration Quick Pills */}
      <div className="space-y-2 text-left pt-2 forge-inspiration-container">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block forge-inspiration-label">
          {lang === 'zh' ? '💡 灵感启迪（点击一键填入需求）：' : '💡 Inspiration Ideas:'}
        </span>
        <div className="flex flex-wrap gap-2">
          {inspirationPills.map((pill, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(pill.text)}
              className="px-3 py-1.5 rounded-xl bg-gray-900/80 hover:bg-purple-950/40 border border-gray-800 hover:border-purple-500/40 text-xs text-gray-300 hover:text-purple-200 transition text-left cursor-pointer forge-inspiration-pill"
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
