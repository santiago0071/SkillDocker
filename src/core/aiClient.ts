import { isTauri, invoke } from '@tauri-apps/api/core';

export type ModelProvider = 'gemini' | 'claude' | 'openai' | 'deepseek' | 'openrouter' | 'minimax' | 'custom';

export interface AiConfig {
  activeProvider: ModelProvider;
  gemini: {
    apiKey: string;
    model: string;
    baseUrl?: string;
  };
  claude: {
    apiKey: string;
    model: string;
    baseUrl?: string;
  };
  openai: {
    apiKey: string;
    model: string;
    baseUrl?: string;
  };
  deepseek: {
    apiKey: string;
    model: string;
    baseUrl?: string;
  };
  openrouter: {
    apiKey: string;
    model: string;
    baseUrl?: string;
  };
  minimax: {
    apiKey: string;
    model: string;
    baseUrl?: string;
  };
  custom: {
    apiKey?: string;
    model: string;
    baseUrl: string;
    customName?: string;
  };
}

export const RECOMMENDED_MODELS: Record<
  ModelProvider,
  { id: string; label: string; baseUrl?: string }[]
> = {
  gemini: [
    { id: 'gemini-3.8-flash', label: 'gemini-3.8-flash' },
    { id: 'gemini-3.1-pro', label: 'gemini-3.1-pro' },
    { id: 'gemini-3.8-live', label: 'gemini-3.8-live' },
  ],
  claude: [
    { id: 'claude-sonnet-5-5', label: 'claude-sonnet-5-5' },
    { id: 'claude-opus-5-5', label: 'claude-opus-5-5' },
    { id: 'claude-fable-5-1', label: 'claude-fable-5-1' },
    { id: 'claude-haiku-4-5', label: 'claude-haiku-4-5' },
  ],
  openai: [
    { id: 'gpt-6.1-sol', label: 'gpt-6.1-sol' },
    { id: 'gpt-6-astra', label: 'gpt-6-astra' },
    { id: 'gpt-6-luna', label: 'gpt-6-luna' },
    { id: 'o3-pro', label: 'o3-pro' },
    { id: 'o3-mini', label: 'o3-mini' },
    { id: 'o3', label: 'o3' },
  ],
  deepseek: [
    { id: 'deepseek-flash', label: 'deepseek-flash' },
    { id: 'deepseek-v4-pro', label: 'deepseek-v4-pro' },
  ],
  openrouter: [
    { id: 'anthropic/claude-sonnet-5-5', label: 'anthropic/claude-sonnet-5-5' },
    { id: 'openai/gpt-6.1-sol', label: 'openai/gpt-6.1-sol' },
    { id: 'google/gemini-3.8-flash', label: 'google/gemini-3.8-flash' },
    { id: 'deepseek/deepseek-flash', label: 'deepseek/deepseek-flash' },
  ],
  minimax: [
    { id: 'MiniMax-M3', label: 'MiniMax-M3' },
    { id: 'MiniMax-M2.5', label: 'MiniMax-M2.5' },
    { id: 'MiniMax-Text-01', label: 'MiniMax-Text-01' },
  ],
  custom: [
    { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', label: 'SiliconFlow (硅基流动)', baseUrl: 'https://api.siliconflow.cn/v1' },
    { id: 'qwen2.5-coder:7b', label: 'Ollama (Local :11434)', baseUrl: 'http://localhost:11434/v1' },
    { id: 'local-model', label: 'LM Studio (Local :1234)', baseUrl: 'http://localhost:1234/v1' },
    { id: 'opencode/default', label: 'OpenCode Gateway', baseUrl: 'https://api.opencode.ai/v1' },
  ],
};

export const DEFAULT_AI_CONFIG: AiConfig = {
  activeProvider: 'gemini',
  gemini: {
    apiKey: '',
    model: 'gemini-3.8-flash',
  },
  claude: {
    apiKey: '',
    model: 'claude-sonnet-5-5',
  },
  openai: {
    apiKey: '',
    model: 'gpt-6.1-sol',
    baseUrl: 'https://api.openai.com/v1',
  },
  deepseek: {
    apiKey: '',
    model: 'deepseek-flash',
    baseUrl: 'https://api.deepseek.com/v1',
  },
  openrouter: {
    apiKey: '',
    model: 'anthropic/claude-sonnet-5-5',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  minimax: {
    apiKey: '',
    model: 'MiniMax-M3',
    baseUrl: 'https://api.minimaxi.com/v1',
  },
  custom: {
    apiKey: '',
    model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    baseUrl: 'https://api.siliconflow.cn/v1',
    customName: '',
  },
};

/**
 * Universal BYOK AI Client
 * Hybrid execution: tries local bridge proxy first (zero CORS), with fallback to direct HTTP.
 */
export class UniversalAiClient {
  private static cachedKeyringStatus: Record<string, boolean> = {};

  public static async checkKeyring(provider: ModelProvider): Promise<boolean> {
    if (isTauri()) {
      try {
        const has = await invoke<boolean>('has_api_key', { provider });
        this.cachedKeyringStatus[provider] = has;
        return has;
      } catch {
        return false;
      }
    }
    return false;
  }

  public static hasApiKey(config: AiConfig): boolean {
    return this.hasProviderKey(config.activeProvider, config);
  }

  public static hasProviderKey(provider: ModelProvider, config?: AiConfig): boolean {
    if (this.cachedKeyringStatus[provider]) return true;
    if (provider === 'custom') {
      return Boolean(config?.custom?.baseUrl?.trim() || config?.custom?.apiKey?.trim());
    }
    return Boolean((config as any)?.[provider]?.apiKey?.trim());
  }

  public static async setApiKey(provider: ModelProvider, key: string): Promise<void> {
    if (isTauri()) {
      await invoke('set_api_key', { provider, key });
      this.cachedKeyringStatus[provider] = Boolean(key && key.trim());
    }
  }

  public static async deleteApiKey(provider: ModelProvider): Promise<void> {
    if (isTauri()) {
      await invoke('delete_api_key', { provider });
      this.cachedKeyringStatus[provider] = false;
    }
  }

  public static async generateText(
    prompt: string,
    config: AiConfig,
    systemPrompt?: string
  ): Promise<string> {
    const { activeProvider } = config;
    const providerConf = (config as any)[activeProvider] || {};
    const model = providerConf.model || undefined;
    const baseUrl = providerConf.baseUrl || undefined;

    if (isTauri()) {
      return await invoke<string>('ai_generate', {
        provider: activeProvider,
        model: model || null,
        systemPrompt: systemPrompt || null,
        prompt,
        baseUrl: baseUrl || null,
      });
    }

    throw new Error('Desktop native runtime required for AI generation');
  }

  /**
   * Refine or polish Markdown Skill body using the active model
   */
  public static async polishSkill(
    bodyMarkdown: string,
    skillName: string,
    config: AiConfig,
    action: 'polish' | 'rules' | 'format'
  ): Promise<string> {
    let prompt: string;
    const systemPrompt = `你是一位顶尖的 AI Agent 架构师和资深系统规范工程师。当前正在针对名为 "${skillName}" 的 Agent 技能规范进行优化升级。
输出要求：
1. 直接输出优化后的完整 Markdown 正文内容。
2. 不要输出任何开场白、问候、总结或包裹外的额外解释。
3. 严格保留现有的技术逻辑与规约意图，仅做专业级提升。`;

    if (action === 'polish') {
      prompt = `请对以下 Agent 技能 Markdown 正文进行工业级严谨润色：
- 消除任何模棱两可、主观模糊的描述，将其转化为可量化、确定性的执行步骤。
- 强化前置核查、触发条件与执行准则。
- 保持规范清晰、排版专业。

原始内容如下：
${bodyMarkdown}`;
    } else if (action === 'rules') {
      prompt = `请为以下技能正文增加或强化以下关键段落：
1. 边界限制与防越权规约 (Boundary Constraints & Guardrails)
2. 异常捕获与自动化回滚机制 (Rollback & Failure Handling)
3. 交付前自检清单 (Pre-Flight Verification Checklist)

在原有内容基础上适度融合并扩展，保持原有结构连贯。
原始内容如下：
${bodyMarkdown}`;
    } else {
      prompt = `请对以下技能正文进行严密且美观的 Markdown 结构化排版整理：
- 规范化多级标题层级（H2/H3/H4）。
- 梳理有序与无序列表，确保条目清晰。
- 补全必要的代码块高亮与语法标识。
- 规整表格与重点警示块。

原始内容如下：
${bodyMarkdown}`;
    }

    return await this.generateText(prompt, config, systemPrompt);
  }
}

/**
 * Automatically migrate any legacy plaintext API keys from localStorage into OS secure Keyring,
 * then purge the raw plaintext keys from localStorage.
 */
export async function migrateKeysToKeyring(): Promise<void> {
  if (!isTauri()) return;
  try {
    const saved = localStorage.getItem('skilldocker_ai_config');
    const providers: ModelProvider[] = ['gemini', 'claude', 'openai', 'deepseek', 'openrouter', 'minimax', 'custom'];

    if (saved) {
      const parsed = JSON.parse(saved);
      let modified = false;

      for (const p of providers) {
        if (parsed[p] && typeof parsed[p].apiKey === 'string' && parsed[p].apiKey.trim()) {
          await UniversalAiClient.setApiKey(p, parsed[p].apiKey.trim());
          delete parsed[p].apiKey;
          modified = true;
        }
      }

      if (modified) {
        localStorage.setItem('skilldocker_ai_config', JSON.stringify(parsed));
      }
    }

    // Preload keyring status into cache for synchronous queries
    for (const p of providers) {
      await UniversalAiClient.checkKeyring(p);
    }
  } catch (err) {
    console.warn('Failed to migrate API keys to keyring:', err);
  }
}

