import React from 'react';
import { ArrowLeft, ArrowRight, Gamepad2, CheckCircle2 } from 'lucide-react';
import { Language } from '../../i18n/index.ts';
import { GuideTab } from './guideTypes.ts';

interface GuideFooterProps {
  activeTab: GuideTab;
  currentStep: number;
  setCurrentStep: (step: number | ((prev: number) => number)) => void;
  setActiveTab: (tab: GuideTab) => void;
  onClose: () => void;
  lang: Language;
}

export const GuideFooter: React.FC<GuideFooterProps> = ({
  activeTab,
  currentStep,
  setCurrentStep,
  setActiveTab,
  onClose,
  lang,
}) => {
  return (
    <div className="p-4 bg-[#080911] border-t border-white/[0.06] flex items-center justify-between">
      {activeTab === 'concept' ? (
        <>
          {/* Step Dots indicator */}
          <div className="flex items-center space-x-2">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === idx
                    ? 'w-6 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                    : 'w-2 bg-gray-700 hover:bg-gray-500'
                }`}
                title={`Step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Prev / Next / Done Buttons */}
          <div className="flex items-center space-x-2.5">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '上一页' : 'Previous'}</span>
              </button>
            )}

            {currentStep < 2 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(prev + 1, 2))}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                <span>{lang === 'zh' ? '下一页' : 'Next'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('playbook')}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-white" />
                <span>{lang === 'zh' ? '体验实战剧本 ➔' : 'Try Playbooks ➔'}</span>
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="w-full flex items-center justify-between">
          <span className="text-xs text-gray-500 font-mono">
            {activeTab === 'playbook' ? '🎮 Hands-on Playbook Module' : '❓ Troubleshooting Knowledgebase'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-gray-950" />
            <span>{lang === 'zh' ? '🚀 搞懂啦，开始使用！' : '🚀 Got it, let’s go!'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
