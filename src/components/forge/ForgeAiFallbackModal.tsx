import React from 'react';
import { AlertTriangle, Boxes, Settings } from 'lucide-react';

export interface ForgeAiFallbackModalProps {
  lang: 'zh' | 'en';
  aiFallbackDialog: { isOpen: boolean; reason: string; providerName: string; isKeyMissing: boolean } | null;
  setAiFallbackDialog: React.Dispatch<React.SetStateAction<{ isOpen: boolean; reason: string; providerName: string; isKeyMissing: boolean } | null>>;
  handleFallbackToTemplate: () => void;
  onOpenSettings?: () => void;
}

export const ForgeAiFallbackModal: React.FC<ForgeAiFallbackModalProps> = ({
  lang,
  aiFallbackDialog,
  setAiFallbackDialog,
  handleFallbackToTemplate,
  onOpenSettings,
}) => {
  if (!aiFallbackDialog || !aiFallbackDialog.isOpen) return null;

  return (
    <div data-ai-fallback-dialog="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="max-w-md w-full bg-[#151722] border border-amber-500/40 rounded-2xl p-5 shadow-2xl space-y-4 text-left fallback-dialog-window">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-100 flex items-center space-x-1.5">
              <span>{lang === 'zh' ? '⚠️ AI 大模型暂时无法辅助构想' : '⚠️ AI Model Unavailable'}</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {lang === 'zh'
                ? `检测到驱动模型 [${aiFallbackDialog.providerName}] 暂时无法完成生成，原因如下：`
                : `Provider [${aiFallbackDialog.providerName}] cannot complete request:`}
            </p>
          </div>
        </div>

        {/* Error Reason Display Box */}
        <div className="p-3 rounded-xl bg-[#0f1118] border border-amber-500/30 text-amber-200 text-xs font-mono leading-relaxed break-words max-h-36 overflow-y-auto">
          <div className="flex items-center space-x-1.5 text-amber-400 font-bold mb-1">
            <span>{lang === 'zh' ? '📍 具体原因：' : '📍 Detail Cause:'}</span>
          </div>
          <div>{aiFallbackDialog.reason}</div>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          {lang === 'zh'
            ? '您可以前往设置配置或核验 API Key 与接口地址，或者直接采用系统高确定性默认模板生成技能。'
            : 'You can update your API settings, or proceed with the deterministic offline template.'}
        </p>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setAiFallbackDialog(null)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition cursor-pointer"
          >
            {lang === 'zh' ? '取消' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleFallbackToTemplate}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold transition cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Boxes className="w-3.5 h-3.5 text-indigo-400" />
            <span>{lang === 'zh' ? '🧱 使用默认模板生成' : 'Use Default Template'}</span>
          </button>

          {onOpenSettings && (
            <button
              type="button"
              onClick={() => {
                setAiFallbackDialog(null);
                onOpenSettings();
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-black" />
              <span>{lang === 'zh' ? '⚙️ 前往配置 API' : 'Configure API'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
