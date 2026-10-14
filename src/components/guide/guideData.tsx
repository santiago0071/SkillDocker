import { Bot, Zap, Rocket } from 'lucide-react';
import { ConceptCard, PlaybookItem, FaqItem } from './guideTypes.ts';

export const cardsZh: ConceptCard[] = [
  {
    badge: '认知第一步 · 为什么需要技能',
    title: '为什么单靠聊天（Prompt），Agent 总是不听话？',
    subtitle: '懂了这个，你就超越了 90% 的普通 AI 玩家',
    icon: <Bot className="w-6 h-6 text-amber-400" />,
    colorClass: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300',
    comparisons: [
      {
        tag: '❌ 传统对话窗口 (Prompt)',
        tagColor: 'text-red-400 bg-red-950/40 border-red-800/50',
        points: [
          '聊了几十轮上下文变长后，AI 极易“失忆”，把最初的约定忘得一干二净',
          '容易自作聪明大面积重写你的文件，把原有的排版、注释和关键代码删光',
          '每换一个新对话窗口、或者新开一个项目，又得把一长串要求重新复制一遍',
        ],
      },
      {
        tag: ' 技能规范 (Skill / Rules)',
        tagColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50',
        points: [
          '相当于给 AI 发放的【员工岗位手册】，常驻在项目根目录，AI 永远不敢违背',
          '严格锁死禁忌红线（例如：严禁破坏性删除、禁止擅自 git push）',
          '无论开启多少个新会话，AI 自动读取，零重复唠叨，开箱即用',
        ],
      },
    ],
    takeaway: '💡 一句话总结：Prompt 是你每次都要喊的口令，Skill 是写进公司章程的硬性制度！',
  },
  {
    badge: '核心概念 · 搞懂两大武器',
    title: '临时指令 vs 长期技能，我该什么时候用哪个？',
    subtitle: 'SkillDocker 最精妙的双模态设计，灵活应对一切需求',
    icon: <Zap className="w-6 h-6 text-indigo-400" />,
    colorClass: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-300',
    comparisons: [
      {
        tag: '⚡ 临时指令 (Live Directive)',
        tagColor: 'text-amber-400 bg-amber-950/40 border-amber-800/50',
        points: [
          '【像老板路过工位交代一句话】：比如“下周发布会前不要透露价格”、“这次重构先别碰数据库”',
          '在底部输入框随手敲下即刻毫秒级生效，优先级最高，压制所有默认规则',
          '任务完成一键撤回，手滑误删还支持随时按 Ctrl+Z 原地恢复！',
        ],
      },
      {
        tag: '🏛️ 存入技能 (Assimilate / 固化)',
        tagColor: 'text-purple-400 bg-purple-950/40 border-purple-800/50',
        points: [
          '【沉淀为永久规约】：当你发现某条临时指令特别管用，每次都希望 AI 遵守',
          '点击指令右侧的“存入技能”按钮，系统会自动将其优雅合并至指定 Skill 文件中',
          '实现从“临时应急”到“长期资产”的无感演进，无需手动去代码里改 Markdown',
        ],
      },
    ],
    takeaway: '💡 一句话总结：临时要求用【即时注入】，屡试不爽的黄金经验一键【存入技能】！',
  },
  {
    badge: '极速上手 · 3 步起飞口诀',
    title: '只需 30 秒，让你的 Agent 战斗力翻倍',
    subtitle: '极简操作流，极客与小白都能轻松驾驭',
    icon: <Rocket className="w-6 h-6 text-cyan-400" />,
    colorClass: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300',
    steps: [
      {
        num: '1',
        title: '随时召唤 (Ctrl + J / Alt + Shift + S)',
        desc: '无论你正在写代码还是看文档，随时呼出 SkillDocker；在应用内按 Ctrl + J 或 Alt + Space 秒级直达指令热注入器。',
      },
      {
        num: '2',
        title: '即插即拔与后悔药 (Ctrl + Z)',
        desc: '在输入框敲下临时叮嘱热注入；如果手滑清空，全系统支持 Ctrl+Z 自动恢复物理文件。',
      },
      {
        num: '3',
        title: '全生态穿梭 (🚀 Shuttle)',
        desc: '点击任何技能右下角的小火箭，一秒转译为 Cursor (.mdc)、Claude Code 或 DeepSeek 专属格式！',
      },
    ],
    takeaway: '🎉 恭喜你！现在你已经完全掌握了现代 AI Agent 技能体系的核心精髓！',
  },
];

