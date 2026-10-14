import React from 'react';
import { Sparkles } from 'lucide-react';
import { ConceptCard } from './guideTypes.ts';

interface GuideConceptTabProps {
  card: ConceptCard;
}

export const GuideConceptTab: React.FC<GuideConceptTabProps> = ({ card }) => {
  return (
    <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-[#0a0c16] animate-in fade-in duration-150">
      {/* Card Header Badge & Title */}
      <div>
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{card.badge}</span>
        </div>
        <h4 className="text-lg font-bold text-white tracking-tight mb-1">
          {card.title}
        </h4>
        <p className="text-xs text-gray-400 leading-relaxed">
          {card.subtitle}
        </p>
      </div>

      {/* Comparisons Mode (Cards 0 & 1) */}
      {card.comparisons && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {card.comparisons.map((cmp, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#0e111e] border border-white/[0.06] flex flex-col justify-between space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${cmp.tagColor}`}
                >
                  {cmp.tag}
                </span>
              </div>
              <ul className="space-y-2 text-xs text-gray-300 leading-relaxed flex-1">
                {cmp.points.map((pt, pIdx) => (
                  <li key={pIdx} className="flex items-start space-x-2">
                    <span className="text-gray-500 select-none mt-0.5">·</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Steps Mode (Card 2) */}
      {card.steps && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {card.steps.map((st, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#0e111e] border border-cyan-500/20 flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold font-mono text-xs">
                  {st.num}
                </div>
                <span className="text-xs font-bold text-white">{st.title}</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Takeaway Quote */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/30 to-purple-950/20 border border-amber-500/30 text-xs text-amber-200 font-medium leading-relaxed">
        {card.takeaway}
      </div>
    </div>
  );
};
