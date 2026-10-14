/**
 * AI Directive Compiler & SOP Synthesizer (SkillDocker Engine)
 * 将用户的意图升华锻造为具备清晰职责、执行流程与操作规范的智能体规约
 */

export interface SkillBlueprint {
  name: string;
  category: string;
  description: string;
  version: string;
  bodyMarkdown: string;
}


/**
 * Agent Skills 规约元提示词模版 (Meta-Prompting)
 */
export const SKILL_META_SYSTEM_PROMPT = `你是一个专业的 AI Agent 技能架构师，专精于为 Google Antigravity、Claude Code、Cursor、Windsurf 及 OpenAI Codex 等主流生态设计符合 Agent Skills 最佳实践的技能规约。

请根据用户的业务需求，设计并输出符合规范的 Skill 蓝图。
你必须严格直接返回合法的单一纯 JSON 对象，严禁在 JSON 前后添加任何多余的开场白、废话、解释或包裹多余文本。
重要：若字段字符串中包含换行，必须严格使用转义符 \\n 表示，保持 JSON 语法的合法完整性。

设计原则：
1. name: 精炼，仅由小写英文字母、数字和连字符组成（例如: surgical-refactor-guard），不能包含连续短横线或下划线，不能包含保留字 anthropic、claude。
2. description: 精炼客观，使用第三人称（禁止第一人称我/我们与第二人称你/你们），必须同时包含「做什么」与「触发条件/什么时候用」（例如包含 "Use when..." 或 "用于...，当...时使用"）。
3. bodyMarkdown: 简洁明了的 Markdown 正文，提供清晰的操作步骤或指南。只有当任务涉及破坏性操作（如删除文件/表、数据重置、覆写关键资产）时才编写安全约束，不要机械式套用冗长固定骨架。

JSON 字段定义如下：
{
  "name": "由小写英文字母、数字与连字符组成的唯一标识符 (例如: git-commit-helper)",
  "category": "safety | workflow | architecture | marketing | custom",
  "version": "1.0.0",
  "description": "第三人称描述技能职责与触发场景。例如: 为代码变更生成标准规范的 Git 提交信息。Use when creating commits or reviewing staged changes.",
  "bodyMarkdown": "# 技能标题\\n\\n## 核心流程\\n1. 第一步操作说明\\n2. 第二步操作说明\\n\\n## 使用准则\\n- 关键提示与要点说明"
}`;


export class AiDirectiveCompiler {
  /**
   * 将用户的单条粗略指令编译为结构化原子规约
   */
  public static compile(rawText: string): string {
    const text = rawText.trim();
    if (!text) return '';

    // 1. UI & Layout Defense
    if (/ui|排版|溢出|换行|适配|布局|样式/i.test(text)) {
      return `【前端UI响应式与排版防御规范】严格保证各级容器自适应弹性布局，杜绝文本溢出与非预期换行；容器内文本强制配置 min-w-0、break-words、whitespace-nowrap 或 truncate 截断防护，保持界面紧凑整洁。(${text})`;
    }

    // 2. IP & Trademark & Domain Risk
    if (/版权|域名|名称|商标|侵权|合规/i.test(text)) {
      return `【项目命名风控与域名产权调研规范】在规划或分析项目与产品名称时，必须第一顺位检索商标版权侵权风险、开源同名冲突及主流顶级域名的注册持有状态。(${text})`;
    }

    // 3. Database & Data Loss Safety
    if (/数据库|migration|迁移|删除|drop|表结构/i.test(text)) {
      return `【数据库持久化与零数据丢失红线】严禁在未获批准前执行破坏性 schema 变更或覆盖生产迁移脚本；所有变更必须提供完整回滚脚本与影子快照备份。(${text})`;
    }

    // 4. Testing & Mocking
    if (/测试|mock|测试用例|单元测试|联调/i.test(text)) {
      return `【测试环境隔离与 Mock 调用规范】进行测试用例与接口验证时，必须优先使用隔离的 Mock 数据与虚拟服务，严禁调用外部真实生产接口或触发外部副作用。(${text})`;
    }

    // 5. Code Style & Surgical Editing
    if (/代码|重构|覆盖|覆写|格式/i.test(text)) {
      return `【代码修改与外科手术式编辑规范】严格执行局部增量编辑，禁止盲目大面积覆写现有文件；完整保留所有原文件注释、格式排版与未定义属性。(${text})`;
    }

    // 6. Generic Professional Structuring
    return `【智能体核心执行规约】${text}。作为当前执行周期的高优先级约束，严格遵守并确保执行结果符合可验证预期。`;
  }

