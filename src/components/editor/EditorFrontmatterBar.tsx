import React from 'react';
import { FileCode } from 'lucide-react';
import { Language, translations } from '../../i18n/index.ts';

interface EditorFrontmatterBarProps {
  name: string;
  category: string;
  version: string;
  description: string;
  showRawFm: boolean;
  frontmatterText: string;
  onUpdateField: (field: 'name' | 'desc' | 'cat' | 'ver', val: string) => void;
  onToggleRawFm: () => void;
  onRawFmChange: (text: string) => void;
  t: (typeof translations)[Language];
  readOnly?: boolean;
}

export const EditorFrontmatterBar: React.FC<EditorFrontmatterBarProps> = ({
  name,
  category,
  version,
  description,
  showRawFm,
  frontmatterText,
  onUpdateField,
  onToggleRawFm,
  onRawFmChange,
  t,
  readOnly = false,
}) => {
  return (
    <div className="px-5 py-2.5 bg-[#11131c] border-b border-gray-800/80 flex-shrink-0">
      <div className="flex items-center justify-between text-xs gap-3">
        <div className="flex items-center space-x-3 w-full max-w-4xl">
          {/* Skill Name */}
          <div className="flex items-center space-x-1.5 flex-1 min-w-0">
            <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">{t.metaName}</span>
            <input
              type="text"
              value={name}
              disabled={readOnly}
              onChange={(e) => onUpdateField('name', e.target.value)}
              className={`border border-gray-700/60 rounded-lg px-2 py-1 text-xs text-gray-100 focus:outline-none focus:border-indigo-500 w-full font-mono ${
                readOnly ? 'bg-gray-900/40 text-gray-400 cursor-not-allowed' : 'bg-gray-900/80'
              }`}
              placeholder="skill-name"
            />
          </div>

          {/* Category */}
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">{t.metaCategory}</span>
            <select
              value={category}
              disabled={readOnly}
              onChange={(e) => onUpdateField('cat', e.target.value)}
              className={`border border-gray-700/60 rounded-lg px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 capitalize ${
                readOnly ? 'bg-gray-900/40 text-gray-400 cursor-not-allowed' : 'bg-gray-900/80 cursor-pointer'
              }`}
            >
              <option value="safety">Safety (安全约束)</option>
              <option value="workflow">Workflow (工作流)</option>
              <option value="architecture">Architecture (架构)</option>
              <option value="marketing">Marketing (营销与文案)</option>
              <option value="custom">Custom (定制)</option>
            </select>
          </div>

          {/* Version */}
          <div className="flex items-center space-x-1.5 flex-shrink-0 w-28">
            <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">{t.metaVersion}</span>
            <input
              type="text"
              value={version}
              disabled={readOnly}
              onChange={(e) => onUpdateField('ver', e.target.value)}
              className={`border border-gray-700/60 rounded-lg px-2 py-1 text-xs text-gray-200 font-mono focus:outline-none focus:border-indigo-500 w-full ${
                readOnly ? 'bg-gray-900/40 text-gray-400 cursor-not-allowed' : 'bg-gray-900/80'
              }`}
            />
          </div>
        </div>

        {/* Toggle Raw YAML */}
        <button
          type="button"
          onClick={onToggleRawFm}
          className="text-[11px] text-indigo-400 hover:text-indigo-300 transition flex items-center space-x-1 ml-3 flex-shrink-0 whitespace-nowrap cursor-pointer"
        >
          <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{showRawFm ? t.collapseYaml : t.editRawYaml}</span>
        </button>
      </div>

      {/* Description input */}
      <div className="mt-2 flex items-center space-x-2">
        <span className="text-[11px] text-gray-400 font-medium flex-shrink-0 whitespace-nowrap">{t.metaDesc}</span>
        <input
          type="text"
          value={description}
          disabled={readOnly}
          onChange={(e) => onUpdateField('desc', e.target.value)}
          className={`w-full border border-gray-700/60 rounded-lg px-2.5 py-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 ${
            readOnly ? 'bg-gray-900/40 text-gray-400 cursor-not-allowed' : 'bg-gray-900/80'
          }`}
          placeholder="概括该技能的触发条件与核心治理职能..."
        />
      </div>

      {/* Raw Frontmatter YAML Drawer if toggled */}
      {showRawFm && (
        <div className="mt-2 pt-2 border-t border-gray-800">
          <label className="text-[10px] uppercase font-mono text-gray-400 block mb-1">
            Raw YAML Frontmatter (---)
          </label>
          <textarea
            value={frontmatterText}
            onChange={(e) => onRawFmChange(e.target.value)}
            rows={4}
            className="w-full font-mono text-xs bg-[#0b0c12] border border-gray-800 rounded-lg p-2 text-indigo-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      )}
    </div>
  );
};
