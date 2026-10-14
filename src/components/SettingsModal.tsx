import React, { useState, useEffect } from 'react';
import {
  AiConfig,
  ModelProvider,
  UniversalAiClient,
  DEFAULT_AI_CONFIG,
} from '../core/aiClient.ts';
import { translations } from '../i18n/index.ts';
import {
  Settings,
  X,
  Check,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  FolderOpen,
  Download,
  Loader2,
} from 'lucide-react';
import { SettingsModalProps } from './settings/settingsModalTypes.ts';
import { ProviderTabSelector } from './settings/ProviderTabSelector.tsx';
import { GeminiProviderForm } from './settings/GeminiProviderForm.tsx';
import { ClaudeProviderForm } from './settings/ClaudeProviderForm.tsx';
import { OpenAiProviderForm } from './settings/OpenAiProviderForm.tsx';
import { DeepSeekProviderForm } from './settings/DeepSeekProviderForm.tsx';
import { OpenRouterProviderForm } from './settings/OpenRouterProviderForm.tsx';
import { MiniMaxProviderForm } from './settings/MiniMaxProviderForm.tsx';
import { CustomProviderForm } from './settings/CustomProviderForm.tsx';
import { openLogDirectory, exportDiagnosticPackage } from '../core/diagnosticsBridge.ts';
import { getProLicensePanel } from '../pro-api/index.ts';

