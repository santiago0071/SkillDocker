import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { RECOMMENDED_MODELS } from '../../core/aiClient.ts';
import { ProviderFormProps } from './settingsModalTypes.ts';

export const CustomProviderForm: React.FC<ProviderFormProps> = ({
  localConfig,
  setLocalConfig,
  keyringStatus,
  showKey,
  setShowKey,
  handleDeleteKey,
  lang,
  t,
}) => {
  const currentRecommendations = RECOMMENDED_MODELS.custom || [];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] text-gray-400">
              {lang === 'zh' ? '服务别名' : 'Provider Alias'}
            </label>
            <span className="text-[10px] text-gray-500">{t.optionalField}</span>
          </div>
          <input
            type="text"
            value={localConfig.custom?.customName || ''}
            onChange={(e) =>
              setLocalConfig({
                ...localConfig,
                custom: { ...localConfig.custom, customName: e.target.value },
              })
            }
            placeholder="SiliconFlow / Ollama / 本地模型"
            className="w-full bg-[#11131a] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <label className="text-[11px] text-gray-400">{t.apiKeyLabel}</label>
              {keyringStatus.custom && (
                <span className="text-[10px] text-emerald-400 flex items-center space-x-1 font-mono">
                  <span>🔒 已存入钥匙串</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteKey('custom')}
                    className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline ml-1 cursor-pointer"
                  >
                    [清除]
                  </button>
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-500">
              {lang === 'zh' ? `${t.optionalField} 本地免密服务留空` : `${t.optionalField} empty for local`}
            </span>
          </div>
          <div className="relative flex items-center">
            <input
              type={showKey ? 'text' : 'password'}
              value={localConfig.custom?.apiKey || ''}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  custom: { ...localConfig.custom, apiKey: e.target.value },
                })
              }
              placeholder={keyringStatus.custom ? (lang === 'zh' ? '已安全加密保存在系统钥匙串中 (••••••••)' : 'Secured in system keyring (••••••••)') : 'sk-... (无密码服务留空)'}
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-gray-400 block mb-1">
            {t.baseUrlLabel}
          </label>
          <input
            type="text"
            value={localConfig.custom?.baseUrl || ''}
            onChange={(e) =>
              setLocalConfig({
                ...localConfig,
                custom: { ...localConfig.custom, baseUrl: e.target.value },
              })
            }
            placeholder="https://api.siliconflow.cn/v1"
            className="w-full bg-[#11131a] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="text-[11px] text-gray-400 block mb-1">{t.modelLabel}</label>
          <input
            type="text"
            value={localConfig.custom?.model || ''}
            onChange={(e) =>
              setLocalConfig({
                ...localConfig,
                custom: { ...localConfig.custom, model: e.target.value },
              })
            }
            placeholder="Qwen/Qwen2.5-Coder-32B-Instruct"
            className="w-full bg-[#11131a] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Preset quick fill pills */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400 font-medium">
            {t.recommendedEndpoints}
          </span>
          <span className="text-[10px] text-indigo-400 font-mono">OpenAI Compatible</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {currentRecommendations.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() =>
                setLocalConfig({
                  ...localConfig,
                  custom: {
                    ...localConfig.custom,
                    baseUrl: m.baseUrl || localConfig.custom.baseUrl,
                    model: m.id,
                    customName: m.label.split(' ')[0],
                  },
                })
              }
              className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-mono transition text-left cursor-pointer ${
                localConfig.custom?.model === m.id && localConfig.custom?.baseUrl === m.baseUrl
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm'
                  : 'bg-gray-800/60 border-gray-700/60 text-gray-400 hover:text-gray-200 hover:border-gray-600'
              }`}
            >
              <div className="font-semibold text-gray-300">{m.label}</div>
              <div className="text-[9px] text-gray-500 truncate">{m.baseUrl}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="text-[10px] text-gray-400 leading-relaxed bg-[#10121a] p-2.5 rounded-lg border border-gray-800">
        {lang === 'zh'
          ? '💡 支持任何标准 OpenAI 格式端点 (/chat/completions)。若使用本地运行的 Ollama (默认端口 11434) 或 LM Studio (默认端口 1234)，无需 API Key，填写对应 Base URL 即可直接连通。'
          : '💡 Supports any OpenAI-compatible endpoint (/chat/completions). For local Ollama or LM Studio, leave API Key empty and use the default local Base URL.'}
      </div>
    </>
  );
};
