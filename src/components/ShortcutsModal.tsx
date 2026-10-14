import React from 'react';
import { Language } from '../i18n/index.ts';
import { Keyboard, X, Sparkles, Terminal, Stethoscope, Flame, Archive, Search } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
  lang = 'zh',
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      keys: ['Alt', 'Shift', 'S'],
      desc: lang === 'zh' ? '全局系统呼出 / 最小化隐藏窗口' : 'Global Toggle SkillDocker Window',
      scope: lang === 'zh' ? '全局系统级 (Global)' : 'Global System',
      icon: Terminal,
      color: 'text-purple-400',
      badge: 'PRO',
    },
    {
      keys: ['Alt', 'D'],
      desc: lang === 'zh' ? '秒开 / 关闭 Skills Doctor 体检抽屉' : 'Toggle Skills Doctor Drawer',
      scope: lang === 'zh' ? '应用内 (In-App)' : 'In-App',
      icon: Stethoscope,
      color: 'text-emerald-400',
    },
    {
      keys: ['Alt', 'F'],
      desc: lang === 'zh' ? '秒开 / 关闭 Skill Forge 技能锻造台' : 'Toggle Skill Forge Modal',
      scope: lang === 'zh' ? '应用内 (In-App)' : 'In-App',
      icon: Flame,
      color: 'text-amber-400',
    },
    {
      keys: ['Alt', 'V'],
      desc: lang === 'zh' ? '打开 / 关闭技能备份抽屉' : 'Toggle Skill Backup Drawer',
      scope: lang === 'zh' ? '应用内 (In-App)' : 'In-App',
      icon: Archive,
      color: 'text-indigo-400',
    },
    {
      keys: ['Ctrl', 'K'],
      desc: lang === 'zh' ? '快速聚焦全生态技能搜索框 (或按 / 键)' : 'Focus Skill Radar Search Bar',
      scope: lang === 'zh' ? '应用内 (In-App)' : 'In-App',
      icon: Search,
      color: 'text-blue-400',
    },
    {
      keys: ['Ctrl', 'J'],
      desc: lang === 'zh' ? '直达并聚焦【动态指令热注入器】(亦支持 Alt+Space 拦截聚焦)' : 'Focus Live Directive Injector (or Alt+Space)',
      scope: lang === 'zh' ? '应用内 (In-App)' : 'In-App',
      icon: Sparkles,
      color: 'text-amber-400',
    },
    {
      keys: ['F1'],
      desc: lang === 'zh' ? '呼出键盘快捷键与使用指南' : 'Toggle Keyboard Shortcuts Guide',
      scope: lang === 'zh' ? '应用内 (In-App)' : 'In-App',
      icon: Keyboard,
      color: 'text-sky-400',
    },
    {
      keys: ['Ctrl', 'Enter'],
      desc: lang === 'zh' ? '在控制舱中直接注入临时干预指令' : 'Inject Live Directive',
      scope: lang === 'zh' ? '驾驶舱 (Cockpit)' : 'Cockpit',
      icon: Sparkles,
      color: 'text-pink-400',
    },
    {
      keys: ['Esc'],
      desc: lang === 'zh' ? '快速退出当前抽屉 / 关闭弹窗 / 清空搜索' : 'Close Drawer / Modal / Clear Search',
      scope: lang === 'zh' ? '全局通用 (General)' : 'General',
      icon: X,
      color: 'text-gray-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#0e111d] border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans text-gray-100 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800/80 flex items-center justify-between bg-[#131626]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
              <Keyboard className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  {lang === 'zh' ? '快捷键与热键总览 (Hotkeys HUD)' : 'Keyboard Shortcuts HUD'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold uppercase">
                  Fast Flow
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {lang === 'zh' ? '专为高频 Agent 开发者打造的极速键位流' : 'Power shortcuts for autonomous workflow'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-5 space-y-2.5 max-h-[70vh] overflow-y-auto">
          {shortcuts.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-gray-900/50 border border-gray-800/80 flex items-center justify-between hover:border-indigo-500/40 transition group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`p-2 rounded-xl bg-gray-800/80 ${item.color} flex-shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-gray-200 truncate">{item.desc}</span>
                      {item.badge && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono block mt-0.5">{item.scope}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 flex-shrink-0 ml-3">
                  {item.keys.map((k, ki) => (
                    <kbd
                      key={ki}
                      className="px-2 py-1 rounded-lg bg-[#161a29] border border-gray-700/80 text-[11px] font-mono font-bold text-indigo-200 shadow-inner"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#111320] border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <span>{lang === 'zh' ? '提示：随时按 Esc 键可极速关闭此弹窗' : 'Tip: Press Esc anytime to close'}</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
          >
            {lang === 'zh' ? '知道了' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};