  /**
   * 将口语化用户需求清洗为客观业务意图（剔除“帮我/我想/请问”等第一、二人称代词与客套废话）
   */
  public static sanitizePromptIntent(raw: string): string {
    let cleaned = (raw || '').trim();
    cleaned = cleaned.replace(/^(?:请|麻烦|劳驾|希望|想要|想|可以|能否)+(?:帮|替|给)?(?:我|我们|咱们)?/g, '');
    cleaned = cleaned.replace(/^(?:帮|替|给)?(?:我|我们|咱们)+(?:写|做|搞|建|开发|制作|生成|设计|提供|弄)?(?:一个|个|一款|一套|一份)?/g, '');
    cleaned = cleaned.replace(/^(?:我|我们|咱们)+(?:想要|想|需要|要)+(?:一个|个|一款|一套|一份)?/g, '');
    cleaned = cleaned.replace(/(?:帮|替|给)?(?:我|我们|咱们)/g, '');
    cleaned = cleaned.replace(/[我你您咱]/g, '');
    cleaned = cleaned.replace(/^(?:编写|创建|制作|开发|生成|设计)+(?:一个|个|一款|一套|一份)?/g, '');
    cleaned = cleaned.trim();
    return cleaned || '指定业务任务';
  }

  /**
   * 从中文或混合需求中提取英文关键词并构造规范 slug 标识符，同时支持重名检测
   */
  public static extractSemanticSlug(prompt: string, existingSkillNames?: string[]): string {
    const rawEnglishTokens = (prompt.match(/[a-zA-Z0-9]+/g) || [])
      .map((t) => t.toLowerCase())
      .filter((t) => t.length >= 2 && !['an', 'to', 'in', 'of', 'for', 'my', 'me', 'we', 'us', 'the'].includes(t));

    let baseSlug: string;
    if (rawEnglishTokens.length > 0) {
      baseSlug = rawEnglishTokens.slice(0, 3).join('-');
    } else {
      const conceptMap: Array<{ pattern: RegExp; token: string }> = [
        { pattern: /临时/i, token: 'temp' },
        { pattern: /清理|垃圾|缓存/i, token: 'cleaner' },
        { pattern: /文件|目录|路径/i, token: 'file' },
        { pattern: /财务|报表|账单|预算/i, token: 'finance-report' },
        { pattern: /爬虫|抓取|采集|爬取/i, token: 'scraper' },
        { pattern: /网页|网站|页面|web/i, token: 'web' },
        { pattern: /数据|统计/i, token: 'data' },
        { pattern: /分析/i, token: 'analyzer' },
        { pattern: /测试|单测|mock/i, token: 'test' },
        { pattern: /代码|编程/i, token: 'code' },
        { pattern: /脚本/i, token: 'script' },
        { pattern: /审查|审核|review/i, token: 'review' },
        { pattern: /优化|性能|加速/i, token: 'perf' },
        { pattern: /安全|防御|拦截|鉴权/i, token: 'security' },
        { pattern: /数据库|表结构|迁移|sql/i, token: 'db' },
        { pattern: /部署|发布|上线|ci|cd/i, token: 'deploy' },
        { pattern: /监控|日志|报警/i, token: 'monitor' },
        { pattern: /转换|转换器|解析/i, token: 'converter' },
        { pattern: /格式|排版|样式|css/i, token: 'style' },
        { pattern: /翻译|双语|汉化/i, token: 'translator' },
        { pattern: /工具|助手|套件/i, token: 'tool' },
        { pattern: /校验|验证|核查/i, token: 'validator' },
        { pattern: /文档|写作|总结/i, token: 'doc' },
        { pattern: /备份|快照|回滚/i, token: 'backup' },
      ];

      const matchedTokens: string[] = [];
      for (const { pattern, token } of conceptMap) {
        if (pattern.test(prompt) && !matchedTokens.includes(token)) {
          matchedTokens.push(token);
          if (matchedTokens.length >= 3) break;
        }
      }

      if (matchedTokens.length > 0) {
        baseSlug = matchedTokens.join('-');
      } else {
        let hash = 0;
        for (let i = 0; i < prompt.length; i++) {
          hash = ((hash << 5) - hash + prompt.charCodeAt(i)) | 0;
        }
        const hex = Math.abs(hash).toString(36).slice(0, 6) || 'task';
        baseSlug = `custom-task-${hex}`;
      }
    }

    let cleanSlug = baseSlug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);

    if (cleanSlug.includes('anthropic') || cleanSlug.includes('claude')) {
      cleanSlug = cleanSlug.replace(/anthropic|claude/gi, 'agent').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
    }