export const cardsEn: ConceptCard[] = [
  {
    badge: 'Step 1 · The Purpose of Skills',
    title: 'Why do Agents lose focus with Chat Prompts alone?',
    subtitle: 'Understand this, and you are ahead of 90% of AI users',
    icon: <Bot className="w-6 h-6 text-amber-400" />,
    colorClass: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300',
    comparisons: [
      {
        tag: '❌ Chat Prompting Alone',
        tagColor: 'text-red-400 bg-red-950/40 border-red-800/50',
        points: [
          'As chat history grows, AI suffers from context amnesia and ignores original rules',
          'Prone to destructive file rewrites, wiping out existing comments and architecture',
          'You have to copy-paste the same repetitive requirements every time you open a new window',
        ],
      },
      {
        tag: ' Skills & Rules Protocol',
        tagColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50',
        points: [
          'Acts as an unbreakable Employee Handbook pinned to the project root directory',
          'Strictly enforces safety redlines (e.g. zero data loss, surgical diffs, no auto-git-commit)',
          'Loaded automatically across all conversations without repetitive typing',
        ],
      },
    ],
    takeaway: '💡 In short: A Prompt is a temporary order; a Skill is permanent company policy!',
  },
  {
    badge: 'Step 2 · Two Core Superpowers',
    title: 'Live Directives vs Permanent Skills: When to use which?',
    subtitle: 'SkillDocker dual-mode architecture tailored for agile workflows',
    icon: <Zap className="w-6 h-6 text-indigo-400" />,
    colorClass: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-300',
    comparisons: [
      {
        tag: '⚡ Live Directives',
        tagColor: 'text-amber-400 bg-amber-950/40 border-amber-800/50',
        points: [
          'Like a quick whisper from your tech lead: "Do not touch the database in this task"',
          'Injected on the fly from the bottom bar with millisecond latency and top priority',
          'Revoke anytime after task completion; accidental clears can be undone with Ctrl+Z!',
        ],
      },
      {
        tag: '🏛️ Assimilate into Skill',
        tagColor: 'text-purple-400 bg-purple-950/40 border-purple-800/50',
        points: [
          'Turns proven combat instructions into permanent standard operating procedures',
          'Click "Assimilate" on any directive to cleanly append it into your chosen Skill file',
          'Seamless transition from temporary patch to reusable asset without editing raw Markdown',
        ],
      },
    ],
    takeaway: '💡 In short: Use Live Injector for ephemeral tasks, and Assimilate to save best practices!',
  },
  {
    badge: 'Step 3 · Quick 3-Step Playbook',
    title: 'Master SkillDocker in 30 Seconds',
    subtitle: 'Minimalist workflow for hackers and novices alike',
    icon: <Rocket className="w-6 h-6 text-cyan-400" />,
    colorClass: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300',
    steps: [
      {
        num: '1',
        title: 'Summon & Focus (Ctrl + J / Alt + Shift + S)',
        desc: 'Summon SkillDocker anywhere; press Ctrl + J or Alt + Space to jump straight to the Live Directive Injector.',
      },
      {
        num: '2',
        title: 'Hot-Inject & Undo (Ctrl + Z)',
        desc: 'Type instructions to hot-inject. Accidental deletions can be restored with native Ctrl+Z anytime.',
      },
      {
        num: '3',
        title: 'Ecosystem Shuttle (🚀 Shuttle)',
        desc: 'Click the rocket on any skill card to transpile into Cursor (.mdc), Claude Code, or DeepSeek formats!',
      },
    ],
    takeaway: '🎉 Congratulations! You have fully unlocked the modern Agent Skill ecosystem!',
  },
];

