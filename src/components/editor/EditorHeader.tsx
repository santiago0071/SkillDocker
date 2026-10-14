import React, { useState } from 'react';
import { BookOpen, Check, Copy, Maximize2, Minimize2, X, Lock, AlertCircle, Folder, ChevronDown, CheckCircle2 } from 'lucide-react';
import { SkillMeta } from '../../types/index.ts';
import { Language, translations } from '../../i18n/index.ts';
import {
  formatReadByTool,
  getReadByBadgeStyle,
  isLegacySkill,
  getLegacyNotice,
} from '../../core/skillBadges.ts';

interface EditorHeaderProps {
  name: string;
  skill: SkillMeta;
  category: string;
  isDirty: boolean;
  copiedPath: boolean;
  isMaximized: boolean;
  lang: Language;
  t: (typeof translations)[Language];
  onCopyPath: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
  allSkills?: SkillMeta[];
  isReadOnly?: boolean;
  readOnlyNotice?: string;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  name,
  skill,
  category,
  isDirty,
  copiedPath,
  isMaximized,
  lang,
  t,
  onCopyPath,
  onToggleMaximize,
  onClose,
  allSkills,
  isReadOnly = false,
  readOnlyNotice,
}) => {
  const [locationsOpen, setLocationsOpen] = useState(false);
  const locations = allSkills ? allSkills.filter((s) => s.name === skill.name) : [skill];

  return (
    <div className="relative flex items-center justify-between px-5 py-2.5 bg-[#141624] border-b border-gray-800 flex-shrink-0">
      {/* Left: Title & Status */}
      <div className="flex items-center space-x-3 min-w-0">
        <div className="p-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex-shrink-0">
          <BookOpen className="w-4 h-4" />
        </div>
        <div className="flex items-center space-x-2 min-w-0 flex-wrap">
          <h3 className="text-sm font-bold text-gray-100 truncate whitespace-nowrap">
            {name || skill.name}
          </h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 uppercase whitespace-nowrap flex-shrink-0">
            {category}
          </span>

          {/* ReadBy Badges */}
          {skill.readBy && skill.readBy.length > 0 && (
            <div className="hidden sm:flex items-center space-x-1 flex-shrink-0">
              {skill.readBy.map((tool) => (
                <span
                  key={tool}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${getReadByBadgeStyle(tool)}`}
                  title={`Read by: ${formatReadByTool(tool)}`}
                >
                  {formatReadByTool(tool)}
                </span>
              ))}
            </div>
          )}

          {/* ReadOnly Lock */}
          {isReadOnly && (
            <span
              className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-red-500/15 text-red-300 border border-red-500/30 flex items-center space-x-1 cursor-help flex-shrink-0"
              title={readOnlyNotice || (lang === 'zh' ? '该技能为只读，禁止修改' : 'Read-only skill')}
            >
              <Lock className="w-3 h-3 text-red-400" />
              <span>{lang === 'zh' ? '只读' : 'Read-only'}</span>
            </span>
          )}

          {/* Legacy Badge */}
          {isLegacySkill(skill) && (
            <span
              className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center space-x-1 flex-shrink-0"
              title={getLegacyNotice(lang)}
            >
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span>{getLegacyNotice(lang)}</span>
            </span>
          )}

          {/* Multi-directory indicator */}
          {locations.length > 1 && (
            <button
              type="button"
              onClick={() => setLocationsOpen(!locationsOpen)}
              className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 flex items-center space-x-1 cursor-pointer transition flex-shrink-0"
              title={lang === 'zh' ? '点击查看所有所在目录及对应工具' : 'View all locations and tools'}
            >
              <Folder className="w-3 h-3 text-indigo-400" />
              <span>{lang === 'zh' ? `共存 ${locations.length} 目录` : `${locations.length} dirs`}</span>
              <ChevronDown className="w-3 h-3 text-indigo-400" />
            </button>
          )}

          {isDirty ? (
            <span className="text-[10px] text-amber-400 font-medium flex items-center space-x-1 whitespace-nowrap flex-shrink-0 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>{t.unsavedChanges}</span>
            </span>
          ) : (
            <span className="text-[10px] text-emerald-400 font-medium flex items-center space-x-1 whitespace-nowrap flex-shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              <Check className="w-3 h-3" />
              <span>{t.savedToDisk}</span>
            </span>
          )}
        </div>
      </div>

      {/* Right: Path Pill, Maximize Toggle, Close */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        {/* File Path Pill */}
        <div className="hidden md:flex items-center space-x-1.5 text-[11px] text-gray-400 font-mono bg-gray-900/80 px-2.5 py-1 rounded-lg border border-gray-800">
          <span className="truncate max-w-xs">{skill.rawPath}</span>
          <button
            type="button"
            onClick={onCopyPath}
            className="hover:text-white transition p-0.5 text-gray-400 cursor-pointer"
            title={t.copyPath}
          >
            {copiedPath ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        {/* Maximize / Fullscreen Toggle */}
        <button
          type="button"
          onClick={onToggleMaximize}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
          title={isMaximized ? (lang === 'zh' ? '退出全屏' : 'Exit Fullscreen') : (lang === 'zh' ? '最大化铺满窗口' : 'Maximize Window')}
        >
          {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Multi-directory Locations Popover */}
      {locationsOpen && locations.length > 1 && (
        <div className="absolute left-5 top-full mt-1.5 w-96 bg-[#161925] border border-gray-700 rounded-xl shadow-2xl p-3 z-40 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
            <span className="text-xs font-semibold text-indigo-300 flex items-center space-x-1.5">
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {lang === 'zh'
                  ? `多目录共用列表 (共 ${locations.length} 个目录)`
                  : `Multiple directory locations (${locations.length})`}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setLocationsOpen(false)}
              className="text-gray-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className={`p-2 rounded-lg border text-xs space-y-1 ${
                  loc.id === skill.id
                    ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200'
                    : 'bg-gray-900/60 border-gray-800 text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="truncate flex-1 mr-2" title={loc.rawPath}>
                    {loc.rawPath}
                  </span>
                  {loc.id === skill.id && (
                    <span className="text-[10px] text-indigo-400 font-bold flex items-center space-x-0.5 flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{lang === 'zh' ? '当前' : 'Current'}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center flex-wrap gap-1">
                  {loc.readBy && loc.readBy.length > 0 ? (
                    loc.readBy.map((tool) => (
                      <span
                        key={tool}
                        className={`text-[9px] font-mono px-1 py-0.2 rounded border ${getReadByBadgeStyle(tool)}`}
                      >
                        {formatReadByTool(tool)}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-500">-</span>
                  )}
                  {loc.readOnly && (
                    <span className="text-[9px] text-red-400 border border-red-500/30 px-1 py-0.2 rounded bg-red-500/10">
                      🔒 {lang === 'zh' ? '只读' : 'Read-only'}
                    </span>
                  )}
                  {(loc.legacy || loc.isLegacy) && (
                    <span className="text-[9px] text-amber-400 border border-amber-500/30 px-1 py-0.2 rounded bg-amber-500/10">
                      ⚠️ {getLegacyNotice(lang)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