    if (!cleanSlug || cleanSlug.length < 3) {
      cleanSlug = cleanSlug ? `${cleanSlug}-skill` : 'custom-skill';
    }

    let finalSlug = cleanSlug;
    if (existingSkillNames && existingSkillNames.length > 0) {
      const lowerExisting = existingSkillNames.map((n) => n.toLowerCase());
      let counter = 2;
      while (lowerExisting.includes(finalSlug)) {
        finalSlug = `${cleanSlug}-${counter}`;
        counter++;
      }
    }

    return finalSlug;
  }

  /**
   * 离线/模板生成标准的 Agent Skills 规约骨架
   */
  public static forgeOfflineBlueprint(
    prompt: string,
    category: string = 'workflow',
    existingSkillNames?: string[]
  ): SkillBlueprint {
    const raw = (prompt || '').trim();
    const sanitizedTask = this.sanitizePromptIntent(raw);
    const skillName = this.extractSemanticSlug(raw, existingSkillNames);
    const skillTitle = sanitizedTask;

    // 智能关键词分支 1：代码审查 / 质量评估 / 深度思考
    if (/审核|审查|仔细|思考|偷懒|降低思考|质量|慢工|反思|深度|review/i.test(raw)) {
      const bodyMarkdown = `# ${skillTitle}

## 概述
提供针对代码变更、重构与架构设计的深度代码审查指引。用于执行代码审查、架构重构与 Pull Request 校验时深度推演边界与隐患。

## 审查流程
1. **分析上下文**：通读所审模块的上下文依赖、数据流向与接口契约，明确受影响边界；
2. **推演边界与防御度**：针对空值、并发竞争、异常未捕获及类型约束进行逻辑反证；
3. **核查代码质量**：核验函数单一职责、命名规范与测试覆盖度；
4. **输出审查报告**：按致命缺陷、潜在风险与优化建议整理清单，并给出具体修复代码。`;

      return {
        name: skillName,
        category: 'workflow',
        version: '1.0.0',
        description: `针对 [${skillTitle}] 的深度代码审查规范。用于执行代码审查、架构重构与 Pull Request 校验时深度推演边界与隐患。`,
        bodyMarkdown,
      };
    }

    // 智能关键词分支 2：前端 UI / 排版 / 布局
    if (/ui|排版|自适应|溢出|换行|css|tailwind|布局/i.test(raw)) {
      const bodyMarkdown = `# ${skillTitle}

## 概述
前端响应式防溢出与弹性排版指南。用于处理前端页面布局、样式调整、自适应屏幕适配或文本排版防溢出。

## 布局准则
1. **弹性网格与 Flex 布局**：优先采用 Tailwind 响应式网格与 Flex 弹性容器，避免硬编码绝对像素宽度；
2. **文本截断与防断行**：状态标签配置 \`whitespace-nowrap\` 与 \`flex-shrink-0\`，弹性文本容器配置 \`min-w-0\` 配合 \`truncate\`；
3. **多分辨率实测**：在不同显示缩放与分辨率下检查排版，确保无文字挤压与重叠。`;

      return {
        name: skillName,
        category: 'workflow',
        version: '1.0.0',
        description: `针对 [${skillTitle}] 的前端响应式防溢出与弹性排版规范。用于处理前端页面布局、样式调整、自适应屏幕适配或文本排版防溢出。`,
        bodyMarkdown,
      };
    }

    // 通用默认兜底
    const isDestructive = /删除|drop|delete|销毁|覆盖|迁移|清空|truncate|rm|destroy|生产|production/i.test(raw);
    const safetySection = isDestructive
      ? `\n\n## 安全约束\n- 严禁在未经明确确认前执行破坏性删除、清空或覆写操作；\n- 执行不可逆变更前必须建立备份，并提供明确回滚方案。`
      : '';

    const bodyMarkdown = `# ${skillTitle}

## 概述
${skillTitle} 执行作业指南。用于处理与「${skillTitle}」相关的技术实现、代码编写或工程排障。

## 执行流程
1. **分析现状与依赖**：定位涉及的代码文件与调用链，明确变更影响范围；
2. **实施变更**：采用最小侵入式修改，保持既有代码风格与接口契约；
3. **验证结果**：运行本地测试与类型检查，确保功能符合预期。${safetySection}`;

    return {
      name: skillName,
      category,
      version: '1.0.0',
      description: `针对 [${skillTitle}] 的标准化操作指南。用于执行与「${skillTitle}」相关的具体业务任务与工程排障时提供参考。`,
      bodyMarkdown,
    };
  }
}
