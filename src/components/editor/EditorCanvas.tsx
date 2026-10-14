import React from 'react';
import { Loader2 } from 'lucide-react';
import { Language, translations } from '../../i18n/index.ts';
import { EditorViewMode } from './editorModalTypes.ts';

interface EditorCanvasProps {
  loading: boolean;
  viewMode: EditorViewMode;
  splitRatio: number;
  splitContainerRef: React.RefObject<HTMLDivElement | null>;
  onSplitResizeStart: (e: React.MouseEvent) => void;
  onResetSplitRatio: () => void;
  bodyMarkdown: string;
  onBodyMarkdownChange: (val: string) => void;
  renderedHtml: string;
  lang: Language;
  t: (typeof translations)[Language];
  readOnly?: boolean;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  loading,
  viewMode,
  splitRatio,
  splitContainerRef,
  onSplitResizeStart,
  onResetSplitRatio,
  bodyMarkdown,
  onBodyMarkdownChange,
  renderedHtml,
  lang,
  t,
  readOnly = false,
}) => {
  return (
    <div className="flex-1 min-h-0 relative bg-[#0a0c13]">
      {loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-[#0a0c13]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <span className="text-xs text-gray-400 font-mono">
            {lang === 'zh' ? '正在加载并解析技能内容...' : 'Loading and parsing skill content...'}
          </span>
        </div>
      ) : (
        <div ref={splitContainerRef} className="h-full flex overflow-hidden relative">
          {/* Left Column: Markdown Editor */}
          {(viewMode === 'split' || viewMode === 'editor') && (
            <div
              style={viewMode === 'split' ? { width: `${splitRatio}%` } : undefined}
              className={`h-full flex flex-col ${
                viewMode === 'split' ? 'border-r border-gray-800' : 'w-full'
              }`}
            >
              <div className="px-3 py-1.5 bg-[#0e1019] border-b border-gray-800 text-[11px] text-gray-400 flex items-center justify-between select-none">
                <span className="font-mono">
                  {t.sourceFileHeader}
                  {readOnly && (
                    <span className="ml-1.5 text-red-400 text-[10px] font-sans">
                      (🔒 {lang === 'zh' ? '只读保护' : 'Read-only'})
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-gray-500">
                  {t.linesChars
                    .replace('{lines}', String(bodyMarkdown.split('\n').length))
                    .replace('{chars}', String(bodyMarkdown.length))}
                </span>
              </div>
              <textarea
                value={bodyMarkdown}
                readOnly={readOnly}
                onChange={(e) => onBodyMarkdownChange(e.target.value)}
                placeholder={lang === 'zh' ? '在此编写该技能的规则、前置条件与执行步骤...' : 'Write your skill SOP directives, preconditions, and execution steps here...'}
                className={`flex-1 w-full p-4 font-mono text-xs leading-relaxed resize-none focus:outline-none selection:bg-indigo-900/60 selection:text-white ${
                  readOnly ? 'bg-[#08090e] text-gray-400 cursor-default' : 'bg-[#090b11] text-gray-200'
                }`}
                spellCheck={false}
              />
            </div>
          )}

          {/* Draggable Vertical Split Resizer (in Split Mode) */}
          {viewMode === 'split' && (
            <div
              onMouseDown={onSplitResizeStart}
              onDoubleClick={onResetSplitRatio}
              className="resizer-bar-vertical"
              title={
                lang === 'zh'
                  ? '↔ 拖拽调整代码与预览分栏宽度 (双击恢复 50:50)'
                  : '↔ Drag to resize split pane width (Double click to reset)'
              }
            />
          )}

          {/* Right Column: Typora/Notion-grade Reader / Preview */}
          {(viewMode === 'split' || viewMode === 'reader') && (
            <div
              style={viewMode === 'split' ? { width: `${100 - splitRatio}%` } : undefined}
              className={`h-full flex flex-col ${
                viewMode === 'split' ? '' : 'w-full'
              } bg-[#0c0e17]`}
            >
              <div className="px-4 py-1.5 bg-[#10121d] border-b border-gray-800 text-[11px] text-gray-400 flex items-center justify-between select-none">
                <span className="font-medium text-gray-300">{t.previewHeader}</span>
                <span className="text-[10px] text-gray-500">Typora / Notion 质感</span>
              </div>
              <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                <div
                  className="markdown-reader max-w-4xl mx-auto"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
