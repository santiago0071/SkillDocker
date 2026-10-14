import React from 'react';
import { History, X, Sparkles, Search, Copy, Trash2 } from 'lucide-react';
import { ForgedHistoryItem } from './types.ts';
import { Language } from '../../i18n/index.ts';

interface ForgeHistoryDrawerProps {
  historyDrawerWidth: number;
  historyItems: ForgedHistoryItem[];
  filteredHistory: ForgedHistoryItem[];
  historySearch: string;
  setHistorySearch: (q: string) => void;
  stage: 'input' | 'revealed';
  skillName: string;
  lang: Language;
  setIsHistoryDrawerOpen: (open: boolean) => void;
  handleNewSession: () => void;
  handleLoadHistoryItem: (item: ForgedHistoryItem) => void;
  handleDeleteHistoryItem: (id: string, e: React.MouseEvent) => void;
  setHistoryItems: React.Dispatch<React.SetStateAction<ForgedHistoryItem[]>>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ForgeHistoryDrawer: React.FC<ForgeHistoryDrawerProps> = ({
  historyDrawerWidth,
  historyItems,
  filteredHistory,
  historySearch,
  setHistorySearch,
  stage,
  skillName,
  lang,
  setIsHistoryDrawerOpen,
  handleNewSession,
  handleLoadHistoryItem,
  handleDeleteHistoryItem,
  setHistoryItems,
  showToast,
}) => {
  return (
    <div
      style={{ width: `${historyDrawerWidth}px` }}
      className="flex-shrink-0 border-r border-gray-800 bg-[#0c0e18] flex flex-col z-20 overflow-hidden relative forge-history-drawer"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-[#101220] forge-history-header">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold text-white tracking-wide">
            {lang === 'zh' ? '历史会话与构想' : 'Sessions & History'}
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {historyItems.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsHistoryDrawerOpen(false)}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
          title={lang === 'zh' ? '收起会话栏' : 'Collapse Sidebar'}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* New Session Button */}
      <div className="p-2.5 border-b border-gray-800/80 bg-[#0d0f1c]">
        <button
          type="button"
          onClick={handleNewSession}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 text-xs font-semibold transition cursor-pointer group shadow-sm hover:border-purple-400 forge-new-session-btn"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-12 transition-transform" />
          <span>{lang === 'zh' ? '+ 新建技能构想 (New Session)' : '+ New Skill Session'}</span>
        </button>
      </div>

      {/* Drawer Search */}
      <div className="p-2.5 border-b border-gray-800/80 bg-[#0d0f1c]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder={lang === 'zh' ? '搜索历史技能或会话...' : 'Search sessions...'}
            className="w-full bg-[#161828] border border-gray-800 rounded-xl pl-8 pr-2.5 py-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 forge-search-input"
          />
        </div>
      </div>

      {/* Drawer Item List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 forge-history-list">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <Sparkles className="w-8 h-8 text-purple-400/60 mx-auto animate-pulse" />
            <p className="text-xs font-semibold text-gray-300">
              {lang === 'zh' ? '暂无锻造会话记录' : 'No Forge Sessions Recorded'}
            </p>
            <p className="text-[11px] text-gray-500 leading-relaxed max-w-[210px] mx-auto">
              {lang === 'zh'
                ? '工坊专注保存您在此处由 AI 智能构想或 12 积木拼装的新技能会话。点击上方「+ 新建技能构想」即可开启创作！'
                : 'Forge records sessions created via AI or LEGO assembly. Click "+ New Skill Session" to begin!'}
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isSelected = stage === 'revealed' && skillName === item.name;
            return (
              <div
                key={item.id}
                onClick={() => handleLoadHistoryItem(item)}
                className={`p-3 rounded-2xl border transition group space-y-2 text-left cursor-pointer forge-history-item ${
                  isSelected
                    ? 'bg-[#1a1b32] border-purple-500/80 shadow-md shadow-purple-950/50 is-selected'
                    : 'bg-[#141628] hover:bg-[#181a30] border-gray-800 hover:border-purple-500/40'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs text-purple-200 block truncate font-mono forge-history-title">
                      {item.name}
                    </span>
                    {item.prompt && (
                      <p className="text-[10px] text-gray-400 italic block mt-0.5 truncate forge-history-prompt">
                        💬 "{item.prompt}"
                      </p>
                    )}
                    {!item.prompt && item.description && (
                      <span className="text-[10px] text-gray-500 block mt-0.5 truncate forge-history-desc">
                        {item.description}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 flex-shrink-0 font-mono">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-800/80">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                      {item.category}
                    </span>
                    {item.source === 'llm' ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25">
                        AI 智能
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
                        预设模板
                      </span>
                    )}
                    {item.doctorScore && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                        {item.doctorScore}分
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(item.markdown);
                        showToast(lang === 'zh' ? '已复制 Markdown 内容' : 'Copied Markdown', 'success');
                      }}
                      className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                      title="复制内容"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                      className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/30 transition cursor-pointer"
                      title="移除会话"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer Footer */}
      {historyItems.length > 0 && (
        <div className="p-2.5 border-t border-gray-800 bg-[#0d0f1c] flex items-center justify-between text-[11px] text-gray-500">
          <span>{lang === 'zh' ? `共 ${historyItems.length} 项会话记录` : `${historyItems.length} sessions`}</span>
          <button
            type="button"
            onClick={() => {
              if (confirm(lang === 'zh' ? '确定要清空全部锻造历史记录吗？' : 'Clear all forged history?')) {
                setHistoryItems([]);
                localStorage.removeItem('skilldocker_forged_history');
                showToast(lang === 'zh' ? '已清空历史记录' : 'History cleared', 'info');
              }
            }}
            className="text-gray-500 hover:text-red-400 transition cursor-pointer"
          >
            {lang === 'zh' ? '清空历史' : 'Clear All'}
          </button>
        </div>
      )}
    </div>
  );
};
