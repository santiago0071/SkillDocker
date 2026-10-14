import type { AiConfig } from './aiClient.ts';
import { UniversalAiClient } from './aiClient.ts';
import type { SkillBlueprint } from './aiCompiler.ts';
import { AiDirectiveCompiler, SKILL_META_SYSTEM_PROMPT } from './aiCompiler.ts';
import {
  SkillDoctorEngine,
  SkillDoctor,
} from './doctor.ts';
import { isFeatureUnavailableError } from '../pro-api/index.ts';
import type {
  TriggerBenchmarkResult,
  LibraryConsultationSkillInput,
  LibraryConsultationReport,
} from './doctor.ts';
import type { SkillMeta, DiagnosticReport } from '../types/index.ts';

export interface RouteSkillResult {
  recommendedSkillId: string;
  reason: string;
  source: 'llm' | 'heuristic' | 'default';
  isAiConfigured: boolean;
  activeProvider?: string;
}

export interface ExpandDirectiveResult {
  expandedText: string;
  source: 'llm' | 'compiler';
}

export interface ForgeSkillResult {
  generated: SkillBlueprint;
  source: 'llm' | 'template';
}

/**
 * Universal Client-Side AI Service
 * Eliminates all dependencies on Vite dev server HTTP endpoints (/api/*),
 * executing directly inside the Tauri Webview with instant offline fallback.
 */
export class AiService {
  /**
   * AI Smart Expand for in-flight directives
   */
  public static async expandDirective(
    rawText: string,
    config?: AiConfig
  ): Promise<ExpandDirectiveResult> {
    const text = (rawText || '').trim();
    if (!text) {
      return { expandedText: '', source: 'compiler' };
    }

    if (config && UniversalAiClient.hasApiKey(config)) {
      try {
        const systemPrompt = `你是一个顶尖的 AI Agent SOP 规约架构师。请将用户口语化或粗略的意图/想法，智能编译扩充为一段工业级、具备原子化验收标准的规约条目。
要求：
1. 语言简练严谨，直接输出一条具体的规约 SOP（建议包含规则目的、明确约束和检验准则）。
2. 不要输出任何开场白、废话、解释或包裹多余的 Markdown 标记。直接输出单条规约文本。`;
        const res = await UniversalAiClient.generateText(text, config, systemPrompt);
        if (res && res.trim()) {
          return { expandedText: res.trim(), source: 'llm' };
        }
      } catch (err) {
        console.warn('Real AI model call in expandDirective failed, falling back to offline compiler:', err);
      }
    }

    const fallback = AiDirectiveCompiler.compile(text);
    return { expandedText: fallback || text, source: 'compiler' };
  }

