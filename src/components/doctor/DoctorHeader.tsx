import React from 'react';
import { Stethoscope, Sparkles, Activity, UploadCloud, X } from 'lucide-react';
import { Language } from '../../i18n/index.ts';
import { DoctorMode } from './doctorModalTypes.ts';

interface DoctorHeaderProps {
  lang: Language;
  mode: DoctorMode;
  onSetMode: (mode: DoctorMode) => void;
  onUploadClick: () => void;
  onClose: () => void;
}

export const DoctorHeader: React.FC<DoctorHeaderProps> = ({
  lang,
  mode,
  onSetMode,
  onUploadClick,
  onClose,
}) => {
  return (
    <div className="px-5 py-3.5 border-b border-gray-800/80 flex items-center justify-between bg-[#121524]">
      <div className="flex items-center space-x-3 min-w-0">
        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner flex-shrink-0">
          <Stethoscope className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-white tracking-wide truncate">
              {lang === 'zh' ? 'Skills Doctor · 智能体检与优化' : 'Skills Doctor Studio'}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase tracking-wider flex-shrink-0">
              Optimizer
            </span>
          </div>
          <p className="text-[11px] text-gray-400 truncate mt-0.5">
            {lang === 'zh'
              ? 'AI 深度研判编写质量 · 智能补充扩充 · 一键完善技能与规则'
              : 'AI quality review, skill enrichment & 1-click optimization'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2.5 flex-shrink-0">
        {/* Mode switch */}
        <div className="flex items-center bg-gray-900/90 p-0.5 rounded-xl border border-gray-800 text-xs">
          <button
            type="button"
            onClick={() => onSetMode('ai')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
              mode === 'ai'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="大模型深度语义研判与补充建议"
          >
            <Sparkles className="w-3 h-3 text-purple-200" />
            <span>{lang === 'zh' ? 'AI 研判' : 'AI'}</span>
          </button>
          <button
            type="button"
            onClick={() => onSetMode('heuristic')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
              mode === 'heuristic'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="0ms 本地规则快速扫描"
          >
            <Activity className="w-3 h-3 text-indigo-200" />
            <span>{lang === 'zh' ? '0ms 极速' : 'Fast'}</span>
          </button>
        </div>

        {/* Header Direct Upload Button */}
        <button
          type="button"
          onClick={onUploadClick}
          className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-md shadow-purple-900/40 flex-shrink-0"
          title={lang === 'zh' ? '上传本地文件进行检查 (.md, .cursorrules 等)' : 'Upload local file to inspect'}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>{lang === 'zh' ? '上传文件' : 'Upload'}</span>
        </button>

        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition cursor-pointer"
          title="关闭 Skills Doctor"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
