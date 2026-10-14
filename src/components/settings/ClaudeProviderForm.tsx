import React from 'react';
import { Eye, EyeOff, ExternalLink } from 'lucide-react';
import { RECOMMENDED_MODELS } from '../../core/aiClient.ts';
import { ProviderFormProps } from './settingsModalTypes.ts';

export const ClaudeProviderForm: React.FC<ProviderFormProps> = ({
  localConfig,
  setLocalConfig,
  keyringStatus,
  showKey,
  setShowKey,
  handleDeleteKey,
  lang,
  t,
}) => {
  const currentRecommendations = RECOMMENDED_MODELS.claude || [];

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <label className="text-[11px] text-gray-400">{t.apiKeyLabel}</label>
            {keyringStatus.claude && (
              <span className="text-[10px] text-emerald-400 flex items-center space-x-1 font-mono">
                <span>🔒 已存入钥匙串</span>
                <button
                  type="button"
                  onClick={() => handleDeleteKey('claude')}
                  className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline ml-1 cursor-pointer"
                >
                  [清除]
                </button>
              </span>
            )}
          </div>
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-indigo-400 hover:underline flex items-center space-x-0.5"
          >
            <span>console.anthropic.com</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
        <div className="relative flex items-center">
          <input
            type={showKey ? 'text' : 'password'}
            value={localConfig.claude.apiKey}
            onChange={(e) =>
              setLocalConfig({
                ...localConfig,
                claude: { ...localConfig.claude, apiKey: e.target.value },
              })
            }
            placeholder={keyringStatus.claude ? (lang === 'zh' ? '已安全加密保存在系统钥匙串中 (••••••••)' : 'Secured in system keyring (••••••••)') : 'sk-ant-...'}
            className="w-full bg-[#11131a] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 pr-9 font-mono"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2.5 text-gray-500 hover:text-gray-300"
          >
            {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-gray-400 block mb-1">{t.modelLabel}</label>
          <input
            type="text"
            value={localConfig.claude.model}
            onChange={(e) =>
              setLocalConfig({
                ...localConfig,
                claude: { ...localConfig.claude, model: e.target.value },
              })
            }
            className="w-full bg-[#11131a] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] text-gray-400">{t.baseUrlLabel}</label>
            <span className="text-[10px] text-gray-500">{t.optionalField}</span>
          </div>
          <input
            type="text"
            value={localConfig.claude.baseUrl || ''}
            onChange={(e) =>
              setLocalConfig({
                ...localConfig,
                claude: { ...localConfig.claude, baseUrl: e.target.value },
              })
            }
            placeholder="https://api.anthropic.com/v1"
            className="w-full bg-[#11131a] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>
      {/* Model quick select pills */}
      <div className="space-y-1 pt-1">
        <span className="text-[10px] text-gray-500 block">{t.recommendedModels}</span>
        <div className="flex flex-wrap gap-1.5">
          {currentRecommendations.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() =>
                setLocalConfig({
                  ...localConfig,
                  claude: { ...localConfig.claude, model: m.id },
                })
              }
              className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono transition cursor-pointer ${
                localConfig.claude.model === m.id
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                  : 'bg-gray-800/60 border-gray-700/60 text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