  /**
   * AI Smart Route Target Skill
   */
  public static async routeSkill(
    content: string,
    skills: SkillMeta[],
    config?: AiConfig
  ): Promise<RouteSkillResult> {
    const trimmed = (content || '').trim();
    if (!skills || skills.length === 0) {
      return {
        recommendedSkillId: '',
        reason: '暂无可用技能',
        source: 'default',
        isAiConfigured: false,
      };
    }

    const isAiConfigured = Boolean(config && UniversalAiClient.hasApiKey(config));

    // 1. Try real LLM if configured
    if (isAiConfigured && config && trimmed) {
      try {
        const candidates = skills
          .slice(0, 15)
          .map((s) => `- ID: ${s.id} | 名称: ${s.name} | 简介: ${(s.description || '').slice(0, 80)}`)
          .join('\n');

        const prompt = `用户输入了一条希望约束 AI Agent 的规约指令：
"${trimmed}"

请从以下可用技能候选列表中，挑选一个最适合存放该规约的技能 ID，并给出简短推荐理由：
${candidates}

请严格按以下 JSON 格式返回，不要有任何其他解释：
{"recommendedSkillId": "<选中的技能ID>", "reason": "<一句话推荐理由>"}`;

        const aiRes = await UniversalAiClient.generateText(
          prompt,
          config,
          '你是一个技能架构路由分发专家。只返回合法 JSON。'
        );

        const jsonMatch = /\{[\s\S]*\}/.exec(aiRes);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.recommendedSkillId && skills.some((s) => s.id === parsed.recommendedSkillId)) {
            return {
              recommendedSkillId: parsed.recommendedSkillId,
              reason: parsed.reason || '大模型深度语义推断匹配',
              source: 'llm',
              isAiConfigured: true,
              activeProvider: config.activeProvider,
            };
          }
        }
      } catch (err) {
        console.warn('AI routing failed, falling back to local heuristic:', err);
      }
    }

    // 2. Fallback heuristic scoring
    const textLower = trimmed.toLowerCase();
    let bestScore = 0;
    let bestSkill = skills[0].id;
    let defaultReason = '根据活跃技能拓扑，推荐挂载至默认主技能';

    for (const s of skills) {
      let score = 0;
      const sText = `${s.id} ${s.name} ${s.description || ''}`.toLowerCase();

      const keywordGroups = [
        { triggers: ['ui', '排版', '样式', '溢出', '布局', '换行', '双语', '汉化'], targets: ['web', 'ui', 'css', 'guidance', 'writing', 'app'] },
        { triggers: ['安全', '删', '危险', '权限', '越权', '拦截', '回滚', '熔断'], targets: ['safety', 'prevent', 'security', 'auditor', 'guard'] },
        { triggers: ['计划', '流程', '汇报', '审批', '规范', '同意', '确认'], targets: ['planning', 'workflow', 'writing', 'first'] },
        { triggers: ['数据', 'sql', 'bigquery', 'storage'], targets: ['bigquery', 'data', 'sql', 'storage'] },
        { triggers: ['firebase'], targets: ['firebase'] },
        { triggers: ['model', 'byok', 'api key', '密钥'], targets: ['byok', 'model'] },
      ];
      for (const g of keywordGroups) {
        if (g.triggers.some((t) => textLower.includes(t)) && g.targets.some((t) => sText.includes(t))) {
          score += 25;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestSkill = s.id;
        defaultReason = `本地拓扑关键词命中：${s.name}`;
      }
    }

    return {
      recommendedSkillId: bestSkill,
      reason: defaultReason,
      source: bestScore > 0 ? 'heuristic' : 'default',
      isAiConfigured,
      activeProvider: config?.activeProvider,
    };
  }

  /**
   * Balanced brace extractor: extracts the first complete { ... } JSON slice
   * without greedily swallowing following text or subsequent braces.
   */
  private static extractBalancedJson(str: string): { jsonStr: string; startIndex: number; endIndex: number } | null {
    const start = str.indexOf('{');
    if (start === -1) return null;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < str.length; i++) {
      const char = str[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') {
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0) {
            return {
              jsonStr: str.slice(start, i + 1),
              startIndex: start,
              endIndex: i + 1,
            };
          }
        }
      }
    }
    return null;
  }

  /**
   * AI Forge Skill Blueprint (Strict mode with resilient parser)
   */
  public static async forgeSkill(
    prompt: string,
    category: string,
    config?: AiConfig
  ): Promise<ForgeSkillResult> {
    const trimmed = (prompt || '').trim();
    if (!trimmed) {
      throw new Error('请输入技能需求意图');
    }

    if (!config || !UniversalAiClient.hasApiKey(config)) {
      throw new Error('当前选中的 AI 驱动服务商未配置有效 API Key，请在设置中配置');
    }

    const userPrompt = `请为以下意图设计一个高确定性、职责清晰且易于维护的规范级 Agent 技能：\n需求意图：${trimmed}\n预设分类：${category || 'workflow'}`;
    const aiRes = await UniversalAiClient.generateText(
      userPrompt,
      config,
      SKILL_META_SYSTEM_PROMPT
    );

    const rawResponse = (aiRes || '').trim();
    if (!rawResponse) {
      throw new Error('大模型未返回任何响应内容，请重试');
    }

    // 1. Try markdown code block first (```json ... ```)
    let candidateJson: string | null = null;
    let afterText = '';
    const codeBlockMatch = /```(?:json)?\s*([\s\S]*?)\s*```/i.exec(rawResponse);
    if (codeBlockMatch) {
      const insideBlock = codeBlockMatch[1].trim();
      const balanced = AiService.extractBalancedJson(insideBlock);
      if (balanced) {
        candidateJson = balanced.jsonStr;
        afterText = rawResponse.slice(codeBlockMatch.index + codeBlockMatch[0].length).trim();
      }
    }

    // 2. If no code block, try balanced JSON extraction directly on rawResponse
    if (!candidateJson) {
      const balanced = AiService.extractBalancedJson(rawResponse);
      if (balanced) {
        candidateJson = balanced.jsonStr;
        afterText = rawResponse.slice(balanced.endIndex).trim();
      }
    }

    // 3. Attempt JSON parse with fallback & sanitization
    let parsed: any = null;
    if (candidateJson) {
      try {
        parsed = JSON.parse(candidateJson);
      } catch {
        // Try cleaning unescaped control characters
        try {
          const sanitized = candidateJson
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => (c === '\n' || c === '\r' || c === '\t' ? c : ''));
          parsed = JSON.parse(sanitized);
        } catch {
          // If JSON parse fails, continue to markdown extraction
        }
      }
    }

    // 4. Assemble blueprint from parsed or extract/repair
    if (parsed && typeof parsed === 'object') {
      const name = parsed.name || (trimmed.slice(0, 24).toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'custom-agent-skill');
      const cat = parsed.category || category || 'workflow';
      const desc = parsed.description || `针对 [${trimmed}] 的专用 Agent 技能与规则。用于处理相关工程任务与技能指引。`;
      const ver = parsed.version || '1.0.0';

      // Check if bodyMarkdown is present inside JSON
      let bodyMarkdown = parsed.bodyMarkdown || '';
      // If bodyMarkdown not in JSON, but there is markdown in afterText, use afterText
      if (!bodyMarkdown.trim() && afterText.length > 20) {
        bodyMarkdown = afterText;
      }
      // If still empty, synthesize standard SOP from offline blueprint
      if (!bodyMarkdown.trim()) {
        const fallback = AiDirectiveCompiler.forgeOfflineBlueprint(trimmed, cat);
        bodyMarkdown = fallback.bodyMarkdown;
      }

      return {
        generated: {
          name,
          category: cat,
          version: ver,
          description: desc,
          bodyMarkdown,
        },
        source: 'llm',
      };
    }

    // 5. Ultimate Fallback: LLM returned pure Markdown without JSON block
    if (rawResponse.includes('#')) {
      const titleMatch = /^#\s+(.+)$/m.exec(rawResponse);
      const title = titleMatch ? titleMatch[1].trim() : trimmed;
      const slugName = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 30) || 'custom-agent-skill';

      return {
        generated: {
          name: slugName,
          category: category || 'workflow',
          version: '1.0.0',
          description: `针对 [${title}] 的专用智能体规约。用于处理相关工程任务与技能指引。`,
          bodyMarkdown: rawResponse,
        },
        source: 'llm',
      };
    }

    // If completely unparseable
    throw new Error('大模型返回内容格式异常，未能提取到有效技能结构，请调整描述重试或选择使用预设模板');
  }

  /**
   * Offline Deterministic Blueprint Generator (Zero-AI fallback)
   */
  public static forgeSkillWithTemplate(
    prompt: string,
    category: string = 'workflow',
    existingSkillNames?: string[]
  ): ForgeSkillResult {
    const trimmed = (prompt || '').trim();
    const fallback = AiDirectiveCompiler.forgeOfflineBlueprint(trimmed, category || 'workflow', existingSkillNames);
    return { generated: fallback, source: 'template' };
  }

  /**
   * Diagnose Skill (Clinical Health Audit)
   */
  public static async diagnoseSkill(
    skillName: string,
    rawContent: string,
    mode: 'heuristic' | 'ai',
    config?: AiConfig
  ): Promise<DiagnosticReport> {
    const isAiConfigured = Boolean(config && UniversalAiClient.hasApiKey(config));
    if (mode === 'ai' && isAiConfigured && config) {
      try {
        return await SkillDoctorEngine.diagnoseAi(
          skillName,
          rawContent,
          (p, sys) => UniversalAiClient.generateText(p, config, sys)
        );
      } catch (err) {
        console.warn('AI clinical diagnosis failed, falling back to heuristic:', err);
      }
    }
    return SkillDoctor.lint(rawContent, { skillName });
  }

  /**
   * Optimize Skill
   */
  public static async optimizeSkill(
    skillName: string,
    rawContent: string,
    report: DiagnosticReport,
    config?: AiConfig
  ): Promise<{ optimizedContent: string; summaryOfChanges: string[]; supplements: string[]; diffSummary?: string }> {
    const isAiConfigured = Boolean(config && UniversalAiClient.hasApiKey(config));
    if (isAiConfigured && config) {
      try {
        return await SkillDoctorEngine.optimizeAi(
          skillName,
          rawContent,
          report,
          (p, sys) => UniversalAiClient.generateText(p, config, sys)
        );
      } catch (err) {
        if (isFeatureUnavailableError(err)) {
          throw err;
        }
        console.warn('AI optimization failed, falling back to rule optimizer:', err);
      }
    }
    return SkillDoctorEngine.optimizeAi(skillName, rawContent, report, undefined);
  }

  /**
   * Apply Doctor's Prescription Remedy
   */
  public static remedySkill(rawContent: string, remedyPatch: string): string {
    return SkillDoctorEngine.applyRemedy(rawContent, remedyPatch);
  }

  /**
   * Run L3 Trigger Benchmark
   */
  public static async testSkillTriggers(
    skillName: string,
    skillDesc: string,
    rawContent: string,
    allSkills: Array<{ name: string; description: string }>,
    config?: AiConfig
  ): Promise<TriggerBenchmarkResult> {
    const isAiConfigured = Boolean(config && UniversalAiClient.hasApiKey(config));
    if (!isAiConfigured || !config) {
      throw new Error('需要配置 AI 才能运行触发测试');
    }

    const aiProvider = (p: string, sys?: string) => UniversalAiClient.generateText(p, config, sys);

    return SkillDoctorEngine.runTriggerBenchmark(
      { name: skillName, description: skillDesc, bodyMarkdown: rawContent },
      allSkills,
      aiProvider
    );
  }

  /**
   * Run Skill Library AI Panoramic Consultation (技能库全景会诊)
   */
  public static async consultLibraryAi(
    skills: LibraryConsultationSkillInput[],
    config?: AiConfig
  ): Promise<LibraryConsultationReport> {
    const isAiConfigured = Boolean(config && UniversalAiClient.hasApiKey(config));
    if (!isAiConfigured || !config) {
      throw new Error(
        '未检测到已配置的 AI API Key。技能库全景会诊涉及跨技能深层逻辑互斥与意图争抢审查，必须依赖真实大模型研判，请先在右上角配置 AI 服务密钥。'
      );
    }

    return SkillDoctorEngine.consultLibraryAi(
      skills,
      (p: string, sys?: string) => UniversalAiClient.generateText(p, config, sys)
    );
  }
}
