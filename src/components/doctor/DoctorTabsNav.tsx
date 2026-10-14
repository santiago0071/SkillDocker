import React from 'react';
import { FileText, Globe } from 'lucide-react';
import { Language } from '../../i18n/index.ts';
import { DoctorTab } from './doctorModalTypes.ts';

interface DoctorTabsNavProps {
  lang: Language;
  activeTab: DoctorTab;
  onSelectTab: (tab: DoctorTab) => void;
  totalSkillsCount: number;
}

export const DoctorTabsNav: React.FC<DoctorTabsNavProps> = ({
  lang,
  activeTab,
  onSelectTab,
  totalSkillsCount,
}) => {
  return (
    <div className="px-5 py-2 bg-[#0c0f1c] border-b border-gray-800/80 flex items-center space-x-2">
      <button
        type="button"
        onClick={() => onSelectTab('single')}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
          activeTab === 'single'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
        }`}
      >
        <FileText className="w-3.5 h-3.5" />
        <span>{lang === 'zh' ? '单技能精修 & 优化' : 'Single Skill Studio'}</span>
      </button>
      <button
        type="button"
        onClick={() => onSelectTab('library')}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
          activeTab === 'library'
            ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
        }`}
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{lang === 'zh' ? '技能库 AI 全景会诊' : 'Library AI Consultation'}</span>
        {totalSkillsCount > 0 && (
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 text-white font-bold">
            {totalSkillsCount}
          </span>
        )}
      </button>
    </div>
  );
};
