import React from 'react';
import { Target, Globe } from 'lucide-react';
import { Language } from '../../i18n/index.ts';
import { TargetScope } from './injectorTypes.ts';

interface InjectorScopeBarProps {
  lang: Language;
  targetScope: TargetScope;
  setTargetScope: (scope: TargetScope) => void;
  ecoCounts: {
    antigravity: number;
    claude: number;
    codex: number;
    agents: number;
    all: number;
  };
}

export const InjectorScopeBar: React.FC<InjectorScopeBarProps> = ({
  lang,
  targetScope,
  setTargetScope,
  ecoCounts,
}) => {
  return (
    <div className="flex items-center justify-between flex-wrap gap-1.5 px-1 text-xs select-none live-scope-bar">
      <div className="flex items-center space-x-1.5 flex-wrap gap-1">
        <span className="text-[11px] font-semibold text-gray-400 flex items-center space-x-1 mr-1">
          <Target className="w-3.5 h-3.5 text-indigo-400" />
          <span>{lang === 'zh' ? '生效目标:' : 'Target Scope:'}</span>
        </span>

        <button
          type="button"
          onClick={() => setTargetScope('universal')}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1 border live-scope-tab-btn ${
            targetScope === 'universal'
              ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 text-purple-200 border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.2)] is-active'
              : 'bg-gray-900/60 text-gray-400 hover:text-gray-200 border-gray-800'
          }`}
          title="对所有生态的智能体共同生效的临时指令"
        >
          <Globe className="w-3 h-3 text-purple-400" />
          <span>{lang === 'zh' ? '🌐 全部 AI 通用' : '🌐 Universal (All Agents)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setTargetScope('antigravity')}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1 border live-scope-tab-btn ${
            targetScope === 'antigravity'
              ? 'bg-purple-600/20 text-purple-200 border-purple-500/50 shadow-sm is-active'
              : 'bg-gray-900/60 text-gray-400 hover:text-gray-200 border-gray-800'
          }`}
        >
          <span>🟣 Antigravity ({ecoCounts.antigravity})</span>
        </button>

        <button
          type="button"
          onClick={() => setTargetScope('claude')}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1 border live-scope-tab-btn ${
            targetScope === 'claude'
              ? 'bg-amber-600/20 text-amber-200 border-amber-500/50 shadow-sm is-active'
              : 'bg-gray-900/60 text-gray-400 hover:text-gray-200 border-gray-800'
          }`}
        >
          <span>🟠 Claude Code ({ecoCounts.claude})</span>
        </button>

        <button
          type="button"
          onClick={() => setTargetScope('codex')}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1 border live-scope-tab-btn ${
            targetScope === 'codex'
              ? 'bg-emerald-600/20 text-emerald-200 border-emerald-500/50 shadow-sm is-active'
              : 'bg-gray-900/60 text-gray-400 hover:text-gray-200 border-gray-800'
          }`}
        >
          <span>🟢 Codex ({ecoCounts.codex})</span>
        </button>

        <button
          type="button"
          onClick={() => setTargetScope('all')}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1 border live-scope-tab-btn ${
            targetScope === 'all'
              ? 'bg-blue-600/20 text-blue-200 border-blue-500/50 shadow-sm is-active'
              : 'bg-gray-900/60 text-gray-400 hover:text-gray-200 border-gray-800'
          }`}
        >
          <span>{lang === 'zh' ? `全部 (${ecoCounts.all})` : `All (${ecoCounts.all})`}</span>
        </button>
      </div>
    </div>
  );
};
