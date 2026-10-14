import { ModularLegoConfig, ProviderMenuItem } from './types.ts';

export const PROVIDERS_MENU: ProviderMenuItem[] = [
  { id: 'gemini', label: 'Google Gemini', modelKey: 'geminiModel', defaultModel: 'gemini-3.8-flash', icon: '⚡' },
  { id: 'openai', label: 'OpenAI / Codex', modelKey: 'openaiModel', defaultModel: 'gpt-6.1-sol', icon: '🟢' },
  { id: 'claude', label: 'Anthropic Claude', modelKey: 'claudeModel', defaultModel: 'claude-sonnet-5-5', icon: '🟣' },
  { id: 'deepseek', label: 'DeepSeek', modelKey: 'deepseekModel', defaultModel: 'deepseek-flash', icon: '🔵' },
  { id: 'minimax', label: 'MiniMax', modelKey: 'minimaxModel', defaultModel: 'MiniMax-M3', icon: '🔴' },
  { id: 'openrouter', label: 'OpenRouter', modelKey: 'openrouterModel', defaultModel: 'anthropic/claude-sonnet-5-5', icon: '🌐' },
  { id: 'custom', label: 'OpenAI 兼容 / 自定义', modelKey: 'customModel', defaultModel: 'custom-model', icon: '⚙️' },
];

export const LEGO_PRESETS = [
  {
    id: 'defense',
    label: '🛡️ 生产合规安全包',
    labelEn: '🛡️ Production Compliance',
    desc: '全选安全红线与强制 SOP、先 Plan 后动、防核爆回滚',
    descEn: 'All safety redlines, mandatory SOP, plan-first & zero-loss',
    config: {
      techStack: {
        reactTs: true,
        tailwindCss: true,
        pythonAsync: false,
        rustSystems: false,
        generalClean: true,
      },
      safety: {
        surgicalDiff: true,
        zeroDataLoss: true,
        authorIntent: true,
        secretsIsolation: true,
      },
      workflow: {
        planFirst: true,
        diffAudit: true,
        noAutoGitCommit: true,
      },
      scopeTriggers: true,
      verificationChecklist: true,
      rollbackSop: true,
    },
  },
  {
    id: 'frontend',
    label: '🎨 现代前端弹性包',
    labelEn: '🎨 Modern Fluid Frontend',
    desc: 'React 19 + Tailwind CSS 4 防溢出 + 外科手术改动',
    descEn: 'React 19 + Tailwind CSS 4 overflow guard + surgical diffs',
    config: {
      techStack: {
        reactTs: true,
        tailwindCss: true,
        pythonAsync: false,
        rustSystems: false,
        generalClean: true,
      },
      safety: {
        surgicalDiff: true,
        zeroDataLoss: true,
        authorIntent: true,
        secretsIsolation: false,
      },
      workflow: {
        planFirst: true,
        diffAudit: true,
        noAutoGitCommit: true,
      },
      scopeTriggers: true,
      verificationChecklist: true,
      rollbackSop: true,
    },
  },
  {
    id: 'backend',
    label: '🐍 后端与系统架构包',
    labelEn: '🐍 Systems Architecture',
    desc: 'Python/Rust + 高内聚低耦合 + 零数据丢失 + 凭据隔离',
    descEn: 'Python/Rust + Clean modular arch + zero data loss + secrets isolation',
    config: {
      techStack: {
        reactTs: false,
        tailwindCss: false,
        pythonAsync: true,
        rustSystems: true,
        generalClean: true,
      },
      safety: {
        surgicalDiff: true,
        zeroDataLoss: true,
        authorIntent: true,
        secretsIsolation: true,
      },
      workflow: {
        planFirst: true,
        diffAudit: true,
        noAutoGitCommit: true,
      },
      scopeTriggers: true,
      verificationChecklist: true,
      rollbackSop: true,
    },
  },
];

export const DEFAULT_LEGO_CONFIG: ModularLegoConfig = {
  name: 'industrial-guard-skill',
  category: 'workflow',
  techStack: {
    reactTs: true,
    pythonAsync: false,
    rustSystems: false,
    tailwindCss: true,
    generalClean: true,
  },
  safety: {
    surgicalDiff: true,
    zeroDataLoss: true,
    authorIntent: true,
    secretsIsolation: true,
  },
  workflow: {
    planFirst: true,
    diffAudit: true,
    noAutoGitCommit: true,
  },
  scopeTriggers: true,
  verificationChecklist: true,
  rollbackSop: true,
};

export const getInspirationPills = (lang: string) => {
  if (lang === 'zh') {
    return [
      {
        label: '🛡️ 误删文件与Git提交拦截',
        text: '严格禁止擅自删除文件、清空数据库或执行 git commit/push，破坏性操作前必须提示并经由用户确认',
      },
      {
        label: '🎨 前端防溢出与弹性排版',
        text: '前端页面开发时，严格保证所有文本容器具备自适应弹性布局，强制添加 min-w-0 与防溢出截断，杜绝绝对像素写死宽度导致界面崩溃',
      },
      {
        label: '⚡ 计划先行与TDD工作流',
        text: '接到复杂任务时严禁直接修改代码，必须先只读侦察并提出设计方案，获得同意后方可动手，修改后必须执行测试验证',
      },
      {
        label: '🤖 多Agent协同与数据隔离',
        text: '多 Agent 协作开发时严格尊重既有代码真源与他人验证通过的成果，禁止推翻已有验证逻辑，严格在指定目录操作',
      },
    ];
  }
  return [
    {
      label: '🛡️ Prevent Destructive Actions & Git Commit',
      text: 'Strictly forbid deleting files, dropping tables, or executing git commit/push without explicit confirmation. Protect critical project assets.',
    },
    {
      label: '🎨 Responsive Layout & Fluid Typography',
      text: 'Enforce fluid adaptive layout with min-w-0, whitespace-nowrap, or truncate on all text containers. Ban hardcoded pixel widths.',
    },
    {
      label: '⚡ Plan-First Protocol & Verification SOP',
      text: 'Mandatory read-only reconnaissance and design approval before modifying code. Run full build test verification after edits.',
    },
    {
      label: '🤖 Multi-Agent Safety & Context Isolation',
      text: 'Respect peer agent validated solutions and single source of truth. Zero nuclear rollbacks in shared workspaces.',
    },
  ];
};
