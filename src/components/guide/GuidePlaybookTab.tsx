import React from 'react';
import { PlaybookItem } from './guideTypes.ts';

interface GuidePlaybookTabProps {
  playbooks: PlaybookItem[];
  activePlaybook: number;
  setActivePlaybook: (idx: number) => void;
}

export const GuidePlaybookTab: React.FC<GuidePlaybookTabProps> = ({
  playbooks,
  activePlaybook,
  setActivePlaybook,
}) => {
  const pb = playbooks[activePlaybook];

  return (
    <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-[#0a0c16] animate-in fade-in duration-150">
      {/* Playbook Picker Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {playbooks.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActivePlaybook(idx)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-2 whitespace-nowrap border ${
              activePlaybook === idx
                ? 'bg-indigo-600 text-white border-indigo-400/50 shadow-md shadow-indigo-600/30'
                : 'bg-[#0e111e] text-gray-400 hover:text-gray-200 border-gray-800'
            }`}
          >
            <span>{item.title.split('：')[0]}</span>
          </button>
        ))}
      </div>

      {/* Selected Playbook Card */}
      {pb && (
        <div className="p-5 rounded-2xl bg-[#0e111e] border border-indigo-500/20 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-base font-bold text-white tracking-tight">
              {pb.title}
            </h4>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${pb.tagClass}`}>
              {pb.tag}
            </span>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            {pb.desc}
          </p>

          <div className="space-y-3 pt-1">
            {pb.steps.map((st, sIdx) => (
              <div
                key={sIdx}
                className="p-3.5 rounded-xl bg-[#090b14] border border-white/[0.05] flex items-start space-x-3"
              >
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-bold text-xs flex-shrink-0 mt-0.5">
                  {st.step}
                </span>
                <p className="text-xs text-gray-300 leading-relaxed flex-1">
                  {st.action}
                </p>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 font-medium leading-relaxed">
            {pb.tip}
          </div>
        </div>
      )}
    </div>
  );
};
