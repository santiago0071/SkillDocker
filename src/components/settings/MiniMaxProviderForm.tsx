import React from 'react';
import { Eye, EyeOff, ExternalLink } from 'lucide-react';
import { RECOMMENDED_MODELS } from '../../core/aiClient.ts';
import { ProviderFormProps } from './settingsModalTypes.ts';

export const MiniMaxProviderForm: React.FC<ProviderFormProps> = ({
  localConfig,
  setLocalConfig,
  keyringStatus,
  showKey,
  setShowKey,
  handleDeleteKey,
  lang,
  t,
}) => {
  const currentRecommendations = RECOMMENDED_MODELS.minimax || [];

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <label className="text-[11px] text-gray-400">{t.apiKeyLabel}</label>
            {keyringStatus.minimax && (
              <span className="text-[10px] text-emerald-400 flex items-center space-x-1 font-mono">
                <span>🔒 已存入钥匙串</span>
                <button
                  type="button"
                  onClick={() => handleDeleteKey('minimax')}
                  className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline ml-1 cursor-pointer"
                >
                  [清除]
                </button>
              </span>
            )}
          </div>
          <a
            href="https://platform.minimaxi.com"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-indigo-400 hover:underline flex items-center space-x-0.5"
          >
            <span>platform.minimaxi.com</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
        <div className="relative flex items-center">
          <input
            type={showKey ? 'text' : 'password'}
            value={localConfig.minimax.apiKey}
            onChange={(e) =>
              setLocalConfig({
                ...localConfig,
                minimax: { ...localConfig.minimax, apiKey: e.target.value },
              })
            }
            placeholder={keyringStatus.minimax ? (lang === 'zh' ? '已安全加密保存在系统钥匙串中 (••••••••)' : 'Secured in system keyring (••••••••)') : 'sk-...'}
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
            value={localConfig.minimax.model}
            onChange={(e) =>
              setLocalConfig({
                ...localConfig,
                minimax: { ...localConfig.minimax, model: e.target.value },
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
            value={localConfig.minimax.baseUrl || ''}
            onChange={(e) =>
              setLocalConfig({
                ...localConfig,
                minimax: { ...localConfig.minimax, baseUrl: e.target.value },
              })
            }
            placeholder="https://api.minimaxi.com/v1"
            className="w-full bg-[#11131a] border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Station Selection Tags (国内站 / 国际站) */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400">
            {lang === 'zh' ? '📍 官方站点接口 (点击快速切换填入):' : '📍 Official Station (Click to switch):'}
          </span>
          <span className="text-[9px] text-gray-500 font-mono">
            {(!localConfig.minimax.baseUrl || localConfig.minimax.baseUrl.includes('minimaxi.com') || localConfig.minimax.baseUrl.includes('minimax.cn'))
              ? (lang === 'zh' ? '当前已就绪: 国内站' : 'Current: China Mainland')
              : (lang === 'zh' ? '当前已就绪: 国际站' : 'Current: Global')}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() =>
              setLocalConfig({
                ...localConfig,
                minimax: { ...localConfig.minimax, baseUrl: 'https://api.minimaxi.com/v1' },
              })
            }
            className={`px-2.5 py-1.5 rounded-lg text-left transition border flex flex-col justify-between settings-station-btn ${
              (!localConfig.minimax.baseUrl || localConfig.minimax.baseUrl === 'https://api.minimaxi.com/v1' || localConfig.minimax.baseUrl === 'https://api.minimax.cn/v1')
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-sm is-active'
                : 'bg-[#11131a] border-gray-800 hover:border-gray-700 text-gray-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold flex items-center space-x-1">
                <span>🇨🇳 国内主站 (中国大陆)</span>
              </span>
              {(!localConfig.minimax.baseUrl || localConfig.minimax.baseUrl === 'https://api.minimaxi.com/v1' || localConfig.minimax.baseUrl === 'https://api.minimax.cn/v1') && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-semibold settings-station-badge">使用中</span>
              )}
            </div>
            <span className="text-[10px] font-mono text-gray-400 mt-0.5 truncate settings-station-url">
              https://api.minimaxi.com/v1
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setLocalConfig({
                ...localConfig,
                minimax: { ...localConfig.minimax, baseUrl: 'https://api.minimaxi.io/v1' },
              })
            }
            className={`px-2.5 py-1.5 rounded-lg text-left transition border flex flex-col justify-between settings-station-btn ${
              localConfig.minimax.baseUrl === 'https://api.minimaxi.io/v1'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-sm is-active'
                : 'bg-[#11131a] border-gray-800 hover:border-gray-700 text-gray-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold flex items-center space-x-1">
                <span>🌐 国际站 (海外/Global)</span>
              </span>
              {localConfig.minimax.baseUrl === 'https://api.minimaxi.io/v1' && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-semibold settings-station-badge">使用中</span>
              )}
            </div>
            <span className="text-[10px] font-mono text-gray-400 mt-0.5 truncate settings-station-url">
              https://api.minimaxi.io/v1
            </span>
          </button>
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
                  minimax: { ...localConfig.minimax, model: m.id },
                })
              }
              className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono transition cursor-pointer ${
                localConfig.minimax.model === m.id
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
