import React from 'react';
import { ModularLegoConfig } from './types.ts';

export interface ForgeLegoTabsProps {
  lang: 'zh' | 'en';
  activeManualTab: 'tech' | 'safety' | 'workflow';
  legoConfig: ModularLegoConfig;
  setLegoConfig: React.Dispatch<React.SetStateAction<ModularLegoConfig>>;
}

export const ForgeLegoTabs: React.FC<ForgeLegoTabsProps> = ({
  lang,
  activeManualTab,
  legoConfig,
  setLegoConfig,
}) => {
  return (
    <>
      {/* Tab 1 Content: Tech Stacks */}
      {activeManualTab === 'tech' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs animate-in fade-in duration-150">
          <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
            legoConfig.techStack.reactTs ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200' : 'bg-[#0a0c16] border-gray-800 text-gray-300 hover:border-gray-700'
          }`}>
            <input
              type="checkbox"
              checked={legoConfig.techStack.reactTs}
              onChange={(e) => setLegoConfig({
                ...legoConfig,
                techStack: { ...legoConfig.techStack, reactTs: e.target.checked }
              })}
              className="mt-0.5 rounded text-indigo-600 focus:ring-0"
            />
            <div>
              <span className="font-semibold block text-xs">⚛️ React 19 & TypeScript 5</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {lang === 'zh' ? '强类型标注、现代 Hook、零 any 污染' : 'Strict types, modern hooks, zero any'}
              </span>
            </div>
          </label>

          <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
            legoConfig.techStack.tailwindCss ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200' : 'bg-[#0a0c16] border-gray-800 text-gray-300 hover:border-gray-700'
          }`}>
            <input
              type="checkbox"
              checked={legoConfig.techStack.tailwindCss}
              onChange={(e) => setLegoConfig({
                ...legoConfig,
                techStack: { ...legoConfig.techStack, tailwindCss: e.target.checked }
              })}
              className="mt-0.5 rounded text-cyan-600 focus:ring-0"
            />
            <div>
              <span className="font-semibold block text-xs">
                {lang === 'zh' ? '🎨 Tailwind CSS 4 弹性防御' : '🎨 Tailwind CSS Fluid Defense'}
              </span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {lang === 'zh' ? '自适应排版、min-w-0、防文字崩溃溢出' : 'Fluid layout, min-w-0, overflow prevention'}
              </span>
            </div>
          </label>

          <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
            legoConfig.techStack.pythonAsync ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' : 'bg-[#0a0c16] border-gray-800 text-gray-300 hover:border-gray-700'
          }`}>
            <input
              type="checkbox"
              checked={legoConfig.techStack.pythonAsync}
              onChange={(e) => setLegoConfig({
                ...legoConfig,
                techStack: { ...legoConfig.techStack, pythonAsync: e.target.checked }
              })}
              className="mt-0.5 rounded text-emerald-600 focus:ring-0"
            />
            <div>
              <span className="font-semibold block text-xs">🐍 Python 3.12+ AsyncIO</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {lang === 'zh' ? '异步并发、类型提示、标准工程封装' : 'Async IO, type hints, PEP 8'}
              </span>
            </div>
          </label>

          <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
            legoConfig.techStack.rustSystems ? 'bg-amber-950/40 border-amber-500/50 text-amber-200' : 'bg-[#0a0c16] border-gray-800 text-gray-300 hover:border-gray-700'
          }`}>
            <input
              type="checkbox"
              checked={legoConfig.techStack.rustSystems}
              onChange={(e) => setLegoConfig({
                ...legoConfig,
                techStack: { ...legoConfig.techStack, rustSystems: e.target.checked }
              })}
              className="mt-0.5 rounded text-amber-600 focus:ring-0"
            />
            <div>
              <span className="font-semibold block text-xs">
                {lang === 'zh' ? '🦀 Rust Systems 健壮性' : '🦀 Rust Systems Robustness'}
              </span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {lang === 'zh' ? '所有权内存安全、显式 Result 错误处理' : 'Ownership safety, explicit Result handling'}
              </span>
            </div>
          </label>

          <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition cursor-pointer sm:col-span-2 lg:col-span-2 ${
            legoConfig.techStack.generalClean ? 'bg-purple-950/40 border-purple-500/50 text-purple-200' : 'bg-[#0a0c16] border-gray-800 text-gray-300 hover:border-gray-700'
          }`}>
            <input
              type="checkbox"
              checked={legoConfig.techStack.generalClean}
              onChange={(e) => setLegoConfig({
                ...legoConfig,
                techStack: { ...legoConfig.techStack, generalClean: e.target.checked }
              })}
              className="mt-0.5 rounded text-purple-600 focus:ring-0"
            />
            <div>
              <span className="font-semibold block text-xs">
                {lang === 'zh' ? '🏛️ 通用高内聚低耦合架构' : '🏛️ Clean Modular Architecture'}
              </span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {lang === 'zh' ? '单一职责、清晰领域分层、原子化组件拆解' : 'Single responsibility, clear layers, zero cyclic deps'}
              </span>
            </div>
          </label>
        </div>
      )}

      {/* Tab 2 Content: Safety Redlines */}
      {activeManualTab === 'safety' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs animate-in fade-in duration-150">
          <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
            legoConfig.safety.surgicalDiff ? 'bg-red-950/30 border-red-500/50 text-red-200' : 'bg-[#0a0c16] border-gray-800 text-gray-300 hover:border-gray-700'
          }`}>
            <input
              type="checkbox"
              checked={legoConfig.safety.surgicalDiff}
              onChange={(e) => setLegoConfig({
                ...legoConfig,
                safety: { ...legoConfig.safety, surgicalDiff: e.target.checked }
              })}
              className="mt-0.5 rounded text-red-600 focus:ring-0"
            />
            <div>
              <span className="font-semibold block text-xs">
                {lang === 'zh' ? '🩹 外科手术式局部修改' : '🩹 Surgical Local Modifications'}
              </span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {lang === 'zh' ? '严禁盲目大面积覆写，完整保留原注释与排版' : 'Preserve original comments and style, no blind rewrites'}
              </span>
            </div>
          </label>

          <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
            legoConfig.safety.zeroDataLoss ? 'bg-red-950/30 border-red-500/50 text-red-200' : 'bg-[#0a0c16] border-gray-800 text-gray-300 hover:border-gray-700'
          }`}>
            <input
              type="checkbox"
              checked={legoConfig.safety.zeroDataLoss}
              onChange={(e) => setLegoConfig({
                ...legoConfig,
                safety: { ...legoConfig.safety, zeroDataLoss: e.target.checked }
              })}
              className="mt-0.5 rounded text-red-600 focus:ring-0"
            />
            <div>
              <span className="font-semibold block text-xs">
                {lang === 'zh' ? '🛑 零数据丢失硬性红线' : '🛑 Zero Data Loss Hard Line'}
              </span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {lang === 'zh' ? '严禁未经确认删除数据库表、核心代码与配置' : 'Strictly ban deleting tables, critical files, or configs'}
              </span>
            </div>
          </label>

          <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
            legoConfig.safety.authorIntent ? 'bg-red-950/30 border-red-500/50 text-red-200' : 'bg-[#0a0c16] border-gray-800 text-gray-300 hover:border-gray-700'
          }`}>
            <input
              type="checkbox"
              checked={legoConfig.safety.authorIntent}
              onChange={(e) => setLegoConfig({
                ...legoConfig,
                safety: { ...legoConfig.safety, authorIntent: e.target.checked }
              })}
              className="mt-0.5 rounded text-red-600 focus:ring-0"
            />
            <div>
              <span className="font-semibold block text-xs">
                {lang === 'zh' ? '🎯 原作者原意保真规范' : '🎯 Fidelity to Author Intent'}
              </span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {lang === 'zh' ? '忠实于现有架构基线，严禁主观推测擅自重构' : 'Respect existing architecture and original author intent'}
              </span>
            </div>
          </label>

          <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
            legoConfig.safety.secretsIsolation ? 'bg-red-950/30 border-red-500/50 text-red-200' : 'bg-[#0a0c16] border-gray-800 text-gray-300 hover:border-gray-700'
          }`}>
            <input
              type="checkbox"
              checked={legoConfig.safety.secretsIsolation}
              onChange={(e) => setLegoConfig({
                ...legoConfig,
                safety: { ...legoConfig.safety, secretsIsolation: e.target.checked }
              })}
              className="mt-0.5 rounded text-red-600 focus:ring-0"
            />
            <div>
              <span className="font-semibold block text-xs">
                {lang === 'zh' ? '🔒 敏感凭据绝对隔离' : '🔒 Strict Secrets Isolation'}
              </span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {lang === 'zh' ? '严禁明文暴露或打印 API Key、私钥或生产密码' : 'Strictly forbid exposing API keys, secrets, or credentials'}
              </span>
            </div>
          </label>
        </div>
      )}

      {/* Tab 3 Content: Workflow & Controls */}
      {activeManualTab === 'workflow' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs animate-in fade-in duration-150">
          <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
            legoConfig.workflow.planFirst ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200' : 'bg-[#0a0c16] border-gray-800 text-gray-300 hover:border-gray-700'
          }`}>
            <input
              type="checkbox"
              checked={legoConfig.workflow.planFirst}
              onChange={(e) => setLegoConfig({
                ...legoConfig,
                workflow: { ...legoConfig.workflow, planFirst: e.target.checked }
              })}
              className="mt-0.5 rounded text-emerald-600 focus:ring-0"
            />
            <div>
              <span className="font-semibold block text-xs">
                {lang === 'zh' ? '📐 强制先 Plan 后执行' : '📐 Mandatory Plan-First Protocol'}
              </span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {lang === 'zh' ? '先只读侦察并提出设计方案，获得同意后方可动手' : 'Reconnaissance and approval before modifying code'}
              </span>
            </div>
          </label>

          <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
            legoConfig.workflow.diffAudit ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200' : 'bg-[#0a0c16] border-gray-800 text-gray-300 hover:border-gray-700'
          }`}>
            <input
              type="checkbox"
              checked={legoConfig.workflow.diffAudit}
              onChange={(e) => setLegoConfig({
                ...legoConfig,
                workflow: { ...legoConfig.workflow, diffAudit: e.target.checked }
              })}
              className="mt-0.5 rounded text-emerald-600 focus:ring-0"
            />
            <div>
              <span className="font-semibold block text-xs">
                {lang === 'zh' ? '🔍 执行后 Diff 审计与自测' : '🔍 Post-Execution Diff Audit'}
              </span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {lang === 'zh' ? '本地构建 (npm run build) 零报错验证闭环' : 'Zero-error verification loop (npm run build)'}
              </span>
            </div>
          </label>

          <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
            legoConfig.workflow.noAutoGitCommit ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200' : 'bg-[#0a0c16] border-gray-800 text-gray-300 hover:border-gray-700'
          }`}>
            <input
              type="checkbox"
              checked={legoConfig.workflow.noAutoGitCommit}
              onChange={(e) => setLegoConfig({
                ...legoConfig,
                workflow: { ...legoConfig.workflow, noAutoGitCommit: e.target.checked }
              })}
              className="mt-0.5 rounded text-emerald-600 focus:ring-0"
            />
            <div>
              <span className="font-semibold block text-xs">
                {lang === 'zh' ? '✋ 禁止擅自 Git 提交' : '✋ Ban Automatic Git Commits'}
              </span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {lang === 'zh' ? '禁止自行 git commit，版本入库由用户主导' : 'Ban unprompted git commit/push; user controls commits'}
              </span>
            </div>
          </label>
        </div>
      )}
    </>
  );
};
