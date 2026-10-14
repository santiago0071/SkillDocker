import React from 'react';
import {
  Eye,
  Columns,
  Code,
  Rocket,
  Loader2,
  Sparkles,
  ChevronDown,
  FileCheck2,
  AlertTriangle,
  Layers,
  RotateCcw,
  Save,
} from 'lucide-react';
import { Language, translations } from '../../i18n/index.ts';
import { EditorViewMode, PolishType } from './editorModalTypes.ts';

interface EditorToolbarProps {
  viewMode: EditorViewMode;
  onSelectViewMode: (mode: EditorViewMode) => void;
  onOpenShuttle: () => void;
  polishMenuOpen: boolean;
  onTogglePolishMenu: () => void;
  isPolishing: boolean;
  onAiPolish: (type: PolishType) => void;
  isDirty: boolean;
  onRevert: () => void;
  isSaving: boolean;
  onSave: () => void;
  lang: Language;
  t: (typeof translations)[Language];
  readOnly?: boolean;
  readOnlyNotice?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  viewMode,
  onSelectViewMode,
  onOpenShuttle,
  polishMenuOpen,
  onTogglePolishMenu,
  isPolishing,
  onAiPolish,
  isDirty,
  onRevert,
  isSaving,
  onSave,
  lang,
  t,
  readOnly = false,
  readOnlyNotice,
}) => {
  return (
    <div className="flex items-center justify-between px-5 py-2 bg-[#10121d] border-b border-gray-800 flex-shrink-0 gap-3">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center space-x-1 bg-gray-900/90 border border-gray-800 p-0.5 rounded-xl flex-shrink-0">
        <button
          type="button"
          onClick={() => onSelectViewMode('reader')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
            viewMode === 'reader'
              ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/50 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
          title={t.readerMode}
        >
          <Eye className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{t.readerMode}</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectViewMode('split')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
            viewMode === 'split'
              ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/50 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
          title={t.splitMode}
        >
          <Columns className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{t.splitMode}</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectViewMode('editor')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
            viewMode === 'editor'
              ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/50 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
          title={t.editorMode}
        >
          <Code className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{t.editorMode}</span>
        </button>
      </div>

      {/* Action Tools */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        {/* Ecosystem Shuttle Button */}
        <button
          type="button"
          onClick={onOpenShuttle}
          className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition whitespace-nowrap flex-shrink-0 cursor-pointer"
          title={lang === 'zh' ? '🚀 跨生态穿梭：转译为 Cursor / Claude / DeepSeek' : 'Ecosystem Shuttle'}
        >
          <Rocket className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span>{lang === 'zh' ? '生态穿梭' : 'Shuttle'}</span>
        </button>

        {/* AI Polish Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={onTogglePolishMenu}
            disabled={isPolishing || readOnly}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-medium transition whitespace-nowrap flex-shrink-0 cursor-pointer ${
              readOnly
                ? 'bg-gray-800 text-gray-500 border border-gray-700/60 cursor-not-allowed opacity-50'
                : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 disabled:opacity-50'
            }`}
            title={readOnly ? (readOnlyNotice || (lang === 'zh' ? '只读技能禁止优化' : 'Read-only skill cannot be polished')) : t.aiPolishBtn}
          >
            {isPolishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400 flex-shrink-0" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            )}
            <span>{t.aiPolishBtn}</span>
            <ChevronDown className="w-3 h-3 text-purple-400 flex-shrink-0" />
          </button>

          {polishMenuOpen && !readOnly && (
            <div className="absolute right-0 mt-1.5 w-60 bg-[#161925] border border-gray-700 rounded-xl shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => onAiPolish('polish')}
                className="w-full text-left px-3.5 py-2 text-xs text-gray-200 hover:bg-gray-800/80 flex items-center space-x-2 cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <div>
                  <div className="font-medium whitespace-nowrap">{t.polishOption1Title}</div>
                  <div className="text-[10px] text-gray-400">{t.polishOption1Desc}</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onAiPolish('rules')}
                className="w-full text-left px-3.5 py-2 text-xs text-gray-200 hover:bg-gray-800/80 flex items-center space-x-2 border-t border-gray-800/80 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <div>
                  <div className="font-medium whitespace-nowrap">{t.polishOption2Title}</div>
                  <div className="text-[10px] text-gray-400">{t.polishOption2Desc}</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onAiPolish('format')}
                className="w-full text-left px-3.5 py-2 text-xs text-gray-200 hover:bg-gray-800/80 flex items-center space-x-2 border-t border-gray-800/80 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="font-medium whitespace-nowrap">{t.polishOption3Title}</div>
                  <div className="text-[10px] text-gray-400">{t.polishOption3Desc}</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Revert button if dirty */}
        {isDirty && (
          <button
            type="button"
            onClick={onRevert}
            disabled={readOnly}
            className={`p-1 rounded-xl transition flex-shrink-0 cursor-pointer ${
              readOnly
                ? 'text-gray-600 cursor-not-allowed opacity-40'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={readOnly ? (readOnlyNotice || (lang === 'zh' ? '只读技能禁止回滚' : 'Read-only skill cannot be reverted')) : t.revertBtn}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Save Button */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || !isDirty || readOnly}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0 transition shadow-sm cursor-pointer ${
            readOnly
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
              : isDirty
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              : 'bg-gray-800 text-gray-400 cursor-not-allowed opacity-60'
          }`}
          title={readOnly ? (readOnlyNotice || (lang === 'zh' ? '只读技能禁止保存' : 'Read-only skill cannot be saved')) : `${t.saveToDiskBtn} (Ctrl + S)`}
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
          ) : (
            <Save className="w-3.5 h-3.5 flex-shrink-0" />
          )}
          <span>{t.saveToDiskBtn}</span>
        </button>
      </div>
    </div>
  );
};