export const playbooksZh: PlaybookItem[] = [
  {
    id: 'playbook-defense',
    title: '🛡️ 剧本一：防止 AI“删库与盲目覆写大文件”',
    tag: '高频刚需',
    tagClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
    desc: '小白最痛的一点是 AI 改一行代码把整个大文件重写，导致无数隐蔽 Bug。按下面 3 步彻底锁死它：',
    steps: [
      {
        step: '第 1 步',
        action: '在左侧栏点击【安全规约】，找到《🩹 外科手术式局部修改》与《🛑 零数据丢失硬性红线》技能，确认右侧开关处于激活状态（绿色）。',
      },
      {
        step: '第 2 步',
        action: '切换回你的 Cursor 或 Claude，给它一个改动任务（例如：“把页面上的主按钮改成圆角并在旁边加个图标”）。',
      },
      {
        step: '第 3 步',
        action: '检视 AI 提交的 Diff！此时它会被规约强制只输出精准的代码修改块，绝不删除原有的类型注解与架构排版。',
      },
    ],
    tip: '💡 进阶小贴士：如果你在做重构，可在底部临时指令再加一句“优先保留原函数签名”，防御效果更上一层楼！',
  },
  {
    id: 'playbook-directive',
    title: '⚡ 剧本二：临时下达“最高禁令”，用完即撤',
    tag: '极速敏捷',
    tagClass: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
    desc: '不想大动干戈改配置文件，只想让 AI 在接下来的几分钟内严格听你一句话：',
    steps: [
      {
        step: '第 1 步',
        action: '按快捷键 Ctrl + J（或 Alt + Space）秒级直达并聚焦【⚡ 动态指令热注入器】（在外部窗口可按 Alt + Shift + S 全局呼出）。',
      },
      {
        step: '第 2 步',
        action: '输入框输入：【注意：本次任务绝对禁止修改 package.json 和数据库连接配置】，直接按回车注入。',
      },
      {
        step: '第 3 步',
        action: '任务完成后，点击指令旁的垃圾桶将其撤销；万一手滑把有用的指令误删了，直接按键盘 Ctrl + Z 即可秒级物理恢复！',
      },
    ],
    tip: '💡 进阶小贴士：如果这条临时指令你觉得太有用了，点击指令右侧的【存入技能】，就能直接永久合入项目规约中。',
  },
  {
    id: 'playbook-shuttle',
    title: '🚀 剧本三：跨生态穿梭，老技能秒变 Cursor / Claude',
    tag: '跨端互通',
    tagClass: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40',
    desc: '在网上下载了一个好用的 Antigravity 技能，怎么让正在用的 Cursor 或 Claude 也能认出它？',
    steps: [
      {
        step: '第 1 步',
        action: '在【全部技能大厅】中找到你想导出的技能卡片。',
      },
      {
        step: '第 2 步',
        action: '看卡片右下角，点击那个青色的小火箭图标【🚀 穿梭】。',
      },
      {
        step: '第 3 步',
        action: '弹窗中选择你的目标（如 🎯 Cursor Rules），点击【导出/生成文件】。SkillDocker 会自动将其转译为原生 .cursor/rules/<name>.mdc 规范文件！',
      },
    ],
    tip: '💡 进阶小贴士：穿梭机采用底层 AST 抽象转译，会自动调整 Frontmatter 格式与提示语结构，无需手动修改代码。',
  },
];

export const playbooksEn: PlaybookItem[] = [
  {
    id: 'playbook-defense',
    title: '🛡️ Playbook 1: Stop AI from Blind Rewrites & Deletions',
    tag: 'Essential Safety',
    tagClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
    desc: 'The biggest headache is AI rewriting your entire file for a 1-line change. Lock it down in 3 steps:',
    steps: [
      {
        step: 'Step 1',
        action: 'Click "Safety Protocols" in the sidebar, ensure "Surgical Local Modifications" and "Zero Data Loss" toggles are ON (green).',
      },
      {
        step: 'Step 2',
        action: 'Switch to Cursor or Claude Code, prompt the agent with a modification task (e.g. "Add a rounded badge to the button").',
      },
      {
        step: 'Step 3',
        action: 'Review the diff! The agent is strictly constrained to output surgical edits without wiping existing architecture.',
      },
    ],
    tip: '💡 Pro Tip: For large refactors, inject a live directive: "Preserve all existing function signatures" for extra defense!',
  },
  {
    id: 'playbook-directive',
    title: '⚡ Playbook 2: Inject Top-Priority Ephemeral Directives',
    tag: 'Agile Steering',
    tagClass: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
    desc: 'No need to manually edit configs when you just want a quick rule for the next few turns:',
    steps: [
      {
        step: 'Step 1',
        action: 'Press Ctrl + J (or Alt + Space) to jump straight to the Live Directive Injector (or Alt + Shift + S for global summon).',
      },
      {
        step: 'Step 2',
        action: 'Type: "Strictly ban modifying package.json and db configs in this turn" and press Enter.',
      },
      {
        step: 'Step 3',
        action: 'Once finished, revoke it with the trash button. If accidentally removed, press Ctrl + Z to restore instantly!',
      },
    ],
    tip: '💡 Pro Tip: When a temporary directive proves indispensable, click "Assimilate" to merge it permanently into any Skill!',
  },
  {
    id: 'playbook-shuttle',
    title: '🚀 Playbook 3: Cross-Compile Any Skill into Cursor / Claude',
    tag: 'Universal Shuttle',
    tagClass: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40',
    desc: 'Downloaded a great Antigravity skill and want Cursor or Claude to understand it natively?',
    steps: [
      {
        step: 'Step 1',
        action: 'Find the skill card in the All Skills Matrix.',
      },
      {
        step: 'Step 2',
        action: 'Click the cyan rocket icon [🚀 Shuttle] at the bottom right of the card.',
      },
      {
        step: 'Step 3',
        action: 'Select your target (e.g. 🎯 Cursor Rules) and click "Export File". SkillDocker transpiles it into standard .mdc files.',
      },
    ],
    tip: '💡 Pro Tip: The AST engine adapts frontmatter and prompt directives automatically with zero manual editing.',
  },
];

