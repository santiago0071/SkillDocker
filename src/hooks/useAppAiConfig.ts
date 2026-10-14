import { useState } from 'react';
import { AiConfig, DEFAULT_AI_CONFIG, UniversalAiClient, ModelProvider } from '../core/aiClient.ts';
import { Language } from '../i18n/index.ts';

export function useAppAiConfig(lang: Language, showBanner: (msg: string) => void) {
  const [aiConfig, setAiConfig] = useState<AiConfig>(() => {
    try {
      const saved = localStorage.getItem('skilldocker_ai_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        const geminiModel = (!parsed.gemini?.model || parsed.gemini?.model.includes('2.5') || parsed.gemini?.model.includes('2.0') || parsed.gemini?.model.includes('1.5'))
          ? DEFAULT_AI_CONFIG.gemini.model
          : parsed.gemini.model;
        const claudeModel = (!parsed.claude?.model || parsed.claude?.model.includes('3-') || parsed.claude?.model.includes('3.'))
          ? DEFAULT_AI_CONFIG.claude.model
          : parsed.claude.model;
        const openaiModel = (!parsed.openai?.model || parsed.openai?.model === 'gpt-4o' || parsed.openai?.model === 'gpt-4o-mini')
          ? DEFAULT_AI_CONFIG.openai.model
          : parsed.openai.model;
        const deepseekModel = (!parsed.deepseek?.model || parsed.deepseek?.model === 'deepseek-chat' || parsed.deepseek?.model === 'deepseek-reasoner')
          ? DEFAULT_AI_CONFIG.deepseek.model
          : parsed.deepseek.model;
        const minimaxModel = (!parsed.minimax?.model || parsed.minimax?.model === 'MiniMax-Text-01' || parsed.minimax?.model.includes('abab'))
          ? DEFAULT_AI_CONFIG.minimax.model
          : parsed.minimax.model;
        const minimaxBaseUrl = (!parsed.minimax?.baseUrl || parsed.minimax?.baseUrl.includes('minimax.chat'))
          ? DEFAULT_AI_CONFIG.minimax.baseUrl
          : parsed.minimax.baseUrl;

        return {
          ...DEFAULT_AI_CONFIG,
          ...parsed,
          activeProvider: parsed.activeProvider === 'cloudflare' ? 'gemini' : (parsed.activeProvider || 'gemini'),
          gemini: { ...DEFAULT_AI_CONFIG.gemini, ...(parsed.gemini || {}), model: geminiModel },
          claude: { ...DEFAULT_AI_CONFIG.claude, ...(parsed.claude || {}), model: claudeModel },
          openai: { ...DEFAULT_AI_CONFIG.openai, ...(parsed.openai || {}), model: openaiModel },
          deepseek: { ...DEFAULT_AI_CONFIG.deepseek, ...(parsed.deepseek || {}), model: deepseekModel },
          openrouter: { ...DEFAULT_AI_CONFIG.openrouter, ...(parsed.openrouter || {}) },
          minimax: { ...DEFAULT_AI_CONFIG.minimax, ...(parsed.minimax || {}), model: minimaxModel, baseUrl: minimaxBaseUrl },
          custom: { ...DEFAULT_AI_CONFIG.custom, ...(parsed.custom || {}) },
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_AI_CONFIG;
  });

  const handleSaveAiConfig = async (newConfig: AiConfig) => {
    const providers: ModelProvider[] = ['gemini', 'claude', 'openai', 'deepseek', 'openrouter', 'minimax', 'custom'];
    const sanitizedConfig = JSON.parse(JSON.stringify(newConfig));

    for (const p of providers) {
      const k = (newConfig as any)[p]?.apiKey;
      if (k && typeof k === 'string' && k.trim()) {
        await UniversalAiClient.setApiKey(p, k.trim());
      }
      if ((sanitizedConfig as any)[p]) {
        delete (sanitizedConfig as any)[p].apiKey;
      }
    }

    setAiConfig(sanitizedConfig);
    try {
      localStorage.setItem('skilldocker_ai_config', JSON.stringify(sanitizedConfig));
      showBanner(
        lang === 'zh'
          ? `✓ 已安全保存 AI 凭证至系统钥匙串，当前主力引擎: ${sanitizedConfig.activeProvider.toUpperCase()}`
          : `✓ AI credentials secured in system keyring, active engine: ${sanitizedConfig.activeProvider.toUpperCase()}`
      );
    } catch (e) {
      console.warn('Failed to save aiConfig to localStorage', e);
    }
  };

  return {
    aiConfig,
    setAiConfig,
    handleSaveAiConfig,
  };
}
