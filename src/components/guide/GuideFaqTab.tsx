import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Language } from '../../i18n/index.ts';
import { FaqItem } from './guideTypes.ts';

interface GuideFaqTabProps {
  faqs: FaqItem[];
  expandedFaq: number | null;
  setExpandedFaq: (idx: number | null) => void;
  lang: Language;
}

export const GuideFaqTab: React.FC<GuideFaqTabProps> = ({
  faqs,
  expandedFaq,
  setExpandedFaq,
  lang,
}) => {
  return (
    <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3 bg-[#0a0c16] animate-in fade-in duration-150">
      <div className="text-xs text-gray-400 mb-2">
        {lang === 'zh'
          ? '整理了新手与老手最常踩坑的 4 大高频场景，点击卡片展开解答：'
          : 'Top 4 real-world troubleshooting scenarios. Click to expand answers:'}
      </div>

      {faqs.map((faq, idx) => {
        const isExpanded = expandedFaq === idx;
        return (
          <div
            key={idx}
            className="rounded-xl bg-[#0e111e] border border-white/[0.06] overflow-hidden transition"
          >
            <button
              type="button"
              onClick={() => setExpandedFaq(isExpanded ? null : idx)}
              className="w-full p-4 flex items-center justify-between text-left space-x-3 hover:bg-white/[0.02] cursor-pointer"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  Q
                </span>
                <span className="text-xs font-bold text-gray-100">
                  {faq.q}
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-purple-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
              )}
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 pt-1 border-t border-white/[0.04] bg-[#090b14]/70">
                <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-line pl-7">
                  {faq.a}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