export const faqsZh: FaqItem[] = [
  {
    q: '为什么我在 SkillDocker 里修改了规则，Cursor / Claude 里的 AI 好像没理会？',
    a: '请检查 3 个最常见的原因：\n1. 【工作区根目录对齐】：确保 SkillDocker 顶部显示的 Active Workspace 路径与你在 Cursor 打开的项目根目录完全一致。\n2. 【IDE 规则缓存】：部分编辑器（如 Cursor）在检测到文件变动时需要一点时间同步，可按快捷键 Ctrl+Shift+P 运行“Developer: Reload Window”强制重载。\n3. 【Git 忽略规则】：确认生成的 .cursor/rules/ 或 .agents/ 目录没有被项目的 .gitignore 误伤忽略。',
  },
  {
    q: '技能是挂载得越多越好吗？会不会浪费 Token 或让 AI 变迷糊？',
    a: '绝非越多越好！很多新手恨不得一口气开 20 个技能，结果会导致两大坏处：\n1. 严重占用大模型的输入上下文（Context Window），导致对话轮次缩短，费用倍增；\n2. 规则之间可能产生隐性逻辑冲突，导致 AI “举棋不定”。\n建议：长期常驻 2~4 个最核心的安全与工程规约即可，其余临时需求用底部的【即时指令】随用随注。定期可以用左侧栏的【Skills 医生 PRO】进行健康体检！',
  },
  {
    q: '如果我输入的临时指令，跟项目已有的长期技能冲突了，以哪个为准？',
    a: '临时指令（Live Directive）永远拥有系统最高绝对统治权！\nSkillDocker 的 Surgical Injector 会自动将所有临时指令编译并锚定在 Prompt 的最顶层（TOP 优先级），显式声明覆写默认逻辑。因此无论默认规约怎么写，AI 都会优先服从你刚刚敲下的临时指令。',
  },
  {
    q: '换了新电脑或重装系统，我配好的精妙技能怎么一键迁移？',
    a: '非常简单！点击顶栏右侧的【📦 便携保险库 (Vault)】（或按快捷键 Ctrl+E），点击【一键打包导出全部技能】。系统会将当前所有技能无损压缩为一个独立的 .skillpack 随身包。\n在新电脑上打开 SkillDocker，点击导入即可 1 秒满血复活！',
  },
];

export const faqsEn: FaqItem[] = [
  {
    q: 'Why does my AI in Cursor / Claude seem to ignore rules modified in SkillDocker?',
    a: 'Check these 3 common causes:\n1. Workspace Root: Ensure the Active Workspace path matches the root directory open in your editor.\n2. IDE Cache: Some editors need a quick reload. Press Ctrl+Shift+P and run "Developer: Reload Window" to refresh rules.\n3. Git Ignore: Ensure .cursor/rules/ or .agents/ folders are not accidentally ignored in .gitignore.',
  },
  {
    q: 'Should I enable as many skills as possible? Does it waste tokens or confuse the AI?',
    a: 'Never enable too many at once! Excessive skills cause two problems:\n1. Consumes excessive prompt tokens and shortens available conversation context.\n2. Increases risk of logical contradictions between rules.\nBest Practice: Keep 2-4 core safety/architectural skills active. Use Live Directives for ephemeral demands, and run Skills Doctor PRO periodically to audit and trim rules!',
  },
  {
    q: 'If a Live Directive conflicts with an existing Skill rule, which one wins?',
    a: 'Live Directives ALWAYS win with supreme priority!\nSkillDocker compiler pins live directives to the very top anchor of the system context, explicitly instructing the model to override baseline defaults for current tasks.',
  },
  {
    q: 'How do I migrate my curated skills when switching to a new machine?',
    a: 'Click "Vault" in the top bar (or press Ctrl+E), then click "Export All Skills (.skillpack)".\nIt compresses your entire skill matrix into a single portable package. Import it on your new computer in 1 second!',
  },
];
