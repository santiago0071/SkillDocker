import React, { useState, useMemo } from 'react';
import { Boxes } from 'lucide-react';
import { ModularLegoConfig } from './types.ts';
import { LEGO_PRESETS } from './constants.ts';
import { ForgeLegoTabs } from './ForgeLegoTabs.tsx';

export interface ForgeLegoBuilderProps {
  lang: 'zh' | 'en';
  legoConfig: ModularLegoConfig;
  setLegoConfig: React.Dispatch<React.SetStateAction<ModularLegoConfig>>;
  customRequirement: string;
  setCustomRequirement: (val: string) => void;
  handleAssembleManualSkill: () => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const ForgeLegoBuilder: React.FC<ForgeLegoBuilderProps> = ({
  lang,
  legoConfig,
  setLegoConfig,
  customRequirement,
  setCustomRequirement,
  handleAssembleManualSkill,
  showToast,
}) => {
  const [activeManualTab, setActiveManualTab] = useState<'tech' | 'safety' | 'workflow'>('tech');

  const activeTechCount = useMemo(() => {
    return Object.values(legoConfig.techStack).filter(Boolean).length;
  }, [legoConfig.techStack]);

  const activeSafetyCount = useMemo(() => {
    return Object.values(legoConfig.safety).filter(Boolean).length;
  }, [legoConfig.safety]);

  const activeWorkflowCount = useMemo(() => {
    return Object.values(legoConfig.workflow).filter(Boolean).length;
  }, [legoConfig.workflow]);

  const handleToggleCurrentTabAll = () => {
    if (activeManualTab === 'tech') {
      const allActive = activeTechCount === 5;
      setLegoConfig((prev) => ({
        ...prev,
        techStack: {
          reactTs: !allActive,
          pythonAsync: !allActive,
          rustSystems: !allActive,
          tailwindCss: !allActive,
          generalClean: !allActive,
        },
      }));
    } else if (activeManualTab === 'safety') {
      const allActive = activeSafetyCount === 4;
      setLegoConfig((prev) => ({
        ...prev,
        safety: {
          surgicalDiff: !allActive,
          zeroDataLoss: !allActive,
          authorIntent: !allActive,
          secretsIsolation: !allActive,
        },
      }));
    } else if (activeManualTab === 'workflow') {
      const allActive = activeWorkflowCount === 3;
      setLegoConfig((prev) => ({
        ...prev,
        workflow: {
          planFirst: !allActive,
          diffAudit: !allActive,
          noAutoGitCommit: !allActive,
        },
      }));
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {lang === 'zh' ? '🧩 12 积木脚手架搭建器' : '🧩 12-Block Scaffolding Builder'}
        </h1>
        <p className="text-xs text-gray-400 max-w-xl mx-auto">
          {lang === 'zh'
            ? '无需依赖外部网络或 AI Key，按分类自由配比积木或选用预设，毫秒级实时组装专业级 SOP 技能与规则。'
            : '100% offline without AI keys. Select presets or toggle modular blocks to assemble standard SOPs.'}
        </p>
      </div>

      {/* LEGO Settings Card */}
      <div className="bg-[#121422] border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl text-left">
        {/* Basic Identity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <span className="text-[10px] text-gray-400 block mb-1">
              {lang === 'zh' ? '英文标识符 (Identifier)' : 'Identifier (English)'}
            </span>
            <input
              type="text"
              value={legoConfig.name}
              onChange={(e) =>
                setLegoConfig({
                  ...legoConfig,
                  name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                })
              }
              className="w-full bg-[#0a0c14] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-indigo-300 font-mono focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="sm:col-span-1">
            <span className="text-[10px] text-gray-400 block mb-1">
              {lang === 'zh' ? '所属分类 (Category)' : 'Category'}
            </span>
            <select
              value={legoConfig.category}
              onChange={(e) => setLegoConfig({ ...legoConfig, category: e.target.value })}
              className="w-full bg-[#0a0c14] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500 capitalize"
            >
              <option value="safety">{lang === 'zh' ? 'Safety (安全防御)' : 'Safety'}</option>
              <option value="workflow">{lang === 'zh' ? 'Workflow (工作流)' : 'Workflow'}</option>
              <option value="architecture">{lang === 'zh' ? 'Architecture (架构)' : 'Architecture'}</option>
              <option value="custom">{lang === 'zh' ? 'Custom (专属定制)' : 'Custom'}</option>
            </select>
          </div>
          <div className="sm:col-span-1">
            <span className="text-[10px] text-gray-400 block mb-1">
              {lang === 'zh' ? '核心目标场景 (Requirement)' : 'Core Requirement'}
            </span>
            <input
              type="text"
              value={customRequirement}
              onChange={(e) => setCustomRequirement(e.target.value)}
              placeholder={lang === 'zh' ? '如: 前端防溢出排版与代码重构' : 'e.g. Responsive layout & refactoring guard'}
              className="w-full bg-[#0a0c14] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* 1-Click Golden Presets */}
        <div className="pt-2 border-t border-gray-800/80 space-y-1.5">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
            {lang === 'zh' ? '⚡ 一键黄金预设（秒级组合装配）：' : '⚡ 1-Click Golden Presets:'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {LEGO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setLegoConfig((prev) => ({
                    ...prev,
                    techStack: { ...preset.config.techStack },
                    safety: { ...preset.config.safety },
                    workflow: { ...preset.config.workflow },
                    scopeTriggers: preset.config.scopeTriggers,
                    verificationChecklist: preset.config.verificationChecklist,
                    rollbackSop: preset.config.rollbackSop,
                  }));
                  showToast(
                    lang === 'zh'
                      ? `✓ 已装配 [${preset.label}]`
                      : `✓ Loaded ${preset.labelEn}`,
                    'info'
                  );
                }}
                className="p-2.5 rounded-xl bg-[#0e101d] hover:bg-purple-950/40 border border-gray-800 hover:border-purple-500/40 text-left transition cursor-pointer group"
              >
                <span className="font-bold text-xs text-purple-200 block group-hover:text-purple-100">
                  {lang === 'zh' ? preset.label : preset.labelEn}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5 truncate">
                  {lang === 'zh' ? preset.desc : preset.descEn}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation & Categorized Grid */}
        <div className="pt-2 border-t border-gray-800/80 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-1.5 bg-[#0a0c16] p-1 rounded-xl border border-gray-800">
              <button
                type="button"
                onClick={() => setActiveManualTab('tech')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                  activeManualTab === 'tech'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>⚛️ {lang === 'zh' ? '技术栈范式' : 'Tech Stacks'}</span>
                <span className={`text-[10px] font-mono px-1 py-0.2 rounded-full ${
                  activeManualTab === 'tech' ? 'bg-indigo-400/30 text-white' : 'bg-gray-800 text-gray-400'
                }`}>
                  {activeTechCount}/5
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveManualTab('safety')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                  activeManualTab === 'safety'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>🛡️ {lang === 'zh' ? '安全防御红线' : 'Safety Redlines'}</span>
                <span className={`text-[10px] font-mono px-1 py-0.2 rounded-full ${
                  activeManualTab === 'safety' ? 'bg-red-400/30 text-white' : 'bg-gray-800 text-gray-400'
                }`}>
                  {activeSafetyCount}/4
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveManualTab('workflow')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                  activeManualTab === 'workflow'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>⚡ {lang === 'zh' ? '流程与自检' : 'Workflow & Checklist'}</span>
                <span className={`text-[10px] font-mono px-1 py-0.2 rounded-full ${
                  activeManualTab === 'workflow' ? 'bg-emerald-400/30 text-white' : 'bg-gray-800 text-gray-400'
                }`}>
                  {activeWorkflowCount}/3
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleToggleCurrentTabAll}
              className="text-[11px] text-gray-400 hover:text-purple-300 transition cursor-pointer px-2 py-1 rounded hover:bg-gray-800/60"
            >
              {lang === 'zh' ? '全选 / 取消当前页' : 'Toggle All in Tab'}
            </button>
          </div>

          <ForgeLegoTabs
            lang={lang}
            activeManualTab={activeManualTab}
            legoConfig={legoConfig}
            setLegoConfig={setLegoConfig}
          />
        </div>

        {/* Assemble Action */}
        <div className="pt-2 flex items-center justify-between border-t border-gray-800">
          <span className="text-[11px] text-gray-400">
            {lang === 'zh'
              ? `已激活 ${activeTechCount + activeSafetyCount + activeWorkflowCount} 项积木规则 · 实时编译为规范标准`
              : `${activeTechCount + activeSafetyCount + activeWorkflowCount} blocks active · Compiled to standard SOPs`}
          </span>
          <button
            type="button"
            onClick={handleAssembleManualSkill}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30 flex items-center space-x-2 cursor-pointer"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '🧱 实时拼装并检视技能 (SOP) →' : 'Assemble Skill Document →'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
