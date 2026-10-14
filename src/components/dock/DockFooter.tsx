import React from 'react';
import { WorkspaceState } from '../../types/index.ts';
import { AiConfig } from '../../core/aiClient.ts';
import { Language } from '../../i18n/index.ts';

interface DockFooterProps {
  theme: 'modern' | 'retro-win95';
  lang: Language;
  workspace: WorkspaceState;
  activeEcosystemFilter: string;
  aiConfig: AiConfig;
  currentTimeStr: string;
}

export const DockFooter: React.FC<DockFooterProps> = ({
  theme,
  lang,
  workspace,
  activeEcosystemFilter,
  aiConfig,
  currentTimeStr,
}) => {
  if (theme === 'retro-win95') {
    return (
      <footer className="h-7 px-2 bg-[#c0c0c0] border-t-2 border-t-[#ffffff] text-[11px] text-black flex items-center justify-between flex-shrink-0 select-none font-sans shadow-[inset_0_1px_0_#808080]">
        {/* Left Segmented Cells */}
        <div className="flex items-center space-x-1.5 flex-1 min-w-0 pr-2">
          {/* Status Cell 1: Ready / 就绪 */}
          <div className="px-2 py-0.5 border border-[#808080] border-r-[#ffffff] border-b-[#ffffff] shadow-[inset_1px_1px_0px_#000000] flex items-center space-x-1.5 text-black font-semibold whitespace-nowrap">
            {/* Solid Green Square LED */}
            <span className="w-2 h-2 bg-[#00ff00] border border-black shadow-[inset_1px_1px_0_#ffffff]" />
            <span>{lang === 'zh' ? '就绪' : 'Ready'}</span>
          </div>

          {/* Status Cell 2: Mounted Skills */}
          <div className="px-2 py-0.5 border border-[#808080] border-r-[#ffffff] border-b-[#ffffff] shadow-[inset_1px_1px_0px_#000000] flex items-center space-x-1 text-black font-medium truncate">
            <span>📁</span>
            <span className="truncate">
              {lang === 'zh'
                ? `${workspace.activeSkills.length} 个技能已就绪`
                : `${workspace.activeSkills.length} Skills Ready`}
            </span>
          </div>

          {/* Status Cell 3: Ecosystem Filter */}
          <div className="hidden sm:flex px-2 py-0.5 border border-[#808080] border-r-[#ffffff] border-b-[#ffffff] shadow-[inset_1px_1px_0px_#000000] items-center space-x-1 text-black font-medium whitespace-nowrap">
            <span>🌐</span>
            <span>
              {lang === 'zh'
                ? `生态: ${activeEcosystemFilter === 'all' ? '全部' : activeEcosystemFilter.toUpperCase()}`
                : `Ecosystem: ${activeEcosystemFilter}`}
            </span>
          </div>

          {/* Status Cell 4: Live Directives */}
          <div className="hidden md:flex px-2 py-0.5 border border-[#808080] border-r-[#ffffff] border-b-[#ffffff] shadow-[inset_1px_1px_0px_#000000] items-center space-x-1 text-black font-medium whitespace-nowrap">
            <span>⚡</span>
            <span>
              {lang === 'zh'
                ? `${workspace.liveDirectives.length} 条指令生效中`
                : `${workspace.liveDirectives.length} Directives`}
            </span>
          </div>

          {/* Status Cell 5: AI Engine */}
          <div className="hidden lg:flex px-2 py-0.5 border border-[#808080] border-r-[#ffffff] border-b-[#ffffff] shadow-[inset_1px_1px_0px_#000000] items-center space-x-1 text-black font-medium whitespace-nowrap">
            <span>🤖</span>
            <span>AI: {aiConfig.activeProvider.toUpperCase()}</span>
          </div>

          {/* Status Cell 6: Nostalgic Floppy A: */}
          <div className="hidden xl:flex px-2 py-0.5 border border-[#808080] border-r-[#ffffff] border-b-[#ffffff] shadow-[inset_1px_1px_0px_#000000] items-center space-x-1 text-black font-medium whitespace-nowrap">
            <span>💾</span>
            <span>{lang === 'zh' ? '软盘 A: 1.44MB' : 'Floppy A: 1.44MB'}</span>
          </div>
        </div>

        {/* Right Segmented Cells */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          {/* Shortcut Key */}
          <div
            className="px-2 py-0.5 border border-[#808080] border-r-[#ffffff] border-b-[#ffffff] shadow-[inset_1px_1px_0px_#000000] text-black font-mono font-semibold whitespace-nowrap cursor-pointer hover:bg-white"
            title="按 Ctrl+J（或 Alt+Space）直达指令热注入器；按 Alt+Shift+S 全局呼出"
            onClick={() => {
              const input = document.getElementById('live-directive-input');
              input?.focus();
            }}
          >
            Ctrl+J (指令) · F1 (帮助)
          </div>

          {/* Real-time Clock */}
          <div className="px-2 py-0.5 border border-[#808080] border-r-[#ffffff] border-b-[#ffffff] shadow-[inset_1px_1px_0px_#000000] text-black font-mono font-semibold whitespace-nowrap flex items-center space-x-1">
            <span>🕒</span>
            <span>{currentTimeStr}</span>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="h-7 px-5 bg-[#090a12] border-t border-white/[0.06] text-[11px] text-gray-500 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center space-x-3">
        <span className="flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-gray-400">SkillDocker Studio Pro</span>
        </span>
        <span>·</span>
        <span>
          {lang === 'zh'
            ? `${workspace.activeSkills.length} 本地技能已挂载`
            : `${workspace.activeSkills.length} Local Skills Mounted`}
        </span>
        <span>·</span>
        <span>{lang === 'zh' ? '影子备份守护已激活' : 'Shadow Backup Active'}</span>
      </div>
      <div className="flex items-center space-x-2 font-mono text-[10px]">
        <span className="px-1.5 py-0.2 rounded bg-gray-800 text-gray-300 border border-gray-700/60">
          Ctrl + J
        </span>
        <span>{lang === 'zh' ? '聚焦指令热注入器' : 'Focus Directive'}</span>
        <span className="text-gray-600">·</span>
        <span className="px-1.5 py-0.2 rounded bg-gray-800 text-gray-400 border border-gray-700/60">
          Alt + Shift + S
        </span>
        <span>{lang === 'zh' ? '全局呼出' : 'Global Summon'}</span>
      </div>
    </footer>
  );
};
