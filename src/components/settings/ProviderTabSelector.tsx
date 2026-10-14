import React from 'react';
import { AiConfig, ModelProvider } from '../../core/aiClient.ts';
import { Language, translations } from '../../i18n/index.ts';

interface ProviderTabSelectorProps {
  localConfig: AiConfig;
  keyringStatus: Record<string, boolean>;
  handleProviderChange: (provider: ModelProvider) => void;
  lang: Language;
  t: (typeof translations)[Language];
}

export const ProviderTabSelector: React.FC<ProviderTabSelectorProps> = ({
  localConfig,
  keyringStatus,
  handleProviderChange,
  lang,
  t,
}) => {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-2 settings-engine-label">
        {t.selectEngine}
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 settings-provider-grid">
        {[
          { id: 'gemini', label: 'Gemini', badge: 'Google', hasKey: Boolean(localConfig.gemini?.apiKey?.trim() || keyringStatus.gemini) },
          { id: 'claude', label: 'Claude', badge: 'Anthropic', hasKey: Boolean(localConfig.claude?.apiKey?.trim() || keyringStatus.claude) },
          { id: 'openai', label: 'OpenAI / Codex', badge: 'GPT / Codex', hasKey: Boolean(localConfig.openai?.apiKey?.trim() || keyringStatus.openai) },
          { id: 'deepseek', label: 'DeepSeek', badge: 'V3 / R1', hasKey: Boolean(localConfig.deepseek?.apiKey?.trim() || keyringStatus.deepseek) },
          { id: 'openrouter', label: 'OpenRouter', badge: '聚合网关', badgeEn: 'Router', hasKey: Boolean(localConfig.openrouter?.apiKey?.trim() || keyringStatus.openrouter) },
          { id: 'minimax', label: 'MiniMax', badge: 'abab / M01', hasKey: Boolean(localConfig.minimax?.apiKey?.trim() || keyringStatus.minimax) },
          { id: 'custom', label: '自定义兼容', labelEn: 'Custom / OpenCode', badge: 'OpenAI 协议', badgeEn: 'OpenAI Std', hasKey: Boolean(localConfig.custom?.baseUrl?.trim() || localConfig.custom?.apiKey?.trim() || keyringStatus.custom) },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleProviderChange(tab.id as ModelProvider)}
            className={`py-2 px-2 rounded-xl border text-xs font-medium transition flex flex-col items-center justify-center space-y-1 cursor-pointer settings-provider-tab ${
              localConfig.activeProvider === tab.id
                ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500/50 is-active'
                : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
            }`}
          >
            <div className="flex items-center space-x-1">
              <span className="truncate">{lang === 'zh' ? tab.label : (tab.labelEn || tab.label)}</span>
              {tab.hasKey && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" title={lang === 'zh' ? '已配置 Key' : 'Configured'} />
              )}
            </div>
            <span className="text-[9px] px-1 py-0.2 rounded bg-gray-800/80 text-gray-400 font-mono truncate max-w-full settings-provider-badge">
              {lang === 'zh' ? tab.badge : (tab.badgeEn || tab.badge)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
