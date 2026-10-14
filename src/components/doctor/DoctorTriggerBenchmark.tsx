import React from 'react';
import { Target, AlertCircle } from 'lucide-react';
import { getDoctorTriggerBenchmark } from '../../pro-api/index.ts';
import { Language } from '../../i18n/index.ts';
import type { SkillMeta } from '../../types/index.ts';
import type { TriggerBenchmarkResult } from '../../pro-api/index.ts';
import type { AiConfig } from '../../core/aiClient.ts';

export interface DoctorTriggerBenchmarkProps {
  lang: Language;
  aiConfig: AiConfig;
  activeSkill: SkillMeta | undefined;
  isTestingTriggers: boolean;
  triggerBenchmarkResult: TriggerBenchmarkResult | null;
  onRunTriggerBenchmark: () => void;
}

export const DoctorTriggerBenchmark: React.FC<DoctorTriggerBenchmarkProps> = (props) => {
  const ProComponent = getDoctorTriggerBenchmark();
  if (ProComponent) {
    return <ProComponent {...props} />;
  }

  return (
    <div className="bg-[#101426] rounded-2xl p-4 border border-gray-800 space-y-2 opacity-80">
      <div className="flex items-center space-x-2.5">
        <div className="p-2 rounded-xl bg-gray-800 text-gray-400">
          <Target className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="text-xs font-bold text-gray-300">
              {props.lang === 'zh' ? '🎯 触发命中率评测 (L3 Trigger Test)' : 'Trigger Accuracy Benchmark'}
            </h4>
            <span className="text-[9px] bg-gray-800 text-gray-400 border border-gray-700 px-1.5 py-0.2 rounded font-mono">
              Community
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 inline mr-1" />
            <span>{props.lang === 'zh' ? '此版本不包含该功能（Pro 专属功能）' : 'Feature not included in this edition.'}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
