import React from 'react';
import { SkillMeta } from '../types/index.ts';
import { Language } from '../i18n/index.ts';
import { X, BookOpen, Lock, AlertCircle, Folder, CheckCircle2 } from 'lucide-react';
import {
  formatReadByTool,
  getReadByBadgeStyle,
  isLegacySkill,
  isReadOnlySkill,
  getReadOnlyNotice,
  getLegacyNotice,
} from '../core/skillBadges.ts';

interface SkillDetailModalProps {
  skill: SkillMeta | null;
  allSkills?: SkillMeta[];
  onClose: () => void;
  lang?: Language;
}

export const SkillDetailModal: React.FC<SkillDetailModalProps> = ({
  skill,
  allSkills,
  onClose,
  lang = 'zh',
}) => {
  if (!skill) return null;

  const locations = allSkills ? allSkills.filter((s) => s.name === skill.name) : [skill];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#141722] border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#161926]">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex-shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-gray-100 truncate">{skill.name}</h3>
                {isReadOnlySkill(skill) && (
                  <span
                    className="flex items-center space-x-1 text-[10px] font-mono px-1.5 py-0.2 rounded border bg-red-500/15 text-red-300 border-red-500/30 flex-shrink-0"
                    title={getReadOnlyNotice(skill, lang)}
                  >
                    <Lock className="w-2.5 h-2.5 text-red-400" />
                    <span>{lang === 'zh' ? '只读' : 'Read-only'}</span>
                  </span>
                )}
                {isLegacySkill(skill) && (
                  <span
                    className="flex items-center space-x-1 text-[10px] font-mono px-1.5 py-0.2 rounded border bg-amber-500/15 text-amber-300 border-amber-500/30 flex-shrink-0"
                    title={getLegacyNotice(lang)}
                  >
                    <AlertCircle className="w-2.5 h-2.5 text-amber-400" />
                    <span>{getLegacyNotice(lang)}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 font-mono truncate max-w-sm">{skill.rawPath}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Read-only warning banner if applicable */}
          {isReadOnlySkill(skill) && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
              <Lock className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <span>{getReadOnlyNotice(skill, lang)}</span>
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              {lang === 'zh' ? '技能描述' : 'Description'}
            </h4>
            <p className="text-xs text-gray-200 leading-relaxed bg-gray-900/50 p-3 rounded-xl border border-gray-800">
              {skill.description || (lang === 'zh' ? '未提供详细描述' : 'No detailed description provided.')}
            </p>
          </div>

          {/* Read By Tools */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              {lang === 'zh' ? '读取工具 (Read By)' : 'Read By Tools'}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {skill.readBy && skill.readBy.length > 0 ? (
                skill.readBy.map((tool) => (
                  <span
                    key={tool}
                    className={`text-xs font-mono px-2 py-0.5 rounded-lg border font-semibold ${getReadByBadgeStyle(tool)}`}
                  >
                    {formatReadByTool(tool)}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500 italic">
                  {lang === 'zh' ? '未识别到特定读取工具' : 'No specific tool assigned'}
                </span>
              )}
            </div>
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800">
              <span className="text-gray-400 block text-[11px] mb-1">{lang === 'zh' ? '分类' : 'Category'}</span>
              <span className="font-semibold text-indigo-300 capitalize">{skill.category || 'General'}</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800">
              <span className="text-gray-400 block text-[11px] mb-1">{lang === 'zh' ? '治理状态' : 'Status'}</span>
              <span className={`font-semibold ${skill.enabled ? 'text-emerald-400' : 'text-gray-400'}`}>
                {skill.enabled ? (lang === 'zh' ? '已激活治理' : 'Active / Governing') : (lang === 'zh' ? '已停用' : 'Disabled')}
              </span>
            </div>
          </div>

          {/* Multi-directory Locations */}
          {locations.length > 1 && (
            <div className="p-3 rounded-xl bg-gray-900/70 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                <span className="flex items-center space-x-1.5">
                  <Folder className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {lang === 'zh'
                      ? `多目录共用（共存在于 ${locations.length} 个目录）`
                      : `Multi-directory instances (${locations.length} locations)`}
                  </span>
                </span>
              </div>
              <div className="space-y-1.5">
                {locations.map((loc) => (
                  <div
                    key={loc.id}
                    className={`p-2 rounded-lg border text-xs space-y-1 ${
                      loc.id === skill.id
                        ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200'
                        : 'bg-gray-950/40 border-gray-800 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="truncate flex-1 mr-2" title={loc.rawPath}>
                        {loc.rawPath}
                      </span>
                      {loc.id === skill.id && (
                        <span className="text-[10px] text-indigo-400 font-bold flex items-center space-x-0.5">
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
                      {isReadOnlySkill(loc) && (
                        <span className="text-[9px] text-red-400 border border-red-500/30 px-1 py-0.2 rounded bg-red-500/10">
                          🔒 {lang === 'zh' ? '只读' : 'Read-only'}
                        </span>
                      )}
                      {isLegacySkill(loc) && (
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

        <div className="p-3 bg-gray-950/60 border-t border-gray-800/80 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-200 rounded-lg transition cursor-pointer"
          >
            {lang === 'zh' ? '关闭' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
