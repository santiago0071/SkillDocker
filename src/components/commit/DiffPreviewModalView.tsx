import React, { useMemo, useState } from 'react';
import { DiffPreviewData } from './commitModalTypes.ts';
import { Language } from '../../i18n/index.ts';
import { validateContentPreservation } from '../../core/diffHelper.ts';
import { FileCode, X, ShieldAlert, Check, Sparkles, Loader2 } from 'lucide-react';

interface DiffPreviewModalViewProps {
  diffPreview: DiffPreviewData;
  onClose: () => void;
  lang: Language;
}

export const DiffPreviewModalView: React.FC<DiffPreviewModalViewProps> = ({
  diffPreview,
  onClose,
  lang,
}) => {
  const [isCommitting, setIsCommitting] = useState(false);

  const diffLines = useMemo(() => {
    const origLines = (diffPreview.originalContent || '').split(/\r?\n/);
    const newLines = (diffPreview.newContent || '').split(/\r?\n/);

    const origSet = new Set(origLines);
    const newSet = new Set(newLines);

    const lines: { type: 'add' | 'del' | 'same'; text: string }[] = [];
    for (let i = 0; i < origLines.length; i++) {
      if (!newSet.has(origLines[i]) && origLines[i].trim().length > 0) {
        lines.push({ type: 'del', text: origLines[i] });
      }
    }
    for (let j = 0; j < newLines.length; j++) {
      if (!origSet.has(newLines[j]) && newLines[j].trim().length > 0) {
        lines.push({ type: 'add', text: newLines[j] });
      } else if (j < 6 || j > newLines.length - 6) {
        lines.push({ type: 'same', text: newLines[j] });
      }
    }
    return lines;
  }, [diffPreview]);

  const preservation = useMemo(() => {
    return validateContentPreservation(diffPreview.originalContent, diffPreview.newContent);
  }, [diffPreview]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div data-commit-modal="true" className="w-full max-w-2xl bg-[#0f111a] border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#141624] border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex-shrink-0">
              <FileCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-gray-100 truncate">{diffPreview.title}</h3>
              <p className="text-[11px] text-gray-400 truncate">
                {lang === 'zh'
                  ? `目标: [${diffPreview.skillName}] · 写入前差异对比与完整性核验`
                  : `Target: [${diffPreview.skillName}] · Diff check & validation`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Preservation Banner */}
          {!preservation.isValid ? (
            <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs space-y-1">
              <div className="flex items-center space-x-2 font-bold text-rose-200">
                <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{lang === 'zh' ? '❌ 内容保留校验未通过：严禁覆盖写入！' : '❌ Content Preservation Failed: Write Blocked!'}</span>
              </div>
              <p className="text-[11px] text-rose-200/90 pl-6">{preservation.reason}</p>
              <p className="text-[10px] text-rose-300/70 pl-6">
                {lang === 'zh'
                  ? '系统已自动拦截本次写入，以确保不会因大模型重构而意外丢失原始技能的核心业务标题或代码块。'
                  : 'System prevented write to protect skill assets from accidental loss.'}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                {lang === 'zh'
                  ? '✓ 内容保留校验通过：所有原始标题与代码块均 100% 完整保留，未发生破坏性截断。'
                  : '✓ Content preservation passed: All headings and code blocks fully preserved.'}
              </span>
            </div>
          )}

          {/* Changes Summary */}
          {diffPreview.summaryOfChanges && diffPreview.summaryOfChanges.length > 0 && (
            <div className="space-y-1.5 bg-[#121422] p-3 rounded-xl border border-gray-800">
              <div className="text-[11px] font-bold text-gray-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{lang === 'zh' ? '本次变更明细 (基于真实 Diff 计算)：' : 'Summary of Changes:'}</span>
              </div>
              <div className="space-y-1 pl-5">
                {diffPreview.summaryOfChanges.map((item, idx) => (
                  <div key={idx} className="text-xs text-gray-300 font-mono flex items-start space-x-1.5">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visual Diff Container */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{lang === 'zh' ? '变更 Diff 预览：' : 'Changes Diff Preview:'}</span>
              <span className="font-mono text-[10px] text-gray-500">
                <span className="text-emerald-400 font-bold">+{diffLines.filter((l) => l.type === 'add').length}</span>
                {' / '}
                <span className="text-rose-400 font-bold">-{diffLines.filter((l) => l.type === 'del').length}</span>
              </span>
            </div>
            <div className="bg-[#090b12] border border-gray-800 rounded-xl p-3 font-mono text-[11px] max-h-[260px] overflow-y-auto leading-relaxed select-text space-y-0.5">
              {diffLines.map((line, idx) => (
                <div
                  key={idx}
                  className={`px-1.5 py-0.5 rounded ${
                    line.type === 'add'
                      ? 'bg-emerald-950/60 text-emerald-300 border-l-2 border-emerald-400 font-semibold'
                      : line.type === 'del'
                      ? 'bg-rose-950/60 text-rose-300 border-l-2 border-rose-400 line-through opacity-70'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="inline-block w-4 opacity-50 select-none">
                    {line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '}
                  </span>
                  <span>{line.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#141624] border-t border-gray-800 flex-shrink-0">
          <span className="text-[11px] text-gray-400 font-mono">
            {lang === 'zh' ? '🛡️ 写入时自动在本地创建 .bak 备份' : '🛡️ Auto shadow backup on write'}
          </span>
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isCommitting}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
            >
              {lang === 'zh' ? '放弃修改' : 'Discard'}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!preservation.isValid || isCommitting) return;
                setIsCommitting(true);
                try {
                  await diffPreview.onConfirmDiff();
                  onClose();
                } finally {
                  setIsCommitting(false);
                }
              }}
              disabled={isCommitting || !preservation.isValid}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/40 flex items-center space-x-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isCommitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>
                {isCommitting
                  ? lang === 'zh'
                    ? '正在写入...'
                    : 'Writing...'
                  : lang === 'zh'
                  ? '确认采纳并写入磁盘'
                  : 'Confirm & Write to Disk'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
