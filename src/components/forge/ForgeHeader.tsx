import React from 'react';
import { Flame, History, Sparkles, Boxes, X } from 'lucide-react';
import { Language } from '../../i18n/index.ts';

interface ForgeHeaderProps {
  t: Record<string, string>;
  lang: Language;
  isHistoryDrawerOpen: boolean;
  setIsHistoryDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  historyItemsCount: number;
  mode: 'ai' | 'manual';
  setMode: (m: 'ai' | 'manual') => void;
  stage: 'input' | 'revealed';
  setSkillBodyMarkdown: (md: string) => void;
  onClose: () => void;
}

export const ForgeHeader: React.FC<ForgeHeaderProps> = ({
  t,
  lang,
  isHistoryDrawerOpen,
  setIsHistoryDrawerOpen,
  historyItemsCount,
  mode,
  setMode,
  stage,
  setSkillBodyMarkdown,
  onClose,
}) => {
  return (
    <div className="px-6 py-3.5 bg-[#101220] border-b border-gray-800 flex items-center justify-between flex-shrink-0 forge-titlebar">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
          <Flame className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide flex items-center space-x-2">
            <span>{t.forgeTitle}</span>
          </h2>
        </div>

        {/* Toggle Left History Sessions Sidebar */}
        <button
          type="button"
          onClick={() => setIsHistoryDrawerOpen((prev) => !prev)}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer ml-2 ${
            isHistoryDrawerOpen
              ? 'bg-purple-600/25 border-purple-500/50 text-purple-200 shadow-md shadow-purple-600/20'
              : 'bg-gray-900/80 hover:bg-gray-800 border-gray-700/80 text-gray-400 hover:text-white'
          }`}
          title={isHistoryDrawerOpen ? (lang === 'zh' ? '收起左侧历史会话栏' : 'Collapse Sessions') : (lang === 'zh' ? '展开左侧历史会话栏' : 'Open Sessions')}
        >
          <History className="w-3.5 h-3.5 text-purple-400" />
          <span>{lang === 'zh' ? '会话记录' : 'Sessions'}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {historyItemsCount}
          </span>
        </button>
      </div>

      {/* Center Mode Switch: AI Mode vs Manual LEGO Mode */}
      <div className="flex items-center bg-[#161828] p-1 rounded-2xl border border-gray-700/80">
        <button
          type="button"
          onClick={() => {
            setMode('ai');
            if (stage === 'input') setSkillBodyMarkdown('');
          }}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
            mode === 'ai'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.forgeModeAi}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('manual');
            if (stage === 'input') setSkillBodyMarkdown('');
          }}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
            mode === 'manual'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>{t.forgeModeManual} {lang === 'zh' ? '(12 积木)' : '(12 Blocks)'}</span>
        </button>
      </div>

      {/* Right: Close */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition cursor-pointer"
          title={lang === 'zh' ? '关闭' : 'Close'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