export type { SettingsModalProps };

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  lang = 'zh',
}) => {
  const migrateConfig = (raw: any): AiConfig => {
    if (!raw) return DEFAULT_AI_CONFIG;
    const geminiModel = (!raw.gemini?.model || raw.gemini?.model.includes('2.5') || raw.gemini?.model.includes('2.0') || raw.gemini?.model.includes('1.5'))
      ? DEFAULT_AI_CONFIG.gemini.model
      : raw.gemini.model;
    const claudeModel = (!raw.claude?.model || raw.claude?.model.includes('3-') || raw.claude?.model.includes('3.'))
      ? DEFAULT_AI_CONFIG.claude.model
      : raw.claude.model;
    const openaiModel = (!raw.openai?.model || raw.openai?.model === 'gpt-4o' || raw.openai?.model === 'gpt-4o-mini')
      ? DEFAULT_AI_CONFIG.openai.model
      : raw.openai.model;
    const deepseekModel = (!raw.deepseek?.model || raw.deepseek?.model === 'deepseek-chat' || raw.deepseek?.model === 'deepseek-reasoner')
      ? DEFAULT_AI_CONFIG.deepseek.model
      : raw.deepseek.model;
    const minimaxModel = (!raw.minimax?.model || raw.minimax?.model === 'MiniMax-Text-01' || raw.minimax?.model.includes('abab'))
      ? DEFAULT_AI_CONFIG.minimax.model
      : raw.minimax.model;

    return {
      ...DEFAULT_AI_CONFIG,
      ...raw,
      gemini: { ...DEFAULT_AI_CONFIG.gemini, ...(raw.gemini || {}), model: geminiModel },
      claude: { ...DEFAULT_AI_CONFIG.claude, ...(raw.claude || {}), model: claudeModel },
      openai: { ...DEFAULT_AI_CONFIG.openai, ...(raw.openai || {}), model: openaiModel },
      deepseek: { ...DEFAULT_AI_CONFIG.deepseek, ...(raw.deepseek || {}), model: deepseekModel },
      openrouter: { ...DEFAULT_AI_CONFIG.openrouter, ...(raw.openrouter || {}) },
      minimax: { ...DEFAULT_AI_CONFIG.minimax, ...(raw.minimax || {}), model: minimaxModel },
      custom: { ...DEFAULT_AI_CONFIG.custom, ...(raw.custom || {}) },
      activeProvider: raw.activeProvider === 'cloudflare' ? 'gemini' : (raw.activeProvider || 'gemini'),
    };
  };

  const [localConfig, setLocalConfig] = useState<AiConfig>(() => migrateConfig(config));
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [keyringStatus, setKeyringStatus] = useState<Record<string, boolean>>({});
  const [exportingLogs, setExportingLogs] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const handleOpenLogs = async () => {
    await openLogDirectory();
  };

  const handleExportDiagnostics = async () => {
    setExportingLogs(true);
    setExportFeedback(null);
    try {
      const savedPath = await exportDiagnosticPackage();
      if (savedPath) {
        setExportFeedback(
          lang === 'zh'
            ? `✓ 诊断包已成功导出至：${savedPath}`
            : `✓ Diagnostics exported to: ${savedPath}`
        );
      }
    } catch (e: any) {
      setExportFeedback(
        lang === 'zh'
          ? `❌ 导出诊断包失败：${e?.message || e}`
          : `❌ Failed to export: ${e?.message || e}`
      );
    } finally {
      setExportingLogs(false);
    }
  };

  const refreshKeyringStatus = async () => {
    const providers: ModelProvider[] = ['gemini', 'claude', 'openai', 'deepseek', 'openrouter', 'minimax', 'custom'];
    const results = await Promise.all(
      providers.map(async (p) => [p, await UniversalAiClient.checkKeyring(p)] as const)
    );
    setKeyringStatus(Object.fromEntries(results));
  };

  useEffect(() => {
    if (config) {
      setLocalConfig(migrateConfig(config));
    }
    if (isOpen) {
      refreshKeyringStatus();
    }
  }, [config, isOpen]);

  const t = translations[lang];

  if (!isOpen) return null;

  const handleProviderChange = (provider: ModelProvider) => {
    setLocalConfig((prev) => ({ ...prev, activeProvider: provider }));
    setTestResult(null);
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  const handleDeleteKey = async (provider: ModelProvider) => {
    await UniversalAiClient.deleteApiKey(provider);
    setKeyringStatus((prev) => ({ ...prev, [provider]: false }));
    setLocalConfig((prev) => ({
      ...prev,
      [provider]: { ...(prev as any)[provider], apiKey: '' },
    }));
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const activeKey = (localConfig as any)[localConfig.activeProvider]?.apiKey;
      if (activeKey && typeof activeKey === 'string' && activeKey.trim()) {
        await UniversalAiClient.setApiKey(localConfig.activeProvider, activeKey.trim());
        setKeyringStatus((prev) => ({ ...prev, [localConfig.activeProvider]: true }));
      }
      const reply = await UniversalAiClient.generateText(
        'Reply "SkillDocker Ready" in 3 words.',
        localConfig
      );
      setTestResult({
        ok: true,
        msg: `${t.connSuccess} ${reply.trim().slice(0, 45)}`,
      });
    } catch (err: any) {
      setTestResult({ ok: false, msg: `${t.connFailed} ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  const providerFormProps = {
    localConfig,
    setLocalConfig,
    keyringStatus,
    showKey,
    setShowKey,
    handleDeleteKey,
    lang,
    t,
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div
        data-settings-modal="true"
        className="w-full max-w-2xl bg-[#141722] border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 settings-modal-window"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#161926] settings-modal-header">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 settings-header-icon">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-100 settings-header-title">{t.settingsTitle}</h3>
              <p className="text-[11px] text-gray-400 settings-header-subtitle">{t.settingsSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer settings-close-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 settings-modal-content">
          {/* Clarity & Safety Tip */}
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-[11px] flex items-center space-x-2 settings-tip-banner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span>
              {lang === 'zh'
                ? '提示：配置任一大模型 Key 即可激活 AI 锻造工坊。所有密钥加密存入系统钥匙串，前端不存明文，全链路零泄露。'
                : 'Tip: Configure any model key to unlock AI Forge. Keys are secured in the OS Keyring; no plaintext stored in UI.'}
            </span>
          </div>

          {/* Provider Tabs */}
          <ProviderTabSelector
            localConfig={localConfig}
            keyringStatus={keyringStatus}
            handleProviderChange={handleProviderChange}
            lang={lang}
            t={t}
          />

          {/* Form per Provider */}
          <div className="p-3.5 bg-gray-900/50 rounded-xl border border-gray-800 space-y-3 settings-form-container">
            {localConfig.activeProvider === 'gemini' && <GeminiProviderForm {...providerFormProps} />}
            {localConfig.activeProvider === 'claude' && <ClaudeProviderForm {...providerFormProps} />}
            {localConfig.activeProvider === 'openai' && <OpenAiProviderForm {...providerFormProps} />}
            {localConfig.activeProvider === 'deepseek' && <DeepSeekProviderForm {...providerFormProps} />}
            {localConfig.activeProvider === 'openrouter' && <OpenRouterProviderForm {...providerFormProps} />}
            {localConfig.minimax && localConfig.activeProvider === 'minimax' && <MiniMaxProviderForm {...providerFormProps} />}
            {localConfig.activeProvider === 'custom' && <CustomProviderForm {...providerFormProps} />}
          </div>

          {/* Test connection feedback */}
          {testResult && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center space-x-2 border ${
                testResult.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="truncate">{testResult.msg}</span>
            </div>
          )}

          {/* Diagnostic Logs Section */}
          <div className="pt-3 border-t border-gray-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-medium text-gray-300">
                  {lang === 'zh' ? '本地诊断日志' : 'Local Diagnostic Logs'}
                </span>
                <span className="text-[11px] text-gray-500">
                  {lang === 'zh' ? '(仅本地，7天轮转)' : '(Local only, 7-day)'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleOpenLogs}
                  className="px-2.5 py-1 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-xs text-gray-300 transition flex items-center space-x-1 cursor-pointer border border-gray-700/50"
                  title={lang === 'zh' ? '打开本地日志目录' : 'Open Local Logs Directory'}
                >
                  <FolderOpen className="w-3.5 h-3.5 text-gray-400" />
                  <span>{lang === 'zh' ? '打开日志目录' : 'Open Log Directory'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportDiagnostics}
                  disabled={exportingLogs}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-xs text-indigo-300 transition flex items-center space-x-1 cursor-pointer border border-indigo-500/30 disabled:opacity-50"
                  title={lang === 'zh' ? '导出最近7天诊断包' : 'Export Recent 7 Days Diagnostics'}
                >
                  {exportingLogs ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  <span>{lang === 'zh' ? '导出诊断包' : 'Export Diagnostics'}</span>
                </button>
              </div>
            </div>

            {exportFeedback && (
              <div
                className={`p-2 rounded-lg text-xs flex items-center space-x-1.5 border ${
                  exportFeedback.startsWith('✓')
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                <span className="truncate">{exportFeedback}</span>
              </div>
            )}
          </div>

          {(() => {
            const Panel = getProLicensePanel();
            return Panel ? (
              <div id="settings-pro-license-section">
                <Panel lang={lang} />
              </div>
            ) : null;
          })()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3.5 bg-gray-950/60 border-t border-gray-800 settings-modal-footer">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition flex items-center space-x-1.5 disabled:opacity-50 settings-test-btn"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{testing ? t.testing : t.testConnection}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 transition settings-cancel-btn"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition flex items-center space-x-1 settings-save-btn"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t.saveCredentials}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
