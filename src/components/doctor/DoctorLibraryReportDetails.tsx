import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Lightbulb,
  Target,
  Cpu,
  CheckCheck,
} from 'lucide-react';
import { LibraryConsultationReport } from '../../core/doctor.ts';
import { Language } from '../../i18n/index.ts';
import { LibraryCategoryFilter } from './doctorModalTypes.ts';

export interface DoctorLibraryReportDetailsProps {
  lang: Language;
  libraryReport: LibraryConsultationReport;
  libraryCategoryFilter: LibraryCategoryFilter;
}

export const DoctorLibraryReportDetails: React.FC<DoctorLibraryReportDetailsProps> = ({
  lang,
  libraryReport,
  libraryCategoryFilter,
}) => {
  return (
    <>
      {/* 1. Conflicts & Deadlocks */}
      {(libraryCategoryFilter === 'all' || libraryCategoryFilter === 'conflicts') && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-gray-300 flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>{lang === 'zh' ? '行为死锁与指令互斥' : 'Behavioral Deadlocks & Opposing Directives'}</span>
            <span className="text-[10px] font-mono text-gray-500">({libraryReport.conflicts.length})</span>
          </h4>
          {libraryReport.conflicts.length === 0 ? (
            <div className="p-3 rounded-xl bg-gray-900/40 border border-gray-800 text-xs text-gray-400 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{lang === 'zh' ? '未发现行为死锁，各技能的执行边界与底线指令协调一致。' : 'No behavioral deadlocks found.'}</span>
            </div>
          ) : (
            libraryReport.conflicts.map((c, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-[#141220] border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded-lg bg-gray-800 border border-gray-700 font-mono">
                      {c.skillA}
                    </span>
                    <span className="text-rose-400 text-xs font-bold">⚔️ 互斥 ⚔️</span>
                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded-lg bg-gray-800 border border-gray-700 font-mono">
                      {c.skillB}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold ${
                    c.severity === 'critical'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {c.severity}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{c.description}</p>
                <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 mr-1">{lang === 'zh' ? '调和建议:' : 'Remedy:'}</span>
                    <span>{c.reconciliationSuggestion}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. Routing Ambiguities */}
      {(libraryCategoryFilter === 'all' || libraryCategoryFilter === 'routing') && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-gray-300 flex items-center space-x-1.5">
            <Target className="w-4 h-4 text-amber-400" />
            <span>{lang === 'zh' ? '路由争抢与意图模糊' : 'Routing Ambiguities & Trigger Overlaps'}</span>
            <span className="text-[10px] font-mono text-gray-500">({libraryReport.routingAmbiguities.length})</span>
          </h4>
          {libraryReport.routingAmbiguities.length === 0 ? (
            <div className="p-3 rounded-xl bg-gray-900/40 border border-gray-800 text-xs text-gray-400 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{lang === 'zh' ? '未发现触发词争抢，意图路由清晰明确。' : 'No routing ambiguities found.'}</span>
            </div>
          ) : (
            libraryReport.routingAmbiguities.map((r, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-[#141520] border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded-lg bg-gray-800 border border-gray-700 font-mono">
                      {r.skillA}
                    </span>
                    <span className="text-amber-400 text-xs font-bold">↔️ 争抢 ↔️</span>
                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded-lg bg-gray-800 border border-gray-700 font-mono">
                      {r.skillB}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold bg-amber-500/20 text-amber-300 border-amber-500/40">
                    {r.severity}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{r.description}</p>
                <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-indigo-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-indigo-300 mr-1">{lang === 'zh' ? '解耦建议:' : 'Resolution:'}</span>
                    <span>{r.reconciliationSuggestion}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. Token Efficiency Issues */}
      {(libraryCategoryFilter === 'all' || libraryCategoryFilter === 'tokens') && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-gray-300 flex items-center space-x-1.5">
            <Cpu className="w-4 h-4 text-sky-400" />
            <span>{lang === 'zh' ? '冷启动 Token 开销与精简建议' : 'Cold-start Token Efficiency'}</span>
            <span className="text-[10px] font-mono text-gray-500">({libraryReport.tokenEfficiencyIssues.length})</span>
          </h4>
          {libraryReport.tokenEfficiencyIssues.length === 0 ? (
            <div className="p-3 rounded-xl bg-gray-900/40 border border-gray-800 text-xs text-gray-400 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{lang === 'zh' ? '全库技能 Description 精炼克制，冷启动 Token 预算健康。' : 'All skill descriptions are concise.'}</span>
            </div>
          ) : (
            libraryReport.tokenEfficiencyIssues.map((t, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-gray-900/60 border border-sky-500/30 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold font-mono text-sky-300">{t.skillName}</span>
                  {t.estimatedTokens && (
                    <span className="text-[10px] font-mono text-gray-400">
                      {t.estimatedTokens} tokens
                    </span>
                  )}
                </div>
                <p className="text-gray-300">{t.issue}</p>
                <p className="text-gray-400 text-[11px] italic">💡 建议: {t.suggestion}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. Positive Highlights */}
      {(libraryCategoryFilter === 'all' || libraryCategoryFilter === 'highlights') && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-gray-300 flex items-center space-x-1.5">
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'zh' ? '架构亮点与一致性认可' : 'Positive Architecture Highlights'}</span>
            <span className="text-[10px] font-mono text-gray-500">({libraryReport.positiveHighlights.length})</span>
          </h4>
          {libraryReport.positiveHighlights.map((h, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{h}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
