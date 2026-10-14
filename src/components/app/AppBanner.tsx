import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Language } from '../../i18n/index.ts';

export interface BannerState {
  message: string;
  undoLabel?: string;
  onUndo?: () => Promise<void>;
}

interface AppBannerProps {
  banner: BannerState | null;
  onClose: () => void;
  lang: Language;
}

export const AppBanner: React.FC<AppBannerProps> = ({ banner, onClose, lang }) => {
  if (!banner) return null;

  return (
    <div className="absolute top-16 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#121424]/95 border border-indigo-500/50 shadow-2xl text-xs text-indigo-200 flex items-center space-x-3 animate-in fade-in slide-in-from-top-2 backdrop-blur-md">
      <span className="truncate max-w-md">🛸 {banner.message}</span>
      {banner.onUndo && (
        <button
          onClick={banner.onUndo}
          className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-[11px] font-semibold flex items-center space-x-1 transition flex-shrink-0 shadow-sm"
          title="立即撤回此操作"
        >
          <RotateCcw className="w-3 h-3 text-red-300" />
          <span>{banner.undoLabel || (lang === 'zh' ? '↩️ 撤回' : '↩️ Undo')}</span>
        </button>
      )}
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-white text-xs ml-1"
      >
        ✕
      </button>
    </div>
  );
};
