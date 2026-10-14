import React, { useState, useEffect } from 'react';
import { X, Lightbulb, Zap, Gamepad2, HelpCircle } from 'lucide-react';
import { GuideTab, RookieGuideModalProps } from './guide/guideTypes.ts';
import { cardsZh, cardsEn, playbooksZh, playbooksEn, faqsZh, faqsEn } from './guide/guideData.tsx';
import { GuideConceptTab } from './guide/GuideConceptTab.tsx';
import { GuidePlaybookTab } from './guide/GuidePlaybookTab.tsx';
import { GuideFaqTab } from './guide/GuideFaqTab.tsx';
import { GuideFooter } from './guide/GuideFooter.tsx';

export type { GuideTab, RookieGuideModalProps };

export const RookieGuideModal: React.FC<RookieGuideModalProps> = ({
  isOpen,
  onClose,
  lang = 'zh',
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('concept');
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [activePlaybook, setActivePlaybook] = useState<number>(0);

  // Keyboard navigation: Esc to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (activeTab === 'concept') {
        if (e.key === 'ArrowRight') {
          setCurrentStep((prev) => Math.min(prev + 1, 2));
        } else if (e.key === 'ArrowLeft') {
          setCurrentStep((prev) => Math.max(prev - 1, 0));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, activeTab]);

  if (!isOpen) return null;

  const currentCards = lang === 'zh' ? cardsZh : cardsEn;
  const currentPlaybooks = lang === 'zh' ? playbooksZh : playbooksEn;
  const currentFaqs = lang === 'zh' ? faqsZh : faqsEn;
  const card = currentCards[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div data-rookie-modal="true" className="w-full max-w-3xl bg-[#0e111c] border border-amber-500/30 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#17142b] via-[#1a1738] to-[#13172e] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30">
              <Lightbulb className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  {lang === 'zh' ? '💡 新手通关学院 (SkillDocker Academy)' : '💡 SkillDocker Learning Academy'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                  {lang === 'zh' ? '保姆级护航' : 'Level Up'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {lang === 'zh'
                  ? '从认知开窍、到实战操刀、再到排错避坑，彻底玩转 AI Agent 技能体系'
                  : 'From mental models to hands-on playbooks and troubleshooting.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
            title={lang === 'zh' ? '关闭 (Esc)' : 'Close (Esc)'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Tab Navigator */}
        <div className="px-4 sm:px-6 pt-3 bg-[#0a0c16] border-b border-white/[0.06] flex items-center space-x-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('concept')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 border cursor-pointer whitespace-nowrap ${
              activeTab === 'concept'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'text-gray-400 hover:text-gray-200 border-transparent hover:bg-white/[0.04]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'zh' ? '⚡ 30秒概念速通' : '⚡ 30s Quickstart'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('playbook')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 border cursor-pointer whitespace-nowrap ${
              activeTab === 'playbook'
                ? 'bg-indigo-600/25 text-indigo-200 border-indigo-500/40 shadow-sm shadow-indigo-600/20'
                : 'text-gray-400 hover:text-gray-200 border-transparent hover:bg-white/[0.04]'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>{lang === 'zh' ? '🎮 保姆级实操剧本' : '🎮 Hands-on Playbooks'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 border cursor-pointer whitespace-nowrap ${
              activeTab === 'faq'
                ? 'bg-purple-600/25 text-purple-200 border-purple-500/40 shadow-sm shadow-purple-600/20'
                : 'text-gray-400 hover:text-gray-200 border-transparent hover:bg-white/[0.04]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
            <span>{lang === 'zh' ? '❓ 常见避坑 FAQ' : '❓ Troubleshooting FAQ'}</span>
          </button>
        </div>

        {/* Tab 1: 30s Concept Quickstart */}
        {activeTab === 'concept' && <GuideConceptTab card={card} />}

        {/* Tab 2: Hands-on Playbooks */}
        {activeTab === 'playbook' && (
          <GuidePlaybookTab
            playbooks={currentPlaybooks}
            activePlaybook={activePlaybook}
            setActivePlaybook={setActivePlaybook}
          />
        )}

        {/* Tab 3: Troubleshooting FAQs */}
        {activeTab === 'faq' && (
          <GuideFaqTab
            faqs={currentFaqs}
            expandedFaq={expandedFaq}
            setExpandedFaq={setExpandedFaq}
            lang={lang}
          />
        )}

        {/* Footer Navigation Controls */}
        <GuideFooter
          activeTab={activeTab}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          setActiveTab={setActiveTab}
          onClose={onClose}
          lang={lang}
        />

      </div>
    </div>
  );
};
